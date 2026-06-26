# 🧟 ZOMBOBS - Development Roadmap

**Legend:**

- 🟢 **Novice** (UI tweaks, CSS, simple logic)
- 🟡 **Survivor** (New mechanics, state expansion, canvas updates)
- 🔴 **Veteran** (Complex algorithms, networking, heavy systems)
- ⚫ **Nightmare** (Extreme difficulty, unforgiving mechanics)
- 🟣 **Mystery** (Easter eggs, secrets, anomalies, classified content)

**Status Legend (Roadmap Summary):**

 - Total items: 729
 - Completed items: 66 (9.1%)
 - Uncompleted items: 663
 - Phases completed: 0 / 14 (0.0%)

---

## Phase 1: Survival Essentials (Core Loop) 💀

- [x] **Health Pickups** - Medical kits/health packs spawn randomly on the map 🟢
- [x] **Ammo System** - Limited bullets that require reloading (auto-reload when empty, weapon-specific ammo) 🟡
- [x] **Ammo Pickups** - Ammo boxes spawn periodically when player has low ammo, restoring ammo for current weapon when collected 🟡
- [x] **Ammo Counter** - Display current ammo / total ammo on HUD 🟢
- [x] **Health Regeneration** - Slow health regeneration when out of combat (no zombie damage for 5 seconds) 🟡
- [x] **Stamina/Sprint System** - A stamina bar that depletes when sprinting, forcing players to manage their movement more carefully 🟡
- [x] **Damage Indicators** - Red flash or directional arrows when hit 🟢
- [x] **High Score System** - Track and display best run (localStorage) 🟡
- [x] **Pause Menu** - Press ESC to pause, resume, or restart 🟢
- [x] **Reload Progress Indicator** - Visual progress bar or percentage showing reload completion time in HUD 🟢
- [x] **Low Ammo Warning** - Visual pulse/flash on ammo counter when ammo drops below 25% of magazine capacity 🟢
- [x] **Wave Countdown Overlay** - 3-second overlay with reload hint between waves 🟢
- [x] **Wave Progress Indicator** - Visual display of remaining zombies in current wave 🟢
- [x] **Wave Start Notification** - Brief text overlay showing "Wave X Starting!" when new wave begins 🟢
- [x] **Aiming Crosshair** - Simple reticle/crosshair at mouse cursor position for better aiming reference 🟢
- [x] **Off-screen Zombie Indicator** - Arrows or icons at the edge of the screen pointing towards off-screen zombies that are close to the player 🟡
- [ ] **Weapon Accuracy Indicator** - Visual feedback showing current weapon accuracy level during burst-fire sequences 🟡
- [ ] **Minimap/Compass** - A simple UI element to show player position relative to the base 🟡
- [ ] **Prone/Crouch System** - Multiple stance options affecting visibility and accuracy for tactical positioning 🟡
- [ ] **Looting Minigame** - Quick QTE for bonus loot quality when scavenging supplies 🟢
- [ ] **Barricading System** - Board up windows and doors to slow zombie entry and create defensive choke points 🟡
- [ ] **Blood Trail System** - Zombies leave persistent blood trails that can be used for tracking or stealth gameplay (leverages GPU particle system) 🟡
- [ ] **Footstep Tracking** - Player leaves visible footprints that zombies can follow, adding stealth tension (GPU-computed particle trail) 🟡
- [ ] **Heat Signature Visualization** - Thermal vision mode showing zombie heat signatures through walls using GPU ray-casting (tactical ability) 🔴
- [ ] **Sound Propagation Visualization** - Visual representation of noise propagation to help players understand zombie attraction mechanics 🟡
- [ ] **Dynamic Cover System** - Physics-based cover objects that can be destroyed but provide strategic protection (connects to GPU physics) 🟡
- [ ] **Environmental Awareness Indicators** - Visual cues showing which direction zombies are coming from based on sound/heat (GPU-computed) 🟡

---

## Phase 2: Tools of Destruction (Arsenal) 🔫

- [x] **Weapon Variety** - Add different guns (pistol, shotgun, rifle) with different damage, fire rate, and ammo 🟡
- [x] **Melee Attack** - Close-range melee attack (V key or right-click) with swipe animation, 500ms cooldown, 3 damage, 40px range 🟡
- [x] **Scroll Wheel Switching** - Cycle weapons with mouse wheel (toggleable in settings) 🟢
- [x] **Background Reload** - Weapons reload automatically when holstered 🟡
- [x] **Weapon Accuracy Degradation** - Continuous firing reduces accuracy, requiring periodic pauses 🟡
- [x] **Grenades** - Throwable explosives (G key) with arc trajectory, AOE damage, and fuse timer. 3 per game, 2s cooldown 🟡
- [x] **Flamethrower / DoT Weapons** - Short-range weapons that apply burning damage over time to groups of zombies at close range 🟡
- [x] **Temporary Power-Up Pickups** - Short-duration buffs like double damage, rapid fire, or movement speed boost that drop rarely from zombies 🟡
- [x] **Armor / Shield Pickups** - Pickups that grant a temporary overshield layer which absorbs a portion of incoming damage before health 🟡
- [ ] **Rocket Launcher** - More powerful explosive weapon with self-damage risk 🔴
- [ ] **Alternate Fire Modes** - Weapons with secondary fire (burst, single-shot, charged shot) toggled via right-click or a hotkey 🟡
- [ ] **Elemental Ammo Types** - Special ammo pickups (incendiary, shock, freeze) that temporarily change how the current weapon behaves 🟡
- [ ] **Ammo Crates** - Rare, high-value pickups that fully refill ammo for the current weapon or all weapons in your inventory 🟢
- [ ] **Risk/Reward Pickups** - Powerful pickups placed in dangerous positions (edges of the map or near spawners) to encourage risky plays 🟡
- [ ] **Weapon Attachments** - Add findable or purchasable attachments like scopes (tighter accuracy) or extended magazines 🟡
- [ ] **Weapon Jamming** - Chance for weapon to jam, requiring a quick key press to clear 🟡
- [ ] **Critical Hit System** - Chance for increased damage with visual feedback 🟡
- [ ] **Chainsaw** - Melee weapon dealing high damage but requiring fuel 🟡
- [ ] **Decoy Grenade** - Thrown tool that attracts zombies to its location before exploding 🟡
- [ ] **Dual Wielding** - Ability to use two one-handed weapons simultaneously (e.g., pistols) 🟡
- [ ] **Laser Sword** - High-tech melee weapon that cuts through multiple enemies 🔴
- [ ] **Gravity Gun** - Pick up and throw objects (or zombies) at other zombies 🔴
- [ ] **Minigun** - Heavy weapon with massive fire rate but slows movement speed 🟡
- [ ] **Orbital Strike** - Call down a devastating laser beam from space 🔴
- [ ] **Smoke Grenade** - Creates a visual cover that confuses zombie pathfinding 🟢
- [ ] **Weapon Crafting System** - Combine weapon parts to create custom guns with unique stats 🔴
- [ ] **Cover System** - Take cover behind objects for damage reduction and tactical advantage 🟡
- [ ] **Vault/Climb Mechanic** - Parkour movement over obstacles for enhanced mobility 🟡
- [ ] **Voxel-Based Destruction** - Destroy terrain at any point using compute shaders for dynamic level destruction 🔴
- [ ] **Soft Body Deformation** - Zombies squish when crushed with GPU physics simulation 🔴
- [ ] **Dismemberment System** - Limbs separate with realistic physics simulation and collision 🟡
- [ ] **Gore System** - Persistent blood, guts, organs rendered with GPU particles and decals 🟡
 - [ ] **Fire Propagation** - Fire spreads realistically using cellular automata on GPU (engine-level) 🔴
- [ ] **Explosion Shockwaves** - Physics objects blown away with GPU-computed force fields 🟡
 - [ ] **Bullet Penetration** - Shoot through multiple zombies with raycast compute shaders (zombie-only) 🟡
- [ ] **Ricochet System** - Bullets bounce off metal surfaces with realistic physics 🟡
- [ ] **GPU-Accelerated Ballistics** - Compute shader-based projectile physics for thousands of bullets simultaneously 🔴
- [ ] **Weapon Recoil Simulation** - GPU-computed recoil patterns with procedural weapon sway 🟡
- [ ] **Muzzle Flash Lighting** - Dynamic light emission from weapon fire affecting nearby surfaces 🟡
- [ ] **Projectile Physics Integration** - Bullets use GPU-computed ballistics affecting trajectory based on distance, wind, and gravity (enhances long-range combat) 🔴
- [ ] **Smart Ricochet System** - Bullets ricochet off surfaces with predictable angles, allowing trick shots and environmental combat (GPU ray-casting) 🟡
- [ ] **Bullet Time Mode** - Slow-motion ability powered by temporal upscaling that reduces game speed while maintaining visual quality 🟡
- [ ] **Weapon Overheat Visualization** - GPU-computed heat distortion effects on weapon models when firing continuously, affecting accuracy 🟡
- [ ] **Ammo Trajectory Preview** - Visual arc showing bullet path before firing, accounting for drop and physics (helps with long-range shots) 🟡
- [ ] **Dynamic Weapon Sway** - Procedural weapon bob and sway using GPU-computed animation curves based on movement and stamina 🟡
- [ ] **Explosive Chain Reactions** - Explosions can trigger environmental objects (barrels, vehicles) creating cascading destruction (GPU physics) 🔴
- [ ] **Weapon Durability System** - Weapons degrade with use, affecting accuracy and fire rate, visualized through GPU shader effects 🟡
- [ ] **Smart Weapon Switching** - AI suggests optimal weapon based on enemy type and distance using compute shader analysis 🔴

---

## Phase 3: The Horde Evolves (Enemies & AI) 🧠

- [x] **Special Zombie Types** - Fast zombies, tank zombies, exploding zombies with different behaviors 🟡
- [x] **Zombie Slow-on-Hit** - Bullets briefly slow zombies (e.g., 0.5s at 30%) to create crowd-control moments 🟡
- [x] **Armored Zombies** - Slower, heavily armored zombies whose armor absorbs most incoming damage before their health is affected 🟡
- [x] **Spitter Zombies** - Ranged infected that lob corrosive projectiles, forcing the player to move and break out of safe positions 🟡
- [x] **Boss Waves** - Every 5 waves, spawn a massive boss zombie with high health 🟡
- [x] **Difficulty Scaling** - Zombies get progressively faster, tougher, and more numerous (implemented: speed = 1 + wave*0.1, health = 2 + floor(wave/3), zombiesPerWave increases) 🟡
- [x] **Day/Night Cycle** - Zombies become stronger and more numerous at night 🟡
- [ ] **Summoner/Necromancer Zombies** - Rare support enemies that periodically revive or buff nearby zombies if not prioritized and killed quickly 🔴
- [ ] **Crawler Variants** - Low-profile crawlers that are hard to spot in the grass and can slip through tight gaps in base defenses 🟡
- [ ] **Zombie Attraction System** - Noise from gunfire attracts more zombies over time 🟡
- [ ] **Zombie Aggression Timer** - Zombies move faster toward player base over time within a wave 🟡
- [ ] **Zombie Horde Mechanic** - Periodic large groups of zombies attack simultaneously 🟡
- [ ] **Stealth Mechanics** - Zombies are initially unaware of the player unless they make noise or get too close, rewarding strategic repositioning 🔴
- [ ] **Advanced Looting System** - Search destroyed objects or special zombies for bonus ammo, health, or currency 🟡
- [ ] **Sewer Rat Swarm** - Small, fast, hard-to-hit enemies that swarm the player 🟡
- [ ] **Medic Zombie** - Support enemy that heals nearby zombies 🔴
- [ ] **Mutated Boss: The Colossus** - Massive, slow-moving tank enemy with devastating area attacks 🔴
- [ ] **Infected Dogs** - Extremely fast enemies that lunge at the player 🟡
- [ ] **Adaptive AI Director** - Dynamic system that adjusts spawn rates and intensity based on player stress levels 🔴
- [ ] **Parasitic Infestation** - Enemies that split into smaller creatures upon death 🔴
- [ ] **Flying Gargoyles** - Aerial enemies that swoop down and pick up players 🔴
- [ ] **Zombie Mutation System** - Zombies evolve new abilities mid-wave 🔴
- [ ] **Wound System** - Specific body part damage affecting player movement speed and weapon accuracy 🔴
- [ ] **Infection Mechanic** - Player can get infected from zombie attacks, requiring cure items or facing slow death 🟡
- [ ] **Zombie Camouflage** - Cover yourself in zombie blood to reduce detection range and move through hordes 🟡
- [ ] **Hostage/Survivor Rescue** - Escort missions with NPC survivors for bonus rewards 🟡
- [ ] **Destructible Walls** - Blow holes through certain barriers for strategic pathing and shortcuts 🟡
- [ ] **Zombie Pets/Taming** - Rare ability to control a zombie companion temporarily with special items 🔴
- [ ] **Perks & Traits System** - Choose 3 starting traits at game start that modify playstyle (Glass Cannon, Tank, etc.) 🟡
- [ ] **Stealth Kills** - Silent melee takedowns from behind for bonus damage and no alert 🟡
- [ ] **Weather-Based Buffs/Debuffs** - Rain reduces accuracy, fog reduces zombie detection range dynamically 🟡
- [ ] **Hunger & Thirst Mechanics** - Survival stats requiring food/water management for sustained combat effectiveness 🟡
- [ ] **Zombie Pheromone Trails** - Zombies leave invisible "scent" trails that other zombies can follow, creating dynamic horde formation (GPU-computed flow fields) 🔴
- [ ] **Zombie Communication System** - Zombies alert nearby hordes when player is spotted, creating chain reactions of aggression (GPU-based influence maps) 🔴
- [ ] **Adaptive Zombie Learning** - Zombies "remember" player tactics and adjust behavior using GPU-computed memory system (e.g., flank if player camps) 🔴
- [ ] **Zombie Swarm Intelligence** - Groups of zombies coordinate attacks using GPU-computed flocking behaviors for more challenging horde encounters 🔴
- [ ] **Day/Night Zombie Behavior Shift** - Zombies use different pathfinding strategies during day vs night (safer routes during day, direct assault at night) 🟡
- [ ] **Environmental Zombie Reactions** - Zombies react to explosions, fires, and loud noises, drawn to sound sources (GPU audio spatialization) 🟡
- [ ] **Zombie Group Formations** - Zombies form tactical formations (surround, flank, frontal assault) based on player position (GPU pathfinding) 🔴
- [ ] **Dynamic Spawn Points** - Zombie spawn locations adapt based on player position and map coverage, preventing camping (GPU influence maps) 🔴
- [ ] **Zombie Infestation Zones** - Areas of the map become "infested" over time, spawning more zombies until cleared (visualized with GPU particles) 🟡

