import { gameState } from '../core/gameState.js';
import { canvas, ctx } from '../core/canvas.js';
import { MELEE_RANGE } from '../core/constants.js';
import { settingsManager } from '../systems/SettingsManager.js';

/**
 * Drawing utility functions for UI elements and visual effects
 */

/**
 * Draw melee swipe animation
 */
export function drawMeleeSwipe(player) {
    const now = Date.now();
    const elapsed = now - player.activeMeleeSwipe.startTime;
    const progress = Math.min(elapsed / player.activeMeleeSwipe.duration, 1);

    const startAngle = player.activeMeleeSwipe.angle - Math.PI * 0.4; // Match wider arc
    const endAngle = player.activeMeleeSwipe.angle + Math.PI * 0.4;
    const currentAngle = startAngle + (endAngle - startAngle) * progress;

    const swipeRadius = MELEE_RANGE;

    ctx.save();

    // Create gradient for the swipe
    const gradient = ctx.createRadialGradient(player.x, player.y, 0, player.x, player.y, swipeRadius);
    gradient.addColorStop(0, 'rgba(255, 170, 0, 0)');
    gradient.addColorStop(0.5, 'rgba(255, 170, 0, 0.2)');
    gradient.addColorStop(1, 'rgba(255, 170, 0, 0.6)');

    // Draw filled sector
    ctx.beginPath();
    ctx.moveTo(player.x, player.y);
    ctx.arc(player.x, player.y, swipeRadius, startAngle, currentAngle);
    ctx.lineTo(player.x, player.y);
    ctx.fillStyle = gradient;
    ctx.fill();

    // Draw outer edge glow
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#ffaa00';
    ctx.strokeStyle = '#ffaa00';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(player.x, player.y, swipeRadius, startAngle, currentAngle);
    ctx.stroke();

    // Draw tip spark
    const tipX = player.x + Math.cos(currentAngle) * swipeRadius;
    const tipY = player.y + Math.sin(currentAngle) * swipeRadius;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(tipX, tipY, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}

/**
 * Draw crosshair at mouse position
 */
export function drawCrosshair(mouse) {
    if (!gameState.gameRunning || gameState.gamePaused) return;
    if (gameState.showMainMenu || gameState.showLobby || gameState.showCoopLobby) return;

    // Cache settings at function start to avoid repeated lookups
    const cachedDynamicCrosshair = settingsManager.getSetting('video', 'dynamicCrosshair') ?? true;
    const cachedCrosshairStyle = settingsManager.getSetting('video', 'crosshairStyle') || 'default';

    // Find local player (mouse user)
    const localPlayer = gameState.players.find(p => p.inputSource === 'mouse');
    if (!localPlayer) return;

    if (mouse.x < 0 || mouse.x > canvas.width || mouse.y < 0 || mouse.y > canvas.height) return;

    ctx.save();
    
    // Get crosshair settings
    const crosshairColorHex = settingsManager.getSetting('video', 'crosshairColor') || '#00ff00';
    const crosshairSizeMult = settingsManager.getSetting('video', 'crosshairSize') ?? 1.0;
    const crosshairOpacity = settingsManager.getSetting('video', 'crosshairOpacity') ?? 1.0;
    
    // Convert hex to rgba helper
    function hexToRgba(hex, alpha) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    
    const baseCrosshairSize = 12 * crosshairSizeMult;
    const crosshairLineWidth = 2;
    const crosshairColor = hexToRgba(crosshairColorHex, crosshairOpacity);
    const crosshairOutlineColor = `rgba(0, 0, 0, ${crosshairOpacity * 0.8})`; // Outline with reduced opacity

    const crosshairColorCurrent = localPlayer.isReloading ? hexToRgba('#888888', crosshairOpacity) : crosshairColor;

    // Dynamic crosshair: expand when moving or shooting
    let crosshairSize = baseCrosshairSize;
    const dynamicCrosshair = cachedDynamicCrosshair;

    if (dynamicCrosshair && localPlayer) {
        const player = localPlayer;
        // Check if player is moving (approximate by checking if they moved recently)
        const isMoving = Math.abs(player.x - (player.lastX || player.x)) > 0.1 ||
            Math.abs(player.y - (player.lastY || player.y)) > 0.1;
        player.lastX = player.x;
        player.lastY = player.y;

        // Expand crosshair when moving or recently shot
        const timeSinceLastShot = Date.now() - (player.lastShotTime || 0);
        const recentlyShot = timeSinceLastShot < 200; // 200ms after shooting

        if (isMoving || recentlyShot) {
            const expansion = isMoving ? 4 : (recentlyShot ? 6 : 0);
            crosshairSize = baseCrosshairSize + expansion;
        }
    }

    // Get crosshair style from cached settings
    const crosshairStyle = cachedCrosshairStyle;

    // Draw based on style
    if (crosshairStyle === 'dot') {
        // Simple dot crosshair
        ctx.fillStyle = crosshairColorCurrent;
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 3, 0, Math.PI * 2);
        ctx.fill();

        // Outline
        ctx.strokeStyle = crosshairOutlineColor;
        ctx.lineWidth = 2;
        ctx.stroke();
    } else if (crosshairStyle === 'circle') {
        // Circle crosshair
        ctx.strokeStyle = crosshairOutlineColor;
        ctx.lineWidth = crosshairLineWidth + 2;
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, crosshairSize, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = crosshairColorCurrent;
        ctx.lineWidth = crosshairLineWidth;
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, crosshairSize, 0, Math.PI * 2);
        ctx.stroke();

        // Center dot
        ctx.fillStyle = crosshairColorCurrent;
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 1.5, 0, Math.PI * 2);
        ctx.fill();
    } else if (crosshairStyle === 'cross') {
        // Simple cross (no center dot)
        ctx.strokeStyle = crosshairOutlineColor;
        ctx.lineWidth = crosshairLineWidth + 2;
        ctx.lineCap = 'round';

        ctx.beginPath();
        ctx.moveTo(mouse.x - crosshairSize, mouse.y);
        ctx.lineTo(mouse.x + crosshairSize, mouse.y);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(mouse.x, mouse.y - crosshairSize);
        ctx.lineTo(mouse.x, mouse.y + crosshairSize);
        ctx.stroke();

        ctx.strokeStyle = crosshairColorCurrent;
        ctx.lineWidth = crosshairLineWidth;

        ctx.beginPath();
        ctx.moveTo(mouse.x - crosshairSize, mouse.y);
        ctx.lineTo(mouse.x + crosshairSize, mouse.y);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(mouse.x, mouse.y - crosshairSize);
        ctx.lineTo(mouse.x, mouse.y + crosshairSize);
        ctx.stroke();
    } else {
        // Default: cross with center dot
        ctx.strokeStyle = crosshairOutlineColor;
        ctx.lineWidth = crosshairLineWidth + 2;
        ctx.lineCap = 'round';

        ctx.beginPath();
        ctx.moveTo(mouse.x - crosshairSize, mouse.y);
        ctx.lineTo(mouse.x + crosshairSize, mouse.y);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(mouse.x, mouse.y - crosshairSize);
        ctx.lineTo(mouse.x, mouse.y + crosshairSize);
        ctx.stroke();

        ctx.strokeStyle = crosshairColorCurrent;
        ctx.lineWidth = crosshairLineWidth;

        ctx.beginPath();
        ctx.moveTo(mouse.x - crosshairSize, mouse.y);
        ctx.lineTo(mouse.x + crosshairSize, mouse.y);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(mouse.x, mouse.y - crosshairSize);
        ctx.lineTo(mouse.x, mouse.y + crosshairSize);
        ctx.stroke();

        ctx.fillStyle = crosshairColorCurrent;
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 1.5, 0, Math.PI * 2);
        ctx.fill();
    }

    // Draw hit marker (X) when hit occurs
    if (gameState.hitMarker.active) {
        const alpha = gameState.hitMarker.life / gameState.hitMarker.maxLife;
        const markerSize = 8;
        const markerColor = `rgba(255, 255, 0, ${alpha})`;

        ctx.strokeStyle = markerColor;
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';

        // Draw X
        ctx.beginPath();
        ctx.moveTo(mouse.x - markerSize, mouse.y - markerSize);
        ctx.lineTo(mouse.x + markerSize, mouse.y + markerSize);
        ctx.moveTo(mouse.x + markerSize, mouse.y - markerSize);
        ctx.lineTo(mouse.x - markerSize, mouse.y + markerSize);
        ctx.stroke();
    }

    ctx.restore();
}

