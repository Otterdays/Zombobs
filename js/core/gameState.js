import {
    WEAPONS, PLAYER_MAX_HEALTH, MAX_GRENADES, MAX_MOLOTOVS,
    PLAYER_BASE_SPEED, PLAYER_STAMINA_MAX
} from './constants.js';

// Available player colors for co-op
const PLAYER_COLORS = [
    { name: 'blue', light: '#66b3ff', dark: '#0066cc', outline: '#003d7a', glow: 'rgba(0, 136, 255, 0.4)' },
    { name: 'red', light: '#ff6666', dark: '#cc0000', outline: '#7a0000', glow: 'rgba(255, 0, 0, 0.4)' },
    { name: 'green', light: '#66ff66', dark: '#00cc00', outline: '#007a00', glow: 'rgba(0, 255, 0, 0.4)' },
    { name: 'orange', light: '#ffaa66', dark: '#ff6600', outline: '#cc4400', glow: 'rgba(255, 136, 0, 0.4)' },
    { name: 'purple', light: '#cc66ff', dark: '#8800cc', outline: '#55007a', glow: 'rgba(136, 0, 255, 0.4)' }
];

const AI_NAMES = [
    "Rook", "Bishop", "Knight", "Pawn", "Sarge", "Doc", "Tex", "Tank", "Scout", "Viper",
    "Ghost", "Soap", "Price", "Gaz", "Roach", "Frost", "Sandman", "Grinch", "Truck", "Yuri",
    "Delta", "Echo", "Foxtrot", "Kilo", "Sierra", "Tango", "Victor", "Whiskey", "X-Ray", "Yankee"
];

export function createPlayer(x, y, colorIndex = 0) {
    const color = PLAYER_COLORS[colorIndex % PLAYER_COLORS.length];
    const randomName = AI_NAMES[Math.floor(Math.random() * AI_NAMES.length)];

    return {
        x, y,
        radius: 15,
        name: randomName,
        speed: PLAYER_BASE_SPEED,
        health: PLAYER_MAX_HEALTH,
        maxHealth: PLAYER_MAX_HEALTH,
        stamina: PLAYER_STAMINA_MAX,
        maxStamina: PLAYER_STAMINA_MAX,
        angle: 0,
        isSprinting: false,
        lastSprintTime: 0,

        // Weapon state
        currentWeapon: WEAPONS.pistol,
        lastShotTime: 0,
        isReloading: false,
        reloadStartTime: 0,
        currentAmmo: WEAPONS.pistol.ammo,
        maxAmmo: WEAPONS.pistol.maxAmmo,

        // Per-weapon ammo tracking (for persistence when switching)
        weaponStates: {
            pistol: { ammo: WEAPONS.pistol.ammo, lastHolsteredTime: 0 },
            shotgun: { ammo: WEAPONS.shotgun.ammo, lastHolsteredTime: 0 },
            rifle: { ammo: WEAPONS.rifle.ammo, lastHolsteredTime: 0 },
            flamethrower: { ammo: WEAPONS.flamethrower.ammo, lastHolsteredTime: 0 },
            smg: { ammo: WEAPONS.smg.ammo, lastHolsteredTime: 0 },
            sniper: { ammo: WEAPONS.sniper.ammo, lastHolsteredTime: 0 },
            rocketLauncher: { ammo: WEAPONS.rocketLauncher.ammo, lastHolsteredTime: 0 },
            laser: { ammo: WEAPONS.laser.ammo, lastHolsteredTime: 0 }
        },

        // Melee state
        lastMeleeTime: 0,
        activeMeleeSwipe: null,

        // Grenade state
        grenadeCount: MAX_GRENADES,
        molotovCount: MAX_MOLOTOVS,
        activeThrowable: 'grenade',
        lastGrenadeThrowTime: 0,
        lastThrowableCycleTime: 0,

        // Shield
        shield: 0,
        maxShield: 50,

        // Score Multiplier
        scoreMultiplier: 1.0,
        consecutiveKills: 0,
        maxMultiplierThisSession: 1.0,
        totalMultiplierBonus: 0,
        multiplierTierThresholds: [0, 3, 6, 10, 15],

        // Visual
        color: color,
        equippedSkin: null,
        flashlight: {
            active: false
        },
        muzzleFlash: {
            active: false,
            intensity: 0,
            x: 0, y: 0, angle: 0,
            life: 0, maxLife: 5
        },

        // Dodge roll state
        isDodging: false,
        dodgeTimeRemaining: 0,
        dodgeCooldown: 0,
        dodgeDirection: { x: 0, y: 0 },
        dodgeKeyReleased: true,
        positionHistory: [],

        // Input
        inputSource: 'mouse', // 'mouse', 'keyboard_arrow', 'gamepad'
        gamepadIndex: null
    };
}

