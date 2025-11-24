import { gameState } from '../core/gameState.js';
import { canvas } from '../core/canvas.js';
import { Quadtree } from './Quadtree.js';
import {
    WEAPONS, GRENADE_COOLDOWN, GRENADE_EXPLOSION_RADIUS, GRENADE_DAMAGE,
    HEALTH_PICKUP_SPAWN_INTERVAL, MAX_HEALTH_PICKUPS, PLAYER_MAX_HEALTH, HEALTH_PICKUP_HEAL_AMOUNT,
    AMMO_PICKUP_SPAWN_INTERVAL, MAX_AMMO_PICKUPS, AMMO_PICKUP_AMOUNT, MAX_GRENADES,
    ZOMBIE_BASE_SCORES
} from '../core/constants.js';
import { playGunshotSound, playKillSound, playDamageSound, playExplosionSound, playRocketFireSound, playHitSound, playMultiplierUpSound, playMultiplierMaxSound, playMultiplierLostSound } from '../systems/AudioSystem.js';
import { createExplosion, createBloodSplatter, createParticles, addParticle } from '../systems/ParticleSystem.js';
import { triggerMuzzleFlash, triggerDamageIndicator, checkCollision, triggerWaveNotification } from './gameUtils.js';
import { Bullet, FlameBullet, PiercingBullet, Rocket } from '../entities/Bullet.js';
import { Shell } from '../entities/Shell.js';
import { Grenade } from '../entities/Grenade.js';
import { DamageNumber } from '../entities/Particle.js';
import { settingsManager } from '../systems/SettingsManager.js';
import { skillSystem } from '../systems/SkillSystem.js';

// Reusable Quadtree instance to avoid recreation every frame
let collisionQuadtree = null;
// Reusable query range object to avoid allocation per bullet
const queryRange = { x: 0, y: 0, width: 40, height: 40 };

