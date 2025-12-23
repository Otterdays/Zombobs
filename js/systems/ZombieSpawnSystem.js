import { gameState } from '../core/gameState.js';
import { canvas } from '../core/canvas.js';
import { NormalZombie, FastZombie, ExplodingZombie, ArmoredZombie, GhostZombie, SpitterZombie, FlyingZombie, CrawlerZombie } from '../entities/Zombie.js';
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
            'crawler': CrawlerZombie,
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
        gameState.zombiesSpawnedThisWave = 1;  // Boss wave = 1 enemy

        // v0.8.1.2: In single player arcade mode, spawn boss relative to player position in world space
        const isSinglePlayerArcade = !gameState.isCoop && !gameState.multiplayer.active;
        const localPlayer = gameState.players.find(p => p.inputSource === 'mouse');
        
        let bossX, bossY;
        if (isSinglePlayerArcade && localPlayer) {
            // Spawn boss above player in world space
            bossX = localPlayer.x;
            bossY = localPlayer.y - Math.max(canvas.width, canvas.height) * 0.6;
        } else {
            // Original spawn logic (screen space)
            bossX = canvas.width / 2;
            bossY = -50;
        }
        
        const boss = new BossZombie(bossX, bossY);
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

        // Increase spawn count by 1.5x for regular zombies (not bosses)
        count = Math.floor(count * 1.5);

        // Track actual zombies spawned this wave for HUD display
        gameState.zombiesSpawnedThisWave = count;

        // Mark that we're spawning a wave
        gameState.isSpawningWave = true;

        // v0.8.1.2: In single player arcade mode, spawn zombies relative to player position in world space
        const isSinglePlayerArcade = !gameState.isCoop && !gameState.multiplayer.active;
        const localPlayer = gameState.players.find(p => p.inputSource === 'mouse');
        
        // Spawn zombies with staggered timing
        for (let i = 0; i < count; i++) {
            // Calculate spawn position
            let spawnX, spawnY;
            
            if (isSinglePlayerArcade && localPlayer) {
                // Spawn at edges of viewport in world space (relative to player)
                const side = Math.floor(Math.random() * 4);
                const spawnDistance = Math.max(canvas.width, canvas.height) * 0.6; // Spawn at viewport edges
                switch (side) {
                    case 0: // Top
                        spawnX = localPlayer.x + (Math.random() - 0.5) * canvas.width;
                        spawnY = localPlayer.y - spawnDistance;
                        break;
                    case 1: // Right
                        spawnX = localPlayer.x + spawnDistance;
                        spawnY = localPlayer.y + (Math.random() - 0.5) * canvas.height;
                        break;
                    case 2: // Bottom
                        spawnX = localPlayer.x + (Math.random() - 0.5) * canvas.width;
                        spawnY = localPlayer.y + spawnDistance;
                        break;
                    case 3: // Left
                        spawnX = localPlayer.x - spawnDistance;
                        spawnY = localPlayer.y + (Math.random() - 0.5) * canvas.height;
                        break;
                }
            } else {
                // Original spawn logic (screen space)
                const side = Math.floor(Math.random() * 4);
                switch (side) {
                    case 0: spawnX = Math.random() * canvas.width; spawnY = -20; break;
                    case 1: spawnX = canvas.width + 20; spawnY = Math.random() * canvas.height; break;
                    case 2: spawnX = Math.random() * canvas.width; spawnY = canvas.height + 20; break;
                    case 3: spawnX = -20; spawnY = Math.random() * canvas.height; break;
                }
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
                // Wave 5+: Introduce Flying zombies (~15% chance)
                else if (gameState.wave >= 5 && rand >= 0.43 && rand < 0.58) {
                    ZombieClass = FlyingZombie;
                }
                // Wave 4+: Introduce Crawler zombies (~8% chance)
                else if (gameState.wave >= 4 && rand >= 0.58 && rand < 0.66) {
                    ZombieClass = CrawlerZombie;
                }
                // Wave 3+: Armored zombies (chance increases with wave, but only if not fast/exploding/ghost/spitter/flying/crawler)
                else if (gameState.wave >= 3 && rand >= 0.66) {
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

