import { gameState } from '../core/gameState.js';
import { RENDERING } from '../core/constants.js';
import { canvas } from '../core/canvas.js';

export function checkCollision(obj1, obj2) {
    const dx = obj1.x - obj2.x;
    const dy = obj1.y - obj2.y;
    const radiusSum = obj1.radius + obj2.radius;
    const distSquared = dx * dx + dy * dy;
    return distSquared < radiusSum * radiusSum;
}

/**
 * Check collision between a bullet and a zombie, including secondary lower body hitbox
 * @param {Object} bullet - Bullet object with x, y, radius properties
 * @param {Object} zombie - Zombie object with x, y, radius, and lowerBodyHitbox properties
 * @returns {Object} Result with hit (boolean) and isHeadshot (boolean)
 */
export function checkZombieCollision(bullet, zombie) {
    // Check main hitbox (head/center)
    if (checkCollision(bullet, zombie)) {
        // v0.8.3.5: If it hits the main hitbox but NOT the lower body, it's definitely a head/torso hit.
        // For simplicity in this engine, the main upper circle is considered "Headshot" territory.
        return { hit: true, isHeadshot: true };
    }

    // Check secondary lower body hitbox if it exists
    if (zombie.lowerBodyHitbox) {
        const dx = bullet.x - zombie.lowerBodyHitbox.x;
        const dy = bullet.y - zombie.lowerBodyHitbox.y;
        const radiusSum = bullet.radius + zombie.lowerBodyHitbox.radius;
        const distSquared = dx * dx + dy * dy;
        if (distSquared < radiusSum * radiusSum) {
            return { hit: true, isHeadshot: false };
        }
    }

    return { hit: false, isHeadshot: false };
}

/**
 * Check if an entity is within the viewport (with margin for culling)
 * @param {Object} entity - Entity with x, y, radius properties
 * @param {number} viewportLeft - Left edge of viewport
 * @param {number} viewportTop - Top edge of viewport
 * @param {number} viewportRight - Right edge of viewport
 * @param {number} viewportBottom - Bottom edge of viewport
 * @returns {boolean} True if entity should be rendered
 */
export function isInViewport(entity, viewportLeft, viewportTop, viewportRight, viewportBottom) {
    const margin = RENDERING.CULL_MARGIN;
    const radius = entity.radius || 0;

    return entity.x + radius >= viewportLeft - margin &&
        entity.x - radius <= viewportRight + margin &&
        entity.y + radius >= viewportTop - margin &&
        entity.y - radius <= viewportBottom + margin;
}

/**
 * Get viewport bounds for current canvas
 * @param {HTMLCanvasElement} canvas - Canvas element
 * @returns {Object} Viewport bounds {left, top, right, bottom}
 */
export function getViewportBounds(canvas) {
    return {
        left: 0,
        top: 0,
        right: canvas.width,
        bottom: canvas.height
    };
}

/**
 * Check if an entity should be updated (larger margin than rendering)
 * Entities far off-screen still need updates for AI/pathfinding if they might come into view soon
 * @param {Object} entity - Entity with x, y, radius properties
 * @param {number} viewportLeft - Left edge of viewport
 * @param {number} viewportTop - Top edge of viewport
 * @param {number} viewportRight - Right edge of viewport
 * @param {number} viewportBottom - Bottom edge of viewport
 * @returns {boolean} True if entity should be updated
 */
export function shouldUpdateEntity(entity, viewportLeft, viewportTop, viewportRight, viewportBottom) {
    const margin = RENDERING.UPDATE_MARGIN;
    const radius = entity.radius || 0;

    return entity.x + radius >= viewportLeft - margin &&
        entity.x - radius <= viewportRight + margin &&
        entity.y + radius >= viewportTop - margin &&
        entity.y - radius <= viewportBottom + margin;
}

/**
 * Check if an entity is large enough to be visible on screen
 * Skips rendering entities smaller than 1px on screen (tiny shells, distant bullets)
 * @param {Object} entity - Entity with radius property
 * @param {number} entityRadius - Entity radius in world space (optional, uses entity.radius if not provided)
 * @returns {boolean} True if entity is large enough to render
 */
