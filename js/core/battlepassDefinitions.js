// Battlepass/Expansion System Definitions

// Season 1 Battlepass Tiers (50 tiers) — LEGACY
export const BATTLEPASS_SEASON_1 = {
    season: 1,
    name: "Season 1: Outbreak",
    startDate: "2025-01-01",
    endDate: "2025-03-01",
    tiers: [
        // Tier 1-10
        { tier: 1, freeReward: { type: "rankXP", amount: 100 }, premiumReward: null },
        { tier: 2, freeReward: { type: "title", value: "Recruit" }, premiumReward: { type: "cosmetic", value: "skin_red" } },
        { tier: 3, freeReward: { type: "rankXP", amount: 150 }, premiumReward: null },
        { tier: 4, freeReward: { type: "emblem", value: "zombie_skull" }, premiumReward: { type: "cosmetic", value: "weapon_skin_red" } },
        { tier: 5, freeReward: { type: "rankXP", amount: 200 }, premiumReward: null },
        { tier: 6, freeReward: { type: "title", value: "Scavenger" }, premiumReward: { type: "cosmetic", value: "skin_blue" } },
        { tier: 7, freeReward: { type: "rankXP", amount: 250 }, premiumReward: null },
        { tier: 8, freeReward: { type: "emblem", value: "bullet" }, premiumReward: { type: "cosmetic", value: "weapon_skin_blue" } },
        { tier: 9, freeReward: { type: "rankXP", amount: 300 }, premiumReward: null },
        { tier: 10, freeReward: { type: "title", value: "Survivor" }, premiumReward: { type: "cosmetic", value: "skin_green" } },

        // Tier 11-20
        { tier: 11, freeReward: { type: "rankXP", amount: 350 }, premiumReward: null },
        { tier: 12, freeReward: { type: "emblem", value: "shield" }, premiumReward: { type: "cosmetic", value: "weapon_skin_green" } },
        { tier: 13, freeReward: { type: "rankXP", amount: 400 }, premiumReward: null },
        { tier: 14, freeReward: { type: "title", value: "Warrior" }, premiumReward: { type: "cosmetic", value: "skin_orange" } },
        { tier: 15, freeReward: { type: "rankXP", amount: 500 }, premiumReward: null },
        { tier: 16, freeReward: { type: "emblem", value: "crosshair" }, premiumReward: { type: "cosmetic", value: "weapon_skin_orange" } },
        { tier: 17, freeReward: { type: "rankXP", amount: 600 }, premiumReward: null },
        { tier: 18, freeReward: { type: "title", value: "Veteran" }, premiumReward: { type: "cosmetic", value: "skin_purple" } },
        { tier: 19, freeReward: { type: "rankXP", amount: 700 }, premiumReward: null },
        { tier: 20, freeReward: { type: "emblem", value: "star" }, premiumReward: { type: "cosmetic", value: "weapon_skin_purple" } },

        // Tier 21-30
        { tier: 21, freeReward: { type: "rankXP", amount: 800 }, premiumReward: null },
        { tier: 22, freeReward: { type: "title", value: "Elite" }, premiumReward: { type: "cosmetic", value: "skin_gold" } },
        { tier: 23, freeReward: { type: "rankXP", amount: 1000 }, premiumReward: null },
        { tier: 24, freeReward: { type: "emblem", value: "crown" }, premiumReward: { type: "cosmetic", value: "weapon_skin_gold" } },
        { tier: 25, freeReward: { type: "rankXP", amount: 1200 }, premiumReward: null },
        { tier: 26, freeReward: { type: "title", value: "Master" }, premiumReward: { type: "cosmetic", value: "skin_platinum" } },
        { tier: 27, freeReward: { type: "rankXP", amount: 1500 }, premiumReward: null },
        { tier: 28, freeReward: { type: "emblem", value: "diamond" }, premiumReward: { type: "cosmetic", value: "weapon_skin_platinum" } },
        { tier: 29, freeReward: { type: "rankXP", amount: 2000 }, premiumReward: null },
        { tier: 30, freeReward: { type: "title", value: "Legend" }, premiumReward: { type: "cosmetic", value: "skin_legendary" } },

        // Tier 31-40
        { tier: 31, freeReward: { type: "rankXP", amount: 2500 }, premiumReward: null },
        { tier: 32, freeReward: { type: "emblem", value: "flame" }, premiumReward: { type: "cosmetic", value: "weapon_skin_legendary" } },
        { tier: 33, freeReward: { type: "rankXP", amount: 3000 }, premiumReward: null },
        { tier: 34, freeReward: { type: "title", value: "Immortal" }, premiumReward: { type: "cosmetic", value: "skin_immortal" } },
        { tier: 35, freeReward: { type: "rankXP", amount: 4000 }, premiumReward: null },
        { tier: 36, freeReward: { type: "emblem", value: "skull" }, premiumReward: { type: "cosmetic", value: "weapon_skin_immortal" } },
        { tier: 37, freeReward: { type: "rankXP", amount: 5000 }, premiumReward: null },
        { tier: 38, freeReward: { type: "title", value: "Godlike" }, premiumReward: { type: "cosmetic", value: "skin_godlike" } },
        { tier: 39, freeReward: { type: "rankXP", amount: 6000 }, premiumReward: null },
        { tier: 40, freeReward: { type: "emblem", value: "wings" }, premiumReward: { type: "cosmetic", value: "weapon_skin_godlike" } },

        // Tier 41-50
        { tier: 41, freeReward: { type: "rankXP", amount: 7500 }, premiumReward: null },
        { tier: 42, freeReward: { type: "title", value: "Divine" }, premiumReward: { type: "cosmetic", value: "skin_divine" } },
        { tier: 43, freeReward: { type: "rankXP", amount: 10000 }, premiumReward: null },
        { tier: 44, freeReward: { type: "emblem", value: "halo" }, premiumReward: { type: "cosmetic", value: "weapon_skin_divine" } },
        { tier: 45, freeReward: { type: "rankXP", amount: 15000 }, premiumReward: null },
        { tier: 46, freeReward: { type: "title", value: "Transcendent" }, premiumReward: { type: "cosmetic", value: "skin_transcendent" } },
        { tier: 47, freeReward: { type: "rankXP", amount: 20000 }, premiumReward: null },
        { tier: 48, freeReward: { type: "emblem", value: "infinity" }, premiumReward: { type: "cosmetic", value: "weapon_skin_transcendent" } },
        { tier: 49, freeReward: { type: "rankXP", amount: 25000 }, premiumReward: null },
        { tier: 50, freeReward: { type: "title", value: "Ultimate" }, premiumReward: { type: "cosmetic", value: "skin_ultimate", exclusive: true } }
    ]
};

