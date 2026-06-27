import { gameState } from '../core/gameState.js';
import { canvas } from '../core/canvas.js';
import {
    WEAPONS, GRENADE_COOLDOWN, GRENADE_EXPLOSION_RADIUS, GRENADE_DAMAGE,
    HEALTH_PICKUP_SPAWN_INTERVAL, MAX_HEALTH_PICKUPS, PLAYER_MAX_HEALTH, HEALTH_PICKUP_HEAL_AMOUNT,
    AMMO_PICKUP_SPAWN_INTERVAL, MAX_AMMO_PICKUPS, AMMO_PICKUP_AMOUNT, MAX_GRENADES,
    ZOMBIE_BASE_SCORES, MAX_MOLOTOVS, MOLOTOV_COOLDOWN, SCRAP_VALUE
} from '../core/constants.js';
import { playGunshotSound, playKillSound, playDamageSound, playExplosionSound, playRocketFireSound, playHitSound, playMultiplierUpSound, playMultiplierMaxSound, playMultiplierLostSound } from '../systems/AudioSystem.js';
import { createExplosion, createBloodSplatter, createParticles, addParticle } from '../systems/ParticleSystem.js';
import { triggerMuzzleFlash, triggerDamageIndicator, checkCollision, checkZombieCollision, triggerWaveNotification } from './gameUtils.js';
import { Bullet, FlameBullet, PiercingBullet, Rocket, LaserBeam } from '../entities/Bullet.js';
import { Shell } from '../entities/Shell.js';
import { Grenade } from '../entities/Grenade.js';
import { Molotov } from '../entities/Molotov.js';
import { DamageNumber } from '../entities/Particle.js';
import { Prop } from '../entities/Prop.js';
import { settingsManager } from '../systems/SettingsManager.js';
import { skillSystem } from '../systems/SkillSystem.js';
import { bloodSimulationSystem } from '../systems/BloodSimulationSystem.js';
import { pickupSpawnSystem } from '../systems/PickupSpawnSystem.js';

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

    // Check fire rate cooldown (with rapid fire buff + skill fire rate)
    const fireRateMultiplier = (gameState.rapidFireEndTime > now) ? 0.5 : 1;
    const skillFireRate = player.fireRateSkillMultiplier || 1.0;
    if (now - player.lastShotTime < player.currentWeapon.fireRate * fireRateMultiplier * skillFireRate) {
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

    } else if (player.currentWeapon === WEAPONS.laser) {
        // Laser Logic (Instant Raycast)
        const range = player.currentWeapon.range || 800;
        const rayDirX = Math.cos(angle);
        const rayDirY = Math.sin(angle);

        let endX = gunX + rayDirX * range;
        let endY = gunY + rayDirY * range;
        let hitTarget = null;
        let hitType = null;
        let minDist = range;

        // Check all zombies for ray intersection
        for (const zombie of gameState.zombies) {
            if (zombie.health <= 0) continue;

            const dx = zombie.x - gunX;
            const dy = zombie.y - gunY;
            const t = dx * rayDirX + dy * rayDirY;

            if (t <= 0 || t > range) continue;

            const projX = gunX + rayDirX * t;
            const projY = gunY + rayDirY * t;
            const distSq = (zombie.x - projX) ** 2 + (zombie.y - projY) ** 2;
            const hitRadius = zombie.radius + 10;

            if (distSq < hitRadius * hitRadius) {
                if (t < minDist) {
                    minDist = t;
                    hitTarget = zombie;
                    hitType = 'zombie';
                }
            }
        }

        // Check all props for ray intersection
        for (const prop of gameState.props) {
            if (prop.type !== 'explosiveBarrel' || prop.detonated) continue;

            const dx = prop.x - gunX;
            const dy = prop.y - gunY;
            const t = dx * rayDirX + dy * rayDirY;

            if (t <= 0 || t > range) continue;

            const projX = gunX + rayDirX * t;
            const projY = gunY + rayDirY * t;
            const distSq = (prop.x - projX) ** 2 + (prop.y - projY) ** 2;
            const hitRadius = prop.radius + 10;

            if (distSq < hitRadius * hitRadius) {
                if (t < minDist) {
                    minDist = t;
                    hitTarget = prop;
                    hitType = 'prop';
                }
            }
        }

        if (hitTarget) {
            endX = gunX + rayDirX * minDist;
            endY = gunY + rayDirY * minDist;

            if (hitType === 'zombie') {
                // Create an invisible bullet at the hit point to trigger standard logic
                const logicBullet = new Bullet(hitTarget.x, hitTarget.y, angle, player.currentWeapon);
                logicBullet.type = 'laser_hit';
                logicBullet.damage *= damageMult;
                logicBullet.player = player;
                logicBullet.radius = hitTarget.radius + 5; // Ensure it overlaps
                gameState.bullets.push(logicBullet);
            } else if (hitType === 'prop') {
                // Apply damage directly to barrel
                hitTarget.takeDamage((player.currentWeapon.damage || 5) * damageMult, player);
            }
        }

        // Create visual beam
        const beam = new LaserBeam(gunX, gunY, angle, player.currentWeapon, endX, endY);
        gameState.bullets.push(beam);

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

    const activeThrowable = player.activeThrowable || 'grenade';
    const cooldown = activeThrowable === 'grenade' ? GRENADE_COOLDOWN : MOLOTOV_COOLDOWN;

    // Check cooldown
    if (now - player.lastGrenadeThrowTime < cooldown) {
        return;
    }

    // Check throwable count
    if (activeThrowable === 'grenade') {
        if (player.grenadeCount <= 0) return;
    } else {
        if (player.molotovCount <= 0) return;
    }

    // v0.8.1.2: In single player arcade mode, don't clamp target to canvas bounds
    const isSinglePlayerArcade = !gameState.isCoop && !gameState.multiplayer.active;

    // Calculate throw position (from player)
    const angle = Math.atan2(target.y - player.y, target.x - player.x);
    const throwX = player.x + Math.cos(angle) * player.radius * 1.5;
    const throwY = player.y + Math.sin(angle) * player.radius * 1.5;

    // Target is where the cursor/aim is
    let targetX, targetY;
    if (isSinglePlayerArcade) {
        targetX = target.x;
        targetY = target.y;
    } else {
        targetX = Math.max(20, Math.min(canvas.width - 20, target.x));
        targetY = Math.max(20, Math.min(canvas.height - 20, target.y));
    }

    if (activeThrowable === 'grenade') {
        gameState.grenades.push(new Grenade(throwX, throwY, targetX, targetY, player));
        player.grenadeCount--;
    } else {
        gameState.grenades.push(new Molotov(throwX, throwY, targetX, targetY, player));
        player.molotovCount--;
    }
    
    player.lastGrenadeThrowTime = now;

    // Small screen shake on throw
    gameState.shakeAmount = 2;

    // Send action to server for multiplayer synchronization
    if (gameState.isCoop && gameState.multiplayer.socket && gameState.multiplayer.socket.connected) {
        const isLocalPlayer = player.id === gameState.multiplayer.playerId;
        if (isLocalPlayer) {
            gameState.multiplayer.socket.emit('player:action', {
                action: 'grenade',
                throwableType: activeThrowable,
                x: player.x,
                y: player.y,
                angle: angle
            });
        }
    }
}

