// Game constants
export const RENDER_SCALE = 0.75;

// Math constants (cached for performance)
export const TWO_PI = Math.PI * 2;

// Player stats
export const PLAYER_MAX_HEALTH = 100;
export const PLAYER_BASE_SPEED = 4;
export const PLAYER_SPRINT_SPEED = 7;
export const PLAYER_STAMINA_MAX = 100;
export const PLAYER_STAMINA_DRAIN = 1.0; // Stamina cost per frame while sprinting
export const PLAYER_STAMINA_REGEN = 0.5; // Stamina recovery per frame
export const PLAYER_STAMINA_REGEN_DELAY = 1000; // ms to wait before regenerating

// Health pickup settings
export const HEALTH_PICKUP_HEAL_AMOUNT = 25;
export const HEALTH_PICKUP_SPAWN_INTERVAL = 15000; // ms between spawns
export const MAX_HEALTH_PICKUPS = 3;

// Ammo pickup settings
export const AMMO_PICKUP_AMOUNT = 15; // Ammo restored per pickup
export const AMMO_PICKUP_SPAWN_INTERVAL = 20000; // ms between spawns
export const MAX_AMMO_PICKUPS = 2;

// Low ammo threshold (25% of max ammo)
export const LOW_AMMO_FRACTION = 0.25;

// Melee attack constants
export const MELEE_COOLDOWN = 500; // ms between melee attacks
export const MELEE_RANGE = 70; // pixels
export const MELEE_DAMAGE = 3; // damage per hit
export const MELEE_SWIPE_DURATION = 200; // ms for swipe animation

// Wave settings
export const WAVE_BREAK_DURATION = 3000; // 3 seconds between waves

// Grenade system
export const MAX_GRENADES = 3; // Maximum grenades player can carry
export const GRENADE_COOLDOWN = 2000; // 2 seconds between throws
export const GRENADE_EXPLOSION_RADIUS = 80; // AOE damage radius
export const GRENADE_DAMAGE = 50; // High damage for AOE
export const GRENADE_FUSE_TIME = 1500; // 1.5 seconds before explosion

// Particle limit
export const MAX_PARTICLES = 500;

// Ground texture animation (v0.8.1.2: The Living World)
export const GROUND_TEXTURE_SCROLL_SPEED = 0.3; // Parallax factor (0.0-1.0, how much ground moves relative to player)

// Prop spawning system (v0.8.1.2: The Living World)
export const CHUNK_SIZE = 500; // Chunk dimensions in pixels
export const PROP_SPAWN_DENSITY = 0.3; // Props per chunk (0-1 scale)
export const PROP_MIN_DISTANCE = 100; // Minimum distance between props in pixels
export const PROP_SPAWN_MARGIN = 50; // Margin from canvas edges for spawning in pixels

// Rendering constants
export const RENDERING = {
    // Alpha values
    GROUND_PATTERN_ALPHA: 0.6,
    VIGNETTE_ALPHA: 0.6,
    DAMAGE_INDICATOR_ALPHA: 0.3,
    SHADOW_ALPHA: 0.4,

    // Timing constants (ms)
    ZOMBIE_PULSE_PERIOD: 250,
    ZOMBIE_EYE_PULSE_PERIOD: 167,
    FAST_ZOMBIE_PULSE_PERIOD: 150,
    EXPLODING_ZOMBIE_PULSE_PERIOD: 150,
    GHOST_ZOMBIE_PULSE_PERIOD: 300,
    BURN_TICK_INTERVAL: 200,

    // Viewport culling margin (pixels beyond viewport to still render)
    CULL_MARGIN: 100,

    // Update culling margin (larger than render margin - entities further away still update for AI/pathfinding)
    UPDATE_MARGIN: 300,

    // Small feature culling - skip rendering entities smaller than this (screen pixels)
    MIN_VISIBLE_SIZE: 1.0,

    // Gradient cache invalidation thresholds
    CANVAS_SIZE_CHANGE_THRESHOLD: 10, // pixels
    PLAYER_POSITION_CHANGE_THRESHOLD: 50, // pixels
};

