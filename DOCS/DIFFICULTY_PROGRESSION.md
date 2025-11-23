# Difficulty Progression Analysis

## Overview

The game uses a **wave-based difficulty system** with three main scaling factors:
1. **Zombie Count** - Linear increase per wave
2. **Zombie Speed** - Linear increase per wave  
3. **Zombie Health** - Step increase every 3 waves

Additionally, the game features **special zombie variants** that spawn at specific wave thresholds, each with unique health modifiers, speed multipliers, and special abilities. **Boss zombies** appear every 5 waves with massive health pools that scale with wave number.

## Scaling Formulas

### Zombie Count
```javascript
zombiesPerWave = 5 + (wave - 1) * 2
```
- **Wave 1**: 5 zombies
- **Wave 2**: 7 zombies (+2)
- **Wave 3**: 9 zombies (+2)
- **Wave 4**: 11 zombies (+2)
- **Pattern**: +2 zombies every wave

### Zombie Speed
```javascript
speed = 1 + (wave * 0.1)
```
- **Wave 1**: 1.1 speed
- **Wave 2**: 1.2 speed
- **Wave 3**: 1.3 speed
- **Wave 10**: 2.0 speed (2x faster than Wave 1)
- **Wave 20**: 3.0 speed (3x faster than Wave 1)
- **Pattern**: Linear increase of +0.1 per wave

### Zombie Health (Base)
```javascript
health = (2 + Math.floor(wave / 3)) * 2
```
- **Waves 1-2**: 4 HP (doubled from 2)
- **Waves 3-5**: 6 HP (doubled from 3)
- **Waves 6-8**: 8 HP (doubled from 4)
- **Waves 9-11**: 10 HP (doubled from 5)
- **Waves 12-14**: 12 HP (doubled from 6)
- **Waves 15-17**: 14 HP (doubled from 7)
- **Waves 18-20**: 16 HP (doubled from 8)
- **Waves 21-23**: 18 HP (doubled from 9)
- **Waves 24-26**: 20 HP (doubled from 10)
- **Pattern**: +2 HP every 3 waves (doubled from +1 HP)

**Note**: This is the base health for Normal zombies. Special zombie variants apply multipliers to this base value.

## Detailed Wave Breakdown

| Wave | Zombies | Speed | Health | Total HP | Shots to Kill* | Notes |
|------|---------|-------|--------|----------|----------------|-------|
| 1 | 5 | 1.1 | 2 | 10 | 2 (Pistol) | Tutorial wave |
| 2 | 7 | 1.2 | 2 | 14 | 2 (Pistol) | Still easy |
| 3 | 9 | 1.3 | 3 | 27 | 3 (Pistol) | **First health increase** |
| 4 | 11 | 1.4 | 3 | 33 | 3 (Pistol) | Speed ramping up |
| 5 | 13 | 1.5 | 3 | 39 | 3 (Pistol) | Getting crowded |
| 6 | 15 | 1.6 | 4 | 60 | 4 (Pistol) | **Health increase** |
| 7 | 17 | 1.7 | 4 | 68 | 4 (Pistol) | Noticeably faster |
| 8 | 19 | 1.8 | 4 | 76 | 4 (Pistol) | Pressure building |
| 9 | 21 | 1.9 | 5 | 105 | 5 (Pistol) | **Health increase** |
| 10 | 23 | 2.0 | 5 | 115 | 5 (Pistol) | **2x speed milestone** |
| 15 | 33 | 2.5 | 6 | 198 | 6 (Pistol) | Very challenging |
| 20 | 43 | 3.0 | 7 | 301 | 7 (Pistol) | **3x speed milestone** |
| 25 | 53 | 3.5 | 9 | 477 | 9 (Pistol) | Extreme difficulty |
| 30 | 63 | 4.0 | 12 | 756 | 12 (Pistol) | **4x speed milestone** |
| 35 | 73 | 4.5 | 13 | 949 | 13 (Pistol) | Extreme late game |
| 40 | 83 | 5.0 | 15 | 1245 | 15 (Pistol) | **5x speed milestone** |
| 50 | 103 | 6.0 | 18 | 1854 | 18 (Pistol) | **6x speed milestone** |

