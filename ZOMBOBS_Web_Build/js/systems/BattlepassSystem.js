import { getCurrentSeason, getBattlepassXPRequirement, isSeasonActive, getDaysRemaining } from '../core/battlepassDefinitions.js';

/**
 * BattlepassSystem - Manages battlepass progression and rewards
 */
export class BattlepassSystem {
    constructor() {
        this.currentSeason = 1;
        this.battlepassXP = 0;
        this.currentTier = 1;
        this.unlockedTiers = [];
        this.completedChallenges = [];
        this.dailyChallenges = [];
        this.weeklyChallenges = [];
        this.lastDailyReset = null;
        this.lastWeeklyReset = null;
    }

    /**
     * Initialize battlepass from profile data
     * @param {Object} profileData - Profile data containing battlepass info
     */
    initialize(profileData) {
        if (profileData && profileData.battlepass) {
            const bp = profileData.battlepass;
            this.currentSeason = bp.currentSeason || 1;
            this.battlepassXP = bp.battlepassXP || 0;
            this.currentTier = bp.currentTier || 1;
            this.unlockedTiers = bp.unlockedTiers || [];
            this.completedChallenges = bp.completedChallenges || [];
            this.dailyChallenges = bp.dailyChallenges || [];
            this.weeklyChallenges = bp.weeklyChallenges || [];
            this.lastDailyReset = bp.lastDailyReset || null;
            this.lastWeeklyReset = bp.lastWeeklyReset || null;
        } else {
            this.reset();
        }

        // Check if season expired and reset if needed
        this.checkSeasonValidity();
        this.updateTierFromXP();
    }

    /**
     * Reset battlepass to default
     */
    reset() {
        const season = getCurrentSeason();
        this.currentSeason = season.season;
        this.battlepassXP = 0;
        this.currentTier = 1;
        this.unlockedTiers = [];
        this.completedChallenges = [];
        this.dailyChallenges = [];
        this.weeklyChallenges = [];
        this.lastDailyReset = null;
        this.lastWeeklyReset = null;
    }

    /**
     * Check if current season is still valid, reset if expired
     */
    checkSeasonValidity() {
        const season = getCurrentSeason();
        if (season.season !== this.currentSeason || !isSeasonActive(season)) {
            // Season expired or changed, reset
            this.reset();
        }
    }

    /**
     * Add battlepass XP
     * @param {number} amount - Amount of XP to add
     * @returns {Object} Progression info
     */
    addXP(amount) {
        const oldTier = this.currentTier;
        this.battlepassXP += amount;
        this.updateTierFromXP();

        const tierUp = this.currentTier > oldTier;
        const newlyUnlocked = [];

        if (tierUp) {
            // Unlock new tiers
            for (let tier = oldTier + 1; tier <= this.currentTier; tier++) {
                if (!this.unlockedTiers.includes(tier)) {
                    this.unlockedTiers.push(tier);
                    newlyUnlocked.push(tier);
                }
            }
        }

        return {
            xpGained: amount,
            tierUp,
            oldTier,
            newTier: this.currentTier,
            newlyUnlocked
        };
    }

    /**
     * Update current tier based on battlepass XP
     */
    updateTierFromXP() {
        const season = getCurrentSeason();
        const maxTier = season.tiers.length;

        for (let tier = 1; tier <= maxTier; tier++) {
            const requiredXP = getBattlepassXPRequirement(tier);
            if (this.battlepassXP >= requiredXP) {
                this.currentTier = tier;
            } else {
                break;
            }
        }
    }

    /**
     * Complete a challenge
     * @param {string} challengeId - Challenge ID
     * @param {number} xpReward - XP reward for challenge
     */
    completeChallenge(challengeId, xpReward) {
        if (this.completedChallenges.includes(challengeId)) {
            return; // Already completed
        }

        this.completedChallenges.push(challengeId);
        if (xpReward > 0) {
            this.addXP(xpReward);
        }
    }

    /**
     * Get current season info
     * @returns {Object} Season information
     */
    getSeasonInfo() {
        const season = getCurrentSeason();
        return {
            season: season.season,
            name: season.name,
            startDate: season.startDate,
            endDate: season.endDate,
            daysRemaining: getDaysRemaining(season),
            isActive: isSeasonActive(season)
        };
    }

    /**
     * Get tier reward info
     * @param {number} tier - Tier number
     * @returns {Object|null} Tier reward info or null
     */
    getTierReward(tier) {
        const season = getCurrentSeason();
        const tierData = season.tiers.find(t => t.tier === tier);
        return tierData || null;
    }

    /**
     * Check if tier is unlocked
     * @param {number} tier - Tier number
     * @returns {boolean} True if unlocked
     */
    isTierUnlocked(tier) {
        return this.unlockedTiers.includes(tier);
    }

    /**
     * Get battlepass progress info
     * @returns {Object} Progress information
     */
    getProgress() {
        const season = getCurrentSeason();
        const currentTierXP = getBattlepassXPRequirement(this.currentTier);
        const nextTierXP = getBattlepassXPRequirement(this.currentTier + 1);
        const currentTierProgress = this.battlepassXP - currentTierXP;
        const currentTierRequired = nextTierXP - currentTierXP;

        return {
            battlepassXP: this.battlepassXP,
            currentTier: this.currentTier,
            maxTier: season.tiers.length,
            currentTierProgress,
            currentTierRequired,
            progressPercent: (currentTierProgress / currentTierRequired) * 100,
            unlockedTiers: this.unlockedTiers.length,
            totalTiers: season.tiers.length
        };
    }

    /**
     * Get battlepass data for saving
     * @returns {Object} Battlepass data object
     */
    getData() {
        return {
            currentSeason: this.currentSeason,
            battlepassXP: this.battlepassXP,
            currentTier: this.currentTier,
            unlockedTiers: this.unlockedTiers,
            completedChallenges: this.completedChallenges,
            dailyChallenges: this.dailyChallenges,
            weeklyChallenges: this.weeklyChallenges,
            lastDailyReset: this.lastDailyReset,
            lastWeeklyReset: this.lastWeeklyReset
        };
    }
}

export const battlepassSystem = new BattlepassSystem();

