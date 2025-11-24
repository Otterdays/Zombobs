<div align="center">

# 🧟 ZOMBOBS - ZOMBIE APOCALYPSE WITH FRIENDS
### 💀 The Ultimate Vanilla JS Survival Experience 💀

> **"Left 4 Dead meets Geometry Wars in a browser window."**

<p align="center">
  <a href="https://developer.mozilla.org/en-US/docs/Web/HTML">
    <img src="https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white" alt="HTML5" />
  </a>
  <a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript">
    <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt="JavaScript" />
  </a>
  <a href="https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API">
    <img src="https://img.shields.io/badge/Canvas_2D-FF6B6B?style=for-the-badge&logo=html5&logoColor=white" alt="Canvas 2D" />
  </a>
  <a href="https://www.w3.org/TR/webgpu/">
    <img src="https://img.shields.io/badge/WebGPU-9900FF?style=for-the-badge&logo=webgpu&logoColor=white" alt="WebGPU" />
  </a>
  <a href="https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API">
    <img src="https://img.shields.io/badge/Web_Audio_API-FF6B00?style=for-the-badge&logo=webaudio&logoColor=white" alt="Web Audio API" />
  </a>
  <a href="https://nodejs.org/">
    <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js" />
  </a>
  <a href="https://expressjs.com/">
    <img src="https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express" />
  </a>
  <a href="https://socket.io/">
    <img src="https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socket.io&logoColor=white" alt="Socket.io" />
  </a>
  <a href="https://www.mongodb.com/">
    <img src="https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" />
  </a>
  <a href="LEGAL/LICENSE.md">
    <img src="https://img.shields.io/badge/License-PROPRIETARY-FF1744?style=for-the-badge" alt="License" />
  </a>
  <a href="https://github.com/AfyKirby1/Zombobs/releases">
    <img src="https://img.shields.io/badge/Version-0.8.1.7_ALPHA-00C853?style=for-the-badge" alt="Version 0.8.1.7 ALPHA" />
  </a>
</p>