### Advanced AI & Pathfinding 🧠

- [ ] **Hierarchical Pathfinding** - Coarse grid + fine detail pathfinding, all computed on GPU for thousands of agents 🔴
- [ ] **Jump Point Search** - Faster A* variant for grid-based maps with GPU optimization 🔴
- [ ] **Theta* Pathfinding** - Any-angle paths eliminating grid artifacts for smoother movement 🔴
- [ ] **Dynamic Obstacle Avoidance** - RVO (Reciprocal Velocity Obstacles) computed on GPU for crowd navigation 🔴
- [ ] **Formation Movement** - Zombies move in coordinated tactical groups with maintained spacing 🟡
- [ ] **Influence Maps** - GPU-computed heat maps of danger, noise, and player activity zones 🟡
- [ ] **Behavior Trees on GPU** - Thousands of AI agents with complex decision logic running in parallel 🔴
- [ ] **Utility AI** - Score-based decision making with all evaluations computed in parallel 🔴
- [ ] **Goal-Oriented Action Planning (GOAP)** - AI plans multi-step strategies to achieve objectives 🔴
- [ ] **Swarm Intelligence** - Emergent complex behavior from simple flocking rules 🟡
- [ ] **Predator-Prey Dynamics** - Different zombie types hunt or flee from each other based on type 🟡
- [ ] **Territory Control** - Zombies claim and defend specific map areas from intruders 🟡

### Vision & Detection Systems 👁️

- [ ] **Line of Sight Calculation** - GPU raycasts for real-time visibility determination 🔴
- [ ] **Vision Cones** - Visualize what each zombie can see in real-time for stealth gameplay 🟡
- [ ] **Sound Propagation for AI** - Zombies hear gunshots through walls with realistic attenuation 🔴
- [ ] **Scent Trails** - Zombies follow player's path using GPU-computed flow fields 🟡
- [ ] **Heat Vision** - Special zombie type sees player through walls via thermal signature 🟡
- [ ] **Motion Detection** - Zombies react specifically to movement patterns and speed 🟡
- [ ] **Peripheral Vision** - Zombies have realistic blind spots and limited peripheral awareness 🟡
- [ ] **GPU Crowd Simulation** - Simulate 100,000+ zombie crowd behaviors with emergent patterns 🔴
- [ ] **Neural Network Behavior** - ML-based zombie decision making that adapts to player tactics 🔴
- [ ] **Spatial Hashing on GPU** - Ultra-fast neighbor queries for AI and physics using GPU hash grids 🔴
- [ ] **Asynchronous Pathfinding** - Multi-frame pathfinding spread across compute passes for zero frame drops 🔴
- [ ] **GPU-Powered Threat Assessment** - Real-time analysis of zombie threat levels using compute shaders to prioritize targets and positioning 🔴
- [ ] **Heat Map Visualization** - Visual overlay showing zombie activity zones, spawn points, and movement patterns for strategic planning 🟡
- [ ] **Predictive AI Director** - System anticipates player actions using GPU-computed probability maps to create challenging but fair encounters 🔴
- [ ] **Zombie Behavior Trees on GPU** - Thousands of AI agents with complex decision logic running in parallel compute shaders for massive hordes 🔴
- [ ] **Dynamic Difficulty via GPU Metrics** - System monitors player performance using GPU timestamp queries to adjust spawn rates in real-time 🟡

---

## Phase 4: Fortification (Base Building) 🏰

- [ ] **Base Perimeter Walls** - Four protective walls around player's base that absorb zombie damage 🔴
- [ ] **Wall Health System** - Walls have health bars that deplete when zombies attack them 🟡
- [ ] **Wall Repair Mechanic** - Player can repair damaged walls by interacting with them 🟡
- [ ] **Wall Upgrades** - Reinforce walls to increase their health and damage resistance 🟡
- [ ] **Gate Mechanism** - Controllable gates in walls for player movement in/out of base 🟡
- [ ] **Wall Repair Pickups** - Simple drop items that restore a fixed amount of wall health 🟢
- [ ] **Deployable Cover** - Place temporary, low-health barricades to slow zombies 🟡
- [ ] **Automated Turrets** - Placeable, automated turrets that fire at zombies within a certain range 🔴
- [ ] **Placeable Traps** - Purchase and deploy temporary traps like caltrops (slows zombies) or laser tripwires 🟡
- [ ] **Destructible Environment** - Add objects like fences or crates that can be destroyed by players and zombies 🟡
- [ ] **Environmental Hazards** - Explosive barrels, electrified fences, and traps 🟡
- [ ] **NPC Survivors** - Simple AI characters in the base who provide small passive benefits (e.g., slowly repair walls) 🔴
- [ ] **Tesla Coil** - Defensive structure that zaps nearby enemies with chain lightning 🔴
- [ ] **Landmines** - Placeable explosive traps that trigger when zombies step on them 🟡
- [ ] **Sniper Tower** - Elevated structure allowing long-range defense 🔴
- [ ] **Barbed Wire** - Placeable hazard that slows and damages zombies 🟢
- [ ] **Hydraulic Physics** - Destructible buildings with realistic collapse mechanics 🔴
- [ ] **Power Grid Management** - Maintain generators to keep lights and turrets active 🔴
- [ ] **Moat Building** - Dig trenches and fill them with water (or lava) 🔴
- [ ] **Underground Bunkers** - Construct multi-level subterranean bases 🔴
- [ ] **Automation Logic Gates** - Programmable wiring system (AND/OR/NOT gates) for advanced trap triggers 🔴
- [ ] **Hydroponics & Farming** - Grow food and medicinal herbs within the safety of the base 🟡
- [ ] **Recycler Unit** - Breakdown useless loot into raw materials for crafting 🟡
- [ ] **Teleporter Pads** - Build instant travel points between distant base sections 🔴
- [ ] **Safe Zone Building** - Construct and upgrade a persistent home base 🔴
- [ ] **Shield Generator** - Base structure providing temporary player overshield 🔴
- [ ] **Dynamic Wall Health Visualization** - GPU-computed visual effects showing wall damage, stress points, and structural integrity 🟡
- [ ] **Base Construction Physics** - Building placement uses GPU collision detection to ensure structures are stable and can support weight 🔴
- [ ] **Automated Repair Systems** - Base structures auto-repair over time, with visual progress shown through GPU particle effects 🟡
- [ ] **Structural Stress System** - Walls accumulate damage from zombie attacks, showing cracks and weakening using GPU shader effects 🟡
- [ ] **Base Power Grid** - Electrical systems powering defenses, with visual GPU particle effects showing power flow and failures 🔴
- [ ] **Resource Flow Visualization** - GPU-computed visual representation of material transport between base structures 🟡
- [ ] **Destructible Base Foundations** - Zombies can dig under or break through weaker sections, requiring strategic reinforcement (GPU physics) 🔴
- [ ] **Modular Base Design** - Building blocks snap together using GPU-computed placement validation for optimal base construction 🟡
- [ ] **Base Efficiency Calculator** - Real-time analysis of base layout efficiency using GPU compute shaders (coverage, bottlenecks, etc.) 🔴

---

## Phase 5: Global Infection (Multiplayer) 🌐

- [x] **Local Co-op Multiplayer** - Allow a second player to join the game on the same screen 🟡
- [x] **Multiplayer Lobby UI** - Canvas-driven lobby with live player list, connection status, and game controls 🟡
- [x] **Ready System** - Players can toggle ready status before game starts; all must be ready to begin 🟢
- [x] **Leader System** - First player designated as lobby leader with game start control; automatic reassignment on disconnect 🟡
- [x] **Synchronized Game Start** - Server validates and broadcasts game start to all clients simultaneously, ensuring all players join the same session 🟡
- [ ] **Online Multiplayer** - Full networked gameplay (lobby system ready) 🔴
- [ ] **Cross-Platform Sync** - Synchronize game state across different platforms 🔴
- [ ] **Guilds & Clans** - Form groups with other survivors 🔴
- [ ] **Online Leaderboards** - Integrate a service to display global high scores 🔴
- [x] **Achievements System** - Add in-game achievements for completing specific challenges ✅
- [x] **Daily/Weekly Challenges** - Offer special challenges with currency rewards (e.g., "Survive 5 waves with only a pistol") ✅
- [ ] **Battle Royale Mode** - PvP mode where players fight to be the last survivor amidst the horde 🔴
- [ ] **Global Event System** - Live server-side events affecting all ongoing games (e.g., "Blood Moon") 🔴
- [ ] **Spectator Mode** - Watch other players' games in real-time after dying 🟢
- [ ] **Voice Chat** - Proximity-based voice communication for multiplayer 🔴
- [ ] **Revive/Rescue System** - Downed players/AI companions enter a "downed" state (30-45s bleed-out timer). Teammates can revive by holding interact near downed teammate (3-5s channel). Adds critical co-op teamwork mechanic with visual feedback (downed state indicator, revive progress bar) 🟡
- [ ] **Shared Resource Pool & Item Sharing** - Players and AI companions draw from a shared ammo pool (configurable). Players can share ammo/health with teammates, drop items for others to pick up, and use medkits on teammates. UI shows shared resource bar with total ammo/medkits 🟡
- [ ] **Tactical Ping/Marker System** - Players can mark zombies, locations, or resources with visual indicators and audio cues for better coordination in co-op. Contextual commands like "Revive [Player Name]" when teammate is down 🟢
- [ ] **Character Customization** - Skins, outfits, and avatar personalization 🟡
- [ ] **Shared Resource Visualization** - GPU-computed visual effects showing resource sharing between players in co-op (health/ammo transfer effects) 🟡
- [ ] **Team Formation System** - Players can form tactical formations with visual indicators powered by GPU compute shaders 🟡
- [ ] **Synchronized Environmental Events** - Weather, explosions, and destruction sync across all clients using GPU-computed deterministic physics 🔴
- [ ] **Player Skill Matching via GPU Analysis** - System analyzes player performance using GPU timestamp queries for better matchmaking 🟡
- [ ] **Cooperative Base Building** - Multiple players can build simultaneously with real-time sync using GPU-validated construction placement 🔴
- [ ] **Shared Vision System** - Players can share "vision" of enemies spotted by teammates, with visual indicators using GPU ray-casting 🟡
- [ ] **Cross-Player Pathfinding** - AI companions/pets use GPU pathfinding that considers multiple player positions for optimal positioning 🔴
- [ ] **Team Combo System** - Coordinated attacks between players create visual combo effects using GPU particle systems 🟡
- [ ] **Lag Compensation Visualization** - Visual indicator showing network latency effects using GPU timestamp queries to help players understand sync 🟢

### Network Optimization & Synchronization 🌐

- [ ] **Client-Side Prediction** - Smooth movement despite lag using predictive algorithms for responsive gameplay (core netcode) 🔴
- [ ] **Server Reconciliation** - Correct mispredictions gracefully without jarring teleports 🔴
- [ ] **Entity Interpolation** - Smooth other players' movement between network updates 🟡
- [ ] **Lag Compensation** - Hit detection accounts for ping differences between players (core netcode) 🔴
- [ ] **Delta Compression** - Only send changed data over network to minimize bandwidth usage 🔴
- [ ] **Interest Management** - Only sync nearby entities to reduce network overhead 🟡
- [ ] **Snapshot Interpolation** - Smooth state updates between server ticks 🟡
- [ ] **Rollback Netcode** - Fighting game-style synchronization for competitive play 🔴

---

## Phase 5.5: Experience & Meta-Progression 📊

### Core XP Mechanics

- [ ] **XP Gain System** - Earn XP from kills, scaled by zombie type and wave number (e.g., Normal = 10 XP, Fast = 15 XP, Armored = 25 XP, Boss = 100 XP) 🟡
- [ ] **Level-Up System** - Visual feedback and sound effects when leveling up, with satisfying animations 🟢
- [ ] **Persistent XP Tracking** - Save XP and level progress across runs using localStorage 🟡
- [ ] **XP Multipliers** - Bonus XP for combos, headshots, and special achievements (e.g., 2x for kill streaks, 1.5x for headshots) 🟡
- [ ] **Level Cap** - Set maximum level (e.g., Level 50) before prestige becomes available 🔴
- [ ] **XP Display in HUD** - Show current XP, level, and progress to next level during gameplay 🟢
- [ ] **Post-Game XP Summary** - Display XP gained breakdown after each run ends 🟢

### Currency System ("Scrap")

- [x] **Scrap Earnings** - Earn scrap from kills (scaled by zombie type) and wave completion bonuses 🟡  
  [AMENDED 2026-06-25]: Session scrap from zombie death drops implemented — bosses 30, regular 10 @ 20% chance. Wave bonuses not yet.
- [ ] **Persistent Scrap Balance** - Save scrap balance across sessions using localStorage 🟡
- [x] **Visual Scrap Counter** - Display current scrap balance in HUD during gameplay 🟢  
  [AMENDED 2026-06-25]: `drawScrapStat` on desktop bottom bar + mobile sidebar (`player.scrap`).
- [ ] **Post-Game Scrap Summary** - Show scrap earned breakdown after each run ends 🟢
- [ ] **Scrap Multiplier Upgrades** - Permanent upgrades that increase scrap earnings per kill 🟡  
  [AMENDED 2026-06-25]: `player.scrapMultiplier` field exists; no permanent shop wired yet. Mid-run wave-break shrine spends scrap (see below).
- [x] **Wave-Break Scrap Shrine** - Spend session scrap on one random mid-run upgrade during wave breaks (ammo refill, shield, rapid fire) 🟡  
  [AMENDED 2026-06-25]: `ScrapShrine` + `ScrapShopSystem`; 45% spawn wave 4+; E to buy; multiplayer gated.
- [ ] **Performance-Based Rewards** - Bonus XP/Scrap for achieving high GPU frame rates or maintaining 60 FPS during intense combat 🟡
- [ ] **GPU Efficiency Bonuses** - Rewards for using efficient tactics that reduce GPU load, encouraging optimized gameplay 🟡
- [ ] **Difficulty Scaling Rewards** - Higher rewards for playing at difficulty levels that maximize GPU utilization (challenge-based optimization) 🟡
- [ ] **Technical Mastery Achievements** - Unlocks for players who master game mechanics that leverage advanced GPU features 🟡

