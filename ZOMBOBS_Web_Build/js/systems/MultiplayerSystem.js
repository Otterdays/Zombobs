import { gameState, createPlayer } from '../core/gameState.js';
import { canvas } from '../core/canvas.js';
import { WEAPONS } from '../core/constants.js';
import { SERVER_URL } from '../core/constants.js';
import { initAudio } from '../systems/AudioSystem.js';
import { createBloodSplatter, createParticles } from '../systems/ParticleSystem.js';
import { triggerExplosion } from '../utils/combatUtils.js';
import { skillSystem } from './SkillSystem.js';
import { rankSystem } from './RankSystem.js';
import { GameEngine } from '../core/GameEngine.js';

/**
 * MultiplayerSystem - Handles all multiplayer networking logic
 * Manages Socket.IO connections, player synchronization, zombie sync, and game state sync
 */
export class MultiplayerSystem {
    constructor(gameEngine, startGameCallback, performMeleeAttackCallback, shootBulletCallback, reloadWeaponCallback, throwGrenadeCallback, switchWeaponCallback, getZombieClassByTypeCallback) {
        this.gameEngine = gameEngine;
        this.startGameCallback = startGameCallback;
        this.performMeleeAttackCallback = performMeleeAttackCallback;
        this.shootBulletCallback = shootBulletCallback;
        this.reloadWeaponCallback = reloadWeaponCallback;
        this.throwGrenadeCallback = throwGrenadeCallback;
        this.switchWeaponCallback = switchWeaponCallback;
        this.getZombieClassByTypeCallback = getZombieClassByTypeCallback;
    }

    /**
     * Check server health status
     */
    checkServerHealth() {
        if (gameState.multiplayer.status === 'connected') return;

        gameState.multiplayer.serverStatus = 'checking';


        fetch(`${SERVER_URL}/health`, { credentials: 'include' })
            .then(response => {
                if (response.ok) {
                    return response.json();
                }
                throw new Error('Network response was not ok');
            })
            .then(data => {

                gameState.multiplayer.serverStatus = 'online';
            })
            .catch(error => {
                console.log('Server appears offline or waking up:', error);
                gameState.multiplayer.serverStatus = 'offline';

                // Retry check after 5 seconds if offline (to handle wake-up)
                setTimeout(() => this.checkServerHealth(), 5000);
            });
    }

    /**
     * Start latency measurement for network monitoring
     */
    startLatencyMeasurement(socket) {
        // Use Socket.IO's built-in ping/pong mechanism for latency measurement
        // Socket.IO sends ping/pong automatically, we just need to measure the round-trip time
        let pingInterval = null;

        // Listen for ping events (server sends ping)
        socket.io.on('ping', () => {
            gameState.lastPingTime = Date.now();
        });

        // Listen for pong events (server responds)
        socket.io.on('pong', () => {
            if (gameState.lastPingTime) {
                const latency = Date.now() - gameState.lastPingTime;
                // Use exponential moving average for smoother latency tracking
                gameState.networkLatency = gameState.networkLatency
                    ? gameState.networkLatency * 0.8 + latency * 0.2
                    : latency;
                gameState.multiplayer.latency = gameState.networkLatency;
            }
        });

        // Also measure custom ping/pong if server supports it
        pingInterval = setInterval(() => {
            if (!socket.connected) {
                if (pingInterval) clearInterval(pingInterval);
                return;
            }

            const pingStart = Date.now();
            socket.emit('ping', Date.now(), (response) => {
                if (response) {
                    const pingEnd = Date.now();
                    const latency = pingEnd - pingStart;
                    // Use exponential moving average for smoother latency tracking
                    gameState.networkLatency = gameState.networkLatency
                        ? gameState.networkLatency * 0.8 + latency * 0.2
                        : latency;
                    gameState.multiplayer.latency = gameState.networkLatency;
                }
            });
        }, 5000); // Measure every 5 seconds

        // Clean up on disconnect
        socket.on('disconnect', () => {
            if (pingInterval) {
                clearInterval(pingInterval);
                pingInterval = null;
            }
        });
    }

