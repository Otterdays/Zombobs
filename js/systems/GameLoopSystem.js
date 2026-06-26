import { WEAPONS, MAX_GRENADES, PLAYER_MAX_HEALTH, RENDERING } from '../core/constants.js';
import { compactArray, compactArrayWithUpdate } from '../utils/arrayUtils.js';
import { canvas, ctx, uiCanvas, uiCtx } from '../core/canvas.js';
import { gameState } from '../core/gameState.js';
import { settingsManager } from './SettingsManager.js';
import { graphicsSettings } from './GraphicsSystem.js';
import { renderingCache } from './RenderingCache.js';
import {
    getViewportBounds,
    shouldUpdateEntity,
    isSinglePlayerArcadeMode,
    isGameplayBlocked,
    isUICanvasInteractive,
    isHTMLOverlayActive,
    isMenuOrOverlayScreen,
    isMobileDevice
} from '../utils/gameUtils.js';
import { getWaveBreakDuration, wasFastWaveClear } from './WaveChaosSystem.js';
import { setGameMusicIntensity } from './AudioSystem.js';
import { shootBullet, handlePlayerZombieCollisions, handlePickupCollisions } from '../utils/combatUtils.js';
import { handleBulletZombieCollisions } from '../utils/bulletZombieCollisions.js';
import { updateParticles, drawParticles, updateSnowSystem } from './ParticleSystem.js';
import { zombieUpdateSystem } from './ZombieUpdateSystem.js';
import { pickupSpawnSystem } from './PickupSpawnSystem.js';
import { scrapShopSystem } from './ScrapShopSystem.js';
import { propSpawnSystem } from './PropSpawnSystem.js';
import { propRenderSystem } from './PropRenderSystem.js';
import { groundTextureSystem } from './GroundTextureSystem.js';
import { cameraSystem } from './CameraSystem.js';
import { entityRenderSystem } from './EntityRenderSystem.js';
import { bloodSimulationSystem } from './BloodSimulationSystem.js';
import { skillSystem } from './SkillSystem.js';
import { drawCrosshair as drawCrosshairUtil, drawWaveBreak, drawWaveNotification, drawFpsCounter } from '../utils/drawingUtils.js';

/**
 * GameLoopSystem — per-frame gameplay update and world/HUD rendering.
 * Extracted from main.js (Phase 4 refactor).
 */
export class GameLoopSystem {
    /**
     * @param {Object} deps
     * @param {import('../core/GameEngine.js').GameEngine} deps.gameEngine
     * @param {import('../ui/GameHUD.js').GameHUD} deps.gameHUD
     * @param {import('../ui/SettingsPanel.js').SettingsPanel} deps.settingsPanel
     * @param {Object} deps.profileScreen
     * @param {Object} deps.achievementScreen
     * @param {Object} deps.battlepassScreen
     * @param {Object} deps.badgeScreen
     * @param {Object} deps.webgpuRenderer
     * @param {import('./TouchControlSystem.js').TouchControlSystem} deps.touchControlSystem
     * @param {{ x: number, y: number, isDown: boolean }} deps.mouse
     * @param {{ active: string }} deps.inputSourceState
     * @param {() => boolean} deps.isWebGPUActive
     * @param {() => void} deps.updatePlayers
     * @param {() => void} deps.drawPlayers
     * @param {() => void} deps.onGameOver
     * @param {(count: number) => void} deps.spawnZombies
     */
    constructor(deps) {
        this.gameEngine = deps.gameEngine;
        this.gameHUD = deps.gameHUD;
        this.settingsPanel = deps.settingsPanel;
        this.profileScreen = deps.profileScreen;
        this.achievementScreen = deps.achievementScreen;
        this.battlepassScreen = deps.battlepassScreen;
        this.badgeScreen = deps.badgeScreen;
        this.webgpuRenderer = deps.webgpuRenderer;
        this.touchControlSystem = deps.touchControlSystem;
        this.mouse = deps.mouse;
        this.inputSourceState = deps.inputSourceState;
        this.isWebGPUActive = deps.isWebGPUActive;
        this.updatePlayers = deps.updatePlayers;
        this.drawPlayers = deps.drawPlayers;
        this.onGameOver = deps.onGameOver;
        this.spawnZombies = deps.spawnZombies;
    }

