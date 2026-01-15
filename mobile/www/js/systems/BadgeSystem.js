import { BADGE_DEFINITIONS, getBadgeById } from '../core/badgeDefinitions.js';
import { rankSystem } from './RankSystem.js';
import { playerProfileSystem } from './PlayerProfileSystem.js';

/**
 * BadgeSystem - Manages badge tracking and unlocks
 * Badges are simpler visual collectibles separate from achievements
 */
export class BadgeSystem {
    constructor() {
        this.badges = new Map();
        this.initializeBadges();
    }

    /**
     * Initialize badges from definitions
     */
    initializeBadges() {
        BADGE_DEFINITIONS.forEach(def => {
            this.badges.set(def.id, {
                id: def.id,
                name: def.name,
                description: def.description,
                icon: def.icon,
                requirement: def.requirement,
                unlocked: false,
                unlockedDate: null
            });
        });
    }

    /**
     * Load badges from profile data
     * @param {Array} profileBadges - Badge data from profile
     */
    loadBadges(profileBadges) {
        if (!profileBadges || !Array.isArray(profileBadges)) return;

        profileBadges.forEach(badge => {
            const existing = this.badges.get(badge.id);
            if (existing) {
                existing.unlocked = badge.unlocked || false;
                existing.unlockedDate = badge.unlockedDate || null;
            }
        });
    }

    /**
     * Check all badges and unlock any that meet requirements
     * @returns {Array} Array of newly unlocked badges
     */
    checkBadges() {
        const newlyUnlocked = [];
        const profile = playerProfileSystem.getProfile();
        const stats = profile.stats;
        const rankData = rankSystem.getData();

        this.badges.forEach(badge => {
            if (badge.unlocked) return;

            const requirement = badge.requirement;
            let shouldUnlock = false;

            switch (requirement.type) {
                case "rank":
                    shouldUnlock = rankData.rank >= requirement.value;
                    break;

                case "totalKills":
                    shouldUnlock = stats.totalZombiesKilled >= requirement.value;
                    break;

                case "profileVisits":
                    // Profile visits are tracked in profile.stats.profileVisits
                    const visits = stats.profileVisits || 0;
                    shouldUnlock = visits >= requirement.value;
                    break;

                case "gamesPlayed":
                    shouldUnlock = stats.totalGamesPlayed >= requirement.value;
                    break;

                case "highestWave":
                    shouldUnlock = stats.highestWave >= requirement.value;
                    break;

                case "settingsVisits":
                    shouldUnlock = (stats.settingsVisits || 0) >= requirement.value;
                    break;

                case "achievementVisits":
                    shouldUnlock = (stats.achievementVisits || 0) >= requirement.value;
                    break;

                case "badgeVisits":
                    shouldUnlock = (stats.badgeVisits || 0) >= requirement.value;
                    break;

                case "galleryVisits":
                    shouldUnlock = (stats.galleryVisits || 0) >= requirement.value;
                    break;

                case "gameRestarts":
                    shouldUnlock = (stats.gameRestarts || 0) >= requirement.value;
                    break;

                case "gamePauses":
                    shouldUnlock = (stats.gamePauses || 0) >= requirement.value;
                    break;
            }

            if (shouldUnlock && !badge.unlocked) {
                this.unlockBadge(badge);
                newlyUnlocked.push(badge);
            }
        });

        return newlyUnlocked;
    }

    /**
     * Unlock a badge
     * @param {Object} badge - Badge to unlock
     */
    unlockBadge(badge) {
        badge.unlocked = true;
        badge.unlockedDate = new Date().toISOString();
    }

    /**
     * Get badge by ID
     * @param {string} id - Badge ID
     * @returns {Object|null} Badge or null
     */
    getBadge(id) {
        return this.badges.get(id) || null;
    }

    /**
     * Get all badges
     * @returns {Array} Array of all badges
     */
    getAllBadges() {
        return Array.from(this.badges.values());
    }

    /**
     * Get unlocked badges
     * @returns {Array} Array of unlocked badges
     */
    getUnlockedBadges() {
        return Array.from(this.badges.values())
            .filter(badge => badge.unlocked)
            .sort((a, b) => {
                // Sort by unlock date, most recent first
                if (!a.unlockedDate) return 1;
                if (!b.unlockedDate) return -1;
                return new Date(b.unlockedDate) - new Date(a.unlockedDate);
            });
    }

    /**
     * Get badge data for saving
     * @returns {Array} Array of badge data
     */
    getData() {
        return Array.from(this.badges.values()).map(badge => ({
            id: badge.id,
            unlocked: badge.unlocked,
            unlockedDate: badge.unlockedDate
        }));
    }

    /**
     * Get badge statistics
     * @returns {Object} Statistics object
     */
    getStatistics() {
        const all = this.getAllBadges();
        const unlocked = this.getUnlockedBadges();
        return {
            total: all.length,
            unlocked: unlocked.length,
            locked: all.length - unlocked.length,
            completionPercent: (unlocked.length / all.length) * 100
        };
    }
}

export const badgeSystem = new BadgeSystem();

