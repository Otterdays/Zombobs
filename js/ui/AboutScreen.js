import { gameState } from '../core/gameState.js';
import { settingsManager } from '../systems/SettingsManager.js';

export class AboutScreen {
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
        this.hud.drawCreepyBackground();

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
        this.ctx.fillText('Version: V0.8.1.6 ALPHA', centerX, y);
        y += 30;
        
        this.ctx.fillText('Engine: ZOMBS-XFX-NGIN V0.8.1.6 ALPHA', centerX, y);
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
        this.hud.drawMenuButton('Back', centerX - buttonWidth / 2, backY - buttonHeight / 2, buttonWidth, buttonHeight, this.hoveredButton === 'about_back', false);
    }

    checkButtonClick(x, y) {
        const centerX = this.canvas.width / 2;
        const scale = this.getUIScale();
        const mainMenuButtonWidth = 240 * scale;
        const mainMenuButtonHeight = 50 * scale;
        const backY = this.canvas.height - 100;

        // Check About screen back button
        if (x >= centerX - mainMenuButtonWidth / 2 && x <= centerX + mainMenuButtonWidth / 2 &&
            y >= backY - mainMenuButtonHeight / 2 && y <= backY + mainMenuButtonHeight / 2) {
            return 'about_back';
        }
        return null;
    }

    updateHover(x, y) {
        this.hoveredButton = this.checkButtonClick(x, y);
        return this.hoveredButton;
    }
}

