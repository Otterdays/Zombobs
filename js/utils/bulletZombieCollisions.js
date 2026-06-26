import { gameState } from '../core/gameState.js';
import { canvas } from '../core/canvas.js';
import { Quadtree } from './Quadtree.js';
import { compactArray } from './arrayUtils.js';
import { isSinglePlayerArcadeMode, checkZombieCollision } from './gameUtils.js';
import { playKillSound, playHitSound, playMultiplierUpSound, playMultiplierMaxSound } from '../systems/AudioSystem.js';
import { createBloodSplatter, createParticles } from '../systems/ParticleSystem.js';
import { DamageNumber } from '../entities/Particle.js';
import { Prop } from '../entities/Prop.js';
import { settingsManager } from '../systems/SettingsManager.js';
import { skillSystem } from '../systems/SkillSystem.js';
import { bloodSimulationSystem } from '../systems/BloodSimulationSystem.js';
import { pickupSpawnSystem } from '../systems/PickupSpawnSystem.js';
import {
    triggerExplosion,
    updateScoreMultiplier,
    awardScore,
    getZombieBaseScore
} from './combatUtils.js';

// Reusable Quadtree instance to avoid recreation every frame
let collisionQuadtree = null;
// Reusable query range object to avoid allocation per bullet
const queryRange = { x: 0, y: 0, width: 40, height: 40 };

function syncBulletCollisionQuadtree(isSinglePlayerArcade) {
    if (!collisionQuadtree) {
        if (isSinglePlayerArcade) {
            const worldSize = 100000;
            collisionQuadtree = new Quadtree({
                x: -worldSize / 2,
                y: -worldSize / 2,
                width: worldSize,
                height: worldSize
            }, 4);
        } else {
            collisionQuadtree = new Quadtree({ x: 0, y: 0, width: canvas.width, height: canvas.height }, 4);
        }
        collisionQuadtree.isArcade = isSinglePlayerArcade;
        return;
    }

    const needsUpdate =
        (collisionQuadtree.isArcade !== isSinglePlayerArcade) ||
        (!isSinglePlayerArcade && (collisionQuadtree.boundary.width !== canvas.width || collisionQuadtree.boundary.height !== canvas.height));

    if (needsUpdate) {
        collisionQuadtree.clear();
        if (isSinglePlayerArcade) {
            const worldSize = 100000;
            collisionQuadtree.boundary = {
                x: -worldSize / 2,
                y: -worldSize / 2,
                width: worldSize,
                height: worldSize
            };
        } else {
            collisionQuadtree.boundary = { x: 0, y: 0, width: canvas.width, height: canvas.height };
        }
        collisionQuadtree.isArcade = isSinglePlayerArcade;
    } else {
        collisionQuadtree.clear();
    }
}

function handleBulletPropCollision(bullet) {
    if (!gameState.props || gameState.props.length === 0) {
        return false;
    }

    for (let i = 0; i < gameState.props.length; i++) {
        const prop = gameState.props[i];
        if (prop.type !== 'explosiveBarrel' || prop.detonated) continue;

        const dx = bullet.x - prop.x;
        const dy = bullet.y - prop.y;
        const distSquared = dx * dx + dy * dy;
        const hitRadius = prop.radius + (bullet.radius || 2);
        if (distSquared >= hitRadius * hitRadius) continue;

        if (bullet.type === 'rocket') {
            const rocketPlayer = bullet.player || gameState.players[0];
            triggerExplosion(bullet.x, bullet.y, bullet.explosionRadius, bullet.explosionDamage, true, rocketPlayer, true);
            bullet.markedForRemoval = true;
        } else {
            prop.takeDamage(bullet.damage || 5, bullet);
            if (bullet.type !== 'flame' && bullet.type !== 'piercing') {
                bullet.markedForRemoval = true;
            }
        }
        return true;
    }

    return false;
}

