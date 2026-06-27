<!-- PRESERVATION RULE: Never delete or replace content. Append or annotate only. -->
# SCRATCHPAD

## Active Tasks
### Audio Balance — Music vs Gunshots (2026-06-26) ✅ COMPLETE
- **Done**: Halved default `audio.musicVolume` (`0.5` → `0.25`) so MP3 menu/gameplay tracks sit under gunfire without boosting SFX.
- **Done**: Settings schema v3 migration — existing saves still on legacy default `0.5` auto-migrate to `0.25`; custom music levels untouched.
- **Done**: Updated fallbacks in `AudioSystem.js` and `ArcadeMusicSystem.js`.
- **Docs**: `CHANGELOG`, `SUMMARY`, `settings.roadmap`, `ARCHITECTURE`.

### Main Menu Startup Performance (2026-06-26) ✅ COMPLETE
- **Done**: Cached menu scoreboard/recent-run reads to avoid per-frame `localStorage` parse/sort.
- **Done**: Prerendered creepy background scanlines/vignette and throttled noise draw.
- **Done**: Deferred WebGPU renderer module load/init until first gameplay or WebGPU setting re-enable.
- **Done**: Deferred vendored Socket.IO client load until multiplayer/network init.
- **Done**: Added `zombobs:*` performance marks/measures; enable console logs with `?perf=1` or `localStorage.zombobs_perf='1'`.
- **Done**: V0.9.0 modality sweep — menu version/news ticker, About screen, landing + mobile mirror, itch copy, launcher, server package metadata, `SUMMARY`, `CHANGELOG`.
- **Done**: Smooth game entry — idle WebGPU + ground texture warm-up on menu; async `startGame()` with canvas prep overlay when GPU not ready; `gpuCanvas` opacity fade-in.
- **Next**: Browser QA cold boot, first Play click with WebGPU enabled, multiplayer lobby connect.

### Class Tree System (3×5 hybrid) [2026-06-25] ✅ COMPLETE
- **Done**: `skillTreeDefinitions.js` — Gunner/Survivor/Scavenger × 5 skills, prereq chains, hybrid pool with flat 16.
- **Done**: `SkillSystem` merge pools, tree weight 0.35, `getSkillById`, profile unlock tracking.
- **Done**: Combat — fire rate, pierce, damage mult, Executioner, Second Wind, magnet, bloodlust/adrenaline tuning.
- **Done**: LevelUpScreen tree badge + tagline; GameHUD tree accent bar.
- **Done**: Tree Master achievement + `treeSkillsUnlocked` profile stat.
- **Done**: Docs — SUMMARY, CHANGELOG, XP_AND_SKILLS_SYSTEM, ARCHITECTURE, roadmap, RANK_PROGRESSION, REFACTOR_PLAN.
- **Next**: Browser QA — pick tree T1→T5 path, verify prereqs block early tiers, co-op level-up sync.

### Controls Panel → Settings (2026-06-25) ✅ COMPLETE
- Removed `GameHUD.drawInstructions()` in-game overlay; bottom HUD layout via `getBottomHudRowY()`.
- Settings → Controls: mouse fixed section, cycle throwable, dodge, throw throwable labels, gamepad sticks.
- Docs + V0.8.4 modality: `NEWS_UPDATES`, landing bubbles, itch, `CHANGELOG`, `ARCHITECTURE`.

### Wave Chaos Escalation [2026-06-25]
- **Done**: Dynamic wave breaks, scaled spawn stagger/bursts, 5 wave mutators (SWARM/ELITES/VOLATILE/ENCIRCLE/RUSH), boss minions, music intensity scaling, brief-break UI.
- **Next**: Browser QA waves 5–15; tune mutator rates if too punishing.

### Campaign Zone: The Railyard [Active]
- **Objective**: Build the first campaign map based on `CAMPAIGN_DESIGN.md`.
- **Tasks**:
  - [ ] Create `MapLoader` system for static zone geometry (JSON).
  - [ ] Define "The Crash Site" zone geometry.
  - [ ] Implement collision for static map walls/props.