/**
 * Draw wave break UI overlay
 */
export function drawWaveBreak() {
    if (!gameState.waveBreakActive) return;

    const remainingTime = Math.ceil((gameState.waveBreakEndTime - Date.now()) / 1000);
    if (remainingTime < 0) return;

    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.font = 'bold 40px Creepster, system-ui';
    ctx.fillStyle = '#ffc107';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = 10;
    ctx.fillText("Wave Cleared!", canvas.width / 2, canvas.height / 2 - 80);

    ctx.font = '30px "Roboto Mono", monospace';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`Next wave in ${remainingTime}...`, canvas.width / 2, canvas.height / 2 - 30);

    ctx.font = '20px "Roboto Mono", monospace';
    ctx.fillStyle = '#aaaaaa';
    ctx.fillText("Reload [R] | Heal Up", canvas.width / 2, canvas.height / 2 + 20);

    ctx.restore();
}

/**
 * Draw wave notification text
 */
export function drawWaveNotification() {
    if (!gameState.waveNotification.active) return;

    ctx.save();
    const alpha = Math.min(1, gameState.waveNotification.life / 30);
    const fadeOut = Math.min(1, gameState.waveNotification.life / 40);
    const finalAlpha = alpha * fadeOut;

    ctx.shadowBlur = 20;
    ctx.shadowColor = `rgba(255, 23, 68, ${finalAlpha * 0.6})`;

    ctx.fillStyle = `rgba(255, 255, 255, ${finalAlpha})`;
    ctx.font = 'bold 32px \"Roboto Mono\", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(gameState.waveNotification.text, canvas.width / 2, canvas.height / 2 - 40);

    ctx.fillStyle = `rgba(255, 200, 200, ${finalAlpha * 0.8})`;
    ctx.font = '14px \"Roboto Mono\", monospace';
    ctx.fillText('Get ready...', canvas.width / 2, canvas.height / 2 + 10);

    ctx.shadowBlur = 0;
    ctx.restore();
}