export function handleBulletZombieCollisions() {
    // v0.8.1.2: In single player arcade mode, use world space bounds for Quadtree
    // In other modes, use canvas bounds (screen space)
    const isSinglePlayerArcade = isSinglePlayerArcadeMode(gameState);

    syncBulletCollisionQuadtree(isSinglePlayerArcade);

    // Insert all zombies into Quadtree
    for (let i = 0; i < gameState.zombies.length; i++) {
        collisionQuadtree.insert(gameState.zombies[i]);
    }

    for (let bulletIndex = 0; bulletIndex < gameState.bullets.length; bulletIndex++) {
        const bullet = gameState.bullets[bulletIndex];

        // Skip visual-only laser beams
        if (bullet.type === 'laser_visual') continue;
        if (bullet.markedForRemoval) continue;

        if (handleBulletPropCollision(bullet) || bullet.markedForRemoval) continue;

        // Reuse query range object (update properties instead of creating new object)
        queryRange.x = bullet.x - 20; // Arbitrary padding around bullet
        queryRange.y = bullet.y - 20;
        queryRange.width = 40;
        queryRange.height = 40;

        // Query potential collisions
        const candidates = collisionQuadtree.query(queryRange);

        for (let i = 0; i < candidates.length; i++) {
            const zombie = candidates[i];
            // Verify the zombie is still alive (might have been killed by another bullet in this same frame)
            // Although candidates are references to objects in gameState.zombies, 
            // if we splice from gameState.zombies, the reference is still valid but we need to ensure
            // we don't process a dead zombie if we handle death by setting health <= 0 before splicing.
            // However, we splice immediately. 
            // Problem: If a bullet kills a zombie, it's removed from gameState.zombies. 
            // But it's still in the local `candidates` list for *other* bullets?
            // No, we are inside the bullet loop. 
            // If bullet A kills zombie Z, zombie Z is removed from gameState.zombies.
            // But logic uses references. 

            // We need to check if zombie is still in gameState.zombies to be safe, 
            // or just check health > 0.
            if (zombie.health <= 0) continue;

            // Also checking if bullet is still active (it might have hit another zombie in spread?)
            // The bullet loop continues? No, we usually splice bullet on impact.
            if (bullet.hit) break; // Add a hit flag if we want to stop processing this bullet

            const zombieIndex = gameState.zombies.indexOf(zombie);
            if (zombieIndex === -1) continue; // Already removed

            const collisionResult = checkZombieCollision(bullet, zombie);
            if (collisionResult.hit) {
                // v0.8.3.5 Store headshot status for the kill reward
                const isHeadshot = collisionResult.isHeadshot;
                // Handle Rocket collisions FIRST (before marking as hit)
                if (bullet.type === 'rocket') {

                    const rocketPlayer = bullet.player || gameState.players[0];
                    triggerExplosion(bullet.x, bullet.y, bullet.explosionRadius, bullet.explosionDamage, true, rocketPlayer);
                    bullet.markedForRemoval = true;
                    break; // Stop processing this bullet, continue to next bullet
                }

                // Mark bullet as hit to prevent multiple collisions if it's not piercing
                // (Flamethrower is piercing-ish, handled separately)
                if (bullet.type !== 'flame' && bullet.type !== 'piercing') bullet.hit = true;

                // Get bullet angle for directional blood splatter
                const impactAngle = Math.atan2(bullet.vy, bullet.vx);

                // Store zombie position and type before damage (for exploding zombies)
                const zombieX = zombie.x;
                const zombieY = zombie.y;
                const isExploding = zombie.type === 'exploding';

                // Handle flame bullets (apply burn effect)
                if (bullet.type === 'flame') {
                    // Apply burn timer (3 seconds) and burn damage
                    zombie.burnTimer = 3000; // 3 seconds
                    zombie.burnDamage = bullet.damage * 2; // Double damage over time
                    // Also apply instant damage
                    if (zombie.takeDamage(bullet.damage)) {
                        // v0.8.3.5 Track headshot
                        if (isHeadshot) gameState.headshots++;
                        // Zombie dies from flame hit
                        // const zombieX = zombie.x; // Already stored
                        // const zombieY = zombie.y;
                        gameState.zombies.splice(zombieIndex, 1);
                        pickupSpawnSystem.tryDropScrapFromZombie(gameState, zombie, zombieX, zombieY);

                        if (zombie.type === 'boss' || zombie === gameState.boss) {
                            gameState.bossActive = false;
                            gameState.boss = null;
                        }

                        // Get the player who fired the bullet
                        const shootingPlayer = bullet.player || gameState.players[0];

                        // Increment consecutive kills
                        shootingPlayer.consecutiveKills++;

                        // Add bonus for boss zombies
                        if (zombie.type === 'boss' || zombie === gameState.boss) {
                            shootingPlayer.consecutiveKills += 2; // +3 total (1 base + 2 bonus)
                        }

                        // Store old multiplier to detect tier changes
                        const oldMultiplier = shootingPlayer.scoreMultiplier;
                        updateScoreMultiplier(shootingPlayer);

                        // Check for tier increase and trigger feedback
                        if (shootingPlayer.scoreMultiplier > oldMultiplier) {
                            // Tier increased - trigger audio and visual feedback
                            if (shootingPlayer.scoreMultiplier >= 5.0) {
                                playMultiplierMaxSound();
                            } else {
                                playMultiplierUpSound(shootingPlayer.scoreMultiplier);
                            }

                            // Show multiplier notification
                            gameState.damageNumbers.push(new DamageNumber(
                                shootingPlayer.x,
                                shootingPlayer.y - 40,
                                `${shootingPlayer.scoreMultiplier}x MULTIPLIER!`,
                                false,
                                '#ffd700'
                            ));
                        }

                        // Award score with multiplier
                        const baseScore = getZombieBaseScore(zombie);
                        const finalScore = awardScore(shootingPlayer, baseScore, zombie.type);

                        gameState.zombiesKilled++;

                        // Apply Bloodlust heal (2 HP per kill)
                        if (shootingPlayer.hasBloodlust) {
                            shootingPlayer.health = Math.min(shootingPlayer.maxHealth, shootingPlayer.health + 2);
                            const damageNumberStyle = settingsManager.getSetting('video', 'damageNumberStyle') || 'floating';
                            if (damageNumberStyle !== 'off') {
                                gameState.damageNumbers.push(new DamageNumber(shootingPlayer.x, shootingPlayer.y - 50, "+2 HP", false, '#00ff00'));
                            }
                        }

                        // Apply Adrenaline speed boost (20% for 3s after kill)
                        if (shootingPlayer.hasAdrenaline) {
                            shootingPlayer.adrenalineBoostEndTime = Date.now() + 3000; // 3 seconds
                            shootingPlayer.adrenalineBoostActive = true;
                        }

                        const now = Date.now();
                        if (now - gameState.lastKillTime < 1500) {
                            gameState.killStreak++;
                        } else {
                            gameState.killStreak = 1;
                        }
                        gameState.lastKillTime = now;

                        // Track max streak for session stats
                        if (gameState.killStreak > gameState.maxKillStreak) {
                            gameState.maxKillStreak = gameState.killStreak;
                        }

                        // Multi-kill detection (V0.7.1)
                        const zombieType = zombie.type || 'normal';
                        if (!gameState.recentKills) gameState.recentKills = [];
                        gameState.recentKills.push({ time: now, zombieType });
                        // Remove kills older than 500ms
                        gameState.recentKills = gameState.recentKills.filter(k => now - k.time < 500);

                        // Check for multi-kill (3+ kills in 0.5 seconds)
                        if (gameState.recentKills.length >= 3) {
                            const multiKillText = gameState.recentKills.length >= 5 ? "MEGA KILL!" : "MULTI KILL!";
                            gameState.damageNumbers.push(new DamageNumber(
                                zombieX,
                                zombieY - 60,
                                multiKillText,
                                false,
                                '#ff00ff', // Magenta for multi-kills
                                28 // Larger font size
                            ));
                        }

                        // Enhanced Kill Streak Visuals (V0.7.1)
                        if (gameState.killStreak > 2) {
                            let comboText = `${gameState.killStreak} HIT COMBO!`;
                            let textColor = '#ffffff';
                            let fontSize = 20;

                            // Enhanced visuals for high streaks
                            if (gameState.killStreak >= 20) {
                                comboText = "LEGENDARY STREAK!";
                                textColor = '#ffd700'; // Gold
                                fontSize = 32;
                            } else if (gameState.killStreak >= 15) {
                                comboText = "DOMINATING!";
                                textColor = '#ff6b00'; // Orange
                                fontSize = 28;
                            } else if (gameState.killStreak >= 10) {
                                comboText = "UNSTOPPABLE!";
                                textColor = '#ff1744'; // Red
                                fontSize = 26;
                            } else if (gameState.killStreak % 5 === 0) {
                                comboText = `${gameState.killStreak} KILL RAMPAGE!`;
                                textColor = '#ffc107'; // Amber
                                fontSize = 24;
                            }

                            gameState.damageNumbers.push(new DamageNumber(
                                zombieX,
                                zombieY - 30,
                                comboText,
                                false,
                                textColor,
                                fontSize
                            ));
                        }

                        playKillSound(zombieType);

                        // Show score with multiplier if active
                        if (shootingPlayer.scoreMultiplier > 1.0) {
                            gameState.damageNumbers.push(new DamageNumber(zombieX, zombieY, `+${finalScore} (${shootingPlayer.scoreMultiplier}x)`));
                        } else {
                            gameState.damageNumbers.push(new DamageNumber(zombieX, zombieY, `+${finalScore}`));
                        }

                        createBloodSplatter(zombieX, zombieY, impactAngle, true);
                        // Add volumetric blood on kill (more blood)
                        bloodSimulationSystem.addBlood(zombieX, zombieY, 0.8);
                    } else {
                        // Zombie survives but is burning
                        const damageNumberStyle = settingsManager.getSetting('video', 'damageNumberStyle') || 'floating';
                        if (damageNumberStyle !== 'off') {
                            gameState.damageNumbers.push(new DamageNumber(zombie.x, zombie.y, bullet.damage));
                        }
                        createBloodSplatter(zombie.x, zombie.y, impactAngle, false);
                        // Add volumetric blood on hit (less blood)
                        bloodSimulationSystem.addBlood(zombie.x, zombie.y, 0.3);

                        // Trigger hit marker
                        gameState.hitMarker.active = true;
                        gameState.hitMarker.life = gameState.hitMarker.maxLife;
                        playHitSound();
                    }

                    bullet.markedForRemoval = true;
                    break; // Flame bullet done, continue to next bullet
                }

                // Handle Piercing Bullets
                if (bullet.type === 'piercing') {
                    // Check if this zombie has already been hit by this bullet (to prevent multi-hit per frame)
                    if (!bullet.hitZombies) bullet.hitZombies = [];
                    if (bullet.hitZombies.includes(zombie)) continue;

                    bullet.hitZombies.push(zombie);
                    bullet.pierceCount--;
                    if (bullet.pierceCount <= 0) {
                        bullet.markedForRemoval = true;
                    }
                }

                // Get the player who fired the bullet
                const shootingPlayer = bullet.player || gameState.players[0];

                // Critical hit chance (base ~3.33%, plus player crit chance)
                const baseCritChance = 0.0333333333; // Reduced by 2/3 from 10%
                const playerCritChance = shootingPlayer.critChance || 0;
                const totalCritChance = Math.min(1.0, baseCritChance + playerCritChance);
                const isCrit = Math.random() < totalCritChance;

                // Lucky Strike chance (15% for double damage)
                const isLuckyStrike = shootingPlayer.luckyStrikeChance && Math.random() < shootingPlayer.luckyStrikeChance;

                let finalDamage = bullet.damage;
                if (isCrit) {
                    finalDamage = bullet.damage * 2; // 2x damage on crit
                } else if (isLuckyStrike) {
                    finalDamage = bullet.damage * 2; // 2x damage on lucky strike
                }

                // Check if zombie dies from this hit
                if (zombie.takeDamage(finalDamage)) {
                    // Clean up state tracking for dead zombie (multiplayer sync)
                    gameState.lastZombieState.delete(zombie.id);

                    // Remove zombie from array first
                    gameState.zombies.splice(zombieIndex, 1);
                    pickupSpawnSystem.tryDropScrapFromZombie(gameState, zombie, zombieX, zombieY);

                    // Handle Headshot Decapitation & Gore
                    if (isHeadshot) {
                        gameState.headshots++;
                        // Spawn bone particles (white/bone colored)
                        createParticles(zombieX, zombieY, '#e8e8e8', 12);
                        // Spray extra blood
                        createBloodSplatter(zombieX, zombieY, impactAngle, true);
                        bloodSimulationSystem.addBlood(zombieX, zombieY, 1.2);
                        
                        // Drop a decorative skull prop
                        const skullProp = new Prop(zombieX, zombieY, 'skull');
                        gameState.props.push(skullProp);

                        // Show golden "HEADSHOT ☠" popup
                        gameState.damageNumbers.push(new DamageNumber(zombieX, zombieY - 40, "HEADSHOT ☠", true, '#ffd700', 20));
                    }

                    // Check if boss was killed
                    if (zombie.type === 'boss' || zombie === gameState.boss) {
                        gameState.bossActive = false;
                        gameState.boss = null;
                    }

                    // Handle exploding zombie explosion (after removal to avoid array issues)
                    if (isExploding) {
                        triggerExplosion(zombieX, zombieY, 60, 30, false);
                    }

                    // Broadcast zombie death to other clients (leader only)
                    if (gameState.multiplayer.active && gameState.multiplayer.socket && gameState.multiplayer.isLeader) {
                        gameState.multiplayer.socket.emit('zombie:die', {
                            zombieId: zombie.id,
                            angle: impactAngle,
                            isExploding: isExploding
                        });
                    }

                    // Increment consecutive kills
                    shootingPlayer.consecutiveKills++;

                    // Add bonus for boss zombies
                    if (zombie.type === 'boss' || zombie === gameState.boss) {
                        shootingPlayer.consecutiveKills += 2; // +3 total (1 base + 2 bonus)
                    }

                    // Store old multiplier to detect tier changes
                    const oldMultiplier = shootingPlayer.scoreMultiplier;
                    updateScoreMultiplier(shootingPlayer);

                    // Check for tier increase and trigger feedback
                    if (shootingPlayer.scoreMultiplier > oldMultiplier) {
                        // Tier increased - trigger audio and visual feedback
                        if (shootingPlayer.scoreMultiplier >= 5.0) {
                            playMultiplierMaxSound();
                        } else {
                            playMultiplierUpSound(shootingPlayer.scoreMultiplier);
                        }

                        // Show multiplier notification
                        gameState.damageNumbers.push(new DamageNumber(
                            shootingPlayer.x,
                            shootingPlayer.y - 40,
                            `${shootingPlayer.scoreMultiplier}x MULTIPLIER!`,
                            false,
                            '#ffd700'
                        ));
                    }

                    // Award score with multiplier
                    const baseScore = getZombieBaseScore(zombie);
                    const finalScore = awardScore(shootingPlayer, baseScore, zombie.type);

                    gameState.zombiesKilled++;

                    // Apply Bloodlust heal (2 HP per kill)
                    if (shootingPlayer.hasBloodlust) {
                        shootingPlayer.health = Math.min(shootingPlayer.maxHealth, shootingPlayer.health + 2);
                        const damageNumberStyle = settingsManager.getSetting('video', 'damageNumberStyle') || 'floating';
                        if (damageNumberStyle !== 'off') {
                            gameState.damageNumbers.push(new DamageNumber(shootingPlayer.x, shootingPlayer.y - 50, "+2 HP", false, '#00ff00'));
                        }
                    }

                    // Apply Adrenaline speed boost (20% for 3s after kill)
                    if (shootingPlayer.hasAdrenaline) {
                        shootingPlayer.adrenalineBoostEndTime = Date.now() + 3000; // 3 seconds
                        shootingPlayer.adrenalineBoostActive = true;
                    }

                    // Award XP for kill (with multiplier)
                    const zombieType = zombie.type || 'normal';
                    let xpAmount = skillSystem.getXPForZombieType(zombieType);
                    xpAmount = Math.floor(xpAmount * shootingPlayer.scoreMultiplier);
                    // Show XP popup over player instead of zombie
                    skillSystem.gainXP(xpAmount, { x: shootingPlayer.x, y: shootingPlayer.y, streak: gameState.killStreak });

                    // Broadcast XP gain to other clients (leader only) - use multiplied amount
                    if (gameState.multiplayer.active && gameState.multiplayer.socket && gameState.multiplayer.isLeader) {
                        gameState.multiplayer.socket.emit('game:xp', xpAmount);
                    }

                    // Kill Streak Logic
                    const now = Date.now();
                    if (now - gameState.lastKillTime < 1500) {
                        gameState.killStreak++;
                    } else {
                        gameState.killStreak = 1;
                    }
                    gameState.lastKillTime = now;

                    // Track max streak for session stats
                    if (gameState.killStreak > gameState.maxKillStreak) {
                        gameState.maxKillStreak = gameState.killStreak;
                    }

                    // Multi-kill detection (V0.7.1)
                    // zombieType already declared above for XP calculation
                    if (!gameState.recentKills) gameState.recentKills = [];
                    gameState.recentKills.push({ time: now, zombieType });
                    // Remove kills older than 500ms
                    gameState.recentKills = gameState.recentKills.filter(k => now - k.time < 500);

                    // Check for multi-kill (3+ kills in 0.5 seconds)
                    if (gameState.recentKills.length >= 3) {
                        const damageNumberStyle = settingsManager.getSetting('video', 'damageNumberStyle') || 'floating';
                        if (damageNumberStyle !== 'off') {
                            const multiKillText = gameState.recentKills.length >= 5 ? "MEGA KILL!" : "MULTI KILL!";
                            gameState.damageNumbers.push(new DamageNumber(
                                zombieX,
                                zombieY - 60,
                                multiKillText,
                                false,
                                '#ff00ff', // Magenta for multi-kills
                                28 // Larger font size
                            ));
                        }
                    }

                    // Enhanced Kill Streak Visuals (V0.7.1)
                    if (gameState.killStreak > 2) {
                        let comboText = `${gameState.killStreak} HIT COMBO!`;
                        let textColor = '#ffffff';
                        let fontSize = 20;

                        // Enhanced visuals for high streaks
                        if (gameState.killStreak >= 20) {
                            comboText = "LEGENDARY STREAK!";
                            textColor = '#ffd700'; // Gold
                            fontSize = 32;
                        } else if (gameState.killStreak >= 15) {
                            comboText = "DOMINATING!";
                            textColor = '#ff6b00'; // Orange
                            fontSize = 28;
                        } else if (gameState.killStreak >= 10) {
                            comboText = "UNSTOPPABLE!";
                            textColor = '#ff1744'; // Red
                            fontSize = 26;
                        } else if (gameState.killStreak % 5 === 0) {
                            comboText = `${gameState.killStreak} KILL RAMPAGE!`;
                            textColor = '#ffc107'; // Amber
                            fontSize = 24;
                        }

                        const damageNumberStyle = settingsManager.getSetting('video', 'damageNumberStyle') || 'floating';
                        if (damageNumberStyle !== 'off') {
                            gameState.damageNumbers.push(new DamageNumber(
                                zombieX,
                                zombieY - 30,
                                comboText,
                                false,
                                textColor,
                                fontSize
                            ));
                        }
                    }

                    // Play kill confirmed sound with zombie type (unless it was exploding zombie, explosion sound plays)
                    if (!isExploding) {
                        playKillSound(zombieType);
                    }
                    // Create floating damage number (with crit styling if crit)
                    const damageNumberStyle = settingsManager.getSetting('video', 'damageNumberStyle') || 'floating';
                    if (damageNumberStyle !== 'off') {
                        if (isCrit) {
                            gameState.damageNumbers.push(new DamageNumber(zombieX, zombieY - 25, "CRIT!", true));
                        }

                        // Show score with multiplier if active
                        if (shootingPlayer.scoreMultiplier > 1.0) {
                            gameState.damageNumbers.push(new DamageNumber(zombieX, zombieY, `+${finalScore} (${shootingPlayer.scoreMultiplier}x)`, isCrit));
                        } else {
                            gameState.damageNumbers.push(new DamageNumber(zombieX, zombieY, `+${finalScore}`, isCrit));
                        }
                    }
                    // Create blood splatter on kill
                    createBloodSplatter(zombieX, zombieY, impactAngle, true);
                    // Add volumetric blood on kill (more blood)
                    bloodSimulationSystem.addBlood(zombieX, zombieY, 0.8);
                } else {
                    // Zombie survived - broadcast hit to other clients (leader only)
                    if (gameState.multiplayer.active && gameState.multiplayer.socket && gameState.multiplayer.isLeader) {
                        gameState.multiplayer.socket.emit('zombie:hit', {
                            zombieId: zombie.id,
                            newHealth: zombie.health,
                            angle: impactAngle
                        });
                    }

                    // Create floating damage number (with crit styling if crit)
                    const damageNumberStyle = settingsManager.getSetting('video', 'damageNumberStyle') || 'floating';
                    if (damageNumberStyle !== 'off') {
                        if (isCrit) {
                            gameState.damageNumbers.push(new DamageNumber(zombie.x, zombie.y, Math.floor(finalDamage), true));
                            gameState.damageNumbers.push(new DamageNumber(zombie.x, zombie.y - 25, "CRIT!", true));
                        } else {
                            gameState.damageNumbers.push(new DamageNumber(zombie.x, zombie.y, bullet.damage));
                        }
                    }
                    // Create blood splatter on hit (not kill)
                    createBloodSplatter(zombie.x, zombie.y, impactAngle, false);
                    // Add volumetric blood on hit (less blood)
                    bloodSimulationSystem.addBlood(zombie.x, zombie.y, 0.3);

                    // --- START: Apply Slow-on-Hit ---
                    if (zombie.originalSpeed === undefined) {
                        zombie.originalSpeed = zombie.speed;
                    }
                    zombie.speed = zombie.originalSpeed * 0.70; // 30% slow
                    zombie.slowedUntil = Date.now() + 500; // for 0.5 seconds
                    // --- END: Apply Slow-on-Hit ---
                }

                // Trigger hit marker
                gameState.hitMarker.active = true;
                gameState.hitMarker.life = gameState.hitMarker.maxLife;
                playHitSound();

                if (bullet.type !== 'piercing') {
                    bullet.markedForRemoval = true;
                }
            }
        }
    }

    // Remove marked bullets using in-place compaction (no array allocation)
    compactArray(gameState.bullets, b => !b.markedForRemoval);
}