export const gameState = {
    gameRunning: true,
    gamePaused: false,
    showMainMenu: true,
    showCampaignIntro: false,
    showSettingsPanel: false,
    showLobby: false,
    isCoop: false,
    showCoopLobby: false,
    showAILobby: false,
    showAbout: false,
    showGallery: false,
    showProfile: false,
    showAchievements: false,
    showUsernameModal: false,
    showBattlepass: false,
    showBadges: false,

    multiplayer: {
        active: false,
        connected: false,
        status: 'disconnected', // 'connecting' | 'connected' | 'error' | 'disconnected'
        serverStatus: 'checking', // 'checking' | 'online' | 'offline' | 'error'
        socket: null,
        playerId: null,
        players: [],
        latency: 0,
        isLeader: false,
        isReady: false,
        isGameStarting: false,
        gameStartTime: 0,
        // Chat state
        chatMessages: [],
        chatInput: '',
        chatFocused: false,
        chatScrollPosition: 0
    },
    username: 'Survivor',
    menuMusicMuted: false,

    score: 0,
    wave: 1,
    zombiesKilled: 0,
    pickupsCollected: 0, // v0.8.3.5: Tracks pickups in current session
    headshots: 0, // v0.8.3.5: Tracks headshots in current session
    zombiesPerWave: 5,
    zombiesSpawnedThisWave: 0,  // Actual number of zombies spawned for current wave
    highScore: 0,

    // Score Multiplier Statistics
    allTimeMaxMultiplier: 1.0,

    // XP & Skills System
    xp: 0,
    level: 1,
    nextLevelXP: 100,
    activeSkills: [],
    showLevelUp: false,
    levelUpChoices: [],

    isSpawningWave: false,
    waveBreakActive: false,
    waveBreakEndTime: 0,

    // Boss State
    bossActive: false,
    boss: null,

    players: [createPlayer(0, 0)],

    // Game objects
    bullets: [],
    zombies: [],
    particles: [],
    healthPickups: [],
    ammoPickups: [],
    damagePickups: [],
    nukePickups: [],
    speedPickups: [],
    rapidFirePickups: [],
    shieldPickups: [],
    adrenalinePickups: [],
    zombieSpawnTimeouts: [],
    shells: [],
    damageNumbers: [],
    grenades: [],
    acidProjectiles: [],
    acidPools: [],
    spawnIndicators: [],
    props: [], // v0.8.1.2: World props (rocks, debris, burnt cars) - single player arcade only

    // Visual effects
    shakeAmount: 0,
    shakeDecay: 0.9,

    damageIndicator: {
        active: false,
        intensity: 0,
        decay: 0.95
    },

    hitMarker: {
        active: false,
        life: 0,
        maxLife: 10
    },

    // Buffs & Streaks
    damageMultiplier: 1,
    damageBuffEndTime: 0,
    speedBoostEndTime: 0,
    rapidFireEndTime: 0,
    adrenalineEndTime: 0,
    killStreak: 0,
    lastKillTime: 0,
    // Multi-kill tracking (V0.7.1)
    recentKills: [], // Array of {time, zombieType} for multi-kill detection
    maxKillStreak: 0, // Track highest streak in session
    // Weapon switch animation (V0.7.1)
    weaponSwitchFlash: {
        active: false,
        startTime: 0,
        duration: 150, // 150ms flash
        weapon: null // Weapon that was switched to
    },

    waveNotification: {
        active: false,
        text: '',
        life: 0,
        maxLife: 120
    },

    // FPS counter
    fps: 0,
    lastFpsUpdateTime: 0,
    framesSinceFpsUpdate: 0,

    // Timers
    lastFootstepTime: 0, // Kept global for now, or can be per player
    lastHealthPickupSpawnTime: 0,
    lastAmmoPickupSpawnTime: 0,
    lastPowerupSpawnTime: 0,
    lastZombieUpdateBroadcast: 0, // For multiplayer zombie sync throttling

    // Multiplayer sync state
    lastZombieState: new Map(), // For delta compression - tracks last sent state per zombie
    zombieUpdateInterval: 100, // Adaptive update interval (ms)
    networkLatency: 0, // Measured network latency (ms)
    lastPingTime: 0, // For latency measurement

    // Day/Night Cycle
    gameTime: 0, // 0 to 1, represents position in cycle
    dayNightCycle: {
        cycleDuration: 120000, // 2 minutes in milliseconds
        startTime: 0 // When the cycle started
    },
    isNight: false,

    // Game Session Tracking
    gameStartTime: 0, // Timestamp when current game session started

    // Achievement Notifications
    achievementNotifications: [], // Array of achievement notifications to display
    sessionResults: null, // Session results from profile system (rank XP, achievements, etc.)
};