### Permanent Upgrade Shop

- [ ] **Between-Run Upgrade Menu** - Accessible upgrade shop from main menu between runs 🟢
- [ ] **Tiered Upgrade System** - Multiple levels per upgrade with increasing costs 🟡
- [ ] **Upgrade Categories** - Organize upgrades into Combat, Survival, Utility, and Special categories 🟢

**Combat Upgrades:**

- [ ] **Max Health** - Increase maximum health (+10 HP per level, 5 levels max) 🟡
- [ ] **Critical Hit Chance** - Increase crit chance (+2% per level, 5 levels max) 🟡
- [ ] **Damage Multiplier** - Increase base weapon damage (+5% per level, 5 levels max) 🟡
- [ ] **Reload Speed** - Faster reload times (+10% per level, 5 levels max) 🟡
- [ ] **Starting Weapon Unlock** - Unlock better starting weapons (Rifle, Shotgun, Flamethrower) 🟡

**Survival Upgrades:**

- [ ] **Movement Speed** - Increase base movement speed (+3% per level, 5 levels max) 🟡
- [ ] **Stamina Capacity** - Increase max stamina (+20% per level, 3 levels max) 🟡
- [ ] **Health Regeneration Rate** - Faster out-of-combat health regen (+25% per level, 3 levels max) 🟡
- [ ] **Shield Capacity** - Increase max shield from shield pickups (+25 per level, 3 levels max) 🟡

**Utility Upgrades:**

- [ ] **Starting Ammo** - Increase starting ammo for all weapons (+20% per level, 3 levels max) 🟡
- [ ] **Grenade Capacity** - Start with more grenades (+1 per level, 3 levels max) 🟡
- [ ] **Ammo Drop Rate** - Increase chance of ammo pickups spawning (+10% per level, 5 levels max) 🟡
- [ ] **Health Drop Rate** - Increase chance of health pickups spawning (+10% per level, 5 levels max) 🟡

**Special Upgrades:**

- [ ] **Scrap Multiplier** - Increase scrap earnings (+10% per level, 5 levels max) 🟡
- [ ] **XP Multiplier** - Increase XP gain rate (+15% per level, 3 levels max) 🟡
- [ ] **Power-Up Duration** - Increase duration of temporary power-ups (+20% per level, 3 levels max) 🟡
- [ ] **Starting Power-Up** - Start each run with a random power-up active 🟡
- [ ] **GPU Rendering Quality Upgrades** - Permanent unlocks for higher quality post-processing, particle counts, and visual effects 🔴
- [ ] **Compute Shader Upgrades** - Unlock advanced AI behaviors, physics, and rendering techniques through progression 🔴
- [ ] **Performance Optimization Upgrades** - Permanent improvements to game performance that unlock more complex features 🟡
- [ ] **Visual Quality Presets** - Unlock higher quality rendering presets (Medium, High, Ultra) through progression 🟡
- [ ] **Advanced Physics Unlocks** - Unlock sophisticated physics interactions (soft body, cloth, fluids) through player progression 🔴

### Prestige/Mastery System

- [ ] **Prestige Option** - After reaching max level, option to prestige and reset level for permanent bonuses 🔴
- [ ] **Prestige Tiers** - Multiple prestige tiers (Prestige 1, 2, 3, etc.) with unique cosmetic rewards 🔴
- [ ] **Prestige Bonuses** - Permanent bonuses that persist across prestiges (e.g., +5% scrap multiplier per prestige) 🔴
- [ ] **Prestige-Only Upgrades** - Exclusive upgrades only available after prestiging 🔴
- [ ] **Prestige Visual Indicators** - Show prestige tier in player profile and HUD 🟢

### Player Profile & Stats

- [ ] **Persistent Player Profile** - Save progress (unlocks, high scores, stats) across sessions via localStorage 🟡
- [ ] **Lifetime Statistics** - Track total kills, waves survived, time played, favorite weapon, etc. 🟡
- [ ] **Achievement Progress Display** - Show progress toward achievements in profile 🟢
- [ ] **Stat Categories** - Organize stats into Combat, Survival, Exploration, and Special categories 🟢
- [ ] **Leaderboard Integration** - Display player stats in context of global/local leaderboards 🟡

### Game Modes & Economy

- [ ] **Survival Mode** - Resource management with hunger/thirst/temperature mechanics 🔴
- [ ] **Trading System** - NPC merchants, economy, rare item marketplace 🔴
- [ ] **In-Game Economy/Shop** - Buy/sell/trade items with currency earned 🟡  
  [AMENDED 2026-06-25]: Partial — wave-break `ScrapShrine` mid-run upgrades only; no persistent between-run shop yet.

---

## Phase 6: Progression & Polish 🎨

- [ ] **Tutorial Level** - Guided intro for new players 🟢
- [ ] **Save/Load Progress** - Checkpoint system for sessions 🟡
- [ ] **Horde Rush Mode** - Endless waves with escalating intensity 🔴
- [ ] **Dynamic Events** - Random encounters and emergencies 🟡
- [ ] **Seasonal Events** - Limited-time themes, enemies, or rewards 🟡
- [x] **Wave Break System** - Brief pause between waves to catch your breath and reload 🟢
- [x] **News Ticker** - Scrolling announcement bar on main menu displaying version highlights 🟢
- [x] **Sound Effects** - Gunshots, damage sounds, and walking footsteps (Web Audio API generated) 🟡
- [x] **Screen Shake** - Camera shake on shooting and taking damage for impact 🟢
- [x] **Blood Splatter** - Particle effects when zombies are hit/killed 🟡
- [x] **Muzzle Flash** - Visual effect when player shoots 🟢
- [x] **Kill Confirmed Sound** - Distinct audio feedback (satisfying "pop" or "thud") when zombie is killed, separate from hit sound 🟢
- [x] **Zombie Spawn Flash** - Brief visual indicator (glow/flash) where zombie will spawn before it appears 🟢
- [x] **Zombie Death Sound** - Distinct sound effect when zombie is killed (different from hit sound) for kill confirmation 🟢
- [x] **Shell Ejection** - Visual effect of bullet casings being ejected from the gun 🟢
- [x] **Floating Damage Numbers** - Show damage dealt as numbers that float up from zombies when hit 🟢
- [ ] **Score Multiplier** - Combo system for consecutive kills without taking damage 🟡
- [x] **Kill Streak Counter** - Track consecutive kills and display streak count with bonus score multiplier 🟡
- [ ] **Ammo Scarcity Scaling** - Gradually reduce ammo drop chance with higher waves for tension 🟡
- [ ] **Bounty System** - A specific, marked "bounty" zombie appears each wave. Killing it grants a significant currency bonus 🟡
- [x] **Hit Markers & Impact SFX** - Quick visual marker and subtle sound on successful hits 🟢
- [ ] **Resource Scavenging** - Collect supplies from defeated zombies for crafting/upgrades 🟡
- [ ] **Inventory Management** - Limited carrying capacity, item weight system 🟡
- [ ] **Crafting System** - Players can collect resources to craft ammo, health kits, or even basic weapons 🔴
 - [ ] **Crafting System** - Players can collect resources to craft ammo, health kits, or even basic weapons (baseline crafting) 🔴
- [ ] **Selectable Difficulty Modes** - Introduce "Easy", "Normal", and "Hard" modes that adjust zombie stats and spawn rates 🟡
- [ ] **Character Selection** - Choose from characters with unique starting weapons or passive abilities 🟡
- [ ] **Narrative Story Mode** - A separate mode with handcrafted levels and specific objectives 🔴
- [ ] **Advanced Weather Effects** - Implement dynamic weather like rain (reduces visibility) or fog that cycles periodically 🟡
- [ ] **Advanced Sound Design** - Add more detailed audio cues, like distinct footstep sounds and more varied zombie vocalizations 🟡
- [x] **Survivor Companion** - AI-controlled ally that assists in combat 🔴
- [ ] **AI Companion Roles/Classes** - Different AI companion specializations: Medic (heals, revives faster), Heavy Gunner/Tank (tanky, high damage), Scout (fast, marks enemies), Engineer (repairs base, sets traps). Choose 1-3 companions before starting, each with unique abilities and visual distinction (colors/icons per class) 🔴

---

## Phase 9: Advanced Systems & Infrastructure 🚀

### Gameplay Features

- [ ] **Dynamic Weather System** - Real-time weather changes affecting visibility, movement speed, and zombie behavior (rain reduces accuracy, fog limits vision, wind affects projectile trajectories) 🔴
- [ ] **Procedural Level Generation** - Algorithmic map creation with configurable parameters for size, difficulty zones, loot distribution, and environmental hazards 🔴
- [ ] **Advanced Character Customization** - Deep skill trees with branching paths, visual appearance options, and personalized loadout configurations 🟡
- [ ] **Multiplayer Cooperative Mode** - Full online co-op with shared objectives, synchronized wave progression, and team-based rewards 🔴
- [ ] **Competitive PvP Arena** - Player vs player combat modes with ranking system, seasonal leaderboards, and skill-based matchmaking 🔴
- [ ] **Crafting System** - Resource gathering from environment and enemies, combined with blueprints to create weapons, ammo, and utility items 🟡
 - [ ] **Crafting System** - Resource gathering from environment and enemies, combined with blueprints to create weapons, ammo, and utility items (expanded blueprint system) 🟡
 - [ ] **Day/Night Cycle** - Dynamic time progression affecting zombie aggression, spawn rates, and special nocturnal enemy types (advanced; baseline completed in Phase 3) 🟡
- [ ] **Interactive Environmental Objects** - Physics-enabled objects like explosive barrels, destructible walls, and movable barricades 🟡
- [ ] **Mini-Games & Side Activities** - Skill-based challenges between waves offering unique rewards and temporary buffs 🟢
- [ ] **Dynamic Difficulty Adjustment** - AI-driven system analyzing player performance to adjust spawn rates, enemy health, and loot frequency in real-time 🔴

### Architectural Features

- [ ] **Modular Plugin System** - Extensible architecture allowing third-party developers to add new weapons, enemies, and game modes without core code changes 🔴
- [ ] **Data-Driven Design** - JSON configuration files controlling game balance, spawn tables, weapon stats, and upgrade costs for easy tuning 🟡
- [ ] **Event Bus Architecture** - Decoupled communication system between game systems enabling modular feature integration 🔴
- [ ] **Save Game Versioning** - Migration system handling save file compatibility across game updates with automatic conversion 🟡
- [ ] **Network Synchronization Framework** - Robust state synchronization for multiplayer with lag compensation, prediction, and conflict resolution 🔴
- [ ] **Automated Performance Profiling** - Built-in tools monitoring frame rates, memory usage, and network latency with detailed analytics 🟡
- [ ] **Localization Support** - Infrastructure for multiple languages, regional settings, and culturally appropriate content adaptation 🟡
 - [ ] **Replay System Architecture** - Recording and playback functionality for gameplay analysis, bug reporting, and content creation (architecture) 🔴
- [ ] **AI Behavior Tree Implementation** - Hierarchical AI system enabling complex enemy behaviors, coordinated attacks, and adaptive strategies 🔴
- [ ] **Cross-Platform Rendering** - Abstraction layer supporting multiple graphics APIs and hardware configurations for maximum compatibility 🔴
- [ ] **Observer Pattern for Game Events** - Decouple event listeners for cleaner code and easier maintenance 🟡
- [ ] **Command Pattern for Input** - Undo/replay system for inputs enabling replay functionality 🔴
- [ ] **Asset Manifest System** - Centralized JSON for all game assets with versioning and dependency tracking 🟢
- [ ] **Dependency Injection Container** - Modular system initialization and testing with loose coupling 🔴
- [ ] **State Machine for Game Modes** - Clean transitions between menu/gameplay/pause states with validation 🟡
- [ ] **Telemetry Analytics** - Track player behavior patterns (heatmaps, death locations) for game balance 🟡
- [ ] **A/B Testing Framework** - Test different balance values with player cohorts for data-driven decisions 🔴
- [ ] **Automated Balance Testing** - Simulate thousands of runs to test weapon balance and difficulty curves 🔴
- [ ] **Version Migration System** - Automatically update old save files to new formats for backward compatibility 🟡
- [ ] **Plugin Sandboxing** - Isolate mod code execution for security and stability 🔴

### Implementation Standards