export function isVisibleOnScreen(entity, entityRadius = null) {
    const radius = entityRadius !== null ? entityRadius : (entity.radius || 0);

    // Simple check: skip entities with very small radius
    // This catches tiny shells, very distant bullets, etc.
    // For now, we use 0.5 world pixels as threshold - entities smaller than this are too tiny to see
    // More sophisticated implementation could calculate actual screen-space size based on camera zoom
    if (radius < 0.5) {
        return false;
    }

    return true;
}

export function triggerDamageIndicator() {
    gameState.damageIndicator.active = true;
    gameState.damageIndicator.intensity = 1.0;
}

export function triggerWaveNotification(customText = null, customLife = null) {
    gameState.waveNotification.active = true;
    if (customText) {
        gameState.waveNotification.text = customText;
    } else if (gameState.waveMutator) {
        const labels = {
            swarm: 'SWARM',
            elites: 'ELITES',
            volatile: 'VOLATILE',
            encircle: 'ENCIRCLE',
            rush: 'RUSH'
        };
        const tag = labels[gameState.waveMutator] || gameState.waveMutator.toUpperCase();
        gameState.waveNotification.text = `Wave ${gameState.wave} — ${tag}`;
    } else {
        gameState.waveNotification.text = `Wave ${gameState.wave} Starting!`;
    }
    gameState.waveNotification.life = customLife ?? gameState.waveNotification.maxLife;
}

export function triggerMuzzleFlash(x, y, angle) {
    gameState.muzzleFlash.active = true;
    gameState.muzzleFlash.intensity = 1.0;
    gameState.muzzleFlash.x = x;
    gameState.muzzleFlash.y = y;
    gameState.muzzleFlash.angle = angle;
    gameState.muzzleFlash.life = gameState.muzzleFlash.maxLife;
}

export function loadHighScore() {
    const savedHighScore = localStorage.getItem('zombieSurvivalHighScore');
    if (savedHighScore !== null) {
        gameState.highScore = parseInt(savedHighScore);
    }
}

export function saveHighScore() {
    if (gameState.score > gameState.highScore) {
        gameState.highScore = gameState.score;
        localStorage.setItem('zombieSurvivalHighScore', gameState.highScore.toString());
    }
}

export function loadUsername() {
    const savedUsername = localStorage.getItem('zombobs_username');
    if (savedUsername !== null && savedUsername.trim() !== '') {
        gameState.username = savedUsername.trim();
    }
}

export function saveUsername() {
    if (gameState.username && gameState.username.trim() !== '') {
        localStorage.setItem('zombobs_username', gameState.username.trim());
    }
}

export function loadMenuMusicMuted() {
    const savedMuted = localStorage.getItem('zombobs_menuMusicMuted');
    if (savedMuted !== null) {
        gameState.menuMusicMuted = savedMuted === 'true';
    }
}

export function saveMenuMusicMuted() {
    localStorage.setItem('zombobs_menuMusicMuted', gameState.menuMusicMuted.toString());
}

// Score Multiplier Statistics

/**
 * Save multiplier statistics to localStorage
 */
export function saveMultiplierStats() {
    try {
        const stats = {
            allTimeMaxMultiplier: gameState.allTimeMaxMultiplier
        };
        localStorage.setItem('zombobs_multiplier_stats', JSON.stringify(stats));
    } catch (error) {
        // Failed to save multiplier stats
    }
}

/**
 * Load multiplier statistics from localStorage
 */
export function loadMultiplierStats() {
    try {
        const saved = localStorage.getItem('zombobs_multiplier_stats');
        if (saved) {
            const stats = JSON.parse(saved);
            gameState.allTimeMaxMultiplier = stats.allTimeMaxMultiplier || 1.0;
        }
    } catch (error) {
        // Failed to load multiplier stats
    }
}

// Scoreboard System — in-memory cache avoids localStorage parse every menu frame
let _scoreboardCache = null;
let _recentRunsCache = null;

