# Multiplayer Architecture Documentation

## Overview

The multiplayer system uses Socket.io for real-time communication between clients and a Node.js server. The system implements a lobby-based matchmaking system with leader-based game start synchronization.

## Architecture

### Server-Side (`server/server.js` & `huggingface-space/server.js`)

The server maintains a `Map` of connected players, where each player object contains:
- `id`: Socket.io socket ID
- `name`: Player display name (max 24 characters)
- `isReady`: Boolean indicating if player is ready to start
- `isLeader`: Boolean indicating if player is the lobby leader

#### Key Functions

- `assignLeader()`: Assigns leader status to the first player in the Map. Clears all leader flags first, then assigns to the first player.
- `broadcastLobby()`: Emits `lobby:update` event to all connected clients with the current player list.

#### Socket Events

**Connection (`connection`)**
- Creates player object with default name, `isReady: false`, and `isLeader: true` if first player
- If not first player, calls `assignLeader()` to ensure leader is set
- Broadcasts lobby update

**Player Registration (`player:register`)**
- Updates player name from payload
- Sanitizes name (trim, max 24 chars)
- Broadcasts lobby update

**Ready Toggle (`player:ready`)**
- Toggles `isReady` status for the requesting player
- Broadcasts lobby update

**Game Start (`game:start`)**
- Validates requester is leader
- Validates all players are ready
- If valid, broadcasts `game:start` to all clients
- If invalid, sends `game:start:error` to requester

**Disconnect (`disconnect`)**
- Removes player from Map
- If leader disconnected and players remain, assigns new leader
- Broadcasts lobby update

### Client-Side

#### State Management (`js/core/gameState.js`)

The `gameState.multiplayer` object tracks:
- `connected`: Boolean connection status
- `status`: Connection state string ('connecting' | 'connected' | 'error' | 'disconnected')
- `serverStatus`: Server health status
- `socket`: Socket.io socket instance
- `playerId`: Local player's socket ID
- `players`: Array of all players in lobby (from server)
- `isLeader`: Boolean indicating if local player is leader
- `isReady`: Boolean indicating if local player is ready

#### Network Initialization (`js/main.js`)

**Connection Handler**
- Sets connection status
- Stores player ID
- Resets ready/leader flags
- Emits `player:register` with username

**Lobby Update Handler (`lobby:update`)**
- Updates player list
- Updates local `isLeader` and `isReady` from server data

**Game Start Handler (`game:start`)**
- Receives synchronized game start signal
- Calls `startGame()` to begin gameplay

**Error Handler (`game:start:error`)**
- Logs error message
- Could display error to user in UI

#### UI Rendering (`js/ui/GameHUD.js`)

**Lobby Display (`drawLobby`)**
- Shows connection status
- Displays player list with:
  - Player name and ID suffix
  - 👑 icon for leader
  - ✅ Ready or ❌ Not Ready status
  - Green highlight for local player
- Shows appropriate action buttons:
  - **All Players**: "Ready" / "Unready" toggle button (top position)
  - **Leader Only**: "Start Game" button (middle position, disabled if not all ready)
  - **All Players**: "Back" button (bottom position)

**Button Click Handling (`checkMenuButtonClick`)**
- Detects clicks on lobby buttons
- Returns `'lobby_start'` for leader's start button
- Returns `'lobby_ready'` for ready button (all players)
- Returns `'lobby_back'` for back button

**Click Action Handler (`main.js` mousedown event)**
- `'lobby_start'`: Emits `game:start` to server (leader only)
- `'lobby_ready'`: Emits `player:ready` to server (all players, including leaders)
  - Validates socket exists and is connected before emitting
  - Includes debug logging for troubleshooting
- `'lobby_back'`: Returns to main menu
- `'gameover_lobby'`: Returns to multiplayer lobby from game over screen (multiplayer games only)
- `'gameover_menu'`: Returns to main menu from game over screen

## Packet Flow

### Player Joins Lobby

1. Client connects to server
2. Server creates player object, assigns leader if first player
3. Server broadcasts `lobby:update` to all clients
4. Client receives update, displays player list

### Player Toggles Ready

1. Player (leader or non-leader) clicks "Ready" button
2. Client validates socket connection
3. Client emits `player:ready` to server
3. Server toggles player's `isReady` flag
4. Server broadcasts `lobby:update` to all clients
5. All clients update UI to show new ready status

