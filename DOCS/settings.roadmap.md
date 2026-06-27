# ⚙️ Settings Panel Roadmap

## Overview
A beginner-friendly settings panel that allows players to customize their gaming experience. The settings panel will be accessible from the main menu and pause menu, with all preferences saved to localStorage for persistence across sessions.

## Design Philosophy
- **KISS Principle** - Keep it simple and intuitive
- **Beginner-Friendly** - Clear labels, helpful tooltips, sensible defaults
- **Visual Feedback** - Immediate preview of changes (especially audio)
- **Persistence** - All settings saved automatically to localStorage
- **Accessibility** - Large buttons, clear contrast, keyboard navigation support

---

## Phase 1: Core Settings Panel (MVP) ✅ **COMPLETED**

### 1.1 Panel Structure ✅
- **Access Points**:
  - Main menu "Settings" button ✅
  - Pause menu "Settings" option ✅
  - ESC key to close settings and return to previous screen ✅
- **Layout**: 
  - Centered modal overlay with dark semi-transparent background ✅
  - **Vertical scrolling list** with custom scrollbar ✅
  - Scroll wheel support for navigation ✅
  - "Back" button to return to previous screen ✅
  - All settings in single unified view (no separate tabs) ✅

### 1.2 Audio Settings ✅ **IMPLEMENTED**
**Priority: HIGH** - Essential for user experience

| Setting | Type | Range/Options | Default | Status |
|---------|------|---------------|---------|--------|
| **Master Volume** | Slider | 0-100% | 100% | ✅ Implemented |
| **SFX Volume** | Slider | 0-100% | 100% | ✅ Implemented |
| **Music Volume** | Slider | 0-100% | 25% | ✅ Implemented |
| **Mute All** | Toggle | On/Off | Off | ⏳ Future Enhancement |

**Implementation Notes**:
- ✅ Custom canvas sliders with visual feedback
- ✅ Real-time audio updates when sliders adjusted
- ✅ Visual indicator shows current volume level (percentage)
- ✅ SFX and Music volumes are relative to Master Volume (Master × SFX = final SFX volume)
- ✅ Separate gain nodes for music and SFX in audio system
- ✅ Settings persist to localStorage automatically

**Storage Key**: `zombobs_settings` (unified storage)

---

### 1.3 Video Settings ✅ **IMPLEMENTED** (Expanded)
**Priority: MEDIUM** - Performance and visual customization

| Setting | Type | Range/Options | Default | Status |
|---------|------|---------------|---------|--------|
| **Quality Preset** | Dropdown | Low/Medium/High/Ultra/Custom | High | ✅ Implemented (Ultra added V0.5.1) |
| **Particle Count** | Slider | 50-500 | 200 | ✅ Implemented (Custom preset only) |
| **Screen Shake Intensity** | Slider | 0-100% | 100% | ✅ Implemented |
| **Crosshair Style** | Dropdown | Default/Dot/Cross/Circle | Default | ✅ Implemented |
| **Dynamic Crosshair** | Toggle | On/Off | On | ✅ Implemented |
| **Damage Numbers** | Dropdown | Floating/Stacking/Off | Floating | ✅ Implemented |
| **Vignette** | Toggle | On/Off | On | ✅ Implemented (Custom preset only, fully wired) |
| **Shadows** | Toggle | On/Off | On | ✅ Implemented (Custom preset only, fully wired) |
| **Lighting** | Toggle | On/Off | On | ✅ Implemented (Custom preset only, fully wired) |
| **Resolution Scale** | Slider | 50%-200% | 100% | ✅ Implemented (Custom preset only, fully wired) |
| **Floating Text** | Toggle | On/Off | On | ✅ Implemented (fully wired for health/ammo pickups) |
| **Low Health Warning** | Toggle | On/Off | On | ✅ Implemented |
| **Enemy Health Bars** | Toggle | On/Off | On | ✅ Implemented |
| **Reload Bar** | Toggle | On/Off | On | ✅ Implemented |
| **Show Debug Stats** | Toggle | On/Off | Off | ✅ Implemented |
| **FPS Limit** | Dropdown | OFF/30/60/120 | OFF | ✅ Implemented |
| **Effect Intensity** | Slider | 0-200% | 100% | ✅ Implemented (V0.5.1) |
| **Post-Processing Quality** | Dropdown | Off/Low/Medium/High | Medium | ✅ Implemented (V0.5.1) |
| **Particle Detail** | Dropdown | Minimal/Standard/Detailed/Ultra | Standard | ✅ Implemented (V0.5.1) |

