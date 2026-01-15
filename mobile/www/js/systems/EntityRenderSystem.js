import { isInViewport, isVisibleOnScreen } from '../utils/gameUtils.js';

/**
 * EntityRenderSystem handles rendering of all game entities with viewport culling
 * and visibility optimization.
 */
export class EntityRenderSystem {
    /**
     * Main method to draw all entities
     * @param {Object} gameState - Game state object containing all entity arrays
     * @param {CanvasRenderingContext2D} ctx - Canvas 2D rendering context
     * @param {Object} viewport - Viewport bounds {left, top, right, bottom}
     */
    drawEntities(gameState, ctx, viewport) {
        // Draw entities with viewport culling and small feature culling
        // Optimized: use for loops instead of forEach for better performance
        
        // Shells - with viewport and visibility culling, takes ctx parameter
        this.drawEntityArray(gameState.shells, ctx, viewport, true, true);
        
        // Bullets - with viewport and visibility culling, no ctx parameter
        this.drawEntityArray(gameState.bullets, ctx, viewport, true, false);
        
        // Grenades - with viewport culling only, no ctx parameter
        this.drawEntityArray(gameState.grenades, ctx, viewport, false, false);
        
        // Acid projectiles - with viewport culling only, no ctx parameter
        this.drawEntityArray(gameState.acidProjectiles, ctx, viewport, false, false);
        
        // Acid pools - with viewport culling only, no ctx parameter
        this.drawEntityArray(gameState.acidPools, ctx, viewport, false, false);
        
        // Batch pickup rendering with culling (optimized loops), no ctx parameter
        this.drawEntityArray(gameState.healthPickups, ctx, viewport, false, false);
        this.drawEntityArray(gameState.ammoPickups, ctx, viewport, false, false);
        this.drawEntityArray(gameState.damagePickups, ctx, viewport, false, false);
        this.drawEntityArray(gameState.nukePickups, ctx, viewport, false, false);
        this.drawEntityArray(gameState.speedPickups, ctx, viewport, false, false);
        this.drawEntityArray(gameState.rapidFirePickups, ctx, viewport, false, false);
        this.drawEntityArray(gameState.shieldPickups, ctx, viewport, false, false);
        this.drawEntityArray(gameState.adrenalinePickups, ctx, viewport, false, false);
        
        // Zombies with culling (most important for performance) - optimized loop, no ctx parameter
        this.drawEntityArray(gameState.zombies, ctx, viewport, false, false);
    }

    /**
     * Generic helper method to draw an array of entities with viewport culling
     * @param {Array} entities - Array of entity objects to render
     * @param {CanvasRenderingContext2D} ctx - Canvas 2D rendering context
     * @param {Object} viewport - Viewport bounds {left, top, right, bottom}
     * @param {boolean} checkVisibility - Whether to also check visibility (for small entities like shells/bullets)
     * @param {boolean} needsCtx - Whether the entity's draw method requires ctx as a parameter
     */
    drawEntityArray(entities, ctx, viewport, checkVisibility, needsCtx) {
        const viewportLeft = viewport.left;
        const viewportTop = viewport.top;
        const viewportRight = viewport.right;
        const viewportBottom = viewport.bottom;
        
        for (let i = 0; i < entities.length; i++) {
            const entity = entities[i];
            
            // Check viewport bounds
            if (!isInViewport(entity, viewportLeft, viewportTop, viewportRight, viewportBottom)) {
                continue;
            }
            
            // Check visibility for small entities (shells, bullets)
            if (checkVisibility && !isVisibleOnScreen(entity)) {
                continue;
            }
            
            // Draw the entity
            // Shells take ctx as parameter, others don't
            if (needsCtx) {
                entity.draw(ctx);
            } else {
                entity.draw();
            }
        }
    }
}

// Export singleton instance
export const entityRenderSystem = new EntityRenderSystem();

