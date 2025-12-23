const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const path = require('path');
const packageJson = require('./package.json');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const crypto = require('crypto');

const app = express();
const httpServer = createServer(app);

// Trust proxy (Hugging Face Spaces uses reverse proxy)
app.set('trust proxy', true);

// Middleware
app.use(compression()); // Compress all responses for better performance
app.use(cookieParser());
app.use(express.json());

// Add Express CORS middleware for all HTTP requests (including Socket.io polling)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Credentials', 'true');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Configure Socket.io with CORS for Hugging Face Spaces
// Hugging Face Spaces uses a reverse proxy, so we need specific configuration
const io = new Server(httpServer, {
  path: '/socket.io/', // Explicit path for Socket.io endpoint
  cors: {
    origin: (origin, callback) => {
      callback(null, true);
    },
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["*"],
    credentials: true
  },
  transports: ['websocket', 'polling'], // Prefer websockets for better performance
  allowEIO3: true, // Allow Engine.IO v3 clients (for compatibility)
  pingTimeout: 60000, // Increase timeout for slower connections
  pingInterval: 25000, // Standard ping interval
  maxHttpBufferSize: 1e6 // 1MB max message size
});

const players = new Map();
// Use circular buffer for recent events (more efficient than array unshift/pop)
const MAX_RECENT_EVENTS = 10;
const recentEvents = new Array(MAX_RECENT_EVENTS);
let recentEventsIndex = 0;
const userSessions = new Map(); // Track user sessions with cookies
let serverReady = false; // Track when server is fully initialized and listening

// Chat message storage (circular buffer)
const MAX_CHAT_MESSAGES = 50;
const chatMessages = new Array(MAX_CHAT_MESSAGES);
let chatMessagesIndex = 0;
const chatRateLimits = new Map(); // socketId -> timestamp[]

// Track leader ID directly instead of iterating
let currentLeaderId = null;

// Generate unique user ID from cookie or create new one
function getOrCreateUserId(req, res) {
  let userId = req.cookies?.zombobs_user_id;

  if (!userId || !userSessions.has(userId)) {
    // Create new user ID
    userId = crypto.randomBytes(16).toString('hex');
    res.cookie('zombobs_user_id', userId, {
      maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
      httpOnly: true,
      secure: true, // HTTPS on Hugging Face
      sameSite: 'lax'
    });

    // Initialize user session
    userSessions.set(userId, {
      userId,
      firstSeen: new Date(),
      lastSeen: new Date(),
      socketIds: new Set(),
      userAgent: req.headers['user-agent'] || 'Unknown',
      ip: req.ip || req.connection.remoteAddress || 'Unknown'
    });
  } else {
    // Update last seen
    const session = userSessions.get(userId);
    if (session) {
      session.lastSeen = new Date();
      session.userAgent = req.headers['user-agent'] || session.userAgent;
      session.ip = req.ip || req.connection.remoteAddress || session.ip;
    }
  }

  return userId;
}

function logEvent(message) {
  const timestamp = new Date().toLocaleTimeString();
  recentEvents[recentEventsIndex] = `[${timestamp}] ${message}`;
  recentEventsIndex = (recentEventsIndex + 1) % MAX_RECENT_EVENTS;
}

function getRecentEvents() {
  // Return events in chronological order (oldest first)
  const events = [];
  for (let i = 0; i < MAX_RECENT_EVENTS; i++) {
    const idx = (recentEventsIndex + i) % MAX_RECENT_EVENTS;
    if (recentEvents[idx]) {
      events.push(recentEvents[idx]);
    }
  }
  return events;
}

// Chat helper functions
function sanitizeChatMessage(message) {
  if (typeof message !== 'string') return null;

  // Trim whitespace
  let sanitized = message.trim();

  // Remove control characters (except newlines and tabs for multi-line support)
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  // HTML entity encoding for XSS prevention
  sanitized = sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  // Length validation (1-200 characters)
  if (sanitized.length === 0 || sanitized.length > 200) {
    return null;
  }

  return sanitized;
}

function checkRateLimit(socketId) {
  const now = Date.now();
  const RATE_LIMIT_WINDOW = 10000; // 10 seconds
  const MAX_MESSAGES = 5;

  if (!chatRateLimits.has(socketId)) {
    chatRateLimits.set(socketId, []);
  }

  const timestamps = chatRateLimits.get(socketId);

  // Remove timestamps outside the window
  const validTimestamps = timestamps.filter(ts => now - ts < RATE_LIMIT_WINDOW);
  chatRateLimits.set(socketId, validTimestamps);

  // Check if under limit
  if (validTimestamps.length >= MAX_MESSAGES) {
    return false;
  }

  // Add current timestamp
  validTimestamps.push(now);
  return true;
}

function addChatMessage(playerId, playerName, message, isSystem = false) {
  const chatMessage = {
    id: `${playerId}-${Date.now()}`,
    playerId: playerId,
    playerName: playerName,
    message: message,
    timestamp: Date.now(),
    isSystem: isSystem
  };

  chatMessages[chatMessagesIndex] = chatMessage;
  chatMessagesIndex = (chatMessagesIndex + 1) % MAX_CHAT_MESSAGES;

  return chatMessage;
}

function getChatHistory(limit = 20) {
  // Return messages in chronological order (oldest first)
  const messages = [];
  for (let i = 0; i < MAX_CHAT_MESSAGES && messages.length < limit; i++) {
    const idx = (chatMessagesIndex + i) % MAX_CHAT_MESSAGES;
    if (chatMessages[idx]) {
      messages.push(chatMessages[idx]);
    }
  }
  return messages;
}

