import { gameState } from '../core/gameState.js';
import { canvas } from '../core/canvas.js';
import {
    SCRAP_SHRINE_SPAWN_CHANCE,
    SCRAP_SHRINE_MIN_WAVE,
    SCRAP_SHOP_OFFERS,
    SCRAP_SHOP_OVERCLOCK_DURATION_MS,
    SCRAP_SHOP_SHIELD_AMOUNT,
    WEAPONS
} from '../core/constants.js';
import { ScrapShrine } from '../entities/ScrapShrine.js';
import { createParticles } from './ParticleSystem.js';
import { DamageNumber } from '../entities/Particle.js';
import { isSinglePlayerArcadeMode } from '../utils/gameUtils.js';

/**
 * ScrapShopSystem — wave-break scrap shrine spawn and purchases.
 */
export class ScrapShopSystem {
    trySpawnShrine() {
        if (gameState.multiplayer.active) return;
        if (gameState.wave < SCRAP_SHRINE_MIN_WAVE) return;
        if (gameState.scrapShrines.length > 0) return;
        if (Math.random() >= SCRAP_SHRINE_SPAWN_CHANCE) return;

        const localPlayer = gameState.players.find(p => p.inputSource === 'mouse') || gameState.players[0];
        if (!localPlayer || localPlayer.health <= 0) return;

        const offer = SCRAP_SHOP_OFFERS[Math.floor(Math.random() * SCRAP_SHOP_OFFERS.length)];
        const { x, y } = this._getSpawnPosition(localPlayer);
        gameState.scrapShrines.push(new ScrapShrine(x, y, offer));
    }

    clearShrines() {
        gameState.scrapShrines = [];
    }

    getActiveShrine() {
        return gameState.scrapShrines.length > 0 ? gameState.scrapShrines[0] : null;
    }

    getNearbyShrine(player) {
        if (!player || player.health <= 0) return null;
        const shrine = this.getActiveShrine();
        if (!shrine || !shrine.isPlayerNear(player)) return null;
        return shrine;
    }

    /**
     * @param {Object} player
     * @param {number} [offerIndex] - 0-based index into SCRAP_SHOP_OFFERS; defaults to shrine offer
     * @returns {boolean}
     */
    tryPurchase(player, offerIndex = null) {
        if (!gameState.waveBreakActive || !gameState.gameRunning || gameState.gamePaused) {
            return false;
        }

        const shrine = this.getNearbyShrine(player);
        if (!shrine) return false;

        const offer = offerIndex !== null
            ? SCRAP_SHOP_OFFERS[offerIndex]
            : shrine.offer;
        if (!offer) return false;

        const scrap = player.scrap || 0;
        if (scrap < offer.cost) {
            this._spawnFeedback(shrine.x, shrine.y - 30, `Need ${offer.cost} scrap`, '#ff5252');
            return false;
        }

        if (!this._applyUpgrade(player, offer.id)) {
            return false;
        }

        player.scrap = scrap - offer.cost;
        createParticles(shrine.x, shrine.y, '#ffd700', 14);
        this._spawnFeedback(shrine.x, shrine.y - 40, offer.label, '#76ff03');
        this.clearShrines();
        return true;
    }

    getPromptText(player) {
        const shrine = this.getNearbyShrine(player);
        if (!shrine) return null;

        const canAfford = (player.scrap || 0) >= shrine.offer.cost;
        const affordTag = canAfford ? '' : ' (low scrap)';
        return `${shrine.offer.icon} ${shrine.offer.label} [${shrine.offer.cost}] — Press E${affordTag}`;
    }

    _applyUpgrade(player, offerId) {
        const now = Date.now();

        if (offerId === 'ammo') {
            const ammoMultiplier = player.ammoMultiplier || 1.0;
            player.maxAmmo = Math.floor(player.currentWeapon.maxAmmo * ammoMultiplier);
            player.currentAmmo = player.maxAmmo;
            player.isReloading = false;
            const weaponKeys = Object.keys(WEAPONS);
            const currentWeaponKey = weaponKeys.find(key => WEAPONS[key] === player.currentWeapon);
            if (currentWeaponKey && player.weaponStates[currentWeaponKey]) {
                player.weaponStates[currentWeaponKey].ammo = player.currentAmmo;
            }
            return true;
        }

        if (offerId === 'shield') {
            player.shield = Math.min(player.maxShield, (player.shield || 0) + SCRAP_SHOP_SHIELD_AMOUNT);
            return true;
        }

        if (offerId === 'overclock') {
            gameState.rapidFireEndTime = Math.max(
                gameState.rapidFireEndTime,
                now + SCRAP_SHOP_OVERCLOCK_DURATION_MS
            );
            return true;
        }

        return false;
    }

    _getSpawnPosition(player) {
        const isArcade = isSinglePlayerArcadeMode(gameState);
        const angle = Math.random() * Math.PI * 2;
        const distance = isArcade ? 120 + Math.random() * 80 : 80 + Math.random() * 60;

        let x = player.x + Math.cos(angle) * distance;
        let y = player.y + Math.sin(angle) * distance;

        if (!isArcade) {
            const margin = 50;
            x = Math.max(margin, Math.min(canvas.width - margin, x));
            y = Math.max(margin, Math.min(canvas.height - margin, y));
        }

        return { x, y };
    }

    _spawnFeedback(x, y, text, color) {
        if (!gameState.damageNumbers) return;
        gameState.damageNumbers.push(new DamageNumber(x, y, text, false, color));
    }
}

export const scrapShopSystem = new ScrapShopSystem();
