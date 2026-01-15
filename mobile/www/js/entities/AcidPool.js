import { ctx } from '../core/canvas.js';
import { gameState } from '../core/gameState.js';

export class AcidPool {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 40;
        this.life = 5000; // 5 seconds
        this.maxLife = 5000;
        this.damagePerTick = 0.3; // Damage per 200ms tick
        this.lastDamageTick = 0;
    }

    update() {
        this.life -= 16; // Approximate frame time
        
        // Damage players standing in pool
        const now = Date.now();
        if (now - this.lastDamageTick >= 200) {
            const radiusSquared = this.radius * this.radius;
            for (let i = 0; i < gameState.players.length; i++) {
                const player = gameState.players[i];
                if (player.health <= 0) continue;
                
                const dx = player.x - this.x;
                const dy = player.y - this.y;
                const distSquared = dx * dx + dy * dy;
                
                if (distSquared < radiusSquared) {
                    // Player is in acid pool - take damage
                    const damage = this.damagePerTick;
                    const previousHealth = player.health;
                    
                    // Apply to shield first, then health
                    if (player.shield > 0) {
                        player.shield -= damage;
                        if (player.shield < 0) {
                            player.health += player.shield; // Negative shield becomes health damage
                            player.shield = 0;
                        }
                    } else {
                        player.health -= damage;
                    }
                    
                    // Reset multiplier if health was reduced (shield didn't fully absorb)
                    if (player.health < previousHealth && player.shield === 0) {
                        // Import resetMultiplier dynamically
                        import('../utils/combatUtils.js').then(module => {
                            module.resetMultiplier(player);
                        });
                    }
                    
                    // Trigger damage indicator (imported in main.js)
                    if (typeof triggerDamageIndicator !== 'undefined') {
                        triggerDamageIndicator();
                    }
                }
            }
            this.lastDamageTick = now;
        }
    }

    draw() {
        const alpha = this.life / this.maxLife;
        
        // Acid pool glow
        const glowGradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius);
        glowGradient.addColorStop(0, `rgba(0, 255, 0, ${alpha * 0.4})`);
        glowGradient.addColorStop(0.5, `rgba(50, 255, 50, ${alpha * 0.3})`);
        glowGradient.addColorStop(1, `rgba(0, 255, 0, 0)`);
        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Acid pool surface
        const poolGradient = ctx.createRadialGradient(this.x - 5, this.y - 5, 0, this.x, this.y, this.radius);
        poolGradient.addColorStop(0, `rgba(100, 255, 100, ${alpha * 0.6})`);
        poolGradient.addColorStop(0.5, `rgba(50, 200, 50, ${alpha * 0.5})`);
        poolGradient.addColorStop(1, `rgba(0, 150, 0, ${alpha * 0.3})`);
        ctx.fillStyle = poolGradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 0.8, 0, Math.PI * 2);
        ctx.fill();
        
        // Bubbling effect
        const bubbleTime = Date.now() / 200;
        for (let i = 0; i < 3; i++) {
            const bubbleX = this.x + Math.cos(bubbleTime + i * 2) * (this.radius * 0.5);
            const bubbleY = this.y + Math.sin(bubbleTime + i * 2) * (this.radius * 0.5);
            ctx.fillStyle = `rgba(200, 255, 200, ${alpha * 0.4})`;
            ctx.beginPath();
            ctx.arc(bubbleX, bubbleY, 3, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    isExpired() {
        return this.life <= 0;
    }
}

