import {
    WEAPONS, MELEE_RANGE, MELEE_DAMAGE, MELEE_COOLDOWN, MELEE_SWIPE_DURATION,
    HEALTH_PICKUP_SPAWN_INTERVAL, MAX_HEALTH_PICKUPS,
    AMMO_PICKUP_SPAWN_INTERVAL, MAX_AMMO_PICKUPS,
    PLAYER_BASE_SPEED, PLAYER_SPRINT_SPEED,
    PLAYER_STAMINA_MAX, PLAYER_STAMINA_DRAIN, PLAYER_STAMINA_REGEN, PLAYER_STAMINA_REGEN_DELAY,
    MAX_LOCAL_PLAYERS,
    MAX_GRENADES,
    TWO_PI
} from './core/constants.js';
import { canvas, ctx, gpuCanvas, uiCanvas, uiCtx, resizeCanvas, applyTextRenderingQualityToAll } from './core/canvas.js';
import { gameState, resetGameState, createPlayer } from './core/gameState.js';
import { settingsManager } from './systems/SettingsManager.js';
import { initAudio, playFootstepSound, playDamageSound, playKillSound, playRestartSound, playMenuMusic, stopMenuMusic, pauseGameMusic, resumeGameMusic, isAudioInitialized } from './systems/AudioSystem.js';
import { initGroundPattern } from './systems/GraphicsSystem.js';
import { renderingCache } from './systems/RenderingCache.js';
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
    shootBullet, reloadWeapon, switchWeapon, throwGrenade, cycleThrowable, triggerExplosion
} from './utils/combatUtils.js';
import {
    triggerDamageIndicator,
    loadHighScore, saveHighScore, loadUsername, saveUsername, loadMenuMusicMuted, saveMenuMusicMuted,
    loadMultiplierStats, clearScoreboard
} from './utils/gameUtils.js';

// Make triggerDamageIndicator available globally for AcidPool
window.triggerDamageIndicator = triggerDamageIndicator;
import { inputSystem } from './systems/InputSystem.js';
import { GameEngine } from './core/GameEngine.js';
import { CompanionSystem } from './companions/CompanionSystem.js';
import { WebGPURenderer } from './core/WebGPURenderer.js';
import { skillSystem } from './systems/SkillSystem.js';
import { cameraSystem } from './systems/CameraSystem.js';
import { GameLoopSystem } from './systems/GameLoopSystem.js';
import { SERVER_URL } from './core/constants.js';
import { MultiplayerSystem } from './systems/MultiplayerSystem.js';
import { ZombieSpawnSystem } from './systems/ZombieSpawnSystem.js';
import { PlayerSystem } from './systems/PlayerSystem.js';
import { GameStateManager } from './systems/GameStateManager.js';
import { scrapShopSystem } from './systems/ScrapShopSystem.js';
import { MeleeSystem } from './systems/MeleeSystem.js';
import { playerProfileSystem } from './systems/PlayerProfileSystem.js';
import { ProfileScreen } from './ui/ProfileScreen.js';
import { AchievementScreen } from './ui/AchievementScreen.js';
import { BattlepassScreen } from './ui/BattlepassScreen.js';
import { BadgeScreen } from './ui/BadgeScreen.js';
import { bloodSimulationSystem } from './systems/BloodSimulationSystem.js';
import { TouchControlSystem } from './systems/TouchControlSystem.js';

// Initialize Game Engine
const gameEngine = new GameEngine();
// Make gameEngine globally accessible for settings panel
window.gameEngine = gameEngine;

// Initialize Companion System
const companionSystem = new CompanionSystem();
// Make companionSystem globally accessible
window.companionSystem = companionSystem;

// Initialize HUD (needed by GameStateManager)
const gameHUD = new GameHUD(uiCanvas);
window.gameHUD = gameHUD; // Make globally accessible for text rendering quality

// Initialize profile UI screens
const profileScreen = new ProfileScreen(uiCanvas);
const achievementScreen = new AchievementScreen(uiCanvas);
const battlepassScreen = new BattlepassScreen(uiCanvas);
const badgeScreen = new BadgeScreen(uiCanvas);
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
const settingsPanel = new SettingsPanel(uiCanvas, settingsManager);
window.settingsPanel = settingsPanel; // Make globally accessible for text rendering quality

// Apply initial text rendering quality
applyTextRenderingQualityToAll();

