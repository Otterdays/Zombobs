# MongoDB Integration Documentation

## Overview

The Zombobs server uses MongoDB Atlas (cloud database) for persistent highscore storage. This replaces the previous file-based storage system (`highscores.json`) which was lost on server restarts in Hugging Face Spaces' ephemeral filesystem.

**Key Benefits:**
- Persistent storage survives server restarts
- Cloud-hosted (no local database setup required)
- Free tier available (M0) sufficient for highscores
- Graceful fallback to in-memory cache if unavailable
- Fast queries with indexed score field

## Architecture

### Database Structure

```
Database: zombobs
└── Collection: highscores
    ├── Index: { score: -1 } (descending, for fast top-10 queries)
    └── Documents: Highscore entries
```

### Document Schema

Each highscore document has the following structure:

```javascript
{
  userId: string,           // Unique user ID from cookie (zombobs_user_id)
  username: string,          // Player display name
  score: number,             // Final game score (indexed, descending)
  wave: number,              // Wave reached
  zombiesKilled: number,     // Total zombies killed
  isMultiplayer: boolean,    // Whether score was achieved in multiplayer mode
  timestamp: string          // ISO timestamp when score was achieved
}
```

### Storage Strategy

**In-Memory Cache + Database:**
- **Cache**: `highscoresCache` array stores top 10 scores in memory
- **Database**: MongoDB stores all scores persistently
- **Query Pattern**: Cache used for API responses (instant), database for persistence

**Why This Approach:**
- API responses are instant (no DB query per request)
- Database writes are asynchronous (non-blocking)
- Server continues operating if MongoDB unavailable
- Top 10 limit enforced in both cache and database

## Connection Setup

### Environment Variables

The server looks for MongoDB connection string in these environment variables (in order):
1. `MONGO_URI` (preferred)
2. `MONGODB_URI` (fallback)

**Connection String Format:**
```
mongodb+srv://username:password@cluster.mongodb.net/?appName=Zombobs
```

### Hugging Face Spaces Setup

1. **Create MongoDB Atlas Account**
   - Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Create free account (M0 tier is sufficient)

2. **Create Cluster**
   - Choose **M0 FREE** tier
   - Select cloud provider/region closest to Hugging Face Spaces
   - Name cluster (e.g., "Zombobs")

3. **Configure Network Access**
   - Go to **Security** → **Network Access**
   - Click **+ ADD IP ADDRESS**
   - Click **Allow Access from Anywhere** (`0.0.0.0/0`)
   - Note: Required for Hugging Face Spaces (dynamic IPs)

4. **Create Database User**
   - Go to **Security** → **Database Access**
   - Click **+ ADD NEW DATABASE USER**
   - Choose **Password** authentication
   - Create username and password (save these!)
   - Set privileges to **Read and write to any database**

5. **Get Connection String**
   - Go to **Database** → **Clusters**
   - Click **Connect** on your cluster
   - Choose **Connect your application**
   - Select **Node.js** driver, version **6.7 or later**
   - Copy connection string
   - Replace `<password>` with your database user's password

6. **Add to Hugging Face Spaces**
   - Go to your Space: https://huggingface.co/spaces/OttertonDays/zombs
   - Click **Settings** → **Secrets**
   - Click **Add new secret**
   - Name: `MONGO_URI`
   - Value: Your complete connection string (with password)
   - Click **Add secret**

7. **Verify Connection**
   - Deploy server to Hugging Face Spaces
   - Check Container logs
   - Should see: `[MongoDB] ✅ Connected to MongoDB Highscores`

### Local Development Setup

For local development, set the environment variable before starting the server:

**Windows (PowerShell):**
```powershell
$env:MONGO_URI = "mongodb+srv://username:password@cluster.mongodb.net/?appName=Zombobs"
npm start
```

**Windows (Command Prompt):**
```cmd
set MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/?appName=Zombobs
npm start
```

**Linux/Mac:**
```bash
export MONGO_URI="mongodb+srv://username:password@cluster.mongodb.net/?appName=Zombobs"
npm start
```

## Server Functions

### `initMongoDB()`

**Purpose**: Initialize MongoDB connection and load initial highscores into cache

**Location**: `huggingface-space-SERVER/server.js`

**Behavior**:
- Checks for `MONGO_URI` or `MONGODB_URI` environment variable
- Connects to MongoDB Atlas
- Creates database and collection if they don't exist
- Creates index on `score` field (descending) for fast queries
- Loads top 10 scores into `highscoresCache`
- Logs connection status
- Falls back gracefully if connection fails

**Called**: On server startup (before HTTP server starts)

**Error Handling**:
- If no connection string: Warns and uses in-memory cache only
- If connection fails: Logs error, uses in-memory cache only
- Server continues operating in both cases

### `getHighscoresFromDB()`

**Purpose**: Fetch top 10 highscores from MongoDB

