# 🔫 Weapon System Documentation

## Overview

The zombie survival game features a weapon system with **8 unique firearms**, each with distinct characteristics designed for different combat situations. All weapons use weapon-specific ammo counters, persistent ammo tracking, and individual reload mechanics with background reload support.

---

## Available Weapons

### 1. **Pistol** 🎯
**Default Starting Weapon**

- **Damage**: `2` points per shot (doubled from 1)
- **Fire Rate**: `400ms` between shots (2.5 shots/second)
- **Ammo Capacity**: `10` rounds per magazine
- **Reload Time**: `1000ms` (1 second)
- **Fire Pattern**: Single bullet, precise
- **Trail Color**: Yellow (`#ffff00`)
- **Best For**: Balanced combat, conserving ammo, medium-range engagements

**Characteristics:**
- Most balanced weapon in terms of damage, fire rate, and ammo
- Moderate screen shake (3 units on shot)
- Standard muzzle flash effect
- Single bullet per click

---

### 2. **Shotgun** 💥
**High Damage, Spread Fire**

- **Damage**: `6` points per pellet × `5` pellets = **30 total damage potential** (doubled from 3 per pellet)
- **Fire Rate**: `800ms` between shots (1.25 shots/second)
- **Ammo Capacity**: `5` shells per magazine
- **Reload Time**: `1000ms` (1 second)
- **Fire Pattern**: **5 spread bullets** with random spread angle (0.5 radian spread)
- **Trail Color**: Orange (`#ff8c00`)
- **Best For**: Close-range combat, clearing groups, high burst damage

**Unique Mechanics:**
- Fires **5 bullets simultaneously** in a spread pattern
- Each pellet does `6` damage independently
- Spread angle: `±0.25 radians` (approximately ±14.3 degrees from center)
- Lower ammo capacity but devastating up close
- All pellets can hit the same target for maximum damage

---

### 3. **Rifle** ⚡
**High Rate of Fire**

- **Damage**: `4` points per shot (doubled from 2)
- **Fire Rate**: `200ms` between shots (5 shots/second)
- **Ammo Capacity**: `30` rounds per magazine
- **Reload Time**: `1000ms` (1 second)
- **Fire Pattern**: Single bullet, rapid fire
- **Trail Color**: Light Blue (`#88ccff`)
- **Best For**: Sustained fire, long-range precision, high-volume combat

**Characteristics:**
- High fire rate for sustained DPS
- Largest magazine capacity (30 rounds)
- Slightly higher damage than pistol but less than shotgun per shot
- Best for sustained engagements and clearing waves

---

### 4. **Flamethrower** 🔥
**Short-Range, High Fire Rate**

- **Damage**: `1.0` points per tick (doubled from 0.5, damage over time)
- **Fire Rate**: `50ms` between shots (20 shots/second)
- **Ammo Capacity**: `100` rounds per tank
- **Reload Time**: `2000ms` (2 seconds)
- **Range**: `200px` (short range)
- **Fire Pattern**: **3 flame particles** with spread pattern
- **Trail Color**: Red-orange (`#ff5722`)
- **Best For**: Close-range crowd control, applying burn effects, sustained damage

**Unique Mechanics:**
- Fires **3 flame particles** simultaneously with spread
- Applies **burn effect**: Zombies take damage over time (3 seconds)
- Burn damage: `bullet.damage * 2` over time
- Very high fire rate compensates for low per-tick damage
- Short range requires close positioning

---

### 5. **SMG** 🔫
**Fast Fire Rate, High Ammo**

- **Damage**: `1.6` points per shot (doubled from 0.8)
- **Fire Rate**: `80ms` between shots (12.5 shots/second)
- **Ammo Capacity**: `40` rounds per magazine
- **Reload Time**: `1200ms` (1.2 seconds)
- **Fire Pattern**: Single bullet with slight spread (0.1 radian)
- **Trail Color**: Warm Yellow (`#ffe066`)
- **Best For**: Aggressive close-to-mid range, sustained fire, ammo-efficient combat

**Unique Mechanics:**
- Fastest fire rate of all standard bullet weapons
- Slight random spread per shot (less than shotgun, more than rifle)
- 40-round magazine allows long sustained engagements
- Slightly slower reload than pistol (1.2s vs 1.0s)
- Higher total magazine damage than rifle (64 vs 120) but with spread tradeoff

---

### 6. **Sniper** 🎯
**High Damage, Piercing Rounds**

- **Damage**: `30` points per shot (doubled from 15)
- **Fire Rate**: `1500ms` between shots (0.67 shots/second)
- **Ammo Capacity**: `5` rounds per magazine
- **Reload Time**: `2500ms` (2.5 seconds)
- **Fire Pattern**: Single piercing bullet that passes through up to 3 enemies
- **Trail Color**: Cyan (`#00e5ff`)
- **Best For**: Long-range precision, lining up multiple zombies, high-value targets

