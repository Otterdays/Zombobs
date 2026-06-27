import { gameState } from '../core/gameState.js';
import { SKILL_TREES, TREE_SKILLS_POOL } from '../core/skillTreeDefinitions.js';
import { playerProfileSystem } from './PlayerProfileSystem.js';

export { SKILL_TREES, TREE_SKILLS_POOL };

// Constants
export const MAX_SKILL_SLOTS = 6;
export const TREE_SKILL_WEIGHT_MULT = 0.35;
export const XP_BASE_REQUIREMENT = 100;
export const XP_SCALING_FACTOR = 1.2;

// Skill Rarity System
export const SKILL_RARITY = {
    COMMON: { name: 'Common', color: '#a0a0a0', weight: 50, multiplier: 1.0 },
    RARE: { name: 'Rare', color: '#4dabf7', weight: 30, multiplier: 1.25 },
    EPIC: { name: 'Epic', color: '#be4bdb', weight: 15, multiplier: 1.5 },
    LEGENDARY: { name: 'Legendary', color: '#ffd700', weight: 5, multiplier: 2.0 }
};

// Skills Pool with Rarity Tiers
export const SKILLS_POOL = [
    // === COMMON SKILLS (50% weight) ===
    {
        id: 'vitality_boost',
        name: 'Vitality Boost',
        icon: '❤️',
        description: 'Increase Max HP by 25%',
        rarity: 'COMMON',
        effect: (player) => {
            const bonus = Math.floor(player.maxHealth * 0.25);
            player.maxHealth += bonus;
            player.health += bonus;
        },
        upgradeable: true
    },
    {
        id: 'swift_steps',
        name: 'Swift Steps',
        icon: '👟',
        description: 'Increase Movement Speed by 15%',
        rarity: 'COMMON',
        effect: (player) => {
            if (!player.speedMultiplier) player.speedMultiplier = 1.0;
            player.speedMultiplier *= 1.15;
        },
        upgradeable: true
    },
    {
        id: 'iron_grip',
        name: 'Iron Grip',
        icon: '⚙️',
        description: 'Increase Reload Speed by 20%',
        rarity: 'COMMON',
        effect: (player) => {
            if (!player.reloadSpeedMultiplier) player.reloadSpeedMultiplier = 1.0;
            player.reloadSpeedMultiplier *= 0.8;
        },
        upgradeable: true
    },
    {
        id: 'thick_skin',
        name: 'Thick Skin',
        icon: '🛡️',
        description: 'Reduce damage taken by 10%',
        rarity: 'COMMON',
        effect: (player) => {
            if (!player.damageReduction) player.damageReduction = 1.0;
            player.damageReduction *= 0.9;
        },
        upgradeable: true
    },
    {
        id: 'hoarder',
        name: 'Hoarder',
        icon: '📦',
        description: 'Increase Max Ammo capacity by 30%',
        rarity: 'COMMON',
        effect: (player) => {
            if (!player.ammoMultiplier) player.ammoMultiplier = 1.0;
            player.ammoMultiplier *= 1.30;
            player.maxAmmo = Math.floor(player.currentWeapon.maxAmmo * player.ammoMultiplier);
            player.currentAmmo = player.maxAmmo;
        },
        upgradeable: true
    },

    // === RARE SKILLS (30% weight) ===
    {
        id: 'eagle_eye',
        name: 'Eagle Eye',
        icon: '🎯',
        description: 'Increase Critical Hit Chance by 10%',
        rarity: 'RARE',
        effect: (player) => {
            if (!player.critChance) player.critChance = 0;
            player.critChance += 0.10;
        },
        upgradeable: true
    },
    {
        id: 'regeneration',
        name: 'Regeneration',
        icon: '💚',
        description: 'Passive Health Regen (1 HP/sec)',
        rarity: 'RARE',
        effect: (player) => {
            player.hasRegeneration = true;
        },
        upgradeable: true
    },
    {
        id: 'scavenger',
        name: 'Scavenger',
        icon: '🔍',
        description: '25% more pickup spawn rate',
        rarity: 'RARE',
        effect: (player) => {
            if (!player.pickupSpawnRateMultiplier) player.pickupSpawnRateMultiplier = 1.0;
            player.pickupSpawnRateMultiplier *= 1.25;
        },
        upgradeable: true
    },
    {
        id: 'long_range',
        name: 'Long Range',
        icon: '📏',
        description: '20% increased bullet range',
        rarity: 'RARE',
        effect: (player) => {
            if (!player.bulletRangeMultiplier) player.bulletRangeMultiplier = 1.0;
            player.bulletRangeMultiplier *= 1.2;
        },
        upgradeable: true
    },
    {
        id: 'fast_fingers',
        name: 'Fast Fingers',
        icon: '👆',
        description: '15% faster reload (stacks with Iron Grip)',
        rarity: 'RARE',
        effect: (player) => {
            if (!player.reloadSpeedMultiplier) player.reloadSpeedMultiplier = 1.0;
            player.reloadSpeedMultiplier *= 0.85;
        },
        upgradeable: true
    },
    {
        id: 'steady_aim',
        name: 'Steady Aim',
        icon: '🎯',
        description: '30% reduced bullet spread',
        rarity: 'RARE',
        effect: (player) => {
            if (!player.bulletSpreadReduction) player.bulletSpreadReduction = 1.0;
            player.bulletSpreadReduction *= 0.7;
        },
        upgradeable: true
    },

    // === EPIC SKILLS (15% weight) ===
    {
        id: 'lucky_strike',
        name: 'Lucky Strike',
        icon: '🍀',
        description: '15% chance for double damage',
        rarity: 'EPIC',
        effect: (player) => {
            if (!player.luckyStrikeChance) player.luckyStrikeChance = 0;
            player.luckyStrikeChance += 0.15;
        },
        upgradeable: true
    },
    {
        id: 'quick_hands',
        name: 'Quick Hands',
        icon: '⚡',
        description: '50% faster weapon switching',
        rarity: 'EPIC',
        effect: (player) => {
            if (!player.weaponSwitchSpeedMultiplier) player.weaponSwitchSpeedMultiplier = 1.0;
            player.weaponSwitchSpeedMultiplier *= 0.5;
        },
        upgradeable: true
    },
    {
        id: 'adrenaline',
        name: 'Adrenaline',
        icon: '💉',
        description: '20% speed boost for 3s after kill',
        rarity: 'EPIC',
        effect: (player) => {
            player.hasAdrenaline = true;
        },
        upgradeable: true
    },
    {
        id: 'armor_plating',
        name: 'Armor Plating',
        icon: '🛡️',
        description: 'Gain 10 shield points',
        rarity: 'EPIC',
        effect: (player) => {
            if (!player.shield) player.shield = 0;
            player.shield += 10;
            if (player.shield > 100) player.shield = 100;
        },
        upgradeable: true
    },

    // === LEGENDARY SKILLS (5% weight) ===
    {
        id: 'bloodlust',
        name: 'Bloodlust',
        icon: '🩸',
        description: 'Heal 2 HP per kill',
        rarity: 'LEGENDARY',
        effect: (player) => {
            player.hasBloodlust = true;
        },
        upgradeable: true
    },
    {
        id: 'executioner',
        name: 'Executioner',
        icon: '💀',
        description: 'Deal 50% more damage to low HP enemies',
        rarity: 'LEGENDARY',
        effect: (player) => {
            player.hasExecutioner = true;
        },
        upgradeable: true
    },
    {
        id: 'second_wind',
        name: 'Second Wind',
        icon: '🌬️',
        description: 'Survive fatal damage once (50% HP)',
        rarity: 'LEGENDARY',
        effect: (player) => {
            player.hasSecondWind = true;
        },
        upgradeable: true
    },
    {
        id: 'berserker',
        name: 'Berserker',
        icon: '🔥',
        description: '+30% damage when below 30% HP',
        rarity: 'LEGENDARY',
        effect: (player) => {
            player.hasBerserker = true;
        },
        upgradeable: true
    }
];