/**
 * Draw FPS counter and debug stats
 */
export function drawFpsCounter() {
    // Cache settings at function start to avoid repeated lookups
    const cachedShowFps = settingsManager.getSetting('gameplay', 'showFps') ?? false;
    const cachedShowDebugStats = settingsManager.getSetting('video', 'showDebugStats') ?? false;
    
    const showFps = cachedShowFps;
    const showDebugStats = cachedShowDebugStats;

    if (!showFps && !showDebugStats) return;

    ctx.save();

    if (showFps) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.font = '14px "Roboto Mono", monospace';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'top';
        ctx.fillText(`${gameState.fps} FPS`, canvas.width - 20, 20);
    }

    // Detailed stats overlay
    if (showDebugStats && gameState.gameRunning && !gameState.gamePaused) {
        const statsY = 45;
        const lineHeight = 18;
        let currentY = statsY;

        // Background panel
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(canvas.width - 200, statsY - 5, 195, 120);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(canvas.width - 200, statsY - 5, 195, 120);

        // Stats
        ctx.textAlign = 'left';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.fillText(`Zombies: ${gameState.zombies.length}`, canvas.width - 195, currentY);
        currentY += lineHeight;
        ctx.fillText(`Bullets: ${gameState.bullets.length}`, canvas.width - 195, currentY);
        currentY += lineHeight;
        ctx.fillText(`Particles: ${gameState.particles.length}`, canvas.width - 195, currentY);
        currentY += lineHeight;

        if (gameState.players.length > 0 && gameState.players[0]) {
            const p1 = gameState.players[0];
            ctx.fillText(`Player X: ${Math.floor(p1.x)}`, canvas.width - 195, currentY);
            currentY += lineHeight;
            ctx.fillText(`Player Y: ${Math.floor(p1.y)}`, canvas.width - 195, currentY);
            currentY += lineHeight;
        }

        // Memory usage (approximate)
        if (performance.memory) {
            const memMB = Math.round(performance.memory.usedJSHeapSize / 1048576);
            ctx.fillText(`Memory: ${memMB} MB`, canvas.width - 195, currentY);
        }
    }

    ctx.restore();
}

