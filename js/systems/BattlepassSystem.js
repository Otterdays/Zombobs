import { getCurrentSeason, getBattlepassXPRequirement, isSeasonActive, getDaysRemaining } from '../core/battlepassDefinitions.js';
import { rankSystem } from './RankSystem.js';

// Expanded daily challenge pool with more variety
const DAILY_CHALLENGE_POOL = [
    { id: 'kill_50_zombies', description: 'Kill 50 Zombies', target: 50, type: 'kills', reward: 100 },
    { id: 'kill_100_zombies', description: 'Kill 100 Zombies', target: 100, type: 'kills', reward: 200 },
    { id: 'kill_200_zombies', description: 'Kill 200 Zombies', target: 200, type: 'kills', reward: 350 },
    { id: 'score_5000', description: 'Score 5,000 Points', target: 5000, type: 'score', reward: 100 },
    { id: 'score_10000', description: 'Score 10,000 Points', target: 10000, type: 'score', reward: 250 },
    { id: 'score_25000', description: 'Score 25,000 Points', target: 25000, type: 'score', reward: 500 },
    { id: 'collect_10_pickups', description: 'Collect 10 Pickups', target: 10, type: 'pickups', reward: 75 },
    { id: 'collect_25_pickups', description: 'Collect 25 Pickups', target: 25, type: 'pickups', reward: 150 },
    { id: 'get_20_headshots', description: 'Get 20 Headshots', target: 20, type: 'headshots', reward: 125 },
    { id: 'get_50_headshots', description: 'Get 50 Headshots', target: 50, type: 'headshots', reward: 275 },
    { id: 'streak_10', description: 'Get a 10 Kill Streak', target: 10, type: 'killstreak', reward: 150 },
    { id: 'streak_25', description: 'Get a 25 Kill Streak', target: 25, type: 'killstreak', reward: 300 },
    { id: 'survive_wave_10', description: 'Survive Wave 10', target: 10, type: 'wave', reward: 150 },
    { id: 'survive_wave_20', description: 'Survive Wave 20', target: 20, type: 'wave', reward: 300 },
    { id: 'survive_wave_30', description: 'Survive Wave 30', target: 30, type: 'wave', reward: 500 }
];

// Expanded weekly challenge pool
const WEEKLY_CHALLENGE_POOL = [
    { id: 'weekly_kill_500', description: 'Kill 500 Zombies (Weekly)', target: 500, type: 'kills', reward: 500 },
    { id: 'weekly_kill_1000', description: 'Kill 1,000 Zombies (Weekly)', target: 1000, type: 'kills', reward: 1000 },
    { id: 'weekly_score_50000', description: 'Score 50,000 Points (Weekly)', target: 50000, type: 'score', reward: 600 },
    { id: 'weekly_headshots_100', description: 'Get 100 Headshots (Weekly)', target: 100, type: 'headshots', reward: 500 },
    { id: 'weekly_survive_30', description: 'Survive Wave 30 (Weekly)', target: 30, type: 'wave', reward: 600 },
    { id: 'weekly_pickups_50', description: 'Collect 50 Pickups (Weekly)', target: 50, type: 'pickups', reward: 400 },
    { id: 'weekly_streak_25', description: 'Get a 25 Kill Streak (Weekly)', target: 25, type: 'killstreak', reward: 500 },
    { id: 'weekly_play_5', description: 'Play 5 Games (Weekly)', target: 5, type: 'games', reward: 300 },
    { id: 'weekly_play_10', description: 'Play 10 Games (Weekly)', target: 10, type: 'games', reward: 600 }
];

/**
 * Fisher-Yates shuffle algorithm — unbiased randomization
 */