**Implementation Notes**:
- ✅ Quality presets automatically configure particle count and visual effects
- ✅ Ultra preset added with maximum quality settings (V0.5.1)
  - 50k WebGPU particles, 1.25x resolution scale, advanced lighting, 0.7 bloom intensity
- ✅ Custom preset allows granular control over individual settings
- ✅ Screen shake slider: 0% = no shake, 100% = default intensity
- ✅ FPS limit applies immediately when changed
- ✅ Vignette toggle controls dark edge overlay rendering
- ✅ Shadows toggle controls shadow rendering under zombies and players
- ✅ Lighting toggle controls radial gradient lighting overlay that follows player
- ✅ Resolution scale slider adjusts canvas internal resolution (50%-200%, affects performance/quality)
- ✅ Floating text toggle controls health/ammo pickup collection messages
- ✅ Effect Intensity: Multiplier for all quality-based effects (glows, auras, flashes) (V0.5.1)
- ✅ Post-Processing Quality: Controls vignette, lighting, and bloom effects (V0.5.1)
- ✅ Particle Detail: Controls particle rendering quality (gradients, glow, multi-layer) (V0.5.1)
- ✅ Quality presets now scale all visual effects: zombie glows, auras, muzzle flashes, explosions, blood splatter, damage numbers (V0.5.1)
- ✅ All settings persist to localStorage

**Storage Key**: `zombobs_settings` (unified storage)

---

### 1.4 Gameplay Settings ✅ **IMPLEMENTED**
**Priority: MEDIUM** - Gameplay customization

| Setting | Type | Range/Options | Default | Status |
|---------|------|---------------|---------|--------|
| **Auto Sprint** | Toggle | On/Off | Off | ✅ Implemented |
| **Show FPS** | Toggle | On/Off | Off | ✅ Implemented |
| **Pause on Focus Loss** | Toggle | On/Off | On | ✅ Implemented |
| **Auto-Reload** | Toggle | On/Off | On | ⏳ Future Enhancement |
| **Difficulty Preset** | Dropdown | Easy/Normal/Hard | Normal | ⏳ Future Enhancement |

**Implementation Notes**:
- ✅ Auto Sprint: Toggles sprint-by-default behavior (migrated from video settings)
- ✅ Show FPS: Controls FPS counter visibility in top-right corner
- ✅ Pause on Focus Loss: Automatically pauses game when browser window loses focus
- ✅ All settings persist to localStorage
- ⏳ Auto-reload toggle: Future enhancement for manual reload requirement
- ⏳ Difficulty preset: Placeholder for future difficulty system

**Storage Key**: `zombobs_settings` (unified storage)

---

## Phase 2: Advanced Settings

### 2.1 Control Settings ✅ **PARTIALLY IMPLEMENTED**
**Priority: HIGH** - Essential customization

| Setting | Type | Status | Description |
|---------|------|--------|-------------|
| **Input Mode Toggle** | Toggle | ✅ Implemented | Switch between KEYBOARD and CONTROLLER modes |
| **Keyboard Key Bindings** | Key Remap | ✅ Implemented | Rebind movement, shooting, weapon switching, reload, grenade keys |
| **Controller Button Bindings** | Button Remap | ✅ Implemented | Rebind gamepad buttons for all actions |
| **Scroll Wheel Switch** | Toggle | ✅ Implemented | Enable/disable scroll wheel weapon switching (keyboard only) |
| **Mouse Sensitivity** | Slider | ⏳ Future | Adjust mouse aiming sensitivity |
| **Invert Y-Axis** | Toggle | ⏳ Future | Invert vertical mouse movement (for aiming) |