- [ ] **Backward Compatibility** - All new systems maintain full compatibility with existing features and save data 🟡
- [ ] **System Documentation** - Comprehensive architecture documentation and API references for all new subsystems 🟢
- [ ] **Unit Test Coverage** - Automated testing framework with >80% coverage for critical game systems 🟡
- [ ] **Gradual Multiplayer Rollout** - Phased deployment strategy for online features with fallback mechanisms 🔴
- [x] **Configuration Management** - Extensive options menu controlling all adjustable parameters with sensible defaults 🟢
- [ ] **Developer Tools** - Debugging utilities, performance monitors, and testing frameworks for efficient development 🟡
- [ ] **Analytics Integration** - Comprehensive telemetry tracking player behavior, system performance, and error reporting 🟡
- [ ] **Performance Benchmarking** - Automated performance testing with baseline comparisons and regression detection 🔴
- [ ] **Regression Testing** - Automated validation ensuring existing functionality remains intact after updates 🟡
- [ ] **Update Documentation** - Detailed patch notes and player-facing change logs for all new features 🟢
- [ ] **AI Companion Dialogue System** - Companions communicate through speech bubbles with context-aware dialogue. Personality-based responses (aggressive, calm, supportive) that react to game events like player health, enemy kills, wave completion, and boss spawns. Cross-companion conversations and warnings 🟡
- [ ] **AI Companion Flocking Behavior** - Companions use Craig Reynolds' flocking algorithm to maintain natural group formations. Separation, alignment, and cohesion forces create organic movement patterns that prevent clustering while maintaining squad cohesion 🟡
- [ ] **AI Companion Pathfinding & Obstacle Avoidance** - Advanced navigation system that steers companions around zombies, acid pools, and environmental obstacles. Dynamic obstacle detection with smooth avoidance vectors for realistic movement 🟡
- [ ] **AI Companion Formation System** - Tactical formation management (wedge, line, circle, vanguard) that maintains relative positions to player. Formation switching based on combat situation. Visual formation indicators and smooth transitions between formations 🟡
- [ ] **AI Companion Utility-Based Decision Making** - Replace hard-coded behavior with utility AI system. Actions evaluated by utility scores based on context (combat, reload, follow, pickup, cover). Highest utility action selected dynamically for more intelligent decision-making 🔴
- [ ] **AI Companion Personality & Emotion System** - Distinct personality traits (aggressive, calm, supportive, cautious, reckless) that affect behavior, dialogue, and combat style. Dynamic emotions (happy, angry, scared, determined) that change based on game events and influence decision-making 🟡
- [ ] **AI Companion Dynamic Reaction System** - Event-triggered reactions that temporarily modify behavior. Boss spawn increases aggression, player low health triggers protective behavior, companion downed causes emotional response. Contextual reactions with duration-based effects 🟡
- [ ] **AI Companion Memory & Learning System** - Companions remember past events (player saved, companion died, boss defeated) and learn from experience. Bad experiences make companions more cautious, good experiences increase confidence. Memory influences future behavior decisions 🟡
- [ ] **AI Companion Advanced Combat Tactics** - Sophisticated combat strategies including flanking, suppressing fire, focus fire coordination, and covering fire. Situation analysis selects optimal tactic. Companions coordinate with each other for tactical advantages 🔴
- [ ] **AI Companion Cross-Companion Communication** - Companions communicate with each other through dialogue and behavior. Warnings broadcast to squad, tactical coordination messages, and emotional responses to each other's actions. Creates sense of team cohesion 🟡
- [ ] **AI Companion Goal-Oriented Action Planning (GOAP)** - Companions plan sequences of actions to achieve goals (survive, protect player, eliminate threats, collect resources). A* search through action space considering preconditions and effects for intelligent multi-step planning 🔴
- [ ] **AI Companion Predictive Aiming** - Companions predict zombie movement trajectories and lead targets for better accuracy. Accounts for zombie speed, direction changes, and projectile travel time. More realistic and effective combat behavior 🟡

---

## Phase 7: Co-op Play & Social Systems 🤝

- [ ] **Matchmaking & Server Browser** - Online lobby with server browser, filters, regions, and private invite-only lobbies 🔴
- [ ] **Drop-in/Drop-out Co-op** - Seamless join mid-run with auto-scaling difficulty and host migration on disconnect 🔴
- [ ] **Map Voting & Rotation** - Vote for next map or modifier from a short list between runs 🟡
- [ ] **Co-op Roles & Skill Trees** - Player-selectable roles (Medic/Engineer/Scout/Tank) with unique actives/passives and team synergy bonuses 🔴
- [ ] **Team Perk Combos** - Perks that activate stronger effects when specific role combos are present (e.g., Engineer+Medic = fast healing station) 🟡
- [ ] **Shared Objectives & Side Quests** - In-run tasks like repairing generators, escorting NPCs, or securing supply points for bonus scrap/XP 🟡
- [ ] **Boss Rush Co-op Mode** - Chain of escalating boss fights with limited resources and team score tracking 🟡
- [ ] **Generator Defense Mode** - Defend a power core with build/repair phases between waves 🟡
- [ ] **Dynamic Map Events** - Blood Moon, blackout, fog banks, acid rain—each with unique enemy behaviors and team counterplay 🟡
- [ ] **Supply Drop Call-In** - Spend scrap to call air-dropped crates; team votes on one of three upgrade choices 🟡
- [ ] **Team Revive Beacon** - Deployable beacon that enables respawn after a defended channel; limited charges per run 🟡
- [ ] **Portable Turret & Support Drone** - Team-deployable gadgets with shared ammo and cooldowns; synergize with Engineer role 🟡
- [ ] **Tactical Field Upgrades** - Random upgrade stations offering time-limited buffs to damage, healing, or defense 🟡
- [ ] **Shared Stash & Team Loadouts** - Pre-run shared stash and safehouse banks to coordinate complementary weapons/attachments 🟡
- [ ] **Radial Ping Wheel & Context Actions** - Expanded ping menu for commands like “Need ammo”, “Defend here”, “Boss incoming” 🟢
- [ ] **Emotes & Sprays** - Nonverbal comms and fun cosmetics usable in lobby and in-run 🟢
- [ ] **Cross-Play Invites & Friends List** - Platform-agnostic friend system with party invites and presence 🔴
- [ ] **Join-In-Progress Spectator → Player** - New players spectate until next wave, then choose a safehouse spawn 🟡
- [ ] **Party Size Difficulty Scaling** - Auto-adjust enemy count/health/drops with clear UI indicator of scaling 🟡
- [ ] **Team Challenges & Weekly Ops** - Rotating co-op objectives with unique rewards and score modifiers 🟡
- [ ] **Post-Game Team Stats & Heatmaps** - Detailed summary: damage, revives, accuracy, role contributions, movement heatmaps 🟢
- [ ] **Kill Feed & Combo Highlights** - On-screen feed for elite kills, clutch revives, and activated team combos 🟢
- [ ] **Accessibility Suite** - Colorblind filters, text scaling, audio mix presets, aim assist options for inclusive co-op 🟢
 - [ ] **Netcode: Client Prediction & Lag Compensation** - Hit reconciliation and interpolation to improve online feel (co-op integration) 🔴
- [ ] **Anti-Grief Tools** - Vote kick/restart, friendly-fire toggle, idle detection, and item-sharing locks to prevent griefing 🟡
- [ ] **AI Companion Command System** - Give tactical commands to AI companions via hotkeys or radial menu: "Follow", "Hold Position", "Cover Me", "Scavenge", "Defend Area", "Focus Fire". Visual indicators (command icons above companions) and brief audio confirmations for better control 🟡
- [ ] **AI Companion Upgrade System** - Upgrade AI companions between waves with improved stats, abilities, or equipment. Progression system that enhances companion effectiveness over time 🟡
- [ ] **AI Companion Trust/Loyalty System** - Trust meter increases when players revive companions, share resources, or complete objectives together. Higher trust = better accuracy, faster reactions, more aggressive support. Trust decreases if companions are left to die or ignored. Visual trust indicator in companion HUD 🟡
- [ ] **Single-Use Vehicle** - A rare chance for a vehicle like a forklift to spawn, allowing the player to clear a large number of zombies before it breaks 🟡
- [ ] **Side Objectives** - During a wave, optional objectives can appear, like "Protect the generator" or "Rescue a survivor" 🟡
- [ ] **Different Maps** - Multiple arenas with obstacles and cover 🔴
- [ ] **Procedurally Generated Maps** - Instead of a fixed map, generate a new layout for each run 🔴
- [ ] **Mobile Support** - Touch controls for mobile devices 🔴
- [ ] **Radioactive Storm** - Weather event that drains health slowly unless under cover 🔴
- [ ] **Night Vision Goggles** - Toggleable item for better visibility during the night cycle 🟢
- [x] **Adrenaline Shot** - Consumable that gives a temporary speed and reload boost 🟢
- [ ] **Acid Rain** - Weather hazard that damages entities outside of cover 🟡
- [ ] **Drone Support** - Automated flying ally that shoots at nearby enemies 🔴
- [ ] **Map Editor** - comprehensive tool for players to design and share their own survival arenas 🔴
- [ ] **Procedural City Generation** - Infinite, dynamically generated urban environments to explore 🔴
- [ ] **Vehicle System** - Repair and drive cars, trucks, and motorcycles to traverse large maps 🔴
- [ ] **Dynamic Faction System** - NPC groups that fight each other and the undead 🔴
- [x] **WebGPU Rendering Backend** - Rewriting the graphics engine for next-gen lighting and millions of particles 🔴
- [ ] **VR / XR Support** - Full Virtual Reality integration with motion controller tracking 🔴
- [ ] **Dismemberment Engine** - Procedural limb destruction and gore physics 🔴
- [ ] **Squad Ranking System** - Team-based competitive rankings with seasonal resets and rewards 🔴
- [ ] **Asymmetric PvP Mode** - One player controls zombie horde vs survivors for unique gameplay 🔴
- [ ] **Tournament/Bracket System** - Organized competitive events with prizes and spectator support 🔴
- [ ] **Guildhall/Social Hub** - 3D lobby space where players meet between matches with customization 🔴
- [ ] **Trade Market System** - Player-to-player item trading with economy and marketplace 🔴
- [ ] **Mentor/Apprentice System** - Veterans get rewards for helping new players level up 🟡
- [ ] **Cross-Region Server Handoff** - Seamless migration between regional servers for optimal latency 🔴
- [ ] **Session Recording & Sharing** - Save and share gameplay clips with others via cloud storage 🟡

### Visual & Audio Immersion 🎨

- [ ] **Background Music** - Looping tracks for immersion 🟢
- [ ] **Voice Acting or Enhanced Audio** - Better sound experience and immersion 🟡
- [ ] **Dynamic Shadows** - Shadows that lengthen and move with the day/night cycle 🟡
- [ ] **Interactive Vegetation** - Grass and bushes sway and flatten when entities move through them 🟡
- [ ] **Footprint Tracking** - Bloody footprints left by players and zombies after walking through gore 🟢
- [ ] **Volumetric Fog** - Fog that reacts to light sources and player movement for spooky atmosphere 🔴
- [ ] **Neon City Biome** - A unique zone with flickering neon signs and rain-slicked streets 🔴
- [ ] **Graffiti & Lore Decals** - Environmental storytelling through scrawled messages and warnings on walls 🟢
- [ ] **Seasonal Themes** - Map visual changes based on real-world holidays (snow, pumpkins, confetti) 🟢
- [ ] **Aurora Borealis** - Rare night sky event that lights up the darkness with colorful ribbons 🟢
- [ ] **Dynamic Lighting System** - Real-time light sources with shadows and illumination. Muzzle flashes, explosions, and fire create dynamic lighting. Day/night cycle affects ambient lighting. Light occlusion and shadow casting for depth 🟡
- [ ] **Particle System Overhaul** - Enhanced particle effects with physics-based movement, wind effects, and collision. Layered particle systems for complex effects (smoke, fire, blood). GPU-accelerated particle rendering for thousands of particles 🔴
 - [ ] **Screen Space Reflections** - Reflective surfaces using screen-space reflection techniques. Puddles, glass, and metal surfaces reflect environment. Adds visual depth and realism to the game world (general SSR) 🔴
- [ ] **Motion Blur & Temporal Effects** - Motion blur for fast-moving entities and camera movement. Temporal anti-aliasing for smoother edges. Motion trails for bullets and projectiles. Cinematic visual polish 🟡
- [ ] **Procedural Animation System** - Procedural animations for entities (walking, running, aiming). IK (Inverse Kinematics) for natural limb movement. Dynamic animation blending based on movement speed and direction 🟡
 - [x] **Canvas Post-Processing Pipeline** - Advanced effects including bloom, vignette, chromatic aberration for cinematic quality 🟡 (WebGPU-based bloom implemented)
- [ ] **Projectile Tracer Effects** - Visible bullet trails for heavy weapons showing trajectory paths 🟢
- [ ] **Impact Decal System** - Persistent bullet holes and scorch marks on surfaces with fade-out over time 🟢
- [ ] **Animated Sky Transitions** - Smooth sunrise/sunset gradients with dynamic color shifts throughout day/night cycle 🟡
- [ ] **Zombie Ragdoll Physics** - Bodies collapse and tumble realistically on death with momentum preservation 🟡
- [ ] **Lens Flare Effects** - Dynamic lens flares from explosions and the sun for added visual flair 🟢
- [ ] **Heat Distortion Shader** - Visual heat waves from fire and explosions distorting background 🟡
- [ ] **Blood Pooling System** - Blood puddles expand and persist on ground surfaces, creating visceral environment 🟢
- [ ] **Shader-Based Outlines** - Highlight important objects/enemies with customizable glowing outlines 🟡
- [ ] **Dynamic Wind Grass Shader** - Grass sways in wind direction with realistic wave-like movement patterns 🟡
- [ ] **Visual Feedback System** - GPU-computed visual indicators for all game events (damage, healing, buffs, debuffs) using particle effects 🟡
- [ ] **Dynamic Difficulty Visualization** - Visual effects showing difficulty scaling in real-time (zombie glow intensifies, environment darkens) 🟢
- [ ] **Combat Intensity Meter** - GPU-computed visual meter showing current combat intensity that affects spawn rates and rewards 🟡
- [ ] **Performance Impact Indicators** - Visual warning system when GPU load is high, helping players understand performance trade-offs 🟢
- [ ] **WebGPU Feature Detection UI** - Visual indicator showing which advanced WebGPU features are active (bloom, compute shaders, etc.) 🟢
- [ ] **Adaptive Visual Quality** - Game automatically adjusts visual quality based on GPU performance to maintain target frame rate 🟡

### Atmospheric Effects 🌫️

- [ ] **Atmospheric Scattering** - Realistic sky colors using Rayleigh scattering for natural dawn/dusk 🔴
- [ ] **Aerial Perspective** - Distant objects fade to sky color naturally enhancing depth perception 🟡
- [ ] **Height Fog** - Fog density increases near ground level for atmospheric valleys 🟡
- [ ] **Exponential Fog** - Smooth fog falloff with distance for natural fog transitions 🟡
- [ ] **Volumetric Clouds** - Raymarched 3D clouds with realistic lighting and shadows 🔴
- [ ] **Cloud Shadows** - Clouds cast moving shadows on ground dynamically 🟡
- [ ] **Rain Rendering** - Individual raindrops with splashes and puddle formation 🟡
- [ ] **Snow Accumulation** - Snow piles up on surfaces over time with physics simulation 🔴
- [ ] **Wind Simulation** - Grass, trees, particles react to dynamic wind vectors 🟡
- [ ] **Dust Motes** - Floating particles visible in light shafts for atmosphere 🟢
- [ ] **Heat Haze** - Distortion above hot surfaces like fire and explosions 🟡
- [ ] **GPU-Driven Weather System** - Real-time weather simulation with particle rain/snow and wind vectors 🔴
- [ ] **Atmospheric Fog Volumes** - 3D fog density fields computed on GPU with light scattering 🔴
- [ ] **Dynamic Sky Rendering** - Physically-based sky with real-time cloud formation 🔴
- [ ] **Lightning System** - Procedural lightning bolts with branching and illumination 🟡

### Interactive World 🌍

