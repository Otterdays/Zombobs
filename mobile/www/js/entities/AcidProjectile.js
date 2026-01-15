import { ctx } from '../core/canvas.js';
import { gameState } from '../core/gameState.js';

export class AcidProjectile {
    constructor(startX, startY, targetX, targetY) {
        this.x = startX;
        this.y = startY;
        this.targetX = targetX;
        this.targetY = targetY;
        this.radius = 8;
        this.speed = 4;
        
        // Calculate trajectory
        const dx = targetX - startX;
        const dy = targetY - startY;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        this.vx = (dx / dist) * this.speed;
        this.vy = (dy / dist) * this.speed;
        
        this.hasLanded = false;
    }

    update() {
        if (this.hasLanded) return;
        
        this.x += this.vx;
        this.y += this.vy;
        
        // Check if reached target (with some tolerance)
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const distToTargetSquared = dx * dx + dy * dy;
        
        if (distToTargetSquared < 20 * 20) {
            this.land();
        }
    }

    land() {
        if (this.hasLanded) return;
        this.hasLanded = true;
        
        // Create acid pool at landing location
        // Use global reference set by main.js
        if (typeof window !== 'undefined' && window.AcidPool) {
            gameState.acidPools = gameState.acidPools || [];
            gameState.acidPools.push(new window.AcidPool(this.x, this.y));
        }
    }

    draw() {
        if (this.hasLanded) return;
        
        // Acid projectile glow
        const glowGradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius * 2);
        glowGradient.addColorStop(0, 'rgba(0, 255, 0, 0.8)');
        glowGradient.addColorStop(0.5, 'rgba(50, 255, 50, 0.5)');
        glowGradient.addColorStop(1, 'rgba(0, 255, 0, 0)');
        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Acid core
        const acidGradient = ctx.createRadialGradient(this.x - 2, this.y - 2, 0, this.x, this.y, this.radius);
        acidGradient.addColorStop(0, '#66ff66');
        acidGradient.addColorStop(0.5, '#4caf50');
        acidGradient.addColorStop(1, '#1b5e20');
        ctx.fillStyle = acidGradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Trail
        ctx.strokeStyle = 'rgba(0, 255, 0, 0.4)';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x - this.vx * 2, this.y - this.vy * 2);
        ctx.stroke();
    }

    isOffScreen(canvasWidth, canvasHeight) {
        return this.x < -50 || this.x > canvasWidth + 50 || 
               this.y < -50 || this.y > canvasHeight + 50 ||
               this.hasLanded;
    }
}