// Compatibility getters/setters for single-player code
Object.defineProperties(gameState, {
    player: { get: () => gameState.players[0] },

    // Map global properties to player 1
    currentWeapon: { get: () => gameState.players[0].currentWeapon, set: (v) => gameState.players[0].currentWeapon = v },
    currentAmmo: { get: () => gameState.players[0].currentAmmo, set: (v) => gameState.players[0].currentAmmo = v },
    maxAmmo: { get: () => gameState.players[0].maxAmmo, set: (v) => gameState.players[0].maxAmmo = v },
    isReloading: { get: () => gameState.players[0].isReloading, set: (v) => gameState.players[0].isReloading = v },
    reloadStartTime: { get: () => gameState.players[0].reloadStartTime, set: (v) => gameState.players[0].reloadStartTime = v },
    grenadeCount: { get: () => gameState.players[0].grenadeCount, set: (v) => gameState.players[0].grenadeCount = v },
    activeMeleeSwipe: { get: () => gameState.players[0].activeMeleeSwipe, set: (v) => gameState.players[0].activeMeleeSwipe = v },
    muzzleFlash: { get: () => gameState.players[0].muzzleFlash, set: (v) => gameState.players[0].muzzleFlash = v },
    lastMeleeTime: { get: () => gameState.players[0].lastMeleeTime, set: (v) => gameState.players[0].lastMeleeTime = v },
    lastShotTime: { get: () => gameState.players[0].lastShotTime, set: (v) => gameState.players[0].lastShotTime = v },
    lastGrenadeThrowTime: { get: () => gameState.players[0].lastGrenadeThrowTime, set: (v) => gameState.players[0].lastGrenadeThrowTime = v },
});

