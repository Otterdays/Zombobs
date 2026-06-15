import { gameState, resetGameState } from '../core/gameState.js';
import { canvas } from '../core/canvas.js';
import { PLAYER_MAX_HEALTH, PLAYER_STAMINA_MAX, SERVER_URL } from '../core/constants.js';
import { playRestartSound, playMenuMusic, stopMenuMusic } from '../systems/AudioSystem.js';
import { startArcadeMusic, stopArcadeMusic, setMusicIntensity } from '../systems/ArcadeMusicSystem.js';
import { saveHighScore, saveMultiplierStats, saveScoreboardEntry } from '../utils/gameUtils.js';
import { triggerWaveNotification } from '../utils/gameUtils.js';
import { playerProfileSystem } from './PlayerProfileSystem.js';
import { propSpawnSystem } from './PropSpawnSystem.js';
import { groundTextureSystem } from './GroundTextureSystem.js';
import { cameraSystem } from './CameraSystem.js';

/**
 * GameStateManager - Handles game lifecycle (start, restart, game over)
 */
export class GameStateManager {
    constructor(gameHUD, spawnZombiesCallback) {
        this.gameHUD = gameHUD;
        this.spawnZombiesCallback = spawnZombiesCallback;
    }

    /**
     * Handle game over
     */
    gameOver() {
        gameState.gameRunning = false;
        stopArcadeMusic(); // Stop procedural arcade music
        saveHighScore();

        // Update and save multiplier stats
        let maxMultiplier = 1.0;
        gameState.players.forEach(player => {
            if (player.maxMultiplierThisSession > gameState.allTimeMaxMultiplier) {
                gameState.allTimeMaxMultiplier = player.maxMultiplierThisSession;
            }
            if (player.maxMultiplierThisSession > maxMultiplier) {
                maxMultiplier = player.maxMultiplierThisSession;
            }
        });
        saveMultiplierStats();

        // Save scoreboard entry if game session was valid
        if (gameState.gameStartTime > 0) {
            const timeSurvived = (Date.now() - gameState.gameStartTime) / 1000; // in seconds
            // Determine game mode: arcade if not coop and not multiplayer
            const gameMode = (!gameState.isCoop && !gameState.multiplayer.active) ? 'arcade' :
                (gameState.isCoop ? 'coop' : 'multiplayer');
            saveScoreboardEntry({
                score: gameState.score,
                wave: gameState.wave,
                kills: gameState.zombiesKilled,
                timeSurvived: timeSurvived,
                maxMultiplier: maxMultiplier,
                username: gameState.username,
                dateTime: new Date().toISOString(),
                gameMode: gameMode
            });

            // Process session end for permanent progression
            const sessionStats = {
                score: gameState.score,
                wave: gameState.wave,
                kills: gameState.zombiesKilled,
                timeSurvived: timeSurvived,
                sessionKills: gameState.zombiesKilled,
                sessionWave: gameState.wave,
                sessionTime: timeSurvived,
                sessionCombo: gameState.killStreak,
                pickupsCollected: gameState.pickupsCollected,
                headshots: gameState.headshots,
                maxKillStreak: gameState.maxKillStreak,
                coopWin: gameState.isCoop && gameState.wave > 1 // Consider it a win if survived past wave 1
            };

            const sessionResults = playerProfileSystem.processSessionEnd(sessionStats);
            gameState.sessionResults = sessionResults;

            // Add achievement notifications
            if (sessionResults.newlyUnlocked && sessionResults.newlyUnlocked.length > 0) {
                sessionResults.newlyUnlocked.forEach(achievement => {
                    gameState.achievementNotifications.push({
                        achievement: achievement,
                        life: 300, // 5 seconds at 60fps
                        maxLife: 300
                    });
                });
            }
        }

        // Submit score to server (async, don't block game over screen)
        this.submitScoreToServer(gameState.score, gameState.wave, gameState.zombiesKilled);

        const p1 = gameState.players[0];
        const p2 = gameState.players[1];

        let scoreMsg = `You survived ${gameState.wave} waves!\nKilled: ${gameState.zombiesKilled}`;

        if (gameState.isCoop && p2) {
            scoreMsg = `Team survived ${gameState.wave} waves!\nTotal Kills: ${gameState.zombiesKilled}`;
        }

        this.gameHUD.showGameOver(scoreMsg);
    }

