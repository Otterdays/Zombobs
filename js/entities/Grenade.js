import { ctx } from '../core/canvas.js';
import { gameState } from '../core/gameState.js';
import { triggerExplosion } from '../utils/combatUtils.js';
import { GRENADE_FUSE_TIME, GRENADE_EXPLOSION_RADIUS, GRENADE_DAMAGE } from '../core/constants.js';

// Grenade class
export class Grenade {
    constructor(x, y, targetX, targetY, player = null) {
        this.x = x;
        this.y = y;
        this.radius = 6;
        this.targetX = targetX;
        this.targetY = targetY;
        this.gravity = 0.3; // Gravity effect
        this.bounce = 0.4; // Bounce when hitting ground
        this.onGround = false;
        this.fuseTime = GRENADE_FUSE_TIME; // Time until explosion
        this.createdAt = Date.now();
        this.exploded = false;
        this.player = player; // Track which player threw this grenade

        // Calculate trajectory to reach target
        const dx = targetX - x;
        const dy = targetY - y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Calculate desired flight time in frames (assuming ~60fps)
        // Closer targets = faster, farther = slower but still reasonable
        const framesToTarget = Math.max(40, Math.min(100, distance / 3.5)); // 0.67 to 1.67 seconds at 60fps

        // Horizontal velocity (straightforward)
        this.vx = dx / framesToTarget;

        // Vertical velocity - account for gravity over flight time
        // We want: finalY = startY + vy * frames + 0.5 * gravity * frames^2
        // Solving: vy = (finalY - startY - 0.5 * gravity * frames^2) / frames
        const totalGravityEffect = 0.5 * this.gravity * framesToTarget * framesToTarget;
        this.vy = (dy - totalGravityEffect) / framesToTarget;

        // Ensure we have enough upward velocity for a visible arc
        // Always give some upward component for arc, even when throwing down
        if (this.vy > -3) {
            // If calculated vy is too low (not enough arc), add upward component
            this.vy = Math.min(this.vy, -3); // Minimum upward arc
        }
    }

    update(canvasWidth, canvasHeight) {
        // Don't update if already exploded
        if (this.exploded) return;

        // v0.8.1.2: In single player arcade mode, grenades exist in world space
        const isSinglePlayerArcade = !gameState.isCoop && !gameState.multiplayer.active;

        // Update fuse timer first
        const elapsed = Date.now() - this.createdAt;
        if (elapsed >= this.fuseTime) {
            this.explode();
            return; // Explode immediately, don't update position
        }

        // Only update physics if not on ground and not exploded
        if (!this.onGround) {
            // Apply gravity
            this.vy += this.gravity;

            // Update position
            this.x += this.vx;
            this.y += this.vy;

            // v0.8.1.2: Only check canvas bounds in non-arcade modes
            if (!isSinglePlayerArcade) {
                // Keep within canvas bounds (horizontal)
                if (this.x < this.radius) {
                    this.x = this.radius;
                    this.vx *= -0.6; // Bounce off left wall
                }
                if (this.x > canvasWidth - this.radius) {
                    this.x = canvasWidth - this.radius;
                    this.vx *= -0.6; // Bounce off right wall
                }

                // Keep within canvas bounds (vertical - top only, allow going down)
                if (this.y < this.radius) {
                    this.y = this.radius;
                    this.vy *= -0.4; // Bounce off top
                }
            }

            // Check distance to target after moving
            const dxToTarget = this.targetX - this.x;
            const dyToTarget = this.targetY - this.y;
            const distToTarget = Math.sqrt(dxToTarget * dxToTarget + dyToTarget * dyToTarget);

            // Determine if we're still moving toward the target
            const dot = this.vx * dxToTarget + this.vy * dyToTarget;

            // If we are very close to target, snap to it and stop
            if (distToTarget <= 15) {
                this.x = this.targetX;
                this.y = this.targetY;
                this.vx = 0;
                this.vy = 0;
                this.onGround = true;
            }
            // If we've passed the target (moving away) and are close enough, snap to it
            else if (dot < 0 && distToTarget <= 30) {
                this.x = this.targetX;
                this.y = this.targetY;
                this.vx = 0;
                this.vy = 0;
                this.onGround = true;
            }
            // Safety ground collision (only if target is at bottom)
            // v0.8.1.2: Only check canvas ground in non-arcade modes
            if (!isSinglePlayerArcade) {
                if (this.y >= canvasHeight - this.radius) {
                    // Only stop at ground if target is also near ground
                    if (this.targetY >= canvasHeight - 30) {
                        this.y = canvasHeight - this.radius;
                        if (!this.onGround) {
                            this.vy *= -this.bounce;
                            this.vx *= 0.7;
                            this.onGround = true;
                        } else {
                            this.vy = 0;
                            this.vx *= 0.9;
                        }
                    }
                    // If target is above ground, let it continue (will be caught by target check)
                }
            }
        } else {
            // On ground - still apply horizontal friction
            this.vx *= 0.9;
            if (Math.abs(this.vx) < 0.1) {
                this.vx = 0;
            }
        }
    }

    explode() {
        if (this.exploded) return;

        this.exploded = true;

        // Use reusable explosion function (player source = true)
        triggerExplosion(this.x, this.y, GRENADE_EXPLOSION_RADIUS, GRENADE_DAMAGE, true, this.player);
    }

    draw() {
        // Don't draw if exploded
        if (this.exploded) return;

        // Fuse indicator (pulsing when close to explosion)
        const elapsed = Date.now() - this.createdAt;
        const timeLeft = Math.max(0, this.fuseTime - elapsed);
        const pulse = timeLeft < 500 ? Math.sin(Date.now() / 50) * 0.3 + 0.7 : 1;

        // Grenade body (dark green/olive)
        const grenadeGradient = ctx.createRadialGradient(this.x - 2, this.y - 2, 0, this.x, this.y, this.radius);
        grenadeGradient.addColorStop(0, '#8b7355');
        grenadeGradient.addColorStop(0.5, '#6b5d3f');
        grenadeGradient.addColorStop(1, '#4a3d2a');
        ctx.fillStyle = grenadeGradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Grenade segments (pineapple style)
        ctx.strokeStyle = '#3a2d1a';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        // Horizontal lines
        ctx.moveTo(this.x - this.radius, this.y - 2);
        ctx.lineTo(this.x + this.radius, this.y - 2);
        ctx.moveTo(this.x - this.radius, this.y);
        ctx.lineTo(this.x + this.radius, this.y);
        ctx.moveTo(this.x - this.radius, this.y + 2);
        ctx.lineTo(this.x + this.radius, this.y + 2);
        ctx.stroke();

        // Fuse (red when close to explosion)
        if (timeLeft < 500) {
            ctx.fillStyle = `rgba(255, 0, 0, ${pulse})`;
        } else {
            ctx.fillStyle = '#ffaa00';
        }
        ctx.beginPath();
        ctx.arc(this.x, this.y - this.radius - 2, 2, 0, Math.PI * 2);
        ctx.fill();

        // Glow when close to explosion
        if (timeLeft < 500) {
            const glowGradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius * 3);
            glowGradient.addColorStop(0, `rgba(255, 100, 0, ${0.4 * pulse})`);
            glowGradient.addColorStop(1, 'rgba(255, 100, 0, 0)');
            ctx.fillStyle = glowGradient;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius * 3, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

