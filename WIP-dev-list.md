# 🧠 ZOMBOBS DEV BRAIN - WIP LIST

> **SYSTEM INSTRUCTION:**
> When working on this project, ALWAYS check this file first.
> This is the active scratchpad for:
> 1.  **Current Focus**: What are we building RIGHT NOW?
> 2.  **Future Plans**: Ideas that are cooking but not ready.
> 3.  **Dev Thoughts**: Random notes, optimization ideas, or "fix this later" reminders.
>
> **Workflow:**
> - Move items from `Future Plans` to `Current Focus` when starting.
> - Mark items as `[x]` when done.
> - **Ordering**: Insert new versions/updates at the TOP of the list, immediately following this instruction block (Stack order).
> - Once a version is complete, move it to `CHANGELOG.md` and clear it from here (or archive it).
---

## 🚀 CURRENT FOCUS: v0.8.2.2 (Bug Fixes)

**Goal:** Fix visual bugs related to WebGPU particle rendering on menus.

- [x] **v0.8.2.2: Menu Rendering Fixes** - ✅ COMPLETE
    - [x] **Snow**: Restrict snow rendering to Arcade Gameplay only.
    - [x] **ZombobsFX**: Disable spore clouds on main menu.
    - [x] **Renderer**: Improve state management in WebGPU renderer.

## 🚀 CURRENT FOCUS: v0.8.1 (Small Polish Update)

**Goal:** Fix and polish pass following the v0.8.0 release. Addressing immediate feedback.

- [x] **v0.8.1.2: The Living World** (Environment & Visuals) - ✅ COMPLETE
    - [x] **Core**: Procedural Prop Spawning (Rocks, Debris, Burnt Cars) to break up the void.
    - [x] **Visuals**: "Moving Ground" Shader (Subtle texture animation or parallax for depth).
    - [x] **Tech**: Simple chunk system to manage spawned props.
    - [x] **Camera System**: World-space camera that follows player, keeping them centered.
    - [x] **Coordinate Space**: Full world-space coordinate system with screen-space UI rendering.
    - [x] **Fixes**: Lighting, damage indicators, shooting, zombie following, spawn systems all working in moving world.

- [ ] **Audio Balance Tweak**:
    - Shotgun sound is slightly too loud compared to BGM. Lower by 10%.
    - Fix rare audio popping when too many zombies die at once (limit max concurrent death sounds?).
- [ ] **Visual Fixes**:
    - "Ammo" text on HUD overlaps with weapon icon on 4:3 resolutions.
    - Add subtle shadow to the crosshair for better visibility on bright backgrounds.
- [ ] **Gameplay Tweak**:
    - Increase "Speed Boost" pickup duration from 10s to 12s (feels a bit too short).
- [ ] **Buff/Debuff Tray** (Roadmap): Visual icons with timers for active status effects.
- [ ] **Impact Decals** (Roadmap): Persistent bullet holes and scorch marks on surfaces.
- [ ] **Distant Ambience** (Roadmap): Background soundscape (distant sirens, wind) for immersion.
- [ ] **Weapon Inspection** (Roadmap): Press 'H' to admire weapon and check ammo.
- [ ] **Fireflies** (Roadmap): Ambient bioluminescence near trees at night.

---

## 🔮 FUTURE PLANS (Backlog)

- **v0.8.1.2: The Living World** (Environment & Visuals) - ✅ COMPLETE
    - **Core**: Procedural Prop Spawning (Rocks, Debris, Burnt Cars) to break up the void.
    - **Visuals**: "Moving Ground" Shader (Subtle texture animation or parallax for depth).
    - **Tech**: Simple chunk system to manage spawned props.

- **v0.8.2: The Scavenger Update** (Economy & Pickups)
    - **Mechanic**: "Scrap" currency drops from zombies (100% chance from Bosses, low chance from others).
    - **Feature**: Magnetic Pickup System (Scrap flies to player when close).
    - **UI**: Simple Scrap Counter in HUD.
    - **v0.8.2.1**: *Scavenger Polish*
        - **Visuals**: Add a "glint" particle effect to Scrap so it's visible at night.
        - **Balance**: Tweak magnetic radius and lerp speed (prevent scrap from orbiting player).

