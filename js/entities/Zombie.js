import { ctx } from '../core/canvas.js';
import { gameState } from '../core/gameState.js';
import { MAX_PARTICLES, RENDERING } from '../core/constants.js';
import { playDamageSound, playKillSound, playExplosionSound } from '../systems/AudioSystem.js';
import { triggerDamageIndicator } from '../utils/gameUtils.js';
import { createExplosion, createBloodSplatter, createParticles } from '../systems/ParticleSystem.js';
import { settingsManager } from '../systems/SettingsManager.js';
import { graphicsSettings } from '../systems/GraphicsSystem.js';

// Additive torso overlay VFX — clipped to the torso ellipse, drawn above flesh / under limbs & head
const TORSO_OVERLAY_TYPES = ['goreWetness', 'decayMold', 'tornRemnants', 'infectionPulse', 'slimeFilm'];

function hashZombieId(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash |= 0;
    }
    return Math.abs(hash);
}

function pickTorsoOverlay(zombieId) {
    const hash = hashZombieId(zombieId);
    if (hash % 100 < 30) return null;
    return TORSO_OVERLAY_TYPES[hash % TORSO_OVERLAY_TYPES.length];
}

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

        // Per-zombie additive torso overlay (deterministic from id for multiplayer sync)
        this.torsoOverlay = pickTorsoOverlay(this.id);
        this.torsoOverlaySeed = hashZombieId(this.id);
        this.torsoShape = { offsetY: 15, rxMult: 1.2, ryMult: 1.5 };

        // Organic animation state (cosmetic — deterministic per id, no net sync needed)
        this.animSeed = hashZombieId(this.id);
        this.gazeX = 0;
        this.gazeY = 0;
        this.bodyLean = 0;
        this.facingAngle = 0;
        this.walkPhase = (this.animSeed % 1000) / 100;
        this.armSwayOffset = (this.animSeed % 628) / 100;
        this.hitReactUntil = 0;
        this.behaviorState = 'chase';
        this.behaviorUntil = 0;
    }

    /** Per-type motion tuning — subclasses override for variant polish */
    getMotionProfile() {
        return {
            leanScale: 1,
            bobScale: 1,
            swayScale: 1,
            gazeScale: 1,
            walkPeriod: 150,
            armPeriod: 250,
            tremorScale: 0
        };
    }

    /** Smooth gaze, walk phase, lean, and cosmetic micro-behavior state */
    updateOrganicMotion(player, dx, dy, dist) {
        const profile = this.getMotionProfile();
        const invDist = 1 / (dist || 1);

        const targetGazeX = (dx * invDist) * 1.8 * profile.gazeScale;
        const targetGazeY = (dy * invDist) * 1.2 * profile.gazeScale;
        this.gazeX += (targetGazeX - this.gazeX) * 0.18;
        this.gazeY += (targetGazeY - this.gazeY) * 0.18;

        const speedMag = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        this.walkPhase += speedMag * 0.14 + 0.025;
        this.facingAngle = Math.atan2(dy, dx);

        const targetLean = speedMag * 2.8 * profile.leanScale;
        this.bodyLean += (targetLean - this.bodyLean) * 0.12;

        const now = Date.now();
        if (now > this.behaviorUntil) {
            const bucket = Math.floor((now + this.animSeed) / 2400);
            const roll = (this.animSeed + bucket * 31) % 100;
            if (roll < 15) this.behaviorState = 'lurch';
            else if (roll < 28) this.behaviorState = 'stagger';
            else if (roll < 38) this.behaviorState = 'hesitate';
            else if (roll < 50) this.behaviorState = 'reach';
            else this.behaviorState = 'chase';
            this.behaviorUntil = now + 400 + (this.animSeed % 600);
        }
    }

    /** Pose offsets for lean, bob, sway, hit recoil, and tremor */
    getPoseOffsets() {
        const profile = this.getMotionProfile();
        const now = Date.now();
        const bob = Math.sin(this.walkPhase) * 2 * profile.bobScale;
        const sway = Math.sin(this.walkPhase * 0.5 + this.armSwayOffset) * 2 * profile.swayScale;
        const angle = this.facingAngle;

        let leanX = Math.cos(angle) * this.bodyLean * 0.45;
        let leanY = Math.sin(angle) * this.bodyLean * 0.3 + bob;
        let armReach = 0;

        switch (this.behaviorState) {
            case 'lurch':
                leanX += Math.cos(angle) * 3;
                armReach = 5;
                break;
            case 'stagger':
                leanX += Math.sin(now / 80 + this.animSeed) * 2.5;
                break;
            case 'hesitate':
                leanX -= Math.cos(angle) * 2.5;
                leanY -= Math.sin(angle) * 1;
                break;
            case 'reach':
                armReach = 7;
                leanX += Math.cos(angle) * 1.5;
                break;
        }

        let hitRecoilX = 0;
        let hitRecoilY = 0;
        if (now < this.hitReactUntil) {
            const t = (this.hitReactUntil - now) / 180;
            hitRecoilX = -Math.cos(angle) * 3.5 * t;
            hitRecoilY = -Math.sin(angle) * 2.5 * t;
        }

        let tremorX = 0;
        let tremorY = 0;
        if (profile.tremorScale > 0) {
            tremorX = Math.sin(now / 40 + this.animSeed) * profile.tremorScale;
            tremorY = Math.cos(now / 35 + this.animSeed) * profile.tremorScale;
        }

        return {
            leanX, leanY, headBob: bob * 0.5, armSway: sway, armReach,
            hitRecoilX, hitRecoilY, tremorX, tremorY
        };
    }

    getDrawPosition() {
        const pose = this.getPoseOffsets();
        return {
            x: this.x + pose.leanX + pose.hitRecoilX + pose.tremorX,
            y: this.y + pose.leanY + pose.hitRecoilY + pose.tremorY,
            pose
        };
    }

    /** Eye draw options — subclasses override for variant colors */
    getEyeDrawOptions() {
        return {
            leftX: -5,
            rightX: 5,
            y: -3,
            size: 3,
            shadowColor: '#ff0000',
            glowRgb: '255, 0, 0'
        };
    }

    drawEyes(context, x, y, radius) {
        const eyeQuality = graphicsSettings.getQualityValues('eyeGlow');
        if (eyeQuality.opacity <= 0 && eyeQuality.shadowBlur <= 0) return;

        const opts = this.getEyeDrawOptions();
        const eyePulse = Math.sin(Date.now() / 167) * 0.3 + 0.7;
        const gx = this.gazeX || 0;
        const gy = this.gazeY || 0;
        const leftCx = x + opts.leftX + gx;
        const leftCy = y + opts.y + gy;
        const rightCx = x + opts.rightX + gx;
        const rightCy = y + opts.y + gy;
        const size = opts.size || 3;
        const rgb = opts.glowRgb || '255, 0, 0';

        context.shadowBlur = eyeQuality.shadowBlur * eyePulse;
        context.shadowColor = opts.shadowColor || '#ff0000';

        const createEyeGradient = (cx, cy) => {
            const gradient = context.createRadialGradient(cx, cy, 0, cx, cy, size);
            if (eyeQuality.gradientStops >= 5) {
                gradient.addColorStop(0, `rgba(${rgb}, ${eyeQuality.alpha})`);
                gradient.addColorStop(0.25, `rgba(${rgb}, ${eyeQuality.alpha * 0.9})`);
                gradient.addColorStop(0.5, `rgba(${rgb}, ${eyeQuality.alpha * 0.75})`);
                gradient.addColorStop(0.75, `rgba(${rgb}, ${eyeQuality.alpha * 0.55})`);
                gradient.addColorStop(1, `rgba(153, 0, 0, ${eyeQuality.alpha * 0.4})`);
            } else if (eyeQuality.gradientStops >= 4) {
                gradient.addColorStop(0, `rgba(${rgb}, ${eyeQuality.alpha})`);
                gradient.addColorStop(0.33, `rgba(${rgb}, ${eyeQuality.alpha * 0.8})`);
                gradient.addColorStop(0.66, `rgba(${rgb}, ${eyeQuality.alpha * 0.6})`);
                gradient.addColorStop(1, `rgba(153, 0, 0, ${eyeQuality.alpha * 0.4})`);
            } else {
                gradient.addColorStop(0, `rgba(255, 102, 102, ${eyeQuality.alpha})`);
                gradient.addColorStop(0.5, `rgba(${rgb}, ${eyeQuality.alpha * 0.8})`);
                gradient.addColorStop(1, `rgba(153, 0, 0, ${eyeQuality.alpha * 0.6})`);
            }
            return gradient;
        };

        context.fillStyle = createEyeGradient(leftCx, leftCy);
        context.beginPath();
        context.arc(leftCx, leftCy, size, 0, Math.PI * 2);
        context.fill();

        context.fillStyle = createEyeGradient(rightCx, rightCy);
        context.beginPath();
        context.arc(rightCx, rightCy, size, 0, Math.PI * 2);
        context.fill();

        context.fillStyle = 'rgba(255, 100, 100, 0.8)';
        context.beginPath();
        context.arc(leftCx - 1, leftCy - 1, 1, 0, Math.PI * 2);
        context.arc(rightCx - 1, rightCy - 1, 1, 0, Math.PI * 2);
        context.fill();

        context.shadowBlur = 0;
    }

    drawHitReactFlash(context, x, y, radius) {
        const now = Date.now();
        if (now >= this.hitReactUntil) return;

        const flash = (this.hitReactUntil - now) / 180;
        const shape = this.torsoShape || { offsetY: 15, rxMult: 1.2, ryMult: 1.5 };

        context.save();
        context.globalCompositeOperation = 'screen';
        context.fillStyle = `rgba(255, 60, 60, ${0.4 * flash})`;
        context.beginPath();
        context.ellipse(x, y + shape.offsetY, radius * shape.rxMult, radius * shape.ryMult, 0, 0, Math.PI * 2);
        context.fill();
        context.fillStyle = `rgba(255, 200, 200, ${0.25 * flash})`;
        context.beginPath();
        context.arc(x, y, radius * 0.85, 0, Math.PI * 2);
        context.fill();
        context.restore();
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

        this.updateOrganicMotion(player, dx, dy, dist);
    }

    drawStaticBody(ctx, x, y, radius, pose = null) {
        const p = pose || this.getPoseOffsets();
        const armSway = p.armSway || 0;
        const armReach = p.armReach || 0;

        // Zombie torso (singular piece of body) - drawn BEFORE head for proper layering
        const bodyGradient = ctx.createRadialGradient(x - 4, y - 4, 0, x, y, radius);
        bodyGradient.addColorStop(0, '#9acd32');
        bodyGradient.addColorStop(0.4, '#7cb342');
        bodyGradient.addColorStop(0.7, '#558b2f');
        bodyGradient.addColorStop(1, '#33691e');
        ctx.fillStyle = bodyGradient;
        ctx.beginPath();
        ctx.ellipse(x, y + 15, radius * 1.2, radius * 1.5, 0, 0, Math.PI * 2);
        ctx.fill();

        this.drawTorsoOverlayLayer(ctx, x, y, radius);

        // Zombie arm (singular piece of body) - drawn BEFORE head for proper layering
        ctx.strokeStyle = '#1b3a00';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x - 8, y + 10);
        ctx.lineTo(x - 15 - armSway, y + 18 + armReach);
        ctx.stroke();

        // Decayed flesh body (head)
        ctx.fillStyle = bodyGradient;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();

        // Zombie skin texture (darker patches)
        ctx.fillStyle = 'rgba(30, 60, 10, 0.3)';
        ctx.beginPath();
        ctx.arc(x + 4, y - 2, 3, 0, Math.PI * 2);
        ctx.arc(x - 3, y + 5, 2, 0, Math.PI * 2);
        ctx.fill();

        // Body outline (rough edges)
        ctx.strokeStyle = '#1b3a00';
        ctx.lineWidth = 2.5;
        ctx.setLineDash([2, 1]);
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        // Eye sockets (darker areas)
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.beginPath();
        ctx.ellipse(x - 5, y - 3, 4, 5, 0, 0, Math.PI * 2);
        ctx.ellipse(x + 5, y - 3, 4, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Jagged mouth (open and menacing)
        ctx.strokeStyle = '#1a1a1a';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x - 6, y + 5);
        ctx.quadraticCurveTo(x - 3, y + 8, x, y + 7);
        ctx.quadraticCurveTo(x + 3, y + 8, x + 6, y + 5);
        ctx.stroke();

        // Teeth
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x - 4, y + 5);
        ctx.lineTo(x - 4, y + 7);
        ctx.moveTo(x - 1, y + 6);
        ctx.lineTo(x - 1, y + 8);
        ctx.moveTo(x + 2, y + 6);
        ctx.lineTo(x + 2, y + 8);
        ctx.moveTo(x + 4, y + 5);
        ctx.lineTo(x + 4, y + 7);
        ctx.stroke();
    }

    /**
     * Additive VFX layer clipped to the torso ellipse — flesh detail above base fill, below arms/head.
     */
    drawTorsoOverlayLayer(ctx, x, y, radius) {
        if (!this.torsoOverlay) return;

        const quality = graphicsSettings.getQualityValues('aura');
        if (quality.opacity <= 0) return;

        const shape = this.torsoShape || { offsetY: 15, rxMult: 1.2, ryMult: 1.5 };
        const cx = x;
        const cy = y + shape.offsetY;
        const rx = radius * shape.rxMult;
        const ry = radius * shape.ryMult;
        const seed = this.torsoOverlaySeed || 0;
        const intensity = quality.opacity * (graphicsSettings.effectIntensity ?? 1);
        const now = Date.now();

        ctx.save();
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        ctx.clip();

        switch (this.torsoOverlay) {
            case 'goreWetness': {
                ctx.fillStyle = `rgba(90, 10, 10, ${0.35 * intensity})`;
                ctx.beginPath();
                ctx.ellipse(cx - 4, cy + 2, rx * 0.35, ry * 0.55, -0.15, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = `rgba(120, 0, 0, ${0.25 * intensity})`;
                ctx.fillRect(cx - 2, cy - ry * 0.4, 3, ry * 0.75);

                ctx.globalCompositeOperation = 'screen';
                const wetPulse = Math.sin((now + seed * 13) / 420) * 0.15 + 0.85;
                ctx.fillStyle = `rgba(255, 80, 80, ${0.22 * intensity * wetPulse})`;
                ctx.beginPath();
                ctx.ellipse(cx + 5, cy - 3, 4, 3, 0, 0, Math.PI * 2);
                ctx.ellipse(cx - 7, cy + 6, 3, 2.5, 0, 0, Math.PI * 2);
                ctx.fill();
                if (quality.hasMultiLayer) {
                    ctx.fillStyle = `rgba(255, 180, 180, ${0.12 * intensity * wetPulse})`;
                    ctx.beginPath();
                    ctx.ellipse(cx + 2, cy - ry * 0.15, rx * 0.45, ry * 0.2, 0, 0, Math.PI * 2);
                    ctx.fill();
                }
                break;
            }
            case 'decayMold': {
                const moldSpots = [
                    { ox: -6, oy: -4, r: 4 },
                    { ox: 7, oy: 2, r: 3.5 },
                    { ox: -2, oy: 8, r: 3 }
                ];
                ctx.fillStyle = `rgba(35, 45, 20, ${0.45 * intensity})`;
                for (let i = 0; i < moldSpots.length; i++) {
                    const spot = moldSpots[i];
                    ctx.beginPath();
                    ctx.arc(cx + spot.ox, cy + spot.oy, spot.r, 0, Math.PI * 2);
                    ctx.fill();
                }

                ctx.globalCompositeOperation = 'lighter';
                ctx.fillStyle = `rgba(140, 200, 60, ${0.18 * intensity})`;
                ctx.beginPath();
                ctx.arc(cx - 5, cy - 3, 2.5, 0, Math.PI * 2);
                ctx.arc(cx + 6, cy + 4, 2, 0, Math.PI * 2);
                ctx.fill();
                break;
            }
            case 'tornRemnants': {
                const fabricHue = 120 + (seed % 80);
                ctx.fillStyle = `hsla(${fabricHue}, 18%, 28%, ${0.55 * intensity})`;
                ctx.beginPath();
                ctx.moveTo(cx - rx * 0.55, cy - ry * 0.15);
                ctx.lineTo(cx - rx * 0.35, cy + ry * 0.35);
                ctx.lineTo(cx - rx * 0.1, cy + ry * 0.2);
                ctx.closePath();
                ctx.fill();

                ctx.fillStyle = `hsla(${fabricHue}, 12%, 18%, ${0.45 * intensity})`;
                ctx.beginPath();
                ctx.moveTo(cx + rx * 0.2, cy - ry * 0.05);
                ctx.lineTo(cx + rx * 0.5, cy + ry * 0.25);
                ctx.lineTo(cx + rx * 0.15, cy + ry * 0.4);
                ctx.closePath();
                ctx.fill();

                ctx.globalCompositeOperation = 'screen';
                ctx.strokeStyle = `rgba(200, 190, 170, ${0.15 * intensity})`;
                ctx.lineWidth = 0.8;
                ctx.beginPath();
                ctx.moveTo(cx - rx * 0.4, cy + ry * 0.1);
                ctx.lineTo(cx - rx * 0.15, cy + ry * 0.28);
                ctx.stroke();
                break;
            }
            case 'infectionPulse': {
                const pulse = Math.sin((now + seed * 7) / 280) * 0.35 + 0.65;
                ctx.strokeStyle = `rgba(80, 0, 20, ${0.5 * intensity})`;
                ctx.lineWidth = 1.2;
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.moveTo(cx, cy - ry * 0.2);
                ctx.quadraticCurveTo(cx - 8, cy + 2, cx - 5, cy + ry * 0.35);
                ctx.moveTo(cx + 2, cy - ry * 0.15);
                ctx.quadraticCurveTo(cx + 9, cy + 4, cx + 4, cy + ry * 0.3);
                ctx.stroke();

                ctx.globalCompositeOperation = 'lighter';
                ctx.strokeStyle = `rgba(255, 40, 80, ${0.35 * intensity * pulse})`;
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(cx, cy - ry * 0.2);
                ctx.quadraticCurveTo(cx - 8, cy + 2, cx - 5, cy + ry * 0.35);
                ctx.stroke();
                if (quality.hasMultiLayer) {
                    ctx.fillStyle = `rgba(255, 60, 100, ${0.12 * intensity * pulse})`;
                    ctx.beginPath();
                    ctx.arc(cx, cy, 3 * pulse, 0, Math.PI * 2);
                    ctx.fill();
                }
                break;
            }
            case 'slimeFilm': {
                const shimmer = Math.sin((now + seed * 11) / 500) * 0.2 + 0.8;
                ctx.fillStyle = `rgba(60, 120, 90, ${0.22 * intensity})`;
                ctx.beginPath();
                ctx.ellipse(cx, cy, rx * 0.85, ry * 0.7, 0, 0, Math.PI * 2);
                ctx.fill();

                ctx.globalCompositeOperation = 'screen';
                ctx.fillStyle = `rgba(120, 255, 180, ${0.16 * intensity * shimmer})`;
                ctx.beginPath();
                ctx.ellipse(cx - rx * 0.2, cy - ry * 0.25, rx * 0.35, ry * 0.15, -0.2, 0, Math.PI * 2);
                ctx.fill();

                const dripPhase = ((now + seed * 17) / 80) % 12;
                if (dripPhase < 8) {
                    ctx.fillStyle = `rgba(100, 220, 150, ${0.35 * intensity})`;
                    ctx.beginPath();
                    ctx.ellipse(cx + 4, cy + ry * 0.45 + dripPhase * 0.4, 1.2, 2.5, 0, 0, Math.PI * 2);
                    ctx.fill();
                }
                break;
            }
        }

        ctx.restore();
    }

    draw(context = ctx) {
        // Shadow (larger and more ominous) - only if shadows enabled
        if (graphicsSettings.shadows !== false) {
            context.fillStyle = `rgba(0, 0, 0, ${RENDERING.SHADOW_ALPHA})`;
            context.beginPath();
            context.ellipse(this.x + 3, this.y + this.radius + 3, this.radius * 1.2, this.radius * 0.4, 0, 0, Math.PI * 2);
            context.fill();
        }

        // Toxic aura (pulsing outer glow) - quality scaled
        const auraQuality = graphicsSettings.getQualityValues('aura');
        if (auraQuality.opacity > 0) {
            const pulse = Math.sin(Date.now() / RENDERING.ZOMBIE_PULSE_PERIOD) * 0.4 + 0.6;
            const pulseMultiplier = auraQuality.pulseComplexity;
            const baseOpacity = 0.4 * auraQuality.opacity;

            if (auraQuality.hasMultiLayer) {
                // Multi-layer aura for high/ultra quality
                const outerAura = context.createRadialGradient(this.x, this.y, this.radius * 0.5, this.x, this.y, this.radius * 2.5);
                outerAura.addColorStop(0, `rgba(0, 255, 0, ${baseOpacity * pulse * pulseMultiplier})`);
                outerAura.addColorStop(0.3, `rgba(50, 255, 50, ${baseOpacity * 0.6 * pulse * pulseMultiplier})`);
                outerAura.addColorStop(0.6, `rgba(100, 255, 100, ${baseOpacity * 0.3 * pulse * pulseMultiplier})`);
                outerAura.addColorStop(1, 'rgba(0, 255, 0, 0)');
                context.fillStyle = outerAura;
                context.beginPath();
                context.arc(this.x, this.y, this.radius * 2.5, 0, Math.PI * 2);
                context.fill();
            }

            const auraGradient = context.createRadialGradient(this.x, this.y, this.radius * 0.5, this.x, this.y, this.radius * 2);
            auraGradient.addColorStop(0, `rgba(0, 255, 0, ${baseOpacity * pulse})`);
            auraGradient.addColorStop(0.5, `rgba(50, 255, 50, ${baseOpacity * 0.5 * pulse})`);
            auraGradient.addColorStop(1, 'rgba(0, 255, 0, 0)');
            context.fillStyle = auraGradient;
            context.beginPath();
            context.arc(this.x, this.y, this.radius * 2, 0, Math.PI * 2);
            context.fill();
        }

        // Static Body (Direct rendering) with organic pose
        const { x: drawX, y: drawY, pose } = this.getDrawPosition();
        this.drawStaticBody(context, drawX, drawY, this.radius, pose);

        this.drawHitReactFlash(context, drawX, drawY, this.radius);
        this.drawEyes(context, drawX, drawY, this.radius);

        // Dripping effect (zombie drool/decay)
        const dripAnim = (Date.now() / 50 + this.x) % 10;
        if (dripAnim < 5) {
            context.fillStyle = 'rgba(100, 150, 50, 0.6)';
            context.beginPath();
            context.ellipse(drawX + 7, drawY + 8 + dripAnim * 0.5, 1, 2, 0, 0, Math.PI * 2);
            context.fill();
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
                context.fillStyle = 'rgba(0, 0, 0, 0.6)';
                context.fillRect(barX, barY, barWidth, barHeight);

                // Health fill
                const healthPercent = Math.max(0, this.health / this.maxHealth);
                const fillWidth = barWidth * healthPercent;

                // Get health bar style setting
                const healthBarStyle = settingsManager.getSetting('video', 'enemyHealthBarStyle') || 'gradient';

                if (healthBarStyle === 'gradient') {
                    // Color gradient: green -> yellow -> red
                    const gradient = context.createLinearGradient(barX, barY, barX + barWidth, barY);
                    if (healthPercent > 0.5) {
                        gradient.addColorStop(0, '#4caf50'); // Green
                        gradient.addColorStop(1, '#ffeb3b'); // Yellow
                    } else {
                        gradient.addColorStop(0, '#ffeb3b'); // Yellow
                        gradient.addColorStop(1, '#f44336'); // Red
                    }
                    context.fillStyle = gradient;
                } else if (healthBarStyle === 'solid') {
                    // Single color based on health percent
                    let color = '#4caf50'; // Green
                    if (healthPercent < 0.5) {
                        color = healthPercent < 0.25 ? '#f44336' : '#ffeb3b'; // Red or Yellow
                    }
                    context.fillStyle = color;
                } else if (healthBarStyle === 'simple') {
                    // Simple white fill
                    context.fillStyle = '#ffffff';
                }

                context.fillRect(barX, barY, fillWidth, barHeight);

                // Border (only for gradient and solid styles)
                if (healthBarStyle !== 'simple') {
                    context.strokeStyle = 'rgba(255, 255, 255, 0.5)';
                    context.lineWidth = 1;
                    context.strokeRect(barX, barY, barWidth, barHeight);
                }
            }
        }
    }

    /**
     * Draw a name tag above the zombie showing its type.
     * Call this at the end of each subclass's draw() method.
     */
    drawNameTag(context, yOffset = 0) {
        if (!settingsManager.getSetting('video', 'enemyNameTags')) return;

        const typeLabels = {
            'base':      { label: 'Zombie',  color: '#9acd32' },
            'normal':    { label: 'Zombie',  color: '#9acd32' },
            'fast':      { label: 'Runner',  color: '#ff6633' },
            'armored':   { label: 'Tank',    color: '#90a4ae' },
            'exploding': { label: 'Bomber',  color: '#ffa500' },
            'ghost':     { label: 'Ghost',   color: '#80deea' },
            'spitter':   { label: 'Spitter', color: '#66ff66' },
            'flying':    { label: 'Flyer',   color: '#9c64c8' },
            'blight':    { label: 'Blight',  color: '#e040fb' },
            'crawler':   { label: 'Crawler', color: '#8d6e63' },
            'boss':      { label: 'BOSS',    color: '#ff1744' }
        };

        const info = typeLabels[this.type] || typeLabels['base'];
        const x = this.x;
        const y = (this.y - this.radius - 18) + yOffset;
        const fontSize = 10;
        const padding = 4;

        context.save();
        context.font = `bold ${fontSize}px 'Rajdhani', sans-serif`;
        const textWidth = context.measureText(info.label).width;
        const pillW = textWidth + padding * 2;
        const pillH = fontSize + padding;
        const pillX = x - pillW / 2;
        const pillY = y - pillH / 2;

        // Background pill
        context.fillStyle = 'rgba(0, 0, 0, 0.55)';
        context.beginPath();
        const r = pillH / 2;
        context.moveTo(pillX + r, pillY);
        context.lineTo(pillX + pillW - r, pillY);
        context.arc(pillX + pillW - r, pillY + r, r, -Math.PI / 2, Math.PI / 2);
        context.lineTo(pillX + r, pillY + pillH);
        context.arc(pillX + r, pillY + r, r, Math.PI / 2, -Math.PI / 2);
        context.closePath();
        context.fill();

        // Text
        context.fillStyle = info.color;
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(info.label, x, y);

        context.restore();
    }

    takeDamage(bulletDamage) {
        this.health -= bulletDamage;
        this.lastDamageTime = Date.now();
        this.hitReactUntil = Date.now() + 180;
        return this.health <= 0;
    }
}

