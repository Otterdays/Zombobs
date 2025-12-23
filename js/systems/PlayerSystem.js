import { gameState, createPlayer } from '../core/gameState.js';
import { canvas, ctx } from '../core/canvas.js';
import {
    PLAYER_BASE_SPEED, PLAYER_SPRINT_SPEED,
    PLAYER_STAMINA_MAX, PLAYER_STAMINA_DRAIN, PLAYER_STAMINA_REGEN, PLAYER_STAMINA_REGEN_DELAY,
    MAX_LOCAL_PLAYERS
} from '../core/constants.js';
import { settingsManager } from './SettingsManager.js';
import { graphicsSettings } from './GraphicsSystem.js';
import { inputSystem } from './InputSystem.js';
import { playFootstepSound } from '../systems/AudioSystem.js';
import { shootBullet, reloadWeapon, throwGrenade } from '../utils/combatUtils.js';
import { spawnParticle } from './ParticleSystem.js';
import { drawMeleeSwipe } from '../utils/drawingUtils.js';
import { cameraSystem } from './CameraSystem.js';
import { drawEnhancedPlayer, getPlayerDirection } from './PlayerRenderer.js';

/**
 * PlayerSystem - Handles player updates, rendering, and co-op lobby management
 */
export class PlayerSystem {
    constructor(companionSystem) {
        this.companionSystem = companionSystem;
    }

