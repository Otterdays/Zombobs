<!-- PRESERVATION RULE: Never delete or replace content. Append or annotate only. -->
# Refactor Plan: Zombie Survival Game

## Status
**Phase 1: COMPLETED** ✅ (2025-11-19)  
**Phase 2: COMPLETED** ✅ (2025-11-19)
**Phase 3: COMPLETED** ✅ (2025-01-XX)
**Phase 4: COMPLETED** ✅ (2026-06-25)

## Objective
Decompose the monolithic `zombie-game.html` file into separate HTML, CSS, and JavaScript files, then further modularize the JavaScript into ES6 modules to improve maintainability, readability, and development workflow.

## Execution Order

1.  **Preparation**: Create necessary directory structure.
2.  **Extraction**: Move code to dedicated files.
3.  **Integration**: Link new files back to the HTML.
4.  **Modularization**: Split JavaScript into ES6 modules.
5.  **Verification**: Ensure game functionality remains unchanged.

## Refactor Checklist

### Phase 1: Separation of Concerns (Immediate) ✅ **COMPLETED** [2025-11-19]
- [x] **Create Directories**
    - [x] Create `css/` folder at root.
    - [x] Create `js/` folder at root.
- [x] **Extract CSS**
    - [x] Copy content between `<style>` tags in `zombie-game.html`.
    - [x] Create `css/style.css` and paste content.
    - [x] Remove `<style>` block from `zombie-game.html`.
- [x] **Extract JavaScript**
    - [x] Copy content between `<script>` tags in `zombie-game.html`.
    - [x] Create `js/game.js` and paste content.
    - [x] Remove inline script content from `zombie-game.html`.
- [x] **Update HTML**
    - [x] Add `<link rel="stylesheet" href="css/style.css">` to `<head>`.
    - [x] Add `<script src="js/game.js"></script>` to `<body>`.
- [x] **Verification**
    - [x] Open `zombie-game.html` in browser.
    - [x] Check console for errors.
    - [x] Verify gameplay, audio, and visuals.

**Phase 1 Results:**
- HTML file reduced from ~3,791 lines to 16 lines
- CSS extracted to `css/style.css` (~30 lines)
- JavaScript extracted to `js/game.js` (~3,744 lines)
- All functionality preserved
- Documentation updated (CHANGELOG, SUMMARY, ARCHITECTURE, SCRATCHPAD)

### Phase 2: Code Modularization ✅ **COMPLETED** [2025-11-19]
- [x] **Adopt ES Modules**
    - [x] Change script tag to `<script type="module" src="js/main.js"></script>`.
- [x] **Create Module Structure**
    - [x] Create `js/core/` directory (constants, canvas, gameState)
    - [x] Create `js/entities/` directory (Bullet, Zombie, Particle, Pickup, Grenade, Shell)
    - [x] Create `js/systems/` directory (Audio, Graphics, Particle, Settings)
    - [x] Create `js/ui/` directory (GameHUD, SettingsPanel)
    - [x] Create `js/utils/` directory (combatUtils, gameUtils)
- [x] **Extract Core Modules**
    - [x] `js/core/constants.js` - All game constants and weapon definitions
    - [x] `js/core/canvas.js` - Canvas initialization and resize functions
    - [x] `js/core/gameState.js` - Centralized game state object and reset function
- [x] **Extract Entity Classes**
    - [x] `js/entities/Bullet.js` - Bullet class
    - [x] `js/entities/Zombie.js` - All zombie variants (Normal, Fast, Exploding, Armored)
    - [x] `js/entities/Particle.js` - Particle and DamageNumber classes
    - [x] `js/entities/Pickup.js` - HealthPickup and AmmoPickup classes
    - [x] `js/entities/Grenade.js` - Grenade class
    - [x] `js/entities/Shell.js` - Shell casing class
