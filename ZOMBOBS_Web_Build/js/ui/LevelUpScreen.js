import { gameState } from '../core/gameState.js';
import { settingsManager } from '../systems/SettingsManager.js';

export class LevelUpScreen {
    constructor(canvas, ctx, hud) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.hud = hud;
        this.hoveredSkillIndex = null;
    }

    getUIScale() {
        return this.hud.getUIScale();
    }

    draw() {
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

    checkClick(x, y) {
        if (!gameState.showLevelUp || !gameState.levelUpChoices || gameState.levelUpChoices.length === 0) {
            return null;
        }

        const canvas = this.canvas;
        const scale = this.getUIScale();
        const cardWidth = 300 * scale;
        const cardHeight = 400 * scale;
        const cardSpacing = 40 * scale;
        const totalWidth = (cardWidth * 3) + (cardSpacing * 2);
        const startX = (canvas.width - totalWidth) / 2;
        const cardY = canvas.height / 2 - cardHeight / 2 + 40 * scale;

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
}

