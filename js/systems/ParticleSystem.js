import { ctx } from '../core/canvas.js';
import { gameState } from '../core/gameState.js';
import { Particle } from '../entities/Particle.js';
import { MAX_PARTICLES } from '../core/constants.js';
import { graphicsSettings } from '../systems/GraphicsSystem.js';
import { ObjectPool } from '../utils/ObjectPool.js';
import { settingsManager } from './SettingsManager.js';
import { compactArrayWithUpdate } from '../utils/arrayUtils.js';

// Reusable batching map to avoid allocation per frame
const particleBatches = new Map();

// Particle Pool
export const particlePool = new ObjectPool(
    () => new Particle(0, 0, '#fff'),
    (p, x, y, color, props) => p.reset(x, y, color, props),
    100 // Initial size
);

/**
 * Get particle limit based on quality preset
 * @returns {number} Maximum number of particles allowed
 */
function getParticleLimit() {
    const particleCount = graphicsSettings ? graphicsSettings.maxParticles : 'high';

    // Convert quality preset to numeric limit
    // Low = CPU particles (50), High = GPU 10k (200 CPU fallback), Ultra = GPU 50k (500 CPU fallback)
    // For CPU particles (non-WebGPU), we use lower limits
    if (particleCount === 'low') {
        return 50;
    } else if (particleCount === 'high') {
        return 200; // Reasonable limit for high quality CPU particles
    } else if (particleCount === 'ultra') {
        return 500; // Higher limit for ultra quality
    }

    // Default fallback
    return MAX_PARTICLES;
}

export function spawnParticle(x, y, color, props = {}) {
    // Early return if already at particle limit (prevents creating particles we'll immediately remove)
    const limit = getParticleLimit();
    if (gameState.particles.length >= limit) {
        // Don't spawn more particles - we're at the limit

        return null;
    }

    const p = particlePool.get(x, y, color, props);
    if (!p) {
        return null;
    }

    gameState.particles.push(p);


    // Double-check limit (in case multiple particles spawned in same frame)
    if (gameState.particles.length > limit) {
        const removed = gameState.particles.shift(); // Remove oldest
        if (removed) {
            particlePool.release(removed);
        }
    }
    return p;
}

// Deprecated legacy support if needed, but we should try to replace usage
export function addParticle(particle) {
    // If it's a pooled particle (checked via instance maybe?), fine.
    // If it's a raw object, we can't pool it easily unless we wrap it.
    // For now, just push it. Mixed usage might be tricky for pooling but safe for logic.
    gameState.particles.push(particle);
}

export function createParticles(x, y, color, count) {
    const limit = getParticleLimit();
    // Limit how many particles we try to spawn based on current count and limit
    const availableSlots = Math.max(0, limit - gameState.particles.length);
    const particlesToSpawn = Math.min(count, availableSlots);

    for (let i = 0; i < particlesToSpawn; i++) {
        const p = spawnParticle(x, y, color);
        if (!p) break; // Stop if we can't spawn more
    }
}