export function shootBullet(target, canvas, player) {
    // Fallback to p1 for backward compat if player not provided
    player = player || gameState.players[0];

    const now = Date.now();

    // Check if reloading
    if (player.isReloading) {
        const reloadMultiplier = player.reloadSpeedMultiplier || 1.0;
        const adjustedReloadTime = player.currentWeapon.reloadTime * reloadMultiplier;
        if (now - player.reloadStartTime >= adjustedReloadTime) {
            player.isReloading = false;
            // Apply ammo multiplier (from Hoarder skill) when reloading
            const ammoMultiplier = player.ammoMultiplier || 1.0;
            player.maxAmmo = Math.floor(player.currentWeapon.maxAmmo * ammoMultiplier);
            player.currentAmmo = player.maxAmmo;
            // Update weapon state with reloaded ammo
            const weaponKeys = Object.keys(WEAPONS);
            const currentWeaponKey = weaponKeys.find(key => WEAPONS[key] === player.currentWeapon);
            if (currentWeaponKey && player.weaponStates[currentWeaponKey]) {
                player.weaponStates[currentWeaponKey].ammo = player.currentAmmo;
            }
        } else {
            return; // Still reloading
        }
    }

    // Check fire rate cooldown (with rapid fire buff)
    const fireRateMultiplier = (gameState.rapidFireEndTime > now) ? 0.5 : 1;
    if (now - player.lastShotTime < player.currentWeapon.fireRate * fireRateMultiplier) {
        return;
    }

    // Check ammo
    if (player.currentAmmo <= 0) {
        reloadWeapon(player);
        return;
    }

    // Calculate damage multiplier
    const damageMult = (gameState.damageBuffEndTime > now) ? 2 : 1;

    const angle = Math.atan2(target.y - player.y, target.x - player.x);
    const gunX = player.x + Math.cos(angle) * player.radius * 1.8;
    const gunY = player.y + Math.sin(angle) * player.radius * 1.8;

    // Apply Steady Aim spread reduction (30% less spread)
    const spreadReduction = player.bulletSpreadReduction || 1.0;

    // Apply Long Range multiplier (20% increased range)
    const rangeMultiplier = player.bulletRangeMultiplier || 1.0;

    // Create bullets based on weapon type
    if (player.currentWeapon === WEAPONS.shotgun) {
        // Shotgun fires 5 spread bullets
        for (let i = 0; i < 5; i++) {
            const spreadAngle = angle + (Math.random() - 0.5) * 0.5 * spreadReduction; // Add spread with reduction
            const bullet = new Bullet(gunX, gunY, spreadAngle, player.currentWeapon);
            bullet.damage *= damageMult;
            bullet.maxDistance *= rangeMultiplier; // Apply range multiplier
            bullet.player = player; // Track which player fired this bullet
            gameState.bullets.push(bullet);
        }
    } else if (player.currentWeapon === WEAPONS.flamethrower) {
        // Flamethrower fires multiple flame particles with spread
        const flameCount = 3; // Fire 3 flame particles per shot
        for (let i = 0; i < flameCount; i++) {
            const spreadAngle = angle + (Math.random() - 0.5) * 0.4 * spreadReduction; // Wider spread with reduction
            const flame = new FlameBullet(gunX, gunY, spreadAngle, player.currentWeapon);
            flame.damage *= damageMult;
            flame.maxDistance *= rangeMultiplier; // Apply range multiplier
            flame.player = player; // Track which player fired this bullet
            gameState.bullets.push(flame);
        }
    } else if (player.currentWeapon === WEAPONS.smg) {
        // SMG fires single bullet with slight spread
        const spreadAngle = angle + (Math.random() - 0.5) * 0.1 * spreadReduction;
        const bullet = new Bullet(gunX, gunY, spreadAngle, player.currentWeapon);
        bullet.damage *= damageMult;
        bullet.maxDistance *= rangeMultiplier; // Apply range multiplier
        bullet.player = player; // Track which player fired this bullet
        gameState.bullets.push(bullet);
    } else if (player.currentWeapon === WEAPONS.sniper) {
        // Sniper fires piercing bullet
        const bullet = new PiercingBullet(gunX, gunY, angle, player.currentWeapon);
        bullet.damage *= damageMult;
        bullet.maxDistance *= rangeMultiplier; // Apply range multiplier
        bullet.player = player; // Track which player fired this bullet
        gameState.bullets.push(bullet);
    } else if (player.currentWeapon === WEAPONS.rocketLauncher) {
        // Rocket Launcher fires rocket

        const rocket = new Rocket(gunX, gunY, angle, player.currentWeapon);

        rocket.damage *= damageMult; // Direct hit damage (if any)
        rocket.maxDistance *= rangeMultiplier; // Apply range multiplier
        rocket.player = player; // Track which player fired this bullet
        gameState.bullets.push(rocket);

    } else {
        // Pistol and rifle fire single bullet
        const bullet = new Bullet(gunX, gunY, angle, player.currentWeapon);
        bullet.damage *= damageMult;
        bullet.maxDistance *= rangeMultiplier; // Apply range multiplier
        bullet.player = player; // Track which player fired this bullet
        gameState.bullets.push(bullet);
    }

    // Consume ammo
    player.currentAmmo--;

    // Auto-reload if ammo is empty after this shot
    if (player.currentAmmo === 0) {
        reloadWeapon(player);
    }

    // Update last shot time
    player.lastShotTime = now;

    // Add screen shake on shoot (global effect, maybe reduce if P2 shoots?)
    gameState.shakeAmount = 3;

    // Trigger muzzle flash on THIS player
    // Refactored triggerMuzzleFlash to handle player object directly if needed, 
    // or we just set properties here manually since triggerMuzzleFlash might be hardcoded to global state.
    // Let's inline the muzzle flash logic or update triggerMuzzleFlash.
    // Since triggerMuzzleFlash is imported from gameUtils, let's just update the player's state directly.
    player.muzzleFlash.active = true;
    player.muzzleFlash.x = gunX;
    player.muzzleFlash.y = gunY;
    player.muzzleFlash.angle = angle;
    player.muzzleFlash.life = player.muzzleFlash.maxLife;
    player.muzzleFlash.intensity = 1;

    // Create shell casing (not for rockets)
    if (player.currentWeapon !== WEAPONS.rocketLauncher) {
        gameState.shells.push(new Shell(gunX, gunY, angle));
    }

    // Play weapon-specific sound
    if (player.currentWeapon === WEAPONS.rocketLauncher) {
        playRocketFireSound();
    } else {
        playGunshotSound();
    }

    // Send action to server for multiplayer synchronization
    if (gameState.isCoop && gameState.multiplayer.socket && gameState.multiplayer.socket.connected) {
        const isLocalPlayer = player.id === gameState.multiplayer.playerId;
        if (isLocalPlayer) {
            gameState.multiplayer.socket.emit('player:action', {
                action: 'shoot',
                x: player.x,
                y: player.y,
                angle: angle
            });
        }
    }
}

