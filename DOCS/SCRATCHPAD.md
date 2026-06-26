<!-- PRESERVATION RULE: Never delete or replace content. Append or annotate only. -->
# SCRATCHPAD

## Active Tasks
### Scavenger Update — Scrap System (v0.8.2.2) [Active]
- **Objective**: Wire scrap drops, magnetic pickup, HUD counter from zombie kills.
- **Tasks**:
  - [x] Normalize `gameState` scrap fields + reset on new game
  - [x] `ScrapPickup` entity — magnetic pull, glint, death-spawn
  - [x] Render + per-frame update in `EntityRenderSystem` / `main.js`
  - [x] Collection via `handlePickupCollisions` (not `shootBullet`)
  - [x] Zombie death drops via `PickupSpawnSystem.tryDropScrapFromZombie`
  - [x] HUD scrap stat (desktop + mobile, Score preserved)
- **Current Status**: ✅ Complete — manual browser test pending

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
1. **In-game MP3 music + load perf (2026-06-25)**: Replaced procedural `ArcadeMusicSystem` with looping MP3 playlist (`the_mountain…`, `viacheslavstarostin…`); menu stays `Shadows of the Wasteland`. Deferred WebGPU ZombobsFX/flashlight init, blood grid, ground texture, game-loop start, leaderboard fetch; lazy menu-music preload only. Fixed local `SERVER_URL` auto-detect + `/health` cookie; guard `updateFlashlight` until GPU buffers exist (black-screen crash). Console filter for font warnings.
2. **Scavenger Update scrap wiring (2026-06-25)**: Finished half-built scrap feature — zombie death drops, magnetic pickup update/render loop, `handlePickupCollisions` collection, HUD scrap stat, `gameState` reset. Removed random timer spawn stub.
3. **Runtime bugfixes (2026-06-14)**: Removed stray `}` in `combatUtils.js` quadtree init (syntax error at load); added missing `xpBarWidth` in `GameHUD.drawCoopHUD()`; added `mobile-web-app-capable` meta to `index.html`.
4. **Itch.io ship verified (2026-04-06)**: User confirmed itch working; added zip **validation gate** to `build-itch.ps1` + mandatory script section in guide + checklist + SUMMARY/changelog.
5. **Itch.io 403 fix (2026-04-06)**: Windows ZIP backslashes vs itch `/` paths; script builds POSIX entry names only.

## Active Tasks
- [x] Verify mobile settings panel fix
- [x] Mobilify HUD (Auto-scaling for small screens)
- [x] Fix Main Menu Touch Interaction
- [x] Hide Keybinds & Add Pause Button on Mobile
- [x] Fix Menu UI Size on Mobile
- [x] Revamp Mobile HUD (Move Stick, Optimize Bottom bar)
- [ ] Expand Car Builder Parts
- [ ] Debug Main Menu Buttons