export function createBloodSplatter(x, y, angle, isKill = false) {
    const bloodGoreLevel = settingsManager.getSetting('video', 'bloodGoreLevel') ?? 1.0;
    if (bloodGoreLevel === 0) return;

    const quality = graphicsSettings.quality;
    const limit = getParticleLimit();
    const availableSlots = Math.max(0, limit - gameState.particles.length);

    // Scale particle count based on quality preset
    let baseParticleCount = isKill ? 12 : 5;
    let particleCount = baseParticleCount;
    let hasDetailParticles = false;
    let hasColorVariation = true;

    if (quality === 'low') {
        particleCount = Math.floor(baseParticleCount * 0.6);
        hasDetailParticles = false;
        hasColorVariation = false;
    } else if (quality === 'medium') {
        particleCount = baseParticleCount;
        hasDetailParticles = false;
    } else if (quality === 'high') {
        particleCount = Math.floor(baseParticleCount * 1.2);
        hasDetailParticles = true;
    } else if (quality === 'ultra') {
        particleCount = Math.floor(baseParticleCount * 1.5);
        hasDetailParticles = true;
    }

    // Apply the blood/gore level setting
    particleCount = Math.floor(particleCount * bloodGoreLevel);

    const particlesToSpawn = Math.min(particleCount, availableSlots);

    // Blood colors - more variation at higher quality
    let bloodColors = ['#8b0000', '#a52a2a', '#dc143c', '#b22222'];
    if (hasColorVariation && quality !== 'low') {
        bloodColors = ['#8b0000', '#a52a2a', '#dc143c', '#b22222', '#cc0000', '#990000', '#660000'];
    }

    for (let i = 0; i < particlesToSpawn; i++) {
        const spreadAngle = angle + (Math.random() - 0.5) * Math.PI;
        const speed = isKill ? (Math.random() * 6 + 2) : (Math.random() * 4 + 1);
        const radius = quality === 'ultra' ? (Math.random() * 3 + 1.5) : (Math.random() * 2.5 + 1.5);

        const p = spawnParticle(x, y, bloodColors[Math.floor(Math.random() * bloodColors.length)], {
            radius: radius,
            vx: Math.cos(spreadAngle) * speed,
            vy: Math.sin(spreadAngle) * speed,
            life: isKill ? 40 : 25,
            maxLife: isKill ? 40 : 25
        });
        if (!p) break;
    }

    // Large detail particles for kills (high/ultra quality)
    if (isKill && hasDetailParticles && gameState.particles.length < limit) {
        const remainingSlots = limit - gameState.particles.length;
        let largeParticleCount = quality === 'ultra' ? 5 : 3;
        largeParticleCount = Math.floor(largeParticleCount * bloodGoreLevel);
        const largeParticlesToSpawn = Math.min(largeParticleCount, remainingSlots);

        for (let i = 0; i < largeParticlesToSpawn; i++) {
            const p = spawnParticle(
                x + (Math.random() - 0.5) * 15,
                y + (Math.random() - 0.5) * 15,
                '#5a0000',
                {
                    radius: Math.random() * 4 + 3,
                    vx: (Math.random() - 0.5) * 0.5,
                    vy: (Math.random() - 0.5) * 0.5,
                    life: 60,
                    maxLife: 60
                }
            );
            if (!p) break;
        }
    }

    // Ultra quality: Pooling effect (stationary blood puddles)
    if (isKill && quality === 'ultra' && gameState.particles.length < limit) {
        const remainingSlots = limit - gameState.particles.length;
        let poolParticleCount = 3;
        poolParticleCount = Math.floor(poolParticleCount * bloodGoreLevel);
        const poolParticles = Math.min(poolParticleCount, remainingSlots);
        for (let i = 0; i < poolParticles; i++) {
            const p = spawnParticle(
                x + (Math.random() - 0.5) * 20,
                y + (Math.random() - 0.5) * 20,
                'rgba(139, 0, 0, 0.6)',
                {
                    radius: Math.random() * 5 + 4,
                    vx: (Math.random() - 0.5) * 0.2,
                    vy: (Math.random() - 0.5) * 0.2,
                    life: 80,
                    maxLife: 80
                }
            );
            if (!p) break;
        }
    }
}

