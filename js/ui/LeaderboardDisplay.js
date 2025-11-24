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
                console.log('[LeaderboardDisplay] Leaderboard fetch timed out after 10 seconds');
            } else {
                // Other error (network, CORS, etc.)
                this.leaderboardFetchState = 'error';
                console.log('[LeaderboardDisplay] Could not fetch leaderboard:', error);
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

        // Leaderboard entries (top 10)
        ctx.font = `${leaderboardFontSize}px "Roboto Mono", monospace`;
        const entryHeight = (leaderboardFontSize + 4) * scale;
        const maxEntries = Math.min(10, this.leaderboard.length);

        for (let i = 0; i < maxEntries; i++) {
            const entry = this.leaderboard[i];
            const y = startY + (i + 1.5) * entryHeight;
            const isPlayerEntry = entry.username === gameState.username;
            const isMultiplayer = entry.isMultiplayer === true;

            // Highlight player's own score
            if (isPlayerEntry) {
                ctx.fillStyle = 'rgba(255, 152, 0, 0.3)';
                ctx.fillRect(rightX - 280 * scale, y - entryHeight / 2, 280 * scale, entryHeight);
            }

            // Wave (rightmost, smaller font)
            ctx.textAlign = 'right';
            ctx.fillStyle = 'rgba(158, 158, 158, 0.6)';
            ctx.font = `${Math.max(8, 9 * scale)}px "Roboto Mono", monospace`;
            const wave = entry.wave || 0;
            ctx.fillText(`Wave ${wave}`, rightX, y);
            ctx.font = `${leaderboardFontSize}px "Roboto Mono", monospace`;

            // Score (right-aligned, next to wave)
            ctx.textAlign = 'right';
            ctx.fillStyle = isPlayerEntry ? '#ff9800' : 'rgba(255, 215, 0, 0.8)';
            const score = entry.score || 0;
            ctx.fillText(score.toLocaleString(), rightX - 50 * scale, y);

            // Username (right-aligned, truncated if needed)
            ctx.textAlign = 'right';
            const username = entry.username && entry.username.length > 12 ? entry.username.substring(0, 12) + '...' : (entry.username || 'Survivor');
            ctx.fillStyle = isPlayerEntry ? '#ff9800' : 'rgba(255, 255, 255, 0.7)';
            const usernameX = isMultiplayer ? rightX - 150 * scale : rightX - 130 * scale;
            ctx.fillText(username, usernameX, y);

            // Multiplayer indicator (if applicable, right after username)
            if (isMultiplayer) {
                ctx.textAlign = 'right';
                // Larger font size and bold weight for better visibility and pixel density
                const mpFontSize = Math.max(11, 12 * scale);
                ctx.font = `bold ${mpFontSize}px "Roboto Mono", monospace`;
                // Full opacity for maximum clarity
                ctx.fillStyle = 'rgba(0, 255, 200, 1.0)';
                // Add subtle stroke for better definition and pixel density
                ctx.strokeStyle = 'rgba(0, 200, 150, 0.6)';
                ctx.lineWidth = 1;
                ctx.lineJoin = 'round';
                // Draw stroke first, then fill for crisp edges
                ctx.strokeText('MP', rightX - 135 * scale, y);
                ctx.fillText('MP', rightX - 135 * scale, y);
                // Reset font to leaderboard size
                ctx.font = `${leaderboardFontSize}px "Roboto Mono", monospace`;
            }

            // Rank (right-aligned, leftmost)
            ctx.fillStyle = isPlayerEntry ? '#ff9800' : 'rgba(255, 255, 255, 0.7)';
            ctx.fillText(`#${i + 1}`, rightX - 200 * scale, y);
        }

        // Reset text alignment
        ctx.textAlign = 'center';
    }

    /**
     * Refresh server cache from MongoDB and update leaderboard
     * Call this from browser console: window.gameHUD?.leaderboardDisplay?.refresh()
     */
    async refresh() {
        console.log('[LeaderboardDisplay] Refreshing server cache from MongoDB...');
        
        try {
            // Refresh server cache from MongoDB
            const refreshResponse = await fetch(`${SERVER_URL}/api/highscores/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            
            if (refreshResponse.ok) {
                const refreshData = await refreshResponse.json();
                console.log(`[LeaderboardDisplay] Server cache refreshed: ${refreshData.count} entries`);
            } else {
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
        
        console.log(`[LeaderboardDisplay] Refresh complete. Entries: ${this.leaderboard.length}`);
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
            
            if (clearResponse.ok) {
                const clearData = await clearResponse.json();
                console.log('[LeaderboardDisplay] Server cache and database cleared:', clearData);
            } else {
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
        
        console.log('[LeaderboardDisplay] Full reset complete. Leaderboard is now empty.');
    }
}