**Implementation Notes**:
- ✅ Keyboard/Controller toggle button at top of Controls section
- ✅ Key binding UI: Click setting → Press new key → Save
- ✅ Gamepad binding UI: Click setting → Press controller button → Save
- ✅ Shows current key/button bindings in settings
- ✅ Separate bindings for keyboard and gamepad modes
- ✅ Button names displayed properly (A, B, X, Y, LB, RB, RT, LT, etc.)
- ✅ Settings persist to localStorage
- ⏳ Duplicate key binding prevention: Future enhancement
- ⏳ Reset to defaults option: Future enhancement

**Storage Key**: `zombobs_settings` (unified storage)

---

### 2.2 Display Settings
**Priority: LOW** - Advanced display options

| Setting | Type | Description |
|---------|------|-------------|
| **Fullscreen** | Toggle | Toggle fullscreen mode |
| **Resolution Scale** | Slider | Adjust canvas resolution (performance vs quality) |
| **VSync** | Toggle | Enable/disable vertical sync (if applicable) |
| **Color Blind Mode** | Toggle | Adjust colors for colorblind accessibility |

**Implementation Notes**:
- Fullscreen uses Fullscreen API
- Resolution scale: 50%-200% (affects canvas size)
- VSync: Browser-dependent, may not be available

**Storage Key**: `zombobs_settings_display`

---

### 2.3 Accessibility Settings
**Priority: MEDIUM** - Important for inclusivity

| Setting | Type | Description |
|---------|------|-------------|
| **High Contrast Mode** | Toggle | Increase contrast for better visibility |
| **Large UI Text** | Toggle | Increase HUD text size |
| **Reduced Motion** | Toggle | Disable screen shake and particle effects |
| **Subtitles** | Toggle | Show text for audio cues (if audio descriptions added) |

**Storage Key**: `zombobs_settings_accessibility`

---

## UI/UX Design

### Visual Design
- **Background**: Dark semi-transparent overlay (rgba(0, 0, 0, 0.85))
- **Panel**: Centered modal with rounded corners, dark theme matching game aesthetic
- **Typography**: Roboto Mono for consistency with game HUD
- **Colors**: 
  - Primary: #ff1744 (game red)
  - Secondary: #ff9800 (orange accents)
  - Text: #ffffff (white)
  - Disabled: #666666 (gray)

### Layout Structure ✅ **IMPLEMENTED**
```
┌─────────────────────────────────────┐
│         SETTINGS                     │
│  ─────────────────────────────────   │
│                                     │
│  🔊 AUDIO                            │
│  ─────────────────────────────────   │
│  Master Volume:  [━━━━━━━━━] 100%  │
│  Music Volume:    [━━━━━━     ]  25%  │
│  SFX Volume:      [━━━━━━━━━] 100%  │
│                                     │
│  🎨 VIDEO                            │
│  ─────────────────────────────────   │
│  Quality Preset:  [▼] High          │
│  Screen Shake:    [━━━━━━━━━] 100%  │
│  Crosshair Style: [▼] Default       │
│  Dynamic Crosshair: [●] On          │
│  Damage Numbers:  [▼] Floating      │
│  Low Health Warning: [●] On          │
│  Enemy Health Bars: [●] On          │
│  Reload Bar:       [●] On          │
│  Show Debug Stats: [○] Off         │
│  FPS Limit:        [▼] OFF         │
│                                     │
│  🎮 GAMEPLAY                         │
│  ─────────────────────────────────   │
│  Auto Sprint:        [○] Off       │
│  Show FPS:           [○] Off       │
│  Pause on Focus Loss: [●] On       │
│                                     │
│  🎮 CONTROLS                         │
│  ─────────────────────────────────   │
│  [ KEYBOARD ] [ CONTROLLER ]        │
│                                     │
│  Move Up:      [ W ]                │
│  Move Down:    [ S ]                │
│  Move Left:    [ A ]                │
│  Move Right:   [ D ]                │
│  Sprint:       [ SHIFT ]            │
│  Reload:       [ R ]                │
│  ... (scrollable)                   │
│                                     │
│              [ BACK ]               │
│                                     │
│  [Scrollbar]                        │
└─────────────────────────────────────┘
```