// Crosshair configuration
export const CROSSHAIR_SIZE = 12;
export const CROSSHAIR_LINE_WIDTH = 2;
export const CROSSHAIR_COLOR = '#ffffff';
export const CROSSHAIR_OUTLINE_COLOR = '#000000';

// Zombie base scores (for score multiplier system)
export const ZOMBIE_BASE_SCORES = {
    normal: 10,
    fast: 15,
    armored: 25,
    exploding: 20,
    ghost: 18,
    spitter: 22,
    boss: 100
};

// Multiplayer settings
export const MAX_LOCAL_PLAYERS = 4;
export const SERVER_URL = "https://ottertondays-zombs.hf.space";

// News ticker updates for main menu
export const NEWS_UPDATES = "NEW: V0.8.3.3 ALPHA: UI Interaction Audio 🔊 | Improved HUD Visuals 🎨 | V0.8.3.2 ALPHA: Laser Gun Weapon ⚡ | Menu Click Sounds 🎵 | V0.8.3.1 ALPHA: Arcade Music System 🎵 | Normal Zombie Variants with Animated Arms 👕 | Doubled Spawn Rate 💀 | V0.8.3.0 ALPHA: Campaign Mode Intro 🎬 | Flashlight System 🔦 | Audio Mixer 🎚️ | Improved Impact SFX 💥 | V0.8.2.1 ALPHA: WebGPU Screen Shake Sync 🫨 | Particle Sync Fix 🎨 | V0.8.2.0 ALPHA: Visual Polish Update ✨ | V0.8.0: Major Refactor 🚀 | And More...";

// Player Skin Definitions
export const PLAYER_SKINS = {
    'skin_red': { name: 'Red', highlight: '#ffcccc', mid: '#ff6666', shadow: '#990000', outline: '#660000' },
    'skin_blue': { name: 'Blue', highlight: '#cce6ff', mid: '#66b3ff', shadow: '#0066cc', outline: '#004080' },
    'skin_green': { name: 'Green', highlight: '#ccffcc', mid: '#66ff66', shadow: '#009900', outline: '#006600' },
    'skin_orange': { name: 'Orange', highlight: '#ffebd6', mid: '#ff9933', shadow: '#cc6600', outline: '#804000' },
    'skin_purple': { name: 'Purple', highlight: '#f3e6ff', mid: '#b366ff', shadow: '#6600cc', outline: '#400080' },
    'skin_gold': { name: 'Gold', highlight: '#fff9e6', mid: '#ffd700', shadow: '#b8860b', outline: '#8b6914' },
    'skin_platinum': { name: 'Platinum', highlight: '#f2f2f2', mid: '#e5e5e5', shadow: '#a6a6a6', outline: '#737373' },
    'skin_legendary': { name: 'Legendary', highlight: '#fff', mid: '#ff00ff', shadow: '#800080', outline: '#400040' },
    'skin_immortal': { name: 'Immortal', highlight: '#e6ffff', mid: '#00ffff', shadow: '#008b8b', outline: '#004d4d' },
    'skin_godlike': { name: 'Godlike', highlight: '#fff', mid: '#ff3300', shadow: '#801a00', outline: '#4d1000' },
    'skin_divine': { name: 'Divine', highlight: '#fff', mid: '#ffffff', shadow: '#ccc', outline: '#999' },
    'skin_transcendent': { name: 'Transcendent', highlight: '#fff', mid: '#7df9ff', shadow: '#0047ab', outline: '#002366' },
    'skin_ultimate': { name: 'Ultimate', highlight: '#000', mid: '#ff1744', shadow: '#880e4f', outline: '#000' }
};