function fisherYatesShuffle(arr) {
    const shuffled = [...arr];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

export class BattlepassSystem {
    constructor() {
        this.currentSeason = 1;
        this.battlepassXP = 0;
        this.currentTier = 1;
        this.unlockedTiers = [];
        this.claimedTiers = [];
        this.hasPremium = false;
        this.dailyChallenges = [];
        this.weeklyChallenges = [];
        this.lastDailyReset = null;
        this.lastWeeklyReset = null;
        this.gamesPlayedThisWeek = 0;
        this.lastSessionXP = 0;
        this.lastTierUp = false;
        this.lastNewlyUnlocked = [];
    }

    initialize(profileData) {
        if (profileData && profileData.battlepass) {
            const bp = profileData.battlepass;
            this.currentSeason = bp.currentSeason || 1;
            this.battlepassXP = bp.battlepassXP || 0;
            this.currentTier = bp.currentTier || 1;
            this.unlockedTiers = bp.unlockedTiers || [];
            this.claimedTiers = bp.claimedTiers || [];
            this.hasPremium = bp.hasPremium || false;
            this.dailyChallenges = bp.dailyChallenges || [];
            this.weeklyChallenges = bp.weeklyChallenges || [];
            this.lastDailyReset = bp.lastDailyReset || null;
            this.lastWeeklyReset = bp.lastWeeklyReset || null;
            this.gamesPlayedThisWeek = bp.gamesPlayedThisWeek || 0;
        } else {
            this.reset();
        }

        this.checkSeasonValidity();
        this.updateTierFromXP();
        this.refreshDailyChallenges();
        this.refreshWeeklyChallenges();
    }

    reset() {
        const season = getCurrentSeason();
        this.currentSeason = season.season;
        this.battlepassXP = 0;
        this.currentTier = 1;
        this.unlockedTiers = [];
        this.claimedTiers = [];
        this.dailyChallenges = [];
        this.weeklyChallenges = [];
        this.lastDailyReset = null;
        this.lastWeeklyReset = null;
        this.gamesPlayedThisWeek = 0;
    }

    checkSeasonValidity() {
        const season = getCurrentSeason();
        if (season.season !== this.currentSeason) {
            this.reset();
        }
    }

    addXP(amount) {
        const oldTier = this.currentTier;
        this.battlepassXP += amount;
        this.updateTierFromXP();

        const tierUp = this.currentTier > oldTier;
        const newlyUnlocked = [];

        if (tierUp) {
            for (let tier = oldTier + 1; tier <= this.currentTier; tier++) {
                if (!this.unlockedTiers.includes(tier)) {
                    this.unlockedTiers.push(tier);
                    newlyUnlocked.push(tier);
                }
            }
        }

        this.lastSessionXP = amount;
        this.lastTierUp = tierUp;
        this.lastNewlyUnlocked = newlyUnlocked;

        return {
            xpGained: amount,
            tierUp,
            oldTier,
            newTier: this.currentTier,
            newlyUnlocked
        };
    }

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
     * Claim a tier reward and apply it to the rank system
     */
    claimTierReward(tier) {
        if (this.claimedTiers.includes(tier)) {
            return null;
        }

        if (!this.unlockedTiers.includes(tier)) {
            return null;
        }

        const season = getCurrentSeason();
        const tierData = season.tiers.find(t => t.tier === tier);
        if (!tierData) return null;

        this.claimedTiers.push(tier);

        const claimed = [];

        if (tierData.freeReward) {
            if (tierData.freeReward.type === 'rankXP') {
                rankSystem.addRankXP(tierData.freeReward.amount);
                claimed.push({ type: 'rankXP', amount: tierData.freeReward.amount });
            } else if (tierData.freeReward.type === 'title') {
                claimed.push({ type: 'title', value: tierData.freeReward.value });
            } else if (tierData.freeReward.type === 'emblem') {
                claimed.push({ type: 'emblem', value: tierData.freeReward.value });
            }
        }

        if (tierData.premiumReward && this.hasPremium) {
            claimed.push({ type: 'premium', value: tierData.premiumReward.value });
        }

        return claimed;
    }

    refreshDailyChallenges() {
        const now = new Date();
        const lastReset = this.lastDailyReset ? new Date(this.lastDailyReset) : null;
        const shouldReset = !lastReset || now.getDate() !== lastReset.getDate() || now.getMonth() !== lastReset.getMonth();

        if (shouldReset) {
            this.dailyChallenges = this.getRandomChallenges(DAILY_CHALLENGE_POOL, 3);
            this.lastDailyReset = now.toISOString();
        }
    }

    refreshWeeklyChallenges() {
        const now = new Date();
        const lastReset = this.lastWeeklyReset ? new Date(this.lastWeeklyReset) : null;
        const oneWeek = 7 * 24 * 60 * 60 * 1000;
        const shouldReset = !lastReset || (now - lastReset) > oneWeek;

        if (shouldReset) {
            this.weeklyChallenges = this.getRandomChallenges(WEEKLY_CHALLENGE_POOL, 3);
            this.lastWeeklyReset = now.toISOString();
            this.gamesPlayedThisWeek = 0;
        }
    }

    getRandomChallenges(pool, count) {
        const shuffled = fisherYatesShuffle(pool);
        return shuffled.slice(0, count).map(c => ({
            ...c,
            progress: 0,
            completed: false,
            instanceId: Date.now() + '_' + Math.random().toString(36).substr(2, 5)
        }));
    }

    checkChallenges(sessionStats) {
        this.gamesPlayedThisWeek++;

        const allChallenges = [...this.dailyChallenges, ...this.weeklyChallenges];

        allChallenges.forEach(challenge => {
            if (challenge.completed) return;

            let increment = 0;
            switch (challenge.type) {
                case 'kills':
                    increment = sessionStats.kills || 0;
                    break;
                case 'wave':
                    if ((sessionStats.wave || 0) >= challenge.target) {
                        challenge.progress = challenge.target;
                    }
                    break;
                case 'score':
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
                case 'killstreak':
                    if ((sessionStats.maxKillStreak || 0) >= challenge.target) {
                        challenge.progress = challenge.target;
                    }
                    break;
                case 'games':
                    increment = 1;
                    break;
            }

            if (increment > 0) {
                challenge.progress += increment;
            }

            if (challenge.progress >= challenge.target) {
                challenge.progress = challenge.target;
                challenge.completed = true;
                this.addXP(challenge.reward);
            }
        });
    }

    getUnlockedSkins() {
        const season = getCurrentSeason();
        const unlockedSkins = [];
        unlockedSkins.push('default');

        this.unlockedTiers.forEach(tierNum => {
            const tierData = season.tiers.find(t => t.tier === tierNum);
            if (tierData) {
                if (tierData.freeReward && tierData.freeReward.type === 'cosmetic') {
                    unlockedSkins.push(tierData.freeReward.value);
                }
                if (this.hasPremium && tierData.premiumReward && tierData.premiumReward.type === 'cosmetic') {
                    unlockedSkins.push(tierData.premiumReward.value);
                }
            }
        });

        return [...new Set(unlockedSkins)];
    }

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

    getTierReward(tier) {
        const season = getCurrentSeason();
        const tierData = season.tiers.find(t => t.tier === tier);
        return tierData || null;
    }

    isTierUnlocked(tier) {
        return this.unlockedTiers.includes(tier);
    }

    isTierClaimed(tier) {
        return this.claimedTiers.includes(tier);
    }

    getProgress() {
        const season = getCurrentSeason();
        const currentTierXP = getBattlepassXPRequirement(this.currentTier);
        const nextTierXP = getBattlepassXPRequirement(this.currentTier + 1);

        let currentTierProgress = this.battlepassXP - currentTierXP;
        let currentTierRequired = nextTierXP - currentTierXP;

        if (this.currentTier >= season.tiers.length) {
            currentTierProgress = 0;
            currentTierRequired = 1;
        }

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
            weeklyChallenges: this.weeklyChallenges,
            lastSessionXP: this.lastSessionXP,
            lastTierUp: this.lastTierUp,
            lastNewlyUnlocked: this.lastNewlyUnlocked
        };
    }

    getData() {
        return {
            currentSeason: this.currentSeason,
            battlepassXP: this.battlepassXP,
            currentTier: this.currentTier,
            unlockedTiers: this.unlockedTiers,
            claimedTiers: this.claimedTiers,
            hasPremium: this.hasPremium,
            dailyChallenges: this.dailyChallenges,
            weeklyChallenges: this.weeklyChallenges,
            lastDailyReset: this.lastDailyReset,
            lastWeeklyReset: this.lastWeeklyReset,
            gamesPlayedThisWeek: this.gamesPlayedThisWeek
        };
    }
}

export const battlepassSystem = new BattlepassSystem();
