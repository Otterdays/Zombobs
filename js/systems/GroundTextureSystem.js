import { GROUND_TEXTURE_SCROLL_SPEED } from '../core/constants.js';
import { initGroundPattern } from './GraphicsSystem.js';

/**
 * GroundTextureSystem - Handles animated ground texture scrolling
 * Only active in single player arcade mode
 */
export class GroundTextureSystem {
    constructor() {
        this.groundPattern = null;
        this.groundImage = null;
        this.tileSize = 64; // Default tile size (will be updated from image)
        this.offsetX = 0;
        this.offsetY = 0;
        this.imageLoaded = false;
        this.lastPlayerX = null;
        this.lastPlayerY = null;
    }

    /**
     * Initialize the ground pattern and load the image
     */
    init() {
        this.groundPattern = initGroundPattern();
        
        // Load the image for direct drawing (needed for scrolling)
        this.groundImage = new Image();
        this.groundImage.src = 'sample_assets/tiles/bloody_dark_floor.png';
        this.groundImage.onload = () => {
            this.tileSize = this.groundImage.width || 64; // Use image width as tile size
            this.imageLoaded = true;
        };
    }

    /**
     * Update ground texture offset based on camera position
     * Ground moves with camera to create world movement effect
     * @param {Object} cameraSystem - Camera system object
     */
    updateFromCamera(cameraSystem) {
        if (!cameraSystem) return;
        
        const cameraPos = cameraSystem.getPosition();
        
        // Update offset based on camera position (ground moves with world)
        // Use modulo to wrap around tile size for seamless tiling
        this.offsetX = cameraPos.x % this.tileSize;
        this.offsetY = cameraPos.y % this.tileSize;
        
        // Ensure offset stays positive for modulo to work correctly
        if (this.offsetX < 0) this.offsetX += this.tileSize;
        if (this.offsetY < 0) this.offsetY += this.tileSize;
    }

    /**
     * Update ground texture offset based on player movement (legacy method, kept for compatibility)
     * Creates parallax effect where ground moves relative to player position
     * @param {Object} player - Player object with x, y properties
     */
    update(player) {
        if (!player) return;
        
        // Initialize last position on first frame
        if (this.lastPlayerX === null || this.lastPlayerY === null) {
            this.lastPlayerX = player.x;
            this.lastPlayerY = player.y;
            return;
        }
        
        // Calculate player movement delta
        const deltaX = player.x - this.lastPlayerX;
        const deltaY = player.y - this.lastPlayerY;
        
        // Update offset based on player movement (parallax effect)
        // Move ground in same direction as player movement
        // Use a parallax factor to make it subtle (0.3 = ground moves 30% of player movement)
        const parallaxFactor = GROUND_TEXTURE_SCROLL_SPEED; // Use constant as parallax multiplier
        this.offsetX = (this.offsetX + deltaX * parallaxFactor) % this.tileSize;
        this.offsetY = (this.offsetY + deltaY * parallaxFactor) % this.tileSize;
        
        // Ensure offset stays positive for modulo to work correctly
        if (this.offsetX < 0) this.offsetX += this.tileSize;
        if (this.offsetY < 0) this.offsetY += this.tileSize;
        
        // Store current position for next frame
        this.lastPlayerX = player.x;
        this.lastPlayerY = player.y;
    }

    /**
     * Get the current ground pattern (for non-animated mode)
     * @returns {CanvasPattern|null} Ground pattern or null if not initialized
     */
    getPattern() {
        return this.groundPattern;
    }

    /**
     * Get the ground image (for animated mode)
     * @returns {HTMLImageElement|null} Ground image or null if not loaded
     */
    getImage() {
        return this.imageLoaded ? this.groundImage : null;
    }

    /**
     * Get current offset for rendering
     * @returns {Object} Offset {offsetX, offsetY}
     */
    getOffset() {
        return {
            offsetX: this.offsetX,
            offsetY: this.offsetY
        };
    }

    /**
     * Reset the ground texture system (for new game)
     */
    reset() {
        this.offsetX = 0;
        this.offsetY = 0;
        this.lastPlayerX = null;
        this.lastPlayerY = null;
    }
}

// Export singleton instance
export const groundTextureSystem = new GroundTextureSystem();

