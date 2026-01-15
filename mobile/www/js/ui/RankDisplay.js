import { ctx } from '../core/canvas.js';
import { rankSystem } from '../systems/RankSystem.js';
import { settingsManager } from '../systems/SettingsManager.js';

/**
 * RankDisplay - UI component for displaying rank information
 */
export class RankDisplay {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
    }

    getUIScale() {
        const scale = settingsManager.getSetting('video', 'uiScale') ?? 1.0;
        return Number.isFinite(scale) && scale > 0 ? scale : 1.0;
    }

    /**
     * Draw rank badge (compact version for menu)
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} size - Size of badge
     */
    drawRankBadge(x, y, size = 60) {
        // Check if rank badge should be shown
        const showRankBadge = settingsManager.getSetting('video', 'showRankBadge') !== false;
        if (!showRankBadge) return;
        
        const scale = this.getUIScale();
        const progress = rankSystem.getProgress();
        
        // Apply rank badge size multiplier
        const rankBadgeSize = settingsManager.getSetting('video', 'rankBadgeSize') || 'normal';
        let sizeMultiplier = 1.0;
        if (rankBadgeSize === 'small') sizeMultiplier = 0.8;
        else if (rankBadgeSize === 'large') sizeMultiplier = 1.2;
        
        const scaledSize = size * scale * sizeMultiplier;

        // Enable better text rendering quality
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';

        // Badge background (circular)
        const centerX = x + scaledSize / 2;
        const centerY = y + scaledSize / 2;
        const radius = scaledSize / 2;

        // Outer glow
        this.ctx.shadowBlur = 15 * scale;
        this.ctx.shadowColor = '#ff6b00';
        this.ctx.fillStyle = 'rgba(42, 42, 42, 0.9)';
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.shadowBlur = 0;

        // Border
        this.ctx.strokeStyle = '#ff6b00';
        this.ctx.lineWidth = 3 * scale;
        this.ctx.stroke();

        // Rank text - increased size and improved rendering
        const rankFontSize = Math.max(12, 14 * scale);
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = `bold ${rankFontSize}px 'Roboto Mono', monospace`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        // Add text shadow for better visibility
        this.ctx.shadowBlur = 3 * scale;
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        this.ctx.shadowOffsetX = 1 * scale;
        this.ctx.shadowOffsetY = 1 * scale;
        
        // Calculate better vertical spacing for larger text
        const rankTextY = centerY - 9 * scale;
        this.ctx.fillText(progress.rankName, centerX, rankTextY);
        
        // Reset shadow for tier text
        this.ctx.shadowBlur = 0;
        this.ctx.shadowOffsetX = 0;
        this.ctx.shadowOffsetY = 0;

        // Tier text - increased size and improved rendering
        const tierFontSize = Math.max(10, 12 * scale);
        this.ctx.fillStyle = '#ff6b00';
        this.ctx.font = `bold ${tierFontSize}px 'Roboto Mono', monospace`;
        
        // Add subtle text shadow for tier text
        this.ctx.shadowBlur = 2 * scale;
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
        this.ctx.shadowOffsetX = 1 * scale;
        this.ctx.shadowOffsetY = 1 * scale;
        
        // Calculate better vertical spacing for larger text
        const tierTextY = centerY + 9 * scale;
        this.ctx.fillText(`Tier ${progress.rankTier}`, centerX, tierTextY);
        
        // Reset shadow
        this.ctx.shadowBlur = 0;
        this.ctx.shadowOffsetX = 0;
        this.ctx.shadowOffsetY = 0;
    }

    /**
     * Draw rank progress bar
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} width - Width of bar
     * @param {number} height - Height of bar
     */
    drawRankProgressBar(x, y, width, height) {
        const scale = this.getUIScale();
        const progress = rankSystem.getProgress();

        // Background
        this.ctx.fillStyle = 'rgba(42, 42, 42, 0.85)';
        this.ctx.fillRect(x, y, width, height);

        // Progress fill
        const fillWidth = (width * progress.progressPercent) / 100;
        const gradient = this.ctx.createLinearGradient(x, y, x + fillWidth, y);
        gradient.addColorStop(0, '#ff6b00');
        gradient.addColorStop(1, '#ff8c00');

        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(x, y, fillWidth, height);

        // Border
        this.ctx.strokeStyle = '#ff6b00';
        this.ctx.lineWidth = 2 * scale;
        this.ctx.strokeRect(x, y, width, height);

        // Text
        const fontSize = Math.max(10, 12 * scale);
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = `bold ${fontSize}px 'Roboto Mono', monospace`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        const text = `${progress.currentTierXP} / ${progress.nextTierXP} XP`;
        this.ctx.fillText(text, x + width / 2, y + height / 2);
    }

    /**
     * Draw full rank display (for profile screen)
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} width - Width of display
     */
    drawFullRankDisplay(x, y, width) {
        const scale = this.getUIScale();
        const progress = rankSystem.getProgress();
        const padding = 20 * scale;
        const height = 150 * scale;

        // Background
        this.ctx.fillStyle = 'rgba(42, 42, 42, 0.9)';
        this.ctx.fillRect(x, y, width, height);

        // Border
        this.ctx.strokeStyle = '#ff6b00';
        this.ctx.lineWidth = 2 * scale;
        this.ctx.strokeRect(x, y, width, height);

        // Rank badge (left side)
        const badgeSize = 80 * scale;
        const badgeX = x + padding;
        const badgeY = y + padding;
        this.drawRankBadge(badgeX, badgeY, badgeSize);

        // Rank info (right side)
        const infoX = x + badgeSize + padding * 2;
        const infoY = y + padding;
        const infoWidth = width - badgeSize - padding * 3;

        const fontSize = Math.max(12, 16 * scale);
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = `bold ${fontSize}px 'Roboto Mono', monospace`;
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'top';

        // Rank name
        this.ctx.fillText(progress.rankName, infoX, infoY);
        
        // Tier
        this.ctx.fillStyle = '#ff6b00';
        this.ctx.font = `${Math.max(10, 14 * scale)}px 'Roboto Mono', monospace`;
        this.ctx.fillText(`Tier ${progress.rankTier}`, infoX, infoY + fontSize + 5 * scale);

        // Progress bar
        const barHeight = 20 * scale;
        const barY = infoY + fontSize * 2 + 15 * scale;
        this.drawRankProgressBar(infoX, barY, infoWidth, barHeight);

        // Total rank XP
        this.ctx.fillStyle = '#aaaaaa';
        this.ctx.font = `${Math.max(9, 11 * scale)}px 'Roboto Mono', monospace`;
        this.ctx.fillText(`Total Rank XP: ${progress.rankXP.toLocaleString()}`, infoX, barY + barHeight + 10 * scale);
    }
}

