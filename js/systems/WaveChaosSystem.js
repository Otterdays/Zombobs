import { WAVE_BREAK_DURATION } from '../core/constants.js';

/** Wave mutators — one random rule per wave (wave 5+). */
export const WAVE_MUTATORS = ['swarm', 'elites', 'volatile', 'encircle', 'rush'];

export const WAVE_MUTATOR_LABELS = {
    swarm: 'SWARM',
    elites: 'ELITES',
    volatile: 'VOLATILE',
    encircle: 'ENCIRCLE',
    rush: 'RUSH'
};

const FAST_CLEAR_THRESHOLD_MS = 15000;
const MUTATOR_MIN_WAVE = 5;

/**
 * Shorter breaks as waves climb; bonus for fast clears and rush mutators.
 */
export function getWaveBreakDuration(wave, { fastClear = false, rushActive = false } = {}) {
    let duration = Math.max(800, WAVE_BREAK_DURATION - wave * 120);
    if (fastClear) duration = Math.floor(duration * 0.6);
    if (rushActive) duration = Math.max(400, Math.floor(duration * 0.5));
    return duration;
}

export function wasFastWaveClear(waveStartTime) {
    if (!waveStartTime) return false;
    return (Date.now() - waveStartTime) < FAST_CLEAR_THRESHOLD_MS;
}

/** Roll a mutator for the incoming wave; null before wave 5. */
export function rollWaveMutator(wave) {
    if (wave < MUTATOR_MIN_WAVE) return null;
    return WAVE_MUTATORS[Math.floor(Math.random() * WAVE_MUTATORS.length)];
}

export function applyMutatorToCount(count, mutator) {
    if (mutator === 'swarm') return Math.floor(count * 1.4);
    if (mutator === 'rush') return Math.floor(count * 1.15);
    return count;
}

/** Stagger ms between spawn groups; shrinks as waves progress. */
export function getSpawnStaggerMs(wave, mutator) {
    let stagger = Math.max(80, 500 - wave * 25);
    if (mutator === 'rush') stagger = Math.floor(stagger * 0.35);
    else if (mutator === 'swarm') stagger = Math.floor(stagger * 0.7);
    return stagger;
}

/** Pack size for burst spawns at higher waves. */
export function getSpawnPackSize(wave) {
    if (wave >= 15) return 4;
    if (wave >= 10) return 3;
    if (wave >= 6) return 2;
    return 1;
}

export function shouldShowSpawnIndicator(wave, mutator) {
    return wave < 8 && mutator !== 'rush';
}

export function getIndicatorLeadMs(wave, mutator) {
    if (!shouldShowSpawnIndicator(wave, mutator)) return 0;
    return wave >= 5 ? 500 : 800;
}

/**
 * Compute spawn delay for zombie index.
 * @returns {{ indicatorDelay: number, spawnDelay: number, showIndicator: boolean }}
 */
export function getSpawnTiming(wave, mutator, index) {
    const stagger = getSpawnStaggerMs(wave, mutator);
    const packSize = getSpawnPackSize(wave);
    const groupIndex = Math.floor(index / packSize);
    const packOffset = (index % packSize) * 30;
    const indicatorDelay = groupIndex * stagger + packOffset;
    const showIndicator = shouldShowSpawnIndicator(wave, mutator);
    const indicatorLead = getIndicatorLeadMs(wave, mutator);
    const spawnDelay = indicatorDelay + (showIndicator ? indicatorLead : 0);
    return { indicatorDelay, spawnDelay, showIndicator };
}

/**
 * Pick zombie class with optional mutator bias.
 */
export function selectZombieClass(wave, mutator, rand) {
    if (mutator === 'elites') {
        const slot = Math.floor(rand * 4);
        if (slot === 0 && wave >= 3) return 'fast';
        if (slot === 1 && wave >= 3) return 'armored';
        if (slot === 2 && wave >= 5) return 'exploding';
        if (slot === 3 && wave >= 6) return 'spitter';
    }

    const volatileBoost = mutator === 'volatile' ? 0.12 : 0;

    if (wave >= 3 && rand < 0.15) return 'fast';
    if (wave >= 5 && rand >= 0.15 && rand < 0.25 + volatileBoost) return 'exploding';
    if (wave >= 4 && rand >= 0.25 && rand < 0.35) return 'ghost';
    if (wave >= 6 && rand >= 0.35 && rand < 0.43) return 'spitter';
    if (wave >= 5 && rand >= 0.43 && rand < 0.58) return 'flying';
    if (wave >= 4 && rand >= 0.58 && rand < 0.66 + volatileBoost) return 'crawler';
    if (wave >= 1 && rand >= 0.66 && rand < 0.73 + volatileBoost) return 'blight';
    if (wave >= 3 && rand >= 0.73) {
        const armoredChance = Math.min(0.1 + (wave - 3) * 0.03, 0.5);
        if (Math.random() < armoredChance) return 'armored';
    }
    return 'normal';
}

/** Encircle: alternate spawn groups from opposite sides. */
export function getEncircleSide(index, packSize) {
    const groupIndex = Math.floor(index / packSize);
    const pairIndex = groupIndex % 2;
    const withinGroup = index % packSize;
    const sides = pairIndex === 0 ? [0, 2] : [1, 3];
    return sides[withinGroup % 2];
}

export function applyMutatorHealth(zombie, mutator) {
    if (mutator === 'swarm') {
        zombie.health = Math.max(1, Math.floor(zombie.health * 0.8));
        if (zombie.maxHealth !== undefined) {
            zombie.maxHealth = Math.max(1, Math.floor(zombie.maxHealth * 0.8));
        }
    }
}

export function getBossMinionCount(wave) {
    return Math.min(Math.floor(wave / 2), 12);
}
