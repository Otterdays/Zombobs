import { ctx } from '../core/canvas.js';

export class Shell {
    constructor(x, y, angle) {
        this.x = x;
        this.y = y;
        this.size = 5; // Size of the shell casing
        this.color = 'rgb(180, 160, 0)'; // Brass color

        // Initial velocity for the shell to eject
        const speed = 2 + Math.random() * 3; // Reduced speed
        // Eject slightly away from the player's firing angle
        // Assuming angle is player's aim angle, eject slightly backwards/sideways
        const ejectAngle = angle + (Math.PI / 2) + (Math.random() - 0.5) * Math.PI / 4; // 90 degrees offset + some randomness

        this.vx = Math.cos(ejectAngle) * speed;
        this.vy = Math.sin(ejectAngle) * speed;

        this.rotation = Math.random() * Math.PI * 2; // Initial random rotation
        this.rotationSpeed = (Math.random() - 0.5) * 0.5; // Random rotation speed

        this.life = 60; // How many frames the shell stays alive (e.g., 1 second at 60 FPS)
        this.fadeThreshold = 30; // When to start fading
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.rotation += this.rotationSpeed;

        // Apply some drag/friction to slow down
        this.vx *= 0.95;
        this.vy *= 0.95;
        this.rotationSpeed *= 0.95;

        // Apply a tiny bit of "gravity" for a more natural fall-like arc in top-down view
        this.vy += 0.1;

        this.life--;
    }

    draw(ctx) {
        if (this.life <= 0) return;

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        // Apply fading effect
        let alpha = 1;
        if (this.life < this.fadeThreshold) {
            alpha = this.life / this.fadeThreshold;
        }
        
        // Parse RGB color properly using regex
        const match = this.color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
        if (match) {
            ctx.fillStyle = `rgba(${match[1]}, ${match[2]}, ${match[3]}, ${alpha})`;
        } else {
            // Fallback to brass color
            ctx.fillStyle = `rgba(180, 160, 0, ${alpha})`;
        }

        ctx.fillRect(-this.size / 2, -this.size / 4, this.size, this.size / 2); // Draw a small rectangle for the shell
        ctx.restore();
    }
}