export function reloadWeapon(player) {
    player = player || gameState.players[0];
    // Apply ammo multiplier (from Hoarder skill) for reload check
    const ammoMultiplier = player.ammoMultiplier || 1.0;
    const maxAmmoWithMultiplier = Math.floor(player.currentWeapon.maxAmmo * ammoMultiplier);
    if (!player.isReloading && player.currentAmmo < maxAmmoWithMultiplier) {
        player.isReloading = true;
        player.reloadStartTime = Date.now();
        // Play reload sound if implemented

        // Send action to server for multiplayer synchronization
        if (gameState.isCoop && gameState.multiplayer.socket && gameState.multiplayer.socket.connected) {
            const isLocalPlayer = player.id === gameState.multiplayer.playerId;
            if (isLocalPlayer) {
                gameState.multiplayer.socket.emit('player:action', {
                    action: 'reload'
                });
            }
        }
    }
}

export function switchWeapon(weapon, player) {
    player = player || gameState.players[0];
    if (weapon !== player.currentWeapon) {
        const now = Date.now();

        // Find the current weapon key to save its state
        const weaponKeys = Object.keys(WEAPONS);
        const currentWeaponKey = weaponKeys.find(key => WEAPONS[key] === player.currentWeapon);

        // Save current weapon's ammo state before switching
        if (currentWeaponKey && player.weaponStates[currentWeaponKey]) {
            player.weaponStates[currentWeaponKey].ammo = player.currentAmmo;
            player.weaponStates[currentWeaponKey].lastHolsteredTime = now;
        }

        // Find the new weapon key
        const newWeaponKey = weaponKeys.find(key => WEAPONS[key] === weapon);

        // Switch to new weapon
        player.currentWeapon = weapon;

        // Trigger weapon switch flash animation (V0.7.1)
        gameState.weaponSwitchFlash = {
            active: true,
            startTime: now,
            duration: 150, // 150ms flash
            weapon: weapon
        };

        // Apply ammo multiplier (from Hoarder skill) to max ammo
        const ammoMultiplier = player.ammoMultiplier || 1.0;
        player.maxAmmo = Math.floor(player.currentWeapon.maxAmmo * ammoMultiplier);

        player.lastShotTime = 0; // Reset fire rate cooldown
        player.isReloading = false; // Cancel any ongoing reload

        // Check if the new weapon was holstered long enough for background reload
        if (newWeaponKey && player.weaponStates[newWeaponKey]) {
            const weaponState = player.weaponStates[newWeaponKey];
            const timeHolstered = now - weaponState.lastHolsteredTime;

            // If weapon was holstered for longer than reload time, it auto-reloaded
            if (timeHolstered >= weapon.reloadTime && weaponState.lastHolsteredTime > 0) {
                // Use multiplied maxAmmo for background reload
                player.currentAmmo = player.maxAmmo;
            } else {
                // Restore saved ammo state, but cap at multiplied maxAmmo
                player.currentAmmo = Math.min(weaponState.ammo, player.maxAmmo);
            }
        } else {
            // Fallback: initialize with weapon's default ammo (with multiplier applied)
            player.currentAmmo = Math.floor(weapon.ammo * ammoMultiplier);
        }

        // Send action to server for multiplayer synchronization
        if (gameState.isCoop && gameState.multiplayer.socket && gameState.multiplayer.socket.connected) {
            const isLocalPlayer = player.id === gameState.multiplayer.playerId;
            if (isLocalPlayer) {
                const weaponKeys = Object.keys(WEAPONS);
                const newWeaponKey = weaponKeys.find(key => WEAPONS[key] === weapon);
                gameState.multiplayer.socket.emit('player:action', {
                    action: 'switchWeapon',
                    weaponName: newWeaponKey
                });
            }
        }
    }
}

export function throwGrenade(target, canvas, player) {
    player = player || gameState.players[0];
    const now = Date.now();

    // Check cooldown
    if (now - player.lastGrenadeThrowTime < GRENADE_COOLDOWN) {
        return;
    }

    // Check grenade count
    if (player.grenadeCount <= 0) {
        return;
    }

    // v0.8.1.2: In single player arcade mode, don't clamp target to canvas bounds
    const isSinglePlayerArcade = !gameState.isCoop && !gameState.multiplayer.active;

    // Calculate throw position (from player)
    const angle = Math.atan2(target.y - player.y, target.x - player.x);
    const throwX = player.x + Math.cos(angle) * player.radius * 1.5;
    const throwY = player.y + Math.sin(angle) * player.radius * 1.5;

    // Target is where the cursor/aim is
    // In single player arcade mode, use world space coordinates directly
    // In other modes, clamp to canvas bounds
    let targetX, targetY;
    if (isSinglePlayerArcade) {
        targetX = target.x;
        targetY = target.y;
    } else {
        targetX = Math.max(20, Math.min(canvas.width - 20, target.x));
        targetY = Math.max(20, Math.min(canvas.height - 20, target.y));
    }

    gameState.grenades.push(new Grenade(throwX, throwY, targetX, targetY, player));
    player.grenadeCount--;
    player.lastGrenadeThrowTime = now;

    // Small screen shake on throw
    gameState.shakeAmount = 2;

    // Send action to server for multiplayer synchronization
    if (gameState.isCoop && gameState.multiplayer.socket && gameState.multiplayer.socket.connected) {
        const isLocalPlayer = player.id === gameState.multiplayer.playerId;
        if (isLocalPlayer) {
            gameState.multiplayer.socket.emit('player:action', {
                action: 'grenade',
                x: player.x,
                y: player.y,
                angle: angle
            });
        }
    }
}