// Season 2 Battlepass Tiers (50 tiers) — ACTIVE
export const BATTLEPASS_SEASON_2 = {
    season: 2,
    name: "Season 2: Dead Zone",
    startDate: "2026-01-01",
    endDate: "2027-01-01",
    tiers: [
        // Tier 1-10: Onboarding ramp
        { tier: 1, freeReward: { type: "rankXP", amount: 100 }, premiumReward: null },
        { tier: 2, freeReward: { type: "title", value: "Wasteland Scout" }, premiumReward: { type: "cosmetic", value: "skin_red" } },
        { tier: 3, freeReward: { type: "rankXP", amount: 150 }, premiumReward: null },
        { tier: 4, freeReward: { type: "emblem", value: "biohazard" }, premiumReward: { type: "cosmetic", value: "weapon_skin_red" } },
        { tier: 5, freeReward: { type: "rankXP", amount: 200 }, premiumReward: null },
        { tier: 6, freeReward: { type: "title", value: "Dead Zone Walker" }, premiumReward: { type: "cosmetic", value: "skin_blue" } },
        { tier: 7, freeReward: { type: "rankXP", amount: 250 }, premiumReward: null },
        { tier: 8, freeReward: { type: "emblem", value: "gas_mask" }, premiumReward: { type: "cosmetic", value: "weapon_skin_blue" } },
        { tier: 9, freeReward: { type: "rankXP", amount: 300 }, premiumReward: null },
        { tier: 10, freeReward: { type: "title", value: "Zone Survivor" }, premiumReward: { type: "cosmetic", value: "skin_green" } },

        // Tier 11-20: Mid-game
        { tier: 11, freeReward: { type: "rankXP", amount: 350 }, premiumReward: null },
        { tier: 12, freeReward: { type: "emblem", value: "radiation" }, premiumReward: { type: "cosmetic", value: "weapon_skin_green" } },
        { tier: 13, freeReward: { type: "rankXP", amount: 400 }, premiumReward: null },
        { tier: 14, freeReward: { type: "title", value: "Contaminated" }, premiumReward: { type: "cosmetic", value: "skin_orange" } },
        { tier: 15, freeReward: { type: "rankXP", amount: 500 }, premiumReward: null },
        { tier: 16, freeReward: { type: "emblem", value: "toxic" }, premiumReward: { type: "cosmetic", value: "weapon_skin_orange" } },
        { tier: 17, freeReward: { type: "rankXP", amount: 600 }, premiumReward: null },
        { tier: 18, freeReward: { type: "title", value: "Irradiated" }, premiumReward: { type: "cosmetic", value: "skin_purple" } },
        { tier: 19, freeReward: { type: "rankXP", amount: 700 }, premiumReward: null },
        { tier: 20, freeReward: { type: "emblem", value: "nuclear" }, premiumReward: { type: "cosmetic", value: "weapon_skin_purple" } },

        // Tier 21-30: Veteran
        { tier: 21, freeReward: { type: "rankXP", amount: 800 }, premiumReward: null },
        { tier: 22, freeReward: { type: "title", value: "Zone Marauder" }, premiumReward: { type: "cosmetic", value: "skin_gold" } },
        { tier: 23, freeReward: { type: "rankXP", amount: 1000 }, premiumReward: null },
        { tier: 24, freeReward: { type: "emblem", value: "fallout" }, premiumReward: { type: "cosmetic", value: "weapon_skin_gold" } },
        { tier: 25, freeReward: { type: "rankXP", amount: 1200 }, premiumReward: null },
        { tier: 26, freeReward: { type: "title", value: "Apocalypse Vet" }, premiumReward: { type: "cosmetic", value: "skin_platinum" } },
        { tier: 27, freeReward: { type: "rankXP", amount: 1500 }, premiumReward: null },
        { tier: 28, freeReward: { type: "emblem", value: "mutant_skull" }, premiumReward: { type: "cosmetic", value: "weapon_skin_platinum" } },
        { tier: 29, freeReward: { type: "rankXP", amount: 2000 }, premiumReward: null },
        { tier: 30, freeReward: { type: "title", value: "Dead Zone Legend" }, premiumReward: { type: "cosmetic", value: "skin_legendary" } },

        // Tier 31-40: Elite
        { tier: 31, freeReward: { type: "rankXP", amount: 2500 }, premiumReward: null },
        { tier: 32, freeReward: { type: "emblem", value: "plague" }, premiumReward: { type: "cosmetic", value: "weapon_skin_legendary" } },
        { tier: 33, freeReward: { type: "rankXP", amount: 3000 }, premiumReward: null },
        { tier: 34, freeReward: { type: "title", value: "Extinction Event" }, premiumReward: { type: "cosmetic", value: "skin_immortal" } },
        { tier: 35, freeReward: { type: "rankXP", amount: 4000 }, premiumReward: null },
        { tier: 36, freeReward: { type: "emblem", value: "omega" }, premiumReward: { type: "cosmetic", value: "weapon_skin_immortal" } },
        { tier: 37, freeReward: { type: "rankXP", amount: 5000 }, premiumReward: null },
        { tier: 38, freeReward: { type: "title", value: "Patient Zero" }, premiumReward: { type: "cosmetic", value: "skin_godlike" } },
        { tier: 39, freeReward: { type: "rankXP", amount: 6000 }, premiumReward: null },
        { tier: 40, freeReward: { type: "emblem", value: "doom" }, premiumReward: { type: "cosmetic", value: "weapon_skin_godlike" } },

        // Tier 41-50: Endgame prestige
        { tier: 41, freeReward: { type: "rankXP", amount: 7500 }, premiumReward: null },
        { tier: 42, freeReward: { type: "title", value: "Ground Zero" }, premiumReward: { type: "cosmetic", value: "skin_divine" } },
        { tier: 43, freeReward: { type: "rankXP", amount: 10000 }, premiumReward: null },
        { tier: 44, freeReward: { type: "emblem", value: "singularity" }, premiumReward: { type: "cosmetic", value: "weapon_skin_divine" } },
        { tier: 45, freeReward: { type: "rankXP", amount: 15000 }, premiumReward: null },
        { tier: 46, freeReward: { type: "title", value: "The Last Human" }, premiumReward: { type: "cosmetic", value: "skin_transcendent" } },
        { tier: 47, freeReward: { type: "rankXP", amount: 20000 }, premiumReward: null },
        { tier: 48, freeReward: { type: "emblem", value: "void" }, premiumReward: { type: "cosmetic", value: "weapon_skin_transcendent" } },
        { tier: 49, freeReward: { type: "rankXP", amount: 25000 }, premiumReward: null },
        { tier: 50, freeReward: { type: "title", value: "Dead Zone Overlord" }, premiumReward: { type: "cosmetic", value: "skin_ultimate", exclusive: true } }
    ]
};

