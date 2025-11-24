import {
    HEALTH_PICKUP_SPAWN_INTERVAL,
    MAX_HEALTH_PICKUPS,
    AMMO_PICKUP_SPAWN_INTERVAL,
    MAX_AMMO_PICKUPS,
    PLAYER_MAX_HEALTH
} from '../core/constants.js';
import {
    HealthPickup,
    AmmoPickup,
    DamagePickup,
    NukePickup,
    SpeedPickup,
    RapidFirePickup,
    ShieldPickup,
    AdrenalinePickup
} from '../entities/Pickup.js';
import { gameState } from '../core/gameState.js';
import { canvas } from '../core/canvas.js';

/**
 * PickupSpawnSystem handles spawning of health, ammo, and powerup pickups
 * based on game conditions and timers.
 */
export class PickupSpawnSystem {
    /**
     * Main method to update all pickup spawning
     * @param {Object} gameState - Game state object
     * @param {HTMLCanvasElement} canvas - Canvas element for spawn bounds
     * @param {number} now - Current timestamp
     */
    updateSpawns(gameState, canvas, now) {
        this.spawnHealthPickup(gameState, canvas, now);
        this.spawnAmmoPickup(gameState, canvas, now);
        this.spawnPowerup(gameState, canvas, now);
    }

    /**
     * Spawn health pickup if conditions are met
     * @param {Object} gameState - Game state object
     * @param {HTMLCanvasElement} canvas - Canvas element for spawn bounds
     * @param {number} now - Current timestamp
     */
    spawnHealthPickup(gameState, canvas, now) {
        // Apply Scavenger skill (25% more spawn rate = reduce interval)
        const scavengerMultiplier = Math.max(...gameState.players.map(p => p.pickupSpawnRateMultiplier || 1.0));
        const adjustedInterval = HEALTH_PICKUP_SPAWN_INTERVAL / scavengerMultiplier;
        
        if (now - gameState.lastHealthPickupSpawnTime >= adjustedInterval &&
            gameState.healthPickups.length < MAX_HEALTH_PICKUPS) {
            // Only spawn if some player is hurt
            if (gameState.players.some(p => p.health < PLAYER_MAX_HEALTH && p.health > 0)) {
                // v0.8.1.2: In single player arcade mode, spawn relative to player position in world space
                const isSinglePlayerArcade = !gameState.isCoop && !gameState.multiplayer.active;
                const localPlayer = gameState.players.find(p => p.inputSource === 'mouse');
                
                if (isSinglePlayerArcade && localPlayer) {
                    // Spawn in world space relative to player (within viewport area)
                    const margin = 40;
                    const spawnX = localPlayer.x + (Math.random() - 0.5) * (canvas.width - margin * 2);
                    const spawnY = localPlayer.y + (Math.random() - 0.5) * (canvas.height - margin * 2);
                    const pickup = new HealthPickup(canvas.width, canvas.height);
                    pickup.x = spawnX;
                    pickup.y = spawnY;
                    gameState.healthPickups.push(pickup);
                } else {
                    gameState.healthPickups.push(new HealthPickup(canvas.width, canvas.height));
                }
                gameState.lastHealthPickupSpawnTime = now;
            }
        }
    }

    /**
     * Spawn ammo pickup if conditions are met
     * @param {Object} gameState - Game state object
     * @param {HTMLCanvasElement} canvas - Canvas element for spawn bounds
     * @param {number} now - Current timestamp
     */
    spawnAmmoPickup(gameState, canvas, now) {
        // Apply Scavenger skill (25% more spawn rate = reduce interval)
        const scavengerMultiplier = Math.max(...gameState.players.map(p => p.pickupSpawnRateMultiplier || 1.0));
        const adjustedInterval = AMMO_PICKUP_SPAWN_INTERVAL / scavengerMultiplier;
        
        if (now - gameState.lastAmmoPickupSpawnTime >= adjustedInterval &&
            gameState.ammoPickups.length < MAX_AMMO_PICKUPS) {
            if (gameState.players.some(p => p.currentAmmo < p.maxAmmo * 0.5 && p.health > 0)) {
                // v0.8.1.2: In single player arcade mode, spawn relative to player position in world space
                const isSinglePlayerArcade = !gameState.isCoop && !gameState.multiplayer.active;
                const localPlayer = gameState.players.find(p => p.inputSource === 'mouse');
                
                if (isSinglePlayerArcade && localPlayer) {
                    // Spawn in world space relative to player (within viewport area)
                    const margin = 40;
                    const spawnX = localPlayer.x + (Math.random() - 0.5) * (canvas.width - margin * 2);
                    const spawnY = localPlayer.y + (Math.random() - 0.5) * (canvas.height - margin * 2);
                    const pickup = new AmmoPickup(canvas.width, canvas.height);
                    pickup.x = spawnX;
                    pickup.y = spawnY;
                    gameState.ammoPickups.push(pickup);
                } else {
                    gameState.ammoPickups.push(new AmmoPickup(canvas.width, canvas.height));
                }
                gameState.lastAmmoPickupSpawnTime = now;
            }
        }
    }