export function triggerExplosion(x, y, radius, damage, sourceIsPlayer = true, sourcePlayer = null) {


    // Safety check - ensure valid coordinates
    if (typeof x !== 'number' || typeof y !== 'number' || !isFinite(x) || !isFinite(y)) {
        console.warn('triggerExplosion called with invalid coordinates:', x, y);
        return;
    }

    // Calculate explosion size based on radius
    // Grenade radius is 80, rocket is 150
    // Normalize: grenade = 1.0, rocket = 1.875 (150/80)
    const explosionSize = radius / 80; // Normalize to grenade size (80px)



    // Create explosion visual effect with size parameter
    try {
        createExplosion(x, y, explosionSize);

    } catch (e) {
        console.error('Error creating explosion:', e);
    }

    // Default to player 1 if no source player specified
    if (!sourcePlayer) {
        sourcePlayer = gameState.players[0];
    }

    // Screen shake (more intense for larger explosions)
    gameState.shakeAmount = 15 * Math.min(explosionSize, 1.5);

    // Play explosion sound with size parameter
    playExplosionSound(explosionSize);

    // AOE damage to zombies
    const radiusSquared = radius * radius;
    for (let zombieIndex = gameState.zombies.length - 1; zombieIndex >= 0; zombieIndex--) {
        const zombie = gameState.zombies[zombieIndex];
        const dx = zombie.x - x;
        const dy = zombie.y - y;
        const distSquared = dx * dx + dy * dy;

        if (distSquared <= radiusSquared) {
            // Calculate actual distance only when needed for damage calculation
            const distance = Math.sqrt(distSquared);
            // Damage decreases with distance
            const damageMultiplier = 1 - (distance / radius) * 0.5; // 50% to 100% damage
            const finalDamage = Math.floor(damage * damageMultiplier);

            if (zombie.takeDamage(finalDamage)) {
                // Clean up state tracking for dead zombie (multiplayer sync)
                gameState.lastZombieState.delete(zombie.id);

                gameState.zombies.splice(zombieIndex, 1);

                // Check if boss was killed
                if (zombie.type === 'boss' || zombie === gameState.boss) {
                    gameState.bossActive = false;
                    gameState.boss = null;
                }

                // Award score with multiplier (only if explosion is from player)
                if (sourceIsPlayer && sourcePlayer) {
                    sourcePlayer.consecutiveKills++;

                    // Add bonus for boss zombies
                    if (zombie.type === 'boss' || zombie === gameState.boss) {
                        sourcePlayer.consecutiveKills += 2; // +3 total (1 base + 2 bonus)
                    }

                    updateScoreMultiplier(sourcePlayer);
                    const baseScore = getZombieBaseScore(zombie);
                    const finalScore = awardScore(sourcePlayer, baseScore, zombie.type);

                    // Create floating damage number for explosion kill
                    const damageNumberStyle = settingsManager.getSetting('video', 'damageNumberStyle') || 'floating';
                    if (damageNumberStyle !== 'off') {
                        // Show score with multiplier if active
                        if (sourcePlayer.scoreMultiplier > 1.0) {
                            gameState.damageNumbers.push(new DamageNumber(zombie.x, zombie.y, `+${finalScore} (${sourcePlayer.scoreMultiplier}x)`));
                        } else {
                            gameState.damageNumbers.push(new DamageNumber(zombie.x, zombie.y, `+${finalScore}`));
                        }
                    }
                }

                gameState.zombiesKilled++;
                // Award XP for kill (with multiplier if from player)
                const zombieType1 = zombie.type || 'normal';
                let xpAmount1 = skillSystem.getXPForZombieType(zombieType1);
                if (sourceIsPlayer && sourcePlayer) {
                    xpAmount1 = Math.floor(xpAmount1 * sourcePlayer.scoreMultiplier);
                }
                skillSystem.gainXP(xpAmount1);
                // Play kill confirmed sound
                playKillSound();
                createBloodSplatter(zombie.x, zombie.y, Math.atan2(dy, dx), true);
            } else {
                // Zombie survived - show damage number
                const damageNumberStyle = settingsManager.getSetting('video', 'damageNumberStyle') || 'floating';
                if (damageNumberStyle !== 'off') {
                    gameState.damageNumbers.push(new DamageNumber(zombie.x, zombie.y, finalDamage));
                }
                createBloodSplatter(zombie.x, zombie.y, Math.atan2(dy, dx), false);
            }
        }
    }

    // Player damage if explosion is not from player (e.g., exploding zombie)
    if (!sourceIsPlayer) {
        const radiusSquared = radius * radius;
        for (let i = 0; i < gameState.players.length; i++) {
            const player = gameState.players[i];
            if (player.health <= 0) continue;

            const dx = player.x - x;
            const dy = player.y - y;
            const distSquared = dx * dx + dy * dy;

            if (distSquared <= radiusSquared) {
                const distance = Math.sqrt(distSquared);
                const damageMultiplier = 1 - (distance / radius) * 0.5;
                const playerDamage = Math.floor(damage * damageMultiplier * 0.5); // Player takes 50% of explosion damage
                const previousHealth = player.health;

                player.health -= playerDamage;
                createParticles(player.x, player.y, '#ff0000', 5);

                // Reset multiplier if health was reduced
                if (player.health < previousHealth) {
                    resetMultiplier(player);
                }

                if (player === gameState.players[0]) { // Only trigger indicator for local player 1 primarily, or logic?
                    triggerDamageIndicator();
                }
                playDamageSound();
            }
        }
        if (gameState.shakeAmount < 12) gameState.shakeAmount = 12;
    }
}

