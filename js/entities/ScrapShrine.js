import { ctx } from '../core/canvas.js';
import { SCRAP_SHRINE_INTERACT_RANGE } from '../core/constants.js';

/**
 * Scrap Shrine — wave-break upgrade station. One random offer per spawn.
 */
export class ScrapShrine {
    /**
     * @param {number} x
     * @param {number} y
     * @param {{ id: string, label: string, cost: number, icon: string }} offer
     */
    constructor(x, y, offer) {
        this.x = x;
        this.y = y;
        this.radius = 28;
        this.offer = offer;
        this.pulseOffset = Math.random() * Math.PI * 2;
        this.interactRange = SCRAP_SHRINE_INTERACT_RANGE;
        this.interactRangeSq = SCRAP_SHRINE_INTERACT_RANGE * SCRAP_SHRINE_INTERACT_RANGE;
    }

    isPlayerNear(player) {
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        return (dx * dx + dy * dy) <= this.interactRangeSq;
    }

    draw() {
        const t = Date.now() / 600 + this.pulseOffset;
        const pulse = 0.85 + Math.sin(t) * 0.15;
        const glowRadius = this.radius * 2.2 * pulse;

        ctx.save();

        const glowGradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, glowRadius);
        glowGradient.addColorStop(0, 'rgba(255, 215, 0, 0.55)');
        glowGradient.addColorStop(0.5, 'rgba(184, 134, 11, 0.25)');
        glowGradient.addColorStop(1, 'rgba(139, 69, 19, 0)');
        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, glowRadius, 0, Math.PI * 2);
        ctx.fill();

        const pedestalGradient = ctx.createRadialGradient(
            this.x - 4, this.y - 6, 0,
            this.x, this.y, this.radius
        );
        pedestalGradient.addColorStop(0, '#ffd700');
        pedestalGradient.addColorStop(0.6, '#b8860b');
        pedestalGradient.addColorStop(1, '#5c3d1e');
        ctx.fillStyle = pedestalGradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        ctx.shadowBlur = 6;
        ctx.fillText(this.offer.icon, this.x, this.y - 2);

        ctx.font = 'bold 11px "Roboto Mono", monospace';
        ctx.fillStyle = '#ffd700';
        ctx.fillText(`${this.offer.cost}`, this.x, this.y + this.radius * 0.55);

        ctx.restore();
    }
}