    update() {
        if (isGameplayBlocked(gameState)) return;
        if (gameState.showLevelUp) return;

        const now = Date.now();
        const activePlayers = gameState.players.filter(p => p.health > 0);
        const anyPlayerAlive = activePlayers.length > 0;

        if (!anyPlayerAlive) {
            this.onGameOver();
            return;
        }

        const cycleElapsed = now - gameState.dayNightCycle.startTime;
        gameState.gameTime = (cycleElapsed % gameState.dayNightCycle.cycleDuration) / gameState.dayNightCycle.cycleDuration;
        gameState.isNight = gameState.gameTime >= 0.5;

        const isSinglePlayerArcade = isSinglePlayerArcadeMode(gameState);
        if (isSinglePlayerArcade) {
            const localPlayer = gameState.players[0];
            if (localPlayer) {
                cameraSystem.update(localPlayer);
                groundTextureSystem.updateFromCamera(cameraSystem);
                propSpawnSystem.update(gameState, localPlayer);

                if (gameState.props && gameState.props.length > 0) {
                    for (const prop of gameState.props) {
                        if (prop.update) {
                            prop.update();
                        }
                    }
                }
            }
        }

        pickupSpawnSystem.updateSpawns(gameState, canvas, now);

        for (let i = 0; i < gameState.players.length; i++) {
            const player = gameState.players[i];
            if (player.health > 0 && player.hasRegeneration) {
                player.health = Math.min(player.maxHealth, player.health + (1 / 60));
            }
        }

        let viewport = getViewportBounds(canvas);
        if (isSinglePlayerArcade && gameState.players[0]) {
            const cameraPos = cameraSystem.getPosition();
            viewport = {
                left: cameraPos.x,
                top: cameraPos.y,
                right: cameraPos.x + canvas.width,
                bottom: cameraPos.y + canvas.height
            };
        }
        gameState.cachedViewport = viewport;

        this.updatePlayers();
        this._emitMultiplayerPlayerState();

        compactArrayWithUpdate(gameState.bullets, bullet => {
            if (bullet.markedForRemoval) return false;
            const exploded = bullet.update();
            return !bullet.markedForRemoval && !exploded;
        });

        compactArrayWithUpdate(gameState.grenades, grenade => {
            if (grenade.exploded) return false;
            if (shouldUpdateEntity(grenade, viewport.left, viewport.top, viewport.right, viewport.bottom)) {
                const exploded = grenade.update(canvas.width, canvas.height);
                if (exploded) return false;
            }
            return !grenade.exploded;
        });

        compactArrayWithUpdate(gameState.acidProjectiles, projectile => {
            if (projectile.isOffScreen(canvas.width, canvas.height)) return false;
            if (shouldUpdateEntity(projectile, viewport.left, viewport.top, viewport.right, viewport.bottom)) {
                projectile.update();
            }
            return !projectile.isOffScreen(canvas.width, canvas.height);
        });

        compactArrayWithUpdate(gameState.acidPools, pool => {
            if (pool.isExpired()) return false;
            if (shouldUpdateEntity(pool, viewport.left, viewport.top, viewport.right, viewport.bottom)) {
                pool.update();
            }
            return !pool.isExpired();
        });

        zombieUpdateSystem.updateZombies(gameState, this.gameEngine, viewport, now);
        updateParticles();
        updateSnowSystem(viewport);

        if (this.webgpuRenderer && this.webgpuRenderer.isInitialized) {
            const localPlayer = gameState.players.find(p => p.inputSource === 'mouse') || gameState.players[0];
            this.webgpuRenderer.updateFlashlight(localPlayer, gameState.zombies);
        }

        bloodSimulationSystem.update(16.67);

        compactArrayWithUpdate(gameState.shells, shell => {
            if (shell.life <= 0) return false;
            if (shouldUpdateEntity(shell, viewport.left, viewport.top, viewport.right, viewport.bottom)) {
                shell.update();
            } else {
                shell.life--;
            }
            return shell.life > 0;
        });

        compactArrayWithUpdate(gameState.damageNumbers, num => {
            num.update();
            return num.life > 0;
        });

        compactArray(gameState.spawnIndicators, indicator => {
            const elapsed = now - indicator.startTime;
            return elapsed < indicator.duration;
        });

        if (gameState.damageIndicator.active) {
            gameState.damageIndicator.intensity *= gameState.damageIndicator.decay;
            if (gameState.damageIndicator.intensity < 0.1) {
                gameState.damageIndicator.active = false;
            }
        }

        if (gameState.hitMarker.active) {
            gameState.hitMarker.life--;
            if (gameState.hitMarker.life <= 0) {
                gameState.hitMarker.active = false;
            }
        }

        for (let i = 0; i < gameState.players.length; i++) {
            const p = gameState.players[i];

            if (p.muzzleFlash.active) {
                p.muzzleFlash.life--;
                p.muzzleFlash.intensity = p.muzzleFlash.life / p.muzzleFlash.maxLife;
                if (p.muzzleFlash.life <= 0) {
                    p.muzzleFlash.active = false;
                }
            }

            if (p.activeMeleeSwipe) {
                const swipeElapsed = now - p.activeMeleeSwipe.startTime;
                if (swipeElapsed >= p.activeMeleeSwipe.duration) {
                    p.activeMeleeSwipe = null;
                }
            }

            if (p.isReloading) {
                const reloadMultiplier = p.reloadSpeedMultiplier || 1.0;
                const adjustedReloadTime = p.currentWeapon.reloadTime * reloadMultiplier;
                if (now - p.reloadStartTime >= adjustedReloadTime) {
                    p.isReloading = false;
                    const ammoMultiplier = p.ammoMultiplier || 1.0;
                    p.currentAmmo = Math.floor(p.currentWeapon.maxAmmo * ammoMultiplier);
                    p.maxAmmo = Math.floor(p.currentWeapon.maxAmmo * ammoMultiplier);
                    const weaponKeys = Object.keys(WEAPONS);
                    const currentWeaponKey = weaponKeys.find(key => WEAPONS[key] === p.currentWeapon);
                    if (currentWeaponKey && p.weaponStates[currentWeaponKey]) {
                        p.weaponStates[currentWeaponKey].ammo = p.currentAmmo;
                    }
                }
            }
        }

        if (gameState.waveNotification.active) {
            gameState.waveNotification.life--;
            if (gameState.waveNotification.life <= 0) {
                gameState.waveNotification.active = false;
            }
        }

        if (this.mouse.isDown && gameState.gameRunning && !gameState.gamePaused) {
            const localPlayer = gameState.players.find(p => p.inputSource === 'mouse');
            if (localPlayer && localPlayer.health > 0) {
                let target = this.mouse;
                if (isSinglePlayerArcadeMode(gameState)) {
                    const worldPos = cameraSystem.screenToWorld(this.mouse.x, this.mouse.y);
                    target = { x: worldPos.x, y: worldPos.y };
                }
                shootBullet(target, canvas, localPlayer);
            }
        }

        handleBulletZombieCollisions();
        handlePlayerZombieCollisions();
        pickupSpawnSystem.updateScrapPickups(gameState, now);
        handlePickupCollisions();

        if (gameState.zombies.length === 0 && gameState.gameRunning && !gameState.isSpawningWave) {
            if (!gameState.waveBreakActive) {
                gameState.waveBreakActive = true;
                const breakDuration = getWaveBreakDuration(gameState.wave, {
                    fastClear: wasFastWaveClear(gameState.waveStartTime),
                    rushActive: gameState.waveMutator === 'rush'
                });
                gameState.waveBreakEndTime = Date.now() + breakDuration;
                scrapShopSystem.trySpawnShrine();
            } else if (Date.now() >= gameState.waveBreakEndTime) {
                gameState.waveBreakActive = false;
                scrapShopSystem.clearShrines();
                gameState.wave++;
                gameState.zombiesPerWave += 2;
                this.spawnZombies(gameState.zombiesPerWave);
            }
        }

        this._updateMusicIntensity();
    }

