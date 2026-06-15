import { ctx } from '../core/canvas.js';
import { gameState } from '../core/gameState.js';
import { settingsManager } from '../systems/SettingsManager.js';
import { DamageNumber } from './Particle.js';
import { MOLOTOV_FIRE_TICK_DAMAGE, ZOMBIE_BASE_SCORES } from '../core/constants.js';

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
                    if (player.isDodging) {
                        const now = Date.now();
                        if (!player.lastDodgePopupTime || now - player.lastDodgePopupTime > 200) {
                            player.lastDodgePopupTime = now;
                            const damageNumberStyle = settingsManager.getSetting('video', 'damageNumberStyle') || 'floating';
                            if (damageNumberStyle !== 'off') {
                                gameState.damageNumbers.push(new DamageNumber(player.x, player.y - 20, "DODGED!", false, '#00ffff'));
                            }
                        }
                        continue;
                    }
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

            // If it's a fire pool, damage zombies as well
            if (this.isFirePool) {
                // Iterate backwards since we might splice
                for (let j = gameState.zombies.length - 1; j >= 0; j--) {
                    const zombie = gameState.zombies[j];
                    const dx = zombie.x - this.x;
                    const dy = zombie.y - this.y;
                    const distSquared = dx * dx + dy * dy;
                    if (distSquared < radiusSquared) {
                        const finalDamage = MOLOTOV_FIRE_TICK_DAMAGE || 0.5;
                        zombie.burnDamage = finalDamage * 2;
                        zombie.burnTimer = 3000; // 3 seconds of burn time after leaving fire
                        
                        if (zombie.takeDamage(finalDamage)) {
                            // Zombie died!
                            gameState.zombies.splice(j, 1);
                            
                            // Trigger score awards & stats tracking
                            if (this.player) {
                                const baseScore = ZOMBIE_BASE_SCORES[zombie.type] || 10;
                                const finalScore = Math.floor(baseScore * this.player.scoreMultiplier);
                                this.player.score += finalScore;
                                this.player.consecutiveKills++;
                                
                                import('../utils/combatUtils.js').then(module => {
                                    module.updateScoreMultiplier(this.player);
                                });
                                
                                const damageNumberStyle = settingsManager.getSetting('video', 'damageNumberStyle') || 'floating';
                                if (damageNumberStyle !== 'off') {
                                    if (this.player.scoreMultiplier > 1) {
                                        gameState.damageNumbers.push(new DamageNumber(zombie.x, zombie.y, `+${finalScore} (${this.player.scoreMultiplier}x)`));
                                    } else {
                                        gameState.damageNumbers.push(new DamageNumber(zombie.x, zombie.y, `+${finalScore}`));
                                    }
                                }
                                this.player.killsThisSession = (this.player.killsThisSession || 0) + 1;
                            }
                        } else {
                            const damageNumberStyle = settingsManager.getSetting('video', 'damageNumberStyle') || 'floating';
                            if (damageNumberStyle !== 'off' && Math.random() < 0.2) {
                                gameState.damageNumbers.push(new DamageNumber(zombie.x, zombie.y, finalDamage));
                            }
                        }
                    }
                }
            }

            this.lastDamageTick = now;
        }
    }

    draw() {
        const alpha = this.life / this.maxLife;

        if (this.isFirePool) {
            // Fire pool glow
            const glowGradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius);
            glowGradient.addColorStop(0, `rgba(255, 69, 0, ${alpha * 0.4})`);
            glowGradient.addColorStop(0.5, `rgba(255, 140, 0, ${alpha * 0.3})`);
            glowGradient.addColorStop(1, `rgba(255, 69, 0, 0)`);
            ctx.fillStyle = glowGradient;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fill();

            // Fire pool surface
            const poolGradient = ctx.createRadialGradient(this.x - 5, this.y - 5, 0, this.x, this.y, this.radius);
            poolGradient.addColorStop(0, `rgba(255, 215, 0, ${alpha * 0.7})`);
            poolGradient.addColorStop(0.5, `rgba(255, 69, 0, ${alpha * 0.5})`);
            poolGradient.addColorStop(1, `rgba(139, 0, 0, ${alpha * 0.3})`);
            ctx.fillStyle = poolGradient;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius * 0.8, 0, Math.PI * 2);
            ctx.fill();

            // Crackling flames/bubbles/particles rising effect
            const bubbleTime = Date.now() / 150;
            for (let i = 0; i < 5; i++) {
                const angle = bubbleTime + i * (Math.PI * 2 / 5);
                const r = (0.2 + 0.5 * Math.sin(bubbleTime + i)) * this.radius;
                const bubbleX = this.x + Math.cos(angle) * r;
                const bubbleY = this.y + Math.sin(angle) * r - (Math.abs(Math.sin(bubbleTime + i)) * 10);
                ctx.fillStyle = `rgba(255, ${100 + Math.floor(Math.random() * 155)}, 0, ${alpha * 0.6})`;
                ctx.beginPath();
                ctx.arc(bubbleX, bubbleY, 2 + Math.random() * 3, 0, Math.PI * 2);
                ctx.fill();
            }
        } else if (this.isSlimePool) {
            // Slime pool (BlightZombie) — purple/magenta fungal slime
            const glowGradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius);
            glowGradient.addColorStop(0, `rgba(171, 71, 188, ${alpha * 0.4})`);
            glowGradient.addColorStop(0.5, `rgba(123, 31, 162, ${alpha * 0.3})`);
            glowGradient.addColorStop(1, `rgba(74, 20, 140, 0)`);
            ctx.fillStyle = glowGradient;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fill();

            const poolGradient = ctx.createRadialGradient(this.x - 5, this.y - 5, 0, this.x, this.y, this.radius);
            poolGradient.addColorStop(0, `rgba(224, 64, 251, ${alpha * 0.6})`);
            poolGradient.addColorStop(0.5, `rgba(171, 71, 188, ${alpha * 0.5})`);
            poolGradient.addColorStop(1, `rgba(123, 31, 162, ${alpha * 0.3})`);
            ctx.fillStyle = poolGradient;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius * 0.8, 0, Math.PI * 2);
            ctx.fill();

            // Fungal bubbling effect
            const bubbleTime = Date.now() / 250;
            for (let i = 0; i < 3; i++) {
                const bubbleX = this.x + Math.cos(bubbleTime + i * 2) * (this.radius * 0.5);
                const bubbleY = this.y + Math.sin(bubbleTime + i * 2) * (this.radius * 0.5);
                ctx.fillStyle = `rgba(240, 180, 240, ${alpha * 0.4})`;
                ctx.beginPath();
                ctx.arc(bubbleX, bubbleY, 3, 0, Math.PI * 2);
                ctx.fill();
            }
        } else {
            // Acid pool glow (SpitterZombie)
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
    }

    isExpired() {
        return this.life <= 0;
    }
}