### Interaction Design ✅ **IMPLEMENTED**
- **Sliders**: ✅
  - Click and drag to adjust ✅
  - Click on track to jump to position ✅
  - Show numeric value next to slider (percentage or number) ✅
  - Real-time preview for audio sliders ✅
  - Visual handle with hover glow effect ✅
- **Toggles**: ✅
  - Large clickable areas ✅
  - Visual on/off state (red filled = on, gray = off) ✅
  - Smooth animation on toggle ✅
  - White circular handle indicator ✅
- **Dropdowns**: ✅
  - Click to open, click option to select ✅
  - Highlight current selection with red accent ✅
  - Dropdown menu appears below control ✅
- **Scrollbar**: ✅
  - Custom scrollbar on right side of panel ✅
  - Click and drag to scroll ✅
  - Scroll wheel support ✅
  - Visual thumb with hover effect ✅
- **Keybind Rebinding**: ✅
  - Click keybind button to enter rebind mode ✅
  - Press new key/button to assign ✅
  - Visual feedback during rebinding (red highlight) ✅
  - Escape key cancels rebinding ✅
- **Input Mode Toggle**: ✅
  - Click left half for KEYBOARD mode ✅
  - Click right half for CONTROLLER mode ✅
  - Active mode highlighted with red gradient ✅
- **Navigation**: ⏳
  - ESC to close settings panel ✅
  - Scroll wheel for navigation ✅
  - ⏳ Tab key navigation: Future enhancement
  - ⏳ Enter/Space activation: Future enhancement

---

## Implementation Plan

### Step 1: Settings Data Structure
```javascript
const defaultSettings = {
    audio: {
        masterVolume: 1.0,      // 0.0 to 1.0
        sfxVolume: 1.0,        // 0.0 to 1.0
        musicVolume: 0.25,    // 0.0 to 1.0 (halved 2026-06-26 for gunshot clarity)
        muted: false
    },
    graphics: {
        screenShakeIntensity: 1.0,  // 0.0 to 2.0
        particlesEnabled: true,
        showFPS: true,
        renderQuality: 'high'        // 'low', 'medium', 'high'
    },
    gameplay: {
        autoReload: true,
        showDamageNumbers: true,
        showCrosshair: true,
        difficulty: 'normal'         // 'easy', 'normal', 'hard'
    }
};
```

### Step 2: Settings Manager Class
```javascript
class SettingsManager {
    constructor() {
        this.settings = this.loadSettings();
    }
    
    loadSettings() {
        // Load from localStorage or return defaults
    }
    
    saveSettings() {
        // Save to localStorage
    }
    
    getSetting(category, key) {
        // Get specific setting value
    }
    
    setSetting(category, key, value) {
        // Set specific setting value and save
    }
    
    resetToDefaults() {
        // Reset all settings to defaults
    }
}
```

### Step 3: Settings UI Component
```javascript
class SettingsPanel {
    constructor(canvas, settingsManager) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.settingsManager = settingsManager;
        this.visible = false;
        this.selectedCategory = 'audio';
    }
    
    draw() {
        // Render settings panel UI
    }
    
    handleClick(x, y) {
        // Handle button/slider clicks
    }
    
    handleKeyPress(key) {
        // Handle keyboard navigation
    }
}
```

### Step 4: Integration Points
- **Audio System**: Apply volume settings to all audio nodes
- **Screen Shake**: Multiply shakeAmount by screenShakeIntensity
- **Particle System**: Check particlesEnabled before creating particles
- **HUD**: Show/hide FPS counter based on setting
- **Gameplay**: Check autoReload setting before auto-reloading

---

## Testing Checklist

### Audio Settings
- [ ] Master volume slider adjusts all sounds
- [ ] SFX volume slider adjusts only sound effects
- [ ] Music volume slider adjusts only music (when implemented)
- [ ] Mute toggle works correctly
- [ ] Settings persist after page reload
- [ ] Test sound plays when adjusting sliders