function assignLeader() {
  // Assign leader to first player in Map
  if (players.size === 0) {
    currentLeaderId = null;
    return;
  }

  // If current leader still exists, keep them
  if (currentLeaderId && players.has(currentLeaderId)) {
    return;
  }

  // Clear old leader flag if exists
  if (currentLeaderId) {
    const oldLeader = players.get(currentLeaderId);
    if (oldLeader) oldLeader.isLeader = false;
  }

  // Get first player efficiently using iterator
  const firstPlayerId = players.keys().next().value;
  const firstPlayer = players.get(firstPlayerId);

  if (firstPlayer) {
    firstPlayer.isLeader = true;
    currentLeaderId = firstPlayerId;
  }
}

function broadcastLobby() {
  const playerList = Array.from(players.values());
  // Reduced logging for performance - only log errors
  try {
    io.emit('lobby:update', playerList);
  } catch (error) {
    console.error(`[broadcastLobby] ERROR emitting lobby:update:`, error);
    throw error;
  }
}

function formatPlayerList() {
  if (players.size === 0) return 'none';
  return Array.from(players.values())
    .map((player) => `${player.name}(${player.id.slice(-4)})`)
    .join(', ');
}

// Hugging Face Spaces uses port 7860, but allow override via env var
const PORT = process.env.PORT || 7860;

function formatUptime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  return `${hours}h ${minutes}m ${secs}s`;
}

function formatMemory(bytes) {
  return (bytes / 1024 / 1024).toFixed(2);
}

