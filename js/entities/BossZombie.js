import { Zombie } from './Zombie.js';
import { ctx } from '../core/canvas.js';
import { gameState } from '../core/gameState.js';
import { settingsManager } from '../systems/SettingsManager.js';
import { triggerExplosion } from '../utils/combatUtils.js';

export class BossZombie extends Zombie {
    constructor(x, y) {
        // v0.8.1.2: Call super with canvas dimensions (Zombie constructor expects canvasWidth, canvasHeight)
        // Then override position with the provided x, y coordinates
        super(1, 1); // Pass dummy values since we'll override position anyway
        this.x = x;
        this.y = y;
        this.type = 'boss';
        this.radius = 35; // Larger size
        this.speed = 0.6; // Slower than normal zombies initially
        this.maxHealth = 500 + (gameState.wave * 50); // Scales with wave
        this.health = this.maxHealth;
        this.scoreValue = 500;
        this.color = {
            light: '#8a0000', // Dark red
            dark: '#4a0000',
            glow: 'rgba(255, 0, 0, 0.6)',
            outline: '#ff0000'
        };
        
        // Boss specific properties
        this.lastAttackTime = Date.now();
        this.attackCooldown = 3000; // 3 seconds
        this.attackRange = 150;
        this.isAttacking = false;
        this.attackChargeTime = 1000; // 1 second charge up
        this.attackStartTime = 0;
    }

    update(player) {
        // If attacking (charging up), don't move
        if (this.isAttacking) {
            if (Date.now() - this.attackStartTime >= this.attackChargeTime) {
                this.performAreaAttack();
                this.isAttacking = false;
                this.lastAttackTime = Date.now();
            }
            return;
        }

        // Normal movement
        super.update(player);

        // Check for special attack
        const distToPlayer = Math.hypot(player.x - this.x, player.y - this.y);
        if (distToPlayer < this.attackRange && Date.now() - this.lastAttackTime > this.attackCooldown) {
            this.startAttack();
        }
    }

    startAttack() {
        this.isAttacking = true;
        this.attackStartTime = Date.now();
        // Optional: Play roar sound here
    }

    performAreaAttack() {
        // Trigger explosion centered on boss (doesn't hurt boss, hurts player)
        // Using triggerExplosion utility but we might need a custom one if we don't want it to hurt other zombies?
        // For now, let's use a custom logic or reuse triggerExplosion carefully.
        // Let's just do a direct distance check for simplicity and visual effect
        
        triggerExplosion(this.x, this.y, 120, 20, false); // x, y, radius, damage, sourceIsPlayer
        
        // Visual shockwave is handled by triggerExplosion
    }

    draw() {
        // Draw boss aura
        const pulse = Math.sin(Date.now() / 200) * 0.2 + 0.8;
        const auraSize = this.radius * 1.5 * pulse;
        
        ctx.save();
        ctx.translate(this.x, this.y);
        
        // Attack charge indicator
        if (this.isAttacking) {
            const chargeProgress = (Date.now() - this.attackStartTime) / this.attackChargeTime;
            ctx.beginPath();
            ctx.arc(0, 0, 120 * chargeProgress, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(255, 50, 0, ${0.5 * chargeProgress})`;
            ctx.lineWidth = 5;
            ctx.stroke();
            
            ctx.fillStyle = `rgba(255, 0, 0, ${0.2 * chargeProgress})`;
            ctx.fill();
        }

        // Glow
        const gradient = ctx.createRadialGradient(0, 0, this.radius * 0.5, 0, 0, auraSize);
        gradient.addColorStop(0, this.color.glow);
        gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, auraSize, 0, Math.PI * 2);
        ctx.fill();

        // Body
        const bodyGradient = ctx.createRadialGradient(-this.radius/3, -this.radius/3, 0, 0, 0, this.radius);
        bodyGradient.addColorStop(0, this.color.light);
        bodyGradient.addColorStop(1, this.color.dark);
        ctx.fillStyle = bodyGradient;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Outline
        ctx.strokeStyle = this.color.outline;
        ctx.lineWidth = 3;
        ctx.stroke();

        // Eyes (Glowing yellow)
        ctx.fillStyle = '#ffff00';
        ctx.shadowColor = '#ffff00';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(-this.radius * 0.3, -this.radius * 0.2, 6, 0, Math.PI * 2);
        ctx.arc(this.radius * 0.3, -this.radius * 0.2, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.restore();
        
        // Draw health bar above head if damaged
        if (this.health < this.maxHealth) {
            const barWidth = 60;
            const barHeight = 6;
            const barX = this.x - barWidth / 2;
            const barY = this.y - this.radius - 15;
            
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(barX, barY, barWidth, barHeight);
            
            const healthPct = this.health / this.maxHealth;
            const fillWidth = barWidth * healthPct;
            
            // Get health bar style setting
            const healthBarStyle = settingsManager.getSetting('video', 'enemyHealthBarStyle') || 'gradient';
            
            if (healthBarStyle === 'gradient') {
                // Red gradient for boss
                const gradient = ctx.createLinearGradient(barX, barY, barX + barWidth, barY);
                gradient.addColorStop(0, '#ff0000');
                gradient.addColorStop(1, '#ff6666');
                ctx.fillStyle = gradient;
            } else if (healthBarStyle === 'solid') {
                // Solid red for boss
                ctx.fillStyle = '#ff0000';
            } else if (healthBarStyle === 'simple') {
                // Simple white fill
                ctx.fillStyle = '#ffffff';
            }
            
            ctx.fillRect(barX, barY, fillWidth, barHeight);
            
            // Border (only for gradient and solid styles)
            if (healthBarStyle !== 'simple') {
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
                ctx.lineWidth = 1;
                ctx.strokeRect(barX, barY, barWidth, barHeight);
            }
        }
    }
}