**Unique Mechanics:**
- **Piercing rounds**: Bullet passes through up to **3 zombies** before disappearing
- Extremely high per-shot damage (30 per hit)
- Very fast bullet speed (25 px/frame vs standard 12 px/frame)
- Long max range (2000px vs standard 1000px)
- Slowest fire rate and reload of all weapons
- 5-round magazine requires careful shot placement

---

### 7. **RPG** 🚀
**Explosive Area Damage**

- **Damage**: `0` direct impact (damage comes from explosion)
- **Explosion Damage**: `120` points at epicenter (doubled from 60), falls off with distance
- **Explosion Radius**: `150px`
- **Fire Rate**: `2000ms` between shots (0.5 shots/second)
- **Ammo Capacity**: `3` rockets per magazine
- **Reload Time**: `3000ms` (3 seconds)
- **Fire Pattern**: Accelerating rocket projectile with smoke/flame trail
- **Trail Color**: N/A (rocket has custom sprite rendering)
- **Best For**: Crowd control, boss damage, clearing dense zombie clusters

**Unique Mechanics:**
- Rocket **accelerates** from 2 px/frame to 15 px/frame
- Creates a massive explosion on impact or at max range
- Explosion damage decreases linearly with distance (50%-100% of 120)
- Detailed visual rendering: body gradient, warhead cone, fins, engine glow
- Smoke and flame particle trail follows rocket
- Explodes on canvas boundary in non-arcade modes
- Screen shake on explosion (15+ units based on size)

---

### 8. **Laser Gun** ⚡
**Instant Raycast, High Sustained DPS**

- **Damage**: `3` points per hit (rebalanced from 5 for balance)
- **Fire Rate**: `60ms` between shots (16.7 shots/second)
- **Ammo Capacity**: `60` rounds per magazine
- **Reload Time**: `1500ms` (1.5 seconds)
- **Range**: `800px` (instant raycast, no travel time)
- **Fire Pattern**: Instant raycast beam with visual laser
- **Trail Color**: Neon Pink (`#ff0055`)
- **Best For**: Sustained damage, precision targeting, no bullet travel time

**Unique Mechanics:**
- **Instant hit**: No bullet travel time — damage applies immediately via raycast
- Raycast checks all zombies along beam path, hits closest one
- Visual beam rendered as `LaserBeam` entity (fades over ~7 frames)
- Inner white core + colored outer glow + impact flare at hit point
- No shell casings ejected (unlike all other weapons)
- Beam visual is separate from damage logic (`laser_visual` vs `laser_hit` types)
- Highest sustained DPS among standard weapons (~50 DPS)

---

## Weapon Statistics Comparison

| Weapon | Damage | Fire Rate | Ammo | Reload | DPS* | Total Damage/Mag |
|--------|--------|-----------|------|--------|------|------------------|
| **Pistol** | 2 | 400ms | 10 | 1000ms | 5.0 | 20 |
| **Shotgun** | 6×5 | 800ms | 5 | 1000ms | ~37.5 | 150 (ideal) |
| **Rifle** | 4 | 200ms | 30 | 1000ms | 20.0 | 120 |
| **Flamethrower** | 1.0×3 | 50ms | 100 | 2000ms | ~60 | 300 (plus burn DoT) |
| **SMG** | 1.6 | 80ms | 40 | 1200ms | 20.0 | 64 |
| **Sniper** | 30 | 1500ms | 5 | 2500ms | 20.0 | 150 (×3 piercing) |
| **RPG** | 120 AOE | 2000ms | 3 | 3000ms | ~60 | 360 (AOE) |
| **Laser Gun** | 3 | 60ms | 60 | 1500ms | 50.0 | 180 |

*DPS calculated assuming all shots hit and accounting for fire rate only (not reload time)
*Flamethrower DPS includes burn damage over time
*Sniper DPS multiplied by piercing potential (up to 3×)
*RPG DPS assumes explosion hits at least one zombie

---

## Controls

### Weapon Switching
- **Press `1`**: Switch to Pistol
- **Press `2`**: Switch to Shotgun  
- **Press `3`**: Switch to Rifle
- **Press `4`**: Switch to Flamethrower
- **Press `5`**: Switch to SMG
- **Press `6`**: Switch to Sniper
- **Press `7`**: Switch to RPG
- **Press `8`**: Switch to Laser Gun
- **Scroll Wheel** (Up/Down): Cycle through weapons (toggleable in Settings)