// Normal zombie visual variant definitions
const NORMAL_ZOMBIE_VARIANTS = [
    {
        id: 'classic',
        name: 'Classic',
        // Standard green zombie
        skinColors: { primary: '#9acd32', secondary: '#7cb342', tertiary: '#558b2f', outline: '#33691e' },
        eyeColor: '#ff0000',
        hasClothing: false,
        hasScar: false,
        hasAccessory: false
    },
    {
        id: 'decayed',
        name: 'Decayed',
        // Darker, more rotted appearance with exposed bone
        skinColors: { primary: '#6b8e23', secondary: '#556b2f', tertiary: '#3d4f21', outline: '#2d3a18' },
        eyeColor: '#ffff00',
        hasClothing: false,
        hasScar: true,
        scarColor: '#3d2817',
        hasAccessory: false,
        hasBoneExposure: true
    },
    {
        id: 'fresh',
        name: 'Freshly Turned',
        // More human-like coloring, recently infected
        skinColors: { primary: '#c9b896', secondary: '#a89f7c', tertiary: '#7a8a5e', outline: '#5a6a3e' },
        eyeColor: '#ff4444',
        hasClothing: true,
        clothingType: 'tshirt',
        clothingColor: '#8b0000',
        hasScar: false,
        hasAccessory: false,
        hasBloodStains: true
    },
    {
        id: 'office',
        name: 'Office Worker',
        // Corporate zombie with torn suit
        skinColors: { primary: '#8fbc8f', secondary: '#6b9b6b', tertiary: '#4a7a4a', outline: '#2f5a2f' },
        eyeColor: '#ff6666',
        hasClothing: true,
        clothingType: 'suit',
        clothingColor: '#2f2f4f',
        tieColor: '#8b0000',
        hasScar: false,
        hasAccessory: true,
        accessoryType: 'glasses'
    },
    {
        id: 'punk',
        name: 'Punk',
        // Edgy zombie with mohawk
        skinColors: { primary: '#98fb98', secondary: '#66cd66', tertiary: '#44aa44', outline: '#228b22' },
        eyeColor: '#ff00ff',
        hasClothing: true,
        clothingType: 'vest',
        clothingColor: '#1a1a1a',
        hasScar: true,
        scarColor: '#2d1818',
        hasAccessory: true,
        accessoryType: 'mohawk',
        mohawkColor: '#ff1493'
    },
    {
        id: 'nurse',
        name: 'Nurse',
        // Hospital nurse with bloody scrubs
        skinColors: { primary: '#a8d5a2', secondary: '#88b582', tertiary: '#689562', outline: '#487542' },
        eyeColor: '#ff3333',
        hasClothing: true,
        clothingType: 'scrubs',
        clothingColor: '#4a90a4',
        hasScar: false,
        hasAccessory: true,
        accessoryType: 'cap',
        capColor: '#4a90a4',
        hasBloodStains: true
    },
    {
        id: 'construction',
        name: 'Construction Worker',
        // Construction worker with hardhat and safety vest
        skinColors: { primary: '#b5c99a', secondary: '#95a97a', tertiary: '#75895a', outline: '#556940' },
        eyeColor: '#ffaa00',
        hasClothing: true,
        clothingType: 'safetyVest',
        clothingColor: '#ff6600',
        hasScar: true,
        scarColor: '#4a3020',
        hasAccessory: true,
        accessoryType: 'hardhat',
        hardhatColor: '#ffcc00'
    },
    {
        id: 'soldier',
        name: 'Soldier',
        // Military zombie with camo and helmet
        skinColors: { primary: '#7d8c6e', secondary: '#5d6c4e', tertiary: '#4d5c3e', outline: '#3d4c2e' },
        eyeColor: '#ff0000',
        hasClothing: true,
        clothingType: 'military',
        clothingColor: '#4b5320',
        hasScar: true,
        scarColor: '#2a1a0a',
        hasAccessory: true,
        accessoryType: 'helmet',
        helmetColor: '#4b5320',
        hasBoneExposure: false
    }
];

