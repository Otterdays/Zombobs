// [TRACE: class-tree-skills] — Nation Red-style build paths (hybrid with flat SKILLS_POOL)

export const SKILL_TREES = {
    gunner: {
        name: 'Gunner',
        color: '#ff5252',
        accent: '#ff1744',
        icon: '🔫',
        tagline: 'Lead doctrine'
    },
    survivor: {
        name: 'Survivor',
        color: '#66bb6a',
        accent: '#2e7d32',
        icon: '🛡️',
        tagline: 'Iron will'
    },
    scavenger: {
        name: 'Scavenger',
        color: '#ffc107',
        accent: '#ff8f00',
        icon: '🔍',
        tagline: 'Rust & ruin'
    }
};

const TIER_RARITY = ['COMMON', 'COMMON', 'RARE', 'EPIC', 'LEGENDARY'];

function tierRarity(tier) {
    return TIER_RARITY[Math.min(tier, 5) - 1] || 'COMMON';
}

export const TREE_SKILLS_POOL = [
    // === GUNNER — Dead Eye Doctrine ===
    {
        id: 'gunner_t1_volley',
        tree: 'gunner',
        tier: 1,
        requires: null,
        treeExclusive: true,
        name: 'Trigger Happy',
        icon: '💥',
        tagline: 'Spray first, ask never',
        description: '+12% fire rate per level',
        rarity: tierRarity(1),
        maxLevel: 3,
        upgradeable: true,
        effect: (player) => {
            if (!player.fireRateSkillMultiplier) player.fireRateSkillMultiplier = 1.0;
            player.fireRateSkillMultiplier *= 0.88;
        }
    },
    {
        id: 'gunner_t2_mark',
        tree: 'gunner',
        tier: 2,
        requires: 'gunner_t1_volley',
        treeExclusive: true,
        name: 'Dead Reckoning',
        icon: '🎯',
        tagline: 'Eyes on the weak point',
        description: '+10% critical hit chance per level',
        rarity: tierRarity(2),
        maxLevel: 3,
        upgradeable: true,
        effect: (player) => {
            if (!player.critChance) player.critChance = 0;
            player.critChance = Math.min(1.0, player.critChance + 0.10);
        }
    },
    {
        id: 'gunner_t3_pierce',
        tree: 'gunner',
        tier: 3,
        requires: 'gunner_t2_mark',
        treeExclusive: true,
        name: 'Armor Breaker',
        icon: '➡️',
        tagline: 'One round, two corpses',
        description: '+18% chance bullets pierce one extra target',
        rarity: tierRarity(3),
        maxLevel: 3,
        upgradeable: true,
        effect: (player) => {
            if (!player.pierceChance) player.pierceChance = 0;
            player.pierceChance = Math.min(0.75, player.pierceChance + 0.18);
        }
    },
    {
        id: 'gunner_t4_overkill',
        tree: 'gunner',
        tier: 4,
        requires: 'gunner_t3_pierce',
        treeExclusive: true,
        name: 'Hot Load',
        icon: '🔥',
        tagline: 'Overcharged rounds',
        description: '+18% weapon damage per level',
        rarity: tierRarity(4),
        maxLevel: 3,
        upgradeable: true,
        effect: (player) => {
            if (!player.damageSkillMultiplier) player.damageSkillMultiplier = 1.0;
            player.damageSkillMultiplier *= 1.18;
        }
    },
    {
        id: 'gunner_t5_deadshot',
        tree: 'gunner',
        tier: 5,
        requires: 'gunner_t4_overkill',
        treeExclusive: true,
        name: 'Coup de Grace',
        icon: '💀',
        tagline: 'Finish the wounded',
        description: '+50% damage vs enemies below 30% HP',
        rarity: tierRarity(5),
        maxLevel: 1,
        upgradeable: false,
        effect: (player) => {
            player.hasExecutioner = true;
        }
    },

    // === SURVIVOR — Iron Will Path ===
    {
        id: 'survivor_t1_grit',
        tree: 'survivor',
        tier: 1,
        requires: null,
        treeExclusive: true,
        name: 'Grit',
        icon: '🪨',
        tagline: 'Pain is temporary',
        description: 'Reduce damage taken by 12% per level',
        rarity: tierRarity(1),
        maxLevel: 3,
        upgradeable: true,
        effect: (player) => {
            if (!player.damageReduction) player.damageReduction = 1.0;
            player.damageReduction *= 0.88;
        }
    },
    {
        id: 'survivor_t2_endurance',
        tree: 'survivor',
        tier: 2,
        requires: 'survivor_t1_grit',
        treeExclusive: true,
        name: 'Second Skin',
        icon: '❤️',
        tagline: 'Thicker than the horde',
        description: '+22% max HP per level',
        rarity: tierRarity(2),
        maxLevel: 3,
        upgradeable: true,
        effect: (player) => {
            const bonus = Math.floor(player.maxHealth * 0.22);
            player.maxHealth += bonus;
            player.health += bonus;
        }
    },
    {
        id: 'survivor_t3_marathon',
        tree: 'survivor',
        tier: 3,
        requires: 'survivor_t2_endurance',
        treeExclusive: true,
        name: 'Untiring',
        icon: '👟',
        tagline: 'Outrun the swarm',
        description: '+25% max stamina per level',
        rarity: tierRarity(3),
        maxLevel: 3,
        upgradeable: true,
        effect: (player) => {
            const bonus = Math.floor(player.maxStamina * 0.25);
            player.maxStamina += bonus;
            player.stamina = Math.min(player.maxStamina, player.stamina + bonus);
        }
    },
    {
        id: 'survivor_t4_bastion',
        tree: 'survivor',
        tier: 4,
        requires: 'survivor_t3_marathon',
        treeExclusive: true,
        name: 'Bastion',
        icon: '🛡️',
        tagline: 'Layered defense',
        description: '+18 shield points per level',
        rarity: tierRarity(4),
        maxLevel: 3,
        upgradeable: true,
        effect: (player) => {
            if (!player.shield) player.shield = 0;
            player.shield += 18;
            if (player.shield > 100) player.shield = 100;
        }
    },
    {
        id: 'survivor_t5_revenant',
        tree: 'survivor',
        tier: 5,
        requires: 'survivor_t4_bastion',
        treeExclusive: true,
        name: 'Revenant',
        icon: '🌬️',
        tagline: 'Death forgot you once',
        description: 'Survive fatal damage once at 50% HP',
        rarity: tierRarity(5),
        maxLevel: 1,
        upgradeable: false,
        effect: (player) => {
            player.hasSecondWind = true;
            player.secondWindUsed = false;
        }
    },

    // === SCAVENGER — Rust & Ruin ===
    {
        id: 'scavenger_t1_plunder',
        tree: 'scavenger',
        tier: 1,
        requires: null,
        treeExclusive: true,
        name: 'Plunderer',
        icon: '🪙',
        tagline: 'Strip the dead',
        description: '+30% scrap from kills per level',
        rarity: tierRarity(1),
        maxLevel: 3,
        upgradeable: true,
        effect: (player) => {
            if (!player.scrapMultiplier) player.scrapMultiplier = 1.0;
            player.scrapMultiplier *= 1.30;
        }
    },
    {
        id: 'scavenger_t2_salvage',
        tree: 'scavenger',
        tier: 2,
        requires: 'scavenger_t1_plunder',
        treeExclusive: true,
        name: 'Field Stripper',
        icon: '🔧',
        tagline: 'Nothing stays buried',
        description: '+22% pickup spawn rate per level',
        rarity: tierRarity(2),
        maxLevel: 3,
        upgradeable: true,
        effect: (player) => {
            if (!player.pickupSpawnRateMultiplier) player.pickupSpawnRateMultiplier = 1.0;
            player.pickupSpawnRateMultiplier *= 1.22;
        }
    },
    {
        id: 'scavenger_t3_magnet',
        tree: 'scavenger',
        tier: 3,
        requires: 'scavenger_t2_salvage',
        treeExclusive: true,
        name: 'Loot Sense',
        icon: '🧲',
        tagline: 'Scrap finds you',
        description: '+80px scrap magnet range per level',
        rarity: tierRarity(3),
        maxLevel: 3,
        upgradeable: true,
        effect: (player) => {
            if (!player.pickupMagnetBonus) player.pickupMagnetBonus = 0;
            player.pickupMagnetBonus += 80;
        }
    },
    {
        id: 'scavenger_t4_frenzy',
        tree: 'scavenger',
        tier: 4,
        requires: 'scavenger_t3_magnet',
        treeExclusive: true,
        name: 'Feeding Frenzy',
        icon: '🩸',
        tagline: 'Kill to live',
        description: 'Heal 3 HP per kill',
        rarity: tierRarity(4),
        maxLevel: 1,
        upgradeable: false,
        effect: (player) => {
            player.hasBloodlust = true;
            player.bloodlustHealAmount = 3;
        }
    },
    {
        id: 'scavenger_t5_rush',
        tree: 'scavenger',
        tier: 5,
        requires: 'scavenger_t4_frenzy',
        treeExclusive: true,
        name: 'Killing Spree',
        icon: '⚡',
        tagline: 'Momentum is survival',
        description: '+25% speed for 4s after each kill',
        rarity: tierRarity(5),
        maxLevel: 1,
        upgradeable: false,
        effect: (player) => {
            player.hasAdrenaline = true;
            player.adrenalineDurationMs = 4000;
            player.adrenalineBoostMultiplier = 1.25;
        }
    }
];