- [ ] **Shatterable Glass** - Windows and glass surfaces break dynamically when shot or impacted 🟡
- [ ] **Debris Physics** - Shell casings, magazines, and small objects react to explosions and movement 🟡
 - [ ] **Fire Propagation** - Fire from flamethrowers or explosions spreads to nearby flammable materials (gameplay-level) 🔴
- [ ] **Destructible Lights** - Shoot out streetlights or lamps to create darkness for stealth or ambush 🟡
- [ ] **Environmental Traps** - Interactable objects like hanging logs or cars that can be triggered to crush enemies 🟡
- [ ] **Wildlife System** - Neutral animals (rats, crows, deer) that react to gunfire and zombie presence 🟡

### Advanced Gameplay Depth ⚙️

- [ ] **Flashlight Battery System** - Manage battery life for light sources, adding tension to night exploration 🟡
- [ ] **Weapon Overheating** - Continuous fire heats up weapon barrels, visible glowing and smoke effects 🟡
- [ ] **Radio Frequencies** - Tune into different channels for music, distress signals, or lore broadcasts 🟢
- [ ] **Radio Communication** - Lore delivery and mission briefings 🟢
- [ ] **Lockpicking Minigame** - Interactive system to open locked doors or crates for high-tier loot 🟡
- [ ] **Binoculars / Scouting** - Tool to observe distant enemy types and numbers before engaging 🟢
- [ ] **Photo Mode** - Pause the action to take cinematic screenshots with camera controls and filters 🟢
 - [ ] **Replay System** - Watch back and analyze previous play sessions (user-facing playback) 🔴
- [ ] **GPU-Accelerated Replay Recording** - Efficient replay system using GPU timestamp queries and deterministic physics for frame-perfect recordings 🔴
- [ ] **Tactical Analysis Mode** - Review gameplay sessions with GPU-computed heat maps, path visualizations, and performance metrics 🟡
- [ ] **Performance Replay** - Watch replays with GPU performance overlay showing frame times, draw calls, and compute usage 🔴
- [ ] **Strategic Planning Mode** - Pause game and use GPU-computed analysis tools to plan base layout and zombie defense strategies 🟡

### Advanced Physics & Tech 🧪

- [ ] **Fluid Dynamics** - Blood and water flow downhill, pool in depressions, and react to explosions 🔴
- [ ] **Wind System** - Wind speed affects projectile trajectory and spreads smoke/fire dynamically 🔴
 - [ ] **Bullet Penetration** - High-caliber rounds shoot through thin walls, doors, and multiple zombies (environment + zombie) 🟡
 - [ ] **Ricochets** - Bullets can bounce off metal surfaces, creating sparks and potential collateral damage (environment reactions) 🟡
- [ ] **Mud & Dirt Accumulation** - Mud and gore build up on character models and weapons over time 🟢
- [ ] **Procedural Skybox** - Real-time cloud generation and accurate star maps based on in-game time/season 🟡
- [ ] **Physics-Based Sound Generation** - Generate impact sounds based on collision physics (material, velocity, angle) using GPU-computed parameters 🟡
- [ ] **Environmental Audio Propagation** - GPU-computed sound occlusion and propagation through environment affects zombie attraction and player awareness 🟡
- [ ] **Procedural Footstep System** - GPU-computed footstep sounds based on surface material, movement speed, and terrain type 🟡
- [ ] **Dynamic Music Generation** - Music intensity adapts to combat intensity calculated by GPU compute shaders (particle count, enemy proximity) 🟡
- [ ] **Spatial Audio for Stealth** - 3D positional audio system helps players understand zombie positions and plan stealth approaches 🔴
- [ ] **Audio-Visual Synchronization** - Sound effects and visual effects are synchronized using GPU timestamp queries for perfect timing 🟡

### Character & Interaction Polish 🎭

- [ ] **Door Breaching** - Choose between kicking doors open (loud, fast) or peeking/opening slowly (quiet) 🟡
- [ ] **Weapon Inspection** - Animation to admire your weapon and visually check ammo count (HUD-less support) 🟢
- [ ] **Gesture System** - Non-verbal emotes (point, wave, halt) for tactical communication in co-op 🟢
- [ ] **Body Temperature Visuals** - Visible breath in cold weather, sweating in heat, adding to survival immersion 🟢
- [ ] **Sitting & Resting** - Interact with chairs/benches to sit and recover stamina faster 🟢
- [ ] **Ladder Sliding** - Fast descent option for ladders at the risk of fall damage 🟢
- [ ] **Playable Instruments** - Interactive pianos or guitars found in the world for brief musical moments 🟢

### Atmospheric World Building 🌫️

- [ ] **Distant Ambience** - Soundscape of a dying world: distant gunshots, sirens, and screams add tension 🟢
- [ ] **Reactive Wildlife** - Birds flock and scatter when enemies approach, serving as natural alarm systems 🟡
- [ ] **Scavenging Rats** - Rats congregate around corpses and flee from light, enhancing the grim tone 🟢
- [ ] **Fireflies & Night Insects** - Ambient bioluminescence near water and forests at night 🟢
- [ ] **Thunderstorms & Lightning** - Dynamic storms with lightning strikes that can damage entities 🟡
- [ ] **Lore Newspapers & Notes** - Readable items scattered in the world providing backstory on the outbreak 🟢
- [ ] **Story or Lore Codex** - In-game encyclopedia of world info/history 🟢
- [ ] **Destructible Electronics** - Shooting TVs/Computers causes sparks and small explosions 🟢

---

## Phase 6.5: Engine & Architecture Overhaul 🔧

### Core Engine Optimization 🚀

- [ ] **Entity Component System (ECS) Refactor** - Transition core game logic from OOP to ECS for better cache locality and performance 🔴
- [ ] **WebAssembly (Wasm) Physics** - Move heavy physics/collision calculations to a Rust/C++ Wasm module 🔴
- [ ] **OffscreenCanvas Rendering** - Offload rendering logic to a Web Worker to prevent UI thread blocking 🔴
- [x] **Spatial Partitioning System** - Implement Quadtree/Octree for optimized collision detection and entity queries 🟡
  - Quadtree implemented for bullet-zombie collision detection
  - Instance reuse optimization (V0.5.2) - Quadtree reused instead of recreated every frame
  - Query range object reuse for reduced allocations
- [ ] **Object Pooling 2.0** - Advanced global pooling system for zero-allocation gameplay loops (bullets, particles) 🟡
- [ ] **Binary Data Serialization** - Use FlatBuffers/Protocol Buffers instead of JSON for faster save/load and network sync 🔴
- [x] **GPU Particle System** - Move particle simulation to Compute Shaders (WebGPU) or Transform Feedback (WebGL2) 🔴
- [ ] **LOD (Level of Detail) System** - Automatically downgrade animation/model quality based on entity distance 🟡
- [ ] **Asset Streaming System** - Load textures and audio on-demand based on proximity rather than upfront loading 🟡
- [ ] **Input System Rewrite** - Abstracted input handling to support remappable keys, gamepads, and touch interchangeably 🟡
- [ ] **Frame Rate Independent Physics** - Delta-time based physics calculations for consistent behavior across all frame rates. Fixed timestep physics loop separate from rendering. Prevents physics bugs at high/low FPS 🔴
- [ ] **Multi-Threaded Game Loop** - Split update and render loops across Web Workers. Physics and AI calculations in worker thread, rendering on main thread. Prevents frame drops during heavy computation 🔴
- [ ] **Deterministic Game State** - Seed-based random number generation for reproducible game state. Enables replay system, debugging, and network synchronization. Deterministic physics and AI for consistent behavior 🔴
- [ ] **Memory Management System** - Automatic garbage collection optimization. Object lifecycle tracking and cleanup. Memory pool management for frequently allocated objects. Heap size monitoring and warnings 🟡
- [ ] **Hot Module Replacement (HMR)** - Development tool for live code reloading without game restart. Preserve game state during code changes. Fast iteration during development. Production build excludes HMR code 🟡
- [ ] **Save/Load System Enhancement** - Advanced checkpoint system with multiple save slots, auto-save on wave completion, and save state compression. Support for mid-run saves with full game state persistence including companion states and inventory 🟡
- [ ] **Settings System Cloud Sync** - Synchronize settings and keybinds across devices via cloud storage. Profile-based settings with import/export functionality. Settings migration and versioning for backward compatibility 🟡
- [ ] **Audio System Spatialization** - 3D positional audio using Web Audio API spatialization. Sound sources positioned in 3D space relative to player. Distance-based volume and doppler effects for moving entities. Enhanced immersion through directional audio cues 🟡
- [ ] **State Management Event System** - Event-driven architecture for game state changes. Decouple systems through event bus. State change notifications for UI updates, achievements, and analytics. Reduces coupling and improves maintainability 🟡
- [ ] **Modding System Framework** - Plugin architecture for custom content. Mod API for adding weapons, zombies, companions, and game modes. Mod loader and validation system. Steam Workshop-style integration for sharing mods 🔴
- [ ] **WebGL Dynamic Texture Streaming** - On-the-fly texture compression based on available VRAM for memory optimization 🔴
- [ ] **Bezier Curve Projectile System** - Non-linear bullet trajectories for special weapons with curved paths 🟡
- [ ] **Virtual Scrolling for Large Entity Lists** - Performance optimization for rendering thousands of entities efficiently 🟡
- [ ] **Service Worker Offline Mode** - Play offline with cached assets and local save sync for no-internet gameplay 🟡
- [ ] **Custom Physics Solver** - Replace basic collision with Verlet integration for better stability and accuracy 🔴
- [ ] **Canvas Layer Optimization** - Separate static/dynamic rendering layers to reduce full redraws and boost FPS 🟡
- [ ] **Adaptive Resolution Scaling** - Dynamically adjust canvas resolution based on FPS performance 🟡
- [ ] **BVH (Bounding Volume Hierarchy)** - Advanced collision detection for complex maps with many objects 🔴
- [ ] **Memory Defragmentation System** - Periodic cleanup to prevent browser tab crashes on long sessions 🟡
- [ ] **Incremental Build System** - Only rebuild changed modules during development for faster iteration 🟡

### Memory & Streaming 💾

- [ ] **Sparse Textures** - Only load visible texture tiles to minimize VRAM usage 🔴
- [ ] **Texture Compression (BC7/ASTC)** - 4-8x smaller textures without quality loss 🟡
- [ ] **Geometry Streaming** - Load map chunks dynamically as player moves through world 🟡
- [ ] **Level of Detail (LOD) Chains** - Auto-generate lower detail meshes for distant objects 🟡
- [ ] **Impostor Rendering** - Distant objects rendered as optimized billboards 🟡
- [ ] **Occlusion Queries** - GPU tells CPU what's actually visible on screen 🔴
- [ ] **Frustum Culling on GPU** - Don't submit invisible objects to render pipeline 🟡
- [ ] **Backface Culling** - Skip polygons facing away from camera 🟢
- [ ] **Small Feature Culling** - Skip rendering objects smaller than 1 pixel 🟡

### Performance Wizardry ⚡

- [ ] **Async Compute** - Run physics while rendering using parallel GPU work queues 🔴
- [ ] **Multi-Queue Submission** - Separate Graphics + Compute + Transfer queues for parallelism 🔴
- [ ] **Persistent Mapped Buffers** - Zero-copy CPU->GPU uploads for maximum throughput 🔴
- [ ] **Indirect Drawing** - GPU decides what to draw without CPU roundtrip 🔴
- [ ] **GPU-Driven Rendering** - Entire render pipeline controlled by GPU compute shaders 🔴
- [ ] **Bindless Resources** - Access any texture/buffer without binding overhead 🔴
- [ ] **Shader Compilation Caching** - Pre-compile shaders for instant load times 🟡
- [ ] **Pipeline State Objects (PSO)** - Pre-compiled render states for fast switching 🟡
 - [ ] **Descriptor Indexing** - Dynamic shader resource access without rebinding 🔴
 - [ ] **GPU Memory Pooling** - Custom allocators for efficient buffer management 🔴
 - [ ] **Command Buffer Reuse** - Pre-record and reuse command buffers for static geometry 🟡
 - [ ] **GPU Timestamp Queries** - Precise performance profiling of GPU work 🟡
 - [ ] **Subgroup Operations** - Leverage wave/warp intrinsics for faster compute 🔴
 - [ ] **Shader Specialization Constants** - Compile-time shader variants for optimization 🟡
 - [ ] **Timestamp Calibration** - Filtering timestamp queries over multiple frames to remove noise from OS scheduling 🟡
 - [ ] **Pipeline Caching (Serialization)** - Serializing getBindGroupLayout definitions to speed up startup times 🟡
 - [ ] **Staging Buffer Ring** - Rotating through multiple mapped buffers for CPU->GPU uploads to prevent pipeline stalls 🔴
 - [ ] **Uniform Buffer Compression** - Packing multiple, small dynamic uniform buffers into a single, large buffer to reduce driver overhead 🟡
 - [ ] **Multi-Queue Synchronization (Emulated)** - Using CPU fences and event queues to ensure Compute work and Render work can be overlapped (Async Compute) 🔴
 - [ ] **GPU-Powered Huffman Decoding** - Decompressing complex game asset files (e.g., compressed textures or mesh data) using parallel Huffman or Lempel-Ziv decompression kernels 🔴
 - [ ] **Hardware-Agnostic Debugging** - Creating an extensive set of runtime checks within the WGSL code itself (e.g., buffer bounds, NaN checks) that only compile in debug builds 🟡

### WGSL Low-Level Optimizations 🔬

