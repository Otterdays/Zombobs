import { ctx } from '../core/canvas.js';
import { gameState } from '../core/gameState.js';
import { triggerExplosion } from '../utils/combatUtils.js';
import {
    MOLOTOV_EXPLOSION_RADIUS, MOLOTOV_DAMAGE, MOLOTOV_FIRE_TICK_DAMAGE, MOLOTOV_FIRE_DURATION
} from '../core/constants.js';

export class Molotov {
    constructor(x, y, targetX, targetY, player = null) {
        this.x = x;
        this.y = y;
        this.radius = 5;
        this.targetX = targetX;
        this.targetY = targetY;
        this.gravity = 0.35;
        this.onGround = false;
        this.createdAt = Date.now();
        this.exploded = false;
        this.player = player;

        // Calculate physics trajectory
        const dx = targetX - x;
        const dy = targetY - y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const framesToTarget = Math.max(30, Math.min(80, distance / 4)); // Slightly faster arc

        this.vx = dx / framesToTarget;
        const totalGravityEffect = 0.5 * this.gravity * framesToTarget * framesToTarget;
        this.vy = (dy - totalGravityEffect) / framesToTarget;

        if (this.vy > -4) {
            this.vy = Math.min(this.vy, -4);
        }
    }

    update(canvasWidth, canvasHeight) {
        if (this.exploded) return;

        const isSinglePlayerArcade = !gameState.isCoop && !gameState.multiplayer.active;

        // Gravity
        this.vy += this.gravity;
        this.x += this.vx;
        this.y += this.vy;

        // Bounds (only check canvas ground/walls in non-arcade modes)
        if (!isSinglePlayerArcade) {
            if (this.x < this.radius || this.x > canvasWidth - this.radius || this.y < this.radius) {
                this.explode();
                return;
            }
        }

        // Distance check to target
        const dxToTarget = this.targetX - this.x;
        const dyToTarget = this.targetY - this.y;
        const distToTarget = Math.sqrt(dxToTarget * dxToTarget + dyToTarget * dyToTarget);
        const dot = this.vx * dxToTarget + this.vy * dyToTarget;

        // Explode on impact when close to target or passing it
        if (distToTarget <= 15 || (dot < 0 && distToTarget <= 30)) {
            this.explode();
            return;
        }

        // Explode if it hits a zombie directly during flight
        for (let i = 0; i < gameState.zombies.length; i++) {
            const zombie = gameState.zombies[i];
            const dx = zombie.x - this.x;
            const dy = zombie.y - this.y;
            const dist = dx * dx + dy * dy;
            if (dist < (zombie.radius + this.radius) * (zombie.radius + this.radius)) {
                this.explode();
                return;
            }
        }

        // Safety ground check (only if target is near ground and we're falling)
        if (!isSinglePlayerArcade && this.y >= canvasHeight - this.radius) {
            this.explode();
            return;
        }
    }

    explode() {
        if (this.exploded) return;
        this.exploded = true;

        // 1. Trigger explosive initial blast (low damage)
        triggerExplosion(this.x, this.y, MOLOTOV_EXPLOSION_RADIUS, MOLOTOV_DAMAGE, true, this.player, true);

        // 2. Spawn fire pool (reusing AcidPool)
        if (window.AcidPool) {
            const firePool = new window.AcidPool(this.x, this.y);
            firePool.isFirePool = true;
            firePool.radius = MOLOTOV_EXPLOSION_RADIUS;
            firePool.life = MOLOTOV_FIRE_DURATION;
            firePool.maxLife = MOLOTOV_FIRE_DURATION;
            firePool.damagePerTick = MOLOTOV_FIRE_TICK_DAMAGE;
            firePool.player = this.player; // Attribute score
            gameState.acidPools.push(firePool);
        }
    }

    draw() {
        if (this.exploded) return;

        // Draw bottle (greenish brown glass)
        ctx.save();
        ctx.translate(this.x, this.y);
        // Rotate bottle based on movement velocity
        const angle = Math.atan2(this.vy, this.vx) + Math.PI / 2;
        ctx.rotate(angle);

        // Bottle body
        ctx.fillStyle = '#556b2f'; // Olive drab glass
        ctx.beginPath();
        ctx.ellipse(0, 4, 4, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Bottle neck
        ctx.fillStyle = '#3f4f22';
        ctx.fillRect(-2, -4, 4, 4);

        // Flaming rag (pulsing orange/red)
        const pulse = Math.sin(Date.now() / 40) * 0.2 + 0.8;
        const glow = ctx.createRadialGradient(0, -6, 0, 0, -6, 12);
        glow.addColorStop(0, `rgba(255, 200, 0, ${pulse})`);
        glow.addColorStop(0.5, 'rgba(255, 69, 0, 0.6)');
        glow.addColorStop(1, 'rgba(255, 0, 0, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(0, -6, 10, 0, Math.PI * 2);
        ctx.fill();

        // Small flame shape
        ctx.fillStyle = '#ffaa00';
        ctx.beginPath();
        ctx.moveTo(-2, -4);
        ctx.quadraticCurveTo(-6, -12, 0, -18 * pulse);
        ctx.quadraticCurveTo(6, -12, 2, -4);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    }
}
