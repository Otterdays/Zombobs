import { gameState } from '../core/gameState.js';
import { settingsManager } from '../systems/SettingsManager.js';
import { isAudioInitialized } from '../systems/AudioSystem.js';
import { getLastRuns, formatTime, loadScoreboard } from '../utils/gameUtils.js';
import { NEWS_UPDATES } from '../core/constants.js';
import { RankDisplay } from './RankDisplay.js';
import { LeaderboardDisplay } from './LeaderboardDisplay.js';

export class MainMenuScreen {
    constructor(canvas, ctx, hud) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.hud = hud; // Reference to GameHUD for shared methods
        this.rankDisplay = hud.rankDisplay;
        this.leaderboardDisplay = hud.leaderboardDisplay;
        this.hoveredButton = null;
        // News ticker state (shared with GameHUD)
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
        // Username modal state
        this.usernameInputText = '';
        this.usernameInputFocused = false;

        // Background Effects
        this.eyes = [];
        this.explosions = [];
        this.particles = [];
        this.lastEyeSpawn = 0;
        this.lastExplosionSpawn = 0;
    }

    getUIScale() {
        return this.hud.getUIScale();
    }

    updateEffects() {
        const now = Date.now();
        const width = this.canvas.width;
        const height = this.canvas.height;

        // Spawn Eyes
        if (now - this.lastEyeSpawn > 2000 && Math.random() < 0.05) {
            this.lastEyeSpawn = now;
            // Spawn in dark areas (avoid center)
            let x, y;
            let valid = false;
            let attempts = 0;
            while (!valid && attempts < 10) {
                x = Math.random() * width;
                y = Math.random() * height;
                // Avoid center menu area roughly
                const distToCenter = Math.hypot(x - width/2, y - height/2);
                if (distToCenter > 300) valid = true;
                attempts++;
            }
            
            if (valid) {
                this.eyes.push({
                    x: x,
                    y: y,
                    angle: (Math.random() - 0.5) * 0.5, // Slight tilt
                    scale: 0.5 + Math.random() * 1.0,
                    life: 0,
                    maxLife: 100 + Math.random() * 100,
                    state: 'in' // in, wait, out
                });
            }
        }

        // Update Eyes
        for (let i = this.eyes.length - 1; i >= 0; i--) {
            const eye = this.eyes[i];
            
            if (eye.state === 'in') {
                eye.life += 2;
                if (eye.life >= 50) eye.state = 'wait';
            } else if (eye.state === 'wait') {
                eye.life += 0.5; // Slowly progress through wait
                if (eye.life >= eye.maxLife - 50) eye.state = 'out';
            } else if (eye.state === 'out') {
                eye.life += 2;
                if (eye.life >= eye.maxLife) {
                    this.eyes.splice(i, 1);
                }
            }
        }

        // Spawn Explosions/Flashes
        if (now - this.lastExplosionSpawn > 3000 && Math.random() < 0.02) {
            this.lastExplosionSpawn = now;
             let x, y;
            let valid = false;
            let attempts = 0;
             while (!valid && attempts < 10) {
                x = Math.random() * width;
                y = Math.random() * height;
                 const distToCenter = Math.hypot(x - width/2, y - height/2);
                if (distToCenter > 250) valid = true;
                attempts++;
            }

            if (valid) {
                this.explosions.push({
                    x: x,
                    y: y,
                    radius: 10,
                    maxRadius: 50 + Math.random() * 50,
                    alpha: 1.0,
                    color: Math.random() > 0.5 ? '#ffeb3b' : '#ff5722' // Yellow or Orange
                });
                
                // Add some particles for the explosion
                for(let k=0; k<10; k++) {
                    this.particles.push({
                         x: x,
                         y: y,
                         vx: (Math.random() - 0.5) * 10,
                         vy: (Math.random() - 0.5) * 10,
                         life: 30 + Math.random() * 20,
                         color: '#ffffff',
                         size: 2 + Math.random() * 3
                    });
                }
            }
        }

        // Update Explosions
        for (let i = this.explosions.length - 1; i >= 0; i--) {
            const exp = this.explosions[i];
            exp.radius += 2;
            exp.alpha -= 0.05;
            if (exp.alpha <= 0) {
                this.explosions.splice(i, 1);
            }
        }

        // Update Particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life--;
            p.vx *= 0.95;
            p.vy *= 0.95;
            if (p.life <= 0) this.particles.splice(i, 1);
        }
    }

    drawEffects() {
        // Draw Eyes
        this.ctx.save();
        for (const eye of this.eyes) {
            let opacity = 0;
            if (eye.state === 'in') opacity = eye.life / 50;
            else if (eye.state === 'wait') opacity = 1.0;
            else if (eye.state === 'out') opacity = 1.0 - ((eye.life - (eye.maxLife - 50)) / 50);
            
            this.ctx.globalAlpha = opacity;
            this.ctx.translate(eye.x, eye.y);
            this.ctx.rotate(eye.angle);
            this.ctx.scale(eye.scale, eye.scale);

            // Left Eye
            this.ctx.fillStyle = '#ff1744';
            this.ctx.shadowBlur = 15;
            this.ctx.shadowColor = '#ff0000';
            this.ctx.beginPath();
            this.ctx.ellipse(-10, 0, 4, 2, 0, 0, Math.PI * 2);
            this.ctx.fill();

            // Right Eye
            this.ctx.beginPath();
            this.ctx.ellipse(10, 0, 4, 2, 0, 0, Math.PI * 2);
            this.ctx.fill();

            this.ctx.restore();
            // Reset transform for next eye
             this.ctx.setTransform(1, 0, 0, 1, 0, 0);
             this.ctx.save();
        }
        this.ctx.restore();

        // Draw Explosions
        this.ctx.save();
        for (const exp of this.explosions) {
            this.ctx.globalAlpha = exp.alpha;
            this.ctx.fillStyle = exp.color;
            this.ctx.beginPath();
            this.ctx.arc(exp.x, exp.y, exp.radius, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Inner white flash
            this.ctx.fillStyle = '#ffffff';
            this.ctx.beginPath();
            this.ctx.arc(exp.x, exp.y, exp.radius * 0.7, 0, Math.PI * 2);
            this.ctx.fill();
        }
        this.ctx.restore();

        // Draw Particles
        this.ctx.save();
        for (const p of this.particles) {
            this.ctx.globalAlpha = p.life / 50;
            this.ctx.fillStyle = p.color;
            this.ctx.fillRect(p.x, p.y, p.size, p.size);
        }
        this.ctx.restore();
    }

    draw() {
        this.updateEffects();
        this.hud.drawCreepyBackground();
        this.drawEffects();

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

        // Row 1: Arcade (left), Survival (right) - disabled
        this.hud.drawMenuButton('Arcade', leftColumnX, row1Y - buttonHeight / 2, buttonWidth, buttonHeight, this.hoveredButton === 'single', false);
        this.hud.drawMenuButton('Survival', rightColumnX, row1Y - buttonHeight / 2, buttonWidth, buttonHeight, this.hoveredButton === 'survival', true);

        // Row 2: Campaign (left), Local Co-op (right)
        this.hud.drawMenuButton('Campaign', leftColumnX, row2Y - buttonHeight / 2, buttonWidth, buttonHeight, this.hoveredButton === 'campaign', false);
        this.hud.drawMenuButton('Local Co-op', rightColumnX, row2Y - buttonHeight / 2, buttonWidth, buttonHeight, this.hoveredButton === 'local_coop', false);

        // Row 3: Play with AI (left), Settings (right)
        this.hud.drawMenuButton('Play with AI', leftColumnX, row3Y - buttonHeight / 2, buttonWidth, buttonHeight, this.hoveredButton === 'play_ai', false);
        this.hud.drawMenuButton('Settings', rightColumnX, row3Y - buttonHeight / 2, buttonWidth, buttonHeight, this.hoveredButton === 'settings', false);

        // Row 4: Multiplayer (left), Gallery (right)
        this.hud.drawMenuButton('Multiplayer', leftColumnX, row4Y - buttonHeight / 2, buttonWidth, buttonHeight, this.hoveredButton === 'multiplayer', false);
        this.hud.drawMenuButton('Gallery', rightColumnX, row4Y - buttonHeight / 2, buttonWidth, buttonHeight, this.hoveredButton === 'gallery', false);

        // Row 5: Profile (left), Achievements (right)
        this.hud.drawMenuButton('Profile', leftColumnX, row5Y - buttonHeight / 2, buttonWidth, buttonHeight, this.hoveredButton === 'profile', false);
        this.hud.drawMenuButton('Achievements', rightColumnX, row5Y - buttonHeight / 2, buttonWidth, buttonHeight, this.hoveredButton === 'achievements', false);

        // Row 6: Battlepass (centered)
        const row6Y = buttonStartY + (buttonHeight + buttonSpacing) * 5;
        this.hud.drawMenuButton('Battlepass', centerX - buttonWidth / 2, row6Y - buttonHeight / 2, buttonWidth, buttonHeight, this.hoveredButton === 'battlepass', false);

        // Row 7: About (centered)
        const row7Y = buttonStartY + (buttonHeight + buttonSpacing) * 6;
        this.hud.drawMenuButton('About', centerX - buttonWidth / 2, row7Y - buttonHeight / 2, buttonWidth, buttonHeight, this.hoveredButton === 'about', false);

        // Draw rank badge next to username
        this.drawRankBadge();

        // Global Leaderboard
        this.leaderboardDisplay.draw(this.ctx);

        // Display all-time best multiplier - above Last Arcade Run box
        if (gameState.allTimeMaxMultiplier > 1.0) {
            const highScoreFontSize = Math.max(10, 12 * scale);
            this.ctx.fillStyle = 'rgba(255, 215, 0, 0.7)';
            this.ctx.font = `${highScoreFontSize}px "Roboto Mono", monospace`;
            this.ctx.textAlign = 'left';
            const cardX = 20 * scale; // Same X position as Last Arcade Run box
            const multiplierY = 85 * scale; // Above the Last Arcade Run box
            this.ctx.fillText(`Best Multiplier: ${gameState.allTimeMaxMultiplier}x`, cardX, multiplierY);
        }

        // Local Highscores (last 2 runs)
        this.drawLocalHighscores();
        
        // Local Leaderboard (top scores)
        this.drawLocalLeaderboard();

        // Draw mute button in bottom right
        const muteButtonSize = 40;
        const muteButtonX = this.canvas.width - 120;
        const muteButtonY = this.canvas.height - 100;
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

        // Draw username modal if open
        if (gameState.showUsernameModal) {
            this.drawUsernameModal();
        }
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
        const lastRuns = getLastRuns(1, 'arcade'); // Only show the last arcade run on left side
        
        // Card dimensions
        const cardWidth = 200 * scale;
        const cardHeight = 110 * scale;
        const padding = 12 * scale;
        
        // Position on left side of screen
        const cardX = 20 * scale; // Left padding
        const y = 100 * scale; // Below username box area
        
        // Always draw the card container
        this.hud.drawGlassCard(cardX, y, cardWidth, cardHeight);
        
        // Header
        const headerFontSize = Math.max(11, 12 * scale);
        this.ctx.font = `bold ${headerFontSize}px "Roboto Mono", monospace`;
        this.ctx.fillStyle = '#ff9800';
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'top';
        this.ctx.fillText('Last Arcade Run', cardX + padding, y + padding);
        
        if (lastRuns.length === 0) {
            // No runs available - show empty state
            const emptyFontSize = Math.max(9, 10 * scale);
            this.ctx.font = `${emptyFontSize}px "Roboto Mono", monospace`;
            this.ctx.fillStyle = '#b0b0b0';
            this.ctx.textAlign = 'center';
            const textY = y + cardHeight / 2;
            this.ctx.fillText('No recent runs.', cardX + cardWidth / 2, textY);
            this.ctx.fillText('Play a game!', cardX + cardWidth / 2, textY + 15 * scale);
            return;
        }
        
        const run = lastRuns[0]; // Get the last run
        
        // Score (large, prominent) - improved spacing
        const scoreFontSize = Math.max(18, 22 * scale);
        const scoreText = (run.score || 0).toLocaleString();
        this.ctx.font = `bold ${scoreFontSize}px "Roboto Mono", monospace`;
        const scoreTextWidth = this.ctx.measureText(scoreText).width;
        const maxScoreWidth = cardWidth - padding * 2;
        if (scoreTextWidth > maxScoreWidth) {
            // Scale down font if needed
            const scaleFactor = maxScoreWidth / scoreTextWidth;
            const adjustedFontSize = Math.max(14, scoreFontSize * scaleFactor);
            this.ctx.font = `bold ${adjustedFontSize}px "Roboto Mono", monospace`;
        }
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillText(scoreText, cardX + padding, y + padding + 20 * scale);
        
        // Stats (wave, kills, time) - improved font size and spacing
        const statFontSize = Math.max(9, 10 * scale);
        this.ctx.font = `${statFontSize}px "Roboto Mono", monospace`;
        this.ctx.fillStyle = '#b0b0b0'; // Slightly brighter for better contrast
        let statY = y + padding + 48 * scale; // Better spacing from score
        
        // Wave
        this.ctx.fillText(`Wave: ${run.wave || 0}`, cardX + padding, statY);
        statY += 15 * scale; // Slightly increased line spacing
        
        // Kills
        this.ctx.fillText(`Kills: ${run.kills || 0}`, cardX + padding, statY);
        statY += 15 * scale;
        
        // Time - ensure it fits
        const timeText = formatTime(run.timeSurvived || 0);
        const timeLabel = `Time: ${timeText}`;
        this.ctx.font = `${statFontSize}px "Roboto Mono", monospace`;
        const timeTextWidth = this.ctx.measureText(timeLabel).width;
        if (timeTextWidth > maxScoreWidth) {
            // Truncate if necessary
            const truncatedTime = timeText.length > 8 ? timeText.substring(0, 8) + '...' : timeText;
            this.ctx.fillText(`Time: ${truncatedTime}`, cardX + padding, statY);
        } else {
            this.ctx.fillText(timeLabel, cardX + padding, statY);
        }
    }

    drawLocalLeaderboard() {
        const scale = this.getUIScale();
        const allScores = loadScoreboard();
        // Filter to only show arcade runs (include entries without gameMode for backwards compatibility)
        const scoreboard = allScores.filter(entry => {
            const mode = entry.gameMode || 'arcade'; // Default to arcade if missing
            return mode === 'arcade';
        });
        
        // Card dimensions - reduced width, entry height for better text fitting
        const cardWidth = 220 * scale;
        const maxHeight = 400 * scale; // Max height for scrollable content
        const padding = 12 * scale;
        const entryHeight = 75 * scale; // Increased from 70 for better spacing
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
        this.hud.drawGlassCard(cardX, y, cardWidth, cardHeight);
        
        // Header - improved font size
        const headerFontSize = Math.max(11, 12 * scale);
        this.ctx.font = `bold ${headerFontSize}px "Roboto Mono", monospace`;
        this.ctx.fillStyle = '#ff9800';
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'top';
        this.ctx.fillText('Local Best', cardX + padding, y + padding);
        
        // Subtitle - improved font size, right-aligned, moved up
        const subtitleFontSize = Math.max(10, 11 * scale);
        this.ctx.font = `${subtitleFontSize}px "Roboto Mono", monospace`;
        this.ctx.fillStyle = '#b0b0b0'; // Slightly brighter for better contrast
        this.ctx.textAlign = 'right';
        this.ctx.fillText('Top Scores', cardX + cardWidth - padding, y + padding + 3 * scale);
        
        if (scoreboard.length === 0) {
            // Empty state - improved styling
            const emptyFontSize = Math.max(9, 10 * scale);
            this.ctx.font = `${emptyFontSize}px "Roboto Mono", monospace`;
            this.ctx.fillStyle = '#b0b0b0'; // Better contrast
            this.ctx.textAlign = 'center';
            this.ctx.fillText('No scores yet', cardX + cardWidth / 2, y + padding + 40 * scale);
            this.ctx.fillText('Play to set records!', cardX + cardWidth / 2, y + padding + 55 * scale);
            return;
        }
        
        // Draw entries (show top 5)
        const entriesToShow = Math.min(scoreboard.length, 5);
        let entryY = y + padding + 30 * scale; // Slightly increased spacing from header
        
        // Calculate available width for text
        const textAreaWidth = cardWidth - padding * 2 - 8 * scale; // Account for padding and margins
        
        for (let i = 0; i < entriesToShow; i++) {
            const entry = scoreboard[i];
            const rank = i + 1;
            
            // Entry background
            const entryBgY = entryY - entryPadding;
            const entryBgHeight = entryHeight - entryPadding * 2;
            
            // Rank-based colors - improved contrast
            let bgColor, borderColor, rankColor;
            if (rank === 1) {
                bgColor = 'rgba(255, 215, 0, 0.18)'; // Slightly more visible
                borderColor = 'rgba(255, 215, 0, 0.35)';
                rankColor = '#ffd700';
            } else if (rank === 2) {
                bgColor = 'rgba(192, 192, 192, 0.15)';
                borderColor = 'rgba(192, 192, 192, 0.3)';
                rankColor = '#c0c0c0';
            } else if (rank === 3) {
                bgColor = 'rgba(205, 127, 50, 0.15)';
                borderColor = 'rgba(205, 127, 50, 0.3)';
                rankColor = '#cd7f32';
            } else {
                bgColor = 'rgba(255, 255, 255, 0.04)';
                borderColor = 'rgba(255, 255, 255, 0.08)';
                rankColor = '#b0b0b0'; // Slightly brighter
            }
            
            // Draw entry background
            this.ctx.fillStyle = bgColor;
            this.ctx.fillRect(cardX + padding, entryBgY, cardWidth - padding * 2, entryBgHeight);
            
            // Draw entry border
            this.ctx.strokeStyle = borderColor;
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(cardX + padding, entryBgY, cardWidth - padding * 2, entryBgHeight);
            
            // Rank - improved font size
            const rankFontSize = Math.max(9, 10 * scale);
            this.ctx.font = `bold ${rankFontSize}px "Roboto Mono", monospace`;
            this.ctx.fillStyle = rankColor;
            this.ctx.textAlign = 'left';
            const rankText = rank === 1 ? '🥇 #1' : rank === 2 ? '🥈 #2' : rank === 3 ? '🥉 #3' : `#${rank}`;
            this.ctx.fillText(rankText, cardX + padding + 4 * scale, entryY);
            
            // Score (large, prominent) - improved spacing and text measurement, right-aligned, moved up
            const scoreFontSize = Math.max(13, 15 * scale);
            this.ctx.font = `bold ${scoreFontSize}px "Roboto Mono", monospace`;
            const scoreText = (entry.score || 0).toLocaleString();
            // Measure and adjust if needed
            const scoreTextWidth = this.ctx.measureText(scoreText).width;
            if (scoreTextWidth > textAreaWidth) {
                const scaleFactor = textAreaWidth / scoreTextWidth;
                const adjustedFontSize = Math.max(10, scoreFontSize * scaleFactor);
                this.ctx.font = `bold ${adjustedFontSize}px "Roboto Mono", monospace`;
            }
            this.ctx.fillStyle = '#ff5252';
            this.ctx.textAlign = 'right';
            this.ctx.fillText(scoreText, cardX + cardWidth - padding - 4 * scale, entryY + 14 * scale);
            
            // Details (wave, kills, time) - improved font size and spacing, left-aligned, moved up
            const detailFontSize = Math.max(8, 9 * scale);
            this.ctx.font = `${detailFontSize}px "Roboto Mono", monospace`;
            this.ctx.fillStyle = '#b0b0b0'; // Better contrast
            this.ctx.textAlign = 'left'; // Left-align stats
            let detailY = entryY + 26 * scale; // Moved up more
            
            // Calculate column positions for better alignment
            const leftColX = cardX + padding + 4 * scale;
            const rightColX = cardX + padding + 120 * scale; // Better column spacing
            
            // Wave and Kills on same line - with text measurement
            const waveText = `Wave: ${entry.wave || 0}`;
            this.ctx.fillText(waveText, leftColX, detailY);
            
            const killsText = `Kills: ${(entry.kills || 0).toLocaleString()}`;
            // Measure kills text and adjust if needed
            this.ctx.font = `${detailFontSize}px "Roboto Mono", monospace`;
            const killsTextWidth = this.ctx.measureText(killsText).width;
            const availableRightWidth = textAreaWidth - (rightColX - leftColX);
            if (killsTextWidth > availableRightWidth) {
                // Truncate large kill counts
                const truncatedKills = (entry.kills || 0) > 9999 ? '9999+' : (entry.kills || 0).toLocaleString();
                this.ctx.fillText(`Kills: ${truncatedKills}`, rightColX, detailY);
            } else {
                this.ctx.fillText(killsText, rightColX, detailY);
            }
            detailY += 12 * scale; // Line spacing
            
            // Time and Multiplier - with text measurement
            const timeText = formatTime(entry.timeSurvived || 0);
            const timeLabel = `Time: ${timeText}`;
            this.ctx.font = `${detailFontSize}px "Roboto Mono", monospace`;
            const timeTextWidth = this.ctx.measureText(timeLabel).width;
            if (timeTextWidth > availableRightWidth) {
                // Truncate long time strings
                const truncatedTime = timeText.length > 10 ? timeText.substring(0, 10) + '...' : timeText;
                this.ctx.fillText(`Time: ${truncatedTime}`, leftColX, detailY);
            } else {
                this.ctx.fillText(timeLabel, leftColX, detailY);
            }
            
            if (entry.maxMultiplier) {
                const multiplierText = `${entry.maxMultiplier.toFixed(1)}x`;
                this.ctx.font = `${detailFontSize}px "Roboto Mono", monospace`;
                const multiplierWidth = this.ctx.measureText(multiplierText).width;
                if (multiplierWidth <= availableRightWidth) {
                    this.ctx.fillText(multiplierText, rightColX, detailY);
                }
            }
            
            entryY += entryHeight;
        }
        
        // Show "and X more" if there are more than 5 entries - improved positioning
        if (scoreboard.length > 5) {
            const moreFontSize = Math.max(9, 10 * scale);
            this.ctx.font = `${moreFontSize}px "Roboto Mono", monospace`;
            this.ctx.fillStyle = '#b0b0b0'; // Better contrast
            this.ctx.textAlign = 'center';
            const moreText = `+${scoreboard.length - 5} more`;
            // Better vertical positioning with padding
            this.ctx.fillText(moreText, cardX + cardWidth / 2, entryY - entryPadding + 4 * scale);
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

    drawVersionBox() {
        const version = "V0.8.2.0 ALPHA";
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

        // Add extra padding to prevent text overflow
        const panelWidth = maxWidth + textPadding * 2 + (20 * scale);
        const panelHeight = lines.length * lineHeight + textPadding * 2;
        
        // Position to the right of version box, at same Y level (top left)
        const webgpuIconWidth = 75;
        const versionBoxHeight = 24;
        // Calculate version box width (same logic as drawVersionBox)
        this.ctx.font = 'bold 12px "Roboto Mono", monospace';
        const versionTextWidth = this.ctx.measureText("V0.8.2.0 ALPHA").width;
        const versionBoxWidth = versionTextWidth + 24;
        // Position to the right of version box
        const panelX = padding + webgpuIconWidth + spacing + versionBoxWidth + spacing;
        const panelY = padding;

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

    checkButtonClick(x, y) {
        // Check username modal clicks first
        if (gameState.showUsernameModal) {
            return this.checkUsernameModalClick(x, y);
        }

        const centerX = this.canvas.width / 2;
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
        if (x >= usernameBoxX && x <= usernameBoxX + usernameBoxWidth &&
            y >= usernameBoxY && y <= usernameBoxY + usernameBoxHeight) {
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
        if (x >= leftColumnX && x <= leftColumnX + mainMenuButtonWidth) {
            if (y >= row1Y - mainMenuButtonHeight / 2 && y <= row1Y + mainMenuButtonHeight / 2) return 'single';
            if (y >= row2Y - mainMenuButtonHeight / 2 && y <= row2Y + mainMenuButtonHeight / 2) return 'campaign';
            if (y >= row3Y - mainMenuButtonHeight / 2 && y <= row3Y + mainMenuButtonHeight / 2) return 'play_ai';
            if (y >= row4Y - mainMenuButtonHeight / 2 && y <= row4Y + mainMenuButtonHeight / 2) return 'multiplayer';
            if (y >= row5Y - mainMenuButtonHeight / 2 && y <= row5Y + mainMenuButtonHeight / 2) return 'profile';
        }

        // Check right column
        if (x >= rightColumnX && x <= rightColumnX + mainMenuButtonWidth) {
            if (y >= row1Y - mainMenuButtonHeight / 2 && y <= row1Y + mainMenuButtonHeight / 2) return 'survival';
            if (y >= row2Y - mainMenuButtonHeight / 2 && y <= row2Y + mainMenuButtonHeight / 2) return 'local_coop';
            if (y >= row3Y - mainMenuButtonHeight / 2 && y <= row3Y + mainMenuButtonHeight / 2) return 'settings';
            if (y >= row4Y - mainMenuButtonHeight / 2 && y <= row4Y + mainMenuButtonHeight / 2) return 'gallery';
            if (y >= row5Y - mainMenuButtonHeight / 2 && y <= row5Y + mainMenuButtonHeight / 2) return 'achievements';
        }

        // Check centered buttons (row 6 and 7)
        const row7Y = buttonStartY + (mainMenuButtonHeight + buttonSpacing) * 6;
        if (x >= centerX - mainMenuButtonWidth / 2 && x <= centerX + mainMenuButtonWidth / 2) {
            if (y >= row6Y - mainMenuButtonHeight / 2 && y <= row6Y + mainMenuButtonHeight / 2) return 'battlepass';
            if (y >= row7Y - mainMenuButtonHeight / 2 && y <= row7Y + mainMenuButtonHeight / 2) return 'about';
        }

        // Check mute button (bottom right)
        const muteButtonSize = 40;
        const muteButtonX = this.canvas.width - 120;
        const muteButtonY = this.canvas.height - 100;
        if (x >= muteButtonX && x <= muteButtonX + muteButtonSize &&
            y >= muteButtonY && y <= muteButtonY + muteButtonSize) {
            return 'mute_music';
        }

        return null;
    }

    updateHover(x, y) {
        // Check username modal hover first
        if (gameState.showUsernameModal) {
            this.hoveredButton = this.checkUsernameModalClick(x, y);
        } else {
            this.hoveredButton = this.checkButtonClick(x, y);
        }
        return this.hoveredButton;
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

    drawUsernameModal() {
        const scale = this.getUIScale();
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;

        // Modal dimensions
        const modalWidth = 500 * scale;
        const modalHeight = 250 * scale;
        const modalX = centerX - modalWidth / 2;
        const modalY = centerY - modalHeight / 2;
        const cornerRadius = 12 * scale;

        // Draw dark overlay background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw modal background with gradient
        this.ctx.save();
        this.ctx.shadowBlur = 30 * scale;
        this.ctx.shadowColor = 'rgba(255, 23, 68, 0.5)';
        
        this.ctx.beginPath();
        this.ctx.roundRect(modalX, modalY, modalWidth, modalHeight, cornerRadius);
        this.ctx.closePath();
        
        const gradient = this.ctx.createLinearGradient(modalX, modalY, modalX, modalY + modalHeight);
        gradient.addColorStop(0, 'rgba(30, 30, 30, 0.98)');
        gradient.addColorStop(1, 'rgba(15, 15, 15, 0.98)');
        this.ctx.fillStyle = gradient;
        this.ctx.fill();
        
        // Border
        this.ctx.shadowBlur = 0;
        this.ctx.strokeStyle = '#ff1744';
        this.ctx.lineWidth = 2 * scale;
        this.ctx.stroke();
        
        this.ctx.restore();

        // Title
        const titleFontSize = Math.max(20, 24 * scale);
        this.ctx.font = `bold ${titleFontSize}px "Roboto Mono", monospace`;
        this.ctx.fillStyle = '#ff1744';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'top';
        this.ctx.shadowBlur = 8 * scale;
        this.ctx.shadowColor = 'rgba(255, 23, 68, 0.6)';
        this.ctx.fillText('Enter Your Name', centerX, modalY + 20 * scale);
        this.ctx.shadowBlur = 0;

        // Input field
        const inputWidth = modalWidth - 80 * scale;
        const inputHeight = 50 * scale;
        const inputX = centerX - inputWidth / 2;
        const inputY = modalY + 70 * scale;
        const inputCornerRadius = 8 * scale;

        // Input background
        this.ctx.save();
        if (this.usernameInputFocused) {
            this.ctx.shadowBlur = 15 * scale;
            this.ctx.shadowColor = 'rgba(255, 152, 0, 0.5)';
        }
        
        this.ctx.beginPath();
        this.ctx.roundRect(inputX, inputY, inputWidth, inputHeight, inputCornerRadius);
        this.ctx.closePath();
        
        const inputGradient = this.ctx.createLinearGradient(inputX, inputY, inputX, inputY + inputHeight);
        inputGradient.addColorStop(0, this.usernameInputFocused ? 'rgba(40, 40, 40, 0.95)' : 'rgba(25, 25, 25, 0.95)');
        inputGradient.addColorStop(1, this.usernameInputFocused ? 'rgba(30, 30, 30, 0.95)' : 'rgba(15, 15, 15, 0.95)');
        this.ctx.fillStyle = inputGradient;
        this.ctx.fill();
        
        // Input border
        this.ctx.shadowBlur = 0;
        this.ctx.strokeStyle = this.usernameInputFocused ? '#ff9800' : '#555555';
        this.ctx.lineWidth = 2 * scale;
        this.ctx.stroke();
        
        this.ctx.restore();

        // Input text
        const inputTextFontSize = Math.max(16, 18 * scale);
        this.ctx.font = `${inputTextFontSize}px "Roboto Mono", monospace`;
        this.ctx.fillStyle = '#e0e0e0';
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'middle';
        
        // Show placeholder if empty
        const displayText = this.usernameInputText || 'Survivor';
        const textColor = this.usernameInputText ? '#e0e0e0' : '#888888';
        this.ctx.fillStyle = textColor;
        
        // Add cursor if focused
        const cursorX = inputX + 15 * scale + this.ctx.measureText(displayText).width;
        const cursorY = inputY + inputHeight / 2;
        
        this.ctx.fillText(displayText, inputX + 15 * scale, cursorY);
        
        // Blinking cursor
        if (this.usernameInputFocused) {
            const cursorBlink = Math.floor(Date.now() / 500) % 2;
            if (cursorBlink) {
                this.ctx.fillStyle = '#ff9800';
                this.ctx.fillRect(cursorX + 2 * scale, cursorY - 12 * scale, 2 * scale, 24 * scale);
            }
        }

        // Buttons
        const buttonWidth = 150 * scale;
        const buttonHeight = 40 * scale;
        const buttonY = modalY + modalHeight - 70 * scale;
        const buttonSpacing = 20 * scale;
        
        const okButtonX = centerX - buttonWidth - buttonSpacing / 2;
        const cancelButtonX = centerX + buttonSpacing / 2;
        
        const okHovered = this.hoveredButton === 'username_ok';
        const cancelHovered = this.hoveredButton === 'username_cancel';
        
        // OK Button
        this.hud.drawMenuButton('OK', okButtonX, buttonY, buttonWidth, buttonHeight, okHovered, false);
        
        // Cancel Button
        this.hud.drawMenuButton('Cancel', cancelButtonX, buttonY, buttonWidth, buttonHeight, cancelHovered, false);
    }

    openUsernameModal() {
        gameState.showUsernameModal = true;
        this.usernameInputText = gameState.username || '';
        this.usernameInputFocused = true;
    }

    closeUsernameModal() {
        gameState.showUsernameModal = false;
        this.usernameInputText = '';
        this.usernameInputFocused = false;
    }

    checkUsernameModalClick(x, y) {
        if (!gameState.showUsernameModal) return null;

        const scale = this.getUIScale();
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;

        const modalWidth = 500 * scale;
        const modalHeight = 250 * scale;
        const modalX = centerX - modalWidth / 2;
        const modalY = centerY - modalHeight / 2;

        // Check if click is outside modal (close on background click)
        if (x < modalX || x > modalX + modalWidth || y < modalY || y > modalY + modalHeight) {
            return 'username_background';
        }

        // Input field
        const inputWidth = modalWidth - 80 * scale;
        const inputHeight = 50 * scale;
        const inputX = centerX - inputWidth / 2;
        const inputY = modalY + 70 * scale;

        if (x >= inputX && x <= inputX + inputWidth && y >= inputY && y <= inputY + inputHeight) {
            return 'username_input';
        }

        // Buttons
        const buttonWidth = 150 * scale;
        const buttonHeight = 40 * scale;
        const buttonY = modalY + modalHeight - 70 * scale;
        const buttonSpacing = 20 * scale;
        
        const okButtonX = centerX - buttonWidth - buttonSpacing / 2;
        const cancelButtonX = centerX + buttonSpacing / 2;

        if (x >= okButtonX && x <= okButtonX + buttonWidth && y >= buttonY && y <= buttonY + buttonHeight) {
            return 'username_ok';
        }

        if (x >= cancelButtonX && x <= cancelButtonX + buttonWidth && y >= buttonY && y <= buttonY + buttonHeight) {
            return 'username_cancel';
        }

        return null;
    }

    handleUsernameModalKey(key) {
        if (!gameState.showUsernameModal || !this.usernameInputFocused) return false;

        if (key === 'Enter') {
            return 'submit';
        } else if (key === 'Escape') {
            return 'cancel';
        } else if (key === 'Backspace') {
            this.usernameInputText = this.usernameInputText.slice(0, -1);
            return true;
        } else if (key.length === 1) {
            // Limit to 20 characters
            if (this.usernameInputText.length < 20) {
                this.usernameInputText += key;
            }
            return true;
        }

        return false;
    }
}

