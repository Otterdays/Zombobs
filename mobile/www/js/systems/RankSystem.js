import { getRankFromXP, getRankName, getRankXPRequirement, SCORE_TO_RANK_XP_RATE, WAVE_COMPLETION_BONUS } from '../core/rankConstants.js';

/**
 * RankSystem - Manages permanent rank progression
 */
export class RankSystem {
    constructor() {
        this.rankXP = 0;
        this.rank = 1;
        this.rankTier = 1;
        this.rankName = "Private";
    }

    /**
     * Initialize rank system from profile data
     * @param {Object} profileData - Profile data containing rank info
     */
    initialize(profileData) {
        if (profileData && profileData.rank) {
            this.rankXP = profileData.rank.rankXP || 0;
            this.rank = profileData.rank.rank || 1;
            this.rankTier = profileData.rank.rankTier || 1;
            this.rankName = profileData.rank.rankName || getRankName(1);
        } else {
            this.reset();
        }
        this.updateRankFromXP();
    }

    /**
     * Reset rank to default
     */
    reset() {
        this.rankXP = 0;
        this.rank = 1;
        this.rankTier = 1;
        this.rankName = getRankName(1);
    }

    /**
     * Add rank XP from session
     * @param {number} score - Session score
     * @param {number} wavesCompleted - Waves completed
     * @returns {Object} Rank progression info
     */
    addSessionXP(score, wavesCompleted) {
        const scoreXP = Math.floor(score * SCORE_TO_RANK_XP_RATE);
        const waveBonus = wavesCompleted * WAVE_COMPLETION_BONUS;
        const totalXP = scoreXP + waveBonus;

        const oldRank = this.rank;
        const oldTier = this.rankTier;

        this.rankXP += totalXP;
        this.updateRankFromXP();

        const rankUp = this.rank > oldRank || (this.rank === oldRank && this.rankTier > oldTier);

        return {
            xpGained: totalXP,
            scoreXP,
            waveBonus,
            rankUp,
            oldRank,
            oldTier,
            newRank: this.rank,
            newTier: this.rankTier,
            rankName: this.rankName
        };
    }

    /**
     * Add rank XP directly (from achievements, etc.)
     * @param {number} amount - Amount of rank XP to add
     * @returns {boolean} True if rank increased
     */
    addRankXP(amount) {
        const oldRank = this.rank;
        const oldTier = this.rankTier;

        this.rankXP += amount;
        this.updateRankFromXP();

        return this.rank > oldRank || (this.rank === oldRank && this.rankTier > oldTier);
    }

    /**
     * Update rank and tier based on current rank XP
     */
    updateRankFromXP() {
        const rankInfo = getRankFromXP(this.rankXP);
        this.rank = rankInfo.rank;
        this.rankTier = rankInfo.tier;
        this.rankName = rankInfo.rankName;
    }

    /**
     * Get current rank progress info
     * @returns {Object} Rank progress information
     */
    getProgress() {
        const rankInfo = getRankFromXP(this.rankXP);
        return {
            rankXP: this.rankXP,
            rank: this.rank,
            rankTier: this.rankTier,
            rankName: this.rankName,
            currentTierXP: rankInfo.currentTierXP,
            nextTierXP: rankInfo.nextTierXP,
            progressPercent: (rankInfo.currentTierXP / rankInfo.nextTierXP) * 100
        };
    }

    /**
     * Get rank data for saving
     * @returns {Object} Rank data object
     */
    getData() {
        return {
            rankXP: this.rankXP,
            rank: this.rank,
            rankTier: this.rankTier,
            rankName: this.rankName
        };
    }
}

export const rankSystem = new RankSystem();

