# Project Summary

## Overview
A 2D top-down zombie survival game built with vanilla HTML5 Canvas and JavaScript. Features wave-based gameplay, smooth controls, and visual effects.

## Current Status
**Release: V0.8.4 ALPHA (2026-06-25)** — *The Chaos & Horde Update*. Wave Chaos mutators, Scrap Shop shrine + kill-drop economy, zombie torso overlays + organic motion, MP3 gameplay soundtrack (intensity scaling), controls moved to Settings → Controls (in-game overlay removed), Phase 4 `GameLoopSystem` refactor, mobile touch gate fix. Player-facing modality: `NEWS_UPDATES` news reel, landing version bubbles (9 items), itch V0.8.4 section.

✅ **Scrap Shop — Wave-Break Shrine (2026-06-25)** — Spend session scrap during wave breaks (45% spawn after wave 4). Random offer per shrine: Ammo Cache (20), Armor Plate (30), Overclock (40). **E** to buy near pedestal; tooltip prompt; shrine clears on purchase or next wave. Files: `js/entities/ScrapShrine.js`, `js/systems/ScrapShopSystem.js`.
✅ **Zombie Visual Polish — Torso Overlays + Organic Motion (2026-06-25)** — Procedural additive torso overlays (`goreWetness`, `decayMold`, `tornRemnants`, `infectionPulse`, `slimeFilm`) on upright zombie types; gaze-tracking eyes; velocity lean/bob; cosmetic micro-behaviors (`lurch`/`stagger`/`hesitate`/`reach`); hit recoil flash; per-type motion profiles (fast/armored/exploding/spitter). All cosmetic — no combat or multiplayer packet changes. Key file: `js/entities/Zombie.js`.
✅ **Phase 4 Refactor — GameLoopSystem + Combat Split (2026-06-25)** — `updateGame()` / `drawGame()` extracted to `js/systems/GameLoopSystem.js` (~715 lines). Bullet–zombie collision handler moved to `js/utils/bulletZombieCollisions.js` (~550 lines). `main.js` ~1,183 lines (was ~1,977 pre-Phase-4); `combatUtils.js` ~887 lines (was ~1,417). Shared helpers in `gameUtils.js`: `isSinglePlayerArcadeMode()`, `isGameplayBlocked()`, `isMobileDevice()`, UI overlay gates. Scrap magnetic update in `PickupSpawnSystem.updateScrapPickups()`. Touch controls gated to mobile UA only (fixes desktop overlay on touch-capable PCs).
✅ **Wave Chaos Escalation (2026-06-25)** — Dynamic wave breaks, scaled spawn stagger/bursts, five wave mutators (SWARM/ELITES/VOLATILE/ENCIRCLE/RUSH), boss minions, music intensity scaling via `WaveChaosSystem` + `GameLoopSystem._updateMusicIntensity()`.
✅ **Scavenger Update — Scrap System (2026-06-25)** — Scrap drops from zombie deaths (bosses 100%, regular 20%). `ScrapPickup` entity with bronze glint + magnetic pull (250px). Collected via `handlePickupCollisions`; session `scrapCollected` + per-player `scrap` in `gameState`. HUD scrap stat on desktop bottom bar and mobile sidebar. Files: `js/entities/ScrapPickup.js`, `js/systems/PickupSpawnSystem.js`, `js/utils/bulletZombieCollisions.js`, `js/ui/GameHUD.js`.
✅ **In-game MP3 soundtrack (2026-06-25)** — Gameplay uses a two-track MP3 playlist (mountain + viacheslavstarostin); menu uses `Shadows of the Wasteland`. Procedural `ArcadeMusicSystem` no longer drives gameplay. Startup deferrals reduce index load hitch; flashlight lazy-init guard fixes black-screen crash.
✅ **Itch.io HTML build (2026-04-06)** - Verified working on itch after fixing Windows zip entry paths. **Always** run `ITCH/build-itch.ps1` from repo root; it enforces forward-slash paths and required files (build fails otherwise). See `ITCH/DOCS/ITCH_IO_GUIDE.md` and `DOCS/VERSION_UPDATE_CHECKLIST.md` § Itch.io.
✅ **Playable** - Core gameplay loop is functional
✅ **Visual Polish** - Screen shake, muzzle flash, blood splatter, particles, damage indicators, bullet trails
✅ **Explosion Effects** - Grenade and rocket explosions with particle trails (Fixed 2025-11-24)
✅ **Audio System** - Advanced Web Audio API implementation
  - **In-Game Music**: Two-track MP3 playlist (loops track A → B → A) with pause/resume; replaces procedural arcade oscillators
  - **Menu Music**: `Shadows of the Wasteland.mp3` (loop)
  - **Granular Mixer**: Independent volume controls for Master, Music, SFX, Footsteps, Gunshots, Hit Markers, and Multipliers
  - **High-Fidelity SFX**: Multi-layered visceral impacts, noise-based "ticks", crystal shimmer multipliers, and **Laser "Zaps"**
  - **UI Sound**: Procedural "Pip" (click) and "Tick" (hover) sounds for full menu feedback
  - **Interactive**: Fully adjustable via the in-game Settings Panel
✅ **Responsive HUD** - High-fidelity "Glass Tech" interface
  - **Stacked Design**: High-density info boxes separating labels from values (no text overlap)
  - **Visual Dynamics**: Vertical color-coded accent bars and glowing status indicators
  - **Consistent Layout**: Unified 50px height for all bottom-UI elements (XP, Stats, Weapons)
  - **Scrap Counter**: Bronze/silver/gold accent stat showing per-run scrap total (desktop + mobile)
✅ **Homepage Theme** - Landing page now defaults to **Dark Mode** with optimized early loading (anti-FOUC)
✅ **Weapon System** - 8 weapon slots (Pistol, Shotgun, Rifle, Flamethrower, SMG, Sniper, RPG, **Laser**)
✅ **Ammo System** - Limited ammo, reloading, weapon-specific ammo counts, persistent ammo tracking
✅ **Weapon Controls** - Keyboard switching (1-8) and scroll wheel cycling (toggleable)
✅ **Background Reload** - Weapons auto-reload when holstered long enough
✅ **Auto-Reload** - Automatic reload when ammo reaches 0
✅ **UI Systems** - In-game HUD component with pause menu and game over screens
  - Reorganized HUD layout: Skills (bottom left), XP bar (bottom middle), Weapon info (bottom right)
  - XP progress bar showing level and XP with green gradient fill
  - Active skills display showing collected skills with icons and levels
  - Enhanced keybind instructions showing all 8 weapons and sprint