**Returns**: `Promise<Array>` - Array of highscore entries, sorted by score descending

**Behavior**:
- Queries `highscores` collection
- Sorts by `score` descending
- Limits to top 10 entries
- Validates and normalizes entry fields
- Returns empty array if collection doesn't exist or query fails

**Used By**:
- `initMongoDB()` - Load initial cache on startup
- `addHighscore()` - Refresh cache after new score added

### `getHighscores()`

**Purpose**: Get highscores from in-memory cache (instant, no DB query)

**Returns**: `Array` - Copy of `highscoresCache` array

**Behavior**:
- Returns cached highscores immediately
- No database query (fast API response)
- Returns copy to prevent external mutation

**Used By**:
- `GET /api/highscores` endpoint
- Socket.IO `highscores:update` event

### `addHighscore(entry)`

**Purpose**: Add new highscore entry to MongoDB and refresh cache

**Parameters**:
- `entry`: `{ userId, username, score, wave, zombiesKilled, isMultiplayer }`

**Returns**: `Promise<Array>` - Updated highscores array (top 10)

**Behavior**:
1. Validates entry (score must be > 0)
2. Creates score entry with timestamp
3. If MongoDB unavailable: Falls back to in-memory only
4. If MongoDB available:
   - Inserts new score into database
   - Refreshes cache from database (gets top 10)
   - Returns updated cache
5. Returns cached highscores on error

**Used By**:
- `POST /api/highscore` endpoint
- Socket.IO `game:score` event handler

## API Integration

### HTTP Endpoints

**GET `/api/highscores`**
- Returns top 10 global leaderboard
- Uses `getHighscores()` (in-memory cache, instant response)
- No database query per request
- Response: `{ highscores: [...] }`

**POST `/api/highscore`**
- Submits new score
- Uses `addHighscore()` (async, writes to MongoDB)
- Refreshes cache after insertion
- Returns: `{ success: true, isInTop10: boolean, rank: number | null }`

### Socket.IO Events

**Client → Server: `game:score`**
- Submits score on game over
- Payload: `{ username, score, wave, zombiesKilled, isMultiplayer }`
- Server extracts `userId` from socket handshake cookies
- Calls `addHighscore()` to save to MongoDB

**Server → Client: `game:score:result`**
- Sent after score submission
- Payload: `{ success: boolean, isInTop10: boolean, rank: number | null, highscores: [...] }`
- Includes top 10 leaderboard if score made it to top 10

**Server → All Clients: `highscores:update`**
- Broadcast when new score enters top 10
- Payload: `{ highscores: [...] }`
- All connected clients receive updated leaderboard

## Error Handling & Fallback

### Graceful Degradation

The server is designed to continue operating even if MongoDB is unavailable:

1. **No Connection String**
   - Warning logged: `[MongoDB] No connection string found`
   - Server uses in-memory cache only
   - Scores lost on server restart

2. **Connection Failure**
   - Error logged: `[MongoDB] ❌ Connection error: ...`
   - Server uses in-memory cache only
   - Scores lost on server restart

3. **Database Operation Failure**
   - Error logged: `[highscores] Error saving to MongoDB: ...`
   - Server continues with cached highscores
   - New scores saved to in-memory cache only

### Fallback Behavior

**When MongoDB Unavailable:**
- `highscoresCollection` is `null`
- `addHighscore()` saves to in-memory cache only
- `getHighscores()` returns cached scores
- Server logs: `[highscores] MongoDB not connected, using in-memory only`
- Server continues operating normally

**When MongoDB Available:**
- All scores saved to database
- Cache refreshed from database after each insertion
- Scores persist across server restarts
- Server logs: `[MongoDB] ✅ Connected to MongoDB Highscores`

## Performance Considerations

### Indexing

**Index Created**: `{ score: -1 }` (descending)

**Purpose**: Fast queries for top 10 scores

**Location**: Created automatically by `initMongoDB()`

**Impact**: Queries sorted by score are very fast (indexed field)

### Caching Strategy

**In-Memory Cache**:
- Stores top 10 scores in `highscoresCache` array
- Loaded once on server startup
- Refreshed after each new score insertion
- Used for all API responses (no DB query per request)

**Database Operations**:
- All database operations are asynchronous (non-blocking)
- Writes don't delay API responses
- Cache refresh happens after database write completes

### Query Optimization

**Top 10 Limit**:
- Database query uses `.limit(10)` to fetch only top 10
- Reduces network transfer and memory usage
- Index ensures fast sorting

**Single Query Pattern**:
- `getHighscoresFromDB()` does one query: find, sort, limit
- No multiple queries or complex aggregations
- Efficient for small dataset (highscores)

## Troubleshooting

### Connection Issues

**Problem**: `[MongoDB] ❌ Connection error: ...`