    _updateMusicIntensity() {
        let targetIntensity = Math.min(gameState.wave / 20, 0.5);
        targetIntensity += Math.min(gameState.zombies.length / 50, 0.5);

        if (gameState.bossActive) {
            targetIntensity = 1.0;
        }

        const localPlayer = gameState.players.find(p => p.inputSource === 'mouse');
        if (localPlayer && localPlayer.health < localPlayer.maxHealth * 0.3) {
            targetIntensity = Math.max(targetIntensity, 0.8);
        }

        if (gameState.waveMutator === 'rush') {
            targetIntensity = Math.min(1, targetIntensity + 0.15);
        }

        setGameMusicIntensity(targetIntensity);
    }

    draw() {
        const { gameHUD, settingsPanel, mouse, inputSourceState } = this;

        if (uiCtx) {
            uiCtx.clearRect(0, 0, uiCanvas.width, uiCanvas.height);

            const isUIActive = isUICanvasInteractive(gameState, gameHUD);
            const htmlOverlayActive = isHTMLOverlayActive(gameState);

            if (isUIActive && !htmlOverlayActive) {
                uiCanvas.style.pointerEvents = 'auto';
            } else {
                uiCanvas.style.pointerEvents = 'none';
            }

            uiCanvas.style.cursor = 'none';
        }

        const isSinglePlayerArcade = isSinglePlayerArcadeMode(gameState);

        if (gameState.showSettingsPanel) {
            uiCanvas.style.cursor = 'none';
            settingsPanel.draw(mouse);
            gameHUD.drawCursor();
            return;
        }

        if (gameState.showCampaignIntro) {
            uiCanvas.style.cursor = 'none';

            if (gameHUD.campaignIntroScreen && gameHUD.campaignIntroScreen.phase === 'fizzle') {
                gameHUD.mainMenu = true;
                gameHUD.mainMenuScreen.draw();
                gameHUD.mainMenu = false;
            }

            gameHUD.draw();
            return;
        }

        if (gameState.showMainMenu) {
            gameHUD.mainMenu = true;
            if (gameHUD.newsTickerDragging) {
                uiCanvas.style.cursor = 'grabbing';
            } else if (gameHUD.checkNewsTickerHit(mouse.x, mouse.y)) {
                uiCanvas.style.cursor = 'grab';
            } else {
                uiCanvas.style.cursor = 'none';
            }
            gameHUD.draw();
            return;
        }

        if (gameState.showLobby) {
            gameHUD.mainMenu = false;
            uiCanvas.style.cursor = 'none';
            gameHUD.draw();
            return;
        }

        if (gameState.showCoopLobby) {
            gameHUD.mainMenu = false;
            uiCanvas.style.cursor = 'none';
            gameHUD.draw();
            return;
        }

        if (gameState.showAILobby) {
            gameHUD.mainMenu = false;
            uiCanvas.style.cursor = 'none';
            gameHUD.draw();
            return;
        }

        if (gameState.showGallery) {
            gameHUD.mainMenu = false;
            uiCanvas.style.cursor = 'none';
            gameHUD.draw();
            return;
        }

        if (gameState.showAbout) {
            uiCanvas.style.cursor = 'none';
            gameHUD.draw();
            return;
        }

        if (this.profileScreen) this.profileScreen.draw();
        if (this.achievementScreen) this.achievementScreen.draw();
        if (this.battlepassScreen) this.battlepassScreen.draw();
        if (this.badgeScreen) this.badgeScreen.draw();

        if (gameState.showProfile || gameState.showAchievements || gameState.showBattlepass || gameState.showBadges) {
            uiCanvas.style.cursor = 'none';
            gameHUD.draw();
            return;
        }

        if (gameState.showLevelUp) {
            gameHUD.mainMenu = false;
            uiCanvas.style.cursor = 'none';
            gameHUD.draw();
            return;
        }

        gameHUD.mainMenu = false;
        const localPlayer = gameState.players.find(p => p.inputSource === 'mouse');

        if (!gameState.showSettingsPanel && (gameState.gamePaused || gameHUD.gameOver)) {
            uiCanvas.style.cursor = 'none';
        } else {
            if (inputSourceState.active === 'gamepad') {
                uiCanvas.style.cursor = 'none';
                canvas.style.cursor = 'none';
            } else {
                uiCanvas.style.cursor = 'none';
                canvas.style.cursor = 'none';
            }
        }

        const cachedGraphicsSettings = graphicsSettings;
        const webgpuActive = this.isWebGPUActive();
        const qualityPreset = settingsManager.getSetting('video', 'qualityPreset') || 'high';
        const postProcessingQuality = cachedGraphicsSettings.postProcessingQuality || 'medium';
        const isCustomPreset = qualityPreset === 'custom';

        const vignetteEnabled = isCustomPreset
            ? cachedGraphicsSettings.vignette !== false
            : (cachedGraphicsSettings.vignette !== false &&
                (postProcessingQuality === 'low' || postProcessingQuality === 'medium' || postProcessingQuality === 'high'));

        const lightingEnabled = isCustomPreset
            ? cachedGraphicsSettings.lighting !== false
            : (cachedGraphicsSettings.lighting !== false &&
                (postProcessingQuality === 'medium' || postProcessingQuality === 'high'));

        const enhancedPostProcessing = postProcessingQuality === 'high';
        const shakeIntensity = settingsManager.getSetting('video', 'screenShakeMultiplier') ?? 1.0;

        renderingCache.updateSettings(vignetteEnabled, lightingEnabled);

        if (renderingCache.needsInvalidation(localPlayer)) {
            renderingCache.invalidate(localPlayer);
        }

        if (!webgpuActive) {
            const bgGradient = renderingCache.getBackgroundGradient();
            if (bgGradient) {
                ctx.fillStyle = bgGradient;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }
        } else {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }

        ctx.save();

        if (isSinglePlayerArcade) {
            cameraSystem.applyTransform(ctx);
        }

        if (gameState.shakeAmount > 0.1) {
            const shakeX = (Math.random() - 0.5) * gameState.shakeAmount * shakeIntensity;
            const shakeY = (Math.random() - 0.5) * gameState.shakeAmount * shakeIntensity;
            gameState.currentShakeX = shakeX;
            gameState.currentShakeY = shakeY;
            ctx.translate(shakeX, shakeY);
            gameState.shakeAmount *= gameState.shakeDecay;
        } else {
            gameState.shakeAmount = 0;
            gameState.currentShakeX = 0;
            gameState.currentShakeY = 0;
        }

        if (isSinglePlayerArcade) {
            const groundImage = groundTextureSystem.getImage();
            if (groundImage && groundImage.complete) {
                ctx.globalAlpha = RENDERING.GROUND_PATTERN_ALPHA;

                const tileSize = groundTextureSystem.tileSize;
                const cameraPos = cameraSystem.getPosition();
                const worldStartX = cameraPos.x - (cameraPos.x % tileSize) - tileSize;
                const worldStartY = cameraPos.y - (cameraPos.y % tileSize) - tileSize;
                const worldEndX = cameraPos.x + canvas.width + tileSize * 2;
                const worldEndY = cameraPos.y + canvas.height + tileSize * 2;

                for (let worldX = worldStartX; worldX < worldEndX; worldX += tileSize) {
                    for (let worldY = worldStartY; worldY < worldEndY; worldY += tileSize) {
                        ctx.drawImage(groundImage, worldX, worldY, tileSize, tileSize);
                    }
                }

                ctx.globalAlpha = 1.0;
            } else {
                const groundPattern = renderingCache.getGroundPattern();
                if (groundPattern) {
                    ctx.globalAlpha = RENDERING.GROUND_PATTERN_ALPHA;
                    ctx.fillStyle = groundPattern;
                    const cameraPos = cameraSystem.getPosition();
                    ctx.fillRect(cameraPos.x, cameraPos.y, canvas.width, canvas.height);
                    ctx.globalAlpha = 1.0;
                }
            }
        } else {
            const groundPattern = renderingCache.getGroundPattern();
            if (groundPattern) {
                ctx.globalAlpha = RENDERING.GROUND_PATTERN_ALPHA;
                ctx.fillStyle = groundPattern;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.globalAlpha = 1.0;
            }
        }

        let vignetteGradient = null;
        if (vignetteEnabled) {
            vignetteGradient = renderingCache.getVignetteGradient();
        }

        let lightingGradient = null;
        if (lightingEnabled && localPlayer && localPlayer.health > 0) {
            let playerScreenX = localPlayer.x;
            let playerScreenY = localPlayer.y;
            if (isSinglePlayerArcade) {
                const screenPos = cameraSystem.worldToScreen(localPlayer.x, localPlayer.y);
                playerScreenX = screenPos.x;
                playerScreenY = screenPos.y;
            }

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

        const nightAlpha = this._calculateNightAlpha();

        const damageIndicatorActive = gameState.damageIndicator.active;
        const damageIndicatorIntensity = gameState.damageIndicator.intensity;

        for (let i = 0; i < gameState.spawnIndicators.length; i++) {
            const indicator = gameState.spawnIndicators[i];
            const elapsed = Date.now() - indicator.startTime;
            const progress = elapsed / indicator.duration;
            const pulse = Math.sin(progress * Math.PI * 4) * 0.5 + 0.5;
            const alpha = 0.3 + pulse * 0.4;
            const radius = 15 + pulse * 10;

            ctx.save();
            ctx.globalAlpha = alpha;

            const gradient = ctx.createRadialGradient(indicator.x, indicator.y, 0, indicator.x, indicator.y, radius);
            gradient.addColorStop(0, 'rgba(255, 23, 68, 0.8)');
            gradient.addColorStop(0.5, 'rgba(255, 23, 68, 0.4)');
            gradient.addColorStop(1, 'rgba(255, 23, 68, 0)');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(indicator.x, indicator.y, radius, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = `rgba(255, 23, 68, ${alpha})`;
            ctx.beginPath();
            ctx.arc(indicator.x, indicator.y, 5, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        }

        const viewport = gameState.cachedViewport || getViewportBounds(canvas);

        if (isSinglePlayerArcade) {
            propRenderSystem.render(gameState, viewport);
        }

        entityRenderSystem.drawEntities(gameState, ctx, viewport);
        this.drawPlayers();

        ctx.restore();

        if (vignetteGradient) {
            ctx.fillStyle = vignetteGradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        if (lightingGradient) {
            ctx.fillStyle = lightingGradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            if (enhancedPostProcessing) {
                ctx.globalCompositeOperation = 'screen';
                ctx.globalAlpha = 0.15;
                ctx.fillStyle = lightingGradient;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.globalAlpha = 1.0;
                ctx.globalCompositeOperation = 'source-over';
            }
        }

        if (damageIndicatorActive) {
            ctx.fillStyle = `rgba(255, 0, 0, ${damageIndicatorIntensity * RENDERING.DAMAGE_INDICATOR_ALPHA})`;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        if (nightAlpha > 0) {
            ctx.fillStyle = `rgba(10, 10, 30, ${nightAlpha})`;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        ctx.save();
        if (isSinglePlayerArcade) {
            cameraSystem.applyTransform(ctx);
        }
        if (gameState.shakeAmount > 0.1) {
            const shakeX = (Math.random() - 0.5) * gameState.shakeAmount * shakeIntensity;
            const shakeY = (Math.random() - 0.5) * gameState.shakeAmount * shakeIntensity;
            ctx.translate(shakeX, shakeY);
        }
        drawParticles();

        if (bloodSimulationSystem.enabled) {
            const bloodData = bloodSimulationSystem.getBloodData();
            if (bloodData.length > 0) {
                ctx.fillStyle = '#8B0000';
                for (let i = 0; i < bloodData.length; i++) {
                    const cell = bloodData[i];
                    const alpha = Math.min(1, cell.height);
                    ctx.globalAlpha = alpha * 0.7;
                    const radius = bloodSimulationSystem.cellSize / 2;
                    ctx.beginPath();
                    ctx.arc(cell.worldX, cell.worldY, radius, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.globalAlpha = 1.0;
            }
        }

        ctx.restore();

        for (let i = 0; i < gameState.damageNumbers.length; i++) {
            const num = gameState.damageNumbers[i];
            if (isSinglePlayerArcade) {
                const screenPos = cameraSystem.worldToScreen(num.x, num.y);
                const originalX = num.x;
                const originalY = num.y;
                num.x = screenPos.x;
                num.y = screenPos.y;
                num.draw(ctx);
                num.x = originalX;
                num.y = originalY;
            } else {
                num.draw(ctx);
            }
        }

        const xpPopups = skillSystem.updateXPPopups(this.gameEngine.timeStep);
        for (let i = 0; i < xpPopups.length; i++) {
            const popup = xpPopups[i];
            let drawX = popup.x;
            let drawY = popup.y + popup.offsetY;

            if (isSinglePlayerArcade) {
                const screenPos = cameraSystem.worldToScreen(drawX, drawY);
                drawX = screenPos.x;
                drawY = screenPos.y;
            }

            ctx.save();
            ctx.globalAlpha = popup.alpha;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            const fontSize = popup.isBonus ? 18 : 14;
            ctx.font = `bold ${fontSize}px "Roboto Mono", monospace`;

            if (popup.isBonus) {
                ctx.shadowBlur = 8;
                ctx.shadowColor = '#ffd700';
                ctx.fillStyle = '#ffd700';
            } else {
                ctx.shadowBlur = 4;
                ctx.shadowColor = '#4caf50';
                ctx.fillStyle = '#76ff03';
            }

            ctx.fillText(`+${popup.amount} XP`, drawX, drawY);
            ctx.restore();
        }

        drawCrosshairUtil(mouse);

        if (localPlayer && localPlayer.health > 0) {
            gameHUD.drawLowHealthVignette(localPlayer);
        }

        if (gameState.gameRunning && !gameState.gamePaused && localPlayer) {
            this._drawPickupTooltips(localPlayer);
            this._drawScrapShrinePrompt(localPlayer);
        }

        gameHUD.draw();
        if (gameState.gameRunning && !gameState.gamePaused) {
            gameHUD.drawCompass();
        }
        drawWaveNotification();
        drawWaveBreak();
        drawFpsCounter();

        if (this.touchControlSystem) {
            const isMenu = isMenuOrOverlayScreen(gameState, gameHUD);
            const useTouchControls = isMobileDevice();
            this.touchControlSystem.setActive(useTouchControls && !isMenu && gameState.gameRunning);

            if (this.touchControlSystem.active) {
                this.touchControlSystem.draw(uiCtx);
            }
        }
    }

    _emitMultiplayerPlayerState() {
        if (!gameState.isCoop || !gameState.multiplayer.socket || !gameState.multiplayer.socket.connected) {
            return;
        }

        const localPlayer = gameState.players.find(p => p.id === gameState.multiplayer.playerId);

        if (!localPlayer) {
            if (!window._lastLocalPlayerError || Date.now() - window._lastLocalPlayerError > 5000) {
                console.error('[player:state] Local player not found!', {
                    multiplayerPlayerId: gameState.multiplayer.playerId,
                    availablePlayers: gameState.players.map(p => ({ id: p.id, name: p.name, inputSource: p.inputSource }))
                });
                window._lastLocalPlayerError = Date.now();
            }
            return;
        }

        if (localPlayer.inputSource === 'remote') {
            if (!window._lastRemoteError || Date.now() - window._lastRemoteError > 5000) {
                console.error('[player:state] Local player marked as remote!', {
                    playerId: localPlayer.id,
                    playerName: localPlayer.name,
                    inputSource: localPlayer.inputSource
                });
                window._lastRemoteError = Date.now();
            }
            return;
        }

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

    _calculateNightAlpha() {
        if (gameState.isNight) {
            const nightProgress = (gameState.gameTime - 0.5) * 2;
            return 0.5 + (nightProgress * 0.2);
        }

        const dawnProgress = gameState.gameTime * 2;
        if (dawnProgress < 0.5) {
            return dawnProgress * 0.6;
        }
        return (1 - dawnProgress) * 0.6;
    }

    _drawScrapShrinePrompt(localPlayer) {
        if (!gameState.waveBreakActive) return;

        const shrine = scrapShopSystem.getNearbyShrine(localPlayer);
        if (!shrine) return;

        const prompt = scrapShopSystem.getPromptText(localPlayer);
        if (!prompt) return;

        const isSinglePlayerArcade = isSinglePlayerArcadeMode(gameState);
        let drawX = shrine.x;
        let drawY = shrine.y - shrine.radius - 8;

        if (isSinglePlayerArcade) {
            const screenPos = cameraSystem.worldToScreen(drawX, drawY);
            drawX = screenPos.x;
            drawY = screenPos.y;
        }

        this.gameHUD.drawTooltip(prompt, drawX, drawY);
    }

    _drawPickupTooltips(localPlayer) {
        const tooltipDistance = 60;
        const tooltipDistSquared = tooltipDistance * tooltipDistance;

        for (let i = 0; i < gameState.healthPickups.length; i++) {
            const pickup = gameState.healthPickups[i];
            const dx = pickup.x - localPlayer.x;
            const dy = pickup.y - localPlayer.y;
            if (dx * dx + dy * dy < tooltipDistSquared && localPlayer.health < PLAYER_MAX_HEALTH) {
                this.gameHUD.drawTooltip('Walk over to pickup health', pickup.x, pickup.y - pickup.radius - 5);
            }
        }

        for (let i = 0; i < gameState.ammoPickups.length; i++) {
            const pickup = gameState.ammoPickups[i];
            const dx = pickup.x - localPlayer.x;
            const dy = pickup.y - localPlayer.y;
            if (dx * dx + dy * dy < tooltipDistSquared && (localPlayer.currentAmmo < localPlayer.maxAmmo || localPlayer.grenadeCount < MAX_GRENADES)) {
                this.gameHUD.drawTooltip('Walk over to pickup ammo', pickup.x, pickup.y - pickup.radius - 5);
            }
        }

        const powerupArrays = [
            gameState.damagePickups,
            gameState.nukePickups,
            gameState.speedPickups,
            gameState.rapidFirePickups,
            gameState.shieldPickups
        ];

        for (let a = 0; a < powerupArrays.length; a++) {
            const array = powerupArrays[a];
            for (let i = 0; i < array.length; i++) {
                const pickup = array[i];
                const dx = pickup.x - localPlayer.x;
                const dy = pickup.y - localPlayer.y;
                if (dx * dx + dy * dy >= tooltipDistSquared) continue;

                let tooltipText = 'Walk over to pickup power-up';
                if (pickup.type === 'damage') tooltipText = 'Double Damage Power-Up';
                else if (pickup.type === 'nuke') tooltipText = 'Tactical Nuke Power-Up';
                else if (pickup.type === 'speed') tooltipText = 'Speed Boost Power-Up';
                else if (pickup.type === 'rapidfire') tooltipText = 'Rapid Fire Power-Up';
                else if (pickup.type === 'shield') tooltipText = 'Shield Power-Up';
                else if (pickup.type === 'adrenaline') tooltipText = 'Adrenaline Shot Power-Up';
                this.gameHUD.drawTooltip(tooltipText, pickup.x, pickup.y - pickup.radius - 5);
            }
        }
    }
}