class SkillSystem {
    constructor() {
        this.xpValues = {
            normal: 6,      // Reduced from 7 (15% reduction)
            fast: 12,       // Reduced from 14 (15% reduction)
            exploding: 18,  // Reduced from 21 (15% reduction)
            armored: 14,    // Reduced from 16 (15% reduction)
            ghost: 20,      // Reduced from 24 (15% reduction)
            spitter: 18,    // Reduced from 21 (15% reduction)
            flying: 15,     // Reduced from 18 (15% reduction)
            crawler: 14,    // Reduced from 16 (15% reduction)
            boss: 287       // Reduced from 338 (15% reduction)
        };

        // Kill streak XP bonuses
        this.killStreakBonuses = {
            5: 1.1,   // 10% bonus at 5 streak
            10: 1.25, // 25% bonus at 10 streak
            15: 1.5,  // 50% bonus at 15 streak
            20: 2.0,  // 100% bonus at 20+ streak
            30: 2.5,  // 150% bonus at 30+ streak
            50: 3.0   // 200% bonus at 50+ streak
        };

        // XP popup queue for visual feedback
        this.xpPopups = [];
    }

    /**
     * Calculate XP multiplier based on kill streak
     * @param {number} streak - Current kill streak
     * @returns {number} XP multiplier
     */
    getKillStreakMultiplier(streak) {
        let multiplier = 1.0;
        const thresholds = Object.keys(this.killStreakBonuses).map(Number).sort((a, b) => b - a);

        for (const threshold of thresholds) {
            if (streak >= threshold) {
                multiplier = this.killStreakBonuses[threshold];
                break;
            }
        }

        return multiplier;
    }

