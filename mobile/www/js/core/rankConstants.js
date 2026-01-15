// Rank System Constants

// Rank names in progression order
export const RANK_NAMES = [
    "Private",
    "Corporal",
    "Sergeant",
    "Lieutenant",
    "Captain",
    "Major",
    "Colonel",
    "General",
    "Legend"
];

// Number of tiers per rank before advancing
export const TIERS_PER_RANK = 5;

// Rank XP base requirement (for first tier of first rank)
export const RANK_XP_BASE_REQUIREMENT = 100;

// Rank XP scaling factor (exponential growth)
export const RANK_XP_SCALING_FACTOR = 1.15;

// Score to Rank XP conversion rate (default: 1 score = 0.1 rank XP)
export const SCORE_TO_RANK_XP_RATE = 0.1;

// Wave completion bonus (rank XP per wave completed)
export const WAVE_COMPLETION_BONUS = 10;

/**
 * Calculate rank XP required for a specific rank and tier
 * @param {number} rank - Rank number (1-based)
 * @param {number} tier - Tier within rank (1-5)
 * @returns {number} Required rank XP
 */
export function getRankXPRequirement(rank, tier) {
    const totalTiers = (rank - 1) * TIERS_PER_RANK + (tier - 1);
    const baseXP = RANK_XP_BASE_REQUIREMENT;
    const scaling = Math.pow(RANK_XP_SCALING_FACTOR, totalTiers);
    return Math.floor(baseXP * scaling);
}

/**
 * Get rank name by rank number
 * @param {number} rank - Rank number (1-based)
 * @returns {string} Rank name
 */
export function getRankName(rank) {
    if (rank < 1) return RANK_NAMES[0];
    if (rank > RANK_NAMES.length) return RANK_NAMES[RANK_NAMES.length - 1];
    return RANK_NAMES[rank - 1];
}

/**
 * Get total rank XP needed to reach a specific rank and tier
 * @param {number} rank - Rank number (1-based)
 * @param {number} tier - Tier within rank (1-5)
 * @returns {number} Total rank XP needed
 */
export function getTotalRankXPForRank(rank, tier) {
    let totalXP = 0;
    for (let r = 1; r < rank; r++) {
        for (let t = 1; t <= TIERS_PER_RANK; t++) {
            totalXP += getRankXPRequirement(r, t);
        }
    }
    // Add tiers for current rank
    for (let t = 1; t < tier; t++) {
        totalXP += getRankXPRequirement(rank, t);
    }
    return totalXP;
}

/**
 * Calculate rank and tier from total rank XP
 * @param {number} totalRankXP - Total rank XP accumulated
 * @returns {{rank: number, tier: number, rankName: string, currentTierXP: number, nextTierXP: number}}
 */
export function getRankFromXP(totalRankXP) {
    let accumulatedXP = 0;
    let rank = 1;
    let tier = 1;

    while (rank <= RANK_NAMES.length) {
        const tierXP = getRankXPRequirement(rank, tier);
        if (accumulatedXP + tierXP > totalRankXP) {
            break;
        }
        accumulatedXP += tierXP;
        tier++;
        if (tier > TIERS_PER_RANK) {
            tier = 1;
            rank++;
        }
    }

    const currentTierXP = totalRankXP - accumulatedXP;
    const nextTierXP = getRankXPRequirement(rank, tier);

    return {
        rank,
        tier,
        rankName: getRankName(rank),
        currentTierXP,
        nextTierXP
    };
}

