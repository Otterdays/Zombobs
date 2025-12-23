# SCRATCHPAD

## Active Tasks
### Settings System Big Features [2025-12-22] ✅ COMPLETE
- **Objective**: Add tooltips and color picker to Settings panel.
- **Changes**:
  - ✅ **Tooltips on Hover**: Shows helpful description after 400ms hover delay.
    - Added `TOOLTIPS` dictionary with 50+ setting descriptions.
    - Smart positioning (flips left if would overflow right edge).
    - Word-wrapped text with rounded tooltip box.
    - Dark background with red accent border.
  - ✅ **Crosshair Color Picker**: Opens color swatch modal when clicking color preview.
    - 15 preset colors in a 5x3 grid.
    - Current color preview with hex code.
    - Click swatch to select, "DONE" to close.
    - Clicking outside also closes picker.
- **Files Modified**:
  - `js/ui/SettingsPanel.js`: Added TOOLTIPS, drawTooltip(), drawColorPicker(), drawColorSwatch(), updateHoveredControl()
- **Status**: ✅ COMPLETE

### Settings System Quick Wins [2025-12-22] ✅ COMPLETE
- **Objective**: Implement quick-win improvements to Settings system.
- **Changes**:
  - ✅ **Reset to Defaults Button**: Added orange "RESET ALL" button in footer alongside "BACK".
  - ✅ **Mute All Toggle**: Added at top of Audio settings tab for quick access.
  - ✅ **Persist Control Mode**: Keyboard/Gamepad preference now saved to `ui.controlMode` setting.
  - ✅ **Settings Version Tracking**: Added `_version` field and `SETTINGS_VERSION` constant.
  - ✅ **Error Logging**: Replaced silent `catch` blocks with `console.warn()` logging.
- **Status**: ✅ COMPLETE

### Performance Improvements Phase 2 [2025-12-22] ✅ COMPLETE
- **Objective**: Optimize rendering and memory to support 60fps on WebGPU/Canvas.
- **Changes**:
  - ✅ **In-Place Array Compaction**: Replaced all `.filter()` calls in hot paths with `compactArray()` (swap-and-pop).
  - ✅ **Double-Buffered Blood Simulation**: Implemented grid swapping for blood physics.
  - ✅ **Batched Particle Rendering**: Grouped particles by color/size for Canvas 2D fallback.
  - ❌ **Entity Sprite Caching**: REVERTED - Caused rendering issues (clipping, method binding).
  - ✅ **Date.now() Caching**: Cached timestamp per frame in `main.js`.

## Compacted History
- Main Menu Polish [2025-12-22] - Added glowing zombie eyes, explosion effects, ground texture buttons
- Version Update [2025-12-22] - Bumped to V0.8.2.0 ALPHA

## Backlog
- [ ] Add sound effects for UI interactions
- [ ] Implement "Boss Rush" mode
- [ ] Add more weapon types (Flamethrower, Laser)
- [ ] Add tooltips to Settings controls
- [ ] Add crosshair color picker to Settings
