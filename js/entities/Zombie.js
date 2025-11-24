import { ctx } from '../core/canvas.js';
import { gameState } from '../core/gameState.js';
import { MAX_PARTICLES, RENDERING } from '../core/constants.js';
import { playDamageSound, playKillSound, playExplosionSound } from '../systems/AudioSystem.js';
import { triggerDamageIndicator } from '../utils/gameUtils.js';
import { createExplosion, createBloodSplatter, createParticles } from '../systems/ParticleSystem.js';
import { settingsManager } from '../systems/SettingsManager.js';
import { graphicsSettings } from '../systems/GraphicsSystem.js';

// Base Zombie class (shared behaviour for all zombie types)
export class Zombie {
    constructor(canvasWidth, canvasHeight) {
        const side = Math.floor(Math.random() * 4);
        switch (side) {
            case 0: this.x = Math.random() * canvasWidth; this.y = -20; break;
            case 1: this.x = canvasWidth + 20; this.y = Math.random() * canvasHeight; break;
            case 2: this.x = Math.random() * canvasWidth; this.y = canvasHeight + 20; break;
            case 3: this.x = -20; this.y = Math.random() * canvasHeight; break;
        }
        this.radius = 15; // v0.8.1.2: Increased hitbox size for easier hits (was 12)
        this.speed = 1 + (gameState.wave * 0.1);
        this.health = Math.floor((2 + Math.floor(gameState.wave / 3)) * 2.5); // 1.25x increase from doubled HP
        this.maxHealth = this.health;
        this.type = 'base';

        // Secondary lower body hitbox for better hit registration
        this.lowerBodyHitbox = {
            x: this.x,
            y: this.y + 15, // Torso center position
            radius: this.radius * 0.8 // Slightly smaller than main hitbox
        };

        // Burning state
        this.burnTimer = 0; // ms remaining
        this.burnDamage = 0; // damage per tick
        this.baseSpeed = null; // Will be set on first update for night cycle

        // Health bar display
        this.lastDamageTime = 0; // Timestamp when last damaged

        // Velocity tracking for interpolation (multiplayer sync)
        this.vx = 0;
        this.vy = 0;
        this.lastX = this.x;
        this.lastY = this.y;

        // Interpolation targets (for non-leader clients)
        this.targetX = undefined;
        this.targetY = undefined;
        this.lastUpdateTime = 0;

        // Unique ID for multiplayer synchronization
        this.id = Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    update(player) {
        // Store base speed for night cycle (if not already set)
        if (!this.baseSpeed) {
            this.baseSpeed = this.speed;
        }

        // Check if the slow effect has expired
        if (this.slowedUntil && Date.now() > this.slowedUntil) {
            this.speed = this.originalSpeed;
            this.slowedUntil = undefined;
            this.originalSpeed = undefined;
        }

        // Handle burning damage
        if (this.burnTimer > 0) {
            const now = Date.now();
            // Apply burn damage every BURN_TICK_INTERVAL ms
            if (!this.lastBurnTick || now - this.lastBurnTick >= RENDERING.BURN_TICK_INTERVAL) {
                this.health -= this.burnDamage;
                this.lastBurnTick = now;

                // Spawn fire/smoke particles
                if (gameState.particles.length < MAX_PARTICLES - 10) {
                    const fireColor = `rgba(255, ${Math.floor(Math.random() * 100 + 100)}, 0, 0.8)`;
                    createParticles(this.x, this.y, fireColor, 2);
                }
            }
            // Decrement timer
            this.burnTimer -= 16; // Approximate frame time
            if (this.burnTimer <= 0) {
                this.burnTimer = 0;
                this.burnDamage = 0;
                this.lastBurnTick = undefined;
            }
        }

        // Track velocity for interpolation
        this.lastX = this.x;
        this.lastY = this.y;

        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;

        // Calculate velocity before movement
        const moveX = (dx / dist) * this.speed;
        const moveY = (dy / dist) * this.speed;
        
        // Update position
        this.x += moveX;
        this.y += moveY;

        // Update secondary lower body hitbox position
        this.lowerBodyHitbox.x = this.x;
        this.lowerBodyHitbox.y = this.y + 15;

        // Update velocity for interpolation (used in multiplayer)
        this.vx = moveX;
        this.vy = moveY;
    }

    draw() {
        // Shadow (larger and more ominous) - only if shadows enabled
        if (graphicsSettings.shadows !== false) {
            ctx.fillStyle = `rgba(0, 0, 0, ${RENDERING.SHADOW_ALPHA})`;
            ctx.beginPath();
            ctx.ellipse(this.x + 3, this.y + this.radius + 3, this.radius * 1.2, this.radius * 0.4, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        // Toxic aura (pulsing outer glow) - quality scaled
        const auraQuality = graphicsSettings.getQualityValues('aura');
        if (auraQuality.opacity > 0) {
            const pulse = Math.sin(Date.now() / RENDERING.ZOMBIE_PULSE_PERIOD) * 0.4 + 0.6;
            const pulseMultiplier = auraQuality.pulseComplexity;
            const baseOpacity = 0.4 * auraQuality.opacity;
            
            if (auraQuality.hasMultiLayer) {
                // Multi-layer aura for high/ultra quality
                const outerAura = ctx.createRadialGradient(this.x, this.y, this.radius * 0.5, this.x, this.y, this.radius * 2.5);
                outerAura.addColorStop(0, `rgba(0, 255, 0, ${baseOpacity * pulse * pulseMultiplier})`);
                outerAura.addColorStop(0.3, `rgba(50, 255, 50, ${baseOpacity * 0.6 * pulse * pulseMultiplier})`);
                outerAura.addColorStop(0.6, `rgba(100, 255, 100, ${baseOpacity * 0.3 * pulse * pulseMultiplier})`);
                outerAura.addColorStop(1, 'rgba(0, 255, 0, 0)');
                ctx.fillStyle = outerAura;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius * 2.5, 0, Math.PI * 2);
                ctx.fill();
            }
            
            const auraGradient = ctx.createRadialGradient(this.x, this.y, this.radius * 0.5, this.x, this.y, this.radius * 2);
            auraGradient.addColorStop(0, `rgba(0, 255, 0, ${baseOpacity * pulse})`);
            auraGradient.addColorStop(0.5, `rgba(50, 255, 50, ${baseOpacity * 0.5 * pulse})`);
            auraGradient.addColorStop(1, 'rgba(0, 255, 0, 0)');
            ctx.fillStyle = auraGradient;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius * 2, 0, Math.PI * 2);
            ctx.fill();
        }

        // Zombie torso (singular piece of body) - drawn BEFORE head for proper layering
        const bodyGradient = ctx.createRadialGradient(this.x - 4, this.y - 4, 0, this.x, this.y, this.radius);
        bodyGradient.addColorStop(0, '#9acd32');
        bodyGradient.addColorStop(0.4, '#7cb342');
        bodyGradient.addColorStop(0.7, '#558b2f');
        bodyGradient.addColorStop(1, '#33691e');
        ctx.fillStyle = bodyGradient;
        ctx.beginPath();
        ctx.ellipse(this.x, this.y + 15, this.radius * 1.2, this.radius * 1.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Zombie arm (singular piece of body) - drawn BEFORE head for proper layering
        ctx.strokeStyle = '#1b3a00';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(this.x - 8, this.y + 10);
        ctx.lineTo(this.x - 15, this.y + 18);
        ctx.stroke();

        // Decayed flesh body (head)
        ctx.fillStyle = bodyGradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Zombie skin texture (darker patches)
        ctx.fillStyle = 'rgba(30, 60, 10, 0.3)';
        ctx.beginPath();
        ctx.arc(this.x + 4, this.y - 2, 3, 0, Math.PI * 2);
        ctx.arc(this.x - 3, this.y + 5, 2, 0, Math.PI * 2);
        ctx.fill();

        // Body outline (rough edges)
        ctx.strokeStyle = '#1b3a00';
        ctx.lineWidth = 2.5;
        ctx.setLineDash([2, 1]);
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        // Eye sockets (darker areas)
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.beginPath();
        ctx.ellipse(this.x - 5, this.y - 3, 4, 5, 0, 0, Math.PI * 2);
        ctx.ellipse(this.x + 5, this.y - 3, 4, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Glowing zombie eyes (animated intensity) - quality scaled
        const eyeQuality = graphicsSettings.getQualityValues('eyeGlow');
        const eyePulse = Math.sin(Date.now() / 167) * 0.3 + 0.7;
        ctx.shadowBlur = eyeQuality.shadowBlur * eyePulse;
        ctx.shadowColor = '#ff0000';

        // Eye glow gradient with quality-based stops
        const createEyeGradient = (x, y) => {
            const gradient = ctx.createRadialGradient(x, y, 0, x, y, 3);
            if (eyeQuality.gradientStops >= 5) {
                // Ultra quality: 5 stops
                gradient.addColorStop(0, `rgba(255, 200, 200, ${eyeQuality.alpha})`);
                gradient.addColorStop(0.25, `rgba(255, 150, 150, ${eyeQuality.alpha * 0.9})`);
                gradient.addColorStop(0.5, `rgba(255, 100, 100, ${eyeQuality.alpha * 0.8})`);
                gradient.addColorStop(0.75, `rgba(255, 50, 50, ${eyeQuality.alpha * 0.6})`);
                gradient.addColorStop(1, `rgba(153, 0, 0, ${eyeQuality.alpha * 0.4})`);
            } else if (eyeQuality.gradientStops >= 4) {
                // High quality: 4 stops
                gradient.addColorStop(0, `rgba(255, 150, 150, ${eyeQuality.alpha})`);
                gradient.addColorStop(0.33, `rgba(255, 100, 100, ${eyeQuality.alpha * 0.8})`);
                gradient.addColorStop(0.66, `rgba(255, 50, 50, ${eyeQuality.alpha * 0.6})`);
                gradient.addColorStop(1, `rgba(153, 0, 0, ${eyeQuality.alpha * 0.4})`);
            } else {
                // Low/Medium quality: 3 stops
                gradient.addColorStop(0, `rgba(255, 102, 102, ${eyeQuality.alpha})`);
                gradient.addColorStop(0.5, `rgba(255, 0, 0, ${eyeQuality.alpha * 0.8})`);
                gradient.addColorStop(1, `rgba(153, 0, 0, ${eyeQuality.alpha * 0.6})`);
            }
            return gradient;
        };

        ctx.fillStyle = createEyeGradient(this.x - 5, this.y - 3);
        ctx.beginPath();
        ctx.arc(this.x - 5, this.y - 3, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = createEyeGradient(this.x + 5, this.y - 3);
        ctx.beginPath();
        ctx.arc(this.x + 5, this.y - 3, 3, 0, Math.PI * 2);
        ctx.fill();

        // Eye highlights
        ctx.fillStyle = 'rgba(255, 100, 100, 0.8)';
        ctx.beginPath();
        ctx.arc(this.x - 6, this.y - 4, 1, 0, Math.PI * 2);
        ctx.arc(this.x + 4, this.y - 4, 1, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowBlur = 0;

        // Jagged mouth (open and menacing)
        ctx.strokeStyle = '#1a1a1a';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(this.x - 6, this.y + 5);
        ctx.quadraticCurveTo(this.x - 3, this.y + 8, this.x, this.y + 7);
        ctx.quadraticCurveTo(this.x + 3, this.y + 8, this.x + 6, this.y + 5);
        ctx.stroke();

        // Teeth
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(this.x - 4, this.y + 5);
        ctx.lineTo(this.x - 4, this.y + 7);
        ctx.moveTo(this.x - 1, this.y + 6);
        ctx.lineTo(this.x - 1, this.y + 8);
        ctx.moveTo(this.x + 2, this.y + 6);
        ctx.lineTo(this.x + 2, this.y + 8);
        ctx.moveTo(this.x + 4, this.y + 5);
        ctx.lineTo(this.x + 4, this.y + 7);
        ctx.stroke();

        // Dripping effect (zombie drool/decay)
        const dripAnim = (Date.now() / 50 + this.x) % 10;
        if (dripAnim < 5) {
            ctx.fillStyle = 'rgba(100, 150, 50, 0.6)';
            ctx.beginPath();
            ctx.ellipse(this.x + 7, this.y + 8 + dripAnim * 0.5, 1, 2, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        // Health bar (if recently damaged and setting enabled)
        if (settingsManager.getSetting('video', 'enemyHealthBars') !== false) {
            const timeSinceDamage = Date.now() - this.lastDamageTime;
            if (timeSinceDamage < 2000 && this.maxHealth) { // Show for 2 seconds
                const barWidth = this.radius * 2.5;
                const barHeight = 3;
                const barX = this.x - barWidth / 2;
                const barY = this.y - this.radius - 8;

                // Background
                ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
                ctx.fillRect(barX, barY, barWidth, barHeight);

                // Health fill
                const healthPercent = Math.max(0, this.health / this.maxHealth);
                const fillWidth = barWidth * healthPercent;

                // Get health bar style setting
                const healthBarStyle = settingsManager.getSetting('video', 'enemyHealthBarStyle') || 'gradient';

                if (healthBarStyle === 'gradient') {
                    // Color gradient: green -> yellow -> red
                    const gradient = ctx.createLinearGradient(barX, barY, barX + barWidth, barY);
                    if (healthPercent > 0.5) {
                        gradient.addColorStop(0, '#4caf50'); // Green
                        gradient.addColorStop(1, '#ffeb3b'); // Yellow
                    } else {
                        gradient.addColorStop(0, '#ffeb3b'); // Yellow
                        gradient.addColorStop(1, '#f44336'); // Red
                    }
                    ctx.fillStyle = gradient;
                } else if (healthBarStyle === 'solid') {
                    // Single color based on health percent
                    let color = '#4caf50'; // Green
                    if (healthPercent < 0.5) {
                        color = healthPercent < 0.25 ? '#f44336' : '#ffeb3b'; // Red or Yellow
                    }
                    ctx.fillStyle = color;
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

    takeDamage(bulletDamage) {
        this.health -= bulletDamage;
        this.lastDamageTime = Date.now();
        return this.health <= 0;
    }
}

// Normal zombie - current default enemy type
export class NormalZombie extends Zombie {
    constructor(canvasWidth, canvasHeight) {
        super(canvasWidth, canvasHeight);
        this.type = 'normal';
    }
}

// Armored zombie - slower but much tougher, with armor that absorbs damage
export class ArmoredZombie extends Zombie {
    constructor(canvasWidth, canvasHeight) {
        super(canvasWidth, canvasHeight);
        this.type = 'armored';
        this.armor = 10 + Math.floor(gameState.wave * 1.5); // Armor pool scales with wave
        this.speed *= 0.75; // Heavier, slower
        this.radius += 2;   // Slightly larger visual silhouette
    }

    draw() {
        // Draw base zombie visuals
        super.draw();

        // Overlay metal armor plates
        ctx.save();
        ctx.translate(this.x, this.y);

        // Chest plate
        ctx.fillStyle = 'rgba(140, 140, 155, 0.96)';
        ctx.strokeStyle = '#303030';
        ctx.lineWidth = 2;
        const chestWidth = this.radius * 1.8;
        const chestHeight = this.radius * 1.1;
        ctx.beginPath();
        ctx.rect(-chestWidth / 2, this.radius * 0.2, chestWidth, chestHeight);
        ctx.fill();
        ctx.stroke();

        // Shoulder pads
        ctx.beginPath();
        ctx.arc(-this.radius * 0.9, this.radius * 0.3, this.radius * 0.5, 0, Math.PI * 2);
        ctx.arc(this.radius * 0.9, this.radius * 0.3, this.radius * 0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Helmet band
        ctx.beginPath();
        ctx.rect(-this.radius * 0.9, -this.radius * 1.2, this.radius * 1.8, this.radius * 0.4);
        ctx.fill();
        ctx.stroke();

        ctx.restore();
    }

    takeDamage(bulletDamage) {
        // Armor absorbs most of the damage first; some always leaks through
        const armorLeakThrough = 0.35; // 35% of damage bypasses armor
        let remaining = bulletDamage;

        if (this.armor > 0) {
            const toArmor = remaining * (1 - armorLeakThrough);
            this.armor -= toArmor;
            remaining = remaining * armorLeakThrough;
        }

        if (remaining > 0) {
            this.health -= remaining;
            this.lastDamageTime = Date.now();
        }

        return this.health <= 0;
    }
}

// Fast zombie - The Runner: faster but weaker
export class FastZombie extends Zombie {
    constructor(canvasWidth, canvasHeight) {
        super(canvasWidth, canvasHeight);
        this.type = 'fast';
        this.speed *= 1.6; // 1.6x faster
        this.health = Math.floor(this.health * 0.6); // 60% health
        this.radius *= 0.8; // Smaller hitbox
    }

    draw() {
        // Shadow (smaller)
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.beginPath();
        ctx.ellipse(this.x + 2, this.y + this.radius + 2, this.radius * 1.0, this.radius * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Reddish/orange aura (faster pulse) - quality scaled
        const auraQuality = graphicsSettings.getQualityValues('aura');
        if (auraQuality.opacity > 0) {
            const pulse = Math.sin(Date.now() / 150) * 0.4 + 0.6;
            const pulseMultiplier = auraQuality.pulseComplexity;
            const baseOpacity = 0.5 * auraQuality.opacity;
            
            if (auraQuality.hasMultiLayer) {
                const outerAura = ctx.createRadialGradient(this.x, this.y, this.radius * 0.4, this.x, this.y, this.radius * 2.2);
                outerAura.addColorStop(0, `rgba(255, 100, 0, ${baseOpacity * pulse * pulseMultiplier})`);
                outerAura.addColorStop(0.4, `rgba(255, 150, 50, ${baseOpacity * 0.7 * pulse * pulseMultiplier})`);
                outerAura.addColorStop(0.7, `rgba(255, 200, 100, ${baseOpacity * 0.4 * pulse * pulseMultiplier})`);
                outerAura.addColorStop(1, 'rgba(255, 100, 0, 0)');
                ctx.fillStyle = outerAura;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius * 2.2, 0, Math.PI * 2);
                ctx.fill();
            }
            
            const auraGradient = ctx.createRadialGradient(this.x, this.y, this.radius * 0.4, this.x, this.y, this.radius * 1.8);
            auraGradient.addColorStop(0, `rgba(255, 100, 0, ${baseOpacity * pulse})`);
            auraGradient.addColorStop(0.5, `rgba(255, 150, 50, ${baseOpacity * 0.6 * pulse})`);
            auraGradient.addColorStop(1, 'rgba(255, 100, 0, 0)');
            ctx.fillStyle = auraGradient;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius * 1.8, 0, Math.PI * 2);
            ctx.fill();
        }

        // Body with reddish tint
        const bodyGradient = ctx.createRadialGradient(this.x - 3, this.y - 3, 0, this.x, this.y, this.radius);
        bodyGradient.addColorStop(0, '#ff8c42');
        bodyGradient.addColorStop(0.4, '#d2691e');
        bodyGradient.addColorStop(0.7, '#8b4513');
        bodyGradient.addColorStop(1, '#654321');
        ctx.fillStyle = bodyGradient;
        ctx.beginPath();
        ctx.ellipse(this.x, this.y + 12, this.radius * 1.0, this.radius * 1.2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Head
        ctx.fillStyle = bodyGradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Body outline
        ctx.strokeStyle = '#4a2c1a';
        ctx.lineWidth = 2;
        ctx.setLineDash([1, 1]);
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        // Glowing red eyes (brighter for fast zombie) - quality scaled
        const eyeQuality = graphicsSettings.getQualityValues('eyeGlow');
        const eyePulse = Math.sin(Date.now() / 100) * 0.3 + 0.7;
        ctx.shadowBlur = eyeQuality.shadowBlur * 1.2 * eyePulse; // 20% brighter for fast zombie
        ctx.shadowColor = '#ff0000';

        const eyeGradient = ctx.createRadialGradient(this.x - 4, this.y - 2, 0, this.x - 4, this.y - 2, 2.5);
        eyeGradient.addColorStop(0, '#ff8888');
        eyeGradient.addColorStop(0.5, '#ff0000');
        eyeGradient.addColorStop(1, '#990000');
        ctx.fillStyle = eyeGradient;
        ctx.beginPath();
        ctx.arc(this.x - 4, this.y - 2, 2.5, 0, Math.PI * 2);
        ctx.fill();

        const eyeGradient2 = ctx.createRadialGradient(this.x + 4, this.y - 2, 0, this.x + 4, this.y - 2, 2.5);
        eyeGradient2.addColorStop(0, '#ff8888');
        eyeGradient2.addColorStop(0.5, '#ff0000');
        eyeGradient2.addColorStop(1, '#990000');
        ctx.fillStyle = eyeGradient2;
        ctx.beginPath();
        ctx.arc(this.x + 4, this.y - 2, 2.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowBlur = 0;

        // Trail particles (speed lines)
        if (Math.random() < 0.3) {
            const trailX = this.x - Math.cos(Math.atan2(gameState.player.y - this.y, gameState.player.x - this.x)) * this.radius * 1.5;
            const trailY = this.y - Math.sin(Math.atan2(gameState.player.y - this.y, gameState.player.x - this.x)) * this.radius * 1.5;
            const trailParticle = {
                x: trailX,
                y: trailY,
                radius: Math.random() * 2 + 1,
                color: `rgba(255, 150, 50, ${Math.random() * 0.5 + 0.3})`,
                vx: 0,
                vy: 0,
                life: 10,
                maxLife: 10
            };
            gameState.particles.push(trailParticle);
        }
    }
}

// Exploding zombie - The Boomer: explodes on death
export class ExplodingZombie extends Zombie {
    constructor(canvasWidth, canvasHeight) {
        super(canvasWidth, canvasHeight);
        this.type = 'exploding';
        this.speed *= 0.9; // Slightly slower
        this.health = Math.floor(this.health * 0.8); // 80% health
        this.explosionRadius = 60; // Smaller explosion than grenade
        this.explosionDamage = 30; // Less damage than grenade
    }

    draw() {
        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.beginPath();
        ctx.ellipse(this.x + 3, this.y + this.radius + 3, this.radius * 1.2, this.radius * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Pulsing orange/yellow glow (faster when low health or close to player) - quality scaled
        const auraQuality = graphicsSettings.getQualityValues('aura');
        if (auraQuality.opacity > 0) {
            const distToPlayer = Math.sqrt((gameState.player.x - this.x) ** 2 + (gameState.player.y - this.y) ** 2);
            const healthRatio = this.health / Math.floor((2 + Math.floor(gameState.wave / 3)) * 2.5);
            const pulseSpeed = healthRatio < 0.5 || distToPlayer < 100 ? 100 : 200;
            const pulse = Math.sin(Date.now() / pulseSpeed) * 0.5 + 0.5;
            const pulseMultiplier = auraQuality.pulseComplexity;
            const baseOpacity = 0.6 * auraQuality.opacity;
            
            if (auraQuality.hasMultiLayer) {
                const outerAura = ctx.createRadialGradient(this.x, this.y, this.radius * 0.5, this.x, this.y, this.radius * 3);
                outerAura.addColorStop(0, `rgba(255, 150, 0, ${baseOpacity * pulse * pulseMultiplier})`);
                outerAura.addColorStop(0.3, `rgba(255, 200, 50, ${baseOpacity * 0.7 * pulse * pulseMultiplier})`);
                outerAura.addColorStop(0.6, `rgba(255, 220, 100, ${baseOpacity * 0.4 * pulse * pulseMultiplier})`);
                outerAura.addColorStop(1, 'rgba(255, 150, 0, 0)');
                ctx.fillStyle = outerAura;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius * 3, 0, Math.PI * 2);
                ctx.fill();
            }
            
            const auraGradient = ctx.createRadialGradient(this.x, this.y, this.radius * 0.5, this.x, this.y, this.radius * 2.5);
            auraGradient.addColorStop(0, `rgba(255, 150, 0, ${baseOpacity * pulse})`);
            auraGradient.addColorStop(0.5, `rgba(255, 200, 50, ${baseOpacity * 0.7 * pulse})`);
            auraGradient.addColorStop(1, 'rgba(255, 150, 0, 0)');
            ctx.fillStyle = auraGradient;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius * 2.5, 0, Math.PI * 2);
            ctx.fill();
        }

        // Body with orange/yellow tint
        const bodyGradient = ctx.createRadialGradient(this.x - 4, this.y - 4, 0, this.x, this.y, this.radius);
        bodyGradient.addColorStop(0, '#ffa500');
        bodyGradient.addColorStop(0.4, '#ff8c00');
        bodyGradient.addColorStop(0.7, '#cc6600');
        bodyGradient.addColorStop(1, '#8b4500');
        ctx.fillStyle = bodyGradient;
        ctx.beginPath();
        ctx.ellipse(this.x, this.y + 15, this.radius * 1.2, this.radius * 1.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Head
        ctx.fillStyle = bodyGradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Body outline
        ctx.strokeStyle = '#8b4500';
        ctx.lineWidth = 2.5;
        ctx.setLineDash([2, 1]);
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        // Glowing orange eyes - quality scaled
        const eyeQuality = graphicsSettings.getQualityValues('eyeGlow');
        const eyePulse = Math.sin(Date.now() / 150) * 0.3 + 0.7;
        ctx.shadowBlur = eyeQuality.shadowBlur * eyePulse;
        ctx.shadowColor = '#ff6600';

        const eyeGradient = ctx.createRadialGradient(this.x - 5, this.y - 3, 0, this.x - 5, this.y - 3, 3);
        eyeGradient.addColorStop(0, '#ffaa66');
        eyeGradient.addColorStop(0.5, '#ff6600');
        eyeGradient.addColorStop(1, '#cc4400');
        ctx.fillStyle = eyeGradient;
        ctx.beginPath();
        ctx.arc(this.x - 5, this.y - 3, 3, 0, Math.PI * 2);
        ctx.fill();

        const eyeGradient2 = ctx.createRadialGradient(this.x + 5, this.y - 3, 0, this.x + 5, this.y - 3, 3);
        eyeGradient2.addColorStop(0, '#ffaa66');
        eyeGradient2.addColorStop(0.5, '#ff6600');
        eyeGradient2.addColorStop(1, '#cc4400');
        ctx.fillStyle = eyeGradient2;
        ctx.beginPath();
        ctx.arc(this.x + 5, this.y - 3, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowBlur = 0;

        // Jagged mouth
        ctx.strokeStyle = '#8b4500';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(this.x - 6, this.y + 5);
        ctx.quadraticCurveTo(this.x - 3, this.y + 8, this.x, this.y + 7);
        ctx.quadraticCurveTo(this.x + 3, this.y + 8, this.x + 6, this.y + 5);
        ctx.stroke();
    }

    takeDamage(bulletDamage) {
        this.health -= bulletDamage;
        this.lastDamageTime = Date.now();
        return this.health <= 0;
    }
}

// Ghost zombie - Semi-transparent, fast, slightly ethereal
export class GhostZombie extends Zombie {
    constructor(canvasWidth, canvasHeight) {
        super(canvasWidth, canvasHeight);
        this.type = 'ghost';
        this.speed *= 1.3;
        this.health = Math.floor(this.health * 0.8);
        this.radius *= 0.9;
        this.wobbleOffset = Math.random() * 1000;
    }

    draw() {
        ctx.save();
        ctx.globalAlpha = 0.5;

        // Wobble effect
        const wobbleX = Math.sin((Date.now() + this.wobbleOffset) / 200) * 2;

        // Pale blue aura - quality scaled
        const auraQuality = graphicsSettings.getQualityValues('aura');
        if (auraQuality.opacity > 0) {
            const pulse = Math.sin(Date.now() / 300) * 0.4 + 0.6;
            const pulseMultiplier = auraQuality.pulseComplexity;
            const baseOpacity = 0.6 * auraQuality.opacity;
            
            if (auraQuality.hasMultiLayer) {
                const outerAura = ctx.createRadialGradient(this.x + wobbleX, this.y, this.radius * 0.5, this.x + wobbleX, this.y, this.radius * 2.5);
                outerAura.addColorStop(0, `rgba(150, 200, 255, ${baseOpacity * pulse * pulseMultiplier})`);
                outerAura.addColorStop(0.5, `rgba(180, 220, 255, ${baseOpacity * 0.6 * pulse * pulseMultiplier})`);
                outerAura.addColorStop(1, 'rgba(0, 0, 0, 0)');
                ctx.fillStyle = outerAura;
                ctx.beginPath();
                ctx.arc(this.x + wobbleX, this.y, this.radius * 2.5, 0, Math.PI * 2);
                ctx.fill();
            }
            
            const auraGradient = ctx.createRadialGradient(this.x + wobbleX, this.y, this.radius * 0.5, this.x + wobbleX, this.y, this.radius * 2);
            auraGradient.addColorStop(0, `rgba(150, 200, 255, ${baseOpacity * pulse})`);
            auraGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = auraGradient;
            ctx.beginPath();
            ctx.arc(this.x + wobbleX, this.y, this.radius * 2, 0, Math.PI * 2);
            ctx.fill();
        }

        // Body (Pale blue/white)
        const bodyGradient = ctx.createRadialGradient(this.x + wobbleX - 2, this.y - 2, 0, this.x + wobbleX, this.y, this.radius);
        bodyGradient.addColorStop(0, '#e0f7fa');
        bodyGradient.addColorStop(0.6, '#80deea');
        bodyGradient.addColorStop(1, '#0097a7');
        ctx.fillStyle = bodyGradient;

        ctx.beginPath();
        ctx.ellipse(this.x + wobbleX, this.y + 10, this.radius * 0.8, this.radius * 1.2, 0, 0, Math.PI * 2);
        ctx.fill(); // Body

        ctx.beginPath();
        ctx.arc(this.x + wobbleX, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill(); // Head

        // Eyes (White glowing holes)
        ctx.fillStyle = '#ffffff';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#ffffff';
        ctx.beginPath();
        ctx.arc(this.x + wobbleX - 4, this.y - 2, 2, 0, Math.PI * 2);
        ctx.arc(this.x + wobbleX + 4, this.y - 2, 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

// Spitter Zombie - Ranged enemy that kites and creates acid pools
export class SpitterZombie extends Zombie {
    constructor(canvasWidth, canvasHeight) {
        super(canvasWidth, canvasHeight);
        this.type = 'spitter';
        this.speed *= 1.2; // Fast to maintain distance
        this.health = Math.floor(this.health * 0.8); // Lower health
        this.lastSpitTime = 0;
        this.spitCooldown = 2500; // 2.5 seconds between spits
        this.optimalRange = 400; // Sweet spot distance (300-500px)
    }

    update(player) {
        // Store base speed for night cycle
        if (!this.baseSpeed) {
            this.baseSpeed = this.speed;
        }

        // Check if the slow effect has expired
        if (this.slowedUntil && Date.now() > this.slowedUntil) {
            this.speed = this.originalSpeed;
            this.slowedUntil = undefined;
            this.originalSpeed = undefined;
        }

        // Handle burning damage (inherited from base class)
        if (this.burnTimer > 0) {
            const now = Date.now();
            if (!this.lastBurnTick || now - this.lastBurnTick >= RENDERING.BURN_TICK_INTERVAL) {
                this.health -= this.burnDamage;
                this.lastBurnTick = now;

                if (gameState.particles.length < MAX_PARTICLES - 10) {
                    const fireColor = `rgba(255, ${Math.floor(Math.random() * 100 + 100)}, 0, 0.8)`;
                    createParticles(this.x, this.y, fireColor, 2);
                }
            }
            this.burnTimer -= 16;
            if (this.burnTimer <= 0) {
                this.burnTimer = 0;
                this.burnDamage = 0;
                this.lastBurnTick = undefined;
            }
        }

        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;

        // Kiting AI: Maintain optimal range
        if (dist < 300) {
            // Too close - move away
            this.x -= (dx / dist) * this.speed;
            this.y -= (dy / dist) * this.speed;
        } else if (dist > 500) {
            // Too far - move closer
            this.x += (dx / dist) * this.speed;
            this.y += (dy / dist) * this.speed;
        } else {
            // In sweet spot - strafe sideways
            const perpAngle = Math.atan2(dy, dx) + Math.PI / 2;
            this.x += Math.cos(perpAngle) * this.speed * 0.5;
            this.y += Math.sin(perpAngle) * this.speed * 0.5;
        }

        // Spit acid projectile
        const now = Date.now();
        if (now - this.lastSpitTime >= this.spitCooldown && dist <= 600) {
            // Use global reference set by main.js
            if (typeof window !== 'undefined' && window.AcidProjectile) {
                const targetX = player.x;
                const targetY = player.y;
                gameState.acidProjectiles = gameState.acidProjectiles || [];
                gameState.acidProjectiles.push(new window.AcidProjectile(this.x, this.y, targetX, targetY));
            }
            this.lastSpitTime = now;
        }
    }

    draw() {
        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.beginPath();
        ctx.ellipse(this.x + 3, this.y + this.radius + 3, this.radius * 1.2, this.radius * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Toxic green aura - quality scaled
        const auraQuality = graphicsSettings.getQualityValues('aura');
        if (auraQuality.opacity > 0) {
            const pulse = Math.sin(Date.now() / 250) * 0.4 + 0.6;
            const pulseMultiplier = auraQuality.pulseComplexity;
            const baseOpacity = 0.5 * auraQuality.opacity;
            
            if (auraQuality.hasMultiLayer) {
                const outerAura = ctx.createRadialGradient(this.x, this.y, this.radius * 0.5, this.x, this.y, this.radius * 2.5);
                outerAura.addColorStop(0, `rgba(0, 255, 0, ${baseOpacity * pulse * pulseMultiplier})`);
                outerAura.addColorStop(0.4, `rgba(50, 255, 50, ${baseOpacity * 0.7 * pulse * pulseMultiplier})`);
                outerAura.addColorStop(0.7, `rgba(100, 255, 100, ${baseOpacity * 0.4 * pulse * pulseMultiplier})`);
                outerAura.addColorStop(1, 'rgba(0, 255, 0, 0)');
                ctx.fillStyle = outerAura;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius * 2.5, 0, Math.PI * 2);
                ctx.fill();
            }
            
            const auraGradient = ctx.createRadialGradient(this.x, this.y, this.radius * 0.5, this.x, this.y, this.radius * 2);
            auraGradient.addColorStop(0, `rgba(0, 255, 0, ${baseOpacity * pulse})`);
            auraGradient.addColorStop(0.5, `rgba(50, 255, 50, ${baseOpacity * 0.6 * pulse})`);
            auraGradient.addColorStop(1, 'rgba(0, 255, 0, 0)');
            ctx.fillStyle = auraGradient;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius * 2, 0, Math.PI * 2);
            ctx.fill();
        }

        // Body (Toxic green)
        const bodyGradient = ctx.createRadialGradient(this.x - 4, this.y - 4, 0, this.x, this.y, this.radius);
        bodyGradient.addColorStop(0, '#66ff66');
        bodyGradient.addColorStop(0.4, '#4caf50');
        bodyGradient.addColorStop(0.7, '#388e3c');
        bodyGradient.addColorStop(1, '#1b5e20');
        ctx.fillStyle = bodyGradient;
        ctx.beginPath();
        ctx.ellipse(this.x, this.y + 15, this.radius * 1.2, this.radius * 1.5, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Swollen/bloated appearance (spitter characteristic)
        ctx.fillStyle = 'rgba(100, 255, 100, 0.3)';
        ctx.beginPath();
        ctx.arc(this.x, this.y + 8, this.radius * 0.8, 0, Math.PI * 2);
        ctx.fill();

        // Eyes (Bright green)
        const eyePulse = Math.sin(Date.now() / 167) * 0.3 + 0.7;
        ctx.fillStyle = `rgba(0, 255, 0, ${eyePulse})`;
        ctx.beginPath();
        ctx.arc(this.x - this.radius * 0.4, this.y - this.radius * 0.25, this.radius * 0.25, 0, Math.PI * 2);
        ctx.arc(this.x + this.radius * 0.4, this.y - this.radius * 0.25, this.radius * 0.25, 0, Math.PI * 2);
        ctx.fill();

        // Body outline
        ctx.strokeStyle = '#1b5e20';
        ctx.lineWidth = 2.5;
        ctx.setLineDash([2, 1]);
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
    }

    takeDamage(bulletDamage) {
        this.health -= bulletDamage;
        this.lastDamageTime = Date.now();
        return this.health <= 0;
    }
}

// Flying Zombie - Flies with wings, faster but weaker
export class FlyingZombie extends Zombie {
    constructor(canvasWidth, canvasHeight) {
        super(canvasWidth, canvasHeight);
        this.type = 'flying';
        this.speed *= 1.2; // 1.2x faster than normal
        this.health = Math.floor(this.health * 0.7); // 70% health
        this.radius *= 0.9; // 90% radius (smaller hitbox)
        this.floatOffset = Math.random() * 1000; // Unique animation timing
        
    }

    draw() {
        // Calculate floating animation - MORE ELEVATED (increased from 3 to 8 pixels)
        const floatOffset = Math.sin((Date.now() + this.floatOffset) / 250) * 8;
        const elevationHeight = 12; // Base elevation height (makes them float higher)
        const drawY = this.y - floatOffset - elevationHeight; // Draw position adjusted for float and elevation

        // DARKER SHADOW during daytime (darker when NOT night)
        if (graphicsSettings.shadows !== false) {
            // Daytime: darker shadow (0.8 alpha), Nighttime: lighter shadow (0.4 alpha)
            const shadowAlpha = gameState.isNight ? RENDERING.SHADOW_ALPHA * 0.4 : RENDERING.SHADOW_ALPHA * 0.8;
            const shadowOffset = elevationHeight * 0.5; // Shadow offset based on elevation
            
            // Draw darker, more prominent shadow on ground (below the zombie)
            ctx.fillStyle = `rgba(0, 0, 0, ${shadowAlpha})`;
            ctx.beginPath();
            // Shadow is larger and more offset to show height
            ctx.ellipse(
                this.x + 3, 
                this.y + this.radius + 3 + shadowOffset, // Shadow further down due to elevation
                this.radius * 1.4, // Larger shadow
                this.radius * 0.5, // More elliptical
                0, 0, Math.PI * 2
            );
            ctx.fill();
            
            // Additional soft shadow layer for depth (daytime only)
            if (!gameState.isNight) {
                ctx.fillStyle = `rgba(0, 0, 0, ${shadowAlpha * 0.5})`;
                ctx.beginPath();
                ctx.ellipse(
                    this.x + 3,
                    this.y + this.radius + 3 + shadowOffset,
                    this.radius * 1.8,
                    this.radius * 0.6,
                    0, 0, Math.PI * 2
                );
                ctx.fill();
            }
        }

        // Darker, more menacing aura (bat-like, purple/black tones)
        const auraQuality = graphicsSettings.getQualityValues('aura');
        if (auraQuality.opacity > 0) {
            const pulse = Math.sin(Date.now() / 300) * 0.3 + 0.7;
            const pulseMultiplier = auraQuality.pulseComplexity;
            const baseOpacity = 0.5 * auraQuality.opacity; // Darker than normal zombies
            
            if (auraQuality.hasMultiLayer) {
                // Outer dark purple/black aura
                const outerAura = ctx.createRadialGradient(this.x, drawY, this.radius * 0.5, this.x, drawY, this.radius * 2.5);
                outerAura.addColorStop(0, `rgba(80, 40, 100, ${baseOpacity * pulse * pulseMultiplier})`);
                outerAura.addColorStop(0.3, `rgba(60, 30, 80, ${baseOpacity * 0.7 * pulse * pulseMultiplier})`);
                outerAura.addColorStop(0.6, `rgba(40, 20, 60, ${baseOpacity * 0.4 * pulse * pulseMultiplier})`);
                outerAura.addColorStop(1, 'rgba(20, 10, 30, 0)');
                ctx.fillStyle = outerAura;
                ctx.beginPath();
                ctx.arc(this.x, drawY, this.radius * 2.5, 0, Math.PI * 2);
                ctx.fill();
            }
            
            // Inner darker aura
            const auraGradient = ctx.createRadialGradient(this.x, drawY, this.radius * 0.5, this.x, drawY, this.radius * 2.0);
            auraGradient.addColorStop(0, `rgba(100, 50, 120, ${baseOpacity * pulse})`);
            auraGradient.addColorStop(0.5, `rgba(70, 35, 90, ${baseOpacity * 0.6 * pulse})`);
            auraGradient.addColorStop(1, 'rgba(40, 20, 60, 0)');
            ctx.fillStyle = auraGradient;
            ctx.beginPath();
            ctx.arc(this.x, drawY, this.radius * 2.0, 0, Math.PI * 2);
            ctx.fill();
        }

        // Save context for wing drawing
        ctx.save();
        ctx.translate(this.x, drawY);

        // LARGER, MORE PROMINENT BAT-LIKE WINGS
        const wingFlapSpeed = 400; // Wing flap speed
        const wingAngle = Math.sin((Date.now() + this.floatOffset) / wingFlapSpeed) * 0.4; // More pronounced wing animation
        const wingColor = '#1a1a2e'; // Dark purple/black bat-like color
        const wingAccent = '#2d1b4e'; // Dark purple accent
        
        // Left wing (LARGER - 12px x 6px instead of 6px x 3px)
        ctx.save();
        ctx.translate(-12, -4); // Further out and up
        ctx.rotate(-0.5 + wingAngle); // More angle
        // Wing membrane gradient
        const leftWingGradient = ctx.createLinearGradient(-8, 0, 8, 0);
        leftWingGradient.addColorStop(0, wingAccent);
        leftWingGradient.addColorStop(0.5, wingColor);
        leftWingGradient.addColorStop(1, '#0f0f1a');
        ctx.fillStyle = leftWingGradient;
        ctx.strokeStyle = '#0a0a15';
        ctx.lineWidth = 2;
        ctx.beginPath();
        // Bat-like wing shape (more elongated)
        ctx.ellipse(0, 0, 12, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        // Wing bone structure
        ctx.strokeStyle = '#3d2b5e';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-8, -3);
        ctx.moveTo(0, 0);
        ctx.lineTo(8, -2);
        ctx.stroke();
        ctx.restore();

        // Right wing (LARGER - 12px x 6px instead of 6px x 3px)
        ctx.save();
        ctx.translate(12, -4); // Further out and up
        ctx.rotate(0.5 - wingAngle); // More angle
        // Wing membrane gradient
        const rightWingGradient = ctx.createLinearGradient(-8, 0, 8, 0);
        rightWingGradient.addColorStop(0, wingAccent);
        rightWingGradient.addColorStop(0.5, wingColor);
        rightWingGradient.addColorStop(1, '#0f0f1a');
        ctx.fillStyle = rightWingGradient;
        ctx.strokeStyle = '#0a0a15';
        ctx.lineWidth = 2;
        ctx.beginPath();
        // Bat-like wing shape (more elongated)
        ctx.ellipse(0, 0, 12, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        // Wing bone structure
        ctx.strokeStyle = '#3d2b5e';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-8, -2);
        ctx.moveTo(0, 0);
        ctx.lineTo(8, -3);
        ctx.stroke();
        ctx.restore();

        ctx.restore();

        // DARKER, MORE DISTINCT BODY - Bat-like dark purple/gray tones
        const bodyGradient = ctx.createRadialGradient(this.x - 4, drawY - 4, 0, this.x, drawY, this.radius);
        bodyGradient.addColorStop(0, '#4a3a5a'); // Lighter purple-gray center
        bodyGradient.addColorStop(0.4, '#3a2a4a'); // Medium purple-gray
        bodyGradient.addColorStop(0.7, '#2a1a3a'); // Dark purple-gray
        bodyGradient.addColorStop(1, '#1a0a2a'); // Very dark purple
        ctx.fillStyle = bodyGradient;
        ctx.beginPath();
        ctx.ellipse(this.x, drawY + 15, this.radius * 1.2, this.radius * 1.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Bat-like arms (thinner, more angular)
        ctx.strokeStyle = '#1a0a2a';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(this.x - 8, drawY + 10);
        ctx.lineTo(this.x - 16, drawY + 20);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(this.x + 8, drawY + 10);
        ctx.lineTo(this.x + 16, drawY + 20);
        ctx.stroke();

        // Decayed flesh body (head) - DARKER
        ctx.fillStyle = bodyGradient;
        ctx.beginPath();
        ctx.arc(this.x, drawY, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Darker skin texture (purple/black patches)
        ctx.fillStyle = 'rgba(20, 10, 30, 0.5)';
        ctx.beginPath();
        ctx.arc(this.x + 4, drawY - 2, 3, 0, Math.PI * 2);
        ctx.arc(this.x - 3, drawY + 5, 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Additional dark patches for bat-like appearance
        ctx.fillStyle = 'rgba(10, 5, 15, 0.4)';
        ctx.beginPath();
        ctx.arc(this.x, drawY + 3, 2, 0, Math.PI * 2);
        ctx.fill();

        // Body outline (darker, more defined)
        ctx.strokeStyle = '#0a0a15';
        ctx.lineWidth = 2.5;
        ctx.setLineDash([2, 1]);
        ctx.beginPath();
        ctx.arc(this.x, drawY, this.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        // Eye sockets (darker, more menacing)
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.beginPath();
        ctx.ellipse(this.x - 5, drawY - 3, 4, 5, 0, 0, Math.PI * 2);
        ctx.ellipse(this.x + 5, drawY - 3, 4, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Glowing zombie eyes (animated intensity) - quality scaled
        const eyeQuality = graphicsSettings.getQualityValues('eyeGlow');
        const eyePulse = Math.sin(Date.now() / 167) * 0.3 + 0.7;
        ctx.shadowBlur = eyeQuality.shadowBlur * eyePulse;
        ctx.shadowColor = '#ff0000';

        const createEyeGradient = (x, y) => {
            const gradient = ctx.createRadialGradient(x, y, 0, x, y, 3);
            if (eyeQuality.gradientStops >= 5) {
                gradient.addColorStop(0, `rgba(255, 200, 200, ${eyeQuality.alpha})`);
                gradient.addColorStop(0.25, `rgba(255, 150, 150, ${eyeQuality.alpha * 0.9})`);
                gradient.addColorStop(0.5, `rgba(255, 100, 100, ${eyeQuality.alpha * 0.8})`);
                gradient.addColorStop(0.75, `rgba(255, 50, 50, ${eyeQuality.alpha * 0.6})`);
                gradient.addColorStop(1, `rgba(153, 0, 0, ${eyeQuality.alpha * 0.4})`);
            } else if (eyeQuality.gradientStops >= 4) {
                gradient.addColorStop(0, `rgba(255, 150, 150, ${eyeQuality.alpha})`);
                gradient.addColorStop(0.33, `rgba(255, 100, 100, ${eyeQuality.alpha * 0.8})`);
                gradient.addColorStop(0.66, `rgba(255, 50, 50, ${eyeQuality.alpha * 0.6})`);
                gradient.addColorStop(1, `rgba(153, 0, 0, ${eyeQuality.alpha * 0.4})`);
            } else {
                gradient.addColorStop(0, `rgba(255, 102, 102, ${eyeQuality.alpha})`);
                gradient.addColorStop(0.5, `rgba(255, 0, 0, ${eyeQuality.alpha * 0.8})`);
                gradient.addColorStop(1, `rgba(153, 0, 0, ${eyeQuality.alpha * 0.6})`);
            }
            return gradient;
        };

        ctx.fillStyle = createEyeGradient(this.x - 5, drawY - 3);
        ctx.beginPath();
        ctx.arc(this.x - 5, drawY - 3, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = createEyeGradient(this.x + 5, drawY - 3);
        ctx.beginPath();
        ctx.arc(this.x + 5, drawY - 3, 3, 0, Math.PI * 2);
        ctx.fill();

        // Eye highlights
        ctx.fillStyle = 'rgba(255, 100, 100, 0.8)';
        ctx.beginPath();
        ctx.arc(this.x - 6, drawY - 4, 1, 0, Math.PI * 2);
        ctx.arc(this.x + 4, drawY - 4, 1, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowBlur = 0;

        // Jagged mouth (open and menacing)
        ctx.strokeStyle = '#1a1a1a';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(this.x - 6, drawY + 5);
        ctx.quadraticCurveTo(this.x - 3, drawY + 8, this.x, drawY + 7);
        ctx.quadraticCurveTo(this.x + 3, drawY + 8, this.x + 6, drawY + 5);
        ctx.stroke();

        // Teeth
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(this.x - 4, drawY + 5);
        ctx.lineTo(this.x - 4, drawY + 7);
        ctx.moveTo(this.x - 1, drawY + 6);
        ctx.lineTo(this.x - 1, drawY + 8);
        ctx.moveTo(this.x + 2, drawY + 6);
        ctx.lineTo(this.x + 2, drawY + 8);
        ctx.moveTo(this.x + 4, drawY + 5);
        ctx.lineTo(this.x + 4, drawY + 7);
        ctx.stroke();

        // Health bar (if recently damaged and setting enabled)
        if (settingsManager.getSetting('video', 'enemyHealthBars') !== false) {
            const timeSinceDamage = Date.now() - this.lastDamageTime;
            if (timeSinceDamage < 2000 && this.maxHealth) {
                const barWidth = this.radius * 2.5;
                const barHeight = 3;
                const barX = this.x - barWidth / 2;
                const barY = drawY - this.radius - 8;

                // Background
                ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
                ctx.fillRect(barX, barY, barWidth, barHeight);

                // Health fill
                const healthPercent = Math.max(0, this.health / this.maxHealth);
                const fillWidth = barWidth * healthPercent;

                // Get health bar style setting
                const healthBarStyle = settingsManager.getSetting('video', 'enemyHealthBarStyle') || 'gradient';

                if (healthBarStyle === 'gradient') {
                    const gradient = ctx.createLinearGradient(barX, barY, barX + barWidth, barY);
                    if (healthPercent > 0.5) {
                        gradient.addColorStop(0, '#4caf50');
                        gradient.addColorStop(1, '#ffeb3b');
                    } else {
                        gradient.addColorStop(0, '#ffeb3b');
                        gradient.addColorStop(1, '#f44336');
                    }
                    ctx.fillStyle = gradient;
                } else if (healthBarStyle === 'solid') {
                    let color = '#4caf50';
                    if (healthPercent < 0.5) {
                        color = healthPercent < 0.25 ? '#f44336' : '#ffeb3b';
                    }
                    ctx.fillStyle = color;
                } else if (healthBarStyle === 'simple') {
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

    takeDamage(bulletDamage) {
        this.health -= bulletDamage;
        this.lastDamageTime = Date.now();
        return this.health <= 0;
    }
}

// Crawler Zombie - Low-profile crawler that's harder to hit
export class CrawlerZombie extends Zombie {
    constructor(canvasWidth, canvasHeight) {
        super(canvasWidth, canvasHeight);
        this.type = 'crawler';
        this.speed *= 1.3; // 1.3x faster (crawling can be quick)
        this.health = Math.floor(this.health * 0.6); // 60% health (smaller target, easier to kill)
        this.radius *= 0.7; // 0.7x radius (smaller hitbox, harder to hit)
        this.crawlOffset = Math.random() * 1000; // Unique animation timing
    }

    draw() {
        // Low-profile offset (drawn lower on Y-axis, ~+8px offset)
        const drawY = this.y + 8;

        // Flatter, wider shadow (more spread out for crawling pose)
        if (graphicsSettings.shadows !== false) {
            ctx.fillStyle = `rgba(0, 0, 0, ${RENDERING.SHADOW_ALPHA * 0.8})`;
            ctx.beginPath();
            // Wider, flatter shadow for crawling position
            ctx.ellipse(this.x + 2, drawY + this.radius + 2, this.radius * 1.6, this.radius * 0.3, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        // Darker aura (brown/black tones instead of green) - quality scaled
        const auraQuality = graphicsSettings.getQualityValues('aura');
        if (auraQuality.opacity > 0) {
            const pulse = Math.sin(Date.now() / 350) * 0.3 + 0.7;
            const pulseMultiplier = auraQuality.pulseComplexity;
            const baseOpacity = 0.4 * auraQuality.opacity; // Darker than normal zombies
            
            if (auraQuality.hasMultiLayer) {
                const outerAura = ctx.createRadialGradient(this.x, drawY, this.radius * 0.5, this.x, drawY, this.radius * 2.0);
                outerAura.addColorStop(0, `rgba(60, 40, 40, ${baseOpacity * pulse * pulseMultiplier})`);
                outerAura.addColorStop(0.4, `rgba(50, 30, 30, ${baseOpacity * 0.7 * pulse * pulseMultiplier})`);
                outerAura.addColorStop(0.7, `rgba(40, 20, 20, ${baseOpacity * 0.4 * pulse * pulseMultiplier})`);
                outerAura.addColorStop(1, 'rgba(20, 10, 10, 0)');
                ctx.fillStyle = outerAura;
                ctx.beginPath();
                ctx.arc(this.x, drawY, this.radius * 2.0, 0, Math.PI * 2);
                ctx.fill();
            }
            
            const auraGradient = ctx.createRadialGradient(this.x, drawY, this.radius * 0.5, this.x, drawY, this.radius * 1.6);
            auraGradient.addColorStop(0, `rgba(70, 50, 50, ${baseOpacity * pulse})`);
            auraGradient.addColorStop(0.5, `rgba(60, 40, 40, ${baseOpacity * 0.6 * pulse})`);
            auraGradient.addColorStop(1, 'rgba(30, 20, 20, 0)');
            ctx.fillStyle = auraGradient;
            ctx.beginPath();
            ctx.arc(this.x, drawY, this.radius * 1.6, 0, Math.PI * 2);
            ctx.fill();
        }

        // Crawling body (horizontally elongated, darker brown/gray tones)
        const bodyGradient = ctx.createRadialGradient(this.x - 3, drawY - 2, 0, this.x, drawY, this.radius);
        bodyGradient.addColorStop(0, '#3a2a2a'); // Lighter brown-gray center
        bodyGradient.addColorStop(0.4, '#2a1a1a'); // Medium brown-gray
        bodyGradient.addColorStop(0.7, '#1a0a0a'); // Dark brown-gray
        bodyGradient.addColorStop(1, '#0a0000'); // Very dark
        ctx.fillStyle = bodyGradient;
        
        // Elongated horizontal body (wider, flatter)
        ctx.beginPath();
        ctx.ellipse(this.x, drawY + 5, this.radius * 1.4, this.radius * 0.7, 0, 0, Math.PI * 2);
        ctx.fill();

        // Crawling limbs (arms/legs closer to ground)
        ctx.strokeStyle = '#1a0a0a';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        
        // Left arm (crawling position)
        ctx.beginPath();
        ctx.moveTo(this.x - 10, drawY + 3);
        ctx.lineTo(this.x - 18, drawY + 10);
        ctx.stroke();
        
        // Right arm (crawling position)
        ctx.beginPath();
        ctx.moveTo(this.x + 10, drawY + 3);
        ctx.lineTo(this.x + 18, drawY + 10);
        ctx.stroke();
        
        // Left leg (crawling position)
        ctx.beginPath();
        ctx.moveTo(this.x - 8, drawY + 8);
        ctx.lineTo(this.x - 14, drawY + 15);
        ctx.stroke();
        
        // Right leg (crawling position)
        ctx.beginPath();
        ctx.moveTo(this.x + 8, drawY + 8);
        ctx.lineTo(this.x + 14, drawY + 15);
        ctx.stroke();

        // Head (smaller, lower profile)
        ctx.fillStyle = bodyGradient;
        ctx.beginPath();
        ctx.ellipse(this.x, drawY - 2, this.radius * 0.9, this.radius * 0.8, 0, 0, Math.PI * 2);
        ctx.fill();

        // Darker skin texture (decayed patches)
        ctx.fillStyle = 'rgba(10, 5, 5, 0.5)';
        ctx.beginPath();
        ctx.arc(this.x + 3, drawY, 2, 0, Math.PI * 2);
        ctx.arc(this.x - 3, drawY + 4, 2, 0, Math.PI * 2);
        ctx.fill();

        // Body outline (rough, decayed edges)
        ctx.strokeStyle = '#0a0000';
        ctx.lineWidth = 2;
        ctx.setLineDash([2, 1]);
        ctx.beginPath();
        ctx.ellipse(this.x, drawY - 2, this.radius * 0.9, this.radius * 0.8, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        // Eye sockets (darker, more menacing)
        ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        ctx.beginPath();
        ctx.ellipse(this.x - 4, drawY - 4, 3, 4, 0, 0, Math.PI * 2);
        ctx.ellipse(this.x + 4, drawY - 4, 3, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Glowing zombie eyes (animated intensity) - quality scaled
        const eyeQuality = graphicsSettings.getQualityValues('eyeGlow');
        const eyePulse = Math.sin(Date.now() / 167) * 0.3 + 0.7;
        ctx.shadowBlur = eyeQuality.shadowBlur * eyePulse;
        ctx.shadowColor = '#ff0000';

        const createEyeGradient = (x, y) => {
            const gradient = ctx.createRadialGradient(x, y, 0, x, y, 2.5);
            if (eyeQuality.gradientStops >= 5) {
                gradient.addColorStop(0, `rgba(255, 200, 200, ${eyeQuality.alpha})`);
                gradient.addColorStop(0.25, `rgba(255, 150, 150, ${eyeQuality.alpha * 0.9})`);
                gradient.addColorStop(0.5, `rgba(255, 100, 100, ${eyeQuality.alpha * 0.8})`);
                gradient.addColorStop(0.75, `rgba(255, 50, 50, ${eyeQuality.alpha * 0.6})`);
                gradient.addColorStop(1, `rgba(153, 0, 0, ${eyeQuality.alpha * 0.4})`);
            } else if (eyeQuality.gradientStops >= 4) {
                gradient.addColorStop(0, `rgba(255, 150, 150, ${eyeQuality.alpha})`);
                gradient.addColorStop(0.33, `rgba(255, 100, 100, ${eyeQuality.alpha * 0.8})`);
                gradient.addColorStop(0.66, `rgba(255, 50, 50, ${eyeQuality.alpha * 0.6})`);
                gradient.addColorStop(1, `rgba(153, 0, 0, ${eyeQuality.alpha * 0.4})`);
            } else {
                gradient.addColorStop(0, `rgba(255, 102, 102, ${eyeQuality.alpha})`);
                gradient.addColorStop(0.5, `rgba(255, 0, 0, ${eyeQuality.alpha * 0.8})`);
                gradient.addColorStop(1, `rgba(153, 0, 0, ${eyeQuality.alpha * 0.6})`);
            }
            return gradient;
        };

        ctx.fillStyle = createEyeGradient(this.x - 4, drawY - 4);
        ctx.beginPath();
        ctx.arc(this.x - 4, drawY - 4, 2.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = createEyeGradient(this.x + 4, drawY - 4);
        ctx.beginPath();
        ctx.arc(this.x + 4, drawY - 4, 2.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowBlur = 0;

        // Jagged mouth (open and menacing)
        ctx.strokeStyle = '#0a0000';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(this.x - 5, drawY + 2);
        ctx.quadraticCurveTo(this.x - 2, drawY + 5, this.x, drawY + 4);
        ctx.quadraticCurveTo(this.x + 2, drawY + 5, this.x + 5, drawY + 2);
        ctx.stroke();

        // Teeth
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(this.x - 3, drawY + 2);
        ctx.lineTo(this.x - 3, drawY + 4);
        ctx.moveTo(this.x, drawY + 3);
        ctx.lineTo(this.x, drawY + 5);
        ctx.moveTo(this.x + 3, drawY + 2);
        ctx.lineTo(this.x + 3, drawY + 4);
        ctx.stroke();

        // Health bar (if recently damaged and setting enabled)
        if (settingsManager.getSetting('video', 'enemyHealthBars') !== false) {
            const timeSinceDamage = Date.now() - this.lastDamageTime;
            if (timeSinceDamage < 2000 && this.maxHealth) {
                const barWidth = this.radius * 2.5;
                const barHeight = 3;
                const barX = this.x - barWidth / 2;
                const barY = drawY - this.radius - 8;

                // Background
                ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
                ctx.fillRect(barX, barY, barWidth, barHeight);

                // Health fill
                const healthPercent = Math.max(0, this.health / this.maxHealth);
                const fillWidth = barWidth * healthPercent;

                // Get health bar style setting
                const healthBarStyle = settingsManager.getSetting('video', 'enemyHealthBarStyle') || 'gradient';

                if (healthBarStyle === 'gradient') {
                    const gradient = ctx.createLinearGradient(barX, barY, barX + barWidth, barY);
                    if (healthPercent > 0.5) {
                        gradient.addColorStop(0, '#4caf50');
                        gradient.addColorStop(1, '#ffeb3b');
                    } else {
                        gradient.addColorStop(0, '#ffeb3b');
                        gradient.addColorStop(1, '#f44336');
                    }
                    ctx.fillStyle = gradient;
                } else if (healthBarStyle === 'solid') {
                    let color = '#4caf50';
                    if (healthPercent < 0.5) {
                        color = healthPercent < 0.25 ? '#f44336' : '#ffeb3b';
                    }
                    ctx.fillStyle = color;
                } else if (healthBarStyle === 'simple') {
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

    takeDamage(bulletDamage) {
        this.health -= bulletDamage;
        this.lastDamageTime = Date.now();
        return this.health <= 0;
    }
}