- [x] **Extract System Modules**
    - [x] `js/systems/AudioSystem.js` - All audio functions (gunshot, damage, footsteps, etc.)
    - [x] `js/systems/GraphicsSystem.js` - Graphics utilities (grass pattern)
    - [x] `js/systems/ParticleSystem.js` - Particle effects and blood splatter
    - [x] `js/systems/SettingsManager.js` - Settings persistence
- [x] **Extract UI Modules**
    - [x] `js/ui/GameHUD.js` - Complete HUD component
    - [x] `js/ui/SettingsPanel.js` - Settings panel UI
- [x] **Extract Utility Modules**
    - [x] `js/utils/combatUtils.js` - Combat functions (shooting, explosions, collisions)
    - [x] `js/utils/gameUtils.js` - General utilities (collision, notifications, high score)
- [x] **Create Main Entry Point**
    - [x] `js/main.js` - Game loop, initialization, event handlers
- [x] **Refactor Global Variables**
    - [x] Move global state to `gameState` object in `js/core/gameState.js`
    - [x] All modules import from centralized state

**Phase 2 Results:**
- JavaScript split from 1 monolithic file (~3,744 lines) into 20+ modular files
- Clear separation of concerns (core, entities, systems, ui, utils)
- ES6 module system with proper imports/exports
- No circular dependencies
- All functionality preserved
- Improved code organization and maintainability

### Phase 3: System Extraction from main.js ✅ **COMPLETED** [2025-01-XX]
- [x] **Extract Multiplayer System**
  - [x] Create `js/systems/MultiplayerSystem.js`
  - [x] Extract multiplayer networking logic (~545 lines)
  - [x] Handle Socket.IO connections, player sync, zombie sync, game state sync
- [x] **Extract Zombie Spawn System**
  - [x] Create `js/systems/ZombieSpawnSystem.js`
  - [x] Extract zombie and boss spawning logic (~155 lines)
  - [x] Handle wave-based spawning and spawn indicators
- [x] **Extract Player System**
  - [x] Create `js/systems/PlayerSystem.js`
  - [x] Extract player updates, rendering, and co-op lobby (~520 lines)
  - [x] Handle multi-input support, movement, actions, rendering
- [x] **Extract Game State Manager**
  - [x] Create `js/systems/GameStateManager.js`
  - [x] Extract game lifecycle management (~83 lines)
  - [x] Handle game start, restart, game over
- [x] **Extract Melee System**
  - [x] Create `js/systems/MeleeSystem.js`
  - [x] Extract melee attack logic (~131 lines)
  - [x] Handle melee attacks and range checking
- [x] **Extract Drawing Utilities**
  - [x] Create `js/utils/drawingUtils.js`
  - [x] Extract drawing utility functions (~263 lines)
  - [x] Handle crosshair, wave UI, FPS counter, melee swipe rendering
- [x] **Update main.js**
  - [x] Import new system modules
  - [x] Create system instances
  - [x] Replace function calls with system method calls
  - [x] Remove old function definitions

**Phase 3 Results:**
- main.js reduced from ~2,536 lines to ~1,241 lines (51% reduction)
- 6 new system modules created (MultiplayerSystem, ZombieSpawnSystem, PlayerSystem, GameStateManager, MeleeSystem, drawingUtils)
- Total of ~1,697 lines extracted from main.js
- Improved code organization and maintainability
- Better separation of concerns
- Systems can be tested independently
- Consistent architecture pattern

### Phase 4: Game Loop Extraction from main.js ✅ **COMPLETED** [2026-06-25]
- [x] **Extract GameLoopSystem**
  - [x] Create `js/systems/GameLoopSystem.js`
  - [x] Extract `updateGame()` gameplay simulation (~325 lines)
  - [x] Extract `drawGame()` world + HUD rendering (~590 lines)
- [x] **Shared UI/mode helpers** in `js/utils/gameUtils.js`
  - [x] `isSinglePlayerArcadeMode()`, `isGameplayBlocked()`, `isUICanvasInteractive()`, `isHTMLOverlayActive()`, `isMenuOrOverlayScreen()`