*Shots to kill assumes Pistol (1 damage per shot). Shotgun and Rifle have different damage values.

**Note**: This table shows base Normal zombie stats. Special variants have different health values (see Special Zombie Types section).

## Difficulty Milestones

### Early Game (Waves 1-5)
- **Zombies**: 5-13
- **Speed**: 1.1-1.5 (manageable)
- **Health**: 2-3 HP
- **Challenge**: Learning mechanics, weapon switching
- **Strategy**: Focus on accuracy, learn reload timing

### Mid Game (Waves 6-15)
- **Zombies**: 15-33
- **Speed**: 1.6-2.5 (noticeably faster)
- **Health**: 4-6 HP
- **Challenge**: Crowd control, ammo management
- **Strategy**: Use Shotgun for groups, Rifle for sustained fire

### Late Game (Waves 16-25)
- **Zombies**: 35-53
- **Speed**: 2.6-3.5 (very fast)
- **Health**: 7-9 HP
- **Challenge**: Overwhelming numbers, tanky enemies
- **Strategy**: Perfect movement, weapon efficiency, health pickup timing

### End Game (Waves 26+)
- **Zombies**: 55+
- **Speed**: 3.6+ (extremely fast)
- **Health**: 10+ HP
- **Challenge**: Survival becomes extremely difficult
- **Strategy**: Maximum efficiency, perfect execution required
- **Special Notes**: Boss waves every 5 waves add massive HP pools (1500+ HP at Wave 20+)

## Special Zombie Types

The game features **7 special zombie variants** that spawn at specific wave thresholds with unique characteristics:

