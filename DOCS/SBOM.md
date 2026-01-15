# Software Bill of Materials (SBOM)

This document lists all external dependencies, packages, and libraries used in the Zombie Survival Game project.

## External Dependencies

### Google Fonts (Bundled Locally)
- **Creepster** - Horror-themed display font
  - Source: Google Fonts
  - Usage: Game title and headers
  - Bundled locally: `assets/fonts/AlZy_zVUqJz4yMrniH4hdQ.ttf`
  - Last Updated: 2026-01-15 (offline mobile support)

- **Roboto Mono** - Monospaced font
  - Source: Google Fonts
  - Usage: UI text, HUD elements, body text
  - Bundled locally:
    - `assets/fonts/L0xuDF4xlVMF-BfR8bXMIhJHg45mwgGEFl0_3vqPQw.ttf` (400)
    - `assets/fonts/L0xuDF4xlVMF-BfR8bXMIhJHg45mwgGEFl0_Of2PQw.ttf` (700)
  - Last Updated: 2026-01-15 (offline mobile support)

- **Special Elite** - Typewriter-style display font
  - Source: Google Fonts
  - Usage: Game UI typography (web)
  - Bundled locally: `assets/fonts/XLYgIZbkc4JPUL5CVArUVL0nhnc.ttf`
  - Last Updated: 2026-01-15 (offline mobile support)

- **Courier Prime** - Monospaced font
  - Source: Google Fonts
  - Usage: Game UI typography (web)
  - Bundled locally:
    - `assets/fonts/u-450q2lgwslOqpF_6gQ8kELWwY.ttf` (400)
    - `assets/fonts/u-4k0q2lgwslOqpF_6gQ8kELY7pMf-c.ttf` (700)
  - Last Updated: 2026-01-15 (offline mobile support)

## Core Technologies (Built-in, No Installation Required)

### Browser APIs
- **HTML5 Canvas API** - 2D rendering engine
  - Standard browser API, no installation needed
  - Used for game graphics rendering

- **Web Audio API** - Sound generation
  - Standard browser API, no installation needed
  - Used for programmatic sound generation (gunshots, damage, footsteps, restart sounds)

- **HTML5 Gamepad API** - Controller input
  - Standard browser API, no installation needed
  - Used for Xbox controller and other gamepad support
  - Enables analog stick movement and aiming

- **LocalStorage API** - Data persistence
  - Standard browser API, no installation needed
  - Used for high score tracking and settings persistence

### JavaScript Runtime
- **Vanilla JavaScript (ES6+)** - Core programming language
  - No transpilation or build tools required
  - Runs directly in modern browsers

### HTML/CSS
- **HTML5** - Markup language
- **CSS3** - Styling language

## Server Dependencies (Node.js)

### Local Development Server (`LOCAL_SERVER/`)
- **Express** v4.18.2 - HTTP server framework for serving static files
  - Source: npm registry
  - Usage: Static file serving and HTTP server
  - Last Updated: 2024 (multiplayer setup)

- **socket.io** v4.6.1 - WebSocket library for real-time multiplayer communication
  - Source: npm registry
  - Usage: Client-server WebSocket connections for multiplayer functionality (server + served client bundle)
  - Last Updated: 2024 (multiplayer setup)

### Production Server (`huggingface-space-SERVER/`)
- **Express** v4.18.2 - HTTP server framework
  - Source: npm registry
  - Usage: HTTP server for API endpoints and Socket.IO server
  - Last Updated: 2024 (Hugging Face deployment)

- **socket.io** v4.7.2 - WebSocket library for real-time multiplayer communication
  - Source: npm registry
  - Usage: Client-server WebSocket connections for multiplayer functionality
  - Last Updated: 2024 (Hugging Face deployment)

- **cookie-parser** v1.4.7 - Cookie parsing middleware
  - Source: npm registry
  - Usage: Parse cookies for user session tracking (`zombobs_user_id`)
  - Last Updated: 2025-11-22 (MongoDB migration)

- **compression** v1.7.4 - Response compression middleware
  - Source: npm registry
  - Usage: Gzip compression for HTTP responses (performance optimization)
  - Last Updated: 2025-11-22 (MongoDB migration)

- **mongodb** v6.3.0 - Official MongoDB driver for Node.js
  - Source: npm registry
  - Usage: MongoDB Atlas connection for persistent highscore storage
  - Database: `zombobs`, Collection: `highscores`
  - Connection: Via `MONGO_URI` or `MONGODB_URI` environment variable
  - Last Updated: 2025-11-22 (MongoDB migration)

## Mobile Wrapper Dependencies (Capacitor)

### Android WebView Wrapper (`mobile/`)
- **@capacitor/core** v5.7.8 - Capacitor runtime for WebView bridge
  - Source: npm registry
  - Usage: Core Capacitor APIs and WebView runtime
  - Last Updated: 2026-01-15 (Android wrapper)

- **@capacitor/cli** v5.7.8 - Capacitor CLI tools
  - Source: npm registry
  - Usage: Project initialization, sync, native platform tools
  - Last Updated: 2026-01-15 (Android wrapper)

- **@capacitor/android** v5.7.8 - Android platform bindings
  - Source: npm registry
  - Usage: Generates Android project and WebView host
  - Last Updated: 2026-01-15 (Android wrapper)

- **@capacitor/assets** v3.0.5 - Asset generator (dev)
  - Source: npm registry
  - Usage: Generate Android icons and splash screens
  - Last Updated: 2026-01-15 (Android wrapper)

## External Services

### MongoDB Atlas (Production Highscore Storage)
- **Service**: MongoDB Atlas (cloud database)
  - Provider: MongoDB Inc.
  - Tier: Free M0 tier (sufficient for highscores)
  - Database: `zombobs`
  - Collection: `highscores`
  - Purpose: Persistent highscore leaderboard storage
  - Connection: Via connection string in `MONGO_URI` environment variable
  - Last Updated: 2025-11-22 (MongoDB migration)
  - Note: Optional - Server falls back to in-memory storage if unavailable

## Package Management

**Frontend:** No package manager or dependencies required (vanilla JavaScript).

**Backend:** Node.js and npm required. Dependencies managed via:
- `LOCAL_SERVER/package.json` (local development server)
- `huggingface-space-SERVER/package.json` (production Hugging Face deployment)

The frontend game code is intentionally dependency-free for simplicity (following KISS principle). The backend servers are minimal and lightweight.

## Security Notes

- All external resources are loaded from Google Fonts (HTTPS)
- Frontend uses no npm packages or CDN scripts (except Google Fonts)
- Backend server dependencies (Express, socket.io, mongodb) are standard, well-maintained packages
- External data is sent/received:
  - Font loading from Google Fonts
  - Multiplayer WebSocket connections to Hugging Face Space server
  - Highscore leaderboard API calls (GET/POST to `/api/highscores`)
  - MongoDB Atlas database connection (server-side only, connection string stored as secret)
- LocalStorage is used only for high score persistence (client-side only)
- MongoDB connection string stored as secret in Hugging Face Spaces (not in code)
- Server-side rate limiting and input sanitization prevent abuse

## Update History

- **2024** - Initial SBOM creation
- **2024** - Added server dependencies (Express, socket.io) for multiplayer functionality
- **2025-11-19** - Added HTML5 Gamepad API to browser APIs section
- **2025-11-22** - Added MongoDB Atlas integration and production server dependencies (mongodb, cookie-parser, compression)

---

**Last Audited**: 2025-11-22

