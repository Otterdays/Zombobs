import { canvas, ctx } from '../core/canvas.js';
import { RENDERING } from '../core/constants.js';
import { initGroundPattern } from './GraphicsSystem.js';

/**
 * Rendering cache for gradients and patterns
 * Caches expensive-to-create gradients and invalidates on canvas resize or settings change
 */
export class RenderingCache {
    constructor() {
        this.cachedCanvasWidth = 0;
        this.cachedCanvasHeight = 0;
        this.cachedMaxDimension = 0;
        this.cachedPlayerX = 0;
        this.cachedPlayerY = 0;
        
        // Cached gradients
        this.backgroundGradient = null;
        this.vignetteGradient = null;
        this.lightingGradient = null;
        this.groundPattern = null;
        
        // Settings cache
        this.cachedVignetteEnabled = null;
        this.cachedLightingEnabled = null;
    }

    /**
     * Check if cache needs invalidation
     */
    needsInvalidation(player) {
        const sizeChanged = Math.abs(canvas.width - this.cachedCanvasWidth) > RENDERING.CANVAS_SIZE_CHANGE_THRESHOLD ||
                           Math.abs(canvas.height - this.cachedCanvasHeight) > RENDERING.CANVAS_SIZE_CHANGE_THRESHOLD;
        
        const playerMoved = player && (
            Math.abs(player.x - this.cachedPlayerX) > RENDERING.PLAYER_POSITION_CHANGE_THRESHOLD ||
            Math.abs(player.y - this.cachedPlayerY) > RENDERING.PLAYER_POSITION_CHANGE_THRESHOLD
        );
        
        return sizeChanged || playerMoved;
    }

    /**
     * Invalidate cache and update cached values
     */
    invalidate(player) {
        this.cachedCanvasWidth = canvas.width;
        this.cachedCanvasHeight = canvas.height;
        this.cachedMaxDimension = Math.max(canvas.width, canvas.height);
        
        if (player) {
            this.cachedPlayerX = player.x;
            this.cachedPlayerY = player.y;
        }
        
        // Clear gradients (will be recreated on next access)
        this.backgroundGradient = null;
        this.vignetteGradient = null;
        this.lightingGradient = null;
    }

    /**
     * Get or create background gradient
     */
    getBackgroundGradient() {
        const sizeChanged = Math.abs(canvas.width - this.cachedCanvasWidth) > RENDERING.CANVAS_SIZE_CHANGE_THRESHOLD ||
                           Math.abs(canvas.height - this.cachedCanvasHeight) > RENDERING.CANVAS_SIZE_CHANGE_THRESHOLD;
        
        if (!this.backgroundGradient || sizeChanged) {
            const maxDim = Math.max(canvas.width, canvas.height);
            this.backgroundGradient = ctx.createRadialGradient(
                canvas.width / 2, canvas.height / 2, 0,
                canvas.width / 2, canvas.height / 2, maxDim / 1.5
            );
            this.backgroundGradient.addColorStop(0, '#1a1a1a');
            this.backgroundGradient.addColorStop(1, '#0d0d0d');
            this.cachedMaxDimension = maxDim;
        }
        return this.backgroundGradient;
    }

    /**
     * Get or create vignette gradient
     */
    getVignetteGradient() {
        const sizeChanged = Math.abs(canvas.width - this.cachedCanvasWidth) > RENDERING.CANVAS_SIZE_CHANGE_THRESHOLD ||
                           Math.abs(canvas.height - this.cachedCanvasHeight) > RENDERING.CANVAS_SIZE_CHANGE_THRESHOLD;
        
        if (!this.vignetteGradient || sizeChanged) {
            const maxDim = Math.max(canvas.width, canvas.height);
            this.vignetteGradient = ctx.createRadialGradient(
                canvas.width / 2, canvas.height / 2, maxDim / 3,
                canvas.width / 2, canvas.height / 2, maxDim
            );
            this.vignetteGradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
            this.vignetteGradient.addColorStop(1, `rgba(0, 0, 0, ${RENDERING.VIGNETTE_ALPHA})`);
        }
        return this.vignetteGradient;
    }

    /**
     * Get or create lighting gradient (player position dependent)
     */
    getLightingGradient(player) {
        if (!player || player.health <= 0) return null;
        
        const needsUpdate = !this.lightingGradient || 
                          Math.abs(player.x - this.cachedPlayerX) > RENDERING.PLAYER_POSITION_CHANGE_THRESHOLD ||
                          Math.abs(player.y - this.cachedPlayerY) > RENDERING.PLAYER_POSITION_CHANGE_THRESHOLD ||
                          this.needsInvalidation();
        
        if (needsUpdate) {
            const lightingRadius = Math.max(canvas.width, canvas.height) * 0.8;
            this.lightingGradient = ctx.createRadialGradient(
                player.x, player.y, 0,
                player.x, player.y, lightingRadius
            );
            this.lightingGradient.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
            this.lightingGradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.05)');
            this.lightingGradient.addColorStop(0.6, 'rgba(255, 255, 255, 0.02)');
            this.lightingGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
            this.cachedPlayerX = player.x;
            this.cachedPlayerY = player.y;
        }
        return this.lightingGradient;
    }

    /**
     * Get or create ground pattern
     */
    getGroundPattern() {
        if (!this.groundPattern) {
            this.groundPattern = initGroundPattern();
        }
        return this.groundPattern;
    }

    /**
     * Get animated ground pattern with offset transform
     * @param {number} offsetX - X offset for animation
     * @param {number} offsetY - Y offset for animation
     * @returns {CanvasPattern|null} Ground pattern or null if not initialized
     */
    getAnimatedGroundPattern(offsetX, offsetY) {
        const pattern = this.getGroundPattern();
        if (!pattern) return null;
        
        // Note: Canvas patterns don't support direct offset transforms
        // The offset will be applied during rendering via ctx.translate()
        return pattern;
    }

    /**
     * Update settings cache
     */
    updateSettings(vignetteEnabled, lightingEnabled) {
        const settingsChanged = this.cachedVignetteEnabled !== vignetteEnabled ||
                               this.cachedLightingEnabled !== lightingEnabled;
        
        if (settingsChanged) {
            this.cachedVignetteEnabled = vignetteEnabled;
            this.cachedLightingEnabled = lightingEnabled;
            // Invalidate affected gradients
            if (settingsChanged) {
                this.vignetteGradient = null;
                this.lightingGradient = null;
            }
        }
    }
}

// Singleton instance
export const renderingCache = new RenderingCache();