export function createExplosion(x, y, size = 1.0) {


    // Safety check - ensure we have valid coordinates
    if (typeof x !== 'number' || typeof y !== 'number' || !isFinite(x) || !isFinite(y)) {
        return;
    }



    // Force create explosion even if at particle limit - explosions are critical
    const originalLength = gameState.particles.length;


    const limit = getParticleLimit();
    const availableSlots = Math.max(0, limit - gameState.particles.length);

    // Safety check for graphicsSettings
    let explosionQuality;
    try {
        explosionQuality = graphicsSettings ? graphicsSettings.getQualityValues('explosion') : {
            fireParticles: 30,
            smokeParticles: 15,
            hasLargeFlash: true,
            hasShockwave: true,
            hasTrails: true
        };
    } catch (e) {
        explosionQuality = {
            fireParticles: 30,
            smokeParticles: 15,
            hasLargeFlash: true,
            hasShockwave: true,
            hasTrails: true
        };
    }

    // Scale explosion based on size parameter (1.0 = normal, 1.5 = rocket, etc.)
    const sizeMultiplier = size;

    // Stage 1: Initial bright flash (white/yellow, MASSIVE radius, longer fade)
    // ALWAYS create flash - even if we have to remove old particles
    // Much larger flash - grenades get 150px, rockets get 225px base
    const baseFlashSize = 150 * sizeMultiplier; // HUGE base size

    // Force create flash particles - remove old particles if needed to make room
    // These are the most critical visual element
    if (gameState.particles.length >= limit && limit > 10) {
        // Remove oldest particles to make room for explosion (keep at least 10)
        const particlesToRemove = Math.min(20, gameState.particles.length - 10);
        for (let i = 0; i < particlesToRemove; i++) {
            const removed = gameState.particles.shift();
            if (removed) {
                particlePool.release(removed);
            }
        }
    }

    // Force create flash particles - they're critical for visibility
    // Always create these, even if we have to bypass the limit

    let flash1 = spawnParticle(x, y, '#ffffff', {
        radius: baseFlashSize,
        life: 30, // Longer life so it's very visible
        maxLife: 30,
        vx: 0,
        vy: 0
    });


    // If we couldn't create it, force create by directly adding to array
    if (!flash1) {
        const p = particlePool.get(x, y, '#ffffff', {
            radius: baseFlashSize,
            life: 30,
            maxLife: 30,
            vx: 0,
            vy: 0
        });
        if (p) {
            gameState.particles.push(p);

        }
    }



    // Add yellow flash - also massive
    let flash2 = spawnParticle(x, y, '#ffff00', {
        radius: baseFlashSize * 0.95,
        life: 35, // Even longer for yellow
        maxLife: 35,
        vx: 0,
        vy: 0
    });
    if (!flash2) {
        const p = particlePool.get(x, y, '#ffff00', {
            radius: baseFlashSize * 0.95,
            life: 35,
            maxLife: 35,
            vx: 0,
            vy: 0
        });
        if (p) gameState.particles.push(p);
    }

    // Add orange flash for extra visibility
    let flash3 = spawnParticle(x, y, '#ff8800', {
        radius: baseFlashSize * 0.8,
        life: 40,
        maxLife: 40,
        vx: 0,
        vy: 0
    });
    if (!flash3) {
        const p = particlePool.get(x, y, '#ff8800', {
            radius: baseFlashSize * 0.8,
            life: 40,
            maxLife: 40,
            vx: 0,
            vy: 0
        });
        if (p) gameState.particles.push(p);
    }

    // Add red flash for maximum visibility
    let flash4 = spawnParticle(x, y, '#ff4400', {
        radius: baseFlashSize * 0.6,
        life: 45,
        maxLife: 45,
        vx: 0,
        vy: 0
    });
    if (!flash4) {
        const p = particlePool.get(x, y, '#ff4400', {
            radius: baseFlashSize * 0.6,
            life: 45,
            maxLife: 45,
            vx: 0,
            vy: 0
        });
        if (p) gameState.particles.push(p);
    }

    // Stage 2: Expanding fire ring (orange/red gradient) - MORE PARTICLES, BIGGER
    // Always spawn at least 15 fire particles, even on low quality
    const minFireParticles = Math.max(15, Math.floor(explosionQuality.fireParticles * sizeMultiplier * 1.5));
    const fireParticlesToSpawn = Math.min(
        minFireParticles,
        availableSlots - 3 // Reserve 3 slots for flash
    );
    for (let i = 0; i < fireParticlesToSpawn; i++) {
        const angle = (Math.PI * 2 / fireParticlesToSpawn) * i + (Math.random() - 0.5) * 0.3;
        const speed = (Math.random() * 6 + 3) * sizeMultiplier; // Faster spread
        const colors = ['#ff6600', '#ff8800', '#ffaa00', '#ffff00', '#ff4400', '#ff0000'];
        const p = spawnParticle(x, y, colors[Math.floor(Math.random() * colors.length)], {
            radius: (Math.random() * 6 + 4) * sizeMultiplier, // Much larger particles (4-10px base)
            life: Math.random() * 30 + 25, // Longer life
            maxLife: Math.random() * 30 + 25,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed
        });
        if (!p) break;
    }

    // Stage 3: Secondary shockwave ring (lighter color, larger radius) - ALWAYS SHOW
    const remainingSlots = limit - gameState.particles.length;
    // Always show shockwave, not just on high quality
    const shockwaveCount = Math.floor(25 * sizeMultiplier);
    for (let i = 0; i < shockwaveCount && remainingSlots > i; i++) {
        const angle = (Math.PI * 2 / shockwaveCount) * i;
        const p = spawnParticle(x, y, 'rgba(255, 220, 150, 0.95)', {
            radius: 6 * sizeMultiplier, // Larger shockwave particles
            life: 30, // Longer life
            maxLife: 30,
            vx: Math.cos(angle) * 8 * sizeMultiplier, // Faster spread
            vy: Math.sin(angle) * 8 * sizeMultiplier
        });
        if (!p) break;
    }

    // Stage 4: Debris particles (dark particles flying outward) - MORE AND BIGGER
    const debrisSlots = limit - gameState.particles.length;
    const debrisCount = Math.min(Math.floor(12 * sizeMultiplier), debrisSlots);
    for (let i = 0; i < debrisCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = (Math.random() * 5 + 3) * sizeMultiplier; // Faster debris
        const p = spawnParticle(x, y, ['#2a2a2a', '#1a1a1a', '#3a3a3a', '#4a4a4a'][Math.floor(Math.random() * 4)], {
            radius: Math.random() * 3 + 2, // Larger debris (2-5px)
            life: Math.random() * 40 + 30, // Longer life
            maxLife: Math.random() * 40 + 30,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed
        });
        if (!p) break;
    }

    // Stage 5: Lingering smoke cloud (gray particles that fade slowly) - ALWAYS SHOW, BIGGER
    const smokeSlots = limit - gameState.particles.length;
    // Always spawn at least 10 smoke particles
    const minSmokeParticles = Math.max(10, Math.floor(explosionQuality.smokeParticles * sizeMultiplier * 1.2));
    const smokeParticlesToSpawn = Math.min(minSmokeParticles, smokeSlots);
    for (let i = 0; i < smokeParticlesToSpawn; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = (Math.random() * 3 + 1.5) * sizeMultiplier;
        const p = spawnParticle(x, y, `rgba(40, 40, 40, ${Math.random() * 0.6 + 0.5})`, { // Darker, more opaque
            radius: (Math.random() * 8 + 5) * sizeMultiplier, // Much larger smoke (5-13px base)
            life: Math.random() * 50 + 40, // Longer life for lingering effect
            maxLife: Math.random() * 50 + 40,
            vx: Math.cos(angle) * speed * 0.4, // Slower horizontal movement
            vy: Math.sin(angle) * speed * 0.4 - 0.8 // More upward drift
        });
        if (!p) break;
    }

    // High/Ultra quality: Particle trails
    const trailSlots = limit - gameState.particles.length;
    if (explosionQuality.hasTrails && trailSlots > 0) {
        const trailCount = Math.min(Math.floor(10 * sizeMultiplier), trailSlots);
        for (let i = 0; i < trailCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const p = spawnParticle(x, y, '#ffaa00', {
                radius: 2 * sizeMultiplier,
                life: 25,
                maxLife: 25,
                vx: Math.cos(angle) * 3 * sizeMultiplier,
                vy: Math.sin(angle) * 3 * sizeMultiplier
            });
            if (!p) break;
        }
    }
}

