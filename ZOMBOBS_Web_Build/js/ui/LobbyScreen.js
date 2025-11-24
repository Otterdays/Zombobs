import { gameState } from '../core/gameState.js';
import { settingsManager } from '../systems/SettingsManager.js';
import { LeaderboardDisplay } from './LeaderboardDisplay.js';

export class LobbyScreen {
    constructor(canvas, ctx, hud) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.hud = hud;
        this.hoveredButton = null;
        this.lobbyEnterTime = null;
        this.lastLobbyState = false;
    }

    getUIScale() {
        return this.hud.getUIScale();
    }

    draw() {
        // Validate canvas dimensions
        if (!this.canvas || !Number.isFinite(this.canvas.width) || !Number.isFinite(this.canvas.height) || 
            this.canvas.width <= 0 || this.canvas.height <= 0) {
            console.warn('drawLobby: Invalid canvas dimensions', { 
                width: this.canvas?.width, 
                height: this.canvas?.height 
            });
            return;
        }
        
        // Track lobby entry time for fade-in animations
        if (this.lastLobbyState !== gameState.showLobby) {
            if (gameState.showLobby) {
                this.lobbyEnterTime = Date.now();
            } else {
                this.lobbyEnterTime = null;
            }
            this.lastLobbyState = gameState.showLobby;
        }
        
        // Draw animated background
        this.drawLobbyBackground();

        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;

        // Title with enhanced effects
        const lobbyScale = this.getUIScale();
        this.ctx.font = `bold ${Math.max(36, 40 * lobbyScale)}px "Creepster", cursive`;
        this.ctx.textAlign = 'center';
        this.ctx.fillStyle = '#ff1744';
        this.ctx.shadowBlur = 25 * lobbyScale;
        this.ctx.shadowColor = 'rgba(255, 23, 68, 0.9)';
        this.ctx.fillText('MULTIPLAYER LOBBY', centerX, 60 * lobbyScale);
        this.ctx.shadowBlur = 0;

        // --- COUNTDOWN OVERLAY ---
        if (gameState.multiplayer.isGameStarting) {
            const timeLeft = Math.max(0, Math.ceil((gameState.multiplayer.gameStartTime - Date.now()) / 1000));

            // Enhanced dimming overlay with red tint
            const overlayGradient = this.ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, this.canvas.height);
            overlayGradient.addColorStop(0, 'rgba(255, 23, 68, 0.3)');
            overlayGradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.8)');
            overlayGradient.addColorStop(1, 'rgba(0, 0, 0, 0.9)');
            this.ctx.fillStyle = overlayGradient;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

            // Enhanced countdown number with stronger effects
            const pulse = 0.8 + Math.sin(Date.now() * 0.02) * 0.2;
            const countdownFontSize = Math.max(80, 140 * lobbyScale);
            this.ctx.font = `bold ${countdownFontSize}px "Roboto Mono", monospace`;
            this.ctx.fillStyle = '#ff1744';
            this.ctx.shadowBlur = 60 * pulse * lobbyScale;
            this.ctx.shadowColor = '#ff0000';
            this.ctx.fillText(timeLeft > 0 ? timeLeft : 'GO!', centerX, centerY);
            this.ctx.shadowBlur = 0;

            // Enhanced "DEPLOYING" text
            const deployingFontSize = Math.max(24, 36 * lobbyScale);
            this.ctx.font = `bold ${deployingFontSize}px "Roboto Mono", monospace`;
            this.ctx.fillStyle = '#ffffff';
            this.ctx.shadowBlur = 20;
            this.ctx.shadowColor = 'rgba(255, 23, 68, 0.8)';
            this.ctx.fillText('DEPLOYING...', centerX, centerY + 100);
            this.ctx.shadowBlur = 0;

            // Don't draw interactive elements during countdown
            return;
        }

        const players = Array.isArray(gameState.multiplayer.players) ? gameState.multiplayer.players : [];
        const scale = lobbyScale;

        // Layout: Three-column design
        // Left: Connection status panel
        // Center: Player cards
        // Right: Lobby info panel

        const leftPanelX = 30 * scale;
        const rightPanelX = this.canvas.width - (230 * scale);
        const topY = 110 * scale;

        // Left panel: Connection status
        this.drawConnectionStatusPanel(leftPanelX, topY);

        // Right panel: Lobby info
        this.drawLobbyInfoPanel(rightPanelX, topY, players.length);

        // Chat window (bottom left)
        this.drawChatWindow();

        // Center: Player cards (responsive layout)
        const cardSpacing = 15 * scale;
        const cardsPerRow = Math.min(2, Math.floor((this.canvas.width - 500 * scale) / (240 * scale))); // Responsive: 2 cards max
        const cardWidth = 220 * scale;
        const cardHeight = 75 * scale;
        
        // Validate calculated dimensions
        if (!Number.isFinite(cardWidth) || !Number.isFinite(cardHeight) || cardWidth <= 0 || cardHeight <= 0) {
            console.warn('drawLobby: Invalid card dimensions', { cardWidth, cardHeight, scale });
            return;
        }
        
        // Calculate total width of card area and center it
        const totalCardsWidth = Math.min(players.length, cardsPerRow) * cardWidth + (Math.min(players.length, cardsPerRow) - 1) * cardSpacing;
        const cardStartX = centerX - totalCardsWidth / 2;
        const cardStartY = topY;
        
        // Validate calculated positions
        if (!Number.isFinite(cardStartX) || !Number.isFinite(cardStartY)) {
            console.warn('drawLobby: Invalid card positions', { cardStartX, cardStartY, centerX, topY });
            return;
        }

        if (players.length === 0) {
            // Empty state
            const emptyWidth = cardWidth * 2 + cardSpacing;
            const emptyX = centerX - emptyWidth / 2;
            this.hud.drawGlassCard(emptyX, cardStartY, emptyWidth, cardHeight);
            this.ctx.fillStyle = '#9e9e9e';
            this.ctx.font = `${Math.max(12, 14 * scale)}px "Roboto Mono", monospace`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText('Waiting for players to join...', centerX, cardStartY + cardHeight / 2);
        } else {
            // Draw player cards in grid
            players.forEach((player, index) => {
                const row = Math.floor(index / cardsPerRow);
                const col = index % cardsPerRow;
                const cardX = cardStartX + col * (cardWidth + cardSpacing);
                const cardY = cardStartY + row * (cardHeight + cardSpacing);
                const isLocalPlayer = player?.id === gameState.multiplayer.playerId;
                
                this.drawPlayerCard(cardX, cardY, player, index, isLocalPlayer);
            });
        }

        // Bottom: Action buttons
        const buttonWidth = 180 * scale;  // Reduced from 200
        const buttonHeight = 40 * scale;  // Reduced from 45
        const buttonsDisabled = gameState.multiplayer.isGameStarting;

        if (gameState.multiplayer.connected) {
            const isLeader = gameState.multiplayer.isLeader;
            const allReady = players.length > 0 && players.every(p => p.isReady);

            if (isLeader) {
                // Leader: Ready, Start Game, Back
                const readyY = this.canvas.height - 150 * scale;
                const startY = this.canvas.height - 100 * scale;
                const backY = this.canvas.height - 50 * scale;

                const canStart = allReady && players.length > 0 && !buttonsDisabled;
                
                // Draw status text above Ready button
                if (!canStart && !buttonsDisabled) {
                    this.ctx.font = `${Math.max(10, 11 * scale)}px "Roboto Mono", monospace`;
                    this.ctx.fillStyle = '#ff9800';
                    this.ctx.textAlign = 'center';
                    this.ctx.fillText('Waiting for all players to be ready...', centerX, readyY - 25 * scale);
                }

                const readyText = gameState.multiplayer.isReady ? 'Unready' : 'Ready';
                this.drawLobbyButton(readyText, centerX - buttonWidth / 2, readyY, buttonWidth, buttonHeight, 
                    this.hoveredButton === 'lobby_ready', buttonsDisabled);

                this.drawLobbyButton('Start Game', centerX - buttonWidth / 2, startY, buttonWidth, buttonHeight, 
                    this.hoveredButton === 'lobby_start', !canStart, canStart);

                this.drawLobbyButton('Back', centerX - buttonWidth / 2, backY, buttonWidth, buttonHeight, 
                    this.hoveredButton === 'lobby_back', buttonsDisabled);
            } else {
                // Non-leader: Ready, Back
                const readyY = this.canvas.height - 120 * lobbyScale;
                const backY = this.canvas.height - 70 * lobbyScale;

                const readyText = gameState.multiplayer.isReady ? 'Unready' : 'Ready';
                this.drawLobbyButton(readyText, centerX - buttonWidth / 2, readyY, buttonWidth, buttonHeight, 
                    this.hoveredButton === 'lobby_ready', buttonsDisabled);
                this.drawLobbyButton('Back', centerX - buttonWidth / 2, backY, buttonWidth, buttonHeight, 
                    this.hoveredButton === 'lobby_back', buttonsDisabled);
            }
        } else {
            // Not connected - just Back button
            const backY = this.canvas.height - 100 * lobbyScale;
            this.drawLobbyButton('Back', centerX - buttonWidth / 2, backY, buttonWidth, buttonHeight, 
                this.hoveredButton === 'lobby_back', false);
        }
    }

    drawLobbyBackground() {
        const time = Date.now();
        
        // Base gradient background
        const bgGradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        bgGradient.addColorStop(0, '#02040a');
        bgGradient.addColorStop(1, '#051b1f');
        this.ctx.fillStyle = bgGradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Pulsing red gradient center (subtle)
        const pulseSpeed = 0.0015;
        const pulseSize = 0.4 + Math.sin(time * pulseSpeed) * 0.08;
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;

        const pulseGradient = this.ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, this.canvas.height * pulseSize);
        pulseGradient.addColorStop(0, 'rgba(255, 23, 68, 0.15)');
        pulseGradient.addColorStop(0.5, 'rgba(255, 23, 68, 0.08)');
        pulseGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

        this.ctx.fillStyle = pulseGradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Animated grid pattern (subtle)
        this.ctx.strokeStyle = 'rgba(255, 23, 68, 0.05)';
        this.ctx.lineWidth = 1;
        const gridSize = 50;
        const offset = (time * 0.05) % gridSize;
        
        this.ctx.beginPath();
        for (let x = -offset; x < this.canvas.width + gridSize; x += gridSize) {
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
        }
        for (let y = -offset; y < this.canvas.height + gridSize; y += gridSize) {
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
        }
        this.ctx.stroke();

        // Scanlines
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        for (let i = 0; i < this.canvas.height; i += 4) {
            this.ctx.fillRect(0, i, this.canvas.width, 1);
        }

        // Subtle noise overlay
        const noiseAmount = 500;
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
        for (let i = 0; i < noiseAmount; i++) {
            const x = Math.random() * this.canvas.width;
            const y = Math.random() * this.canvas.height;
            const size = Math.random() * 1.5 + 0.5;
            this.ctx.fillRect(x, y, size, size);
        }

        // Vignette
        const vignette = this.ctx.createRadialGradient(centerX, centerY, this.canvas.height * 0.4, centerX, centerY, this.canvas.height * 0.7);
        vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
        vignette.addColorStop(1, 'rgba(0, 0, 0, 0.6)');
        this.ctx.fillStyle = vignette;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawLobbyInfoPanel(x, y, playerCount) {
        const scale = this.getUIScale();
        const panelWidth = 200 * scale;  // Reduced from 250
        const panelHeight = 80 * scale;  // Reduced from 100
        
        // Fade-in animation
        let alpha = 1.0;
        if (this.lobbyEnterTime) {
            const fadeDuration = 400;
            const elapsed = Date.now() - this.lobbyEnterTime;
            if (elapsed < fadeDuration) {
                alpha = Math.min(1.0, elapsed / fadeDuration);
            }
        }
        
        this.ctx.save();
        this.ctx.globalAlpha = alpha;
        
        this.hud.drawGlassCard(x, y, panelWidth, panelHeight);

        const padding = 12 * scale;  // Reduced from 15

        // Title
        this.ctx.fillStyle = '#f5f5f5';
        this.ctx.font = `bold ${Math.max(11, 12 * scale)}px "Roboto Mono", monospace`;
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'top';
        this.ctx.fillText('LOBBY INFO', x + padding, y + padding);

        // Player count
        const countY = y + padding + 20 * scale;
        this.ctx.fillStyle = '#ff1744';
        this.ctx.font = `bold ${Math.max(24, 28 * scale)}px "Roboto Mono", monospace`;
        this.ctx.fillText(playerCount.toString(), x + padding, countY);

        this.ctx.fillStyle = '#9e9e9e';
        this.ctx.font = `${Math.max(10, 11 * scale)}px "Roboto Mono", monospace`;
        this.ctx.fillText('Players Online', x + padding, countY + 28 * scale);
        
        this.ctx.restore();
    }

    drawLobbyButton(text, x, y, width, height, hovered, disabled, isSpecial = false) {
        const time = Date.now();
        const pulse = 0.5 + Math.sin(time * 0.008) * 0.3;

        // Pill shape with rounded corners
        const radius = height / 2;

        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.moveTo(x + radius, y);
        this.ctx.lineTo(x + width - radius, y);
        this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        this.ctx.lineTo(x + width, y + height - radius);
        this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        this.ctx.lineTo(x + radius, y + height);
        this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        this.ctx.lineTo(x, y + radius);
        this.ctx.quadraticCurveTo(x, y, x + radius, y);
        this.ctx.closePath();

        if (disabled) {
            // Disabled state
            const disabledGradient = this.ctx.createLinearGradient(x, y, x, y + height);
            disabledGradient.addColorStop(0, 'rgba(51, 51, 51, 0.6)');
            disabledGradient.addColorStop(1, 'rgba(26, 26, 26, 0.6)');
            this.ctx.fillStyle = disabledGradient;
            this.ctx.fill();
            this.ctx.strokeStyle = '#666666';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
        } else if (hovered || isSpecial) {
            // Hovered or special state (all ready) - gradient with glow
            const gradient = this.ctx.createLinearGradient(x, y, x, y + height);
            gradient.addColorStop(0, '#ff5252');
            gradient.addColorStop(1, '#ff1744');
            this.ctx.fillStyle = gradient;
            this.ctx.fill();

            // Glow effect
            if (isSpecial) {
                this.ctx.shadowBlur = 20 * pulse;
                this.ctx.shadowColor = 'rgba(255, 23, 68, 0.8)';
            } else {
                this.ctx.shadowBlur = 15;
                this.ctx.shadowColor = 'rgba(255, 23, 68, 0.6)';
            }
            this.ctx.strokeStyle = '#ff1744';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
            this.ctx.shadowBlur = 0;
        } else {
            // Default state
            const defaultGradient = this.ctx.createLinearGradient(x, y, x, y + height);
            defaultGradient.addColorStop(0, 'rgba(255, 23, 68, 0.2)');
            defaultGradient.addColorStop(1, 'rgba(255, 23, 68, 0.15)');
            this.ctx.fillStyle = defaultGradient;
            this.ctx.fill();
            this.ctx.strokeStyle = '#ff1744';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
        }

        this.ctx.restore();

        // Text
        const scale = this.getUIScale();
        this.ctx.fillStyle = disabled ? '#888888' : '#ffffff';
        this.ctx.font = `bold ${Math.max(12, 14 * scale)}px "Roboto Mono", monospace`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(text, x + width / 2, y + height / 2);
    }

    drawPlayerCard(x, y, player, index, isLocalPlayer) {
        // Validate input parameters
        if (!player || !Number.isFinite(x) || !Number.isFinite(y)) {
            console.warn('drawPlayerCard: Invalid parameters', { x, y, player });
            return;
        }
        
        const scale = this.getUIScale();
        const cardWidth = 220 * scale;  // Reduced from 280
        const cardHeight = 75 * scale;  // Reduced from 100
        const padding = 12 * scale;     // Reduced from 15
        
        // Validate calculated dimensions
        if (!Number.isFinite(cardWidth) || !Number.isFinite(cardHeight) || cardWidth <= 0 || cardHeight <= 0) {
            console.warn('drawPlayerCard: Invalid card dimensions', { cardWidth, cardHeight, scale });
            return;
        }
        
        // Fade-in animation
        let alpha = 1.0;
        if (this.lobbyEnterTime) {
            const fadeDuration = 300; // 300ms fade-in
            const elapsed = Date.now() - this.lobbyEnterTime;
            const delay = index * 100; // Stagger cards by 100ms each
            if (elapsed < delay + fadeDuration) {
                alpha = Math.min(1.0, Math.max(0, (elapsed - delay) / fadeDuration));
            }
        }
        
        this.ctx.save();
        this.ctx.globalAlpha = alpha;
        
        // Card background with glassmorphism
        this.hud.drawGlassCard(x, y, cardWidth, cardHeight, isLocalPlayer);

        // Local player highlight (green glow border)
        if (isLocalPlayer) {
            this.ctx.strokeStyle = '#76ff03';
            this.ctx.lineWidth = 2;
            this.ctx.shadowBlur = 10;
            this.ctx.shadowColor = 'rgba(118, 255, 3, 0.6)';
            this.ctx.strokeRect(x, y, cardWidth, cardHeight);
            this.ctx.shadowBlur = 0;
        }

        // Avatar placeholder (circular, colored by index)
        const avatarSize = 40 * scale;  // Reduced from 50
        const avatarX = x + padding;
        const avatarY = y + padding;
        const avatarColors = ['#ff1744', '#ff5252', '#76ff03', '#ffc107', '#2196f3', '#9c27b0'];
        const avatarColor = avatarColors[index % avatarColors.length];

        // Avatar circle
        this.ctx.fillStyle = avatarColor;
        this.ctx.beginPath();
        this.ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
        this.ctx.fill();

        // Avatar border
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();

        // Player initial in avatar
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = `bold ${Math.max(12, 16 * scale)}px "Roboto Mono", monospace`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        const initial = (player?.name || 'P')[0].toUpperCase();
        this.ctx.fillText(initial, avatarX + avatarSize / 2, avatarY + avatarSize / 2);

        // Player name
        const nameX = avatarX + avatarSize + padding;
        const nameY = avatarY + 12 * scale;
        this.ctx.fillStyle = isLocalPlayer ? '#76ff03' : '#f5f5f5';
        this.ctx.font = `bold ${Math.max(12, 14 * scale)}px "Roboto Mono", monospace`;
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'top';
        const playerName = player?.name || `Player ${index + 1}`;
        this.ctx.fillText(playerName, nameX, nameY);

        // Rank badge display
        if (player?.rank) {
            const rankName = player.rank.rankName || 'Private';
            const rankTier = player.rank.rankTier || 1;
            const rankText = `${rankName} T${rankTier}`;
            const rankX = nameX;
            const rankY = nameY + 18 * scale;
            
            // Rank badge background (orange/amber color)
            const rankBadgeWidth = this.ctx.measureText(rankText).width + 8 * scale;
            const rankBadgeHeight = 14 * scale;
            this.ctx.fillStyle = 'rgba(255, 152, 0, 0.2)';
            this.ctx.fillRect(rankX, rankY, rankBadgeWidth, rankBadgeHeight);
            
            // Rank badge text
            this.ctx.fillStyle = '#ff9800';
            this.ctx.font = `${Math.max(9, 10 * scale)}px "Roboto Mono", monospace`;
            this.ctx.textAlign = 'left';
            this.ctx.textBaseline = 'top';
            this.ctx.fillText(rankText, rankX + 4 * scale, rankY + 2 * scale);
        }

        // Leader indicator - positioned above center of username
        if (player?.isLeader) {
            const playerNameWidth = this.ctx.measureText(playerName).width;
            const leaderX = nameX + (playerNameWidth / 2); // Center of username
            const crownSize = 20 * scale; // Bigger crown (was 14 * scale)
            const leaderY = nameY - crownSize + 8 * scale; // Moved down more (was +2, now +8)
            this.drawStatusIndicator(leaderX, leaderY, 'leader', true, crownSize);
        }

        // Player ID badge (moved down to make room for rank)
        const idSuffix = player?.id ? player.id.slice(-4) : '----';
        const idY = player?.rank ? nameY + 34 * scale : nameY + 18 * scale;
        this.ctx.fillStyle = '#9e9e9e';
        this.ctx.font = `${Math.max(9, 10 * scale)}px "Roboto Mono", monospace`;
        this.ctx.fillText(`#${idSuffix}`, nameX, idY);

        // Ready status indicator
        const isReady = player?.isReady || false;
        const statusX = x + cardWidth - padding - 20 * scale;
        const statusY = y + cardHeight / 2 + 4 * scale; // Moved down a smidge
        this.drawStatusIndicator(statusX, statusY, isReady ? 'ready' : 'notReady', true, 16 * scale);

        // Ready status text
        this.ctx.fillStyle = isReady ? '#76ff03' : '#ff9800';
        this.ctx.font = `${Math.max(9, 10 * scale)}px "Roboto Mono", monospace`;
        this.ctx.textAlign = 'right';
        this.ctx.textBaseline = 'middle';
        const statusText = isReady ? 'READY' : 'NOT READY';
        this.ctx.fillText(statusText, x + cardWidth - padding, statusY + 24 * scale);
        
        this.ctx.restore();
    }

    drawStatusIndicator(x, y, type, isActive, size = 20) {
        const time = Date.now();
        const pulse = isActive ? 0.5 + Math.sin(time * 0.01) * 0.3 : 1.0;
        
        this.ctx.save();
        this.ctx.translate(x, y);

        if (type === 'ready') {
            // Animated checkmark
            this.ctx.strokeStyle = isActive ? '#76ff03' : '#9e9e9e';
            this.ctx.lineWidth = 3;
            this.ctx.lineCap = 'round';
            this.ctx.lineJoin = 'round';
            
            if (isActive) {
                this.ctx.shadowBlur = 10 * pulse;
                this.ctx.shadowColor = 'rgba(118, 255, 3, 0.8)';
            }
            
            this.ctx.beginPath();
            this.ctx.moveTo(-size * 0.4, 0);
            this.ctx.lineTo(-size * 0.1, size * 0.3);
            this.ctx.lineTo(size * 0.4, -size * 0.3);
            this.ctx.stroke();
            
        } else if (type === 'notReady') {
            // Animated X
            this.ctx.strokeStyle = isActive ? '#ff9800' : '#9e9e9e';
            this.ctx.lineWidth = 3;
            this.ctx.lineCap = 'round';
            
            if (isActive) {
                this.ctx.shadowBlur = 8;
                this.ctx.shadowColor = 'rgba(255, 152, 0, 0.6)';
            }
            
            this.ctx.beginPath();
            this.ctx.moveTo(-size * 0.3, -size * 0.3);
            this.ctx.lineTo(size * 0.3, size * 0.3);
            this.ctx.moveTo(size * 0.3, -size * 0.3);
            this.ctx.lineTo(-size * 0.3, size * 0.3);
            this.ctx.stroke();
            
        } else if (type === 'leader') {
            // Crown icon
            this.ctx.fillStyle = '#ffc107';
            this.ctx.shadowBlur = 15 * pulse;
            this.ctx.shadowColor = 'rgba(255, 193, 7, 0.8)';
            
            this.ctx.beginPath();
            // Crown base
            this.ctx.moveTo(-size * 0.5, size * 0.2);
            this.ctx.lineTo(-size * 0.3, -size * 0.2);
            this.ctx.lineTo(0, size * 0.1);
            this.ctx.lineTo(size * 0.3, -size * 0.2);
            this.ctx.lineTo(size * 0.5, size * 0.2);
            this.ctx.closePath();
            this.ctx.fill();
        }

        this.ctx.restore();
        this.ctx.shadowBlur = 0;
    }

    drawConnectionStatusPanel(x, y) {
        const scale = this.getUIScale();
        const panelWidth = 200 * scale;  // Reduced from 250
        const panelHeight = 95 * scale;  // Reduced from 120
        
        // Fade-in animation
        let alpha = 1.0;
        if (this.lobbyEnterTime) {
            const fadeDuration = 400;
            const elapsed = Date.now() - this.lobbyEnterTime;
            if (elapsed < fadeDuration) {
                alpha = Math.min(1.0, elapsed / fadeDuration);
            }
        }
        
        this.ctx.save();
        this.ctx.globalAlpha = alpha;
        
        this.hud.drawGlassCard(x, y, panelWidth, panelHeight);

        const padding = 12 * scale;  // Reduced from 15
        const time = Date.now();

        // Title
        this.ctx.fillStyle = '#f5f5f5';
        this.ctx.font = `bold ${Math.max(11, 12 * scale)}px "Roboto Mono", monospace`;
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'top';
        this.ctx.fillText('CONNECTION STATUS', x + padding, y + padding);

        const isConnected = gameState.multiplayer.connected;
        const statusY = y + padding + 20 * scale;

        // Connection indicator (animated pulsing dot)
        const dotSize = 6 * scale;  // Reduced from 8
        const dotX = x + padding;
        const dotY = statusY + 6 * scale;
        const pulse = 0.7 + Math.sin(time * 0.01) * 0.3;

        if (isConnected) {
            this.ctx.fillStyle = '#76ff03';
            this.ctx.shadowBlur = 8 * scale * pulse;
            this.ctx.shadowColor = 'rgba(118, 255, 3, 0.8)';
        } else {
            this.ctx.fillStyle = '#ff9800';
            this.ctx.shadowBlur = 6 * scale;
            this.ctx.shadowColor = 'rgba(255, 152, 0, 0.6)';
        }

        this.ctx.beginPath();
        this.ctx.arc(dotX, dotY, dotSize, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.shadowBlur = 0;

        // Status text
        this.ctx.fillStyle = isConnected ? '#76ff03' : '#ff9800';
        this.ctx.font = `${Math.max(11, 12 * scale)}px "Roboto Mono", monospace`;
        this.ctx.fillText(isConnected ? 'Connected' : 'Connecting...', dotX + dotSize * 2 + 6 * scale, statusY);

        // Player ID
        this.ctx.fillStyle = '#9e9e9e';
        this.ctx.font = `${Math.max(9, 10 * scale)}px "Roboto Mono", monospace`;
        const playerId = gameState.multiplayer.playerId || 'Unknown';
        const idSuffix = playerId.length > 8 ? playerId.slice(-8) : playerId;
        this.ctx.fillText(`ID: ${idSuffix}`, x + padding, statusY + 20 * scale);

        // Server status
        this.ctx.fillStyle = '#9e9e9e';
        this.ctx.font = `${Math.max(9, 10 * scale)}px "Roboto Mono", monospace`;
        const serverStatus = gameState.multiplayer.serverStatus || 'Unknown';
        this.ctx.fillText(`Server: ${serverStatus}`, x + padding, statusY + 32 * scale);
        
        this.ctx.restore();
    }

    drawChatWindow() {
        if (!gameState.showLobby || gameState.multiplayer.isGameStarting) return;

        const scale = this.getUIScale();
        const chatWidth = Math.min(400 * scale, this.canvas.width * 0.4);
        const chatHeight = 200 * scale;
        const padding = 20 * scale; // Small space from sides and bottom
        const chatX = padding; // Left side with spacing
        const chatY = this.canvas.height - chatHeight - padding; // Lower left with bottom spacing

        // Draw glassmorphism card
        this.hud.drawGlassCard(chatX, chatY, chatWidth, chatHeight);

        // Draw chat title
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = `bold ${Math.max(12, 14 * scale)}px "Roboto Mono", monospace`;
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'top';
        this.ctx.fillText('Chat', chatX + 10 * scale, chatY + 10 * scale);

        // Draw messages area
        const messagesAreaHeight = chatHeight - 50 * scale; // Reserve space for input
        const messagesAreaY = chatY + 30 * scale;
        this.drawChatMessages(chatX + 10 * scale, messagesAreaY, chatWidth - 20 * scale, messagesAreaHeight);

        // Draw input field
        const inputY = chatY + chatHeight - 40 * scale;
        this.drawChatInput(chatX + 10 * scale, inputY, chatWidth - 20 * scale, 30 * scale);
    }

    drawChatMessages(x, y, width, height) {
        const scale = this.getUIScale();
        const messages = gameState.multiplayer.chatMessages || [];
        const fontSize = Math.max(10, 12 * scale);
        const lineHeight = fontSize + 4 * scale;
        const maxVisibleMessages = Math.floor(height / lineHeight);

        // Clip to messages area
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.rect(x, y, width, height);
        this.ctx.clip();

        // Show last N messages (scroll to bottom)
        const startIndex = Math.max(0, messages.length - maxVisibleMessages);
        const visibleMessages = messages.slice(startIndex);

        this.ctx.font = `${fontSize}px "Roboto Mono", monospace`;
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'top';

        visibleMessages.forEach((message, index) => {
            if (!message) return;

            const messageY = y + index * lineHeight;
            const isOwnMessage = message.playerId === gameState.multiplayer.playerId;
            const isSystemMessage = message.isSystem;

            // Format message text
            let displayText = '';
            if (isSystemMessage) {
                this.ctx.fillStyle = 'rgba(158, 158, 158, 0.7)';
                this.ctx.font = `italic ${fontSize}px "Roboto Mono", monospace`;
                displayText = `[System]: ${message.message}`;
            } else {
                this.ctx.fillStyle = isOwnMessage ? 'rgba(255, 152, 0, 0.9)' : 'rgba(255, 255, 255, 0.8)';
                this.ctx.font = `${fontSize}px "Roboto Mono", monospace`;
                const playerName = message.playerName || 'Unknown';
                displayText = `${playerName}: ${message.message}`;
            }

            // Word wrap if needed
            const maxWidth = width - 10 * scale;
            const words = displayText.split(' ');
            let line = '';
            let currentY = messageY;

            words.forEach(word => {
                const testLine = line + (line ? ' ' : '') + word;
                const metrics = this.ctx.measureText(testLine);
                if (metrics.width > maxWidth && line) {
                    this.ctx.fillText(line, x, currentY);
                    line = word;
                    currentY += lineHeight;
                } else {
                    line = testLine;
                }
            });
            if (line) {
                this.ctx.fillText(line, x, currentY);
            }
        });

        this.ctx.restore();
    }

    drawChatInput(x, y, width, height) {
        const scale = this.getUIScale();
        const isFocused = gameState.multiplayer.chatFocused;
        const isDisabled = gameState.multiplayer.isGameStarting;

        // Input background
        const bgGradient = this.ctx.createLinearGradient(x, y, x, y + height);
        bgGradient.addColorStop(0, isFocused ? 'rgba(42, 42, 42, 0.95)' : 'rgba(26, 26, 26, 0.9)');
        bgGradient.addColorStop(1, isFocused ? 'rgba(26, 26, 26, 0.95)' : 'rgba(10, 10, 10, 0.9)');
        this.ctx.fillStyle = bgGradient;
        this.ctx.fillRect(x, y, width, height);

        // Border
        this.ctx.strokeStyle = isFocused ? '#ff1744' : (isDisabled ? '#666666' : '#444444');
        this.ctx.lineWidth = isFocused ? 2 : 1;
        this.ctx.strokeRect(x, y, width, height);

        // Focus glow
        if (isFocused && !isDisabled) {
            this.ctx.shadowBlur = 10;
            this.ctx.shadowColor = 'rgba(255, 23, 68, 0.4)';
            this.ctx.strokeRect(x, y, width, height);
            this.ctx.shadowBlur = 0;
        }

        // Input text
        const inputText = gameState.multiplayer.chatInput || '';
        const fontSize = Math.max(11, 13 * scale);
        this.ctx.font = `${fontSize}px "Roboto Mono", monospace`;
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillStyle = isDisabled ? 'rgba(136, 136, 136, 0.7)' : '#ffffff';

        // Show placeholder or input text
        if (!inputText && !isFocused) {
            this.ctx.fillStyle = 'rgba(158, 158, 158, 0.5)';
            this.ctx.fillText('Type a message... (Enter to send)', x + 8 * scale, y + height / 2);
        } else {
            // Show input text with cursor if focused
            const displayText = inputText.substring(0, 200); // Max 200 chars
            this.ctx.fillText(displayText, x + 8 * scale, y + height / 2);

            // Draw cursor if focused
            if (isFocused && !isDisabled) {
                const textWidth = this.ctx.measureText(displayText).width;
                const cursorX = x + 8 * scale + textWidth;
                const cursorBlink = Math.floor(Date.now() / 500) % 2;
                if (cursorBlink) {
                    this.ctx.fillStyle = '#ffffff';
                    this.ctx.fillRect(cursorX, y + 6 * scale, 2, height - 12 * scale);
                }
            }
        }

        // Character counter
        const charCount = inputText.length;
        const maxChars = 200;
        this.ctx.fillStyle = charCount > maxChars * 0.9 ? '#ff9800' : 'rgba(158, 158, 158, 0.6)';
        this.ctx.font = `${Math.max(9, 10 * scale)}px "Roboto Mono", monospace`;
        this.ctx.textAlign = 'right';
        this.ctx.fillText(`${charCount}/${maxChars}`, x + width - 8 * scale, y + height / 2);
    }

    checkChatInputClick(x, y) {
        if (!gameState.showLobby || gameState.multiplayer.isGameStarting) return false;

        const scale = this.getUIScale();
        const chatWidth = Math.min(400 * scale, this.canvas.width * 0.4);
        const chatHeight = 200 * scale;
        const padding = 20 * scale; // Small space from sides and bottom
        const chatX = padding; // Left side with spacing
        const chatY = this.canvas.height - chatHeight - padding; // Lower left with bottom spacing
        const inputY = chatY + chatHeight - 40 * scale;
        const inputX = chatX + 10 * scale;
        const inputWidth = chatWidth - 20 * scale;
        const inputHeight = 30 * scale;

        return x >= inputX && x <= inputX + inputWidth &&
               y >= inputY && y <= inputY + inputHeight;
    }

    checkButtonClick(x, y) {
        // Prevent clicks if game is starting
        if (gameState.multiplayer.isGameStarting) return null;

        // Check chat input click
        if (this.checkChatInputClick(x, y)) {
            return 'chat_input';
        }

        const centerX = this.canvas.width / 2;
        const lobbyScale = this.getUIScale();
        const buttonWidth = 180 * lobbyScale;
        const buttonHeight = 40 * lobbyScale;

        if (gameState.multiplayer.connected) {
            const isLeader = gameState.multiplayer.isLeader;

            if (isLeader) {
                // Leader: Ready, Start Game, Back
                const readyY = this.canvas.height - 150 * lobbyScale;
                const startY = this.canvas.height - 100 * lobbyScale;
                const backY = this.canvas.height - 50 * lobbyScale;

                // Check ready button
                if (x >= centerX - buttonWidth / 2 && x <= centerX + buttonWidth / 2 &&
                    y >= readyY && y <= readyY + buttonHeight) {
                    return 'lobby_ready';
                }

                // Check start game button
                if (x >= centerX - buttonWidth / 2 && x <= centerX + buttonWidth / 2 &&
                    y >= startY && y <= startY + buttonHeight) {
                    return 'lobby_start';
                }

                // Check back button
                if (x >= centerX - buttonWidth / 2 && x <= centerX + buttonWidth / 2 &&
                    y >= backY && y <= backY + buttonHeight) {
                    return 'lobby_back';
                }
            } else {
                // Non-leader: Ready, Back
                const readyY = this.canvas.height - 120 * lobbyScale;
                const backY = this.canvas.height - 70 * lobbyScale;

                // Check ready button
                if (x >= centerX - buttonWidth / 2 && x <= centerX + buttonWidth / 2 &&
                    y >= readyY && y <= readyY + buttonHeight) {
                    return 'lobby_ready';
                }

                // Check back button
                if (x >= centerX - buttonWidth / 2 && x <= centerX + buttonWidth / 2 &&
                    y >= backY && y <= backY + buttonHeight) {
                    return 'lobby_back';
                }
            }
        } else {
            // Not connected - just Back button
            const backY = this.canvas.height - 100 * lobbyScale;
            if (x >= centerX - buttonWidth / 2 && x <= centerX + buttonWidth / 2 &&
                y >= backY && y <= backY + buttonHeight) {
                return 'lobby_back';
            }
        }
        return null;
    }

    updateHover(x, y) {
        this.hoveredButton = this.checkButtonClick(x, y);
        return this.hoveredButton;
    }
}

