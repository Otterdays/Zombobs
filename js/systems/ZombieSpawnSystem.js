import { gameState } from '../core/gameState.js';
import { canvas } from '../core/canvas.js';
import { NormalZombie, FastZombie, ExplodingZombie, ArmoredZombie, GhostZombie, SpitterZombie, FlyingZombie, BlightZombie, CrawlerZombie } from '../entities/Zombie.js';
import { BossZombie } from '../entities/BossZombie.js';
import { triggerWaveNotification } from '../utils/gameUtils.js';
import {
    rollWaveMutator,
    applyMutatorToCount,
    getSpawnTiming,
    getSpawnPackSize,
    selectZombieClass,
    getEncircleSide,
    applyMutatorHealth,
    getBossMinionCount
} from './WaveChaosSystem.js';

const ZOMBIE_CLASS_MAP = {
    normal: NormalZombie,
    fast: FastZombie,
    armored: ArmoredZombie,
    exploding: ExplodingZombie,
    ghost: GhostZombie,
    spitter: SpitterZombie,
    flying: FlyingZombie,
    blight: BlightZombie,
    crawler: CrawlerZombie,
    boss: BossZombie
};

/**
 * ZombieSpawnSystem - Handles zombie and boss spawning logic
 * Manages wave spawning, boss waves, wave mutators, and zombie type selection
 */
export class ZombieSpawnSystem {
    getZombieClassByType(type) {
        return ZOMBIE_CLASS_MAP[type] || NormalZombie;
    }

    _isSinglePlayerArcade() {
        return !gameState.isCoop && !gameState.multiplayer.active;
    }

    _getLocalPlayer() {
        return gameState.players.find(p => p.inputSource === 'mouse');
    }

    _computeSpawnPosition(isSinglePlayerArcade, localPlayer, side) {
        if (isSinglePlayerArcade && localPlayer) {
            const spawnDistance = Math.max(canvas.width, canvas.height) * 0.6;
            switch (side) {
                case 0:
                    return {
                        x: localPlayer.x + (Math.random() - 0.5) * canvas.width,
                        y: localPlayer.y - spawnDistance
                    };
                case 1:
                    return {
                        x: localPlayer.x + spawnDistance,
                        y: localPlayer.y + (Math.random() - 0.5) * canvas.height
                    };
                case 2:
                    return {
                        x: localPlayer.x + (Math.random() - 0.5) * canvas.width,
                        y: localPlayer.y + spawnDistance
                    };
                default:
                    return {
                        x: localPlayer.x - spawnDistance,
                        y: localPlayer.y + (Math.random() - 0.5) * canvas.height
                    };
            }
        }

        switch (side) {
            case 0: return { x: Math.random() * canvas.width, y: -20 };
            case 1: return { x: canvas.width + 20, y: Math.random() * canvas.height };
            case 2: return { x: Math.random() * canvas.width, y: canvas.height + 20 };
            default: return { x: -20, y: Math.random() * canvas.height };
        }
    }

    _resolveSide(index, mutator, packSize) {
        if (mutator === 'encircle') {
            return getEncircleSide(index, packSize);
        }
        return Math.floor(Math.random() * 4);
    }

    _createAndPushZombie(ZombieClass, spawnX, spawnY, mutator, multiplayerSocket) {
        const zombie = new ZombieClass(canvas.width, canvas.height);
        zombie.x = spawnX;
        zombie.y = spawnY;
        applyMutatorHealth(zombie, mutator);
        gameState.zombies.push(zombie);

        if (gameState.multiplayer.active && multiplayerSocket && gameState.multiplayer.isLeader) {
            multiplayerSocket.emit('zombie:spawn', {
                id: zombie.id,
                type: zombie.type || 'normal',
                x: zombie.x,
                y: zombie.y,
                health: zombie.health
            });
        }
        return zombie;
    }

    _scheduleSpawn(index, count, spawnX, spawnY, mutator, multiplayerSocket, isLast) {
        const timing = getSpawnTiming(gameState.wave, mutator, index);
        const { indicatorDelay, spawnDelay, showIndicator } = timing;
        const indicatorLead = spawnDelay - indicatorDelay;
        const indicatorId = `ind_${index}_${Date.now()}_${Math.random()}`;

        if (showIndicator) {
            const indicatorTimeout = setTimeout(() => {
                gameState.spawnIndicators.push({
                    id: indicatorId,
                    x: spawnX,
                    y: spawnY,
                    startTime: Date.now(),
                    duration: indicatorLead
                });
            }, indicatorDelay);
            gameState.zombieSpawnTimeouts.push(indicatorTimeout);
        }

        const timeout = setTimeout(() => {
            const typeKey = selectZombieClass(gameState.wave, mutator, Math.random());
            const ZombieClass = this.getZombieClassByType(typeKey);
            this._createAndPushZombie(ZombieClass, spawnX, spawnY, mutator, multiplayerSocket);

            if (showIndicator) {
                const indicatorIndex = gameState.spawnIndicators.findIndex(ind => ind.id === indicatorId);
                if (indicatorIndex !== -1) {
                    gameState.spawnIndicators.splice(indicatorIndex, 1);
                }
            }

            if (isLast) {
                gameState.isSpawningWave = false;
            }
        }, spawnDelay);

        gameState.zombieSpawnTimeouts.push(timeout);
    }