export function resetGameState(canvasWidth, canvasHeight) {
    gameState.score = 0;
    gameState.wave = 1;
    gameState.zombiesKilled = 0;
    gameState.pickupsCollected = 0;
    gameState.headshots = 0;
    gameState.zombiesPerWave = 5;
    gameState.zombiesSpawnedThisWave = 0;
    gameState.isSpawningWave = false;

    // Reset XP & Skills
    gameState.xp = 0;
    gameState.level = 1;
    gameState.nextLevelXP = 100;
    gameState.activeSkills = [];
    gameState.showLevelUp = false;
    gameState.levelUpChoices = [];

    gameState.bossActive = false;
    gameState.boss = null;

    // Preserve existing players from lobby if in co-op mode
    if (gameState.isCoop && gameState.players.length > 0) {
        // Reset each player's stats but keep their input configuration
        gameState.players.forEach((player, index) => {
            player.health = PLAYER_MAX_HEALTH;
            player.maxHealth = PLAYER_MAX_HEALTH;
            player.stamina = PLAYER_STAMINA_MAX;
            player.maxStamina = PLAYER_STAMINA_MAX;
            player.shield = 0;
            player.currentWeapon = WEAPONS.pistol;
            player.currentAmmo = WEAPONS.pistol.ammo;
            player.maxAmmo = WEAPONS.pistol.maxAmmo;
            player.isReloading = false;
            player.grenadeCount = MAX_GRENADES;

            // Reset score multiplier
            player.scoreMultiplier = 1.0;
            player.consecutiveKills = 0;
            player.maxMultiplierThisSession = 1.0;
            player.totalMultiplierBonus = 0;

            // Reset skill multipliers
            player.speedMultiplier = 1.0;
            player.reloadSpeedMultiplier = 1.0;
            player.ammoMultiplier = 1.0;
            player.critChance = 0;
            player.hasRegeneration = false;

            // Reset weapon states
            player.weaponStates = {
                pistol: { ammo: WEAPONS.pistol.ammo, lastHolsteredTime: 0 },
                shotgun: { ammo: WEAPONS.shotgun.ammo, lastHolsteredTime: 0 },
                rifle: { ammo: WEAPONS.rifle.ammo, lastHolsteredTime: 0 },
                flamethrower: { ammo: WEAPONS.flamethrower.ammo, lastHolsteredTime: 0 },
                smg: { ammo: WEAPONS.smg.ammo, lastHolsteredTime: 0 },
                sniper: { ammo: WEAPONS.sniper.ammo, lastHolsteredTime: 0 },
                rocketLauncher: { ammo: WEAPONS.rocketLauncher.ammo, lastHolsteredTime: 0 },
                laser: { ammo: WEAPONS.laser.ammo, lastHolsteredTime: 0 }
            };

            // Position players in a circle around center
            const angleOffset = (Math.PI * 2 / gameState.players.length) * index;
            const radius = 50;
            player.x = canvasWidth / 2 + Math.cos(angleOffset) * radius;
            player.y = canvasHeight / 2 + Math.sin(angleOffset) * radius;
        });
    } else {
        // Initialize single player
        const p1 = createPlayer(canvasWidth / 2, canvasHeight / 2, 0); // Blue
        p1.inputSource = 'mouse';
        gameState.players = [p1];
    }

    gameState.bullets = [];
    gameState.zombies = [];
    gameState.particles = [];
    gameState.healthPickups = [];
    gameState.ammoPickups = [];
    gameState.damagePickups = [];
    gameState.nukePickups = [];
    gameState.speedPickups = [];
    gameState.rapidFirePickups = [];
    gameState.shieldPickups = [];
    gameState.adrenalinePickups = [];
    gameState.grenades = [];
    gameState.acidProjectiles = [];
    gameState.acidPools = [];
    gameState.spawnIndicators = [];
    gameState.props = []; // v0.8.1.2: Reset props for new game

    // Clear timeouts
    gameState.zombieSpawnTimeouts.forEach(timeout => clearTimeout(timeout));
    gameState.zombieSpawnTimeouts = [];

    gameState.lastHealthPickupSpawnTime = Date.now();
    gameState.lastAmmoPickupSpawnTime = Date.now();
    gameState.lastPowerupSpawnTime = Date.now();
    gameState.damageMultiplier = 1;
    gameState.damageBuffEndTime = 0;
    gameState.speedBoostEndTime = 0;
    gameState.rapidFireEndTime = 0;
    gameState.adrenalineEndTime = 0;
    gameState.killStreak = 0;
    gameState.lastKillTime = 0;
    gameState.maxKillStreak = 0; // V0.7.1: Track highest streak in session
    gameState.recentKills = []; // V0.7.1: Track recent kills for multi-kill detection
    gameState.weaponSwitchFlash = { active: false, startTime: 0, duration: 150, weapon: null }; // V0.7.1: Reset weapon switch flash

    gameState.waveNotification.active = false;

    // Reset day/night cycle
    gameState.gameTime = 0;
    gameState.dayNightCycle.startTime = Date.now();
    gameState.isNight = false;

    // Reset game start time (will be set when game actually starts)
    gameState.gameStartTime = 0;

    // Clear session results
    gameState.sessionResults = null;
    gameState.achievementNotifications = [];
}