- [ ] **Atomic Float Add Emulation** - Emulating atomic floating point addition using atomicCompareExchangeWeak loops (critical for software rasterization) 🔴
- [ ] **Subgroup Reductions (subgroupAdd, subgroupMin)** - Using built-in subgroup operations for fast, scratchpad-free sum/min/max across an entire workgroup 🔴
- [ ] **Subgroup Shuffles** - Using subgroupShuffle to exchange data between threads without using Shared Memory (L1 cache speedup) 🔴
- [ ] **Workgroup Memory Barriers Tuning** - Fine-tuning barrier usage to prevent "thundering herd" stalls in compute shaders 🔴
- [ ] **Bit Packing** - Storing boolean flags or small integers in the unused bits of float mantissas to reduce memory usage 🟡
- [ ] **Texture Swizzling (Z-Order Curves)** - Manually implementing Z-order curves (Morton Codes) to optimize texture cache hits in compute shaders 🔴
- [ ] **Indirect Dispatch Chaining** - Having one compute shader generate the dispatch arguments for a subsequent compute shader, creating a fully autonomous GPU pipeline 🔴
- [ ] **WGSL Pre-processor Macros (Manual)** - Using JavaScript to manually inject conditional compilation logic into WGSL strings to generate optimal, branch-free shaders for specific use cases 🟡
- [ ] **Input Attachment Emulation** - Using textureLoad in the fragment shader to read back the G-Buffer from the current render pass, minimizing memory bandwidth (mobile GPU optimization) 🔴
- [ ] **Fast Approximate Math** - Substituting functions like rsqrt() (Reciprocal Square Root) with fast, less precise approximations in non-critical paths for speed 🟡
- [ ] **Branch Divergence Minimization** - Structuring if/else blocks to ensure threads within the same subgroup (wave) follow the same execution path as long as possible 🔴
- [ ] **WGSL Pointer Arithmetic Emulation** - Using integer offsets into Storage Buffers to create complex data structures (linked lists, trees) typically associated with pointer usage 🔴
- [ ] **Shader Specialization Constants (Emulated)** - Using runtime-defined global uniforms to allow the browser's shader compiler (Tint) to aggressively optimize code branches at pipeline creation time 🟡
- [ ] **Manual Shared Memory Management** - Explicitly managing data flow into and out of var<workgroup> memory in compute shaders to control L1 cache usage 🔴

### Mobile & Thermal Performance 📱

- [ ] **Frame Budgeting via Timestamp Queries** - Measuring GPU duration of previous frame and dynamically reducing physics sub-steps or ray tracing bounces if > 12ms to prevent thermal throttling 🟡
- [ ] **F16 (Half-Precision) Optimization** - Using 16-bit floats everywhere possible on mobile GPUs (Adreno/Mali) to consume 50% less bandwidth and register pressure 🔴
- [ ] **WebGPU Compatibility Mode Detection** - Feature detection for compatibility mode limitations (no texture_2d_array in some cases, smaller workgroup limits, limited storage buffer sizes) 🟡
- [ ] **Thermal Throttling Prevention** - Adaptive quality scaling based on GPU temperature estimates to maintain stable frame rates on mobile devices 🔴
- [ ] **Mobile Texture Compression (ASTC/ETC2)** - Automatic feature detection and transcoding for optimal mobile texture formats to reduce VRAM usage 🟡
- [ ] **Interleaved Attribute Buffers** - Structuring vertex buffers as [Pos, Norm, UV, Pos, Norm, UV...] to improve cache locality on mobile GPUs 🟡

### Backend & Multiplayer Infrastructure 🖥️

- [ ] **Authoritative Server Architecture** - Move game logic to server-side to prevent cheating and sync state 🔴
 - [ ] **Client-Side Prediction** - Implement movement smoothing and input prediction to hide network latency (backend implementation) 🔴
- [ ] **Delta Compression** - Only transmit changed state data over the network to minimize bandwidth usage 🔴
- [ ] **Area of Interest (AoI) Management** - Network culling system to only send updates for entities visible to the player 🔴
 - [ ] **WebTransport Support** - Experiment with HTTP/3 WebTransport for lower latency and unreliable data streams (backend) 🔴
- [ ] **Redis State Layer** - Use Redis for fast, ephemeral game state storage (lobbies, player presence) 🔴
- [ ] **Database Sharding** - Prepare database architecture for horizontal scaling of player profiles 🔴
- [ ] **Anti-Cheat Verification** - Server-side validation of movement speed, fire rate, and hit detection 🔴
- [ ] **Headless Simulation** - Run simplified game simulation on server without graphics for collision checks 🔴
- [ ] **Matchmaking Service** - Dedicated service to group players by skill (Elo) and latency 🔴

### Developer Experience & Tooling 🛠️

- [ ] **CI/CD Pipeline** - Automated testing and deployment to production servers on git push 🟡
- [ ] **Crash Reporting Service** - Integrate remote logging to catch and analyze client-side errors in production 🟡
- [ ] **Feature Flags System** - Toggle features on/off remotely without redeploying (A/B testing support) 🟡
- [ ] **Containerization (Docker)** - Dockerize game server and database for consistent dev/prod environments 🟡
- [ ] **Automated Performance Profiling** - Regression testing suite to catch FPS drops in new builds 🔴
- [ ] **Texture Atlasing Pipeline** - Automated build step to combine sprites into atlases to reduce draw calls 🟡
- [ ] **Custom Shader Hot-Reload** - Live editing of shader code without restarting the game engine 🔴
- [ ] **Memory Leak Detection** - Automated tests to analyze heap snapshots for detached DOM nodes 🔴
- [ ] **Audio Mixer Graph** - Visual node-based tool for real-time audio mixing and spatialization effects 🟡
- [ ] **Mock Stress Testing** - Bot system to simulate high player load for server stress testing 🔴

---

## Phase 6.8: User Interface & Accessibility Overhaul 🖥️

### Accessibility & Inclusivity ♿

- [ ] **Colorblind Modes** - Filters for Protanopia, Deuteranopia, and Tritanopia affecting UI and gameplay elements 🟢
- [ ] **Text-to-Speech (TTS)** - Option to read out chat messages and system notifications for visually impaired players 🟡
- [ ] **Speech-to-Text (STT)** - Real-time transcription of voice chat into text messages 🔴
- [ ] **Dyslexia-Friendly Font** - Toggle to switch all game text to a dyslexia-friendly typeface 🟢
- [x] **Screen Shake Intensity** - Slider to reduce or disable camera shake to prevent motion sickness 🟢
- [x] **Blood & Gore Level** - Slider to control the amount of blood/gore effects, from none to high 🟡
- [ ] **UI Scaling** - Slider to scale the entire HUD interface (50% - 150%) for 4K or small screens 🟢
- [ ] **Subtitles & Captions** - Closed captions for all dialogue and significant sound effects (e.g., [Zombie Growl]) 🟢

### Graphics & Audio Settings ⚙️

- [ ] **Field of View (FOV) Slider** - Adjust horizontal FOV (60° to 120°) 🟡
- [x] **FPS Limit & V-Sync** - Options to cap frame rate and enable vertical sync to prevent tearing 🟢
- [ ] **Streamer Mode** - Privacy mode hiding server IPs, player names, and copyrighted music 🟡
- [ ] **Audio Device Selection** - Select specific input/output devices for game audio and voice chat independent of OS defaults 🟡
- [ ] **Advanced Audio Mixer** - Individual volume sliders for Master, SFX, Music, Voice, and UI sounds 🟢
- [ ] **Retro/Modern Rendering Presets** - One-click presets to switch between pixel-art style and high-res smooth rendering 🟢
- [ ] **Gamma & Brightness Calibration** - In-game calibration screen to ensure optimal visibility in dark areas 🟢

### Controls & Gameplay Customization 🎮

- [ ] **Input Remapping System** - Complete interface to rebind Keyboard, Mouse, and Gamepad inputs with conflict detection 🟡
- [ ] **Toggle vs Hold Options** - Accessibility settings to switch Aiming, Crouching, and Sprinting between Hold and Toggle modes 🟢
- [ ] **Gamepad Vibration** - Slider to adjust the intensity of controller rumble effects 🟢
- [x] **Cursor Customization** - Options to change the crosshair style, color, size, and opacity 🟢
- [x] **Auto-Sprint Toggle** - Option to invert default movement behavior (Sprint by default, Walk on hold) 🟢
- [x] **AI Companion Toggle** - Option to enable or disable the AI companion in the gameplay settings 🟢
- [x] **Contextual Tooltips** - "Press [Key] to Interact" prompts that dynamically update based on current keybindings 🟢
- [ ] **Minimap Customization** - Options for Fixed North/Rotating, Zoom level, and Opacity 🟢

### Advanced HUD & Interface 📊

- [ ] **Buff/Debuff Tray** - Visual icons with timers showing active status effects (Bleeding, Boosted, etc.) 🟢
- [x] **Detailed Stats Overlay** - Toggleable graph showing FPS, Ping, Packet Loss, and Memory Usage 🟢
- [ ] **Quick Chat Wheel** - Radial menu for fast tactical communication ("Ammo Here", "Group Up") 🟢
- [ ] **Kill Feed** - Scrolling log of player kills, deaths, and disconnects in multiplayer matches 🟢
- [x] **Damage Number Customization** - Options for Floating, Stacking, or Disabling damage numbers 🟢
- [ ] **Dynamic HUD** - HUD elements fade out when out of combat or at full health for immersion 🟡
- [ ] **3D Item Inspection** - View and rotate 3D models of weapons and items in the inventory/shop menu 🟡
- [x] **Compass Bar** - Top-of-screen compass ribbon showing cardinal directions and waypoints 🟢

---

