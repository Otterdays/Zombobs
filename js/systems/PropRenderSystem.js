import { ctx } from '../core/canvas.js';
import { isInViewport } from '../utils/gameUtils.js';
import { RENDERING } from '../core/constants.js';

/**
 * PropRenderSystem - Handles rendering of world props with viewport culling
 * Only active in single player arcade mode
 */
export class PropRenderSystem {
    /**
     * Render all props that are in the viewport
     * @param {Object} gameState - Game state object
     * @param {Object} viewport - Viewport bounds {left, top, right, bottom}
     */
    render(gameState, viewport) {
        // Only render in single player arcade mode
        const isSinglePlayerArcade = !gameState.isCoop && !gameState.multiplayer.active;
        if (!isSinglePlayerArcade) return;

        if (!gameState.props || gameState.props.length === 0) return;

        const margin = RENDERING.CULL_MARGIN;
        
        // Render props with viewport culling
        for (const prop of gameState.props) {
            // Check if prop is in viewport (with margin for smooth appearance)
            if (isInViewport(
                prop,
                viewport.left - margin,
                viewport.top - margin,
                viewport.right + margin,
                viewport.bottom + margin
            )) {
                prop.draw();
            }
        }
    }
}

// Export singleton instance
export const propRenderSystem = new PropRenderSystem();