**Solutions**:
1. Verify connection string in Hugging Face Spaces secrets
2. Check Network Access allows `0.0.0.0/0`
3. Verify database user has correct permissions
4. Check password doesn't contain special characters needing URL encoding
5. Verify cluster is running (not paused)

**Problem**: `[MongoDB] No connection string found`

**Solutions**:
1. Add `MONGO_URI` secret in Hugging Face Spaces
2. Verify secret name is exactly `MONGO_URI` (case-sensitive)
3. For local development, set environment variable before starting server

### Data Issues

**Problem**: Scores not persisting

**Solutions**:
1. Check server logs for MongoDB connection status
2. Verify `addHighscore()` is being called (check logs)
3. Check database directly in MongoDB Atlas (Database → Browse Collections)
4. Verify index exists: `{ score: -1 }`

**Problem**: Scores lost on server restart

**Solutions**:
1. Verify MongoDB connection is successful (check startup logs)
2. Check if scores are actually in database (MongoDB Atlas)
3. Verify cache is being loaded from database on startup

### Performance Issues

**Problem**: Slow API responses

**Solutions**:
1. Verify cache is being used (should be instant)
2. Check if database queries are happening per request (shouldn't)
3. Verify index exists on `score` field
4. Check MongoDB Atlas cluster performance metrics

## Monitoring

### Server Logs

**Startup Logs**:
```
[MongoDB] ✅ Connected to MongoDB Highscores
[highscores] Loaded X highscores from MongoDB
```

**Error Logs**:
```
[MongoDB] ❌ Connection error: <error message>
[highscores] Error saving to MongoDB: <error message>
[highscores] MongoDB not connected, using in-memory only
```

**Operation Logs**:
- Score submissions logged via `game:score` event handler
- Cache refresh happens silently after database writes

### MongoDB Atlas Dashboard

**Metrics to Monitor**:
- Connection count (should be 1-2 active connections)
- Database size (should be small, <1MB for highscores)
- Query performance (should be fast with index)
- Cluster status (should be "Running")

**Collection Stats**:
- Document count (number of highscore entries)
- Index size (should be small)
- Storage size (should be minimal)

## Security

### Connection String Security

**Storage**:
- Connection string stored as secret in Hugging Face Spaces
- Never committed to code or version control
- Includes username and password (encrypted in transit)

**Access Control**:
- Database user has minimal required permissions (read/write to `zombobs` database)
- Network access restricted to specific IPs (or `0.0.0.0/0` for Hugging Face Spaces)

### Data Validation

**Server-Side Validation**:
- Score must be number >= 0
- Username sanitized (max 24 characters)
- User ID validated (from cookie)
- Timestamp generated server-side (ISO format)

**Input Sanitization**:
- All user input validated before database insertion
- No raw user input stored in database
- Timestamps generated server-side (prevents manipulation)

## Migration Notes

### From File-Based to MongoDB

**Previous System** (`highscores.json`):
- File-based storage in server root
- Lost on server restart (ephemeral filesystem)
- Synchronous file operations
- In-memory cache for API responses

**Current System** (MongoDB):
- Cloud-hosted persistent storage
- Survives server restarts
- Asynchronous database operations
- Same in-memory cache strategy
- Graceful fallback if unavailable

**Migration Path**:
- No data migration needed (fresh start)
- Old `highscores.json` file no longer used
- Server automatically creates database/collection on first connection

## Future Enhancements

### Potential Improvements

1. **Data Migration Tool**
   - Script to migrate existing `highscores.json` to MongoDB
   - Batch insert for historical scores

2. **Time-Based Leaderboards**
   - Daily/weekly/monthly leaderboards
   - Additional collections or date filtering

3. **Player Statistics**
   - Track player history across sessions
   - Additional collections for player data

4. **Connection Pooling**
   - Reuse MongoDB connections
   - Reduce connection overhead

5. **Read Replicas**
   - Separate read/write operations
   - Scale reads independently

## Dependencies

### Required Package

**mongodb** v6.3.0
- Official MongoDB driver for Node.js
- Source: npm registry
- Location: `huggingface-space-SERVER/package.json`

### Installation

```bash
cd huggingface-space-SERVER
npm install mongodb
```

### Version Compatibility

- **Node.js**: >=18.0.0 (required by server)
- **MongoDB Driver**: 6.3.0 (compatible with MongoDB Atlas)
- **MongoDB Server**: Any version supported by MongoDB Atlas (managed)

## References

- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [MongoDB Node.js Driver Documentation](https://docs.mongodb.com/drivers/node/)
- [Hugging Face Spaces Secrets](https://huggingface.co/docs/hub/spaces-sdks-docker#secrets)
- [Server Setup Guide](./SERVER_SETUP.md) - Detailed setup instructions

---

**Last Updated**: 2025-01-22  
**Version**: 0.7.2-ALPHA


