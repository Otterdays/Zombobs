# SCRATCHPAD

## Active Tasks
### Campaign Zone: The Railyard [Active]
- **Objective**: Build the first campaign map based on `CAMPAIGN_DESIGN.md`.
- **Tasks**:
  - [ ] Create `MapLoader` system for static zone geometry (JSON).
  - [ ] Define "The Crash Site" zone geometry.
  - [ ] Implement collision for static map walls/props.
- **Current Status**: ⏳ Planning

## Compacted History
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