    _spawnBossMinions(multiplayerSocket) {
        const minionCount = getBossMinionCount(gameState.wave);
        if (minionCount <= 0) return;

        gameState.zombiesSpawnedThisWave += minionCount;
        const isSinglePlayerArcade = this._isSinglePlayerArcade();
        const localPlayer = this._getLocalPlayer();

        for (let i = 0; i < minionCount; i++) {
            const side = Math.floor(Math.random() * 4);
            const { x: spawnX, y: spawnY } = this._computeSpawnPosition(isSinglePlayerArcade, localPlayer, side);
            const delay = 400 + i * 350;
            const isLast = i === minionCount - 1;

            const timeout = setTimeout(() => {
                const typeKey = selectZombieClass(gameState.wave, null, Math.random());
                const ZombieClass = this.getZombieClassByType(typeKey);
                this._createAndPushZombie(ZombieClass, spawnX, spawnY, null, multiplayerSocket);
                if (isLast) {
                    gameState.isSpawningWave = false;
                }
            }, delay);
            gameState.zombieSpawnTimeouts.push(timeout);
        }
    }

    spawnBoss(multiplayerSocket) {
        if (gameState.multiplayer.active && !gameState.multiplayer.isLeader) {
            return;
        }

        gameState.isSpawningWave = true;
        gameState.bossActive = true;
        gameState.waveMutator = null;
        gameState.waveStartTime = Date.now();

        const minionCount = getBossMinionCount(gameState.wave);
        gameState.zombiesSpawnedThisWave = 1 + minionCount;

        const isSinglePlayerArcade = this._isSinglePlayerArcade();
        const localPlayer = this._getLocalPlayer();

        let bossX;
        let bossY;
        if (isSinglePlayerArcade && localPlayer) {
            bossX = localPlayer.x;
            bossY = localPlayer.y - Math.max(canvas.width, canvas.height) * 0.6;
        } else {
            bossX = canvas.width / 2;
            bossY = -50;
        }

        const boss = new BossZombie(bossX, bossY);
        gameState.boss = boss;
        gameState.zombies.push(boss);

        if (gameState.multiplayer.active && multiplayerSocket && gameState.multiplayer.isLeader) {
            multiplayerSocket.emit('zombie:spawn', {
                id: boss.id,
                type: boss.type || 'boss',
                x: boss.x,
                y: boss.y,
                health: boss.health
            });
        }

        triggerWaveNotification('BOSS WAVE!', 180);

        if (minionCount > 0) {
            this._spawnBossMinions(multiplayerSocket);
        } else {
            gameState.isSpawningWave = false;
        }
    }

    spawnZombies(count, multiplayerSocket) {
        if (gameState.multiplayer.active && !gameState.multiplayer.isLeader) {
            return;
        }

        gameState.zombieSpawnTimeouts.forEach(timeout => clearTimeout(timeout));
        gameState.zombieSpawnTimeouts = [];

        if (gameState.wave % 5 === 0) {
            this.spawnBoss(multiplayerSocket);
            return;
        }

        gameState.waveMutator = rollWaveMutator(gameState.wave);
        gameState.waveStartTime = Date.now();

        count = Math.floor(count * 3.0);
        count = applyMutatorToCount(count, gameState.waveMutator);
        gameState.zombiesSpawnedThisWave = count;
        gameState.isSpawningWave = true;
        triggerWaveNotification();

        const isSinglePlayerArcade = this._isSinglePlayerArcade();
        const localPlayer = this._getLocalPlayer();
        const mutator = gameState.waveMutator;
        const packSize = getSpawnPackSize(gameState.wave);

        for (let i = 0; i < count; i++) {
            const side = this._resolveSide(i, mutator, packSize);
            const { x: spawnX, y: spawnY } = this._computeSpawnPosition(isSinglePlayerArcade, localPlayer, side);
            this._scheduleSpawn(i, count, spawnX, spawnY, mutator, multiplayerSocket, i === count - 1);
        }
    }
}
