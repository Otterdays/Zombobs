/**
 * PlayerRenderer.js - Enhanced player model with 4-directional views and round hands
 * 
 * Features:
 * - 4-directional facing (front, back, left, right) based on player angle
 * - Round hands visible on all sides for gun holding
 * - Procedural body rendering with head, torso, and limbs
 * - Smooth direction transitions
 * 
 * @version 0.9.0
 */

import { ctx } from '../core/canvas.js';
import { settingsManager } from './SettingsManager.js';
import { graphicsSettings } from './GraphicsSystem.js';
import { PLAYER_SKINS, DEFAULT_PLAYER_SKIN } from '../core/constants.js';

// Direction constants (based on player angle)
const DIRECTION = {
    DOWN: 0,   // Facing screen (front view) - 315° to 45°
    RIGHT: 1,  // Facing right - 45° to 135°
    UP: 2,     // Facing away (back view) - 135° to 225°
    LEFT: 3    // Facing left - 225° to 315°
};

/**
 * Get the facing direction from an angle (radians)
 * @param {number} angle - Player angle in radians
 * @returns {number} Direction constant
 */
function getDirectionFromAngle(angle) {
    // Normalize angle to 0-2PI
    const normalizedAngle = ((angle % (Math.PI * 2)) + (Math.PI * 2)) % (Math.PI * 2);
    const degrees = (normalizedAngle * 180 / Math.PI);

    // Map to 4 directions with dead zones
    if (degrees >= 315 || degrees < 45) {
        return DIRECTION.RIGHT;
    } else if (degrees >= 45 && degrees < 135) {
        return DIRECTION.DOWN;
    } else if (degrees >= 135 && degrees < 225) {
        return DIRECTION.LEFT;
    } else {
        return DIRECTION.UP;
    }
}

/**
 * Draw backpack/tactical gear based on direction
 * @param {number} x - Body center X
 * @param {number} y - Body center Y
 * @param {number} radius - Player radius
 * @param {number} direction - DIRECTION constant
 * @param {object} color - Player color object
 */
