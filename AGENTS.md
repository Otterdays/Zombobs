# AGENTS.md

This file provides guidance to Qoder (qoder.com) when working with code in this repository.

## Project Overview

Zombobs is a top-down zombie survival shooter built entirely with **vanilla JavaScript (ES6+)**, HTML5 Canvas 2D, and WebGPU. **Zero external runtime dependencies** on the client — no frameworks, no bundlers, no build step. The multiplayer server uses Node.js + Express + Socket.IO.

Version: 0.8.4 ALPHA. Proprietary/closed-source license.

## Commands

### Run Local Dev Server (Multiplayer + Static Files)
```powershell
# Option A: One-click launcher (checks Node, installs deps, starts server, opens browser)
.\launch.bat
# Or directly:
.\launch.ps1

# Option B: Manual
cd LOCAL_SERVER
npm install          # first run only
npm start            # serves on http://localhost:3000
```

### Open Game Without Server (Single Player Only)
Open `index.html` directly in a browser. No build step needed.

### Itch.io Build
```powershell
# From repo root — produces Zombobs_Web.zip with forward-slash paths (required for itch CDN)
powershell -NoProfile -ExecutionPolicy Bypass -File ITCH/build-itch.ps1
```
**Critical:** Never use `Compress-Archive` or Explorer zip — they embed backslashes causing 403 errors on itch.io.

### Mobile (Android via Capacitor)
```powershell
cd mobile
npm run sync:web     # copies index.html, js/, css/, assets/ into mobile/www
npx cap open android # opens Android Studio
```
Requires JDK 17 or 19, Gradle 8.13.

### Syntax Check
```powershell
.\test-syntax.ps1
```

### No Test Suite
There is no automated test runner or linting configuration. Validation is manual browser testing.

## Architecture

### Rendering Pipeline — Three Canvases
The game uses three stacked `<canvas>` elements (defined in `index.html`):
1. **`gpuCanvas`** — WebGPU background shaders, bloom, ZombobsFX spore cloud (bottom layer)
2. **`gameCanvas`** (id=`gameCanvas`) — Main Canvas 2D gameplay: entities, particles, ground
3. **`uiCanvas`** — All UI: HUD, menus, settings, lobbies, game over (top layer, captures pointer events)

`uiCanvas` is separate from the game canvas and handles all interactive UI. Pointer events are toggled on/off based on active UI state.

### Game Loop (`js/core/GameEngine.js`)
Fixed-timestep loop at 60 FPS with `requestAnimationFrame`. Systems hook in via:
```js
gameEngine.update = (dt) => { ... };  // fixed timestep (16.67ms)
gameEngine.draw = () => { ... };      // called every frame
gameEngine.start();
```
WebGPU render is called **after** `drawGame()` so particles synced during draw are included in the GPU frame.

### Centralized State (`js/core/gameState.js`)
Single `gameState` object holds all mutable game state. Key patterns:
- `gameState.players[]` — array of player objects (supports co-op); `gameState.player` is a getter for `players[0]`
- Entity arrays: `bullets`, `zombies`, `particles`, `pickups` (multiple types), `grenades`, `props`, etc.
- UI flags: `showMainMenu`, `showLobby`, `showCoopLobby`, `gamePaused`, etc.
- `resetGameState(canvasWidth, canvasHeight)` — resets all state for a new game session
- Compatibility getters/setters map legacy single-player properties (e.g. `gameState.currentAmmo`) to `players[0]`

### Entry Point (`js/main.js`, ~2273 lines)
Orchestrates everything: imports all systems, creates instances, wires callbacks, defines `updateGame()` and `drawGame()`, handles DOM events, and assigns `gameEngine.update`/`draw`. Many subsystems are exposed on `window` for cross-module access (e.g. `window.gameHUD`, `window.settingsPanel`, `window.webgpuRenderer`).

### Module Layout (ES6 Modules, No Bundler)
All JS uses native `import`/`export`. No webpack, no vite, no transpilation. Files are served as-is.

| Directory | Purpose |
|---|---|
| `js/core/` | Constants, canvas init, gameState, GameEngine, WebGPURenderer, ZombobsFX |
| `js/entities/` | Entity classes: Zombie (7 variants + Boss), Bullet, Particle, Pickup, Grenade, Shell, AcidProjectile, AcidPool, Prop |
| `js/systems/` | Self-contained systems: Audio, Particle, Camera, Input, Settings, Skill, Rank, Achievement, Battlepass, Multiplayer, ZombieSpawn, ZombieUpdate, PlayerSystem, EntityRender, PropSpawn, PropRender, GroundTexture, BloodSimulation, Melee, PickupSpawn, GameStateManager, ArcadeMusic, TouchControl |
| `js/ui/` | Canvas-drawn UI screens: GameHUD, SettingsPanel, MainMenuScreen, LobbyScreen, GameOverScreen, ProfileScreen, AchievementScreen, BattlepassScreen, BadgeScreen, etc. |
| `js/utils/` | Pure functions: combatUtils, gameUtils, drawingUtils, arrayUtils, Quadtree, ObjectPool, ChunkManager |
| `js/companions/` | AI companion NPC system |
| `js/vendor/` | Vendored `socket.io.min.js` (avoids itch.io CSP blocking) |