![Gameplay Banner](https://via.placeholder.com/800x400/0f0f0f/ff0000?text=SURVIVE+THE+HORDE)

<p align="center">
  <br>
  <b>No Engines. No Frameworks. Just Pure Adrenaline.</b><br>
  A fast-paced, top-down shooter built entirely with raw HTML5 Canvas and JavaScript.<br>
  <i>Now featuring permanent progression, achievements, and seasonal battlepass!</i>
  <br><br>
  <a href="https://afykirby1.github.io/Zombobs/">
    <img src="https://img.shields.io/badge/PLAY_NOW-00C853?style=for-the-badge&logo=google-play&logoColor=white&labelColor=101010" height="50" alt="Play Now" />
  </a>
  &nbsp;&nbsp;&nbsp;
  <a href="https://otterdays.itch.io/zombobs">
    <img src="https://img.shields.io/badge/PLAY_ON_ITCH.IO-FA5C5C?style=for-the-badge&logo=itch.io&logoColor=white&labelColor=101010" height="50" alt="Play on Itch.io" />
  </a>
  <br>
</p>

[🎮 Features](#-features) • [🏅 Progression](#-progression--rewards) • [🕹️ Controls](#-controls) • [🛠️ Tech](#-technology-stack) • [🗺️ Roadmap](#-roadmap)

</div>

---

## 🔥 What's New in V0.8.1.7 ALPHA

### 💪 Zombie Health Increase & Visual Enhancements

> **Combat balance update: Increased zombie durability and enhanced world atmosphere**

- **💪 Zombie Health Increase** - All zombie HP increased by 1.25x (25% increase)
  - Base zombie health now scales from 5 HP (waves 1-2) to 25+ HP (waves 26+)
  - Boss zombies now have minimum 1000 HP at wave 5+ (was 750 HP)
  - All special zombie variants inherit the increased base health
  - Makes combat more challenging and strategic
  - Location: `js/entities/Zombie.js`, `js/entities/BossZombie.js`

- **🔥 Fire Effects for Burnt Cars** - Atmospheric world decoration
  - Flickering fire particles spawn from car windows and engine area
  - 4-7 fire particles per car with realistic sine wave animation
  - Orange/yellow/red color variations with additive glow effect
  - Shorter lifetime (1-2 seconds) for dynamic visual effect
  - Location: `js/entities/Prop.js`

- **💀 Enhanced Skull Design** - Improved zombie skull props
  - Added 6 teeth along jaw line with proper positioning
  - Enhanced crack system with 5 crack lines of varying thickness
  - Bone texture with 4 fixed detail marks per skull instance
  - Enhanced eye sockets with depth gradients and inner glow
  - Cheekbone definition and enhanced nasal cavity
  - Outer glow with green/yellow tint for eerie atmosphere
  - Location: `js/entities/Prop.js`

## 🔥 What's New in V0.8.1.6 ALPHA

### 💥 WebGPU Explosions & Particle Overhaul

> **Massive visual improvements: Large-scale explosions and particle system enhancements**

- **💥 WebGPU Explosions** - Enabled large-scale explosions for grenades and rockets
  - **8x Radius Support**: Particles can now be up to 8x larger for more impactful visuals
  - **2000 Particle Limit**: Massive explosions with up to 2000 particles for epic effects
  - **Optimized Rendering**: Enhanced WebGPU particle rendering with improved synchronization
  - **Location**: `js/systems/ParticleSystem.js`, `js/core/WebGPURenderer.js`

- **🌐 Particle Parallax (V0.8.1.5)** - Camera-relative particle movement
  - Particles now move relative to the camera in single player arcade mode
  - Background shader parallax effects (20% of camera speed)
  - World-space feel with particles wrapping around screen
  - Location: `js/core/WebGPURenderer.js`, `js/main.js`

- **🔧 Explosion Fixes (V0.8.1.4)** - Critical rendering improvements
  - Fixed invisible explosion particles for grenades and rockets
  - Enhanced alpha blending and color conversion (hex to rgba)
  - Minimum alpha of 0.3 for large explosion particles (radius > 50)
  - Fixed render order for proper particle synchronization
  - Location: `js/entities/Particle.js`, `js/systems/ParticleSystem.js`

- **🚗 Prop Enhancements (V0.8.1.3)** - Atmospheric world decoration
  - **Enhanced Burnt Cars**: Larger cars (60-90px width) with animated smoke effects
  - **New Zombie Props**: Skulls, zombie arms, and zombie legs for atmospheric decoration
  - **Improved Distribution**: Better prop variety with adjusted spawn percentages
  - Location: `js/entities/Prop.js`, `js/systems/PropSpawnSystem.js`

- **🌍 Living World (V0.8.1.2)** - World-space gameplay system
  - **Camera System**: World-space camera following player, keeping them centered
  - **Moving Ground Texture**: Animated ground pattern with parallax scrolling (30% of camera speed)
  - **Procedural Props**: Chunk-based prop spawning system (500x500px chunks)
  - **Coordinate System**: Full world-to-screen and screen-to-world conversion utilities
  - Location: `js/systems/CameraSystem.js`, `js/systems/GroundTextureSystem.js`, `js/systems/PropSpawnSystem.js`

## 🔥 What's New in V0.8.0 ALPHA

### 🎉 The Refactor Update

> **Major code refactoring: GameHUD.js modularization**

- **🔧 Major Code Refactoring** - GameHUD.js modularization
  - **Screen Class Extraction**: Extracted 9 screen classes for better code organization
    - MainMenuScreen, LobbyScreen, CoopLobbyScreen, AILobbyScreen, GameOverScreen, PauseMenuScreen, AboutScreen, GalleryScreen, LevelUpScreen
  - **Code Reduction**: Reduced GameHUD.js from ~4,715 lines to ~1,757 lines (63% reduction)
  - **Improved Maintainability**: Each screen class encapsulates its own drawing and interaction logic
  - **Separation of Concerns**: Better code organization with clear responsibilities
  - **Backward Compatible**: All existing functionality preserved, main.js requires no changes
  - **Shared Utilities**: Common methods (getUIScale, drawMenuButton, drawGlassCard) remain in GameHUD for reuse

## 🔥 What's New in V0.7.2 ALPHA

> **Major Update - Game Over improvements, MongoDB migration, chat system, and balance adjustments**

- **🎮 Game Over Screen Improvements** - Enhanced navigation and bug fixes
  - **Navigation Buttons**: Added "Back to Lobby" and "Back to Main Menu" buttons on game over screen
  - **Multiplayer Lobby Return**: Properly re-registers player and restores lobby state
  - **Cursor Fixes**: Fixed cursor and hover state issues on game over screen
  - **Pause Screen Fix**: Fixed bug where pause screen appeared when multiplayer games started

- **🗄️ MongoDB Migration for Highscore Persistence** - Cloud-based score storage
  - **MongoDB Atlas Integration**: Persistent highscore storage survives server restarts
  - **Graceful Fallback**: Server continues to work if MongoDB unavailable
  - **Server Readiness Tracking**: Improved health checks for Hugging Face Spaces deployment
  - **Async Operations**: Non-blocking database writes for better performance

- **🎨 Main Menu Layout Improvements** - Better visibility and organization
  - **Username Box**: Moved to top of screen with modern styling
  - **Global Leaderboard**: Repositioned towards top for better visibility
  - **Last Run Display**: Moved to left side, shows only most recent run

- **💬 Multiplayer Lobby Chat System** - Real-time player communication
  - **Chat Window**: Glassmorphism-styled chat in multiplayer lobby
  - **Security Features**: Rate limiting, message sanitization, XSS prevention
  - **Character Counter**: 200 character limit with visual feedback
  - **Auto-scroll**: Automatically scrolls to latest messages

- **⚖️ XP System Balance Adjustments** - Improved progression
  - **XP Rate Reduction**: All zombie XP values reduced by 10% for more meaningful level-ups
  - **Linear Progression**: Changed from exponential to linear formula (100 + (level-1) × 20)
  - **XP Bar Fix**: XP now properly resets to 0 after leveling up

## 🔥 What's New in V0.7.1.1 ALPHA

> **Bug Fix Release - Critical syntax error fix and Docker configuration update**

- **🐛 Bug Fix**: Fixed duplicate `zombieType` variable declaration causing syntax error
- **📦 Docker Configuration**: Fixed server file references in Dockerfile for Hugging Face Spaces deployment
- **🔄 Version Update**: All version indicators updated to V0.7.1.1 ALPHA

## 🔥 What's New in V0.7.1

> **Polish Update - Enhanced feedback, better visibility, and quality-of-life improvements**

- **🎯 Enhanced Kill Feedback System** - More satisfying combat feedback
  - **Kill Confirmation Sounds**: Distinct audio cues that vary by zombie type (higher pitch for fast zombies, lower for bosses)
  - **Enhanced Kill Streak Visuals**: Larger, more dramatic combo text for high streaks (15+, 20+)
  - **Multi-Kill Indicators**: Special "MULTI KILL!" and "MEGA KILL!" notifications when 3+ zombies die within 0.5 seconds
  - **Color-Coded Streaks**: Gold for 20+, Orange for 15+, Red for 10+, Amber for 5+ streaks

- **📊 Quick Stats Display on Game Over** - Immediate session summary
  - **Top 3 Stats Cards**: Displays kills, wave, and max streak in beautiful card layout
  - **Record Notifications**: Shows "NEW RECORD!" badges when personal records are broken
  - **High Score Highlight**: Special notification when new high score is achieved

- **⚡ Weapon Switch Animation** - Visual feedback for weapon changes
  - **Flash Effect**: Subtle white flash/glow when switching weapons
  - **Smooth Animation**: 150ms flash that expands and fades out

- **💎 Improved Pickup Visibility** - Easier to spot in chaotic moments
  - **Enhanced Pulse**: Stronger pulse animations for all pickups
  - **Rarity Glow**: Rare pickups (Nuke, Damage Buff) have larger, brighter glow effects
  - **Double Glow Rings**: Additional outer glow rings for rare pickups

- **💾 Settings Tab Memory** - Faster access to your preferred settings
  - **Last Tab Remembered**: Settings panel remembers which tab you last viewed
  - **Persistent Across Sessions**: Tab preference saved in localStorage

- **📰 News Ticker Update** - Fresh content highlighting V0.7.1 features

## 🔥 Previously in V0.7.0

> **The progression system is here. Rank up, unlock achievements, and dominate the leaderboard!**

- **🏅 Permanent Rank & Progression System** - Long-term progression that persists across all game sessions
  - **9 Ranks**: Private → Corporal → Sergeant → Lieutenant → Captain → Major → Colonel → General → Legend
  - **5 Tiers per Rank**: Progress through each rank with exponential XP scaling
  - **Rank XP Sources**: Earn from session score (1 score = 0.1 rank XP) and wave completion bonuses (10 XP per wave)
  - **Rank Badges**: Display your rank on main menu and in multiplayer lobbies
  - **Rank Progress**: Track your progress with visual progress bars and notifications

- **🏆 Achievement System** - 30+ unlockable achievements across 5 categories
  - **Combat Achievements**: Kill milestones (100, 500, 1K, 5K, 10K), headshots, combos
  - **Survival Achievements**: Wave milestones (5, 10, 20, 30, 50), time survived, perfect waves
  - **Collection Achievements**: Weapon master, skill collector, pickup hoarder
  - **Skill Achievements**: Accuracy master, efficiency expert
  - **Social Achievements**: Co-op warrior, dedicated player, first blood
  - **Rewards**: Rank XP (100-10,000 XP) and unlockable titles
  - **Achievement Gallery**: Browse all achievements with category filtering and progress tracking

- **🎁 Battlepass/Expansion System** - Seasonal progression track with 50 tiers
  - **Season 1: Outbreak** - 60-day season (January 1 - March 1, 2025)
  - **Free Track**: Available to all players
  - **50 Tiers**: Rank XP, Titles, Emblems, and Cosmetics rewards
  - **Battlepass XP**: Earn from match completion (10 XP base), daily/weekly challenges, and achievements
  - **Progress Tracking**: Visual tier track with progress bar and season information

- **👤 Enhanced Player Profile System** - Comprehensive player data management
  - **Persistent Profile**: Stored in localStorage, survives browser restarts
  - **Statistics Tracking**: Total games, kills, waves, time played, records, and specialized stats
  - **Profile Screen**: View rank, stats, achievements, and battlepass summary
  - **Automatic Migration**: Seamlessly migrates from existing username/high score data

- **📊 Global Highscore Leaderboard** - Server-side score tracking
  - **Top 10 Global Scores**: Compete with players worldwide
  - **Real-time Updates**: Leaderboard updates via Socket.IO when top 10 changes
  - **Score Submission**: Automatic submission on game over with timeout handling
  - **Player Highlighting**: Your score highlighted when in top 10

- **🎨 Visual Settings Enhancements** - Comprehensive visual customization
  - **Text Rendering Quality**: Global control over font smoothing (Low/Medium/High)
  - **Rank Badge Settings**: Show/hide toggle and size control (Small/Normal/Large)
  - **Crosshair Customization**: Color picker, size slider (0.5x-2.0x), opacity slider (0.0-1.0)
  - **Enemy Health Bar Styles**: Three visual styles (Gradient/Solid/Simple)
  - All settings apply in real-time and persist across sessions

## 🔥 Previously in V0.7.0

> **Balance overhaul and critical bug fixes**

- **⚖️ Balance Overhaul** - Major combat balance adjustments
  - **🎯 Crit Rate Reduction**: Base crit chance reduced from 10% to ~3.33% (2/3 reduction)
  - **💪 Zombie HP Doubling**: All zombie HP doubled (except Boss) for more challenging combat
  - **🔫 Weapon Damage Doubling**: All weapon damage values doubled to match increased zombie durability
- **🐛 Bug Fix**: Hoarder skill ammo multiplier now persists correctly across weapon switches

## 🔥 Previously in V0.5.1

> **The horde moves in perfect sync. Ready for optimized multiplayer?**

- **⚡ Zombie Speed Synchronization** - Complete speed sync eliminates position desync from night cycle, wave scaling, and slow effects
- **📉 Delta Compression** - Only sends changed zombies, reducing network bandwidth by 50-80% for large hordes
- **🔄 Adaptive Update Rate** - Dynamic 5-20Hz update frequency based on zombie count and network latency (was fixed 10Hz)
- **✨ Advanced Interpolation** - Adaptive lerp + velocity extrapolation provides 60-80% reduction in movement jitter
- **🚀 Velocity-Based Extrapolation** - Uses tracked velocity for smooth movement prediction between network updates
- **💻 Socket.IO Binary Add-ons** - Optional `bufferutil` and `utf-8-validate` reduce WebSocket CPU usage by 10-20%
- **📊 Latency Measurement** - Real-time network latency tracking with exponential moving average for adaptive quality adjustments

## 🔥 Previously in V0.5.0

> **The horde is connected. Are you ready?**

- **🌐 Hugging Face Spaces Deployment** - Production-ready multiplayer server on Hugging Face Spaces cloud hosting
- **🔌 Enhanced Connection System** - Automatic server health checks, smart status indicators, and auto-wake for sleeping servers
- **🛡️ Improved Stability** - Fixed WebGPU renderer errors and Socket.io connection issues
- **📊 Smart Server Status** - Main menu now shows server readiness even when not in multiplayer lobby
- **🔄 Better Connection Handling** - Polling-first transport, explicit path configuration, and enhanced CORS support
- **⚡ WebGPU Fixes** - Resolved storage buffer binding errors for stable GPU rendering
- **📏 UI Scaling System** - Comprehensive 50-150% UI scale slider for accessibility and customization

## 🔥 Previously in V0.3.0 ALPHA

> **The horde is evolving. Are you?**

- **⚡ WebGPU Rendering Engine** - Next-generation graphics with GPU-accelerated background shaders, bloom post-processing, and procedural "Void" effects. Automatic Canvas 2D fallback for compatibility.
- **🧮 GPU Particle Compute** - Simple compute shader updates thousands of particles per frame; point-list rendering layered over the background.
- **🎨 Settings Overhaul** - Complete redesign with compact tabbed interface (Video, Audio, Gameplay, Controls) and 10+ new customization options.
- **💫 Bloom & Post-Processing** - Physically based bloom effects for glowing elements and cinematic visuals.
- **🎛️ Advanced Settings** - New options including WebGPU toggle, bloom intensity, particle count modes, lighting quality tiers, distortion effects, damage number scale, screen shake multiplier, crosshair color, auto-reload toggle, and spatial audio. All apply live.
- **📊 WebGPU Status Indicator** - Real-time status icon showing WebGPU availability and current state.
- **🔥 Flamethrower Weapon** - Burn through crowds with short-range, high-fire-rate devastation. Sets zombies ablaze with damage-over-time effects.
- **🌙 Day/Night Cycle** - Dynamic 2-minute cycle where zombies move 20% faster at night. Survive the darkness.
- **👥 Local Co-op** - Full 4-player shared-screen mode with grid HUD, distinct player colors, and smart input detection.
- **⚡ Background Reloading** - Weapons auto-reload when holstered. Switch weapons tactically during downtime.
- **🎯 Weapon Persistence** - Each weapon maintains its own ammo count. No more losing progress when switching.
- **🎵 Menu Music** - Atmospheric background music sets the mood before the chaos begins.

---

## 💀 Survive the Night

**Zombobs** strips away the bloat of modern game engines to deliver a raw, high-performance survival experience. You are alone against an endless tide of the undead. How long can you last?

> *"It's like Left 4 Dead met a geometry textbook and had a very angry baby."* - *Beta Tester*

**Built from scratch** with zero dependencies. Every particle, every sound, every zombie AI is hand-crafted using pure JavaScript and the Canvas API. No Unity. No Phaser. No Three.js. Just you, the browser, and thousands of lines of optimized code.

---

## ✨ Features

### 🔫 Arsenal of Destruction

| Weapon | Damage | Fire Rate | Mag Size | Range | Special |
|:---|:---:|:---:|:---:|:---:|:---|
| **Pistol** | 2 | 400ms | 10 | Long | Balanced & Reliable |
| **Shotgun** | 6×5 | 800ms | 5 | Medium | 5-Pellet Spread |
| **Rifle** | 4 | 200ms | 30 | Long | Full Auto Mayhem |
| **Flamethrower** | 1.0/tick | 50ms | 100 | Short | DoT Burning Effect |
| **SMG** | 1.6 | 80ms | 40 | Medium | High Fire Rate |
| **Sniper** | 30 | 1500ms | 5 | Very Long | Piercing Shots |
| **RPG** | 120 AOE | 2000ms | 3 | Long | Explosive Damage |

- **Grenades**: Clear the screen with satisfying AOE explosions (3 per game, 2s cooldown)
- **Melee Attack**: Close-range swipe with 500ms cooldown (V key or right-click)
- **Weapon Switching**: Hotkeys (1-7) or scroll wheel for seamless arsenal management
- **Background Reloading**: Weapons reload automatically when holstered long enough
- **Weapon Persistence**: Each weapon maintains its own ammo count across switches

### 🧠 Intelligent Enemies

- **7 Zombie Variants**:
  - 🟢 **Normal** - Classic shambling horde
  - 🔴 **Fast (Runners)** - 1.6x speed, smaller hitbox, speed trail particles
  - 🛡️ **Armored (Tanks)** - Heavy armor absorbs damage before health
  - 💥 **Exploding (Boomers)** - Explodes on death, AOE damage
  - 👻 **Ghost (Spectral)** - Semi-transparent, 1.3x speed, ethereal glow
  - 🟢 **Spitter (Ranged)** - Kites at optimal range, lobs acid projectiles
  - 👑 **Boss** - Massive zombie with devastating attacks (spawns every 5 waves)

- **Boss Waves**: Every 5 waves, a massive boss zombie spawns with devastating attacks
- **Progressive Difficulty**: Waves get harder, faster, and more chaotic
- **Day/Night Cycle**: Dynamic atmosphere with 20% speed boost for zombies at night
- **Environmental Hazards**: Acid pools from Spitter attacks create dangerous zones
- **Crowd Control**: Bullets slow zombies on hit, allowing strategic kiting

### 🎯 Skill & XP System

- **16 Total Skills** - Expand your capabilities with strategic skill choices
  - **Survival Skills**: Vitality Boost (Max HP +25%), Regeneration (1 HP/sec), Thick Skin (10% damage reduction), Armor Plating (+10 shield)
  - **Combat Skills**: Eagle Eye (Crit chance +10%), Lucky Strike (15% double damage chance), Bloodlust (Heal 2 HP per kill), Adrenaline (20% speed boost after kill)
  - **Utility Skills**: Swift Steps (Movement speed +15%), Quick Hands (50% faster weapon switching), Fast Fingers (15% faster reload), Iron Grip (20% faster reload)
  - **Tactical Skills**: Hoarder (Max ammo +30%), Scavenger (25% more pickup spawns), Long Range (20% increased bullet range), Steady Aim (30% reduced spread)

- **3-Choice Level-Up System** - Choose from 3 random skills when you level up
- **Skill Upgrading** - Skills can be upgraded multiple times for stacking effects
- **XP Gain** - Earn XP from zombie kills (scaled by zombie type, 1.5x rate for faster progression)
- **XP Scaling** - Base 100 XP requirement, scales by 1.2 per level

### 🎨 Visual & Audio Feast

- **Juicy Combat**: Screen shake, particle blood splatters, muzzle flashes, bullet trails, shell ejection
- **Dynamic Audio**: Procedurally generated sound effects using Web Audio API + atmospheric menu music
- **Retro Aesthetics**: Glowing neon zombies against a dark, gritty backdrop
- **Horror Atmosphere**: Animated menu backgrounds with pulsing effects, scanlines, and dynamic blood splatters
- **Floating Damage Numbers**: See your damage output in real-time with customizable styles
- **Kill Streak Combos**: Chain kills within 1.5s for combo notifications ("RAMPAGE!", "UNSTOPPABLE!")
- **WebGPU Rendering**: GPU-accelerated background shaders, bloom post-processing, and procedural effects (with Canvas 2D fallback)

### 💪 Power-Up System

- **Double Damage Buff**: Purple pickup that doubles weapon damage for 10 seconds
- **Nuke Pickup**: Rare yellow/black radiation symbol that instantly clears all zombies
- **Speed Boost**: Temporary movement speed increase
- **Rapid Fire**: Increased fire rate for all weapons
- **Shield Pickup**: Temporary overshield that absorbs damage before health
- **Adrenaline Pickup**: Instant speed boost and combat enhancement

### 👥 Multiplayer & Co-op

- **Local Co-op**: 4-player shared screen mode with grid HUD and distinct player colors
  - Player 1: Mouse/Keyboard or Gamepad 1
  - Player 2-4: Gamepad 2-4 or Keyboard (Arrows for P2)
  - Smart input assignment (mix keyboard and gamepads)
  - Zombies target closest living player
  - All players must die for Game Over

- **Multiplayer Lobby**: Socket.io powered matchmaking with live player list
  - **🌐 Cloud Server**: Deployed on Hugging Face Spaces for reliable hosting
  - **⚡ Speed Sync**: Zombie speed synchronization prevents position desync
  - **📉 Delta Compression**: 50-80% bandwidth reduction for large hordes
  - **🔄 Adaptive Updates**: Dynamic 5-20Hz based on zombie count and latency
  - **✨ Advanced Interpolation**: 60-80% reduction in movement jitter
  - **💻 Binary Optimizations**: 10-20% CPU reduction for WebSocket operations
  - **📊 Latency Measurement**: Real-time network quality tracking
  - **🔌 Smart Connection**: Automatic server health checks and wake-up system
  - **📊 Status Indicator**: Shows "Server Ready" on main menu when server is online
  - **👥 Live Player List**: Real-time player roster with custom usernames and rank badges
  - **🔄 Auto-Reconnect**: Automatic reconnection with exponential backoff
  - **🌍 Direct Domain**: Uses `.hf.space` domain for stable connections
  - **Ready/Back Controls**: Drawn directly on the canvas UI
  - **Leader System**: First player designated as lobby leader with game start control
  - **Ready System**: Players toggle ready status; all must be ready to start

- **Controller Support**: Full Xbox/gamepad support with analog sticks and automatic input detection

---

## 🏅 Progression & Rewards

### Rank System

Progress through **9 ranks** with **5 tiers each**:

1. **Private** (Tiers I-V)
2. **Corporal** (Tiers I-V)
3. **Sergeant** (Tiers I-V)
4. **Lieutenant** (Tiers I-V)
5. **Captain** (Tiers I-V)
6. **Major** (Tiers I-V)
7. **Colonel** (Tiers I-V)
8. **General** (Tiers I-V)
9. **Legend** (Tiers I-V)

**Rank XP Sources**:
- Session score (1 score = 0.1 rank XP)
- Wave completion bonuses (10 XP per wave)
- Achievement rewards (100-10,000 XP)

**Rank Progression**:
- Exponential XP scaling (base 100 XP, 1.15x per tier)
- Rank badge displayed on main menu and in multiplayer lobbies
- Rank progress bar and full rank display on profile screen
- Rank XP and rank-up notifications on game over screen

### Achievement System

**30+ Achievements** across **5 categories**:

- **Combat**: Kill milestones (100, 500, 1K, 5K, 10K), headshots, combos
- **Survival**: Wave milestones (5, 10, 20, 30, 50), time survived, perfect waves
- **Collection**: Weapon master, skill collector, pickup hoarder
- **Skill**: Accuracy master, efficiency expert
- **Social**: Co-op warrior, dedicated player, first blood

**Achievement Features**:
- Achievement unlock notifications during gameplay (non-intrusive popup)
- Achievement gallery screen with category filtering
- Progress bars for locked achievements showing completion percentage
- Rank XP rewards (100-10,000 XP) and unlockable titles

### Battlepass System

**Season 1: Outbreak** (60-day season, January 1 - March 1, 2025)

- **50 Tiers** of rewards (Rank XP, Titles, Emblems, Cosmetics)
- **Free Track**: Available to all players
- **Battlepass XP Sources**:
  - Match completion (10 XP base)
  - Daily/weekly challenges
  - Achievement unlocks
- **Progress Tracking**: Horizontal scrollable tier track with progress bar
- **Season Information**: Name, days remaining, current tier display

### Player Profile

**Comprehensive Statistics Tracking**:
- **Cumulative**: Total games, kills, waves, time played
- **Records**: Highest wave, highest score, max combo
- **Specialized**: Headshots, perfect waves, skills unlocked, pickups collected, co-op wins

**Profile Features**:
- Persistent profile stored in localStorage
- Unique player ID generation
- Username and title display (titles unlocked from achievements)
- Profile screen showing rank, stats, achievements, and battlepass summary
- Automatic profile migration from existing username/high score data

---

## ⚡ Quick Start

> **Pick your vibe**: zero-setup arcade mode, local co-op, or the socket.io-powered multiplayer lobby.

### Option A · Instant Arcade

1. **[Download the source](https://github.com/AfyKirby1/Zombobs/archive/refs/heads/main.zip)**
2. Open `index.html` for the landing page or `zombie-game.html` directly
3. Blast zombies until the sun comes up

### Option B · Local Co-op

1. Open `zombie-game.html` in your browser
2. Click **Local Co-op** from the main menu
3. **Player 1**: Use Mouse/Keyboard or Gamepad 1
4. **Players 2-4**: Press Start/A/Enter to join, use Keyboard (Arrow keys) or Gamepads
5. Survive together!

### Option C · Multiplayer Lobby

1. Install [Node.js](https://nodejs.org/) if you don't already have it  
2. Double-click `launch.bat` (Windows) or run `launch.ps1` directly
   ```powershell
   # launch.bat
   powershell.exe -ExecutionPolicy Bypass -File ".\launch.ps1"
   ```
   The PowerShell wrapper:
   - Checks for Node.js
   - Installs dependencies on first run
   - Launches the Express + socket.io server
   - Prints live connection logs with color-coded badges
3. Visit `http://localhost:3000/zombie-game.html`
4. Click **Multiplayer** → hang out in the neon lobby → hit **Start Game** when your squad is ready

<sub>Want to theme the launcher banner or rename yourself? Edit `launch.ps1` or tweak `gameState.username` before connecting.</sub>

---

## 🎮 Game Modes

### Single Player
Classic survival mode. Just you against the horde. How long can you last? Progress through ranks, unlock achievements, and climb the global leaderboard.

### Local Co-op (Up to 4 Players) ✅ **FULLY FUNCTIONAL**
- Shared screen gameplay with 2x2 grid HUD
- Distinct player colors (Blue/Red/Green/Orange)
- Smart input assignment (mix keyboard and gamepads)
- Zombies target the closest living player
- All players must die for Game Over
- Shared score and progression

### Multiplayer Lobby ✅ **FULLY FUNCTIONAL**
- **🌐 Cloud Server**: Deployed on Hugging Face Spaces for reliable hosting
- **⚡ Speed Sync (V0.5.1)**: Zombie speed synchronization prevents position desync
- **📉 Delta Compression (V0.5.1)**: 50-80% bandwidth reduction for large hordes
- **🔄 Adaptive Updates (V0.5.1)**: Dynamic 5-20Hz based on zombie count and latency
- **✨ Advanced Interpolation (V0.5.1)**: 60-80% reduction in movement jitter
- **💻 Binary Optimizations (V0.5.1)**: 10-20% CPU reduction for WebSocket operations
- **📊 Latency Measurement (V0.5.1)**: Real-time network quality tracking
- **🔌 Smart Connection**: Automatic server health checks and wake-up system
- **📊 Status Indicator**: Shows "Server Ready" on main menu when server is online
- **👥 Live Player List**: Real-time player roster with custom usernames and rank badges
- **🔄 Auto-Reconnect**: Automatic reconnection with exponential backoff
- **🌍 Direct Domain**: Uses `.hf.space` domain for stable connections
- **Ready/Back Controls**: Drawn directly on the canvas UI
- **Leader System**: First player is leader, can start when all ready
- **Ready System**: Players toggle ready status; all must be ready to start

---

## 🕹️ Controls

### Keyboard & Mouse
| Action | Key |
| :--- | :---: |
| **Move** | <kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd> or <kbd>↑</kbd> <kbd>←</kbd> <kbd>↓</kbd> <kbd>→</kbd> |
| **Aim** | 🖱️ Mouse |
| **Shoot** | 🖱️ Left Click (hold for continuous) |
| **Melee** | <kbd>V</kbd> |
| **Reload** | <kbd>R</kbd> |
| **Grenade** | <kbd>G</kbd> |
| **Switch Weapon** | <kbd>1</kbd> <kbd>2</kbd> <kbd>3</kbd> <kbd>4</kbd> <kbd>5</kbd> <kbd>6</kbd> <kbd>7</kbd> or 🖱️ Scroll Wheel |
| **Sprint** | <kbd>Shift</kbd> |
| **Pause** | <kbd>ESC</kbd> |

### Controller (Xbox/Gamepad)
| Action | Button |
| :--- | :---: |
| **Move** | 🕹️ Left Stick (analog) |
| **Aim** | 🕹️ Right Stick (analog) |
| **Shoot** | <kbd>RT</kbd> (hold for continuous) |
| **Melee** | <kbd>R3</kbd> |
| **Reload** | <kbd>X</kbd> |
| **Grenade** | <kbd>RB</kbd> |
| **Next Weapon** | <kbd>Y</kbd> |
| **Previous Weapon** | <kbd>LB</kbd> |
| **Sprint** | <kbd>L3</kbd> |
| **Pause** | <kbd>Start</kbd> |

*All controls are fully customizable in the Settings menu*

### ⚙️ Settings & Customization

The game features a comprehensive **tabbed settings panel** with compact, organized sections:

**Video Tab:**
- **WebGPU Settings**: Enable/disable WebGPU features, bloom intensity slider, particle count modes (Low/High/Ultra), lighting quality (Off/Simple/Advanced), distortion effects toggle
- **Quality Presets**: Low, Medium, High, Ultra, or Custom configurations
- **Visual Effects**: Resolution scale, vignette, shadows, lighting toggles
- **Effect Intensity**: Multiplier (0.0-2.0) for all quality-based effects
- **Post-Processing Quality**: Off, Low, Medium, High
- **Particle Detail**: Minimal, Standard, Detailed, Ultra
- **Gameplay Visuals**: Screen shake multiplier, crosshair style & color, damage number style & scale, low health warning, enemy health bars, reload bar
- **UI Elements** (V0.7.0):
  - **Text Rendering Quality**: Low (no smoothing), Medium, High (best quality)
  - **Rank Badge Settings**: Show/hide toggle, size control (Small/Normal/Large)
  - **Crosshair Customization**: Color picker, size slider (0.5x-2.0x), opacity slider (0.0-1.0)
  - **Enemy Health Bar Style**: Gradient (default), Solid, Simple
- **UI Scaling**: 50-150% scale slider with preset buttons (Small 70%, Medium 100%, Large 130%)
- **Performance**: FPS limit options, debug stats toggle

**Audio Tab:**
- **Volume Controls**: Master, Music, and SFX volume sliders with independent control
- **Advanced**: Spatial audio toggle for 3D positional sound

**Gameplay Tab:**
- **Controls**: Auto-sprint, auto-reload toggle
- **UI**: FPS counter visibility, pause on focus loss

**Controls Tab:**
- **Input Mode Toggle**: Switch between Keyboard and Controller modes
- **Keybinds**: Fully remappable keys and buttons
  - Keyboard: Movement, Sprint, Reload, Grenade, Melee, Weapon hotkeys (1-7), Scroll wheel toggle
  - Controller: Fire, Reload, Grenade, Sprint, Melee, Prev/Next Weapon, Pause
- All settings apply in real-time and persist across sessions via localStorage

---

## 🛠️ Technology Stack

We believe in the power of the platform.

### Frontend Core
- **100% Vanilla JavaScript (ES6+)** - No frameworks, no libraries, no bloat
- **HTML5 Canvas API (2D Context)** - Hand-optimized rendering pipeline for gameplay/UI
- **WebGPU** - Next-generation graphics API for GPU-accelerated background shaders and post-processing (automatic Canvas 2D fallback)
- **Web Audio API** - Procedurally generated sound effects (Oscillators & Gain Nodes)
- **CSS3** - UI overlays and styling
- **Client Dependencies**: **ZERO external runtime dependencies.** None. Nada.

### Backend Server (Optional - for Multiplayer)
- **Node.js** - Runtime environment
- **Express** - Static file serving
- **Socket.io** - WebSocket server for multiplayer lobby and real-time synchronization
- **Cookie Parser** - User session tracking
- **Compression** - Response compression for better performance

### Custom Systems
Every system is custom-built:
- **Particle System** - Hand-crafted particle engine for blood, fire, explosions with quality scaling
- **Audio System** - Procedural sound generation (no audio files needed)
- **Input System** - Unified keyboard/mouse/gamepad handling
- **Collision Detection** - Optimized quadtree-based spatial partitioning
- **Entity Management** - Object pooling for performance
- **State Management** - Custom game state system
- **Rendering Cache** - Intelligent gradient and pattern caching
- **Viewport Culling** - Efficient entity rendering with update culling

---

## ⚡ Performance & Optimization

### Rendering Optimizations

- **RenderingCache System**: Intelligent gradient and pattern caching
  - Caches expensive-to-create gradients until canvas size changes (>10px threshold)
  - Caches lighting gradient until player moves >50px
  - Reduces expensive gradient creation from every frame to only when needed

- **Viewport Culling**: Efficient entity rendering
  - All entities checked against viewport bounds before rendering
  - Uses 100px margin for smooth entry/exit
  - **Update Culling**: Skip updating entities far off-screen (300px margin)
  - **Small Feature Culling**: Skip rendering entities <1px on screen

- **WebGPU Optimizations**:
  - **Dirty Flag System**: Only writes to uniform buffer when values actually change
  - **Buffer Reuse**: Particle buffers reused when count doesn't change
  - **Bind Group Caching**: Efficient bind group management
  - **Graceful Fallback**: Automatic fallback to Canvas 2D on errors

- **Particle System Optimizations**:
  - Quality-based particle limits (50/100/200/500 based on quality preset)
  - Efficient update loop (filter pattern instead of reverse loop + splice)
  - Object pooling for particle reuse
  - Quality-aware spawning and rendering

### Engine Micro-Optimizations (V0.5.2)

- **Math.sqrt() Elimination**: 26+ sqrt calls replaced with squared distance comparisons
- **Loop Optimizations**: forEach() converted to for loops in hot paths (5-10% faster)
- **Object Reuse**: Quadtree and query range objects reused instead of recreated
- **Settings Caching**: Frequently accessed settings cached at frame start
- **Viewport Caching**: Viewport bounds calculated once per frame and reused
- **Property Caching**: Object properties cached in local variables within loops
- **Early Returns**: Early exits for entities that don't need processing
- **Math Constants**: TWO_PI constant added to reduce repeated calculations

### Network Optimizations (V0.5.1)

- **Delta Compression**: Only sends changed zombies (50-80% bandwidth reduction)
- **Adaptive Update Rate**: Dynamic 5-20Hz based on zombie count and latency
- **Advanced Interpolation**: Adaptive lerp + velocity extrapolation (60-80% jitter reduction)
- **Socket.IO Binary Add-ons**: 10-20% CPU reduction for WebSocket operations
- **Latency Measurement**: Real-time network quality tracking with exponential moving average

### Performance Metrics

- **Canvas 2D**: 30-50% FPS improvement (gradient caching + viewport culling)
- **WebGPU**: 20-40% improvement (dirty flags + buffer optimization)
- **Entity Rendering**: 15-25% improvement (culling + batching)
- **Particle System**: 25-35% improvement (optimized loops)
- **Engine Micro-Optimizations**: 5-15% additional FPS improvement on low-end hardware

Performance improvements are most noticeable with:
- High entity counts (50+ zombies)
- Many particles (explosions, blood splatter)
- Low-end hardware/browsers
- Complex scenes with multiple effects

---

## 🏗️ Architecture Highlights

### Modular ES6 Architecture

The game has been refactored into a clean, modular ES6 architecture:

**Core Modules** (`js/core/`):
- `constants.js` - Game constants and configuration
- `canvas.js` - Canvas initialization and management
- `gameState.js` - Centralized game state management
- `rankConstants.js` - Rank system constants and formulas
- `achievementDefinitions.js` - Achievement definitions
- `battlepassDefinitions.js` - Battlepass season definitions

**Entity Modules** (`js/entities/`):
- `Bullet.js` - Bullet and FlameBullet projectile classes
- `Zombie.js` - All zombie variants (Normal, Fast, Exploding, Armored, Ghost, Spitter, Boss)
- `Particle.js` - Particle and damage number classes
- `Pickup.js` - All pickup types (Health, Ammo, Damage, Nuke, Speed, RapidFire, Shield, Adrenaline)
- `Grenade.js` - Grenade projectile class
- `Shell.js` - Shell casing class
- `AcidProjectile.js` - Acid projectile from Spitter Zombie
- `AcidPool.js` - Acid pool ground hazard

**System Modules** (`js/systems/`):
- `AudioSystem.js` - Web Audio API sound generation
- `GraphicsSystem.js` - Graphics utilities and quality scaling
- `ParticleSystem.js` - Particle effects with quality scaling
- `SettingsManager.js` - Settings persistence and management
- `InputSystem.js` - Gamepad input handling
- `SkillSystem.js` - Skill upgrade system and XP management
- `RankSystem.js` - Permanent rank progression system
- `AchievementSystem.js` - Achievement tracking and unlock system
- `BattlepassSystem.js` - Seasonal battlepass progression
- `PlayerProfileSystem.js` - Player profile data management
- `MultiplayerSystem.js` - Multiplayer networking and synchronization
- `ZombieSpawnSystem.js` - Zombie and boss spawning logic
- `ZombieUpdateSystem.js` - Zombie AI updates and multiplayer sync
- `PlayerSystem.js` - Player updates, rendering, co-op lobby
- `GameStateManager.js` - Game lifecycle management
- `MeleeSystem.js` - Melee attack logic
- `PickupSpawnSystem.js` - Pickup spawning logic
- `EntityRenderSystem.js` - Entity rendering with viewport culling
- `RenderingCache.js` - Intelligent caching system

**UI Modules** (`js/ui/`):
- `GameHUD.js` - In-game HUD, menus, lobbies, and UI overlays
- `SettingsPanel.js` - Settings UI panel
- `RankDisplay.js` - Rank badge and progress display
- `AchievementScreen.js` - Achievement gallery UI
- `BattlepassScreen.js` - Battlepass progression UI
- `ProfileScreen.js` - Player profile UI

**Utility Modules** (`js/utils/`):
- `combatUtils.js` - Combat-related functions
- `gameUtils.js` - General game utilities and viewport culling
- `drawingUtils.js` - Drawing utilities for UI elements

**Companion Modules** (`js/companions/`):
- `CompanionSystem.js` - AI NPC companion behavior and lifecycle

### System Organization

- **Clear Separation of Concerns**: Each module has a single, well-defined responsibility
- **No Circular Dependencies**: Careful import structure prevents dependency cycles
- **Centralized State**: Single `gameState` object prevents globals
- **Component-Based**: Reusable UI components (GameHUD, SettingsPanel, etc.)
- **Update-Render Loop**: Classic game loop pattern with clear separation

### Code Quality

- **ES6 Modules**: Native module system, no bundler required
- **Consistent Naming**: Clear, descriptive names throughout
- **Performance-First**: Optimizations built into core systems
- **Documentation**: Comprehensive inline comments and architecture docs
- **Maintainability**: Modular structure enables easy testing and modification

---

## 🧰 Power Tools

| Script | What it does |
| :--- | :--- |
| `launch.bat` | One-click entry: opens the styled PowerShell wrapper |
| `launch.ps1` | Checks Node.js, installs deps, prints neon banner + live socket.io logs |
| `LOCAL_SERVER/server.js` | Serves the entire game and coordinates lobby updates over socket.io |
| `huggingface-space-SERVER/server.js` | Production server for Hugging Face Spaces deployment |

---

## 🗺️ Roadmap

The horde is growing. Here's what's coming next:

### ✅ Recently Completed (V0.7.0)
- [x] **Permanent Rank & Progression System** - 9 ranks, 5 tiers each, persistent across sessions
- [x] **Achievement System** - 30+ achievements across 5 categories with rewards
- [x] **Battlepass System** - Seasonal progression track with 50 tiers
- [x] **Enhanced Player Profile** - Comprehensive statistics tracking and profile screen
- [x] **Global Highscore Leaderboard** - Server-side score tracking with top 10 display
- [x] **Visual Settings Enhancements** - Text rendering, rank badge, crosshair, health bar customization

### ✅ Recently Completed (V0.7.0)
- [x] **Balance Overhaul** - Crit rate reduction, zombie HP doubling, weapon damage doubling
- [x] **Hoarder Skill Bug Fix** - Ammo multiplier now persists across weapon switches

### ✅ Recently Completed (V0.5.1)
- [x] **Zombie Speed Synchronization** - Perfect sync across all clients
- [x] **Delta Compression** - 50-80% bandwidth reduction for large hordes
- [x] **Adaptive Update Rate** - Dynamic 5-20Hz based on conditions
- [x] **Advanced Interpolation** - 60-80% reduction in movement jitter
- [x] **Socket.IO Binary Add-ons** - 10-20% CPU reduction
- [x] **Latency Measurement** - Real-time network quality tracking
- [x] **UI Scaling System** - 50-150% UI scale for accessibility

### ✅ Previously Completed
- [x] **WebGPU Rendering Engine** - GPU-accelerated background shaders and post-processing
- [x] **Settings Overhaul** - Compact tabbed interface with 10+ new options
- [x] **Bloom Post-Processing** - Physically based glow effects
- [x] **Procedural "Void" Background** - Animated shader-based atmospheric effects
- [x] **Flamethrower** - Short-range DoT weapon with burning effects
- [x] **Spitter Zombies** - Ranged enemies with acid projectiles
- [x] **Day/Night Cycle** - Dynamic atmosphere with difficulty scaling
- [x] **Local Co-op** - Full 4-player shared-screen mode
- [x] **Background Reloading** - Tactical weapon switching
- [x] **Weapon Persistence** - Independent ammo tracking
- [x] **Cloud Multiplayer Server** - Hugging Face Spaces deployment
- [x] **Skill System** - 16 skills with 3-choice level-up system
- [x] **7 Weapons** - Complete arsenal including SMG, Sniper, and RPG
- [x] **7 Zombie Types** - Full enemy variety including Boss zombies

### 🚧 Coming Soon
- [ ] **Online Multiplayer** - Full networked gameplay (lobby system ready)
- [ ] **Base Building** - Walls, gates, and auto-turrets
- [ ] **More Power-ups** - Additional temporary buffs and effects
- [ ] **Multiple Maps** - Urban, forest, military base environments
- [ ] **More Zombie Variants** - Crawlers, Jumpers, Swarmers, Summoners
- [ ] **Additional Weapons** - More variety in the arsenal
- [ ] **Daily/Weekly Challenges** - Battlepass challenge system expansion

See [DOCS/roadmap.md](DOCS/roadmap.md) for the full plan.

---

## 🤝 Contributing

Found a bug? Want to add a feature? Want to improve something awesome?

1. Fork it.
2. Branch it (`git checkout -b feature/your-awesome-feature`).
3. Code it.
4. Push it.
5. PR it.

We welcome contributions! Check out the [roadmap](DOCS/roadmap.md) for ideas, or come up with your own.

---

## 🚫 PROPRIETARY & CLOSED SOURCE

**Copyright © 2025 AfyKirby1 (OtterDays). All Rights Reserved.**

This project (ZOMBOBS - ZOMBIE APOCALYPSE WITH FRIENDS) and all associated source code, assets, design, and documentation are the sole intellectual property of **AfyKirby1**.

**[📄 CLICK HERE TO READ THE FULL LICENSE AGREEMENT](LEGAL/LICENSE.md)**

**⚠️ STRICT ACCESS AGREEMENT:**

By downloading, cloning, forking, or viewing this repository, you explicitly agree to the following terms:

1.  **🚫 CLOSED SOURCE:** This is **NOT** open-source software. The code is visible for portfolio/showcase purposes only.
2.  **🚫 NO REDISTRIBUTION:** You may NOT re-upload, host, mirror, or distribute this code or the game executable on any platform (itch.io, Steam, GitHub, etc.) without signed written consent.
3.  **🚫 NO DERIVATIVE WORKS:** You may NOT use this codebase to build your own game. "Reskinning" or "forking" for release is strictly prohibited.
4.  **🚫 NO COMMERCIAL USE:** You may NOT use any part of this project for commercial gain, including but not limited to ads, donations, or sales.
5.  **👁️ REFERENCE ONLY:** You may read the code for educational inspiration, but you may not copy-paste logic into your own commercial projects.

**Any violation of these terms will result in immediate takedown notices and potential legal action.**

*Play fair. Create your own apocalypse.*

---

<div align="center">

**Made with 🩸, 💦, and 💻 by [AfyKirby1](https://github.com/AfyKirby1)**

*Survive. Adapt. Dominate.*

</div>