- [x] **PickupSpawnSystem** — `updateScrapPickups()` (magnetic scrap pull moved from main)
- [x] **Update main.js** — wire `gameLoopSystem.update()` / `gameLoopSystem.draw()`

**Phase 4 Results:**
- main.js reduced from ~1,977 lines to ~1,183 lines (~40% reduction vs pre-Phase-4)
- Game loop update + render isolated in `GameLoopSystem.js` (~715 lines)
- `main.js` now focused on init, input events, menu actions, and engine wiring

### Phase 4b: Bullet–Zombie Collision Extraction ✅ **COMPLETED** [2026-06-25]
- [x] **Extract bulletZombieCollisions.js**
  - [x] Move `handleBulletZombieCollisions()` from `combatUtils.js` (~550 lines)
  - [x] Internal helpers: `syncBulletCollisionQuadtree()`, `handleBulletPropCollision()`
  - [x] Re-export from `combatUtils.js` for backward compatibility
- [x] **Wire GameLoopSystem** — import collision handler from new module

**Phase 4b Results:**
- `combatUtils.js` reduced from ~1,417 to ~887 lines
- Bullet collision + kill-reward logic isolated for future dedupe/refactor
- No circular imports (`bulletZombieCollisions` imports score helpers from `combatUtils`)

## Detailed Refactor Plans

### 1. CSS Extraction
*   **Source**: `zombie-game.html` (Lines 8-37)
*   **Destination**: `css/style.css`
*   **Action**: Move all CSS rules. Ensure `@import` remains at the top of the new CSS file.

### 2. JavaScript Extraction (Phase 1)
*   **Source**: `zombie-game.html` (Lines 45-3788)
*   **Destination**: `js/game.js`
*   **Action**: Move all logical code.
*   **Note**: The script relies on the DOM being loaded (`document.getElementById`). Since the script tag is at the bottom of the body, this behavior is preserved.

### 3. HTML Cleanup
*   **File**: `zombie-game.html`
*   **Action**: Replace removed blocks with external references.
*   **Outcome**: HTML file reduced to ~16 lines of structural markup.

### 4. Module Extraction (Phase 2)
*   **Strategy**: Extract classes and functions into logical modules
*   **State Management**: Centralized `gameState` object prevents global variable pollution
*   **Dependencies**: Careful import/export management to avoid circular dependencies
*   **Entry Point**: `main.js` orchestrates all systems and handles initialization

## Module Dependency Graph

