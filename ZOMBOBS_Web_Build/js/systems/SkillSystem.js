import { gameState } from '../core/gameState.js';
import { PLAYER_MAX_HEALTH, PLAYER_BASE_SPEED } from '../core/constants.js';

// Constants
export const MAX_SKILL_SLOTS = 6;
export const XP_BASE_REQUIREMENT = 100;
export const XP_SCALING_FACTOR = 1.2;

// Skills Pool
export const SKILLS_POOL = [
    {
        id: 'vitality_boost',
        name: 'Vitality Boost',
        icon: '❤️',
        description: 'Increase Max HP by 25%',
        effect: (player) => {
            const bonus = Math.floor(player.maxHealth * 0.25);
            player.maxHealth += bonus;
            player.health += bonus; // Also heal the bonus amount
        },
        upgradeable: true
    },
    {
        id: 'swift_steps',
        name: 'Swift Steps',
        icon: '👟',
        description: 'Increase Movement Speed by 15%',
        effect: (player) => {
            // Speed is handled in updatePlayers, we'll track it via a multiplier
            if (!player.speedMultiplier) player.speedMultiplier = 1.0;
            player.speedMultiplier *= 1.15;
        },
        upgradeable: true
    },
    {
        id: 'eagle_eye',
        name: 'Eagle Eye',
        icon: '🎯',
        description: 'Increase Critical Hit Chance by 10%',
        effect: (player) => {
            if (!player.critChance) player.critChance = 0;
            player.critChance += 0.10;
        },
        upgradeable: true
    },
    {
        id: 'iron_grip',
        name: 'Iron Grip',
        icon: '⚙️',
        description: 'Increase Reload Speed by 20%',
        effect: (player) => {
            if (!player.reloadSpeedMultiplier) player.reloadSpeedMultiplier = 1.0;
            player.reloadSpeedMultiplier *= 0.8; // 20% faster = 80% of original time
        },
        upgradeable: true
    },
    {
        id: 'hoarder',
        name: 'Hoarder',
        icon: '📦',
        description: 'Increase Max Ammo capacity by 30%',
        effect: (player) => {
            if (!player.ammoMultiplier) player.ammoMultiplier = 1.0;
            player.ammoMultiplier *= 1.30;
            // Update current weapon's max ammo
            player.maxAmmo = Math.floor(player.currentWeapon.maxAmmo * player.ammoMultiplier);
            // Refill ammo to new max
            player.currentAmmo = player.maxAmmo;
        },
        upgradeable: true
    },
    {
        id: 'regeneration',
        name: 'Regeneration',
        icon: '💚',
        description: 'Passive Health Regen (1 HP/sec)',
        effect: (player) => {
            player.hasRegeneration = true;
        },
        upgradeable: true
    },
    {
        id: 'thick_skin',
        name: 'Thick Skin',
        icon: '🛡️',
        description: 'Reduce damage taken by 10%',
        effect: (player) => {
            if (!player.damageReduction) player.damageReduction = 1.0;
            player.damageReduction *= 0.9; // 10% reduction = 90% of damage
        },
        upgradeable: true
    },
    {
        id: 'lucky_strike',
        name: 'Lucky Strike',
        icon: '🍀',
        description: '15% chance for double damage',
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
        effect: (player) => {
            if (!player.weaponSwitchSpeedMultiplier) player.weaponSwitchSpeedMultiplier = 1.0;
            player.weaponSwitchSpeedMultiplier *= 0.5; // 50% faster = 50% of original time
        },
        upgradeable: true
    },
    {
        id: 'scavenger',
        name: 'Scavenger',
        icon: '🔍',
        description: '25% more pickup spawn rate',
        effect: (player) => {
            if (!player.pickupSpawnRateMultiplier) player.pickupSpawnRateMultiplier = 1.0;
            player.pickupSpawnRateMultiplier *= 1.25;
        },
        upgradeable: true
    },
    {
        id: 'adrenaline',
        name: 'Adrenaline',
        icon: '💉',
        description: '20% speed boost for 3s after kill',
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
        effect: (player) => {
            if (!player.shield) player.shield = 0;
            player.shield += 10;
            if (player.shield > 100) player.shield = 100; // Cap shield at 100
        },
        upgradeable: true
    },
    {
        id: 'long_range',
        name: 'Long Range',
        icon: '📏',
        description: '20% increased bullet range',
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
        effect: (player) => {
            if (!player.reloadSpeedMultiplier) player.reloadSpeedMultiplier = 1.0;
            player.reloadSpeedMultiplier *= 0.85; // 15% faster = 85% of original time
        },
        upgradeable: true
    },
    {
        id: 'bloodlust',
        name: 'Bloodlust',
        icon: '🩸',
        description: 'Heal 2 HP per kill',
        effect: (player) => {
            player.hasBloodlust = true;
        },
        upgradeable: true
    },
    {
        id: 'steady_aim',
        name: 'Steady Aim',
        icon: '🎯',
        description: '30% reduced bullet spread',
        effect: (player) => {
            if (!player.bulletSpreadReduction) player.bulletSpreadReduction = 1.0;
            player.bulletSpreadReduction *= 0.7; // 30% reduction = 70% of original spread
        },
        upgradeable: true
    }
];

