import {
    WEAPONS, MELEE_RANGE, MELEE_DAMAGE, MELEE_COOLDOWN, MELEE_SWIPE_DURATION,
    WAVE_BREAK_DURATION, PLAYER_MAX_HEALTH,
    HEALTH_PICKUP_SPAWN_INTERVAL, MAX_HEALTH_PICKUPS,
    AMMO_PICKUP_SPAWN_INTERVAL, MAX_AMMO_PICKUPS,
    PLAYER_BASE_SPEED, PLAYER_SPRINT_SPEED,
    PLAYER_STAMINA_MAX, PLAYER_STAMINA_DRAIN, PLAYER_STAMINA_REGEN, PLAYER_STAMINA_REGEN_DELAY,
    MAX_LOCAL_PLAYERS,
    MAX_GRENADES,
    TWO_PI
} from './core/constants.js';
import { canvas, ctx, gpuCanvas, resizeCanvas, applyTextRenderingQualityToAll } from './core/canvas.js';
import { gameState, resetGameState, createPlayer } from './core/gameState.js';
import { settingsManager } from './systems/SettingsManager.js';
import { initAudio, playFootstepSound, playDamageSound, playKillSound, playRestartSound, playMenuMusic, stopMenuMusic } from './systems/AudioSystem.js';
import { initGroundPattern, graphicsSettings } from './systems/GraphicsSystem.js';
import { renderingCache } from './systems/RenderingCache.js';
import { isInViewport, getViewportBounds, shouldUpdateEntity, isVisibleOnScreen } from './utils/gameUtils.js';
import { RENDERING } from './core/constants.js';
import { GameHUD } from './ui/GameHUD.js';
import { SettingsPanel } from './ui/SettingsPanel.js';
import { NormalZombie, FastZombie, ExplodingZombie, ArmoredZombie, GhostZombie, SpitterZombie } from './entities/Zombie.js';
import { AcidProjectile } from './entities/AcidProjectile.js';
import { AcidPool } from './entities/AcidPool.js';

// Make AcidProjectile and AcidPool available globally for SpitterZombie
window.AcidProjectile = AcidProjectile;
window.AcidPool = AcidPool;
import { BossZombie } from './entities/BossZombie.js';
import { DamageNumber } from './entities/Particle.js';
import {
    shootBullet, reloadWeapon, switchWeapon, throwGrenade, triggerExplosion,
    handleBulletZombieCollisions, handlePlayerZombieCollisions, handlePickupCollisions
} from './utils/combatUtils.js';
import {
    checkCollision, triggerDamageIndicator, triggerWaveNotification,
    loadHighScore, saveHighScore, loadUsername, saveUsername, loadMenuMusicMuted, saveMenuMusicMuted,
    loadMultiplierStats, clearScoreboard
} from './utils/gameUtils.js';

// Make triggerDamageIndicator available globally for AcidPool
window.triggerDamageIndicator = triggerDamageIndicator;
import { createParticles, createBloodSplatter, spawnParticle, updateParticles, drawParticles } from './systems/ParticleSystem.js';
import { inputSystem } from './systems/InputSystem.js';
import { GameEngine } from './core/GameEngine.js';
import { CompanionSystem } from './companions/CompanionSystem.js';
import { WebGPURenderer } from './core/WebGPURenderer.js';
import { skillSystem } from './systems/SkillSystem.js';
import { zombieUpdateSystem } from './systems/ZombieUpdateSystem.js';
import { entityRenderSystem } from './systems/EntityRenderSystem.js';
import { pickupSpawnSystem } from './systems/PickupSpawnSystem.js';
import { propSpawnSystem } from './systems/PropSpawnSystem.js';
import { propRenderSystem } from './systems/PropRenderSystem.js';
import { groundTextureSystem } from './systems/GroundTextureSystem.js';
import { cameraSystem } from './systems/CameraSystem.js';
import { SERVER_URL } from './core/constants.js';
import { MultiplayerSystem } from './systems/MultiplayerSystem.js';
import { ZombieSpawnSystem } from './systems/ZombieSpawnSystem.js';
import { PlayerSystem } from './systems/PlayerSystem.js';
import { GameStateManager } from './systems/GameStateManager.js';
import { MeleeSystem } from './systems/MeleeSystem.js';
import { drawMeleeSwipe, drawCrosshair as drawCrosshairUtil, drawWaveBreak, drawWaveNotification, drawFpsCounter } from './utils/drawingUtils.js';
import { playerProfileSystem } from './systems/PlayerProfileSystem.js';
import { ProfileScreen } from './ui/ProfileScreen.js';
import { AchievementScreen } from './ui/AchievementScreen.js';
import { BattlepassScreen } from './ui/BattlepassScreen.js';
import { BadgeScreen } from './ui/BadgeScreen.js';
import { bloodSimulationSystem } from './systems/BloodSimulationSystem.js';

// Initialize Game Engine
const gameEngine = new GameEngine();
// Make gameEngine globally accessible for settings panel
window.gameEngine = gameEngine;

// Initialize Companion System
const companionSystem = new CompanionSystem();
// Make companionSystem globally accessible
window.companionSystem = companionSystem;

// Initialize HUD (needed by GameStateManager)
const gameHUD = new GameHUD(canvas);
window.gameHUD = gameHUD; // Make globally accessible for text rendering quality

// Initialize profile UI screens
const profileScreen = new ProfileScreen(canvas);
const achievementScreen = new AchievementScreen(canvas);
const battlepassScreen = new BattlepassScreen(canvas);
const badgeScreen = new BadgeScreen(canvas);
// Make globally accessible for text rendering quality
window.profileScreen = profileScreen;
window.achievementScreen = achievementScreen;
window.battlepassScreen = battlepassScreen;
window.badgeScreen = badgeScreen;

// Initialize new systems
const meleeSystem = new MeleeSystem();
const playerSystem = new PlayerSystem(companionSystem);
const zombieSpawnSystem = new ZombieSpawnSystem();
const gameStateManager = new GameStateManager(gameHUD, (count) => {
    zombieSpawnSystem.spawnZombies(count, gameState.multiplayer.socket);
});
const multiplayerSystem = new MultiplayerSystem(
    gameEngine,
    () => gameStateManager.startGame(),
    (player) => meleeSystem.performMeleeAttack(player),
    (target, canvas, player) => shootBullet(target, canvas, player),
    (player) => reloadWeapon(player),
    (target, canvas, player) => throwGrenade(target, canvas, player),
    (weapon, player) => switchWeapon(weapon, player),
    (type) => zombieSpawnSystem.getZombieClassByType(type)
);

// Apply FPS limit and VSync from settings
const initialFpsLimit = settingsManager.getSetting('video', 'fpsLimit') ?? 0;
const initialVSync = settingsManager.getSetting('video', 'vsync') ?? true;
gameEngine.setVSync(initialVSync);
if (!initialVSync) {
    gameEngine.setFPSLimit(initialFpsLimit);
}

// Initialize Settings Panel
const settingsPanel = new SettingsPanel(canvas, settingsManager);
window.settingsPanel = settingsPanel; // Make globally accessible for text rendering quality

// Apply initial text rendering quality
applyTextRenderingQualityToAll();

// v0.8.1.2: Initialize ground texture system
groundTextureSystem.init();

// Initialize volumetric blood simulation system
bloodSimulationSystem.init();

// Input state
const keys = {};
const mouse = { x: 0, y: 0, isDown: false };

// Initial resize
// Initial resize
resizeCanvas(gameState.players.find(p => p.inputSource === 'mouse'));
window.addEventListener('resize', () => {
    const localPlayer = gameState.players.find(p => p.inputSource === 'mouse');
    resizeCanvas(localPlayer);
});

// Initialize WebGPU Renderer
const webgpuRenderer = new WebGPURenderer();
// Make renderer globally accessible for GameHUD
window.webgpuRenderer = webgpuRenderer;

// Set initial gpuCanvas visibility (hidden until WebGPU is confirmed active)
updateGpuCanvasVisibility();

webgpuRenderer.init().then(initialized => {
    if (initialized) {
        console.log('WebGPU renderer ready');
        // Apply initial settings
        applyWebGPUSettings();
    } else {
        console.log('WebGPU renderer unavailable, using Canvas 2D fallback');
    }
    // Update gpuCanvas visibility based on WebGPU availability
    updateGpuCanvasVisibility();
});

/**
 * Helper function to check if WebGPU is available and enabled
 * Consolidates all WebGPU availability checks
 */
function isWebGPUActive() {
    const webgpuEnabled = settingsManager.getSetting('video', 'webgpuEnabled') ?? true;
    return webgpuEnabled && webgpuRenderer && webgpuRenderer.isAvailable() && WebGPURenderer.isWebGPUAvailable();
}