function drawBackpack(x, y, radius, direction, color) {
    const backpackColor = '#3e4a38'; // Dark military green
    const strapColor = '#2a3326'; // Darker strap color
    const detailColor = '#556650'; // Lighter detail

    // Dimensions
    const bodyWidth = radius * 1.6;
    const bodyHeight = radius * 1.8;

    ctx.fillStyle = backpackColor;
    ctx.strokeStyle = strapColor;

    switch (direction) {
        case DIRECTION.DOWN:
            // Front view - Straps and tactical vest details
            
            // Shoulder straps
            ctx.lineWidth = radius * 0.25;
            ctx.lineCap = 'round';
            ctx.strokeStyle = backpackColor;
            
            // Left strap
            ctx.beginPath();
            ctx.moveTo(x - bodyWidth * 0.25, y - bodyHeight * 0.4); // Shoulder
            ctx.quadraticCurveTo(
                x - bodyWidth * 0.15, y, // Curve inward
                x - bodyWidth * 0.1, y + bodyHeight * 0.3 // Down to waist
            );
            ctx.stroke();

            // Right strap
            ctx.beginPath();
            ctx.moveTo(x + bodyWidth * 0.25, y - bodyHeight * 0.4); // Shoulder
            ctx.quadraticCurveTo(
                x + bodyWidth * 0.15, y, // Curve inward
                x + bodyWidth * 0.1, y + bodyHeight * 0.3 // Down to waist
            );
            ctx.stroke();
            
            // Chest strap connecting them
            ctx.lineWidth = radius * 0.15;
            ctx.beginPath();
            ctx.moveTo(x - bodyWidth * 0.15, y - bodyHeight * 0.1);
            ctx.lineTo(x + bodyWidth * 0.15, y - bodyHeight * 0.1);
            ctx.stroke();
            
            // Buckle on chest strap
            ctx.fillStyle = '#111';
            ctx.fillRect(x - 3, y - bodyHeight * 0.1 - 3, 6, 6);
            break;

        case DIRECTION.UP:
            // Back view - Full backpack
            
            // Main pack shape
            ctx.beginPath();
            if (ctx.roundRect) {
                ctx.roundRect(
                    x - bodyWidth * 0.35, 
                    y - bodyHeight * 0.35, 
                    bodyWidth * 0.7, 
                    bodyHeight * 0.7, 
                    radius * 0.3
                );
            } else {
                ctx.rect(
                    x - bodyWidth * 0.35, 
                    y - bodyHeight * 0.35, 
                    bodyWidth * 0.7, 
                    bodyHeight * 0.7
                );
            }
            ctx.fill();
            
            // Outline/Depth
            ctx.lineWidth = 1;
            ctx.strokeStyle = '#222';
            ctx.stroke();
            
            // Pocket/Detail
            ctx.fillStyle = detailColor;
            ctx.beginPath();
            if (ctx.roundRect) {
                ctx.roundRect(
                    x - bodyWidth * 0.25, 
                    y - bodyHeight * 0.1, 
                    bodyWidth * 0.5, 
                    bodyHeight * 0.35, 
                    radius * 0.2
                );
            } else {
                ctx.rect(
                    x - bodyWidth * 0.25, 
                    y - bodyHeight * 0.1, 
                    bodyWidth * 0.5, 
                    bodyHeight * 0.35
                );
            }
            ctx.fill();
            break;

        case DIRECTION.LEFT:
            // Side view left - Backpack hump on RIGHT side (back)
            // Back of player is at x + radius * 0.4 approx
            
            // Pack profile - Extends FURTHER out
            ctx.beginPath();
            // Start at top of back
            ctx.moveTo(x + bodyWidth * 0.1, y - bodyHeight * 0.35);
            // Curve out significantly for the pack
            ctx.bezierCurveTo(
                x + bodyWidth * 0.65, y - bodyHeight * 0.2, // Control 1 (out)
                x + bodyWidth * 0.65, y + bodyHeight * 0.2, // Control 2 (out)
                x + bodyWidth * 0.1, y + bodyHeight * 0.35  // End at bottom of back
            );
            // Close shape flat against back
            ctx.lineTo(x + bodyWidth * 0.1, y - bodyHeight * 0.35);
            ctx.fill();
            
            // Outline
            ctx.lineWidth = 1;
            ctx.strokeStyle = '#222';
            ctx.stroke();
            break;

        case DIRECTION.RIGHT:
            // Side view right - Backpack hump on LEFT side (back)
            // Back of player is at x - radius * 0.4 approx
            
            // Pack profile - Extends FURTHER out
            ctx.beginPath();
            // Start at top of back
            ctx.moveTo(x - bodyWidth * 0.1, y - bodyHeight * 0.35);
            // Curve out significantly for the pack
            ctx.bezierCurveTo(
                x - bodyWidth * 0.65, y - bodyHeight * 0.2, // Control 1 (out)
                x - bodyWidth * 0.65, y + bodyHeight * 0.2, // Control 2 (out)
                x - bodyWidth * 0.1, y + bodyHeight * 0.35  // End at bottom of back
            );
            // Close shape flat against back
            ctx.lineTo(x - bodyWidth * 0.1, y - bodyHeight * 0.35);
            ctx.fill();
            
            // Outline
            ctx.lineWidth = 1;
            ctx.strokeStyle = '#222';
            ctx.stroke();
            break;
    }
}

/**
 * Draw a round hand at the specified position
 * @param {number} x - Hand center X
 * @param {number} y - Hand center Y
 * @param {number} radius - Hand radius
 * @param {object} skin - Skin color object
 * @param {boolean} isHoldingGun - Whether this hand is gripping the gun
 */
function drawHand(x, y, radius, skin, isHoldingGun = false) {
    // Hand shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.beginPath();
    ctx.arc(x + 1, y + 1, radius, 0, Math.PI * 2);
    ctx.fill();

    // Hand gradient
    const handGradient = ctx.createRadialGradient(x - 1, y - 1, 0, x, y, radius);
    handGradient.addColorStop(0, skin.highlight);
    handGradient.addColorStop(0.6, skin.mid);
    handGradient.addColorStop(1, skin.shadow);

    ctx.fillStyle = handGradient;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();

    // Hand outline
    ctx.strokeStyle = skin.outline;
    ctx.lineWidth = 1;
    ctx.stroke();

    // Finger hints for gun-holding hand
    if (isHoldingGun && radius > 4) {
        ctx.fillStyle = skin.mid;
        ctx.beginPath();
        ctx.arc(x + radius * 0.3, y, radius * 0.3, 0, Math.PI * 2);
        ctx.fill();
    }
}