// Root endpoint - serve a simple HTML page
app.get('/', (req, res) => {
  if (!serverReady) {
    res.send('Server starting... Please wait.');
    return;
  }
  const userId = getOrCreateUserId(req, res);
  const uptime = formatUptime(process.uptime());

  // Cache memory usage calculation (don't call multiple times per request)
  const memUsage = process.memoryUsage();
  const memoryMB = formatMemory(memUsage.heapUsed);
  const totalMemoryMB = formatMemory(memUsage.heapTotal);

  const version = packageJson.version;

  // Use optimized recent events getter
  const events = getRecentEvents();
  const eventsHTML = events.length > 0
    ? events.map(event => `<li>${event}</li>`).join('')
    : '<li><em>No recent activity... yet.</em></li>';

  // Get player list once and reuse
  const playerList = Array.from(players.values());
  const readyCount = playerList.filter(p => p.isReady).length;
  const leader = playerList.find(p => p.isLeader);

  // Format player list HTML
  let playersHTML = '';
  if (playerList.length === 0) {
    playersHTML = '<li class="no-players"><em>No survivors connected... The horde waits.</em></li>';
  } else {
    playersHTML = playerList.map(player => {
      const readyClass = player.isReady ? 'ready' : 'not-ready';
      const leaderBadge = player.isLeader ? '<span class="leader-badge">👑 LEADER</span>' : '';
      const rankInfo = player.rank ? `<span class="rank-badge">${player.rank.rankName} T${player.rank.rankTier}</span>` : '';
      return `
        <li class="player-item ${readyClass}">
          <span class="player-name">${player.name}</span>
          ${rankInfo}
          ${leaderBadge}
          <span class="player-status">${player.isReady ? '✓ READY' : '○ NOT READY'}</span>
        </li>
      `;
    }).join('');
  }

  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="refresh" content="10">
      <meta name="description" content="Zombobs - Zombie Apocalypse Multiplayer Server Status">
      <meta name="theme-color" content="#ff1744">
      <!-- Permissions Policy - Only include recognized features to avoid console warnings -->
      <meta http-equiv="Permissions-Policy" content="geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()">
      <title>Zombobs Server - Apocalypse Status</title>
      <link href="https://fonts.googleapis.com/css2?family=Creepster&family=Roboto:wght@400;700&display=swap" rel="stylesheet">
      <script>
        // Suppress console errors from third-party scripts (Hugging Face WAF)
        (function() {
          const originalError = console.error;
          console.error = function(...args) {
            const message = args.join(' ');
            // Suppress known third-party errors
            if (message.includes('challenge.js') || 
                message.includes('ERR_BLOCKED_BY_CLIENT') ||
                message.includes('awswaf.com')) {
              return; // Silently ignore
            }
            originalError.apply(console, args);
          };
          
          // Suppress Permissions Policy warnings (these are from Hugging Face container)
          const originalWarn = console.warn;
          console.warn = function(...args) {
            const message = args.join(' ');
            if (message.includes('Unrecognized feature') || 
                message.includes('Permissions-Policy')) {
              return; // Silently ignore
            }
            originalWarn.apply(console, args);
          };
        })();
      </script>
      <style>
        /* ========== HALLOWEEN ZOMBIE EFFECTS ========== */
        
        /* Floating Zombie Animations */
        .zombie-float {
          position: fixed;
          font-size: 3em;
          opacity: 0.6;
          pointer-events: none;
          z-index: 1;
          animation: float-across 15s infinite linear;
          text-shadow: 0 0 10px rgba(0, 255, 0, 0.3);
        }
        
        @keyframes float-across {
          0% {
            transform: translateX(-100px) translateY(0) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 0.6;
          }
          90% {
            opacity: 0.6;
          }
          100% {
            transform: translateX(calc(100vw + 100px)) translateY(-50px) rotate(360deg);
            opacity: 0;
          }
        }
        
        .zombie-float:nth-child(1) { top: 10%; animation-delay: 0s; animation-duration: 20s; }
        .zombie-float:nth-child(2) { top: 30%; animation-delay: 5s; animation-duration: 25s; }
        .zombie-float:nth-child(3) { top: 50%; animation-delay: 10s; animation-duration: 18s; }
        .zombie-float:nth-child(4) { top: 70%; animation-delay: 15s; animation-duration: 22s; }
        .zombie-float:nth-child(5) { top: 85%; animation-delay: 3s; animation-duration: 19s; }
        
        /* Blood Drip Effect */
        @keyframes blood-drip {
          0% { 
            text-shadow: 
              0 0 10px rgba(255, 0, 0, 0.5), 
              2px 2px 0px #000,
              0 0 20px rgba(255, 0, 0, 0.8);
          }
          50% { 
            text-shadow: 
              0 0 20px rgba(255, 0, 0, 0.8), 
              2px 2px 0px #000,
              0 5px 30px rgba(139, 0, 0, 0.9),
              0 10px 15px rgba(255, 0, 0, 0.4);
          }
          100% { 
            text-shadow: 
              0 0 10px rgba(255, 0, 0, 0.5), 
              2px 2px 0px #000,
              0 0 20px rgba(255, 0, 0, 0.8);
          }
        }
        
        /* Fog Overlay */
        .fog-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            180deg,
            rgba(100, 0, 100, 0.05) 0%,
            rgba(0, 100, 0, 0.08) 50%,
            rgba(100, 0, 0, 0.05) 100%
          );
          pointer-events: none;
          z-index: 0;
          animation: fog-drift 10s ease-in-out infinite;
        }
        
        /* AI Badge */
        .ai-badge {
          position: fixed;
          bottom: 12px;
          right: 12px;
          background: rgba(0, 0, 0, 0.6);
          color: #fff;
          padding: 6px 10px;
          border-radius: 8px;
          font-size: 0.75em;
          font-family: 'Roboto', sans-serif;
          backdrop-filter: blur(8px);
          opacity: 0.7;
          transition: all 0.3s ease;
          border: 1px solid rgba(255, 255, 255, 0.1);
          z-index: 1000;
        }
        .ai-badge:hover {
          opacity: 1;
          border-color: rgba(204, 119, 34, 0.5);
        }
        .ai-badge .claude-text {
          color: #cc7722;
          font-weight: 600;
        }
        
        /* Simple ChatGPT badge */
        .chatgpt-badge {
          position: fixed;
          bottom: 12px;
          left: 12px;
          background: rgba(30, 30, 30, 0.6);
          color: #fff;
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 0.75em;
          font-family: 'Roboto', sans-serif;
          backdrop-filter: blur(4px);
          opacity: 0.7;
          transition: opacity 0.3s ease;
        }
        .chatgpt-badge:hover {
          opacity: 1;
        }
        
        @keyframes fog-drift {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.6; }
        }
        
        /* Spooky Glow */
        @keyframes spooky-glow {
          0%, 100% { 
            box-shadow: 
              0 0 20px rgba(255, 0, 0, 0.4), 
              inset 0 2px 0 rgba(255, 255, 255, 0.2),
              0 0 40px rgba(139, 0, 139, 0.3);
          }
          50% { 
            box-shadow: 
              0 0 40px rgba(255, 0, 0, 0.8), 
              inset 0 2px 0 rgba(255, 255, 255, 0.2),
              0 0 60px rgba(139, 0, 139, 0.6);
          }
        }
        
        /* Screen Shake */
        @keyframes screen-shake {
          0%, 100% { transform: scale(1.05) translate(0, 0); }
          10% { transform: scale(1.05) translate(-2px, 2px); }
          20% { transform: scale(1.05) translate(2px, -2px); }
          30% { transform: scale(1.05) translate(-2px, -2px); }
          40% { transform: scale(1.05) translate(2px, 2px); }
          50% { transform: scale(1.05) translate(-2px, 2px); }
          60% { transform: scale(1.05) translate(2px, -2px); }
          70% { transform: scale(1.05) translate(-2px, -2px); }
          80% { transform: scale(1.05) translate(2px, 2px); }
          90% { transform: scale(1.05) translate(-2px, 2px); }
        }
        
        /* ========== ORIGINAL STYLES WITH ENHANCEMENTS ========== */
        
        body {
          font-family: 'Roboto', sans-serif;
          max-width: 1000px;
          margin: 0 auto;
          padding: 40px 20px;
          min-height: 100vh;
          background: linear-gradient(135deg, #0a0a0a 0%, #1a0a0a 50%, #0a0a1a 100%);
          background-image: 
            radial-gradient(circle at 20% 50%, rgba(255, 23, 68, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, rgba(0, 255, 0, 0.05) 0%, transparent 50%),
            linear-gradient(rgba(0, 0, 0, 0.9), rgba(0, 0, 0, 0.8)),
            url('data:image/svg+xml;utf8,%3Csvg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="%232a0a0a" fill-opacity="0.4"%3E%3Cpath d="M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z"/%3E%3C/g%3E%3C/svg%3E');
          background-attachment: fixed;
          color: #dcdcdc;
          text-align: center;
          position: relative;
          overflow-x: hidden;
        }

        h1 { 
          font-family: 'Creepster', cursive;
          color: #ff4444;
          font-size: 4em;
          text-shadow: 0 0 10px rgba(255, 0, 0, 0.5), 2px 2px 0px #000;
          margin-bottom: 10px;
          letter-spacing: 2px;
          animation: blood-drip 3s ease-in-out infinite;
          position: relative;
          z-index: 2;
        }

        .subtitle {
          font-family: 'Creepster', cursive;
          color: #88ff88;
          font-size: 1.8em;
          margin-bottom: 40px;
          opacity: 0.9;
          text-shadow: 0 0 5px rgba(0, 255, 0, 0.3);
          position: relative;
          z-index: 2;
        }

        .play-section {
          margin: 40px 0;
          position: relative;
          z-index: 2;
        }

        .play-button {
          display: inline-block;
          background: linear-gradient(180deg, #ff4444 0%, #cc0000 100%);
          color: #fff;
          padding: 24px 70px;
          font-family: 'Creepster', cursive;
          font-size: 2.8em;
          text-decoration: none;
          border-radius: 12px;
          border: 3px solid rgba(255, 255, 255, 0.2);
          box-shadow: 
            0 0 30px rgba(255, 0, 0, 0.6), 
            inset 0 2px 0 rgba(255, 255, 255, 0.3),
            0 8px 16px rgba(0, 0, 0, 0.4);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8), 0 0 10px rgba(255, 0, 0, 0.5);
          position: relative;
          overflow: hidden;
        }
        
        .play-button::before {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.1), transparent);
          transform: rotate(45deg) translateY(-100%);
          transition: transform 0.6s;
        }

        .play-button:hover {
          animation: screen-shake 0.5s ease-in-out, spooky-glow 2s ease-in-out infinite;
          background: linear-gradient(180deg, #ff5555 0%, #dd0000 100%);
          transform: translateY(-3px) scale(1.05);
          box-shadow: 
            0 0 40px rgba(255, 0, 0, 0.8), 
            inset 0 2px 0 rgba(255, 255, 255, 0.4),
            0 12px 24px rgba(0, 0, 0, 0.5);
        }
        
        .play-button:hover::before {
          transform: rotate(45deg) translateY(100%);
        }

        .play-button:active {
          transform: translateY(-1px) scale(1.02);
        }

        .stats-container {
          background: rgba(20, 20, 20, 0.85);
          border: 2px solid rgba(255, 23, 68, 0.3);
          border-radius: 16px;
          padding: 30px;
          max-width: 900px;
          margin: 0 auto;
          box-shadow: 
            0 10px 40px rgba(0, 0, 0, 0.6),
            0 0 60px rgba(255, 23, 68, 0.1),
            inset 0 0 20px rgba(0, 0, 0, 0.3);
          backdrop-filter: blur(10px) saturate(120%);
          position: relative;
          z-index: 2;
          transition: all 0.3s ease;
        }
        
        .stats-container:hover {
          border-color: rgba(255, 23, 68, 0.5);
          box-shadow: 
            0 15px 50px rgba(0, 0, 0, 0.7),
            0 0 80px rgba(255, 23, 68, 0.2),
            inset 0 0 30px rgba(0, 0, 0, 0.4);
        }

        .status-indicator {
          display: inline-block;
          padding: 12px 24px;
          background: linear-gradient(135deg, rgba(0, 255, 0, 0.15) 0%, rgba(0, 200, 0, 0.1) 100%);
          border: 2px solid #00ff00;
          color: #00ff00;
          border-radius: 25px;
          font-weight: bold;
          margin-bottom: 35px;
          text-transform: uppercase;
          letter-spacing: 2px;
          font-size: 1.1em;
          box-shadow: 
            0 0 20px rgba(0, 255, 0, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.2);
          animation: pulse 2s infinite;
          text-shadow: 0 0 10px rgba(0, 255, 0, 0.5);
        }

        @keyframes pulse {
          0% { box-shadow: 0 0 10px rgba(0, 255, 0, 0.2); opacity: 1; }
          50% { box-shadow: 0 0 20px rgba(0, 255, 0, 0.5); opacity: 0.8; }
          100% { box-shadow: 0 0 10px rgba(0, 255, 0, 0.2); opacity: 1; }
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }

        .stat-card {
          background: linear-gradient(135deg, rgba(30, 30, 30, 0.9) 0%, rgba(20, 20, 20, 0.9) 100%);
          padding: 24px;
          border-radius: 12px;
          border-top: 4px solid #888;
          border-left: 2px solid rgba(255, 255, 255, 0.05);
          border-right: 2px solid rgba(255, 255, 255, 0.05);
          border-bottom: 2px solid rgba(255, 255, 255, 0.05);
          text-align: left;
          transition: all 0.3s ease;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05);
        }
        
        .stat-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1);
          background: linear-gradient(135deg, rgba(35, 35, 35, 0.95) 0%, rgba(25, 25, 25, 0.95) 100%);
        }

        .stat-card.online { border-color: #00ff00; }
        .stat-card.uptime { border-color: #ffaa00; }
        .stat-card.version { border-color: #00aaff; }

        .stat-label {
          font-size: 0.8em;
          text-transform: uppercase;
          color: #888;
          margin-bottom: 5px;
          letter-spacing: 1px;
        }

        .stat-value {
          font-size: 1.5em;
          font-weight: bold;
          color: #fff;
          font-family: 'Courier New', monospace;
        }

        .activity-log {
          background: #1a1a1a;
          border: 1px solid #333;
          border-radius: 8px;
          padding: 20px;
          text-align: left;
        }

        .activity-log h3 {
          margin-top: 0;
          color: #ff4444;
          font-family: 'Creepster', cursive;
          letter-spacing: 1px;
          font-size: 1.4em;
          border-bottom: 1px solid #333;
          padding-bottom: 10px;
          margin-bottom: 15px;
        }

        .activity-log ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .activity-log li {
          padding: 8px 0;
          border-bottom: 1px solid #2a2a2a;
          font-family: 'Courier New', monospace;
          font-size: 0.9em;
          color: #bbb;
        }

        .activity-log li:last-child {
          border-bottom: none;
        }

        .footer {
          margin-top: 40px;
          color: #555;
          font-size: 0.8em;
        }
        
        .port-info {
            color: #444;
            margin-top: 5px;
        }
        
        .players-section {
          background: #1a1a1a;
          border: 1px solid #333;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 20px;
          text-align: left;
        }
        
        .players-section h3 {
          margin-top: 0;
          color: #ffaa00;
          font-family: 'Creepster', cursive;
          letter-spacing: 1px;
          font-size: 1.4em;
          border-bottom: 1px solid #333;
          padding-bottom: 10px;
          margin-bottom: 15px;
        }
        
        .players-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        
        .player-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 15px;
          margin: 8px 0;
          background: #252525;
          border-radius: 6px;
          border-left: 4px solid #666;
          transition: all 0.3s ease;
        }
        
        .player-item.ready {
          border-left-color: #00ff00;
          background: rgba(0, 255, 0, 0.05);
        }
        
        .player-item.not-ready {
          border-left-color: #ff4444;
          background: rgba(255, 68, 68, 0.05);
        }
        
        .player-item:hover {
          transform: translateX(5px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
        }
        
        .player-name {
          font-weight: bold;
          color: #fff;
          font-size: 1.1em;
        }
        
        .leader-badge {
          background: linear-gradient(135deg, #ffd700 0%, #ffaa00 100%);
          color: #000;
          padding: 4px 10px;
          border-radius: 12px;
          font-size: 0.75em;
          font-weight: bold;
          margin-left: 10px;
          text-shadow: none;
          box-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
        }
        
        .player-status {
          font-family: 'Courier New', monospace;
          font-size: 0.9em;
          padding: 4px 12px;
          border-radius: 12px;
          font-weight: bold;
        }
        
        .player-item.ready .player-status {
          background: rgba(0, 255, 0, 0.2);
          color: #00ff00;
        }
        
        .player-item.not-ready .player-status {
          background: rgba(255, 68, 68, 0.2);
          color: #ff4444;
        }
        
        .no-players {
          text-align: center;
          padding: 20px;
          color: #666;
          font-style: italic;
        }
        
        .ready-count {
          color: #00ff00;
          font-weight: bold;
        }
        
        .stat-card.memory { border-color: #aa00ff; }
        .stat-card.ready { border-color: #00ffaa; }
      </style>
    </head>
    <body>
      <!-- Halloween Zombie Effects -->
      <div class="fog-overlay"></div>
      <div class="zombie-float">🧟</div>
      <div class="zombie-float">🧟‍♀️</div>
      <div class="zombie-float">💀</div>
      <div class="zombie-float">🧟‍♂️</div>
      <div class="zombie-float">👻</div>
      
      <h1>🧟 Zombobs Server 🧟</h1>
      <div class="subtitle">The Horde Awaits...</div>

      <div class="play-section">
        <a href="https://otterdays.itch.io/zombobs" target="_blank" rel="noopener noreferrer" class="play-button">
          PLAY NOW!
        </a>
      </div>

      <div class="stats-container">
        <div class="status-indicator">● Server Online</div>

        <div class="stats-grid">
          <div class="stat-card online">
            <div class="stat-label">Survivors Online</div>
            <div class="stat-value">${playerList.length}</div>
          </div>
          <div class="stat-card ready">
            <div class="stat-label">Ready to Fight</div>
            <div class="stat-value">${readyCount}/${playerList.length}</div>
          </div>
          <div class="stat-card uptime">
            <div class="stat-label">Time Since Outbreak</div>
            <div class="stat-value">${uptime}</div>
          </div>
          <div class="stat-card version">
            <div class="stat-label">Server Version</div>
            <div class="stat-value">v${version}</div>
          </div>
          <div class="stat-card memory">
            <div class="stat-label">Memory Usage</div>
            <div class="stat-value">${memoryMB} MB</div>
          </div>
        </div>

        <div class="players-section">
          <h3>👥 Survivor Roster ${leader ? `- Leader: ${leader.name}` : ''}</h3>
          <ul class="players-list">
            ${playersHTML}
          </ul>
        </div>

        <div class="activity-log">
          <h3>📻 Radio Chatter</h3>
          <ul>
            ${eventsHTML}
          </ul>
        </div>
      </div>

      <div class="footer">
        <p>Server auto-refreshes every 10 seconds</p>
        <p class="port-info">Port: ${PORT} • Memory: ${memoryMB} MB / ${totalMemoryMB} MB</p>
      </div>
      
      <div class="ai-badge">
        Enhanced with <span class="claude-text">Claude</span>
      </div>
    </body>
    </html>
  `);
});

// MongoDB Connection Setup
const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGO_URI || process.env.MONGODB_URI;
const DB_NAME = 'zombobs';
const COLLECTION_NAME = 'highscores';
const MAX_HIGHSCORES = 10;

let db = null;
let highscoresCollection = null;
let highscoresCache = []; // In-memory cache for fast API responses

/**
 * Initialize MongoDB connection and load initial highscores
 */
async function initMongoDB() {
  if (!MONGODB_URI) {
    console.warn('[MongoDB] No connection string found in environment variables. Highscores will not persist.');
    highscoresCache = [];
    return;
  }

  try {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    db = client.db(DB_NAME);
    highscoresCollection = db.collection(COLLECTION_NAME);

    // Create index on score for faster queries
    await highscoresCollection.createIndex({ score: -1 });

    console.log('[MongoDB] ✅ Connected to MongoDB Highscores');

    // Load initial highscores into cache
    highscoresCache = await getHighscoresFromDB();
    console.log(`[highscores] Loaded ${highscoresCache.length} highscores from MongoDB`);
  } catch (error) {
    console.error('[MongoDB] ❌ Connection error:', error.message);
    // Fall back to empty array if DB fails - server will still run
    highscoresCache = [];
  }
}

/**
 * Fetch top highscores from MongoDB
 * @returns {Array} Array of highscore entries, sorted by score descending
 */
async function getHighscoresFromDB() {
  if (!highscoresCollection) {
    return [];
  }

  try {
    const scores = await highscoresCollection
      .find({})
      .sort({ score: -1 })
      .limit(MAX_HIGHSCORES)
      .toArray();

    // Ensure all entries have required fields
    return (scores || []).map(entry => ({
      userId: entry.userId || 'unknown',
      username: entry.username || 'Survivor',
      score: entry.score || 0,
      wave: entry.wave || 0,
      zombiesKilled: entry.zombiesKilled || 0,
      isMultiplayer: typeof entry.isMultiplayer === 'boolean' ? entry.isMultiplayer : false,
      timestamp: entry.timestamp || new Date().toISOString()
    }));
  } catch (error) {
    console.error('[highscores] Error fetching from MongoDB:', error);
    return [];
  }
}

/**
 * Get highscores from cache (instant, no DB query per request)
 * @returns {Array} Array of highscore entries, sorted by score descending
 */
function getHighscores() {
  // Return cached highscores (already sorted and limited)
  return [...highscoresCache];
}

/**
 * Add a new highscore entry to MongoDB
 * @param {Object} entry - Highscore entry { userId, username, score, wave, zombiesKilled }
 * @returns {Array} Updated highscores array
 */
async function addHighscore(entry) {
  // Validate entry
  const scoreEntry = {
    userId: entry.userId || 'unknown',
    username: entry.username || 'Survivor',
    score: typeof entry.score === 'number' ? entry.score : 0,
    wave: typeof entry.wave === 'number' ? entry.wave : 0,
    zombiesKilled: typeof entry.zombiesKilled === 'number' ? entry.zombiesKilled : 0,
    isMultiplayer: typeof entry.isMultiplayer === 'boolean' ? entry.isMultiplayer : false,
    timestamp: new Date().toISOString()
  };

  if (scoreEntry.score <= 0) {
    // Don't save invalid scores
    return getHighscores();
  }

  // If MongoDB is not connected, fall back to in-memory only
  if (!highscoresCollection) {
    console.warn('[highscores] MongoDB not connected, using in-memory only');
    highscoresCache.push(scoreEntry);
    highscoresCache = highscoresCache.sort((a, b) => b.score - a.score).slice(0, MAX_HIGHSCORES);
    return [...highscoresCache];
  }

  try {
    // Insert new score into MongoDB
    await highscoresCollection.insertOne(scoreEntry);

    // Refresh cache from DB (get top 10)
    highscoresCache = await getHighscoresFromDB();

    return [...highscoresCache];
  } catch (error) {
    console.error('[highscores] Error saving to MongoDB:', error);
    // Return cached version on error
    return getHighscores();
  }
}

// Health check endpoint for Hugging Face
app.get('/health', (req, res) => {
  // Ensure user has a cookie so socket connection will have credentials
  getOrCreateUserId(req, res);

  if (!serverReady) {
    return res.status(503).json({
      status: 'starting',
      message: 'Server is still initializing'
    });
  }
  res.json({
    status: 'ok',
    players: players.size,
    timestamp: new Date().toISOString()
  });
});

// Highscore API Endpoints
app.get('/api/highscores', (req, res) => {
  try {
    // Return cached highscores instantly (no disk I/O)
    const highscores = getHighscores();
    res.json({ highscores });
  } catch (error) {
    console.error('[highscores] Error fetching highscores:', error);
    res.status(500).json({ error: 'Failed to fetch highscores' });
  }
});

app.post('/api/highscore', async (req, res) => {
  try {
    const userId = getOrCreateUserId(req, res);
    const { username, score, wave, zombiesKilled, isMultiplayer } = req.body;

    // Validate input
    if (typeof score !== 'number' || score < 0) {
      return res.status(400).json({ error: 'Invalid score' });
    }

    // Add highscore (now async)
    const updatedHighscores = await addHighscore({
      userId,
      username: username || 'Survivor',
      score,
      wave: wave || 0,
      zombiesKilled: zombiesKilled || 0,
      isMultiplayer: typeof isMultiplayer === 'boolean' ? isMultiplayer : false
    });

    // Check if this score made it to top 10
    const isInTop10 = updatedHighscores.some(h => h.userId === userId && h.score === score);

    res.json({
      success: true,
      isInTop10,
      rank: isInTop10 ? updatedHighscores.findIndex(h => h.userId === userId && h.score === score) + 1 : null
    });
  } catch (error) {
    console.error('[highscores] Error submitting highscore:', error);
    res.status(500).json({ error: 'Failed to submit highscore' });
  }
});

// Refresh cache from MongoDB (useful after manual DB cleanup)
app.post('/api/highscores/refresh', async (req, res) => {
  try {
    if (highscoresCollection) {
      // Refresh cache from database
      highscoresCache = await getHighscoresFromDB();
      console.log(`[highscores] Cache refreshed from DB: ${highscoresCache.length} entries`);
      res.json({
        success: true,
        message: 'Cache refreshed',
        count: highscoresCache.length,
        highscores: highscoresCache
      });
    } else {
      // No MongoDB connection - clear cache
      highscoresCache = [];
      res.json({
        success: true,
        message: 'Cache cleared (MongoDB not connected)',
        count: 0,
        highscores: []
      });
    }
  } catch (error) {
    console.error('[highscores] Error refreshing cache:', error);
    res.status(500).json({ error: 'Failed to refresh cache' });
  }
});

// Clear cache and optionally clear database
app.post('/api/highscores/clear', async (req, res) => {
  try {
    const { clearDatabase = false } = req.body;

    // Clear in-memory cache
    highscoresCache = [];
    console.log('[highscores] In-memory cache cleared');

    let dbCleared = false;
    if (clearDatabase && highscoresCollection) {
      try {
        const result = await highscoresCollection.deleteMany({});
        console.log(`[highscores] Database cleared: ${result.deletedCount} entries deleted`);
        dbCleared = true;
      } catch (dbError) {
        console.error('[highscores] Error clearing database:', dbError);
      }
    }

    res.json({
      success: true,
      message: dbCleared ? 'Cache and database cleared' : 'Cache cleared',
      cacheCleared: true,
      databaseCleared: dbCleared,
      count: 0,
      highscores: []
    });
  } catch (error) {
    console.error('[highscores] Error clearing cache:', error);
    res.status(500).json({ error: 'Failed to clear cache' });
  }
});

// Socket.io connection handling
io.on('connection', (socket) => {
  // Get user ID from handshake cookies
  const cookies = socket.handshake.headers.cookie || '';
  const cookieMatch = cookies.match(/zombobs_user_id=([^;]+)/);
  const userId = cookieMatch ? cookieMatch[1] : null;

  const defaultName = `Survivor - ${socket.id.slice(-4)}`;
  const isFirstPlayer = players.size === 0;

  players.set(socket.id, {
    id: socket.id,
    name: defaultName,
    isReady: false,
    isLeader: isFirstPlayer,
    userId: userId || 'unknown',
    rank: {
      rankName: 'Private',
      rank: 1,
      rankTier: 1
    }
  });

  // Set leader ID if first player
  if (isFirstPlayer) {
    currentLeaderId = socket.id;
  }

  // Link socket to user session
  if (userId && userSessions.has(userId)) {
    const session = userSessions.get(userId);
    session.socketIds.add(socket.id);
    session.lastSeen = new Date();
  }

  // If not first player, ensure leader is assigned
  if (!isFirstPlayer) {
    assignLeader();
  }

  // Reduced logging for better performance
  console.log(`[+] ${defaultName} connected | Players: ${players.size} | Leader: ${isFirstPlayer}`);
  logEvent(`${defaultName} joined the fight`);
  broadcastLobby();

  // Handle player registration
  socket.on('player:register', (payload = {}) => {
    // Basic name sanitization (trim & length limit)
    const rawName = typeof payload.name === 'string' ? payload.name : defaultName;
    const name = rawName.trim().substring(0, 24) || defaultName;

    // Extract skin data
    const equippedSkin = payload.equippedSkin || null;

    // Extract rank data from payload, with defaults
    const rankData = payload.rank || {};
    const rank = {
      rankName: rankData.rankName || 'Private',
      rank: typeof rankData.rank === 'number' ? rankData.rank : 1,
      rankTier: typeof rankData.rankTier === 'number' ? rankData.rankTier : 1
    };

    const current = players.get(socket.id) || { id: socket.id, isReady: false, isLeader: false };
    players.set(socket.id, { ...current, name, rank, equippedSkin });

    // Reduced logging
    logEvent(`${name} updated their ID tag`);
    broadcastLobby();
  });

  // Handle ready toggle
  socket.on('player:ready', () => {
    try {
      const player = players.get(socket.id);
      if (player) {
        player.isReady = !player.isReady;
        logEvent(`${player.name} ${player.isReady ? 'is ready' : 'is not ready'}`);
        broadcastLobby();
      } else {
        // Only log errors, not every validation
        socket.emit('player:ready:error', {
          message: 'Player not found in server Map',
          socketId: socket.id
        });
      }
    } catch (error) {
      console.error(`[player: ready]ERROR: `, error);
      socket.emit('player:ready:error', {
        message: 'Server error processing ready toggle',
        error: error.message
      });
    }
  });

  // Handle game start request (leader only)
  socket.on('game:start', () => {
    const player = players.get(socket.id);
    if (!player) return;

    // Check if requester is leader
    if (!player.isLeader) {
      console.log(`[!] Non - leader ${player.name} attempted to start game`);
      socket.emit('game:start:error', { message: 'Only the lobby leader can start the game' });
      return;
    }

    // Check if all players are ready
    const allReady = Array.from(players.values()).every(p => p.isReady);
    if (!allReady) {
      console.log(`[!] Leader ${player.name} attempted to start game but not all players ready`);
      socket.emit('game:start:error', { message: 'All players must be ready to start' });
      return;
    }

    // All checks passed - broadcast game starting countdown
    console.log(`[+] Leader ${player.name} initiated game start.Countdown starting...`);

    // Broadcast countdown start (3 seconds)
    const countdownDuration = 3000;
    const startTime = Date.now() + countdownDuration;

    io.emit('game:starting', {
      startTime: startTime,
      duration: countdownDuration
    });

    // Set timeout to actually start the game
    setTimeout(() => {
      console.log(`[+] Game starting! All players ready.`);
      logEvent('Game starting - all survivors ready!');
      io.emit('game:start');
    }, countdownDuration);
  });

  // Handle player state updates (position, angle, actions)
  socket.on('player:state', (state) => {
    const player = players.get(socket.id);
    if (!player) return;

    // Broadcast player state to all other clients
    socket.broadcast.emit('player:state:update', {
      playerId: socket.id,
      ...state
    });
  });

  // Handle player action (shooting, melee, etc.)
  socket.on('player:action', (action) => {
    const player = players.get(socket.id);
    if (!player) return;

    // Broadcast action to all other clients
    socket.broadcast.emit('player:action:update', {
      playerId: socket.id,
      ...action
    });
  });

  // --- Zombie Synchronization ---

  // Handle zombie spawns (Leader only)
  socket.on('zombie:spawn', (data) => {
    // Broadcast to all others
    socket.broadcast.emit('zombie:spawn', data);
  });

  // Handle zombie updates (Leader only)
  socket.on('zombie:update', (data) => {
    // Volatile broadcast for frequent position updates (can be dropped)
    socket.broadcast.volatile.emit('zombie:update', data);
  });

  // Handle ping for latency measurement
  socket.on('ping', (timestamp, callback) => {
    if (typeof callback === 'function') {
      callback(Date.now());
    }
  });

  // Handle zombie hit/damage
  socket.on('zombie:hit', (data) => {
    socket.broadcast.emit('zombie:hit', data);
  });

  // Handle zombie death
  socket.on('zombie:die', (data) => {
    socket.broadcast.emit('zombie:die', data);
  });

  // --- Game State Synchronization ---

  // Handle XP gain
  socket.on('game:xp', (amount) => {
    socket.broadcast.emit('game:xp', amount);
  });

  // Handle Level Up event (if shared)
  socket.on('game:levelup', (data) => {
    socket.broadcast.emit('game:levelup', data);
  });

  // Handle Skill Selection
  socket.on('game:skill', (skillId) => {
    socket.broadcast.emit('game:skill', skillId);
  });

  // Handle Game Pause
  socket.on('game:pause', () => {
    socket.broadcast.emit('game:pause');
  });

  // Handle Game Resume
  socket.on('game:resume', () => {
    socket.broadcast.emit('game:resume');
  });

  // Handle score submission (game over)
  socket.on('game:score', async (data) => {
    try {
      // Get user ID from socket handshake cookies
      const cookies = socket.handshake.headers.cookie || '';
      const cookieMatch = cookies.match(/zombobs_user_id=([^;]+)/);
      let userId = cookieMatch ? cookieMatch[1] : null;

      // Fallback: Try to get userId from player object or generate temporary one
      if (!userId) {
        const player = players.get(socket.id);
        if (player && player.userId && player.userId !== 'unknown') {
          userId = player.userId;
        } else {
          // Generate temporary ID so score is still saved
          userId = crypto.randomBytes(16).toString('hex');
        }
      }

      // Get username from player Map or data
      const player = players.get(socket.id);
      const username = player?.name || data.username || 'Survivor';

      // Validate score data
      const score = typeof data.score === 'number' ? data.score : 0;
      const wave = typeof data.wave === 'number' ? data.wave : 0;
      const zombiesKilled = typeof data.zombiesKilled === 'number' ? data.zombiesKilled : 0;
      const isMultiplayer = typeof data.isMultiplayer === 'boolean' ? data.isMultiplayer : false;

      if (score <= 0) {
        return;
      }

      // Add highscore (now async)
      const updatedHighscores = await addHighscore({
        userId,
        username,
        score,
        wave,
        zombiesKilled,
        isMultiplayer
      });

      // Check if this score made it to top 10
      const entry = updatedHighscores.find(h => h.userId === userId && h.score === score && h.wave === wave);
      const isInTop10 = !!entry;
      const rank = isInTop10 ? updatedHighscores.indexOf(entry) + 1 : null;

      // Notify client of submission result
      socket.emit('game:score:result', {
        success: true,
        isInTop10,
        rank,
        highscores: updatedHighscores.slice(0, 10) // Send top 10 back
      });

      // Broadcast new leaderboard to all clients if score is in top 10
      if (isInTop10) {
        io.emit('highscores:update', { highscores: updatedHighscores.slice(0, 10) });
        logEvent(`${username} achieved rank #${rank} with ${score} points!`);
      }
    } catch (error) {
      console.error('[game:score] Error processing score submission:', error);
      socket.emit('game:score:result', { success: false, error: 'Failed to process score' });
    }
  });

  // --- Chat System ---

  // Handle chat message
  socket.on('chat:message', (data) => {
    const player = players.get(socket.id);
    if (!player) {
      socket.emit('chat:error', { message: 'Player not found' });
      return;
    }

    // Validate payload
    if (!data || typeof data.message !== 'string') {
      socket.emit('chat:error', { message: 'Invalid message format' });
      return;
    }

    // Check rate limit
    if (!checkRateLimit(socket.id)) {
      socket.emit('chat:rateLimit', {
        message: 'Rate limit exceeded. Please wait before sending another message.',
        retryAfter: 10
      });
      return;
    }

    // Sanitize message
    const sanitized = sanitizeChatMessage(data.message);
    if (!sanitized) {
      socket.emit('chat:error', { message: 'Invalid message. Must be 1-200 characters.' });
      return;
    }

    // Add to chat history
    const chatMessage = addChatMessage(socket.id, player.name, sanitized, false);

    // Broadcast to all clients
    io.emit('chat:message:new', chatMessage);
  });

  // Handle chat history request (optional - send on lobby join)
  socket.on('chat:history', () => {
    const history = getChatHistory(20);
    socket.emit('chat:history', { messages: history });
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    const player = players.get(socket.id);
    const wasLeader = player?.isLeader || false;
    const userId = player?.userId;
    players.delete(socket.id);

    // Clean up rate limit tracking
    chatRateLimits.delete(socket.id);

    // Remove socket from user session
    if (userId && userSessions.has(userId)) {
      const session = userSessions.get(userId);
      session.socketIds.delete(socket.id);
      session.lastSeen = new Date();
    }

    const displayName = player?.name || defaultName;

    // If leader disconnected, assign new leader
    if (wasLeader && players.size > 0) {
      assignLeader();
      logEvent(`New leader assigned after ${displayName} left`);
    }

    // Reduced logging
    console.log(`[-] ${displayName} disconnected | Players: ${players.size} `);
    logEvent(`${displayName} was lost to the horde`);
    broadcastLobby();

    // Notify other clients that this player disconnected
    socket.broadcast.emit('player:disconnected', { playerId: socket.id });
  });
});

// Error handling for uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('[!] Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[!] Unhandled Rejection at:', promise, 'reason:', reason);
});

// Initialize MongoDB and start server
initMongoDB().then(() => {
  // Start server after MongoDB is initialized (or failed to connect)
  try {
    httpServer.listen(PORT, '0.0.0.0', () => {
      serverReady = true; // Mark server as ready
      console.log(`🚀 Zombobs Server running on port ${PORT} `);
      console.log(`🧟 The horde is approaching...`);
    });

    httpServer.on('error', (error) => {
      console.error('[!] Server error:', error);
    });
  } catch (error) {
    console.error('[!] Failed to start server:', error);
    process.exit(1);
  }
}).catch((error) => {
  console.error('[!] Failed to initialize MongoDB:', error);
  // Start server anyway - it will use in-memory cache only
  httpServer.listen(PORT, '0.0.0.0', () => {
    serverReady = true; // Mark server as ready
    console.log(`🚀 Zombobs Server running on port ${PORT} (MongoDB unavailable)`);
    console.log(`🧟 The horde is approaching...`);
  });
});
