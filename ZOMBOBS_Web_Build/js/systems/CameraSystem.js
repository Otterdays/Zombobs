import { canvas } from '../core/canvas.js';

/**
 * CameraSystem - Handles camera that follows the player
 * Locks camera to player position, making the world move around the player
 * Only active in single player arcade mode
 */
export class CameraSystem {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.targetX = 0;
        this.targetY = 0;
        this.smoothFollow = false; // Instant follow for better responsiveness
        this.followSpeed = 0.1; // Lerp speed for smooth following (not used if smoothFollow is false)
    }

    /**
     * Update camera to follow player
     * @param {Object} player - Player object to follow
     */
    update(player) {
        if (!player) return;
        
        // Calculate target camera position (center player on screen)
        this.targetX = player.x - canvas.width / 2;
        this.targetY = player.y - canvas.height / 2;
        
        // Smooth camera following (lerp)
        if (this.smoothFollow) {
            this.x += (this.targetX - this.x) * this.followSpeed;
            this.y += (this.targetY - this.y) * this.followSpeed;
        } else {
            // Instant follow
            this.x = this.targetX;
            this.y = this.targetY;
        }
    }

    /**
     * Initialize camera to player position (call when game starts)
     * @param {Object} player - Player object to center on
     */
    initialize(player) {
        if (!player) return;
        this.x = player.x - canvas.width / 2;
        this.y = player.y - canvas.height / 2;
        this.targetX = this.x;
        this.targetY = this.y;
    }

    /**
     * Get camera position
     * @returns {Object} Camera position {x, y}
     */
    getPosition() {
        return {
            x: this.x,
            y: this.y
        };
    }

    /**
     * Convert world coordinates to screen coordinates
     * @param {number} worldX - World X coordinate
     * @param {number} worldY - World Y coordinate
     * @returns {Object} Screen coordinates {x, y}
     */
    worldToScreen(worldX, worldY) {
        return {
            x: worldX - this.x,
            y: worldY - this.y
        };
    }

    /**
     * Convert screen coordinates to world coordinates
     * @param {number} screenX - Screen X coordinate
     * @param {number} screenY - Screen Y coordinate
     * @returns {Object} World coordinates {x, y}
     */
    screenToWorld(screenX, screenY) {
        return {
            x: screenX + this.x,
            y: screenY + this.y
        };
    }

    /**
     * Apply camera transform to canvas context
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     */
    applyTransform(ctx) {
        ctx.translate(-this.x, -this.y);
    }

    /**
     * Reset camera (for new game)
     */
    reset() {
        this.x = 0;
        this.y = 0;
        this.targetX = 0;
        this.targetY = 0;
    }
}

// Export singleton instance
export const cameraSystem = new CameraSystem();

