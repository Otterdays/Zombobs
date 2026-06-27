import { gameState } from '../core/gameState.js';
import { settingsManager } from '../systems/SettingsManager.js';
import { SKILL_RARITY, SKILL_TREES } from '../systems/SkillSystem.js';

export class LevelUpScreen {
    constructor(canvas, ctx, hud) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.hud = hud;
        this.hoveredSkillIndex = null;
        this.animationStart = 0;
    }

    getUIScale() {
        return this.hud.getUIScale();
    }

    /**
     * Get rarity-based glow color
     * @param {string} rarity - Skill rarity key
     * @returns {string} Glow color
     */
    getRarityGlow(rarity) {
        const rarityInfo = SKILL_RARITY[rarity] || SKILL_RARITY.COMMON;
        return rarityInfo.color;
    }

    /**
     * Get rarity-based border gradient
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {number} x - Start X
     * @param {number} y - Start Y
     * @param {number} width - Width
     * @param {number} height - Height
     * @param {string} rarity - Skill rarity key
     * @returns {CanvasGradient} Gradient
     */
    getRarityGradient(ctx, x, y, width, height, rarity) {
        const gradient = ctx.createLinearGradient(x, y, x + width, y + height);
        const rarityInfo = SKILL_RARITY[rarity] || SKILL_RARITY.COMMON;

        switch (rarity) {
            case 'LEGENDARY':
                gradient.addColorStop(0, '#ffd700');
                gradient.addColorStop(0.5, '#ffaa00');
                gradient.addColorStop(1, '#ffd700');
                break;
            case 'EPIC':
                gradient.addColorStop(0, '#be4bdb');
                gradient.addColorStop(0.5, '#9c36b5');
                gradient.addColorStop(1, '#be4bdb');
                break;
            case 'RARE':
                gradient.addColorStop(0, '#4dabf7');
                gradient.addColorStop(0.5, '#339af0');
                gradient.addColorStop(1, '#4dabf7');
                break;
            default:
                gradient.addColorStop(0, '#a0a0a0');
                gradient.addColorStop(0.5, '#808080');
                gradient.addColorStop(1, '#a0a0a0');
        }

        return gradient;
    }

    draw() {
        const canvas = this.canvas;
        const ctx = this.ctx;

        // Track animation time
        if (this.animationStart === 0) {
            this.animationStart = Date.now();
        }
        const animTime = (Date.now() - this.animationStart) / 1000;

        // Darken background with animated vignette
        ctx.fillStyle = 'rgba(0, 0, 0, 0.88)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Add subtle radial glow in center
        const centerGlow = ctx.createRadialGradient(
            canvas.width / 2, canvas.height / 2, 0,
            canvas.width / 2, canvas.height / 2, canvas.height * 0.6
        );
        centerGlow.addColorStop(0, 'rgba(255, 193, 7, 0.08)');
        centerGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = centerGlow;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Title with animated glow
        ctx.save();
        const scale = this.getUIScale();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Pulsing glow effect
        const glowIntensity = 15 + Math.sin(animTime * 3) * 5;
        ctx.shadowBlur = glowIntensity * scale;
        ctx.shadowColor = '#ffc107';
        ctx.fillStyle = '#ffc107';
        const titleFontSize = Math.max(32, 48 * scale);
        ctx.font = `bold ${titleFontSize}px "Roboto Mono", monospace`;
        ctx.fillText('LEVEL UP!', canvas.width / 2, 80 * scale);
        ctx.shadowBlur = 0;

        // Level display with XP info
        ctx.fillStyle = '#ffffff';
        const levelFontSize = Math.max(16, 24 * scale);
        ctx.font = `${levelFontSize}px "Roboto Mono", monospace`;
        ctx.fillText(`Level ${gameState.level}`, canvas.width / 2, 120 * scale);

        // Subtitle
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        const subFontSize = Math.max(12, 16 * scale);
        ctx.font = `${subFontSize}px "Roboto Mono", monospace`;
        ctx.fillText('Choose a skill to enhance your abilities', canvas.width / 2, 150 * scale);
        ctx.restore();

        // Draw skill cards with rarity styling
        const cardWidth = 280 * scale;
        const cardHeight = 380 * scale;
        const cardSpacing = 35 * scale;
        const totalWidth = (cardWidth * 3) + (cardSpacing * 2);
        const startX = (canvas.width - totalWidth) / 2;
        const cardY = canvas.height / 2 - cardHeight / 2 + 30 * scale;

        gameState.levelUpChoices.forEach((skill, index) => {
            const cardX = startX + (index * (cardWidth + cardSpacing));
            const isHovered = this.hoveredSkillIndex === index;
            const rarity = skill.rarity || 'COMMON';
            const rarityInfo = SKILL_RARITY[rarity] || SKILL_RARITY.COMMON;

            // Card entrance animation (stagger)
            const cardDelay = index * 0.1;
            const cardProgress = Math.min(1, (animTime - cardDelay) * 3);
            if (cardProgress <= 0) return;

            ctx.save();
            ctx.globalAlpha = cardProgress;

            // Card glow for legendary/epic
            if (rarity === 'LEGENDARY' || rarity === 'EPIC') {
                ctx.shadowBlur = isHovered ? 25 : 15;
                ctx.shadowColor = rarityInfo.color;
            }

            // Card background with rarity tint
            const bgGradient = ctx.createLinearGradient(cardX, cardY, cardX, cardY + cardHeight);
            if (isHovered) {
                bgGradient.addColorStop(0, `${rarityInfo.color}40`);
                bgGradient.addColorStop(1, `${rarityInfo.color}20`);
            } else {
                bgGradient.addColorStop(0, 'rgba(42, 42, 42, 0.95)');
                bgGradient.addColorStop(0.5, 'rgba(32, 32, 32, 0.95)');
                bgGradient.addColorStop(1, 'rgba(26, 26, 26, 0.95)');
            }
            ctx.fillStyle = bgGradient;

            // Rounded rectangle
            this.roundRect(ctx, cardX, cardY, cardWidth, cardHeight, 12 * scale);
            ctx.fill();

            // Card border with rarity color
            const borderGradient = this.getRarityGradient(ctx, cardX, cardY, cardWidth, cardHeight, rarity);
            ctx.strokeStyle = isHovered ? borderGradient : (rarity === 'COMMON' ? '#555555' : borderGradient);
            ctx.lineWidth = isHovered ? 4 : (rarity === 'LEGENDARY' ? 3 : 2);
            ctx.stroke();
            ctx.shadowBlur = 0;

            // Tree path badge (tree-exclusive skills)
            let badgeYOffset = 0;
            if (skill.tree && SKILL_TREES[skill.tree]) {
                const treeInfo = SKILL_TREES[skill.tree];
                const treeBadgeY = cardY + 14 * scale;
                ctx.fillStyle = treeInfo.color;
                ctx.font = `bold ${Math.max(9, 11 * scale)}px "Roboto Mono", monospace`;
                ctx.textAlign = 'center';
                ctx.fillText(
                    `${treeInfo.icon} ${treeInfo.name.toUpperCase()} · T${skill.tier}/5`,
                    cardX + cardWidth / 2,
                    treeBadgeY
                );
                badgeYOffset = 14 * scale;
            }

            // Rarity badge at top
            const badgeY = cardY + 20 * scale + badgeYOffset;
            ctx.fillStyle = rarityInfo.color;
            ctx.font = `bold ${Math.max(10, 12 * scale)}px "Roboto Mono", monospace`;
            ctx.textAlign = 'center';
            ctx.fillText(rarityInfo.name.toUpperCase(), cardX + cardWidth / 2, badgeY);

            // Divider line
            ctx.strokeStyle = `${rarityInfo.color}60`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(cardX + 20 * scale, badgeY + 15 * scale);
            ctx.lineTo(cardX + cardWidth - 20 * scale, badgeY + 15 * scale);
            ctx.stroke();

            // Icon with glow for rare+ skills
            if (rarity !== 'COMMON') {
                ctx.shadowBlur = 10;
                ctx.shadowColor = rarityInfo.color;
            }
            const iconFontSize = 56 * scale;
            ctx.font = `${iconFontSize}px serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(skill.icon, cardX + cardWidth / 2, cardY + 100 * scale);
            ctx.shadowBlur = 0;

            // Skill name
            ctx.fillStyle = '#ffffff';
            const skillNameFontSize = Math.max(14, 20 * scale);
            ctx.font = `bold ${skillNameFontSize}px "Roboto Mono", monospace`;
            ctx.fillText(skill.name, cardX + cardWidth / 2, cardY + 165 * scale);

            // Tree tagline
            if (skill.tagline) {
                ctx.fillStyle = SKILL_TREES[skill.tree]?.color || '#888888';
                const tagFontSize = Math.max(9, 12 * scale);
                ctx.font = `italic ${tagFontSize}px "Roboto Mono", monospace`;
                ctx.fillText(`"${skill.tagline}"`, cardX + cardWidth / 2, cardY + 188 * scale);
            }

            // Description
            ctx.fillStyle = '#cccccc';
            const descFontSize = Math.max(10, 14 * scale);
            ctx.font = `${descFontSize}px "Roboto Mono", monospace`;
            const descriptionLines = this.wrapText(ctx, skill.description, cardWidth - 36 * scale);
            let lineY = cardY + 200 * scale;
            descriptionLines.forEach(line => {
                ctx.fillText(line, cardX + cardWidth / 2, lineY);
                lineY += 22 * scale;
            });

            // Rarity multiplier info
            if (rarityInfo.multiplier > 1.0) {
                ctx.fillStyle = rarityInfo.color;
                const bonusFontSize = Math.max(10, 13 * scale);
                ctx.font = `${bonusFontSize}px "Roboto Mono", monospace`;
                ctx.fillText(`${Math.round((rarityInfo.multiplier - 1) * 100)}% stronger effect`, cardX + cardWidth / 2, cardY + cardHeight - 80 * scale);
            }

            // Check if already owned (upgrade indicator)
            const existingSkill = gameState.activeSkills.find(s => s.id === skill.id);
            if (existingSkill) {
                // Upgrade badge
                ctx.fillStyle = '#ffc107';
                const upgradeFontSize = Math.max(11, 16 * scale);
                ctx.font = `bold ${upgradeFontSize}px "Roboto Mono", monospace`;
                ctx.fillText(`⬆ UPGRADE TO LV.${existingSkill.level + 1}`, cardX + cardWidth / 2, cardY + cardHeight - 45 * scale);
            }

            ctx.restore();
        });

        // Instruction text with subtle animation
        ctx.fillStyle = `rgba(255, 255, 255, ${0.5 + Math.sin(animTime * 2) * 0.2})`;
        const instructionFontSize = Math.max(12, 16 * scale);
        ctx.font = `${instructionFontSize}px "Roboto Mono", monospace`;
        ctx.textAlign = 'center';
        ctx.fillText('Click a skill card to select', canvas.width / 2, canvas.height - 50 * scale);

        // Kill streak bonus info if applicable
        if (gameState.killStreak >= 5) {
            ctx.fillStyle = '#ffc107';
            const bonusText = `Kill Streak: ${gameState.killStreak}x - XP Bonus Active!`;
            ctx.fillText(bonusText, canvas.width / 2, canvas.height - 80 * scale);
        }
    }

    /**
     * Draw a rounded rectangle path
     */
    roundRect(ctx, x, y, width, height, radius) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
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

    checkClick(x, y) {
        if (!gameState.showLevelUp || !gameState.levelUpChoices || gameState.levelUpChoices.length === 0) {
            return null;
        }

        const canvas = this.canvas;
        const scale = this.getUIScale();
        const cardWidth = 280 * scale;
        const cardHeight = 380 * scale;
        const cardSpacing = 35 * scale;
        const totalWidth = (cardWidth * 3) + (cardSpacing * 2);
        const startX = (canvas.width - totalWidth) / 2;
        const cardY = canvas.height / 2 - cardHeight / 2 + 30 * scale;

        for (let i = 0; i < gameState.levelUpChoices.length; i++) {
            const cardX = startX + (i * (cardWidth + cardSpacing));
            if (x >= cardX && x <= cardX + cardWidth && y >= cardY && y <= cardY + cardHeight) {
                return i;
            }
        }

        return null;
    }

    updateHover(x, y) {
        this.hoveredSkillIndex = this.checkClick(x, y);
        return this.hoveredSkillIndex;
    }

    /**
     * Reset animation state when level up screen closes
     */
    reset() {
        this.animationStart = 0;
        this.hoveredSkillIndex = null;
    }
}