class SkillSystem {
    constructor() {
        this.xpValues = {
            normal: 7,      // Reduced by 10% from 8 (was 1.5x increase from 5)
            fast: 14,       // Reduced by 10% from 15 (was 1.5x increase from 10)
            exploding: 21,  // Reduced by 10% from 23 (was 1.5x increase from 15)
            armored: 16,    // Reduced by 10% from 18 (was 1.5x increase from 12)
            ghost: 24,      // Reduced by 10% from 27 (was 1.5x increase from 18)
            spitter: 21,    // Reduced by 10% from 23 (was 1.5x increase from 15)
            flying: 18,     // Balanced for medium difficulty (between Ghost 24 and Spitter 21)
            crawler: 16,    // Balanced between Fast 14 and Armored 16
            boss: 338       // Reduced by 10% from 375 (was 1.5x increase from 250)
        };
    }

    gainXP(amount) {
        if (!gameState.gameRunning || gameState.showLevelUp) return;

        gameState.xp += amount;

        // Check if we should level up
        if (gameState.xp >= gameState.nextLevelXP) {
            this.levelUp();
        }
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
                // Client: Don't generate choices or show UI yet. Wait for Leader.
                return;
            }

            // Leader: Generate and broadcast
            gameState.levelUpChoices = this.generateChoices();
            gameState.showLevelUp = true;

            gameState.multiplayer.socket.emit('game:levelup', {
                level: gameState.level,
                nextLevelXP: gameState.nextLevelXP,
                choices: gameState.levelUpChoices
            });
        } else {
            // Single Player
            gameState.levelUpChoices = this.generateChoices();
            gameState.showLevelUp = true;
        }
    }

    generateChoices() {
        const activeSkillIds = gameState.activeSkills.map(s => s.id);
        const availableSkills = SKILLS_POOL.filter(skill => {
            // If we have less than MAX_SKILL_SLOTS, allow new skills
            if (activeSkillIds.length < MAX_SKILL_SLOTS) {
                return true; // All skills available
            }
            // If slots are full, only offer upgrades to existing skills
            return activeSkillIds.includes(skill.id);
        });

        // Shuffle and pick 3
        const shuffled = [...availableSkills].sort(() => Math.random() - 0.5);
        const choices = shuffled.slice(0, 3);

        // If we have less than 3 choices, fill with random skills
        if (choices.length < 3) {
            while (choices.length < 3) {
                const randomSkill = SKILLS_POOL[Math.floor(Math.random() * SKILLS_POOL.length)];
                if (!choices.find(c => c.id === randomSkill.id)) {
                    choices.push(randomSkill);
                }
            }
        }

        return choices;
    }

    activateSkill(skillId) {
        const skill = SKILLS_POOL.find(s => s.id === skillId);
        if (!skill) return;

        // Check if skill already exists
        const existingSkill = gameState.activeSkills.find(s => s.id === skillId);

        if (existingSkill) {
            // Upgrade existing skill
            existingSkill.level = (existingSkill.level || 1) + 1;
        } else {
            // Add new skill
            if (gameState.activeSkills.length >= MAX_SKILL_SLOTS) {
                console.warn('Cannot add more skills, max slots reached');
                return;
            }
            gameState.activeSkills.push({
                id: skillId,
                level: 1
            });
        }

        // Apply effect to all players
        gameState.players.forEach(player => {
            if (player.health > 0) {
                skill.effect(player);
            }
        });

        // Broadcast choice if Leader
        if (gameState.isCoop && gameState.multiplayer.active && gameState.multiplayer.isLeader) {
            gameState.multiplayer.socket.emit('game:skill', skillId);
        }
    }

    getXPForZombieType(zombieType) {
        return this.xpValues[zombieType] || this.xpValues.normal;
    }
}

export const skillSystem = new SkillSystem();