// v0.8.1.2: Ground texture loads when arcade run starts (see GameStateManager.startGame)

// Initialize volumetric blood simulation settings only — grid allocates on first gameplay use
bloodSimulationSystem.init();

// Initialize Touch Controls
const touchControlSystem = new TouchControlSystem(uiCanvas);
inputSystem.setVirtualState(touchControlSystem.getVirtualState());

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

function scheduleWebGPUInit() {
    webgpuRenderer.init().then(initialized => {
        if (initialized) {
            applyWebGPUSettings();
        }
        updateGpuCanvasVisibility();
    });
}

if (typeof requestIdleCallback === 'function') {
    requestIdleCallback(scheduleWebGPUInit, { timeout: 2500 });
} else {
    setTimeout(scheduleWebGPUInit, 500);
}

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



    if (webgpuActive) {
        gpuCanvas.style.display = 'block';
        gpuCanvas.style.visibility = 'visible';
        gpuCanvas.style.opacity = '1';

    } else {
        gpuCanvas.style.display = 'none';
        gpuCanvas.style.visibility = 'hidden';
        gpuCanvas.style.opacity = '0';

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
    const zombobsFX = settingsManager.getSetting('video', 'zombobsFXEnabled') ?? true;
    webgpuRenderer.setZombobsFXEnabled(zombobsFX);
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
            if (key === 'zombobsFXEnabled') {
                webgpuRenderer.setZombobsFXEnabled(value);
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
    pauseGameMusic();

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
    resumeGameMusic();

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

const inputSourceState = { active: 'mouse' };

const gameLoopSystem = new GameLoopSystem({
    gameEngine,
    gameHUD,
    settingsPanel,
    profileScreen,
    achievementScreen,
    battlepassScreen,
    badgeScreen,
    webgpuRenderer,
    touchControlSystem,
    mouse,
    inputSourceState,
    isWebGPUActive,
    updatePlayers,
    drawPlayers,
    onGameOver: () => gameStateManager.gameOver(),
    spawnZombies
});

gameEngine.update = (dt) => {
    // FPS is calculated in draw

    if (gameState.showCoopLobby) {
        updateCoopLobby();
    }
    else if (!gameState.showMainMenu && !gameState.gamePaused && !gameState.showLobby && !gameState.showAILobby && !gameState.showGallery && !gameState.showAbout) {
        gameLoopSystem.update();
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
            inputSourceState.active = 'gamepad';
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

let bootOverlayDismissed = false;
function dismissBootOverlayOnce() {
    if (bootOverlayDismissed) return;
    bootOverlayDismissed = true;
    const el = document.getElementById('boot-overlay');
    if (!el) return;
    el.setAttribute('aria-busy', 'false');
    el.classList.add('boot-overlay--done');
    const removeEl = () => {
        if (el.parentNode) el.remove();
    };
    el.addEventListener('transitionend', removeEl, { once: true });
    window.setTimeout(removeEl, 450);
}

gameEngine.draw = () => {
    dismissBootOverlayOnce();
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
        gameLoopSystem.draw(); // Only draw game if not in lobby/menu
    }
    // Only draw game if not in lobbies/main menu (drawGame handles mainmenu/lobby drawing internally too but structured oddly)
    // Let's rely on drawGame() for everything except pure lobby updates
    else if (gameState.showMainMenu || gameState.showLobby || gameState.showAILobby || gameState.showGallery || gameState.showAbout) {
        gameLoopSystem.draw();
    }
    // If paused
    else if (gameState.gamePaused) {
        gameLoopSystem.draw();
    }

    // Render WebGPU layer (background/compute) AFTER drawGame() so particles are synced first
    if (isWebGPUActive()) {
        const dt = gameEngine.timeStep || 16.67; // Use engine timestep or default to ~60fps
        // Pass camera position for parallax
        const cameraPos = cameraSystem.getPosition();

        // Apply screen shake to WebGPU camera (inverse of translation)
        // If ctx.translate(dx, dy) moves world right, we want background to move right too.
        // In shader: pos = worldPos - cameraPos.
        // To move result right (+dx), we need -(cameraPos) to be larger => cameraPos should be smaller.
        // So cameraPos - shakeOffset.
        const shakeX = gameState.currentShakeX || 0;
        const shakeY = gameState.currentShakeY || 0;

        const shakeCamera = {
            x: cameraPos.x - shakeX,
            y: cameraPos.y - shakeY
        };

        // Disable snow rendering on main menu and other non-gameplay screens
        // Also restrict snow to single player arcade mode as requested
        const isMenu = gameState.showMainMenu || gameState.showLobby || gameState.showAILobby || gameState.showCoopLobby || gameState.showGallery || gameState.showAbout;
        const isArcade = !gameState.isCoop && !gameState.multiplayer.active && (!gameState.gameMode || gameState.gameMode === 'arcade');
        const isGameplay = gameState.gameRunning && !gameState.gamePaused && !isMenu;

        if (webgpuRenderer.setSnowEnabled) {
            // Only enable snow in gameplay, and specifically for arcade mode if requested (user said "should be rendering in arcade")
            // Assuming they want it ONLY in arcade, or at least definitely NOT in menus.
            webgpuRenderer.setSnowEnabled(isGameplay && isArcade);
        }

        // Disable ZombobsFX (Spore Cloud) on menus if it's active
        if (webgpuRenderer.setZombobsFXEnabled) {
            // Only enable spore cloud during gameplay (any mode), but not on menus
            // This respects the user setting 'zombobsFXEnabled' internally in renderer, 
            // but we override it here for menu visibility state.
            // Wait, setZombobsFXEnabled updates the internal flag which might persist if we change settings.
            // A better way is to add a separate 'visible' flag or just rely on this loop being called every frame.
            // Since this loop runs every frame, we can toggle it based on menu state.
            // However, we need to respect the user's setting.
            // Let's assume the user wants it off on menus regardless of setting.
            // We should check if it was enabled by settings first? 
            // The renderer stores 'zombobsFXEnabled'. If we set it to false here, we lose the user's preference if we don't restore it.
            // Actually, applyWebGPUSettings() restores it from settingsManager.
            // But applyWebGPUSettings is only called on init or change.
            // So if we set it false here, it stays false until user changes settings.
            // We need a temporary toggle or pass it to render().
            // Let's modify render() to accept an options object or flags, OR add a 'setMenuMode' to renderer.
            // OR, just update render() in WebGPURenderer to check a new 'renderingEnabled' flag for specific layers.

            // Simpler: Just don't call render() for these layers in WebGPURenderer if we pass a flag.
            // I'll update WebGPURenderer to handle this cleaner in a moment.
            // For now, let's pass a 'renderEffects' flag to render().
        }

        // Actually, let's just pass 'isGameplay' to render() and handle it there?
        // Or better, let's update WebGPURenderer to have 'setGameplayEffectsEnabled'.

        // User said "all webgpu particle are showing".
        // Snow is handled.
        // Spore Cloud (ZombobsFX) needs handling.
        // Game Particles (Explosions) needs handling.

        // If I update WebGPURenderer.js to respect 'isGameplay' state, that's cleanest.

        webgpuRenderer.render(dt, shakeCamera, isGameplay);
    }
};

// Event Listeners
function handleMenuInteraction(clickX, clickY) {
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
            playMenuMusic();
        }

        if (clickedButton === 'single') {
            gameState.isCoop = false;
            gameState.multiplayer.active = false;
            if (isWebGPUActive() && webgpuRenderer.resetSnow) {
                webgpuRenderer.resetSnow();
            }
            startGame();
        } else if (clickedButton === 'campaign') {
            gameState.isCoop = false;
            gameState.multiplayer.active = false;
            gameState.showCampaignIntro = true;
            if (isAudioInitialized()) {
                stopMenuMusic();
            }
            gameHUD.campaignIntroScreen.start(() => startGame());
        } else if (clickedButton === 'local_coop') {
            gameState.showMainMenu = false;
            gameState.showCoopLobby = true;
            gameState.players = [gameState.players[0]];
        } else if (clickedButton === 'play_ai') {
            gameState.showMainMenu = false;
            gameState.showAILobby = true;
            gameState.isCoop = false;
            gameState.players = [gameState.players[0]];
        } else if (clickedButton === 'settings') {
            gameState.showSettingsPanel = true;
            settingsPanel.open();
            playerProfileSystem.trackSettingsVisit();
        } else if (clickedButton === 'username') {
            if (gameHUD.mainMenuScreen) gameHUD.mainMenuScreen.openUsernameModal();
        } else if (clickedButton === 'username_ok') {
            if (gameHUD.mainMenuScreen && gameHUD.mainMenuScreen.usernameInputText.trim() !== '') {
                gameState.username = gameHUD.mainMenuScreen.usernameInputText.trim();
                saveUsername();
                playerProfileSystem.setUsername(gameState.username);
                multiplayerSystem.updateUsernameOnServer();
            }
            if (gameHUD.mainMenuScreen) gameHUD.mainMenuScreen.closeUsernameModal();
        } else if (clickedButton === 'username_cancel' || clickedButton === 'username_background') {
            if (gameHUD.mainMenuScreen) gameHUD.mainMenuScreen.closeUsernameModal();
        } else if (clickedButton === 'username_input') {
            if (gameHUD.mainMenuScreen) gameHUD.mainMenuScreen.usernameInputFocused = true;
        } else if (clickedButton === 'multiplayer') {
            gameState.showMainMenu = false;
            gameState.showLobby = true;
            connectToMultiplayer();
        } else if (clickedButton === 'landing') {
            window.location.href = 'landing.html';
        } else if (clickedButton === 'gallery') {
            gameState.showGallery = true;
            gameState.showMainMenu = false;
            playerProfileSystem.trackGalleryVisit();
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
            if (gameState.menuMusicMuted) stopMenuMusic();
            else playMenuMusic();
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

    // Profile/Achievement/Battlepass handled by overlay DOM

    // Multiplayer Lobby
    if (gameState.showLobby) {
        const clickedButton = gameHUD.checkMenuButtonClick(clickX, clickY);
        if (clickedButton === 'chat_input') {
            gameState.multiplayer.chatFocused = true;
            if (!gameState.multiplayer.chatInput) gameState.multiplayer.chatInput = '';
            return;
        } else if (clickedButton !== null) {
            gameState.multiplayer.chatFocused = false;
        }

        if (clickedButton === 'lobby_back') {
            gameState.showLobby = false;
            gameState.showMainMenu = true;
            gameState.multiplayer.chatFocused = false;
            if (!gameState.menuMusicMuted) playMenuMusic();
        } else if (clickedButton === 'lobby_start') {
            if (gameState.multiplayer.socket && gameState.multiplayer.isLeader) {
                gameState.multiplayer.socket.emit('game:start');
            }
        } else if (clickedButton === 'lobby_ready') {
            if (gameState.multiplayer.socket && gameState.multiplayer.socket.connected) {
                gameState.multiplayer.socket.emit('player:ready');
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
            gameState.players = [gameState.players[0]];
            if (!gameState.menuMusicMuted) playMenuMusic();
        } else if (clickedButton === 'ai_add') {
            addAIPlayer();
        } else if (clickedButton === 'ai_start') {
            gameState.showAILobby = false;
            gameState.isCoop = true;
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
            if (!gameState.menuMusicMuted) playMenuMusic();
        } else if (clickedButton === 'coop_start') {
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
            gameState.showLobby = true;
            gameState.showMainMenu = false;
            gameState.gameRunning = false;
            gameState.isCoop = false;
            gameState.gamePaused = false;
            gameHUD.hideGameOver();
            if (!gameState.menuMusicMuted) playMenuMusic();
            gameState.multiplayer.isGameStarting = false;
            gameState.multiplayer.gameStartTime = 0;
            if (!gameState.multiplayer.socket || !gameState.multiplayer.connected) {
                connectToMultiplayer();
            } else {
                gameState.multiplayer.active = true;
                gameState.multiplayer.isReady = false;
                if (gameState.multiplayer.socket.connected) multiplayerSystem.updateUsernameOnServer();
            }
            resetGameState(canvas.width, canvas.height);
            gameState.particles = [];
            if (isWebGPUActive() && webgpuRenderer.resetSnow) webgpuRenderer.resetSnow();
        } else if (clickedButton === 'gameover_menu') {
            restartGame();
            gameState.particles = [];
        }
        return;
    }

    // Pause Menu
    if (gameState.gamePaused && !gameState.showSettingsPanel) {
        const clickedButton = gameHUD.checkMenuButtonClick(clickX, clickY);
        if (clickedButton === 'pause_resume') resumeGame();
        else if (clickedButton === 'pause_restart') restartGame();
        else if (clickedButton === 'pause_settings') {
            gameState.showSettingsPanel = true;
            settingsPanel.open();
            playerProfileSystem.trackSettingsVisit();
        } else if (clickedButton === 'pause_menu') restartGame();
        return;
    }
}

document.addEventListener('keydown', (e) => {
    inputSourceState.active = 'mouse';

    // Flashlight Toggle
    const flashlightKey = settingsManager.settings.controls.flashlight || 'f';
    if (e.key.toLowerCase() === flashlightKey.toLowerCase() && !gameState.gamePaused && gameState.gameRunning) {
        const localPlayer = gameState.players.find(p => p.inputSource === 'mouse');
        if (localPlayer) {
            if (!localPlayer.flashlight) localPlayer.flashlight = { active: false };
            localPlayer.flashlight.active = !localPlayer.flashlight.active;
        }
    }

    // Username modal input handling (when modal is open)
    if (gameState.showUsernameModal && gameHUD.mainMenuScreen && gameHUD.mainMenuScreen.usernameInputFocused) {
        const result = gameHUD.mainMenuScreen.handleUsernameModalKey(e.key);
        if (result === 'submit') {
            e.preventDefault();
            // Submit username
            if (gameHUD.mainMenuScreen.usernameInputText.trim() !== '') {
                gameState.username = gameHUD.mainMenuScreen.usernameInputText.trim();
                saveUsername();
                playerProfileSystem.setUsername(gameState.username);
                multiplayerSystem.updateUsernameOnServer();
            }
            gameHUD.mainMenuScreen.closeUsernameModal();
            return;
        } else if (result === 'cancel') {
            e.preventDefault();
            // Cancel modal
            gameHUD.mainMenuScreen.closeUsernameModal();
            return;
        } else if (result === true) {
            // Character input handled
            e.preventDefault();
            return;
        }
    }

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

        // Handle HTML overlays closing via Escape
        if (gameState.showProfile) { gameState.showProfile = false; return; }
        if (gameState.showAchievements) { gameState.showAchievements = false; return; }
        if (gameState.showBattlepass) { gameState.showBattlepass = false; return; }
        if (gameState.showBadges) { gameState.showBadges = false; return; }
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
    if (gameState.showProfile || gameState.showAchievements || gameState.showBattlepass || gameState.showBadges) return;

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
    if (keys[controls.weapon8] && localPlayer) switchWeapon(WEAPONS.laser, localPlayer);

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
    if (key === controls.cycleThrowable && localPlayer) cycleThrowable(localPlayer);
    if (key === controls.melee && gameState.gameRunning && !gameState.gamePaused && localPlayer) performMeleeAttack(localPlayer);
    if (key === 'e' && gameState.gameRunning && !gameState.gamePaused && localPlayer && gameState.waveBreakActive) {
        scrapShopSystem.tryPurchase(localPlayer);
    }

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

// Use window for mouse events to ensure we catch them even if uiCanvas blocks canvas
window.addEventListener('mousemove', (e) => {
    inputSourceState.active = 'mouse';

    const pos = getCanvasMousePos(e);
    mouse.x = pos.x;
    mouse.y = pos.y;

    // Always update GameHUD mouse position so cursor works even when Settings Panel blocks normal updateMenuHover
    if (gameHUD) {
        gameHUD.mouseX = mouse.x;
        gameHUD.mouseY = mouse.y;
    }

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

window.addEventListener('mousedown', (e) => {
    // Check if click is within canvas bounds
    const rect = canvas.getBoundingClientRect();
    if (e.clientX < rect.left || e.clientX > rect.right ||
        e.clientY < rect.top || e.clientY > rect.bottom) {
        return;
    }

    inputSourceState.active = 'mouse';

    const pos = getCanvasMousePos(e);

    // Use common handler for all menu interactions
    handleMenuInteraction(pos.x, pos.y);

    // Gameplay Mouse Input (Shooting / Melee)
    // Only process if not on a menu screen
    if (gameState.gameRunning && !gameState.gamePaused && !gameState.showMainMenu &&
        !gameState.showLobby && !gameState.showCoopLobby && !gameState.showAILobby &&
        !gameState.showGallery && !gameState.showAbout && !gameState.showLevelUp && !gameHUD.gameOver) {

        if (e.button === 0) {
            initAudio();
            mouse.isDown = true;
            // Firing is handled in updateGame loop while mouse.isDown is true
        } else if (e.button === 2) {
            const localPlayer = gameState.players.find(p => p.inputSource === 'mouse');
            if (localPlayer) performMeleeAttack(localPlayer);
        }
    }
});

window.addEventListener('mouseup', (e) => {
    if (e.button === 0) mouse.isDown = false;
    if (gameHUD.newsTickerDragging) {
        gameHUD.endNewsTickerDrag();
    }
    if (gameState.showSettingsPanel) settingsPanel.handleMouseUp();
});

window.addEventListener('contextmenu', (e) => e.preventDefault());
window.addEventListener('mouseleave', () => mouse.isDown = false);

window.addEventListener('wheel', (e) => {
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

// Helper function to get accurate touch coordinates
function getCanvasTouchPos(e) {
    const touchList = e.touches && e.touches.length > 0 ? e.touches : e.changedTouches;
    if (!touchList || touchList.length === 0) return null;

    // Use the bounding rect of the target element (likely the canvas)
    // This accounts for CSS scaling and positioning
    const rect = e.target.getBoundingClientRect();
    const touch = touchList[0];

    // Calculate scale relative to the game's internal resolution (canvas.width/height)
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = (touch.clientX - rect.left) * scaleX;
    const y = (touch.clientY - rect.top) * scaleY;
    return { x, y };
}

// Helper function to get UI touch coordinates (for GameHUD interaction)
function getUiTouchPos(e) {
    if (!uiCanvas) return getCanvasTouchPos(e);
    const touchList = e.touches && e.touches.length > 0 ? e.touches : e.changedTouches;
    if (!touchList || touchList.length === 0) return null;

    // Use uiCanvas
    const rect = uiCanvas.getBoundingClientRect();
    const touch = touchList[0];

    // Scale relative to uiCanvas internal resolution
    const scaleX = uiCanvas.width / rect.width;
    const scaleY = uiCanvas.height / rect.height;

    const x = (touch.clientX - rect.left) * scaleX;
    const y = (touch.clientY - rect.top) * scaleY;
    return { x, y };
}

// Touch Event Listeners for Mobile Support
// Touch Event Listeners for Mobile Support
window.addEventListener('touchstart', (e) => {
    // Only handle touch on canvas elements
    if (e.target !== canvas && e.target !== uiCanvas && e.target !== gpuCanvas) return;

    const pos = getCanvasTouchPos(e);
    if (!pos) return;

    // UI Coordinates (HUD/Menu)
    const uiPos = getUiTouchPos(e);

    mouse.x = pos.x;
    mouse.y = pos.y;
    mouse.isDown = true;

    // Handle Menu Interactions immediately on touch (more responsive than waiting for click)
    // Use UI Coordinates for Menus
    if (gameState.showMainMenu || gameState.showLobby || gameState.showCoopLobby ||
        gameState.showAILobby || gameState.showGallery || gameState.showAbout ||
        gameState.showLevelUp || gameHUD.gameOver || gameState.gamePaused || gameState.showSettingsPanel) {

        // Prevent default to avoid generating a specialized "click" event later (ghost click)
        if (e.cancelable) e.preventDefault();

        // Use UI Coords for Menus
        handleMenuInteraction(uiPos.x, uiPos.y);

        // Also update hover state immediately for visual feedback
        if (gameHUD) {
            gameHUD.updateMenuHover(uiPos.x, uiPos.y);
        }
        return;
    }

    // GAMEPLAY INPUT HANDLING

    // 0. Mobile Movement Safety: If touching left side (UI Space), DON'T triggering shooting (mouse down)
    if (gameState.gameRunning && !gameState.gamePaused && gameHUD && gameHUD.isMobile()) {
        const midX = uiCanvas.width / 2;
        if (uiPos.x < midX) {
            mouse.isDown = false; // Cancel shooting for movement touches
        }
    }

    // Check Mobile HUD Controls (Pause, Weapon, Grenade) - Only during gameplay
    if (gameState.gameRunning && !gameState.gamePaused && gameHUD && gameHUD.isMobile()) {

        // 1. Check Top Right Pause Button (UI Coords)
        const pauseAction = gameHUD.checkMobileControlsClick(uiPos.x, uiPos.y);
        if (pauseAction === 'pause') {
            if (e.cancelable) e.preventDefault();
            pauseGame();
            return;
        }

        // 2. Check Flashlight Button (from virtual controls)
        const virtualState = touchControlSystem.getVirtualState();
        if (virtualState && virtualState.buttons.flashlight.pressed) {
            if (e.cancelable) e.preventDefault();
            const localPlayer = gameState.players.find(p => p.inputSource === 'mouse');
            if (localPlayer) {
                if (!localPlayer.flashlight) localPlayer.flashlight = { active: false };
                localPlayer.flashlight.active = !localPlayer.flashlight.active;
            }
            return;
        }

        // 2. Check Sidebars (Weapon/Grenade) or Grenade Throw (UI Coords)
        const hudAction = gameHUD.checkMobileHUDInteraction(uiPos.x, uiPos.y);

        if (hudAction) {
            // HUD Interaction occurred
            if (e.cancelable) e.preventDefault();

            // CRITICAL: Prevent this touch from triggering shooting/aiming
            mouse.isDown = false;

            if (hudAction.action === 'switch_weapon') {
                // Cycle Weapon
                input.mouseWheel = -1; // Simulate scroll down
                input.gamepadState.buttons.weaponNext = true; // Or use gamepad state
                // Reset flag next frame handled by system
            }
            else if (hudAction.action === 'toggle_grenade_mode') {
                // Handled in HUD state, nothing else to do here
            }
            else if (hudAction.action === 'throw_grenade') {
                // Handle Throw!
                const player = gameState.players[0];
                if (player && player.grenadeCount > 0) {
                    // Convert screen tap (Game Coords) to world coordinates (Use pos for ScreenToWorld used in game logic)
                    const worldPos = cameraSystem.screenToWorld(pos.x, pos.y);

                    // Force throw input
                    input.keys['g'] = true;
                }
            }
        }
    }

    // For gameplay interactions (not menus), we verify inputs
    // e.g. Gameplay inputs are better handled via virtual joysticks but tap-to-shoot works below
}, { passive: false });

window.addEventListener('touchmove', (e) => {
    // Only handle touch on canvas elements
    if (e.target !== canvas && e.target !== uiCanvas && e.target !== gpuCanvas) return;

    const pos = getCanvasTouchPos(e);
    if (!pos) return;

    mouse.x = pos.x;
    mouse.y = pos.y;

    // Always update GameHUD mouse position
    if (gameHUD) {
        gameHUD.mouseX = mouse.x;
        gameHUD.mouseY = mouse.y;
    }

    // Settings Panel Dragging (Sliders, Scrollbar)
    if (gameState.showSettingsPanel) {
        if (e.cancelable) e.preventDefault(); // Critical for preventing scroll while dragging sliders
        settingsPanel.handleMouseMove(mouse.x, mouse.y);
        return;
    }

    // Main Menu / Lobby Hovers (optional, adds polish)
    if (gameState.showMainMenu || gameState.showLobby || gameState.showCoopLobby) {
        gameHUD.updateMenuHover(mouse.x, mouse.y);
    }

    // Game Input (Aiming) - Prevent scroll while playing
    if (gameState.gameRunning && !gameState.gamePaused) {
        if (e.cancelable) e.preventDefault();
        // Mouse/Aim position is updated above
    }
}, { passive: false });

window.addEventListener('touchend', (e) => {
    mouse.isDown = false;

    if (gameState.showSettingsPanel) {
        settingsPanel.handleMouseUp();
    }

    if (gameHUD.newsTickerDragging) {
        gameHUD.endNewsTickerDrag();
    }
});

// Initialization
loadHighScore();
loadUsername();

// Initialize Profile System (after username is loaded)
playerProfileSystem.loadProfile();
if (typeof requestIdleCallback === 'function') {
    requestIdleCallback(() => playerProfileSystem.initializeSystems(), { timeout: 3000 });
} else {
    setTimeout(() => playerProfileSystem.initializeSystems(), 0);
}

// Sync username from profile if it exists
const profile = playerProfileSystem.getProfile();
if (profile && profile.username) {
    gameState.username = profile.username;
}
loadMenuMusicMuted();
loadMultiplierStats();
checkServerHealth(); // Start checking server status
setTimeout(() => gameHUD.leaderboardDisplay.fetch(), 2000);

// Make clearScoreboard available globally for console access
window.clearScoreboard = clearScoreboard;

requestAnimationFrame(() => gameEngine.start());