## Phase 8: The WebGPU Revolution (Next-Gen Engine) ⚡
 
 ### Compute-Driven Physics (The "Everything Moves" Update) 🏗️
 
 - [ ] **GPU Rigid Body Physics** - Move Box2D-style physics entirely to Compute Shaders, supporting 10,000+ colliding bodies (debris, corpses) 🔴
 - [ ] **SPH Fluid Blood System** - Smoothed Particle Hydrodynamics for blood that flows, pools, and drips realistically, interacting with terrain 🔴
 - [ ] **Material Point Method (MPM)** - Advanced physics simulation handling grid-based (Eulerian) and particle-based (Lagrangian) approaches for robust snow, sand, and cloth that interacts seamlessly 🔴
 - [ ] **Pixel-Perfect Destructibility** - GPU-based terrain modification allowing zombies to tear through any wall pixel-by-pixel 🔴
 - [ ] **Soft-Body Zombie Flesh** - Zombies deform when hit; limbs dangle and bounce using mass-spring systems calculated in parallel 🔴
 - [ ] **Verlet Rope/Chain Physics** - GPU-simulated intestines, chains, and wires that react to explosions and collisions 🔴
 - [ ] **Debris Flow Fields** - Thousands of shell casings and rubble pieces interacting with wind vectors and explosion shockwaves 🔴
 - [ ] **Dynamic Liquid Simulation** - Water/Acid pools that ripple, splash, and displace when entities move through them 🔴
 - [ ] **Position-Based Dynamics (PBD)** - Stable cloth, ropes, soft bodies using constraint-based approach 🔴
 - [ ] **XPBD (Extended PBD)** - Even more stable physics, supports stiff materials and complex constraints 🔴
 - [ ] **Constraint Solver on GPU** - Joints, springs, motors all computed in parallel for massive physics worlds 🔴
 - [ ] **Gauss-Seidel Solver** - Iterative constraint solving on GPU using graph coloring to avoid race conditions 🔴
 - [ ] **Jacobi Solver** - Parallel constraint solving (less stable but faster on GPU) for physics simulations 🔴
 - [ ] **Continuous Collision Detection** - No tunneling even at extreme speeds using swept collision tests 🔴
 - [ ] **Convex Hull Collisions** - Complex shapes collide accurately using GPU-computed support functions 🔴
 - [ ] **Fracture & Destruction** - Walls shatter into realistic chunks using Voronoi fracture algorithms 🔴
 - [ ] **Ragdoll Physics** - Every zombie is a multi-body ragdoll with realistic joint limits 🔴
 - [ ] **Vehicle Physics** - Full suspension simulation for drivable vehicles if added to game 🔴
 - [ ] **Cloth Simulation** - Zombie clothes, flags, tarps blow in wind with realistic folding 🔴
 - [ ] **Hair/Fur Simulation** - Zombie hair strands simulated with strand dynamics 🔴
 - [ ] **FLIP Fluid Simulation** - Hybrid particle/grid for realistic liquid behavior 🔴
 - [ ] **Eulerian Fluid Sim** - Grid-based smoke and fire simulation with buoyancy 🔴
 - [ ] **Shallow Water Equations** - Puddles, flooding, water flow using height-field simulation 🔴
 - [ ] **Lava Lamp Physics** - Metaballs for gooey zombie guts and viscous fluids 🟡
 - [ ] **Marching Cubes** - Convert particle fluids to smooth mesh surfaces for rendering 🔴
 - [ ] **Dual Contouring** - Better surface extraction than marching cubes with sharp features 🔴
 - [ ] **Contact Manifold Generation** - Parallel algorithms (e.g., using atomicMin) to efficiently determine collision points and penetration depths for many-body interactions 🔴
 - [ ] **BVH Construction (LBVH)** - Linear Bounding Volume Hierarchies built on GPU for efficient ray tracing and collision detection 🔴
 - [ ] **Sparse Data Structures** - Using Octrees or KD-Trees in Storage Buffers for efficient neighbor search and spatial queries (e.g., in Physics or Ray Tracing) 🔴
 
 ### Next-Gen Rendering (2D Ray Tracing & Lighting) 🔦
 
 - [ ] **2D Ray-Traced Shadows** - Pixel-perfect soft shadows with penumbra, calculated via raymarching SDFs (Signed Distance Fields) 🔴
 - [ ] **Dynamic Global Illumination (GI)** - Light bounces off surfaces, coloring nearby objects (e.g., red emergency light tinting nearby walls) 🔴
 - [ ] **Bindless Texture Arrays** - Access thousands of unique zombie textures/decals in a single shader without context switching overhead 🔴
 - [ ] **Volumetric Fog & God Rays** - Raymarched lighting through fog volumes that react to dynamic lights and shadows 🔴
  - [ ] **Screen-Space Reflections (SSR)** - Puddles, blood, and metallic surfaces reflect the world and dynamic entities (WebGPU pipeline) 🔴
 - [ ] **Normal Mapped 2D Sprites** - Dynamic lighting interaction on 2D sprites using generated normal/depth maps 🟡
 - [ ] **Emissive Material System** - Glowing zombie eyes and toxic sludge actually emit light into the GI solution 🟡
 - [ ] **Order-Independent Transparency (OIT)** - Correctly render overlapping smoke, glass, and fire without sorting artifacts 🔴
 
 #### Lighting & Shadows
 - [ ] **Cascaded Shadow Maps** - Multiple shadow resolutions for near/far objects for optimal quality 🔴
 - [ ] **Contact-Hardening Shadows** - Shadows get softer the farther they are from the caster 🔴
 - [ ] **Ambient Occlusion (SSAO/HBAO+)** - Corners and crevices naturally darken for depth 🔴
 - [ ] **Light Probes & Irradiance Volumes** - Pre-baked GI data for static geometry with fast lookup 🔴
 - [ ] **Voxel Cone Tracing** - Real-time GI using voxelized world representation 🔴
 - [ ] **Signed Distance Field Shadows** - Ultra-sharp shadows with minimal performance cost 🔴
 - [ ] **Capsule Shadows for Characters** - Cheap, convincing character shadows using capsule approximation 🟡
 - [ ] **Light Shafts (Volumetric Lighting)** - God rays streaming through windows and fog 🔴
 - [ ] **Subsurface Scattering** - Zombie flesh glows when backlit for gruesome realism 🔴
 - [ ] **Caustics Rendering** - Light patterns from water/blood reflections on surfaces 🔴
 
 #### Materials & Surfaces
 - [ ] **Physically Based Rendering (PBR)** - Metallic/roughness workflow for realistic material response 🔴
 - [ ] **Parallax Occlusion Mapping** - Fake 3D depth on 2D surfaces with self-shadowing 🟡
 - [ ] **Tri-Planar Mapping** - Seamless textures on any surface angle without distortion 🟡
 - [ ] **Decal System** - Bullet holes, blood splatters as GPU-rendered decals with proper blending 🟡
 - [ ] **Wet Surface Shader** - Rain makes surfaces glossy and reflective dynamically 🟡
 - [ ] **Rust/Damage Progression** - Materials degrade over time with visible wear 🟡
 - [ ] **Iridescent Materials** - Oil slicks, zombie bile with rainbow sheen using thin-film interference 🟡
 - [ ] **Animated Textures** - Pulsing flesh, flickering screens via compute shader animations 🟡
 
 #### Advanced Rendering Techniques
 - [ ] **Deferred Rendering Pipeline** - Handle hundreds of dynamic lights efficiently with G-buffer 🔴
 - [ ] **Deferred Forward Hybrid** - Using Deferred Shading for primary lights and Forward Shading for transparent/complex materials (Tencent Mobile strategy) 🔴
 - [ ] **Forward+ (Tiled Forward)** - Hybrid approach for transparency + many lights 🔴
 - [ ] **Clustered Rendering** - 3D grid of light assignments for massive scenes 🔴
 - [ ] **Cluster Culling (Light)** - Assigning thousands of point lights to 3D frustum clusters in a Compute Shader 🔴
 - [ ] **Tile-Based Light Culling** - Optimizing light loops by assigning lights to 16x16 screen tiles 🔴
 - [ ] **Virtual Shadow Maps** - Infinite shadow resolution where needed using adaptive allocation 🔴
 - [ ] **Mesh Shaders** - Next-gen geometry pipeline when browser support arrives 🔴
 - [ ] **Variable Rate Shading** - Render peripheral vision at lower quality for performance 🔴
 - [ ] **Coarse Pixel Shading** - Using dpdx/dpdy to detect low-frequency regions and skip heavy shading instructions 🔴
 - [ ] **Foveated Rendering** - For VR: ultra-sharp center, blurry edges matching eye fovea 🔴
 - [ ] **Foveated Rendering (Fixed)** - Rendering edges of the screen at lower resolution using multiple viewports or software coarsening 🔴
 - [ ] **Reprojection/ASW** - Fake high framerates by warping previous frames using motion vectors 🔴
 - [ ] **Stochastic Rendering** - Use random sampling for effects like transparency and AO 🔴
 - [ ] **Blue Noise Sampling** - High-quality noise patterns for dithering and sampling 🟡
 - [ ] **Temporal Upsampling** - Render at lower res, upscale with temporal data 🔴
 - [ ] **Checkerboard Rendering** - Render half pixels per frame, reconstruct full image 🔴
 - [ ] **Super-Resolution (FSR 1.0)** - Spatial upscaling shader implementation to render at 720p and display at 1440p 🔴
 - [ ] **FSR 2.0 Implementation** - Temporal upscaling with motion vectors for higher quality than FSR 1.0 🔴
 - [ ] **PBR Next-Gen IBL** - Pre-filtering environment maps (irradiance and radiance) using Compute Shaders (e.g., Cubemap filtering for specular and diffuse components) 🔴
 - [ ] **Split-Sum Approximation** - The industry standard optimization for PBR Image-Based Lighting to handle specular reflection efficiently 🔴
 - [ ] **Micro-Facet Theory** - Shading models like GGX and Beckmann implemented in the fragment shader for realistic roughness 🔴
 - [ ] **Atmospheric Perspective** - Density and color of atmosphere calculated based on distance, integrated directly into the view ray (Huawei rendering strategy) 🟡
 - [ ] **GPU Skinning Compression** - Packing bone matrices into textures and fetching them via UV coordinates to save buffer memory 🔴
 - [ ] **Software Vertex Fetch** - Reading vertex attributes from Storage Buffers using global_invocation_id to bypass traditional vertex buffers (part of the Vertex Pulling approach) 🔴
 - [ ] **Vertex Pulling** - Fetching vertex data manually in the Vertex Shader from a giant storage buffer to bypass Input Assembly overhead 🔴
 
 ### Massive Scale (The "Horde" Update) 🧟‍♂️
 
 - [ ] **GPU Occlusion Culling** - GPU determines visibility per-frame, allowing millions of off-screen objects with zero CPU cost 🔴
 - [ ] **Multi-Draw Indirect** - Render the entire world (map, items, zombies) in a single API call (CPU just says "Draw World") 🔴
 - [ ] **Compute-Based Flocking AI** - Simulate 50,000+ zombies with separation, alignment, and cohesion behaviors entirely on GPU 🔴
 - [ ] **GPU Flow Field Pathfinding** - Calculate pathfinding for the entire map in parallel for thousands of agents instantly 🔴
 - [ ] **Instanced Mesh Particles** - Debris are actual 3D/2D meshes with physics, not just billboards 🟡
 - [ ] **Procedural Map Generation on GPU** - Generate infinite city blocks in milliseconds using compute noise shaders 🔴
 - [ ] **Meshlet Rendering (Culling)** - Emulating "Mesh Shaders" by using a Compute Shader to process clusters of geometry ("meshlets"). The compute shader performs occlusion and frustum culling per-cluster, then writes visible index data to an indirectBuffer 🔴
 - [ ] **Hierarchical Z-Buffer (Hi-Z)** - Creating depth pyramids in compute for efficient occlusion culling 🔴
 - [ ] **Visibility Buffers** - Rendering triangle IDs to a G-Buffer instead of full material data (reduces overdraw) 🔴
 - [ ] **Octahedral Normal Encoding** - Packing 3-float normals into a single u32 to reduce G-Buffer bandwidth by 66% 🔴
 - [ ] **Reverse Z-Buffer** - Mapping Near-Z to 1.0 and Far-Z to 0.0 with floating point depth to drastically improve precision at great distances 🔴
 - [ ] **Logarithmic Depth** - Adjusting gl_Position.z in vertex shaders to support massive scale differences (e.g., Space Sims) 🔴
 - [ ] **Render Bundles** - Reusing recorded render commands for static geometry to reduce CPU overhead per frame 🔴
 
 ### Software Ray Tracing (Compute) 🔦

- [ ] **Software Ray Tracing via BVH Traversal** - Using Compute Shaders to traverse Bounding Volume Hierarchies (BVH) stored in storage buffers since WebGPU doesn't yet have native Ray Tracing extension 🔴
- [ ] **Wavefront Path Tracing** - Rays sorted by material type to minimize divergent branching within workgroups, achieving real-time performance for complex lighting previously impossible in WebGL 🔴
- [ ] **Early Ray Termination** - Terminating ray traversal early when opacity is reached or maximum distance is exceeded (vital for volumetric rendering) 🔴
- [ ] **Adaptive Sampling** - Dynamically adjusting ray sample count based on scene complexity for efficient terabyte-scale volumetric data rendering 🔴

### Visual Polish & Post-Processing ✨
 
 - [ ] **Temporal Anti-Aliasing (TAA)** - Smooth edges and reduce shimmering on moving pixel art using motion vectors 🟡
 - [ ] **Motion Blur (Per-Object)** - Velocity buffer-based blur for fast zombies and projectiles (no full-screen smear) 🟡
 - [ ] **Sub-Pixel Motion Vectors** - Writing velocity buffers with fractional pixel accuracy to improve the stability of TAA and Motion Blur reconstruction 🔴
 - [ ] **GPU-Based View Frustum Jittering** - Dynamically offsetting the view projection matrix every frame to feed the TAA/upscaling system with slightly different samples (prevents crawling artifacts) 🔴
 - [ ] **Depth of Field (Bokeh)** - Cinematic focus effects based on player aim or cutscenes 🟢
 - [ ] **Chromatic Aberration & Lens Distortion** - High-quality, physically based lens artifacts 🟢
 - [ ] **LUT Color Grading** - Professional-grade color correction applied in a single optimized pass 🟢
 - [x] **Bloom & Glare** - Physically based bloom that accumulates light energy naturally 🟢
 - [ ] **High-Frequency Noise Removal (MLAA)** - Using a post-processing pass to detect and remove high-frequency noise patterns (often artifacts of TAA or upscaling) via smart filtering 🟡
 - [ ] **Interlaced Rendering** - Updating even/odd scanlines on alternating frames to halve fragment shading cost 🔴
 - [ ] **Depth Pre-Pass** - Rendering only depth first to exploit Early-Z rejection in the heavy shading pass 🔴
 - [ ] **Conservative Rasterization (Emulated)** - Expanding triangle AABBs in geometry processing to catch sub-pixel fragments (vital for Voxelization) 🔴
 - [ ] **Screen-Space Global Illumination (SSGI)** - Cheap GI approximation using screen-space data 🔴
 - [ ] **Screen-Space Directional Occlusion (SSDO)** - Better than SSAO with directional awareness 🔴
 - [ ] **Horizon-Based Ambient Occlusion (HBAO+)** - High-quality AO with minimal artifacts 🔴
 - [ ] **Bent Normal AO** - Directional occlusion for better lighting interaction 🔴
 - [ ] **Distance Field Ambient Occlusion (DFAO)** - AO computed from SDF data for accuracy 🔴
 - [ ] **Contact Shadows** - Tiny shadows where objects touch surfaces 🟡
 - [ ] **Micro-Shadowing** - Surface roughness affects shadow appearance 🟡
 - [ ] **Reflection Probes** - Localized environment reflections for interiors 🟡
 - [ ] **Planar Reflections** - Perfect mirrors and water reflections 🔴
 - [ ] **Cube Map Reflections** - 360° environment maps for metallic surfaces 🟡
 - [ ] **Parallax-Corrected Reflections** - Accurate indoor reflections accounting for room geometry 🔴
 - [ ] **Refraction** - See-through glass, water distortion with proper light bending 🟡
 - [ ] **Fresnel Effects** - Edges of objects reflect more light realistically 🟡
 - [ ] **Anisotropic Reflections** - Brushed metal, hair highlights with directional streaks 🟡
 - [ ] **Iridescence** - Thin-film interference for oil, soap bubbles 🟡
 
 ### Advanced Systems 🧠
 
- [ ] **GPU Audio Spatialization** - Ray-traced audio occlusion (sound muffles behind walls accurately based on geometry) 🔴
- [ ] **Vision/Light Field Computation** - Calculate stealth visibility for every pixel on the map instantly 🔴
 - [ ] **Cellular Automata Fire Propagation** - Fire spreads pixel-by-pixel based on material flammability and wind (engine-level, WebGPU context) 🔴