✅ **Interactive Pause Menu** - Clickable buttons (Resume, Restart, Settings, Return to Menu) with hover effects
✅ **Custom Cursor System** - Custom drawn cursor for all menus and pause screen with automatic system cursor hiding
✅ **Multiplayer Lobby** - Modern glassmorphism lobby with animated background, player cards, and enhanced UI
✅ **Leader System** - First player designated as lobby leader with game start control
✅ **Ready System** - Players can toggle ready status; all must be ready to start
✅ **Synchronized Game Start** - All players enter game simultaneously in same session
✅ **News Ticker** - Scrolling announcement bar on main menu displaying version highlights
✅ **Gallery Screen** - Full showcase gallery displaying zombies, weapons, and pickups
  - Gallery button on main menu (row 4)
  - Three sections: Zombies (7 types), Weapons (8 types), Pickups (8 types)
  - Visual icons with stats, descriptions, and animations
  - Card-based layout with scrolling support
  - Glassmorphism styling matching lobby design
✅ **Local Scoreboard System** - Top 10 scoreboard on HTML landing page
  - Displays top 10 game sessions sorted by score
  - Shows: Score, Wave, Kills, Time Survived, Max Multiplier, Username, Date/Time
  - Only saves entries that qualify for top 10
  - Floating glassmorphism container with responsive layout
  - Special styling for top 3 entries (gold/silver/bronze)
  - Automatic saving on game over for qualifying sessions
  - Time and date formatting with relative timestamps

✅ **Global Highscore Leaderboard System** - Server-side global score tracking
  - MongoDB persistence for top 10 global scores (graceful fallback to in-memory if unavailable)
  - HTTP API endpoints: `GET /api/highscores`, `POST /api/highscore`
  - Socket.IO real-time score submission and leaderboard updates
  - Automatic score submission on game over (Socket.IO or HTTP fallback)
  - Global leaderboard display on main menu (top 10 with rank, username, score, wave)
  - Player score highlighting when in top 10
  - Auto-refresh when entering main menu (throttled to 30 seconds)
  - Real-time leaderboard updates via Socket.IO when top 10 changes
  - **10-second timeout handling** with error state tracking
  - **LocalStorage fallback** when server unavailable (shows local high score)
  - **Timeout message display**: "Highscore server wasn't reached" with fallback info
  - **Empty leaderboard message**: Shows "Nobody yet!" when leaderboard is empty
  - **In-memory caching**: Backend uses cache for instant API responses (no DB query per request)
  - **Asynchronous MongoDB saving**: Non-blocking database writes prevent API delays
  - **Fixed infinite retry loop**: Proper cooldown enforcement prevents 429 errors
  - **Retry countdown display**: Shows "Retrying in X seconds..." for better user feedback