export function updateParticles() {
    // In-place compaction with update - no array allocation per frame
    compactArrayWithUpdate(gameState.particles, p => {
        if (!p) return false;

        if (p.update) {
            p.update();
        } else {
            // Fallback for simple objects if any remain
            p.x += p.vx;
            p.y += p.vy;
            p.life--;
        }

        if (p.life > 0) {
            return true; // Keep particle
        } else {
            // Return to pool if it's a Particle instance
            if (p instanceof Particle) {
                particlePool.release(p);
            }
            return false; // Remove particle
        }
    });
}

/**
 * Batch draw particles by color for better performance
 * Groups particles by color and draws them with a single fillStyle change
 */
function drawParticlesBatched() {
    const particles = gameState.particles;
    const len = particles.length;
    
    if (len === 0) return 0;
    
    // Clear and reuse the batch map
    particleBatches.clear();
    
    // Group particles by color (quantized to reduce unique batches)
    for (let i = 0; i < len; i++) {
        const p = particles[i];
        if (!p || p.life <= 0) continue;
        
        // Use color as key (for hex colors, batch exactly; for rgba, approximate)
        const key = p.color;
        if (!particleBatches.has(key)) {
            particleBatches.set(key, []);
        }
        particleBatches.get(key).push(p);
    }
    
    let drawnCount = 0;
    
    // Draw each batch with a single fillStyle
    particleBatches.forEach((batch, color) => {
        if (batch.length === 0) return;
        
        // Calculate alpha from first particle's life (approximate for batch)
        const firstParticle = batch[0];
        const maxLife = firstParticle.maxLife || 30;
        const alpha = Math.max(0, firstParticle.life / maxLife);
        
        // Convert color to rgba if needed
        let fillColor = color;
        if (color.startsWith('#')) {
            const hex = color.replace('#', '');
            const r = parseInt(hex.substr(0, 2), 16);
            const g = parseInt(hex.substr(2, 2), 16);
            const b = parseInt(hex.substr(4, 2), 16);
            fillColor = `rgba(${r}, ${g}, ${b}, ${alpha})`;
        }
        
        ctx.fillStyle = fillColor;
        ctx.beginPath();
        
        // Draw all particles in batch with single path
        for (let i = 0; i < batch.length; i++) {
            const p = batch[i];
            const particleAlpha = Math.max(0, p.life / (p.maxLife || 30));
            
            // Skip nearly invisible particles
            if (particleAlpha <= 0.05 || p.radius <= 0) continue;
            
            ctx.moveTo(p.x + p.radius, p.y);
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            drawnCount++;
        }
        
        ctx.fill();
    });
    
    return drawnCount;
}