export function cycleThrowable(player) {
    player = player || gameState.players[0];
    const now = Date.now();
    if (now - player.lastThrowableCycleTime < 200) return; // Debounce

    player.activeThrowable = (player.activeThrowable || 'grenade') === 'grenade' ? 'molotov' : 'grenade';
    player.lastThrowableCycleTime = now;
    
    // Spawn visual indicator / effect trigger on HUD
    if (player === gameState.players[0]) {
        gameState.throwableCycleHUDTrigger = true;
    }
}

export function triggerExplosion(x, y, radius, damage, sourceIsPlayer = true, sourcePlayer = null, forcePlayerDamage = false) {


    // Safety check - ensure valid coordinates
    if (typeof x !== 'number' || typeof y !== 'number' || !isFinite(x) || !isFinite(y)) {
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

                const dropX = zombie.x;
                const dropY = zombie.y;
                gameState.zombies.splice(zombieIndex, 1);
                pickupSpawnSystem.tryDropScrapFromZombie(gameState, zombie, dropX, dropY);

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
                    // Show XP popup over player instead of zombie
                    skillSystem.gainXP(xpAmount1, { x: sourcePlayer.x, y: sourcePlayer.y, streak: gameState.killStreak });
                } else {
                    // Non-player kill (explosion, etc.) - show over zombie
                    skillSystem.gainXP(xpAmount1, { x: zombie.x, y: zombie.y, streak: gameState.killStreak });
                }
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

    // AOE damage to explosive barrels for chain reactions
    if (gameState.props && gameState.props.length > 0) {
        for (let i = 0; i < gameState.props.length; i++) {
            const prop = gameState.props[i];
            if (prop.type === 'explosiveBarrel' && !prop.detonated) {
                const dx = prop.x - x;
                const dy = prop.y - y;
                const distSquared = dx * dx + dy * dy;
                if (distSquared <= radiusSquared) {
                    const distance = Math.sqrt(distSquared);
                    const damageMultiplier = 1 - (distance / radius) * 0.5;
                    const finalDamage = Math.floor(damage * damageMultiplier);
                    prop.takeDamage(finalDamage, sourcePlayer);
                }
            }
        }
    }

    // Player damage if explosion is not from player, or if player damage is forced (e.g., barrel explosion)
    if (!sourceIsPlayer || forcePlayerDamage) {
        const radiusSquared = radius * radius;
        for (let i = 0; i < gameState.players.length; i++) {
            const player = gameState.players[i];
            if (player.health <= 0) continue; // Skip if dead

            const dx = player.x - x;
            const dy = player.y - y;
            const distSquared = dx * dx + dy * dy;

            if (distSquared <= radiusSquared) {
                if (player.isDodging) {
                    const now = Date.now();
                    if (!player.lastDodgePopupTime || now - player.lastDodgePopupTime > 200) {
                        player.lastDodgePopupTime = now;
                        const damageNumberStyle = settingsManager.getSetting('video', 'damageNumberStyle') || 'floating';
                        if (damageNumberStyle !== 'off') {
                            gameState.damageNumbers.push(new DamageNumber(player.x, player.y - 20, "DODGED!", false, '#00ffff'));
                        }
                    }
                    continue;
                }
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


export function handlePlayerZombieCollisions() {
    for (let i = 0; i < gameState.players.length; i++) {
        const player = gameState.players[i];
        if (player.health <= 0) continue;

        for (let j = 0; j < gameState.zombies.length; j++) {
            const zombie = gameState.zombies[j];
            if (checkCollision(player, zombie)) {
                if (player.isDodging) {
                    const now = Date.now();
                    if (!player.lastDodgePopupTime || now - player.lastDodgePopupTime > 200) {
                        player.lastDodgePopupTime = now;
                        const damageNumberStyle = settingsManager.getSetting('video', 'damageNumberStyle') || 'floating';
                        if (damageNumberStyle !== 'off') {
                            gameState.damageNumbers.push(new DamageNumber(player.x, player.y - 20, "DODGED!", false, '#00ffff'));
                        }
                    }
                    continue;
                }
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

                if (player.health <= 0 && trySecondWind(player)) {
                    const damageNumberStyle = settingsManager.getSetting('video', 'damageNumberStyle') || 'floating';
                    if (damageNumberStyle !== 'off') {
                        gameState.damageNumbers.push(new DamageNumber(
                            player.x, player.y - 30, 'SECOND WIND!', false, '#66bb6a', 18
                        ));
                    }
                    createParticles(player.x, player.y, '#66bb6a', 8);
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
                    gameState.pickupsCollected++;
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
                    gameState.pickupsCollected++;
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
                    gameState.pickupsCollected++;
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
                    gameState.pickupsCollected++;
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
                    gameState.pickupsCollected++;
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
                    gameState.pickupsCollected++;
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
                    gameState.pickupsCollected++;
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
                    gameState.pickupsCollected++;
                    break;
                }
            }
            return !collected;
        });
    }

    // Check scrap pickup collisions (magnetic + walk-over)
    if (gameState.scrapPickups.length > 0) {
        gameState.scrapPickups = gameState.scrapPickups.filter(scrap => {
            let collected = false;
            for (const player of gameState.players) {
                if (player.health <= 0) continue;
                if (checkCollision(player, scrap)) {
                    const scrapValue = scrap.value || SCRAP_VALUE;
                    const multiplier = player.scrapMultiplier || 1.0;
                    const gained = Math.floor(scrapValue * multiplier);
                    player.scrap = (player.scrap || 0) + gained;
                    gameState.scrapCollected += gained;
                    gameState.score += gained;
                    createParticles(scrap.x, scrap.y, '#cd9b6d', 8);
                    if (showFloatingText) {
                        gameState.damageNumbers.push(
                            new DamageNumber(scrap.x, scrap.y - 20, `+${gained} SCRAP`, false, '#ffd700')
                        );
                    }
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
            const healAmt = player.bloodlustHealAmount || 2;
            player.health = Math.min(player.maxHealth, player.health + healAmt);
        }

        // Apply Adrenaline speed boost after kill
        if (player.hasAdrenaline) {
            const duration = player.adrenalineDurationMs || 3000;
            player.adrenalineBoostEndTime = Date.now() + duration;
            player.adrenalineBoostActive = true;
        }

        pickupSpawnSystem.tryDropScrapFromZombie(gameState, zombie, zombie.x, zombie.y);

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
 * Applies tree/flat skill damage modifiers to a hit
 */
export function applySkillDamageModifiers(shootingPlayer, damage, zombie) {
    let d = damage * (shootingPlayer.damageSkillMultiplier || 1.0);
    if (shootingPlayer.hasExecutioner && zombie.maxHealth > 0) {
        if (zombie.health / zombie.maxHealth < 0.3) {
            d *= 1.5;
        }
    }
    if (shootingPlayer.hasBerserker && shootingPlayer.maxHealth > 0) {
        if (shootingPlayer.health / shootingPlayer.maxHealth < 0.3) {
            d *= 1.3;
        }
    }
    return d;
}

/**
 * Second Wind — survive fatal damage once at 50% HP
 * @returns {boolean} true if second wind triggered
 */
export function trySecondWind(player) {
    if (player.health > 0) return false;
    if (!player.hasSecondWind || player.secondWindUsed) return false;
    player.health = Math.floor(player.maxHealth * 0.5);
    player.secondWindUsed = true;
    return true;
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

// Phase 4b: bullet-zombie collision handler extracted to bulletZombieCollisions.js
export { handleBulletZombieCollisions } from './bulletZombieCollisions.js';
