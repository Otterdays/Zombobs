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

## 🚀 CURRENT FOCUS: v0.8.1 (Small Polish Update)

**Goal:** Fix and polish pass following the v0.8.0 release. Addressing immediate feedback.

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

- **v0.8.1.2: The Living World** (Environment & Visuals)
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

---

## 💭 DEV THOUGHTS

- *The particle system is getting heavy. Might need to look into object pooling for particles if we add more explosions.*
- *Players are asking for a "Pause" button on mobile. Need to figure out touch controls eventually.*
- *For v0.8.0, we need to make sure "Scrap" doesn't clutter the screen. Maybe auto-collect or magnetic pickup?*