### Graphics Settings
- [ ] Screen shake intensity affects camera shake
- [ ] Particle toggle disables/enables all particles
- [ ] FPS counter shows/hides correctly
- [ ] Render quality affects particle counts
- [ ] Settings persist after page reload

### Gameplay Settings
- [ ] Auto-reload toggle works correctly
- [ ] Damage numbers show/hide correctly
- [ ] Crosshair shows/hides correctly
- [ ] Settings persist after page reload

### UI/UX
- [ ] Settings panel opens from main menu
- [ ] Settings panel opens from pause menu
- [ ] ESC key closes settings panel
- [ ] Back button returns to previous screen
- [ ] All controls are keyboard accessible
- [ ] Settings save automatically on change
- [ ] Reset to defaults works correctly

---

## Future Enhancements

### Phase 3: Advanced Features
- **Profile System**: Multiple player profiles with different settings
- **Import/Export**: Share settings via JSON export/import
- **Presets**: Quick-select presets (Performance, Quality, Balanced)
- **Tooltips**: Helpful descriptions for each setting
- **Search**: Search bar to quickly find settings

### Phase 4: Platform-Specific
- **Mobile**: Touch-optimized controls and settings
- **Console**: Controller support and settings
- **Steam Deck**: Optimized presets for handheld devices

---

## Technical Considerations

### localStorage Structure
```javascript
// Settings stored as JSON string
localStorage.setItem('zombobs_settings', JSON.stringify({
    audio: { ... },
    graphics: { ... },
    gameplay: { ... },
    version: '1.0'  // For future migration
}));
```

### Performance Impact
- Settings panel should not impact game performance when closed
- Slider updates should be throttled/debounced if needed
- Settings checks should be minimal overhead

### Browser Compatibility
- localStorage available in all modern browsers
- Fullscreen API may need fallback for older browsers
- Audio context volume control works in all modern browsers

---

## Success Metrics ✅ **ACHIEVED**
- ✅ Settings panel accessible from main menu and pause menu
- ✅ All Phase 1 settings functional and persistent
- ✅ Zero performance impact when settings panel is closed
- ✅ Settings apply immediately without requiring restart
- ✅ Settings survive page reload
- ✅ Vertical scrolling works smoothly with scrollbar and wheel
- ✅ Keyboard and Controller modes fully functional
- ✅ All audio settings work independently
- ✅ Video settings apply in real-time
- ⏳ Reset to defaults: Future enhancement

---

## Next Steps
1. ✅ **SettingsManager class** - Core settings management (COMPLETED)
2. ✅ **SettingsPanel UI component** - Visual settings interface (COMPLETED)
3. ✅ **Integration with existing systems** - Apply settings to audio, graphics, gameplay (COMPLETED)
4. ✅ **localStorage persistence** - Save and load settings (COMPLETED)
5. ✅ **Test and polish** - Smooth UX and functionality (COMPLETED)

### Future Enhancements
1. ⏳ **Reset to Defaults** button - Quick way to restore all settings
2. ⏳ **Keyboard Navigation** - Tab key to cycle through settings
3. ⏳ **Mouse Sensitivity** slider - Adjust aiming sensitivity
4. ⏳ **Invert Y-Axis** toggle - For inverted mouse controls
5. ⏳ **Duplicate Key Prevention** - Warn when binding same key twice
6. ⏳ **Settings Profiles** - Multiple player profiles with different settings
7. ⏳ **Import/Export Settings** - Share settings via JSON

---

### WebGPU Controls Tooltips

- WebGPU Enabled: Turns GPU renderer on/off. Disabled uses Canvas 2D fallback.
- Bloom Intensity: Controls glow strength. Set to 0 to disable bloom.
- Particle Count: Low (off/CPU), High (~10k GPU points), Ultra (~50k GPU points).
- Lighting Quality: Off disables, Simple adds subtle rim lighting, Advanced increases intensity/effects.
- Distortion Effects: Enables background shockwave swirl; mildly increases GPU work.

*Last Updated: 2025-01-XX - Phase 1 Complete, Phase 2 In Progress*

