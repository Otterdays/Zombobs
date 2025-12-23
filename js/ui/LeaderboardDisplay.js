import { gameState } from '../core/gameState.js';
import { settingsManager } from '../systems/SettingsManager.js';
import { SERVER_URL } from '../core/constants.js';

/**
 * LeaderboardDisplay - UI component for fetching and displaying global leaderboard
 */
export class LeaderboardDisplay {
    constructor(canvas) {
        this.canvas = canvas;
        this.leaderboard = []; // Global leaderboard from server
        this.leaderboardLastFetch = 0; // Timestamp of last fetch
        this.leaderboardFetchInterval = 30000; // Fetch every 30 seconds
        this.leaderboardFetchState = 'loading'; // 'loading' | 'success' | 'timeout' | 'error'
        this.leaderboardFetchStartTime = 0; // Timestamp when fetch started
        
        // Scrolling text animation for long usernames (radio-style)
        this.usernameScrollOffsets = {}; // { username: { offset: 0, pauseUntil: 0 } }
        this.scrollSpeed = 30; // pixels per second
        this.pauseDuration = 2000; // 2 seconds pause at start
    }

    getUIScale() {
        const scale = settingsManager.getSetting('video', 'uiScale') ?? 1.0;
        // Ensure scale is always a finite positive number
        if (!Number.isFinite(scale) || scale <= 0) {
            console.warn('getUIScale: Invalid scale value, using default 1.0', { scale });
            return 1.0;
        }
        return scale;
    }

