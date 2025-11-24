import { ctx } from '../core/canvas.js';
import { gameState } from '../core/gameState.js';
import { Particle } from '../entities/Particle.js';
import { MAX_PARTICLES } from '../core/constants.js';
import { graphicsSettings } from '../systems/GraphicsSystem.js';
import { ObjectPool } from '../utils/ObjectPool.js';
import { settingsManager } from './SettingsManager.js';

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
        console.log('spawnParticle: At limit, returning null. Limit:', limit, 'Current:', gameState.particles.length);
        return null;
    }
    
    const p = particlePool.get(x, y, color, props);
    if (!p) {
        console.warn('spawnParticle: particlePool.get returned null!');
        return null;
    }
    
    gameState.particles.push(p);
    console.log('spawnParticle: Created particle at', x, y, 'color:', color, 'radius:', p.radius, 'life:', p.life, 'total particles:', gameState.particles.length);

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
    console.log('createExplosion called!', x, y, size);
    
    // Safety check - ensure we have valid coordinates
    if (typeof x !== 'number' || typeof y !== 'number' || !isFinite(x) || !isFinite(y)) {
        console.warn('createExplosion called with invalid coordinates:', x, y);
        return;
    }
    
    // Force create explosion even if at particle limit - explosions are critical
    const originalLength = gameState.particles.length;
    console.log('Particle count before explosion:', originalLength);
    
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
        console.warn('Error getting explosion quality, using defaults:', e);
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
    console.log('Creating flash particles, current particle count:', gameState.particles.length, 'limit:', limit);
    let flash1 = spawnParticle(x, y, '#ffffff', {
        radius: baseFlashSize,
        life: 30, // Longer life so it's very visible
        maxLife: 30,
        vx: 0,
        vy: 0
    });
    console.log('Flash1 (white) created:', flash1 ? 'YES' : 'NO', 'at', x, y, 'radius:', baseFlashSize);
    
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
            console.log('Flash1 force-added to array');
        }
    }
    
    console.log('Explosion creation completed. Particles added:', gameState.particles.length - originalLength);
    
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
    // Use filter pattern instead of reverse loop + splice for better performance
    const aliveParticles = [];
    let removedCount = 0;
    
    for (let i = 0; i < gameState.particles.length; i++) {
        const p = gameState.particles[i];
        
        if (!p) {
            console.warn('updateParticles: Found null particle at index', i);
            continue;
        }
        
        if (p.update) {
            p.update();
        } else {
            // Fallback for simple objects if any remain
            p.x += p.vx;
            p.y += p.vy;
            p.life--;
        }

        if (p.life > 0) {
            aliveParticles.push(p);
        } else {
            removedCount++;
            // Return to pool if it's a Particle instance
            if (p instanceof Particle) {
                particlePool.release(p);
            }
        }
    }
    
    if (removedCount > 0) {
        console.log('updateParticles: Removed', removedCount, 'dead particles. Remaining:', aliveParticles.length);
    }
    
    // Replace array instead of splicing
    gameState.particles = aliveParticles;
}

export function drawParticles() {
    // Check if WebGPU is active - if so, use WebGPU for enhanced particle rendering
    // WebGPU canvas is now on top (z-index 2) so particles render above gameplay
    if (typeof isWebGPUActive === 'function' && isWebGPUActive()) {
        const webgpuRenderer = window.webgpuRenderer;
        if (webgpuRenderer && webgpuRenderer.syncGameParticles) {
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
    
    console.log('[ParticleSystem] drawParticles: Drawing', gameState.particles.length, 'particles (Canvas 2D fallback)');
    
    const particleDetail = graphicsSettings.particleDetail || 'standard';
    
    // Optimized loop: use for loop instead of forEach
    let drawnCount = 0;
    for (let i = 0; i < gameState.particles.length; i++) {
        const particle = gameState.particles[i];
        
        if (!particle) {
            console.warn('[ParticleSystem] drawParticles: Null particle at index', i);
            continue;
        }
        
        // Debug first few particles
        if (i < 3) {
            const maxLife = particle.maxLife || 30;
            const alpha = Math.max(0, particle.life / maxLife);
            console.log('[ParticleSystem] Drawing particle', i, ':', {
                x: particle.x,
                y: particle.y,
                radius: particle.radius,
                color: particle.color,
                life: particle.life,
                maxLife: maxLife,
                calculatedAlpha: alpha,
                willDraw: alpha > 0 && particle.radius > 0
            });
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
                console.warn('[ParticleSystem] Invalid particle data at index', i, particle);
                continue;
            }
            
            if (alpha <= 0 || particle.radius <= 0) {
                if (i < 3) {
                    console.warn('[ParticleSystem] Skipping particle', i, '- alpha:', alpha, 'radius:', particle.radius);
                }
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
            
            // Debug: Log actual drawing parameters for first few particles
            if (i < 3) {
                console.log('[ParticleSystem] Actually drawing particle', i, '- originalColor:', particle.color, 'convertedFillColor:', fillColor, 'arc at:', particle.x, particle.y, 'radius:', particle.radius);
            }
            
            if (particleDetail === 'minimal') {
                // Minimal: Simple solid circles
                ctx.fillStyle = fillColor;
                ctx.globalAlpha = 1.0; // Alpha is already in fillColor
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
                ctx.fill();
            } else if (particleDetail === 'standard') {
                // Standard: Current particle system
                ctx.fillStyle = fillColor;
                ctx.globalAlpha = 1.0; // Alpha is already in fillColor
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
                ctx.fill();
            } else if (particleDetail === 'detailed') {
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
        console.warn('[ParticleSystem] drawParticles: Only drew', drawnCount, 'out of', gameState.particles.length, 'particles');
    }
}