/**
 * Update gpuCanvas visibility based on WebGPU availability
 * Hides gpuCanvas when WebGPU is disabled to prevent grey overlay
 */
function updateGpuCanvasVisibility() {
    if (!gpuCanvas) {
        console.warn('[gpuCanvas] Element not found');
        return;
    }
    const webgpuEnabled = settingsManager.getSetting('video', 'webgpuEnabled') ?? true;
    const webgpuAvailable = webgpuRenderer && webgpuRenderer.isAvailable() && WebGPURenderer.isWebGPUAvailable();
    const webgpuActive = webgpuEnabled && webgpuAvailable;

    console.log('[gpuCanvas] Updating visibility:', {
        webgpuEnabled,
        webgpuAvailable,
        webgpuActive,
        isAvailable: webgpuRenderer?.isAvailable(),
        hasNavigatorGpu: !!navigator.gpu
    });

    if (webgpuActive) {
        gpuCanvas.style.display = 'block';
        gpuCanvas.style.visibility = 'visible';
        gpuCanvas.style.opacity = '1';
        console.log('[gpuCanvas] Showing canvas');
    } else {
        gpuCanvas.style.display = 'none';
        gpuCanvas.style.visibility = 'hidden';
        gpuCanvas.style.opacity = '0';
        console.log('[gpuCanvas] Hiding canvas');
    }
}

// Function to apply WebGPU settings from SettingsManager
function applyWebGPUSettings() {
    if (!isWebGPUActive()) return;

    const bloomIntensity = settingsManager.getSetting('video', 'bloomIntensity') ?? 0.5;
    webgpuRenderer.setBloomIntensity(bloomIntensity);
    const distortion = settingsManager.getSetting('video', 'distortionEffects') ?? true;
    webgpuRenderer.setDistortionEffects(distortion);
    const lighting = settingsManager.getSetting('video', 'lightingQuality') ?? 'simple';
    webgpuRenderer.setLightingQuality(lighting);
    const particles = settingsManager.getSetting('video', 'particleCount') ?? 'high';
    webgpuRenderer.setParticleCount(particles);
}

// Listen for settings changes and update renderer/systems
settingsManager.addChangeListener((category, key, value) => {
    if (category === 'gameplay' && key === 'enableAICompanion') {
        const aiPlayerExists = gameState.players.some(p => p.inputSource === 'ai');
        if (value && !aiPlayerExists) {
            addAIPlayer();
        } else if (!value && aiPlayerExists) {
            gameState.players = gameState.players.filter(p => p.inputSource !== 'ai');
        }
    }

    if (category === 'video') {
        // Handle resolution scale (affects all rendering, not just WebGPU)
        if (key === 'resolutionScale') {
            // Resize canvas when resolution scale changes
            const localPlayer = gameState.players.find(p => p.inputSource === 'mouse');
            resizeCanvas(localPlayer);
        }

        // Handle UI Scale (affects all UI elements)
        if (key === 'uiScale') {
            // UI scaling applies immediately on next render, no action needed
            // GameHUD and SettingsPanel will recalculate scaled values on next draw
        }

        // Handle Text Rendering Quality (affects all canvas contexts)
        if (key === 'textRenderingQuality') {
            applyTextRenderingQualityToAll();
        }

        // Handle VSync and FPS limit (affects all rendering)
        if (key === 'vsync') {
            gameEngine.setVSync(value);
        }
        if (key === 'fpsLimit') {
            // Only apply FPS limit if VSync is disabled
            const vsyncEnabled = settingsManager.getSetting('video', 'vsync') ?? true;
            if (!vsyncEnabled) {
                gameEngine.setFPSLimit(value);
            }
        }

        // Handle WebGPU enabled/disabled toggle
        if (key === 'webgpuEnabled') {
            // Update gpuCanvas visibility when WebGPU setting changes
            updateGpuCanvasVisibility();
        }

        // WebGPU-specific settings (only apply if WebGPU is active)
        if (isWebGPUActive()) {
            if (key === 'bloomIntensity') {
                webgpuRenderer.setBloomIntensity(value);
            }
            if (key === 'distortionEffects') {
                webgpuRenderer.setDistortionEffects(value);
            }
            if (key === 'lightingQuality') {
                webgpuRenderer.setLightingQuality(value);
            }
            if (key === 'particleCount') {
                webgpuRenderer.setParticleCount(value);
            }
        }

        // Handle vignette, shadows, and lighting changes - invalidate cache for immediate visual update
        if (key === 'vignette' || key === 'lighting') {
            // Invalidate rendering cache when vignette/lighting toggles change
            const localPlayer = gameState.players.find(p => p.inputSource === 'mouse');
            if (localPlayer) {
                renderingCache.invalidate(localPlayer);
            }
            // Cache will be updated on next drawGame() call with new settings
        }

        // Shadows are read directly in rendering code, no cache invalidation needed
        // But we can still add a listener for consistency
        if (key === 'shadows') {
            // Shadows are read directly per-frame, so changes apply immediately
            // No cache invalidation needed
        }
    }
});

// Server health check - delegate to MultiplayerSystem
function checkServerHealth() {
    multiplayerSystem.checkServerHealth();
}

function initializeNetwork() {
    multiplayerSystem.initializeNetwork(gameHUD);
}

function connectToMultiplayer() {
    // This function is called when entering the multiplayer lobby
    // The network should already be initialized, but ensure it's active
    if (!gameState.multiplayer.socket) {
        initializeNetwork();
    }
    gameState.multiplayer.active = true;
}

function spawnZombies(count) {
    zombieSpawnSystem.spawnZombies(count, gameState.multiplayer.socket);
}

// Pause menu functions
function togglePause() {
    if (gameState.gameRunning && !gameHUD.gameOver) {
        if (gameState.gamePaused) {
            resumeGame();
        } else {
            pauseGame();
        }
    }
}

function pauseGame() {
    gameState.gamePaused = true;
    gameHUD.showPauseMenu();

    // Track pause for badge
    playerProfileSystem.trackGamePause();

    // Notify server
    if (gameState.multiplayer.active && gameState.multiplayer.socket) {
        gameState.multiplayer.socket.emit('game:pause');
    }
}

function resumeGame() {
    gameState.gamePaused = false;
    gameHUD.hidePauseMenu();

    // Notify server
    if (gameState.multiplayer.active && gameState.multiplayer.socket) {
        gameState.multiplayer.socket.emit('game:resume');
    }
}

function performMeleeAttack(player) {
    meleeSystem.performMeleeAttack(player);
}

function addAIPlayer() {
    const enableAICompanion = settingsManager.getSetting('gameplay', 'enableAICompanion');
    if (!enableAICompanion) return;
    companionSystem.addCompanion();
}

function updatePlayers() {
    playerSystem.updatePlayers(keys, mouse, (player) => meleeSystem.performMeleeAttack(player), cycleWeapon);
}

function updateCoopLobby() {
    playerSystem.updateCoopLobby(keys, mouse);
}

function drawPlayers() {
    playerSystem.drawPlayers();
}

// Drawing functions are now imported from drawingUtils.js