### Leader Starts Game

1. Leader clicks "Start Game" button (only enabled when all ready)
2. Client emits `game:start` to server
3. Server validates:
   - Requester is leader
   - All players are ready
4. If valid:
   - Server broadcasts `game:start` to all clients
   - All clients receive signal simultaneously
   - Each client:
     - Sets `gameState.isCoop = true` to enable multiplayer mode
     - Synchronizes players from `gameState.multiplayer.players` to `gameState.players`
     - Creates player entities for each lobby player with correct IDs and names
     - Sets `inputSource` to `'mouse'` for local player, `'remote'` for others
     - Calls `startGame()` to begin gameplay
   - All players join the same game session together
5. If invalid:
   - Server sends `game:start:error` to requester
   - Error is logged (could show UI message)

### Leader Disconnects

1. Leader disconnects
2. Server removes player from Map
3. Server calls `assignLeader()` to assign new leader
4. Server broadcasts `lobby:update` to all clients
5. New leader's UI updates to show "Start Game" button

### Game Over Screen Navigation

1. When game ends in multiplayer, game over screen displays with two navigation options:
   - **"Back to Lobby"** button (only shown for multiplayer games):
     - Returns player to multiplayer lobby
     - Re-registers player with server if already connected
     - Resets ready state and multiplayer flags
     - Ensures lobby state is correctly restored
   - **"Back to Main Menu"** button (always shown):
     - Returns player to main menu
     - Calls `restartGame()` to reset all game state
2. "Press R to Restart" functionality removed from game over screen
3. Cursor and hover states work correctly on game over screen
4. Pause state is properly reset when game starts to prevent pause screen from appearing

## Username System

- Username is stored in `gameState.username` (default: 'Survivor')
- Loaded from localStorage via `loadUsername()` before connection
- Sent to server in `player:register` event on connection
- Can be changed via main menu username button
- Persisted to localStorage via `saveUsername()`

## Synchronization Guarantees

- **Leader Assignment**: First player is always leader. On leader disconnect, first remaining player becomes leader.
- **Ready State**: Each player independently toggles ready state. Server validates all ready before allowing game start.
- **Game Start**: Only leader can initiate start. Server validates all ready before broadcasting start signal to all clients simultaneously.
- **State Consistency**: Server is source of truth. All state changes broadcast via `lobby:update` to keep clients synchronized.

## Error Handling

- Connection errors: Client shows "Connecting..." status
- Game start errors: Server sends `game:start:error` with message
- Disconnection: Server reassigns leader if needed, broadcasts update
- Invalid operations: Server validates permissions before processing

## In-Game Synchronization

### Player State Updates
- **Client → Server**: Local player sends position, angle, health, stamina, weapon, and ammo state every frame via `player:state` event
- **Server → Client**: Server broadcasts player state updates to all other clients via `player:state:update` event
- **Client**: Remote players receive state updates and apply them to their local player objects

### Player Actions
- **Client → Server**: Local player sends actions (shoot, melee, reload, grenade, switchWeapon) via `player:action` event
- **Server → Client**: Server broadcasts actions to all other clients via `player:action:update` event
- **Client**: Remote players receive actions and execute them locally (e.g., create bullets, perform melee, etc.)

### Remote Player Handling
- Remote players have `inputSource: 'remote'` and skip local input handling
- Remote players are updated via socket events only
- Remote player actions are executed locally but triggered by network events

### Zombie Synchronization

#### Speed Synchronization
- **Leader → Clients**: Leader broadcasts `speed` and `baseSpeed` for each zombie in updates
- **Clients**: Non-leader clients apply synced speed values to maintain consistency
- **Synchronized Modifiers**: Night cycle speed boost (20%), wave scaling, slow effects all sync across clients
- **Prevents Desync**: Eliminates position drift caused by speed differences

#### Position Updates (`zombie:update`)
- **Update Rate**: Adaptive 50-220ms interval based on zombie count and network latency
  - Few zombies (0-20): 200ms (5Hz)
  - Many zombies (50+): 50ms (20Hz)
  - High latency (>100ms): Adds 20ms adjustment
