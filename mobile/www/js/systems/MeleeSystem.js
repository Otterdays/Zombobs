import { gameState } from '../core/gameState.js';
import { MELEE_RANGE, MELEE_DAMAGE, MELEE_COOLDOWN, TWO_PI } from '../core/constants.js';
import { playDamageSound, playKillSound } from '../systems/AudioSystem.js';
import { createBloodSplatter, createParticles } from '../systems/ParticleSystem.js';
import { triggerExplosion } from '../utils/combatUtils.js';
import { DamageNumber } from '../entities/Particle.js';
import { settingsManager } from './SettingsManager.js';
import { skillSystem } from './SkillSystem.js';

/**
 * MeleeSystem - Handles melee attack logic and range checking
 */
export class MeleeSystem {
    /**
     * Perform melee attack
     */
    performMeleeAttack(player) {
        player = player || gameState.players[0];
        const now = Date.now();

        // Check cooldown
        if (now - player.lastMeleeTime < MELEE_COOLDOWN) {
            return;
        }

        // Check if reloading
        if (player.isReloading) {
            return;
        }

        player.lastMeleeTime = now;

        // Create swipe animation (right to left)
        player.activeMeleeSwipe = {
            startTime: now,
            angle: player.angle,
            duration: 200 // MELEE_SWIPE_DURATION
        };

        // Play melee sound (using damage sound as placeholder)
        playDamageSound();

        // Check for zombies in melee range
        let hitCount = 0;
        gameState.zombies.forEach((zombie, zombieIndex) => {
            if (this.isInMeleeRange(zombie.x, zombie.y, zombie.radius, player.x, player.y, player.angle)) {
                const impactAngle = Math.atan2(zombie.y - player.y, zombie.x - player.x);

                // Store zombie position and type before damage (for exploding zombies)
                const zombieX = zombie.x;
                const zombieY = zombie.y;
                const isExploding = zombie.type === 'exploding';

                // Check if zombie dies
                if (zombie.takeDamage(MELEE_DAMAGE)) {
                    // Clean up state tracking for dead zombie (multiplayer sync)
                    gameState.lastZombieState.delete(zombie.id);
                    
                    // Remove zombie from array first
                    gameState.zombies.splice(zombieIndex, 1);

                    // Check if boss was killed
                    if (zombie.type === 'boss' || zombie === gameState.boss) {
                        gameState.bossActive = false;
                        gameState.boss = null;
                    }

                    // Handle exploding zombie explosion (after removal to avoid array issues)
                    if (isExploding) {
                        triggerExplosion(zombieX, zombieY, 60, 30, false);
                    }

                    gameState.score += 10;
                    gameState.zombiesKilled++;
                    // Award XP for kill (with multiplier)
                    const zombieType4 = zombie.type || 'normal';
                    let xpAmount4 = skillSystem.getXPForZombieType(zombieType4);
                    xpAmount4 = Math.floor(xpAmount4 * player.scoreMultiplier);
                    skillSystem.gainXP(xpAmount4);
                    // Play kill confirmed sound (unless it was exploding zombie, explosion sound plays)
                    if (!isExploding) {
                        playKillSound();
                    }
                    const damageNumberStyle = settingsManager.getSetting('video', 'damageNumberStyle') || 'floating';
                    if (damageNumberStyle !== 'off') {
                        gameState.damageNumbers.push(new DamageNumber(zombieX, zombieY, MELEE_DAMAGE));
                    }
                    createBloodSplatter(zombieX, zombieY, impactAngle, true);
                } else {
                    const damageNumberStyle = settingsManager.getSetting('video', 'damageNumberStyle') || 'floating';
                    if (damageNumberStyle !== 'off') {
                        gameState.damageNumbers.push(new DamageNumber(zombie.x, zombie.y, MELEE_DAMAGE));
                    }
                    createBloodSplatter(zombie.x, zombie.y, impactAngle, false);
                }
                hitCount++;
            }
        });

        // Screen shake on melee (stronger if hit something)
        if (hitCount > 0) {
            gameState.shakeAmount = 5;
            createParticles(player.x, player.y, '#ffaa00', 5);
        } else {
            gameState.shakeAmount = 2; // Light shake even on miss
        }

        // Send action to server for multiplayer synchronization
        if (gameState.isCoop && gameState.multiplayer.socket && gameState.multiplayer.socket.connected) {
            const isLocalPlayer = player.id === gameState.multiplayer.playerId;
            if (isLocalPlayer) {
                gameState.multiplayer.socket.emit('player:action', {
                    action: 'melee'
                });
            }
        }
    }

    /**
     * Check if zombie is in melee range
     */
    isInMeleeRange(zombieX, zombieY, zombieRadius, playerX, playerY, playerAngle) {
        const dx = zombieX - playerX;
        const dy = zombieY - playerY;
        const distSquared = dx * dx + dy * dy;

        // Generous close-range check (inside the "swing" arc origin or very close)
        // If zombie is practically touching the player, they get hit regardless of angle
        const closeRangeThreshold = 30 + (zombieRadius || 12);
        const closeRangeThresholdSquared = closeRangeThreshold * closeRangeThreshold;
        if (distSquared < closeRangeThresholdSquared) {
            // Check if they are somewhat in front (180 degree arc instead of 120)
            // or just hit them if they are really close
            if (distSquared < 25 * 25) return true; // Overlap check
        }

        const maxRange = MELEE_RANGE + (zombieRadius || 0);
        const maxRangeSquared = maxRange * maxRange;
        if (distSquared > maxRangeSquared) return false;
        
        // Calculate actual distance only when needed for angle check
        const distance = Math.sqrt(distSquared);

        // Check if zombie is in front arc (140 degree arc for wider coverage)
        const angleToZombie = Math.atan2(dy, dx);
        const angleDiff = Math.abs(angleToZombie - playerAngle);
        const normalizedAngleDiff = Math.min(angleDiff, TWO_PI - angleDiff);

        return normalizedAngleDiff < Math.PI * 0.4; // ~72 degrees on each side = 144 degree arc
    }
}