### Normal Zombie
- **Base Type**: Default enemy
- **Health**: Base formula (2 + floor(wave/3))
- **Speed**: Base formula (1 + wave * 0.1)
- **Spawn**: Always available (default when special types don't spawn)

### Fast Zombie (The Runner)
- **Health**: 60% of base (rounded down)
- **Speed**: 1.6x base speed
- **Hitbox**: 80% of normal radius (smaller, harder to hit)
- **Visual**: Reddish/orange appearance with speed trail particles
- **Spawn**: Wave 3+, ~15% chance
- **Code**: `js/entities/Zombie.js:396-510`

**Example Health by Wave:**
- Wave 3: Base 3 HP → Fast: 1 HP (60% = 1.8, floored)
- Wave 6: Base 4 HP → Fast: 2 HP
- Wave 9: Base 5 HP → Fast: 3 HP

### Exploding Zombie (The Boomer)
- **Health**: 80% of base (rounded down)
- **Speed**: 0.9x base speed (slightly slower)
- **Special**: Explodes on death dealing 30 AOE damage in 60 radius
- **Visual**: Orange/yellow pulsing glow, faster pulse when low health or close to player
- **Spawn**: Wave 5+, ~10% chance (only if not Fast)
- **Code**: `js/entities/Zombie.js:512-630`

**Example Health by Wave:**
- Wave 5: Base 3 HP → Exploding: 2 HP (80% = 2.4, floored)
- Wave 6: Base 4 HP → Exploding: 3 HP
- Wave 9: Base 5 HP → Exploding: 4 HP

### Ghost Zombie
- **Health**: 80% of base (rounded down)
- **Speed**: 1.3x base speed
- **Hitbox**: 90% of normal radius
- **Special**: 50% opacity (semi-transparent), wobble animation effect
- **Visual**: Pale blue/white spectral appearance
- **Spawn**: Wave 4+, ~10% chance (only if not Fast/Exploding)
- **Code**: `js/entities/Zombie.js:632-703`

### Spitter Zombie
- **Health**: 80% of base (rounded down)
- **Speed**: 1.2x base speed
- **Special**: Ranged enemy with kiting AI, fires acid projectiles every 2.5 seconds
- **Behavior**: Maintains 300-500px distance from player, strafes when in optimal range
- **Visual**: Toxic green appearance, bloated/swollen look
- **Spawn**: Wave 6+, ~8% chance (only if not Fast/Exploding/Ghost)
- **Code**: `js/entities/Zombie.js:705-864`

### Flying Zombie
- **Health**: 70% of base (rounded down)
- **Speed**: 1.2x base speed
- **Hitbox**: 90% of normal radius (smaller, harder to hit)
- **Special**: Flies with wings, subtle floating animation (3-4 pixel vertical bob)
- **Visual**: Base zombie appearance with simple wing shapes, light aura/glow, elevated shadow
- **Spawn**: Wave 5+, ~9% chance (only if not Fast/Exploding/Ghost/Spitter)
- **Code**: `js/entities/Zombie.js:883-1150`

### Armored Zombie (The Tank)
- **Health**: Base formula (full health)
- **Speed**: 0.75x base speed (slower)
- **Armor**: 10 + (wave * 1.5) armor points
- **Damage System**: 65% of damage absorbed by armor, 35% leaks through to health
- **Visual**: Metal armor plates overlay, larger silhouette (+2 radius)
- **Spawn**: Wave 3+, scaling chance (10% base + 3% per wave, caps at 50%)
- **Code**: `js/entities/Zombie.js:330-393`

**Armor Examples:**
- Wave 3: 14.5 armor (10 + 3*1.5)
- Wave 6: 19 armor (10 + 6*1.5)
- Wave 10: 25 armor (10 + 10*1.5)
- Wave 20: 40 armor (10 + 20*1.5)

**Effective Health Calculation:**
- Effective HP = Health + (Armor / 0.65)
- Example (Wave 6, 4 HP base, 19 armor): 4 + (19/0.65) = ~33.2 effective HP

### Boss Zombie
- **Health**: 500 + (wave * 50) - **massive scaling**
- **Speed**: 0.6 (fixed, slower than normal zombies)
- **Size**: 35 radius (nearly 3x normal size)
- **Special**: Area attack every 3 seconds (120 radius, 20 damage), charges for 1 second before attacking
- **Spawn**: Every 5 waves (Waves 5, 10, 15, 20, etc.)
- **Score Value**: 500 points
- **Code**: `js/entities/BossZombie.js`

**Boss Health Examples:**
- Wave 5: 750 HP (500 + 5*50)
- Wave 10: 1000 HP (500 + 10*50)
- Wave 15: 1250 HP (500 + 15*50)
- Wave 20: 1500 HP (500 + 20*50)
- Wave 25: 1750 HP (500 + 25*50)

## Special Zombie Spawn Rates

The spawn system uses a priority-based random selection:

1. **Fast Zombie**: Wave 3+, 15% chance (0.00-0.15)
2. **Exploding Zombie**: Wave 5+, 10% chance (0.15-0.25) - only if not Fast
3. **Ghost Zombie**: Wave 4+, 10% chance (0.25-0.35) - only if not Fast/Exploding
4. **Spitter Zombie**: Wave 6+, 8% chance (0.35-0.43) - only if not Fast/Exploding/Ghost
5. **Flying Zombie**: Wave 5+, 9% chance (0.43-0.52) - only if not Fast/Exploding/Ghost/Spitter
6. **Armored Zombie**: Wave 3+, scaling chance (0.52-1.00 range)
   - Base chance: 10% + (wave - 3) * 3%
   - Maximum: 50% (capped)
   - Example: Wave 6 = 10% + (6-3)*3% = 19% chance
   - Example: Wave 15 = 10% + (15-3)*3% = 46% chance (capped at 50%)
7. **Normal Zombie**: Default fallback if no special type spawns

**Code Reference**: `js/main.js:832-858`

## Weapon Effectiveness by Wave

### Weapon Damage Values
- **Pistol**: 2 damage per shot (doubled from 1)
- **Shotgun**: 6 damage per pellet × 5 pellets = 30 total potential damage (doubled from 3 per pellet)
- **Rifle**: 4 damage per shot (doubled from 2)
- **Flamethrower**: 1.0 damage per tick (doubled from 0.5, very fast fire rate)
- **SMG**: 1.6 damage per shot (doubled from 0.8)
- **Sniper**: 30 damage per shot (doubled from 15)
- **RPG**: 120 explosion damage (doubled from 60, AOE)

**Code Reference**: `js/core/constants.js:103-166`

### Pistol (2 damage, doubled from 1)
- **Waves 1-2**: 2 shots per zombie (efficient)
- **Waves 3-5**: 3 shots per zombie (still viable)
- **Waves 6-8**: 4 shots per zombie (getting inefficient)
- **Waves 9-11**: 5 shots per zombie (not recommended)
- **Waves 12+**: 6+ shots per zombie (very inefficient)

**Against Special Types:**
- Fast Zombie: 1-2 shots (60% health)
- Exploding/Ghost/Spitter: 2-4 shots (80% health)
- Armored: 3-10+ shots (depends on armor pool)

### Shotgun (6 damage per pellet, 5 pellets, doubled from 3 per pellet)
- **Waves 1-2**: 1 pellet = kill (very efficient)
- **Waves 3-5**: 1 pellet = kill (efficient)
- **Waves 6-8**: 1-2 pellets = kill (good)
- **Waves 9-11**: 2 pellets = kill (still viable)
- **Waves 12-14**: 2 pellets = kill (ammo intensive)
- **Waves 15+**: 2-3 pellets = kill (very ammo intensive)

**Against Special Types:**
- Fast Zombie: Often 1 pellet (very weak)
- Exploding/Ghost/Spitter: 1 pellet (80% health)
- Armored: 1-3+ pellets (armor absorbs most damage)

### Rifle (4 damage, doubled from 2)
- **Waves 1-2**: 1 shot = kill (very efficient)
- **Waves 3-5**: 1-2 shots = kill (efficient)
- **Waves 6-8**: 2 shots = kill (good)
- **Waves 9-11**: 2-3 shots = kill (viable)
- **Waves 12-14**: 3 shots = kill (ammo intensive)
- **Waves 15+**: 3-4 shots = kill (very ammo intensive)

**Against Special Types:**
- Fast Zombie: 1 shot (60% health)
- Exploding/Ghost/Spitter: 1-2 shots (80% health)
- Armored: 2-4+ shots (armor system)

## Difficulty Curve Analysis

### Linear Scaling (Speed & Count)
- **Speed**: Increases smoothly, predictable
- **Count**: Increases smoothly, predictable
- **Result**: Steady, consistent difficulty increase

### Step Scaling (Health)
- **Health**: Jumps every 3 waves
- **Result**: Creates "difficulty spikes" at waves 3, 6, 9, 12, etc.
- **Effect**: These waves feel noticeably harder than the previous wave

### Combined Effect
The combination creates:
- **Smooth baseline increase** (speed + count)
- **Periodic difficulty spikes** (health jumps)
- **Exponential total HP** (count × health = total enemy HP)

## Total Enemy HP Per Wave

| Wave | Total HP | vs Wave 1 |
|------|----------|-----------|
| 1 | 10 | 1.0x |
| 5 | 39 | 3.9x |
| 10 | 115 | 11.5x |
| 15 | 198 | 19.8x |
| 20 | 301 | 30.1x |
| 25 | 477 | 47.7x |
| 30 | 756 | 75.6x |
| 35 | 949 | 94.9x |
| 40 | 1245 | 124.5x |
| 50 | 1854 | 185.4x |

**Note**: Total HP scales roughly quadratically due to both count and health increasing.

## Player Resources (Static)

- **Health**: 100 HP (fixed maximum)
- **Health Regeneration**: 1 HP per second when out of combat (no zombie damage for 5 seconds)
- **Health Pickups**: +25 HP every 15 seconds (if below max and health > 0)
- **Ammo**: Weapon-specific, limited per wave
  - Pistol: 10 rounds
  - Shotgun: 5 shells
  - Rifle: 30 rounds
- **No ammo pickups**: Ammo is finite per wave (must manage resources carefully)
- **Grenades**: Limited supply, powerful AOE damage

## Difficulty Balance Observations

### Strengths
✅ **Predictable scaling** - Players can anticipate difficulty
✅ **Multiple scaling factors** - Creates varied challenge
✅ **Health spikes** - Creates memorable difficulty moments
✅ **Speed scaling** - Forces movement skill improvement

### Potential Issues
⚠️ **No player power scaling** - Player doesn't get stronger
⚠️ **Limited resources** - No ammo pickups means resource scarcity
⚠️ **Exponential HP growth** - Late game becomes very difficult
⚠️ **No difficulty plateaus** - Constant increase may feel relentless

## Recommendations for Balance

### Current System Works Well For:
- Short to medium play sessions (waves 1-15)
- Skill-based progression
- High score chasing
- Learning curve

### Could Be Enhanced With:
- Ammo pickups from zombies (resource management)
- Player upgrades/perks (power scaling)
- Difficulty plateaus (waves 20, 30, etc. maintain difficulty)
- More boss variety (different boss types with unique mechanics)
- Health regeneration improvements (faster regen, regen upgrades)

**Note**: Boss waves are already implemented (every 5 waves), and health regeneration exists (1 HP/sec out of combat).

## Code References

### Base Zombie Stats
**Zombie Speed**: `js/entities/Zombie.js:21`
```javascript
this.speed = 1 + (gameState.wave * 0.1);
```

**Zombie Health**: `js/entities/Zombie.js:22`
```javascript
this.health = (2 + Math.floor(gameState.wave / 3)) * 2; // Doubled HP
```

**Zombie Count**: `js/main.js:784-892`
- Spawn function handles zombie count calculation
- Formula: `5 + (wave - 1) * 2`

### Special Zombie Modifiers
**Fast Zombie**: `js/entities/Zombie.js:400-401`
```javascript
this.speed *= 1.6; // 1.6x faster
this.health = Math.floor(this.health * 0.6); // 60% health
```

**Exploding Zombie**: `js/entities/Zombie.js:517-518`
```javascript
this.speed *= 0.9; // Slightly slower
this.health = Math.floor(this.health * 0.8); // 80% health
```

**Ghost Zombie**: `js/entities/Zombie.js:637-638`
```javascript
this.speed *= 1.3;
this.health = Math.floor(this.health * 0.8);
```

**Spitter Zombie**: `js/entities/Zombie.js:710-711`
```javascript
this.speed *= 1.2; // Fast to maintain distance
this.health = Math.floor(this.health * 0.8); // Lower health
```

**Armored Zombie**: `js/entities/Zombie.js:335-336`
```javascript
this.armor = 10 + Math.floor(gameState.wave * 1.5); // Armor scales with wave
this.speed *= 0.75; // Heavier, slower
```

**Boss Zombie**: `js/entities/BossZombie.js:12`
```javascript
this.maxHealth = 500 + (gameState.wave * 50); // Scales with wave
```

### Spawn Logic
**Zombie Spawning**: `js/main.js:784-892`
- Handles zombie count calculation
- Special zombie type selection based on wave and random chance
- Boss spawn every 5 waves

**Boss Spawning**: `js/main.js:751-782`
- Triggers every 5 waves (wave % 5 === 0)
- Spawns at top center of map

