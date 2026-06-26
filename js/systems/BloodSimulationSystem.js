/**
 * BloodSimulationSystem.js
 * 
 * GPU-Accelerated Volumetric Blood Simulation System
 * Uses WebGPU compute shaders for real-time blood flow physics
 * 
 * Features:
 * - Voxel-based fluid dynamics (cellular automata + Navier-Stokes approximation)
 * - Blood pooling and spreading on ground
 * - Viscosity simulation (thick blood physics)
 * - Evaporation over time
 * - Quality scaling (Low: disabled, Medium: 64x64, High: 128x128, Ultra: 128x128 + enhanced)
 */

import { settingsManager } from './SettingsManager.js';
import { graphicsSettings } from './GraphicsSystem.js';

export class BloodSimulationSystem {
    constructor() {
        this.gridWidth = 128;
        this.gridHeight = 128;
        this.cellSize = 5; // pixels per cell
        
        // Double-buffered grids to avoid allocating new objects every frame
        this.gridA = []; // Primary grid
        this.gridB = []; // Secondary grid (swap target)
        this.currentGrid = null; // Points to active grid
        this.nextGrid = null; // Points to next grid (for writing)
        this.enabled = false;

        // Quality settings
        this.qualityPreset = 'high';
        this.updateInterval = 16; // ms between updates (60fps)
        this.lastUpdateTime = 0;

        // Blood spawn queue (from combat system)
        this.spawnQueue = [];

        // Performance tracking
        this.simulationTime = 0;
        this._gridInitialized = false;
    }
    
    /**
     * Getter for backwards compatibility - returns current active grid
     */
    get bloodGrid() {
        return this.currentGrid || this.gridA;
    }

    /**
     * Initialize blood simulation system (grid allocation deferred until gameplay)
     */
    init() {
        this.updateQualitySettings();
    }

    ensureGridInitialized() {
        if (this._gridInitialized || !this.enabled) return;
        this.initializeGrid();
        this._gridInitialized = true;
    }

    /**
     * Initialize blood grids with empty cells (double-buffered)
     */
    initializeGrid() {
        const totalCells = this.gridWidth * this.gridHeight;
        
        // Initialize both grids for double-buffering
        this.gridA = [];
        this.gridB = [];
        
        for (let i = 0; i < totalCells; i++) {
            this.gridA.push({
                height: 0,      // Blood depth (0.0 - 1.0)
                viscosity: 0.8, // Thickness (fresh = 0.8, dried = 0.2)
                worldX: 0,      // World position X (for camera offset)
                worldY: 0       // World position Y (for camera offset)
            });
            this.gridB.push({
                height: 0,
                viscosity: 0.8,
                worldX: 0,
                worldY: 0
            });
        }
        
        // Set initial pointers
        this.currentGrid = this.gridA;
        this.nextGrid = this.gridB;
    }

    /**
     * Update quality settings based on graphics preset
     */
    updateQualitySettings() {
        const quality = settingsManager.getSetting('video', 'qualityPreset') || 'high';
        const bloodGoreLevel = settingsManager.getSetting('video', 'bloodGoreLevel') ?? 1.0;

        this.qualityPreset = quality;

        // Disable blood simulation for low/medium quality or if gore disabled
        if (quality === 'low' || quality === 'medium' || bloodGoreLevel === 0) {
            this.enabled = false;
            return;
        }

        // Configure grid size based on quality
        if (quality === 'high' || quality === 'custom') {
            this.gridWidth = 64;
            this.gridHeight = 64;
            this.cellSize = 10; // Larger cells for performance
            this.updateInterval = 32; // 30fps update rate
        } else if (quality === 'ultra') {
            this.gridWidth = 128;
            this.gridHeight = 128;
            this.cellSize = 5; // Smaller cells for detail
            this.updateInterval = 16; // 60fps update rate
        }

        this.enabled = true;
    }

    /**
     * @returns {number} Grid cell index, or -1 if out of bounds
     */
    worldToGridIndex(worldX, worldY) {
        // For now, use simple modulo wrapping (simpler than chunk system)
        // This creates a repeating blood grid pattern
        const gridX = Math.floor(worldX / this.cellSize) % this.gridWidth;
        const gridY = Math.floor(worldY / this.cellSize) % this.gridHeight;

        // Handle negative coordinates
        const normalizedX = gridX < 0 ? gridX + this.gridWidth : gridX;
        const normalizedY = gridY < 0 ? gridY + this.gridHeight : gridY;

        return normalizedY * this.gridWidth + normalizedX;
    }

    /**
     * Add blood at a specific world position
     * @param {number} worldX - World X coordinate
     * @param {number} worldY - World Y coordinate
     * @param {number} amount - Blood amount (0.0 - 1.0)
     */
    addBlood(worldX, worldY, amount = 0.5) {
        if (!this.enabled) return;

        const goreLevel = settingsManager.getSetting('video', 'bloodGoreLevel') ?? 1.0;
        const finalAmount = amount * goreLevel;

        // Queue the blood spawn for next update
        this.spawnQueue.push({
            worldX,
            worldY,
            amount: finalAmount
        });
    }