    /**
     * Initialize network connection and set up all Socket.IO event handlers
     */
    initializeNetwork(gameHUD) {
        if (gameState.multiplayer.socket) return; // Already initialized

        // Initialize socket.io connection to Hugging Face Space
        if (typeof io !== 'undefined') {
            gameState.multiplayer.status = 'connecting';

            // Configure Socket.io for Hugging Face Spaces
            // Hugging Face Spaces uses a reverse proxy, so we need to:
            // 1. Use both polling and websocket transports (polling first for compatibility)
            // 2. Set path explicitly for Spaces routing - Socket.io appends /socket.io/ automatically
            // 3. Allow reconnection attempts
            const socket = io(SERVER_URL, {
                path: '/socket.io/', // Explicit path for Socket.io (will be appended to SERVER_URL)
                transports: ['polling', 'websocket'], // Try polling first, then upgrade to websocket
                upgrade: true, // Allow transport upgrade from polling to websocket
                reconnection: true,
                reconnectionAttempts: 5,
                reconnectionDelay: 1000,
                reconnectionDelayMax: 5000,
                timeout: 20000,
                forceNew: false,
                withCredentials: true // Important for CORS with cookies
            });

            gameState.multiplayer.socket = socket;

            socket.on('connect', () => {
                console.log('✅ Successfully connected to multiplayer server');

                gameState.multiplayer.connected = true;
                gameState.multiplayer.status = 'connected';
                gameState.multiplayer.playerId = socket.id;
                gameState.multiplayer.isReady = false;
                gameState.multiplayer.isLeader = false;
                socket.emit('player:register', {
                    name: gameState.username || `Survivor-${socket.id.slice(-4)}`,
                    rank: rankSystem.getData() // { rankXP, rank, rankTier, rankName }
                });

                // Start latency measurement (ping/pong)
                this.startLatencyMeasurement(socket);
            });

            socket.on('disconnect', () => {
                console.log('Disconnected from multiplayer server');
                gameState.multiplayer.connected = false;
                gameState.multiplayer.status = 'disconnected';
                gameState.multiplayer.playerId = null;
                gameState.multiplayer.players = [];
                gameState.multiplayer.isLeader = false;
                gameState.multiplayer.isReady = false;
            });

            socket.on('lobby:update', (players) => {

                gameState.multiplayer.players = Array.isArray(players) ? players : [];
                // Update local leader/ready status from server data
                const localPlayer = players.find(p => p.id === gameState.multiplayer.playerId);
                if (localPlayer) {
                    const oldReady = gameState.multiplayer.isReady;
                    const oldLeader = gameState.multiplayer.isLeader;
                    gameState.multiplayer.isLeader = localPlayer.isLeader || false;
                    gameState.multiplayer.isReady = localPlayer.isReady || false;

                } else {
                    console.warn('[Lobby Update] Local player not found in update', {
                        localPlayerId: gameState.multiplayer.playerId,
                        playersInUpdate: players.map(p => ({ id: p.id, name: p.name }))
                    });
                }
            });

            socket.on('game:start', () => {
                console.log('🎮 Game start signal received from server');


                if (gameState.showLobby) {
                    // Enable co-op mode for multiplayer
                    gameState.isCoop = true;


                    // Synchronize players from lobby to game state
                    const multiplayerPlayers = gameState.multiplayer.players || [];


                    gameState.players = multiplayerPlayers.map((lobbyPlayer, index) => {
                        const isLocalPlayer = lobbyPlayer.id === gameState.multiplayer.playerId;
                        const player = createPlayer(
                            canvas.width / 2 + (index * 50), // Spawn with offset
                            canvas.height / 2,
                            index % 5 // Cycle through colors
                        );

                        // Override with lobby data
                        player.id = lobbyPlayer.id;
                        player.name = lobbyPlayer.name;
                        player.inputSource = isLocalPlayer ? 'mouse' : 'remote';



                        return player;
                    });



                    // Ensure game is not paused when starting
                    gameState.gamePaused = false;
                    gameHUD.hidePauseMenu();

                    initAudio();
                    this.startGameCallback();
                } else {
                    console.warn('[game:start] Received game:start but not in lobby (showLobby = false)');
                }
            });

            socket.on('game:pause', () => {
                gameState.gamePaused = true;
                gameHUD.showPauseMenu();
            });

            socket.on('game:resume', () => {
                gameState.gamePaused = false;
                gameHUD.hidePauseMenu();
            });

            // Handle remote player state updates
            socket.on('player:state:update', (data) => {
                // Debug: Log received state updates (throttled to avoid spam)


                // Check if we're in multiplayer mode and game is running
                if (!gameState.isCoop) {
                    console.warn('[player:state:update] Ignored - not in coop mode');
                    return;
                }
                if (!gameState.gameRunning) {
                    console.warn('[player:state:update] Ignored - game not running');
                    return;
                }

                // Find the remote player by ID
                const remotePlayer = gameState.players.find(p => p.id === data.playerId);

                if (!remotePlayer) {
                    console.warn('[player:state:update] Remote player not found', {
                        receivedPlayerId: data.playerId,
                        availablePlayerIds: gameState.players.map(p => ({ id: p.id, name: p.name, inputSource: p.inputSource })),
                        localPlayerId: gameState.multiplayer.playerId
                    });
                    return;
                }

                if (remotePlayer.inputSource !== 'remote') {
                    console.warn('[player:state:update] Player found but not remote', {
                        playerId: data.playerId,
                        playerName: remotePlayer.name,
                        inputSource: remotePlayer.inputSource,
                        isLocal: remotePlayer.id === gameState.multiplayer.playerId
                    });
                    return;
                }

                // Update remote player position and angle
                // Simple LERP for smoother movement
                if (data.x !== undefined) {
                    // Move 30% of the way to target position (smoothing)
                    remotePlayer.x = remotePlayer.x * 0.7 + data.x * 0.3;
                }
                if (data.y !== undefined) {
                    remotePlayer.y = remotePlayer.y * 0.7 + data.y * 0.3;
                }

                if (data.angle !== undefined) remotePlayer.angle = data.angle;
                if (data.health !== undefined) remotePlayer.health = data.health;
                if (data.stamina !== undefined) remotePlayer.stamina = data.stamina;
                if (data.currentWeapon !== undefined) {
                    // Update weapon if needed
                    const weaponName = data.currentWeapon;
                    if (WEAPONS[weaponName]) {
                        remotePlayer.currentWeapon = WEAPONS[weaponName];
                    }
                }
                if (data.currentAmmo !== undefined) remotePlayer.currentAmmo = data.currentAmmo;
                if (data.isReloading !== undefined) remotePlayer.isReloading = data.isReloading;
            });

            // Handle remote player actions (shooting, melee, etc.)
            socket.on('player:action:update', (data) => {
                if (!gameState.isCoop || !gameState.gameRunning) return;

                const remotePlayer = gameState.players.find(p => p.id === data.playerId);
                if (remotePlayer && remotePlayer.inputSource === 'remote') {
                    if (data.action === 'shoot') {
                        // Use exact position from packet if available to prevent "ghost bullets"
                        // Temporarily override player position to spawn bullet correctly
                        const originalX = remotePlayer.x;
                        const originalY = remotePlayer.y;
                        const originalAngle = remotePlayer.angle;

                        if (data.x !== undefined) remotePlayer.x = data.x;
                        if (data.y !== undefined) remotePlayer.y = data.y;
                        if (data.angle !== undefined) remotePlayer.angle = data.angle;

                        const target = {
                            x: remotePlayer.x + Math.cos(remotePlayer.angle) * 200,
                            y: remotePlayer.y + Math.sin(remotePlayer.angle) * 200
                        };
                        this.shootBulletCallback(target, canvas, remotePlayer);

                        // Restore visual position (it will interpolate to correct spot anyway)
                        remotePlayer.x = originalX;
                        remotePlayer.y = originalY;
                        remotePlayer.angle = originalAngle;
                    } else if (data.action === 'melee') {
                        this.performMeleeAttackCallback(remotePlayer);
                    } else if (data.action === 'reload') {
                        this.reloadWeaponCallback(remotePlayer);
                    } else if (data.action === 'grenade') {
                        // Use exact position for grenades too
                        const originalX = remotePlayer.x;
                        const originalY = remotePlayer.y;
                        const originalAngle = remotePlayer.angle;

                        if (data.x !== undefined) remotePlayer.x = data.x;
                        if (data.y !== undefined) remotePlayer.y = data.y;
                        if (data.angle !== undefined) remotePlayer.angle = data.angle;

                        const target = {
                            x: remotePlayer.x + Math.cos(remotePlayer.angle) * 200,
                            y: remotePlayer.y + Math.sin(remotePlayer.angle) * 200
                        };
                        this.throwGrenadeCallback(target, canvas, remotePlayer);

                        remotePlayer.x = originalX;
                        remotePlayer.y = originalY;
                        remotePlayer.angle = originalAngle;
                    } else if (data.action === 'switchWeapon') {
                        if (data.weaponName && WEAPONS[data.weaponName]) {
                            this.switchWeaponCallback(WEAPONS[data.weaponName], remotePlayer);
                        }
                    }
                }
            });

            socket.on('game:starting', (data) => {
                console.log('Game starting in ' + data.duration + 'ms');
                gameState.multiplayer.isGameStarting = true;
                // Calculate start time - server sends startTime which is Date.now() + 3000
                // We need to account for network latency, so use current time + duration
                const clientNow = Date.now();
                gameState.multiplayer.gameStartTime = clientNow + data.duration;
            });

            // Handle player disconnection
            socket.on('player:disconnected', (data) => {
                if (!gameState.isCoop) return;

                const disconnectedPlayerIndex = gameState.players.findIndex(p => p.id === data.playerId);
                if (disconnectedPlayerIndex !== -1) {
                    console.log(`[Multiplayer] Player ${gameState.players[disconnectedPlayerIndex].name} disconnected`);
                    gameState.players.splice(disconnectedPlayerIndex, 1);
                }
            });

            socket.on('game:start:error', (error) => {
                console.warn('Game start error:', error.message);
                // Could show error message to user in UI
            });

            socket.on('player:ready:error', (error) => {
                console.error('[Ready Button] Server error:', error.message);
                if (error.error) {
                    console.error('[Ready Button] Error details:', error.error);
                }
                if (error.availablePlayers) {
                    console.error('[Ready Button] Available players on server:', error.availablePlayers);
                }
            });

            // --- Zombie Synchronization Listeners (Non-Leader) ---
            socket.on('zombie:spawn', (data) => {
                if (gameState.multiplayer.isLeader) return; // Leader spawns locally

                // Spawn zombie on non-leader client
                const ZombieClass = this.getZombieClassByTypeCallback(data.type);
                if (ZombieClass) {
                    const zombie = new ZombieClass(canvas.width, canvas.height);
                    zombie.id = data.id;
                    zombie.x = data.x;
                    zombie.y = data.y;
                    zombie.health = data.health;
                    gameState.zombies.push(zombie);
                }
            });

            socket.on('zombie:update', (zombiesData) => {
                if (gameState.multiplayer.isLeader) return; // Leader has authoritative state

                const now = Date.now();
                const updateInterval = Math.max(50, now - gameState.lastZombieUpdateBroadcast || 100);
                const frameTime = this.gameEngine.timeStep || 16.67;

                // Calculate adaptive lerp factor based on update frequency
                // Formula: lerpFactor = Math.min(0.5, updateInterval / frameTime)
                // Higher update interval = faster lerp to catch up
                const lerpFactor = Math.min(0.5, Math.max(0.1, updateInterval / (frameTime * 2)));

                // Update zombie positions from leader
                zombiesData.forEach(data => {
                    const zombie = gameState.zombies.find(z => z.id === data.id);
                    if (zombie) {
                        // Store previous position for velocity calculation
                        const oldX = zombie.x;
                        const oldY = zombie.y;

                        // Apply synced speed if provided
                        if (data.speed !== undefined) {
                            zombie.speed = data.speed;
                        }
                        if (data.baseSpeed !== undefined) {
                            zombie.baseSpeed = data.baseSpeed;
                        }

                        // Calculate velocity from position delta
                        if (zombie.targetX !== undefined && zombie.targetY !== undefined) {
                            const timeSinceLastUpdate = (now - zombie.lastUpdateTime) || updateInterval;
                            if (timeSinceLastUpdate > 0) {
                                zombie.vx = (data.x - zombie.targetX) / timeSinceLastUpdate;
                                zombie.vy = (data.y - zombie.targetY) / timeSinceLastUpdate;
                            }
                        }

                        // Set target for interpolation
                        zombie.targetX = data.x;
                        zombie.targetY = data.y;
                        zombie.health = data.health;
                        zombie.lastUpdateTime = now;

                        // If distance is too large (teleport/spawn), snap immediately
                        const dx = data.x - zombie.x;
                        const dy = data.y - zombie.y;
                        const distSq = dx * dx + dy * dy;
                        if (distSq > 10000) {
                            // Large distance - snap immediately
                            zombie.x = data.x;
                            zombie.y = data.y;
                            zombie.targetX = data.x;
                            zombie.targetY = data.y;
                        }
                    }
                });

                gameState.lastZombieUpdateBroadcast = now;
            });

            socket.on('zombie:hit', (data) => {
                if (gameState.multiplayer.isLeader) return; // Leader already applied damage

                const zombie = gameState.zombies.find(z => z.id === data.zombieId);
                if (zombie) {
                    zombie.health = data.newHealth;
                    // Visual feedback
                    createBloodSplatter(zombie.x, zombie.y, data.angle || 0, false);
                }
            });

            socket.on('zombie:die', (data) => {
                if (gameState.multiplayer.isLeader) return; // Leader already removed zombie

                const zombieIndex = gameState.zombies.findIndex(z => z.id === data.zombieId);
                if (zombieIndex !== -1) {
                    const zombie = gameState.zombies[zombieIndex];

                    // Clean up state tracking for dead zombie (multiplayer sync)
                    gameState.lastZombieState.delete(zombie.id);

                    // Visual effects
                    createBloodSplatter(zombie.x, zombie.y, data.angle || 0, true);
                    createParticles(zombie.x, zombie.y, '#ff0000', 10);

                    // Handle exploding zombie
                    if (data.isExploding) {
                        triggerExplosion(zombie.x, zombie.y, 100, 50, false);
                    }

                    // Remove zombie
                    gameState.zombies.splice(zombieIndex, 1);
                    gameState.zombiesKilled++;
                }
            });

            // --- Game State Synchronization Listeners (Non-Leader) ---
            socket.on('game:xp', (amount) => {
                if (gameState.multiplayer.isLeader) return; // Leader already gained XP
                skillSystem.gainXP(amount);
            });

            socket.on('game:levelup', (data) => {
                if (gameState.multiplayer.isLeader) return; // Leader already leveled up

                gameState.level = data.level;
                gameState.nextLevelXP = data.nextLevelXP;
                gameState.levelUpChoices = data.choices;
                gameState.showLevelUp = true;
            });

            socket.on('game:skill', (skillId) => {
                if (gameState.multiplayer.isLeader) return; // Leader already activated skill

                skillSystem.activateSkill(skillId);
                gameState.showLevelUp = false;
                gameState.levelUpChoices = [];
            });

            socket.on('connect_error', (err) => {
                console.error('Multiplayer connection error:', err.message);
                console.error('Connection details:', {
                    url: SERVER_URL,
                    transport: socket.io.engine?.transport?.name || 'unknown'
                });
                gameState.multiplayer.connected = false;
                gameState.multiplayer.status = 'error';
            });

            socket.on('reconnect_attempt', (attemptNumber) => {
                console.log(`Reconnection attempt ${attemptNumber}...`);
                gameState.multiplayer.status = 'connecting';
            });

            socket.on('reconnect_failed', () => {
                console.error('Failed to reconnect to server after all attempts');
                gameState.multiplayer.status = 'error';
            });

            // Listen for leaderboard updates from server
            socket.on('highscores:update', (data) => {
                if (data.highscores && Array.isArray(data.highscores) && gameHUD) {
                    gameHUD.leaderboard = data.highscores;
                    gameHUD.leaderboardLastFetch = Date.now();
                }
            });

            // Listen for score submission result
            socket.on('game:score:result', (data) => {
                console.log('[MultiplayerSystem] Score submission result:', data);
                if (data.success && gameHUD) {
                    // If server sent updated highscores, use them directly (faster than fetching)
                    if (data.highscores && Array.isArray(data.highscores)) {
                        console.log('[MultiplayerSystem] Updating leaderboard from server response:', data.highscores.length, 'entries');
                        gameHUD.leaderboardDisplay.leaderboard = data.highscores;
                        gameHUD.leaderboardDisplay.leaderboardLastFetch = Date.now();
                        gameHUD.leaderboardDisplay.leaderboardFetchState = 'success';
                    } else {
                        // Fallback: fetch leaderboard if server didn't send it
                        gameHUD.leaderboardDisplay.fetch();
                    }
                }
            });

            // --- Chat System Listeners ---
            socket.on('chat:message:new', (message) => {
                if (!message || !message.message) return;

                // Add message to chat history
                if (!gameState.multiplayer.chatMessages) {
                    gameState.multiplayer.chatMessages = [];
                }

                gameState.multiplayer.chatMessages.push(message);

                // Limit chat history to last 50 messages
                if (gameState.multiplayer.chatMessages.length > 50) {
                    gameState.multiplayer.chatMessages.shift();
                }

                // Auto-scroll to bottom if user hasn't manually scrolled up
                // (This will be handled in the UI rendering)
            });

            socket.on('chat:history', (data) => {
                if (data.messages && Array.isArray(data.messages)) {
                    gameState.multiplayer.chatMessages = data.messages;
                }
            });

            socket.on('chat:rateLimit', (data) => {
                console.warn('[Chat] Rate limit exceeded:', data.message);
                // Could show user feedback in UI
            });

            socket.on('chat:error', (data) => {
                console.error('[Chat] Error:', data.message);
                // Could show user feedback in UI
            });
        } else {
            console.error('Socket.io not found. Make sure the CDN script is loaded.');
            gameState.multiplayer.status = 'error';
            gameState.multiplayer.connected = false;
        }
    }