export function drawParticles() {
    // Check if WebGPU is active - if so, use WebGPU for enhanced particle rendering
    // WebGPU canvas is now on top (z-index 2) so particles render above gameplay
    const webgpuRenderer = window.webgpuRenderer;
    const webgpuEnabled = settingsManager.getSetting('video', 'webgpuEnabled') ?? true;

    if (webgpuEnabled && webgpuRenderer && webgpuRenderer.isAvailable()) {
        if (webgpuRenderer.syncGameParticles) {
            // Sync particles to WebGPU renderer for enhanced rendering (5x size, soft glow, hardware blending)
            webgpuRenderer.syncGameParticles(gameState.particles);
            return; // Skip Canvas 2D drawing - WebGPU handles it
        }
    }

    // Fallback to Canvas 2D if WebGPU is not available
    if (!ctx) {
        console.error('[ParticleSystem] drawParticles: ctx is not defined!');
        return;
    }

    if (gameState.particles.length === 0) {
        return; // No particles to draw
    }

    const particleDetail = graphicsSettings.particleDetail || 'standard';
    
    // Use batched rendering for minimal/standard detail (major performance win)
    if (particleDetail === 'minimal' || particleDetail === 'standard') {
        drawParticlesBatched();
        ctx.globalAlpha = 1;
        return;
    }

    // Detailed/Ultra rendering - individual particles with gradients
    let drawnCount = 0;
    for (let i = 0; i < gameState.particles.length; i++) {
        const particle = gameState.particles[i];

        if (!particle) {
            continue;
        }

        if (particle.draw) {
            // If it has a custom draw method, use it
            particle.draw();
            drawnCount++;
        } else {
            // Fallback drawing with quality-based enhancements
            const maxLife = particle.maxLife || 30;
            const alpha = Math.max(0, particle.life / maxLife);

            // Validate particle data
            if (isNaN(particle.x) || isNaN(particle.y) || isNaN(particle.radius)) {
                continue;
            }

            if (alpha <= 0 || particle.radius <= 0) {

                continue; // Skip invisible or zero-size particles
            }

            // Convert hex colors to rgba for proper alpha blending
            let fillColor = particle.color;
            if (!particle.color.startsWith('rgba') && particle.color.startsWith('#')) {
                // Convert hex to rgba for proper alpha support
                const hex = particle.color.replace('#', '');
                const r = parseInt(hex.substr(0, 2), 16);
                const g = parseInt(hex.substr(2, 2), 16);
                const b = parseInt(hex.substr(4, 2), 16);
                // Ensure minimum alpha for large explosion particles (radius > 50)
                const finalAlpha = particle.radius > 50 ? Math.max(alpha, 0.3) : alpha;
                fillColor = `rgba(${r}, ${g}, ${b}, ${finalAlpha})`;
            } else if (particle.color.startsWith('rgba')) {
                // Extract existing rgba and apply alpha
                const match = particle.color.match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)/);
                if (match) {
                    const r = match[1];
                    const g = match[2];
                    const b = match[3];
                    // Ensure minimum alpha for large explosion particles (radius > 50)
                    const finalAlpha = particle.radius > 50 ? Math.max(alpha, 0.3) : alpha;
                    fillColor = `rgba(${r}, ${g}, ${b}, ${finalAlpha})`;
                }
            }



            // Only detailed and ultra modes reach here (minimal/standard use batched rendering)
            if (particleDetail === 'detailed') {
                // Detailed: Gradients and light glow
                const gradient = ctx.createRadialGradient(
                    particle.x, particle.y, 0,
                    particle.x, particle.y, particle.radius
                );
                // Parse color and create gradient
                if (particle.color.startsWith('rgba')) {
                    gradient.addColorStop(0, particle.color.replace(/[\d.]+\)$/, `${alpha})`));
                    gradient.addColorStop(1, particle.color.replace(/[\d.]+\)$/, `${alpha * 0.3})`));
                } else {
                    // Hex color - convert to rgba
                    const hex = particle.color.replace('#', '');
                    const r = parseInt(hex.substr(0, 2), 16);
                    const g = parseInt(hex.substr(2, 2), 16);
                    const b = parseInt(hex.substr(4, 2), 16);
                    gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${alpha})`);
                    gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, ${alpha * 0.3})`);
                }
                ctx.fillStyle = gradient;
                ctx.globalAlpha = 1;
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
                ctx.fill();

                // Light glow
                ctx.shadowBlur = particle.radius * 0.5;
                ctx.shadowColor = particle.color;
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.radius * 0.7, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;
            } else if (particleDetail === 'ultra') {
                // Ultra: Multi-layer gradients, glow, and trails
                const gradient = ctx.createRadialGradient(
                    particle.x, particle.y, 0,
                    particle.x, particle.y, particle.radius * 1.5
                );
                // Parse color and create rich gradient
                if (particle.color.startsWith('rgba')) {
                    gradient.addColorStop(0, particle.color.replace(/[\d.]+\)$/, `${alpha})`));
                    gradient.addColorStop(0.3, particle.color.replace(/[\d.]+\)$/, `${alpha * 0.8})`));
                    gradient.addColorStop(0.7, particle.color.replace(/[\d.]+\)$/, `${alpha * 0.4})`));
                    gradient.addColorStop(1, particle.color.replace(/[\d.]+\)$/, '0)'));
                } else {
                    const hex = particle.color.replace('#', '');
                    const r = parseInt(hex.substr(0, 2), 16);
                    const g = parseInt(hex.substr(2, 2), 16);
                    const b = parseInt(hex.substr(4, 2), 16);
                    gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${alpha})`);
                    gradient.addColorStop(0.3, `rgba(${r}, ${g}, ${b}, ${alpha * 0.8})`);
                    gradient.addColorStop(0.7, `rgba(${r}, ${g}, ${b}, ${alpha * 0.4})`);
                    gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
                }

                // Outer glow layer
                ctx.shadowBlur = particle.radius * 1.5;
                ctx.shadowColor = particle.color;
                ctx.fillStyle = gradient;
                ctx.globalAlpha = 1;
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.radius * 1.5, 0, Math.PI * 2);
                ctx.fill();

                // Inner core
                ctx.shadowBlur = 0;
                ctx.fillStyle = particle.color;
                ctx.globalAlpha = alpha;
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.globalAlpha = 1;
            drawnCount++;
        }
    }

    // Reset globalAlpha at the end to ensure it's always 1
    ctx.globalAlpha = 1;

    if (drawnCount > 0 && drawnCount !== gameState.particles.length) {

    }
}