    /**
     * Spawn powerup with weighted distribution
     * Distribution: Damage (20%), Nuke (8%), Speed (18%), RapidFire (18%), Shield (24%), Adrenaline (12%)
     * @param {Object} gameState - Game state object
     * @param {HTMLCanvasElement} canvas - Canvas element for spawn bounds
     * @param {number} now - Current timestamp
     */
    spawnPowerup(gameState, canvas, now) {
        // Apply Scavenger skill (25% more spawn rate = reduce interval and increase chance)
        const scavengerMultiplier = Math.max(...gameState.players.map(p => p.pickupSpawnRateMultiplier || 1.0));
        const adjustedInterval = 30000 / scavengerMultiplier;
        const adjustedChance = Math.min(1.0, 0.6 * scavengerMultiplier); // Increase chance up to 100%
        
        if (now - gameState.lastPowerupSpawnTime >= adjustedInterval) { // Adjusted interval
            if (Math.random() < adjustedChance) { // Adjusted chance
                const rand = Math.random();

                // v0.8.1.2: In single player arcade mode, spawn relative to player position in world space
                const isSinglePlayerArcade = !gameState.isCoop && !gameState.multiplayer.active;
                const localPlayer = gameState.players.find(p => p.inputSource === 'mouse');
                
                // Helper function to spawn pickup in world space if needed
                const spawnPickupInWorldSpace = (PickupClass, array) => {
                    if (isSinglePlayerArcade && localPlayer) {
                        const margin = 40;
                        const spawnX = localPlayer.x + (Math.random() - 0.5) * (canvas.width - margin * 2);
                        const spawnY = localPlayer.y + (Math.random() - 0.5) * (canvas.height - margin * 2);
                        const pickup = new PickupClass(canvas.width, canvas.height);
                        pickup.x = spawnX;
                        pickup.y = spawnY;
                        array.push(pickup);
                    } else {
                        array.push(new PickupClass(canvas.width, canvas.height));
                    }
                };
                
                // Distribution: Damage (20%), Nuke (8%), Speed (18%), RapidFire (18%), Shield (24%), Adrenaline (12%)
                if (rand < 0.20) { // Damage
                    if (gameState.damagePickups.length < 1) {
                        spawnPickupInWorldSpace(DamagePickup, gameState.damagePickups);
                    }
                } else if (rand < 0.28) { // Nuke
                    if (gameState.nukePickups.length < 1) {
                        spawnPickupInWorldSpace(NukePickup, gameState.nukePickups);
                    }
                } else if (rand < 0.46) { // Speed
                    if (gameState.speedPickups.length < 1) {
                        spawnPickupInWorldSpace(SpeedPickup, gameState.speedPickups);
                    }
                } else if (rand < 0.64) { // RapidFire
                    if (gameState.rapidFirePickups.length < 1) {
                        spawnPickupInWorldSpace(RapidFirePickup, gameState.rapidFirePickups);
                    }
                } else if (rand < 0.88) { // Shield
                    if (gameState.shieldPickups.length < 1) {
                        spawnPickupInWorldSpace(ShieldPickup, gameState.shieldPickups);
                    }
                } else { // Adrenaline
                    if (gameState.adrenalinePickups.length < 1) {
                        spawnPickupInWorldSpace(AdrenalinePickup, gameState.adrenalinePickups);
                    }
                }
            }
            gameState.lastPowerupSpawnTime = now;
        }
    }
}

// Export singleton instance
export const pickupSpawnSystem = new PickupSpawnSystem();