/**
 * Draw the player's gun
 * @param {number} startX - Gun start X
 * @param {number} startY - Gun start Y
 * @param {number} angle - Gun angle
 * @param {number} length - Gun barrel length
 * @param {object} weapon - Current weapon object
 * @param {boolean} isFiring - Whether the gun is being fired
 */
function drawGun(startX, startY, angle, length, weapon, isFiring = false) {
    const gunWidth = 5;
    const endX = startX + Math.cos(angle) * length;
    const endY = startY + Math.sin(angle) * length;

    // Gun body
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = gunWidth;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    // Gun body gradient overlay
    ctx.strokeStyle = '#5a5a5a';
    ctx.lineWidth = gunWidth - 2;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    // Gun muzzle tip
    ctx.fillStyle = isFiring ? '#ffcc00' : '#2a2a2a';
    ctx.beginPath();
    ctx.arc(endX, endY, 3, 0, Math.PI * 2);
    ctx.fill();

    // Gun handle (small rectangle near hand)
    const handleOffset = 6;
    const handleX = startX + Math.cos(angle) * handleOffset;
    const handleY = startY + Math.sin(angle) * handleOffset;

    ctx.fillStyle = '#654321';
    const perpAngle = angle + Math.PI / 2;
    const handleWidth = 3;
    const handleHeight = 8;

    ctx.beginPath();
    ctx.ellipse(handleX, handleY + 3, handleWidth, handleHeight / 2, 0, 0, Math.PI * 2);
    ctx.fill();
}

/**
 * Draw the player body (torso and head)
 * @param {object} player - Player object
 * @param {number} direction - DIRECTION constant
 * @param {object} skin - Skin color object
 */