// Collision handlers
export function handleBulletZombieCollisions() {
    // v0.8.1.2: In single player arcade mode, use world space bounds for Quadtree
    // In other modes, use canvas bounds (screen space)
    const isSinglePlayerArcade = !gameState.isCoop && !gameState.multiplayer.active;

    // Debug: Count rockets
    const rocketCount = gameState.bullets.filter(b => b.type === 'rocket').length;
    if (rocketCount > 0) {
        console.log('Rockets in bullets array:', rocketCount, 'Total bullets:', gameState.bullets.length);
    }

    // Reuse Quadtree instance instead of recreating every frame
    if (!collisionQuadtree) {
        if (isSinglePlayerArcade) {
            // Use a very large boundary for world space (covers entire possible world)
            // This allows collision detection to work anywhere in the world
            const worldSize = 100000; // Large enough to cover the entire explorable world
            collisionQuadtree = new Quadtree({
                x: -worldSize / 2,
                y: -worldSize / 2,
                width: worldSize,
                height: worldSize
            }, 4);
        } else {
            collisionQuadtree = new Quadtree({ x: 0, y: 0, width: canvas.width, height: canvas.height }, 4);
        }
    } else {
        // Only clear and update boundary if mode changed or canvas size changed (non-arcade)
        const currentIsArcade = isSinglePlayerArcade;
        const needsUpdate =
            (currentIsArcade && collisionQuadtree.boundary.width !== 100000) ||
            (!currentIsArcade && (collisionQuadtree.boundary.width !== canvas.width || collisionQuadtree.boundary.height !== canvas.height));

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
        } else {
            // Just clear the quadtree contents (zombies) but keep the structure
            collisionQuadtree.clear();
        }
    }

    // Insert all zombies into Quadtree
    for (let i = 0; i < gameState.zombies.length; i++) {
        collisionQuadtree.insert(gameState.zombies[i]);
    }

    for (let bulletIndex = 0; bulletIndex < gameState.bullets.length; bulletIndex++) {
        const bullet = gameState.bullets[bulletIndex];
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
            if (zombie.health <= 0) return;

            // Also checking if bullet is still active (it might have hit another zombie in spread?)
            // The bullet loop continues? No, we usually splice bullet on impact.
            if (bullet.hit) return; // Add a hit flag if we want to stop processing this bullet

            const zombieIndex = gameState.zombies.indexOf(zombie);
            if (zombieIndex === -1) return; // Already removed

            if (checkCollision(bullet, zombie)) {
                // Handle Rocket collisions FIRST (before marking as hit)
                if (bullet.type === 'rocket') {
                    console.log('Rocket collision detected!', bullet.x, bullet.y, bullet.explosionRadius);
                    const rocketPlayer = bullet.player || gameState.players[0];
                    triggerExplosion(bullet.x, bullet.y, bullet.explosionRadius, bullet.explosionDamage, true, rocketPlayer);
                    bullet.markedForRemoval = true;
                    return; // Stop processing this bullet
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
                        // Zombie dies from flame hit
                        // const zombieX = zombie.x; // Already stored
                        // const zombieY = zombie.y;
                        gameState.zombies.splice(zombieIndex, 1);

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
                    } else {
                        // Zombie survives but is burning
                        const damageNumberStyle = settingsManager.getSetting('video', 'damageNumberStyle') || 'floating';
                        if (damageNumberStyle !== 'off') {
                            gameState.damageNumbers.push(new DamageNumber(zombie.x, zombie.y, bullet.damage));
                        }
                        createBloodSplatter(zombie.x, zombie.y, impactAngle, false);

                        // Trigger hit marker
                        gameState.hitMarker.active = true;
                        gameState.hitMarker.life = gameState.hitMarker.maxLife;
                        playHitSound();
                    }

                    bullet.markedForRemoval = true;
                    return;
                }

                // Handle Piercing Bullets
                if (bullet.type === 'piercing') {
                    // Check if this zombie has already been hit by this bullet (to prevent multi-hit per frame)
                    if (!bullet.hitZombies) bullet.hitZombies = [];
                    if (bullet.hitZombies.includes(zombie)) return;

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
                    skillSystem.gainXP(xpAmount);

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

    // Remove marked bullets
    // We need to filter the main array
    // Since we can't easily replace the array in place if it's const (it's not, it's a prop of gameState), 
    // we can do:
    gameState.bullets = gameState.bullets.filter(b => !b.markedForRemoval);
}

export function handlePlayerZombieCollisions() {
    for (let i = 0; i < gameState.players.length; i++) {
        const player = gameState.players[i];
        if (player.health <= 0) continue;

        for (let j = 0; j < gameState.zombies.length; j++) {
            const zombie = gameState.zombies[j];
            if (checkCollision(player, zombie)) {
                let damage = 0.5;
                const previousHealth = player.health;

                // Apply Thick Skin damage reduction
                if (player.damageReduction !== undefined && player.damageReduction < 1.0) {
                    damage *= player.damageReduction;
                }

                // Apply damage to shield first, then health
                if (player.shield > 0) {
                    player.shield -= damage;
                    if (player.shield < 0) {
                        player.health += player.shield; // Apply overflow damage to health
                        player.shield = 0;
                    }
                    createParticles(player.x, player.y, '#03a9f4', 3); // Blue for shield hit
                } else {
                    player.health -= damage;
                    createParticles(player.x, player.y, '#ff0000', 3); // Red for health hit
                }

                // Reset multiplier if health was reduced (shield didn't fully absorb)
                if (player.health < previousHealth && player.shield === 0) {
                    resetMultiplier(player);
                }

                if (player === gameState.players[0]) {
                    // Add screen shake on damage (mostly for P1 or global)
                    gameState.shakeAmount = 8;
                    triggerDamageIndicator();
                }
                playDamageSound();
            }
        }
    }
}

export function handlePickupCollisions() {
    const showFloatingText = settingsManager.getSetting('video', 'floatingText') !== false;

    // Check player-health pickup collisions
    if (gameState.healthPickups.length > 0) {
        gameState.healthPickups = gameState.healthPickups.filter(pickup => {
            let collected = false;
            for (const player of gameState.players) {
                if (player.health < PLAYER_MAX_HEALTH && checkCollision(player, pickup)) {
                    player.health = Math.min(
                        PLAYER_MAX_HEALTH,
                        player.health + HEALTH_PICKUP_HEAL_AMOUNT
                    );
                    createParticles(pickup.x, pickup.y, '#ff1744', 8);
                    if (showFloatingText) {
                        gameState.damageNumbers.push(new DamageNumber(pickup.x, pickup.y - 20, `+${HEALTH_PICKUP_HEAL_AMOUNT} HP`, false, '#ff1744'));
                    }
                    collected = true;
                    break; // Only one player picks it up
                }
            }
            return !collected;
        });
    }

    // Check player-ammo pickup collisions
    if (gameState.ammoPickups.length > 0) {
        gameState.ammoPickups = gameState.ammoPickups.filter(pickup => {
            let collected = false;
            for (const player of gameState.players) {
                if ((player.currentAmmo < player.maxAmmo || player.grenadeCount < MAX_GRENADES) && checkCollision(player, pickup)) {
                    // Restore ammo for current weapon
                    player.currentAmmo = Math.min(player.maxAmmo, player.currentAmmo + AMMO_PICKUP_AMOUNT);
                    // Also refill grenades
                    player.grenadeCount = MAX_GRENADES;
                    createParticles(pickup.x, pickup.y, '#ff9800', 8);
                    if (showFloatingText) {
                        gameState.damageNumbers.push(new DamageNumber(pickup.x, pickup.y - 20, `+${AMMO_PICKUP_AMOUNT} AMMO`, false, '#00ffff'));
                    }
                    collected = true;
                    break;
                }
            }
            return !collected;
        });
    }

    // Check damage pickup collisions
    if (gameState.damagePickups.length > 0) {
        gameState.damagePickups = gameState.damagePickups.filter(pickup => {
            let collected = false;
            for (const player of gameState.players) {
                if (checkCollision(player, pickup)) {
                    gameState.damageBuffEndTime = Date.now() + 10000; // 10 seconds
                    gameState.damageNumbers.push(new DamageNumber(player.x, player.y - 40, "DOUBLE DAMAGE!"));
                    createParticles(pickup.x, pickup.y, '#9c27b0', 12);
                    collected = true;
                    break;
                }
            }
            return !collected;
        });
    }

    // Check nuke pickup collisions
    if (gameState.nukePickups.length > 0) {
        gameState.nukePickups = gameState.nukePickups.filter(pickup => {
            let collected = false;
            for (const player of gameState.players) {
                if (checkCollision(player, pickup)) {
                    triggerNuke(pickup.x, pickup.y);
                    createParticles(pickup.x, pickup.y, '#ffeb3b', 20);
                    collected = true;
                    break;
                }
            }
            return !collected;
        });
    }

    // Check speed pickup collisions
    if (gameState.speedPickups.length > 0) {
        gameState.speedPickups = gameState.speedPickups.filter(pickup => {
            let collected = false;
            for (const player of gameState.players) {
                if (checkCollision(player, pickup)) {
                    gameState.speedBoostEndTime = Date.now() + 8000; // 8 seconds
                    gameState.damageNumbers.push(new DamageNumber(player.x, player.y - 40, "SPEED BOOST!"));
                    createParticles(pickup.x, pickup.y, '#00bcd4', 12);
                    collected = true;
                    break;
                }
            }
            return !collected;
        });
    }

    // Check rapid fire pickup collisions
    if (gameState.rapidFirePickups.length > 0) {
        gameState.rapidFirePickups = gameState.rapidFirePickups.filter(pickup => {
            let collected = false;
            for (const player of gameState.players) {
                if (checkCollision(player, pickup)) {
                    gameState.rapidFireEndTime = Date.now() + 10000; // 10 seconds
                    gameState.damageNumbers.push(new DamageNumber(player.x, player.y - 40, "RAPID FIRE!"));
                    createParticles(pickup.x, pickup.y, '#ff9800', 12);
                    collected = true;
                    break;
                }
            }
            return !collected;
        });
    }

    // Check shield pickup collisions
    if (gameState.shieldPickups.length > 0) {
        gameState.shieldPickups = gameState.shieldPickups.filter(pickup => {
            let collected = false;
            for (const player of gameState.players) {
                if (checkCollision(player, pickup)) {
                    player.shield = Math.min(player.maxShield, player.shield + 50);
                    const damageNumberStyle = settingsManager.getSetting('video', 'damageNumberStyle') || 'floating';
                    if (damageNumberStyle !== 'off') {
                        gameState.damageNumbers.push(new DamageNumber(player.x, player.y - 40, "+50 SHIELD!"));
                    }
                    createParticles(pickup.x, pickup.y, '#03a9f4', 12);
                    collected = true;
                    break;
                }
            }
            return !collected;
        });
    }

    // Check adrenaline pickup collisions
    if (gameState.adrenalinePickups.length > 0) {
        gameState.adrenalinePickups = gameState.adrenalinePickups.filter(pickup => {
            let collected = false;
            for (const player of gameState.players) {
                if (checkCollision(player, pickup)) {
                    // Apply all three buffs: Speed + Reload Speed + Fire Rate
                    gameState.adrenalineEndTime = Date.now() + 12000; // 12 seconds
                    gameState.speedBoostEndTime = Math.max(gameState.speedBoostEndTime, Date.now() + 12000);
                    gameState.rapidFireEndTime = Math.max(gameState.rapidFireEndTime, Date.now() + 12000);
                    const damageNumberStyle = settingsManager.getSetting('video', 'damageNumberStyle') || 'floating';
                    if (damageNumberStyle !== 'off') {
                        gameState.damageNumbers.push(new DamageNumber(player.x, player.y - 40, "ADRENALINE RUSH!"));
                    }
                    createParticles(pickup.x, pickup.y, '#4caf50', 15);
                    collected = true;
                    break;
                }
            }
            return !collected;
        });
    }
}

function triggerNuke(x, y) {
    gameState.shakeAmount = 30;
    gameState.damageNumbers.push(new DamageNumber(x, y - 50, "TACTICAL NUKE!"));

    // Flash effect (simulated by white particles everywhere or just screen flash handled in draw)
    // We'll just kill everyone

    // Iterate backwards to safely remove
    for (let i = gameState.zombies.length - 1; i >= 0; i--) {
        const zombie = gameState.zombies[i];

        // Check if boss is being nuked
        if (zombie.type === 'boss' || zombie === gameState.boss) {
            gameState.bossActive = false;
            gameState.boss = null;
        }

        // Visuals (larger explosion for nuke)
        createExplosion(zombie.x, zombie.y, 1.5);

        // Award score with multiplier (to player 1 for nuke pickups)
        const player = gameState.players[0];
        player.consecutiveKills++;

        // Add bonus for boss zombies
        if (zombie.type === 'boss' || zombie === gameState.boss) {
            player.consecutiveKills += 2; // +3 total (1 base + 2 bonus)
        }

        updateScoreMultiplier(player);
        const baseScore = getZombieBaseScore(zombie);
        awardScore(player, baseScore, zombie.type);

        gameState.zombiesKilled++;

        // Apply Bloodlust heal (2 HP per kill)
        if (player.hasBloodlust) {
            player.health = Math.min(player.maxHealth, player.health + 2);
        }

        // Apply Adrenaline speed boost (20% for 3s after kill)
        if (player.hasAdrenaline) {
            player.adrenalineBoostEndTime = Date.now() + 3000; // 3 seconds
            player.adrenalineBoostActive = true;
        }

        // Remove
        gameState.zombies.splice(i, 1);
    }

    playExplosionSound(2.0); // Larger explosion sound for nuke
}

// Score Multiplier System

/**
 * Updates the player's score multiplier based on consecutive kills
 * @param {Object} player - The player object
 */
export function updateScoreMultiplier(player) {
    const kills = player.consecutiveKills;
    const thresholds = player.multiplierTierThresholds;

    // Determine multiplier tier based on kills
    if (kills >= thresholds[4]) {
        player.scoreMultiplier = 5.0;
    } else if (kills >= thresholds[3]) {
        player.scoreMultiplier = 4.0;
    } else if (kills >= thresholds[2]) {
        player.scoreMultiplier = 3.0;
    } else if (kills >= thresholds[1]) {
        player.scoreMultiplier = 2.0;
    } else {
        player.scoreMultiplier = 1.0;
    }

    // Track max multiplier this session
    if (player.scoreMultiplier > player.maxMultiplierThisSession) {
        player.maxMultiplierThisSession = player.scoreMultiplier;
    }
}

/**
 * Awards score with multiplier bonus
 * @param {Object} player - The player object
 * @param {number} baseScore - Base score for the kill
 * @param {string} zombieType - Type of zombie killed
 * @returns {number} Final score awarded
 */
export function awardScore(player, baseScore, zombieType) {
    const multipliedScore = Math.floor(baseScore * player.scoreMultiplier);
    gameState.score += multipliedScore;

    // Track bonus
    const bonus = multipliedScore - baseScore;
    player.totalMultiplierBonus += bonus;

    return multipliedScore;
}

/**
 * Resets the player's score multiplier to 1.0
 * @param {Object} player - The player object
 */
export function resetMultiplier(player) {
    // Only trigger feedback if multiplier was actually active
    const hadMultiplier = player.scoreMultiplier > 1.0;

    player.scoreMultiplier = 1.0;
    player.consecutiveKills = 0;

    // Trigger notification and audio if multiplier was lost
    if (hadMultiplier) {
        playMultiplierLostSound();

        // Show multiplier lost notification
        gameState.damageNumbers.push(new DamageNumber(
            player.x,
            player.y - 40,
            'MULTIPLIER LOST',
            false,
            '#ff1744'
        ));
    }
}

/**
 * Gets the base score for a zombie type
 * @param {Object} zombie - The zombie object
 * @returns {number} Base score value
 */
export function getZombieBaseScore(zombie) {
    // Determine zombie type
    if (zombie.isBoss) {
        return ZOMBIE_BASE_SCORES.boss;
    }

    // Check zombie class name or type property
    const zombieType = zombie.type || zombie.constructor.name.toLowerCase();

    if (zombieType.includes('fast')) {
        return ZOMBIE_BASE_SCORES.fast;
    } else if (zombieType.includes('armored')) {
        return ZOMBIE_BASE_SCORES.armored;
    } else if (zombieType.includes('exploding')) {
        return ZOMBIE_BASE_SCORES.exploding;
    } else if (zombieType.includes('ghost')) {
        return ZOMBIE_BASE_SCORES.ghost;
    } else if (zombieType.includes('spitter')) {
        return ZOMBIE_BASE_SCORES.spitter;
    } else {
        return ZOMBIE_BASE_SCORES.normal;
    }
}