    /**
     * Send a chat message to the server
     * @param {string} message - The message to send
     */
    sendChatMessage(message) {
        if (!gameState.multiplayer.socket || !gameState.multiplayer.connected) {
            console.warn('[Chat] Cannot send message - not connected');
            return;
        }

        if (!message || typeof message !== 'string' || message.trim().length === 0) {
            console.warn('[Chat] Invalid message');
            return;
        }

        gameState.multiplayer.socket.emit('chat:message', { message: message.trim() });
    }

    /**
     * Connect to multiplayer (called when entering lobby)
     */
    connectToMultiplayer() {
        // This function is called when entering the multiplayer lobby
        // The network should already be initialized, but ensure it's active
        if (!gameState.multiplayer.socket) {
            // Network will be initialized via initializeNetwork call from main.js
        }
        gameState.multiplayer.active = true;
    }

    /**
     * Update username on server if connected
     * Called when username is changed on the main menu
     */
    updateUsernameOnServer() {
        if (!gameState.multiplayer.socket || !gameState.multiplayer.connected) {
            // Not connected, nothing to update
            return;
        }

        // Emit player:register with new username to update server
        gameState.multiplayer.socket.emit('player:register', {
            name: gameState.username || `Survivor-${gameState.multiplayer.playerId?.slice(-4) || '0000'}`,
            rank: rankSystem.getData() // { rankXP, rank, rankTier, rankName }
        });


    }
}

