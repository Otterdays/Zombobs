import { ctx } from '../core/canvas.js';
import { settingsManager } from './SettingsManager.js';

let groundPattern = null;
const groundImage = new Image();
groundImage.src = 'sample_assets/tiles/bloody_dark_floor.png';

// Function to create the ground pattern from image
function createGroundPattern() {
    if (groundImage.complete && groundImage.naturalWidth > 0) {
        return ctx.createPattern(groundImage, 'repeat');
    }
    return null;
}

// Initialize ground pattern
export function initGroundPattern() {
    if (!groundPattern) {
        groundPattern = createGroundPattern();
    }
    return groundPattern;
}

/**
 * Get quality multiplier based on preset
 * Returns multipliers for scaling visual effects
 * @returns {Object} Quality multipliers {glow, size, detail, opacity}
 */
function getQualityMultipliers() {
    const quality = settingsManager.getSetting('video', 'qualityPreset') || 'high';
    const effectIntensity = settingsManager.getSetting('video', 'effectIntensity') ?? 1.0;
    
    let baseMultipliers = { glow: 1.0, size: 1.0, detail: 1.0, opacity: 1.0 };
    
    switch (quality) {
        case 'low':
            baseMultipliers = { glow: 0.3, size: 0.5, detail: 0.5, opacity: 0.2 };
            break;
        case 'medium':
            baseMultipliers = { glow: 0.7, size: 0.75, detail: 0.75, opacity: 0.4 };
            break;
        case 'high':
            baseMultipliers = { glow: 1.0, size: 1.0, detail: 1.0, opacity: 0.6 };
            break;
        case 'ultra':
            baseMultipliers = { glow: 1.5, size: 1.2, detail: 1.3, opacity: 0.8 };
            break;
        default:
            baseMultipliers = { glow: 1.0, size: 1.0, detail: 1.0, opacity: 0.6 };
    }
    
    // Apply effect intensity multiplier
    return {
        glow: baseMultipliers.glow * effectIntensity,
        size: baseMultipliers.size * effectIntensity,
        detail: baseMultipliers.detail * effectIntensity,
        opacity: Math.min(1.0, baseMultipliers.opacity * effectIntensity)
    };
}

/**
 * Get quality-specific values for visual effects
 * @param {string} effectType - Type of effect ('eyeGlow', 'muzzleFlash', 'explosion', 'aura', 'damageNumber')
 * @returns {Object} Quality-specific values for the effect
 */
export function getQualityValues(effectType) {
    const quality = settingsManager.getSetting('video', 'qualityPreset') || 'high';
    const multipliers = getQualityMultipliers();
    
    switch (effectType) {
        case 'eyeGlow':
            // Shadow blur values for zombie eyes
            const baseBlur = quality === 'low' ? 4 : quality === 'medium' ? 8 : quality === 'high' ? 12 : 18;
            return {
                shadowBlur: baseBlur * multipliers.glow,
                gradientStops: quality === 'ultra' ? 5 : quality === 'high' ? 4 : 3,
                alpha: multipliers.opacity
            };
            
        case 'muzzleFlash':
            const baseSize = quality === 'low' ? 0.5 : quality === 'medium' ? 0.75 : quality === 'high' ? 1.0 : 1.2;
            return {
                sizeMultiplier: baseSize * multipliers.size,
                hasGlow: quality !== 'low',
                hasTrail: quality === 'ultra',
                gradientLayers: quality === 'ultra' ? 3 : quality === 'high' ? 2 : 1
            };
            
        case 'explosion':
            return {
                fireParticles: quality === 'low' ? 15 : quality === 'medium' ? 25 : quality === 'high' ? 30 : 40,
                smokeParticles: quality === 'low' ? 8 : quality === 'medium' ? 12 : quality === 'high' ? 15 : 20,
                hasLargeFlash: quality !== 'low',
                hasShockwave: quality === 'ultra',
                hasTrails: quality === 'ultra' || quality === 'high'
            };
            
        case 'aura':
            return {
                opacity: multipliers.opacity,
                pulseComplexity: quality === 'ultra' ? 2 : quality === 'high' ? 1.5 : 1.0,
                hasMultiLayer: quality === 'ultra' || quality === 'high'
            };
            
        case 'damageNumber':
            return {
                hasOutline: quality !== 'low',
                outlineWidth: quality === 'ultra' ? 3 : quality === 'high' ? 2 : 1,
                hasGlow: quality === 'ultra' || quality === 'high',
                glowIntensity: quality === 'ultra' ? 1.5 : 1.0,
                fontSize: quality === 'ultra' ? 1.2 : quality === 'high' ? 1.1 : 1.0
            };
            
        default:
            return { multiplier: multipliers.size };
    }
}

export const graphicsSettings = {
    get quality() { return settingsManager.getSetting('video', 'qualityPreset'); },
    get maxParticles() { return settingsManager.getSetting('video', 'particleCount'); },
    get vignette() { return settingsManager.getSetting('video', 'vignette'); },
    get shadows() { return settingsManager.getSetting('video', 'shadows'); },
    get lighting() { return settingsManager.getSetting('video', 'lighting'); },
    get effectIntensity() { return settingsManager.getSetting('video', 'effectIntensity') ?? 1.0; },
    get postProcessingQuality() { return settingsManager.getSetting('video', 'postProcessingQuality') ?? 'medium'; },
    get particleDetail() { return settingsManager.getSetting('video', 'particleDetail') ?? 'standard'; },
    getQualityMultipliers,
    getQualityValues
};