function updateGame() {
    if (!gameState.gameRunning || gameState.showMainMenu || gameState.showLobby || gameState.showCoopLobby || gameState.showAILobby || gameState.showGallery || gameState.showAbout || gameState.showProfile || gameState.showAchievements || gameState.showBattlepass || gameState.showBadges) return;
    if (gameState.showLevelUp) return; // Pause game during level up selection

    // Cache frequently accessed settings to reduce repeated lookups
    const cachedGraphicsSettings = graphicsSettings;
    const cachedDamageNumberStyle = settingsManager.getSetting('video', 'damageNumberStyle') || 'floating';

    const now = Date.now();
    const activePlayers = gameState.players.filter(p => p.health > 0);
    const anyPlayerAlive = activePlayers.length > 0;

    if (!anyPlayerAlive) {
        gameOver();
        return;
    }

    // Update Day/Night Cycle
    const cycleElapsed = now - gameState.dayNightCycle.startTime;
    gameState.gameTime = (cycleElapsed % gameState.dayNightCycle.cycleDuration) / gameState.dayNightCycle.cycleDuration;
    // Night is from 0.5 to 1.0 (second half of cycle)
    gameState.isNight = gameState.gameTime >= 0.5;

    // v0.8.1.2: Update camera and world systems (single player arcade only)
    const isSinglePlayerArcade = !gameState.isCoop && !gameState.multiplayer.active;
    if (isSinglePlayerArcade) {
        const localPlayer = gameState.players[0];
        if (localPlayer) {
            // Update camera to follow player
            cameraSystem.update(localPlayer);

            // Update ground texture based on camera position (world moves with camera)
            groundTextureSystem.updateFromCamera(cameraSystem);

            // Update prop spawning
            propSpawnSystem.update(gameState, localPlayer);

            // Update props (smoke particles for burnt cars)
            if (gameState.props && gameState.props.length > 0) {
                for (const prop of gameState.props) {
                    if (prop.update) {
                        prop.update();
                    }
                }
            }
        }
    }

    // Spawn pickups (health, ammo, powerups)
    pickupSpawnSystem.updateSpawns(gameState, canvas, now);

    // Apply regeneration skill
    gameState.players.forEach(player => {
        if (player.health > 0 && player.hasRegeneration) {
            player.health = Math.min(player.maxHealth, player.health + (1 / 60)); // 1 HP per second at 60fps
        }
    });

    // Get viewport bounds for update culling (calculate once per frame)
    // Cache viewport bounds for reuse in drawGame
    // v0.8.1.2: Adjust viewport for camera in single player arcade mode
    let viewport = getViewportBounds(canvas);
    if (isSinglePlayerArcade && gameState.players[0]) {
        const cameraPos = cameraSystem.getPosition();
        // Viewport in world space (accounting for camera)
        viewport = {
            left: cameraPos.x,
            top: cameraPos.y,
            right: cameraPos.x + canvas.width,
            bottom: cameraPos.y + canvas.height
        };
    }
    gameState.cachedViewport = viewport;

    // Update players
    updatePlayers();

    // Send local player state to server for multiplayer synchronization
    if (gameState.isCoop && gameState.multiplayer.socket && gameState.multiplayer.socket.connected) {
        const localPlayer = gameState.players.find(p => p.id === gameState.multiplayer.playerId);

        if (!localPlayer) {
            // Debug: Log if local player not found (throttled to avoid spam)
            if (!window._lastLocalPlayerError || Date.now() - window._lastLocalPlayerError > 5000) {
                console.error('[player:state] Local player not found!', {
                    multiplayerPlayerId: gameState.multiplayer.playerId,
                    availablePlayers: gameState.players.map(p => ({ id: p.id, name: p.name, inputSource: p.inputSource }))
                });
                window._lastLocalPlayerError = Date.now();
            }
        } else if (localPlayer.inputSource === 'remote') {
            // Debug: Log if local player is marked as remote (shouldn't happen)
            if (!window._lastRemoteError || Date.now() - window._lastRemoteError > 5000) {
                console.error('[player:state] Local player marked as remote!', {
                    playerId: localPlayer.id,
                    playerName: localPlayer.name,
                    inputSource: localPlayer.inputSource
                });
                window._lastRemoteError = Date.now();
            }
        } else {
            // Send state update every frame (server will throttle if needed)
            gameState.multiplayer.socket.emit('player:state', {
                x: localPlayer.x,
                y: localPlayer.y,
                angle: localPlayer.angle,
                health: localPlayer.health,
                stamina: localPlayer.stamina,
                currentWeapon: localPlayer.currentWeapon.name,
                currentAmmo: localPlayer.currentAmmo,
                isReloading: localPlayer.isReloading
            });
        }
    }

    // Update bullets (only update those near viewport for better performance)
    // Early return optimization: filter out marked bullets first
    gameState.bullets = gameState.bullets.filter(bullet => {
        // Early exit for bullets marked for removal
        if (bullet.markedForRemoval) return false;
        const exploded = bullet.update();
        // Check again after update (update might mark it for removal or explode)
        return !bullet.markedForRemoval && !exploded;
    });

    // Update grenades (only update those near viewport)
    // Early return optimization: check exploded state first
    gameState.grenades = gameState.grenades.filter(grenade => {
        // Early exit for exploded grenades
        if (grenade.exploded) return false;
        // Update if near viewport
        if (shouldUpdateEntity(grenade, viewport.left, viewport.top, viewport.right, viewport.bottom)) {
            const exploded = grenade.update(canvas.width, canvas.height);
            // If grenade exploded during update, remove it
            if (exploded) return false;
        }
        return !grenade.exploded;
    });

    // Update acid projectiles (only update those near viewport)
    // Early return optimization: check off-screen first
    gameState.acidProjectiles = gameState.acidProjectiles.filter(projectile => {
        // Early exit for off-screen projectiles
        if (projectile.isOffScreen(canvas.width, canvas.height)) return false;
        if (shouldUpdateEntity(projectile, viewport.left, viewport.top, viewport.right, viewport.bottom)) {
            projectile.update();
        }
        return !projectile.isOffScreen(canvas.width, canvas.height);
    });

    // Update acid pools (only update those near viewport)
    // Early return optimization: check expired state first
    gameState.acidPools = gameState.acidPools.filter(pool => {
        // Early exit for expired pools
        if (pool.isExpired()) return false;
        if (shouldUpdateEntity(pool, viewport.left, viewport.top, viewport.right, viewport.bottom)) {
            pool.update();
        }
        return !pool.isExpired();
    });

    // Update zombies (Find target for each) - BIGGEST PERFORMANCE WIN: Only update zombies near viewport
    zombieUpdateSystem.updateZombies(gameState, gameEngine, viewport, now);

    // Update particles
    updateParticles();

    // Update blood simulation (volumetric blood)
    bloodSimulationSystem.update(16.67); // Use fixed timeStep (1000/60 = 16.67ms for 60 FPS)

    // Update shells (only update those near viewport - shells are small and fast to despawn)
    gameState.shells = gameState.shells.filter(shell => {
        if (shell.life <= 0) return false;
        // Update shells near viewport, but always check life for cleanup
        if (shouldUpdateEntity(shell, viewport.left, viewport.top, viewport.right, viewport.bottom)) {
            shell.update();
        } else {
            // Still decrement life even if off-screen so they despawn
            shell.life--;
        }
        return shell.life > 0;
    });

    // Update damage numbers
    gameState.damageNumbers = gameState.damageNumbers.filter(num => {
        num.update();
        return num.life > 0;
    });

    // Update spawn indicators
    gameState.spawnIndicators = gameState.spawnIndicators.filter(indicator => {
        const elapsed = Date.now() - indicator.startTime;
        return elapsed < indicator.duration;
    });

    // Update damage indicator (Visual only, global logic is fine but intensity depends on triggers)
    if (gameState.damageIndicator.active) {
        gameState.damageIndicator.intensity *= gameState.damageIndicator.decay;
        if (gameState.damageIndicator.intensity < 0.1) {
            gameState.damageIndicator.active = false;
        }
    }

    // Update hit marker
    if (gameState.hitMarker.active) {
        gameState.hitMarker.life--;
        if (gameState.hitMarker.life <= 0) {
            gameState.hitMarker.active = false;
        }
    }

    // Update muzzle flashes for all players
    gameState.players.forEach(p => {
        if (p.muzzleFlash.active) {
            p.muzzleFlash.life--;
            p.muzzleFlash.intensity = p.muzzleFlash.life / p.muzzleFlash.maxLife;
            if (p.muzzleFlash.life <= 0) {
                p.muzzleFlash.active = false;
            }
        }
        // Update melee swipes
        if (p.activeMeleeSwipe) {
            const swipeElapsed = now - p.activeMeleeSwipe.startTime;
            if (swipeElapsed >= p.activeMeleeSwipe.duration) {
                p.activeMeleeSwipe = null;
            }
        }
        // Update reload (with skill multiplier)
        if (p.isReloading) {
            const reloadMultiplier = p.reloadSpeedMultiplier || 1.0;
            const adjustedReloadTime = p.currentWeapon.reloadTime * reloadMultiplier;
            if (now - p.reloadStartTime >= adjustedReloadTime) {
                p.isReloading = false;
                const ammoMultiplier = p.ammoMultiplier || 1.0;
                p.currentAmmo = Math.floor(p.currentWeapon.maxAmmo * ammoMultiplier);
                p.maxAmmo = Math.floor(p.currentWeapon.maxAmmo * ammoMultiplier);
                // Update weapon state with reloaded ammo
                const weaponKeys = Object.keys(WEAPONS);
                const currentWeaponKey = weaponKeys.find(key => WEAPONS[key] === p.currentWeapon);
                if (currentWeaponKey && p.weaponStates[currentWeaponKey]) {
                    p.weaponStates[currentWeaponKey].ammo = p.currentAmmo;
                }
            }
        }
    });

    // Update wave notification
    if (gameState.waveNotification.active) {
        gameState.waveNotification.life--;
        if (gameState.waveNotification.life <= 0) {
            gameState.waveNotification.active = false;
        }
    }

    // Continuous firing (Local Mouse Player)
    if (mouse.isDown && gameState.gameRunning && !gameState.gamePaused) {
        const localPlayer = gameState.players.find(p => p.inputSource === 'mouse');
        if (localPlayer && localPlayer.health > 0) {
            // v0.8.1.2: Convert mouse screen coordinates to world coordinates in single player arcade mode
            const isSinglePlayerArcade = !gameState.isCoop && !gameState.multiplayer.active;
            let target = mouse;
            if (isSinglePlayerArcade) {
                const worldPos = cameraSystem.screenToWorld(mouse.x, mouse.y);
                target = { x: worldPos.x, y: worldPos.y };
            }
            shootBullet(target, canvas, localPlayer);
        }
    }

    // Collisions
    handleBulletZombieCollisions();
    handlePlayerZombieCollisions();
    handlePickupCollisions();

    // Check for next wave
    if (gameState.zombies.length === 0 && gameState.gameRunning && !gameState.isSpawningWave) {
        if (!gameState.waveBreakActive) {
            gameState.waveBreakActive = true;
            gameState.waveBreakEndTime = Date.now() + WAVE_BREAK_DURATION;
        } else if (Date.now() >= gameState.waveBreakEndTime) {
            gameState.waveBreakActive = false;
            gameState.wave++;
            gameState.zombiesPerWave += 2;
            triggerWaveNotification();
            spawnZombies(gameState.zombiesPerWave);
        }
    }
}