- **v0.8.3: Foundations Update** (Core Building)
    - **System**: "Build Mode" (Toggle 'B'). Grid-based placement preview.
    - **Items**: Sandbags (Cheap, Low HP) and Wood Walls (Medium HP).
    - **Interaction**: "Repair" mechanic (Hold 'E' + Scrap cost).
    - **v0.8.3.1**: *Foundations Polish*
        - **Audio**: Add satisfying "hammering" SFX for building and repairing.
        - **QoL**: Add "Recycle" option (refund 50% scrap) to fix misplaced walls.
    - **v0.8.3.2**: *Architectural Expansion*
        - **Content**: "Reinforced Gate" (Open/Close interaction).
        - **UX**: "Ghost" preview turns red if placement is invalid.

- **v0.8.4: The Siege Update** (Threats & Balance)
    - **Enemy**: "Sapper" Zombie (Explodes on contact with structures).
    - **Balance**: Wave scaling for "Siege Waves" (higher Sapper count).
    - **Tech**: Object Pooling for wall segments (performance).
    - **v0.8.4.1**: *Siege Polish*
        - **Visuals**: Implement "damage states" for walls (cracks appear at 50% and 25% HP).
        - **Feedback**: Distinct audio cue (ticking?) when Sappers are nearby.
    - **v0.8.4.2**: *Breach & Clear*
        - **Mechanic**: "Repair Kit" drop (rare) that instantly heals nearby walls.
        - **AI**: Zombies prioritize "weak" (damaged) wall segments.

- **v0.8.5**: UI Overhaul (The big HTML overlay update).
    - **v0.8.5.1**: *UI Polish*
        - **Feel**: Add subtle hover/click SFX to all new HTML buttons.
        - **Perf**: Optimize CSS backdrop-blur for low-end devices.

- **v0.8.0**: The Fortification Update (Full Release).
    - **Core**: Turrets, Traps, and Save Persistence.
    - **v0.8.0.1**: *Fortification Polish*
        - **System**: "Save/Load" stability check (ensure bases persist correctly).
        - **Visuals**: Construction dust particles when placing structures.
    - **v0.8.0.2**: *The Architect's Touch*
        - **UX**: "Smart Snapping" for walls (corners auto-connect).
        - **UI**: "Base Management" tab in menu (overview of structure health).

- **v0.8.6: Automated Defense** (Turrets & Firepower)
    - **New Item**: "Sentry Turret" (Basic projectile, requires Scrap to reload).
    - **Mechanic**: Turret Targeting Logic (Closest vs Strongest).
    - **v0.8.6.1**: *Turret Tuning*
        - **Balance**: Turret turn speed vs Fast Zombies.
        - **Audio**: Servo motor sounds and distinct firing SFX.
    - **v0.8.6.2**: *Heavy Artillery*
        - **New Item**: "Rocket Turret" (Splash damage, slow fire rate).
        - **Visuals**: Recoil animation for turrets.

- **v0.8.7: Hazard Zone** (Traps & Area Denial)
    - **New Item**: "Spike Strip" (Slows enemies + minor DoT).
    - **New Item**: "Landmine" (High damage, one-time use).
    - **v0.8.7.1**: *Trap Feedback*
        - **Audio**: Satisfying "Snap" sound for spikes.
        - **Visuals**: Blood splatter on spikes when zombies walk over them.
    - **v0.8.7.2**: *Elemental Warfare*
        - **New Item**: "Cryo-Pad" (Freezes zombies solid for 2s).
        - **New Item**: "Flame Pit" (Ignites zombies passing through).

- **v0.8.8: Power & Logic** (Advanced Infrastructure)
    - **Core**: "Generator" (Consumes fuel/scrap to power advanced defenses).
    - **System**: Wire connections (Visualizing power flow).
    - **v0.8.8.1**: *Visual Voltage*
        - **Visuals**: Electric sparks when generators are damaged.
        - **UI**: Power load indicator (Green/Yellow/Red).
    - **v0.8.8.2**: *The Tesla Coil*
        - **New Item**: "Tesla Tower" (Chain lightning, high power cost).
        - **Effect**: Stuns enemies briefly.

