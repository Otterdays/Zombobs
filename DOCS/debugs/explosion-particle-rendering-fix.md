# Explosion Particle Rendering Fix

**Date**: 2025-11-24  
**Status**: ✅ FIXED  
**Severity**: Critical - Gameplay Impact

## Problem Description

Explosion particles from grenades and rockets were not visible on screen, despite:
- Particles being successfully created (confirmed via console logs)
- Particles having valid coordinates, colors, and radii
- `drawParticles()` function being called
- Test red circle rendering correctly (proving drawing works)

## Root Cause

The `Particle` class in `js/entities/Particle.js` had an **empty `draw(ctx)` method**. When `ParticleSystem.js` iterated through particles, it checked `if (particle.draw)` and found this method, then called it. However, the method was essentially empty (only checked for `customDraw` which was usually null), so **nothing was drawn**.

This explains why:
- Logs showed particles being "drawn"
- Particles had valid data
- But nothing appeared on screen

## Solution

### Primary Fix
**Removed `draw()` method from `Particle` class** (`js/entities/Particle.js`)
- This forces `ParticleSystem.js` to use its robust fallback rendering logic
- The fallback logic properly handles color conversion and alpha blending

### Additional Fixes Applied During Investigation

1. **Color Format Conversion** (`js/systems/ParticleSystem.js`)
   - Convert hex colors (`#ffffff`, `#ffff00`) to `rgba()` format
   - Canvas 2D handles `rgba()` with alpha more reliably than hex colors with `globalAlpha`

2. **Minimum Alpha for Large Particles**
   - Explosion particles with radius > 50 get minimum alpha of 0.3
   - Ensures large flash particles remain visible even as life decreases

3. **Render Order Fix** (`js/main.js`)
   - Moved `webgpuRenderer.render()` to after `drawGame()`
   - Ensures particles are synced before WebGPU frame renders
   - Particles now draw after all overlays (vignette, lighting, etc.)

4. **Canvas Layering**
   - Reverted to Canvas 2D rendering for particles
   - `gameCanvas` (z-index 1) is on top of `gpuCanvas` (z-index 0)
   - Ensures particles are always visible above WebGPU background

## Files Modified

1. `js/entities/Particle.js`
   - Removed empty `draw()` method (lines 36-78)
   - Added comment explaining removal

2. `js/systems/ParticleSystem.js`
   - Enhanced color conversion logic (hex to rgba)
   - Added minimum alpha for large particles
   - Improved debugging logs
   - Removed debug red circle code

3. `js/main.js`
   - Fixed render order (moved WebGPU render after drawGame)
   - Fixed particle drawing position (after overlays, with camera transform)

## Testing

- ✅ Grenade explosions now visible at detonation location
- ✅ Rocket explosions now visible at impact location
- ✅ Grenade trails render correctly
- ✅ Rocket trails render correctly
- ✅ All particle colors display correctly (white flash, yellow, orange, red)
- ✅ Large explosion particles (radius 150-281) are clearly visible

## Lessons Learned

1. **Empty methods can break rendering**: An empty `draw()` method that does nothing is worse than no method at all
2. **Always check for method existence**: The `if (particle.draw)` check was correct, but the method itself was broken
3. **Color format matters**: Hex colors with `globalAlpha` can be unreliable; `rgba()` with alpha included is more reliable
4. **Render order is critical**: Particles must be drawn after overlays and with correct camera transform

## Prevention

- When using object pools, ensure reset methods clear function properties
- Consider using a flag instead of method existence check (e.g., `particle.hasCustomDraw`)
- Always test visual rendering, not just data creation
- Document expected rendering behavior in class comments

## Related Issues

- Initial WebGPU particle rendering attempt (reverted to Canvas 2D)
- Canvas layering confusion (gpuCanvas vs gameCanvas)
- Render order timing issues

