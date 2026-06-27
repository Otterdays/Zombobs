import {
    HEALTH_PICKUP_SPAWN_INTERVAL,
    MAX_HEALTH_PICKUPS,
    AMMO_PICKUP_SPAWN_INTERVAL,
    MAX_AMMO_PICKUPS,
    PLAYER_MAX_HEALTH,
    SCRAP_VALUE,
    SCRAP_DROP_CHANCE,
    SCRAP_BOSS_VALUE,
    MAX_SCRAP_PICKUPS,
    SCRAP_MAGNETIC_RANGE
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
import { ScrapPickup } from '../entities/ScrapPickup.js';
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
     * Magnetic pull + animation for scrap pickups toward nearest living player
     * @param {Object} gameState
     * @param {number} now
     */
    updateScrapPickups(gameState, now) {
        if (!gameState.scrapPickups || gameState.scrapPickups.length === 0) {
            return;
        }

        let nearestX = gameState.players[0].x;
        let nearestY = gameState.players[0].y;

        let maxMagnetBonus = 0;
        for (let p = 0; p < gameState.players.length; p++) {
            const pl = gameState.players[p];
            if (pl.health <= 0) continue;
            if ((pl.pickupMagnetBonus || 0) > maxMagnetBonus) {
                maxMagnetBonus = pl.pickupMagnetBonus;
            }
        }
        const magnetRange = SCRAP_MAGNETIC_RANGE + maxMagnetBonus;
        const magnetRangeSq = magnetRange * magnetRange;

        for (let i = 0; i < gameState.scrapPickups.length; i++) {
            const scrap = gameState.scrapPickups[i];
            scrap.magneticRange = magnetRange;
            scrap.magneticRangeSq = magnetRangeSq;
            let minDistSq = Infinity;

            for (let p = 0; p < gameState.players.length; p++) {
                const pl = gameState.players[p];
                if (pl.health <= 0) continue;
                const dx = pl.x - scrap.x;
                const dy = pl.y - scrap.y;
                const distSq = dx * dx + dy * dy;
                if (distSq < minDistSq) {
                    minDistSq = distSq;
                    nearestX = pl.x;
                    nearestY = pl.y;
                }
            }

            scrap.update(nearestX, nearestY, now);
        }
    }

    /**
     * Spawn a scrap pickup at a world position (zombie death drops)
     * @param {Object} gameState
     * @param {number} x
     * @param {number} y
     * @param {number} value
     * @returns {ScrapPickup|null}
     */
    spawnScrapAt(gameState, x, y, value = SCRAP_VALUE) {
        if (!gameState.scrapPickups) {
            gameState.scrapPickups = [];
        }
        if (gameState.scrapPickups.length >= MAX_SCRAP_PICKUPS) {
            return null;
        }

        const scrap = new ScrapPickup(canvas.width, canvas.height);
        scrap.x = x;
        scrap.y = y;
        scrap.baseY = y;
        scrap.value = value;
        gameState.scrapPickups.push(scrap);
        return scrap;
    }

    /**
     * Roll scrap drop on zombie death — bosses always drop, regular zombies low chance
     * @param {Object} gameState
     * @param {Object} zombie
     * @param {number} x
     * @param {number} y
     */
    tryDropScrapFromZombie(gameState, zombie, x, y) {
        const isBoss = zombie.type === 'boss';
        const dropChance = isBoss ? 1.0 : SCRAP_DROP_CHANCE;
        if (Math.random() >= dropChance) {
            return;
        }

        const value = isBoss ? SCRAP_BOSS_VALUE : SCRAP_VALUE;
        this.spawnScrapAt(gameState, x, y, value);
    }

    /**
     * Spawn health pickup if conditions are met
     * @param {Object} gameState - Game state object
     * @param {HTMLCanvasElement} canvas - Canvas element for spawn bounds
     * @param {number} now - Current timestamp
     */
    spawnHealthPickup(gameState, canvas, now) {
        const scavengerMultiplier = Math.max(...gameState.players.map(p => p.pickupSpawnRateMultiplier || 1.0));
        const adjustedInterval = HEALTH_PICKUP_SPAWN_INTERVAL / scavengerMultiplier;
        
        if (now - gameState.lastHealthPickupSpawnTime >= adjustedInterval &&
            gameState.healthPickups.length < MAX_HEALTH_PICKUPS) {
            if (gameState.players.some(p => p.health < PLAYER_MAX_HEALTH && p.health > 0)) {
                const isSinglePlayerArcade = !gameState.isCoop && !gameState.multiplayer.active;
                const localPlayer = gameState.players.find(p => p.inputSource === 'mouse');
                
                if (isSinglePlayerArcade && localPlayer) {
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
        const scavengerMultiplier = Math.max(...gameState.players.map(p => p.pickupSpawnRateMultiplier || 1.0));
        const adjustedInterval = AMMO_PICKUP_SPAWN_INTERVAL / scavengerMultiplier;
        
        if (now - gameState.lastAmmoPickupSpawnTime >= adjustedInterval &&
            gameState.ammoPickups.length < MAX_AMMO_PICKUPS) {
            if (gameState.players.some(p => p.currentAmmo < p.maxAmmo * 0.5 && p.health > 0)) {
                const isSinglePlayerArcade = !gameState.isCoop && !gameState.multiplayer.active;
                const localPlayer = gameState.players.find(p => p.inputSource === 'mouse');
                
                if (isSinglePlayerArcade && localPlayer) {
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
        const scavengerMultiplier = Math.max(...gameState.players.map(p => p.pickupSpawnRateMultiplier || 1.0));
        const adjustedInterval = 30000 / scavengerMultiplier;
        const adjustedChance = Math.min(1.0, 0.6 * scavengerMultiplier);
        
        if (now - gameState.lastPowerupSpawnTime >= adjustedInterval) {
            if (Math.random() < adjustedChance) {
                const rand = Math.random();

                const isSinglePlayerArcade = !gameState.isCoop && !gameState.multiplayer.active;
                const localPlayer = gameState.players.find(p => p.inputSource === 'mouse');
                
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
                
                if (rand < 0.20) {
                    if (gameState.damagePickups.length < 1) {
                        spawnPickupInWorldSpace(DamagePickup, gameState.damagePickups);
                    }
                } else if (rand < 0.28) {
                    if (gameState.nukePickups.length < 1) {
                        spawnPickupInWorldSpace(NukePickup, gameState.nukePickups);
                    }
                } else if (rand < 0.46) {
                    if (gameState.speedPickups.length < 1) {
                        spawnPickupInWorldSpace(SpeedPickup, gameState.speedPickups);
                    }
                } else if (rand < 0.64) {
                    if (gameState.rapidFirePickups.length < 1) {
                        spawnPickupInWorldSpace(RapidFirePickup, gameState.rapidFirePickups);
                    }
                } else if (rand < 0.88) {
                    if (gameState.shieldPickups.length < 1) {
                        spawnPickupInWorldSpace(ShieldPickup, gameState.shieldPickups);
                    }
                } else {
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