    /**
     * Update all players (movement, input, actions)
     */
    updatePlayers(keys, mouse, performMeleeAttackCallback, cycleWeaponCallback) {
        // Don't update player if main menu is showing
        if (gameState.showMainMenu || gameState.showCoopLobby || gameState.showLobby || gameState.showAILobby) return;

        // Get shared controls settings
        const controls = settingsManager.settings.controls;

        gameState.players.forEach((player, index) => {
            if (player.health <= 0) return;

            // Skip input handling for remote players - they're controlled by other clients
            if (player.inputSource === 'remote') {
                return; // Remote players are updated via socket events
            }

            let moveX = 0;
            let moveY = 0;
            let aimX = 0;
            let aimY = 0;
            let isSprintingInput = false;
            let target = { x: player.x + Math.cos(player.angle) * 100, y: player.y + Math.sin(player.angle) * 100 };

            // AI Player Controls
            if (player.inputSource === 'ai') {
                const aiMovement = this.companionSystem.update(player);
                moveX = aiMovement.moveX;
                moveY = aiMovement.moveY;
            }
            // Gamepad Controls (for any player using gamepad)
            else if (player.inputSource === 'gamepad' && player.gamepadIndex !== undefined && player.gamepadIndex !== null) {
                const gpState = inputSystem.getGamepad(player.gamepadIndex);
                if (gpState) {
                    moveX = gpState.axes.move.x;
                    moveY = gpState.axes.move.y;
                    if (Math.abs(gpState.axes.aim.x) > 0.1 || Math.abs(gpState.axes.aim.y) > 0.1) {
                        player.angle = Math.atan2(gpState.axes.aim.y, gpState.axes.aim.x);
                        target = {
                            x: player.x + gpState.axes.aim.x * 200,
                            y: player.y + gpState.axes.aim.y * 200
                        };
                    } else if (Math.abs(moveX) > 0.1 || Math.abs(moveY) > 0.1) {
                        // Aim in movement direction if no right stick
                        player.angle = Math.atan2(moveY, moveX);
                    }
                    if (gpState.buttons.sprint.pressed) isSprintingInput = true;
                }
            }
            // Mouse/Keyboard Controls (P1 only)
            else if (player.inputSource === 'mouse') {
                // Mouse/Keyboard
                if (keys[controls.moveUp]) moveY -= 1;
                if (keys[controls.moveDown]) moveY += 1;
                if (keys[controls.moveLeft]) moveX -= 1;
                if (keys[controls.moveRight]) moveX += 1;

                const sprintKey = controls.sprint || 'shift';
                if (keys[sprintKey] || keys['shift']) isSprintingInput = true;

                // v0.8.1.2: Convert mouse screen coordinates to world coordinates in single player arcade mode
                const isSinglePlayerArcade = !gameState.isCoop && !gameState.multiplayer.active;
                let mouseWorldX = mouse.x;
                let mouseWorldY = mouse.y;
                if (isSinglePlayerArcade) {
                    const worldPos = cameraSystem.screenToWorld(mouse.x, mouse.y);
                    mouseWorldX = worldPos.x;
                    mouseWorldY = worldPos.y;
                }

                target = { x: mouseWorldX, y: mouseWorldY };
                player.angle = Math.atan2(mouseWorldY - player.y, mouseWorldX - player.x);
            }
            // Keyboard Arrow Controls (P2 only, for backward compatibility)
            else if (index === 1 && player.inputSource === 'keyboard_arrow') {
                // Keyboard Arrows
                if (keys['arrowup']) moveY -= 1;
                if (keys['arrowdown']) moveY += 1;
                if (keys['arrowleft']) moveX -= 1;
                if (keys['arrowright']) moveX += 1;

                if (keys['control'] || keys['rcontrol']) isSprintingInput = true;

                if (Math.abs(moveX) > 0 || Math.abs(moveY) > 0) {
                    player.angle = Math.atan2(moveY, moveX);
                }
                target = {
                    x: player.x + Math.cos(player.angle) * 200,
                    y: player.y + Math.sin(player.angle) * 200
                };
            }

            // Normalize movement vector
            const len = Math.sqrt(moveX * moveX + moveY * moveY);
            if (len > 1) {
                moveX /= len;
                moveY /= len;
            }

            // Sprint Logic (with speed boost buff and skill multiplier)
            const speedBoostMultiplier = (gameState.speedBoostEndTime > Date.now()) ? 1.5 : 1;
            const skillSpeedMultiplier = player.speedMultiplier || 1.0;

            // Adrenaline boost (20% speed for 3s after kill)
            let adrenalineBoostMultiplier = 1.0;
            if (player.adrenalineBoostActive && player.adrenalineBoostEndTime && player.adrenalineBoostEndTime > Date.now()) {
                adrenalineBoostMultiplier = 1.2; // 20% speed boost
            } else if (player.adrenalineBoostActive && player.adrenalineBoostEndTime && player.adrenalineBoostEndTime <= Date.now()) {
                // Expire adrenaline boost
                player.adrenalineBoostActive = false;
                player.adrenalineBoostEndTime = null;
            }

            const totalSpeedMultiplier = speedBoostMultiplier * skillSpeedMultiplier * adrenalineBoostMultiplier;
            // autoSprint moved to gameplay, check both for migration safety or just gameplay
            const autoSprint = settingsManager.getSetting('gameplay', 'autoSprint') || false;

            // Auto-sprint: invert logic - sprint by default, hold shift to walk
            let shouldSprint = false;
            if (autoSprint) {
                // Sprint by default unless shift is held
                shouldSprint = !isSprintingInput && (Math.abs(moveX) > 0 || Math.abs(moveY) > 0);
            } else {
                // Normal: sprint only when shift is pressed
                shouldSprint = isSprintingInput;
            }

            if ((Math.abs(moveX) > 0 || Math.abs(moveY) > 0) && shouldSprint && player.stamina > 0) {
                player.isSprinting = true;
                player.speed = PLAYER_SPRINT_SPEED * totalSpeedMultiplier;
                player.stamina = Math.max(0, player.stamina - PLAYER_STAMINA_DRAIN);
                player.lastSprintTime = Date.now();
            } else {
                player.isSprinting = false;
                player.speed = PLAYER_BASE_SPEED * totalSpeedMultiplier;
                if (Date.now() - player.lastSprintTime > PLAYER_STAMINA_REGEN_DELAY) {
                    player.stamina = Math.min(player.maxStamina, player.stamina + PLAYER_STAMINA_REGEN);
                }
            }

            // Apply Position
            player.x += moveX * player.speed;
            player.y += moveY * player.speed;

            // Bounds (skip in single player arcade mode - camera system allows free movement)
            const isSinglePlayerArcade = !gameState.isCoop && !gameState.multiplayer.active;
            if (!isSinglePlayerArcade) {
                player.x = Math.max(player.radius, Math.min(canvas.width - player.radius, player.x));
                player.y = Math.max(player.radius, Math.min(canvas.height - player.radius, player.y));
            }

            // Footstep sounds (more frequent and louder when sprinting)
            if ((Math.abs(moveX) > 0 || Math.abs(moveY) > 0) && gameState.gameRunning && !gameState.gamePaused) {
                const currentTime = Date.now();
                // Sprinting: faster footsteps (130ms), Walking: normal footsteps (350ms)
                const footstepInterval = player.isSprinting ? 130 : 350;
                if (currentTime - gameState.lastFootstepTime >= footstepInterval) {
                    playFootstepSound(player.isSprinting);
                    gameState.lastFootstepTime = currentTime;
                }
            }

            // Handle Actions (Shooting, etc.)
            // P1 Actions (if mouse) handled in event listeners mostly, but gamepad actions here
            // P2 Actions

            // Gamepad Actions (For either player if using gamepad)
            if (player.inputSource === 'gamepad' && player.gamepadIndex !== undefined && player.gamepadIndex !== null) {
                const gpState = inputSystem.getGamepad(player.gamepadIndex);
                if (gpState) {
                    if (gpState.buttons.fire.pressed) shootBullet(target, canvas, player);
                    if (gpState.buttons.melee.justPressed) performMeleeAttackCallback(player);
                    if (gpState.buttons.reload.justPressed) reloadWeapon(player);
                    if (gpState.buttons.grenade.justPressed) throwGrenade(target, canvas, player);
                    if (gpState.buttons.prevWeapon.justPressed && cycleWeaponCallback) cycleWeaponCallback(-1, player);
                    if (gpState.buttons.nextWeapon.justPressed && cycleWeaponCallback) cycleWeaponCallback(1, player);
                }
            }

            // Keyboard Arrow Actions (Any player using keyboard_arrow input)
            if (player.inputSource === 'keyboard_arrow') {
                if (keys['enter']) shootBullet(target, canvas, player);
                if (keys['delete']) performMeleeAttackCallback(player);
                if (keys['end'] || keys[']'] || keys['\\']) reloadWeapon(player);
            }
        });
    }

