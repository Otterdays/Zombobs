import { ctx } from '../core/canvas.js';
import { gameState } from '../core/gameState.js';
import { BossHealthBar } from './BossHealthBar.js';
import { LOW_AMMO_FRACTION, NEWS_UPDATES, WEAPONS, SERVER_URL } from '../core/constants.js';
import { settingsManager } from '../systems/SettingsManager.js';
import { SKILLS_POOL } from '../systems/SkillSystem.js';
import { saveMultiplierStats, getLastRuns, formatTime, loadScoreboard } from '../utils/gameUtils.js';
import { isAudioInitialized } from '../systems/AudioSystem.js';
import { rankSystem } from '../systems/RankSystem.js';
import { RankDisplay } from './RankDisplay.js';
import { playerProfileSystem } from '../systems/PlayerProfileSystem.js';

export class GameHUD {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.bossHealthBar = new BossHealthBar(canvas);
        this.rankDisplay = new RankDisplay(canvas);
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
        this.leaderboard = []; // Global leaderboard from server
        this.leaderboardLastFetch = 0; // Timestamp of last fetch
        this.leaderboardFetchInterval = 30000; // Fetch every 30 seconds
        this.leaderboardFetchState = 'loading'; // 'loading' | 'success' | 'timeout' | 'error'
        this.leaderboardFetchStartTime = 0; // Timestamp when fetch started
        // News ticker drag state
        this.newsTickerDragging = false;
        this.newsTickerDragStartX = 0;
        this.newsTickerManualOffset = 0;
        this.newsTickerAutoOffset = 0;
        this.newsTickerDragStartOffset = 0;
        this.newsTickerBoxX = 0;
        this.newsTickerBoxY = 0;
        this.newsTickerBoxWidth = 0;
        this.newsTickerBoxHeight = 0;
        this.newsTickerTextWidth = 0;
    }

    getUIScale() {
        const scale = settingsManager.getSetting('video', 'uiScale') ?? 1.0;
        // Ensure scale is always a finite positive number
        if (!Number.isFinite(scale) || scale <= 0) {
            console.warn('getUIScale: Invalid scale value, using default 1.0', { scale });
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

    drawStat(label, value, icon, color, x, y, width) {
        const scale = this.getUIScale();
        const height = 50 * scale;
        const padding = 10 * scale;
        const fontSize = this.getScaledFontSize();
        // Background with glow
        const bgGradient = this.ctx.createLinearGradient(x, y, x, y + height);
        bgGradient.addColorStop(0, 'rgba(42, 42, 42, 0.85)');
        bgGradient.addColorStop(1, 'rgba(26, 26, 26, 0.85)');

        this.ctx.fillStyle = bgGradient;
        this.ctx.fillRect(x, y, width, height);

        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 2 * scale;
        this.ctx.strokeRect(x, y, width, height);

        this.ctx.shadowBlur = 10 * scale;
        this.ctx.shadowColor = color;
        this.ctx.strokeRect(x, y, width, height);
        this.ctx.shadowBlur = 0;

        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = `700 ${fontSize}px 'Roboto Mono', monospace`;
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'middle';

        const text = `${icon} ${label}:`;
        this.ctx.fillText(text, x + padding, y + height * 0.3);

        this.ctx.fillStyle = color;
        this.ctx.font = `700 ${fontSize + Math.round(2 * scale)}px 'Roboto Mono', monospace`;
        this.ctx.fillText(value, x + padding, y + height * 0.7);
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

        // 2. Health Bar Background (Empty)
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

        // 8. Preview Label
        const previewFontSize = Math.max(6, Math.round(8 * scale));
        this.ctx.font = `italic ${previewFontSize}px "Roboto Mono", monospace`;
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.fillText('PREVIEW', x + 3, y + 8);
    }

    draw() {
        if (gameState.showGallery) {
            this.drawGallery();
        } else if (gameState.showAbout) {
            this.drawAboutScreen();
        } else if (gameState.showLobby) {
            this.drawLobby();
        } else if (gameState.showCoopLobby) {
            this.drawCoopLobby();
        } else if (gameState.showAILobby) {
            this.drawAILobby();
        } else if (this.mainMenu) {
            // Auto-refresh leaderboard when on main menu (throttled)
            const now = Date.now();
            if (now - this.leaderboardLastFetch >= this.leaderboardFetchInterval) {
                this.fetchLeaderboard();
            }
            this.drawMainMenu();
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
                this.drawGameOver();
            }

            if (this.paused) {
                this.drawPauseMenu();
            }

            if (gameState.showLevelUp) {
                this.drawLevelUpScreen();
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

        // Draw centralized multiplier indicator at top center (if active)
        if (player.scoreMultiplier > 1.0) {
            const centerX = this.canvas.width / 2;
            const multiplierY = this.padding + webgpuHeight + webgpuSpacing;
            this.drawMultiplierIndicator(player, centerX, multiplierY);
        }

        this.drawPlayerStats(player, startX, startY);

        // Draw shared stats below player stats for single player
        // Health and Shield only now (removed Ammo/Grenades)
        const statHeight = 50 * scale;
        startY += (statHeight + itemSpacing) * 2 + itemSpacing; // Health + Shield (or just Health if no shield)
        const finalY = this.drawSharedStats(startX, startY);
        
        // Calculate bottom UI positions (above instructions)
        // Instructions start at canvas.height - 55 * scale, with 80 * scale height
        // So instructions box top is at canvas.height - 55 * scale - 30 * scale = canvas.height - 85 * scale
        const instructionsTop = this.canvas.height - (85 * scale);
        const bottomSpacing = 15 * scale;
        const bottomUIBaseline = instructionsTop - bottomSpacing;
        
        const bottomWidth = 160 * scale;
        const xpBarWidth = 240 * scale; // Wider XP bar
        const bottomHeight = 50 * scale; // XP bar height
        const weaponInfoHeight = (bottomHeight + itemSpacing) * 2; // Weapon + Grenades
        
        // Top right: Active Skills (moved from bottom left)
        const hpBarHeight = 50 * scale;
        const skillsSpacing = 10 * scale;
        const skillsX = this.canvas.width - bottomWidth - this.padding;
        const skillCount = gameState.activeSkills?.length || 0;
        const skillHeight = 40 * scale;
        const skillsY = this.padding + webgpuHeight + webgpuSpacing + hpBarHeight + skillsSpacing;
        this.drawActiveSkills(skillsX, skillsY, bottomWidth);
        
        // Bottom middle: XP Bar
        const xpBarX = this.canvas.width / 2 - (xpBarWidth / 2);
        const xpBarY = bottomUIBaseline - bottomHeight;
        this.drawXPBar(xpBarX, xpBarY, xpBarWidth);
        
        // Bottom right: Weapon Info
        const weaponX = this.canvas.width - bottomWidth - this.padding;
        const weaponY = bottomUIBaseline - weaponInfoHeight;
        this.drawWeaponInfo(player, weaponX, weaponY, bottomWidth);

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
        const instructionsTop = this.canvas.height - (85 * scale);
        const bottomSpacing = 15 * scale;
        const bottomUIBaseline = instructionsTop - bottomSpacing;
        
        const bottomWidth = 160 * scale;
        const xpBarWidth = 320 * scale; // Wider XP bar (increased from 240)
        const bottomHeight = 50 * scale; // XP bar height
        const weaponInfoHeight = (bottomHeight + itemSpacing) * 2; // Weapon + Grenades
        
        // Top right: Active Skills (moved from bottom left)
        const hpBarHeight = 50 * scale;
        const skillsSpacing = 10 * scale;
        const skillsX = this.canvas.width - bottomWidth - padding;
        const skillCount = gameState.activeSkills?.length || 0;
        const skillHeight = 40 * scale;
        const skillsY = padding + webgpuHeight + webgpuSpacing + hpBarHeight + skillsSpacing;
        this.drawActiveSkills(skillsX, skillsY, bottomWidth);
        
        // XP Bar at very bottom (above instructions)
        const xpBarX = this.canvas.width / 2 - (xpBarWidth / 2);
        const xpBarY = this.canvas.height - (85 * scale) - bottomHeight; // Positioned just above instructions
        this.drawXPBar(xpBarX, xpBarY, xpBarWidth);
        
        // Bottom right: Weapon Info (for local player)
        if (localPlayer) {
            const weaponX = this.canvas.width - bottomWidth - padding;
            const weaponY = bottomUIBaseline - weaponInfoHeight;
            this.drawWeaponInfo(localPlayer, weaponX, weaponY, bottomWidth);
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

        // Wave
        // Draw Boss Health Bar if active
        if (gameState.bossActive) {
            this.bossHealthBar.draw(this.ctx);
        }

        this.drawStat('WAVE', gameState.wave, '🌊', '#ffc107', x, currentY, width);
        currentY += height + itemSpacing;

        // Kills
        this.drawStat('Kills', gameState.zombiesKilled, '💀', '#76ff03', x, currentY, width);
        currentY += height + itemSpacing;

        // Remaining
        const remainingZombies = gameState.zombies.length;
        const totalZombies = gameState.zombiesPerWave;
        const waveProgressText = `${remainingZombies}/${totalZombies}`;
        const waveProgressColor = remainingZombies <= totalZombies * 0.3 ? '#76ff03' : '#ffc107';
        this.drawStat('Left', waveProgressText, '🧟', waveProgressColor, x, currentY, width);

        if (!gameState.isCoop) {
            currentY += height + itemSpacing;
            this.drawStat('Score', gameState.score, '🏆', '#ffd700', x, currentY, width);

            // Multiplier indicator removed - now drawn centrally at top
        }

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
        const height = 50 * scale;
        const padding = 10 * scale;
        const fontSize = this.getScaledFontSize();
        
        // Calculate XP progress
        const xpProgress = Math.min(1, gameState.xp / gameState.nextLevelXP);
        
        // Background with glow
        const bgGradient = this.ctx.createLinearGradient(x, y, x, y + height);
        bgGradient.addColorStop(0, 'rgba(42, 42, 42, 0.85)');
        bgGradient.addColorStop(1, 'rgba(26, 26, 26, 0.85)');

        this.ctx.fillStyle = bgGradient;
        this.ctx.fillRect(x, y, width, height);

        // XP progress bar background
        const barPadding = 4 * scale;
        const barWidth = width - (barPadding * 2);
        const barHeight = 8 * scale;
        const barX = x + barPadding;
        const barY = y + height - barHeight - 8 * scale;

        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.fillRect(barX, barY, barWidth, barHeight);

        // XP progress bar fill
        const fillWidth = Math.max(0, barWidth * xpProgress);
        const xpGradient = this.ctx.createLinearGradient(barX, barY, barX + fillWidth, barY);
        xpGradient.addColorStop(0, '#4caf50');
        xpGradient.addColorStop(1, '#2e7d32');

        this.ctx.fillStyle = xpGradient;
        this.ctx.shadowBlur = 10 * scale;
        this.ctx.shadowColor = '#4caf50';
        this.ctx.fillRect(barX, barY, fillWidth, barHeight);
        this.ctx.shadowBlur = 0;

        // Border
        const xpColor = '#4caf50';
        this.ctx.strokeStyle = xpColor;
        this.ctx.lineWidth = 2 * scale;
        this.ctx.strokeRect(x, y, width, height);

        this.ctx.shadowBlur = 10 * scale;
        this.ctx.shadowColor = xpColor;
        this.ctx.strokeRect(x, y, width, height);
        this.ctx.shadowBlur = 0;

        // Text: Level and XP
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = `700 ${fontSize}px 'Roboto Mono', monospace`;
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'middle';

        const levelText = `⭐ Level ${gameState.level}`;
        this.ctx.fillText(levelText, x + padding, y + height * 0.3);

        const xpText = `${gameState.xp}/${gameState.nextLevelXP} XP`;
        this.ctx.textAlign = 'right';
        this.ctx.fillText(xpText, x + width - padding, y + height * 0.3);
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

        // Ammo/Weapon display
        let ammoColor;
        if (player.isReloading) {
            ammoColor = '#ff9800';
        } else if (player.currentAmmo === 0) {
            ammoColor = '#ff5722';
        } else if (player.currentAmmo <= player.maxAmmo * LOW_AMMO_FRACTION) {
            const t = Date.now() / 200;
            const pulse = 0.5 + 0.5 * Math.sin(t);
            ammoColor = pulse > 0.5 ? '#ff0000' : '#ff4444';
        } else {
            ammoColor = '#ff9800';
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
        const lineY = this.canvas.height - (55 * scale);

        // Semi-transparent background for readability (adjusted for 3 lines)
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        const bgPadding = 20 * scale;
        const bgHeight = 80 * scale; // Increased for 3 lines
        this.ctx.fillRect(this.canvas.width / 2 - textWidth / 2 - bgPadding, lineY - (30 * scale), textWidth + bgPadding * 2, bgHeight);

        // Divider lines
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(this.canvas.width / 2 - textWidth / 2, lineY);
        this.ctx.lineTo(this.canvas.width / 2 + textWidth / 2, lineY);
        this.ctx.stroke();
        this.ctx.beginPath();
        this.ctx.moveTo(this.canvas.width / 2 - textWidth / 2, lineY + 24);
        this.ctx.lineTo(this.canvas.width / 2 + textWidth / 2, lineY + 24);
        this.ctx.stroke();

        this.ctx.fillStyle = 'rgba(200, 200, 200, 0.9)';
        this.ctx.fillText(line1, this.canvas.width / 2, lineY - 8);
        this.ctx.fillText(line2, this.canvas.width / 2, lineY + 16);
        this.ctx.fillText(line3, this.canvas.width / 2, lineY + 40);
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

    drawAILobby() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        const scale = this.getUIScale();
        // Title - scaled
        const aiTitleFontSize = Math.max(36, 48 * scale);
        this.ctx.font = `bold ${aiTitleFontSize}px "Creepster", cursive`;
        this.ctx.textAlign = 'center';
        this.ctx.fillStyle = '#ff1744';
        this.ctx.shadowBlur = 20 * scale;
        this.ctx.shadowColor = 'rgba(255, 23, 68, 0.8)';
        this.ctx.fillText('AI SQUAD', this.canvas.width / 2, 100);
        this.ctx.shadowBlur = 0;

        const centerX = this.canvas.width / 2;
        const panelWidth = 400;
        const panelHeight = 300;
        const panelX = centerX - panelWidth / 2;
        const panelY = 180;

        // Player list panel
        this.ctx.fillStyle = 'rgba(15, 15, 20, 0.9)';
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.lineWidth = 2;
        this.ctx.fillRect(panelX, panelY, panelWidth, panelHeight);
        this.ctx.strokeRect(panelX, panelY, panelWidth, panelHeight);

        // Squad Members title - scaled (scale already defined at start of method)
        const squadTitleFontSize = Math.max(16, 20 * scale);
        this.ctx.font = `${squadTitleFontSize}px "Roboto Mono", monospace`;
        this.ctx.textAlign = 'left';
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillText('Squad Members', panelX + 20, panelY + 35);

        // List players - scaled
        const playerListFontSize = Math.max(12, 16 * scale);
        this.ctx.font = `${playerListFontSize}px "Roboto Mono", monospace`;
        gameState.players.forEach((player, index) => {
            const y = panelY + 70 + index * 35;
            const isPlayer = index === 0;
            const isAI = player.inputSource === 'ai';

            if (isPlayer) {
                this.ctx.fillStyle = '#66b3ff';
                this.ctx.fillText(`1. ${gameState.username || 'Player'} (You)`, panelX + 20, y);
            } else if (isAI) {
                this.ctx.fillStyle = '#76ff03';
                const botName = `Bot ${index}`;
                this.ctx.fillText(`${index + 1}. ${botName} [AI]`, panelX + 20, y);
            } else {
                this.ctx.fillStyle = '#cccccc';
                this.ctx.fillText(`${index + 1}. Player ${index + 1}`, panelX + 20, y);
            }
        });

        // Buttons (scale already defined at start of method)
        const buttonWidth = 200 * scale;
        const buttonHeight = 50 * scale;
        const buttonY = this.canvas.height - (150 * scale);
        const addBotY = buttonY - (70 * scale);
        const startY = buttonY;

        const addBotHovered = this.hoveredButton === 'ai_add';
        const startHovered = this.hoveredButton === 'ai_start';
        const backHovered = this.hoveredButton === 'ai_back';

        // Max 4 players total (P1 + 3 bots)
        const canAddBot = gameState.players.length < 4;
        const addBotText = canAddBot ? 'Add Bot' : 'Max Players (4)';
        this.drawMenuButton(addBotText, centerX - buttonWidth / 2, addBotY, buttonWidth, buttonHeight, addBotHovered, !canAddBot);

        const canStart = gameState.players.length > 1;
        this.drawMenuButton('Start Game', centerX - buttonWidth / 2, startY, buttonWidth, buttonHeight, startHovered, !canStart);
        this.drawMenuButton('Back', centerX - buttonWidth / 2, buttonY + 70, buttonWidth, buttonHeight, backHovered, false);
    }

    drawCoopLobby() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        const scale = this.getUIScale();
        const titleFontSize = Math.max(32, 48 * scale);
        this.ctx.font = `bold ${titleFontSize}px "Creepster", cursive`;
        this.ctx.textAlign = 'center';
        this.ctx.fillStyle = '#ff1744';
        this.ctx.shadowBlur = 20 * scale;
        this.ctx.shadowColor = 'rgba(255, 23, 68, 0.8)';
        this.ctx.fillText('LOCAL CO-OP (UP TO 4 PLAYERS)', this.canvas.width / 2, 80 * scale);
        this.ctx.shadowBlur = 0;

        // 2x2 grid layout for 4 player slots
        const slotWidth = 350 * scale;
        const slotHeight = 150 * scale;
        const spacing = 30 * scale;
        const gridWidth = slotWidth * 2 + spacing;
        const gridHeight = slotHeight * 2 + spacing;
        const startX = (this.canvas.width - gridWidth) / 2;
        const startY = 150 * scale;

        const playerColors = ['#66b3ff', '#ff6666', '#66ff66', '#ffaa66'];
        const playerLabels = ['Player 1', 'Player 2', 'Player 3', 'Player 4'];

        // Draw 4 player slots in 2x2 grid
        for (let i = 0; i < 4; i++) {
            const col = i % 2;
            const row = Math.floor(i / 2);
            const x = startX + col * (slotWidth + spacing);
            const y = startY + row * (slotHeight + spacing);

            const player = gameState.players[i];

            // Slot background
            this.ctx.fillStyle = 'rgba(15, 15, 20, 0.8)';
            this.ctx.fillRect(x, y, slotWidth, slotHeight);
            this.ctx.strokeStyle = player ? playerColors[i] : 'rgba(255, 255, 255, 0.2)';
            this.ctx.lineWidth = 2 * scale;
            this.ctx.strokeRect(x, y, slotWidth, slotHeight);

            // Player label
            const labelFontSize = Math.max(16, 24 * scale);
            this.ctx.font = `${labelFontSize}px "Roboto Mono", monospace`;
            this.ctx.textAlign = 'center';
            this.ctx.fillStyle = playerColors[i];
            this.ctx.fillText(playerLabels[i], x + slotWidth / 2, y + 30 * scale);

            // Player status
            const statusFontSize = Math.max(11, 16 * scale);
            this.ctx.font = `${statusFontSize}px "Roboto Mono", monospace`;

            if (player) {
                // Player joined
                const controls = player.inputSource === 'mouse' ? 'WASD + Mouse' :
                    (player.inputSource === 'gamepad' ? `Gamepad ${player.gamepadIndex + 1}` : 'Keyboard');
                this.ctx.fillStyle = '#cccccc';
                this.ctx.fillText(`Controls: ${controls}`, x + slotWidth / 2, y + 70 * scale);
                this.ctx.fillStyle = '#76ff03';
                this.ctx.fillText('✓ Ready', x + slotWidth / 2, y + 100 * scale);

                if (i > 0) {
                    this.ctx.fillStyle = '#888888';
                    const hintFontSize = Math.max(9, 12 * scale);
                    this.ctx.font = `${hintFontSize}px "Roboto Mono", monospace`;
                    this.ctx.fillText('(Press Back/B to Leave)', x + slotWidth / 2, y + 125 * scale);
                }
            } else {
                // Empty slot
                this.ctx.fillStyle = '#888888';
                this.ctx.fillText('Press A/Enter to Join', x + slotWidth / 2, y + 70 * scale);
                const hintFontSize2 = Math.max(10, 14 * scale);
                this.ctx.font = `${hintFontSize2}px "Roboto Mono", monospace`;
                this.ctx.fillText('(Any Gamepad or Keyboard)', x + slotWidth / 2, y + 100 * scale);
            }
        }

        // Start Button
        const buttonWidth = 200;
        const buttonHeight = 50;
        const centerX = this.canvas.width / 2;
        const buttonY = this.canvas.height - 100;

        const startHovered = this.hoveredButton === 'coop_start';
        const backHovered = this.hoveredButton === 'coop_back';

        // Require at least 2 players to start
        const canStart = gameState.players.length > 1;

        this.drawMenuButton('Start Game', centerX - buttonWidth / 2, buttonY - 70, buttonWidth, buttonHeight, startHovered, !canStart);
        this.drawMenuButton('Back', centerX - buttonWidth / 2, buttonY, buttonWidth, buttonHeight, backHovered, false);
    }

    drawGameOver() {
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

        // Quick Stats Display (V0.7.1)
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
            this.drawMenuButton('Back to Lobby', centerX - buttonWidth / 2, lobbyButtonY, buttonWidth, buttonHeight, lobbyHovered, false);
            buttonY = this.canvas.height - 60 * scale;
        }
        
        // "Back to Main Menu" button (always show)
        const menuButtonY = buttonY;
        const menuHovered = this.hoveredButton === 'gameover_menu';
        this.drawMenuButton('Back to Main Menu', centerX - buttonWidth / 2, menuButtonY, buttonWidth, buttonHeight, menuHovered, false);
    }

    drawPauseMenu() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        const scale = this.getUIScale();
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;

        // PAUSED title
        const titleFontSize = Math.max(32, 48 * scale);
        this.ctx.font = `${titleFontSize}px "Creepster", cursive`;
        this.ctx.textAlign = 'center';
        this.ctx.fillStyle = '#ff0000';
        this.ctx.shadowBlur = 20;
        this.ctx.shadowColor = 'rgba(255, 0, 0, 0.8)';
        this.ctx.fillText('PAUSED', centerX, centerY - 120 * scale);
        this.ctx.shadowBlur = 0;

        // Subtitle
        const subtitleFontSize = Math.max(14, 20 * scale);
        this.ctx.font = `${subtitleFontSize}px "Roboto Mono", monospace`;
        this.ctx.fillStyle = '#cccccc';
        this.ctx.fillText('Game is currently paused', centerX, centerY - 60 * scale);

        // Buttons
        const buttonWidth = 180 * scale;
        const buttonHeight = 36 * scale;
        const buttonSpacing = 15 * scale;
        const buttonStartY = centerY;

        // Calculate button positions
        const resumeY = buttonStartY;
        const restartY = buttonStartY + (buttonHeight + buttonSpacing);
        const settingsY = buttonStartY + (buttonHeight + buttonSpacing) * 2;
        const menuY = buttonStartY + (buttonHeight + buttonSpacing) * 3;

        // Draw buttons
        this.drawMenuButton('Resume', centerX - buttonWidth / 2, resumeY - buttonHeight / 2, buttonWidth, buttonHeight, this.hoveredButton === 'pause_resume', false);
        this.drawMenuButton('Restart', centerX - buttonWidth / 2, restartY - buttonHeight / 2, buttonWidth, buttonHeight, this.hoveredButton === 'pause_restart', false);
        this.drawMenuButton('Settings', centerX - buttonWidth / 2, settingsY - buttonHeight / 2, buttonWidth, buttonHeight, this.hoveredButton === 'pause_settings', false);
        this.drawMenuButton('Return to Menu', centerX - buttonWidth / 2, menuY - buttonHeight / 2, buttonWidth, buttonHeight, this.hoveredButton === 'pause_menu', false);
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

    showGameOver(scoreText) {
        this.gameOver = true;
        this.finalScore = scoreText;

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

    drawMainMenu() {
        this.drawCreepyBackground();

        const scale = this.getUIScale();

        // Main title - scaled
        const titleFontSize = Math.max(32, 40 * scale);
        this.ctx.font = `bold ${titleFontSize}px "Creepster", cursive`;
        this.ctx.textAlign = 'center';
        this.ctx.fillStyle = '#ff1744';
        this.ctx.shadowBlur = 30 * scale;
        this.ctx.shadowColor = 'rgba(255, 23, 68, 0.8)';
        this.ctx.fillText('ZOMBOBS - ZOMBIE APOCALYPSE WITH FRIENDS', this.canvas.width / 2, this.canvas.height / 2 - 200);
        this.ctx.shadowBlur = 0;

        // Subtitle - scaled
        const subtitleFontSize = Math.max(14, 18 * scale);
        this.ctx.font = `${subtitleFontSize}px "Roboto Mono", monospace`;
        this.ctx.fillStyle = '#9e9e9e';
        this.ctx.fillText('Survive the Horde', this.canvas.width / 2, this.canvas.height / 2 - 150);

        // Music Tip - Only show if audio hasn't been initialized yet
        if (!isAudioInitialized()) {
            const centerY = this.canvas.height / 2;
            const musicTipY = centerY - 80;
            const musicTipFontSize = Math.max(11, 14 * scale);
            this.ctx.font = `${musicTipFontSize}px "Roboto Mono", monospace`;
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            this.ctx.shadowBlur = 8 * scale;
            this.ctx.shadowColor = 'rgba(255, 23, 68, 0.6)';
            this.ctx.fillText('🎵 Click anywhere to enable audio', this.canvas.width / 2, musicTipY);
            this.ctx.shadowBlur = 0;
        }
        const buttonWidth = 180 * scale;  // Reduced from 200
        const buttonHeight = 36 * scale;  // Reduced from 40
        const buttonSpacing = 15 * scale;
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;

        // Modern Username Box - Moved to top of window
        const usernameY = 30 * scale + 25 * scale; // Top padding + half box height
        const usernameHovered = this.hoveredButton === 'username';
        const usernameBoxWidth = 320 * scale;
        const usernameBoxHeight = 50 * scale;
        const usernameBoxX = centerX - usernameBoxWidth / 2;
        const usernameBoxY = 30 * scale; // Top of window with padding
        const cornerRadius = 12 * scale;
        
        // Draw username box background with gradient effect
        this.ctx.save();
        
        // Outer glow on hover
        if (usernameHovered) {
            this.ctx.shadowBlur = 20 * scale;
            this.ctx.shadowColor = 'rgba(255, 152, 0, 0.6)';
        } else {
            this.ctx.shadowBlur = 8 * scale;
            this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        }
        
        // Draw rounded rectangle background
        this.ctx.beginPath();
        this.ctx.roundRect(usernameBoxX, usernameBoxY, usernameBoxWidth, usernameBoxHeight, cornerRadius);
        this.ctx.closePath();
        
        // Background gradient
        const gradient = this.ctx.createLinearGradient(usernameBoxX, usernameBoxY, usernameBoxX, usernameBoxY + usernameBoxHeight);
        if (usernameHovered) {
            gradient.addColorStop(0, 'rgba(30, 30, 30, 0.95)');
            gradient.addColorStop(1, 'rgba(20, 20, 20, 0.95)');
        } else {
            gradient.addColorStop(0, 'rgba(25, 25, 25, 0.9)');
            gradient.addColorStop(1, 'rgba(15, 15, 15, 0.9)');
        }
        this.ctx.fillStyle = gradient;
        this.ctx.fill();
        
        // Border
        this.ctx.shadowBlur = 0;
        this.ctx.strokeStyle = usernameHovered ? '#ff9800' : '#555555';
        this.ctx.lineWidth = 2 * scale;
        this.ctx.stroke();
        
        // Inner highlight
        this.ctx.beginPath();
        this.ctx.roundRect(usernameBoxX + 1 * scale, usernameBoxY + 1 * scale, usernameBoxWidth - 2 * scale, usernameBoxHeight / 2, cornerRadius - 1);
        this.ctx.closePath();
        this.ctx.fillStyle = usernameHovered ? 'rgba(255, 152, 0, 0.1)' : 'rgba(255, 255, 255, 0.05)';
        this.ctx.fill();
        
        this.ctx.restore();
        
        // Username text
        const fontSize = Math.max(16, Math.round(18 * scale));
        this.ctx.font = `bold ${fontSize}px "Roboto Mono", monospace`;
        this.ctx.fillStyle = usernameHovered ? '#ff9800' : '#e0e0e0';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        // Text shadow for better readability
        this.ctx.shadowBlur = 4 * scale;
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillText(gameState.username || 'Survivor', centerX, usernameY);
        this.ctx.shadowBlur = 0;
        
        // Hint text below box when hovered
        if (usernameHovered) {
            const hintFontSize = Math.max(10, Math.round(12 * scale));
            this.ctx.font = `${hintFontSize}px "Roboto Mono", monospace`;
            this.ctx.fillStyle = '#ff9800';
            this.ctx.textBaseline = 'top';
            this.ctx.shadowBlur = 6 * scale;
            this.ctx.shadowColor = 'rgba(255, 152, 0, 0.5)';
            this.ctx.fillText('Click to change name', centerX, usernameY + usernameBoxHeight / 2 + (10 * scale));
            this.ctx.shadowBlur = 0;
        }

        // 2x4 Grid Layout: 2 columns, 4 rows
        const columnSpacing = 20 * scale;
        const buttonStartY = centerY - (30 * scale);
        const leftColumnX = centerX - buttonWidth - columnSpacing / 2;
        const rightColumnX = centerX + columnSpacing / 2;

        // Row positions
        const row1Y = buttonStartY;
        const row2Y = buttonStartY + (buttonHeight + buttonSpacing);
        const row3Y = buttonStartY + (buttonHeight + buttonSpacing) * 2;
        const row4Y = buttonStartY + (buttonHeight + buttonSpacing) * 3;
        const row5Y = buttonStartY + (buttonHeight + buttonSpacing) * 4;

        // Row 1: Arcade (left), Campaign (right)
        this.drawMenuButton('Arcade', leftColumnX, row1Y - buttonHeight / 2, buttonWidth, buttonHeight, this.hoveredButton === 'single', false);
        this.drawMenuButton('Campaign', rightColumnX, row1Y - buttonHeight / 2, buttonWidth, buttonHeight, this.hoveredButton === 'campaign', false);

        // Row 2: Local Co-op (left), Play with AI (right)
        this.drawMenuButton('Local Co-op', leftColumnX, row2Y - buttonHeight / 2, buttonWidth, buttonHeight, this.hoveredButton === 'local_coop', false);
        this.drawMenuButton('Play with AI', rightColumnX, row2Y - buttonHeight / 2, buttonWidth, buttonHeight, this.hoveredButton === 'play_ai', false);

        // Row 3: Settings (left), Multiplayer (right)
        this.drawMenuButton('Settings', leftColumnX, row3Y - buttonHeight / 2, buttonWidth, buttonHeight, this.hoveredButton === 'settings', false);
        this.drawMenuButton('Multiplayer', rightColumnX, row3Y - buttonHeight / 2, buttonWidth, buttonHeight, this.hoveredButton === 'multiplayer', false);

        // Row 4: Gallery (centered)
        this.drawMenuButton('Gallery', centerX - buttonWidth / 2, row4Y - buttonHeight / 2, buttonWidth, buttonHeight, this.hoveredButton === 'gallery', false);

        // Row 5: Profile (left), Achievements (right)
        this.drawMenuButton('Profile', leftColumnX, row5Y - buttonHeight / 2, buttonWidth, buttonHeight, this.hoveredButton === 'profile', false);
        this.drawMenuButton('Achievements', rightColumnX, row5Y - buttonHeight / 2, buttonWidth, buttonHeight, this.hoveredButton === 'achievements', false);

        // Row 6: Battlepass (left), About (right)
        const row6Y = buttonStartY + (buttonHeight + buttonSpacing) * 5;
        this.drawMenuButton('Battlepass', leftColumnX, row6Y - buttonHeight / 2, buttonWidth, buttonHeight, this.hoveredButton === 'battlepass', false);
        this.drawMenuButton('About', rightColumnX, row6Y - buttonHeight / 2, buttonWidth, buttonHeight, this.hoveredButton === 'about', false);

        // Draw rank badge next to username
        this.drawRankBadge();

        // Global Leaderboard
        this.drawLeaderboard();

        // Local Highscores (last 2 runs)
        this.drawLocalHighscores();
        
        // Local Leaderboard (top scores)
        this.drawLocalLeaderboard();

        // Display all-time best multiplier - scaled
        if (gameState.allTimeMaxMultiplier > 1.0) {
            const highScoreFontSize = Math.max(10, 12 * scale);
            this.ctx.fillStyle = 'rgba(255, 215, 0, 0.7)';
            this.ctx.font = `${highScoreFontSize}px "Roboto Mono", monospace`;
            this.ctx.textAlign = 'center';
            this.ctx.fillText(`Best Multiplier: ${gameState.allTimeMaxMultiplier}x`, centerX, this.canvas.height - 60);
        }

        // Draw mute button in bottom right
        const muteButtonSize = 40;
        const muteButtonX = this.canvas.width - 60;
        const muteButtonY = this.canvas.height - 60;
        const muteButtonHovered = this.hoveredButton === 'mute_music';

        // Draw button background
        const bgColor = muteButtonHovered ? '#ff1744' : '#1a1a1a';
        const borderColor = muteButtonHovered ? '#ff5252' : '#ff1744';

        const bgGradient = this.ctx.createLinearGradient(muteButtonX, muteButtonY, muteButtonX, muteButtonY + muteButtonSize);
        bgGradient.addColorStop(0, muteButtonHovered ? 'rgba(255, 23, 68, 0.3)' : 'rgba(26, 26, 26, 0.9)');
        bgGradient.addColorStop(1, muteButtonHovered ? 'rgba(255, 23, 68, 0.2)' : 'rgba(10, 10, 10, 0.9)');

        this.ctx.fillStyle = bgGradient;
        this.ctx.fillRect(muteButtonX, muteButtonY, muteButtonSize, muteButtonSize);

        this.ctx.strokeStyle = borderColor;
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(muteButtonX, muteButtonY, muteButtonSize, muteButtonSize);

        if (muteButtonHovered) {
            this.ctx.shadowBlur = 20;
            this.ctx.shadowColor = 'rgba(255, 23, 68, 0.6)';
            this.ctx.strokeRect(muteButtonX, muteButtonY, muteButtonSize, muteButtonSize);
            this.ctx.shadowBlur = 0;
        }

        // Draw speaker icon - scaled
        this.ctx.fillStyle = '#ffffff';
        const speakerIconSize = Math.max(18, 24 * scale);
        this.ctx.font = `${speakerIconSize}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        const icon = gameState.menuMusicMuted ? '🔇' : '🔊';
        this.ctx.fillText(icon, muteButtonX + muteButtonSize / 2, muteButtonY + muteButtonSize / 2);

        // Draw version box
        this.drawVersionBox();

        // Draw technology branding in bottom-left
        this.drawTechnologyBranding();

        // Draw news ticker at bottom (after other elements to appear on top)
        this.drawNewsTicker();
    }

    drawRankBadge() {
        // Check if rank badge should be shown
        const showRankBadge = settingsManager.getSetting('video', 'showRankBadge') !== false;
        if (!showRankBadge) return;
        
        const scale = this.getUIScale();
        const centerX = this.canvas.width / 2;
        // Draw rank badge to the right of username (username is now at top)
        const usernameY = 30 * scale + 25 * scale; // Top padding + half box height
        const usernameBoxWidth = 320 * scale;
        
        // Draw rank badge to the right of username box
        const badgeX = centerX + usernameBoxWidth / 2 + 20 * scale;
        const badgeY = 30 * scale + 25 * scale - 25 * scale; // Aligned with username box center
        this.rankDisplay.drawRankBadge(badgeX, badgeY, 50 * scale);
    }

    drawLocalHighscores() {
        const scale = this.getUIScale();
        const lastRuns = getLastRuns(1); // Only show the last run on left side
        
        if (lastRuns.length === 0) {
            // No runs available - show empty state or hide
            return;
        }
        
        const run = lastRuns[0]; // Get the last run
        
        // Card dimensions
        const cardWidth = 200 * scale;
        const cardHeight = 110 * scale;
        const padding = 12 * scale;
        
        // Position on left side of screen
        const cardX = 20 * scale; // Left padding
        const y = 100 * scale; // Below username box area
        
        // Draw glass card
        this.drawGlassCard(cardX, y, cardWidth, cardHeight);
        
        // Header
        const headerFontSize = Math.max(10, 11 * scale);
        this.ctx.font = `bold ${headerFontSize}px "Roboto Mono", monospace`;
        this.ctx.fillStyle = '#ff9800';
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'top';
        this.ctx.fillText('Last Run', cardX + padding, y + padding);
        
        // Score (large, prominent)
        const scoreFontSize = Math.max(18, 22 * scale);
        this.ctx.font = `bold ${scoreFontSize}px "Roboto Mono", monospace`;
        this.ctx.fillStyle = '#ffffff';
        const scoreText = (run.score || 0).toLocaleString();
        this.ctx.fillText(scoreText, cardX + padding, y + padding + 18 * scale);
        
        // Stats (wave, kills, time)
        const statFontSize = Math.max(9, 10 * scale);
        this.ctx.font = `${statFontSize}px "Roboto Mono", monospace`;
        this.ctx.fillStyle = '#9e9e9e';
        let statY = y + padding + 45 * scale;
        
        // Wave
        this.ctx.fillText(`Wave: ${run.wave || 0}`, cardX + padding, statY);
        statY += 14 * scale;
        
        // Kills
        this.ctx.fillText(`Kills: ${run.kills || 0}`, cardX + padding, statY);
        statY += 14 * scale;
        
        // Time
        const timeText = formatTime(run.timeSurvived || 0);
        this.ctx.fillText(`Time: ${timeText}`, cardX + padding, statY);
    }

    drawLocalLeaderboard() {
        const scale = this.getUIScale();
        const scoreboard = loadScoreboard();
        
        // Card dimensions
        const cardWidth = 200 * scale;
        const maxHeight = 400 * scale; // Max height for scrollable content
        const padding = 12 * scale;
        const entryHeight = 70 * scale;
        const entryPadding = 8 * scale;
        
        // Position below Last Run box
        const cardX = 20 * scale; // Same X as Last Run
        const y = 220 * scale; // Below Last Run (100 + 110 + 10 gap)
        
        // Calculate actual height based on entries (max 5 visible entries)
        const visibleEntries = Math.min(scoreboard.length, 5);
        const cardHeight = scoreboard.length === 0 
            ? 80 * scale 
            : Math.min(visibleEntries * entryHeight + padding * 2 + 20 * scale, maxHeight);
        
        // Draw glass card
        this.drawGlassCard(cardX, y, cardWidth, cardHeight);
        
        // Header
        const headerFontSize = Math.max(10, 11 * scale);
        this.ctx.font = `bold ${headerFontSize}px "Roboto Mono", monospace`;
        this.ctx.fillStyle = '#ff9800';
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'top';
        this.ctx.fillText('Local Best', cardX + padding, y + padding);
        
        // Subtitle
        const subtitleFontSize = Math.max(8, 9 * scale);
        this.ctx.font = `${subtitleFontSize}px "Roboto Mono", monospace`;
        this.ctx.fillStyle = '#9e9e9e';
        this.ctx.fillText('Top Scores', cardX + padding, y + padding + 14 * scale);
        
        if (scoreboard.length === 0) {
            // Empty state
            const emptyFontSize = Math.max(9, 10 * scale);
            this.ctx.font = `${emptyFontSize}px "Roboto Mono", monospace`;
            this.ctx.fillStyle = '#9e9e9e';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('No scores yet', cardX + cardWidth / 2, y + padding + 40 * scale);
            this.ctx.fillText('Play to set records!', cardX + cardWidth / 2, y + padding + 55 * scale);
            return;
        }
        
        // Draw entries (show top 5)
        const entriesToShow = Math.min(scoreboard.length, 5);
        let entryY = y + padding + 28 * scale;
        
        for (let i = 0; i < entriesToShow; i++) {
            const entry = scoreboard[i];
            const rank = i + 1;
            
            // Entry background
            const entryBgY = entryY - entryPadding;
            const entryBgHeight = entryHeight - entryPadding * 2;
            
            // Rank-based colors
            let bgColor, borderColor, rankColor;
            if (rank === 1) {
                bgColor = 'rgba(255, 215, 0, 0.15)';
                borderColor = 'rgba(255, 215, 0, 0.3)';
                rankColor = '#ffd700';
            } else if (rank === 2) {
                bgColor = 'rgba(192, 192, 192, 0.12)';
                borderColor = 'rgba(192, 192, 192, 0.25)';
                rankColor = '#c0c0c0';
            } else if (rank === 3) {
                bgColor = 'rgba(205, 127, 50, 0.12)';
                borderColor = 'rgba(205, 127, 50, 0.25)';
                rankColor = '#cd7f32';
            } else {
                bgColor = 'rgba(255, 255, 255, 0.03)';
                borderColor = 'rgba(255, 255, 255, 0.05)';
                rankColor = '#9e9e9e';
            }
            
            // Draw entry background
            this.ctx.fillStyle = bgColor;
            this.ctx.fillRect(cardX + padding, entryBgY, cardWidth - padding * 2, entryBgHeight);
            
            // Draw entry border
            this.ctx.strokeStyle = borderColor;
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(cardX + padding, entryBgY, cardWidth - padding * 2, entryBgHeight);
            
            // Rank
            const rankFontSize = Math.max(9, 10 * scale);
            this.ctx.font = `bold ${rankFontSize}px "Roboto Mono", monospace`;
            this.ctx.fillStyle = rankColor;
            this.ctx.textAlign = 'left';
            const rankText = rank === 1 ? '🥇 #1' : rank === 2 ? '🥈 #2' : rank === 3 ? '🥉 #3' : `#${rank}`;
            this.ctx.fillText(rankText, cardX + padding + 4 * scale, entryY);
            
            // Score (large, prominent)
            const scoreFontSize = Math.max(12, 14 * scale);
            this.ctx.font = `bold ${scoreFontSize}px "Roboto Mono", monospace`;
            this.ctx.fillStyle = '#ff5252';
            const scoreText = (entry.score || 0).toLocaleString();
            this.ctx.fillText(scoreText, cardX + padding + 4 * scale, entryY + 16 * scale);
            
            // Details (wave, kills, time)
            const detailFontSize = Math.max(8, 9 * scale);
            this.ctx.font = `${detailFontSize}px "Roboto Mono", monospace`;
            this.ctx.fillStyle = '#9e9e9e';
            let detailY = entryY + 32 * scale;
            
            // Wave and Kills on same line
            this.ctx.fillText(`Wave: ${entry.wave || 0}`, cardX + padding + 4 * scale, detailY);
            this.ctx.fillText(`Kills: ${(entry.kills || 0).toLocaleString()}`, cardX + padding + 80 * scale, detailY);
            detailY += 12 * scale;
            
            // Time and Multiplier
            const timeText = formatTime(entry.timeSurvived || 0);
            this.ctx.fillText(`Time: ${timeText}`, cardX + padding + 4 * scale, detailY);
            if (entry.maxMultiplier) {
                this.ctx.fillText(`${entry.maxMultiplier.toFixed(1)}x`, cardX + padding + 80 * scale, detailY);
            }
            
            entryY += entryHeight;
        }
        
        // Show "and X more" if there are more than 5 entries
        if (scoreboard.length > 5) {
            const moreFontSize = Math.max(8, 9 * scale);
            this.ctx.font = `${moreFontSize}px "Roboto Mono", monospace`;
            this.ctx.fillStyle = '#9e9e9e';
            this.ctx.textAlign = 'center';
            const moreText = `+${scoreboard.length - 5} more`;
            this.ctx.fillText(moreText, cardX + cardWidth / 2, entryY - entryPadding);
        }
    }

    drawNewsTicker() {
        const scale = this.getUIScale();
        // Use smaller font size for news ticker to fit more content
        const newsFontSize = Math.max(10, Math.round(11 * scale * 0.85)); // 15% smaller than regular font
        const canvas = this.canvas;
        const ctx = this.ctx;

        // Dimensions
        const boxWidth = 650;  // Increased from 480
        const boxHeight = 28;  // Increased from 24 for better visibility
        const centerX = canvas.width / 2;
        const boxX = centerX - (boxWidth / 2);
        
        // Position at bottom of screen with 10px padding
        const boxY = canvas.height - boxHeight - 10;

        // Store box coordinates for hit detection
        this.newsTickerBoxX = boxX;
        this.newsTickerBoxY = boxY;
        this.newsTickerBoxWidth = boxWidth;
        this.newsTickerBoxHeight = boxHeight;

        // Measure text width for scrolling calculation (using smaller font)
        ctx.font = `${newsFontSize}px "Roboto Mono", monospace`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        const textWidth = ctx.measureText(NEWS_UPDATES).width;
        this.newsTickerTextWidth = textWidth;

        // Calculate automatic scroll offset (stateless animation using Date.now)
        // Scroll speed: divide by 30 for pixel-per-30ms movement (3x slower)
        const scrollSpeed = 30;
        this.newsTickerAutoOffset = (Date.now() / scrollSpeed) % (textWidth + boxWidth);

        // Use manual offset if dragging, otherwise use auto offset
        const scrollOffset = this.newsTickerDragging ? this.newsTickerManualOffset : this.newsTickerAutoOffset;
        const textX = boxX - scrollOffset;

        // Draw background box
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(boxX, boxY, boxWidth, boxHeight);

        // Draw border with amber glow
        ctx.strokeStyle = 'rgba(255, 193, 7, 0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);

        // Clip to box area to prevent text overflow
        ctx.save();
        ctx.beginPath();
        ctx.rect(boxX, boxY, boxWidth, boxHeight);
        ctx.clip();

        // Draw scrolling text (amber/gold color) with smaller font
        ctx.fillStyle = '#ffc107';
        ctx.font = `${newsFontSize}px "Roboto Mono", monospace`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';

        // Draw text twice for seamless loop (when first copy scrolls out, second appears)
        const textY = boxY + boxHeight / 2;
        ctx.fillText(NEWS_UPDATES, textX, textY);
        ctx.fillText(NEWS_UPDATES, textX + textWidth + boxWidth, textY);

        // Restore clipping
        ctx.restore();
    }

    checkNewsTickerHit(x, y) {
        return x >= this.newsTickerBoxX && 
               x <= this.newsTickerBoxX + this.newsTickerBoxWidth &&
               y >= this.newsTickerBoxY && 
               y <= this.newsTickerBoxY + this.newsTickerBoxHeight;
    }

    startNewsTickerDrag(x, y) {
        if (!this.checkNewsTickerHit(x, y)) return false;
        this.newsTickerDragging = true;
        this.newsTickerDragStartX = x;
        this.newsTickerDragStartOffset = this.newsTickerManualOffset || this.newsTickerAutoOffset;
        return true;
    }

    updateNewsTickerDrag(x) {
        if (!this.newsTickerDragging) return;
        const dragDistance = this.newsTickerDragStartX - x;
        const newOffset = this.newsTickerDragStartOffset + dragDistance;
        const maxOffset = this.newsTickerTextWidth + this.newsTickerBoxWidth;
        // Clamp offset to valid range
        this.newsTickerManualOffset = Math.max(0, Math.min(maxOffset, newOffset));
    }

    endNewsTickerDrag() {
        this.newsTickerDragging = false;
        // Reset manual offset to current auto offset to prevent jump when resuming auto-scroll
        // This ensures smooth transition from manual drag back to automatic scrolling
        this.newsTickerManualOffset = this.newsTickerAutoOffset;
    }

    drawVersionBox() {
        const version = "V0.7.2 ALPHA";
        const padding = 15;
        const boxHeight = 24;
        const spacing = 8; // Space between WebGPU icon and version box
        
        // Position next to WebGPU icon (top left)
        const webgpuIconWidth = 75;
        const x = padding + webgpuIconWidth + spacing;
        const y = padding;

        this.ctx.save();
        this.ctx.font = 'bold 12px "Roboto Mono", monospace';
        const textWidth = this.ctx.measureText(version).width;
        const boxWidth = textWidth + 24;

        // Background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(x, y, boxWidth, boxHeight);
        
        // Border
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(x, y, boxWidth, boxHeight);

        // Text
        this.ctx.fillStyle = '#ff1744';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(version, x + boxWidth / 2, y + boxHeight / 2);
        
        this.ctx.restore();
    }

    drawAboutScreen() {
        this.drawCreepyBackground();

        const scale = this.getUIScale();
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;

        // Title - scaled
        const aboutTitleFontSize = Math.max(36, 48 * scale);
        this.ctx.font = `bold ${aboutTitleFontSize}px "Creepster", cursive`;
        this.ctx.textAlign = 'center';
        this.ctx.fillStyle = '#ff1744';
        this.ctx.shadowBlur = 30 * scale;
        this.ctx.shadowColor = 'rgba(255, 23, 68, 0.8)';
        this.ctx.fillText('ABOUT', centerX, centerY - 250);
        this.ctx.shadowBlur = 0;

        // Game Info - scaled
        const gameInfoFontSize = Math.max(16, 20 * scale);
        this.ctx.font = `${gameInfoFontSize}px "Roboto Mono", monospace`;
        this.ctx.fillStyle = '#ffffff';
        this.ctx.textAlign = 'center';

        let y = centerY - 150;
        this.ctx.fillText('ZOMBOBS - ZOMBIE APOCALYPSE WITH FRIENDS', centerX, y);
        y += 40;

        const versionFontSize = Math.max(12, 16 * scale);
        this.ctx.font = `${versionFontSize}px "Roboto Mono", monospace`;
        this.ctx.fillStyle = '#9e9e9e';
        this.ctx.fillText('Version: V0.7.2 ALPHA', centerX, y);
        y += 30;
        
        this.ctx.fillText('Engine: ZOMBS-XFX-NGIN V0.7.2 ALPHA', centerX, y);
        y += 50;

        const descriptionFontSize = Math.max(11, 14 * scale);
        this.ctx.font = `${descriptionFontSize}px "Roboto Mono", monospace`;
        this.ctx.fillStyle = '#cccccc';
        this.ctx.fillText('A fast-paced, top-down zombie survival game', centerX, y);
        y += 25;
        this.ctx.fillText('built with vanilla HTML5 Canvas and JavaScript.', centerX, y);
        y += 50;

        this.ctx.font = `${versionFontSize}px "Roboto Mono", monospace`;
        this.ctx.fillStyle = '#ff9800';
        this.ctx.fillText('Features:', centerX, y);
        y += 30;

        // Features list - scaled
        this.ctx.font = `${descriptionFontSize}px "Roboto Mono", monospace`;
        this.ctx.fillStyle = '#aaaaaa';
        const features = [
            '• Wave-based survival gameplay',
            '• Multiple zombie types and weapons',
            '• Local co-op support (up to 4 players)',
            '• WebGPU rendering with Canvas 2D fallback',
            '• Controller support',
            '• Day/Night cycle system'
        ];
        features.forEach(feature => {
            this.ctx.fillText(feature, centerX, y);
            y += 25;
        });

        // Back button (scale already defined at start of method)
        const buttonWidth = 240 * scale;
        const buttonHeight = 50 * scale;
        const backY = this.canvas.height - (100 * scale);
        this.drawMenuButton('Back', centerX - buttonWidth / 2, backY - buttonHeight / 2, buttonWidth, buttonHeight, this.hoveredButton === 'about_back', false);
    }

    // Helper function to draw zombie icon
    drawZombieIcon(x, y, size, type) {
        const ctx = this.ctx;
        const time = Date.now();
        ctx.save();
        ctx.translate(x, y);

        const radius = size * 0.4;
        
        switch(type) {
            case 'normal':
                // Green zombie
                const normalGradient = ctx.createRadialGradient(-3, -3, 0, 0, 0, radius);
                normalGradient.addColorStop(0, '#9acd32');
                normalGradient.addColorStop(1, '#33691e');
                ctx.fillStyle = normalGradient;
                ctx.beginPath();
                ctx.arc(0, 0, radius, 0, Math.PI * 2);
                ctx.fill();
                // Eyes
                ctx.fillStyle = `rgba(255, 0, 0, ${0.7 + Math.sin(time / 167) * 0.3})`;
                ctx.beginPath();
                ctx.arc(-radius * 0.4, -radius * 0.25, radius * 0.25, 0, Math.PI * 2);
                ctx.arc(radius * 0.4, -radius * 0.25, radius * 0.25, 0, Math.PI * 2);
                ctx.fill();
                break;
            case 'fast':
                // Reddish/orange zombie
                const fastGradient = ctx.createRadialGradient(-3, -3, 0, 0, 0, radius);
                fastGradient.addColorStop(0, '#ff8c42');
                fastGradient.addColorStop(1, '#8b4513');
                ctx.fillStyle = fastGradient;
                ctx.beginPath();
                ctx.arc(0, 0, radius * 0.9, 0, Math.PI * 2);
                ctx.fill();
                // Bright red eyes
                ctx.fillStyle = `rgba(255, 0, 0, ${0.8 + Math.sin(time / 100) * 0.2})`;
                ctx.beginPath();
                ctx.arc(-radius * 0.35, -radius * 0.2, radius * 0.2, 0, Math.PI * 2);
                ctx.arc(radius * 0.35, -radius * 0.2, radius * 0.2, 0, Math.PI * 2);
                ctx.fill();
                break;
            case 'exploding':
                // Orange/yellow pulsing zombie
                const pulse = 0.8 + Math.sin(time / 150) * 0.2;
                const explodeGradient = ctx.createRadialGradient(-3, -3, 0, 0, 0, radius);
                explodeGradient.addColorStop(0, `rgba(255, ${165 + pulse * 50}, 0, 1)`);
                explodeGradient.addColorStop(1, '#ff6600');
                ctx.fillStyle = explodeGradient;
                ctx.beginPath();
                ctx.arc(0, 0, radius, 0, Math.PI * 2);
                ctx.fill();
                // Yellow eyes
                ctx.fillStyle = '#ffeb3b';
                ctx.beginPath();
                ctx.arc(-radius * 0.4, -radius * 0.25, radius * 0.2, 0, Math.PI * 2);
                ctx.arc(radius * 0.4, -radius * 0.25, radius * 0.2, 0, Math.PI * 2);
                ctx.fill();
                break;
            case 'armored':
                // Dark gray with armor plates
                const armorGradient = ctx.createRadialGradient(-3, -3, 0, 0, 0, radius);
                armorGradient.addColorStop(0, '#616161');
                armorGradient.addColorStop(1, '#212121');
                ctx.fillStyle = armorGradient;
                ctx.beginPath();
                ctx.arc(0, 0, radius * 1.1, 0, Math.PI * 2);
                ctx.fill();
                // Armor plates
                ctx.strokeStyle = '#9e9e9e';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(0, -radius * 0.3, radius * 0.3, 0, Math.PI);
                ctx.stroke();
                // Red eyes
                ctx.fillStyle = '#ff1744';
                ctx.beginPath();
                ctx.arc(-radius * 0.4, -radius * 0.25, radius * 0.2, 0, Math.PI * 2);
                ctx.arc(radius * 0.4, -radius * 0.25, radius * 0.2, 0, Math.PI * 2);
                ctx.fill();
                break;
            case 'ghost':
                // Semi-transparent pale blue
                ctx.globalAlpha = 0.5;
                const ghostGradient = ctx.createRadialGradient(-3, -3, 0, 0, 0, radius);
                ghostGradient.addColorStop(0, '#b3e5fc');
                ghostGradient.addColorStop(1, '#0277bd');
                ctx.fillStyle = ghostGradient;
                ctx.beginPath();
                ctx.arc(0, 0, radius * 0.9, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1.0;
                // Pale blue eyes
                ctx.fillStyle = '#81d4fa';
                ctx.beginPath();
                ctx.arc(-radius * 0.4, -radius * 0.25, radius * 0.2, 0, Math.PI * 2);
                ctx.arc(radius * 0.4, -radius * 0.25, radius * 0.2, 0, Math.PI * 2);
                ctx.fill();
                break;
            case 'spitter':
                // Green with toxic aura
                const spitterGradient = ctx.createRadialGradient(-3, -3, 0, 0, 0, radius);
                spitterGradient.addColorStop(0, '#66bb6a');
                spitterGradient.addColorStop(1, '#1b5e20');
                ctx.fillStyle = spitterGradient;
                ctx.beginPath();
                ctx.arc(0, 0, radius, 0, Math.PI * 2);
                ctx.fill();
                // Toxic green eyes
                ctx.fillStyle = '#4caf50';
                ctx.beginPath();
                ctx.arc(-radius * 0.4, -radius * 0.25, radius * 0.2, 0, Math.PI * 2);
                ctx.arc(radius * 0.4, -radius * 0.25, radius * 0.2, 0, Math.PI * 2);
                ctx.fill();
                break;
            case 'boss':
                // Large dark red zombie
                const bossGradient = ctx.createRadialGradient(-4, -4, 0, 0, 0, radius * 1.3);
                bossGradient.addColorStop(0, '#d32f2f');
                bossGradient.addColorStop(1, '#b71c1c');
                ctx.fillStyle = bossGradient;
                ctx.beginPath();
                ctx.arc(0, 0, radius * 1.3, 0, Math.PI * 2);
                ctx.fill();
                // Glowing red eyes
                ctx.shadowBlur = 8;
                ctx.shadowColor = '#ff0000';
                ctx.fillStyle = '#ff5252';
                ctx.beginPath();
                ctx.arc(-radius * 0.5, -radius * 0.3, radius * 0.3, 0, Math.PI * 2);
                ctx.arc(radius * 0.5, -radius * 0.3, radius * 0.3, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;
                break;
        }
        ctx.restore();
    }

    // Helper function to draw weapon icon
    drawWeaponIcon(x, y, size, weaponKey) {
        const ctx = this.ctx;
        ctx.save();
        ctx.translate(x, y);

        const width = size * 0.6;
        const height = size * 0.3;

        switch(weaponKey) {
            case 'pistol':
                // Simple pistol shape
                ctx.fillStyle = '#424242';
                ctx.fillRect(-width/2, -height/2, width, height);
                ctx.fillStyle = '#212121';
                ctx.fillRect(-width/2 + width * 0.7, -height/2, width * 0.3, height);
                break;
            case 'shotgun':
                // Wider shotgun
                ctx.fillStyle = '#424242';
                ctx.fillRect(-width/2, -height/2, width * 1.2, height * 1.2);
                ctx.fillStyle = '#212121';
                ctx.fillRect(-width/2 + width * 0.8, -height/2, width * 0.4, height * 1.2);
                break;
            case 'rifle':
                // Long rifle
                ctx.fillStyle = '#424242';
                ctx.fillRect(-width/2, -height/2, width * 1.5, height);
                ctx.fillStyle = '#212121';
                ctx.fillRect(-width/2 + width * 1.2, -height/2, width * 0.3, height);
                break;
            case 'flamethrower':
                // Flamethrower with flame
                ctx.fillStyle = '#424242';
                ctx.fillRect(-width/2, -height/2, width * 1.2, height * 1.3);
                // Flame effect
                const flameGradient = ctx.createRadialGradient(width/2, 0, 0, width/2, 0, width * 0.4);
                flameGradient.addColorStop(0, '#ffeb3b');
                flameGradient.addColorStop(0.5, '#ff9800');
                flameGradient.addColorStop(1, 'rgba(255, 152, 0, 0)');
                ctx.fillStyle = flameGradient;
                ctx.beginPath();
                ctx.arc(width/2, 0, width * 0.4, 0, Math.PI * 2);
                ctx.fill();
                break;
            case 'smg':
                // Compact SMG
                ctx.fillStyle = '#424242';
                ctx.fillRect(-width/2, -height/2, width * 1.1, height * 0.9);
                ctx.fillStyle = '#212121';
                ctx.fillRect(-width/2 + width * 0.9, -height/2, width * 0.2, height * 0.9);
                break;
            case 'sniper':
                // Long sniper with scope
                ctx.fillStyle = '#424242';
                ctx.fillRect(-width/2, -height/2, width * 1.8, height);
                // Scope
                ctx.fillStyle = '#212121';
                ctx.fillRect(-width/2 + width * 0.3, -height/2 - height * 0.3, width * 0.4, height * 0.6);
                break;
            case 'rocketLauncher':
                // RPG launcher
                ctx.fillStyle = '#424242';
                ctx.fillRect(-width/2, -height/2, width * 1.3, height * 1.5);
                // Rocket tip
                ctx.fillStyle = '#ff1744';
                ctx.beginPath();
                ctx.moveTo(width/2, -height/2);
                ctx.lineTo(width/2 + width * 0.3, 0);
                ctx.lineTo(width/2, height/2);
                ctx.closePath();
                ctx.fill();
                break;
        }
        ctx.restore();
    }

    // Helper function to draw pickup icon
    drawPickupIcon(x, y, size, type) {
        const ctx = this.ctx;
        const time = Date.now();
        ctx.save();
        ctx.translate(x, y);

        const radius = size * 0.35;
        const pulse = 0.8 + Math.sin(time / 500) * 0.15;

        switch(type) {
            case 'health':
                // Red health orb
                const healthGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, radius * 2.2 * pulse);
                healthGlow.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
                healthGlow.addColorStop(1, 'rgba(255, 0, 80, 0)');
                ctx.fillStyle = healthGlow;
                ctx.beginPath();
                ctx.arc(0, 0, radius * 2.2 * pulse, 0, Math.PI * 2);
                ctx.fill();
                const healthGradient = ctx.createRadialGradient(-2, -2, 0, 0, 0, radius);
                healthGradient.addColorStop(0, '#ff8a80');
                healthGradient.addColorStop(1, '#d50000');
                ctx.fillStyle = healthGradient;
                ctx.beginPath();
                ctx.arc(0, 0, radius, 0, Math.PI * 2);
                ctx.fill();
                // Cross
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(-radius/2, 0);
                ctx.lineTo(radius/2, 0);
                ctx.moveTo(0, -radius/2);
                ctx.lineTo(0, radius/2);
                ctx.stroke();
                break;
            case 'ammo':
                // Yellow ammo box
                const ammoGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, radius * 2.2 * pulse);
                ammoGlow.addColorStop(0, 'rgba(255, 255, 200, 0.9)');
                ammoGlow.addColorStop(1, 'rgba(255, 152, 0, 0)');
                ctx.fillStyle = ammoGlow;
                ctx.beginPath();
                ctx.arc(0, 0, radius * 2.2 * pulse, 0, Math.PI * 2);
                ctx.fill();
                const ammoGradient = ctx.createRadialGradient(-2, -2, 0, 0, 0, radius);
                ammoGradient.addColorStop(0, '#ffd54f');
                ammoGradient.addColorStop(1, '#ff9800');
                ctx.fillStyle = ammoGradient;
                ctx.beginPath();
                ctx.arc(0, 0, radius, 0, Math.PI * 2);
                ctx.fill();
                // Bullet icon
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(-radius/3, -radius/2, radius * 0.4, radius);
                break;
            case 'damage':
                // Purple damage buff
                const damageGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, radius * 2.2 * pulse);
                damageGlow.addColorStop(0, 'rgba(224, 64, 251, 0.9)');
                damageGlow.addColorStop(1, 'rgba(123, 31, 162, 0)');
                ctx.fillStyle = damageGlow;
                ctx.beginPath();
                ctx.arc(0, 0, radius * 2.2 * pulse, 0, Math.PI * 2);
                ctx.fill();
                const damageGradient = ctx.createRadialGradient(-2, -2, 0, 0, 0, radius);
                damageGradient.addColorStop(0, '#e1bee7');
                damageGradient.addColorStop(1, '#7b1fa2');
                ctx.fillStyle = damageGradient;
                ctx.beginPath();
                ctx.arc(0, 0, radius, 0, Math.PI * 2);
                ctx.fill();
                // 2x text
                ctx.fillStyle = '#ffffff';
                ctx.font = `bold ${radius * 0.8}px "Roboto Mono", monospace`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('2x', 0, 0);
                break;
            case 'nuke':
                // Black/yellow nuke
                const nukeGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, radius * 2.5 * pulse);
                nukeGlow.addColorStop(0, 'rgba(255, 235, 59, 0.9)');
                nukeGlow.addColorStop(1, 'rgba(255, 235, 59, 0)');
                ctx.fillStyle = nukeGlow;
                ctx.beginPath();
                ctx.arc(0, 0, radius * 2.5 * pulse, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#212121';
                ctx.beginPath();
                ctx.arc(0, 0, radius, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#ffeb3b';
                ctx.lineWidth = 2;
                ctx.stroke();
                // Radiation symbol
                ctx.strokeStyle = '#ffeb3b';
                ctx.lineWidth = 2;
                for (let i = 0; i < 3; i++) {
                    const angle = (i * Math.PI * 2 / 3) - Math.PI / 2;
                    ctx.beginPath();
                    ctx.moveTo(0, 0);
                    ctx.lineTo(Math.cos(angle) * radius * 0.6, Math.sin(angle) * radius * 0.6);
                    ctx.stroke();
                }
                ctx.beginPath();
                ctx.arc(0, 0, radius * 0.2, 0, Math.PI * 2);
                ctx.fill();
                break;
            case 'speed':
                // Cyan speed boost
                const speedGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, radius * 2.2 * pulse);
                speedGlow.addColorStop(0, 'rgba(0, 255, 255, 0.9)');
                speedGlow.addColorStop(1, 'rgba(0, 172, 193, 0)');
                ctx.fillStyle = speedGlow;
                ctx.beginPath();
                ctx.arc(0, 0, radius * 2.2 * pulse, 0, Math.PI * 2);
                ctx.fill();
                const speedGradient = ctx.createRadialGradient(-2, -2, 0, 0, 0, radius);
                speedGradient.addColorStop(0, '#80deea');
                speedGradient.addColorStop(1, '#00acc1');
                ctx.fillStyle = speedGradient;
                ctx.beginPath();
                ctx.arc(0, 0, radius, 0, Math.PI * 2);
                ctx.fill();
                // Double arrow
                ctx.fillStyle = '#ffffff';
                ctx.font = `bold ${radius * 0.8}px Arial`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('»', 0, 0);
                break;
            case 'rapidfire':
                // Orange rapid fire
                const rapidGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, radius * 2.2 * pulse);
                rapidGlow.addColorStop(0, 'rgba(255, 152, 0, 0.9)');
                rapidGlow.addColorStop(1, 'rgba(245, 124, 0, 0)');
                ctx.fillStyle = rapidGlow;
                ctx.beginPath();
                ctx.arc(0, 0, radius * 2.2 * pulse, 0, Math.PI * 2);
                ctx.fill();
                const rapidGradient = ctx.createRadialGradient(-2, -2, 0, 0, 0, radius);
                rapidGradient.addColorStop(0, '#ffcc80');
                rapidGradient.addColorStop(1, '#f57c00');
                ctx.fillStyle = rapidGradient;
                ctx.beginPath();
                ctx.arc(0, 0, radius, 0, Math.PI * 2);
                ctx.fill();
                // Lightning
                ctx.fillStyle = '#ffffff';
                ctx.font = `bold ${radius * 0.8}px Arial`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('⚡', 0, 0);
                break;
            case 'shield':
                // Light blue shield
                const shieldGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, radius * 2.2 * pulse);
                shieldGlow.addColorStop(0, 'rgba(129, 212, 250, 0.9)');
                shieldGlow.addColorStop(1, 'rgba(2, 136, 209, 0)');
                ctx.fillStyle = shieldGlow;
                ctx.beginPath();
                ctx.arc(0, 0, radius * 2.2 * pulse, 0, Math.PI * 2);
                ctx.fill();
                const shieldGradient = ctx.createRadialGradient(-2, -2, 0, 0, 0, radius);
                shieldGradient.addColorStop(0, '#b3e5fc');
                shieldGradient.addColorStop(1, '#0288d1');
                ctx.fillStyle = shieldGradient;
                ctx.beginPath();
                ctx.arc(0, 0, radius, 0, Math.PI * 2);
                ctx.fill();
                // Shield hexagon
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 2;
                ctx.beginPath();
                for (let i = 0; i < 6; i++) {
                    const angle = (i * Math.PI * 2 / 6) - Math.PI / 2;
                    const px = Math.cos(angle) * radius * 0.7;
                    const py = Math.sin(angle) * radius * 0.7;
                    if (i === 0) ctx.moveTo(px, py);
                    else ctx.lineTo(px, py);
                }
                ctx.closePath();
                ctx.stroke();
                break;
            case 'adrenaline':
                // Green/yellow adrenaline
                const adrenGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, radius * 2.2 * pulse);
                adrenGlow.addColorStop(0, 'rgba(200, 230, 201, 0.9)');
                adrenGlow.addColorStop(1, 'rgba(76, 175, 80, 0)');
                ctx.fillStyle = adrenGlow;
                ctx.beginPath();
                ctx.arc(0, 0, radius * 2.2 * pulse, 0, Math.PI * 2);
                ctx.fill();
                const adrenGradient = ctx.createRadialGradient(-2, -2, 0, 0, 0, radius);
                adrenGradient.addColorStop(0, '#c8e6c9');
                adrenGradient.addColorStop(1, '#4caf50');
                ctx.fillStyle = adrenGradient;
                ctx.beginPath();
                ctx.arc(0, 0, radius, 0, Math.PI * 2);
                ctx.fill();
                // Cross/syringe
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(0, -radius/2);
                ctx.lineTo(0, radius/2);
                ctx.moveTo(-radius/2, 0);
                ctx.lineTo(radius/2, 0);
                ctx.stroke();
                break;
        }
        ctx.restore();
    }

    drawGallery() {
        this.drawCreepyBackground();

        const scale = this.getUIScale();
        const centerX = this.canvas.width / 2;
        const canvas = this.canvas;
        const ctx = this.ctx;

        // Initialize scroll if not exists
        if (!this.galleryScrollY) this.galleryScrollY = 0;
        if (!this.galleryTargetScrollY) this.galleryTargetScrollY = 0;

        // Title - scaled
        const galleryTitleFontSize = Math.max(36, 48 * scale);
        ctx.font = `bold ${galleryTitleFontSize}px "Creepster", cursive`;
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ff1744';
        ctx.shadowBlur = 30 * scale;
        ctx.shadowColor = 'rgba(255, 23, 68, 0.8)';
        ctx.fillText('GALLERY', centerX, 60 * scale);
        ctx.shadowBlur = 0;

        // Subtitle
        const subtitleFontSize = Math.max(12, 16 * scale);
        ctx.font = `${subtitleFontSize}px "Roboto Mono", monospace`;
        ctx.fillStyle = '#9e9e9e';
        ctx.fillText('Showcase of Zombies, Weapons & Pickups', centerX, 90 * scale);

        // Smooth scroll
        this.galleryScrollY += (this.galleryTargetScrollY - this.galleryScrollY) * 0.2;
        
        // Content area with clipping
        const contentStartY = 120 * scale;
        const contentHeight = canvas.height - contentStartY - (120 * scale); // Space for back button
        const padding = 20 * scale;
        
        ctx.save();
        ctx.beginPath();
        ctx.rect(padding, contentStartY, canvas.width - padding * 2, contentHeight);
        ctx.clip();

        let currentY = contentStartY - this.galleryScrollY;

        // Section spacing
        const sectionSpacing = 40 * scale;
        const cardSpacing = 20 * scale;
        const cardWidth = (canvas.width - padding * 4) / 2; // 2 columns
        const cardHeight = 140 * scale;

        // ZOMBIES SECTION
        currentY = this.drawGallerySection('ZOMBIES', centerX, currentY, scale, cardWidth, cardHeight, cardSpacing, padding, [
            { type: 'normal', name: 'Normal Zombie', health: 'Base', speed: 'Base', desc: 'Standard zombie enemy', spawn: 'Always' },
            { type: 'fast', name: 'Fast Zombie', health: '60%', speed: '1.6x', desc: 'The Runner - faster but weaker', spawn: 'Wave 3+' },
            { type: 'exploding', name: 'Exploding Zombie', health: '80%', speed: '0.9x', desc: 'The Boomer - explodes on death', spawn: 'Wave 5+' },
            { type: 'armored', name: 'Armored Zombie', health: '2x', speed: '0.8x', desc: 'The Tank - heavily armored', spawn: 'Wave 4+' },
            { type: 'ghost', name: 'Ghost Zombie', health: '80%', speed: '1.3x', desc: 'Semi-transparent spectral enemy', spawn: 'Wave 4+' },
            { type: 'spitter', name: 'Spitter Zombie', health: '80%', speed: '1.2x', desc: 'Ranged acid projectile attacks', spawn: 'Wave 6+' },
            { type: 'boss', name: 'Boss Zombie', health: 'Massive', speed: '1.2x', desc: 'Epic boss with devastating attacks', spawn: 'Every 5 waves' }
        ], 'zombie');

        currentY += sectionSpacing;

        // WEAPONS SECTION
        currentY = this.drawGallerySection('WEAPONS', centerX, currentY, scale, cardWidth, cardHeight, cardSpacing, padding, [
            { key: 'pistol', name: 'Pistol', damage: '1', fireRate: '400ms', ammo: '10', desc: 'Balanced starting weapon' },
            { key: 'shotgun', name: 'Shotgun', damage: '3', fireRate: '800ms', ammo: '5', desc: 'High damage, close range' },
            { key: 'rifle', name: 'Rifle', damage: '2', fireRate: '200ms', ammo: '30', desc: 'Fast firing, high capacity' },
            { key: 'flamethrower', name: 'Flamethrower', damage: '0.5/tick', fireRate: '50ms', ammo: '100', desc: 'Short range DoT weapon' },
            { key: 'smg', name: 'SMG', damage: '0.8', fireRate: '80ms', ammo: '40', desc: 'Rapid fire submachine gun' },
            { key: 'sniper', name: 'Sniper', damage: '15', fireRate: '1500ms', ammo: '5', desc: 'High damage, piercing shots' },
            { key: 'rocketLauncher', name: 'RPG', damage: '60 AOE', fireRate: '2000ms', ammo: '3', desc: 'Explosive area damage' }
        ], 'weapon');

        currentY += sectionSpacing;

        // PICKUPS SECTION
        currentY = this.drawGallerySection('PICKUPS', centerX, currentY, scale, cardWidth, cardHeight, cardSpacing, padding, [
            { type: 'health', name: 'Health Pickup', effect: '+25 HP', desc: 'Restores health' },
            { type: 'ammo', name: 'Ammo Pickup', effect: '+15 Ammo', desc: 'Refills ammo and grenades' },
            { type: 'damage', name: 'Damage Buff', effect: '2x Damage (10s)', desc: 'Double damage for 10 seconds' },
            { type: 'nuke', name: 'Tactical Nuke', effect: 'Instant Kill All', desc: 'Rare - clears all zombies' },
            { type: 'speed', name: 'Speed Boost', effect: '1.5x Speed (8s)', desc: 'Increased movement speed' },
            { type: 'rapidfire', name: 'Rapid Fire', effect: '2x Fire Rate (10s)', desc: 'Faster weapon firing' },
            { type: 'shield', name: 'Shield', effect: '+50 Shield', desc: 'Absorbs damage before health' },
            { type: 'adrenaline', name: 'Adrenaline', effect: 'Multiple Buffs', desc: 'Combined power-up effects' }
        ], 'pickup');

        const totalContentHeight = currentY + this.galleryScrollY - contentStartY;
        const maxScroll = Math.max(0, totalContentHeight - contentHeight);
        
        // Clamp scroll
        if (this.galleryTargetScrollY < 0) this.galleryTargetScrollY = 0;
        if (this.galleryTargetScrollY > maxScroll) this.galleryTargetScrollY = maxScroll;
        if (this.galleryScrollY < 0) this.galleryScrollY = 0;
        if (this.galleryScrollY > maxScroll) this.galleryScrollY = maxScroll;

        ctx.restore();

        // Scroll indicator (if scrollable)
        if (maxScroll > 0) {
            const scrollBarWidth = 6 * scale;
            const scrollBarX = canvas.width - padding - scrollBarWidth;
            const scrollBarHeight = contentHeight;
            const scrollBarY = contentStartY;
            const thumbHeight = Math.max(20 * scale, (contentHeight / totalContentHeight) * scrollBarHeight);
            const thumbY = scrollBarY + (this.galleryScrollY / maxScroll) * (scrollBarHeight - thumbHeight);

            // Scrollbar track
            ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.fillRect(scrollBarX, scrollBarY, scrollBarWidth, scrollBarHeight);

            // Scrollbar thumb
            ctx.fillStyle = 'rgba(255, 23, 68, 0.6)';
            ctx.fillRect(scrollBarX, thumbY, scrollBarWidth, thumbHeight);
        }

        // Back button (always visible)
        const buttonWidth = 240 * scale;
        const buttonHeight = 50 * scale;
        const backY = canvas.height - (100 * scale);
        this.drawMenuButton('Back', centerX - buttonWidth / 2, backY - buttonHeight / 2, buttonWidth, buttonHeight, this.hoveredButton === 'gallery_back', false);
    }

    drawGallerySection(title, centerX, startY, scale, cardWidth, cardHeight, cardSpacing, padding, items, itemType) {
        const ctx = this.ctx;
        const canvas = this.canvas;
        
        // Section title
        const sectionTitleSize = Math.max(20, 24 * scale);
        ctx.font = `bold ${sectionTitleSize}px "Roboto Mono", monospace`;
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ff9800';
        ctx.shadowBlur = 15 * scale;
        ctx.shadowColor = 'rgba(255, 152, 0, 0.5)';
        ctx.fillText(title, centerX, startY);
        ctx.shadowBlur = 0;
        
        let currentY = startY + (40 * scale);
        
        // Draw items in 2-column grid
        for (let i = 0; i < items.length; i++) {
            const row = Math.floor(i / 2);
            const col = i % 2;
            const cardX = padding + col * (cardWidth + cardSpacing);
            const cardY = currentY + row * (cardHeight + cardSpacing);
            
            // Draw glass card
            this.drawGlassCard(cardX, cardY, cardWidth, cardHeight);
            
            // Icon area (left side)
            const iconSize = 60 * scale;
            const iconX = cardX + (30 * scale);
            const iconY = cardY + cardHeight / 2;
            
            // Draw icon based on type
            if (itemType === 'zombie') {
                this.drawZombieIcon(iconX, iconY, iconSize, items[i].type);
            } else if (itemType === 'weapon') {
                this.drawWeaponIcon(iconX, iconY, iconSize, items[i].key);
            } else if (itemType === 'pickup') {
                this.drawPickupIcon(iconX, iconY, iconSize, items[i].type);
            }
            
            // Text area (right side)
            const textX = cardX + (100 * scale);
            const textY = cardY + (20 * scale);
            const textWidth = cardWidth - (110 * scale);
            
            // Name
            const nameSize = Math.max(14, 16 * scale);
            ctx.font = `bold ${nameSize}px "Roboto Mono", monospace`;
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            ctx.fillText(items[i].name, textX, textY);
            
            // Stats/Info
            const statSize = Math.max(10, 12 * scale);
            ctx.font = `${statSize}px "Roboto Mono", monospace`;
            ctx.fillStyle = '#ff9800';
            let statY = textY + (22 * scale);
            
            if (itemType === 'zombie') {
                ctx.fillText(`Health: ${items[i].health}`, textX, statY);
                statY += (18 * scale);
                ctx.fillText(`Speed: ${items[i].speed}`, textX, statY);
                statY += (18 * scale);
                ctx.fillText(`Spawn: ${items[i].spawn}`, textX, statY);
            } else if (itemType === 'weapon') {
                ctx.fillText(`Damage: ${items[i].damage}`, textX, statY);
                statY += (18 * scale);
                ctx.fillText(`Fire Rate: ${items[i].fireRate}`, textX, statY);
                statY += (18 * scale);
                ctx.fillText(`Ammo: ${items[i].ammo}`, textX, statY);
            } else if (itemType === 'pickup') {
                ctx.fillText(`Effect: ${items[i].effect}`, textX, statY);
            }
            
            // Description
            const descSize = Math.max(9, 11 * scale);
            ctx.font = `${descSize}px "Roboto Mono", monospace`;
            ctx.fillStyle = '#cccccc';
            statY += (22 * scale);
            ctx.fillText(items[i].desc, textX, statY, textWidth);
        }
        
        // Calculate final Y position
        const rows = Math.ceil(items.length / 2);
        return startY + (40 * scale) + rows * (cardHeight + cardSpacing);
    }

    drawLobbyBackground() {
        const time = Date.now();
        
        // Base gradient background
        const bgGradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        bgGradient.addColorStop(0, '#02040a');
        bgGradient.addColorStop(1, '#051b1f');
        this.ctx.fillStyle = bgGradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Pulsing red gradient center (subtle)
        const pulseSpeed = 0.0015;
        const pulseSize = 0.4 + Math.sin(time * pulseSpeed) * 0.08;
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;

        const pulseGradient = this.ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, this.canvas.height * pulseSize);
        pulseGradient.addColorStop(0, 'rgba(255, 23, 68, 0.15)');
        pulseGradient.addColorStop(0.5, 'rgba(255, 23, 68, 0.08)');
        pulseGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

        this.ctx.fillStyle = pulseGradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Animated grid pattern (subtle)
        this.ctx.strokeStyle = 'rgba(255, 23, 68, 0.05)';
        this.ctx.lineWidth = 1;
        const gridSize = 50;
        const offset = (time * 0.05) % gridSize;
        
        this.ctx.beginPath();
        for (let x = -offset; x < this.canvas.width + gridSize; x += gridSize) {
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
        }
        for (let y = -offset; y < this.canvas.height + gridSize; y += gridSize) {
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
        }
        this.ctx.stroke();

        // Scanlines
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        for (let i = 0; i < this.canvas.height; i += 4) {
            this.ctx.fillRect(0, i, this.canvas.width, 1);
        }

        // Subtle noise overlay
        const noiseAmount = 500;
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
        for (let i = 0; i < noiseAmount; i++) {
            const x = Math.random() * this.canvas.width;
            const y = Math.random() * this.canvas.height;
            const size = Math.random() * 1.5 + 0.5;
            this.ctx.fillRect(x, y, size, size);
        }

        // Vignette
        const vignette = this.ctx.createRadialGradient(centerX, centerY, this.canvas.height * 0.4, centerX, centerY, this.canvas.height * 0.7);
        vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
        vignette.addColorStop(1, 'rgba(0, 0, 0, 0.6)');
        this.ctx.fillStyle = vignette;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawGlassCard(x, y, width, height, borderGlow = false) {
        // Validate all parameters are finite numbers
        if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(width) || !Number.isFinite(height)) {
            console.warn('drawGlassCard: Invalid parameters', { x, y, width, height });
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

    drawStatusIndicator(x, y, type, isActive, size = 20) {
        const time = Date.now();
        const pulse = isActive ? 0.5 + Math.sin(time * 0.01) * 0.3 : 1.0;
        
        this.ctx.save();
        this.ctx.translate(x, y);

        if (type === 'ready') {
            // Animated checkmark
            this.ctx.strokeStyle = isActive ? '#76ff03' : '#9e9e9e';
            this.ctx.lineWidth = 3;
            this.ctx.lineCap = 'round';
            this.ctx.lineJoin = 'round';
            
            if (isActive) {
                this.ctx.shadowBlur = 10 * pulse;
                this.ctx.shadowColor = 'rgba(118, 255, 3, 0.8)';
            }
            
            this.ctx.beginPath();
            this.ctx.moveTo(-size * 0.4, 0);
            this.ctx.lineTo(-size * 0.1, size * 0.3);
            this.ctx.lineTo(size * 0.4, -size * 0.3);
            this.ctx.stroke();
            
        } else if (type === 'notReady') {
            // Animated X
            this.ctx.strokeStyle = isActive ? '#ff9800' : '#9e9e9e';
            this.ctx.lineWidth = 3;
            this.ctx.lineCap = 'round';
            
            if (isActive) {
                this.ctx.shadowBlur = 8;
                this.ctx.shadowColor = 'rgba(255, 152, 0, 0.6)';
            }
            
            this.ctx.beginPath();
            this.ctx.moveTo(-size * 0.3, -size * 0.3);
            this.ctx.lineTo(size * 0.3, size * 0.3);
            this.ctx.moveTo(size * 0.3, -size * 0.3);
            this.ctx.lineTo(-size * 0.3, size * 0.3);
            this.ctx.stroke();
            
        } else if (type === 'leader') {
            // Crown icon
            this.ctx.fillStyle = '#ffc107';
            this.ctx.shadowBlur = 15 * pulse;
            this.ctx.shadowColor = 'rgba(255, 193, 7, 0.8)';
            
            this.ctx.beginPath();
            // Crown base
            this.ctx.moveTo(-size * 0.5, size * 0.2);
            this.ctx.lineTo(-size * 0.3, -size * 0.2);
            this.ctx.lineTo(0, size * 0.1);
            this.ctx.lineTo(size * 0.3, -size * 0.2);
            this.ctx.lineTo(size * 0.5, size * 0.2);
            this.ctx.closePath();
            this.ctx.fill();
        }

        this.ctx.restore();
        this.ctx.shadowBlur = 0;
    }

    drawPlayerCard(x, y, player, index, isLocalPlayer) {
        // Validate input parameters
        if (!player || !Number.isFinite(x) || !Number.isFinite(y)) {
            console.warn('drawPlayerCard: Invalid parameters', { x, y, player });
            return;
        }
        
        const scale = this.getUIScale();
        const cardWidth = 220 * scale;  // Reduced from 280
        const cardHeight = 75 * scale;  // Reduced from 100
        const padding = 12 * scale;     // Reduced from 15
        
        // Validate calculated dimensions
        if (!Number.isFinite(cardWidth) || !Number.isFinite(cardHeight) || cardWidth <= 0 || cardHeight <= 0) {
            console.warn('drawPlayerCard: Invalid card dimensions', { cardWidth, cardHeight, scale });
            return;
        }
        
        // Fade-in animation
        let alpha = 1.0;
        if (this.lobbyEnterTime) {
            const fadeDuration = 300; // 300ms fade-in
            const elapsed = Date.now() - this.lobbyEnterTime;
            const delay = index * 100; // Stagger cards by 100ms each
            if (elapsed < delay + fadeDuration) {
                alpha = Math.min(1.0, Math.max(0, (elapsed - delay) / fadeDuration));
            }
        }
        
        this.ctx.save();
        this.ctx.globalAlpha = alpha;
        
        // Card background with glassmorphism
        this.drawGlassCard(x, y, cardWidth, cardHeight, isLocalPlayer);

        // Local player highlight (green glow border)
        if (isLocalPlayer) {
            this.ctx.strokeStyle = '#76ff03';
            this.ctx.lineWidth = 2;
            this.ctx.shadowBlur = 10;
            this.ctx.shadowColor = 'rgba(118, 255, 3, 0.6)';
            this.ctx.strokeRect(x, y, cardWidth, cardHeight);
            this.ctx.shadowBlur = 0;
        }

        // Avatar placeholder (circular, colored by index)
        const avatarSize = 40 * scale;  // Reduced from 50
        const avatarX = x + padding;
        const avatarY = y + padding;
        const avatarColors = ['#ff1744', '#ff5252', '#76ff03', '#ffc107', '#2196f3', '#9c27b0'];
        const avatarColor = avatarColors[index % avatarColors.length];

        // Avatar circle
        this.ctx.fillStyle = avatarColor;
        this.ctx.beginPath();
        this.ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
        this.ctx.fill();

        // Avatar border
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();

        // Player initial in avatar
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = `bold ${Math.max(12, 16 * scale)}px "Roboto Mono", monospace`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        const initial = (player?.name || 'P')[0].toUpperCase();
        this.ctx.fillText(initial, avatarX + avatarSize / 2, avatarY + avatarSize / 2);

        // Player name
        const nameX = avatarX + avatarSize + padding;
        const nameY = avatarY + 12 * scale;
        this.ctx.fillStyle = isLocalPlayer ? '#76ff03' : '#f5f5f5';
        this.ctx.font = `bold ${Math.max(12, 14 * scale)}px "Roboto Mono", monospace`;
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'top';
        const playerName = player?.name || `Player ${index + 1}`;
        this.ctx.fillText(playerName, nameX, nameY);

        // Rank badge display
        if (player?.rank) {
            const rankName = player.rank.rankName || 'Private';
            const rankTier = player.rank.rankTier || 1;
            const rankText = `${rankName} T${rankTier}`;
            const rankX = nameX;
            const rankY = nameY + 18 * scale;
            
            // Rank badge background (orange/amber color)
            const rankBadgeWidth = this.ctx.measureText(rankText).width + 8 * scale;
            const rankBadgeHeight = 14 * scale;
            this.ctx.fillStyle = 'rgba(255, 152, 0, 0.2)';
            this.ctx.fillRect(rankX, rankY, rankBadgeWidth, rankBadgeHeight);
            
            // Rank badge text
            this.ctx.fillStyle = '#ff9800';
            this.ctx.font = `${Math.max(9, 10 * scale)}px "Roboto Mono", monospace`;
            this.ctx.textAlign = 'left';
            this.ctx.textBaseline = 'top';
            this.ctx.fillText(rankText, rankX + 4 * scale, rankY + 2 * scale);
        }

        // Leader indicator - positioned above center of username
        if (player?.isLeader) {
            const playerNameWidth = this.ctx.measureText(playerName).width;
            const leaderX = nameX + (playerNameWidth / 2); // Center of username
            const crownSize = 20 * scale; // Bigger crown (was 14 * scale)
            const leaderY = nameY - crownSize + 8 * scale; // Moved down more (was +2, now +8)
            this.drawStatusIndicator(leaderX, leaderY, 'leader', true, crownSize);
        }

        // Player ID badge (moved down to make room for rank)
        const idSuffix = player?.id ? player.id.slice(-4) : '----';
        const idY = player?.rank ? nameY + 34 * scale : nameY + 18 * scale;
        this.ctx.fillStyle = '#9e9e9e';
        this.ctx.font = `${Math.max(9, 10 * scale)}px "Roboto Mono", monospace`;
        this.ctx.fillText(`#${idSuffix}`, nameX, idY);

        // Ready status indicator
        const isReady = player?.isReady || false;
        const statusX = x + cardWidth - padding - 20 * scale;
        const statusY = y + cardHeight / 2 + 4 * scale; // Moved down a smidge
        this.drawStatusIndicator(statusX, statusY, isReady ? 'ready' : 'notReady', true, 16 * scale);

        // Ready status text
        this.ctx.fillStyle = isReady ? '#76ff03' : '#ff9800';
        this.ctx.font = `${Math.max(9, 10 * scale)}px "Roboto Mono", monospace`;
        this.ctx.textAlign = 'right';
        this.ctx.textBaseline = 'middle';
        const statusText = isReady ? 'READY' : 'NOT READY';
        this.ctx.fillText(statusText, x + cardWidth - padding, statusY + 24 * scale);
        
        this.ctx.restore();
    }

    drawConnectionStatusPanel(x, y) {
        const scale = this.getUIScale();
        const panelWidth = 200 * scale;  // Reduced from 250
        const panelHeight = 95 * scale;  // Reduced from 120
        
        // Fade-in animation
        let alpha = 1.0;
        if (this.lobbyEnterTime) {
            const fadeDuration = 400;
            const elapsed = Date.now() - this.lobbyEnterTime;
            if (elapsed < fadeDuration) {
                alpha = Math.min(1.0, elapsed / fadeDuration);
            }
        }
        
        this.ctx.save();
        this.ctx.globalAlpha = alpha;
        
        this.drawGlassCard(x, y, panelWidth, panelHeight);

        const padding = 12 * scale;  // Reduced from 15
        const time = Date.now();

        // Title
        this.ctx.fillStyle = '#f5f5f5';
        this.ctx.font = `bold ${Math.max(11, 12 * scale)}px "Roboto Mono", monospace`;
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'top';
        this.ctx.fillText('CONNECTION STATUS', x + padding, y + padding);

        const isConnected = gameState.multiplayer.connected;
        const statusY = y + padding + 20 * scale;

        // Connection indicator (animated pulsing dot)
        const dotSize = 6 * scale;  // Reduced from 8
        const dotX = x + padding;
        const dotY = statusY + 6 * scale;
        const pulse = 0.7 + Math.sin(time * 0.01) * 0.3;

        if (isConnected) {
            this.ctx.fillStyle = '#76ff03';
            this.ctx.shadowBlur = 8 * scale * pulse;
            this.ctx.shadowColor = 'rgba(118, 255, 3, 0.8)';
        } else {
            this.ctx.fillStyle = '#ff9800';
            this.ctx.shadowBlur = 6 * scale;
            this.ctx.shadowColor = 'rgba(255, 152, 0, 0.6)';
        }

        this.ctx.beginPath();
        this.ctx.arc(dotX, dotY, dotSize, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.shadowBlur = 0;

        // Status text
        this.ctx.fillStyle = isConnected ? '#76ff03' : '#ff9800';
        this.ctx.font = `${Math.max(11, 12 * scale)}px "Roboto Mono", monospace`;
        this.ctx.fillText(isConnected ? 'Connected' : 'Connecting...', dotX + dotSize * 2 + 6 * scale, statusY);

        // Player ID
        this.ctx.fillStyle = '#9e9e9e';
        this.ctx.font = `${Math.max(9, 10 * scale)}px "Roboto Mono", monospace`;
        const playerId = gameState.multiplayer.playerId || 'Unknown';
        const idSuffix = playerId.length > 8 ? playerId.slice(-8) : playerId;
        this.ctx.fillText(`ID: ${idSuffix}`, x + padding, statusY + 20 * scale);

        // Server status
        this.ctx.fillStyle = '#9e9e9e';
        this.ctx.font = `${Math.max(9, 10 * scale)}px "Roboto Mono", monospace`;
        const serverStatus = gameState.multiplayer.serverStatus || 'Unknown';
        this.ctx.fillText(`Server: ${serverStatus}`, x + padding, statusY + 32 * scale);
        
        this.ctx.restore();
    }

    drawLobbyInfoPanel(x, y, playerCount) {
        const scale = this.getUIScale();
        const panelWidth = 200 * scale;  // Reduced from 250
        const panelHeight = 80 * scale;  // Reduced from 100
        
        // Fade-in animation
        let alpha = 1.0;
        if (this.lobbyEnterTime) {
            const fadeDuration = 400;
            const elapsed = Date.now() - this.lobbyEnterTime;
            if (elapsed < fadeDuration) {
                alpha = Math.min(1.0, elapsed / fadeDuration);
            }
        }
        
        this.ctx.save();
        this.ctx.globalAlpha = alpha;
        
        this.drawGlassCard(x, y, panelWidth, panelHeight);

        const padding = 12 * scale;  // Reduced from 15

        // Title
        this.ctx.fillStyle = '#f5f5f5';
        this.ctx.font = `bold ${Math.max(11, 12 * scale)}px "Roboto Mono", monospace`;
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'top';
        this.ctx.fillText('LOBBY INFO', x + padding, y + padding);

        // Player count
        const countY = y + padding + 20 * scale;
        this.ctx.fillStyle = '#ff1744';
        this.ctx.font = `bold ${Math.max(24, 28 * scale)}px "Roboto Mono", monospace`;
        this.ctx.fillText(playerCount.toString(), x + padding, countY);

        this.ctx.fillStyle = '#9e9e9e';
        this.ctx.font = `${Math.max(10, 11 * scale)}px "Roboto Mono", monospace`;
        this.ctx.fillText('Players Online', x + padding, countY + 28 * scale);
        
        this.ctx.restore();
    }

    drawLobbyButton(text, x, y, width, height, hovered, disabled, isSpecial = false) {
        const time = Date.now();
        const pulse = 0.5 + Math.sin(time * 0.008) * 0.3;

        // Pill shape with rounded corners
        const radius = height / 2;

        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.moveTo(x + radius, y);
        this.ctx.lineTo(x + width - radius, y);
        this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        this.ctx.lineTo(x + width, y + height - radius);
        this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        this.ctx.lineTo(x + radius, y + height);
        this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        this.ctx.lineTo(x, y + radius);
        this.ctx.quadraticCurveTo(x, y, x + radius, y);
        this.ctx.closePath();

        if (disabled) {
            // Disabled state
            const disabledGradient = this.ctx.createLinearGradient(x, y, x, y + height);
            disabledGradient.addColorStop(0, 'rgba(51, 51, 51, 0.6)');
            disabledGradient.addColorStop(1, 'rgba(26, 26, 26, 0.6)');
            this.ctx.fillStyle = disabledGradient;
            this.ctx.fill();
            this.ctx.strokeStyle = '#666666';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
        } else if (hovered || isSpecial) {
            // Hovered or special state (all ready) - gradient with glow
            const gradient = this.ctx.createLinearGradient(x, y, x, y + height);
            gradient.addColorStop(0, '#ff5252');
            gradient.addColorStop(1, '#ff1744');
            this.ctx.fillStyle = gradient;
            this.ctx.fill();

            // Glow effect
            if (isSpecial) {
                this.ctx.shadowBlur = 20 * pulse;
                this.ctx.shadowColor = 'rgba(255, 23, 68, 0.8)';
            } else {
                this.ctx.shadowBlur = 15;
                this.ctx.shadowColor = 'rgba(255, 23, 68, 0.6)';
            }
            this.ctx.strokeStyle = '#ff1744';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
            this.ctx.shadowBlur = 0;
        } else {
            // Default state
            const defaultGradient = this.ctx.createLinearGradient(x, y, x, y + height);
            defaultGradient.addColorStop(0, 'rgba(255, 23, 68, 0.2)');
            defaultGradient.addColorStop(1, 'rgba(255, 23, 68, 0.15)');
            this.ctx.fillStyle = defaultGradient;
            this.ctx.fill();
            this.ctx.strokeStyle = '#ff1744';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
        }

        this.ctx.restore();

        // Text
        const scale = this.getUIScale();
        this.ctx.fillStyle = disabled ? '#888888' : '#ffffff';
        this.ctx.font = `bold ${Math.max(12, 14 * scale)}px "Roboto Mono", monospace`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(text, x + width / 2, y + height / 2);
    }

    drawLobby() {
        // Validate canvas dimensions
        if (!this.canvas || !Number.isFinite(this.canvas.width) || !Number.isFinite(this.canvas.height) || 
            this.canvas.width <= 0 || this.canvas.height <= 0) {
            console.warn('drawLobby: Invalid canvas dimensions', { 
                width: this.canvas?.width, 
                height: this.canvas?.height 
            });
            return;
        }
        
        // Track lobby entry time for fade-in animations
        if (this.lastLobbyState !== gameState.showLobby) {
            if (gameState.showLobby) {
                this.lobbyEnterTime = Date.now();
            } else {
                this.lobbyEnterTime = null;
            }
            this.lastLobbyState = gameState.showLobby;
        }
        
        // Draw animated background
        this.drawLobbyBackground();

        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;

        // Title with enhanced effects
        const lobbyScale = this.getUIScale();
        this.ctx.font = `bold ${Math.max(36, 40 * lobbyScale)}px "Creepster", cursive`;
        this.ctx.textAlign = 'center';
        this.ctx.fillStyle = '#ff1744';
        this.ctx.shadowBlur = 25 * lobbyScale;
        this.ctx.shadowColor = 'rgba(255, 23, 68, 0.9)';
        this.ctx.fillText('MULTIPLAYER LOBBY', centerX, 60 * lobbyScale);
        this.ctx.shadowBlur = 0;

        // --- COUNTDOWN OVERLAY ---
        if (gameState.multiplayer.isGameStarting) {
            const timeLeft = Math.max(0, Math.ceil((gameState.multiplayer.gameStartTime - Date.now()) / 1000));

            // Enhanced dimming overlay with red tint
            const overlayGradient = this.ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, this.canvas.height);
            overlayGradient.addColorStop(0, 'rgba(255, 23, 68, 0.3)');
            overlayGradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.8)');
            overlayGradient.addColorStop(1, 'rgba(0, 0, 0, 0.9)');
            this.ctx.fillStyle = overlayGradient;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

            // Enhanced countdown number with stronger effects
            const lobbyScale = this.getUIScale();
            const pulse = 0.8 + Math.sin(Date.now() * 0.02) * 0.2;
            const countdownFontSize = Math.max(80, 140 * lobbyScale);
            this.ctx.font = `bold ${countdownFontSize}px "Roboto Mono", monospace`;
            this.ctx.fillStyle = '#ff1744';
            this.ctx.shadowBlur = 60 * pulse * lobbyScale;
            this.ctx.shadowColor = '#ff0000';
            this.ctx.fillText(timeLeft > 0 ? timeLeft : 'GO!', centerX, centerY);
            this.ctx.shadowBlur = 0;

            // Enhanced "DEPLOYING" text
            const deployingFontSize = Math.max(24, 36 * lobbyScale);
            this.ctx.font = `bold ${deployingFontSize}px "Roboto Mono", monospace`;
            this.ctx.fillStyle = '#ffffff';
            this.ctx.shadowBlur = 20;
            this.ctx.shadowColor = 'rgba(255, 23, 68, 0.8)';
            this.ctx.fillText('DEPLOYING...', centerX, centerY + 100);
            this.ctx.shadowBlur = 0;

            // Don't draw interactive elements during countdown
            return;
        }

        const players = Array.isArray(gameState.multiplayer.players) ? gameState.multiplayer.players : [];
        const scale = lobbyScale;

        // Layout: Three-column design
        // Left: Connection status panel
        // Center: Player cards
        // Right: Lobby info panel

        const leftPanelX = 30 * scale;
        const rightPanelX = this.canvas.width - (230 * scale);
        const topY = 110 * scale;

        // Left panel: Connection status
        this.drawConnectionStatusPanel(leftPanelX, topY);

        // Right panel: Lobby info
        this.drawLobbyInfoPanel(rightPanelX, topY, players.length);

        // Chat window (bottom left)
        this.drawChatWindow();

        // Center: Player cards (responsive layout)
        const cardSpacing = 15 * scale;
        const cardsPerRow = Math.min(2, Math.floor((this.canvas.width - 500 * scale) / (240 * scale))); // Responsive: 2 cards max
        const cardWidth = 220 * scale;
        const cardHeight = 75 * scale;
        
        // Validate calculated dimensions
        if (!Number.isFinite(cardWidth) || !Number.isFinite(cardHeight) || cardWidth <= 0 || cardHeight <= 0) {
            console.warn('drawLobby: Invalid card dimensions', { cardWidth, cardHeight, scale });
            return;
        }
        
        // Calculate total width of card area and center it
        const totalCardsWidth = Math.min(players.length, cardsPerRow) * cardWidth + (Math.min(players.length, cardsPerRow) - 1) * cardSpacing;
        const cardStartX = centerX - totalCardsWidth / 2;
        const cardStartY = topY;
        
        // Validate calculated positions
        if (!Number.isFinite(cardStartX) || !Number.isFinite(cardStartY)) {
            console.warn('drawLobby: Invalid card positions', { cardStartX, cardStartY, centerX, topY });
            return;
        }

        if (players.length === 0) {
            // Empty state
            const emptyWidth = cardWidth * 2 + cardSpacing;
            const emptyX = centerX - emptyWidth / 2;
            this.drawGlassCard(emptyX, cardStartY, emptyWidth, cardHeight);
            this.ctx.fillStyle = '#9e9e9e';
            this.ctx.font = `${Math.max(12, 14 * scale)}px "Roboto Mono", monospace`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText('Waiting for players to join...', centerX, cardStartY + cardHeight / 2);
        } else {
            // Draw player cards in grid
            players.forEach((player, index) => {
                const row = Math.floor(index / cardsPerRow);
                const col = index % cardsPerRow;
                const cardX = cardStartX + col * (cardWidth + cardSpacing);
                const cardY = cardStartY + row * (cardHeight + cardSpacing);
                const isLocalPlayer = player?.id === gameState.multiplayer.playerId;
                
                this.drawPlayerCard(cardX, cardY, player, index, isLocalPlayer);
            });
        }

        // Bottom: Action buttons
        const buttonWidth = 180 * scale;  // Reduced from 200
        const buttonHeight = 40 * scale;  // Reduced from 45
        const buttonsDisabled = gameState.multiplayer.isGameStarting;

        if (gameState.multiplayer.connected) {
            const isLeader = gameState.multiplayer.isLeader;
            const allReady = players.length > 0 && players.every(p => p.isReady);

            if (isLeader) {
                // Leader: Ready, Start Game, Back
                const readyY = this.canvas.height - 150 * scale;
                const startY = this.canvas.height - 100 * scale;
                const backY = this.canvas.height - 50 * scale;

                const canStart = allReady && players.length > 0 && !buttonsDisabled;
                
                // Draw status text above Ready button
                if (!canStart && !buttonsDisabled) {
                    this.ctx.font = `${Math.max(10, 11 * scale)}px "Roboto Mono", monospace`;
                    this.ctx.fillStyle = '#ff9800';
                    this.ctx.textAlign = 'center';
                    this.ctx.fillText('Waiting for all players to be ready...', centerX, readyY - 25 * scale);
                }

                const readyText = gameState.multiplayer.isReady ? 'Unready' : 'Ready';
                this.drawLobbyButton(readyText, centerX - buttonWidth / 2, readyY, buttonWidth, buttonHeight, 
                    this.hoveredButton === 'lobby_ready', buttonsDisabled);

                this.drawLobbyButton('Start Game', centerX - buttonWidth / 2, startY, buttonWidth, buttonHeight, 
                    this.hoveredButton === 'lobby_start', !canStart, canStart);

                this.drawLobbyButton('Back', centerX - buttonWidth / 2, backY, buttonWidth, buttonHeight, 
                    this.hoveredButton === 'lobby_back', buttonsDisabled);
                } else {
                    // Non-leader: Ready, Back
                    const readyY = this.canvas.height - 120 * lobbyScale;
                    const backY = this.canvas.height - 70 * lobbyScale;

                const readyText = gameState.multiplayer.isReady ? 'Unready' : 'Ready';
                this.drawLobbyButton(readyText, centerX - buttonWidth / 2, readyY, buttonWidth, buttonHeight, 
                    this.hoveredButton === 'lobby_ready', buttonsDisabled);
                this.drawLobbyButton('Back', centerX - buttonWidth / 2, backY, buttonWidth, buttonHeight, 
                    this.hoveredButton === 'lobby_back', buttonsDisabled);
            }
            } else {
                // Not connected - just Back button
                const backY = this.canvas.height - 100 * lobbyScale;
            this.drawLobbyButton('Back', centerX - buttonWidth / 2, backY, buttonWidth, buttonHeight, 
                this.hoveredButton === 'lobby_back', false);
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
        const centerX = this.canvas.width / 2;
        const uiScale = this.getUIScale();
        const buttonWidth = 200 * uiScale;
        const buttonHeight = 50 * uiScale;

        // Check Pause Menu
        if (gameState.gamePaused && !gameState.showSettingsPanel) {
            const pauseButtonWidth = 180 * uiScale;
            const pauseButtonHeight = 36 * uiScale;
            const pauseButtonSpacing = 15 * uiScale;
            const centerY = this.canvas.height / 2;
            const buttonStartY = centerY;

            const resumeY = buttonStartY;
            const restartY = buttonStartY + (pauseButtonHeight + pauseButtonSpacing);
            const settingsY = buttonStartY + (pauseButtonHeight + pauseButtonSpacing) * 2;
            const menuY = buttonStartY + (pauseButtonHeight + pauseButtonSpacing) * 3;

            // Resume button
            if (mouseX >= centerX - pauseButtonWidth / 2 && mouseX <= centerX + pauseButtonWidth / 2 &&
                mouseY >= resumeY - pauseButtonHeight / 2 && mouseY <= resumeY + pauseButtonHeight / 2) {
                return 'pause_resume';
            }
            // Restart button
            if (mouseX >= centerX - pauseButtonWidth / 2 && mouseX <= centerX + pauseButtonWidth / 2 &&
                mouseY >= restartY - pauseButtonHeight / 2 && mouseY <= restartY + pauseButtonHeight / 2) {
                return 'pause_restart';
            }
            // Settings button
            if (mouseX >= centerX - pauseButtonWidth / 2 && mouseX <= centerX + pauseButtonWidth / 2 &&
                mouseY >= settingsY - pauseButtonHeight / 2 && mouseY <= settingsY + pauseButtonHeight / 2) {
                return 'pause_settings';
            }
            // Return to Menu button
            if (mouseX >= centerX - pauseButtonWidth / 2 && mouseX <= centerX + pauseButtonWidth / 2 &&
                mouseY >= menuY - pauseButtonHeight / 2 && mouseY <= menuY + pauseButtonHeight / 2) {
                return 'pause_menu';
            }
            return null;
        }

        // Check Game Over Screen
        if (this.gameOver) {
            const wasMultiplayer = gameState.multiplayer.active || gameState.multiplayer.connected;
            let buttonY = this.canvas.height - 120 * uiScale;
            
            // "Back to Lobby" button (only if multiplayer)
            if (wasMultiplayer) {
                const lobbyButtonY = buttonY;
                if (mouseX >= centerX - buttonWidth / 2 && mouseX <= centerX + buttonWidth / 2 &&
                    mouseY >= lobbyButtonY && mouseY <= lobbyButtonY + buttonHeight) {
                    return 'gameover_lobby';
                }
                buttonY = this.canvas.height - 60 * uiScale;
            }
            
            // "Back to Main Menu" button (always show)
            const menuButtonY = buttonY;
            if (mouseX >= centerX - buttonWidth / 2 && mouseX <= centerX + buttonWidth / 2 &&
                mouseY >= menuButtonY && mouseY <= menuButtonY + buttonHeight) {
                return 'gameover_menu';
            }
            return null;
        }

        // Check AI Lobby
        if (gameState.showAILobby) {
            const addBotY = this.canvas.height - (220 * uiScale);
            const startY = this.canvas.height - (150 * uiScale);
            const backY = this.canvas.height - (80 * uiScale);

            // Add Bot
            if (mouseX >= centerX - buttonWidth / 2 && mouseX <= centerX + buttonWidth / 2 &&
                mouseY >= addBotY && mouseY <= addBotY + buttonHeight) {
                return 'ai_add';
            }
            // Start Game
            if (mouseX >= centerX - buttonWidth / 2 && mouseX <= centerX + buttonWidth / 2 &&
                mouseY >= startY && mouseY <= startY + buttonHeight) {
                return 'ai_start';
            }
            // Back
            if (mouseX >= centerX - buttonWidth / 2 && mouseX <= centerX + buttonWidth / 2 &&
                mouseY >= backY && mouseY <= backY + buttonHeight) {
                return 'ai_back';
            }
            return null;
        }

        // Check Coop Lobby
        if (gameState.showCoopLobby) {
            const startY = this.canvas.height - 100;

            // Start Game
            if (mouseX >= centerX - buttonWidth / 2 && mouseX <= centerX + buttonWidth / 2 &&
                mouseY >= startY - 70 && mouseY <= startY - 70 + buttonHeight) {
                return 'coop_start';
            }
            // Back
            if (mouseX >= centerX - buttonWidth / 2 && mouseX <= centerX + buttonWidth / 2 &&
                mouseY >= startY && mouseY <= startY + buttonHeight) {
                return 'coop_back';
            }
            return null;
        }

        // Check Multiplayer Lobby
        if (gameState.showLobby) {
            // Prevent clicks if game is starting
            if (gameState.multiplayer.isGameStarting) return null;

            // Check chat input click
            if (this.checkChatInputClick(mouseX, mouseY)) {
                return 'chat_input';
            }

            const lobbyScale = this.getUIScale();
            const buttonWidth = 180 * lobbyScale;
            const buttonHeight = 40 * lobbyScale;

            if (gameState.multiplayer.connected) {
                const isLeader = gameState.multiplayer.isLeader;

                if (isLeader) {
                    // Leader: Ready, Start Game, Back
                    const readyY = this.canvas.height - 150 * lobbyScale;
                    const startY = this.canvas.height - 100 * lobbyScale;
                    const backY = this.canvas.height - 50 * lobbyScale;

                    // Check ready button
                    if (mouseX >= centerX - buttonWidth / 2 && mouseX <= centerX + buttonWidth / 2 &&
                        mouseY >= readyY && mouseY <= readyY + buttonHeight) {
                        return 'lobby_ready';
                    }

                    // Check start game button
                    if (mouseX >= centerX - buttonWidth / 2 && mouseX <= centerX + buttonWidth / 2 &&
                        mouseY >= startY && mouseY <= startY + buttonHeight) {
                        return 'lobby_start';
                    }

                    // Check back button
                    if (mouseX >= centerX - buttonWidth / 2 && mouseX <= centerX + buttonWidth / 2 &&
                        mouseY >= backY && mouseY <= backY + buttonHeight) {
                        return 'lobby_back';
                    }
                } else {
                    // Non-leader: Ready, Back
                    const readyY = this.canvas.height - 120 * lobbyScale;
                    const backY = this.canvas.height - 70 * lobbyScale;

                    // Check ready button
                    if (mouseX >= centerX - buttonWidth / 2 && mouseX <= centerX + buttonWidth / 2 &&
                        mouseY >= readyY && mouseY <= readyY + buttonHeight) {
                        return 'lobby_ready';
                    }

                    // Check back button
                    if (mouseX >= centerX - buttonWidth / 2 && mouseX <= centerX + buttonWidth / 2 &&
                        mouseY >= backY && mouseY <= backY + buttonHeight) {
                        return 'lobby_back';
                    }
                }
            } else {
                // Not connected - just Back button
                const backY = this.canvas.height - 100 * lobbyScale;
                if (mouseX >= centerX - buttonWidth / 2 && mouseX <= centerX + buttonWidth / 2 &&
                    mouseY >= backY && mouseY <= backY + buttonHeight) {
                    return 'lobby_back';
                }
            }
            return null;
        }

        if (!this.mainMenu && !gameState.showAbout && !gameState.showGallery) return null;

        const scale = this.getUIScale();
        const mainMenuButtonWidth = 180 * scale;  // Reduced from 200
        const mainMenuButtonHeight = 36 * scale;  // Reduced from 40
        const centerY = this.canvas.height / 2;
        const buttonSpacing = 15 * scale;

        // Username box hit detection (moved to top)
        const usernameBoxWidth = 320 * scale;
        const usernameBoxHeight = 50 * scale;
        const usernameBoxX = centerX - usernameBoxWidth / 2;
        const usernameBoxY = 30 * scale; // Top of window with padding
        if (mouseX >= usernameBoxX && mouseX <= usernameBoxX + usernameBoxWidth &&
            mouseY >= usernameBoxY && mouseY <= usernameBoxY + usernameBoxHeight) {
            return 'username';
        }

        // 2x5 Grid Layout: 2 columns, 5 rows
        const columnSpacing = 20 * scale;
        const buttonStartY = centerY - (30 * scale);
        const leftColumnX = centerX - mainMenuButtonWidth - columnSpacing / 2;
        const rightColumnX = centerX + columnSpacing / 2;

        // Row positions
        const row1Y = buttonStartY;
        const row2Y = buttonStartY + (mainMenuButtonHeight + buttonSpacing);
        const row3Y = buttonStartY + (mainMenuButtonHeight + buttonSpacing) * 2;
        const row4Y = buttonStartY + (mainMenuButtonHeight + buttonSpacing) * 3;
        const row5Y = buttonStartY + (mainMenuButtonHeight + buttonSpacing) * 4;
        const row6Y = buttonStartY + (mainMenuButtonHeight + buttonSpacing) * 5;

        // Check left column
        if (mouseX >= leftColumnX && mouseX <= leftColumnX + mainMenuButtonWidth) {
            if (mouseY >= row1Y - mainMenuButtonHeight / 2 && mouseY <= row1Y + mainMenuButtonHeight / 2) return 'single';
            if (mouseY >= row2Y - mainMenuButtonHeight / 2 && mouseY <= row2Y + mainMenuButtonHeight / 2) return 'local_coop';
            if (mouseY >= row3Y - mainMenuButtonHeight / 2 && mouseY <= row3Y + mainMenuButtonHeight / 2) return 'settings';
            if (mouseY >= row5Y - mainMenuButtonHeight / 2 && mouseY <= row5Y + mainMenuButtonHeight / 2) return 'profile';
            if (mouseY >= row6Y - mainMenuButtonHeight / 2 && mouseY <= row6Y + mainMenuButtonHeight / 2) return 'battlepass';
        }

        // Check right column
        if (mouseX >= rightColumnX && mouseX <= rightColumnX + mainMenuButtonWidth) {
            if (mouseY >= row1Y - mainMenuButtonHeight / 2 && mouseY <= row1Y + mainMenuButtonHeight / 2) return 'campaign';
            if (mouseY >= row2Y - mainMenuButtonHeight / 2 && mouseY <= row2Y + mainMenuButtonHeight / 2) return 'play_ai';
            if (mouseY >= row3Y - mainMenuButtonHeight / 2 && mouseY <= row3Y + mainMenuButtonHeight / 2) return 'multiplayer';
            if (mouseY >= row5Y - mainMenuButtonHeight / 2 && mouseY <= row5Y + mainMenuButtonHeight / 2) return 'achievements';
            if (mouseY >= row6Y - mainMenuButtonHeight / 2 && mouseY <= row6Y + mainMenuButtonHeight / 2) return 'about';
        }

        // Check Gallery button (centered in row 4)
        if (mouseX >= centerX - mainMenuButtonWidth / 2 && mouseX <= centerX + mainMenuButtonWidth / 2) {
            if (mouseY >= row4Y - mainMenuButtonHeight / 2 && mouseY <= row4Y + mainMenuButtonHeight / 2) return 'gallery';
        }

        // Check About screen back button
        if (gameState.showAbout) {
            const backY = this.canvas.height - 100;
            if (mouseX >= centerX - mainMenuButtonWidth / 2 && mouseX <= centerX + mainMenuButtonWidth / 2 &&
                mouseY >= backY - mainMenuButtonHeight / 2 && mouseY <= backY + mainMenuButtonHeight / 2) {
                return 'about_back';
            }
        }

        // Check Gallery screen back button
        if (gameState.showGallery) {
            const backY = this.canvas.height - 100;
            if (mouseX >= centerX - mainMenuButtonWidth / 2 && mouseX <= centerX + mainMenuButtonWidth / 2 &&
                mouseY >= backY - mainMenuButtonHeight / 2 && mouseY <= backY + mainMenuButtonHeight / 2) {
                return 'gallery_back';
            }
        }

        // Check mute button (bottom right)
        const muteButtonSize = 40;
        const muteButtonX = this.canvas.width - 60;
        const muteButtonY = this.canvas.height - 60;
        if (mouseX >= muteButtonX && mouseX <= muteButtonX + muteButtonSize &&
            mouseY >= muteButtonY && mouseY <= muteButtonY + muteButtonSize) {
            return 'mute_music';
        }

        return null;
    }

    updateMenuHover(mouseX, mouseY) {
        this.mouseX = mouseX;
        this.mouseY = mouseY;
        if (!this.mainMenu && !gameState.showLobby && !gameState.showCoopLobby && !gameState.showAILobby && !gameState.showAbout && !gameState.showGallery && !gameState.gamePaused && !this.gameOver) {
            this.hoveredButton = null;
            return;
        }
        this.hoveredButton = this.checkMenuButtonClick(mouseX, mouseY);
    }

    drawOffScreenIndicators() {
        if (!gameState.gameRunning || gameState.gamePaused) return;
        if (gameState.zombies.length === 0) return;

        const indicatorDistance = 800; // Distance threshold
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

            const dx = zombie.x - closestPlayer.x;
            const dy = zombie.y - closestPlayer.y;
            const distSquared = dx * dx + dy * dy;
            const indicatorDistSquared = indicatorDistance * indicatorDistance;

            // Only show indicator if zombie is off-screen but within threshold distance
            if (distSquared > indicatorDistSquared) return;

            const isOnScreen = zombie.x >= 0 && zombie.x <= this.canvas.width &&
                zombie.y >= 0 && zombie.y <= this.canvas.height;

            if (isOnScreen) return; // Don't show indicator if zombie is on screen

            // Calculate angle to zombie
            const angle = Math.atan2(dy, dx);

            // Find intersection point with screen edge
            let indicatorX, indicatorY;

            // Check which edge the line intersects
            const slope = dy / dx;
            const playerX = closestPlayer.x;
            const playerY = closestPlayer.y;

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

            // Use the closest intersection to the zombie
            if (intersections.length > 0) {
                let closestIntersection = intersections[0];
                const dx0 = intersections[0].x - zombie.x;
                const dy0 = intersections[0].y - zombie.y;
                let closestDistSquared = dx0 * dx0 + dy0 * dy0;

                intersections.forEach(int => {
                    const dx = int.x - zombie.x;
                    const dy = int.y - zombie.y;
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
            // Calculate actual distance from squared distance
            const distance = Math.sqrt(distSquared);
            const distanceRatio = distance / indicatorDistance;
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

    drawTechnologyBranding() {
        this.ctx.save();

        const scale = this.getUIScale();
        const padding = 15;
        const spacing = 8; // Space between version box and technology branding
        const fontSize = Math.max(8, Math.round(10 * scale));
        const lineHeight = 14 * scale;
        const textPadding = 8 * scale;

        // Calculate text dimensions
        this.ctx.font = `${fontSize}px "Roboto Mono", monospace`;
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'top';

        const lines = [
            'Not sponsored',
            'Powered by Intel® / AMD',
            'WebGPU Technologies'
        ];

        // Measure text to determine panel size
        let maxWidth = 0;
        lines.forEach(line => {
            const width = this.ctx.measureText(line).width;
            if (width > maxWidth) maxWidth = width;
        });

        const panelWidth = maxWidth + textPadding * 2;
        const panelHeight = lines.length * lineHeight + textPadding * 2;
        
        // Position next to WebGPU icon, below version box (top left)
        const webgpuIconWidth = 75;
        const versionBoxHeight = 24;
        const panelX = padding + webgpuIconWidth + spacing;
        const panelY = padding + versionBoxHeight + spacing;

        // Draw background panel
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(panelX, panelY, panelWidth, panelHeight);

        // Draw subtle border
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(panelX, panelY, panelWidth, panelHeight);

        // Draw text lines
        this.ctx.fillStyle = 'rgba(158, 158, 158, 0.7)';
        lines.forEach((line, index) => {
            const y = panelY + textPadding + index * lineHeight;

            // Special styling for technology names
            if (line.includes('Intel') || line.includes('AMD') || line.includes('WebGPU')) {
                this.ctx.fillStyle = 'rgba(200, 200, 200, 0.8)';
            } else {
                this.ctx.fillStyle = 'rgba(158, 158, 158, 0.6)';
            }

            this.ctx.fillText(line, panelX + textPadding, y);
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

    drawLevelUpScreen() {
        const canvas = this.canvas;
        const ctx = this.ctx;

        // Darken background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Title
        ctx.save();
        const scale = this.getUIScale();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowBlur = 20 * scale;
        ctx.shadowColor = '#ffc107';
        ctx.fillStyle = '#ffc107';
        const titleFontSize = Math.max(32, 48 * scale);
        ctx.font = `bold ${titleFontSize}px "Roboto Mono", monospace`;
        ctx.fillText('LEVEL UP!', canvas.width / 2, 80 * scale);
        ctx.shadowBlur = 0;

        // Level display
        ctx.fillStyle = '#ffffff';
        const levelFontSize = Math.max(16, 24 * scale);
        ctx.font = `${levelFontSize}px "Roboto Mono", monospace`;
        ctx.fillText(`Level ${gameState.level}`, canvas.width / 2, 130 * scale);
        ctx.restore();

        // Draw skill cards
        const cardWidth = 300 * scale;
        const cardHeight = 400 * scale;
        const cardSpacing = 40 * scale;
        const totalWidth = (cardWidth * 3) + (cardSpacing * 2);
        const startX = (canvas.width - totalWidth) / 2;
        const cardY = canvas.height / 2 - cardHeight / 2 + 40 * scale;

        gameState.levelUpChoices.forEach((skill, index) => {
            const cardX = startX + (index * (cardWidth + cardSpacing));
            const isHovered = this.hoveredSkillIndex === index;

            // Card background
            const bgGradient = ctx.createLinearGradient(cardX, cardY, cardX, cardY + cardHeight);
            if (isHovered) {
                bgGradient.addColorStop(0, 'rgba(255, 193, 7, 0.3)');
                bgGradient.addColorStop(1, 'rgba(255, 152, 0, 0.3)');
            } else {
                bgGradient.addColorStop(0, 'rgba(42, 42, 42, 0.95)');
                bgGradient.addColorStop(1, 'rgba(26, 26, 26, 0.95)');
            }
            ctx.fillStyle = bgGradient;
            ctx.fillRect(cardX, cardY, cardWidth, cardHeight);

            // Card border
            ctx.strokeStyle = isHovered ? '#ffc107' : '#666666';
            ctx.lineWidth = isHovered ? 4 : 2;
            ctx.shadowBlur = isHovered ? 15 : 0;
            ctx.shadowColor = '#ffc107';
            ctx.strokeRect(cardX, cardY, cardWidth, cardHeight);
            ctx.shadowBlur = 0;

            // Icon
            const iconFontSize = 64 * scale;
            ctx.font = `${iconFontSize}px serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(skill.icon, cardX + cardWidth / 2, cardY + 80 * scale);

            // Skill name
            ctx.fillStyle = '#ffffff';
            const skillNameFontSize = Math.max(16, 24 * scale);
            ctx.font = `bold ${skillNameFontSize}px "Roboto Mono", monospace`;
            ctx.fillText(skill.name, cardX + cardWidth / 2, cardY + 160 * scale);

            // Description
            ctx.fillStyle = '#cccccc';
            const descFontSize = Math.max(11, 16 * scale);
            ctx.font = `${descFontSize}px "Roboto Mono", monospace`;
            const descriptionLines = this.wrapText(ctx, skill.description, cardWidth - 40 * scale);
            let lineY = cardY + 200 * scale;
            descriptionLines.forEach(line => {
                ctx.fillText(line, cardX + cardWidth / 2, lineY);
                lineY += 24 * scale;
            });

            // Check if already owned
            const existingSkill = gameState.activeSkills.find(s => s.id === skill.id);
            if (existingSkill) {
                ctx.fillStyle = '#ffc107';
                const upgradeFontSize = Math.max(12, 18 * scale);
                ctx.font = `bold ${upgradeFontSize}px "Roboto Mono", monospace`;
                ctx.fillText(`UPGRADE (Level ${existingSkill.level + 1})`, cardX + cardWidth / 2, cardY + cardHeight - 40 * scale);
            }
        });

        // Instruction text
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        const instructionFontSize = Math.max(12, 18 * scale);
        ctx.font = `${instructionFontSize}px "Roboto Mono", monospace`;
        ctx.fillText('Click a skill to select it', canvas.width / 2, canvas.height - 60 * scale);
    }

    wrapText(ctx, text, maxWidth) {
        const words = text.split(' ');
        const lines = [];
        let currentLine = words[0];

        for (let i = 1; i < words.length; i++) {
            const word = words[i];
            const width = ctx.measureText(currentLine + ' ' + word).width;
            if (width < maxWidth) {
                currentLine += ' ' + word;
            } else {
                lines.push(currentLine);
                currentLine = word;
            }
        }
        lines.push(currentLine);
        return lines;
    }

    checkLevelUpClick(x, y) {
        if (!gameState.showLevelUp || !gameState.levelUpChoices || gameState.levelUpChoices.length === 0) {
            return null;
        }

        const canvas = this.canvas;
        const cardWidth = 300;
        const cardHeight = 400;
        const cardSpacing = 40;
        const totalWidth = (cardWidth * 3) + (cardSpacing * 2);
        const startX = (canvas.width - totalWidth) / 2;
        const cardY = canvas.height / 2 - cardHeight / 2 + 40;

        for (let i = 0; i < gameState.levelUpChoices.length; i++) {
            const cardX = startX + (i * (cardWidth + cardSpacing));
            if (x >= cardX && x <= cardX + cardWidth && y >= cardY && y <= cardY + cardHeight) {
                return i;
            }
        }

        return null;
    }

    updateLevelUpHover(x, y) {
        this.mouseX = x;
        this.mouseY = y;
        this.hoveredSkillIndex = this.checkLevelUpClick(x, y);
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

    drawMultiplierIndicator(player, centerX, y) {
        if (player.scoreMultiplier <= 1.0) {
            return; // Don't show at 1x
        }

        const width = 120;
        const height = 40;

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

        // Render multiplier text
        this.ctx.save();
        const scale = this.getUIScale();
        const multiplierFontSize = Math.max(16, 24 * scale);
        this.ctx.font = `bold ${multiplierFontSize}px "Roboto Mono"`;
        this.ctx.fillStyle = color;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.shadowBlur = 15 * pulse * scale;
        this.ctx.shadowColor = color;
        this.ctx.fillText(`${player.scoreMultiplier}x`, centerX, y);
        this.ctx.shadowBlur = 0;

        // Progress bar to next tier (centered)
        const progressX = centerX - width / 2;
        this.drawMultiplierProgress(player, progressX, y + 25, width);

        this.ctx.restore();
    }

    drawMultiplierProgress(player, x, y, width) {
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

        // At max tier
        const scale = this.getUIScale();
        if (kills >= thresholds[thresholds.length - 1]) {
            const maxFontSize = Math.max(9, 12 * scale);
            this.ctx.font = `${maxFontSize}px "Roboto Mono"`;
            this.ctx.fillStyle = '#ffd700';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('MAX', x + width / 2, y);
            return;
        }

        // Calculate progress
        const progress = (kills - currentThreshold) / (nextThreshold - currentThreshold);

        // Render progress bar background
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        this.ctx.fillRect(x, y, width, 6);

        // Render progress bar fill
        const fillWidth = width * progress;
        const gradient = this.ctx.createLinearGradient(x, y, x + fillWidth, y);
        gradient.addColorStop(0, '#ff5252');
        gradient.addColorStop(1, '#ff1744');

        this.ctx.fillStyle = gradient;
        this.ctx.shadowBlur = 8;
        this.ctx.shadowColor = 'rgba(255, 23, 68, 0.6)';
        this.ctx.fillRect(x, y, fillWidth, 6);
        this.ctx.shadowBlur = 0;

        // Show kills remaining
        const killsRemaining = nextThreshold - kills;
        const killsFontSize = Math.max(8, Math.round(10 * scale));
        this.ctx.font = `${killsFontSize}px "Roboto Mono"`;
        this.ctx.fillStyle = '#9e9e9e';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`${killsRemaining} kills to ${player.scoreMultiplier + 1.0}x`, x + width / 2, y + 16 * scale);
    }

    /**
     * Fetch global leaderboard from server with 10-second timeout
     */
    async fetchLeaderboard() {
        // Throttle fetches - don't fetch more than once every 30 seconds
        const now = Date.now();
        if (now - this.leaderboardLastFetch < this.leaderboardFetchInterval && this.leaderboardFetchState === 'success') {
            return;
        }

        // Set loading state
        this.leaderboardFetchState = 'loading';
        this.leaderboardFetchStartTime = now;

        // Create abort controller for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
            controller.abort();
        }, 10000); // 10 second timeout

        try {
            const response = await fetch(`${SERVER_URL}/api/highscores`, {
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            
            if (response.ok) {
                const data = await response.json();
                if (data.highscores && Array.isArray(data.highscores)) {
                    this.leaderboard = data.highscores;
                    this.leaderboardLastFetch = now;
                    this.leaderboardFetchState = 'success';
                } else {
                    // Invalid response format
                    this.leaderboardLastFetch = now; // Update timestamp to prevent infinite retries
                    this.leaderboardFetchState = 'error';
                }
            } else {
                // HTTP error response
                this.leaderboardLastFetch = now; // Update timestamp to prevent infinite retries
                this.leaderboardFetchState = 'error';
            }
        } catch (error) {
            clearTimeout(timeoutId);
            // Always update timestamp on error to prevent infinite retries
            this.leaderboardLastFetch = now;
            
            if (error.name === 'AbortError') {
                // Timeout occurred
                this.leaderboardFetchState = 'timeout';
                console.log('[GameHUD] Leaderboard fetch timed out after 10 seconds');
            } else {
                // Other error (network, CORS, etc.)
                this.leaderboardFetchState = 'error';
                console.log('[GameHUD] Could not fetch leaderboard:', error);
            }
        }
    }

    /**
     * Draw global leaderboard on main menu
     */
    drawLeaderboard() {
        const scale = this.getUIScale();
        const leaderboardFontSize = Math.max(9, 11 * scale);
        const titleFontSize = Math.max(11, 13 * scale);
        const rightX = this.canvas.width - 30 * scale; // Right side with padding
        const startY = 100 * scale; // Position near top, below username box

        // Leaderboard title
        this.ctx.font = `bold ${titleFontSize}px "Roboto Mono", monospace`;
        this.ctx.textAlign = 'right';
        this.ctx.fillStyle = 'rgba(255, 215, 0, 0.9)';
        this.ctx.fillText('Global Leaderboard', rightX, startY);

        // Check fetch state and show appropriate message
        const now = Date.now();
        const timeSinceFetchStart = now - this.leaderboardFetchStartTime;
        const timeSinceLastFetch = now - this.leaderboardLastFetch;
        const showTimeoutMessage = (this.leaderboardFetchState === 'timeout' || this.leaderboardFetchState === 'error') || 
                                   (this.leaderboardFetchState === 'loading' && timeSinceFetchStart >= 10000);

        if (this.leaderboard.length === 0 || showTimeoutMessage) {
            this.ctx.font = `${leaderboardFontSize}px "Roboto Mono", monospace`;
            
            if (showTimeoutMessage) {
                // Show timeout/error message
                this.ctx.textAlign = 'right';
                this.ctx.fillStyle = 'rgba(255, 152, 0, 0.9)';
                this.ctx.fillText('Highscore server wasn\'t reached', rightX, startY + 20 * scale);
                
                // Calculate retry countdown
                const retryInSeconds = Math.ceil((this.leaderboardFetchInterval - timeSinceLastFetch) / 1000);
                if (retryInSeconds > 0 && retryInSeconds < this.leaderboardFetchInterval / 1000) {
                    this.ctx.fillStyle = 'rgba(158, 158, 158, 0.7)';
                    this.ctx.font = `${Math.max(8, 9 * scale)}px "Roboto Mono", monospace`;
                    this.ctx.fillText(`Retrying in ${retryInSeconds}s...`, rightX, startY + 35 * scale);
                    this.ctx.font = `${leaderboardFontSize}px "Roboto Mono", monospace`;
                }
                
                // Show local high score as fallback
                if (gameState.highScore > 0) {
                    this.ctx.fillStyle = 'rgba(158, 158, 158, 0.6)';
                    const localScoreY = retryInSeconds > 0 && retryInSeconds < this.leaderboardFetchInterval / 1000 
                        ? startY + 50 * scale 
                        : startY + 35 * scale;
                    this.ctx.fillText(`Local High Score: ${gameState.highScore.toLocaleString()}`, rightX, localScoreY);
                }
            } else if (this.leaderboardFetchState === 'success') {
                // Successfully loaded but empty - show "Nobody yet!"
                this.ctx.textAlign = 'right';
                this.ctx.fillStyle = 'rgba(158, 158, 158, 0.7)';
                this.ctx.fillText('Nobody yet!', rightX, startY + 20 * scale);
                this.ctx.font = `${Math.max(8, 9 * scale)}px "Roboto Mono", monospace`;
                this.ctx.fillStyle = 'rgba(158, 158, 158, 0.5)';
                this.ctx.fillText('Be the first to set a score!', rightX, startY + 35 * scale);
                this.ctx.font = `${leaderboardFontSize}px "Roboto Mono", monospace`;
            } else {
                // Show loading state
                this.ctx.textAlign = 'right';
                this.ctx.fillStyle = 'rgba(158, 158, 158, 0.5)';
                this.ctx.fillText('Loading leaderboard...', rightX, startY + 20 * scale);
            }
            return;
        }

        // Leaderboard entries (top 10)
        this.ctx.font = `${leaderboardFontSize}px "Roboto Mono", monospace`;
        const entryHeight = (leaderboardFontSize + 4) * scale;
        const maxEntries = Math.min(10, this.leaderboard.length);

        for (let i = 0; i < maxEntries; i++) {
            const entry = this.leaderboard[i];
            const y = startY + (i + 1.5) * entryHeight;
            const isPlayerEntry = entry.username === gameState.username;
            const isMultiplayer = entry.isMultiplayer === true;

            // Highlight player's own score
            if (isPlayerEntry) {
                this.ctx.fillStyle = 'rgba(255, 152, 0, 0.3)';
                this.ctx.fillRect(rightX - 280 * scale, y - entryHeight / 2, 280 * scale, entryHeight);
            }

            // Wave (rightmost, smaller font)
            this.ctx.textAlign = 'right';
            this.ctx.fillStyle = 'rgba(158, 158, 158, 0.6)';
            this.ctx.font = `${Math.max(8, 9 * scale)}px "Roboto Mono", monospace`;
            const wave = entry.wave || 0;
            this.ctx.fillText(`Wave ${wave}`, rightX, y);
            this.ctx.font = `${leaderboardFontSize}px "Roboto Mono", monospace`;

            // Score (right-aligned, next to wave)
            this.ctx.textAlign = 'right';
            this.ctx.fillStyle = isPlayerEntry ? '#ff9800' : 'rgba(255, 215, 0, 0.8)';
            const score = entry.score || 0;
            this.ctx.fillText(score.toLocaleString(), rightX - 50 * scale, y);

            // Username (right-aligned, truncated if needed)
            this.ctx.textAlign = 'right';
            const username = entry.username && entry.username.length > 12 ? entry.username.substring(0, 12) + '...' : (entry.username || 'Survivor');
            this.ctx.fillStyle = isPlayerEntry ? '#ff9800' : 'rgba(255, 255, 255, 0.7)';
            const usernameX = isMultiplayer ? rightX - 150 * scale : rightX - 130 * scale;
            this.ctx.fillText(username, usernameX, y);

            // Multiplayer indicator (if applicable, right after username)
            if (isMultiplayer) {
                this.ctx.textAlign = 'right';
                this.ctx.fillStyle = 'rgba(0, 255, 200, 0.9)';
                this.ctx.font = `${Math.max(7, 8 * scale)}px "Roboto Mono", monospace`;
                this.ctx.fillText('MP', rightX - 135 * scale, y);
                this.ctx.font = `${leaderboardFontSize}px "Roboto Mono", monospace`;
            }

            // Rank (right-aligned, leftmost)
            this.ctx.fillStyle = isPlayerEntry ? '#ff9800' : 'rgba(255, 255, 255, 0.7)';
            this.ctx.fillText(`#${i + 1}`, rightX - 200 * scale, y);
        }

        // Reset text alignment
        this.ctx.textAlign = 'center';
    }

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
     * Draw chat window in lobby
     */
    drawChatWindow() {
        if (!gameState.showLobby || gameState.multiplayer.isGameStarting) return;

        const scale = this.getUIScale();
        const chatWidth = Math.min(400 * scale, this.canvas.width * 0.4);
        const chatHeight = 200 * scale;
        const padding = 20 * scale; // Small space from sides and bottom
        const chatX = padding; // Left side with spacing
        const chatY = this.canvas.height - chatHeight - padding; // Lower left with bottom spacing

        // Draw glassmorphism card
        this.drawGlassCard(chatX, chatY, chatWidth, chatHeight);

        // Draw chat title
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = `bold ${Math.max(12, 14 * scale)}px "Roboto Mono", monospace`;
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'top';
        this.ctx.fillText('Chat', chatX + 10 * scale, chatY + 10 * scale);

        // Draw messages area
        const messagesAreaHeight = chatHeight - 50 * scale; // Reserve space for input
        const messagesAreaY = chatY + 30 * scale;
        this.drawChatMessages(chatX + 10 * scale, messagesAreaY, chatWidth - 20 * scale, messagesAreaHeight);

        // Draw input field
        const inputY = chatY + chatHeight - 40 * scale;
        this.drawChatInput(chatX + 10 * scale, inputY, chatWidth - 20 * scale, 30 * scale);
    }

    /**
     * Draw chat messages list
     */
    drawChatMessages(x, y, width, height) {
        const scale = this.getUIScale();
        const messages = gameState.multiplayer.chatMessages || [];
        const fontSize = Math.max(10, 12 * scale);
        const lineHeight = fontSize + 4 * scale;
        const maxVisibleMessages = Math.floor(height / lineHeight);

        // Clip to messages area
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.rect(x, y, width, height);
        this.ctx.clip();

        // Show last N messages (scroll to bottom)
        const startIndex = Math.max(0, messages.length - maxVisibleMessages);
        const visibleMessages = messages.slice(startIndex);

        this.ctx.font = `${fontSize}px "Roboto Mono", monospace`;
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'top';

        visibleMessages.forEach((message, index) => {
            if (!message) return;

            const messageY = y + index * lineHeight;
            const isOwnMessage = message.playerId === gameState.multiplayer.playerId;
            const isSystemMessage = message.isSystem;

            // Format message text
            let displayText = '';
            if (isSystemMessage) {
                this.ctx.fillStyle = 'rgba(158, 158, 158, 0.7)';
                this.ctx.font = `italic ${fontSize}px "Roboto Mono", monospace`;
                displayText = `[System]: ${message.message}`;
            } else {
                this.ctx.fillStyle = isOwnMessage ? 'rgba(255, 152, 0, 0.9)' : 'rgba(255, 255, 255, 0.8)';
                this.ctx.font = `${fontSize}px "Roboto Mono", monospace`;
                const playerName = message.playerName || 'Unknown';
                displayText = `${playerName}: ${message.message}`;
            }

            // Word wrap if needed
            const maxWidth = width - 10 * scale;
            const words = displayText.split(' ');
            let line = '';
            let currentY = messageY;

            words.forEach(word => {
                const testLine = line + (line ? ' ' : '') + word;
                const metrics = this.ctx.measureText(testLine);
                if (metrics.width > maxWidth && line) {
                    this.ctx.fillText(line, x, currentY);
                    line = word;
                    currentY += lineHeight;
                } else {
                    line = testLine;
                }
            });
            if (line) {
                this.ctx.fillText(line, x, currentY);
            }
        });

        this.ctx.restore();
    }

    /**
     * Draw chat input field
     */
    drawChatInput(x, y, width, height) {
        const scale = this.getUIScale();
        const isFocused = gameState.multiplayer.chatFocused;
        const isDisabled = gameState.multiplayer.isGameStarting;

        // Input background
        const bgGradient = this.ctx.createLinearGradient(x, y, x, y + height);
        bgGradient.addColorStop(0, isFocused ? 'rgba(42, 42, 42, 0.95)' : 'rgba(26, 26, 26, 0.9)');
        bgGradient.addColorStop(1, isFocused ? 'rgba(26, 26, 26, 0.95)' : 'rgba(10, 10, 10, 0.9)');
        this.ctx.fillStyle = bgGradient;
        this.ctx.fillRect(x, y, width, height);

        // Border
        this.ctx.strokeStyle = isFocused ? '#ff1744' : (isDisabled ? '#666666' : '#444444');
        this.ctx.lineWidth = isFocused ? 2 : 1;
        this.ctx.strokeRect(x, y, width, height);

        // Focus glow
        if (isFocused && !isDisabled) {
            this.ctx.shadowBlur = 10;
            this.ctx.shadowColor = 'rgba(255, 23, 68, 0.4)';
            this.ctx.strokeRect(x, y, width, height);
            this.ctx.shadowBlur = 0;
        }

        // Input text
        const inputText = gameState.multiplayer.chatInput || '';
        const fontSize = Math.max(11, 13 * scale);
        this.ctx.font = `${fontSize}px "Roboto Mono", monospace`;
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillStyle = isDisabled ? 'rgba(136, 136, 136, 0.7)' : '#ffffff';

        // Show placeholder or input text
        if (!inputText && !isFocused) {
            this.ctx.fillStyle = 'rgba(158, 158, 158, 0.5)';
            this.ctx.fillText('Type a message... (Enter to send)', x + 8 * scale, y + height / 2);
        } else {
            // Show input text with cursor if focused
            const displayText = inputText.substring(0, 200); // Max 200 chars
            this.ctx.fillText(displayText, x + 8 * scale, y + height / 2);

            // Draw cursor if focused
            if (isFocused && !isDisabled) {
                const textWidth = this.ctx.measureText(displayText).width;
                const cursorX = x + 8 * scale + textWidth;
                const cursorBlink = Math.floor(Date.now() / 500) % 2;
                if (cursorBlink) {
                    this.ctx.fillStyle = '#ffffff';
                    this.ctx.fillRect(cursorX, y + 6 * scale, 2, height - 12 * scale);
                }
            }
        }

        // Character counter
        const charCount = inputText.length;
        const maxChars = 200;
        this.ctx.fillStyle = charCount > maxChars * 0.9 ? '#ff9800' : 'rgba(158, 158, 158, 0.6)';
        this.ctx.font = `${Math.max(9, 10 * scale)}px "Roboto Mono", monospace`;
        this.ctx.textAlign = 'right';
        this.ctx.fillText(`${charCount}/${maxChars}`, x + width - 8 * scale, y + height / 2);
    }

    /**
     * Check if click is on chat input field
     */
    checkChatInputClick(x, y) {
        if (!gameState.showLobby || gameState.multiplayer.isGameStarting) return false;

        const scale = this.getUIScale();
        const chatWidth = Math.min(400 * scale, this.canvas.width * 0.4);
        const chatHeight = 200 * scale;
        const padding = 20 * scale; // Small space from sides and bottom
        const chatX = padding; // Left side with spacing
        const chatY = this.canvas.height - chatHeight - padding; // Lower left with bottom spacing
        const inputY = chatY + chatHeight - 40 * scale;
        const inputX = chatX + 10 * scale;
        const inputWidth = chatWidth - 20 * scale;
        const inputHeight = 30 * scale;

        return x >= inputX && x <= inputX + inputWidth &&
               y >= inputY && y <= inputY + inputHeight;
    }
}
