import { gameState } from '../core/gameState.js';
import { canvas, ctx } from '../core/canvas.js';
import { spawnParticle } from '../systems/ParticleSystem.js';
import { triggerExplosion } from '../utils/combatUtils.js';

// Helper to check if we're in single player arcade mode
function isSinglePlayerArcade() {
    return !gameState.isCoop && !gameState.multiplayer.active;
}

export class Bullet {
    constructor(x, y, angle, weapon) {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.speed = 12; // Default speed
        this.damage = weapon.damage;
        this.radius = 3;
        this.color = '#ffff00';
        this.distanceTraveled = 0;
        this.maxDistance = 1000; // Max range
        this.markedForRemoval = false;
        this.type = 'normal';

        // Calculate velocity
        this.vx = Math.cos(angle) * this.speed;
        this.vy = Math.sin(angle) * this.speed;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.distanceTraveled += this.speed;

        // Mark for removal if out of bounds or max range
        // v0.8.1.2: In single player arcade mode, bullets exist in world space (no canvas bounds check)
        if (isSinglePlayerArcade()) {
            // Only check max distance in world space
            if (this.distanceTraveled > this.maxDistance) {
                this.markedForRemoval = true;
            }
        } else {
            // In other modes, check canvas bounds
            if (
                this.x < 0 || this.x > canvas.width ||
                this.y < 0 || this.y > canvas.height ||
                this.distanceTraveled > this.maxDistance
            ) {
                this.markedForRemoval = true;
            }
        }
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        // Draw bullet trail
        ctx.beginPath();
        ctx.moveTo(-5, 0);
        ctx.lineTo(0, 0);
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw bullet head
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();

        ctx.restore();
    }
}

export class FlameBullet extends Bullet {
    constructor(x, y, angle, weapon) {
        super(x, y, angle, weapon);
        this.speed = 7;
        this.vx = Math.cos(angle) * this.speed;
        this.vy = Math.sin(angle) * this.speed;
        this.radius = 5;
        this.color = '#ff5722';
        this.maxDistance = weapon.range || 250;
        this.life = 1.0; // For fading out
        this.decay = 0.05;
        this.type = 'flame';
    }

    update() {
        super.update();
        this.life -= this.decay;
        if (this.life <= 0) {
            this.markedForRemoval = true;
        }
        // Add random jitter to flame
        this.x += (Math.random() - 0.5) * 2;
        this.y += (Math.random() - 0.5) * 2;
    }

    draw() {
        ctx.save();
        ctx.globalAlpha = this.life;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * (2 - this.life), 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.restore();
    }
}

export class PiercingBullet extends Bullet {
    constructor(x, y, angle, weapon) {
        super(x, y, angle, weapon);
        this.speed = 25; // Very fast
        this.vx = Math.cos(angle) * this.speed;
        this.vy = Math.sin(angle) * this.speed;
        this.color = '#00e5ff'; // Cyan
        this.pierceCount = 3; // Can hit 3 enemies
        this.maxDistance = 2000; // Long range
        this.type = 'piercing';
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        // Long trail
        ctx.beginPath();
        ctx.moveTo(-20, 0);
        ctx.lineTo(0, 0);
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 3;
        ctx.stroke();

        // Bright core
        ctx.beginPath();
        ctx.arc(0, 0, 2, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();

        ctx.restore();
    }
}

export class Rocket extends Bullet {
    constructor(x, y, angle, weapon) {
        super(x, y, angle, weapon);
        this.speed = 2; // Starts slow
        this.acceleration = 0.5;
        this.maxSpeed = 15;
        this.vx = Math.cos(angle) * this.speed;
        this.vy = Math.sin(angle) * this.speed;
        this.radius = 7; // Increased from 6
        this.color = '#795548'; // Brownish
        this.explosionRadius = weapon.explosionRadius || 150;
        this.explosionDamage = weapon.explosionDamage || 60;
        this.type = 'rocket';
        this.trailFrameCounter = 0; // For flame trail timing
    }

