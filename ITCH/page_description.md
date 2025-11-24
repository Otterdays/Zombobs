**!DISCLAIMER! WE ARE IN SUPER EARLY PRODUCTION! Please be patient but please hit me with constructive criticism and things you'd want to see! In all honesty, I'm a 'vibe coder', but like to imagine I'm modestly skilled at making stuff, with some imagination, lol. **

=========================

**Top-down zombie survival stripped to its bloody essentials. 100% vanilla code, 0% mercy, endless waves of undead.**

**ZOMBOBS - ZOMBIE APOCALYPSE WITH FRIENDS** is a fast-paced arena shooter built entirely with raw HTML5 Canvas and JavaScript. No engines, no frameworks, just pure adrenaline. You are alone (or with friends) against an endless tide of the undead. How long can you last?

---

### **✨ Features**

#### **🔫 Arsenal of Destruction**

*   **4 Distinct Weapons:** Master the Pistol (reliable), Shotgun (crowd control), Rifle (rapid fire), and Flamethrower (short-range DoT devastation).

*   **Grenades:** Clear the screen with satisfying AOE explosions (3 per game, 2s cooldown).

*   **Melee Combat:** Close-range swipe attack for when ammo runs dry.

*   **Background Reloading:** Weapons auto-reload when holstered—switch tactically during downtime.

*   **Weapon Persistence:** Each weapon maintains its own ammo count—no progress lost when switching.

#### **🧟 Intelligent Enemies**

*   **6 Zombie Variants:** Face off against Normal, Fast Runners, Armored Tanks, Exploding Boomers, spectral Ghosts, and ranged Spitters.

*   **Boss Waves:** Every 5 waves, a massive boss zombie spawns with devastating attacks.

*   **Day/Night Cycle:** Dynamic 2-minute cycle where zombies move 20% faster at night. Survive the darkness.

*   **Environmental Hazards:** Acid pools from Spitter attacks create dangerous zones that damage players over time.

*   **Crowd Control:** Bullets slow zombies on hit, allowing strategic kiting.

*   **Progressive Difficulty:** Waves get harder, faster, and more chaotic.

#### **💪 Power-Up System**

*   **Double Damage Buff:** Purple pickup that doubles weapon damage for 10 seconds.

*   **Nuke Pickup:** Rare yellow/black radiation symbol that instantly clears all zombies.

*   **Speed Boost:** Temporary movement speed increase.

*   **Rapid Fire:** Increased fire rate for all weapons (10 seconds).

*   **Shield Pickup:** Temporary overshield that absorbs damage before health.

*   **Real-Time HUD Timers:** All active power-ups display countdown timers.

#### **👥 Multiplayer & Co-op**

*   **Local Co-op:** Full 4-player shared-screen mode with grid HUD, distinct player colors, and smart input detection.

*   **Multiplayer Lobby:** Modern glassmorphism lobby with animated background, live player list, custom usernames, and cloud-hosted server on Hugging Face Spaces.

*   **AI Squad Mode:** Play with AI companions! Add up to 3 AI bots to your squad for cooperative survival.

*   **Controller Support:** Full Xbox/gamepad support with analog sticks, automatic input detection, and virtual crosshair.

#### **🎨 Visual & Audio Feast**

*   **WebGPU Rendering:** GPU-accelerated background shaders, bloom post-processing, and procedural "Void" effects. Automatic Canvas 2D fallback for compatibility.

*   **Juicy Combat:** Screen shake, particle blood splatters, muzzle flashes, bullet trails, shell ejection, and directional blood splatter.

*   **Dynamic Audio:** Procedurally generated sound effects using Web Audio API + atmospheric menu music.

*   **Horror Atmosphere:** Animated menu backgrounds with pulsing effects, scanlines, and dynamic blood splatters.

*   **Floating Damage Numbers:** See your damage output in real-time with style options.

*   **Critical Hits:** 10% chance for critical hits dealing 2x damage with distinctive yellow/red gradient numbers and "CRIT!" notifications.

*   **Hit Markers:** Visual "X" indicator appears on crosshair when shots connect.

*   **Spawn Indicators:** Pulsing red glow appears 1 second before zombies spawn.

*   **Off-Screen Indicators:** Arrows at screen edges point toward nearby off-screen zombies, color-coded by distance.

*   **Reload Progress Bar:** Visual progress bar shows reload completion percentage.

#### **⚡ Advanced Gameplay Systems**

*   **Sprint System:** Stamina-based movement with tactical management. Sprint drains stamina, regenerates when idle.

*   **Kill Streak Combos:** Chain kills within 1.5s for combo notifications ("RAMPAGE!", "UNSTOPPABLE!").

*   **Damage Indicators:** Red screen flash and directional feedback when taking damage.

*   **Comprehensive Settings:** Tabbed settings panel (Video, Audio, Gameplay, Controls) with 10+ customization options including WebGPU toggle, bloom intensity, particle count modes, lighting quality, screen shake multiplier, crosshair customization, auto-reload toggle, and spatial audio.

*   **UI Scaling System:** 50-150% UI scale slider for accessibility with preset buttons (Small 70%, Medium 100%, Large 130%).

*   **Fully Customizable Controls:** Complete key rebinding support for both keyboard and controller.

---

### **🕹️ Controls**

**Keyboard & Mouse**

*   **WASD** or **Arrow Keys**: Move

*   **Mouse**: Aim

*   **Left Click**: Shoot (hold for continuous)

*   **R**: Reload

*   **G**: Grenade

*   **V**: Melee

*   **1/2/3/4**: Switch Weapon

*   **Scroll Wheel**: Cycle Weapons (toggleable)

*   **Shift**: Sprint

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

*   **Engine:** ZOMBS-XFX-NGIN V0.5.3 (Vanilla JS + HTML5 Canvas)

*   **Graphics:** WebGPU with Canvas 2D fallback, GPU-accelerated shaders, bloom post-processing

*   **Audio:** Web Audio API (Procedurally generated sounds) + HTMLAudioElement for music

*   **Assets:** High-res ground tiles, minimalist pixel art & code-drawn graphics

*   **Performance:** Quadtree spatial partitioning, object pooling, viewport culling, delta compression

*   **Networking:** Socket.io for multiplayer (cloud-hosted on Hugging Face Spaces)

*   **Architecture:** ES6 Modules, zero runtime dependencies

---

**⚠️ Early Production Disclaimer:** This game is currently in active development (V0.5.3). Features may change, bugs may exist, and content is still being added. Your feedback is welcome!

*Playable directly in your browser. Best experienced on Chrome or Edge. Requires modern browser with WebGPU support (optional, falls back to Canvas 2D).*

---

This version includes:

- All 4 weapons (including Flamethrower)

- All 6 zombie variants (including Spitter)

- 4-player local co-op (not just 2)

- Multiplayer lobby system

- AI Squad mode

- WebGPU rendering

- Day/Night cycle

- Sprint system

- Boss waves

- Complete power-up system (5 types)

- Advanced visual features (critical hits, hit markers, spawn indicators, etc.)

- Comprehensive settings system

- UI scaling for accessibility

- And more!