- **v0.8.9: The Colony** (Survivors & Management)
    - **Feature**: "Rescue Missions" (Find survivors in world, escort to base).
    - **Benefit**: Survivors provide passive bonuses (Repair speed, Scrap gain).
    - **v0.8.9.1**: *Survivor Personality*
        - **Content**: Random names and bark lines ("Reloading!", "They're everywhere!").
        - **Visuals**: Unique hats/shirts for survivors.
    - **v0.8.9.2**: *Role Assignment*
        - **System**: Assign survivor to "Repair Duty" or "Turret Duty".
        - **AI**: Survivors flee to "Safe Zone" when walls are breached.
- **Idea**: "Golden Zombie" rare spawn that drops 5x XP?
- **Tech Debt**: Refactor `main.js` event listeners into a dedicated `InputManager` class.

- **v0.9.0: The Silent & Deadly Update** (Stealth & Tactics)
    - **Mechanic**: Noise Meter. Gunshots, explosions, and sprinting increase noise, attracting more/faster zombies.
    - **Mechanic**: Stealth Kills. Melee attacking an unaware zombie from behind is a one-hit kill.
    - **New Item**: Suppressor Attachment. Reduces weapon noise at the cost of a slight damage reduction.
    - **v0.9.0.1**: *Shadows & Light*
        - **AI**: Zombies now have a cone of vision. Staying out of it keeps you hidden.
        - **Visuals**: Add a "hidden" indicator when the player is not detected.
    - **v0.9.0.2**: *Tools of the Trade*
        - **New Item**: "Decoy Grenade". Creates a loud noise to distract zombies.
        - **New Item**: "Smoke Bomb". Temporarily breaks line of sight.

- **v0.9.1: The 'Never Alone' Update** (AI Companions)
    - **Feature**: First AI Companion, "Rex" the dog. Barks when enemies are near, can "pin" a zombie.
    - **System**: Basic companion command system (Follow, Stay).
    - **UI**: Companion health/status icon.
    - **v0.9.1.1**: *Good Boy Polish*
        - **Audio**: Add more barks, whimpers, and happy sounds for Rex.
        - **Animation**: Improve Rex's run and attack animations.
    - **v0.9.1.2**: *Human Companions*
        - **Feature**: Introduce first human AI companion with a basic pistol.
        - **System**: Companion can be "downed" and needs to be revived.

- **v0.9.2: The 'Wasteland Weather' Update** (Dynamic Environment)
    - **System**: Dynamic Weather. Acid rain (damages player/zombies in the open), thick fog (reduces visibility for all), and high winds (affects projectile paths).
    - **Visuals**: Raindrop and fog particle effects.
    - **v0.9.2.1**: *Environmental Storytelling*
        - **Content**: Add lore-based graffiti and notes to discover in the world.
        - **Audio**: Add ambient sounds for each weather type (rain, wind).
    - **v0.9.2.2**: *Interactive World*
        - **Feature**: Explosive Barrels. Can be detonated to clear groups.
        - **Feature**: Destructible Cover. Low walls or fences that can be destroyed.

- **v0.9.3: 'Evolve or Die' Update** (Player Progression)
    - **System**: Basic Skill Tree. Spend "Skill Points" (earned every 5 levels) to unlock passive buffs.
    - **Skills**: First set of skills (e.g., +5% Health, +10% Reload Speed, +5% Movement Speed).
    - **UI**: New "Skills" tab in the main menu.
    - **v0.9.3.1**: *Skill Specialization*
        - **Skills**: Introduce branching paths (e.g., specialize in "Medic", "Brawler", or "Sharpshooter").
        - **UI**: Add confirmation/respec option for skill points.
    - **v0.9.3.2**: *Perks*
        - **System**: Unlock a "Perk" slot every 10 levels. Equip powerful, game-altering perks.
        - **Perks**: First set of perks (e.g., "Glass Cannon", "Second Wind", "Ammo Scavenger").

- **v0.9.4: 'Make It Your Own' Update** (Customization)
    - **Feature**: Player Character Skins. Choose from a few different colored outfits.
    - **Feature**: Weapon Skins. Apply simple color patterns to weapons.
    - **UI**: New "Appearance" tab in the main menu.
    - **v0.9.4.1**: *Express Yourself*
        - **Feature**: Add a simple emote system (Wave, Thumbs Up).
        - **Visuals**: Add cosmetic hat options for the player.
    - **v0.9.4.2**: *Gunsmith*
        - **Feature**: Weapon Attachments. Find/buy scopes, extended mags, laser sights.
        - **UI**: "Gunsmith" screen to modify weapon attachments.

