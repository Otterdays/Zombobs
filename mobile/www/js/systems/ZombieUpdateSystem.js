import { shouldUpdateEntity } from '../utils/gameUtils.js';

/**
 * ZombieUpdateSystem handles zombie AI updates, multiplayer interpolation,
 * and synchronization broadcasting for zombie entities.
 */
export class ZombieUpdateSystem {
    /**
     * Main update method for all zombies
     * @param {Object} gameState - Game state object
     * @param {Object} gameEngine - Game engine instance
     * @param {Object} viewport - Viewport bounds {left, top, right, bottom}
     * @param {number} now - Current timestamp
     */
    updateZombies(gameState, gameEngine, viewport, now) {
        // Apply night difficulty modifier (20% speed increase)
        const nightSpeedMultiplier = gameState.isNight ? 1.2 : 1.0;

        // v0.8.1.2: In single player arcade mode, always update zombies (they need to follow player in world space)
        const isSinglePlayerArcade = !gameState.isCoop && !gameState.multiplayer.active;

        // Optimized loop: use for loop instead of forEach for better performance
        const zombiesLength = gameState.zombies.length;
        const viewportLeft = viewport.left;
        const viewportTop = viewport.top;
        const viewportRight = viewport.right;
        const viewportBottom = viewport.bottom;
        
        for (let i = 0; i < zombiesLength; i++) {
            const zombie = gameState.zombies[i];
            
            // Update culling: Skip updating zombies far off-screen (major FPS boost)
            // v0.8.1.2: In single player arcade mode, always update zombies so they can follow player anywhere
            if (!isSinglePlayerArcade && !shouldUpdateEntity(zombie, viewportLeft, viewportTop, viewportRight, viewportBottom)) {
                continue; // Skip this zombie's update - too far away
            }
            
            // Only the Leader or Singleplayer should run Zombie AI logic
            if (gameState.multiplayer.active && !gameState.multiplayer.isLeader) {
                // Advanced interpolation for smooth movement between server updates
                this.interpolateZombiePosition(zombie, gameEngine, gameState, now);
                continue;
            }

            // Find closest living player and update zombie AI
            this.updateZombieAI(zombie, gameState.players, nightSpeedMultiplier);
        }

        // Broadcast zombie positions to other clients (leader only, throttled)
        if (gameState.multiplayer.active && gameState.multiplayer.socket && gameState.multiplayer.isLeader) {
            this.broadcastZombieUpdates(gameState, now);
        }
    }

    /**
     * Update zombie AI - find closest player and apply movement
     * @param {Object} zombie - Zombie entity
     * @param {Array} players - Array of player entities
     * @param {number} nightSpeedMultiplier - Speed multiplier for night time
     */
    updateZombieAI(zombie, players, nightSpeedMultiplier) {
        // Find closest living player
        let closestPlayer = null;
        let minDist = Infinity;

        // Optimized player search loop
        for (let j = 0; j < players.length; j++) {
            const p = players[j];
            if (p.health > 0) {
                const d = (p.x - zombie.x) ** 2 + (p.y - zombie.y) ** 2;
                if (d < minDist) {
                    minDist = d;
                    closestPlayer = p;
                }
            }
        }

        if (closestPlayer) {
            // Store original speed if not already stored
            if (!zombie.baseSpeed) {
                zombie.baseSpeed = zombie.speed;
            }
            // Apply night speed boost
            zombie.speed = zombie.baseSpeed * nightSpeedMultiplier;
            zombie.update(closestPlayer);
        }
    }

    /**
     * Interpolate zombie position for non-leader clients in multiplayer
     * @param {Object} zombie - Zombie entity
     * @param {Object} gameEngine - Game engine instance
     * @param {Object} gameState - Game state object
     * @param {number} now - Current timestamp
     */
    interpolateZombiePosition(zombie, gameEngine, gameState, now) {
        if (zombie.targetX === undefined || zombie.targetY === undefined) {
            return;
        }

        const timeSinceUpdate = now - (zombie.lastUpdateTime || 0);
        const updateInterval = gameState.zombieUpdateInterval || 100;
        const frameTime = gameEngine.timeStep || 16.67;
        
        // Calculate adaptive lerp factor
        // Use gameEngine interpolation alpha for frame-perfect interpolation
        const interpAlpha = gameEngine.getInterpolationAlpha ? gameEngine.getInterpolationAlpha() : 0;
        const baseLerpFactor = Math.min(0.5, Math.max(0.1, updateInterval / (frameTime * 2)));
        const lerpFactor = interpAlpha > 0 ? baseLerpFactor * (1 + interpAlpha) : baseLerpFactor;
        
        // Calculate distance to target (use squared distance for comparison)
        const dx = zombie.targetX - zombie.x;
        const dy = zombie.targetY - zombie.y;
        const distSquared = dx * dx + dy * dy;
        const dist = Math.sqrt(distSquared);
        
        // Use velocity-based extrapolation if velocity is available
        if (zombie.vx !== undefined && zombie.vy !== undefined && distSquared < 50 * 50 && timeSinceUpdate < updateInterval * 2) {
            // Small distance and recent update - use velocity extrapolation
            const extrapolationFactor = timeSinceUpdate / updateInterval;
            zombie.x += zombie.vx * extrapolationFactor;
            zombie.y += zombie.vy * extrapolationFactor;
        } else {
            // Use adaptive lerp
            zombie.x += dx * lerpFactor;
            zombie.y += dy * lerpFactor;
        }
        
        // Snap if very close (prevents jitter)
        if (dist < 0.5) {
            zombie.x = zombie.targetX;
            zombie.y = zombie.targetY;
        }
    }