- [ ] **Weather Simulation** - Rain/Snow simulated as individual particles with collision and wind interaction 🔴
 - [ ] **Texture Streaming/Virtual Texturing** - Stream gigabytes of high-res assets seamlessly without loading screens 🔴
 - [ ] **Neural Network Inference (WebNN)** - Run AI models for zombie behavior or chat generation directly on GPU 🔴
 - [ ] **HRTF (Head-Related Transfer Function)** - 3D audio positioning that accounts for head shape 🔴
 - [ ] **Reverb Convolution** - Realistic room acoustics using impulse responses 🔴
 - [ ] **Sound Occlusion Raytracing** - Walls muffle sound accurately based on geometry 🔴
 - [ ] **Sound Propagation** - Sound bounces around corners and through openings 🔴
 - [ ] **Doppler Effect** - Pitch shifts for moving sound sources (zombies, bullets) 🟡
 - [ ] **Distance Attenuation** - Volume falls off realistically with distance 🟡
 - [ ] **Material-Based Acoustics** - Metal sounds different than wood when hit 🟡
 - [ ] **Dynamic Music System** - Layers fade in/out based on combat intensity 🟡
 - [ ] **Procedural Footsteps** - Material-aware footstep sounds generated on the fly 🟡
 - [ ] **Weapon Sound Synthesis** - Generate gun sounds procedurally for variety 🟡
 
 ### Particle Systems 2.0 💥
 
 - [ ] **GPU Particle Collisions** - Sparks bounce off walls, blood drips down surfaces 🔴
 - [ ] **Particle-to-Particle Interaction** - Smoke pushes smoke, fire ignites nearby particles 🔴
 - [ ] **Particle Sorting** - Correct transparency rendering for millions of particles 🔴
 - [ ] **Particle Lighting** - Each particle casts and receives light dynamically 🔴
 - [ ] **Particle Shadows** - Dense smoke casts volumetric shadows 🔴
 - [ ] **Particle Trails** - Motion blur/trails baked into particle system 🟡
 - [ ] **Attractors & Force Fields** - Vortexes, gravity wells, wind zones affect particles 🟡
 - [ ] **Particle Spawning from Particles** - Explosions spawn debris that spawn dust 🟡
 
 ### Procedural Generation 🌍
 
 - [ ] **Perlin/Simplex Noise on GPU** - Terrain, clouds, textures generated procedurally 🟡
 - [ ] **Worley Noise** - Cellular patterns for stone, organic textures 🟡
 - [ ] **Wave Function Collapse** - Procedural level generation with constraint rules 🔴
 - [ ] **L-Systems** - Procedural vegetation, veins, crack patterns 🟡
 - [ ] **Voronoi Diagrams** - Shattered glass, territory maps, cell structures 🟡
 - [ ] **Poisson Disk Sampling** - Evenly distributed spawns without clumping 🟡
 - [ ] **Delaunay Triangulation** - Mesh generation from point sets 🔴
 - [ ] **Marching Squares** - 2D terrain from heightmaps with smooth iso-contours 🟡
 - [ ] **Cellular Automata** - Cave generation, erosion, fire spread simulation 🟡
 - [ ] **Procedural Textures** - Never-repeating textures with infinite variety 🔴
 - [ ] **Procedural Animation** - IK systems, procedural walk cycles 🔴
 - [ ] **Procedural Audio** - Synthesize sounds on GPU (experimental feature!) 🔴
 
 ### Advanced Compute Techniques 🧮
 
 - [ ] **Compute Shader Pipelines** - Multi-stage compute pipelines for complex simulations 🔴
 - [ ] **Indirect Argument Generation** - A Compute Shader generating the dispatch arguments for another Compute Shader, creating a fully autonomous GPU workload 🔴
 - [ ] **Wave-Warping** - Using wave_active_all_equal or similar subgroup operations to ensure all threads in a wave sample the same LOD (Level of Detail) or execute the same branching path 🔴
 - [ ] **GPU Sort Algorithms** - Radix sort, bitonic sort for particle/transparency sorting 🔴
 - [ ] **Parallel Reduction** - Sum, min, max operations across millions of elements 🔴
 - [ ] **Prefix Sum (Scan)** - GPU-based scan for stream compaction and allocation 🔴
 - [ ] **Histogram Generation** - Real-time histograms for auto-exposure and color grading 🟡
 - [ ] **GPU Culling Pipeline** - Multi-stage culling: frustum → occlusion → LOD selection 🔴
 - [ ] **Indirect Command Generation** - GPU generates its own draw/dispatch commands 🔴
 - [ ] **GPU-Driven LOD Selection** - Automatic detail level based on screen coverage 🔴
 - [ ] **Dynamic Tessellation Factor** - Calculating the required tessellation factor based on distance and screen space curvature in a Compute Shader (instead of a fixed value) 🔴
 - [ ] **Texture Atlasing on GPU** - Dynamic texture atlas packing and updates 🔴
 - [ ] **Texture Compression Transcoding** - Using WebAssembly workers to transcode .basisu files to BC7/ASTC/ETC2 at runtime 🟡
 - [ ] **Bindless Texturing (Emulated)** - Using massive texture arrays or texture_2d_array to avoid binding switching overhead 🔴
 - [ ] **Max Bindings Hack** - Declare binding(0) var textures : array<texture_2d<f32>, 16>; in WGSL (limit varies by device) to emulate bindless 🔴
 - [ ] **Atlas Management (Compute)** - Using a Compute Shader to "blit" small textures into a massive 8K/16K atlas at runtime, creating a virtual memory system for textures 🔴
 - [ ] **GPU Skinning & Animation** - Vertex skinning and blend shapes on GPU 🟡
 - [ ] **Morph Target Animation** - GPU-based blend shape interpolation 🟡
 - [ ] **Compute-Based Culling** - Frustum, occlusion, and backface culling in compute shaders 🔴
 - [ ] **Exposure Adaptation** - Computing average scene luminance via compute reduction for automatic exposure adjustment 🔴
 - [ ] **Gameplay-Aware Rendering** - Rendering pipeline adapts based on gameplay events (reduce quality during explosions, increase during stealth) 🟡
 - [ ] **Smart LOD System** - GPU-driven LOD selection that considers both distance and gameplay importance (bosses always high detail) 🔴
 - [ ] **Context-Sensitive Post-Processing** - Post-processing effects intensify during key moments (boss fights, near-death) using GPU compute analysis 🟡
 - [ ] **Dynamic Particle Budget Allocation** - GPU-computed system that prioritizes particle effects based on gameplay importance (explosions > ambient) 🔴
 - [ ] **Strategic Visual Indicators** - GPU-computed visual cues for tactical information (zombie grouping, weak points, escape routes) 🟡
 - [ ] **Performance-Adaptive Gameplay** - Gameplay mechanics adapt to maintain performance (fewer particles but same gameplay impact during intense moments) 🔴
 - [ ] **Cross-System Optimization** - Physics, AI, and rendering share GPU resources efficiently, allocating compute based on game state priority 🔴

### WebGPU-Gameplay Integration 🎮

- [ ] **GPU-Powered Stealth Detection** - Zombie detection uses GPU ray-casting for line-of-sight calculations affecting stealth gameplay 🔴
- [ ] **Compute-Driven Weather Effects** - Weather affects gameplay mechanics (rain reduces visibility, fog limits range) calculated by GPU shaders 🟡
- [ ] **Dynamic Lighting as Gameplay** - Light sources affect zombie behavior (flashlights attract, darkness hides) using GPU-computed influence maps 🔴
- [ ] **Physics-Based Environmental Interaction** - Destructible environment affects gameplay (barriers block zombies, debris creates cover) with GPU physics 🔴
- [ ] **GPU-Calculated Damage Visualization** - Damage effects use GPU shaders to show impact zones, critical hits, and armor penetration 🟡
- [ ] **Smart Pickup System** - GPU-computed priority system suggests optimal pickup order based on inventory, health, and combat state 🟡
- [ ] **Tactical Overlay System** - GPU-computed tactical information overlay showing threat levels, escape routes, and optimal positioning 🟡
- [ ] **Performance-Aware Difficulty Scaling** - Difficulty adjusts based on GPU performance to ensure smooth gameplay on all hardware 🟡
- [ ] **GPU-Optimized Wave Generation** - Wave spawning uses GPU compute to optimize zombie distribution and maintain performance targets 🔴
- [ ] **Cross-Phase System Integration** - All major systems (physics, AI, rendering) work together using shared GPU resources for maximum efficiency 🔴

---

## Phase 9: Experimental & Future Tech 🔬
 
 ### Cutting Edge Technologies
 
 - [ ] **Ray Tracing (WebGPU Extension)** - Full ray tracing when browser support arrives for photorealistic lighting 🔴
 - [ ] **Machine Learning on GPU** - AI-driven animations, procedural behaviors using neural networks 🔴
 - [ ] **Generative AI** - Procedural dialogue generation, dynamic quest creation 🔴
 - [ ] **Neural Radiance Fields (NeRF)** - Photorealistic 3D reconstruction from photo sets 🔴
 - [ ] **Gaussian Splatting** - Novel 3D representation technique for ultra-realistic rendering 🔴
 - [ ] **Signed Distance Field Rendering** - Represent entire world as SDFs for infinite detail 🔴
 - [ ] **Voxel Ray Tracing** - Minecraft-style but fully ray traced for realistic lighting 🔴
 - [ ] **Quantum-Inspired Algorithms** - Experimental optimization techniques for pathfinding 🔴
 - [ ] **WebAssembly SIMD** - CPU code 4x faster with SIMD instructions 🟡
 - [ ] **WebCodecs for Video** - Hardware-accelerated in-game video playback 🟡
  - [ ] **WebTransport** - Ultra-low latency networking for competitive multiplayer (future tech) 🔴
 - [ ] **Shared Array Buffers** - True multi-threaded JavaScript for parallel processing 🔴
 - [ ] **Atomics** - Lock-free data structures for high-performance threading 🔴
 - [ ] **WebGPU Subgroups** - Wave/warp-level operations for extreme performance 🔴
 - [ ] **Mesh Shader Pipeline** - Next-gen geometry pipeline replacing vertex shaders 🔴
 - [ ] **Sampler Feedback** - Track which texture mips are actually used for streaming 🔴
 - [ ] **GPU-Accelerated Compression** - Real-time texture/data compression on GPU 🔴
 - [ ] **Hardware Ray Tracing API** - Native RT when WebGPU extensions arrive 🔴
 - [ ] **Variable Rate Shading (VRS)** - Adaptive shading density for performance 🔴
 - [ ] **DirectStorage for Web** - Fast asset streaming bypassing CPU 🔴
 - [ ] **GPU Work Graphs** - Dynamic work generation and scheduling 🔴
 - [ ] **WebGPU vs WebNN Integration** - Hybrid approach using WebGPU for LLMs and WebNN for standard neural network ops to optimize battery life 🔴
 - [ ] **Cooperative Matrix Multiply** - Leveraging specific subgroup operations (subgroupAdd, subgroupShuffle) to perform massive matrix multiplications efficiently for LLM inference 🔴
 - [ ] **LLM Local Inference (WebLLM)** - Running 7B+ parameter LLMs (like Llama-3 or Mistral variants) at readable token speeds (20+ t/s) purely in the browser via WebGPU subgroups 🔴
 - [ ] **KV Cache Management** - Using ring buffers in storage memory to manage LLM context windows efficiently 🔴
 - [ ] **Quantization (Int8/Int4)** - Unpacking compressed weights on the fly in shaders to save VRAM for neural network inference 🔴
 - [ ] **Speculative Decoding** - Running a small "draft" model to guess tokens, verified by the large model (WebLLM) 🔴
 - [ ] **Flash Attention (Emulated)** - Tiled matrix multiplication to reduce memory bandwidth in Transformer attention layers 🔴
 - [ ] **LoRA Switching** - Dynamically applying Low-Rank Adapter offsets to weights for multi-character chat bots 🔴
 - [ ] **3D Gaussian Splatting Optimization** - Hybrid 3DGS model anchored on a mesh for rendering refraction and iridescence in transparent minerals 🔴
 - [ ] **Ocean Volume Rendering** - WebGPU ray-casting for interactive visualization of ocean scalar data (salinity, temperature) with Early Ray Termination and Adaptive Sampling 🔴
 - [ ] **Protein Visualization** - Rendering 41M+ atom structures from LLNL datasets in real-time using WebGPU compute shaders 🔴
 - [ ] **Weight Pruning** - Structurally removing unnecessary connections in neural networks and implementing sparsified kernels for reduced computation (Tsinghua University research) 🔴
 - [ ] **Mobile-Optimized Depthwise Separable Convolutions** - Highly tuned WGSL kernels for efficient 2D image processing tasks (NetEase Mobile strategy) 🔴
 - [ ] **Fused Kernels** - Combining multiple small operations (e.g., ReLU activation and addition) into a single, larger Compute Shader to reduce memory access and latency 🔴
 - [ ] **Asynchronous Pre-fetching** - Using Web Workers to decode and upload the next layer of weights to the GPU while the current layer is being processed 🔴
 - [ ] **Mixed-Precision Inference** - Using f16 for weights and f32 for accumulation to balance speed and accuracy (Standard for LLMs) 🔴
 - [ ] **Vectorized Dot Products** - Hand-written WGSL assembly-like loops using vec4<f32> to maximize register usage and vector ALU throughput for MatMul 🔴
 
 ---
 
 ## Phase 7: Project: Z.E.R.O. (Classified) 🟣

- [ ] **The Transmission** 🟣
- [ ] **Subject 119** 🟣
- [ ] **Bunker Access** 🟣
- [ ] **The Redacted Protocol** 🟣
- [ ] **The "Party" Zombie** - Rare zombie wearing a party hat that drops confetti and cake 🟣
- [ ] **Konami Code Support** - Unlocks a secret "Big Head" mode when entered on the main menu 🟣
- [ ] **Retro CRT Filter** - Optional visual effect adding scanlines and chromatic aberration 🟣
- [ ] **Developer Room** - A hidden area on the map containing credits and insider jokes 🟣
- [ ] **Cow Level** - There is no cow level... or is there? 🟣
- [ ] **Mimic Chests** - Loot containers that grow teeth and attack when opened 🟣
- [ ] **Mental Sanity System** - Hallucinations and visual distortions when player stress is too high 🟣
- [ ] **The Glitch** - A rare visual anomaly that reveals the simulation... or is it? 🟣
- [ ] **Midnight Call** - A phone booth that rings at exactly 00:00 system time 🟣
- [ ] **Ghostly Apparitions** - Faint figures seen in the periphery that vanish when looked at directly 🟣
- [ ] **Ancient Runes** - Decipherable markings hidden on map textures that tell a backstory 🟣
- [ ] **The Pizza Delivery** - A zombie delivering a pizza box that heals you fully 🟣
- [ ] **Tiny Mode** - A power-up that shrinks the player and zombies to 10% size 🟣
- [ ] **Disco Fever** - Zombies dance when a specific song plays 🟣
- [ ] **The Rubber Duck** - A useless item that squeaks when squeezed 🟣
- [ ] **Zero Gravity Zone** - A specific room where gravity is turned off 🟣
- [ ] **The Narrator** - A voice that comments on your failures in a British accent 🟣
- [ ] **ASCII Mode** - Renders the game in ASCII characters 🟣
- [ ] **Friendly Zombie "Bob"** - A zombie named "Bob" who just waves and walks away 🟣
- [ ] **Developers' Graveyard** - Tombstones with dev names 🟣
- [ ] **Infinite Stairs** - A staircase that never ends if you walk backwards 🟣
- [ ] **The Red Button** - A big red button that does... absolutely nothing (or explodes) 🟣
- [ ] **Mirror World** - A pickup that flips the screen horizontally 🟣
- [ ] **Pixel Art Gun** - A weapon that shoots 8-bit sprites 🟣
- [ ] **The Cursed Toaster** - Spawns burnt toast enemies 🟣
- [ ] **Rainbow Blood** - Blood splatter is rainbow colored 🟣
- [ ] **Fish Slap** - Melee weapon that is a large trout 🟣
- [ ] **Invisible Bike** - Player rides an invisible bike (animation only) 🟣
- [ ] **Talking Gun** - Gun complains when you miss 🟣
- [ ] **Fake Crash** - Game simulates a BSOD then resumes 🟣
- [ ] **Potato Mode** - Low poly graphics setting that makes everything look like potatoes 🟣
- [ ] **The Cake is a Lie** - Hidden cake model with Portal reference that heals but is always one step away 🟣
- [ ] **Zombie Shakespeare** - Rare zombie reciting Hamlet soliloquy in proper Shakespearean English 🟣
- [ ] **Secret Developer Console** - Cheat codes enabled via hidden input sequence (up, up, down, down, left, right) 🟣
- [ ] **Upside Down World** - Everything flips 180 degrees when you type "Australia" in chat 🟣
- [ ] **Zombie Conga Line** - Chain of zombies following each other in a dance line with music 🟣
- [ ] **The Matrix Moment** - Bullet time activates when specific conditions are met (kill 10 in 3 seconds) 🟣
- [ ] **1% Chance Banana Peel** - Zombies slip on random banana peels with cartoonish sound effects 🟣

---

Last Updated: 2025-11-20
