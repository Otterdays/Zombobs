// Badge Definitions
// Simple visual collectibles separate from achievements

export const BADGE_DEFINITIONS = [
    {
        id: "rank_2",
        name: "Rising Star",
        description: "Reach rank 2",
        icon: "⭐",
        requirement: { type: "rank", value: 2 }
    },
    {
        id: "first_kill",
        name: "First Blood",
        description: "Get your first kill",
        icon: "🔴",
        requirement: { type: "totalKills", value: 1 }
    },
    {
        id: "profile_visitor",
        name: "Self Aware",
        description: "Check your profile",
        icon: "👤",
        requirement: { type: "profileVisits", value: 1 }
    },
    {
        id: "first_game",
        name: "Initiated",
        description: "Play your first game",
        icon: "🎮",
        requirement: { type: "gamesPlayed", value: 1 }
    },
    {
        id: "wave_5",
        name: "Survivor",
        description: "Survive wave 5",
        icon: "🛡️",
        requirement: { type: "highestWave", value: 5 }
    },
    {
        id: "kill_10",
        name: "Zombie Hunter",
        description: "Get 10 kills",
        icon: "💀",
        requirement: { type: "totalKills", value: 10 }
    },
    {
        id: "settings_visitor",
        name: "Tinkerer",
        description: "Open the settings menu",
        icon: "⚙️",
        requirement: { type: "settingsVisits", value: 1 }
    },
    {
        id: "achievement_viewer",
        name: "Achiever",
        description: "View the achievements screen",
        icon: "🏆",
        requirement: { type: "achievementVisits", value: 1 }
    },
    {
        id: "badge_collector",
        name: "Collector",
        description: "View the badge screen",
        icon: "🎖️",
        requirement: { type: "badgeVisits", value: 1 }
    },
    {
        id: "gallery_explorer",
        name: "Explorer",
        description: "Visit the gallery",
        icon: "🖼️",
        requirement: { type: "galleryVisits", value: 1 }
    },
    {
        id: "first_restart",
        name: "Second Chance",
        description: "Restart a game",
        icon: "🔄",
        requirement: { type: "gameRestarts", value: 1 }
    },
    {
        id: "first_pause",
        name: "Time Out",
        description: "Pause a game",
        icon: "⏸️",
        requirement: { type: "gamePauses", value: 1 }
    }
];

/**
 * Get badge by ID
 * @param {string} id - Badge ID
 * @returns {Object|null} Badge definition or null
 */
export function getBadgeById(id) {
    return BADGE_DEFINITIONS.find(badge => badge.id === id) || null;
}

/**
 * Get all badge definitions
 * @returns {Array} Array of all badge definitions
 */
export function getAllBadgeDefinitions() {
    return BADGE_DEFINITIONS;
}

