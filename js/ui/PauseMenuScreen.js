import { gameState } from '../core/gameState.js';
import { settingsManager } from '../systems/SettingsManager.js';

export class PauseMenuScreen {
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
        this.hud.drawMenuButton('Resume', centerX - buttonWidth / 2, resumeY - buttonHeight / 2, buttonWidth, buttonHeight, this.hoveredButton === 'pause_resume', false);
        this.hud.drawMenuButton('Restart', centerX - buttonWidth / 2, restartY - buttonHeight / 2, buttonWidth, buttonHeight, this.hoveredButton === 'pause_restart', false);
        this.hud.drawMenuButton('Settings', centerX - buttonWidth / 2, settingsY - buttonHeight / 2, buttonWidth, buttonHeight, this.hoveredButton === 'pause_settings', false);
        this.hud.drawMenuButton('Return to Menu', centerX - buttonWidth / 2, menuY - buttonHeight / 2, buttonWidth, buttonHeight, this.hoveredButton === 'pause_menu', false);
    }

    checkButtonClick(x, y) {
        const centerX = this.canvas.width / 2;
        const scale = this.getUIScale();
        const pauseButtonWidth = 180 * scale;
        const pauseButtonHeight = 36 * scale;
        const pauseButtonSpacing = 15 * scale;
        const centerY = this.canvas.height / 2;
        const buttonStartY = centerY;

        const resumeY = buttonStartY;
        const restartY = buttonStartY + (pauseButtonHeight + pauseButtonSpacing);
        const settingsY = buttonStartY + (pauseButtonHeight + pauseButtonSpacing) * 2;
        const menuY = buttonStartY + (pauseButtonHeight + pauseButtonSpacing) * 3;

        // Resume button
        if (x >= centerX - pauseButtonWidth / 2 && x <= centerX + pauseButtonWidth / 2 &&
            y >= resumeY - pauseButtonHeight / 2 && y <= resumeY + pauseButtonHeight / 2) {
            return 'pause_resume';
        }
        // Restart button
        if (x >= centerX - pauseButtonWidth / 2 && x <= centerX + pauseButtonWidth / 2 &&
            y >= restartY - pauseButtonHeight / 2 && y <= restartY + pauseButtonHeight / 2) {
            return 'pause_restart';
        }
        // Settings button
        if (x >= centerX - pauseButtonWidth / 2 && x <= centerX + pauseButtonWidth / 2 &&
            y >= settingsY - pauseButtonHeight / 2 && y <= settingsY + pauseButtonHeight / 2) {
            return 'pause_settings';
        }
        // Return to Menu button
        if (x >= centerX - pauseButtonWidth / 2 && x <= centerX + pauseButtonWidth / 2 &&
            y >= menuY - pauseButtonHeight / 2 && y <= menuY + pauseButtonHeight / 2) {
            return 'pause_menu';
        }
        return null;
    }

    updateHover(x, y) {
        this.hoveredButton = this.checkButtonClick(x, y);
        return this.hoveredButton;
    }
}