- **v0.9.5: 'The Unrelenting Horde' Update** (Performance & Scale)
    - **Tech**: Major performance pass using object pooling for all major entities (zombies, bullets, particles).
    - **Gameplay**: Increase base zombie spawn counts significantly.
    - **New Game Mode**: "Horde Mode". An endless wave mode with a separate leaderboard.
    - **v0.9.5.1**: *Visual Fidelity*
        - **Tech**: Implement LOD system for zombies to allow for massive on-screen counts.
        - **Visuals**: Add more varied zombie death animations.
    - **v0.9.5.2**: *Horde Breakers*
        - **New Enemy**: "Mutator" zombie that buffs nearby zombies on death.
        - **New Weapon**: "Grenade Launcher". Crowd control focus.

- **v0.9.6: The 'Story Begins' Update** (Narrative)
    - **Feature**: Intro and Outro cutscenes (simple animated text/images).
    - **Feature**: First "Mission". A series of objectives given to the player (e.g., "Find the water purifier").
    - **Lore**: Findable audio logs that reveal parts of the story.
    - **v0.9.6.1**: *Character Voices*
        - **Audio**: Add simple voice lines for the player character (e.g., "Reloading!", "Need ammo!").
        - **UI**: Subtitles for all dialogue and audio logs.
    - **v0.9.6.2**: *The First Chapter*
        - **Mission**: Add a second, more complex mission with a mini-boss fight.
        - **Content**: Expand the main map to include a new "downtown" area.

- **v0.9.7: 'Weird Science' Update** (Exotic Weapons)
    - **New Weapon**: "Shrink Ray". Temporarily shrinks zombies, making them fast but weak.
    - **New Weapon**: "Gravity Gun". Can pick up and throw small props (and zombies!).
    - **v0.9.7.1**: *Unstable Prototypes*
        - **Mechanic**: Exotic weapons have a chance to "misfire" with funny effects.
        - **Visuals**: Add unique particle effects for each exotic weapon.
    - **v0.9.7.2**: *The Next Generation*
        - **New Weapon**: "Tesla Rifle". Chains lightning between close-together enemies.
        - **New Trap**: "Time Warp Field". A deployable that drastically slows everything in a radius.

- **v0.9.8: 'Chaos Theory' Update** (Game Mutators)
    - **Feature**: "Mutators". Before a run, enable special rules like "Big Head Mode", "Low Gravity", "Pistols Only".
    - **UI**: Mutator selection screen before starting a game.
    - **v0.9.8.1**: *Community Chaos*
        - **Mutators**: Add community-suggested mutators.
        - **UI**: Allow for random mutator selection.
    - **v0.9.8.2**: *Daily Runs*
        - **Feature**: A "Daily Run" with a fixed seed and set of mutators for all players to compete on.
        - **Leaderboard**: Separate leaderboard for daily runs.

- **v0.9.9: 'The Listening Post' Update** (Community & QoL)
    - **Feature**: In-game feedback form.
    - **QoL**: Major pass on community-requested features (e.g., detailed stats screen, better key-binding options).
    - **v0.9.9.1**: *Bug Squashing*
        - **Focus**: Dedicated bug-fixing sprint based on community reports.
        - **Polish**: General polish pass on UI and gameplay feel.

- **v0.10.0: Project Chimera** (Multiplayer Foundations)
    - **Tech**: Refactor core systems for network play (player state, entity management).
    - **Feature**: 2-Player local co-op (split-screen or shared screen).
    - **Mechanic**: Player revival system.
    - **v0.10.0.1**: *Better Together*
        - **UI**: Co-op specific HUD elements.
        - **Balance**: Adjust zombie health/count for two players.
    - **v0.10.0.2**: *Online Test*
        - **Tech**: First experimental online lobby system (no gameplay sync yet).
        - **Feature**: Basic in-game text chat.



---

## 💭 DEV THOUGHTS

- *The particle system is getting heavy. Might need to look into object pooling for particles if we add more explosions.*
- *Players are asking for a "Pause" button on mobile. Need to figure out touch controls eventually.*
- *For v0.8.0, we need to make sure "Scrap" doesn't clutter the screen. Maybe auto-collect or magnetic pickup?*