    /**
     * Gain XP with kill streak bonus and visual popup
     * @param {number} amount - Base XP amount
     * @param {Object} options - Optional parameters (x, y for popup position, streak for bonus)
     */
    gainXP(amount, options = {}) {
        if (!gameState.gameRunning || gameState.showLevelUp) return;

        // Apply kill streak bonus if applicable
        const streak = options.streak || gameState.killStreak || 0;
        const multiplier = this.getKillStreakMultiplier(streak);
        const finalAmount = Math.floor(amount * multiplier);

        gameState.xp += finalAmount;

        // Create XP popup for visual feedback
        if (options.x !== undefined && options.y !== undefined) {
            this.createXPPopup(finalAmount, options.x, options.y, multiplier > 1.0);
        }

        // Check if we should level up
        if (gameState.xp >= gameState.nextLevelXP) {
            this.levelUp();
        }

        return finalAmount;
    }

    /**
     * Create an XP popup for visual feedback
     * @param {number} amount - XP amount to display
     * @param {number} x - World X position
     * @param {number} y - World Y position
     * @param {boolean} isBonus - Whether this has a streak bonus applied
     */
    createXPPopup(amount, x, y, isBonus = false) {
        this.xpPopups.push({
            amount,
            x,
            y,
            alpha: 1.0,
            offsetY: 0,
            isBonus,
            createdAt: Date.now()
        });

        // Limit popup queue size
        if (this.xpPopups.length > 20) {
            this.xpPopups.shift();
        }
    }

    /**
     * Update and get XP popups for rendering
     * @param {number} deltaTime - Time since last frame
     * @returns {Array} Active XP popups
     */
    updateXPPopups(deltaTime) {
        const now = Date.now();
        const lifetime = 1500; // 1.5 seconds

        this.xpPopups = this.xpPopups.filter(popup => {
            const age = now - popup.createdAt;
            if (age > lifetime) return false;

            // Float upward and fade out
            popup.offsetY -= deltaTime * 0.05;
            popup.alpha = 1.0 - (age / lifetime);

            return true;
        });

        return this.xpPopups;
    }

    levelUp() {
        gameState.level++;

        // Calculate next level XP requirement (linear progression: +20 per level, starting at 100)
        gameState.nextLevelXP = XP_BASE_REQUIREMENT + (gameState.level - 1) * 20;

        // Reset XP to 0 so XP bar resets properly after level up
        gameState.xp = 0;

        // Multiplayer Logic
        if (gameState.isCoop && gameState.multiplayer.active) {
            if (!gameState.multiplayer.isLeader) {
                return;
            }

            gameState.levelUpChoices = this.generateChoices();
            gameState.showLevelUp = true;

            gameState.multiplayer.socket.emit('game:levelup', {
                level: gameState.level,
                nextLevelXP: gameState.nextLevelXP,
                choices: gameState.levelUpChoices
            });
        } else {
            gameState.levelUpChoices = this.generateChoices();
            gameState.showLevelUp = true;
        }
    }

    getSkillById(skillId) {
        return SKILLS_POOL.find(s => s.id === skillId)
            || TREE_SKILLS_POOL.find(s => s.id === skillId)
            || null;
    }

    isTreeSkillUnlocked(skill) {
        if (!skill.requires) return true;
        return gameState.activeSkills.some(s => s.id === skill.requires);
    }