// All available seasons indexed — add new seasons here
export const ALL_SEASONS = [BATTLEPASS_SEASON_1, BATTLEPASS_SEASON_2];

// Battlepass XP requirements per tier (increases with tier)
export const BATTLEPASS_XP_PER_TIER = 100; // Base XP per tier
export const BATTLEPASS_XP_SCALING = 1.1; // 10% increase per tier

/**
 * Calculate battlepass XP required for a specific tier
 * @param {number} tier - Tier number (1-based)
 * @returns {number} Required battlepass XP
 */
export function getBattlepassXPRequirement(tier) {
    if (tier <= 1) return 0;
    let totalXP = 0;
    for (let t = 2; t <= tier; t++) {
        const tierXP = Math.floor(BATTLEPASS_XP_PER_TIER * Math.pow(BATTLEPASS_XP_SCALING, t - 2));
        totalXP += tierXP;
    }
    return totalXP;
}

/**
 * Get current active season based on date.
 * Falls back to the latest defined season if none is currently active.
 * @returns {Object} Season definition
 */
export function getCurrentSeason() {
    const now = new Date();

    for (const season of ALL_SEASONS) {
        const start = new Date(season.startDate);
        const end = new Date(season.endDate);
        if (now >= start && now < end) {
            return season;
        }
    }

    // No season currently active by date — return the latest season
    // This prevents progress-wiping players when between seasons
    return ALL_SEASONS[ALL_SEASONS.length - 1];
}

/**
 * Check if a season is currently active by date
 * @param {Object} season - Season definition
 * @returns {boolean} True if season date range is active
 */
export function isSeasonActive(season) {
    const now = new Date();
    const startDate = new Date(season.startDate);
    const endDate = new Date(season.endDate);
    return now >= startDate && now < endDate;
}

/**
 * Get days remaining in season
 * @param {Object} season - Season definition
 * @returns {number} Days remaining (0 if expired)
 */
export function getDaysRemaining(season) {
    const now = new Date();
    const endDate = new Date(season.endDate);
    if (now >= endDate) return 0;
    const diffTime = endDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
}

/**
 * Get a season by its season number
 * @param {number} seasonNum - Season number (1-based)
 * @returns {Object|null} Season definition or null
 */
export function getSeasonByNumber(seasonNum) {
    return ALL_SEASONS.find(s => s.season === seasonNum) || null;
}