function drawGame() {
    // v0.8.1.2: Check if single player arcade mode (used for camera and world systems)
    const isSinglePlayerArcade = !gameState.isCoop && !gameState.multiplayer.active;

    if (gameState.showSettingsPanel) {
        canvas.style.cursor = 'default';
        settingsPanel.draw(mouse);
        return;
    }

    if (gameState.showMainMenu) {
        gameHUD.mainMenu = true;
        // Set cursor based on news ticker interaction
        if (gameHUD.newsTickerDragging) {
            canvas.style.cursor = 'grabbing';
        } else if (gameHUD.checkNewsTickerHit(mouse.x, mouse.y)) {
            canvas.style.cursor = 'grab';
        } else {
            canvas.style.cursor = 'none'; // Use custom cursor
        }
        gameHUD.draw();
        return;
    }

    if (gameState.showLobby) {
        gameHUD.mainMenu = false;
        canvas.style.cursor = 'none'; // Use custom cursor
        gameHUD.draw();
        return;
    }

    if (gameState.showCoopLobby) {
        gameHUD.mainMenu = false;
        canvas.style.cursor = 'none'; // Use custom cursor
        gameHUD.draw();
        return;
    }

    if (gameState.showAILobby) {
        gameHUD.mainMenu = false;
        canvas.style.cursor = 'none'; // Use custom cursor
        gameHUD.draw();
        return;
    }

    if (gameState.showGallery) {
        gameHUD.mainMenu = false;
        canvas.style.cursor = 'default';
        gameHUD.draw();
        return;
    }

    if (gameState.showAbout) {
        gameHUD.mainMenu = false;
        canvas.style.cursor = 'default';
        gameHUD.draw();
        return;
    }

    if (gameState.showProfile) {
        gameHUD.mainMenu = false;
        canvas.style.cursor = 'default';
        profileScreen.draw();
        return;
    }

    if (gameState.showAchievements) {
        gameHUD.mainMenu = false;
        canvas.style.cursor = 'default';
        achievementScreen.draw();
        return;
    }

    if (gameState.showBattlepass) {
        gameHUD.mainMenu = false;
        canvas.style.cursor = 'default';
        battlepassScreen.draw();
        return;
    }

    if (gameState.showBadges) {
        gameHUD.mainMenu = false;
        canvas.style.cursor = 'default';
        badgeScreen.draw();
        return;
    }

    if (gameState.showLevelUp) {
        gameHUD.mainMenu = false;
        canvas.style.cursor = 'none'; // Use custom cursor
        gameHUD.draw();
        return;
    }

    gameHUD.mainMenu = false;
    const localPlayer = gameState.players.find(p => p.inputSource === 'mouse');

    // Hide cursor during gameplay (crosshair used) or when paused (custom cursor used)
    // Settings panel uses default cursor, otherwise use custom
    if (!gameState.showSettingsPanel && (gameState.gamePaused || gameHUD.gameOver)) {
        canvas.style.cursor = 'none'; // Use custom cursor when paused or game over
    } else {
        // Hide cursor if P1 is gamepad, or always hide during game (crosshair used)
        if (activeInputSource === 'gamepad') {
            canvas.style.cursor = 'none';
        } else {
            canvas.style.cursor = 'none';
        }
    }

    // Cache settings at frame start to avoid repeated lookups
    const cachedGraphicsSettings = graphicsSettings;
    // Use consolidated WebGPU check helper
    const webgpuActive = isWebGPUActive();
    const qualityPreset = settingsManager.getSetting('video', 'qualityPreset') || 'high';
    const postProcessingQuality = cachedGraphicsSettings.postProcessingQuality || 'medium';

    // When quality preset is 'custom', individual toggles work independently
    // Otherwise, post-processing quality acts as a global override
    const isCustomPreset = qualityPreset === 'custom';

    // Vignette: Works independently if custom preset, otherwise respects postProcessingQuality
    const vignetteEnabled = isCustomPreset
        ? cachedGraphicsSettings.vignette !== false  // Independent toggle when custom
        : (cachedGraphicsSettings.vignette !== false &&
            (postProcessingQuality === 'low' || postProcessingQuality === 'medium' || postProcessingQuality === 'high'));

    // Lighting: Works independently if custom preset, otherwise respects postProcessingQuality  
    const lightingEnabled = isCustomPreset
        ? cachedGraphicsSettings.lighting !== false  // Independent toggle when custom
        : (cachedGraphicsSettings.lighting !== false &&
            (postProcessingQuality === 'medium' || postProcessingQuality === 'high'));

    const enhancedPostProcessing = postProcessingQuality === 'high';

    const shakeIntensity = settingsManager.getSetting('video', 'screenShakeMultiplier') ?? 1.0;

    // Update rendering cache settings
    renderingCache.updateSettings(vignetteEnabled, lightingEnabled);

    // Invalidate cache if needed
    if (renderingCache.needsInvalidation(localPlayer)) {
        renderingCache.invalidate(localPlayer);
    }

    // Background gradient (drawn FIRST in screen space, before camera transform)
    // This ensures it's behind everything
    if (!webgpuActive) {
        const bgGradient = renderingCache.getBackgroundGradient();
        if (bgGradient) {
            ctx.fillStyle = bgGradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
    } else {
        // If WebGPU is active, background is handled by GPU layer - clear Canvas 2D to be transparent
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    // If WebGPU is active, background is handled by GPU layer - keep Canvas 2D transparent

    ctx.save();

    // v0.8.1.2: Apply camera transform (single player arcade only)
    // This makes the world move while player stays centered
    if (isSinglePlayerArcade) {
        cameraSystem.applyTransform(ctx);
    }

    // Apply screen shake (after camera transform)
    if (gameState.shakeAmount > 0.1) {
        const shakeX = (Math.random() - 0.5) * gameState.shakeAmount * shakeIntensity;
        const shakeY = (Math.random() - 0.5) * gameState.shakeAmount * shakeIntensity;
        ctx.translate(shakeX, shakeY);
        gameState.shakeAmount *= gameState.shakeDecay;
    } else {
        gameState.shakeAmount = 0;
    }

    // Ground pattern (cached)
    // v0.8.1.2: Animated ground texture for single player arcade mode
    if (isSinglePlayerArcade) {
        // Use direct image drawing for animated scrolling
        const groundImage = groundTextureSystem.getImage();
        if (groundImage && groundImage.complete) {
            ctx.globalAlpha = RENDERING.GROUND_PATTERN_ALPHA;

            const offset = groundTextureSystem.getOffset();
            const tileSize = groundTextureSystem.tileSize;
            const cameraPos = cameraSystem.getPosition();

            // Calculate world bounds for ground tiling (accounting for camera)
            const worldStartX = cameraPos.x - (cameraPos.x % tileSize) - tileSize;
            const worldStartY = cameraPos.y - (cameraPos.y % tileSize) - tileSize;
            const worldEndX = cameraPos.x + canvas.width + tileSize * 2;
            const worldEndY = cameraPos.y + canvas.height + tileSize * 2;

            // Draw tiled pattern in world space (camera transform already applied)
            for (let worldX = worldStartX; worldX < worldEndX; worldX += tileSize) {
                for (let worldY = worldStartY; worldY < worldEndY; worldY += tileSize) {
                    ctx.drawImage(groundImage, worldX, worldY, tileSize, tileSize);
                }
            }

            ctx.globalAlpha = 1.0;
        } else {
            // Fallback to pattern if image not loaded yet
            const groundPattern = renderingCache.getGroundPattern();
            if (groundPattern) {
                ctx.globalAlpha = RENDERING.GROUND_PATTERN_ALPHA;
                ctx.fillStyle = groundPattern;
                // Draw in world space covering visible area
                const cameraPos = cameraSystem.getPosition();
                ctx.fillRect(cameraPos.x, cameraPos.y, canvas.width, canvas.height);
                ctx.globalAlpha = 1.0;
            }
        }
    } else {
        // Non-animated mode: use pattern
        const groundPattern = renderingCache.getGroundPattern();
        if (groundPattern) {
            ctx.globalAlpha = RENDERING.GROUND_PATTERN_ALPHA;
            ctx.fillStyle = groundPattern;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.globalAlpha = 1.0;
        }
    }

    // Vignette overlay will be drawn in screen space after ctx.restore()
    // Store vignette for later use
    let vignetteGradient = null;
    if (vignetteEnabled) {
        vignetteGradient = renderingCache.getVignetteGradient();
    }

    // Lighting overlay will be drawn in screen space after ctx.restore()
    // Store lighting data for later use
    let lightingGradient = null;
    if (lightingEnabled && localPlayer && localPlayer.health > 0) {
        // v0.8.1.2: Convert player world position to screen position for lighting
        let playerScreenX = localPlayer.x;
        let playerScreenY = localPlayer.y;
        if (isSinglePlayerArcade) {
            const screenPos = cameraSystem.worldToScreen(localPlayer.x, localPlayer.y);
            playerScreenX = screenPos.x;
            playerScreenY = screenPos.y;
        }

        // Create lighting gradient in screen space (will be used after ctx.restore())
        const lightingRadius = Math.max(canvas.width, canvas.height) * 0.8;
        lightingGradient = ctx.createRadialGradient(
            playerScreenX, playerScreenY, 0,
            playerScreenX, playerScreenY, lightingRadius
        );
        lightingGradient.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
        lightingGradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.05)');
        lightingGradient.addColorStop(0.6, 'rgba(255, 255, 255, 0.02)');
        lightingGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    }

    // Day/Night Cycle Overlay - will be drawn in screen space after ctx.restore()
    // Calculate ambient light level based on gameTime
    // Day (0.0-0.5): Transparent to slightly dark
    // Night (0.5-1.0): Dark blue/black overlay
    function calculateNightAlpha() {
        let nightAlpha = 0;
        if (gameState.isNight) {
            // Smooth transition: 0.5 -> 0.0 alpha, 0.75 -> 0.6 alpha, 1.0 -> 0.7 alpha
            const nightProgress = (gameState.gameTime - 0.5) * 2; // 0 to 1 during night
            nightAlpha = 0.5 + (nightProgress * 0.2); // 0.5 to 0.7
        } else {
            // Dawn transition: 0.0 -> 0.0 alpha, 0.25 -> 0.3 alpha, 0.5 -> 0.0 alpha
            const dawnProgress = gameState.gameTime * 2; // 0 to 1 during day
            if (dawnProgress < 0.5) {
                nightAlpha = dawnProgress * 0.6; // 0 to 0.3
            } else {
                nightAlpha = (1 - dawnProgress) * 0.6; // 0.3 to 0
            }
        }
        return nightAlpha;
    }

    const nightAlpha = calculateNightAlpha();

    // Damage indicator will be drawn in screen space after ctx.restore()
    // Store damage indicator state for later use
    const damageIndicatorActive = gameState.damageIndicator.active;
    const damageIndicatorIntensity = gameState.damageIndicator.intensity;

    // NOTE: drawParticles() moved to AFTER overlays so particles render on top

    // Draw spawn indicators
    gameState.spawnIndicators.forEach(indicator => {
        const elapsed = Date.now() - indicator.startTime;
        const progress = elapsed / indicator.duration;
        const pulse = Math.sin(progress * Math.PI * 4) * 0.5 + 0.5; // Pulsing effect
        const alpha = 0.3 + pulse * 0.4; // 0.3 to 0.7 alpha
        const radius = 15 + pulse * 10; // 15 to 25 radius

        ctx.save();
        ctx.globalAlpha = alpha;

        // Outer glow
        const gradient = ctx.createRadialGradient(indicator.x, indicator.y, 0, indicator.x, indicator.y, radius);
        gradient.addColorStop(0, 'rgba(255, 23, 68, 0.8)');
        gradient.addColorStop(0.5, 'rgba(255, 23, 68, 0.4)');
        gradient.addColorStop(1, 'rgba(255, 23, 68, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(indicator.x, indicator.y, radius, 0, Math.PI * 2);
        ctx.fill();

        // Inner circle
        ctx.fillStyle = `rgba(255, 23, 68, ${alpha})`;
        ctx.beginPath();
        ctx.arc(indicator.x, indicator.y, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    });

    // Reuse viewport bounds from updateGame (cached per frame)
    const viewport = gameState.cachedViewport || getViewportBounds(canvas);

    // v0.8.1.2: Render props (after ground, before entities) - single player arcade only
    if (isSinglePlayerArcade) {
        propRenderSystem.render(gameState, viewport);
    }

    // Draw entities with viewport culling and small feature culling
    entityRenderSystem.drawEntities(gameState, ctx, viewport);

    drawPlayers();

    ctx.restore();

    // Vignette overlay (drawn in screen space after camera transform is restored)
    if (vignetteGradient) {
        ctx.fillStyle = vignetteGradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Lighting overlay (drawn in screen space after camera transform is restored)
    if (lightingGradient) {
        ctx.fillStyle = lightingGradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Enhanced post-processing: Additional bloom-like glow effect
        if (enhancedPostProcessing) {
            ctx.globalCompositeOperation = 'screen';
            ctx.globalAlpha = 0.15;
            ctx.fillStyle = lightingGradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.globalAlpha = 1.0;
            ctx.globalCompositeOperation = 'source-over';
        }
    }

    // Damage Indicator (drawn in screen space after camera transform is restored)
    if (damageIndicatorActive) {
        ctx.fillStyle = `rgba(255, 0, 0, ${damageIndicatorIntensity * RENDERING.DAMAGE_INDICATOR_ALPHA})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Day/Night Cycle Overlay (drawn in screen space after camera transform is restored)
    if (nightAlpha > 0) {
        ctx.fillStyle = `rgba(10, 10, 30, ${nightAlpha})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Draw particles AFTER all overlays so they're visible on top
    // Particles need to be drawn in world space, so we restore the camera transform
    ctx.save();
    if (isSinglePlayerArcade) {
        cameraSystem.applyTransform(ctx);
    }
    // Apply screen shake for particles too
    if (gameState.shakeAmount > 0.1) {
        const shakeX = (Math.random() - 0.5) * gameState.shakeAmount * shakeIntensity;
        const shakeY = (Math.random() - 0.5) * gameState.shakeAmount * shakeIntensity;
        ctx.translate(shakeX, shakeY);
    }
    drawParticles();
    ctx.restore();

    // v0.8.1.2: Draw damage numbers (convert world coordinates to screen space in single player arcade)
    gameState.damageNumbers.forEach(num => {
        if (isSinglePlayerArcade) {
            // Convert world coordinates to screen coordinates
            const screenPos = cameraSystem.worldToScreen(num.x, num.y);
            // Temporarily override position for drawing
            const originalX = num.x;
            const originalY = num.y;
            num.x = screenPos.x;
            num.y = screenPos.y;
            num.draw(ctx);
            // Restore original position (for update calculations)
            num.x = originalX;
            num.y = originalY;
        } else {
            num.draw(ctx);
        }
    });
    drawCrosshairUtil(mouse);

    // Draw low health vignette before HUD

    if (localPlayer && localPlayer.health > 0) {
        gameHUD.drawLowHealthVignette(localPlayer);
    }

    // Draw contextual tooltips for pickups

    if (gameState.gameRunning && !gameState.gamePaused && localPlayer) {
        const p1 = localPlayer;
        const tooltipDistance = 60;

        // Check health pickups
        const tooltipDistSquared = tooltipDistance * tooltipDistance;
        gameState.healthPickups.forEach(pickup => {
            const dx = pickup.x - p1.x;
            const dy = pickup.y - p1.y;
            const distSquared = dx * dx + dy * dy;
            if (distSquared < tooltipDistSquared && p1.health < PLAYER_MAX_HEALTH) {
                gameHUD.drawTooltip('Walk over to pickup health', pickup.x, pickup.y - pickup.radius - 5);
            }
        });

        // Check ammo pickups
        gameState.ammoPickups.forEach(pickup => {
            const dx = pickup.x - p1.x;
            const dy = pickup.y - p1.y;
            const distSquared = dx * dx + dy * dy;
            if (distSquared < tooltipDistSquared && (p1.currentAmmo < p1.maxAmmo || p1.grenadeCount < MAX_GRENADES)) {
                gameHUD.drawTooltip('Walk over to pickup ammo', pickup.x, pickup.y - pickup.radius - 5);
            }
        });

        // Check power-up pickups
        [...gameState.damagePickups, ...gameState.nukePickups, ...gameState.speedPickups,
        ...gameState.rapidFirePickups, ...gameState.shieldPickups].forEach(pickup => {
            const dx = pickup.x - p1.x;
            const dy = pickup.y - p1.y;
            const distSquared = dx * dx + dy * dy;
            if (distSquared < tooltipDistSquared) {
                let tooltipText = 'Walk over to pickup power-up';
                if (pickup.type === 'damage') tooltipText = 'Double Damage Power-Up';
                else if (pickup.type === 'nuke') tooltipText = 'Tactical Nuke Power-Up';
                else if (pickup.type === 'speed') tooltipText = 'Speed Boost Power-Up';
                else if (pickup.type === 'rapidfire') tooltipText = 'Rapid Fire Power-Up';
                else if (pickup.type === 'shield') tooltipText = 'Shield Power-Up';
                else if (pickup.type === 'adrenaline') tooltipText = 'Adrenaline Shot Power-Up';
                gameHUD.drawTooltip(tooltipText, pickup.x, pickup.y - pickup.radius - 5);
            }
        });
    }

    gameHUD.draw();
    if (gameState.gameRunning && !gameState.gamePaused) {
        gameHUD.drawCompass();
    }
    drawWaveNotification();
    drawWaveBreak();
    drawFpsCounter();
}

function gameOver() {
    gameStateManager.gameOver();
}

function restartGame() {
    // Track restart for badge
    playerProfileSystem.trackGameRestart();
    gameStateManager.restartGame();
}

function startGame() {
    gameStateManager.startGame();
}

function cycleWeapon(direction, player) {
    player = player || gameState.players[0];
    const weaponKeys = Object.keys(WEAPONS);
    let currentIndex = weaponKeys.findIndex(key => WEAPONS[key] === player.currentWeapon);

    if (currentIndex === -1) currentIndex = 0;

    let newIndex = currentIndex + direction;
    if (newIndex >= weaponKeys.length) newIndex = 0;
    if (newIndex < 0) newIndex = weaponKeys.length - 1;

    switchWeapon(WEAPONS[weaponKeys[newIndex]], player);
}

let activeInputSource = 'mouse';

gameEngine.update = (dt) => {
    // FPS is calculated in draw

    if (gameState.showCoopLobby) {
        updateCoopLobby();
    }
    else if (!gameState.showMainMenu && !gameState.gamePaused && !gameState.showLobby && !gameState.showAILobby && !gameState.showGallery && !gameState.showAbout) {
        updateGame();
    }

    // Update Input
    inputSystem.update(settingsManager.settings.gamepad);

    // Check for Gamepad Actions (Mostly P1 if we allow it, or Global Menus)
    if (inputSystem.isConnected() && !gameState.showSettingsPanel && !gameState.showMainMenu && !gameState.showLobby && !gameState.showCoopLobby && !gameState.showAILobby && !gameState.showGallery && !gameState.showAbout && gameState.gameRunning) {

        // Find local player using gamepad
        const localPlayer = gameState.players.find(p => p.inputSource === 'gamepad');

        // If local player uses gamepad
        if (localPlayer) {
            const p1 = localPlayer;
            activeInputSource = 'gamepad';
            // Use stored index if available, else 0
            const gpIndex = p1.gamepadIndex !== undefined && p1.gamepadIndex !== null ? p1.gamepadIndex : 0;
            const gpState = inputSystem.getGamepad(gpIndex);

            if (!gameState.gamePaused && gpState) {
                if (gpState.buttons.reload.justPressed) reloadWeapon(p1);
                if (gpState.buttons.grenade.justPressed) {
                    const gpAim = gpState.axes.aim;
                    let target = {
                        x: p1.x + gpAim.x * 300,
                        y: p1.y + gpAim.y * 300
                    };
                    throwGrenade(target, canvas, p1);
                }
                if (gpState.buttons.prevWeapon.justPressed) cycleWeapon(-1, p1);
                if (gpState.buttons.nextWeapon.justPressed) cycleWeapon(1, p1);
                if (gpState.buttons.melee.justPressed) performMeleeAttack(p1);
                if (gpState.buttons.fire.pressed) {
                    const gpAim = gpState.axes.aim;
                    let target = {
                        x: p1.x + gpAim.x * 200,
                        y: p1.y + gpAim.y * 200
                    };
                    shootBullet(target, canvas, p1);
                }
                if (gpState.buttons.pause.justPressed) togglePause();
            }
        }

        // Pause handling for P2 too?
        // Iterate all players to check for pause?
        // For now just global pause from any gamepad is fine
        const gpState = inputSystem.getAnyGamepad();
        if (gpState && gpState.buttons.pause.justPressed && gameState.gameRunning) {
            togglePause();
        }
    }

    // Pause Menu Navigation
    if (gameState.gamePaused) {
        const gpState = inputSystem.getAnyGamepad();
        if (gpState) {
            if (gpState.buttons.pause.justPressed) resumeGame();
            if (gpState.buttons.reload.justPressed) restartGame();
        }
    }
};

gameEngine.draw = () => {
    const now = performance.now();
    gameState.framesSinceFpsUpdate++;
    if (now - gameState.lastFpsUpdateTime >= 500) {
        gameState.fps = Math.round((gameState.framesSinceFpsUpdate * 1000) / (now - gameState.lastFpsUpdateTime));
        gameState.framesSinceFpsUpdate = 0;
        gameState.lastFpsUpdateTime = now;
    }

    // Note: WebGPU render is called AFTER drawGame() so particles are synced before rendering
    // This ensures particles synced in drawParticles() are included in the WebGPU frame

    if (gameState.showCoopLobby) {
        gameHUD.draw(); // Draw lobby
    }
    else if (!gameState.showMainMenu && !gameState.gamePaused && !gameState.showLobby && !gameState.showAILobby && !gameState.showGallery && !gameState.showAbout) {
        drawGame(); // Only draw game if not in lobby/menu
    }
    // Only draw game if not in lobbies/main menu (drawGame handles mainmenu/lobby drawing internally too but structured oddly)
    // Let's rely on drawGame() for everything except pure lobby updates
    else if (gameState.showMainMenu || gameState.showLobby || gameState.showAILobby || gameState.showGallery || gameState.showAbout) {
        drawGame();
    }
    // If paused
    else if (gameState.gamePaused) {
        drawGame();
    }

    // Render WebGPU layer (background/compute) AFTER drawGame() so particles are synced first
    if (isWebGPUActive()) {
        const dt = gameEngine.timeStep || 16.67; // Use engine timestep or default to ~60fps
        // Pass camera position for parallax
        const cameraPos = cameraSystem.getPosition();
        webgpuRenderer.render(dt, cameraPos);
    }
};

// Event Listeners
document.addEventListener('keydown', (e) => {
    activeInputSource = 'mouse';

    // Chat input handling (when chat is focused)
    if (gameState.showLobby && gameState.multiplayer.chatFocused && !gameState.multiplayer.isGameStarting) {
        if (e.key === 'Enter') {
            e.preventDefault();
            // Send message
            const message = gameState.multiplayer.chatInput?.trim();
            if (message && message.length > 0 && message.length <= 200) {
                multiplayerSystem.sendChatMessage(message);
                gameState.multiplayer.chatInput = '';
            }
            gameState.multiplayer.chatFocused = false;
            return;
        } else if (e.key === 'Escape') {
            e.preventDefault();
            // Clear input and unfocus
            gameState.multiplayer.chatInput = '';
            gameState.multiplayer.chatFocused = false;
            return;
        } else if (e.key === 'Backspace') {
            e.preventDefault();
            // Handle backspace
            if (gameState.multiplayer.chatInput) {
                gameState.multiplayer.chatInput = gameState.multiplayer.chatInput.slice(0, -1);
            }
            return;
        } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
            // Regular character input (prevent default to avoid browser shortcuts)
            e.preventDefault();
            if (gameState.multiplayer.chatInput.length < 200) {
                gameState.multiplayer.chatInput += e.key;
            }
            return;
        }
    }

    if (e.key === 'Escape') {
        if (gameState.showSettingsPanel) {
            if (settingsPanel.rebindingAction) {
                settingsPanel.cancelRebind();
                return;
            }
            gameState.showSettingsPanel = false;
            settingsPanel.close();
            return;
        }
    }

    if (gameState.showSettingsPanel) {
        if (settingsPanel.rebindingAction) {
            e.preventDefault();
            settingsPanel.handleRebind(e.key);
            return;
        }
        // Allow ESC to close settings
        if (e.key === 'Escape') {
            gameState.showSettingsPanel = false;
            settingsPanel.close();
            return;
        }
    }

    // Prevent game input when chat is focused
    if (gameState.multiplayer.chatFocused) return;

    if (gameState.showMainMenu) return;
    if (gameState.showSettingsPanel) return;

    const key = e.key.toLowerCase();
    keys[key] = true;

    if (e.key === 'Escape') {
        togglePause();
    }

    const controls = settingsManager.settings.controls;
    const localPlayer = gameState.players.find(p => p.inputSource === 'mouse');

    // Weapon switching
    if (keys[controls.weapon1] && localPlayer) switchWeapon(WEAPONS.pistol, localPlayer);
    if (keys[controls.weapon2] && localPlayer) switchWeapon(WEAPONS.shotgun, localPlayer);
    if (keys[controls.weapon3] && localPlayer) switchWeapon(WEAPONS.rifle, localPlayer);
    if (keys[controls.weapon4] && localPlayer) switchWeapon(WEAPONS.flamethrower, localPlayer);
    if (keys[controls.weapon5] && localPlayer) switchWeapon(WEAPONS.smg, localPlayer);
    if (keys[controls.weapon6] && localPlayer) switchWeapon(WEAPONS.sniper, localPlayer);
    if (keys[controls.weapon7] && localPlayer) switchWeapon(WEAPONS.rocketLauncher, localPlayer);

    // Actions
    if (key === controls.grenade && localPlayer) {
        // v0.8.1.2: In single player arcade mode, convert mouse coordinates to world space
        const isSinglePlayerArcade = !gameState.isCoop && !gameState.multiplayer.active;
        let target = mouse;
        if (isSinglePlayerArcade) {
            const worldPos = cameraSystem.screenToWorld(mouse.x, mouse.y);
            target = { x: worldPos.x, y: worldPos.y };
        }
        throwGrenade(target, canvas, localPlayer);
    }
    if (key === controls.reload && gameState.gameRunning && !gameState.gamePaused && localPlayer) reloadWeapon(localPlayer);
    if (key === controls.melee && gameState.gameRunning && !gameState.gamePaused && localPlayer) performMeleeAttack(localPlayer);

    if (gameState.gamePaused || (!gameState.gameRunning && !gameHUD.gameOver)) {
        if (key === controls.reload) restartGame();
        if (gameState.gamePaused && (key === 'm')) restartGame();
    }
});

document.addEventListener('keyup', (e) => keys[e.key.toLowerCase()] = false);

// Helper function to get accurate mouse coordinates accounting for canvas scaling
function getCanvasMousePos(e) {
    const rect = canvas.getBoundingClientRect();

    // Calculate scale factors between internal canvas resolution and displayed size
    // This accounts for RENDER_SCALE and any CSS scaling
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    // Get mouse position relative to canvas element
    // rect.left/top account for any CSS positioning, borders, or padding
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    return { x, y };
}

canvas.addEventListener('mousemove', (e) => {
    activeInputSource = 'mouse';

    const pos = getCanvasMousePos(e);
    mouse.x = pos.x;
    mouse.y = pos.y;

    // Handle news ticker dragging
    if (gameHUD.newsTickerDragging) {
        gameHUD.updateNewsTickerDrag(mouse.x);
    }

    if (gameState.showSettingsPanel) {
        settingsPanel.handleMouseMove(mouse.x, mouse.y);
    } else if (gameState.showLevelUp) {
        gameHUD.updateLevelUpHover(mouse.x, mouse.y);
    } else if (gameState.showMainMenu || gameState.showLobby || gameState.showCoopLobby || gameState.showAILobby || gameState.showAbout || gameState.showGallery || gameState.gamePaused || gameHUD.gameOver) {
        gameHUD.updateMenuHover(mouse.x, mouse.y);
    }
});

canvas.addEventListener('mousedown', (e) => {
    activeInputSource = 'mouse';

    const pos = getCanvasMousePos(e);
    const clickX = pos.x;
    const clickY = pos.y;

    if (gameState.showSettingsPanel) {
        settingsPanel.handleClick(clickX, clickY);
        return;
    }

    // Level Up Screen
    if (gameState.showLevelUp) {
        const selectedIndex = gameHUD.checkLevelUpClick(clickX, clickY);
        if (selectedIndex !== null && gameState.levelUpChoices[selectedIndex]) {
            const selectedSkill = gameState.levelUpChoices[selectedIndex];
            skillSystem.activateSkill(selectedSkill.id);
            gameState.showLevelUp = false;
            gameState.levelUpChoices = [];
        }
        return;
    }

    // Main Menu
    if (gameState.showMainMenu) {
        // Check for news ticker drag first
        if (gameHUD.startNewsTickerDrag(clickX, clickY)) {
            return; // Don't process button clicks if starting drag
        }

        const clickedButton = gameHUD.checkMenuButtonClick(clickX, clickY);

        // Try to start menu music on first interaction if it's not playing
        initAudio();
        if (!gameState.menuMusicMuted) {
            if (!gameState.menuMusicMuted) {
                playMenuMusic();
            }
        }

        if (clickedButton === 'single') {
            gameState.isCoop = false;
            gameState.multiplayer.active = false; // Ensure multiplayer is disabled for arcade mode
            startGame();
        } else if (clickedButton === 'survival') {
            // Survival mode is coming soon - button is disabled
            // Do nothing for now
        } else if (clickedButton === 'campaign') {
            gameState.isCoop = false;
            gameState.multiplayer.active = false; // Ensure multiplayer is disabled for arcade mode
            startGame(); // TODO: Implement campaign mode
        } else if (clickedButton === 'local_coop') {
            gameState.showMainMenu = false;
            gameState.showCoopLobby = true;
            // Reset to P1
            gameState.players = [gameState.players[0]];
        } else if (clickedButton === 'play_ai') {
            gameState.showMainMenu = false;
            gameState.showAILobby = true;
            gameState.isCoop = false;
            // Reset to P1 only
            gameState.players = [gameState.players[0]];
        } else if (clickedButton === 'settings') {
            gameState.showSettingsPanel = true;
            settingsPanel.open();
            playerProfileSystem.trackSettingsVisit();
        } else if (clickedButton === 'username') {
            const newUsername = window.prompt('Enter your name:', gameState.username);
            if (newUsername !== null && newUsername.trim() !== '') {
                gameState.username = newUsername.trim();
                saveUsername();
                playerProfileSystem.setUsername(gameState.username);
                // Update username on server if connected to multiplayer
                multiplayerSystem.updateUsernameOnServer();
            }
        } else if (clickedButton === 'multiplayer') {
            gameState.showMainMenu = false;
            gameState.showLobby = true;
            connectToMultiplayer();
        } else if (clickedButton === 'gallery') {
            gameState.showGallery = true;
            gameState.showMainMenu = false;
            playerProfileSystem.trackGalleryVisit();
            // Reset gallery scroll when entering
            if (gameHUD.galleryScrollY !== undefined) {
                gameHUD.galleryScrollY = 0;
                gameHUD.galleryTargetScrollY = 0;
            }
        } else if (clickedButton === 'about') {
            gameState.showAbout = true;
            gameState.showMainMenu = false;
        } else if (clickedButton === 'profile') {
            gameState.showProfile = true;
            gameState.showMainMenu = false;
        } else if (clickedButton === 'achievements') {
            gameState.showAchievements = true;
            gameState.showMainMenu = false;
            playerProfileSystem.trackAchievementVisit();
        } else if (clickedButton === 'battlepass') {
            gameState.showBattlepass = true;
            gameState.showMainMenu = false;
        } else if (clickedButton === 'mute_music') {
            gameState.menuMusicMuted = !gameState.menuMusicMuted;
            saveMenuMusicMuted();
            if (gameState.menuMusicMuted) {
                stopMenuMusic();
            } else {
                playMenuMusic();
            }
        }
        return;
    }

    // Gallery Screen
    if (gameState.showGallery) {
        const clickedButton = gameHUD.checkMenuButtonClick(clickX, clickY);
        if (clickedButton === 'gallery_back') {
            gameState.showGallery = false;
            gameState.showMainMenu = true;
        }
        return;
    }

    // About Screen
    if (gameState.showAbout) {
        const clickedButton = gameHUD.checkMenuButtonClick(clickX, clickY);
        if (clickedButton === 'about_back') {
            gameState.showAbout = false;
            gameState.showMainMenu = true;
        }
        return;
    }

    // Profile Screen - click handling now done via DOM events in overlay
    // No need to handle canvas clicks, the overlay handles all interactions
    if (gameState.showProfile) {
        return;
    }

    // Achievement Screen - click handling now done via DOM events in overlay
    // No need to handle canvas clicks, the overlay handles all interactions
    if (gameState.showAchievements) {
        return;
    }

    // Battlepass Screen - click handling now done via DOM events in overlay
    // No need to handle canvas clicks, the overlay handles all interactions
    if (gameState.showBattlepass) {
        return;
    }

    // Multiplayer Lobby
    if (gameState.showLobby) {
        const clickedButton = gameHUD.checkMenuButtonClick(clickX, clickY);

        // Handle chat input click
        if (clickedButton === 'chat_input') {
            gameState.multiplayer.chatFocused = true;
            if (!gameState.multiplayer.chatInput) {
                gameState.multiplayer.chatInput = '';
            }
            return;
        } else if (clickedButton !== null) {
            // Clicked elsewhere - unfocus chat
            gameState.multiplayer.chatFocused = false;
        }

        if (clickedButton === 'lobby_back') {
            gameState.showLobby = false;
            gameState.showMainMenu = true;
            gameState.multiplayer.chatFocused = false; // Unfocus chat when leaving lobby
            if (!gameState.menuMusicMuted) {
                playMenuMusic();
            }
        } else if (clickedButton === 'lobby_start') {
            // Leader starts game - emit to server
            if (gameState.multiplayer.socket && gameState.multiplayer.isLeader) {
                gameState.multiplayer.socket.emit('game:start');
            }
        } else if (clickedButton === 'lobby_ready') {
            // Toggle ready state
            console.log('[Ready Button] Click detected', {
                hasSocket: !!gameState.multiplayer.socket,
                socketConnected: gameState.multiplayer.socket?.connected,
                isLeader: gameState.multiplayer.isLeader,
                currentReady: gameState.multiplayer.isReady
            });

            if (gameState.multiplayer.socket && gameState.multiplayer.socket.connected) {
                console.log('[Ready Button] Emitting player:ready to server');
                gameState.multiplayer.socket.emit('player:ready');
            } else {
                console.warn('[Ready Button] Cannot emit - socket missing or not connected', {
                    socket: gameState.multiplayer.socket,
                    connected: gameState.multiplayer.socket?.connected
                });
            }
        }
        return;
    }

    // AI Lobby
    if (gameState.showAILobby) {
        const clickedButton = gameHUD.checkMenuButtonClick(clickX, clickY);
        if (clickedButton === 'ai_back') {
            gameState.showAILobby = false;
            gameState.showMainMenu = true;
            // Remove all AI players when leaving lobby
            gameState.players = [gameState.players[0]];
            if (!gameState.menuMusicMuted) {
                playMenuMusic();
            }
        } else if (clickedButton === 'ai_add') {
            addAIPlayer();
        } else if (clickedButton === 'ai_start') {
            // Start game with AI
            gameState.showAILobby = false;
            gameState.isCoop = true; // Enable multi-player logic
            initAudio();
            startGame();
        }
        return;
    }

    // Coop Lobby
    if (gameState.showCoopLobby) {
        const clickedButton = gameHUD.checkMenuButtonClick(clickX, clickY);
        if (clickedButton === 'coop_back') {
            gameState.showCoopLobby = false;
            gameState.showMainMenu = true;
            if (!gameState.menuMusicMuted) {
                playMenuMusic();
            }
        } else if (clickedButton === 'coop_start') {
            // Start coop game
            gameState.showCoopLobby = false;
            gameState.isCoop = true;
            initAudio();
            startGame();
        }
        return;
    }

    // Game Over Screen
    if (gameHUD.gameOver) {
        const clickedButton = gameHUD.checkMenuButtonClick(clickX, clickY);
        if (clickedButton === 'gameover_lobby') {
            // Return to multiplayer lobby
            gameState.showLobby = true;
            gameState.showMainMenu = false;
            gameState.gameRunning = false;
            gameState.isCoop = false;
            gameState.gamePaused = false;
            gameHUD.hideGameOver();
            if (!gameState.menuMusicMuted) {
                playMenuMusic();
            }

            // Reset multiplayer game starting state to prevent stuck "GO!" screen
            gameState.multiplayer.isGameStarting = false;
            gameState.multiplayer.gameStartTime = 0;

            // Ensure multiplayer connection is active
            if (!gameState.multiplayer.socket || !gameState.multiplayer.connected) {
                connectToMultiplayer();
            } else {
                // Socket is connected - re-register player to rejoin lobby
                gameState.multiplayer.active = true;
                gameState.multiplayer.isReady = false; // Reset ready state
                // Re-register with server to ensure we're back in the lobby
                if (gameState.multiplayer.socket.connected) {
                    multiplayerSystem.updateUsernameOnServer();
                }
            }

            resetGameState(canvas.width, canvas.height);
        } else if (clickedButton === 'gameover_menu') {
            // Return to main menu
            restartGame();
        }
        return;
    }

    // Pause Menu
    if (gameState.gamePaused && !gameState.showSettingsPanel) {
        const clickedButton = gameHUD.checkMenuButtonClick(clickX, clickY);
        if (clickedButton === 'pause_resume') {
            resumeGame();
        } else if (clickedButton === 'pause_restart') {
            restartGame();
        } else if (clickedButton === 'pause_settings') {
            gameState.showSettingsPanel = true;
            settingsPanel.open();
            playerProfileSystem.trackSettingsVisit();
        } else if (clickedButton === 'pause_menu') {
            restartGame();
        }
        return;
    }

    if (gameState.gameRunning && !gameState.gamePaused) {
        if (e.button === 0) {
            initAudio();
            mouse.isDown = true;
            // Handled in updateGame loop
        } else if (e.button === 2) {
            const localPlayer = gameState.players.find(p => p.inputSource === 'mouse');
            if (localPlayer) performMeleeAttack(localPlayer);
        }
    }
});

canvas.addEventListener('mouseup', (e) => {
    if (e.button === 0) mouse.isDown = false;
    if (gameHUD.newsTickerDragging) {
        gameHUD.endNewsTickerDrag();
    }
    if (gameState.showSettingsPanel) settingsPanel.handleMouseUp();
});

canvas.addEventListener('contextmenu', (e) => e.preventDefault());
canvas.addEventListener('mouseleave', () => mouse.isDown = false);

canvas.addEventListener('wheel', (e) => {
    if (gameState.showSettingsPanel) {
        settingsPanel.handleWheel(e);
        return;
    }

    // Gallery scrolling
    if (gameState.showGallery) {
        e.preventDefault();
        const scrollSpeed = 30;
        if (gameHUD.galleryTargetScrollY !== undefined) {
            gameHUD.galleryTargetScrollY -= e.deltaY * 0.5; // Invert for natural scrolling
        }
        return;
    }

    // Achievement screen scrolling - now handled by DOM overlay
    if (gameState.showAchievements) {
        e.preventDefault(); // Prevent page scroll, overlay handles its own scrolling
        return;
    }

    // Battlepass screen scrolling - now handled by DOM overlay
    if (gameState.showBattlepass) {
        e.preventDefault(); // Prevent page scroll, overlay handles its own scrolling
        return;
    }

    // Only handle scroll wheel weapon switching if enabled and game is running
    if (!settingsManager.getSetting('controls', 'scrollWheelSwitch')) return;
    if (!gameState.gameRunning || gameState.gamePaused) return;
    if (gameState.showMainMenu || gameState.showLobby ||
        gameState.showCoopLobby || gameState.showAILobby) return;

    const localPlayer = gameState.players.find(p => p.inputSource === 'mouse');
    if (!localPlayer || localPlayer.health <= 0) return;

    // Prevent default scrolling
    e.preventDefault();

    // Cycle weapon based on scroll direction
    // deltaY > 0 means scrolling down (next weapon), < 0 means scrolling up (previous weapon)
    const direction = Math.sign(e.deltaY);
    cycleWeapon(direction, localPlayer);
});

// Focus/Blur handling for auto-pause
window.addEventListener('blur', () => {
    if (gameState.gameRunning && !gameState.gamePaused && !gameState.showMainMenu) {
        const pauseOnFocusLoss = settingsManager.getSetting('gameplay', 'pauseOnFocusLoss') !== false;
        if (pauseOnFocusLoss) {
            pauseGame();
        }
    }
});

// Initialization
loadHighScore();
loadUsername();

// Initialize Profile System (after username is loaded)
playerProfileSystem.loadProfile();
playerProfileSystem.initializeSystems();

// Sync username from profile if it exists
const profile = playerProfileSystem.getProfile();
if (profile && profile.username) {
    gameState.username = profile.username;
}
loadMenuMusicMuted();
loadMultiplierStats();
checkServerHealth(); // Start checking server status
gameHUD.leaderboardDisplay.fetch(); // Fetch initial leaderboard

// Make clearScoreboard available globally for console access
window.clearScoreboard = clearScoreboard;

gameEngine.start();