    update() {
        // Don't update if already exploded
        if (this.markedForRemoval) return true;

        // Accelerate
        if (this.speed < this.maxSpeed) {
            this.speed += this.acceleration;
            this.vx = Math.cos(this.angle) * this.speed;
            this.vy = Math.sin(this.angle) * this.speed;
        }

        // Update position and distance
        this.x += this.vx;
        this.y += this.vy;
        this.distanceTraveled += this.speed;

        // Check if rocket reached max distance and explode BEFORE marking for removal
        if (this.distanceTraveled >= this.maxDistance) {
            this.explode();
            return true; // Return true to indicate explosion occurred
        }

        // Check bounds (only in non-arcade modes) - explode on boundary hit
        const isSinglePlayerArcade = !gameState.isCoop && !gameState.multiplayer.active;
        if (!isSinglePlayerArcade) {
            if (
                this.x < 0 || this.x > canvas.width ||
                this.y < 0 || this.y > canvas.height
            ) {
                // Explode on boundary hit
                this.explode();
                return true; // Return true to indicate explosion occurred
            }
        }

        // Continuous smoke trail (1-2 particles per frame)
        const trailOffsetX = this.x - Math.cos(this.angle) * 12; // Behind rocket
        const trailOffsetY = this.y - Math.sin(this.angle) * 12;

        // Smoke particles (gray, drift and fade)
        for (let i = 0; i < 2; i++) {
            const smokeAngle = this.angle + Math.PI + (Math.random() - 0.5) * 0.3; // Behind rocket with slight spread
            const smokeSpeed = Math.random() * 1.5 + 0.5;
            spawnParticle(trailOffsetX, trailOffsetY, `rgba(120, 120, 120, ${Math.random() * 0.4 + 0.3})`, {
                radius: Math.random() * 2 + 2,
                life: Math.random() * 15 + 10,
                maxLife: Math.random() * 15 + 10,
                vx: Math.cos(smokeAngle) * smokeSpeed,
                vy: Math.sin(smokeAngle) * smokeSpeed - 0.3 // Slight upward drift
            });
        }

        // Flame trail (every 2-3 frames, orange/yellow)
        this.trailFrameCounter++;
        if (this.trailFrameCounter >= 2) {
            this.trailFrameCounter = 0;
            const flameOffsetX = this.x - Math.cos(this.angle) * 10;
            const flameOffsetY = this.y - Math.sin(this.angle) * 10;
            const flameAngle = this.angle + Math.PI + (Math.random() - 0.5) * 0.2;
            const flameSpeed = Math.random() * 1 + 0.5;
            const flameColors = ['#ff6600', '#ff8800', '#ffaa00', '#ffff00'];
            spawnParticle(flameOffsetX, flameOffsetY, flameColors[Math.floor(Math.random() * flameColors.length)], {
                radius: Math.random() * 1.5 + 1.5,
                life: Math.random() * 10 + 8,
                maxLife: Math.random() * 10 + 8,
                vx: Math.cos(flameAngle) * flameSpeed,
                vy: Math.sin(flameAngle) * flameSpeed - 0.2
            });
        }
    }

    explode() {
        if (this.markedForRemoval) return;

        this.markedForRemoval = true;

        // Trigger explosion at rocket position
        triggerExplosion(this.x, this.y, this.explosionRadius, this.explosionDamage, true, this.player);
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        // Rocket body (darker, more defined)
        const bodyGradient = ctx.createLinearGradient(-10, 0, 10, 0);
        bodyGradient.addColorStop(0, '#4a3a2a');
        bodyGradient.addColorStop(0.5, '#5d4037');
        bodyGradient.addColorStop(1, '#4a3a2a');
        ctx.fillStyle = bodyGradient;
        ctx.fillRect(-10, -4, 20, 8);

        // Body outline
        ctx.strokeStyle = '#3e2723';
        ctx.lineWidth = 1;
        ctx.strokeRect(-10, -4, 20, 8);

        // Warhead tip (red/orange, pointed cone)
        ctx.beginPath();
        ctx.moveTo(10, -4);
        ctx.lineTo(16, 0);
        ctx.lineTo(10, 4);
        ctx.closePath();
        const warheadGradient = ctx.createLinearGradient(10, 0, 16, 0);
        warheadGradient.addColorStop(0, '#ff4400');
        warheadGradient.addColorStop(1, '#ff0000');
        ctx.fillStyle = warheadGradient;
        ctx.fill();
        ctx.strokeStyle = '#cc0000';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Fins (more visible, triangular shape)
        ctx.fillStyle = '#2a1a1a';
        // Left fin
        ctx.beginPath();
        ctx.moveTo(-10, -4);
        ctx.lineTo(-12, -7);
        ctx.lineTo(-8, -7);
        ctx.closePath();
        ctx.fill();
        // Right fin
        ctx.beginPath();
        ctx.moveTo(-10, 4);
        ctx.lineTo(-12, 7);
        ctx.lineTo(-8, 7);
        ctx.closePath();
        ctx.fill();

        // Engine glow (bright orange/yellow, pulsing effect)
        const pulse = Math.sin(Date.now() / 50) * 0.3 + 0.7; // Pulsing between 0.4 and 1.0
        const glowGradient = ctx.createRadialGradient(-12, 0, 0, -12, 0, 6);
        glowGradient.addColorStop(0, `rgba(255, 200, 0, ${pulse})`);
        glowGradient.addColorStop(0.5, `rgba(255, 150, 0, ${pulse * 0.7})`);
        glowGradient.addColorStop(1, 'rgba(255, 100, 0, 0)');
        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(-12, 0, 6, 0, Math.PI * 2);
        ctx.fill();

        // Inner engine core (bright white/yellow)
        ctx.fillStyle = `rgba(255, 255, 200, ${pulse})`;
        ctx.beginPath();
        ctx.arc(-12, 0, 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}
