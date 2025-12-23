const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const path = require('path');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');

const app = express();
const httpServer = createServer(app);

// Middleware
app.use(cookieParser());
app.use(express.json());

// Trust proxy for accurate IP addresses (if behind reverse proxy)
app.set('trust proxy', true);

// Middleware to track all page views
app.use((req, res, next) => {
  // Skip tracking for dashboard and health endpoints
  if (req.path === '/dashboard' || req.path === '/dashboard/html' || req.path === '/health') {
    return next();
  }

  const userId = getOrCreateUserId(req, res);
  const referer = req.headers.referer || req.headers.referrer || 'Direct';
  const page = req.path || '/';

  trackPageView(userId, {
    path: page,
    referer: referer,
    method: req.method
  });

  next();
});

// Configure Socket.io with CORS for Hugging Face Spaces
const io = new Server(httpServer, {
  cors: {
    origin: "*", // Allow all origins (you can restrict this to specific domains)
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling'] // Support both transports
});

const players = new Map();
const userSessions = new Map(); // Track user sessions with cookies
const pageViews = new Map(); // Track page views per user

// Generate unique user ID from cookie or create new one
function getOrCreateUserId(req, res) {
  let userId = req.cookies?.zombobs_user_id;

  if (!userId || !userSessions.has(userId)) {
    // Create new user ID
    userId = crypto.randomBytes(16).toString('hex');
    res.cookie('zombobs_user_id', userId, {
      maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
      httpOnly: true,
      secure: false, // Set to true in production with HTTPS
      sameSite: 'lax'
    });

    // Initialize user session
    userSessions.set(userId, {
      userId,
      firstSeen: new Date(),
      lastSeen: new Date(),
      pages: [],
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

// Track page view
function trackPageView(userId, pageData) {
  if (!userSessions.has(userId)) return;

  const session = userSessions.get(userId);
  const pageEntry = {
    path: pageData.path || '/',
    referer: pageData.referer || 'Direct',
    method: pageData.method || 'GET',
    timestamp: new Date(),
    socketId: null // Will be set when socket connects
  };

  session.pages.push(pageEntry);

  // Keep only last 20 page views per user
  if (session.pages.length > 20) {
    session.pages.shift();
  }
}

function assignLeader() {
  // Assign leader to first player in Map
  if (players.size === 0) return;

  // Clear all leader flags
  players.forEach((player) => {
    player.isLeader = false;
  });

  // Assign to first player
  const firstPlayerId = Array.from(players.keys())[0];
  const firstPlayer = players.get(firstPlayerId);
  if (firstPlayer) {
    firstPlayer.isLeader = true;
  }
}

function broadcastLobby() {
  io.emit('lobby:update', Array.from(players.values()));
}

function formatPlayerList() {
  if (players.size === 0) return 'none';
  return Array.from(players.values())
    .map((player) => `${player.name}(${player.id.slice(-4)})`)
    .join(', ');
}

// Local server uses port 3000 by default, but allow override via env var
const PORT = process.env.PORT || 3000;

// Serve static files from the parent directory (where index.html is located)
// Use path.resolve to get an absolute path
const parentDir = path.resolve(__dirname, '..');
console.log(`📁 Serving static files from: ${parentDir}`);
app.use(express.static(parentDir));

// Root endpoint - serve index.html (fallback if static doesn't catch it)
app.get('/', (req, res) => {
  res.sendFile(path.resolve(parentDir, 'index.html'));
});

// Dashboard endpoint to view connected users
app.get('/dashboard', (req, res) => {
  const connectedUsers = Array.from(userSessions.values())
    .filter(session => session.socketIds.size > 0)
    .map(session => {
      const connectedPlayers = Array.from(session.socketIds)
        .map(socketId => {
          const player = players.get(socketId);
          return player ? {
            name: player.name,
            socketId: socketId,
            isLeader: player.isLeader,
            isReady: player.isReady
          } : null;
        })
        .filter(p => p !== null);

      return {
        userId: session.userId,
        firstSeen: session.firstSeen,
        lastSeen: session.lastSeen,
        pages: session.pages.slice(-5), // Last 5 pages
        connectedPlayers: connectedPlayers,
        userAgent: session.userAgent,
        ip: session.ip,
        totalPageViews: session.pages.length
      };
    });

  const allUsers = Array.from(userSessions.values()).map(session => ({
    userId: session.userId,
    firstSeen: session.firstSeen,
    lastSeen: session.lastSeen,
    isConnected: session.socketIds.size > 0,
    totalPageViews: session.pages.length,
    ip: session.ip
  }));

  res.json({
    timestamp: new Date().toISOString(),
    stats: {
      totalUsers: userSessions.size,
      connectedUsers: connectedUsers.length,
      totalPlayers: players.size
    },
    connectedUsers: connectedUsers,
    allUsers: allUsers
  });
});

// Simple HTML dashboard
app.get('/dashboard/html', (req, res) => {
  const connectedUsers = Array.from(userSessions.values())
    .filter(session => session.socketIds.size > 0);

  let html = `
<!DOCTYPE html>
<html>
<head>
  <title>Zombobs Server Dashboard</title>
  <style>
    body { font-family: monospace; background: #1a1a1a; color: #0f0; padding: 20px; }
    h1 { color: #0ff; }
    .stats { background: #2a2a2a; padding: 15px; margin: 10px 0; border-radius: 5px; }
    .user { background: #2a2a2a; padding: 15px; margin: 10px 0; border-left: 3px solid #0ff; }
    .page { background: #333; padding: 5px; margin: 5px 0; font-size: 0.9em; }
    .player { color: #ff0; }
    .leader { color: #f0f; font-weight: bold; }
    .ready { color: #0f0; }
    .not-ready { color: #f00; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 8px; text-align: left; border-bottom: 1px solid #444; }
    th { background: #333; color: #0ff; }
    .refresh { position: fixed; top: 10px; right: 10px; padding: 10px; background: #0ff; color: #000; border: none; cursor: pointer; }
  </style>
  <meta http-equiv="refresh" content="5">
</head>
<body>
  <button class="refresh" onclick="location.reload()">Refresh</button>
  <h1>🎮 Zombobs Server Dashboard</h1>
  
  <div class="stats">
    <h2>📊 Statistics</h2>
    <p>Total Users: ${userSessions.size}</p>
    <p>Connected Users: ${connectedUsers.length}</p>
    <p>Active Players: ${players.size}</p>
    <p>Last Updated: ${new Date().toLocaleString()}</p>
  </div>
  
  <h2>👥 Connected Users</h2>
`;

  if (connectedUsers.length === 0) {
    html += '<p>No users currently connected.</p>';
  } else {
    connectedUsers.forEach(session => {
      const latestPage = session.pages[session.pages.length - 1];
      html += `
      <div class="user">
        <h3>User: ${session.userId.substring(0, 8)}...</h3>
        <p><strong>IP:</strong> ${session.ip}</p>
        <p><strong>First Seen:</strong> ${session.firstSeen.toLocaleString()}</p>
        <p><strong>Last Seen:</strong> ${session.lastSeen.toLocaleString()}</p>
        <p><strong>Total Page Views:</strong> ${session.pages.length}</p>
        <p><strong>User Agent:</strong> ${session.userAgent.substring(0, 80)}...</p>
        
        <h4>🎮 Connected Players:</h4>
        <ul>
`;
      session.connectedPlayers.forEach(player => {
        const statusClass = player.isReady ? 'ready' : 'not-ready';
        const leaderBadge = player.isLeader ? ' [LEADER]' : '';
        html += `<li class="player ${statusClass}">${player.name}${leaderBadge} - ${player.isReady ? 'READY' : 'NOT READY'}</li>`;
      });
      html += `</ul>
        
        <h4>📄 Recent Pages:</h4>
`;
      session.pages.slice(-5).reverse().forEach(page => {
        html += `<div class="page">${page.path} (from: ${page.referer.substring(0, 50)}...) - ${new Date(page.timestamp).toLocaleString()}</div>`;
      });
      html += `</div>`;
    });
  }

  html += `
</body>
</html>
`;

  res.send(html);
});

// Health check endpoint for Hugging Face
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    players: players.size,
    timestamp: new Date().toISOString()
  });
});

// Socket.io connection handling
io.on('connection', (socket) => {
  // Get user ID from handshake cookies
  const cookies = socket.handshake.headers.cookie || '';
  const cookieMatch = cookies.match(/zombobs_user_id=([^;]+)/);
  const userId = cookieMatch ? cookieMatch[1] : null;

  const defaultName = `Player-${socket.id.slice(-4)}`;
  const isFirstPlayer = players.size === 0;

  players.set(socket.id, {
    id: socket.id,
    name: defaultName,
    isReady: false,
    isLeader: isFirstPlayer,
    userId: userId || 'unknown'
  });

  // Link socket to user session
  if (userId && userSessions.has(userId)) {
    const session = userSessions.get(userId);
    session.socketIds.add(socket.id);
    session.lastSeen = new Date();

    // Update latest page view with socket ID
    if (session.pages.length > 0) {
      session.pages[session.pages.length - 1].socketId = socket.id;
    }
  }

  // If not first player, ensure leader is assigned
  if (!isFirstPlayer) {
    assignLeader();
  }

  // Get user info for logging
  const userInfo = userId && userSessions.has(userId)
    ? userSessions.get(userId)
    : null;
  const userPages = userInfo ? userInfo.pages.length : 0;
  const latestPage = userInfo && userInfo.pages.length > 0
    ? userInfo.pages[userInfo.pages.length - 1]
    : null;

  broadcastLobby();

  // Handle player registration
  socket.on('player:register', (payload = {}) => {
    const rawName = typeof payload.name === 'string' ? payload.name : defaultName;
    const name = rawName.trim().substring(0, 24) || defaultName;
    const equippedSkin = payload.equippedSkin || null;
    const current = players.get(socket.id) || { id: socket.id, isReady: false, isLeader: false };
    players.set(socket.id, { ...current, name, equippedSkin });
    console.log(
      `[~] ${socket.id} set name to "${name}" | Skin: ${equippedSkin} | Players online: ${players.size}`
    );
    broadcastLobby();
  });

  // Handle ready toggle
  socket.on('player:ready', () => {
    const player = players.get(socket.id);
    if (player) {
      player.isReady = !player.isReady;
      console.log(
        `[~] ${player.name} ${player.isReady ? 'READY' : 'NOT READY'} | Players online: ${players.size}`
      );
      broadcastLobby();
    }
  });

  // Handle game start request (leader only)
  socket.on('game:start', () => {
    const player = players.get(socket.id);
    if (!player) return;

    // Check if requester is leader
    if (!player.isLeader) {
      socket.emit('game:start:error', { message: 'Only the lobby leader can start the game' });
      return;
    }

    // Check if all players are ready
    const allReady = Array.from(players.values()).every(p => p.isReady);
    if (!allReady) {
      socket.emit('game:start:error', { message: 'All players must be ready to start' });
      return;
    }

    // All checks passed - broadcast game start to all clients
    io.emit('game:start');
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    const player = players.get(socket.id);
    const wasLeader = player?.isLeader || false;
    const userId = player?.userId;
    players.delete(socket.id);
    const displayName = player?.name || defaultName;

    // Remove socket from user session
    if (userId && userSessions.has(userId)) {
      const session = userSessions.get(userId);
      session.socketIds.delete(socket.id);
      session.lastSeen = new Date();
    }

    // If leader disconnected, assign new leader
    if (wasLeader && players.size > 0) {
      assignLeader();
      console.log(`[~] New leader assigned after ${displayName} disconnected`);
    }

    broadcastLobby();
  });
});

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Local server running on port ${PORT}`);
  console.log(`📡 Socket.io server ready for connections`);
  console.log(`🌐 CORS enabled for all origins`);
  console.log(`✅ Local server is READY and accepting connections`);
  console.log(`\n📊 Connection Status:`);
  console.log(`   - Local Server: http://localhost:${PORT} [READY]`);
  console.log(`   - Dashboard (JSON): http://localhost:${PORT}/dashboard [READY]`);
  console.log(`   - Dashboard (HTML): http://localhost:${PORT}/dashboard/html [READY]`);
  console.log(`   - Waiting for client connections...\n`);
});
