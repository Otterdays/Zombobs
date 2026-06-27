**!DISCLAIMER! WE ARE IN SUPER EARLY PRODUCTION! Please be patient but please hit me with constructive criticism and things you'd want to see! In all honesty, I'm a 'vibe coder', but like to imagine I'm modestly skilled at making stuff, with some imagination, lol. **

=========================

**Top-down zombie survival stripped to its bloody essentials. 100% vanilla code, 0% mercy, endless waves of undead.**

**ZOMBOBS - ZOMBIE APOCALYPSE WITH FRIENDS** is a fast-paced arena shooter built entirely with raw HTML5 Canvas and JavaScript. No engines, no frameworks, just pure adrenaline. You are alone (or with friends) against an endless tide of the undead. How long can you last?

---

### **🆕 V0.9.0 ALPHA — Performance & Systems Update**

*   **Main Menu Smoothness** — Cached score reads, prebaked horror-background layers, and throttled static noise reduce menu lag spikes
*   **Lazy WebGPU Init** — GPU renderer module loads on first gameplay or WebGPU re-enable instead of menu boot
*   **Lazy Socket.IO Load** — Multiplayer client script loads only when online lobby/networking starts
*   **Startup Metrics** — `zombobs:*` performance marks measure bootstrap, first draw, loop start, WebGPU module load, and GPU init
*   **Class Tree Skills** — Gunner, Survivor, and Scavenger build paths augment the flat skill pool
*   **V0.8.4 Systems Still Live** — Wave Chaos, Scrap Shop Shrine, MP3 soundtrack, controls-in-settings, and Phase 4 engine split remain active

---

### **✨ Features**

#### **🔫 Arsenal of Destruction**

**8 Weapons:** Pistol, Shotgun, Rifle, Flamethrower, SMG, Sniper, RPG, Laser Gun

*   Grenades (3 per game, 2s cooldown)
*   Melee combat
*   Background reloading
*   Weapon persistence (each weapon maintains its own ammo count)
*   Weapon switching (1-8 keys or scroll wheel)

#### **🧟 Enemy Variety**

**8 Zombie Types:** Normal, Fast Runners, Exploding Boomers, Armored Tanks, Ghost, Spitter, Flying, Crawler

*   Boss waves (every 5 waves)
*   Day/Night cycle (zombies 20% faster at night)
*   Environmental hazards (acid pools)
*   Crowd control (bullets slow zombies)
*   Progressive difficulty scaling
*   8 Normal zombie visual variants with animated movement

#### **💪 Power-Ups & Systems**

**Power-Ups:** Double Damage, Nuke, Speed Boost, Rapid Fire, Shield, Health Pickup, Ammo Pickup

*   Real-time HUD timers for active power-ups
*   Kill streak combos with visual feedback
*   Sprint system with stamina management
*   Scrap currency from kills + wave-break Scrap Shop shrines (V0.8.4+)
*   Wave Chaos mutators and escalating spawn pacing (V0.8.4+)
*   16-skills progression system with 3-choice level-ups
*   XP gain from zombie kills with kill streak multipliers

#### **👥 Multiplayer & Co-op**

*   Local co-op (4-player shared-screen)
*   Online multiplayer lobby (cloud-hosted server)
*   AI Squad Mode (up to 3 AI companions)
*   Controller support (Xbox/gamepad with analog sticks)
*   Lobby chat system
*   Rank progression system
*   Global leaderboards

#### **🎨 Visual & Audio**

**Graphics:**
*   WebGPU rendering with Canvas 2D fallback
*   GPU-accelerated shaders and bloom post-processing
*   Screen shake, particle effects, blood splatter
*   Muzzle flashes, bullet trails, shell ejection
*   Floating damage numbers, critical hit indicators
*   Hit markers, spawn indicators, off-screen indicators
*   Reload progress bars, modern "Glass Tech" HUD
*   Horror atmosphere with animated backgrounds

**Audio:**
*   Licensed MP3 gameplay playlist (two-track rotation) + menu theme
*   Dynamic music intensity during combat (wave + horde pressure)
*   Procedurally generated sound effects
*   Granular audio mixer (Master, Music, SFX, Footsteps, Gunshots, Hit Markers, Multiplier)
*   UI interaction sounds (hover tick, click pip)
*   Multi-layered impact sounds and kill feedback

#### **⚙️ Gameplay Systems**

*   Campaign Mode with cinematic intro
*   Flashlight system (F key toggle)
*   Comprehensive settings panel (Video, Audio, Gameplay, Controls)
*   UI scaling system (50-150% accessibility)
*   Fully customizable controls (keyboard and controller rebinding)
*   Gallery screen (showcase zombies, weapons, pickups)
*   Profile system (achievements, badges, battlepass, ranks)

---

### **🕹️ Controls**

**Keyboard & Mouse**

*   **WASD** / **Arrow Keys**: Move
*   **Mouse**: Aim
*   **Left Click**: Shoot (hold for continuous)
*   **R**: Reload
*   **G**: Grenade
*   **V**: Melee
*   **1-8**: Switch Weapon
*   **Scroll Wheel**: Cycle Weapons (toggleable)
*   **Shift**: Sprint
*   **F**: Flashlight
*   **ESC**: Pause

**Gamepad (Xbox/Controller)**

*   **Left Stick**: Move (analog)
*   **Right Stick**: Aim (analog)
*   **RT**: Shoot (hold for continuous)
*   **RB**: Grenade
*   **X**: Reload
*   **Y**: Next Weapon
*   **LB**: Previous Weapon
*   **R3**: Melee
*   **L3**: Sprint
*   **Start**: Pause

*All controls are fully customizable in the Settings menu*

---

### **🛠️ Under the Hood**

Built with love, sweat, and zero dependencies.

*   **Engine:** ZOMBS-XFX-NGIN V0.9.0 ALPHA (Vanilla JS + HTML5 Canvas)
*   **Graphics:** WebGPU with Canvas 2D fallback, GPU-accelerated shaders, bloom post-processing
*   **Audio:** Web Audio API (Procedurally generated sounds) + HTMLAudioElement for music
*   **Assets:** High-res ground tiles, minimalist pixel art & code-drawn graphics
*   **Performance:** Quadtree spatial partitioning, object pooling, viewport culling, delta compression
*   **Networking:** Socket.io for multiplayer (cloud-hosted on Hugging Face Spaces)
*   **Architecture:** ES6 Modules, zero runtime dependencies

---

**⚠️ Early Production Disclaimer:** This game is currently in active development (V0.9.0 ALPHA). Features may change, bugs may exist, and content is still being added. Your feedback is welcome!

*Playable directly in your browser. Best experienced on Chrome or Edge. Requires modern browser with WebGPU support (optional, falls back to Canvas 2D).*