    /**
     * Broadcast zombie updates to other clients (leader only)
     * Uses adaptive update rate and delta compression for efficiency
     * @param {Object} gameState - Game state object
     * @param {number} now - Current timestamp
     */
    broadcastZombieUpdates(gameState, now) {
        // Adaptive update rate based on zombie count and activity
        const zombieCount = gameState.zombies.length;
        const baseInterval = 100; // Base 10Hz
        // Adjust interval: faster with more zombies (50ms), slower with few (200ms)
        const adaptiveInterval = Math.max(50, Math.min(200, baseInterval - (zombieCount * 0.5)));
        
        // Also adjust based on network latency if available
        const latencyAdjustment = gameState.networkLatency > 100 ? 20 : 0;
        const updateInterval = adaptiveInterval + latencyAdjustment;
        
        if (!gameState.lastZombieUpdateBroadcast || now - gameState.lastZombieUpdateBroadcast >= updateInterval) {
            gameState.zombieUpdateInterval = updateInterval; // Store for client-side interpolation
            
            // Delta compression: only send changed zombies
            const changedZombies = [];
            const threshold = 1.0; // Position change threshold (pixels)
            
            for (let i = 0; i < gameState.zombies.length; i++) {
                const z = gameState.zombies[i];
                const lastState = gameState.lastZombieState.get(z.id);
                
                // Check if zombie has changed significantly
                const positionChanged = !lastState || 
                    Math.abs(lastState.x - z.x) > threshold || 
                    Math.abs(lastState.y - z.y) > threshold;
                const healthChanged = !lastState || lastState.health !== z.health;
                const speedChanged = !lastState || 
                    Math.abs((lastState.speed || 0) - (z.speed || 0)) > 0.01;
                
                if (positionChanged || healthChanged || speedChanged || !lastState) {
                    // Include speed and baseSpeed for synchronization
                    const zombieData = {
                        id: z.id,
                        x: z.x,
                        y: z.y,
                        health: z.health,
                        speed: z.speed,
                        baseSpeed: z.baseSpeed || z.speed
                    };
                    changedZombies.push(zombieData);
                    
                    // Update last known state
                    gameState.lastZombieState.set(z.id, {
                        x: z.x,
                        y: z.y,
                        health: z.health,
                        speed: z.speed
                    });
                }
            }
            
            // Only send if there are changes (or send full state first time)
            if (changedZombies.length > 0 || gameState.lastZombieState.size === 0) {
                // If more than 80% of zombies changed, send all for efficiency
                if (gameState.zombies.length > 0 && changedZombies.length / gameState.zombies.length > 0.8) {
                    // Send full state (more efficient than many small packets)
                    const zombieData = gameState.zombies.map(z => ({
                        id: z.id,
                        x: z.x,
                        y: z.y,
                        health: z.health,
                        speed: z.speed,
                        baseSpeed: z.baseSpeed || z.speed
                    }));
                    gameState.multiplayer.socket.emit('zombie:update', zombieData);
                    
                    // Update all states
                    gameState.lastZombieState.clear();
                    zombieData.forEach(zd => {
                        gameState.lastZombieState.set(zd.id, {
                            x: zd.x,
                            y: zd.y,
                            health: zd.health,
                            speed: zd.speed
                        });
                    });
                } else {
                    // Send only changed zombies (delta compression)
                    gameState.multiplayer.socket.emit('zombie:update', changedZombies);
                }
            }
            
            gameState.lastZombieUpdateBroadcast = now;
        }
    }
}

// Export singleton instance
export const zombieUpdateSystem = new ZombieUpdateSystem();

