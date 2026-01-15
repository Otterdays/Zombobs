import { ACHIEVEMENT_DEFINITIONS, getAchievementById } from '../core/achievementDefinitions.js';
import { rankSystem } from './RankSystem.js';
import { playerProfileSystem } from './PlayerProfileSystem.js';

/**
 * AchievementSystem - Manages achievement tracking and unlocks
 */
export class AchievementSystem {
    constructor() {
        this.achievements = new Map();
        this.initializeAchievements();
    }

    /**
     * Initialize achievements from definitions
     */
    initializeAchievements() {
        ACHIEVEMENT_DEFINITIONS.forEach(def => {
            this.achievements.set(def.id, {
                id: def.id,
                name: def.name,
                description: def.description,
                category: def.category,
                icon: def.icon,
                requirement: def.requirement,
                reward: def.reward,
                unlocked: false,
                unlockedDate: null,
                progress: 0
            });
        });
    }

    /**
     * Load achievements from profile data
     * @param {Array} profileAchievements - Achievement data from profile
     */
    loadAchievements(profileAchievements) {
        if (!profileAchievements || !Array.isArray(profileAchievements)) return;

        profileAchievements.forEach(ach => {
            const existing = this.achievements.get(ach.id);
            if (existing) {
                existing.unlocked = ach.unlocked || false;
                existing.unlockedDate = ach.unlockedDate || null;
                existing.progress = ach.progress || 0;
            }
        });
    }

    /**
     * Update achievement progress based on session stats
     * @param {Object} sessionStats - Session statistics
     * @returns {Array} Array of newly unlocked achievements
     */
    updateProgress(sessionStats) {
        const newlyUnlocked = [];

        this.achievements.forEach(achievement => {
            if (achievement.unlocked) return;

            const requirement = achievement.requirement;
            let newProgress = 0;
            let shouldUnlock = false;

            switch (requirement.type) {
                case "totalKills":
                    newProgress = (sessionStats.totalKills || 0) + (sessionStats.sessionKills || 0);
                    shouldUnlock = newProgress >= requirement.value;
                    break;

                case "highestWave":
                    newProgress = Math.max(sessionStats.highestWave || 0, sessionStats.sessionWave || 0);
                    shouldUnlock = newProgress >= requirement.value;
                    break;

                case "timeSurvived":
                    newProgress = Math.max(sessionStats.maxTimeSurvived || 0, sessionStats.sessionTime || 0);
                    shouldUnlock = newProgress >= requirement.value;
                    break;

                case "gamesPlayed":
                    newProgress = (sessionStats.totalGamesPlayed || 0) + 1;
                    shouldUnlock = newProgress >= requirement.value;
                    break;

                case "headshots":
                    newProgress = (sessionStats.totalHeadshots || 0) + (sessionStats.sessionHeadshots || 0);
                    shouldUnlock = newProgress >= requirement.value;
                    break;

                case "maxCombo":
                    newProgress = Math.max(sessionStats.maxCombo || 0, sessionStats.sessionCombo || 0);
                    shouldUnlock = newProgress >= requirement.value;
                    break;

                case "perfectWaves":
                    newProgress = (sessionStats.totalPerfectWaves || 0) + (sessionStats.sessionPerfectWaves || 0);
                    shouldUnlock = newProgress >= requirement.value;
                    break;

                case "weaponsUsed":
                    newProgress = sessionStats.sessionWeaponsUsed || 0;
                    shouldUnlock = newProgress >= requirement.value;
                    break;

                case "skillsUnlocked":
                    newProgress = sessionStats.totalSkillsUnlocked || 0;
                    shouldUnlock = newProgress >= requirement.value;
                    break;

                case "pickupsCollected":
                    newProgress = (sessionStats.totalPickupsCollected || 0) + (sessionStats.sessionPickupsCollected || 0);
                    shouldUnlock = newProgress >= requirement.value;
                    break;

                case "accuracy":
                    newProgress = sessionStats.sessionAccuracy || 0;
                    shouldUnlock = newProgress >= requirement.value;
                    break;

                case "efficiency":
                    // Kills per bullet ratio
                    const kills = sessionStats.sessionKills || 0;
                    const bullets = sessionStats.sessionBulletsFired || 0;
                    newProgress = bullets > 0 ? kills / bullets : 0;
                    shouldUnlock = newProgress >= requirement.value && kills >= 100;
                    break;

                case "coopWins":
                    newProgress = (sessionStats.totalCoopWins || 0) + (sessionStats.sessionCoopWin ? 1 : 0);
                    shouldUnlock = newProgress >= requirement.value;
                    break;
            }

            achievement.progress = Math.max(achievement.progress, newProgress);

            if (shouldUnlock && !achievement.unlocked) {
                this.unlockAchievement(achievement);
                newlyUnlocked.push(achievement);
            }
        });

        return newlyUnlocked;
    }

    /**
     * Unlock an achievement
     * @param {Object} achievement - Achievement to unlock
     */
    unlockAchievement(achievement) {
        achievement.unlocked = true;
        achievement.unlockedDate = new Date().toISOString();

        // Apply reward
        if (achievement.reward) {
            if (achievement.reward.rankXP) {
                rankSystem.addRankXP(achievement.reward.rankXP);
            }
            if (achievement.reward.title) {
                playerProfileSystem.setTitle(achievement.reward.title);
            }
        }
    }

    /**
     * Get achievement by ID
     * @param {string} id - Achievement ID
     * @returns {Object|null} Achievement or null
     */
    getAchievement(id) {
        return this.achievements.get(id) || null;
    }

    /**
     * Get all achievements
     * @returns {Array} Array of all achievements
     */
    getAllAchievements() {
        return Array.from(this.achievements.values());
    }

    /**
     * Get achievements by category
     * @param {string} category - Category name
     * @returns {Array} Array of achievements
     */
    getAchievementsByCategory(category) {
        return Array.from(this.achievements.values()).filter(ach => ach.category === category);
    }

    /**
     * Get unlocked achievements
     * @returns {Array} Array of unlocked achievements
     */
    getUnlockedAchievements() {
        return Array.from(this.achievements.values()).filter(ach => ach.unlocked);
    }

    /**
     * Get achievement data for saving
     * @returns {Array} Array of achievement data
     */
    getData() {
        return Array.from(this.achievements.values()).map(ach => ({
            id: ach.id,
            unlocked: ach.unlocked,
            unlockedDate: ach.unlockedDate,
            progress: ach.progress
        }));
    }

    /**
     * Get achievement statistics
     * @returns {Object} Statistics object
     */
    getStatistics() {
        const all = this.getAllAchievements();
        const unlocked = this.getUnlockedAchievements();
        return {
            total: all.length,
            unlocked: unlocked.length,
            locked: all.length - unlocked.length,
            completionPercent: (unlocked.length / all.length) * 100
        };
    }
}

export const achievementSystem = new AchievementSystem();

