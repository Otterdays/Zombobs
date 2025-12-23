import { getCurrentSeason, getBattlepassXPRequirement, isSeasonActive, getDaysRemaining } from '../core/battlepassDefinitions.js';

const CHALLENGE_POOL = [
    { id: 'kill_50_zombies', description: 'Kill 50 Zombies', target: 50, type: 'kills', reward: 100 },
    { id: 'kill_100_zombies', description: 'Kill 100 Zombies', target: 100, type: 'kills', reward: 200 },
    { id: 'survive_wave_10', description: 'Survive Wave 10', target: 10, type: 'wave', reward: 150 },
    { id: 'survive_wave_20', description: 'Survive Wave 20', target: 20, type: 'wave', reward: 300 },
    { id: 'score_5000', description: 'Score 5,000 Points', target: 5000, type: 'score', reward: 100 },
    { id: 'score_10000', description: 'Score 10,000 Points', target: 10000, type: 'score', reward: 250 },
    { id: 'collect_10_pickups', description: 'Collect 10 Pickups', target: 10, type: 'pickups', reward: 75 },
    { id: 'get_20_headshots', description: 'Get 20 Headshots', target: 20, type: 'headshots', reward: 125 }
];

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
        
        // Initialize challenges if needed
        this.refreshDailyChallenges();
        this.refreshWeeklyChallenges();
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
     * Refresh daily challenges if needed
     */
    refreshDailyChallenges() {
        const now = new Date();
        const lastReset = this.lastDailyReset ? new Date(this.lastDailyReset) : null;
        
        // Reset if no last reset or if it's a new day
        const shouldReset = !lastReset || now.getDate() !== lastReset.getDate() || now.getMonth() !== lastReset.getMonth();

        if (shouldReset) {
            this.dailyChallenges = this.getRandomChallenges(3);
            this.lastDailyReset = now.toISOString();
            // Remove completed daily challenges from the completed list to allow re-completion? 
            // For now, simpler to just treat IDs as unique instance IDs or just filter.
            // A better way is to attach progress to the challenge object itself in the active list.
        }
    }

    /**
     * Refresh weekly challenges if needed
     */
    refreshWeeklyChallenges() {
        const now = new Date();
        const lastReset = this.lastWeeklyReset ? new Date(this.lastWeeklyReset) : null;
        
        // Reset if 7 days have passed
        const oneWeek = 7 * 24 * 60 * 60 * 1000;
        const shouldReset = !lastReset || (now - lastReset) > oneWeek;

        if (shouldReset) {
            this.weeklyChallenges = this.getRandomChallenges(3); // Could be distinct weekly pool
            this.lastWeeklyReset = now.toISOString();
        }
    }

    /**
     * Get random challenges from pool
     * @param {number} count 
     */
    getRandomChallenges(count) {
        const shuffled = [...CHALLENGE_POOL].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count).map(c => ({
            ...c,
            progress: 0,
            completed: false,
            instanceId: Date.now() + '_' + Math.random().toString(36).substr(2, 5) 
        }));
    }

    /**
     * Check active challenges against session stats
     * @param {Object} sessionStats 
     */
    checkChallenges(sessionStats) {
        const allChallenges = [...this.dailyChallenges, ...this.weeklyChallenges];
        
        allChallenges.forEach(challenge => {
            if (challenge.completed) return;

            let increment = 0;
            switch (challenge.type) {
                case 'kills':
                    increment = sessionStats.kills || 0;
                    break;
                case 'wave':
                    // For wave, we usually just want to check if they reached it
                    if ((sessionStats.wave || 0) >= challenge.target) {
                        challenge.progress = challenge.target;
                    }
                    break;
                case 'score':
                    // For score, usually check if they reached it in one game
                     if ((sessionStats.score || 0) >= challenge.target) {
                        challenge.progress = challenge.target;
                    }
                    break;
                case 'pickups':
                     increment = sessionStats.pickupsCollected || 0;
                     break;
                case 'headshots':
                     increment = sessionStats.headshots || 0;
                     break;
            }

            if (increment > 0) {
                challenge.progress += increment;
            }

            if (challenge.progress >= challenge.target) {
                challenge.progress = challenge.target;
                challenge.completed = true;
                this.addXP(challenge.reward);
                this.completedChallenges.push(challenge.instanceId);
            }
        });
    }

    /**
     * Get all unlocked cosmetic skins
     * @returns {Array<string>} List of unlocked skin IDs
     */
    getUnlockedSkins() {
        const season = getCurrentSeason();
        const unlockedSkins = [];
        
        // Add default skin (always unlocked)
        unlockedSkins.push('default');

        this.unlockedTiers.forEach(tierNum => {
            const tierData = season.tiers.find(t => t.tier === tierNum);
            if (tierData) {
                // Check free rewards
                if (tierData.freeReward && tierData.freeReward.type === 'cosmetic') {
                    unlockedSkins.push(tierData.freeReward.value);
                }
                // Check premium rewards
                if (tierData.premiumReward && tierData.premiumReward.type === 'cosmetic') {
                    unlockedSkins.push(tierData.premiumReward.value);
                }
            }
        });

        return [...new Set(unlockedSkins)]; // Return unique values
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
            totalTiers: season.tiers.length,
            dailyChallenges: this.dailyChallenges,
            weeklyChallenges: this.weeklyChallenges
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