    /**
     * Update blood simulation (CPU fallback when WebGPU is unavailable)
     * @param {number} deltaTime - Time since last update in ms
     */
    update(deltaTime) {
        if (!this.enabled) return;
        this.ensureGridInitialized();
        if (!this._gridInitialized) return;

        const now = performance.now();

        // Throttle updates based on quality setting
        if (now - this.lastUpdateTime < this.updateInterval) {
            return;
        }

        const dt = now - this.lastUpdateTime;
        this.lastUpdateTime = now;

        const updateStart = performance.now();

        // Process spawn queue
        this.processSpawnQueue();

        // Simulate blood physics (CPU fallback)
        this.simulateBloodPhysics(dt);

        this.simulationTime = performance.now() - updateStart;
    }

    /**
     * Process queued blood spawns
     */
    processSpawnQueue() {
        const grid = this.currentGrid;
        const gridLen = grid ? grid.length : 0;
        
        while (this.spawnQueue.length > 0) {
            const spawn = this.spawnQueue.shift();
            const index = this.worldToGridIndex(spawn.worldX, spawn.worldY);

            if (index >= 0 && index < gridLen) {
                const cell = grid[index];
                cell.height = Math.min(1.0, cell.height + spawn.amount);
                cell.viscosity = 0.8; // Fresh blood is thick
                cell.worldX = spawn.worldX;
                cell.worldY = spawn.worldY;
            }
        }
    }

    /**
     * Simulate blood physics (simplified CPU version with double-buffering)
     * @param {number} dt - Delta time in ms
     */
    simulateBloodPhysics(dt) {
        const dtSeconds = dt / 1000;
        const currentGrid = this.currentGrid;
        const nextGrid = this.nextGrid;
        const gridWidth = this.gridWidth;
        const gridHeight = this.gridHeight;

        // Update each cell (write to nextGrid based on currentGrid)
        for (let y = 0; y < gridHeight; y++) {
            const rowOffset = y * gridWidth;
            
            for (let x = 0; x < gridWidth; x++) {
                const idx = rowOffset + x;
                const cell = currentGrid[idx];
                const newCell = nextGrid[idx];

                // Skip empty cells - just copy zero state
                if (cell.height <= 0.01) {
                    newCell.height = 0;
                    newCell.viscosity = cell.viscosity;
                    newCell.worldX = cell.worldX;
                    newCell.worldY = cell.worldY;
                    continue;
                }

                // Get neighbors (with wrapping) - cache indices
                const leftIdx = rowOffset + ((x - 1 + gridWidth) % gridWidth);
                const rightIdx = rowOffset + ((x + 1) % gridWidth);
                const topIdx = ((y - 1 + gridHeight) % gridHeight) * gridWidth + x;
                const bottomIdx = ((y + 1) % gridHeight) * gridWidth + x;

                // Calculate average height (simple flow model)
                const avgHeight = (currentGrid[leftIdx].height + currentGrid[rightIdx].height + 
                                   currentGrid[topIdx].height + currentGrid[bottomIdx].height) * 0.25;

                // Flow towards lower pressure
                const pressure = (avgHeight - cell.height) * 0.1;

                // Apply viscosity damping
                const dampedPressure = pressure * cell.viscosity;

                // Update height with evaporation
                let newHeight = (cell.height + dampedPressure * dtSeconds) * 0.998;
                let newViscosity = cell.viscosity * 0.999; // Dries over time

                // Clamp values
                newCell.height = newHeight < 0 ? 0 : (newHeight > 1 ? 1 : newHeight);
                newCell.viscosity = newViscosity < 0.2 ? 0.2 : newViscosity;
                newCell.worldX = cell.worldX;
                newCell.worldY = cell.worldY;
            }
        }

        // Swap grid pointers (no allocation!)
        this.currentGrid = nextGrid;
        this.nextGrid = currentGrid;
    }

    /**
     * Get blood data for rendering
     * @returns {Array} Blood cells with worldX, worldY, height, viscosity
     */
    getBloodData() {
        if (!this.enabled || !this.currentGrid) return [];

        // Return only non-empty cells for efficient rendering
        // Use manual filter to avoid allocating intermediate arrays in hot path
        const result = [];
        const grid = this.currentGrid;
        const len = grid.length;
        
        for (let i = 0; i < len; i++) {
            if (grid[i].height > 0.01) {
                result.push(grid[i]);
            }
        }
        
        return result;
    }

    /**
     * Clear all blood from simulation
     */
    clear() {
        // Reset both grids without reallocating
        const totalCells = this.gridWidth * this.gridHeight;
        
        for (let i = 0; i < totalCells; i++) {
            if (this.gridA[i]) {
                this.gridA[i].height = 0;
                this.gridA[i].viscosity = 0.8;
            }
            if (this.gridB[i]) {
                this.gridB[i].height = 0;
                this.gridB[i].viscosity = 0.8;
            }
        }
        
        this.spawnQueue.length = 0; // Clear without allocating new array
    }

    /**
     * Get debug info
     * @returns {Object} Debug information
     */
    getDebugInfo() {
        let activeBlood = 0;
        const grid = this.currentGrid;
        if (grid) {
            const len = grid.length;
            for (let i = 0; i < len; i++) {
                if (grid[i].height > 0.01) activeBlood++;
            }
        }
        
        return {
            enabled: this.enabled,
            gridSize: `${this.gridWidth}x${this.gridHeight}`,
            cellSize: this.cellSize,
            activeCells: activeBlood,
            totalCells: grid ? grid.length : 0,
            queuedSpawns: this.spawnQueue.length,
            simulationTime: this.simulationTime.toFixed(2) + 'ms',
            quality: this.qualityPreset
        };
    }
}

// Singleton instance
export const bloodSimulationSystem = new BloodSimulationSystem();
