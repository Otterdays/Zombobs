import { gameState } from '../core/gameState.js';
import { canvas } from '../core/canvas.js';
import { NormalZombie, FastZombie, ExplodingZombie, ArmoredZombie, GhostZombie, SpitterZombie, FlyingZombie } from '../entities/Zombie.js';
import { BossZombie } from '../entities/BossZombie.js';
import { triggerWaveNotification } from '../utils/gameUtils.js';

/**
 * ZombieSpawnSystem - Handles zombie and boss spawning logic
 * Manages wave spawning, boss waves, and zombie type selection
 */
export class ZombieSpawnSystem {
    /**
     * Get zombie class by type string
     */
    getZombieClassByType(type) {
        const typeMap = {
            'normal': NormalZombie,
            'fast': FastZombie,
            'armored': ArmoredZombie,
            'exploding': ExplodingZombie,
            'ghost': GhostZombie,
            'spitter': SpitterZombie,
            'flying': FlyingZombie,
            'boss': BossZombie
        };
        return typeMap[type] || NormalZombie;
    }

    /**
     * Spawn a boss zombie
     */
    spawnBoss(multiplayerSocket) {
        // In multiplayer, only the leader spawns the boss
        if (gameState.multiplayer.active && !gameState.multiplayer.isLeader) {
            return; // Non-leader clients will receive zombie:spawn event
        }

        gameState.isSpawningWave = true;
        gameState.bossActive = true;

        // Spawn boss at top center
        const boss = new BossZombie(canvas.width / 2, -50);
        gameState.boss = boss;
        gameState.zombies.push(boss);

        // Broadcast boss spawn to other clients (leader only)
        if (gameState.multiplayer.active && multiplayerSocket && gameState.multiplayer.isLeader) {
            multiplayerSocket.emit('zombie:spawn', {
                id: boss.id,
                type: boss.type || 'boss',
                x: boss.x,
                y: boss.y,
                health: boss.health
            });
        }

        triggerWaveNotification("BOSS WAVE!", 180); // Longer notification

        // Play boss sound (if we had one)
        // playBossRoar();

        gameState.isSpawningWave = false;
    }

    /**
     * Spawn zombies for a wave
     */
    spawnZombies(count, multiplayerSocket) {
        // In multiplayer, only the leader spawns zombies
        if (gameState.multiplayer.active && !gameState.multiplayer.isLeader) {
            return; // Non-leader clients will receive zombie:spawn events
        }

        // Clear any pending zombie spawn timeouts
        gameState.zombieSpawnTimeouts.forEach(timeout => clearTimeout(timeout));
        gameState.zombieSpawnTimeouts = [];

        // Check for Boss Wave (Every 5 waves)
        if (gameState.wave % 5 === 0) {
            this.spawnBoss(multiplayerSocket);
            return;
        }

        // Mark that we're spawning a wave
        gameState.isSpawningWave = true;

        // Spawn zombies with staggered timing
        for (let i = 0; i < count; i++) {
            // Calculate spawn position (same logic as Zombie constructor)
            const side = Math.floor(Math.random() * 4);
            let spawnX, spawnY;
            switch (side) {
                case 0: spawnX = Math.random() * canvas.width; spawnY = -20; break;
                case 1: spawnX = canvas.width + 20; spawnY = Math.random() * canvas.height; break;
                case 2: spawnX = Math.random() * canvas.width; spawnY = canvas.height + 20; break;
                case 3: spawnX = -20; spawnY = Math.random() * canvas.height; break;
            }

            // Create spawn indicator 1 second before zombie spawns
            const indicatorDelay = i * 500;
            const spawnDelay = indicatorDelay + 1000; // 1 second after indicator

            // Create indicator with unique ID for removal
            const indicatorId = `ind_${i}_${Date.now()}_${Math.random()}`;
            setTimeout(() => {
                gameState.spawnIndicators.push({
                    id: indicatorId,
                    x: spawnX,
                    y: spawnY,
                    startTime: Date.now(),
                    duration: 1000 // 1 second
                });
            }, indicatorDelay);

            // Spawn zombie after delay
            const timeout = setTimeout(() => {
                let ZombieClass = NormalZombie; // Default
                const rand = Math.random();

                // Wave 3+: Introduce Fast zombies (~15% chance)
                if (gameState.wave >= 3 && rand < 0.15) {
                    ZombieClass = FastZombie;
                }
                // Wave 5+: Introduce Exploding zombies (~10% chance, but only if not fast)
                else if (gameState.wave >= 5 && rand >= 0.15 && rand < 0.25) {
                    ZombieClass = ExplodingZombie;
                }
                // Wave 4+: Introduce Ghost zombies (~10% chance)
                else if (gameState.wave >= 4 && rand >= 0.25 && rand < 0.35) {
                    ZombieClass = GhostZombie;
                }
                // Wave 6+: Introduce Spitter zombies (~8% chance)
                else if (gameState.wave >= 6 && rand >= 0.35 && rand < 0.43) {
                    ZombieClass = SpitterZombie;
                }
                // Wave 5+: Introduce Flying zombies (~9% chance)
                else if (gameState.wave >= 5 && rand >= 0.43 && rand < 0.52) {
                    ZombieClass = FlyingZombie;
                }
                // Wave 3+: Armored zombies (chance increases with wave, but only if not fast/exploding/ghost/spitter/flying)
                else if (gameState.wave >= 3 && rand >= 0.52) {
                    const armoredChance = Math.min(0.1 + (gameState.wave - 3) * 0.03, 0.5); // 10%+ and caps at 50%
                    if (Math.random() < armoredChance) {
                        ZombieClass = ArmoredZombie;
                    }
                }

                // Create zombie at the pre-determined spawn location
                // Note: Zombie constructor sets random position, so we override it
                const zombie = new ZombieClass(canvas.width, canvas.height);
                // Override with our predetermined spawn position
                zombie.x = spawnX;
                zombie.y = spawnY;
                gameState.zombies.push(zombie);

                // Broadcast zombie spawn to other clients (leader only)
                if (gameState.multiplayer.active && multiplayerSocket && gameState.multiplayer.isLeader) {
                    multiplayerSocket.emit('zombie:spawn', {
                        id: zombie.id,
                        type: zombie.type || 'normal',
                        x: zombie.x,
                        y: zombie.y,
                        health: zombie.health
                    });
                }

                // Remove the corresponding indicator by ID
                const indicatorIndex = gameState.spawnIndicators.findIndex(ind => ind.id === indicatorId);
                if (indicatorIndex !== -1) {
                    gameState.spawnIndicators.splice(indicatorIndex, 1);
                }

                // After the last zombie spawns, clear the flag
                if (i === count - 1) {
                    gameState.isSpawningWave = false;
                }
            }, spawnDelay);
            gameState.zombieSpawnTimeouts.push(timeout);
        }
    }
}