- **Delta Compression**: Only sends changed zombies (position change > 1 pixel threshold)
  - Reduces bandwidth by 50-80% for large hordes
  - Falls back to full state if >80% of zombies changed
- **Payload**: `{id, x, y, health, speed, baseSpeed}` per zombie

#### Advanced Interpolation
- **Adaptive Lerp Factor**: Calculated based on update frequency and network latency
  - Formula: `lerpFactor = min(0.5, max(0.1, updateInterval / (frameTime * 2)))`
  - Higher update interval = faster lerp to catch up
- **Velocity-Based Extrapolation**: Uses tracked `vx`/`vy` velocity for smoother movement
  - Used when distance < 50px and recent update (< 2x update interval)
  - Extrapolates position between updates based on velocity
- **GameEngine Integration**: Uses `GameEngine.getInterpolationAlpha()` for frame-perfect interpolation
  - Blends between last and current position based on render time
  - Ensures smooth rendering between fixed timestep updates
- **Smart Snapping**: Large distance changes (>100px) snap immediately (teleport/spawn)
  - Small distances (<0.5px) snap to prevent jitter

#### Zombie Spawns (`zombie:spawn`)
- Leader broadcasts spawn event with: `{id, type, x, y, health, speed, baseSpeed}`
- Non-leader clients create zombie using `getZombieClassByType()` helper
- All zombie types supported: normal, fast, armored, exploding, ghost, spitter, flying, boss

#### Zombie Damage/Death (`zombie:hit`, `zombie:die`)
- Leader broadcasts hit events for visual effects (blood splatter)
- Leader broadcasts death events for removal and effects
- Non-leader clients apply visual effects only (leader is authoritative)

#### Performance Optimizations
- **Socket.IO Binary Add-ons**: `bufferutil` and `utf-8-validate` reduce WebSocket CPU by 10-20%
- **Volatile Emits**: Position updates use volatile emit (can be dropped) for performance
- **State Cleanup**: Zombie state tracking cleaned up on death to prevent memory leaks
- **Latency Measurement**: Custom ping/pong mechanism tracks network latency
  - Exponential moving average for smoother latency values
  - Used to adjust update intervals

## Latency & Performance

### Latency Measurement
- Custom ping/pong mechanism measures round-trip time
- Exponential moving average (80/20) for smooth latency tracking
- Measured every 5 seconds
- Stored in `gameState.networkLatency` and `gameState.multiplayer.latency`
- Used to adjust zombie update intervals

### Network Bandwidth
- **Before Optimizations**: ~25-50 KB/s per client (50 zombies @ 10Hz, full state)
- **After Delta Compression**: ~5-15 KB/s per client (50-80% reduction)
- **Update Frequency**: Adaptive 5-20Hz based on zombie count and latency
- **Payload Size**: ~50-100 bytes per zombie (position + speed + health)

### Performance Metrics
- **Zombie Update Frequency**: Adaptive 5-20Hz (50-200ms intervals)
- **Network Payload per Update**: ~50-100 bytes per zombie (delta compressed)
- **Interpolation Quality**: 60-80% reduction in jitter compared to fixed 20% lerp
- **Speed Sync Accuracy**: Eliminates position desync from speed differences

## Highscore System

### Overview

The server maintains a global leaderboard of top 10 player scores. Scores are submitted on game over and persist across server restarts via MongoDB (with graceful fallback to in-memory cache if MongoDB unavailable).

### Server-Side (`huggingface-space-SERVER/server.js`)

#### MongoDB Storage

- **Database**: MongoDB (connection string via `MONGO_URI` or `MONGODB_URI` environment variable)
- **Database Name**: `zombobs`
- **Collection**: `highscores`
- **Index**: Created on `score` field (descending) for fast queries
- **Max Entries**: Top 10 scores only
- **Persistence**: Scores survive server restarts
- **Fallback**: If MongoDB unavailable, uses in-memory cache only (scores lost on restart)

#### Storage Functions

- `initMongoDB()`: Initializes MongoDB connection and loads initial highscores into cache
- `getHighscoresFromDB()`: Fetches top 10 scores from MongoDB (sorted by score descending)
- `getHighscores()`: Returns cached highscores instantly (no DB query per request)
- `addHighscore(entry)`: Adds new entry to MongoDB, refreshes cache, maintains top 10 limit, returns updated list (async)

#### Highscore Entry Structure