    /**
     * Update co-op lobby (player joining/leaving)
     */
    updateCoopLobby(keys, mouse) {
        if (!gameState.showCoopLobby) return;

        inputSystem.update(); // Update inputs to check for joins
        const gamepads = inputSystem.getConnectedGamepadIndices();
        const p1 = gameState.players[0];

        // P1 Input Source Detection
        // If P1 moves mouse or presses keys, switch to mouse and release gamepad
        const hasMouseOrKeyboardInput = mouse.isDown || Object.keys(keys).some(k => keys[k] && !['enter', ']'].includes(k));
        if (hasMouseOrKeyboardInput) {
            if (p1.inputSource === 'gamepad') {
                p1.inputSource = 'mouse';
                p1.gamepadIndex = null;
            }
        }

        // P1 Controller Assignment
        // If P1 already has a gamepad assigned, stick with it
        if (p1.gamepadIndex !== undefined && p1.gamepadIndex !== null) {
            const p1Gp = inputSystem.getGamepad(p1.gamepadIndex);
            if (!p1Gp) {
                // Gamepad disconnected, switch to mouse
                p1.inputSource = 'mouse';
                p1.gamepadIndex = null;
            } else {
                // Verify it's still active (being used)
                const isActive = Math.abs(p1Gp.axes.move.x) > 0.3 || Math.abs(p1Gp.axes.move.y) > 0.3 ||
                    Math.abs(p1Gp.axes.aim.x) > 0.3 || Math.abs(p1Gp.axes.aim.y) > 0.3 ||
                    p1Gp.buttons.select.pressed || p1Gp.buttons.fire.pressed;
                if (isActive && !hasMouseOrKeyboardInput) {
                    p1.inputSource = 'gamepad';
                }
            }
        } else if (!hasMouseOrKeyboardInput) {
            // P1 doesn't have a gamepad yet - find first available one not used by other players
            for (const index of gamepads) {
                // Skip if this gamepad is already assigned to any player
                const isAssigned = gameState.players.some(p => p.gamepadIndex === index);
                if (isAssigned) continue;

                const gp = inputSystem.getGamepad(index);
                if (!gp) continue;

                // Check if this controller is being actively used
                const isActive = Math.abs(gp.axes.move.x) > 0.5 || Math.abs(gp.axes.move.y) > 0.5 ||
                    Math.abs(gp.axes.aim.x) > 0.3 || Math.abs(gp.axes.aim.y) > 0.3 ||
                    gp.buttons.select.pressed || gp.buttons.fire.pressed || gp.buttons.start?.pressed;

                if (isActive) {
                    // Assign this controller to P1
                    p1.inputSource = 'gamepad';
                    p1.gamepadIndex = index;
                    break; // Only assign one controller to P1
                }
            }
        }

        // Player Joining Logic (P2 - P4)
        if (gameState.players.length < MAX_LOCAL_PLAYERS) {
            // Check gamepads for join input
            for (const index of gamepads) {
                // Skip if gamepad is already assigned to any player
                const isAssigned = gameState.players.some(p => p.gamepadIndex === index);
                if (isAssigned) continue;

                const gp = inputSystem.getGamepad(index);
                if (!gp) continue;

                // Check for join button press (Start/A)
                if (gp.buttons.select.justPressed || gp.buttons.pause?.justPressed) {
                    // Create new player and assign this gamepad
                    // Offset spawn position based on player count
                    const playerIndex = gameState.players.length;
                    const spawnX = canvas.width / 2 + (playerIndex * 50);
                    const newPlayer = createPlayer(spawnX, canvas.height / 2, playerIndex);
                    newPlayer.inputSource = 'gamepad';
                    newPlayer.gamepadIndex = index;
                    gameState.players.push(newPlayer);
                    break; // Only join one player per frame
                }
            }

            // Check for Keyboard Join (Enter) - only if no keyboard player exists beyond P1
            // P1 is always index 0. If P1 is keyboard, P2 can be keyboard arrows.
            // If P1 is gamepad, P2 can be keyboard arrows.
            const keyboardPlayerExists = gameState.players.some((p, i) => i > 0 && p.inputSource === 'keyboard_arrow');
            if (!keyboardPlayerExists && keys['enter']) {
                // Check if P1 is already using keyboard (WASD) - P2 can still use Arrows
                // Actually P1 uses 'mouse' source which implies keyboard WASD.
                // So P2 can safely use 'keyboard_arrow' source.

                const playerIndex = gameState.players.length;
                const spawnX = canvas.width / 2 + (playerIndex * 50);
                const newPlayer = createPlayer(spawnX, canvas.height / 2, playerIndex);
                newPlayer.inputSource = 'keyboard_arrow';
                newPlayer.gamepadIndex = null;
                gameState.players.push(newPlayer);
            }
        }

        // Player Dropping Out (Back/B/Backspace)
        // Iterate backwards to safely remove
        for (let i = gameState.players.length - 1; i > 0; i--) {
            const player = gameState.players[i];

            if (player.inputSource === 'gamepad' && player.gamepadIndex !== undefined && player.gamepadIndex !== null) {
                const gp = inputSystem.getGamepad(player.gamepadIndex);
                if (gp && gp.buttons.back.justPressed) {
                    gameState.players.splice(i, 1);
                    // Re-assign colors/positions? No, keep them as is until reset
                    // Actually, if P2 drops and P3 remains, P3 becomes new P2?
                    // Array splice handles index shift.
                }
            }

            // Keyboard drop out
            if (player.inputSource === 'keyboard_arrow' && keys['backspace']) {
                gameState.players.splice(i, 1);
            }
        }
    }