function readScoreboardFromStorage() {
    try {
        const saved = localStorage.getItem('zombobs_scoreboard');
        if (saved) {
            const scoreboard = JSON.parse(saved);
            if (Array.isArray(scoreboard)) {
                return scoreboard.sort((a, b) => b.score - a.score).slice(0, 10);
            }
        }
    } catch (error) {
        // Failed to load scoreboard
    }
    return [];
}

function readRecentRunsFromStorage() {
    try {
        const saved = localStorage.getItem('zombobs_recent_runs');
        if (saved) {
            const recentRuns = JSON.parse(saved);
            if (Array.isArray(recentRuns)) {
                return recentRuns;
            }
        }
    } catch (error) {
        // Failed to load recent runs
    }
    return [];
}

export function invalidateMenuScoreCaches() {
    _scoreboardCache = null;
    _recentRunsCache = null;
}

/**
 * Load scoreboard from localStorage
 * @returns {Array} Array of scoreboard entries (max 10), sorted by score descending
 */
export function loadScoreboard() {
    if (_scoreboardCache === null) {
        _scoreboardCache = readScoreboardFromStorage();
    }
    return _scoreboardCache;
}

/**
 * Clear the scoreboard from localStorage
 */
export function clearScoreboard() {
    try {
        localStorage.removeItem('zombobs_scoreboard');
        _scoreboardCache = [];
        return true;
    } catch (error) {
        return false;
    }
}

/**
 * Saves a run to the recent runs list in localStorage
 * @param {Object} entry - The full scoreboard entry to save
 */
function saveToRecentRuns(entry) {
    try {
        let recentRuns = [];
        const saved = localStorage.getItem('zombobs_recent_runs');
        if (saved) {
            recentRuns = JSON.parse(saved);
            if (!Array.isArray(recentRuns)) recentRuns = [];
        }

        // Add new entry to the front
        recentRuns.unshift(entry);

        // Keep only the last 10 runs
        const recentRunsToSave = recentRuns.slice(0, 10);

        localStorage.setItem('zombobs_recent_runs', JSON.stringify(recentRunsToSave));
        _recentRunsCache = recentRunsToSave;
    } catch (error) {
        // Failed to save to recent runs
    }
}

/**
 * Save a new scoreboard entry if it qualifies for top 10, and saves the run to the recent runs list.
 * @param {Object} entry - Scoreboard entry object
 * @param {number} entry.score - Final score
 * @param {number} entry.wave - Wave reached
 * @param {number} entry.kills - Zombies killed
 * @param {number} entry.timeSurvived - Time survived in seconds
 * @param {number} entry.maxMultiplier - Maximum multiplier achieved
 * @param {string} entry.username - Player username
 * @param {string} entry.gameMode - The game mode ('arcade', 'coop', etc.)
 * @returns {boolean} True if entry was saved to the top-10 highscore board
 */
export function saveScoreboardEntry(entry) {
    try {
        // Get username from entry, gameState, or localStorage, with fallback
        let username = entry.username;
        if (!username || username.trim() === '') {
            if (gameState && gameState.username && gameState.username.trim() !== '') {
                username = gameState.username.trim();
            } else {
                const savedUsername = localStorage.getItem('zombobs_username');
                username = (savedUsername !== null && savedUsername.trim() !== '') ? savedUsername.trim() : 'Survivor';
            }
        }

        const fullEntry = {
            score: entry.score || 0,
            wave: entry.wave || 0,
            kills: entry.kills || 0,
            timeSurvived: entry.timeSurvived || 0,
            maxMultiplier: entry.maxMultiplier || 1.0,
            dateTime: entry.dateTime || new Date().toISOString(),
            username: username,
            gameMode: entry.gameMode || 'arcade'
        };

        // Save to recent runs list
        saveToRecentRuns(fullEntry);

        const scoreboard = loadScoreboard();

        // Add new entry for high score check
        scoreboard.push(fullEntry);

        // Sort by score descending
        scoreboard.sort((a, b) => b.score - a.score);

        // Keep only top 10
        const top10 = scoreboard.slice(0, 10);

        // Check if new entry made it into top 10
        const entryQualified = top10.some(e =>
            e.score === fullEntry.score &&
            e.dateTime === fullEntry.dateTime
        );

        // Save to localStorage
        localStorage.setItem('zombobs_scoreboard', JSON.stringify(top10));
        _scoreboardCache = top10;

        return entryQualified;
    } catch (error) {
        return false;
    }
}

