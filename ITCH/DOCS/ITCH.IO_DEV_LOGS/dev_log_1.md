# Dev Log #1: The Horde Grows Stronger

*In the darkness between code and chaos, something stirs. The undead don't just spawn—they evolve. And so does the world they inhabit.*

---

## The Journey So Far

Hey everyone! 👋

It's been a wild ride since I first started building ZOMBOBS. What began as a simple "let's see if I can make a zombie game in vanilla JavaScript" has turned into something... well, let's just say it's gotten a bit out of hand (in the best way possible).

We're now at **V0.8.1.9 ALPHA**, and I wanted to take a moment to share what's been happening behind the scenes. This isn't just a changelog—it's a glimpse into the madness that is solo game development.

---

## What's New: The Blood, The Fire, The Spores

### 💀 The World Comes Alive

One of the biggest changes recently has been transforming ZOMBOBS from a simple arena shooter into something that feels like a *living world*. I'm not talking about NPCs with deep backstories (though that would be cool). I'm talking about the atmosphere.

**The Living World System** introduced a proper camera that follows you through an infinite world. No more being trapped in a box—now you're exploring a wasteland that stretches on forever. The ground texture scrolls beneath you, props spawn procedurally as you explore, and everything feels... *bigger*.

But here's the thing: I didn't just want a bigger map. I wanted a world that *felt* post-apocalyptic. So I added:

- **Burnt cars** with flickering fire particles that dance in the windows
- **Skulls** scattered across the landscape with eerie green glows
- **Zombie remains** (arms, legs) that tell a story of what happened here
- **Smoke** that rises from wreckage and drifts on the wind

It's the little details that make the difference. When you see a car on fire in the distance, or a skull glowing in the darkness, it's not just decoration—it's atmosphere.

### 🔥 Fire and Brimstone (Literally)

Speaking of fire, I spent way too much time getting those car fires just right. The particles flicker using sine waves, they spawn from windows and engine bays, and they use additive blending to create that satisfying glow effect. 

Is it necessary? Probably not. Does it look cool? Absolutely.

The same attention went into the **enhanced skull props**. Each one now has:
- 6 teeth along the jawline
- 5 crack lines of varying thickness
- Bone texture with fixed detail marks (no flickering!)
- Enhanced eye sockets with depth gradients
- An outer glow with green/yellow tint

Again, probably overkill. But when you're running through the wasteland and see a skull glowing in the darkness, you'll understand why I did it.

### 🌌 The Spore Cloud: 100,000 Particles of Pure Madness

This one is my favorite recent addition: **ZombobsFX Spore Cloud**.

100,000 particles. GPU-accelerated. Mouse-reactive. 

The particles repel from your cursor, creating this living, breathing cloud of toxic green and zombie purple. It's rendered using WebGPU compute shaders, which means it runs at 60fps even with all those particles. The color gradient shifts from purple to green based on particle life, and when they overlap, the additive blending creates this radioactive core effect.

It's toggleable in the settings, because not everyone wants their screen filled with 100k particles. But if you do? Oh boy, it's a sight to behold.

### 💪 The Horde Gets Tougher

I've been tweaking the difficulty balance based on feedback. The latest change: **all zombie health increased by 25%**.

This might sound like a nerf to the player, but hear me out. The combat was getting a bit too easy once you learned the patterns. Now zombies are more durable, which means:
- You have to be more strategic with your shots
- Weapon choice matters more
- Boss fights are actually *boss fights* (minimum 1000 HP at wave 5+)

The game should challenge you, not just let you steamroll through waves. This change makes every encounter feel more meaningful.

### 🎨 Visual Polish: The Devil's in the Details

I've been going through and fixing all the little visual bugs that were driving me crazy:

- **Off-screen zombie indicators** now properly change color based on distance (red = close, green = far)
- **Explosion particles** were invisible for a while—fixed that critical bug
- **WebGPU explosions** now support up to 2000 particles with 8x radius multipliers
- **Particle parallax** makes everything feel more world-space-y

It's the kind of stuff that doesn't make it into feature lists, but makes the game *feel* better to play.

### 🗄️ The Backend Gets Smarter

Behind the scenes, I've been working on the multiplayer infrastructure:

- **MongoDB integration** for persistent highscore storage (no more losing scores on server restart!)
- **Cookie persistence** fixes so your user ID actually sticks around
- **Itch.io compatibility** fixes (removed those pesky `./` prefixes that caused 403 errors)
- **Console error suppression** for cleaner browser dev tools

The server now gracefully falls back to in-memory storage if MongoDB isn't available, which means the game keeps working even if the database is down. That's the kind of resilience I want in a production system.

---

## The Philosophy: Why Vanilla JavaScript?

I get asked this a lot: "Why not use Unity/Phaser/Three.js/insert-engine-here?"

The honest answer? I'm a "vibe coder." I like to understand every line of code. I like knowing exactly what's happening under the hood. And I like the challenge of building something from scratch.

But more than that, I wanted to prove that you don't need a massive engine to make something fun. ZOMBOBS is:
- **Zero runtime dependencies** (client-side)
- **Pure ES6 modules** (no bundler required)
- **Hand-optimized** rendering pipeline
- **Custom everything** (particle system, audio system, input system, collision detection)

Is it harder? Yes. Is it more work? Absolutely. But when you see those 100k particles running at 60fps, or the blood simulation spreading across the ground, or the WebGPU shaders creating that atmospheric void effect... it's worth it.

---

## What's Next?

I'm not done yet. Here's what's on the horizon:

- **More zombie variants** (I've got ideas for crawlers, jumpers, swarmers...)
- **Base building system** (walls, gates, auto-turrets)
- **More maps** (urban, forest, military base)
- **Daily/weekly challenges** for the battlepass system
- **Full online multiplayer** (the lobby system is ready, just need to finish the sync)

But honestly? I'm also just going to keep polishing. Adding more atmospheric props. Tweaking the difficulty. Making the explosions bigger. Making the blood more visceral.

Because that's the fun part.

---

## Final Thoughts

ZOMBOBS is still in **super early production** (V0.8.1.9 ALPHA). There are bugs. There are missing features. There are things I want to change.

But it's playable. It's fun. And it's getting better every update.

If you've played it, thank you. If you've given feedback, double thank you. If you've found bugs... well, I'm working on it! 😅

The horde is growing. The world is expanding. And I'm just getting started.

*Survive. Adapt. Dominate.*

---

**Play it here:** [itch.io/zombobs](https://otterdays.itch.io/zombobs)  
**Version:** V0.8.1.9 ALPHA  
**Engine:** ZOMBS-XFX-NGIN (Vanilla JS + HTML5 Canvas + WebGPU)

*Made with 🩸, 💦, and way too much ☕*