    isSkillMaxed(skill, activeEntry) {
        if (!activeEntry) return false;
        const maxLevel = skill.maxLevel || 3;
        return (activeEntry.level || 1) >= maxLevel;
    }

    getAvailableSkills() {
        const slotsFull = gameState.activeSkills.length >= MAX_SKILL_SLOTS;
        const allPools = [...SKILLS_POOL, ...TREE_SKILLS_POOL];

        return allPools.filter(skill => {
            const existing = gameState.activeSkills.find(s => s.id === skill.id);
            if (this.isSkillMaxed(skill, existing)) return false;
            if (!existing && slotsFull) return false;
            if (skill.treeExclusive && !this.isTreeSkillUnlocked(skill)) return false;
            return true;
        });
    }

    /**
     * Generate skill choices with weighted rarity system
     * @returns {Array} Array of 3 skill choices
     */
    generateChoices() {
        const availableSkills = this.getAvailableSkills();
        const choices = [];
        const usedIds = new Set();
        const levelBonus = Math.min(0.02 * (gameState.level - 1), 0.10);

        for (let i = 0; i < 3; i++) {
            const skill = this.selectWeightedSkill(availableSkills, usedIds, levelBonus);
            if (skill) {
                choices.push(skill);
                usedIds.add(skill.id);
            }
        }

        while (choices.length < 3) {
            const fallback = availableSkills.find(s => !usedIds.has(s.id));
            if (fallback) {
                choices.push(fallback);
                usedIds.add(fallback.id);
            } else {
                break;
            }
        }

        return choices;
    }

    /**
     * Select a skill based on weighted rarity
     * @param {Array} skills - Available skills to choose from
     * @param {Set} excludeIds - Skill IDs to exclude
     * @param {number} levelBonus - Bonus chance for rare/epic/legendary at higher levels
     * @returns {Object|null} Selected skill or null
     */
    selectWeightedSkill(skills, excludeIds, levelBonus = 0) {
        const available = skills.filter(s => !excludeIds.has(s.id));
        if (available.length === 0) return null;

        let totalWeight = 0;
        const weightedSkills = available.map(skill => {
            const baseRarity = SKILL_RARITY[skill.rarity] || SKILL_RARITY.COMMON;
            let weight = baseRarity.weight;

            if (skill.treeExclusive) {
                weight *= TREE_SKILL_WEIGHT_MULT;
            }

            if (skill.rarity !== 'COMMON' && levelBonus > 0) {
                weight *= (1 + levelBonus * 2);
            }

            totalWeight += weight;
            return { skill, weight, cumulative: totalWeight };
        });

        const roll = Math.random() * totalWeight;
        for (const entry of weightedSkills) {
            if (roll <= entry.cumulative) {
                return entry.skill;
            }
        }

        return available[0];
    }

    /**
     * Get the rarity info for a skill
     * @param {string} rarityKey - Rarity key (COMMON, RARE, EPIC, LEGENDARY)
     * @returns {Object} Rarity info object
     */
    getSkillRarity(rarityKey) {
        return SKILL_RARITY[rarityKey] || SKILL_RARITY.COMMON;
    }

    activateSkill(skillId) {
        const skill = this.getSkillById(skillId);
        if (!skill) return;

        const existingSkill = gameState.activeSkills.find(s => s.id === skillId);
        const isNewUnlock = !existingSkill;

        if (existingSkill) {
            existingSkill.level = (existingSkill.level || 1) + 1;
        } else {
            if (gameState.activeSkills.length >= MAX_SKILL_SLOTS) {
                return;
            }
            const entry = {
                id: skillId,
                level: 1,
                rarity: skill.rarity
            };
            if (skill.tree) {
                entry.tree = skill.tree;
                entry.tier = skill.tier;
            }
            gameState.activeSkills.push(entry);
        }

        gameState.players.forEach(player => {
            if (player.health > 0) {
                skill.effect(player);
            }
        });

        if (isNewUnlock) {
            playerProfileSystem.recordSkillUnlock(skillId, !!skill.treeExclusive);
        }

        if (gameState.isCoop && gameState.multiplayer.active && gameState.multiplayer.isLeader) {
            gameState.multiplayer.socket.emit('game:skill', skillId);
        }
    }

    getXPForZombieType(zombieType) {
        return this.xpValues[zombieType] || this.xpValues.normal;
    }
}

export const skillSystem = new SkillSystem();