    /**
     * Draw all players with visual effects
     */
    drawPlayers() {
        // Cache settings at function start to avoid repeated lookups
        const cachedGraphicsSettings = graphicsSettings;
        const cachedShadows = settingsManager.getSetting('video', 'shadows') ?? true;
        const cachedReloadBar = settingsManager.getSetting('video', 'reloadBar') ?? true;

        // Update weapon switch flash animation (V0.7.1)
        if (gameState.weaponSwitchFlash && gameState.weaponSwitchFlash.active) {
            const now = Date.now();
            const elapsed = now - gameState.weaponSwitchFlash.startTime;
            if (elapsed >= gameState.weaponSwitchFlash.duration) {
                gameState.weaponSwitchFlash.active = false;
            }
        }

        gameState.players.forEach(player => {
            if (player.health <= 0) return;

            // Check if muzzle flash is active for firing animation
            const isFiring = player.muzzleFlash && player.muzzleFlash.active;

            // Draw enhanced player model with 4-directional views and round hands
            drawEnhancedPlayer(player, isFiring);

            // Stamina bar
            if (player.stamina < PLAYER_STAMINA_MAX) {
                const barWidth = 40;
                const barHeight = 4;
                const barX = player.x - barWidth / 2;
                const barY = player.y + player.radius + 12;

                ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
                ctx.fillRect(barX, barY, barWidth, barHeight);

                const fillWidth = (player.stamina / PLAYER_STAMINA_MAX) * barWidth;
                ctx.fillStyle = '#00ffff';
                ctx.fillRect(barX, barY, fillWidth, barHeight);
            }

            // Reload bar
            if (cachedReloadBar && player.isReloading) {
                const now = Date.now();
                const reloadProgress = Math.min(1, (now - player.reloadStartTime) / player.currentWeapon.reloadTime);

                const barWidth = 40;
                const barHeight = 4;
                const barX = player.x - barWidth / 2;
                const barY = player.y + player.radius + (player.stamina < PLAYER_STAMINA_MAX ? 20 : 12);

                // Background
                ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
                ctx.fillRect(barX, barY, barWidth, barHeight);

                // Progress fill
                const fillWidth = barWidth * reloadProgress;
                ctx.fillStyle = '#ff9800'; // Orange color for reload
                ctx.fillRect(barX, barY, fillWidth, barHeight);

                // Border
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
                ctx.lineWidth = 1;
                ctx.strokeRect(barX, barY, barWidth, barHeight);
            }

            // Player Name (for AI)
            if (player.name && player.inputSource === 'ai') {
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 12px Consolas, monospace';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'bottom';
                ctx.shadowColor = 'black';
                ctx.shadowBlur = 4;
                ctx.fillText(player.name, player.x, player.y - player.radius - 8);
                ctx.shadowBlur = 0;
            }

            // Muzzle flash - quality scaled
            if (player.muzzleFlash.active) {
                const flashQuality = cachedGraphicsSettings.getQualityValues('muzzleFlash');
                const baseSize = 8 + (player.muzzleFlash.intensity * 12);
                const flashSize = baseSize * flashQuality.sizeMultiplier;
                const flashOffset = -2;
                const flashX = player.muzzleFlash.x + Math.cos(player.muzzleFlash.angle) * flashOffset;
                const flashY = player.muzzleFlash.y + Math.sin(player.muzzleFlash.angle) * flashOffset;

                if (flashQuality.gradientLayers >= 3) {
                    // Ultra quality: Multi-layer flash with glow
                    ctx.shadowBlur = flashSize * 0.5;
                    ctx.shadowColor = 'rgba(255, 255, 200, 0.8)';

                    // Outer glow layer
                    const outerGradient = ctx.createRadialGradient(flashX, flashY, 0, flashX, flashY, flashSize * 1.5);
                    outerGradient.addColorStop(0, `rgba(255, 255, 255, ${player.muzzleFlash.intensity * 0.3})`);
                    outerGradient.addColorStop(0.5, `rgba(255, 255, 200, ${player.muzzleFlash.intensity * 0.2})`);
                    outerGradient.addColorStop(1, 'rgba(255, 200, 0, 0)');
                    ctx.fillStyle = outerGradient;
                    ctx.beginPath();
                    ctx.arc(flashX, flashY, flashSize * 1.5, 0, Math.PI * 2);
                    ctx.fill();

                    // Middle layer
                    const middleGradient = ctx.createRadialGradient(flashX, flashY, 0, flashX, flashY, flashSize * 1.2);
                    middleGradient.addColorStop(0, `rgba(255, 255, 255, ${player.muzzleFlash.intensity * 0.6})`);
                    middleGradient.addColorStop(0.4, `rgba(255, 255, 150, ${player.muzzleFlash.intensity * 0.5})`);
                    middleGradient.addColorStop(0.8, `rgba(255, 200, 0, ${player.muzzleFlash.intensity * 0.3})`);
                    middleGradient.addColorStop(1, 'rgba(255, 150, 0, 0)');
                    ctx.fillStyle = middleGradient;
                    ctx.beginPath();
                    ctx.arc(flashX, flashY, flashSize * 1.2, 0, Math.PI * 2);
                    ctx.fill();
                } else if (flashQuality.gradientLayers >= 2) {
                    // High quality: Two-layer flash
                    ctx.shadowBlur = flashSize * 0.3;
                    ctx.shadowColor = 'rgba(255, 255, 200, 0.6)';

                    // Outer layer
                    const outerGradient = ctx.createRadialGradient(flashX, flashY, 0, flashX, flashY, flashSize * 1.3);
                    outerGradient.addColorStop(0, `rgba(255, 255, 200, ${player.muzzleFlash.intensity * 0.4})`);
                    outerGradient.addColorStop(0.6, `rgba(255, 200, 0, ${player.muzzleFlash.intensity * 0.3})`);
                    outerGradient.addColorStop(1, 'rgba(255, 100, 0, 0)');
                    ctx.fillStyle = outerGradient;
                    ctx.beginPath();
                    ctx.arc(flashX, flashY, flashSize * 1.3, 0, Math.PI * 2);
                    ctx.fill();
                }

                // Main flash (all quality levels)
                const flashGradient = ctx.createRadialGradient(flashX, flashY, 0, flashX, flashY, flashSize);
                if (flashQuality.gradientLayers >= 3) {
                    flashGradient.addColorStop(0, `rgba(255, 255, 255, ${player.muzzleFlash.intensity * 0.95})`);
                    flashGradient.addColorStop(0.2, `rgba(255, 255, 200, ${player.muzzleFlash.intensity * 0.85})`);
                    flashGradient.addColorStop(0.5, `rgba(255, 200, 0, ${player.muzzleFlash.intensity * 0.7})`);
                    flashGradient.addColorStop(0.8, `rgba(255, 150, 0, ${player.muzzleFlash.intensity * 0.4})`);
                    flashGradient.addColorStop(1, 'rgba(255, 100, 0, 0)');
                } else if (flashQuality.gradientLayers >= 2) {
                    flashGradient.addColorStop(0, `rgba(255, 255, 255, ${player.muzzleFlash.intensity * 0.9})`);
                    flashGradient.addColorStop(0.3, `rgba(255, 255, 200, ${player.muzzleFlash.intensity * 0.7})`);
                    flashGradient.addColorStop(0.6, `rgba(255, 200, 0, ${player.muzzleFlash.intensity * 0.4})`);
                    flashGradient.addColorStop(1, 'rgba(255, 100, 0, 0)');
                } else {
                    // Low/Medium: Simple gradient
                    flashGradient.addColorStop(0, `rgba(255, 255, 200, ${player.muzzleFlash.intensity * 0.8})`);
                    flashGradient.addColorStop(0.5, `rgba(255, 200, 0, ${player.muzzleFlash.intensity * 0.5})`);
                    flashGradient.addColorStop(1, 'rgba(255, 100, 0, 0)');
                }

                ctx.fillStyle = flashGradient;
                ctx.beginPath();
                ctx.arc(flashX, flashY, flashSize, 0, Math.PI * 2);
                ctx.fill();

                // Reset shadow
                ctx.shadowBlur = 0;

                // Ultra quality: Add particle trail
                if (flashQuality.hasTrail && Math.random() < 0.3) {
                    spawnParticle(flashX, flashY, '#ffff00', {
                        radius: 2,
                        vx: Math.cos(player.muzzleFlash.angle) * 3,
                        vy: Math.sin(player.muzzleFlash.angle) * 3,
                        life: 5,
                        maxLife: 5
                    });
                }
            }

            // Draw melee swipe animation if active
            if (player.activeMeleeSwipe) {
                drawMeleeSwipe(player);
            }
        });
    }
}

