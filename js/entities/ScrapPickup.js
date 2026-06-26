import { ctx } from '../core/canvas.js';
import { SCRAP_MAGNETIC_RANGE, SCRAP_VALUE } from '../core/constants.js';

// Scrap Pickup (Bronze/Gold Metal)
export class ScrapPickup {
    constructor(canvasWidth, canvasHeight) {
        const margin = 40;
        this.radius = 8;
        this.x = margin + Math.random() * (canvasWidth - margin * 2);
        this.y = margin + Math.random() * (canvasHeight - margin * 2);
        this.baseY = this.y;
        this.pulseOffset = Math.random() * Math.PI * 2;
        this.type = 'scrap';
        this.value = SCRAP_VALUE;
        this.state = 'stationary'; // 'stationary' | 'magnetic'
        this.magneticRange = SCRAP_MAGNETIC_RANGE;
        this.magneticRangeSq = SCRAP_MAGNETIC_RANGE * SCRAP_MAGNETIC_RANGE;
    }

    draw() {
        if (this.state === 'magnetic') {
            const pulse = 0.5 + Math.sin(Date.now() / 300 + this.pulseOffset) * 0.5;
            ctx.globalAlpha = 0.85;
            this.drawScrap(pulse);
            ctx.globalAlpha = 1.0;
            return;
        }

        this.drawScrap(1.0);
    }

    drawScrap(pulseMultiplier = 1.0) {
        const t = Date.now() / 500 + this.pulseOffset;
        const basePulse = 0.8 + Math.sin(t) * 0.2;
        const pulse = basePulse * pulseMultiplier;

        const glowRadius = this.radius * 2.5 * pulse;
        const glowGradient = ctx.createRadialGradient(
            this.x, this.y, 0,
            this.x, this.y, glowRadius
        );
        if (this.state === 'magnetic') {
            glowGradient.addColorStop(0, 'rgba(255, 215, 0, 0.9)');
            glowGradient.addColorStop(1, 'rgba(184, 134, 11, 0)');
        } else {
            glowGradient.addColorStop(0, 'rgba(205, 149, 109, 0.8)');
            glowGradient.addColorStop(1, 'rgba(139, 69, 19, 0)');
        }
        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, glowRadius, 0, Math.PI * 2);
        ctx.fill();

        const coreGradient = ctx.createRadialGradient(
            this.x - 2, this.y - 2, 0,
            this.x, this.y, this.radius
        );
        if (this.state === 'magnetic') {
            coreGradient.addColorStop(0, '#ffd700');
            coreGradient.addColorStop(1, '#b8860b');
        } else {
            coreGradient.addColorStop(0, '#cd9b6d');
            coreGradient.addColorStop(1, '#8b4513');
        }
        ctx.fillStyle = coreGradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.value.toString(), this.x, this.y + 3);

        // Glint sparkle when stationary
        if (this.state === 'stationary' && Math.random() < 0.02) {
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(
                this.x + (Math.random() - 0.5) * this.radius * 0.8,
                this.y + (Math.random() - 0.5) * this.radius * 0.8,
                Math.random() * 2, 0, Math.PI * 2
            );
            ctx.fill();
        }
    }

    update(playerX, playerY, now) {
        const dx = playerX - this.x;
        const dy = playerY - this.y;
        const distSq = dx * dx + dy * dy;
        const isMagnetic = distSq <= this.magneticRangeSq;

        if (isMagnetic && distSq > (this.radius * 3) ** 2) {
            this.state = 'magnetic';
        } else if (!isMagnetic) {
            this.state = 'stationary';
        }

        if (this.state === 'stationary') {
            this.y = this.baseY + Math.sin(now / 1000 + this.pulseOffset) * 2;
        } else if (this.state === 'magnetic' && distSq > 1) {
            const dist = Math.sqrt(distSq);
            const lerp = Math.min(0.18, 6 / dist);
            this.x += dx * lerp;
            this.y += dy * lerp;
        }

        return true;
    }
}
