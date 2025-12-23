import { ctx } from '../core/canvas.js';
import { gameState } from '../core/gameState.js';
import { cameraSystem } from '../systems/CameraSystem.js';
import { BossHealthBar } from './BossHealthBar.js';
import { LOW_AMMO_FRACTION, NEWS_UPDATES, WEAPONS, SERVER_URL } from '../core/constants.js';
import { settingsManager } from '../systems/SettingsManager.js';
import { SKILLS_POOL } from '../systems/SkillSystem.js';
import { saveMultiplierStats, getLastRuns, formatTime, loadScoreboard } from '../utils/gameUtils.js';
import { isAudioInitialized } from '../systems/AudioSystem.js';
import { rankSystem } from '../systems/RankSystem.js';
import { RankDisplay } from './RankDisplay.js';
import { LeaderboardDisplay } from './LeaderboardDisplay.js';
import { playerProfileSystem } from '../systems/PlayerProfileSystem.js';
import { MainMenuScreen } from './MainMenuScreen.js';
import { LobbyScreen } from './LobbyScreen.js';
import { CoopLobbyScreen } from './CoopLobbyScreen.js';
import { AILobbyScreen } from './AILobbyScreen.js';
import { GameOverScreen } from './GameOverScreen.js';
import { PauseMenuScreen } from './PauseMenuScreen.js';
import { AboutScreen } from './AboutScreen.js';
import { GalleryScreen } from './GalleryScreen.js';
import { LevelUpScreen } from './LevelUpScreen.js';
import { initGroundPattern } from '../systems/GraphicsSystem.js';