    /**
     * Restart game (return to main menu)
     */
    restartGame() {
        playRestartSound();
        stopArcadeMusic(); // Stop arcade music when returning to menu
        if (!gameState.menuMusicMuted) {
            playMenuMusic();
        }
        gameState.showMainMenu = true;
        gameState.showAbout = false;
        gameState.gameRunning = false;
        gameState.gamePaused = false;
        gameState.showCoopLobby = false;
        gameState.showLobby = false;
        gameState.showAILobby = false;
        this.gameHUD.hidePauseMenu();
        this.gameHUD.hideGameOver();
        resetGameState(canvas.width, canvas.height);
    }

    /**
     * Start game
     */
    startGame() {
        stopMenuMusic();
        startArcadeMusic(); // Start procedural arcade music
        gameState.gameRunning = true;
        gameState.gamePaused = false;
        gameState.showLobby = false;
        gameState.showCoopLobby = false;
        gameState.showAILobby = false;
        this.gameHUD.hidePauseMenu(); // Ensure pause menu is hidden when game starts

        // Do NOT reset players here for coop, we want to keep the lobby configuration
        if (!gameState.isCoop) {
            resetGameState(canvas.width, canvas.height);
            // v0.8.1.2: Reset living world systems for single player arcade
            propSpawnSystem.reset();
            groundTextureSystem.reset();
            cameraSystem.reset();
        } else {
            // Just reset game objects, keep players
            gameState.score = 0;
            gameState.wave = 1;
            gameState.zombiesKilled = 0;
            gameState.bullets = [];
            gameState.zombies = [];
            gameState.particles = [];
            gameState.healthPickups = [];
            gameState.ammoPickups = [];
            gameState.damagePickups = [];
            gameState.nukePickups = [];
            gameState.grenades = [];
            gameState.acidProjectiles = [];
            gameState.acidPools = [];
            gameState.props = []; // v0.8.1.2: Reset props for coop mode

            // Reset all players (including AI)
            gameState.players.forEach((p, index) => {
                p.health = PLAYER_MAX_HEALTH;
                p.stamina = PLAYER_STAMINA_MAX;
                // Spawn players with slight offset to avoid overlap
                p.x = canvas.width / 2 + (index * 50);
                p.y = canvas.height / 2;
            });
        }

        // Set game start time for session tracking AFTER resetting state
        gameState.gameStartTime = Date.now();

        // Apply profile skin to local player
        const profile = playerProfileSystem.getProfile();
        if (profile && profile.equippedSkin) {
            gameState.player.equippedSkin = profile.equippedSkin;
        }

        gameState.showMainMenu = false;

        triggerWaveNotification();
        this.spawnZombiesCallback(gameState.zombiesPerWave);
    }

    /**
     * Submit score to server (via socket.io if multiplayer, otherwise HTTP POST)
     * @param {number} score - Final game score
     * @param {number} wave - Wave reached
     * @param {number} zombiesKilled - Total zombies killed
     */
    submitScoreToServer(score, wave, zombiesKilled) {
        // Skip if score is 0 or invalid
        if (!score || score <= 0) return;

        // Use gameState.multiplayer.active to determine if this was a multiplayer game
        // This is more reliable than checking connection status, which may be false if socket disconnected
        const isMultiplayer = gameState.multiplayer.active;

        const scoreData = {
            username: gameState.username,
            score: score,
            wave: wave,
            zombiesKilled: zombiesKilled,
            isMultiplayer: isMultiplayer
        };

        // Try socket.io first if multiplayer connected
        if (gameState.multiplayer.socket && gameState.multiplayer.socket.connected) {
            try {
                gameState.multiplayer.socket.emit('game:score', scoreData);
            } catch (error) {
                console.error('[GameStateManager] Error sending score via socket:', error);
                // Fall back to HTTP POST
                this.submitScoreViaHTTP(scoreData);
            }
        } else {
            // Use HTTP POST if not in multiplayer or socket disconnected
            this.submitScoreViaHTTP(scoreData);
        }
    }

    /**
     * Submit score via HTTP POST to server API
     * @param {Object} scoreData - Score data object
     */
    async submitScoreViaHTTP(scoreData) {
        try {
            const response = await fetch(`${SERVER_URL}/api/highscore`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(scoreData),
                credentials: 'include'
            });

            if (response.ok) {
                const result = await response.json();
                // Refresh leaderboard in HUD if score made it to top 10
                if (result.isInTop10 && this.gameHUD.leaderboardDisplay) {
                    this.gameHUD.leaderboardDisplay.fetch();
                }
            }
        } catch (error) {
            // Silently fail - don't block game over screen
        }
    }
}