/**
 * Get last N runs from the recent runs list, sorted by dateTime (most recent first)
 * @param {number} count - Number of runs to retrieve
 * @param {string} gameMode - Optional game mode filter ('arcade', 'coop', 'multiplayer')
 * @returns {Array} Array of scoreboard entries sorted by dateTime descending
 */
export function getLastRuns(count, gameMode = null) {
    if (_recentRunsCache === null) {
        _recentRunsCache = readRecentRunsFromStorage();
    }

    let filtered = _recentRunsCache;
    if (gameMode) {
        if (gameMode === 'arcade') {
            filtered = _recentRunsCache.filter(entry => {
                const mode = entry.gameMode || 'arcade';
                return mode === 'arcade';
            });
        } else {
            filtered = _recentRunsCache.filter(entry => entry.gameMode === gameMode);
        }
    }
    return filtered.slice(0, count);
}

/**
 * Format seconds into readable time string
 * @param {number} seconds - Time in seconds
 * @returns {string} Formatted time string (e.g., "1h 5m 23s", "5m 23s", "23s")
 */
export function formatTime(seconds) {
    if (typeof seconds !== 'number' || seconds < 0) {
        return '0s';
    }

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    const parts = [];
    if (hours > 0) {
        parts.push(`${hours}h`);
    }
    if (minutes > 0) {
        parts.push(`${minutes}m`);
    }
    if (secs > 0 || parts.length === 0) {
        parts.push(`${secs}s`);
    }

    return parts.join(' ');
}

/** True on phone/tablet user agents (matches GameHUD mobile layout gate) */
export function isMobileDevice() {
    return /Android|iPhone|iPad|iPod/i.test((typeof navigator !== 'undefined' && navigator.userAgent) || '');
}

/** Single-player arcade: world-space camera, infinite ground, prop spawning */
export function isSinglePlayerArcadeMode(state) {
    return !state.isCoop && !state.multiplayer.active;
}

/** True when gameplay simulation should not run (menus/overlays active) */
export function isGameplayBlocked(state) {
    return !state.gameRunning ||
        state.showMainMenu ||
        state.showLobby ||
        state.showCoopLobby ||
        state.showAILobby ||
        state.showGallery ||
        state.showAbout ||
        state.showProfile ||
        state.showAchievements ||
        state.showBattlepass ||
        state.showBadges;
}

/** True when uiCanvas should capture pointer events */
export function isUICanvasInteractive(state, hud) {
    return state.showSettingsPanel ||
        state.showMainMenu ||
        state.showLobby ||
        state.showCoopLobby ||
        state.showAILobby ||
        state.showGallery ||
        state.showAbout ||
        state.showProfile ||
        state.showAchievements ||
        state.showBattlepass ||
        state.showBadges ||
        state.showLevelUp ||
        state.showUsernameModal ||
        hud.gameOver ||
        state.gamePaused;
}

/** HTML overlay screens that need clicks to pass through to DOM */
export function isHTMLOverlayActive(state) {
    return state.showProfile ||
        state.showAchievements ||
        state.showBattlepass ||
        state.showBadges;
}

/** Menus/lobbies where touch controls should be hidden */
export function isMenuOrOverlayScreen(state, hud) {
    return state.showMainMenu ||
        state.showLobby ||
        state.showCoopLobby ||
        state.showAILobby ||
        state.showGallery ||
        state.showAbout ||
        state.showProfile ||
        state.showAchievements ||
        state.showBadges ||
        state.showBattlepass ||
        state.showSettingsPanel ||
        state.gamePaused ||
        hud.gameOver ||
        state.showLevelUp;
}