### System Pattern
Systems are typically singleton instances exported from their module:
```js
// Creation
const meleeSystem = new MeleeSystem();
// Usage in main.js
meleeSystem.performMeleeAttack(player);
```
Some use class-based singletons (`cameraSystem`, `propSpawnSystem`), others export initialized objects (`bloodSimulationSystem`, `renderingCache`).

### Settings System (`js/systems/SettingsManager.js`)
All user settings persist to `localStorage`. Read via `settingsManager.getSetting(category, key)`. Changes propagate via `settingsManager.addChangeListener(callback)` — `main.js` wires this to update WebGPU renderer, engine, and cache invalidation.

### Canvas UI Convention
All menus and HUD are drawn on `uiCanvas` using Canvas 2D API (no DOM elements for gameplay UI). Shared drawing helpers live in `js/ui/GameHUD.js` (`drawMenuButton`, `drawGlassCard`, `getUIScale`) and `js/utils/drawingUtils.js`. Canvas UI uses a standard color palette defined in `DOCS/STYLE_GUIDE.md`.

### WebGPU (`js/core/WebGPURenderer.js` + `js/core/ZombobsFX.js`)
Optional GPU-accelerated layer. Gracefully falls back to Canvas 2D. Renders: procedural background shader, bloom post-processing, ZombobsFX (100k particle spore cloud), and synced game particles. Controlled by settings; dirty-flag system for uniform buffer efficiency.

### Multiplayer Server
Two server variants share the same Socket.IO protocol:
- **`LOCAL_SERVER/server.js`** — Dev server, port 3000, no MongoDB
- **`huggingface-space-SERVER/server.js`** — Production, port 7860, MongoDB persistence for highscores, chat system with rate limiting

Both serve static files from the project root and handle lobby management, player/zombie sync, and leaderboard via Socket.IO events + REST endpoints (`GET/POST /api/highscores`).

### Mobile (Capacitor WebView)
`mobile/` wraps the same web game in an Android WebView. `npm run sync:web` copies web assets into `mobile/www`. The game detects touch and activates `TouchControlSystem`. Offline play works for local assets; multiplayer/leaderboard need a reachable server.

## Key Conventions

- **No build step**: Code runs directly in the browser via ES6 modules. Don't add a bundler.
- **Performance-critical hot paths**: Use `for` loops (not `forEach`), squared distances (not `Math.sqrt`), cached object references. See `DOCS/ARCHITECTURE.md` engine micro-optimizations section.
- **Array compaction**: Use `compactArray()` / `compactArrayWithUpdate()` from `js/utils/arrayUtils.js` instead of `filter()` for in-place zero-allocation compaction.
- **Object pooling**: `ObjectPool` in `js/utils/ObjectPool.js` for particles and other frequently created/destroyed entities.
- **Viewport culling**: All entity rendering checks against viewport bounds (`getViewportBounds()`, `isInViewport()`). Update culling uses a larger 300px margin.
- **World-space camera** (single player arcade only): `cameraSystem` follows the player; ground texture, props, and entity rendering offset by camera position. Co-op and multiplayer use screen-space.
- **Version strings**: Update in `LOCAL_SERVER/package.json`, `launch.ps1`, `constants.js` (NEWS_UPDATES), and `huggingface-space-SERVER/package.json` together.
- **Global exposure**: Systems needing cross-module access are assigned to `window.*` in `main.js`. This is intentional — don't refactor to remove these without a replacement pattern.

## Agent Behavior Charter (META v2.0)

### Bias — Earned Conservatism
Default to first-principles rigor. Quality dominates token count. Move boldly on local, reversible, test-covered changes. Exercise explicit named caution only on high blast-radius or low-reversibility moves.

### META-0 — Situated Judgment Overrides Rules
When first-principles analysis conflicts with a rule, follow the analysis. Name the override, justify from first principles, and act.

### R1–R11 Summary
- **R1** Decompose to causal layer before writing code.
- **R2** Default to decisive action on non-load-bearing ambiguity.
- **R3** Match solution complexity to problem complexity.
- **R4** Refactor adjacent code only when it serves the root cause (≤2× cost or one architectural boundary).
- **R5** Execution is ground truth; inspection is hypothesis. Reproduce failures before repair.
- **R6** Tests must name and protect a contract; fail precisely when violated.
- **R7** Contradictory patterns require choosing one. Correctness > tradition.
- **R8** Tag every claim: executed / inspected / assumed.
- **R9** Push back on wrong premises with evidence; defer if user insists.
- **R10** Boldness scales inversely with irreversibility.
- **R11** Conform to conventions by default; override only for correctness.
