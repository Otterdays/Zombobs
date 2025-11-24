import { gameState } from '../core/gameState.js';
import { settingsManager } from '../systems/SettingsManager.js';
import { playerProfileSystem } from '../systems/PlayerProfileSystem.js';
import { formatTime } from '../utils/gameUtils.js';

export class GameOverScreen {
    constructor(canvas, ctx, hud) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.hud = hud;
        this.hoveredButton = null;
        this.finalScore = '';
    }

    getUIScale() {
        return this.hud.getUIScale();
    }

    draw() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        const scale = this.getUIScale();
        const gameOverFontSize = Math.max(32, 48 * scale);
        this.ctx.font = `${gameOverFontSize}px "Creepster", cursive`;
        this.ctx.textAlign = 'center';
        this.ctx.fillStyle = '#ff0000';
        this.ctx.shadowBlur = 20 * scale;
        this.ctx.shadowColor = 'rgba(255, 0, 0, 0.8)';
        this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2 - 100 * scale);
        this.ctx.shadowBlur = 0;

        const scoreFontSize = Math.max(14, Math.round(20 * scale));
        this.ctx.font = `${scoreFontSize}px "Roboto Mono", monospace`;
        this.ctx.fillStyle = '#cccccc';
        this.ctx.textAlign = 'center';

        this.ctx.fillText(this.finalScore, this.canvas.width / 2, this.canvas.height / 2 - 30 * scale);

        // Display multiplier stats
        const player = gameState.players[0];
        if (player.maxMultiplierThisSession > 1.0) {
            const multiplierFontSize = Math.max(12, Math.round(18 * scale));
            this.ctx.font = `${multiplierFontSize}px "Roboto Mono", monospace`;
            this.ctx.fillStyle = '#ffd700';
            this.ctx.fillText(`Max Multiplier: ${player.maxMultiplierThisSession}x`, this.canvas.width / 2, this.canvas.height / 2 + 10 * scale);

            if (player.totalMultiplierBonus > 0) {
                this.ctx.fillStyle = '#4caf50';
                this.ctx.fillText(`Bonus Score: +${Math.floor(player.totalMultiplierBonus)}`, this.canvas.width / 2, this.canvas.height / 2 + 35 * scale);
            }
        }

        // Display rank XP gained
        let yOffset = 60 * scale;
        if (gameState.sessionResults && gameState.sessionResults.rankProgress) {
            const rankProgress = gameState.sessionResults.rankProgress;
            
            const rankFontSize = Math.max(16, Math.round(18 * scale));
            this.ctx.font = `${rankFontSize}px "Roboto Mono", monospace`;
            this.ctx.fillStyle = '#ff6b00';
            this.ctx.fillText(`Rank XP Gained: +${rankProgress.xpGained}`, this.canvas.width / 2, this.canvas.height / 2 + yOffset);
            
            if (rankProgress.rankUp) {
                yOffset += 25 * scale;
                this.ctx.fillStyle = '#00ff00';
                this.ctx.fillText(`RANK UP! ${rankProgress.rankName} Tier ${rankProgress.newTier}`, this.canvas.width / 2, this.canvas.height / 2 + yOffset);
            }
        }

        // Quick Stats Display (V0.8.0)
        yOffset += 40 * scale;
        this.drawQuickStats(yOffset, scale);

        // Draw navigation buttons at bottom
        const centerX = this.canvas.width / 2;
        const buttonWidth = 200 * scale;
        const buttonHeight = 50 * scale;
        const buttonSpacing = 15 * scale;
        
        // Check if game was multiplayer
        const wasMultiplayer = gameState.multiplayer.active || gameState.multiplayer.connected;
        
        // Position buttons near bottom
        let buttonY = this.canvas.height - 120 * scale;
        
        // "Back to Lobby" button (only show if multiplayer)
        if (wasMultiplayer) {
            const lobbyButtonY = buttonY;
            const lobbyHovered = this.hoveredButton === 'gameover_lobby';
            this.hud.drawMenuButton('Back to Lobby', centerX - buttonWidth / 2, lobbyButtonY, buttonWidth, buttonHeight, lobbyHovered, false);
            buttonY = this.canvas.height - 60 * scale;
        }
        
        // "Back to Main Menu" button (always show)
        const menuButtonY = buttonY;
        const menuHovered = this.hoveredButton === 'gameover_menu';
        this.hud.drawMenuButton('Back to Main Menu', centerX - buttonWidth / 2, menuButtonY, buttonWidth, buttonHeight, menuHovered, false);
    }

    drawQuickStats(startYOffset, scale) {
        // Get session stats
        const sessionKills = gameState.zombiesKilled || 0;
        const sessionWave = gameState.wave || 0;
        const sessionStreak = gameState.maxKillStreak || 0;
        const sessionScore = gameState.score || 0;
        
        // Get profile stats for comparison
        let profile = null;
        try {
            if (playerProfileSystem) {
                profile = playerProfileSystem.getProfile();
            }
        } catch (e) {
            // Profile not available, continue without it
        }
        
        const profileStats = profile ? profile.stats : null;
        const previousWave = profileStats ? profileStats.highestWave : 0;
        const previousScore = profileStats ? profileStats.highestScore : 0;
        const previousStreak = profileStats ? profileStats.maxCombo : 0;
        
        // Determine top 3 stats to display
        const stats = [
            { label: 'Kills', value: sessionKills, icon: '💀', color: '#ff1744' },
            { label: 'Wave', value: sessionWave, icon: '🌊', color: '#ffc107' },
            { label: 'Max Streak', value: sessionStreak, icon: '🔥', color: '#ff6b00' }
        ];
        
        // Sort by value (descending) and take top 3
        stats.sort((a, b) => b.value - a.value);
        const topStats = stats.slice(0, 3);
        
        // Draw stats cards
        const cardWidth = 180 * scale;
        const cardHeight = 60 * scale;
        const cardSpacing = 15 * scale;
        const totalWidth = (cardWidth * topStats.length) + (cardSpacing * (topStats.length - 1));
        const startX = (this.canvas.width - totalWidth) / 2;
        const centerY = this.canvas.height / 2;
        
        topStats.forEach((stat, index) => {
            const x = startX + (index * (cardWidth + cardSpacing));
            const y = centerY + startYOffset;
            
            // Card background
            const bgGradient = this.ctx.createLinearGradient(x, y, x, y + cardHeight);
            bgGradient.addColorStop(0, 'rgba(42, 42, 42, 0.9)');
            bgGradient.addColorStop(1, 'rgba(26, 26, 26, 0.9)');
            
            this.ctx.fillStyle = bgGradient;
            this.ctx.fillRect(x, y, cardWidth, cardHeight);
            
            // Card border
            this.ctx.strokeStyle = stat.color;
            this.ctx.lineWidth = 2 * scale;
            this.ctx.strokeRect(x, y, cardWidth, cardHeight);
            
            // Glow effect
            this.ctx.shadowBlur = 10 * scale;
            this.ctx.shadowColor = stat.color;
            this.ctx.strokeRect(x, y, cardWidth, cardHeight);
            this.ctx.shadowBlur = 0;
            
            // Stat label
            const labelFontSize = Math.max(10, Math.round(12 * scale));
            this.ctx.font = `${labelFontSize}px "Roboto Mono", monospace`;
            this.ctx.fillStyle = '#cccccc';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(`${stat.icon} ${stat.label}`, x + cardWidth / 2, y + cardHeight * 0.35);
            
            // Stat value
            const valueFontSize = Math.max(14, Math.round(20 * scale));
            this.ctx.font = `700 ${valueFontSize}px "Roboto Mono", monospace`;
            this.ctx.fillStyle = stat.color;
            this.ctx.fillText(stat.value.toString(), x + cardWidth / 2, y + cardHeight * 0.7);
            
            // Check for record break
            let isRecord = false;
            if (stat.label === 'Wave' && sessionWave > previousWave) {
                isRecord = true;
            } else if (stat.label === 'Max Streak' && sessionStreak > previousStreak) {
                isRecord = true;
            }
            
            // Draw "NEW RECORD!" badge if record broken
            if (isRecord) {
                const badgeFontSize = Math.max(8, Math.round(10 * scale));
                this.ctx.font = `700 ${badgeFontSize}px "Roboto Mono", monospace`;
                this.ctx.fillStyle = '#00ff00';
                this.ctx.shadowBlur = 5 * scale;
                this.ctx.shadowColor = '#00ff00';
                this.ctx.fillText('NEW RECORD!', x + cardWidth / 2, y - 5 * scale);
                this.ctx.shadowBlur = 0;
            }
        });
        
        // Draw overall record notification if score record broken
        if (sessionScore > previousScore && previousScore > 0) {
            const recordFontSize = Math.max(12, Math.round(16 * scale));
            this.ctx.font = `700 ${recordFontSize}px "Roboto Mono", monospace`;
            this.ctx.fillStyle = '#00ff00';
            this.ctx.shadowBlur = 10 * scale;
            this.ctx.shadowColor = '#00ff00';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(`🏆 NEW HIGH SCORE: ${sessionScore}!`, this.canvas.width / 2, centerY + startYOffset + cardHeight + 25 * scale);
            this.ctx.shadowBlur = 0;
        }
    }

    checkButtonClick(x, y) {
        const centerX = this.canvas.width / 2;
        const scale = this.getUIScale();
        const buttonWidth = 200 * scale;
        const buttonHeight = 50 * scale;
        let buttonY = this.canvas.height - 120 * scale;
        
        // Check if game was multiplayer
        const wasMultiplayer = gameState.multiplayer.active || gameState.multiplayer.connected;
        
        // "Back to Lobby" button (only if multiplayer)
        if (wasMultiplayer) {
            const lobbyButtonY = buttonY;
            if (x >= centerX - buttonWidth / 2 && x <= centerX + buttonWidth / 2 &&
                y >= lobbyButtonY && y <= lobbyButtonY + buttonHeight) {
                return 'gameover_lobby';
            }
            buttonY = this.canvas.height - 60 * scale;
        }
        
        // "Back to Main Menu" button (always show)
        const menuButtonY = buttonY;
        if (x >= centerX - buttonWidth / 2 && x <= centerX + buttonWidth / 2 &&
            y >= menuButtonY && y <= menuButtonY + buttonHeight) {
            return 'gameover_menu';
        }
        return null;
    }

    updateHover(x, y) {
        this.hoveredButton = this.checkButtonClick(x, y);
        return this.hoveredButton;
    }
}

