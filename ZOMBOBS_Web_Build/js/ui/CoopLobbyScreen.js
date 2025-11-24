import { gameState } from '../core/gameState.js';
import { settingsManager } from '../systems/SettingsManager.js';

export class CoopLobbyScreen {
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

        this.hud.drawMenuButton('Start Game', centerX - buttonWidth / 2, buttonY - 70, buttonWidth, buttonHeight, startHovered, !canStart);
        this.hud.drawMenuButton('Back', centerX - buttonWidth / 2, buttonY, buttonWidth, buttonHeight, backHovered, false);
    }

    checkButtonClick(x, y) {
        const centerX = this.canvas.width / 2;
        const buttonWidth = 200;
        const buttonHeight = 50;
        const buttonY = this.canvas.height - 100;
        const startY = buttonY - 70;

        // Start Game
        if (x >= centerX - buttonWidth / 2 && x <= centerX + buttonWidth / 2 &&
            y >= startY - 70 && y <= startY - 70 + buttonHeight) {
            return 'coop_start';
        }
        // Back
        if (x >= centerX - buttonWidth / 2 && x <= centerX + buttonWidth / 2 &&
            y >= buttonY && y <= buttonY + buttonHeight) {
            return 'coop_back';
        }
        return null;
    }

    updateHover(x, y) {
        this.hoveredButton = this.checkButtonClick(x, y);
        return this.hoveredButton;
    }
}