export class GameHUD {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.bossHealthBar = new BossHealthBar(canvas);
        this.rankDisplay = new RankDisplay(canvas);
        this.leaderboardDisplay = new LeaderboardDisplay(canvas);
        // Initialize screen instances
        this.mainMenuScreen = new MainMenuScreen(canvas, this.ctx, this);
        this.lobbyScreen = new LobbyScreen(canvas, this.ctx, this);
        this.coopLobbyScreen = new CoopLobbyScreen(canvas, this.ctx, this);
        this.aiLobbyScreen = new AILobbyScreen(canvas, this.ctx, this);
        this.gameOverScreen = new GameOverScreen(canvas, this.ctx, this);
        this.pauseMenuScreen = new PauseMenuScreen(canvas, this.ctx, this);
        this.aboutScreen = new AboutScreen(canvas, this.ctx, this);
        this.galleryScreen = new GalleryScreen(canvas, this.ctx, this);
        this.levelUpScreen = new LevelUpScreen(canvas, this.ctx, this);
        this.basePadding = 15;
        this.baseItemSpacing = 12;
        this.baseFontSize = 16;
        this.padding = this.getScaledPadding();
        this.itemSpacing = this.getScaledItemSpacing();
        this.fontSize = this.getScaledFontSize();
        this.font = `700 ${this.fontSize}px 'Roboto Mono', monospace`;
        this.gameOver = false;
        this.paused = false;
        this.finalScore = '';
        this.mainMenu = false;
        this.hoveredButton = null;
        this.hoveredSkillIndex = null;
        this.lobbyEnterTime = null; // Track when lobby was entered for fade-in animations
        this.lastLobbyState = false; // Track previous lobby state to reset animation
        // News ticker drag state - now managed by MainMenuScreen, but expose for backward compatibility
        Object.defineProperty(this, 'newsTickerDragging', {
            get: () => this.mainMenuScreen?.newsTickerDragging || false
        });
    }

    getUIScale() {
        const scale = settingsManager.getSetting('video', 'uiScale') ?? 1.0;
        // Ensure scale is always a finite positive number
        if (!Number.isFinite(scale) || scale <= 0) {
            return 1.0;
        }
        return scale;
    }

    getScaledPadding() {
        return this.basePadding * this.getUIScale();
    }

    getScaledItemSpacing() {
        return this.baseItemSpacing * this.getUIScale();
    }

    getScaledFontSize() {
        return Math.max(8, Math.round(this.baseFontSize * this.getUIScale())); // Min 8px for readability
    }

    drawStat(label, value, icon, color, x, y, width, height = null) {
        const scale = this.getUIScale();
        const statHeight = height || (50 * scale); // Use provided height or default to 50
        const padding = 10 * scale;
        const fontSize = this.getScaledFontSize();

        // 1. Glass Background (matching HP UI)
        this.ctx.fillStyle = 'rgba(10, 12, 16, 0.85)';
        this.ctx.fillRect(x, y, width, statHeight);

        // 2. Texture overlay (bloody_dark_floor.png pattern)
        const groundPattern = initGroundPattern();
        if (groundPattern) {
            this.ctx.save();
            this.ctx.globalAlpha = 0.15; // Subtle texture overlay
            this.ctx.fillStyle = groundPattern;
            this.ctx.fillRect(x, y, width, statHeight);
            this.ctx.restore();
        }

        // 3. Border (subtle, matching HP UI - no glow)
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(x, y, width, statHeight);

        // 5. Icon (left side, matching HP UI layout)
        const iconSize = 20 * scale; // Slightly smaller for compact boxes
        const iconX = x + 25 * scale;
        const iconY = y + statHeight * 0.5; // Center vertically
        this.ctx.font = `${iconSize}px serif`; // Emoji font
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(icon, iconX, iconY);

        // 6. Label text (next to icon, matching HP UI style)
        const labelFontSize = Math.max(8, Math.round(11 * scale)); // Slightly smaller for compact
        this.ctx.font = `bold ${labelFontSize}px "Roboto Mono", monospace`;
        this.ctx.fillStyle = '#9e9e9e';
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(label, x + 50 * scale, y + statHeight * 0.35);

        // 7. Value (big number on right, matching HP UI style)
        this.ctx.textAlign = 'right';
        const valueFontSize = Math.max(14, Math.round(22 * scale)); // Slightly smaller for compact
        this.ctx.font = `bold ${valueFontSize}px "Roboto Mono", monospace`;
        this.ctx.fillStyle = color;
        this.ctx.shadowBlur = 5 * scale;
        this.ctx.shadowColor = color;
        this.ctx.fillText(value, x + width - 10 * scale, y + statHeight * 0.5);
        this.ctx.shadowBlur = 0;
        this.ctx.textAlign = 'left'; // Reset alignment
    }

    drawHealthDisplay(player, x, y, width) {
        const height = 50;
        const health = Math.max(0, Math.floor(player.health));
        const maxHealth = player.maxHealth || 100;
        const healthPercent = Math.min(1, health / maxHealth);

        // Pulse effect for low health
        let pulse = 0;
        if (health < 30) {
            pulse = Math.sin(Date.now() / 100) * 0.2; // Fast pulse
        } else {
            pulse = Math.sin(Date.now() / 1000) * 0.05; // Slow breathing
        }

        // Colors
        const baseColor = '#ff1744';

        // 1. Glass Background
        this.ctx.fillStyle = 'rgba(10, 12, 16, 0.85)';
        this.ctx.fillRect(x, y, width, height);

        // 2. Texture overlay (bloody_dark_floor.png pattern)
        const groundPattern = initGroundPattern();
        if (groundPattern) {
            this.ctx.save();
            this.ctx.globalAlpha = 0.15; // Subtle texture overlay
            this.ctx.fillStyle = groundPattern;
            this.ctx.fillRect(x, y, width, height);
            this.ctx.restore();
        }

        // 3. Health Bar Background (Empty)
        const barPadding = 4;
        const barWidth = width - (barPadding * 2);
        const barHeight = 8;
        const barX = x + barPadding;
        const barY = y + height - barHeight - 8; // Bottom aligned

        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.fillRect(barX, barY, barWidth, barHeight);

        // 3. Health Bar Fill
        const fillWidth = Math.max(0, barWidth * healthPercent);
        const gradient = this.ctx.createLinearGradient(barX, barY, barX + fillWidth, barY);
        gradient.addColorStop(0, '#ff5252');
        gradient.addColorStop(1, '#ff1744');

        this.ctx.fillStyle = gradient;
        // Add glow
        this.ctx.shadowBlur = 10 + (pulse * 20);
        this.ctx.shadowColor = baseColor;
        this.ctx.fillRect(barX, barY, fillWidth, barHeight);
        this.ctx.shadowBlur = 0;

        // 4. Border
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(x, y, width, height);

        // 5. Heart Icon & Pulse
        const iconSize = 24 + (pulse * 5);
        const iconX = x + 25;
        const iconY = y + 20;

        this.ctx.font = `${iconSize}px serif`; // Emoji font
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('❤️', iconX, iconY);

        // 6. Text Label "HP"
        const scale = this.getUIScale();
        const labelFontSize = Math.max(8, Math.round(12 * scale));
        this.ctx.font = `bold ${labelFontSize}px "Roboto Mono", monospace`;
        this.ctx.fillStyle = '#9e9e9e';
        this.ctx.textAlign = 'left';
        this.ctx.fillText('HP', x + 50, y + 15);

        // 7. Health Value (Big Number)
        this.ctx.textAlign = 'right';
        const healthFontSize = Math.max(16, Math.round(24 * scale));
        this.ctx.font = `bold ${healthFontSize}px "Roboto Mono", monospace`;
        this.ctx.fillStyle = health < 30 ? '#ff5252' : '#ffffff';
        this.ctx.shadowBlur = health < 30 ? 10 : 0;
        this.ctx.shadowColor = '#ff0000';
        this.ctx.fillText(health, x + width - 10, y + 20);
        this.ctx.shadowBlur = 0;
        this.ctx.textAlign = 'left'; // Reset alignment
    }

    draw() {
        if (gameState.showGallery) {
            this.galleryScreen.draw();
        } else if (gameState.showAbout) {
            this.aboutScreen.draw();
        } else if (gameState.showLobby) {
            this.lobbyScreen.draw();
        } else if (gameState.showCoopLobby) {
            this.coopLobbyScreen.draw();
        } else if (gameState.showAILobby) {
            this.aiLobbyScreen.draw();
        } else if (this.mainMenu) {
            // Auto-refresh leaderboard when on main menu (throttled)
            const now = Date.now();
            if (now - this.leaderboardDisplay.leaderboardLastFetch >= this.leaderboardDisplay.leaderboardFetchInterval) {
                this.leaderboardDisplay.fetch();
            }
            this.mainMenuScreen.draw();
        } else {
            if (!this.gameOver && !this.paused && !gameState.showLevelUp) {
                if (gameState.isCoop) {
                    this.drawCoopHUD();
                } else {
                    this.drawSinglePlayerHUD();
                }
                this.drawOffScreenIndicators();
                this.drawAchievementNotifications();
            }

            if (this.gameOver) {
                this.gameOverScreen.draw();
            }

            if (this.paused) {
                this.pauseMenuScreen.draw();
            }

            if (gameState.showLevelUp) {
                this.levelUpScreen.draw();
            }
        }

        // Always draw WebGPU status icon on top of everything
        this.drawWebGPUStatusIcon();

        // Draw custom cursor when in menus or paused
        if (gameState.showMainMenu || gameState.showLobby || gameState.showCoopLobby || 
            gameState.showAILobby || gameState.showAbout || gameState.showGallery || 
            this.paused || gameState.gamePaused || gameState.showLevelUp || this.gameOver) {
            this.drawCursor();
        }
    }

    drawSinglePlayerHUD() {
        const player = gameState.players[0];
        const startX = this.padding;
        const scale = this.getUIScale();
        const itemSpacing = this.getScaledItemSpacing();
        
        // Position HP bar below WebGPU indicator
        // WebGPU icon height is 32px, positioned at padding (15px)
        const webgpuHeight = 32;
        const webgpuSpacing = 8;
        let startY = this.padding + webgpuHeight + webgpuSpacing;

        // ===== DRAW WAVE AND KILLS NEXT TO DIRECTIONAL COMPASS =====
        // Directional compass is at top: Y=10, height=30, width=40% of canvas
        const compassHeight = 30;
        const compassY = 10;
        const compassWidth = this.canvas.width * 0.4;
        const compassX = (this.canvas.width - compassWidth) / 2;
        
        const statWidth = 140 * scale;
        const statHeight = 50 * scale;
        const compassSpacing = 10 * scale;
        
        // Position stats vertically centered with compass
        const statY = compassY + (compassHeight / 2) - (statHeight / 2);
        
        // WAVE box - LEFT of directional compass
        const waveX = compassX - compassSpacing - statWidth;
        this.drawStat('WAVE', gameState.wave, '🌊', '#ffc107', waveX, statY, statWidth);
        
        // Kills box - RIGHT of directional compass
        const killsX = compassX + compassWidth + compassSpacing;
        this.drawStat('Kills', gameState.zombiesKilled, '💀', '#76ff03', killsX, statY, statWidth);
        // ===== END DIRECTIONAL COMPASS STATS =====

        this.drawPlayerStats(player, startX, startY);

        // Draw shared stats below player stats for single player
        // Health and Shield only now (removed Ammo/Grenades)
        const sharedStatHeight = 50 * scale;
        startY += (sharedStatHeight + itemSpacing) * 2 + itemSpacing; // Health + Shield (or just Health if no shield)
        const finalY = this.drawSharedStats(startX, startY);
        
        // Calculate bottom UI positions (above instructions)
        // Instructions box top is at canvas.height - 75 * scale (raised to avoid taskbar)
        const instructionsTop = this.canvas.height - (75 * scale);
        const instructionsHeight = 60 * scale;
        const bottomSpacing = 15 * scale;
        const bottomUIBaseline = instructionsTop - bottomSpacing;
        
        const bottomWidth = 160 * scale;
        const xpBarWidth = 280 * scale; // Slightly narrower to make room for weapon boxes
        const xpBarHeight = 40 * scale; // XP bar height (reduced from 50)
        const bottomHeight = 50 * scale; // For weapon info calculations
        
        // Top right: Active Skills (moved from bottom left)
        const hpBarHeight = 50 * scale;
        const skillsSpacing = 10 * scale;
        const skillsX = this.canvas.width - bottomWidth - this.padding;
        const skillCount = gameState.activeSkills?.length || 0;
        const skillHeight = 40 * scale;
        const skillsY = this.padding + webgpuHeight + webgpuSpacing + hpBarHeight + skillsSpacing;
        this.drawActiveSkills(skillsX, skillsY, bottomWidth);
        
        // Bottom middle: XP Bar - very close to instructions (tightened gap)
        const xpBarX = this.canvas.width / 2 - (xpBarWidth / 2);
        const xpBarY = instructionsTop - xpBarHeight - (1 * scale); // Very tight gap above instructions
        this.drawXPBar(xpBarX, xpBarY, xpBarWidth);
        
        // Bottom left: Zombies Left and Score boxes - side by side, aligned with XP bar
        const leftStatWidth = 160 * scale; // Width for each box
        const leftStatHeight = 40 * scale; // Same height as XP bar
        const leftStatSpacing = 8 * scale; // Small gap between boxes
        const leftStatY = xpBarY; // Same Y as XP bar
        const remainingZombies = gameState.zombies.length;
        const totalZombies = gameState.zombiesSpawnedThisWave || gameState.zombiesPerWave;
        const waveProgressText = `${remainingZombies}/${totalZombies}`;
        const waveProgressColor = remainingZombies <= totalZombies * 0.3 ? '#76ff03' : '#ffc107';
        
        const leftX = this.padding;
        const scoreX = leftX + leftStatWidth + leftStatSpacing;
        this.drawStat('Left', waveProgressText, '🧟', waveProgressColor, leftX, leftStatY, leftStatWidth, leftStatHeight);
        this.drawStat('Score', gameState.score, '🏆', '#ffd700', scoreX, leftStatY, leftStatWidth, leftStatHeight);
        
        // Bottom right: Weapon and Grenade boxes - side by side, aligned with XP bar
        const weaponWidth = 180 * scale; // Width for each box
        const weaponHeight = 40 * scale; // Same height as XP bar
        const weaponSpacing = 8 * scale; // Small gap between weapon and grenade boxes
        const weaponY = xpBarY; // Same Y as XP bar
        const grenadeX = this.canvas.width - weaponWidth - this.padding;
        const weaponX = grenadeX - weaponWidth - weaponSpacing;
        this.drawWeaponInfoHorizontal(player, weaponX, grenadeX, weaponY, weaponWidth, weaponHeight);

        this.drawInstructions();
    }

    drawCoopHUD() {
        // 2x2 grid layout for up to 4 players
        // Top-left: P1, Top-right: P2, Bottom-left: P3, Bottom-right: P4
        const scale = this.getUIScale();
        const padding = this.getScaledPadding();
        const itemSpacing = this.getScaledItemSpacing();
        const statHeight = 50 * scale;
        const width = 160 * scale;
        // Health and Shield only now (removed Ammo/Grenades)
        const statsHeight = (statHeight + itemSpacing) * 2; // Health + Shield

        // Calculate positions for 2x2 grid
        const leftX = padding;
        const rightX = this.canvas.width - width - padding;
        
        // Position P1 HP bar below WebGPU indicator
        // WebGPU icon height is 32px, positioned at padding (15px)
        const webgpuHeight = 32;
        const webgpuSpacing = 8;
        const topY = padding + webgpuHeight + webgpuSpacing;
        const playerBottomY = this.canvas.height - statsHeight - padding;

        // Get local player (mouse input) or first player
        const localPlayer = gameState.players.find(p => p.inputSource === 'mouse') || gameState.players[0];

        // Draw centralized multiplier indicator at top center (if active)
        // Use local player or first player for multiplier display
        if (localPlayer && localPlayer.scoreMultiplier > 1.0) {
            const centerX = this.canvas.width / 2;
            const multiplierY = padding + webgpuHeight + webgpuSpacing;
            this.drawMultiplierIndicator(localPlayer, centerX, multiplierY);
        }

        // Draw players in grid positions
        if (gameState.players.length >= 1) {
            this.drawPlayerStats(gameState.players[0], leftX, topY, "P1");
        }
        if (gameState.players.length >= 2) {
            this.drawPlayerStats(gameState.players[1], rightX, topY, "P2");
        }
        if (gameState.players.length >= 3) {
            this.drawPlayerStats(gameState.players[2], leftX, playerBottomY, "P3");
        }
        if (gameState.players.length >= 4) {
            this.drawPlayerStats(gameState.players[3], rightX, playerBottomY, "P4");
        }

        // Shared stats on left, below P1 HP box
        // HP box is at topY, and has height of statHeight (50 * scale) + itemSpacing + shield (if exists)
        // Position shared stats below P1's stats
        const sharedStatsY = topY + statsHeight + itemSpacing;
        this.drawSharedStats(leftX, sharedStatsY);
        
        // Calculate bottom UI positions (above instructions)
        // Instructions box top is at canvas.height - 75 * scale (raised to avoid taskbar)
        const instructionsTop = this.canvas.height - (75 * scale);
        const bottomSpacing = 15 * scale;
        const bottomUIBaseline = instructionsTop - bottomSpacing;
        
        const bottomWidth = 160 * scale;
        const xpBarWidth = 280 * scale; // Slightly narrower to make room for weapon boxes
        const xpBarHeight = 40 * scale; // XP bar height (reduced from 50)
        const bottomHeight = 50 * scale; // For weapon info calculations
        
        // Top right: Active Skills (moved from bottom left)
        const hpBarHeight = 50 * scale;
        const skillsSpacing = 10 * scale;
        const skillsX = this.canvas.width - bottomWidth - padding;
        const skillCount = gameState.activeSkills?.length || 0;
        const skillHeight = 40 * scale;
        const skillsY = padding + webgpuHeight + webgpuSpacing + hpBarHeight + skillsSpacing;
        this.drawActiveSkills(skillsX, skillsY, bottomWidth);
        
        // XP Bar - very close to instructions (tightened gap)
        const xpBarX = this.canvas.width / 2 - (xpBarWidth / 2);
        const xpBarY = instructionsTop - xpBarHeight - (1 * scale); // Very tight gap above instructions
        this.drawXPBar(xpBarX, xpBarY, xpBarWidth);
        
        // Bottom right: Weapon and Grenade boxes - side by side, aligned with XP bar
        if (localPlayer) {
            const weaponWidth = 180 * scale; // Width for each box
            const weaponHeight = 40 * scale; // Same height as XP bar
            const weaponSpacing = 8 * scale; // Small gap between weapon and grenade boxes
            const weaponY = xpBarY; // Same Y as XP bar
            const grenadeX = this.canvas.width - weaponWidth - padding;
            const weaponX = grenadeX - weaponWidth - weaponSpacing;
            this.drawWeaponInfoHorizontal(localPlayer, weaponX, grenadeX, weaponY, weaponWidth, weaponHeight);
        }
    }

    drawPlayerStats(player, x, y, labelPrefix = "") {
        const scale = this.getUIScale();
        const itemSpacing = this.getScaledItemSpacing();
        const width = 160 * scale;
        const height = 50 * scale;
        let currentY = y;

        // Health - NEW DESIGN
        this.drawHealthDisplay(player, x, currentY, width);
        currentY += height + itemSpacing;

        // Shield
        if (player.shield > 0) {
            const shieldValue = Math.ceil(player.shield);
            this.drawStat('Shield', shieldValue, '🛡️', '#29b6f6', x, currentY, width);
            currentY += height + itemSpacing;
        }

        // Multiplier indicator removed - now drawn centrally at top
    }

    drawSharedStats(x, y) {
        const scale = this.getUIScale();
        const itemSpacing = this.getScaledItemSpacing();
        const width = 160 * scale;
        const height = 50 * scale;
        let currentY = y;

        // Draw Boss Health Bar if active
        if (gameState.bossActive) {
            this.bossHealthBar.draw(this.ctx);
        }

        // WAVE and Kills moved to opposite sides of compass (top center)
        // Left and Score moved to bottom left in drawSinglePlayerHUD
        // Remaining stats continue here

        // Multiplier indicator removed - now drawn centrally at top

        // Buffs
        if (gameState.damageBuffEndTime > Date.now()) {
            currentY += height + itemSpacing;
            const timeLeft = Math.ceil((gameState.damageBuffEndTime - Date.now()) / 1000);
            this.drawStat('Damage', 'x2 ' + timeLeft + 's', '⚡', '#e040fb', x, currentY, width);
        }

        if (gameState.speedBoostEndTime > Date.now()) {
            currentY += height + itemSpacing;
            const timeLeft = Math.ceil((gameState.speedBoostEndTime - Date.now()) / 1000);
            this.drawStat('Speed', '>> ' + timeLeft + 's', '👟', '#00bcd4', x, currentY, width);
        }

        if (gameState.rapidFireEndTime > Date.now()) {
            currentY += height + itemSpacing;
            const timeLeft = Math.ceil((gameState.rapidFireEndTime - Date.now()) / 1000);
            this.drawStat('Rapid', '>>> ' + timeLeft + 's', '🔥', '#ff9800', x, currentY, width);
        }

        if (gameState.adrenalineEndTime > Date.now()) {
            currentY += height + this.itemSpacing;
            const timeLeft = Math.ceil((gameState.adrenalineEndTime - Date.now()) / 1000);
            this.drawStat('Adrenaline', '⚡⚡⚡ ' + timeLeft + 's', '💉', '#4caf50', x, currentY, width);
        }

        return currentY;
    }

    drawXPBar(x, y, width) {
        const scale = this.getUIScale();
        const height = 40 * scale; // Reduced height for cleaner look
        const padding = 12 * scale;
        const fontSize = this.getScaledFontSize();
        
        // Calculate XP progress
        const xpProgress = Math.min(1, gameState.xp / gameState.nextLevelXP);
        
        // Background - dark glass effect (no border)
        const bgGradient = this.ctx.createLinearGradient(x, y, x, y + height);
        bgGradient.addColorStop(0, 'rgba(10, 12, 16, 0.85)');
        bgGradient.addColorStop(1, 'rgba(10, 12, 16, 0.75)');

        this.ctx.fillStyle = bgGradient;
        this.ctx.fillRect(x, y, width, height);

        // Subtle inner border (very subtle, not a prominent border)
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(x, y, width, height);

        // XP progress bar background
        const barPadding = 6 * scale;
        const barWidth = width - (barPadding * 2);
        const barHeight = 6 * scale;
        const barX = x + barPadding;
        const barY = y + height - barHeight - 6 * scale;

        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.fillRect(barX, barY, barWidth, barHeight);

        // XP progress bar fill
        const fillWidth = Math.max(0, barWidth * xpProgress);
        const xpGradient = this.ctx.createLinearGradient(barX, barY, barX + fillWidth, barY);
        xpGradient.addColorStop(0, '#4caf50');
        xpGradient.addColorStop(1, '#2e7d32');

        this.ctx.fillStyle = xpGradient;
        this.ctx.shadowBlur = 8 * scale;
        this.ctx.shadowColor = '#4caf50';
        this.ctx.fillRect(barX, barY, fillWidth, barHeight);
        this.ctx.shadowBlur = 0;

        // Text: Level and XP (no border, just the text and bar)
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = `700 ${fontSize}px 'Roboto Mono', monospace`;
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'middle';

        const levelText = `⭐ Level ${gameState.level}`;
        this.ctx.fillText(levelText, x + padding, y + height * 0.35);

        const xpText = `${gameState.xp}/${gameState.nextLevelXP} XP`;
        this.ctx.textAlign = 'right';
        this.ctx.fillText(xpText, x + width - padding, y + height * 0.35);
        this.ctx.textAlign = 'left';
    }

    drawActiveSkills(x, y, width) {
        const scale = this.getUIScale();
        const itemSpacing = this.getScaledItemSpacing();
        const skillHeight = 40 * scale;
        let currentY = y;

        // If no active skills, don't draw anything
        if (!gameState.activeSkills || gameState.activeSkills.length === 0) {
            return;
        }

        // Draw each active skill
        for (const activeSkill of gameState.activeSkills) {
            const skillData = SKILLS_POOL.find(s => s.id === activeSkill.id);
            if (!skillData) continue;

            const skillLevel = activeSkill.level || 1;
            const skillName = skillLevel > 1 ? `${skillData.name} Lv.${skillLevel}` : skillData.name;

            // Background with glow
            const bgGradient = this.ctx.createLinearGradient(x, currentY, x, currentY + skillHeight);
            bgGradient.addColorStop(0, 'rgba(42, 42, 42, 0.85)');
            bgGradient.addColorStop(1, 'rgba(26, 26, 26, 0.85)');

            this.ctx.fillStyle = bgGradient;
            this.ctx.fillRect(x, currentY, width, skillHeight);

            // Border
            const skillColor = '#9c27b0'; // Purple for skills
            this.ctx.strokeStyle = skillColor;
            this.ctx.lineWidth = 2 * scale;
            this.ctx.strokeRect(x, currentY, width, skillHeight);

            this.ctx.shadowBlur = 8 * scale;
            this.ctx.shadowColor = skillColor;
            this.ctx.strokeRect(x, currentY, width, skillHeight);
            this.ctx.shadowBlur = 0;

            // Icon and text
            const padding = 10 * scale;
            const fontSize = this.getScaledFontSize();
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = `${fontSize}px 'Roboto Mono', monospace`;
            this.ctx.textAlign = 'left';
            this.ctx.textBaseline = 'middle';

            // Icon
            this.ctx.font = `${20 * scale}px serif`;
            this.ctx.fillText(skillData.icon, x + padding, currentY + skillHeight * 0.5);

            // Skill name
            this.ctx.font = `700 ${fontSize}px 'Roboto Mono', monospace`;
            this.ctx.fillText(skillName, x + padding + (25 * scale), currentY + skillHeight * 0.5);

            currentY += skillHeight + itemSpacing;
        }
    }

    drawWeaponInfo(player, x, y, width) {
        const scale = this.getUIScale();
        const itemSpacing = this.getScaledItemSpacing();
        const height = 50 * scale;
        let currentY = y;

        // Ammo/Weapon display - simple static colors, no flashing
        let ammoColor;
        if (player.isReloading) {
            ammoColor = '#ff9800'; // Orange during reload
        } else if (player.currentAmmo === 0) {
            ammoColor = '#ff5722'; // Red-orange when empty
        } else if (player.currentAmmo <= player.maxAmmo * LOW_AMMO_FRACTION) {
            ammoColor = '#ff6b35'; // Soft orange-red for low ammo (no pulsing)
        } else {
            ammoColor = '#ff9800'; // Normal orange
        }

        const weaponLabel = player.currentWeapon.name;

        if (player.isReloading) {
            // Draw reload progress bar
            const now = Date.now();
            const reloadProgress = Math.min(1, (now - player.reloadStartTime) / player.currentWeapon.reloadTime);
            const progressBarWidth = width - (20 * scale);
            const progressBarHeight = 6 * scale;
            const progressBarX = x + (10 * scale);
            const progressBarY = currentY + (40 * scale); // Moved down a bit to separate from percentage

            // Background
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            this.ctx.fillRect(progressBarX, progressBarY, progressBarWidth, progressBarHeight);

            // Progress fill
            const fillWidth = progressBarWidth * reloadProgress;
            const progressGradient = this.ctx.createLinearGradient(progressBarX, progressBarY, progressBarX + fillWidth, progressBarY);
            progressGradient.addColorStop(0, '#ff9800');
            progressGradient.addColorStop(1, '#ffc107');
            this.ctx.fillStyle = progressGradient;
            this.ctx.fillRect(progressBarX, progressBarY, fillWidth, progressBarHeight);

            // Border
            this.ctx.strokeStyle = ammoColor;
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(progressBarX, progressBarY, progressBarWidth, progressBarHeight);

            // Text - weapon name and percentage on same line
            const ammoText = `${Math.ceil(reloadProgress * 100)}%`;
            const fontSize = this.getScaledFontSize();
            const textY = currentY + (15 * scale);
            
            // Draw weapon name
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = this.font;
            this.ctx.textAlign = 'left';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(`${weaponLabel}:`, x + (10 * scale), textY);
            
            // Draw percentage next to weapon name
            const weaponNameWidth = this.ctx.measureText(`${weaponLabel}:`).width;
            this.ctx.fillStyle = ammoColor;
            this.ctx.font = `700 ${fontSize + Math.round(2 * scale)}px 'Roboto Mono', monospace`;
            this.ctx.fillText(ammoText, x + (10 * scale) + weaponNameWidth + (6 * scale), textY);
        } else {
            const ammoText = `${player.currentAmmo}/${player.maxAmmo}`;
            this.drawStat(weaponLabel, ammoText, '🔫', ammoColor, x, currentY, width);
        }

        // Grenades
        currentY += height + itemSpacing;
        const grenadeColor = player.grenadeCount > 0 ? '#ff9800' : '#666666';
        this.drawStat('Grenades', player.grenadeCount, '💣', grenadeColor, x, currentY, width);
    }

    drawWeaponInfoHorizontal(player, weaponX, grenadeX, y, width, height) {
        const scale = this.getUIScale();
        const padding = 10 * scale;

        // Ammo/Weapon display - simple static colors, no flashing
        let ammoColor;
        if (player.isReloading) {
            ammoColor = '#ff9800'; // Orange during reload
        } else if (player.currentAmmo === 0) {
            ammoColor = '#ff5722'; // Red-orange when empty
        } else if (player.currentAmmo <= player.maxAmmo * LOW_AMMO_FRACTION) {
            ammoColor = '#ff6b35'; // Soft orange-red for low ammo (no pulsing)
        } else {
            ammoColor = '#ff9800'; // Normal orange
        }

        const weaponLabel = player.currentWeapon.name;

        if (player.isReloading) {
            // Draw weapon box with reload progress
            const progressBarWidth = width - (20 * scale);
            const progressBarHeight = 6 * scale;
            const progressBarX = weaponX + (10 * scale);
            const progressBarY = y + height - progressBarHeight - 6 * scale;
            const now = Date.now();
            const reloadProgress = Math.min(1, (now - player.reloadStartTime) / player.currentWeapon.reloadTime);

            // Background
            this.ctx.fillStyle = 'rgba(10, 12, 16, 0.85)';
            this.ctx.fillRect(weaponX, y, width, height);

            // Texture overlay
            const groundPattern = initGroundPattern();
            if (groundPattern) {
                this.ctx.save();
                this.ctx.globalAlpha = 0.15;
                this.ctx.fillStyle = groundPattern;
                this.ctx.fillRect(weaponX, y, width, height);
                this.ctx.restore();
            }

            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(weaponX, y, width, height);

            // Progress bar background
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            this.ctx.fillRect(progressBarX, progressBarY, progressBarWidth, progressBarHeight);

            // Progress fill
            const fillWidth = progressBarWidth * reloadProgress;
            const progressGradient = this.ctx.createLinearGradient(progressBarX, progressBarY, progressBarX + fillWidth, progressBarY);
            progressGradient.addColorStop(0, '#ff9800');
            progressGradient.addColorStop(1, '#ffc107');
            this.ctx.fillStyle = progressGradient;
            this.ctx.fillRect(progressBarX, progressBarY, fillWidth, progressBarHeight);

            // Text
            const ammoText = `${Math.ceil(reloadProgress * 100)}%`;
            const fontSize = this.getScaledFontSize();
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = this.font;
            this.ctx.textAlign = 'left';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(`${weaponLabel}:`, weaponX + padding, y + height * 0.35);

            const weaponNameWidth = this.ctx.measureText(`${weaponLabel}:`).width;
            this.ctx.fillStyle = ammoColor;
            this.ctx.font = `700 ${fontSize}px 'Roboto Mono', monospace`;
            this.ctx.fillText(ammoText, weaponX + padding + weaponNameWidth + (6 * scale), y + height * 0.35);
        } else {
            const ammoText = `${player.currentAmmo}/${player.maxAmmo}`;
            this.drawStat(weaponLabel, ammoText, '🔫', ammoColor, weaponX, y, width);
        }

        // Grenades box - side by side
        const grenadeColor = player.grenadeCount > 0 ? '#ff9800' : '#666666';
        this.drawStat('Grenades', player.grenadeCount, '💣', grenadeColor, grenadeX, y, width);
    }

    drawInstructions() {
        // Get keybinds from settings
        const controls = settingsManager.settings.controls;
        const sprintKey = controls.sprint || 'shift';
        const grenadeKey = controls.grenade || 'g';
        const meleeKey = controls.melee || 'v';
        
        // Build weapon keybind string
        const weaponKeybinds = [
            { key: controls.weapon1 || '1', weapon: WEAPONS.pistol },
            { key: controls.weapon2 || '2', weapon: WEAPONS.shotgun },
            { key: controls.weapon3 || '3', weapon: WEAPONS.rifle },
            { key: controls.weapon4 || '4', weapon: WEAPONS.flamethrower },
            { key: controls.weapon5 || '5', weapon: WEAPONS.smg },
            { key: controls.weapon6 || '6', weapon: WEAPONS.sniper },
            { key: controls.weapon7 || '7', weapon: WEAPONS.rocketLauncher }
        ];
        
        const weaponString = weaponKeybinds.map(w => `${w.key}=${w.weapon.name}`).join(' ');
        
        // Format lines
        const line1 = `WASD to move • Mouse to aim • Click to shoot • ${sprintKey.toUpperCase()} to sprint`;
        const line2 = weaponString;
        const line3 = `${grenadeKey.toUpperCase()} for grenade • ${meleeKey.toUpperCase()} or Right-Click for melee`;

        this.ctx.save();
        const scale = this.getUIScale();
        const fontSize = Math.max(8, Math.round(14 * scale));
        this.ctx.font = `${fontSize}px "Roboto Mono", monospace`;
        this.ctx.textAlign = 'center';

        // Calculate max text width for all lines
        const textWidth = Math.max(
            this.ctx.measureText(line1).width,
            this.ctx.measureText(line2).width,
            this.ctx.measureText(line3).width
        );
        
        // WIDER and FLATTER box - raised to avoid Windows taskbar
        const boxWidth = Math.min(this.canvas.width * 0.95, textWidth + 80 * scale); // 95% of screen width or text + padding
        const boxHeight = 60 * scale; // Flatter height (was 80)
        const boxY = this.canvas.height - (75 * scale); // Raised from bottom to avoid taskbar (was 45)

        // Semi-transparent background - WIDER and FLATTER
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(this.canvas.width / 2 - boxWidth / 2, boxY, boxWidth, boxHeight);
        
        // Border
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(this.canvas.width / 2 - boxWidth / 2, boxY, boxWidth, boxHeight);

        // Divider lines between text rows
        const dividerY1 = boxY + boxHeight / 3;
        const dividerY2 = boxY + (boxHeight / 3) * 2;
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        this.ctx.beginPath();
        this.ctx.moveTo(this.canvas.width / 2 - boxWidth / 2 + 10, dividerY1);
        this.ctx.lineTo(this.canvas.width / 2 + boxWidth / 2 - 10, dividerY1);
        this.ctx.stroke();
        this.ctx.beginPath();
        this.ctx.moveTo(this.canvas.width / 2 - boxWidth / 2 + 10, dividerY2);
        this.ctx.lineTo(this.canvas.width / 2 + boxWidth / 2 - 10, dividerY2);
        this.ctx.stroke();

        // Text - evenly spaced in flatter box
        this.ctx.fillStyle = 'rgba(200, 200, 200, 0.9)';
        const textY = boxY + boxHeight / 6; // First line at 1/6 height
        this.ctx.fillText(line1, this.canvas.width / 2, textY);
        this.ctx.fillText(line2, this.canvas.width / 2, textY + boxHeight / 3);
        this.ctx.fillText(line3, this.canvas.width / 2, textY + (boxHeight / 3) * 2);

        this.ctx.restore();
    }

    drawTooltip(text, x, y) {
        if (!text) return;

        this.ctx.save();
        const scale = this.getUIScale();
        const tooltipFontSize = Math.max(10, Math.round(14 * scale));
        this.ctx.font = `${tooltipFontSize}px "Roboto Mono", monospace`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'bottom';

        const padding = 10 * scale;
        const textMetrics = this.ctx.measureText(text);
        const textWidth = textMetrics.width;
        const textHeight = 20 * scale;
        const tooltipWidth = textWidth + padding * 2;
        const tooltipHeight = textHeight + padding * 2;

        // Position tooltip above the point
        const tooltipX = x;
        const tooltipY = y - 10 * scale;

        // Background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(tooltipX - tooltipWidth / 2, tooltipY - tooltipHeight, tooltipWidth, tooltipHeight);

        // Border
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(tooltipX - tooltipWidth / 2, tooltipY - tooltipHeight, tooltipWidth, tooltipHeight);

        // Text
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillText(text, tooltipX, tooltipY - padding);

        this.ctx.restore();
    }



    drawCursor() {
        // Get mouse position (from tracked position or return if not available)
        const x = this.mouseX;
        const y = this.mouseY;
        
        // Only draw if mouse position is tracked and valid
        if (x === undefined || y === undefined || 
            x < 0 || x > this.canvas.width || 
            y < 0 || y > this.canvas.height) return;

        const scale = this.getUIScale();
        const size = 18 * scale;

        this.ctx.save();

        // Draw classic pointer cursor (simple triangle pointing up-left)
        // Outline (black for contrast)
        this.ctx.strokeStyle = '#000000';
        this.ctx.fillStyle = '#000000';
        this.ctx.lineWidth = 3;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';

        // Simple triangle pointer
        this.ctx.beginPath();
        this.ctx.moveTo(x, y); // Tip at top-left
        this.ctx.lineTo(x + size * 0.5, y + size * 0.5); // Bottom-right of arrow head
        this.ctx.lineTo(x + size * 0.2, y + size * 0.85); // Bottom of arrow shaft
        this.ctx.lineTo(x + size * 0.05, y + size * 0.7); // Left side of shaft
        this.ctx.closePath();
        this.ctx.stroke();

        // Fill (white for visibility)
        this.ctx.fillStyle = '#ffffff';
        this.ctx.lineWidth = 2;

        this.ctx.beginPath();
        this.ctx.moveTo(x, y); // Tip at top-left
        this.ctx.lineTo(x + size * 0.5, y + size * 0.5); // Bottom-right of arrow head
        this.ctx.lineTo(x + size * 0.2, y + size * 0.85); // Bottom of arrow shaft
        this.ctx.lineTo(x + size * 0.05, y + size * 0.7); // Left side of shaft
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();

        this.ctx.restore();
    }


    showGameOver(scoreText) {
        this.gameOver = true;
        this.finalScore = scoreText;
        this.gameOverScreen.finalScore = scoreText;

        // Update all-time max multiplier if any player exceeded it
        gameState.players.forEach(player => {
            if (player.maxMultiplierThisSession > gameState.allTimeMaxMultiplier) {
                gameState.allTimeMaxMultiplier = player.maxMultiplierThisSession;
            }
        });

        // Save multiplier stats
        saveMultiplierStats();
    }

    showPauseMenu() { this.paused = true; }
    hidePauseMenu() { this.paused = false; }
    hideGameOver() { this.gameOver = false; this.finalScore = ''; }

    drawCreepyBackground() {
        const time = Date.now();
        const mouseX = this.mouseX || this.canvas.width / 2;
        const mouseY = this.mouseY || this.canvas.height / 2;

        // Base black
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Pulsing red gradient center
        const pulseSpeed = 0.002;
        const pulseSize = 0.5 + Math.sin(time * pulseSpeed) * 0.1; // Oscillates between 0.4 and 0.6
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;

        const gradient = this.ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, this.canvas.height * pulseSize);
        gradient.addColorStop(0, 'rgba(180, 0, 0, 0.7)');
        gradient.addColorStop(0.4, 'rgba(120, 0, 0, 0.5)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Hidden Scratches (only visible near mouse)
        // We draw these BEFORE the heavy vignette so they feel "deep"
        if (Math.random() < 0.1) {
            // Use a fixed seed or just consistent noise for scratches?
            // Actually, let's just draw random faint lines near the cursor
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
            this.ctx.lineWidth = 1;
            this.ctx.beginPath();
            const scratchX = mouseX + (Math.random() - 0.5) * 200;
            const scratchY = mouseY + (Math.random() - 0.5) * 200;
            this.ctx.moveTo(scratchX, scratchY);
            this.ctx.lineTo(scratchX + (Math.random() - 0.5) * 40, scratchY + (Math.random() - 0.5) * 40);
            this.ctx.stroke();
        }

        // Random Blood Splatters
        if (!this.splatters) this.splatters = [];

        // Spawn new splatter (small chance)
        if (Math.random() < 0.02) {
            this.splatters.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                radius: 15 + Math.random() * 30,
                alpha: 0.6 + Math.random() * 0.3,
                decay: 0.003 + Math.random() * 0.005,
                blobs: Array(4 + Math.floor(Math.random() * 5)).fill(0).map(() => ({
                    ox: (Math.random() - 0.5) * 30,
                    oy: (Math.random() - 0.5) * 30,
                    r: 5 + Math.random() * 15
                }))
            });
        }

        // Draw and update splatters
        this.ctx.fillStyle = '#660000'; // Deep red
        for (let i = this.splatters.length - 1; i >= 0; i--) {
            const s = this.splatters[i];
            s.alpha -= s.decay;

            if (s.alpha <= 0) {
                this.splatters.splice(i, 1);
                continue;
            }

            this.ctx.globalAlpha = s.alpha;
            this.ctx.beginPath();
            this.ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
            s.blobs.forEach(b => {
                this.ctx.arc(s.x + b.ox, s.y + b.oy, b.r, 0, Math.PI * 2);
            });
            this.ctx.fill();
        }
        this.ctx.globalAlpha = 1.0;

        // Scanlines
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        for (let i = 0; i < this.canvas.height; i += 4) {
            this.ctx.fillRect(0, i, this.canvas.width, 2);
        }

        // Glitch Effect (Random horizontal slice displacement)
        if (Math.random() < 0.05) {
            const glitchHeight = Math.random() * 50 + 10;
            const glitchY = Math.random() * (this.canvas.height - glitchHeight);
            const offset = (Math.random() - 0.5) * 20;

            // Capture the slice
            const slice = this.ctx.getImageData(0, glitchY, this.canvas.width, glitchHeight);

            // Clear the area slightly to add artifacting feel
            this.ctx.fillStyle = 'rgba(0,0,0,0.2)';
            this.ctx.fillRect(0, glitchY, this.canvas.width, glitchHeight);

            // Put it back offset
            this.ctx.putImageData(slice, offset, glitchY);

            // Add chromatic aberration line
            this.ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255, 0, 0, 0.3)' : 'rgba(0, 255, 255, 0.3)';
            this.ctx.fillRect(0, glitchY + Math.random() * glitchHeight, this.canvas.width, 2);
        }

        // Moving static noise (lighter to not be too distracting)
        const noiseAmount = 1000;
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
        for (let i = 0; i < noiseAmount; i++) {
            const x = Math.random() * this.canvas.width;
            const y = Math.random() * this.canvas.height;
            const size = Math.random() * 2 + 1;
            this.ctx.fillRect(x, y, size, size);
        }

        // Heavy Vignette
        const vignette = this.ctx.createRadialGradient(centerX, centerY, this.canvas.height * 0.3, centerX, centerY, this.canvas.height * 0.8);
        vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
        vignette.addColorStop(1, 'rgba(0, 0, 0, 0.9)');

        this.ctx.fillStyle = vignette;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Flashlight / "Something Watching" Effect (drawn after vignette for uniform brightness)
        // Creates a subtle, unsettling spotlight that follows the mouse
        // revealing hidden scratches/texture
        const flashlightRadius = 150 + Math.sin(time * 0.005) * 20;
        const flashlight = this.ctx.createRadialGradient(mouseX, mouseY, 0, mouseX, mouseY, flashlightRadius);
        // Realistic flashlight: bright center, gradual fade to edges
        flashlight.addColorStop(0, 'rgba(255, 255, 255, 0.3)'); // Bright center
        flashlight.addColorStop(0.2, 'rgba(255, 220, 220, 0.25)'); // Slight fade
        flashlight.addColorStop(0.5, 'rgba(255, 180, 180, 0.18)'); // More fade
        flashlight.addColorStop(0.75, 'rgba(200, 120, 120, 0.1)'); // Dimmer
        flashlight.addColorStop(0.9, 'rgba(150, 80, 80, 0.05)'); // Much dimmer
        flashlight.addColorStop(1, 'rgba(0, 0, 0, 0)'); // Transparent edge

        // Use screen blend mode to ensure uniform brightness regardless of underlying darkness
        this.ctx.globalCompositeOperation = 'screen';
        this.ctx.fillStyle = flashlight;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.globalCompositeOperation = 'source-over'; // Reset blend mode
    }



    drawGlassCard(x, y, width, height, borderGlow = false) {
        // Validate all parameters are finite numbers
        if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(width) || !Number.isFinite(height)) {
            return;
        }
        
        // Ensure positive dimensions
        if (width <= 0 || height <= 0) {
            return;
        }
        
        // Glassmorphism effect - dark background with transparency
        const cardBg = this.ctx.createLinearGradient(x, y, x, y + height);
        cardBg.addColorStop(0, 'rgba(10, 12, 16, 0.85)');
        cardBg.addColorStop(1, 'rgba(10, 12, 16, 0.75)');
        
        this.ctx.fillStyle = cardBg;
        this.ctx.fillRect(x, y, width, height);

        // Border
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(x, y, width, height);

        // Optional glow effect
        if (borderGlow) {
            this.ctx.shadowBlur = 15;
            this.ctx.shadowColor = 'rgba(255, 23, 68, 0.4)';
            this.ctx.strokeRect(x, y, width, height);
            this.ctx.shadowBlur = 0;
        }
    }


    drawMenuButton(text, x, y, width, height, hovered, disabled) {
        const scale = this.getUIScale();
        const bgColor = disabled ? '#333333' : (hovered ? '#ff1744' : '#1a1a1a');
        const borderColor = disabled ? '#666666' : (hovered ? '#ff5252' : '#ff1744');
        const textColor = disabled ? '#888888' : '#ffffff';

        const bgGradient = this.ctx.createLinearGradient(x, y, x, y + height);
        bgGradient.addColorStop(0, disabled ? 'rgba(51, 51, 51, 0.9)' : (hovered ? 'rgba(255, 23, 68, 0.3)' : 'rgba(26, 26, 26, 0.9)'));
        bgGradient.addColorStop(1, disabled ? 'rgba(26, 26, 26, 0.9)' : (hovered ? 'rgba(255, 23, 68, 0.2)' : 'rgba(10, 10, 10, 0.9)'));

        this.ctx.fillStyle = bgGradient;
        this.ctx.fillRect(x, y, width, height);

        // Texture overlay (bloody_dark_floor.png pattern)
        const groundPattern = initGroundPattern();
        if (groundPattern) {
            this.ctx.save();
            this.ctx.globalAlpha = 0.15; // Subtle texture overlay
            this.ctx.fillStyle = groundPattern;
            this.ctx.fillRect(x, y, width, height);
            this.ctx.restore();
        }

        this.ctx.strokeStyle = borderColor;
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(x, y, width, height);

        if (!disabled && hovered) {
            this.ctx.shadowBlur = 20;
            this.ctx.shadowColor = 'rgba(255, 23, 68, 0.6)';
            this.ctx.strokeRect(x, y, width, height);
            this.ctx.shadowBlur = 0;
        }

        this.ctx.fillStyle = textColor;
        const fontSize = Math.max(12, 18 * scale);  // Base 18px, minimum 12px
        this.ctx.font = `bold ${fontSize}px "Roboto Mono", monospace`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(text, x + width / 2, y + height / 2);
    }

    checkMenuButtonClick(mouseX, mouseY) {
        // Delegate to appropriate screen instances
        if (gameState.gamePaused && !gameState.showSettingsPanel) {
            return this.pauseMenuScreen.checkButtonClick(mouseX, mouseY);
        }
        if (this.gameOver) {
            return this.gameOverScreen.checkButtonClick(mouseX, mouseY);
        }
        if (gameState.showAILobby) {
            return this.aiLobbyScreen.checkButtonClick(mouseX, mouseY);
        }
        if (gameState.showCoopLobby) {
            return this.coopLobbyScreen.checkButtonClick(mouseX, mouseY);
        }
        if (gameState.showLobby) {
            return this.lobbyScreen.checkButtonClick(mouseX, mouseY);
        }
        if (gameState.showAbout) {
            return this.aboutScreen.checkButtonClick(mouseX, mouseY);
        }
        if (gameState.showGallery) {
            return this.galleryScreen.checkButtonClick(mouseX, mouseY);
        }
        if (this.mainMenu) {
            return this.mainMenuScreen.checkButtonClick(mouseX, mouseY);
        }
        return null;
    }

    updateMenuHover(mouseX, mouseY) {
        this.mouseX = mouseX;
        this.mouseY = mouseY;
        // Delegate to appropriate screen instances
        if (gameState.gamePaused && !gameState.showSettingsPanel) {
            this.hoveredButton = this.pauseMenuScreen.updateHover(mouseX, mouseY);
            return;
        }
        if (this.gameOver) {
            this.hoveredButton = this.gameOverScreen.updateHover(mouseX, mouseY);
            return;
        }
        if (gameState.showAILobby) {
            this.hoveredButton = this.aiLobbyScreen.updateHover(mouseX, mouseY);
            return;
        }
        if (gameState.showCoopLobby) {
            this.hoveredButton = this.coopLobbyScreen.updateHover(mouseX, mouseY);
            return;
        }
        if (gameState.showLobby) {
            this.hoveredButton = this.lobbyScreen.updateHover(mouseX, mouseY);
            return;
        }
        if (gameState.showAbout) {
            this.hoveredButton = this.aboutScreen.updateHover(mouseX, mouseY);
            return;
        }
        if (gameState.showGallery) {
            this.hoveredButton = this.galleryScreen.updateHover(mouseX, mouseY);
            return;
        }
        if (this.mainMenu) {
            this.mainMenuScreen.updateHover(mouseX, mouseY);
            this.hoveredButton = this.mainMenuScreen.hoveredButton;
            return;
        }
        this.hoveredButton = null;
    }

    drawOffScreenIndicators() {
        if (!gameState.gameRunning || gameState.gamePaused) return;
        if (gameState.zombies.length === 0) return;

        // v0.8.1.2: Check if single player arcade mode for coordinate conversion
        const isSinglePlayerArcade = !gameState.isCoop && !gameState.multiplayer.active;

        // v0.8.1.2: In single player arcade mode, use much larger distance threshold for moving world
        // In other modes, use smaller threshold for performance
        const indicatorDistance = isSinglePlayerArcade ? 5000 : 800; // Distance threshold (world space)
        // Use a smaller distance threshold for color sensitivity (arrows turn green/yellow at closer distances)
        const colorDistance = isSinglePlayerArcade ? 1500 : 400; // Color transition distance (world space)
        const indicatorSize = 12;
        const edgePadding = 20;

        gameState.zombies.forEach(zombie => {
            // Find closest living player
            let closestPlayer = null;
            let minDist = Infinity;

            let minDistSquared = Infinity;
            gameState.players.forEach(p => {
                if (p.health > 0) {
                    const dx = p.x - zombie.x;
                    const dy = p.y - zombie.y;
                    const distSquared = dx * dx + dy * dy;
                    if (distSquared < minDistSquared) {
                        minDistSquared = distSquared;
                        closestPlayer = p;
                    }
                }
            });

            if (!closestPlayer) return;

            // Calculate world-space distance for threshold check
            const worldDx = zombie.x - closestPlayer.x;
            const worldDy = zombie.y - closestPlayer.y;
            const worldDistSquared = worldDx * worldDx + worldDy * worldDy;
            const indicatorDistSquared = indicatorDistance * indicatorDistance;

            // Only show indicator if zombie is off-screen but within threshold distance (world space)
            if (worldDistSquared > indicatorDistSquared) return;

            // v0.8.1.2: Convert world coordinates to screen coordinates in single player arcade mode for display
            let zombieScreenX = zombie.x;
            let zombieScreenY = zombie.y;
            let playerScreenX = closestPlayer.x;
            let playerScreenY = closestPlayer.y;
            
            if (isSinglePlayerArcade) {
                const zombieScreen = cameraSystem.worldToScreen(zombie.x, zombie.y);
                const playerScreen = cameraSystem.worldToScreen(closestPlayer.x, closestPlayer.y);
                zombieScreenX = zombieScreen.x;
                zombieScreenY = zombieScreen.y;
                playerScreenX = playerScreen.x;
                playerScreenY = playerScreen.y;
            }

            // Check if zombie is on screen (using screen coordinates)
            const isOnScreen = zombieScreenX >= 0 && zombieScreenX <= this.canvas.width &&
                zombieScreenY >= 0 && zombieScreenY <= this.canvas.height;

            if (isOnScreen) return; // Don't show indicator if zombie is on screen

            // Calculate screen-space distance for arrow direction (color uses world-space distance)
            const dx = zombieScreenX - playerScreenX;
            const dy = zombieScreenY - playerScreenY;
            const distSquared = dx * dx + dy * dy;

            // Calculate angle to zombie (using screen coordinates)
            const angle = Math.atan2(dy, dx);

            // Find intersection point with screen edge
            let indicatorX, indicatorY;

            // Check which edge the line intersects (using screen coordinates)
            const slope = dy / dx;
            const playerX = playerScreenX;
            const playerY = playerScreenY;

            // Calculate intersections with all four edges
            let intersections = [];

            // Top edge (y = 0)
            const topX = playerX + (0 - playerY) / slope;
            if (topX >= 0 && topX <= this.canvas.width) {
                intersections.push({ x: topX, y: 0 });
            }

            // Bottom edge (y = canvas.height)
            const bottomX = playerX + (this.canvas.height - playerY) / slope;
            if (bottomX >= 0 && bottomX <= this.canvas.width) {
                intersections.push({ x: bottomX, y: this.canvas.height });
            }

            // Left edge (x = 0)
            const leftY = playerY + slope * (0 - playerX);
            if (leftY >= 0 && leftY <= this.canvas.height) {
                intersections.push({ x: 0, y: leftY });
            }

            // Right edge (x = canvas.width)
            const rightY = playerY + slope * (this.canvas.width - playerX);
            if (rightY >= 0 && rightY <= this.canvas.height) {
                intersections.push({ x: this.canvas.width, y: rightY });
            }

            // Use the closest intersection to the zombie (using screen coordinates)
            if (intersections.length > 0) {
                let closestIntersection = intersections[0];
                const dx0 = intersections[0].x - zombieScreenX;
                const dy0 = intersections[0].y - zombieScreenY;
                let closestDistSquared = dx0 * dx0 + dy0 * dy0;

                intersections.forEach(int => {
                    const dx = int.x - zombieScreenX;
                    const dy = int.y - zombieScreenY;
                    const distSquared = dx * dx + dy * dy;
                    if (distSquared < closestDistSquared) {
                        closestDistSquared = distSquared;
                        closestIntersection = int;
                    }
                });

                indicatorX = closestIntersection.x;
                indicatorY = closestIntersection.y;
            } else {
                // Fallback: use angle to place indicator at edge
                if (Math.abs(dx) > Math.abs(dy)) {
                    indicatorX = dx > 0 ? this.canvas.width - edgePadding : edgePadding;
                    indicatorY = playerY + slope * (indicatorX - playerX);
                } else {
                    indicatorY = dy > 0 ? this.canvas.height - edgePadding : edgePadding;
                    indicatorX = playerX + (indicatorY - playerY) / slope;
                }
            }

            // Clamp to screen bounds
            indicatorX = Math.max(edgePadding, Math.min(this.canvas.width - edgePadding, indicatorX));
            indicatorY = Math.max(edgePadding, Math.min(this.canvas.height - edgePadding, indicatorY));

            // Draw arrow indicator
            this.ctx.save();
            this.ctx.translate(indicatorX, indicatorY);
            this.ctx.rotate(angle);

            // Arrow color based on distance (closer = more red)
            // Use world-space distance with smaller colorDistance threshold for more sensitive color variation
            const worldDistance = Math.sqrt(worldDistSquared);
            const distanceRatio = Math.min(1, worldDistance / colorDistance); // Clamp to 1 for safety
            const red = Math.floor(255 * (1 - distanceRatio));
            const green = Math.floor(100 * distanceRatio);
            const color = `rgb(${red}, ${green}, 0)`;

            this.ctx.fillStyle = color;
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.lineWidth = 1;

            // Draw arrow triangle
            this.ctx.beginPath();
            this.ctx.moveTo(indicatorSize, 0);
            this.ctx.lineTo(-indicatorSize / 2, -indicatorSize / 2);
            this.ctx.lineTo(-indicatorSize / 2, indicatorSize / 2);
            this.ctx.closePath();
            this.ctx.fill();
            this.ctx.stroke();

            this.ctx.restore();
        });
    }

    showMainMenu() { this.mainMenu = true; }
    hideMainMenu() { this.mainMenu = false; this.hoveredButton = null; }

    drawLowHealthVignette(player) {
        if (!settingsManager.getSetting('video', 'lowHealthWarning')) return;

        const healthPercent = player.health / player.maxHealth;
        if (healthPercent >= 0.3) return; // Only show when health < 30%

        const pulse = Math.sin(Date.now() / 200) * 0.3 + 0.7; // Pulse between 0.4 and 1.0
        const intensity = (0.3 - healthPercent) / 0.3; // 0 to 1 based on how low health is
        const alpha = intensity * pulse * 0.4; // Max 40% opacity

        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const maxRadius = Math.max(this.canvas.width, this.canvas.height) * 0.8;

        const vignette = this.ctx.createRadialGradient(
            centerX, centerY, this.canvas.height * 0.2,
            centerX, centerY, maxRadius
        );
        vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
        vignette.addColorStop(0.5, `rgba(255, 0, 0, ${alpha * 0.3})`);
        vignette.addColorStop(1, `rgba(255, 0, 0, ${alpha})`);

        this.ctx.fillStyle = vignette;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawCompass() {
        if (!gameState.gameRunning || gameState.gamePaused) return;
        if (gameState.players.length === 0) return;

        const player = gameState.players[0];
        const compassHeight = 30;
        const compassY = 10;
        const compassWidth = this.canvas.width * 0.4;
        const compassX = (this.canvas.width - compassWidth) / 2;

        this.ctx.save();

        // Background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        this.ctx.fillRect(compassX, compassY, compassWidth, compassHeight);
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(compassX, compassY, compassWidth, compassHeight);

        // Get player angle and convert to compass direction
        // Player angle: 0 = right (East), PI/2 = down (South), PI = left (West), -PI/2 = up (North)
        const playerAngle = player.angle;
        // Convert to compass angle (0 = North, clockwise)
        const compassAngle = -playerAngle + Math.PI / 2;

        // Draw compass marks
        const directions = ['N', 'E', 'S', 'W'];
        const directionAngles = [0, Math.PI / 2, Math.PI, Math.PI * 3 / 2];

        const scale = this.getUIScale();
        const compassFontSize = Math.max(10, Math.round(14 * scale));
        this.ctx.font = `bold ${compassFontSize}px "Roboto Mono", monospace`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';

        // Draw center indicator
        const centerX = compassX + compassWidth / 2;
        const centerY = compassY + compassHeight / 2;
        this.ctx.fillStyle = '#ff1744';
        this.ctx.fillRect(centerX - 2, centerY - 8, 4, 16);

        // Draw direction markers
        directionAngles.forEach((angle, index) => {
            const relativeAngle = angle - compassAngle;
            // Normalize angle to -PI to PI
            let normalizedAngle = relativeAngle;
            while (normalizedAngle > Math.PI) normalizedAngle -= Math.PI * 2;
            while (normalizedAngle < -Math.PI) normalizedAngle += Math.PI * 2;

            // Only show if within visible range (about 90 degrees each side)
            if (Math.abs(normalizedAngle) < Math.PI / 2) {
                const offset = normalizedAngle / (Math.PI / 2) * (compassWidth / 2 - 20);
                const markerX = centerX + offset;

                // Draw tick mark
                this.ctx.strokeStyle = '#ffffff';
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                this.ctx.moveTo(markerX, compassY + 5);
                this.ctx.lineTo(markerX, compassY + 15);
                this.ctx.stroke();

                // Draw direction label
                this.ctx.fillStyle = '#ffffff';
                this.ctx.fillText(directions[index], markerX, compassY + 25);
            }
        });

        this.ctx.restore();
    }


    drawWebGPUStatusIcon() {
        this.ctx.save();

        // Check if WebGPU renderer is available AND enabled
        const webgpuRenderer = window.webgpuRenderer;
        const webgpuEnabled = settingsManager.getSetting('video', 'webgpuEnabled') ?? true;
        const isWebGPUActive = webgpuRenderer && webgpuRenderer.isAvailable() && webgpuEnabled;

        const padding = 15;
        const iconWidth = 75;
        const iconHeight = 32;

        let iconX = padding;
        let iconY = padding; // Moved to top of screen

        // No longer need special positioning for main menu since it's at top

        // Draw hexagon badge shape
        const hexRadius = iconHeight / 2;
        const centerX = iconX + hexRadius;
        const centerY = iconY + hexRadius;

        // Create hexagon path
        this.ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i - Math.PI / 6; // Rotate to point up
            const x = centerX + hexRadius * Math.cos(angle);
            const y = centerY + hexRadius * Math.sin(angle);
            if (i === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        }
        this.ctx.closePath();

        // Fill with gradient or solid color based on state
        if (isWebGPUActive) {
            // Active: Blue/purple gradient with glow
            const gradient = this.ctx.createLinearGradient(iconX, iconY, iconX + iconWidth, iconY + iconHeight);
            gradient.addColorStop(0, '#6366f1'); // Indigo
            gradient.addColorStop(1, '#8b5cf6'); // Purple
            this.ctx.fillStyle = gradient;

            // Add glow effect
            this.ctx.shadowBlur = 8;
            this.ctx.shadowColor = 'rgba(99, 102, 241, 0.6)';
        } else {
            // Inactive: Gray with reduced opacity
            this.ctx.fillStyle = 'rgba(102, 102, 102, 0.5)';
            this.ctx.shadowBlur = 0;
        }

        this.ctx.fill();
        this.ctx.shadowBlur = 0;

        // Draw border
        if (isWebGPUActive) {
            this.ctx.strokeStyle = 'rgba(139, 92, 246, 0.8)';
            this.ctx.lineWidth = 1.5;
        } else {
            this.ctx.strokeStyle = 'rgba(102, 102, 102, 0.4)';
            this.ctx.lineWidth = 1;
        }
        this.ctx.stroke();

        // Draw "WebGPU" text
        const scale = this.getUIScale();
        const webgpuFontSize = Math.max(8, Math.round(10 * scale));
        this.ctx.font = `bold ${webgpuFontSize}px "Roboto Mono", monospace`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';

        if (isWebGPUActive) {
            this.ctx.fillStyle = '#ffffff';
            // Subtle pulse effect
            const pulse = Math.sin(Date.now() / 1000) * 0.1 + 0.9;
            this.ctx.globalAlpha = pulse;
        } else {
            this.ctx.fillStyle = 'rgba(200, 200, 200, 0.6)';
            this.ctx.globalAlpha = 0.6;
        }

        this.ctx.fillText('WebGPU', centerX, centerY);
        this.ctx.globalAlpha = 1.0;

        // Draw WebGPU status dot on top-right corner of hexagon
        // Shows green when WebGPU is active, orange when inactive/fallback
        const dotRadius = 3 * scale; // Smaller to fit on corner
        // Position on top-right corner of hexagon (hexagon right edge is at centerX + hexRadius horizontally)
        // Top edge is at iconY, rightmost point is at centerX + hexRadius
        const dotX = centerX + hexRadius - dotRadius; // Position on right edge, slightly inset
        const dotY = iconY + dotRadius; // Position on top edge, slightly inset

        // WebGPU status dot (green when active, orange when inactive/using Canvas fallback)
        if (isWebGPUActive) {
            this.ctx.fillStyle = '#10b981'; // Green when WebGPU is active
            const pulse = 0.7 + Math.sin(Date.now() * 0.01) * 0.3;
            this.ctx.shadowBlur = 8 * scale * pulse;
            this.ctx.shadowColor = 'rgba(16, 185, 129, 0.8)';
        } else {
            this.ctx.fillStyle = '#ff9800'; // Orange when using Canvas 2D fallback
            this.ctx.shadowBlur = 6 * scale;
            this.ctx.shadowColor = 'rgba(255, 152, 0, 0.6)';
        }

        this.ctx.beginPath();
        this.ctx.arc(dotX, dotY, dotRadius, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.shadowBlur = 0;

        this.ctx.restore();
    }


    checkLevelUpClick(x, y) {
        return this.levelUpScreen.checkClick(x, y);
    }

    updateLevelUpHover(x, y) {
        this.mouseX = x;
        this.mouseY = y;
        this.hoveredSkillIndex = this.levelUpScreen.updateHover(x, y);
    }

    drawServerStatus() {
        let status = gameState.multiplayer.status || 'disconnected';

        // If not actively connected to multiplayer lobby, show general server health
        if (status === 'disconnected' || status === 'error') {
            const serverHealth = gameState.multiplayer.serverStatus;
            if (serverHealth === 'online') {
                status = 'server_online';
            } else if (serverHealth === 'checking') {
                status = 'checking_health';
            }
        }

        const x = this.canvas.width - 150;
        const y = 20;
        const dotRadius = 6;
        const dotX = x + 10;
        const dotY = y + 10;

        // Determine color based on status
        let dotColor;
        let statusText;
        switch (status) {
            case 'connected':
                dotColor = '#10b981'; // Green
                statusText = 'Connected';
                break;
            case 'connecting':
                dotColor = '#f59e0b'; // Yellow/Amber
                statusText = 'Connecting...';
                break;
            case 'server_online':
                dotColor = '#10b981'; // Green
                statusText = 'Server Ready';
                break;
            case 'checking_health':
                dotColor = '#f59e0b'; // Yellow/Amber
                statusText = 'Waking Server...';
                break;
            case 'error':
                dotColor = '#ef4444'; // Red
                statusText = 'Error';
                break;
            default:
                dotColor = '#6b7280'; // Gray
                statusText = 'Offline';
        }

        // Background panel
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(x, y, 140, 30);

        // Border
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(x, y, 140, 30);

        // Status dot with glow
        this.ctx.shadowBlur = 8;
        this.ctx.shadowColor = dotColor;
        this.ctx.fillStyle = dotColor;
        this.ctx.beginPath();
        this.ctx.arc(dotX, dotY, dotRadius, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.shadowBlur = 0;

        // Status text
        const scale = this.getUIScale();
        this.ctx.fillStyle = '#ffffff';
        const statusFontSize = Math.max(9, 12 * scale);
        this.ctx.font = `${statusFontSize}px "Roboto Mono", monospace`;
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(statusText, dotX + 20 * scale, dotY);
    }

    drawMultiplierIndicator(player, centerX, y, shrunk = false) {
        if (player.scoreMultiplier <= 1.0) {
            return; // Don't show at 1x
        }

        // Shrink compass by ~15% if shrunk flag is set
        const shrinkFactor = shrunk ? 0.85 : 1.0;
        const width = 120 * shrinkFactor;
        const height = 40 * shrinkFactor;

        // Pulsing glow effect
        const pulse = Math.sin(Date.now() / 200) * 0.3 + 0.7;

        // Color based on tier
        let color;
        if (player.scoreMultiplier >= 5.0) {
            color = '#ffd700'; // Gold for max
        } else if (player.scoreMultiplier >= 4.0) {
            color = '#ff9800'; // Orange
        } else if (player.scoreMultiplier >= 3.0) {
            color = '#ffeb3b'; // Yellow
        } else {
            color = '#4caf50'; // Green
        }

        // Render multiplier text (apply shrink factor)
        this.ctx.save();
        const scale = this.getUIScale();
        const multiplierFontSize = Math.max(16, 24 * scale * shrinkFactor);
        this.ctx.font = `bold ${multiplierFontSize}px "Roboto Mono"`;
        this.ctx.fillStyle = color;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.shadowBlur = 15 * pulse * scale * shrinkFactor;
        this.ctx.shadowColor = color;
        this.ctx.fillText(`${player.scoreMultiplier}x`, centerX, y);
        this.ctx.shadowBlur = 0;

        // Progress bar to next tier (centered)
        const progressX = centerX - width / 2;
        const progressY = y + (25 * shrinkFactor);
        this.drawMultiplierProgress(player, progressX, progressY, width, shrinkFactor);

        this.ctx.restore();
    }

    drawMultiplierProgress(player, x, y, width, shrinkFactor = 1.0) {
        const kills = player.consecutiveKills;
        const thresholds = player.multiplierTierThresholds;

        // Find current and next threshold
        let currentThreshold = 0;
        let nextThreshold = thresholds[1];

        for (let i = 0; i < thresholds.length - 1; i++) {
            if (kills >= thresholds[i] && kills < thresholds[i + 1]) {
                currentThreshold = thresholds[i];
                nextThreshold = thresholds[i + 1];
                break;
            }
        }

        // At max tier (apply shrink factor)
        const scale = this.getUIScale();
        if (kills >= thresholds[thresholds.length - 1]) {
            const maxFontSize = Math.max(9, 12 * scale * shrinkFactor);
            this.ctx.font = `${maxFontSize}px "Roboto Mono"`;
            this.ctx.fillStyle = '#ffd700';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('MAX', x + width / 2, y);
            return;
        }

        // Calculate progress
        const progress = (kills - currentThreshold) / (nextThreshold - currentThreshold);

        // Render progress bar background (apply shrink factor)
        const barHeight = 6 * shrinkFactor;
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        this.ctx.fillRect(x, y, width, barHeight);

        // Render progress bar fill
        const fillWidth = width * progress;
        const gradient = this.ctx.createLinearGradient(x, y, x + fillWidth, y);
        gradient.addColorStop(0, '#ff5252');
        gradient.addColorStop(1, '#ff1744');

        this.ctx.fillStyle = gradient;
        this.ctx.shadowBlur = 8 * shrinkFactor;
        this.ctx.shadowColor = 'rgba(255, 23, 68, 0.6)';
        this.ctx.fillRect(x, y, fillWidth, barHeight);
        this.ctx.shadowBlur = 0;

        // Show kills remaining (apply shrink factor to font and spacing)
        const killsRemaining = nextThreshold - kills;
        const killsFontSize = Math.max(8, Math.round(10 * scale * shrinkFactor));
        this.ctx.font = `${killsFontSize}px "Roboto Mono"`;
        this.ctx.fillStyle = '#9e9e9e';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`${killsRemaining} kills to ${player.scoreMultiplier + 1.0}x`, x + width / 2, y + (16 * scale * shrinkFactor));
    }

    /**
     * Fetch global leaderboard from server with 10-second timeout
     */

    drawAchievementNotifications() {
        if (!gameState.achievementNotifications || gameState.achievementNotifications.length === 0) return;

        const scale = this.getUIScale();
        const centerX = this.canvas.width / 2;
        let startY = 100 * scale;

        // Update and draw notifications
        gameState.achievementNotifications = gameState.achievementNotifications.filter(notification => {
            notification.life--;

            if (notification.life <= 0) return false;

            const alpha = Math.min(1, notification.life / 60); // Fade in first 60 frames
            const achievement = notification.achievement;

            // Background
            const width = 400 * scale;
            const height = 80 * scale;
            const x = centerX - width / 2;

            this.ctx.fillStyle = `rgba(42, 42, 42, ${0.9 * alpha})`;
            this.ctx.fillRect(x, startY, width, height);

            // Border
            this.ctx.strokeStyle = `rgba(255, 107, 0, ${alpha})`;
            this.ctx.lineWidth = 3 * scale;
            this.ctx.strokeRect(x, startY, width, height);

            // Icon
            this.ctx.font = `${40 * scale}px serif`;
            this.ctx.textAlign = 'left';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(achievement.icon, x + 20 * scale, startY + height / 2);

            // Text
            const fontSize = Math.max(14, 18 * scale);
            this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            this.ctx.font = `bold ${fontSize}px 'Roboto Mono', monospace`;
            this.ctx.fillText('ACHIEVEMENT UNLOCKED!', x + 70 * scale, startY + 25 * scale);

            this.ctx.fillStyle = `rgba(255, 107, 0, ${alpha})`;
            this.ctx.font = `${Math.max(12, 14 * scale)}px 'Roboto Mono', monospace`;
            this.ctx.fillText(achievement.name, x + 70 * scale, startY + 50 * scale);

            startY += height + 10 * scale;
            return true;
        });
    }


    /**
     * Check if click is on chat input field
     */
    checkChatInputClick(x, y) {
        return this.lobbyScreen.checkChatInputClick(x, y);
    }

    checkNewsTickerHit(x, y) {
        return this.mainMenuScreen.checkNewsTickerHit(x, y);
    }

    startNewsTickerDrag(x, y) {
        return this.mainMenuScreen.startNewsTickerDrag(x, y);
    }

    updateNewsTickerDrag(x) {
        this.mainMenuScreen.updateNewsTickerDrag(x);
    }

    endNewsTickerDrag() {
        this.mainMenuScreen.endNewsTickerDrag();
    }
}
