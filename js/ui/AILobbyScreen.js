import { gameState } from '../core/gameState.js';
import { settingsManager } from '../systems/SettingsManager.js';

export class AILobbyScreen {
    constructor(canvas, ctx, hud) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.hud = hud;
        this.hoveredButton = null;
    }

    getUIScale() {
        return this.hud.getUIScale();
    }

    draw() {
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
        this.hud.drawMenuButton(addBotText, centerX - buttonWidth / 2, addBotY, buttonWidth, buttonHeight, addBotHovered, !canAddBot);

        const canStart = gameState.players.length > 1;
        this.hud.drawMenuButton('Start Game', centerX - buttonWidth / 2, startY, buttonWidth, buttonHeight, startHovered, !canStart);
        this.hud.drawMenuButton('Back', centerX - buttonWidth / 2, buttonY + 70, buttonWidth, buttonHeight, backHovered, false);
    }

    checkButtonClick(x, y) {
        const centerX = this.canvas.width / 2;
        const scale = this.getUIScale();
        const buttonWidth = 200 * scale;
        const buttonHeight = 50 * scale;
        const buttonY = this.canvas.height - (150 * scale);
        const addBotY = buttonY - (70 * scale);
        const startY = buttonY;
        const backY = buttonY + 70;

        // Add Bot
        if (x >= centerX - buttonWidth / 2 && x <= centerX + buttonWidth / 2 &&
            y >= addBotY && y <= addBotY + buttonHeight) {
            return 'ai_add';
        }
        // Start Game
        if (x >= centerX - buttonWidth / 2 && x <= centerX + buttonWidth / 2 &&
            y >= startY && y <= startY + buttonHeight) {
            return 'ai_start';
        }
        // Back
        if (x >= centerX - buttonWidth / 2 && x <= centerX + buttonWidth / 2 &&
            y >= backY && y <= backY + buttonHeight) {
            return 'ai_back';
        }
        return null;
    }

    updateHover(x, y) {
        this.hoveredButton = this.checkButtonClick(x, y);
        return this.hoveredButton;
    }
}

