import { gameState } from '../core/gameState.js';

export class CampaignIntroScreen {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.active = false;
        this.startTime = 0;
        this.phase = 'idle'; // idle, fizzle, black, text, fadein
        this.onStartGame = null;
        
        // Story text
        this.lines = [
            "DAY 0...",
            "THE SIGNAL WAS LOST.",
            "THEY CAME FROM THE SHADOWS.",
            "NOW, WE SURVIVE."
        ];
        
        this.currentLineIndex = 0;
        this.textAlpha = 0;
    }

    start(onStartGame) {
        this.active = true;
        this.startTime = Date.now();
        this.phase = 'fizzle';
        this.currentLineIndex = 0;
        this.textAlpha = 0;
        this.onStartGame = onStartGame;
        
        // Stop menu music or play eerie sound here
    }

    update() {
        if (!this.active) return;

        const now = Date.now();
        const elapsed = now - this.startTime;

        if (this.phase === 'fizzle') {
            if (elapsed > 2000) { // 2 seconds of fizzle
                this.phase = 'black';
                this.startTime = now; // Reset timer for next phase
            }
        } else if (this.phase === 'black') {
            if (elapsed > 1000) { // 1 second of pure black
                this.phase = 'text';
                this.startTime = now;
            }
        } else if (this.phase === 'text') {
            // Logic handled in draw for typing/fading
            // Total text time: 4 lines * 2s each = 8s
            if (elapsed > 8000) {
                this.phase = 'fadein';
                this.startTime = now;
                // Actually start the game logic here so it's ready behind the fade
                if (!gameState.gameRunning && this.onStartGame) {
                   this.onStartGame();
                }
            }
        } else if (this.phase === 'fadein') {
            if (elapsed > 2000) {
                this.active = false;
                gameState.showCampaignIntro = false;
                gameState.showMainMenu = false;
                // Game should be fully visible now
            }
        }
    }

    draw() {
        if (!this.active) return;

        const now = Date.now();
        const elapsed = now - this.startTime;
        const width = this.canvas.width;
        const height = this.canvas.height;

        if (this.phase === 'fizzle') {
            // Draw semi-transparent black overlay that gets darker
            // This allows the main menu to be seen "underneath" initially
            // Note: We rely on the main loop continuing to draw the menu BEHIND us
            // But currently the main loop stops drawing the menu when showCampaignIntro is true.
            // We need to fix the main loop to keep drawing the menu if we want a true fade out.
            // OR we just simulate it by not clearing the screen (which canvas does anyway)
            // BUT since we are in a game loop that likely clears screen, we need to handle this.
            
            const intensity = elapsed / 2000; // 0 to 1

            // 1. Static Noise
            this.ctx.fillStyle = `rgba(0, 0, 0, ${intensity})`; // Fade to black slowly
            this.ctx.fillRect(0, 0, width, height);

            // 2. White Noise / Fuzz
            const imageData = this.ctx.getImageData(0, 0, width, height);
            const data = imageData.data;
            
            // Optimization: Don't do full screen pixel manipulation every frame if avoidable
            // Instead, draw random noise rectangles
            
            this.ctx.save();
            this.ctx.globalCompositeOperation = 'overlay';
            for (let i = 0; i < 50 * intensity; i++) {
                const x = Math.random() * width;
                const y = Math.random() * height;
                const w = Math.random() * 100;
                const h = Math.random() * 5;
                this.ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
                this.ctx.fillRect(x, y, w, h);
            }
            
            // 3. Scanlines / Glitch
            if (Math.random() < intensity * 0.3) {
                const y = Math.random() * height;
                const h = Math.random() * 50;
                const offset = (Math.random() - 0.5) * 50;
                // Simple shift effect would require getImageData/putImageData which is slow
                // Let's just draw a colored bar
                this.ctx.fillStyle = `rgba(255, 0, 0, ${0.1})`;
                this.ctx.fillRect(0, y, width, h);
            }
            this.ctx.restore();

        } else if (this.phase === 'black') {
            this.ctx.fillStyle = '#000000';
            this.ctx.fillRect(0, 0, width, height);

        } else if (this.phase === 'text') {
            this.ctx.fillStyle = '#000000';
            this.ctx.fillRect(0, 0, width, height);

            // Text Logic
            // 2 seconds per line
            const lineDuration = 2000;
            const lineIndex = Math.floor(elapsed / lineDuration);
            const lineElapsed = elapsed % lineDuration;
            
            // Draw previous lines fully visible
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.font = 'bold 30px "Courier New", monospace';
            
            const startY = height / 2 - (this.lines.length * 40) / 2;

            for (let i = 0; i < Math.min(lineIndex, this.lines.length); i++) {
                this.ctx.fillStyle = '#ffffff';
                this.ctx.fillText(this.lines[i], width / 2, startY + i * 50);
            }

            // Draw current line fading in
            if (lineIndex < this.lines.length) {
                const alpha = Math.min(1, lineElapsed / 1000); // Fade in over 1s
                this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
                this.ctx.fillText(this.lines[lineIndex], width / 2, startY + lineIndex * 50);
            }

        } else if (this.phase === 'fadein') {
            // The game should be rendering behind this, so we just draw a fading black rect
            const alpha = 1 - (elapsed / 2000);
            this.ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
            this.ctx.fillRect(0, 0, width, height);
            
            // Draw some overlay text "CAMPAIGN START"
            if (alpha > 0.5) {
                this.ctx.font = 'bold 40px "Courier New", monospace';
                this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
                this.ctx.textAlign = 'center';
                this.ctx.fillText("OBJECTIVE: SURVIVE", width / 2, height / 2);
            }
        }
    }
}