// Normal zombie - current default enemy type with visual variants
export class NormalZombie extends Zombie {
    constructor(canvasWidth, canvasHeight) {
        super(canvasWidth, canvasHeight);
        this.type = 'normal';

        // Randomly select a visual variant
        this.visualVariant = NORMAL_ZOMBIE_VARIANTS[Math.floor(Math.random() * NORMAL_ZOMBIE_VARIANTS.length)];
    }

    getEyeDrawOptions() {
        const hex = this.visualVariant?.eyeColor || '#ff0000';
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return {
            leftX: -5,
            rightX: 5,
            y: -3,
            size: 3,
            shadowColor: hex,
            glowRgb: `${r}, ${g}, ${b}`
        };
    }

    drawStaticBody(ctx, x, y, radius, pose = null) {
        const p = pose || this.getPoseOffsets();
        const variant = this.visualVariant;
        const colors = variant.skinColors;

        // Body gradient using variant colors
        const bodyGradient = ctx.createRadialGradient(x - 4, y - 4, 0, x, y, radius);
        bodyGradient.addColorStop(0, colors.primary);
        bodyGradient.addColorStop(0.4, colors.secondary);
        bodyGradient.addColorStop(0.7, colors.tertiary);
        bodyGradient.addColorStop(1, colors.outline);

        // Draw clothing if variant has it (behind body)
        if (variant.hasClothing) {
            this.drawClothing(ctx, x, y, radius, variant);
        }

        // Zombie torso
        ctx.fillStyle = bodyGradient;
        ctx.beginPath();
        ctx.ellipse(x, y + 15, radius * 1.2, radius * 1.5, 0, 0, Math.PI * 2);
        ctx.fill();

        this.drawTorsoOverlayLayer(ctx, x, y, radius);

        // Animated feet — per-zombie walk phase (desynced shuffle)
        const walkCycle = Math.sin(this.walkPhase);
        const footOffset = 4;

        ctx.fillStyle = '#1a1a1a';

        ctx.beginPath();
        ctx.ellipse(x - 6, y + 38 + (walkCycle * footOffset), 4, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.ellipse(x + 6, y + 38 - (walkCycle * footOffset), 4, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Animated arms — velocity sway + micro-behavior reach
        const armSway = Math.sin(this.walkPhase * 0.5 + this.armSwayOffset) * 2 + (p.armSway || 0);
        const armReach = p.armReach || 0;

        // Determine arm color (Sleeves vs Bare)
        // Punk vest is sleeveless. Others get cohesive colored sleeves as requested.
        let armColor = colors.outline;
        if (variant.hasClothing && variant.clothingType !== 'vest') {
            armColor = variant.clothingColor;
        }

        ctx.lineWidth = 3.5;
        ctx.lineCap = 'round';

        // Helper function to draw an arm with a hand
        const drawArm = (startX, startY, controlX, controlY, endX, endY) => {
            // Draw Arm/Sleeve
            ctx.strokeStyle = armColor;
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.quadraticCurveTo(controlX, controlY, endX, endY);
            ctx.stroke();

            // Draw Hand (Skin colored tip)
            ctx.fillStyle = colors.primary; // Skin color
            ctx.beginPath();
            ctx.arc(endX, endY, 2.5, 0, Math.PI * 2);
            ctx.fill();
        };

        // Left Arm (Reaching forward/down)
        drawArm(x - 14, y + 8, x - 22 - armSway, y + 18, x - 12 - armSway, y + 32 + armReach);

        // Right Arm (Reaching forward/down)
        drawArm(x + 14, y + 8, x + 22 - armSway, y + 18, x + 12 - armSway, y + 32 + armReach);

        // Head
        ctx.fillStyle = bodyGradient;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();

        // Zombie skin texture (darker patches)
        ctx.fillStyle = 'rgba(30, 60, 10, 0.3)';
        ctx.beginPath();
        ctx.arc(x + 4, y - 2, 3, 0, Math.PI * 2);
        ctx.arc(x - 3, y + 5, 2, 0, Math.PI * 2);
        ctx.fill();

        // Bone exposure for decayed variant
        if (variant.hasBoneExposure) {
            ctx.fillStyle = '#e8e0d0';
            ctx.beginPath();
            ctx.ellipse(x + 6, y + 2, 3, 2, 0.3, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#8b7355';
            ctx.lineWidth = 0.5;
            ctx.stroke();
        }

        // Scar for variants that have it
        if (variant.hasScar) {
            ctx.strokeStyle = variant.scarColor || '#3d2817';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(x - 2, y - 5);
            ctx.lineTo(x + 4, y + 3);
            ctx.stroke();
        }

        // Blood stains for fresh variant
        if (variant.hasBloodStains) {
            ctx.fillStyle = 'rgba(139, 0, 0, 0.5)';
            ctx.beginPath();
            ctx.arc(x + 8, y + 12, 4, 0, Math.PI * 2);
            ctx.arc(x - 5, y + 18, 3, 0, Math.PI * 2);
            ctx.fill();
        }

        // Body outline (rough edges)
        ctx.strokeStyle = colors.outline;
        ctx.lineWidth = 2.5;
        ctx.setLineDash([2, 1]);
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        // Eye sockets
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.beginPath();
        ctx.ellipse(x - 5, y - 3, 4, 5, 0, 0, Math.PI * 2);
        ctx.ellipse(x + 5, y - 3, 4, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Jagged mouth
        ctx.strokeStyle = '#1a1a1a';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x - 6, y + 5);
        ctx.quadraticCurveTo(x - 3, y + 8, x, y + 7);
        ctx.quadraticCurveTo(x + 3, y + 8, x + 6, y + 5);
        ctx.stroke();

        // Teeth
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x - 4, y + 5);
        ctx.lineTo(x - 4, y + 7);
        ctx.moveTo(x - 1, y + 6);
        ctx.lineTo(x - 1, y + 8);
        ctx.moveTo(x + 2, y + 6);
        ctx.lineTo(x + 2, y + 8);
        ctx.moveTo(x + 4, y + 5);
        ctx.lineTo(x + 4, y + 7);
        ctx.stroke();

        // Draw accessories (on top of head)
        if (variant.hasAccessory) {
            this.drawAccessory(ctx, x, y, radius, variant);
        }
    }

    drawClothing(ctx, x, y, radius, variant) {
        ctx.save();

        switch (variant.clothingType) {
            case 'tshirt':
                // Torn t-shirt
                ctx.fillStyle = variant.clothingColor;
                ctx.beginPath();
                ctx.moveTo(x - radius * 1.3, y + 8);
                ctx.lineTo(x - radius * 0.8, y + 22);
                ctx.lineTo(x + radius * 0.8, y + 22);
                ctx.lineTo(x + radius * 1.3, y + 8);
                ctx.closePath();
                ctx.fill();
                // Tear marks
                ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(x + 5, y + 12);
                ctx.lineTo(x + 8, y + 18);
                ctx.stroke();
                break;

            case 'suit':
                // Torn suit jacket
                ctx.fillStyle = variant.clothingColor;
                ctx.beginPath();
                ctx.moveTo(x - radius * 1.4, y + 6);
                ctx.lineTo(x - radius * 1.0, y + 24);
                ctx.lineTo(x + radius * 1.0, y + 24);
                ctx.lineTo(x + radius * 1.4, y + 6);
                ctx.closePath();
                ctx.fill();
                // Tie
                if (variant.tieColor) {
                    ctx.fillStyle = variant.tieColor;
                    ctx.beginPath();
                    ctx.moveTo(x - 2, y + 8);
                    ctx.lineTo(x + 2, y + 8);
                    ctx.lineTo(x + 3, y + 22);
                    ctx.lineTo(x, y + 24);
                    ctx.lineTo(x - 3, y + 22);
                    ctx.closePath();
                    ctx.fill();
                }
                break;

            case 'vest':
                // Punk vest
                ctx.fillStyle = variant.clothingColor;
                ctx.beginPath();
                ctx.moveTo(x - radius * 1.2, y + 8);
                ctx.lineTo(x - radius * 0.9, y + 20);
                ctx.lineTo(x + radius * 0.9, y + 20);
                ctx.lineTo(x + radius * 1.2, y + 8);
                ctx.closePath();
                ctx.fill();
                // Metal studs
                ctx.fillStyle = '#c0c0c0';
                for (let i = 0; i < 3; i++) {
                    ctx.beginPath();
                    ctx.arc(x - radius * 0.9 + i * 4, y + 12, 1.5, 0, Math.PI * 2);
                    ctx.fill();
                }
                break;

            case 'scrubs':
                // Hospital scrubs (v-neck top)
                ctx.fillStyle = variant.clothingColor;
                ctx.beginPath();
                ctx.moveTo(x - radius * 1.3, y + 6);
                ctx.lineTo(x - radius * 1.0, y + 24);
                ctx.lineTo(x + radius * 1.0, y + 24);
                ctx.lineTo(x + radius * 1.3, y + 6);
                ctx.closePath();
                ctx.fill();
                // V-neck detail
                ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(x - 4, y + 6);
                ctx.lineTo(x, y + 12);
                ctx.lineTo(x + 4, y + 6);
                ctx.stroke();
                // Blood splatter on scrubs
                ctx.fillStyle = 'rgba(139, 0, 0, 0.6)';
                ctx.beginPath();
                ctx.arc(x - 6, y + 14, 3, 0, Math.PI * 2);
                ctx.arc(x + 8, y + 10, 2, 0, Math.PI * 2);
                ctx.fill();
                break;

            case 'safetyVest':
                // High-vis safety vest
                ctx.fillStyle = variant.clothingColor;
                ctx.beginPath();
                ctx.moveTo(x - radius * 1.3, y + 6);
                ctx.lineTo(x - radius * 1.0, y + 22);
                ctx.lineTo(x + radius * 1.0, y + 22);
                ctx.lineTo(x + radius * 1.3, y + 6);
                ctx.closePath();
                ctx.fill();
                // Reflective stripes
                ctx.fillStyle = '#e0e0e0';
                ctx.fillRect(x - radius * 1.1, y + 10, radius * 2.2, 2);
                ctx.fillRect(x - radius * 1.1, y + 16, radius * 2.2, 2);
                // Dirt/damage
                ctx.fillStyle = 'rgba(50, 40, 30, 0.4)';
                ctx.beginPath();
                ctx.arc(x + 5, y + 13, 3, 0, Math.PI * 2);
                ctx.fill();
                break;

            case 'military':
                // Military fatigues/jacket
                ctx.fillStyle = variant.clothingColor;
                ctx.beginPath();
                ctx.moveTo(x - radius * 1.4, y + 5);
                ctx.lineTo(x - radius * 1.1, y + 25);
                ctx.lineTo(x + radius * 1.1, y + 25);
                ctx.lineTo(x + radius * 1.4, y + 5);
                ctx.closePath();
                ctx.fill();
                // Camo pattern (dark patches)
                ctx.fillStyle = 'rgba(30, 40, 20, 0.5)';
                ctx.beginPath();
                ctx.arc(x - 5, y + 12, 3, 0, Math.PI * 2);
                ctx.arc(x + 7, y + 16, 4, 0, Math.PI * 2);
                ctx.arc(x - 2, y + 20, 3, 0, Math.PI * 2);
                ctx.fill();
                // Pocket
                ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
                ctx.lineWidth = 1;
                ctx.strokeRect(x - 8, y + 14, 6, 5);
                break;
        }

        ctx.restore();
    }

    drawAccessory(ctx, x, y, radius, variant) {
        ctx.save();

        switch (variant.accessoryType) {
            case 'glasses':
                // Broken glasses
                ctx.strokeStyle = '#333333';
                ctx.lineWidth = 1.5;
                // Left lens (broken)
                ctx.beginPath();
                ctx.arc(x - 5, y - 3, 4, 0, Math.PI * 1.5);
                ctx.stroke();
                // Right lens
                ctx.beginPath();
                ctx.arc(x + 5, y - 3, 4, 0, Math.PI * 2);
                ctx.stroke();
                // Bridge
                ctx.beginPath();
                ctx.moveTo(x - 1, y - 3);
                ctx.lineTo(x + 1, y - 3);
                ctx.stroke();
                break;

            case 'mohawk':
                // Punk mohawk
                ctx.fillStyle = variant.mohawkColor || '#ff1493';
                const spikes = 5;
                for (let i = 0; i < spikes; i++) {
                    const spikeX = x - 6 + i * 3;
                    const spikeHeight = 8 + Math.sin(i) * 3;
                    ctx.beginPath();
                    ctx.moveTo(spikeX - 2, y - radius + 2);
                    ctx.lineTo(spikeX, y - radius - spikeHeight);
                    ctx.lineTo(spikeX + 2, y - radius + 2);
                    ctx.closePath();
                    ctx.fill();
                }
                break;

            case 'cap':
                // Nurse cap
                ctx.fillStyle = variant.capColor || '#ffffff';
                ctx.beginPath();
                ctx.moveTo(x - 8, y - radius + 4);
                ctx.lineTo(x - 6, y - radius - 4);
                ctx.lineTo(x + 6, y - radius - 4);
                ctx.lineTo(x + 8, y - radius + 4);
                ctx.closePath();
                ctx.fill();
                // Red cross on cap
                ctx.fillStyle = '#cc0000';
                ctx.fillRect(x - 1, y - radius - 2, 2, 5);
                ctx.fillRect(x - 2, y - radius, 4, 2);
                break;

            case 'hardhat':
                // Construction hardhat
                ctx.fillStyle = variant.hardhatColor || '#ffcc00';
                // Helmet dome
                ctx.beginPath();
                ctx.arc(x, y - radius + 2, radius * 1.1, Math.PI, 0, false);
                ctx.closePath();
                ctx.fill();
                // Brim
                ctx.fillRect(x - radius * 1.3, y - radius + 2, radius * 2.6, 3);
                // Highlight
                ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                ctx.beginPath();
                ctx.arc(x - 3, y - radius - 2, 4, 0, Math.PI * 2);
                ctx.fill();
                break;

            case 'helmet':
                // Military helmet
                ctx.fillStyle = variant.helmetColor || '#4b5320';
                // Helmet dome
                ctx.beginPath();
                ctx.arc(x, y - radius + 3, radius * 1.15, Math.PI, 0, false);
                ctx.closePath();
                ctx.fill();
                // Brim shadow
                ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
                ctx.beginPath();
                ctx.ellipse(x, y - radius + 5, radius * 1.2, 3, 0, 0, Math.PI);
                ctx.fill();
                // Camo detail on helmet
                ctx.fillStyle = 'rgba(30, 40, 20, 0.4)';
                ctx.beginPath();
                ctx.arc(x - 5, y - radius - 3, 3, 0, Math.PI * 2);
                ctx.arc(x + 4, y - radius - 1, 2, 0, Math.PI * 2);
                ctx.fill();
                break;
        }

        ctx.restore();
    }

    draw(context = ctx) {
        // Use variant-specific eye color for the glow
        const originalShadowColor = context.shadowColor;

        // Call parent draw which handles shadow, aura, body, eyes, health bar
        super.draw(context);

        // The parent uses red eyes by default, but we can override the eye rendering
        // by setting variant-specific eye glow (handled in parent via quality system)
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

    getMotionProfile() {
        return {
            leanScale: 0.55,
            bobScale: 0.45,
            swayScale: 0.6,
            gazeScale: 0.9,
            walkPeriod: 220,
            armPeriod: 320,
            tremorScale: 0
        };
    }

    drawStaticBody(ctx, x, y, radius, pose = null) {
        // Draw base zombie body first
        super.drawStaticBody(ctx, x, y, radius, pose);

        // Overlay metal armor plates
        ctx.save();
        ctx.translate(x, y);

        // Chest plate
        ctx.fillStyle = 'rgba(140, 140, 155, 0.96)';
        ctx.strokeStyle = '#303030';
        ctx.lineWidth = 2;
        const chestWidth = radius * 1.8;
        const chestHeight = radius * 1.1;
        ctx.beginPath();
        ctx.rect(-chestWidth / 2, radius * 0.2, chestWidth, chestHeight);
        ctx.fill();
        ctx.stroke();

        // Shoulder pads
        ctx.beginPath();
        ctx.arc(-radius * 0.9, radius * 0.3, radius * 0.5, 0, Math.PI * 2);
        ctx.arc(radius * 0.9, radius * 0.3, radius * 0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Helmet band
        ctx.beginPath();
        ctx.rect(-radius * 0.9, -radius * 1.2, radius * 1.8, radius * 0.4);
        ctx.fill();
        ctx.stroke();

        ctx.restore();
    }

    // Use default Zombie.draw() which calls drawStaticBody()
    // Armor will be cached as part of the body sprite

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
            this.hitReactUntil = Date.now() + 220;
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
        this.torsoShape = { offsetY: 12, rxMult: 1.0, ryMult: 1.2 };
    }

    getMotionProfile() {
        return {
            leanScale: 1.45,
            bobScale: 0.75,
            swayScale: 1.35,
            gazeScale: 1.25,
            walkPeriod: 95,
            armPeriod: 140,
            tremorScale: 0
        };
    }

    getEyeDrawOptions() {
        return {
            leftX: -4,
            rightX: 4,
            y: -2,
            size: 2.5,
            shadowColor: '#ff0000',
            glowRgb: '255, 80, 0'
        };
    }

    drawStaticBody(ctx, x, y, radius, pose = null) {
        // Body with reddish tint
        const bodyGradient = ctx.createRadialGradient(x - 3, y - 3, 0, x, y, radius);
        bodyGradient.addColorStop(0, '#ff8c42');
        bodyGradient.addColorStop(0.4, '#d2691e');
        bodyGradient.addColorStop(0.7, '#8b4513');
        bodyGradient.addColorStop(1, '#654321');
        ctx.fillStyle = bodyGradient;
        ctx.beginPath();
        ctx.ellipse(x, y + 12, radius * 1.0, radius * 1.2, 0, 0, Math.PI * 2);
        ctx.fill();

        this.drawTorsoOverlayLayer(ctx, x, y, radius);

        // Head
        ctx.fillStyle = bodyGradient;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();

        // Body outline
        ctx.strokeStyle = '#4a2c1a';
        ctx.lineWidth = 2;
        ctx.setLineDash([1, 1]);
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
    }

    draw(context = ctx) {
        // Shadow (smaller)
        context.fillStyle = 'rgba(0, 0, 0, 0.4)';
        context.beginPath();
        context.ellipse(this.x + 2, this.y + this.radius + 2, this.radius * 1.0, this.radius * 0.3, 0, 0, Math.PI * 2);
        context.fill();

        // Reddish/orange aura (faster pulse) - quality scaled
        const auraQuality = graphicsSettings.getQualityValues('aura');
        if (auraQuality.opacity > 0) {
            const pulse = Math.sin(Date.now() / 150) * 0.4 + 0.6;
            const pulseMultiplier = auraQuality.pulseComplexity;
            const baseOpacity = 0.5 * auraQuality.opacity;

            if (auraQuality.hasMultiLayer) {
                const outerAura = context.createRadialGradient(this.x, this.y, this.radius * 0.4, this.x, this.y, this.radius * 2.2);
                outerAura.addColorStop(0, `rgba(255, 100, 0, ${baseOpacity * pulse * pulseMultiplier})`);
                outerAura.addColorStop(0.4, `rgba(255, 150, 50, ${baseOpacity * 0.7 * pulse * pulseMultiplier})`);
                outerAura.addColorStop(0.7, `rgba(255, 200, 100, ${baseOpacity * 0.4 * pulse * pulseMultiplier})`);
                outerAura.addColorStop(1, 'rgba(255, 100, 0, 0)');
                context.fillStyle = outerAura;
                context.beginPath();
                context.arc(this.x, this.y, this.radius * 2.2, 0, Math.PI * 2);
                context.fill();
            }

            const auraGradient = context.createRadialGradient(this.x, this.y, this.radius * 0.4, this.x, this.y, this.radius * 1.8);
            auraGradient.addColorStop(0, `rgba(255, 100, 0, ${baseOpacity * pulse})`);
            auraGradient.addColorStop(0.5, `rgba(255, 150, 50, ${baseOpacity * 0.6 * pulse})`);
            auraGradient.addColorStop(1, 'rgba(255, 100, 0, 0)');
            context.fillStyle = auraGradient;
            context.beginPath();
            context.arc(this.x, this.y, this.radius * 1.8, 0, Math.PI * 2);
            context.fill();
        }

        // Static Body with organic pose
        const { x: drawX, y: drawY, pose } = this.getDrawPosition();
        this.drawStaticBody(context, drawX, drawY, this.radius, pose);

        this.drawHitReactFlash(context, drawX, drawY, this.radius);
        this.drawEyes(context, drawX, drawY, this.radius);

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

    getMotionProfile() {
        const base = super.getMotionProfile();
        const healthRatio = this.maxHealth ? Math.max(0, this.health / this.maxHealth) : 1;
        const tremor = healthRatio < 0.5 ? (1 - healthRatio) * 2.8 : 0;
        return {
            ...base,
            leanScale: 0.9,
            bobScale: 0.85,
            tremorScale: tremor,
            gazeScale: 1.15
        };
    }

    getEyeDrawOptions() {
        return {
            leftX: -5,
            rightX: 5,
            y: -3,
            size: 3,
            shadowColor: '#ff6600',
            glowRgb: '255, 120, 0'
        };
    }

    drawStaticBody(ctx, x, y, radius, pose = null) {
        // Body with orange/yellow tint
        const bodyGradient = ctx.createRadialGradient(x - 4, y - 4, 0, x, y, radius);
        bodyGradient.addColorStop(0, '#ffa500');
        bodyGradient.addColorStop(0.4, '#ff8c00');
        bodyGradient.addColorStop(0.7, '#cc6600');
        bodyGradient.addColorStop(1, '#8b4500');
        ctx.fillStyle = bodyGradient;
        ctx.beginPath();
        ctx.ellipse(x, y + 15, radius * 1.2, radius * 1.5, 0, 0, Math.PI * 2);
        ctx.fill();

        this.drawTorsoOverlayLayer(ctx, x, y, radius);

        // Head
        ctx.fillStyle = bodyGradient;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();

        // Body outline
        ctx.strokeStyle = '#8b4500';
        ctx.lineWidth = 2.5;
        ctx.setLineDash([2, 1]);
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        // Jagged mouth
        ctx.strokeStyle = '#8b4500';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x - 6, y + 5);
        ctx.quadraticCurveTo(x - 3, y + 8, x, y + 7);
        ctx.quadraticCurveTo(x + 3, y + 8, x + 6, y + 5);
        ctx.stroke();
    }

    draw(context = ctx) {
        // Shadow
        context.fillStyle = 'rgba(0, 0, 0, 0.4)';
        context.beginPath();
        context.ellipse(this.x + 3, this.y + this.radius + 3, this.radius * 1.2, this.radius * 0.4, 0, 0, Math.PI * 2);
        context.fill();

        // Pulsing orange/yellow glow (faster when low health or close to player) - quality scaled
        const auraQuality = graphicsSettings.getQualityValues('aura');
        if (auraQuality.opacity > 0) {
            const distToPlayerSq = (gameState.player.x - this.x) ** 2 + (gameState.player.y - this.y) ** 2;
            const healthRatio = this.health / Math.floor((2 + Math.floor(gameState.wave / 3)) * 2.5);
            const pulseSpeed = healthRatio < 0.5 || distToPlayerSq < 10000 ? 100 : 200;
            const pulse = Math.sin(Date.now() / pulseSpeed) * 0.5 + 0.5;
            const pulseMultiplier = auraQuality.pulseComplexity;
            const baseOpacity = 0.6 * auraQuality.opacity;

            if (auraQuality.hasMultiLayer) {
                const outerAura = context.createRadialGradient(this.x, this.y, this.radius * 0.5, this.x, this.y, this.radius * 3);
                outerAura.addColorStop(0, `rgba(255, 150, 0, ${baseOpacity * pulse * pulseMultiplier})`);
                outerAura.addColorStop(0.3, `rgba(255, 200, 50, ${baseOpacity * 0.7 * pulse * pulseMultiplier})`);
                outerAura.addColorStop(0.6, `rgba(255, 220, 100, ${baseOpacity * 0.4 * pulse * pulseMultiplier})`);
                outerAura.addColorStop(1, 'rgba(255, 150, 0, 0)');
                context.fillStyle = outerAura;
                context.beginPath();
                context.arc(this.x, this.y, this.radius * 3, 0, Math.PI * 2);
                context.fill();
            }

            const auraGradient = context.createRadialGradient(this.x, this.y, this.radius * 0.5, this.x, this.y, this.radius * 2.5);
            auraGradient.addColorStop(0, `rgba(255, 150, 0, ${baseOpacity * pulse})`);
            auraGradient.addColorStop(0.5, `rgba(255, 200, 50, ${baseOpacity * 0.7 * pulse})`);
            auraGradient.addColorStop(1, 'rgba(255, 150, 0, 0)');
            context.fillStyle = auraGradient;
            context.beginPath();
            context.arc(this.x, this.y, this.radius * 2.5, 0, Math.PI * 2);
            context.fill();
        }

        // Static Body with organic pose + danger tremor
        const { x: drawX, y: drawY, pose } = this.getDrawPosition();
        this.drawStaticBody(context, drawX, drawY, this.radius, pose);

        this.drawHitReactFlash(context, drawX, drawY, this.radius);
        this.drawEyes(context, drawX, drawY, this.radius);
    }

    takeDamage(bulletDamage) {
        this.health -= bulletDamage;
        this.lastDamageTime = Date.now();
        this.hitReactUntil = Date.now() + 200;
        return this.health <= 0;
    }
}

// Ghost zombie - Semi-transparent, fast, slightly ethereal
export class GhostZombie extends Zombie {
    constructor(canvasWidth, canvasHeight) {
        super(canvasWidth, canvasHeight);
        this.type = 'ghost';
        this.torsoOverlay = null;
        this.speed *= 1.3;
        this.health = Math.floor(this.health * 0.8);
        this.radius *= 0.9;
        this.wobbleOffset = Math.random() * 1000;
    }

    drawStaticBody(ctx, x, y, radius) {
        // Body (Pale blue/white)
        const bodyGradient = ctx.createRadialGradient(x - 2, y - 2, 0, x, y, radius);
        bodyGradient.addColorStop(0, '#e0f7fa');
        bodyGradient.addColorStop(0.6, '#80deea');
        bodyGradient.addColorStop(1, '#0097a7');
        ctx.fillStyle = bodyGradient;

        ctx.beginPath();
        ctx.ellipse(x, y + 10, radius * 0.8, radius * 1.2, 0, 0, Math.PI * 2);
        ctx.fill(); // Body

        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill(); // Head

        // Eyes (White glowing holes)
        ctx.fillStyle = '#ffffff';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#ffffff';
        ctx.beginPath();
        ctx.arc(x - 4, y - 2, 2, 0, Math.PI * 2);
        ctx.arc(x + 4, y - 2, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    }

    draw(context = ctx) {
        context.save();
        context.globalAlpha = 0.5;

        // Wobble effect
        const wobbleX = Math.sin((Date.now() + this.wobbleOffset) / 200) * 2;
        const drawX = this.x + wobbleX;

        // Pale blue aura - quality scaled
        const auraQuality = graphicsSettings.getQualityValues('aura');
        if (auraQuality.opacity > 0) {
            const pulse = Math.sin(Date.now() / 300) * 0.4 + 0.6;
            const pulseMultiplier = auraQuality.pulseComplexity;
            const baseOpacity = 0.6 * auraQuality.opacity;

            if (auraQuality.hasMultiLayer) {
                const outerAura = context.createRadialGradient(drawX, this.y, this.radius * 0.5, drawX, this.y, this.radius * 2.5);
                outerAura.addColorStop(0, `rgba(150, 200, 255, ${baseOpacity * pulse * pulseMultiplier})`);
                outerAura.addColorStop(0.5, `rgba(180, 220, 255, ${baseOpacity * 0.6 * pulse * pulseMultiplier})`);
                outerAura.addColorStop(1, 'rgba(0, 0, 0, 0)');
                context.fillStyle = outerAura;
                context.beginPath();
                context.arc(drawX, this.y, this.radius * 2.5, 0, Math.PI * 2);
                context.fill();
            }

            const auraGradient = context.createRadialGradient(drawX, this.y, this.radius * 0.5, drawX, this.y, this.radius * 2);
            auraGradient.addColorStop(0, `rgba(150, 200, 255, ${baseOpacity * pulse})`);
            auraGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
            context.fillStyle = auraGradient;
            context.beginPath();
            context.arc(drawX, this.y, this.radius * 2, 0, Math.PI * 2);
            context.fill();
        }

        // Static Body (Direct rendering)
        this.drawStaticBody(context, drawX, this.y, this.radius);

        context.restore();
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

    getMotionProfile() {
        return {
            leanScale: 0.85,
            bobScale: 0.9,
            swayScale: 1.0,
            gazeScale: 1.15,
            walkPeriod: 170,
            armPeriod: 260,
            tremorScale: 0
        };
    }

    getEyeDrawOptions() {
        return {
            leftX: -5,
            rightX: 5,
            y: -3,
            size: 3,
            shadowColor: '#00ff00',
            glowRgb: '0, 255, 80'
        };
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

        this.lastX = this.x;
        this.lastY = this.y;

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

        this.vx = this.x - this.lastX;
        this.vy = this.y - this.lastY;
        this.lowerBodyHitbox.x = this.x;
        this.lowerBodyHitbox.y = this.y + 15;
        this.updateOrganicMotion(player, dx, dy, dist);
    }

    drawStaticBody(ctx, x, y, radius, pose = null) {
        // Body (Toxic green)
        const bodyGradient = ctx.createRadialGradient(x - 4, y - 4, 0, x, y, radius);
        bodyGradient.addColorStop(0, '#66ff66');
        bodyGradient.addColorStop(0.4, '#4caf50');
        bodyGradient.addColorStop(0.7, '#388e3c');
        bodyGradient.addColorStop(1, '#1b5e20');
        ctx.fillStyle = bodyGradient;
        ctx.beginPath();
        ctx.ellipse(x, y + 15, radius * 1.2, radius * 1.5, 0, 0, Math.PI * 2);
        ctx.fill();

        this.drawTorsoOverlayLayer(ctx, x, y, radius);

        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();

        // Swollen/bloated appearance (spitter characteristic)
        ctx.fillStyle = 'rgba(100, 255, 100, 0.3)';
        ctx.beginPath();
        ctx.arc(x, y + 8, radius * 0.8, 0, Math.PI * 2);
        ctx.fill();

        // Throat / torso acid pulse (organic breathing)
        const throatPulse = Math.sin(this.walkPhase * 1.5) * 0.25 + 0.75;
        ctx.fillStyle = `rgba(150, 255, 150, ${0.35 * throatPulse})`;
        ctx.beginPath();
        ctx.ellipse(x, y + 10, radius * 0.5 * throatPulse, radius * 0.35, 0, 0, Math.PI * 2);
        ctx.fill();

        // Body outline
        ctx.strokeStyle = '#1b5e20';
        ctx.lineWidth = 2.5;
        ctx.setLineDash([2, 1]);
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
    }

    draw(context = ctx) {
        // Shadow
        context.fillStyle = 'rgba(0, 0, 0, 0.4)';
        context.beginPath();
        context.ellipse(this.x + 3, this.y + this.radius + 3, this.radius * 1.2, this.radius * 0.4, 0, 0, Math.PI * 2);
        context.fill();

        // Toxic green aura - quality scaled
        const auraQuality = graphicsSettings.getQualityValues('aura');
        if (auraQuality.opacity > 0) {
            const pulse = Math.sin(Date.now() / 250) * 0.4 + 0.6;
            const pulseMultiplier = auraQuality.pulseComplexity;
            const baseOpacity = 0.5 * auraQuality.opacity;

            if (auraQuality.hasMultiLayer) {
                const outerAura = context.createRadialGradient(this.x, this.y, this.radius * 0.5, this.x, this.y, this.radius * 2.5);
                outerAura.addColorStop(0, `rgba(0, 255, 0, ${baseOpacity * pulse * pulseMultiplier})`);
                outerAura.addColorStop(0.4, `rgba(50, 255, 50, ${baseOpacity * 0.7 * pulse * pulseMultiplier})`);
                outerAura.addColorStop(0.7, `rgba(100, 255, 100, ${baseOpacity * 0.4 * pulse * pulseMultiplier})`);
                outerAura.addColorStop(1, 'rgba(0, 255, 0, 0)');
                context.fillStyle = outerAura;
                context.beginPath();
                context.arc(this.x, this.y, this.radius * 2.5, 0, Math.PI * 2);
                context.fill();
            }

            const auraGradient = context.createRadialGradient(this.x, this.y, this.radius * 0.5, this.x, this.y, this.radius * 2);
            auraGradient.addColorStop(0, `rgba(0, 255, 0, ${baseOpacity * pulse})`);
            auraGradient.addColorStop(0.5, `rgba(50, 255, 50, ${baseOpacity * 0.6 * pulse})`);
            auraGradient.addColorStop(1, 'rgba(0, 255, 0, 0)');
            context.fillStyle = auraGradient;
            context.beginPath();
            context.arc(this.x, this.y, this.radius * 2, 0, Math.PI * 2);
            context.fill();
        }

        // Static Body with organic pose
        const { x: drawX, y: drawY, pose } = this.getDrawPosition();
        this.drawStaticBody(context, drawX, drawY, this.radius, pose);

        this.drawHitReactFlash(context, drawX, drawY, this.radius);
        this.drawEyes(context, drawX, drawY, this.radius);

        // Health bar (if recently damaged and setting enabled)
        if (settingsManager.getSetting('video', 'enemyHealthBars') !== false) {
            const timeSinceDamage = Date.now() - this.lastDamageTime;
            if (timeSinceDamage < 2000 && this.maxHealth) {
                const barWidth = this.radius * 2.5;
                const barHeight = 3;
                const barX = this.x - barWidth / 2;
                const barY = this.y - this.radius - 8;

                // Background
                context.fillStyle = 'rgba(0, 0, 0, 0.6)';
                context.fillRect(barX, barY, barWidth, barHeight);

                // Health fill
                const healthPercent = Math.max(0, this.health / this.maxHealth);
                const fillWidth = barWidth * healthPercent;

                // Get health bar style setting
                const healthBarStyle = settingsManager.getSetting('video', 'enemyHealthBarStyle') || 'gradient';

                if (healthBarStyle === 'gradient') {
                    const gradient = context.createLinearGradient(barX, barY, barX + barWidth, barY);
                    if (healthPercent > 0.5) {
                        gradient.addColorStop(0, '#4caf50');
                        gradient.addColorStop(1, '#ffeb3b');
                    } else {
                        gradient.addColorStop(0, '#ffeb3b');
                        gradient.addColorStop(1, '#f44336');
                    }
                    context.fillStyle = gradient;
                } else if (healthBarStyle === 'solid') {
                    let color = '#4caf50';
                    if (healthPercent < 0.5) {
                        color = healthPercent < 0.25 ? '#f44336' : '#ffeb3b';
                    }
                    context.fillStyle = color;
                } else if (healthBarStyle === 'simple') {
                    context.fillStyle = '#ffffff';
                }

                context.fillRect(barX, barY, fillWidth, barHeight);

                // Border (only for gradient and solid styles)
                if (healthBarStyle !== 'simple') {
                    context.strokeStyle = 'rgba(255, 255, 255, 0.5)';
                    context.lineWidth = 1;
                    context.strokeRect(barX, barY, barWidth, barHeight);
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

// Flying Zombie - Flies with wings, faster but weaker
export class FlyingZombie extends Zombie {
    constructor(canvasWidth, canvasHeight) {
        super(canvasWidth, canvasHeight);
        this.type = 'flying';
        this.torsoOverlay = null;
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

// Blight Zombie - Fungal support zombie that leaves toxic slime trails and explodes into spore clouds on death
export class BlightZombie extends Zombie {
    constructor(canvasWidth, canvasHeight) {
        super(canvasWidth, canvasHeight);
        this.type = 'blight';
        this.torsoOverlay = null;
        this.speed *= 0.75; // Slow, lumbering
        this.health = Math.floor(this.health * 1.3); // 30% more health — tanky
        this.radius *= 1.1; // Slightly larger hitbox
        this.lastSlimeTime = 0;
        this.slimeCooldown = 900; // Drops a slime pool every ~900ms while moving
        this.slimePoolRadius = 28; // Smaller than standard acid pools (40px)
        this.sporeCloudRadius = 70; // Death burst radius
        this.sporeCloudDamage = 20; // Damage dealt to players inside the death burst
        this.fungalPulseOffset = Math.random() * 1000; // Unique pulse timing
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

        // Track velocity for interpolation
        this.lastX = this.x;
        this.lastY = this.y;

        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;

        const moveX = (dx / dist) * this.speed;
        const moveY = (dy / dist) * this.speed;

        this.x += moveX;
        this.y += moveY;
        this.vx = moveX;
        this.vy = moveY;

        // Update secondary lower body hitbox position
        this.lowerBodyHitbox.x = this.x;
        this.lowerBodyHitbox.y = this.y + 15;

        // Drop toxic slime pool behind as it moves
        const now = Date.now();
        if (now - this.lastSlimeTime >= this.slimeCooldown) {
            if (typeof window !== 'undefined' && window.AcidPool) {
                gameState.acidPools = gameState.acidPools || [];
                const pool = new window.AcidPool(this.x, this.y);
                pool.radius = this.slimePoolRadius;
                pool.life = 6000; // Slightly longer lasting (6s vs 5s)
                pool.maxLife = 6000;
                pool.isSlimePool = true; // Visual marker for slime color
                pool.damagePerTick = 0.2; // Slightly less damage than regular acid
                gameState.acidPools.push(pool);
            }
            this.lastSlimeTime = now;
        }
    }

    drawStaticBody(ctx, x, y, radius) {
        // Fungal body — deep purple/magenta with bulbous, bloated silhouette
        const bodyGradient = ctx.createRadialGradient(x - 4, y - 4, 0, x, y, radius);
        bodyGradient.addColorStop(0, '#ce93d8');   // Light purple center
        bodyGradient.addColorStop(0.35, '#ab47bc'); // Medium purple
        bodyGradient.addColorStop(0.65, '#7b1fa2'); // Deep purple
        bodyGradient.addColorStop(1, '#4a148c');    // Very dark purple edge
        ctx.fillStyle = bodyGradient;

        // Bloated torso (wider, more swollen than normal)
        ctx.beginPath();
        ctx.ellipse(x, y + 16, radius * 1.35, radius * 1.6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Head (slightly oversized for fungal growths)
        ctx.beginPath();
        ctx.arc(x, y, radius * 1.05, 0, Math.PI * 2);
        ctx.fill();

        // Fungal growths / mushroom caps on shoulders and head
        const fungalTime = (Date.now() + this.fungalPulseOffset) / 500;
        const fungalPulse = Math.sin(fungalTime) * 0.15 + 0.85; // Subtle size pulse

        // Left shoulder mushroom
        ctx.fillStyle = '#e040fb';
        ctx.beginPath();
        ctx.ellipse(x - radius * 0.9, y - radius * 0.5, 5 * fungalPulse, 4 * fungalPulse, -0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#aa00ff';
        ctx.beginPath();
        ctx.ellipse(x - radius * 0.9, y - radius * 0.5 + 2, 3, 2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Right shoulder mushroom
        ctx.fillStyle = '#e040fb';
        ctx.beginPath();
        ctx.ellipse(x + radius * 0.8, y - radius * 0.3, 4 * fungalPulse, 3 * fungalPulse, 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#aa00ff';
        ctx.beginPath();
        ctx.ellipse(x + radius * 0.8, y - radius * 0.3 + 2, 2.5, 1.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Top-of-head mushroom cluster (larger, more prominent)
        ctx.fillStyle = '#f06292';
        ctx.beginPath();
        ctx.ellipse(x + 2, y - radius * 0.95, 6 * fungalPulse, 4 * fungalPulse, 0.15, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#c2185b';
        ctx.beginPath();
        ctx.ellipse(x + 2, y - radius * 0.95 + 2, 4, 2.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Small fungal nodules on body surface
        ctx.fillStyle = 'rgba(224, 64, 251, 0.5)';
        ctx.beginPath();
        ctx.arc(x - 5, y + 12, 2.5, 0, Math.PI * 2);
        ctx.arc(x + 6, y + 10, 2, 0, Math.PI * 2);
        ctx.arc(x - 2, y + 18, 2, 0, Math.PI * 2);
        ctx.fill();

        // Dripping pustules (small bright dots along lower body)
        ctx.fillStyle = '#ea80fc';
        ctx.beginPath();
        ctx.arc(x - 7, y + 20, 1.5, 0, Math.PI * 2);
        ctx.arc(x + 5, y + 22, 1.5, 0, Math.PI * 2);
        ctx.arc(x + 1, y + 24, 1, 0, Math.PI * 2);
        ctx.fill();

        // Body outline (dashed, fungal rough edges)
        ctx.strokeStyle = '#4a148c';
        ctx.lineWidth = 2.5;
        ctx.setLineDash([3, 2]);
        ctx.beginPath();
        ctx.arc(x, y, radius * 1.05, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        // Arms (slightly thicker, fungal-encrusted)
        ctx.strokeStyle = '#4a148c';
        ctx.lineWidth = 3.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x - 9, y + 10);
        ctx.lineTo(x - 17, y + 19);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + 9, y + 10);
        ctx.lineTo(x + 17, y + 19);
        ctx.stroke();
    }

    draw(context = ctx) {
        // Shadow
        if (graphicsSettings.shadows !== false) {
            context.fillStyle = `rgba(0, 0, 0, ${RENDERING.SHADOW_ALPHA})`;
            context.beginPath();
            context.ellipse(this.x + 3, this.y + this.radius + 3, this.radius * 1.3, this.radius * 0.45, 0, 0, Math.PI * 2);
            context.fill();
        }

        // Toxic purple/magenta spore aura — quality scaled
        const auraQuality = graphicsSettings.getQualityValues('aura');
        if (auraQuality.opacity > 0) {
            const pulse = Math.sin((Date.now() + this.fungalPulseOffset) / 350) * 0.35 + 0.65;
            const pulseMultiplier = auraQuality.pulseComplexity;
            const baseOpacity = 0.5 * auraQuality.opacity;

            if (auraQuality.hasMultiLayer) {
                const outerAura = context.createRadialGradient(this.x, this.y, this.radius * 0.5, this.x, this.y, this.radius * 2.8);
                outerAura.addColorStop(0, `rgba(156, 39, 176, ${baseOpacity * pulse * pulseMultiplier})`);
                outerAura.addColorStop(0.3, `rgba(123, 31, 162, ${baseOpacity * 0.7 * pulse * pulseMultiplier})`);
                outerAura.addColorStop(0.6, `rgba(74, 20, 140, ${baseOpacity * 0.4 * pulse * pulseMultiplier})`);
                outerAura.addColorStop(1, 'rgba(74, 20, 140, 0)');
                context.fillStyle = outerAura;
                context.beginPath();
                context.arc(this.x, this.y, this.radius * 2.8, 0, Math.PI * 2);
                context.fill();
            }

            const auraGradient = context.createRadialGradient(this.x, this.y, this.radius * 0.5, this.x, this.y, this.radius * 2.2);
            auraGradient.addColorStop(0, `rgba(224, 64, 251, ${baseOpacity * pulse})`);
            auraGradient.addColorStop(0.5, `rgba(171, 71, 188, ${baseOpacity * 0.6 * pulse})`);
            auraGradient.addColorStop(1, 'rgba(123, 31, 162, 0)');
            context.fillStyle = auraGradient;
            context.beginPath();
            context.arc(this.x, this.y, this.radius * 2.2, 0, Math.PI * 2);
            context.fill();
        }

        // Static Body (Direct rendering)
        this.drawStaticBody(context, this.x, this.y, this.radius);

        // Eye sockets (dark purple pits)
        context.fillStyle = 'rgba(20, 0, 30, 0.85)';
        context.beginPath();
        context.ellipse(this.x - 5, this.y - 3, 4, 5, 0, 0, Math.PI * 2);
        context.ellipse(this.x + 5, this.y - 3, 4, 5, 0, 0, Math.PI * 2);
        context.fill();

        // Glowing magenta eyes — quality scaled
        const eyeQuality = graphicsSettings.getQualityValues('eyeGlow');
        const eyePulse = Math.sin(Date.now() / 180) * 0.3 + 0.7;
        context.shadowBlur = eyeQuality.shadowBlur * eyePulse;
        context.shadowColor = '#e040fb';

        const createBlightEyeGradient = (ex, ey) => {
            const gradient = context.createRadialGradient(ex, ey, 0, ex, ey, 3);
            if (eyeQuality.gradientStops >= 5) {
                gradient.addColorStop(0, `rgba(255, 200, 255, ${eyeQuality.alpha})`);
                gradient.addColorStop(0.25, `rgba(224, 64, 251, ${eyeQuality.alpha * 0.9})`);
                gradient.addColorStop(0.5, `rgba(171, 71, 188, ${eyeQuality.alpha * 0.8})`);
                gradient.addColorStop(0.75, `rgba(123, 31, 162, ${eyeQuality.alpha * 0.6})`);
                gradient.addColorStop(1, `rgba(74, 20, 140, ${eyeQuality.alpha * 0.4})`);
            } else if (eyeQuality.gradientStops >= 4) {
                gradient.addColorStop(0, `rgba(224, 64, 251, ${eyeQuality.alpha})`);
                gradient.addColorStop(0.33, `rgba(171, 71, 188, ${eyeQuality.alpha * 0.8})`);
                gradient.addColorStop(0.66, `rgba(123, 31, 162, ${eyeQuality.alpha * 0.6})`);
                gradient.addColorStop(1, `rgba(74, 20, 140, ${eyeQuality.alpha * 0.4})`);
            } else {
                gradient.addColorStop(0, `rgba(224, 64, 251, ${eyeQuality.alpha})`);
                gradient.addColorStop(0.5, `rgba(171, 71, 188, ${eyeQuality.alpha * 0.8})`);
                gradient.addColorStop(1, `rgba(74, 20, 140, ${eyeQuality.alpha * 0.6})`);
            }
            return gradient;
        };

        context.fillStyle = createBlightEyeGradient(this.x - 5, this.y - 3);
        context.beginPath();
        context.arc(this.x - 5, this.y - 3, 3, 0, Math.PI * 2);
        context.fill();

        context.fillStyle = createBlightEyeGradient(this.x + 5, this.y - 3);
        context.beginPath();
        context.arc(this.x + 5, this.y - 3, 3, 0, Math.PI * 2);
        context.fill();

        context.shadowBlur = 0;

        // Jagged mouth (fungal, dripping)
        context.strokeStyle = '#4a148c';
        context.lineWidth = 2.5;
        context.lineCap = 'round';
        context.beginPath();
        context.moveTo(this.x - 6, this.y + 5);
        context.quadraticCurveTo(this.x - 3, this.y + 8, this.x, this.y + 7);
        context.quadraticCurveTo(this.x + 3, this.y + 8, this.x + 6, this.y + 5);
        context.stroke();

        // Fungal teeth (slightly discolored)
        context.strokeStyle = '#e8d5b7';
        context.lineWidth = 1.5;
        context.beginPath();
        context.moveTo(this.x - 4, this.y + 5);
        context.lineTo(this.x - 4, this.y + 7);
        context.moveTo(this.x - 1, this.y + 6);
        context.lineTo(this.x - 1, this.y + 8);
        context.moveTo(this.x + 2, this.y + 6);
        context.lineTo(this.x + 2, this.y + 8);
        context.moveTo(this.x + 4, this.y + 5);
        context.lineTo(this.x + 4, this.y + 7);
        context.stroke();

        // Health bar (if recently damaged and setting enabled)
        if (settingsManager.getSetting('video', 'enemyHealthBars') !== false) {
            const timeSinceDamage = Date.now() - this.lastDamageTime;
            if (timeSinceDamage < 2000 && this.maxHealth) {
                const barWidth = this.radius * 2.5;
                const barHeight = 3;
                const barX = this.x - barWidth / 2;
                const barY = this.y - this.radius - 8;

                // Background
                context.fillStyle = 'rgba(0, 0, 0, 0.6)';
                context.fillRect(barX, barY, barWidth, barHeight);

                // Health fill
                const healthPercent = Math.max(0, this.health / this.maxHealth);
                const fillWidth = barWidth * healthPercent;

                const healthBarStyle = settingsManager.getSetting('video', 'enemyHealthBarStyle') || 'gradient';

                if (healthBarStyle === 'gradient') {
                    const gradient = context.createLinearGradient(barX, barY, barX + barWidth, barY);
                    if (healthPercent > 0.5) {
                        gradient.addColorStop(0, '#ab47bc');
                        gradient.addColorStop(1, '#ffeb3b');
                    } else {
                        gradient.addColorStop(0, '#ffeb3b');
                        gradient.addColorStop(1, '#f44336');
                    }
                    context.fillStyle = gradient;
                } else if (healthBarStyle === 'solid') {
                    let color = '#ab47bc';
                    if (healthPercent < 0.5) {
                        color = healthPercent < 0.25 ? '#f44336' : '#ffeb3b';
                    }
                    context.fillStyle = color;
                } else if (healthBarStyle === 'simple') {
                    context.fillStyle = '#ffffff';
                }

                context.fillRect(barX, barY, fillWidth, barHeight);

                // Border (only for gradient and solid styles)
                if (healthBarStyle !== 'simple') {
                    context.strokeStyle = 'rgba(255, 255, 255, 0.5)';
                    context.lineWidth = 1;
                    context.strokeRect(barX, barY, barWidth, barHeight);
                }
            }
        }
    }

    /**
     * On death, burst into a toxic spore cloud that damages nearby players.
     */
    takeDamage(bulletDamage) {
        this.health -= bulletDamage;
        this.lastDamageTime = Date.now();

        if (this.health <= 0) {
            // Spore cloud death burst
            this._triggerSporeBurst();
        }

        return this.health <= 0;
    }

    _triggerSporeBurst() {
        // Visual: large purple/pink particle burst
        if (gameState.particles.length < MAX_PARTICLES - 30) {
            for (let i = 0; i < 18; i++) {
                const angle = (i / 18) * Math.PI * 2;
                const dist = Math.random() * this.sporeCloudRadius * 0.6;
                const px = this.x + Math.cos(angle) * dist;
                const py = this.y + Math.sin(angle) * dist;
                const colors = [
                    'rgba(224, 64, 251, 0.8)',
                    'rgba(171, 71, 188, 0.7)',
                    'rgba(123, 31, 162, 0.6)',
                    'rgba(74, 20, 140, 0.5)'
                ];
                createParticles(px, py, colors[i % colors.length], 1);
            }
        }

        // Damage nearby players
        const radiusSq = this.sporeCloudRadius * this.sporeCloudRadius;
        for (let i = 0; i < gameState.players.length; i++) {
            const player = gameState.players[i];
            if (player.health <= 0) continue;

            const dx = player.x - this.x;
            const dy = player.y - this.y;
            const distSq = dx * dx + dy * dy;

            if (distSq < radiusSq) {
                // Apply damage — shield absorbs first, then health
                if (player.shield > 0) {
                    player.shield -= this.sporeCloudDamage;
                    if (player.shield < 0) {
                        player.health += player.shield;
                        player.shield = 0;
                    }
                } else {
                    player.health -= this.sporeCloudDamage;
                }

                // Trigger damage indicator
                triggerDamageIndicator(player.x, player.y);
            }
        }

        // Also drop a final slime pool at death location (larger, longer lasting)
        if (typeof window !== 'undefined' && window.AcidPool) {
            gameState.acidPools = gameState.acidPools || [];
            const deathPool = new window.AcidPool(this.x, this.y);
            deathPool.radius = this.sporeCloudRadius * 0.6;
            deathPool.life = 8000; // 8 seconds
            deathPool.maxLife = 8000;
            deathPool.isSlimePool = true;
            deathPool.damagePerTick = 0.25;
            gameState.acidPools.push(deathPool);
        }

        playKillSound();
    }
}

// Crawler Zombie - Low-profile crawler that's harder to hit
export class CrawlerZombie extends Zombie {
    constructor(canvasWidth, canvasHeight) {
        super(canvasWidth, canvasHeight);
        this.type = 'crawler';
        this.torsoOverlay = null;
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