function drawPlayerBody(player, direction, skin) {
    const { x, y, radius, color } = player;

    // Calculate sizes
    const bodyWidth = radius * 1.6;
    const bodyHeight = radius * 1.8;
    const headRadius = radius * 0.65;

    // Body shadow
    const cachedShadows = settingsManager.getSetting('video', 'shadows') ?? true;
    if (cachedShadows) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
        ctx.beginPath();
        ctx.ellipse(x + 2, y + radius * 0.8, bodyWidth * 0.7, bodyHeight * 0.25, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    // Outer glow aura
    const glowGradient = ctx.createRadialGradient(x, y, 0, x, y, radius * 2);
    glowGradient.addColorStop(0, color.glow);
    glowGradient.addColorStop(1, color.glow.replace(/[\d.]+\)/, '0)'));
    ctx.fillStyle = glowGradient;
    ctx.beginPath();
    ctx.arc(x, y, radius * 2, 0, Math.PI * 2);
    ctx.fill();

    // Torso (rounded rectangle approximation with ellipse)
    const torsoY = y + radius * 0.15;

    // Torso gradient
    const torsoGradient = ctx.createRadialGradient(x - 3, torsoY - 5, 0, x, torsoY, bodyHeight * 0.6);
    torsoGradient.addColorStop(0, color.light);
    torsoGradient.addColorStop(0.7, color.dark);
    torsoGradient.addColorStop(1, color.outline);

    ctx.fillStyle = torsoGradient;
    ctx.beginPath();
    ctx.ellipse(x, torsoY, bodyWidth * 0.55, bodyHeight * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Torso outline
    ctx.strokeStyle = color.outline;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Backpack/Tactical Gear
    drawBackpack(x, torsoY, radius, direction, color);

    // Head
    const headY = y - radius * 0.6;

    // Head gradient
    const headGradient = ctx.createRadialGradient(x - 2, headY - 2, 0, x, headY, headRadius);
    headGradient.addColorStop(0, skin.highlight);  // Skin highlight
    headGradient.addColorStop(0.5, skin.mid);      // Mid skin
    headGradient.addColorStop(1, skin.shadow);     // Skin shadow

    ctx.fillStyle = headGradient;
    ctx.beginPath();
    ctx.arc(x, headY, headRadius, 0, Math.PI * 2);
    ctx.fill();

    // Head outline
    ctx.strokeStyle = skin.outline;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Face details based on direction
    drawFace(x, headY, headRadius, direction);

    // Hair/helmet
    drawHeadgear(x, headY, headRadius, direction, color);
}

/**
 * Draw the player's face based on direction
 * @param {number} x - Head center X
 * @param {number} y - Head center Y
 * @param {number} radius - Head radius
 * @param {number} direction - DIRECTION constant
 */
function drawFace(x, y, radius, direction) {
    switch (direction) {
        case DIRECTION.DOWN:
            // Front view - both eyes visible
            const eyeOffsetX = radius * 0.35;
            const eyeY = y - radius * 0.1;
            const eyeRadius = radius * 0.15;

            // Eye whites
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(x - eyeOffsetX, eyeY, eyeRadius, 0, Math.PI * 2);
            ctx.arc(x + eyeOffsetX, eyeY, eyeRadius, 0, Math.PI * 2);
            ctx.fill();

            // Pupils
            ctx.fillStyle = '#2a2a2a';
            ctx.beginPath();
            ctx.arc(x - eyeOffsetX, eyeY, eyeRadius * 0.6, 0, Math.PI * 2);
            ctx.arc(x + eyeOffsetX, eyeY, eyeRadius * 0.6, 0, Math.PI * 2);
            ctx.fill();

            // Mouth (determined expression)
            ctx.strokeStyle = '#8b4513';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(x - radius * 0.2, y + radius * 0.4);
            ctx.lineTo(x + radius * 0.2, y + radius * 0.4);
            ctx.stroke();
            break;

        case DIRECTION.UP:
            // Back of head - just hair detail
            break;

        case DIRECTION.LEFT:
            // Profile view - one eye, side face
            const leftEyeX = x - radius * 0.25;
            const leftEyeY = y - radius * 0.1;

            // Single eye
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.ellipse(leftEyeX, leftEyeY, radius * 0.12, radius * 0.15, 0, 0, Math.PI * 2);
            ctx.fill();

            // Pupil
            ctx.fillStyle = '#2a2a2a';
            ctx.beginPath();
            ctx.arc(leftEyeX - 1, leftEyeY, radius * 0.08, 0, Math.PI * 2);
            ctx.fill();

            // Nose hint
            ctx.strokeStyle = '#c99a5c';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(x - radius * 0.6, y);
            ctx.lineTo(x - radius * 0.55, y + radius * 0.15);
            ctx.stroke();
            break;

        case DIRECTION.RIGHT:
            // Profile view - right side
            const rightEyeX = x + radius * 0.25;
            const rightEyeY = y - radius * 0.1;

            // Single eye
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.ellipse(rightEyeX, rightEyeY, radius * 0.12, radius * 0.15, 0, 0, Math.PI * 2);
            ctx.fill();

            // Pupil
            ctx.fillStyle = '#2a2a2a';
            ctx.beginPath();
            ctx.arc(rightEyeX + 1, rightEyeY, radius * 0.08, 0, Math.PI * 2);
            ctx.fill();

            // Nose hint
            ctx.strokeStyle = '#c99a5c';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(x + radius * 0.6, y);
            ctx.lineTo(x + radius * 0.55, y + radius * 0.15);
            ctx.stroke();
            break;
    }
}

/**
 * Draw headgear/helmet based on direction
 * @param {number} x - Head center X
 * @param {number} y - Head center Y
 * @param {number} radius - Head radius
 * @param {number} direction - DIRECTION constant
 * @param {object} color - Player color object
 */
function drawHeadgear(x, y, radius, direction, color) {
    // Military-style helmet/cap
    const helmetColor = color.dark;
    const helmetHighlight = color.light;

    ctx.fillStyle = helmetColor;

    switch (direction) {
        case DIRECTION.DOWN:
            // Front view - Improved Tactical Helmet
            
            // 1. Ear Covers (bulging out slightly) - Draw first
            ctx.fillStyle = helmetColor;
            
            // Left Ear Muff
            ctx.beginPath();
            ctx.ellipse(x - radius * 0.95, y + radius * 0.05, radius * 0.25, radius * 0.35, 0.1, 0, Math.PI * 2);
            ctx.fill();
            
            // Right Ear Muff
            ctx.beginPath();
            ctx.ellipse(x + radius * 0.95, y + radius * 0.05, radius * 0.25, radius * 0.35, -0.1, 0, Math.PI * 2);
            ctx.fill();

            // Ear Cover Highlights (to distinguish them)
            ctx.fillStyle = helmetHighlight;
            // Left highlight strip
            ctx.beginPath();
            ctx.ellipse(x - radius * 1.05, y + radius * 0.05, radius * 0.05, radius * 0.2, 0.1, 0, Math.PI * 2);
            ctx.fill();
            // Right highlight strip
            ctx.beginPath();
            ctx.ellipse(x + radius * 1.05, y + radius * 0.05, radius * 0.05, radius * 0.2, -0.1, 0, Math.PI * 2);
            ctx.fill();

            // 2. Helmet Shell (Main Dome) - sits between/on top of ear covers
            ctx.fillStyle = helmetColor;
            ctx.beginPath();
            // Start at left temple (above ear muff)
            ctx.moveTo(x - radius * 0.9, y - radius * 0.1);
            // Dome
            ctx.bezierCurveTo(
                x - radius * 0.9, y - radius * 1.4, 
                x + radius * 0.9, y - radius * 1.4, 
                x + radius * 0.9, y - radius * 0.1
            );
            // Forehead rim curve
            ctx.quadraticCurveTo(
                x, y - radius * 0.5, 
                x - radius * 0.9, y - radius * 0.1
            );
            ctx.fill();
            
            // 3. Helmet Rim/Highlight (Forehead)
            ctx.fillStyle = helmetHighlight;
            ctx.beginPath();
            ctx.moveTo(x - radius * 0.9, y - radius * 0.1);
            ctx.quadraticCurveTo(x, y - radius * 0.5, x + radius * 0.9, y - radius * 0.1);
            ctx.quadraticCurveTo(x, y - radius * 0.65, x - radius * 0.9, y - radius * 0.1);
            ctx.fill();
            break;

        case DIRECTION.UP:
            // Back view - Full tactical helmet coverage
            
            // 1. Ear Covers (bulging out slightly)
            ctx.fillStyle = helmetColor;
            ctx.beginPath();
            ctx.ellipse(x - radius * 0.95, y + radius * 0.05, radius * 0.25, radius * 0.35, -0.1, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(x + radius * 0.95, y + radius * 0.05, radius * 0.25, radius * 0.35, 0.1, 0, Math.PI * 2);
            ctx.fill();

            // 2. Main Shell
            ctx.beginPath();
            // Slightly wider base than top
            ctx.arc(x, y - radius * 0.25, radius * 1.1, 0, Math.PI * 2);
            ctx.fill();
            
            // Helmet detailing (V-shape back straps or ridges)
            ctx.fillStyle = helmetHighlight;
            ctx.beginPath();
            ctx.moveTo(x - radius * 0.5, y + radius * 0.4);
            ctx.quadraticCurveTo(x, y + radius * 0.1, x + radius * 0.5, y + radius * 0.4);
            ctx.quadraticCurveTo(x, y + radius * 0.2, x - radius * 0.5, y + radius * 0.4);
            ctx.fill();
            break;

        case DIRECTION.LEFT:
            // Side view left - Tactical profile
            // Face is to the LEFT. Back of head is RIGHT.
            
            // Ear Muff (More distinct)
            ctx.fillStyle = helmetColor;
            ctx.beginPath();
            ctx.ellipse(x, y, radius * 0.35, radius * 0.4, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // Helmet shell (cut around ear)
            ctx.beginPath();
            ctx.moveTo(x + radius * 0.9, y + radius * 0.2); // Back of neck (Right side)
            ctx.bezierCurveTo(
                x + radius * 1.2, y - radius * 1.3, // Back top
                x - radius * 0.8, y - radius * 1.3, // Front top
                x - radius * 0.9, y - radius * 0.3  // Front brim (Left side)
            );
            ctx.lineTo(x - radius * 0.4, y - radius * 0.1); // Cut back for ear
            // Curve over ear muff
            ctx.bezierCurveTo(
                x - radius * 0.2, y - radius * 0.5,
                x + radius * 0.4, y - radius * 0.5,
                x + radius * 0.5, y + radius * 0.1
            );
            ctx.lineTo(x + radius * 0.9, y + radius * 0.2);
            ctx.fill();
            
            // Ear cup highlight ring
            ctx.strokeStyle = helmetHighlight;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.ellipse(x, y, radius * 0.25, radius * 0.3, 0, 0, Math.PI * 2);
            ctx.stroke();
            break;

        case DIRECTION.RIGHT:
            // Side view right - Tactical profile
            // Face is to the RIGHT. Back of head is LEFT.
            
            // Ear Muff (More distinct)
            ctx.fillStyle = helmetColor;
            ctx.beginPath();
            ctx.ellipse(x, y, radius * 0.35, radius * 0.4, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // Helmet shell
            ctx.beginPath();
            ctx.moveTo(x - radius * 0.9, y + radius * 0.2); // Back of neck (Left side)
            ctx.bezierCurveTo(
                x - radius * 1.2, y - radius * 1.3, // Back top
                x + radius * 0.8, y - radius * 1.3, // Front top
                x + radius * 0.9, y - radius * 0.3  // Front brim (Right side)
            );
            ctx.lineTo(x + radius * 0.4, y - radius * 0.1); // Cut back for ear
            // Curve over ear muff
            ctx.bezierCurveTo(
                x + radius * 0.2, y - radius * 0.5,
                x - radius * 0.4, y - radius * 0.5,
                x - radius * 0.5, y + radius * 0.1
            );
            ctx.lineTo(x - radius * 0.9, y + radius * 0.2);
            ctx.fill();
            
            // Ear cup highlight ring
            ctx.strokeStyle = helmetHighlight;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.ellipse(x, y, radius * 0.25, radius * 0.3, 0, 0, Math.PI * 2);
            ctx.stroke();
            break;
    }
}

/**
 * Draw the complete player with hands and gun
 * @param {object} player - Player object
 * @param {boolean} isFiring - Whether player is currently firing
 */
export function drawEnhancedPlayer(player, isFiring = false) {
    const { x, y, radius, angle, color, currentWeapon, equippedSkin } = player;

    // Resolve skin colors
    const skin = (equippedSkin && PLAYER_SKINS[equippedSkin]) ? PLAYER_SKINS[equippedSkin] : DEFAULT_PLAYER_SKIN;

    // Determine facing direction based on angle
    const direction = getDirectionFromAngle(angle);

    // Calculate hand positions based on direction
    const handRadius = radius * 0.28; // Slightly noticeable round hands
    const armLength = radius * 1.1;

    // Gun parameters
    const gunLength = radius * 1.5;

    // Hand positions for 4 directions
    let leadHandPos, rearHandPos, gunStartPos;

    switch (direction) {
        case DIRECTION.DOWN:
            // Facing screen - gun pointing down-ish
            leadHandPos = {
                x: x + Math.cos(angle) * armLength,
                y: y + Math.sin(angle) * armLength
            };
            rearHandPos = {
                x: x + Math.cos(angle) * (armLength * 0.5) - Math.sin(angle) * radius * 0.3,
                y: y + Math.sin(angle) * (armLength * 0.5) + Math.cos(angle) * radius * 0.3
            };
            gunStartPos = {
                x: x + Math.cos(angle) * radius * 0.3,
                y: y + Math.sin(angle) * radius * 0.3
            };
            break;

        case DIRECTION.UP:
            // Facing away - gun pointing up-ish, hands less visible
            leadHandPos = {
                x: x + Math.cos(angle) * armLength,
                y: y + Math.sin(angle) * armLength
            };
            rearHandPos = {
                x: x + Math.cos(angle) * (armLength * 0.5) + Math.sin(angle) * radius * 0.3,
                y: y + Math.sin(angle) * (armLength * 0.5) - Math.cos(angle) * radius * 0.3
            };
            gunStartPos = {
                x: x + Math.cos(angle) * radius * 0.3,
                y: y + Math.sin(angle) * radius * 0.3
            };
            break;

        case DIRECTION.LEFT:
            // Facing left
            leadHandPos = {
                x: x + Math.cos(angle) * armLength,
                y: y + Math.sin(angle) * armLength
            };
            rearHandPos = {
                x: x + Math.cos(angle) * (armLength * 0.5) + radius * 0.15,
                y: y + Math.sin(angle) * (armLength * 0.5) + radius * 0.2
            };
            gunStartPos = {
                x: x + Math.cos(angle) * radius * 0.35,
                y: y + Math.sin(angle) * radius * 0.35
            };
            break;

        case DIRECTION.RIGHT:
            // Facing right
            leadHandPos = {
                x: x + Math.cos(angle) * armLength,
                y: y + Math.sin(angle) * armLength
            };
            rearHandPos = {
                x: x + Math.cos(angle) * (armLength * 0.5) - radius * 0.15,
                y: y + Math.sin(angle) * (armLength * 0.5) + radius * 0.2
            };
            gunStartPos = {
                x: x + Math.cos(angle) * radius * 0.35,
                y: y + Math.sin(angle) * radius * 0.35
            };
            break;
    }

    // Draw order based on direction for proper layering
    if (direction === DIRECTION.UP) {
        // Back view: Draw rear hand first (behind head), then gun, lead hand, then body
        drawHand(rearHandPos.x, rearHandPos.y, handRadius * 0.9, skin, false);
        drawGun(gunStartPos.x, gunStartPos.y, angle, gunLength, currentWeapon, isFiring);
        drawHand(leadHandPos.x, leadHandPos.y, handRadius, skin, true);
        drawPlayerBody(player, direction, skin);
    } else if (direction === DIRECTION.DOWN) {
        // Front view: Body first, then arms and gun
        drawPlayerBody(player, direction, skin);
        // Arms connecting to body
        ctx.strokeStyle = color.dark;
        ctx.lineWidth = radius * 0.35;
        ctx.lineCap = 'round';

        // Leading arm (to gun)
        ctx.beginPath();
        ctx.moveTo(x + Math.cos(angle + 0.3) * radius * 0.4, y + Math.sin(angle + 0.3) * radius * 0.4);
        ctx.lineTo(leadHandPos.x, leadHandPos.y);
        ctx.stroke();

        // Rear arm
        ctx.beginPath();
        ctx.moveTo(x - Math.cos(angle - 0.3) * radius * 0.3, y + radius * 0.1);
        ctx.lineTo(rearHandPos.x, rearHandPos.y);
        ctx.stroke();

        drawGun(gunStartPos.x, gunStartPos.y, angle, gunLength, currentWeapon, isFiring);
        drawHand(rearHandPos.x, rearHandPos.y, handRadius * 0.9, skin, false);
        drawHand(leadHandPos.x, leadHandPos.y, handRadius, skin, true);
    } else {
        // Side views: Partial body visibility
        drawPlayerBody(player, direction, skin);

        // Draw arm to leading hand
        ctx.strokeStyle = color.dark;
        ctx.lineWidth = radius * 0.35;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x + (direction === DIRECTION.LEFT ? -1 : 1) * radius * 0.3, y + radius * 0.1);
        ctx.lineTo(leadHandPos.x, leadHandPos.y);
        ctx.stroke();

        drawGun(gunStartPos.x, gunStartPos.y, angle, gunLength, currentWeapon, isFiring);
        drawHand(rearHandPos.x, rearHandPos.y, handRadius * 0.85, skin, false);
        drawHand(leadHandPos.x, leadHandPos.y, handRadius, skin, true);
    }
}

/**
 * Get the current direction a player is facing
 * @param {object} player - Player object
 * @returns {string} Direction name ('up', 'down', 'left', 'right')
 */
export function getPlayerDirection(player) {
    const dir = getDirectionFromAngle(player.angle);
    switch (dir) {
        case DIRECTION.DOWN: return 'down';
        case DIRECTION.UP: return 'up';
        case DIRECTION.LEFT: return 'left';
        case DIRECTION.RIGHT: return 'right';
        default: return 'down';
    }
}

export { DIRECTION, getDirectionFromAngle };