- **Current Status**: ⏳ Planning

### Android WebView Wrapper (Capacitor) [Active]
- **Objective**: Ship Android APK using Capacitor WebView wrapper.
- **Tasks**:
  - [x] Create `mobile/` Capacitor app with Android platform.
  - [x] Add web sync script to populate `mobile/www`.
  - [x] Set app icon/splash from `assets/icons/favicon.png`.
  - [x] Bundle Google Fonts locally for offline play.
  - [x] Upgrade Android Gradle wrapper to 8.13 (JDK 17/19).
  - [ ] QA touch-first UX.
- **Current Status**: ⏳ In progress

## Compacted History
- **Class Tree System — hybrid 3×5 (2026-06-25) ✅ COMPLETE**
  - `skillTreeDefinitions.js` (Gunner/Survivor/Scavenger × 5), hybrid with flat 16, prereqs, 35% tree weight, combat hooks, tree UI, Tree Master achievement. Docs: SUMMARY, CHANGELOG, XP_AND_SKILLS, ARCHITECTURE, roadmap, RANK_PROGRESSION, REFACTOR_PLAN.
- **v0.8.4 ALPHA — The Chaos & Horde Update (2026-06-25) ✅ RELEASED**
  - Version bump: `MainMenuScreen`, `AboutScreen`, `landing.html`, `NEWS_UPDATES`, `launch.ps1`, server `package.json`, itch copy, `mobile/www` sync.
  - Ship list: Wave Chaos, Scrap Shop shrine, zombie visual AI + torso overlays, MP3 soundtrack, controls in Settings (overlay removed), GameLoopSystem refactor, touch gate fix.
- **Scrap Shop / Wave-Break Shrine (2026-06-25) ✅ COMPLETE**
  - `ScrapShrine` + `ScrapShopSystem`; 45% spawn wave 4+ on break; E buy (Ammo 20 / Shield 30 / Overclock 40); tooltip; reset on wave start. Multiplayer gated.
- **Zombie Visual Polish — Torso Overlays + Organic Motion (2026-06-25) ✅ COMPLETE**
  - Additive torso overlays (5 types, ~70% spawn, id-deterministic) on upright zombies.
  - Gaze-tracking eyes, velocity lean/bob, cosmetic micro-behaviors, hit recoil flash.
  - Per-type `getMotionProfile()` for fast/armored/exploding/spitter; spitter throat pulse.
  - Docs: `SUMMARY.md`, `CHANGELOG.md`, `ARCHITECTURE.md`, `My_Thoughts.md`.
- **Scavenger Update — Scrap System (2026-06-25) ✅ COMPLETE**
  - Zombie death drops (`tryDropScrapFromZombie`), magnetic `ScrapPickup` update/render, `handlePickupCollisions` collection, HUD scrap stat, `gameState` reset. Removed random timer spawn stub.
- **Runtime bugfixes — combatUtils / GameHUD / index.html (2026-06-14) ✅ COMPLETE**
  - **combatUtils.js**: Removed stray `}` in quadtree init inside `handleBulletZombieCollisions()` — fixed module parse error (`Unexpected token '}'`).
  - **GameHUD.js**: Added missing `xpBarWidth = 280 * scale` in `drawCoopHUD()` — fixed co-op HUD `ReferenceError`.
  - **index.html**: Added `mobile-web-app-capable` meta alongside Apple PWA tag.
- **v0.9.2.0 - Throwable Upgrade (Molotov Cocktail) & Dodge Game Feel (2026-06-15) ✅ COMPLETE**
  - **Molotov Cocktail**: Implemented Molotov throwable class that explodes instantly on impact or zombie hit, spawning a visual fire pool using radial gradients.
  - **Fiery Area Damage**: Fire pool ticks damage on both players and zombies, applying a 3-second burn DoT timer and handling deaths, score rewards, and multipliers.
  - **Throwable Cycling**: Mapped keybind Q (keyboard) and D-pad Down (gamepad) to toggle active throwables (Grenade vs Molotov).
  - **HUD Improvements**: Dynamic UI rendering of current throwable icon/count, with a satisfying scale bounce animation on cycling.
  - **Dodge Game Feel**: Added screen shake on roll start and "DODGED!" floating combat text when i-framing through damage.
