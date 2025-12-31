# SCRATCHPAD

## Active Tasks
### Campaign Mode Intro [2025-12-31] ✅ COMPLETE
- **Objective**: Implement a cinematic intro sequence for the campaign mode.
- **Changes**:
  - ✅ **Intro Screen**: Created `CampaignIntroScreen.js` with "fizzle" noise effect and typewriter text.
  - ✅ **Transition**: Seamless fade from intro to gameplay.
  - ✅ **Main Menu**: Hooked up "Campaign" button to trigger intro instead of immediate start.
  - ✅ **Docs**: Created `CAMPAIGN_DESIGN.md` with storyline and map thesis.
- **Files Modified**:
  - `js/ui/CampaignIntroScreen.js`: New class for intro sequence.
  - `js/ui/GameHUD.js`: Added intro screen to render loop.
  - `js/main.js`: Updated button logic and render loop.
- **Status**: ✅ COMPLETE

### Cursor Visibility Fix [2025-12-31] ✅ COMPLETE
- **Objective**: Fix invisible cursor in Settings menu.
- **Changes**:
  - ✅ **Draw Order**: Explicitly called `drawCursor()` after `settingsPanel.draw()` in main loop.
  - ✅ **Mouse Tracking**: Updated mousemove handler to track coordinates even when settings panel is open.
- **Status**: ✅ COMPLETE

### Map Implementation (Next)
- **Objective**: Build the first campaign map "The Railyard" based on `CAMPAIGN_DESIGN.md`.
- **Tasks**:
  - [ ] Create `MapLoader` system for static geometry.
  - [ ] Define "The Crash Site" zone geometry (JSON).
  - [ ] Implement collision for static map walls.

## Compacted History
- **Campaign Intro [2025-12-31]**: Added cinematic intro with noise effects and story text.
- **Cursor Fix [2025-12-31]**: Fixed invisible cursor in settings menu.
- **Settings System Big Features [2025-12-22]**: Added tooltips and color picker to Settings panel.
- **Settings System Quick Wins [2025-12-22]**: Reset to Defaults, Mute All, Persist Control Mode.
- **Performance Improvements Phase 2 [2025-12-22]**: In-Place Array Compaction, Double-Buffered Blood.
- **WebGPU Screen Shake Sync [2025-12-23]**: Synced shake offset between Canvas 2D and WebGPU renderers.

## Backlog
- [ ] Implement "Boss Rush" mode
- [ ] Add more weapon types (Flamethrower, Laser)
- [ ] Add sound effects for UI interactions