    async fetch() {
        // Throttle fetches - don't fetch more than once every 30 seconds
        const now = Date.now();
        if (now - this.leaderboardLastFetch < this.leaderboardFetchInterval && this.leaderboardFetchState === 'success') {
            return;
        }

        // Set loading state
        this.leaderboardFetchState = 'loading';
        this.leaderboardFetchStartTime = now;

        // Create abort controller for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
            controller.abort();
        }, 10000); // 10 second timeout

        try {
            const response = await fetch(`${SERVER_URL}/api/highscores`, {
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            
            if (response.ok) {
                const data = await response.json();
                if (data.highscores && Array.isArray(data.highscores)) {
                    this.leaderboard = data.highscores;
                    this.leaderboardLastFetch = now;
                    this.leaderboardFetchState = 'success';
                } else {
                    // Invalid response format
                    this.leaderboardLastFetch = now; // Update timestamp to prevent infinite retries
                    this.leaderboardFetchState = 'error';
                }
            } else {
                // HTTP error response
                this.leaderboardLastFetch = now; // Update timestamp to prevent infinite retries
                this.leaderboardFetchState = 'error';
            }
        } catch (error) {
            clearTimeout(timeoutId);
            // Always update timestamp on error to prevent infinite retries
            this.leaderboardLastFetch = now;
            
            if (error.name === 'AbortError') {
                // Timeout occurred
                this.leaderboardFetchState = 'timeout';
            } else {
                // Other error (network, CORS, etc.)
                this.leaderboardFetchState = 'error';
            }
        }
    }

    /**
     * Draw global leaderboard on main menu
     */
    draw(ctx) {
        const scale = this.getUIScale();
        const leaderboardFontSize = Math.max(9, 11 * scale);
        const titleFontSize = Math.max(11, 13 * scale);
        const rightX = this.canvas.width - 30 * scale; // Right side with padding
        const startY = 100 * scale; // Position near top, below username box

        // Leaderboard title
        ctx.font = `bold ${titleFontSize}px "Roboto Mono", monospace`;
        ctx.textAlign = 'right';
        ctx.fillStyle = 'rgba(255, 215, 0, 0.9)';
        ctx.fillText('Global Leaderboard', rightX, startY);

        // Check fetch state and show appropriate message
        const now = Date.now();
        const timeSinceFetchStart = now - this.leaderboardFetchStartTime;
        const timeSinceLastFetch = now - this.leaderboardLastFetch;
        const showTimeoutMessage = (this.leaderboardFetchState === 'timeout' || this.leaderboardFetchState === 'error') || 
                                   (this.leaderboardFetchState === 'loading' && timeSinceFetchStart >= 10000);

        if (this.leaderboard.length === 0 || showTimeoutMessage) {
            ctx.font = `${leaderboardFontSize}px "Roboto Mono", monospace`;
            
            if (showTimeoutMessage) {
                // Show timeout/error message
                ctx.textAlign = 'right';
                ctx.fillStyle = 'rgba(255, 152, 0, 0.9)';
                ctx.fillText('Highscore server wasn\'t reached', rightX, startY + 20 * scale);
                
                // Calculate retry countdown
                const retryInSeconds = Math.ceil((this.leaderboardFetchInterval - timeSinceLastFetch) / 1000);
                if (retryInSeconds > 0 && retryInSeconds < this.leaderboardFetchInterval / 1000) {
                    ctx.fillStyle = 'rgba(158, 158, 158, 0.7)';
                    ctx.font = `${Math.max(8, 9 * scale)}px "Roboto Mono", monospace`;
                    ctx.fillText(`Retrying in ${retryInSeconds}s...`, rightX, startY + 35 * scale);
                    ctx.font = `${leaderboardFontSize}px "Roboto Mono", monospace`;
                }
                
                // Show local high score as fallback
                if (gameState.highScore > 0) {
                    ctx.fillStyle = 'rgba(158, 158, 158, 0.6)';
                    const localScoreY = retryInSeconds > 0 && retryInSeconds < this.leaderboardFetchInterval / 1000 
                        ? startY + 50 * scale 
                        : startY + 35 * scale;
                    ctx.fillText(`Local High Score: ${gameState.highScore.toLocaleString()}`, rightX, localScoreY);
                }
            } else if (this.leaderboardFetchState === 'success') {
                // Successfully loaded but empty - show "Nobody yet!"
                ctx.textAlign = 'right';
                ctx.fillStyle = 'rgba(158, 158, 158, 0.7)';
                ctx.fillText('Nobody yet!', rightX, startY + 20 * scale);
                ctx.font = `${Math.max(8, 9 * scale)}px "Roboto Mono", monospace`;
                ctx.fillStyle = 'rgba(158, 158, 158, 0.5)';
                ctx.fillText('Be the first to set a score!', rightX, startY + 35 * scale);
                ctx.font = `${leaderboardFontSize}px "Roboto Mono", monospace`;
            } else {
                // Show loading state
                ctx.textAlign = 'right';
                ctx.fillStyle = 'rgba(158, 158, 158, 0.5)';
                ctx.fillText('Loading leaderboard...', rightX, startY + 20 * scale);
            }
            return;
        }

        // Header row with column labels
        const headerY = startY + 25 * scale; // Position below title
        const leftX = rightX - 280 * scale;
        const headerFontSize = Math.max(8, 9 * scale);
        
        ctx.font = `bold ${headerFontSize}px "Roboto Mono", monospace`;
        ctx.fillStyle = 'rgba(255, 215, 0, 0.6)';
        
        // Rank header (left-aligned)
        ctx.textAlign = 'left';
        ctx.fillText('Rank', leftX, headerY);
        
        // Name header (left-aligned, after rank)
        ctx.fillText('Name', leftX + 40 * scale, headerY);
        
        // Multi header (left-aligned, closer to name, before score)
        ctx.fillText('Multi', leftX + 150 * scale, headerY);
        
        // Score header (right-aligned)
        ctx.textAlign = 'right';
        ctx.fillText('Score', rightX - 50 * scale, headerY);
        
        // Wave header (right-aligned, rightmost)
        ctx.fillText('Wave', rightX, headerY);
        
        // Divider line under header
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(leftX, headerY + 8 * scale);
        ctx.lineTo(rightX, headerY + 8 * scale);
        ctx.stroke();

        // Leaderboard entries (top 10)
        ctx.font = `${leaderboardFontSize}px "Roboto Mono", monospace`;
        const entryHeight = (leaderboardFontSize + 4) * scale;
        const maxEntries = Math.min(10, this.leaderboard.length);
        const firstEntryY = headerY + 15 * scale; // Start entries below header

        for (let i = 0; i < maxEntries; i++) {
            const entry = this.leaderboard[i];
            const y = firstEntryY + i * entryHeight;
            const isPlayerEntry = entry.username === gameState.username;
            const isMultiplayer = entry.isMultiplayer === true;

            // Define left starting position
            const leftX = rightX - 280 * scale;
            
            // Highlight player's own score
            if (isPlayerEntry) {
                ctx.fillStyle = 'rgba(255, 152, 0, 0.3)';
                ctx.fillRect(leftX, y - entryHeight / 2, 280 * scale, entryHeight);
            }

            // Rank (LEFT-ALIGNED, leftmost position)
            ctx.textAlign = 'left';
            ctx.fillStyle = isPlayerEntry ? '#ff9800' : 'rgba(255, 255, 255, 0.7)';
            ctx.fillText(`#${i + 1}`, leftX, y);
            
            // Username (LEFT-ALIGNED, after rank, with scrolling animation for long names)
            const fullUsername = entry.username || 'Survivor';
            const usernameStartX = leftX + 40 * scale; // Position after rank number
            const maxUsernameWidth = isMultiplayer ? 110 * scale : 130 * scale; // Adjust for MP icon
            
            // Measure full username width
            ctx.fillStyle = isPlayerEntry ? '#ff9800' : 'rgba(255, 255, 255, 0.7)';
            const fullUsernameWidth = ctx.measureText(fullUsername).width;
            
            // If username is too long, implement scrolling animation
            if (fullUsernameWidth > maxUsernameWidth) {
                // Initialize scroll state for this username if not exists
                if (!this.usernameScrollOffsets[fullUsername]) {
                    this.usernameScrollOffsets[fullUsername] = {
                        offset: 0,
                        pauseUntil: Date.now() + this.pauseDuration
                    };
                }
                
                const scrollState = this.usernameScrollOffsets[fullUsername];
                const now = Date.now();
                
                // Check if we're in pause state
                if (now < scrollState.pauseUntil) {
                    // Paused at beginning - show from start
                    scrollState.offset = 0;
                } else {
                    // Scroll the text
                    const deltaTime = 16.67 / 1000; // Approximate frame time
                    scrollState.offset += this.scrollSpeed * deltaTime;
                    
                    // If scrolled past the end, reset to beginning and pause
                    if (scrollState.offset > fullUsernameWidth) {
                        scrollState.offset = 0;
                        scrollState.pauseUntil = now + this.pauseDuration;
                    }
                }
                
                // Create clipping region for username
                ctx.save();
                ctx.beginPath();
                ctx.rect(usernameStartX, y - entryHeight / 2, maxUsernameWidth, entryHeight);
                ctx.clip();
                
                // Draw scrolling username (LEFT-ALIGNED)
                ctx.textAlign = 'left';
                ctx.fillText(fullUsername, usernameStartX - scrollState.offset, y);
                
                ctx.restore();
            } else {
                // Username fits - display normally (LEFT-ALIGNED)
                ctx.textAlign = 'left';
                ctx.fillText(fullUsername, usernameStartX, y);
            }

            // Multiplayer indicator (if applicable, right after username)
            if (isMultiplayer) {
                ctx.textAlign = 'left';
                const mpX = usernameStartX + maxUsernameWidth + 5 * scale; // Position after username
                // Larger font size and bold weight for better visibility
                const mpFontSize = Math.max(11, 12 * scale);
                ctx.font = `bold ${mpFontSize}px "Roboto Mono", monospace`;
                // Full opacity for maximum clarity
                ctx.fillStyle = 'rgba(0, 255, 200, 1.0)';
                // Add subtle stroke for better definition
                ctx.strokeStyle = 'rgba(0, 200, 150, 0.6)';
                ctx.lineWidth = 1;
                ctx.lineJoin = 'round';
                // Draw stroke first, then fill for crisp edges
                ctx.strokeText('MP', mpX, y);
                ctx.fillText('MP', mpX, y);
                // Reset font to leaderboard size
                ctx.font = `${leaderboardFontSize}px "Roboto Mono", monospace`;
            }

            // Score (right-aligned, next to wave)
            ctx.textAlign = 'right';
            ctx.fillStyle = isPlayerEntry ? '#ff9800' : 'rgba(255, 215, 0, 0.8)';
            const score = entry.score || 0;
            ctx.fillText(score.toLocaleString(), rightX - 50 * scale, y);

            // Wave (rightmost, smaller font)
            ctx.textAlign = 'right';
            ctx.fillStyle = 'rgba(158, 158, 158, 0.6)';
            ctx.font = `${Math.max(8, 9 * scale)}px "Roboto Mono", monospace`;
            const wave = entry.wave || 0;
            ctx.fillText(`Wave ${wave}`, rightX, y);
            ctx.font = `${leaderboardFontSize}px "Roboto Mono", monospace`;
        }

        // Reset text alignment
        ctx.textAlign = 'center';
    }

    /**
     * Refresh server cache from MongoDB and update leaderboard
     * Call this from browser console: window.gameHUD?.leaderboardDisplay?.refresh()
     */
    async refresh() {
        try {
            // Refresh server cache from MongoDB
            const refreshResponse = await fetch(`${SERVER_URL}/api/highscores/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            
            if (!refreshResponse.ok) {
                console.error('[LeaderboardDisplay] Failed to refresh server cache');
            }
        } catch (error) {
            console.error('[LeaderboardDisplay] Error refreshing server cache:', error);
        }
        
        // Reset fetch state and fetch fresh data
        this.leaderboardLastFetch = 0;
        this.leaderboardFetchState = 'loading';
        this.leaderboard = [];
        await this.fetch();
    }

    /**
     * Fully reset the leaderboard - clears server cache and database
     * Call this from browser console: window.gameHUD?.leaderboardDisplay?.reset()
     * WARNING: This will delete all leaderboard entries!
     */
    async reset() {
        console.warn('[LeaderboardDisplay] FULL RESET - This will clear all leaderboard data!');
        
        try {
            // Clear server cache and database
            const clearResponse = await fetch(`${SERVER_URL}/api/highscores/clear`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ clearDatabase: true })
            });
            
            if (!clearResponse.ok) {
                console.error('[LeaderboardDisplay] Failed to clear server data');
            }
        } catch (error) {
            console.error('[LeaderboardDisplay] Error clearing server data:', error);
        }
        
        // Clear client-side state
        this.leaderboard = [];
        this.leaderboardLastFetch = 0;
        this.leaderboardFetchState = 'loading';
        
        // Fetch fresh (empty) data
        await this.fetch();
    }
}

