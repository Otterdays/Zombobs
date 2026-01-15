// Achievement Definitions
// All achievements available in the game

export const ACHIEVEMENT_DEFINITIONS = [
    // Combat Achievements
    {
        id: "zombie_slayer_100",
        name: "Zombie Slayer",
        description: "Kill 100 zombies",
        category: "combat",
        icon: "💀",
        requirement: { type: "totalKills", value: 100 },
        reward: { rankXP: 500, title: "Slayer" }
    },
    {
        id: "zombie_slayer_500",
        name: "Zombie Hunter",
        description: "Kill 500 zombies",
        category: "combat",
        icon: "🔫",
        requirement: { type: "totalKills", value: 500 },
        reward: { rankXP: 1000, title: "Hunter" }
    },
    {
        id: "zombie_slayer_1000",
        name: "Zombie Exterminator",
        description: "Kill 1,000 zombies",
        category: "combat",
        icon: "⚔️",
        requirement: { type: "totalKills", value: 1000 },
        reward: { rankXP: 2500, title: "Exterminator" }
    },
    {
        id: "zombie_slayer_5000",
        name: "Zombie Annihilator",
        description: "Kill 5,000 zombies",
        category: "combat",
        icon: "💥",
        requirement: { type: "totalKills", value: 5000 },
        reward: { rankXP: 5000, title: "Annihilator" }
    },
    {
        id: "zombie_slayer_10000",
        name: "Zombie Legend",
        description: "Kill 10,000 zombies",
        category: "combat",
        icon: "👑",
        requirement: { type: "totalKills", value: 10000 },
        reward: { rankXP: 10000, title: "Legend" }
    },
    {
        id: "headshot_master",
        name: "Headshot Master",
        description: "Get 50 headshots",
        category: "combat",
        icon: "🎯",
        requirement: { type: "headshots", value: 50 },
        reward: { rankXP: 750, title: "Sniper" }
    },
    {
        id: "combo_king",
        name: "Combo King",
        description: "Achieve a 20-kill combo",
        category: "combat",
        icon: "🔥",
        requirement: { type: "maxCombo", value: 20 },
        reward: { rankXP: 1000, title: "Combo King" }
    },

    // Survival Achievements
    {
        id: "survivor_wave_5",
        name: "Survivor",
        description: "Survive 5 waves",
        category: "survival",
        icon: "🛡️",
        requirement: { type: "highestWave", value: 5 },
        reward: { rankXP: 300, title: "Survivor" }
    },
    {
        id: "survivor_wave_10",
        name: "Veteran",
        description: "Survive 10 waves",
        category: "survival",
        icon: "⭐",
        requirement: { type: "highestWave", value: 10 },
        reward: { rankXP: 750, title: "Veteran" }
    },
    {
        id: "survivor_wave_20",
        name: "Elite",
        description: "Survive 20 waves",
        category: "survival",
        icon: "🌟",
        requirement: { type: "highestWave", value: 20 },
        reward: { rankXP: 2000, title: "Elite" }
    },
    {
        id: "survivor_wave_30",
        name: "Master",
        description: "Survive 30 waves",
        category: "survival",
        icon: "💎",
        requirement: { type: "highestWave", value: 30 },
        reward: { rankXP: 5000, title: "Master" }
    },
    {
        id: "survivor_wave_50",
        name: "Immortal",
        description: "Survive 50 waves",
        category: "survival",
        icon: "⚡",
        requirement: { type: "highestWave", value: 50 },
        reward: { rankXP: 10000, title: "Immortal" }
    },
    {
        id: "time_survivor_5min",
        name: "Endurance",
        description: "Survive 5 minutes in a single game",
        category: "survival",
        icon: "⏱️",
        requirement: { type: "timeSurvived", value: 300 },
        reward: { rankXP: 500, title: "Endurance" }
    },
    {
        id: "time_survivor_10min",
        name: "Marathon",
        description: "Survive 10 minutes in a single game",
        category: "survival",
        icon: "🏃",
        requirement: { type: "timeSurvived", value: 600 },
        reward: { rankXP: 1500, title: "Marathon Runner" }
    },
    {
        id: "perfect_wave",
        name: "Perfect Wave",
        description: "Complete a wave without taking damage",
        category: "survival",
        icon: "✨",
        requirement: { type: "perfectWaves", value: 1 },
        reward: { rankXP: 250, title: "Untouchable" }
    },

    // Collection Achievements
    {
        id: "weapon_master",
        name: "Weapon Master",
        description: "Use all weapons in a single game",
        category: "collection",
        icon: "🔫",
        requirement: { type: "weaponsUsed", value: 7 },
        reward: { rankXP: 1000, title: "Arsenal" }
    },
    {
        id: "skill_collector",
        name: "Skill Collector",
        description: "Unlock all 16 skills across all games",
        category: "collection",
        icon: "📚",
        requirement: { type: "skillsUnlocked", value: 16 },
        reward: { rankXP: 2000, title: "Scholar" }
    },
    {
        id: "pickup_hoarder",
        name: "Pickup Hoarder",
        description: "Collect 100 pickups",
        category: "collection",
        icon: "📦",
        requirement: { type: "pickupsCollected", value: 100 },
        reward: { rankXP: 750, title: "Collector" }
    },

    // Skill Achievements
    {
        id: "accuracy_master",
        name: "Accuracy Master",
        description: "Achieve 80% accuracy in a game",
        category: "skill",
        icon: "🎯",
        requirement: { type: "accuracy", value: 0.8 },
        reward: { rankXP: 1000, title: "Sharpshooter" }
    },
    {
        id: "efficiency_expert",
        name: "Efficiency Expert",
        description: "Kill 100 zombies with less than 200 bullets",
        category: "skill",
        icon: "💡",
        requirement: { type: "efficiency", value: 0.5 },
        reward: { rankXP: 1500, title: "Efficient" }
    },

    // Social/Multiplayer Achievements
    {
        id: "coop_warrior",
        name: "Co-op Warrior",
        description: "Win 10 co-op games",
        category: "social",
        icon: "🤝",
        requirement: { type: "coopWins", value: 10 },
        reward: { rankXP: 2000, title: "Team Player" }
    },
    {
        id: "first_blood",
        name: "First Blood",
        description: "Play your first game",
        category: "social",
        icon: "🎮",
        requirement: { type: "gamesPlayed", value: 1 },
        reward: { rankXP: 100, title: "Rookie" }
    },
    {
        id: "dedicated_player",
        name: "Dedicated Player",
        description: "Play 50 games",
        category: "social",
        icon: "🏆",
        requirement: { type: "gamesPlayed", value: 50 },
        reward: { rankXP: 1500, title: "Dedicated" }
    },
    {
        id: "veteran_player",
        name: "Veteran Player",
        description: "Play 100 games",
        category: "social",
        icon: "🎖️",
        requirement: { type: "gamesPlayed", value: 100 },
        reward: { rankXP: 3000, title: "Veteran" }
    }
];

/**
 * Get achievement by ID
 * @param {string} id - Achievement ID
 * @returns {Object|null} Achievement definition or null
 */
export function getAchievementById(id) {
    return ACHIEVEMENT_DEFINITIONS.find(ach => ach.id === id) || null;
}

/**
 * Get achievements by category
 * @param {string} category - Category name
 * @returns {Array} Array of achievement definitions
 */
export function getAchievementsByCategory(category) {
    return ACHIEVEMENT_DEFINITIONS.filter(ach => ach.category === category);
}

/**
 * Get all achievement categories
 * @returns {Array} Array of unique category names
 */
export function getAchievementCategories() {
    return [...new Set(ACHIEVEMENT_DEFINITIONS.map(ach => ach.category))];
}