- **v0.9.1.0 - Retro Arcade Features & Optimizations (2026-06-15) ✅ COMPLETE**
  - **Dodge Roll**: Added Space / B-button dodge mechanic with stamina cost, i-frames, whoosh sound, and ghost trails.
  - **Explosive Barrels**: Added procedurally spawned red metal barrels that flash, explode on fuse, chain detonate, damage nearby players, and wreckage.
  - **Headshots**: Implemented standard and piercing bullet headshot decapitation, skull props drops, bone particles, and golden popups.
  - **Performance**: Cached mobile checks and UI scale calculations in GameHUD; optimized zombie aura drawing to use squared distance check.
- **Itch.io zip validation + docs (2026-04-06) ✅ COMPLETE**
  - **Build gate**: `ITCH/build-itch.ps1` fails if zip entries contain `\` or required paths missing (prevents repeat of CDN 403).
  - **Docs**: `ITCH_IO_GUIDE.md` mandatory script rule; `VERSION_UPDATE_CHECKLIST.md` §6; `SUMMARY.md` status + file tree amendment for `index.html`/`landing.html`.
- **v0.8.3.9 - Itch.io Path Fix (2026-01-01) ✅ COMPLETE**
  - **Asset Paths**: Reverted `index.html` references to clean relative paths (e.g. `css/style.css` instead of `./css/style.css`) as specifically requested by internal documentation for Itch.io compatibility.
- **v0.8.3.8 - Local Server Fix (2026-01-01) ✅ COMPLETE**
  - **Routing Bug Fix**: Corrected `server.js` root route (`/`) to serve `landing.html`. It was accidentally pointing to `index.html` (the Game) after the file restructure.
- **v0.8.3.7 - File Restructure (2026-01-01) ✅ COMPLETE**
  - **Renaming**: Renamed `index.html` → `landing.html` and `zombie-game.html` → `index.html`.
  - **Linking**: Updated "Play Now" button in `landing.html` to point to `index.html`.
  - **Build Script**: Updated `build-itch.ps1` to simply copy the now correctly-named `index.html`.
- **v0.8.3.6 - Itch.io Deployment Fix (2026-01-01) ✅ COMPLETE**
  - **Deployment Config**: Updated `zombie-game.html` to use explicit relative paths (`./`) and removed `crossorigin="anonymous"` from CSS/JS links.
  - **Verification**: Validated `build-itch.ps1` output structure for proper Itch.io hosting (Index at root, relative assets).
- **v0.8.3.5 - Battlepass Fix & Headshot Detection (2025-12-31) ✅ COMPLETE**
  - **Headshot System**: Enhanced `checkZombieCollision` (in `gameUtils.js`) to distinguish between upper-body (Head/Torso) and lower-body hits. Killing a zombie with an upper-body hit now grants a "Headshot".
  - **Pickup Tracking**: Implemented session-level tracking for all collected powerups (Health, Ammo, Nuke, etc.) to satisfy "Collect X Pickups" quests.
  - **Data Pipeline**: Integrated session-based `headshots` and `pickupsCollected` into the `GameStateManager` and `PlayerProfileSystem` pipeline.
  - **Challenge Logic**: Verified that cumulative challenge progress (e.g., "Total Kills") persists across multiple game sessions.
- **v0.8.3.4 - UI Layering & Overlay Fixes (2025-12-31) ✅ COMPLETE**
  - **Stacking Fix**: Moved `uiCanvas` to `position: fixed` with Z-index 2000.
  - **Input Logic**: Re-mapped `Escape` to close overlays; blocked gameplay input (WASD) while they're visible.
- **v0.8.3.3 - Responsive HUD & UI Audio (2025-12-31) ✅ COMPLETE**
  - **HUD Redesign**: Created "Glass Tech" stacked layout for 50px unified bottom-UI.
  - **UI Audio**: Integrated procedural hover "Tick" and click "Pip" sounds across all menus.
  - **Legibility**: Increased weapon box dimensions and added vertical color accent bars.
- **v0.8.3.2 - Armory & Audio Expansion (2025-12-31) ✅ COMPLETE**
  - **New Weapon**: Laser Gun (Slot 8) with instant raycast logic.
  - **Weapon Logic**: Implemented "Logic Bullet" for instant-hit weapon reward reuse.
  - **Menu Audio**: Added procedural "Pip" sounds for all settings interactions.
  - **UI/UX**: Updated keybind labels and default controls for expanded weapon set.
- **v0.8.3.1 - Refinement Sprint (2025-12-31) ✅ COMPLETE**
  - **Audio Overhaul**: Replaced tonal SFX with visceral synthesized textures.
    - ✅ **Impacts**: Multi-layered synthesized "meaty" thuds.
    - ✅ **Hit Markers**: Noise-based mechanical "ticks".
    - ✅ **Kill Sounds**: Wet noise squelch/splat.
    - ✅ **Multiplier**: Dual-oscillator "Crystal Shimmer" (short/quiet).
    - ✅ **Mixer**: Independent volume settings for all SFX layers.
  - **Visual Diversity**: Refined the 8 Normal Zombie variants.
    - ✅ **Animations**: Sinusoidal walking feet and dual swaying arms.
    - ✅ **Cohesion**: Added long sleeves (clothing colored) and visible hands. 🧟‍♂️✨
  - **Arcade Music**: Procedural dynamic soundtrack scaling with intensity.
  - **UX/UI**: Dark Mode landing page, Cursor visibility fixes, Campaign Intro.
- **Campaign Intro [2025-12-31]**: Added cinematic intro with noise effects and story text.
- **Cursor Fix [2025-12-31]**: Fixed invisible cursor in settings menu.
- **Settings System Big Features [2025-12-22]**: Added tooltips and color picker to Settings panel.
- **Performance Improvements Phase 2 [2025-12-22]**: In-Place Array Compaction, Double-Buffered Blood.
- **WebGPU Screen Shake Sync [2025-12-23]**: Synced shake offset between Canvas 2D and WebGPU renderers.

## Backlog
- [ ] Implement "Boss Rush" mode
- [ ] Add rest of weapon placeholders (Flamethrower is done, Laser is done)
- [ ] Build "The Crash Site" zone geometry for Railyard zone.

## Blocked Items
- [ ] Survival Mode (Disabled in code)

## Recent Context (last 5 actions)
1. **Class Tree docs (2026-06-25)**: SUMMARY, XP_AND_SKILLS_SYSTEM, ARCHITECTURE, roadmap, RANK_PROGRESSION, REFACTOR_PLAN updated for hybrid 3×5 trees.
2. **Class Tree System shipped (2026-06-25)**: `skillTreeDefinitions.js`, SkillSystem hybrid pool, combat hooks, LevelUp/HUD tree UI, Tree Master achievement.
3. **Docs refresh (2026-06-25)**: Updated SUMMARY, CHANGELOG, REFACTOR_PLAN, ARCHITECTURE, My_Thoughts for Phase 4 / collision split / touch-control fix.
4. **Desktop touch-control fix (2026-06-25)**: Gated `TouchControlSystem` + virtual gamepad behind `isMobileDevice()`.
5. **GameLoopSystem syntax fix (2026-06-25)**: Added missing `}` on `_updateMusicIntensity()` — fixed load crash at `draw()`.

## Active Tasks
- [x] Verify mobile settings panel fix
- [x] Mobilify HUD (Auto-scaling for small screens)
- [x] Fix Main Menu Touch Interaction
- [x] Hide Keybinds & Add Pause Button on Mobile
- [x] Fix Menu UI Size on Mobile
- [x] Revamp Mobile HUD (Move Stick, Optimize Bottom bar)
- [ ] Expand Car Builder Parts
- [ ] Debug Main Menu Buttons