✅ **Multiplayer Rank Display** - Rank badges in multiplayer lobby
  - Player cards display rank name and tier (e.g., "Private T1", "Corporal T3")
  - Orange/amber color scheme matching game aesthetic
  - Rank data synchronized from client to server on player registration
  - Server tracks and broadcasts rank information in lobby updates
  - Server status page displays rank information for connected players
  - Non-blocking score submission (doesn't delay game over screen)
✅ **Multiplayer Lobby Chat System** - Real-time chat for player communication
  - Chat window in lobby (bottom-left, glassmorphism styling)
  - Scrollable message list with word wrapping
  - Character counter (200 char limit) and input field with focus state
  - Rate limiting: 5 messages per 10 seconds per player
  - Message sanitization: HTML entity encoding, XSS prevention
  - Socket.IO real-time message broadcasting
  - Enter to send, Escape to clear, click to focus/unfocus
  - Disabled during game start countdown
  - System message support for future join/leave notifications
✅ **Modular Architecture** - ES6 modules with organized file structure
✅ **System Refactoring** - Large systems extracted from main.js into dedicated modules
  - **Phase 4 (2026-06-25)**: `GameLoopSystem` — per-frame update + render (~715 lines); `bulletZombieCollisions.js` — bullet–zombie quadtree collisions (~550 lines)
  - ZombieUpdateSystem: Zombie AI, multiplayer sync, interpolation (~173 lines extracted)
  - EntityRenderSystem: Entity rendering with viewport culling (~102 lines extracted)
  - PickupSpawnSystem: Pickup spawning + scrap magnetic update
  - MultiplayerSystem: Multiplayer networking, player sync, zombie sync (~545 lines extracted)
  - ZombieSpawnSystem: Zombie and boss spawning logic (~155 lines extracted)
  - PlayerSystem: Player updates, rendering, co-op lobby (~520 lines extracted)
  - GameStateManager: Game lifecycle (start, restart, game over) (~83 lines extracted)
  - MeleeSystem: Melee attack logic and range checking (~131 lines extracted)
  - drawingUtils: Drawing utilities (crosshair, wave UI, FPS counter) (~263 lines extracted)
  - main.js reduced from ~2,536 → ~1,183 lines (cumulative ~53% reduction)
✅ **Power-ups** - Double damage buff and nuke pickup system
✅ **Kill Streaks** - Combo tracking with visual feedback
✅ **Enemy Variety** - 8 zombie types (Normal, Fast, Exploding, Armored, Ghost, Spitter, Flying, Crawler)
✅ **Day/Night Cycle** - Dynamic time-based atmosphere with difficulty scaling
✅ **Flamethrower Weapon** - Short-range weapon with burning damage over time
✅ **Environmental Hazards** - Acid pools from Spitter Zombie attacks
✅ **Performance Optimizations** - Comprehensive rendering performance improvements (V0.5.0+)
  - RenderingCache system for intelligent gradient/pattern caching
  - Viewport culling for efficient entity rendering
  - Update culling (skip updating entities far off-screen) - 40-60% FPS win
  - Small feature culling (skip rendering entities <1px)
  - WebGPU optimizations (dirty flags, buffer management)
  - Particle system optimization with improved update loops
  - Entity loop optimization (forEach → for loops)
  - Squared distance calculations (eliminates sqrt in hot paths)
  - Off-screen indicator distance optimizations
  - 30-50% FPS improvement on Canvas 2D, 20-40% on WebGPU, 40-60% with update culling
✅ **Memory Allocation Optimizations (V0.8.2.0)** - Zero-allocation hot paths
  - In-place array compaction: ~95% reduction in array allocations in entity loops
  - Double-buffered blood simulation: 50-70% faster, zero per-frame allocation
  - Batched particle rendering: 30-50% faster at minimal/standard quality, ~80% fewer draw calls
  - Particle system in-place compaction: Zero allocation per frame
  - Overall GC pressure significantly reduced
  - 10-20% additional FPS improvement on low-end hardware
✅ **Engine Micro-Optimizations** - 15 small performance improvements (V0.5.2)
  - Math.sqrt() elimination (26+ locations) - squared distance comparisons
  - forEach() to for loops in hot paths (5-10% faster iteration)
  - Quadtree instance reuse (reduces GC pressure)
  - Settings lookup caching (reduces repeated property access)
  - Viewport bounds caching (calculated once per frame)
  - Property caching in loops (faster iterations)
  - Early return optimizations (skips unnecessary work)
  - Math constants caching (TWO_PI)
  - Expected 5-15% additional FPS improvement on low-end hardware
✅ **Enhanced Graphics Quality System** - Quality presets affect all visual effects (V0.5.1)
  - Ultra quality preset added (50k particles, 1.25x resolution, advanced lighting)
  - Three new graphics settings: Effect Intensity, Post-Processing Quality, Particle Detail
  - Quality-scaled visual effects: zombie glows, auras, muzzle flashes, explosions, blood splatter, damage numbers
  - Quality multipliers system for consistent scaling across all effects
✅ **Multiplayer Speed Sync & Engine Optimizations** - Complete multiplayer synchronization improvements (V0.5.1)
  - Zombie speed synchronization prevents position desync from modifiers
  - Delta compression reduces network bandwidth by 50-80% for large hordes
  - Adaptive update rate (5-20Hz) based on zombie count and network latency
  - Advanced interpolation (adaptive lerp + velocity extrapolation) reduces jitter by 60-80%
  - Socket.IO binary add-ons (bufferutil, utf-8-validate) reduce CPU by 10-20%
  - Latency measurement with exponential moving average for adaptive adjustments
  - Velocity tracking for smooth movement prediction between network updates
✅ **UI Scaling System** - Complete UI scaling support (50%-150%) for accessibility (V0.5.2+)
  - Scales all UI elements: fonts, buttons, panels, spacing, padding
  - Applied to both in-game HUD and settings menu
  - All fonts now properly scale (buttons, menus, lobbies, about screen) - V0.5.3 fix
  - Settings panel header/tab layout scales fluidly - V0.5.3 fix
  - UI scale preset buttons (Small 70%, Medium 100%, Large 130%) in settings
  - Real-time scaling with immediate visual feedback
  - Consistent scaling pattern: `Math.max(minSize, baseSize * scale)`
  - Dynamic viewport calculations based on scaled element heights
  - News ticker font reduced to 85% size to fit more content
  - **Font Size Verification Complete** - All hardcoded font sizes fixed (V0.7.0+)
    - Fixed 20+ hardcoded font sizes across GameHUD, SettingsPanel, BossHealthBar
    - All fonts now connect to UI Scale setting (0.5-1.5)
    - All fonts connect to Text Rendering Quality setting (low/medium/high)
    - Text rendering quality applies to all screen contexts (Profile, Achievement, Battlepass screens)
    - Consistent scaling pattern with minimum sizes for readability
✅ **Visual Settings Enhancements** - Comprehensive visual customization options
  - **Text Rendering Quality**: Global control over font smoothing (low, medium, high)
  - **Rank Badge Settings**: Show/hide toggle and size control (small, normal, large)
  - **Crosshair Customization**: Color picker, size slider (0.5x-2.0x), opacity slider (0.0-1.0)
  - **Enemy Health Bar Styles**: Three visual styles (gradient, solid, simple)
  - All settings apply in real-time with immediate visual feedback
  - Settings organized in logical sections (UI ELEMENTS, CROSSHAIR, etc.)
  - All settings persist across game sessions via localStorage
✅ **Skill System Expansion** - 10 new basic skills added with full effect integration
  - Total skills now: 16 (6 original + 10 new)
  - New skills: Thick Skin, Lucky Strike, Quick Hands, Scavenger, Adrenaline, Armor Plating, Long Range, Fast Fingers, Bloodlust, Steady Aim
  - All skills have proper icons, descriptions, and functional effects
  - Skills integrated into combat system, player movement, pickup spawning, and bullet mechanics
✅ **3-Choice Level-Up System** - Expanded skill selection screen
  - Level-up now shows 3 skill choices instead of 2
  - Updated UI layout and click detection for 3 cards
  - More strategic choices per level-up
✅ **XP System Balance** - Balanced XP values and linear progression
  - Normal: 7 XP, Fast: 14 XP, Exploding: 21 XP, Armored: 16 XP, Ghost: 24 XP, Spitter: 21 XP, Boss: 338 XP (10% reduction from previous)
  - Linear progression: +20 XP per level (100, 120, 140, 160...)
  - XP bar now properly resets to 0 after each level-up
  - Provides steady, predictable progression
✅ **Permanent Rank & Progression System** - Long-term progression that persists across all game sessions
  - **Rank System**: 9 ranks (Private → Legend) with 5 tiers per rank
  - Rank XP accumulates from session score (1 score = 0.1 rank XP) and wave completion bonuses
  - Rank badge displayed on main menu next to username
  - Rank progress bar and full rank display on profile screen
  - Rank XP and rank-up notifications on game over screen
✅ **Achievement System** - 30+ unlockable achievements across 5 categories
  - Categories: Combat, Survival, Collection, Skill, Social
  - Achievement unlock notifications during gameplay (non-intrusive popup)
  - Achievement gallery screen with category filtering and progress tracking
  - Rank XP rewards (100-10,000 XP) and unlockable titles
  - Progress bars for locked achievements showing completion percentage
✅ **Badge System** - Simple visual collectibles separate from achievements
  - 6 starter badges: Rank 2, First Kill, Profile Visitor, First Game, Wave 5, Kill 10
  - Badge bar in profile showing up to 3 most recent unlocked badges
  - Badge gallery screen with statistics and grid layout
  - Automatic badge unlocking when requirements are met
  - Profile visit tracking for "Self Aware" badge
  - Dossier theme styling matching profile screen
✅ **Battlepass/Expansion System** - Seasonal progression track with 50 tiers (overhauled)
  - Season 2: Dead Zone (full-year 2026 season) — Season 1: Outbreak (legacy)
  - Free track available to all players; premium track gated by `hasPremium` flag
  - Battlepass XP from match completion (score/100 + wave×10 + 25 base), daily/weekly challenges
  - Reward claim system — rankXP, titles, and emblems auto-claimed on tier unlock via `claimTierReward()`
  - Expanded challenge pool: 15 daily (kills, score, pickups, headshots, killstreaks, waves) + 9 weekly
  - Horizontal scrollable tier track with reward previews, claim buttons, and claimed state
  - Progress bar showing current tier and XP (handles max tier gracefully)
  - Season information display (name, days remaining / season ended)
  - Game over screen shows battlepass XP gained, tier-ups, and claimed rewards
  - Fisher-Yates unbiased challenge randomization
  - Profile migration for new fields (`claimedTiers`, `hasPremium`, `gamesPlayedThisWeek`)
✅ **Enhanced Player Profile System** - Comprehensive player data management
  - Persistent player profile stored in localStorage
  - Unique player ID generation
  - Username and title display (titles unlocked from achievements)
  - Comprehensive statistics tracking (games, kills, waves, time, records, specialized stats)
  - Profile screen showing rank, stats, achievements, badge bar, and battlepass summary
  - Automatic profile migration from existing username/high score data
✅ **New UI Screens** - Four new full-screen interfaces
  - Profile Screen: Player stats, rank display, badge bar, achievement summary, battlepass summary
  - Achievement Screen: Grid layout with category filtering, progress tracking, unlock dates
  - Badge Screen: Badge gallery with statistics, grid layout, locked/unlocked states
  - Battlepass Screen: Horizontal tier track, progress bar, season info, challenge list
  - All screens support UI scaling (50%-150%) and scrollable interfaces

## Technology Stack
- **Frontend**: HTML5 Canvas, Vanilla JavaScript (ES6 Modules)
- **Styling**: CSS3 with gradients and animations
- **Fonts**: Google Fonts (Creepster, Roboto Mono)
- **Backend**: Node.js + Express + socket.io (for multiplayer)
- **Mobile**: Capacitor WebView wrapper (Android)

## File Structure
[AMENDED 2026-04-06]: Entry names below reflect the v0.8.3.7 restructure (game vs landing).
```
ZOMBOBS - ZOMBIE APOCALYPSE WITH FRIENDS/
├── index.html                    # Game entry (itch.io embed, direct play)
├── landing.html                  # Marketing / scoreboard landing (local server default)
├── launch.bat                    # Windows launcher (calls PowerShell)
├── launch.ps1                    # Styled PowerShell server launcher
├── assets/
│   └── zombie.png                # Zombie sprite asset
├── css/
│   └── style.css                 # Game styles
├── js/
│   ├── main.js                   # Init, input events, menu actions, engine wiring (~1,183 lines)
│   ├── core/
│   │   ├── constants.js          # Game constants and configuration
│   │   ├── canvas.js             # Canvas initialization and management
│   │   ├── gameState.js          # Centralized game state management
│   ├── companions/
│   │   └── CompanionSystem.js   # AI NPC companion behavior and lifecycle
│   ├── entities/
│   │   ├── Bullet.js             # Bullet and FlameBullet projectile classes
│   │   ├── Zombie.js             # Zombie classes (Normal, Fast, Exploding, Armored, Ghost, Spitter)
│   │   ├── Particle.js           # Particle and damage number classes
│   │   ├── Pickup.js             # Health, ammo, damage, and nuke pickup classes
│   │   ├── Grenade.js            # Grenade class
│   │   ├── Shell.js              # Shell casing class
│   │   ├── AcidProjectile.js    # Acid projectile from Spitter Zombie
│   │   └── AcidPool.js          # Acid pool ground hazard
│   ├── systems/
│   │   ├── AudioSystem.js        # Web Audio API sound generation
│   │   ├── GraphicsSystem.js     # Graphics utilities (ground texture loading)
│   │   ├── ParticleSystem.js     # Particle effects and blood splatter
│   │   ├── SettingsManager.js    # Settings persistence and management
│   │   ├── InputSystem.js        # Gamepad input handling (HTML5 Gamepad API)
│   │   ├── ZombieUpdateSystem.js # Zombie AI updates and multiplayer sync
│   │   ├── EntityRenderSystem.js # Entity rendering with viewport culling
│   │   ├── PickupSpawnSystem.js  # Pickup spawning logic
│   │   ├── MultiplayerSystem.js  # Multiplayer networking and synchronization
│   │   ├── ZombieSpawnSystem.js  # Zombie and boss spawning logic
│   │   ├── PlayerSystem.js       # Player updates, rendering, co-op lobby
│   │   ├── GameStateManager.js   # Game lifecycle (start, restart, game over)
│   │   ├── GameLoopSystem.js     # Per-frame gameplay update + world/HUD render (Phase 4)
│   │   ├── WaveChaosSystem.js    # Dynamic wave breaks, mutators, spawn pacing
│   │   └── MeleeSystem.js        # Melee attack logic and range checking
│   ├── ui/
│   │   ├── GameHUD.js            # In-game HUD component
│   │   └── SettingsPanel.js      # Settings UI panel
│   └── utils/
│       ├── arrayUtils.js         # Zero-allocation array operations (in-place compaction)
│       ├── combatUtils.js        # Combat functions (shooting, explosions, player/pickup collisions)
│       ├── bulletZombieCollisions.js  # Bullet–zombie quadtree collisions, kill rewards (Phase 4b)
│       ├── gameUtils.js          # General game utilities + UI/mode/mobile helpers
│       └── drawingUtils.js       # Drawing utilities (crosshair, wave UI, FPS counter)
├── LOCAL_SERVER/
│   ├── server.js                 # Express + socket.io server
│   └── package.json              # Node.js dependencies
├── mobile/
│   ├── capacitor.config.json     # Capacitor app config
│   ├── android/                  # Android native project (WebView host)
│   └── www/                      # Synced web build for the app
├── sample_assets/
│   └── tiles/
│       ├── bloody_dark_floor.png # Ground texture tile
│       └── bloody_hospital_tile.png # Alternative texture
├── DOCS/
│   ├── roadmap.md                # Feature roadmap
│   ├── CHANGELOG.md              # Version history
│   ├── ARCHITECTURE.md           # Technical architecture
│   ├── SUMMARY.md                # This file
│   ├── SCRATCHPAD.md             # Development notes
│   ├── STYLE_GUIDE.md            # Design system documentation
│   ├── SBOM.md                   # Software Bill of Materials
│   ├── REFACTOR_PLAN.md          # Refactoring strategy
│   └── ...                       # Other docs
└── README.md                     # Project documentation
```

## Key Components

### Game Classes
- **Bullet** - Projectile physics and rendering (weapon-specific damage, visual trails)
- **FlameBullet** - Short-range flame projectile with burn effect
- **Zombie** - Enemy AI, pathfinding, visual design (6 variants: Normal, Fast, Exploding, Armored, Ghost, Spitter)
- **Player** - Supports multiple player instances (P1/P2) with independent input and state
- **Particle** - Visual effects system (supports custom blood particles)
- **Pickup** - Power-up system (Health, Ammo, Damage Buff, Nuke)
- **AcidProjectile** - Acid glob projectile from Spitter Zombie
- **AcidPool** - Ground hazard that damages players over time
- **GameHUD** - In-game overlay for stats, pause menu, game over screen, buff indicators, co-op split layout

### Systems
- **Input Handler** - Keyboard, mouse, and gamepad input (continuous firing support)
  - Automatic input source detection (mouse/keyboard vs gamepad)
  - Multi-gamepad support for local co-op
  - Controller support with analog sticks for movement and aiming
  - Virtual crosshair for controller aiming
- **Weapon System** - 8 weapons with unique stats (Pistol, Shotgun, Rifle, Flamethrower, SMG, Sniper, RPG, Laser Gun), switching, reloading
- **Ammo System** - Limited bullets, manual/auto reload, weapon-specific ammo
- **Day/Night Cycle** - Dynamic time-based atmosphere with visual overlay and difficulty scaling
- **Audio System** - Web Audio API sound generation
- **Collision Detection** - Circle-based collision
- **Wave Manager** - Spawning and progression
- **Screen Shake** - Camera shake effects
- **Damage Indicator** - Visual feedback on damage
- **Blood Splatter** - Directional blood particle effects
- **Pause System** - ESC to pause/resume, game state management
- **Power-up System** - Temporary buffs (double damage) and instant effects (nuke)
- **Kill Streak System** - Combo tracking with visual feedback for rapid kills

### Game State
- Player position, health, angle
- Current weapon, ammo count, reload status
- Bullets array (including flame bullets)
- Zombies array (with burning state)
- Particles array (supports custom blood objects)
- Acid projectiles and acid pools arrays
- Pickups arrays (health, ammo, damage, nuke)
- Wave counter, score, high score (localStorage)
- Day/night cycle state (gameTime, isNight)
- Damage multiplier and buff timers
- Kill streak counter and timing
- Game running/paused states

## Recent Updates (v0.8.3.1)
- **Battlepass System Overhaul (Unreleased)**: Complete rewrite — Season 2: Dead Zone (all of 2026), reward claim system with auto-claim, expanded daily/weekly challenge pools, Fisher-Yates shuffle, killstreak challenges, game over BP display, premium track gate, max tier edge case fix, profile migration.
- **Audio Overhaul**: Replaced tonal SFX with visceral synthesized textures (meaty impacts, mechanical ticks).
- **Procedural Music**: Dynamic background music system that scales intensity with gameplay.
- **Zombie Visual Diversity**: 8 unique variants with clothing, accessories, and bone exposure.
- **Animated Entities**: Added procedural walking and swaying animations to Normal Zombies.
- **Cohesive Model Design**: Implemented long sleeves and visible hands for zombie variants.
- **Audio Mixer Expansion**: Granular volume control for hit markers, gunshots, and multipliers.
- **Battlepass Progress Fix (v0.8.3.5)**: Implemented headshot and pickup tracking to resolve stalled quest progression.
- **Headshot Detection (v0.8.3.5)**: Enhanced dual-hitbox collision logic in `gameUtils.js` to distinguish between head/torso and lower-body hits.
- **UI Overlay Fixes (v0.8.3.4)**: Fixed cursor layering, input blocking, and HUD isolation for all HTML screens.
- **Responsive HUD Redesign (v0.8.3.3)**: Unified 50px "Glass Tech" status bar with high-density informational boxes.
- **UI Sound Integration (v0.8.3.3)**: Procedural hover and click sounds for all menu elements.
- **Armory Expansion (v0.8.3.2)**: Integrated the Laser Gun (Slot 8) with instant-hit raycast logic.

## Recent Updates (Unreleased)
- **Runtime Stability Fixes (2026-06-14)**
  - **combatUtils.js**: Removed extra `}` in `handleBulletZombieCollisions()` quadtree setup — game failed to parse module (`Unexpected token '}'` at line 1222)
  - **GameHUD.js**: Defined `xpBarWidth` in `drawCoopHUD()` — co-op/multiplayer HUD crashed with `ReferenceError: xpBarWidth is not defined`
  - **index.html**: Added `mobile-web-app-capable` meta tag (kept Apple tag for iOS) — resolves browser deprecation warning
- **Weapon System Polish**: Comprehensive overhaul of all 8 weapon systems
  - **Critical Bug Fix**: Added missing `weaponStates` for SMG, Sniper, RPG, and Laser weapons (ammo tracking and background reload now work correctly)
  - **Collision Detection Fix**: Fixed 5 `return`→`continue`/`break` bugs in nested collision loops that were terminating collision checks prematurely
  - **Melee System Fix**: Converted `forEach`+`splice` to backwards `for` loop, fixing index skipping when killing multiple zombies in one swipe
  - **Laser Gun Rebalance**: Reduced damage from 5→3 (DPS ~83→~50) to preserve weapon diversity
  - **Weapon-Specific Muzzle Flash**: Each weapon now has unique RGB flash palette (Pistol: white/yellow, Rifle: blue/white, Sniper: cyan, Laser: magenta)
  - **Weapon-Specific Bullet Trails**: Bullets now render with weapon-unique trail colors for visual identification
  - **HUD Update**: Added Laser Gun (key 8) to in-game instructions panel
  - **AI Player Font Fix**: Fixed AI name rendering using wrong font (`Consolas`→`Roboto Mono`)
- **Bug Fix**: Fixed stuck "GO!" screen when returning to lobby from dead multiplayer game
  - Issue: `isGameStarting` flag and `gameStartTime` weren't reset when clicking "Back to Lobby" from game over
  - Fix: Added state reset in `gameover_lobby` button handler: `isGameStarting = false` and `gameStartTime = 0`
  - Location: `js/main.js` - lines 1394-1396
  - Lobby now correctly displays normal interface instead of stuck countdown overlay

## Recent Updates (2026-06-25)
- **Scrap Shop — Wave-Break Shrine**: Mid-run scrap spending tied to wave breaks.
  - `ScrapShrine` golden pedestal spawns near player (45% chance, wave 4+)
  - One random offer: Ammo Cache (20), Armor Plate (+25 shield, 30), Overclock (10s rapid fire, 40)
  - **E** to purchase when in range; `GameHUD.drawTooltip` prompt; floating feedback via `DamageNumber`
  - `gameState.scrapShrines[]`; cleared on purchase, wave advance, coop/single reset
  - Multiplayer gated (`gameState.multiplayer.active`); co-op + arcade supported
  - Constants: `SCRAP_SHRINE_*`, `SCRAP_SHOP_*` in `js/core/constants.js`
- **Scavenger Update — Scrap System**: Wired end-to-end scrap currency from zombie kills.
  - `ScrapPickup` bronze coins spawn at death position via `PickupSpawnSystem.tryDropScrapFromZombie`
  - Magnetic pull toward nearest living player; walk-over collection in `handlePickupCollisions`
  - Boss drops always (30 scrap); regular zombies 20% chance (10 scrap); max 8 active pickups
  - HUD: Left | Score | Scrap on desktop; three-stat mobile sidebar
  - `gameState.scrapCollected`, `player.scrap`, `scrapPickups[]` reset on new game
  - Constants: `SCRAP_VALUE`, `SCRAP_DROP_CHANCE`, `SCRAP_BOSS_VALUE`, `MAX_SCRAP_PICKUPS`, `SCRAP_MAGNETIC_RANGE` in `js/core/constants.js`
- **In-Game MP3 Soundtrack**: Two-track gameplay playlist replaces procedural arcade music; menu track unchanged.

## Recent Updates (v0.8.2.1)
- **WebGPU Screen Shake Sync**: Fixed immersion-breaking static particles during screen shake.
  - Background particles now shake in sync with the rest of the game world during explosions.
  - Implemented via shared state synchronization between Canvas 2D and WebGPU renderers.
- **HUD Refinement**: Optimized Multiplier UI positioning.
  - Repositioned multiplier indicator to avoid overlapping with the directional compass.
  - Consistent layout across Single Player and Co-op modes.

## Recent Updates (V0.8.1.7 ALPHA)
- **Console Error Fixes (V0.8.1.7)**: Fixed Permissions Policy warnings on Hugging Face and Itch.io pages
  - Suppressed "Unrecognized feature" warnings (monetization, xr, etc.)
  - Added console error suppression for third-party scripts
  - Fixed CSS/JS path issues for Itch.io deployment
- **Hugging Face Server Improvements (V0.8.1.7)**: Enhanced visual appearance of server status page
  - Glassmorphism effects, gradient backgrounds, improved hover animations
  - Better stat cards and play button with enhanced shadows and glow
- **Version Consistency (V0.8.1.7)**: All version references updated to V0.8.1.7 ALPHA across all files
- **Off-Screen Indicator Color Fix (V0.8.1.7)**: Fixed zombie spawn arrow color variation
  - Fixed arrows always appearing red after camera system changes
  - Color calculation now uses world-space distance instead of screen-space distance
  - Added separate `colorDistance` threshold (1500 units arcade, 400 units other modes) for more sensitive color variation
  - Arrows now properly transition from red (close) to yellow/green (far) based on actual world-space distance
  - Location: `js/ui/GameHUD.js` - `drawOffScreenIndicators()` method
- **ZombobsFX Spore Cloud Effect (V0.8.1.7)**: 100k particle background effect with mouse interaction
  - GPU-accelerated compute shader updates 100,000 particles per frame
  - Mouse repulsion: particles repel from cursor position creating interactive "antidote" effect
  - Color gradient: Zombie Purple to Toxic Green based on particle life
  - Additive blending creates glowing "radioactive core" effect when particles overlap
  - Renders above procedural background but below game entities
  - Toggleable via Video settings: "Spore Cloud Effect" (default: enabled)
  - Integrated into WebGPURenderer using shared device/context (no duplicate initialization)
  - Location: `js/core/ZombobsFX.js`, integrated in `js/core/WebGPURenderer.js`
- **WebGPU Explosions & Particle Overhaul**: Enabled large-scale explosions for grenades and rockets
  - Removed early return in `ParticleSystem.js` that was disabling explosions
  - Updated `WebGPURenderer.js` to support larger particles (8x radius) and more particles (2000 limit)
  - Fixed WebGPU detection in `ParticleSystem.js` to correctly sync particles
  - Optimized particle rendering with increased particle size multiplier in shader for more impactful visuals
  - Location: `js/systems/ParticleSystem.js`, `js/core/WebGPURenderer.js`
- **WebGPU Particle Parallax (V0.8.1.5)**: Particles now move relative to the camera in single player arcade mode
  - Added `cameraX` and `cameraY` uniforms to WebGPU shaders
  - Particles wrap around the screen but move opposite to camera movement, creating a world-space feel
  - Background shader now has subtle parallax movement (20% of camera speed)
  - Location: `js/core/WebGPURenderer.js`, `js/main.js`
- **Explosion Particle Rendering Fix (V0.8.1.4)**: Fixed invisible explosion particles for grenades and rockets
  - Root Cause: The `Particle` class had an empty `draw()` method that was overriding the rendering logic
  - Solution: Removed the empty `draw()` method from `Particle` class, allowing `ParticleSystem.js` to use its fallback rendering logic
  - Converted hex colors to `rgba()` format for proper alpha blending
  - Ensured large explosion particles (radius > 50) have minimum alpha of 0.3 for visibility
  - Fixed render order: Moved `webgpuRenderer.render()` to after `drawGame()` so particles sync before rendering
  - Location: `js/entities/Particle.js`, `js/systems/ParticleSystem.js`, `js/main.js`
- **Car Fire & Skull Enhancement (V0.8.1.7)**: Added fire effects to burnt cars and enhanced skull design
  - Fire Effects for Burnt Cars: Flickering fire particles (4-7 per car) spawning from windows and engine area
  - Fire particles use orange/yellow/red color variations with sine wave flickering for realistic animation
  - Fire rendered with `screen` composite mode for additive glow effect, shorter lifetime (1-2 seconds) than smoke
  - Enhanced Skull Design: Added 6 teeth along jaw line, 5 crack lines with varying thickness, bone texture marks
  - Skull glow effects: Outer glow with green/yellow tint, inner eye socket glow, subtle shadow for depth
  - Enhanced anatomical details: Cheekbone definition, enhanced eye sockets with depth gradients, enhanced nasal cavity
  - Location: `js/entities/Prop.js` - `initFireParticles()`, `drawBurntCar()`, `drawSkull()`, `update()` methods
- **Prop Enhancement Update (V0.8.1.3)**: Enhanced burnt car props and added new zombie-themed props
  - Enhanced Burnt Cars: Increased car size (60-90px width, 80-120px height), added detailed features (hood lines, door lines, window frames, wheel rims)
  - Animated smoke particles: 3-5 particles per car rising upward with fade-out, drift horizontally and respawn after 2-4 seconds
  - New Zombie Props: Skull props (25-35px), Zombie Arms props (20-30px × 40-60px), Zombie Legs props (25-35px × 50-70px)
  - Fire Trash Can Prop: 2.5D/3D cylindrical metal trash bin with animated fire particles (30-40px width, 35-45px height)
  - Adjusted prop spawn distribution: Rock 30%, Debris 25%, Burnt Car 10%, Skull 15%, Zombie Arms 8%, Zombie Legs 5%, Trash Can 7%
  - Prop update system added for animated effects (smoke and fire particles update each frame)
  - Location: `js/entities/Prop.js`, `js/systems/PropSpawnSystem.js`, `js/main.js`
- **The Living World Update (V0.8.1.2)**: World-space gameplay system with camera and procedural props
  - Camera System: World-space camera following player, keeping them centered on screen while world moves around them
  - Moving Ground Texture: Animated ground pattern scrolling with parallax (30% of camera speed) for single player arcade mode
  - Procedural Prop Spawning: Chunk-based prop spawning system (500x500px chunks) with three prop types (Rocks 50%, Debris 35%, Burnt Cars 15%)
  - Coordinate System: Full world-to-screen and screen-to-world coordinate conversion utilities
  - Only active in single player arcade mode for performance
  - Location: `js/systems/CameraSystem.js`, `js/systems/GroundTextureSystem.js`, `js/systems/PropSpawnSystem.js`, `js/entities/Prop.js`
- **Version**: Current version is V0.8.1.7 ALPHA

## Recent Updates (V0.8.0 ALPHA)
- **Major Code Refactoring**: GameHUD.js modularization with 9 screen classes
  - Reduced GameHUD.js from ~4,715 lines to ~1,757 lines (63% reduction)
  - Created dedicated screen classes: MainMenuScreen, LobbyScreen, CoopLobbyScreen, AILobbyScreen, GameOverScreen, PauseMenuScreen, AboutScreen, GalleryScreen, LevelUpScreen
  - Each screen class encapsulates its own drawing and interaction logic
  - Improved separation of concerns and maintainability
  - All existing functionality preserved, backward compatible
  - Shared utility methods remain in GameHUD for reuse
- **Version Bump**: Updated all version references across the project to V0.8.0 ALPHA

## Recent Updates (V0.7.2 ALPHA)
- **Game Over Screen Improvements**: Added "Back to Lobby" and "Back to Main Menu" navigation buttons, fixed cursor and hover state issues
- **MongoDB Migration**: Migrated highscore storage from file-based to MongoDB Atlas for persistent cloud storage
- **Main Menu Layout Improvements**: Moved username box to top, repositioned global leaderboard and last run display for better visibility
- **Multiplayer Lobby Chat System**: Real-time chat window with rate limiting, message sanitization, and security features
- **XP System Balance Adjustments**: Reduced XP values by 10%, changed progression from exponential to linear formula
- **Multiplayer Bug Fixes**: Fixed stuck "GO!" screen when returning to lobby, fixed pause screen appearing on game start
- **Profile Screen Rank XP Progress Bar**: Added visual progress bar showing current tier XP, next tier requirement, and progress percentage with gold gradient styling

## Recent Updates (V0.7.1.1 ALPHA)
- **Bug Fix**: Fixed duplicate `zombieType` variable declaration causing syntax error
- **Version Bump**: Updated to V0.7.1.1 ALPHA across all files and configurations
- **Docker Configuration**: Fixed server file references in Dockerfile
- **News Ticker**: Updated with V0.7.1.1 ALPHA highlights

## Recent Updates (V0.7.1)
- **Enhanced Kill Feedback System**: Kill confirmation sounds vary by zombie type, enhanced streak visuals (20+ = "LEGENDARY STREAK!"), multi-kill indicators ("MULTI KILL!", "MEGA KILL!")
- **Quick Stats Display on Game Over**: Top 3 stats cards (kills, wave, max streak) with record notifications
- **Weapon Switch Animation**: Visual flash effect when switching weapons (150ms duration)
- **Improved Pickup Visibility**: Enhanced pulse animations and stronger glow effects for rare pickups (Nuke, Damage Buff)
- **Settings Tab Memory**: Settings panel remembers last viewed tab across sessions
- **News Ticker Update**: Updated with V0.7.1 highlights

## Recent Updates (V0.7.0)
- **News Reel Improvements**: Moved to bottom of screen, increased height, updated content
- **Version Bump**: Updated to V0.7.0 across all files

## Recent Updates (V0.6.0)
- **Balance Overhaul**: Major combat balance adjustments
  - Crit rate reduced from 10% to ~3.33% (2/3 reduction) for more balanced combat
  - All zombie HP doubled (except Boss) - makes zombies more durable and combat more challenging
  - **Zombie HP 1.25x Increase (v0.8.1.9)**: All zombie HP further increased by 25% (base formula now `(2 + floor(wave/3)) * 2.5`)
  - **Boss HP 1.25x Increase (v0.8.1.9)**: Boss HP increased by 25% with minimum 1000 HP for wave 5+ (formula: `max(1000, floor((500 + wave*50) * 1.25))`)
  - All weapon damage doubled - maintains relative weapon balance while increasing overall damage output
  - Pistol: 1→2, Shotgun: 3→6 per pellet, Rifle: 2→4, Flamethrower: 0.5→1.0, SMG: 0.8→1.6, Sniper: 15→30, RPG: 60→120 explosion damage
- **Bug Fix**: Hoarder skill ammo multiplier now persists correctly across weapon switches
  - Fixed issue where Hoarder skill's 30% ammo increase was lost when switching weapons
  - All weapon switching, reloading, and ammo restoration now correctly applies ammoMultiplier
  - Location: `js/utils/combatUtils.js` - `switchWeapon()`, `reloadWeapon()`, `shootBullet()`

## Recent Updates (V0.5.3)
- **Main Menu UI Adjustments**: Improved proportions and layout
  - Reduced button sizes (180×36px scaled, down from 200×40px)
  - Widened news ticker (650px, up from 480px)
  - Moved high score text up (80px from bottom, up from 40px)
- **UI Font Scaling Fixes**: Comprehensive fix for all hardcoded fonts
  - All button fonts now scale properly (18px base, min 12px)
  - All main menu fonts scale (title, subtitle, music tip, high score, speaker icon)
  - All AI lobby and about screen fonts scale properly
  - Consistent scaling across entire UI (50%-150% range)
- **UI Scale Control Enhancements**: Added preset buttons in settings
  - Small (70%), Medium (100%), Large (130%) quick presets
  - Preset buttons highlight when active
- **Settings Panel Layout Improvements**: Fixed header intersection and improved scaling
  - Header title and divider now scale with UI scale
  - Increased spacing between header and tabs to prevent intersection
  - All fonts and spacing in settings panel scale proportionally
  - Dynamic viewport calculations for proper layout at all scales
- **Multiplayer Lobby UI Redesign**: Modern glassmorphism design
  - Animated background with scanlines, noise, pulsing gradients
  - Glassmorphism player cards with avatar placeholders
  - Enhanced connection status panel with animated indicators
  - Pill-shaped buttons with pulse animations
  - Improved visual hierarchy and spacing
- **Performance**: Optimized off-screen indicator distance calculations
  - Replaced Math.sqrt() with squared distance comparisons
  - Reduces expensive sqrt operations in rendering loop

## Recent Updates (V0.5.0)
- **Performance Optimization System**: Comprehensive rendering performance improvements
  - RenderingCache system for intelligent gradient/pattern caching
  - Viewport culling for efficient entity rendering
  - WebGPU optimizations (dirty flags, buffer management)
  - Particle system optimization with improved update loops
  - 30-50% FPS improvement on Canvas 2D, 20-40% on WebGPU
- **Main Menu UI Layout Improvements**:
  - Added version text box (V0.6.0) in bottom-left corner
  - Enhanced news ticker: reduced size and positioned below UI buttons
  - Moved UI buttons up for better spacing and visual balance
  - Smaller, more compact button design (200px x 40px, down from 240px x 50px)
  - Improved overall menu layout and spacing
- **Multiplayer Lobby Synchronization**:
  - Implemented ready system - players toggle ready status before game starts
  - Leader-based game start - first player is leader, can start when all ready
  - Synchronized game start - server validates and broadcasts start to all clients simultaneously
  - Enhanced lobby UI - shows leader indicator (👑) and ready status (✅/❌) for each player
  - Fixed critical issue where players were starting in separate game sessions
- **Main Menu News Ticker**:
  - Added scrolling announcement bar displaying version highlights
  - Continuous right-to-left animation with seamless looping
  - Amber/gold text styling matches game aesthetic
  - Highlights features from V0.4.0 and V0.4.1 updates
- **Server Enhancements**:
  - Added `isReady` and `isLeader` properties to player objects
  - Automatic leader reassignment when leader disconnects
  - Game start validation (checks leader status and all-ready state)
  - Enhanced lobby update broadcasts with ready/leader information
- **Client Improvements**:
  - Context-aware lobby buttons (Leader sees "Start Game", others see "Ready")
  - Local state tracking for leader/ready status
  - Proper event handling for synchronized game start
- **Documentation**:
  - Created `DOCS/MULTIPLAYER.md` - Comprehensive multiplayer architecture guide
  - Documents packet flow, synchronization guarantees, and error handling

## Recent Updates (V0.4.0)
- **Hugging Face Spaces Deployment**:
  - Production-ready server configuration for cloud hosting
  - Automatic server health checking and wake-up system
  - Improved Socket.io connection handling with reverse proxy support
  - Server status indicator on main menu

## Previous Updates (V0.3.1)
- **Bug Fixes**: Fixed critical bullet update crash by ensuring correct removal check. Fixed grenade limit constant bug.
- **WebGPU Rendering Foundation**:
  - Dedicated WebGPURenderer with Canvas 2D fallback
  - Procedural "Void" background with GPU shaders
  - Bloom post-processing and lighting effects
  - Live settings integration for graphics features
- **Settings Overhaul**:
  - Complete redesign with tabbed layout (Video, Audio, Gameplay, Controls)
  - Compact, industrial UI aesthetic
  - Comprehensive video settings (Bloom, Lighting, Particles, Distortion)
- **Landing Page Requirements**:
  - Added "Graphical Requirements" block to sidebar
  - Specs for WebGPU/Canvas and hardware targets

## Recent Updates (V0.3.0 ALPHA)

- **Engine Naming & Version Update**: 
  - Officially named the game engine "ZOMBS-XFX-NGIN V0.3.0 ALPHA"
  - Updated all version references across the project to V0.3.0 ALPHA
  - Added engine info box to landing page displaying engine name and version
  - Standardized version format across UI and documentation

## Previous Updates (v0.2.9)

- **AI Companion System Refactoring**:
  - Extracted AI companion logic into dedicated `js/companions/CompanionSystem.js` module
  - Separated AI behavior from main game loop for better maintainability
  - Modular structure prepares for future enhancements (roles, commands, state machines)
  - AI behavior unchanged: still follows player, engages zombies, maintains leash distance

## Recent Updates (v0.2.6)

- **Landing Page Visual Enhancements**:
  - Increased UI panel transparency (dark mode: 0.45, light mode: 0.65) for better visual depth
  - Restored Star Wars-style fly-out animation with 3 icon types (Zombie, Bullet, Health Pickup)
  - Icons spawn from screen center and fly out in random directions
  - Dynamic background effect creates engaging landing page atmosphere

## Previous Updates (v0.2.5)
- **Day/Night Cycle**: 
  - 2-minute cycle transitioning between day and night
  - Visual dark overlay during night (0.5-0.7 alpha)
  - Zombies move 20% faster during night for increased difficulty
  - Smooth transitions at dawn and dusk
- **Flamethrower Weapon**:
  - Short-range weapon (200px) with high fire rate (50ms)
  - Applies burning damage over time (3 seconds) instead of instant damage
  - Visual flame particles with spread pattern
  - Weapon 4 key binding
- **Spitter Zombie**:
  - Ranged enemy with kiting AI (maintains 300-500px range)
  - Fires acid projectiles that create hazardous pools on impact
  - Acid pools damage players standing in them (5 second duration)
  - Spawns from Wave 6+ with ~8% chance
  - Toxic green visual design

## Previous Updates (v0.2.2)
- **Local Co-op**: 
  - 4-player shared screen gameplay
  - Dynamic grid HUD (2x2)
  - Dedicated Lobby for joining
  - Distinct player colors
  - Smart input assignment (Keyboard/Gamepad mixing)
- **Horror Atmosphere**:
  - Creepy animated main menu background (pulsing red, scanlines, noise)
  - Dynamic blood splatter effects on menu
- **Menu Music**: Added background music for main menu ("Shadows of the Wasteland.mp3")
  - Loops continuously while in menu
  - Automatically stops when game starts
  - Connected to master volume control
- **Main Menu UI**: Enhanced with music tip and improved layout
  - Visible music activation prompt with red glow effect
  - Fixed button positioning to prevent overlap
- **Documentation**: Created Itch.io publishing guide for web distribution

## Previous Updates (v0.2.1)
- **New Features**: Added 5 quick-impact features for enhanced gameplay variety
  - Bullet trails for improved visual feedback
  - Ghost zombie variant (semi-transparent, fast, Wave 4+)
  - Double damage pickup (10-second damage buff)
  - Nuke pickup (instant clear all zombies)
  - Kill streak system with combo notifications
- **Power-up System**: Rare powerup spawns every 30 seconds (damage buff or nuke)
- **Enhanced Combat**: Damage multiplier system integrated, kill streak tracking
- **Visual Polish**: Bullet trails, buff indicators in HUD, combo text notifications

## Previous Updates (v0.2.0)
- **Version Release**: Bumped to v0.2.0 with comprehensive feature set
- **Controller Support (Beta)**: Full Xbox controller support with analog movement and aiming
  - Left Stick: Movement (analog)
  - Right Stick: Aiming (character direction follows stick input)
  - Automatic input source detection (switches between mouse/keyboard and gamepad)
  - Virtual crosshair follows controller aim direction
  - Hot-plug support (detects controller connection/disconnection)
  - Controller keybind settings UI with rebind support
- **Main Menu Enhancement**: Added "Local Co-op" button (placeholder for future implementation)
- **Visual Upgrade**: Replaced procedural grass with textured bloody dark floor tile for grittier atmosphere
  - Renamed `initGrassPattern()` to `initGroundPattern()` for clarity
  - Increased ground pattern opacity from 0.4 to 0.6 for better visibility
- **Landing Page Improvements**: 
  - Widened layout (1200px max-width, improved grid ratios)
  - Enhanced feature grid with 10 items (added Melee, Crowd Control, Respite, Custom Controls)
  - Expanded roadmap section with 11 future features
  - Updated run details with more technical information
- **Style Guide**: Created comprehensive `STYLE_GUIDE.md` documenting design system
- **Documentation Updates**: Updated CHANGELOG.md, SUMMARY.md, ARCHITECTURE.md, and SCRATCHPAD.md
- **Multiplayer Lobby**: GameHUD now renders a socket-powered lobby with live player list, start/back buttons, and connection states
- **Server Visibility**: `server.js` tracks players, broadcasts `lobby:update`, and prints rich logs surfaced by `launch.ps1`
- **Backend Server Setup**: Node.js server with Express and socket.io for multiplayer foundation
- **Server Launcher**: Styled PowerShell wrapper with automatic dependency installation
- **Modular Refactoring**: Split game into ES6 modules for better maintainability
- Implemented Wave Break System (3s pause between waves with UI notification)
- Implemented complete weapon system (3 weapons with unique stats)
- Full ammo system with reloading (R key manual reload, 1 second reload time)
- Health and Ammo pickups
- Melee attack mechanism
- Continuous mouse button firing (hold to fire automatically)
- Blood splatter system with directional particles
- Complete audio system (gunshot, damage, footsteps, restart sounds)
- Muzzle flash visual effects
- Pause menu and game over screens integrated in HUD
- High score persistence with localStorage

## Next Steps
See `roadmap.md` for planned features including:
- Boss waves
- Score multiplier (combo system)
