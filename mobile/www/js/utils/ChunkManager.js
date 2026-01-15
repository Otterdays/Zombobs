import { CHUNK_SIZE } from '../core/constants.js';

/**
 * ChunkManager - Manages chunk-based coordinate system for world division
 * Used by PropSpawnSystem to track which chunks have been spawned
 */
export class ChunkManager {
    constructor() {
        // Set of active chunks (chunks that have been spawned)
        // Format: "chunkX,chunkY" as string keys
        this.activeChunks = new Set();
    }

    /**
     * Convert world coordinates to chunk coordinates
     * @param {number} x - World X coordinate
     * @param {number} y - World Y coordinate
     * @returns {Object} Chunk coordinates {chunkX, chunkY}
     */
    getChunkCoords(x, y) {
        const chunkX = Math.floor(x / CHUNK_SIZE);
        const chunkY = Math.floor(y / CHUNK_SIZE);
        return { chunkX, chunkY };
    }

    /**
     * Get chunk key string for Set storage
     * @param {number} chunkX - Chunk X coordinate
     * @param {number} chunkY - Chunk Y coordinate
     * @returns {string} Chunk key
     */
    getChunkKey(chunkX, chunkY) {
        return `${chunkX},${chunkY}`;
    }

    /**
     * Check if a chunk has been activated (spawned)
     * @param {number} chunkX - Chunk X coordinate
     * @param {number} chunkY - Chunk Y coordinate
     * @returns {boolean} True if chunk is active
     */
    isChunkActive(chunkX, chunkY) {
        const key = this.getChunkKey(chunkX, chunkY);
        return this.activeChunks.has(key);
    }

    /**
     * Mark a chunk as active (spawned)
     * @param {number} chunkX - Chunk X coordinate
     * @param {number} chunkY - Chunk Y coordinate
     */
    activateChunk(chunkX, chunkY) {
        const key = this.getChunkKey(chunkX, chunkY);
        this.activeChunks.add(key);
    }

    /**
     * Get all chunks within a radius of a position
     * @param {number} x - World X coordinate
     * @param {number} y - World Y coordinate
     * @param {number} radius - Radius in pixels
     * @returns {Array} Array of chunk coordinates {chunkX, chunkY}
     */
    getChunksInRadius(x, y, radius) {
        const chunks = [];
        const centerChunk = this.getChunkCoords(x, y);
        const chunkRadius = Math.ceil(radius / CHUNK_SIZE);
        
        for (let dx = -chunkRadius; dx <= chunkRadius; dx++) {
            for (let dy = -chunkRadius; dy <= chunkRadius; dy++) {
                const chunkX = centerChunk.chunkX + dx;
                const chunkY = centerChunk.chunkY + dy;
                chunks.push({ chunkX, chunkY });
            }
        }
        
        return chunks;
    }

    /**
     * Reset all active chunks (for new game)
     */
    reset() {
        this.activeChunks.clear();
    }
}

// Singleton instance
export const chunkManager = new ChunkManager();