export const DEFAULT_PLAYER_SKIN = { name: 'Default', highlight: '#f5d0b5', mid: '#d4a574', shadow: '#b8956b', outline: '#8b6914' };

// Weapon definitions
export const WEAPONS = {
    pistol: {
        name: "Pistol",
        damage: 2, // Doubled from 1
        fireRate: 400, // ms between shots
        ammo: 10,
        maxAmmo: 10,
        reloadTime: 1000 // ms (1 second)
    },
    shotgun: {
        name: "Shotgun",
        damage: 6, // Doubled from 3 (per pellet)
        fireRate: 800, // ms between shots
        ammo: 5,
        maxAmmo: 5,
        reloadTime: 1000 // ms (1 second)
    },
    rifle: {
        name: "Rifle",
        damage: 4, // Doubled from 2
        fireRate: 200, // ms between shots
        ammo: 30,
        maxAmmo: 30,
        reloadTime: 1000 // ms (1 second)
    },
    flamethrower: {
        name: "Flamethrower",
        damage: 1.0, // Doubled from 0.5
        fireRate: 50, // Very fast (ms between shots)
        ammo: 100,
        maxAmmo: 100,
        reloadTime: 2000, // 2 seconds (slower reload)
        range: 200, // Short range
        type: 'flame'
    },
    smg: {
        name: "SMG",
        damage: 1.6, // Doubled from 0.8
        fireRate: 80, // Fast fire rate
        ammo: 40,
        maxAmmo: 40,
        reloadTime: 1200 // Slightly slower than pistol
    },
    sniper: {
        name: "Sniper",
        damage: 30, // Doubled from 15
        fireRate: 1500, // Slow fire rate
        ammo: 5,
        maxAmmo: 5,
        reloadTime: 2500, // Slow reload
        type: 'piercing'
    },
    rocketLauncher: {
        name: "RPG",
        damage: 0, // Impact damage handled by explosion
        fireRate: 2000, // Very slow
        ammo: 3,
        maxAmmo: 3,
        reloadTime: 3000,
        type: 'rocket',
        explosionRadius: 150,
        explosionDamage: 120 // Doubled from 60
    },
    laser: {
        name: "Laser Gun",
        damage: 3, // Rebalanced from 5 — was ~83 DPS, now ~50 DPS (still top-tier sustained)
        fireRate: 60, // Very fast
        ammo: 60,
        maxAmmo: 60,
        reloadTime: 1500,
        range: 800,
        type: 'laser'
    }
};

// Weapon-specific muzzle flash color palettes (RGB arrays: [core, mid, outer])
// Used by PlayerSystem.js to tint the flash gradient per weapon type
export const MUZZLE_FLASH_COLORS = {
    pistol:         { core: [255, 255, 255], mid: [255, 255, 200], outer: [255, 200, 0]   },
    shotgun:        { core: [255, 255, 220], mid: [255, 200, 100], outer: [255, 120, 0]   },
    rifle:          { core: [255, 255, 255], mid: [200, 220, 255], outer: [100, 150, 255] },
    flamethrower:   { core: [255, 255, 200], mid: [255, 160, 50],  outer: [255, 80, 0]    },
    smg:            { core: [255, 255, 240], mid: [255, 240, 180], outer: [255, 180, 50]  },
    sniper:         { core: [220, 255, 255], mid: [100, 220, 255], outer: [0, 180, 255]   },
    rocketLauncher: { core: [255, 255, 200], mid: [255, 180, 80],  outer: [255, 100, 0]   },
    laser:          { core: [255, 220, 240], mid: [255, 50, 120],  outer: [200, 0, 80]    }
};

// Per-weapon bullet trail color (used by Bullet.draw)
export const BULLET_TRAIL_COLORS = {
    pistol:   '#ffff00',
    shotgun:  '#ff8c00',
    rifle:    '#88ccff',
    smg:      '#ffe066',
    sniper:   '#00e5ff',
    laser:    '#ff0055'
};