```javascript
{
  userId: string,        // User ID from cookie (zombobs_user_id)
  username: string,      // Player display name
  score: number,         // Final game score
  wave: number,          // Wave reached
  zombiesKilled: number, // Total zombies killed
  isMultiplayer: boolean, // Whether score was achieved in multiplayer mode
  timestamp: string      // ISO timestamp when score was achieved
}
```

#### HTTP API Endpoints

**GET `/api/highscores`**
- Returns top 10 global leaderboard
- Response: `{ highscores: [...] }`
- No authentication required

**POST `/api/highscore`**
- Submits a new score
- Request body: `{ username, score, wave, zombiesKilled, isMultiplayer }`
- Validates input (score must be number >= 0)
- Extracts `userId` from cookie automatically
- Returns: `{ success: true, isInTop10: boolean, rank: number | null }`

#### Socket.IO Events

**Client → Server: `game:score`**
- Submits score on game over
- Payload: `{ username, score, wave, zombiesKilled, isMultiplayer }`
- Server extracts `userId` from socket handshake cookies
- **Note**: Client ensures cookie is set before Socket.io connection by fetching `/health` endpoint first (prevents duplicate user entries)
- Server saves score and checks if it qualifies for top 10

**Server → Client: `game:score:result`**
- Sent after score submission
- Payload: `{ success: boolean, isInTop10: boolean, rank: number | null, highscores: [...] }`
- Includes top 10 leaderboard if score made it to top 10

**Server → All Clients: `highscores:update`**
- Broadcast when a new score enters top 10
- Payload: `{ highscores: [...] }`
- All connected clients receive updated leaderboard

### Client-Side

#### Score Submission (`js/systems/GameStateManager.js`)

