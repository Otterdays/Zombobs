import { gameState } from '../core/gameState.js';
import { canvas } from '../core/canvas.js';
import { createPlayer } from '../core/gameState.js';
import { PLAYER_BASE_SPEED } from '../core/constants.js';
import { shootBullet, reloadWeapon } from '../utils/combatUtils.js';
import { CompanionDialogue } from './CompanionDialogue.js';

/**
 * CompanionSystem manages AI NPC companions
 * Handles their behavior, decision-making, and lifecycle
 */
export class CompanionSystem {
    constructor() {
        this.maxCompanions = 4;
        this.leashDistance = 500; // Max distance from P1 before forcing return
        this.followDistance = 150; // Preferred distance from P1 when idle
        this.combatRange = 500; // Max range to engage zombies
        this.kiteDistance = 200; // Distance at which to back away from zombies
        this.engageDistance = 350; // Distance at which to approach zombies
    }

    /**
     * Adds a new AI companion to the game
     * @returns {Object|null} The created companion player object, or null if max reached
     */
    addCompanion() {
        if (gameState.players.length >= this.maxCompanions) {
            return null; // Max 4 players
        }

        const colorIndex = gameState.players.length; // Use next available color
        const spawnOffset = gameState.players.length * 50; // Offset spawn position
        const aiPlayer = createPlayer(canvas.width / 2 + spawnOffset, canvas.height / 2, colorIndex);
        aiPlayer.inputSource = 'ai';
        aiPlayer.gamepadIndex = null;
        aiPlayer.gamepadIndex = null;
        aiPlayer.dialogue = new CompanionDialogue(aiPlayer);
        aiPlayer.dialogue.trigger('spawn');
        gameState.players.push(aiPlayer);

        return aiPlayer;
    }

    /**
     * Updates AI companion behavior for a single frame
     * Modifies the player object directly (angle, isSprinting, speed)
     * Returns movement vector {moveX, moveY}
     * 
     * @param {Object} player - The AI companion player object
     * @returns {{moveX: number, moveY: number}} Movement vector for this frame
     */
    update(player) {
        if (!player || player.health <= 0) {
            return { moveX: 0, moveY: 0 };
        }

        const p1 = gameState.players[0];
        if (!p1 || p1.health <= 0) {
            // No leader, stand still
            player.angle = 0;
            player.isSprinting = false;
            player.speed = PLAYER_BASE_SPEED;
            return { moveX: 0, moveY: 0 };
        }

        const dxToP1 = player.x - p1.x;
        const dyToP1 = player.y - p1.y;
        const distToP1Squared = dxToP1 * dxToP1 + dyToP1 * dyToP1;
        const distToP1 = Math.sqrt(distToP1Squared);

        // Find nearest zombie
        let nearestZombie = null;
        let minDistSquared = Infinity;

        for (let i = 0; i < gameState.zombies.length; i++) {
            const zombie = gameState.zombies[i];
            const dx = zombie.x - player.x;
            const dy = zombie.y - player.y;
            const distSquared = dx * dx + dy * dy;

            if (distSquared < minDistSquared) {
                minDistSquared = distSquared;
                nearestZombie = zombie;
            }
        }

        const minDist = Math.sqrt(minDistSquared);

        let moveX = 0;
        let moveY = 0;
        let wantsToMove = false;

        if (nearestZombie) {
            const dx = nearestZombie.x - player.x;
            const dy = nearestZombie.y - player.y;
            const dist = minDist;

            // Face the zombie
            player.angle = Math.atan2(dy, dx);

            // Combat movement logic
            const leashDistSquared = this.leashDistance * this.leashDistance;
            if (dist < this.kiteDistance) {
                // Too close! Back away (Kite)
                moveX = -(dx / dist);
                moveY = -(dy / dist);
                wantsToMove = true;
            } else if (distToP1Squared > leashDistSquared) {
                // Too far from squad, regroup towards P1 (ignoring zombie positioning slightly)
                const distP1 = Math.sqrt(distToP1Squared);
                moveX = dxToP1 / distP1;
                moveY = dyToP1 / distP1;
                wantsToMove = true;
            } else if (dist > this.engageDistance) {
                // Close the gap slightly if safe
                moveX = (dx / dist) * 0.5; // Move slower when approaching
                moveY = (dy / dist) * 0.5;
                wantsToMove = true;
            }

            // Shooting Logic
            // Check if we have ammo and are not reloading
            if (!player.isReloading && player.currentAmmo > 0 && dist < this.combatRange) {
                // Add a small random delay or check to prevent perfect laser aim fire rate
                // For now, just fire if cooldown allows (shootBullet handles fire rate)
                const targetPos = { x: nearestZombie.x, y: nearestZombie.y };
                // Random inaccuracy
                targetPos.x += (Math.random() - 0.5) * 20;
                targetPos.y += (Math.random() - 0.5) * 20;

                shootBullet(targetPos, canvas, player);
                if (player.dialogue) player.dialogue.trigger('engaging', 0.05);
            } else if (player.currentAmmo <= 0 && !player.isReloading) {
                reloadWeapon(player);
                if (player.dialogue) player.dialogue.trigger('reload');
            }

        } else {
            // No enemies, stick close to P1
            const followDistSquared = this.followDistance * this.followDistance;
            if (distToP1Squared > followDistSquared) {
                const dist = Math.sqrt(distToP1Squared);
                moveX = dxToP1 / dist;
                moveY = dyToP1 / dist;
                wantsToMove = true;
                // Face movement direction when just walking
                player.angle = Math.atan2(moveY, moveX);
            }
        }

        if (!wantsToMove) {
            moveX = 0;
            moveY = 0;
        }

        // AI doesn't sprint (moves at base speed)
        player.isSprinting = false;
        player.speed = PLAYER_BASE_SPEED;

        // Update dialogue system
        if (player.dialogue) {
            player.dialogue.update();

            // Trigger idle dialogue occasionally
            if (!nearestZombie && !wantsToMove) {
                player.dialogue.trigger('idle', 0.001); // Low chance per frame
            }

            // Trigger low health dialogue
            if (player.health < player.maxHealth * 0.3) {
                player.dialogue.trigger('low_health', 0.01);
            }
        }

        return { moveX, moveY };
    }
}