```
main.js
├── core/
│   ├── constants.js (no dependencies)
│   ├── canvas.js → constants.js
│   ├── gameState.js → constants.js
│   ├── skillTreeDefinitions.js → (leaf — class tree skill defs)
│   ├── GameEngine.js (no dependencies)
│   └── WebGPURenderer.js (no dependencies)
├── systems/
│   ├── AudioSystem.js → SettingsManager.js
│   ├── GraphicsSystem.js → core/canvas.js
│   ├── ParticleSystem.js → core/gameState.js, entities/Particle.js
│   ├── SettingsManager.js (no dependencies)
│   ├── InputSystem.js (no dependencies)
│   ├── ZombieUpdateSystem.js → utils/gameUtils.js
│   ├── EntityRenderSystem.js → utils/gameUtils.js
│   ├── PickupSpawnSystem.js → core/constants.js, entities/Pickup.js
│   ├── SkillSystem.js → core/gameState.js, core/skillTreeDefinitions.js, systems/PlayerProfileSystem.js
│   ├── RenderingCache.js → core/canvas.js, core/constants.js, systems/GraphicsSystem.js
│   ├── MultiplayerSystem.js → core/gameState.js, core/canvas.js, core/constants.js, systems/SkillSystem.js, systems/AudioSystem.js, systems/ParticleSystem.js, utils/combatUtils.js
│   ├── ZombieSpawnSystem.js → core/gameState.js, core/canvas.js, entities/Zombie.js, entities/BossZombie.js, utils/gameUtils.js
│   ├── PlayerSystem.js → core/gameState.js, core/canvas.js, core/constants.js, systems/SettingsManager.js, systems/GraphicsSystem.js, systems/InputSystem.js, systems/AudioSystem.js, utils/combatUtils.js, systems/ParticleSystem.js, utils/drawingUtils.js
│   ├── GameStateManager.js → core/gameState.js, core/canvas.js, core/constants.js, systems/AudioSystem.js, utils/gameUtils.js
│   └── MeleeSystem.js → core/gameState.js, core/constants.js, systems/AudioSystem.js, systems/ParticleSystem.js, utils/combatUtils.js, entities/Particle.js, systems/SettingsManager.js, systems/SkillSystem.js
├── entities/
│   ├── Bullet.js → core/canvas.js
│   ├── Zombie.js → core/canvas.js, core/gameState.js, systems/*
│   ├── Particle.js → core/canvas.js
│   ├── Pickup.js → core/canvas.js
│   ├── Grenade.js → core/canvas.js, core/gameState.js, core/constants.js, utils/combatUtils.js
│   ├── Shell.js → core/canvas.js
│   ├── BossZombie.js → entities/Zombie.js
│   ├── AcidProjectile.js → core/canvas.js, core/gameState.js
│   └── AcidPool.js → core/canvas.js, core/gameState.js
├── companions/
│   └── CompanionSystem.js → core/gameState.js, core/canvas.js, core/constants.js, utils/combatUtils.js
├── ui/
│   ├── GameHUD.js → core/canvas.js, core/gameState.js, core/constants.js
│   └── SettingsPanel.js → core/canvas.js, core/gameState.js, systems/SettingsManager.js, systems/AudioSystem.js
└── utils/
    ├── combatUtils.js → core/gameState.js, core/constants.js, systems/*, entities/*
    ├── gameUtils.js → core/gameState.js
    └── drawingUtils.js → core/gameState.js, core/canvas.js, core/constants.js, systems/SettingsManager.js
```

[AMENDED 2026-06-25 — Phase 4 / 4b additions:]
```
├── systems/
│   ├── GameLoopSystem.js → GameEngine, GameHUD, combatUtils, bulletZombieCollisions, entity/system singletons, gameUtils
│   ├── WaveChaosSystem.js → core/constants.js, gameState
│   ├── ScrapShopSystem.js → ScrapShrine, gameState, constants, GameLoopSystem (wave-break spawn)
│   └── TouchControlSystem.js → InputSystem (virtual gamepad); gated by gameUtils.isMobileDevice()
└── utils/
    ├── bulletZombieCollisions.js → combatUtils (score/explosion), gameUtils, Quadtree, systems/*
    └── gameUtils.js — added mode/UI/mobile helpers (2026-06-25)
```

[AMENDED 2026-06-26 — Phase 4c / v0.9.0 performance additions:]
```
├── main.js → lazy WebGPURenderer dynamic import, startup perf marks, idle GPU warm-up, async startGame/prepareGameSession
├── systems/
│   └── MultiplayerSystem.js → lazy Socket.IO client script load on network init
├── ui/
│   └── GameHUD.js → cached creepy-background static layers, throttled menu noise, session prep overlay
└── utils/
    └── gameUtils.js → cached scoreboard/recent-run reads for menu draw path
```

[AMENDED 2026-06-26 — smooth game entry]: `css/style.css` → `#gpuCanvas` opacity transition; `GroundTextureSystem.init()` also called during idle warm-up.

## Benefits Achieved

1. **Maintainability**: Code is now organized into logical modules, making it easier to find and modify specific features
2. **Scalability**: New features can be added as new modules without touching existing code
3. **Testability**: Individual modules can be tested in isolation
4. **Readability**: Smaller files are easier to understand and navigate
5. **Collaboration**: Multiple developers can work on different modules simultaneously
6. **Performance**: ES6 modules enable better tree-shaking and code splitting opportunities