**`submitScoreToServer(score, wave, zombiesKilled)`**
- Called automatically on game over
- Prefers Socket.IO if multiplayer connected
- Falls back to HTTP POST if not in multiplayer
- Includes `isMultiplayer` flag based on connection status
- Non-blocking (doesn't delay game over screen)

**`submitScoreViaHTTP(scoreData)`**
- Sends HTTP POST to `/api/highscore` endpoint
- Refreshes leaderboard if score made it to top 10

#### Leaderboard Display (`js/ui/GameHUD.js`)

**`fetchLeaderboard()`**
- Fetches top 10 from `/api/highscores` endpoint
- Throttled to once every 30 seconds
- Stores result in `this.leaderboard` array

**`drawLeaderboard()`**
- Displays global leaderboard on main menu
- Shows rank, username, score, and wave for each entry
- Highlights player's own score if in top 10
- Shows "MP" indicator for multiplayer scores (cyan color)
- Positioned near top of screen (100 * scale from top), right-aligned
- Shows "Loading leaderboard..." if fetching
- Shows "Nobody yet!" when leaderboard successfully loaded but empty
- Shows error message with retry countdown if server unavailable

#### Socket.IO Integration (`js/systems/MultiplayerSystem.js`)

**`highscores:update` Event Handler**
- Listens for real-time leaderboard updates
- Updates `gameHUD.leaderboard` automatically
- Provides instant feedback when scores change

**`game:score:result` Event Handler**
- Receives score submission confirmation
- Refreshes leaderboard if score made top 10

#### Initialization (`js/main.js`)

- Fetches leaderboard on page load
- Auto-refreshes when entering main menu (throttled)

### Score Submission Flow

#### Multiplayer Session

1. Game ends (all players dead)
2. `GameStateManager.gameOver()` called
3. `submitScoreToServer()` checks if socket connected
4. If connected: Emits `game:score` via Socket.IO
5. Server processes, saves score, checks top 10
6. Server sends `game:score:result` with confirmation
7. Server broadcasts `highscores:update` if in top 10
8. All clients receive updated leaderboard

#### Single Player Session

1. Game ends (player dead)
2. `GameStateManager.gameOver()` called
3. `submitScoreToServer()` checks if socket connected
4. If not connected: Sends HTTP POST to `/api/highscore`
5. Server processes, saves score, checks top 10
6. Server returns JSON response with confirmation
7. Client refreshes leaderboard if score made top 10

### Leaderboard Display Flow

1. Player enters main menu
2. `drawMainMenu()` checks if leaderboard needs refresh (30s throttle)
3. If needed: `fetchLeaderboard()` sends GET request to `/api/highscores`
4. Server returns top 10 scores
5. Client stores in `gameHUD.leaderboard`
6. `drawLeaderboard()` renders list on main menu
7. Player's own score highlighted if present

### Performance Considerations

- **MongoDB Queries**: Asynchronous database operations (non-blocking)
- **In-Memory Cache**: Instant API responses without DB queries per request
- **Throttling**: Client fetches throttled to 30 seconds to reduce load
- **Top 10 Limit**: Only top 10 stored in memory/DB (efficient)
- **Non-Blocking**: Score submission doesn't block game over screen
- **Real-Time Updates**: Socket.IO broadcasts only when top 10 changes
- **Graceful Fallback**: Server continues operating with in-memory cache if MongoDB unavailable

## Chat System

### Overview

Real-time chat system for the multiplayer lobby that allows players to communicate before and during game sessions. Includes message history, rate limiting, and proper sanitization.

### Server-Side (`huggingface-space-SERVER/server.js`)

#### Chat Message Storage
- **Circular Buffer**: `chatMessages` array (max 50 messages) similar to `recentEvents`
- **Message Structure**: `{ id, playerId, playerName, message, timestamp, isSystem }`
- **Rate Limiting**: `chatRateLimits` Map tracking per-player message timestamps
  - Max 5 messages per 10-second window per player
  - Automatically cleaned up on player disconnect

#### Helper Functions

**`sanitizeChatMessage(message)`**
- Trims whitespace
- Removes control characters (except newlines/tabs)
- HTML entity encoding for XSS prevention (`&`, `<`, `>`, `"`, `'`)
- Length validation (1-200 characters)
- Returns `null` if invalid

**`checkRateLimit(socketId)`**
- Checks if player has exceeded rate limit (5 messages per 10 seconds)
- Removes old timestamps outside the window
- Returns `true` if allowed, `false` if rate limited

**`addChatMessage(playerId, playerName, message, isSystem)`**
- Adds message to circular buffer
- Generates unique message ID
- Returns message object

**`getChatHistory(limit)`**
- Returns recent messages from buffer (default 20)
- Messages returned in chronological order

#### Socket.IO Events

**Client → Server: `chat:message`**
- Payload: `{ message: string }`
- Validates message length (1-200 chars)
- Checks rate limit (max 5 messages per 10 seconds)
- Sanitizes message (trim, HTML encoding, XSS prevention)
- Broadcasts `chat:message:new` to all clients
- Stores message in circular buffer
- Sends `chat:rateLimit` error if rate limit exceeded
- Sends `chat:error` if message is invalid

**Client → Server: `chat:history`** (optional)
- Requests recent chat history on lobby join
- Server responds with last 20 messages from buffer

**Server → Client: `chat:message:new`**
- Broadcast to all clients when new message received
- Payload: `{ id, playerId, playerName, message, timestamp, isSystem }`

**Server → Client: `chat:rateLimit`**
- Sent when player exceeds rate limit
- Payload: `{ message: string, retryAfter: number }`

**Server → Client: `chat:error`**
- Sent when message validation fails
- Payload: `{ message: string }`

### Client-Side

#### State Management (`js/core/gameState.js`)

The `gameState.multiplayer` object includes:
- `chatMessages: []` - Array of chat messages
- `chatInput: ''` - Current input text
- `chatFocused: false` - Input focus state
- `chatScrollPosition: 0` - Scroll position for message history

#### Network Integration (`js/systems/MultiplayerSystem.js`)

**Event Handlers**
- `chat:message:new` - Receives new chat message, adds to `gameState.multiplayer.chatMessages`
- `chat:history` - Receives chat history on lobby join (optional)
- `chat:rateLimit` - Handles rate limit error (logs warning)
- `chat:error` - Handles chat error (logs error)

**Methods**
- `sendChatMessage(message)` - Emits `chat:message` event to server
  - Validates socket connection
  - Trims message before sending
  - Logs warnings on failure

#### UI Integration (`js/ui/GameHUD.js`)

**Chat Window Component (`drawChatWindow`)**
- Position: Lower-left corner of lobby with 20px padding from edges
- Dimensions: ~400px wide, ~200px tall (scaled with UI scale)
- Glassmorphism styling matching lobby design
- Disabled during game start countdown

**Chat Message Display (`drawChatMessages`)**
- Scrollable message list (max visible: ~8-10 messages)
- Message format: `PlayerName: message text`
- System messages: `[System]: message text` (gray, italic)
- Color coding:
  - Own messages: Orange highlight (`rgba(255, 152, 0, 0.9)`)
  - Other players: White (`rgba(255, 255, 255, 0.8)`)
  - System messages: Gray (`rgba(158, 158, 158, 0.7)`)
- Word wrapping for long messages (max 2-3 lines)
- Auto-scrolls to bottom (shows last N messages)

**Chat Input Field (`drawChatInput`)**
- Text input at bottom of chat window
- Character counter: `150/200` format
- Focus state: Red border glow when focused
- Placeholder text: "Type a message... (Enter to send)"
- Cursor blinking animation when focused
- Disabled during game start countdown

**Click Detection (`checkChatInputClick`)**
- Hit testing for input field
- Returns `true` if click is on input field
- Used by `checkMenuButtonClick()` to return `'chat_input'`

#### Input Handling (`js/main.js`)

**Keyboard Events**
- **Enter**: Sends message (if chat focused and message valid)
  - Trims message
  - Validates length (1-200 chars)
  - Calls `multiplayerSystem.sendChatMessage()`
  - Clears input and unfocuses
- **Escape**: Clears input and unfocuses (if chat focused)
- **Backspace**: Deletes last character (if chat focused)
- **Regular Characters**: Appends to input (if chat focused, max 200 chars)
- **Input Blocking**: Prevents game input when chat is focused

**Mouse Events**
- Click on input field: Focuses chat input
- Click elsewhere in lobby: Unfocuses chat input
- Chat unfocused when leaving lobby

### Security & Performance

#### Security
- **HTML Entity Encoding**: Prevents XSS attacks (`&`, `<`, `>`, `"`, `'`)
- **Message Length Limits**: 1-200 characters enforced
- **Rate Limiting**: 5 messages per 10 seconds per player
- **Input Sanitization**: Trim, remove control characters
- **Server-Side Validation**: All validation happens on server

#### Performance
- **Circular Buffer**: Fixed memory usage (50 messages max)
- **In-Memory Cache**: Messages stored in memory for fast access
- **Efficient Rendering**: Only visible messages rendered
- **Rate Limit Cleanup**: Old timestamps automatically removed

### Message Flow

1. **Player Types Message**
   - Client captures keyboard input when chat focused
   - Message stored in `gameState.multiplayer.chatInput`

2. **Player Presses Enter**
   - Client validates message (length, not empty)
   - Client calls `multiplayerSystem.sendChatMessage(message)`
   - Client clears input and unfocuses

3. **Server Receives Message**
   - Server validates: message format, length (1-200 chars)
   - Server checks rate limit (5 per 10 seconds)
   - Server sanitizes: trim, HTML encoding, XSS prevention
   - Server adds to circular buffer
   - Server broadcasts `chat:message:new` to all clients

4. **All Clients Receive Message**
   - Clients add message to `gameState.multiplayer.chatMessages`
   - UI automatically updates to show new message
   - Message list auto-scrolls to bottom

### Error Handling

- **Rate Limit Exceeded**: Server sends `chat:rateLimit`, client logs warning
- **Invalid Message**: Server sends `chat:error`, client logs error
- **Network Error**: Socket.io handles reconnection, messages may be lost
- **Server Disconnect**: Chat input disabled, messages cleared on reconnect

## Future Enhancements

- Room/Game session management (multiple concurrent games)
- Player limit enforcement
- Spectator mode
- Reconnection handling (resume ready state)
- Client-side prediction for local player
- Binary protocol for zombie updates (30-50% smaller payloads)
- **Chat Enhancements**:
  - Chat during gameplay (separate feature)
  - Emoji support
  - Private messages
  - Chat commands (/help, /players, etc.)
  - Message persistence across server restarts
  - Chat history on lobby rejoin
- **Leaderboard Enhancements**:
  - Time-based leaderboards (daily/weekly/monthly)
  - Category-specific leaderboards (wave-based, score-based, kills-based)
  - Pagination for more than 10 scores
  - Player rank lookup (where am I on the leaderboard?)