**Switching Behavior:**
- Switching weapons **cancels any ongoing reload**
- Fire rate cooldown is **reset** when switching
- **Persistent Ammo**: Each weapon maintains its own ammo state that persists when switched away
- **Background Reload**: If a weapon is holstered for longer than its reload time, it automatically reloads
  - When switching back, weapon is fully loaded if enough time has passed
  - Otherwise, weapon restores its previous ammo count
- Scroll wheel switching can be enabled/disabled in Settings > Controls

### Shooting
- **Left Click**: Fire weapon
- **Auto-reload on empty**: Automatically begins reloading immediately when ammo reaches 0
- Respects fire rate cooldown (can't spam click)
- Shooting is blocked during reload animation

### Reloading
- **Press `R`**: Manual reload (when game is running)
- **Auto-reload on empty**: Automatically triggers immediately when ammo reaches 0 after a shot
- **Background reload**: Weapons automatically reload when holstered for >= reload time
- **Reload Blocking**: Cannot fire while reloading
- Each weapon has independent reload timing

**Reload Mechanics:**
- Reload cannot be interrupted by shooting (will queue reload)
- All weapons have 1 second (1000ms) reload time (Flamethrower: 2 seconds)
- Ammo refills to full capacity after reload completes
- HUD shows "Reloading..." during reload animation
- Reload can be cancelled by switching weapons
- **Tactical switching**: Switch to another weapon during reload downtime to allow background reload

---

## Bullet System

### Bullet Properties
```javascript
{
    radius: 3 pixels,
    speed: 12 pixels/frame (Sniper: 25, Rocket: 2→15 accelerating),
    damage: (weapon-specific),
    color: (weapon-specific trail color),
    collision: circle-based (3px radius)
}
```

### Bullet Behavior
- Bullets travel at **12 pixels per frame** in the direction of the mouse cursor (weapon-specific speeds vary)
- **Spawn position**: Slightly ahead of player (1.8× player radius)
- Bullets retain weapon damage values from when they were fired
- Bullets despawn on collision with zombies or when leaving screen bounds
- **Weapon-specific trail colors**: Each weapon has a unique bullet trail color for visual distinction

### Shotgun Spread Mechanics
- **Shotgun fires 5 bullets per shot**
- Spread angle: `angle ± (random - 0.5) × 0.5 radians`
- Each bullet can independently hit and damage zombies
- Spread pattern creates a cone of fire
- Maximum theoretical damage: 30 (if all 5 pellets hit same target, doubled from 15)

---

## Visual Effects

### Muzzle Flash
- Triggers on every shot at gun position
- Visual intensity fades over `5 frames`
- Positioned at gun barrel (1.8× player radius from center)
- Directional based on shooting angle
- **Weapon-specific colors**: Each weapon has unique flash color palette (core/mid/outer RGB layers)
  - Pistol: white/yellow, Shotgun: orange, Rifle: blue-white, Sniper: cyan, Laser: pink-red

### Screen Shake
- **Shooting**: `3 units` of shake
- **Taking Damage**: `8 units` of shake
- Decay rate: `0.9` per frame
- Provides tactile feedback for weapon impact

### Blood Splatter
- Triggered on zombie hit/kill
- **On Hit**: 5 blood particles
- **On Kill**: 12 blood particles + 3 ground patches
- Directional splatter based on bullet impact angle
- Blood particles have longer lifetime on kills (40 frames vs 25)

---

## Audio Effects

### Gunshot Sounds
- Unique sound generated per weapon type using Web Audio API
- Played on every shot
- Sound characteristics vary by weapon (pitch/tone)

### Reload Sounds
- Reload audio can be implemented (currently placeholder)

---

## Combat Strategy Tips

### Pistol Strategy
- **Best for**: Starting weapon, balanced playstyle
- Use for precise single-target elimination
- Good ammo economy with moderate damage
- Switch when low on ammo mid-battle

### Shotgun Strategy
- **Best for**: Close-range crowd control
- Position yourself in close-quarters for maximum effect
- 5 pellets = higher chance to hit fast-moving targets
- Limited ammo means make every shot count
- Ideal for tight spaces and zombie clusters

### Rifle Strategy
- **Best for**: Sustained fire and wave clearing
- High ammo count allows extended engagements
- Rapid fire compensates for lower per-shot damage
- Switch during reload downtime of other weapons
- Best DPS for sustained combat

---

## Technical Implementation

### Weapon Object Structure
```javascript
{
    name: String,
    damage: Number,
    fireRate: Number (milliseconds),
    ammo: Number,
    maxAmmo: Number,
    reloadTime: Number (milliseconds)
}
```

### Ammo System
- Each weapon maintains independent ammo count
- `currentAmmo` tracks remaining rounds
- `maxAmmo` defined per weapon
- **Persistent ammo tracking**: `player.weaponStates` map stores ammo and holster time for each weapon
- Switching weapons preserves ammo state (each weapon has its own)
- **Background reload**: Weapons auto-reload when holstered for >= reload time
- **Auto-reload on empty**: Triggers immediately when ammo depletes to 0

### Fire Rate System
- `lastShotTime` tracks timestamp of last shot
- Shooting blocked if `(currentTime - lastShotTime) < fireRate`
- Fire rate cooldown resets on weapon switch
- Applies globally to all weapons

### Reload System
- `isReloading` boolean flag
- `reloadStartTime` timestamp for reload duration
- Reload completes when `(currentTime - reloadStartTime) >= reloadTime`
- **Auto-reload on empty**: Triggers immediately when `currentAmmo` reaches 0 after a shot
- **Background reload**: When switching weapons, checks if `(now - lastHolsteredTime) >= reloadTime`
  - If true: Weapon auto-reloaded, restore max ammo
  - If false: Restore saved ammo count
- Weapon state synced when reload completes (updates `weaponStates` map)

---

## Code References

### Weapon Definitions
```62:87:zombie-game.html
const weapons = {
    pistol: { /* ... */ },
    shotgun: { /* ... */ },
    rifle: { /* ... */ }
};
```

### Shooting Logic
```775:829:zombie-game.html
function shootBullet() { /* ... */ }
```

### Weapon Switching
```839:847:zombie-game.html
function switchWeapon(weapon) { /* ... */ }
```

### Reload Function
```831:837:zombie-game.html
function reloadWeapon() { /* ... */ }
```

---

## Melee Attack System

### Overview
A close-range melee attack system that provides a fallback option when out of ammo or for close-quarters combat.

### Controls
- **V Key**: Perform melee attack
- **Right Mouse Button**: Alternative melee input

### Mechanics
- **Damage**: 3 points per hit
- **Range**: 40 pixels (melee arc)
- **Cooldown**: 500ms between attacks
- **Arc**: 120-degree arc in front of player
- **Animation**: Right-to-left swipe animation (200ms duration)

### Visual Effects
- Orange swipe arc animation (#ffaa00)
- Glowing swipe trail with shadow effects
- Screen shake on hit (5 units) or miss (2 units)
- Particle effects on successful hits
- Blood splatter on zombie hits/kills

### Strategy
- Useful when out of ammo or reloading
- High damage but requires close range
- Can hit multiple zombies in arc
- Cooldown prevents spam

---

## Advanced Features

### Persistent Ammo System
- Each weapon maintains its own ammo state in `player.weaponStates` map
- Ammo count persists when switching weapons (no longer resets to full)
- Structure: `{ ammo: number, lastHolsteredTime: timestamp }`
- Enables tactical weapon management and ammo conservation

### Background Reload System
- Weapons automatically reload when holstered for >= reload time
- When switching back to a weapon:
  - If holstered long enough: Weapon is fully loaded (background reload completed)
  - If not enough time: Weapon restores its previous ammo count
- Encourages strategic weapon switching during reload downtime
- Example: Switch to Pistol while Shotgun reloads, then switch back to fully loaded Shotgun

### Auto-Reload on Empty
- Automatically triggers reload immediately when ammo reaches 0 after a shot
- No need to manually press reload when clip is empty
- Seamless combat flow during intense firefights
- Works in conjunction with background reload for optimal weapon management

### Scroll Wheel Weapon Switching
- Cycle weapons using mouse scroll wheel (up/down)
- Toggleable in Settings > Controls (enabled by default)
- Only active during gameplay (disabled in menus/pause)
- Provides quick weapon access during combat

---

## Future Enhancement Ideas

- [ ] Weapon upgrades/perks system
- [x] Additional weapon types (SMG, Sniper, RPG, Laser Gun — all implemented)
- [ ] Weapon pickups from defeated zombies
- [x] Ammo drops/pickups (implemented)
- [ ] Weapon attachments (scopes, silencers, extended mags)
- [ ] Alternative fire modes (burst, full-auto toggle)
- [ ] Weapon durability/wear system
- [ ] Reload animations/UI feedback
- [x] Weapon-specific audio effects differentiation (RPG has unique sound)
- [x] Weapon-specific muzzle flash colors (implemented — per-weapon RGB palettes)
- [x] Weapon-specific bullet trail colors (implemented)
- [ ] Melee weapon variety (knife, bat, machete)
- [ ] Crossbow weapon (silent, piercing bolts)
- [ ] Tesla Gun (chain lightning)
- [ ] Freeze Ray (slow effect)

---

*Last Updated: Based on current game implementation*

