# Permanent Rank & Progression System Documentation

## Overview

The Permanent Rank & Progression System provides long-term player advancement that persists across all game sessions. This system is separate from the in-game leveling system (which resets each game) and includes rank progression, achievements, and battlepass/expansion content.

---

## Table of Contents

1. [Rank System](#rank-system)
2. [Achievement System](#achievement-system)
3. [Battlepass System](#battlepass-system)
4. [Player Profile System](#player-profile-system)
5. [Data Persistence](#data-persistence)
6. [UI Components](#ui-components)
7. [Integration Points](#integration-points)
8. [Technical Implementation](#technical-implementation)

---

## Rank System

### Overview

The Rank System tracks permanent player progression through military-style ranks. Players accumulate Rank XP across all game sessions, separate from in-game XP which resets each game.

### Rank Progression

**Rank Structure**:
- 9 Ranks: Private → Corporal → Sergeant → Lieutenant → Captain → Major → Colonel → General → Legend
- 5 Tiers per rank (e.g., Private I, Private II, Private III, Private IV, Private V)
- Exponential XP scaling similar to in-game levels

**Rank Names**:
1. Private
2. Corporal
3. Sergeant
4. Lieutenant
5. Captain
6. Major
7. Colonel
8. General
9. Legend

### Rank XP Sources

**Session Score Conversion**:
- Default: 1 score = 0.1 rank XP (configurable via `SCORE_TO_RANK_XP_RATE`)
- Example: 1000 score = 100 rank XP

**Wave Completion Bonuses**:
- 10 rank XP per wave completed
- Encourages players to survive longer

**Achievement Rewards**:
- Achievements can award rank XP bonuses (typically 100-10,000 XP)
- Major achievements provide significant rank progression

**Battlepass Challenges**:
- Daily/weekly challenges can award rank XP
- Seasonal challenges provide large rank XP rewards

### Rank XP Requirements

**Formula**:
```
nextTierXP = baseXP × (scalingFactor ^ totalTiers)
```

**Constants**:
- `RANK_XP_BASE_REQUIREMENT = 100` (base XP for first tier of first rank)
- `RANK_XP_SCALING_FACTOR = 1.15` (15% increase per tier)

**Example Progression**:
- Private I → II: 100 XP
- Private II → III: 115 XP (100 × 1.15¹)
- Private III → IV: 132 XP (100 × 1.15²)
- Private V → Corporal I: 201 XP (100 × 1.15⁴)
- Total for Private rank: ~674 XP
- Total for Corporal rank: ~1,160 XP

### Rank Display

**In-Game**:
- Rank badge displayed next to username on main menu
- Shows current rank name and tier
- Optional rank badge in HUD (future feature)

**Profile Screen**:
- Full rank display with visual progress bar
- Progress bar shows current tier XP and next tier requirement
- Displays format: "XXX / YYY XP (ZZ%)"
- Gold gradient styling matching dossier theme (#d4af37 to #ffd700)
- Positioned below "RANK XP: XXXX" text in Personnel Information section
- Uses `rankSystem.getProgress()` to get `currentTierXP`, `nextTierXP`, and `progressPercent`
- Animated fill with glow effect and smooth transitions
- Displays total rank XP accumulated

**Game Over Screen**:
- Shows rank XP gained from session
- Displays rank-up notification if player advanced
- Shows new rank name and tier

### Technical Implementation

**Location**: `js/systems/RankSystem.js`

**Key Methods**:
- `initialize(profileData)` - Load rank data from profile
- `addSessionXP(score, wavesCompleted)` - Add XP from game session
- `addRankXP(amount)` - Add XP directly (from achievements)
- `updateRankFromXP()` - Recalculate rank/tier from total XP
- `getProgress()` - Get current rank progress info
- `getData()` - Get rank data for saving

**Dependencies**:
- `js/core/rankConstants.js` - Rank names, XP formulas, constants

---

## Achievement System

### Overview

The Achievement System tracks player milestones and unlocks achievements based on cumulative statistics. Achievements provide rank XP bonuses and unlockable titles.

### Achievement Categories

**Combat Achievements**:
- Kill milestones (100, 500, 1,000, 5,000, 10,000 zombies)
- Headshot milestones (50 headshots)
- Combo achievements (20-kill combo)

**Survival Achievements**:
- Wave milestones (5, 10, 20, 30, 50 waves)
- Time survived (5 minutes, 10 minutes)
- Perfect waves (complete wave without taking damage)

**Collection Achievements**:
- Weapon master (use all weapons in one game)
- Skill collector (unlock all 16 flat skills)
- Tree master (unlock all 15 class tree skills) [AMENDED 2026-06-25]
- Pickup hoarder (collect 100 pickups)

**Skill Achievements**:
- Accuracy master (80% accuracy in a game)
- Efficiency expert (100 kills with <200 bullets)

**Social Achievements**:
- Co-op warrior (win 10 co-op games)
- First blood (play first game)
- Dedicated player (play 50/100 games)

### Achievement Structure

**Data Format**:
```javascript
{
  id: "zombie_slayer_100",
  name: "Zombie Slayer",
  description: "Kill 100 zombies",
  category: "combat",
  icon: "💀",
  requirement: { type: "totalKills", value: 100 },
  reward: { rankXP: 500, title: "Slayer" },
  unlocked: false,
  unlockedDate: null,
  progress: 0
}
```

### Achievement Types

**Milestone Achievements**:
- Track cumulative totals (total kills, waves, games played)
- Progress updates after each session
- Unlock when threshold is reached

**Streak Achievements**:
- Track maximum values (max combo, highest wave)
- Compare session max to all-time max
- Unlock when new record is set

**Collection Achievements**:
- Track unique items collected (weapons used, skills unlocked)
- Session-based tracking (weapons used in one game)
- Cumulative tracking (total skills unlocked across all games)

**Time-Based Achievements**:
- Track time survived in single session
- Compare to all-time maximum
- Unlock when threshold is reached

### Achievement Rewards

**Rank XP Bonuses**:
- Small achievements: 100-500 XP
- Medium achievements: 750-1,500 XP
- Large achievements: 2,000-5,000 XP
- Legendary achievements: 10,000+ XP

**Titles**:
- Unlockable titles displayed next to username
- Examples: "Slayer", "Hunter", "Veteran", "Legend"
- Titles can be changed in profile settings (future feature)

### Achievement Notifications

**In-Game Display**:
- Achievement unlock popup appears during gameplay
- Non-intrusive notification in top-center of screen
- Shows achievement icon, name, and "ACHIEVEMENT UNLOCKED!" text
- Fades out after 5 seconds

**Achievement Gallery**:
- Full-screen achievement gallery accessible from main menu
- Filter by category (All, Combat, Survival, Collection, Skill, Social)
- Progress bars for locked achievements
- Unlock date display for completed achievements

### Technical Implementation

**Location**: `js/systems/AchievementSystem.js`

**Key Methods**:
- `initializeAchievements()` - Load achievement definitions
- `loadAchievements(profileAchievements)` - Load progress from profile
- `updateProgress(sessionStats)` - Update progress and check unlocks
- `unlockAchievement(achievement)` - Unlock achievement and apply rewards
- `getAchievement(id)` - Get achievement by ID
- `getAchievementsByCategory(category)` - Filter by category
- `getStatistics()` - Get completion statistics

**Dependencies**:
- `js/core/achievementDefinitions.js` - All achievement definitions
- `js/systems/RankSystem.js` - For rank XP rewards
- `js/systems/PlayerProfileSystem.js` - For title rewards

---

## Battlepass System

### Overview

The Battlepass System provides seasonal progression tracks with unlockable rewards. Each season lasts 60-90 days and includes 50 tiers of rewards.

### Season Structure

**Season 1: Outbreak**:
- Duration: 60 days (January 1 - March 1, 2025)
- 50 tiers of rewards
- Free track available to all players
- Premium track (future consideration)

### Battlepass Tiers

**Tier Progression**:
- Each tier requires increasing battlepass XP
- Base: 100 XP per tier
- Scaling: 10% increase per tier (1.1x multiplier)
- Total XP for tier 50: ~12,000 XP

**Reward Types**:
- **Rank XP**: Direct rank progression bonuses (100-25,000 XP)
- **Titles**: Unlockable titles (Recruit, Survivor, Warrior, etc.)
- **Emblems**: Visual badges/icons (zombie skull, bullet, shield, etc.)
- **Cosmetics**: Player skins, weapon skins (premium track, future)

### Battlepass XP Sources

**Match Completion**:
- Base: 10 XP per completed game
- Encourages regular play

**Daily Challenges**:
- Complete wave 5: 50 XP
- Kill 50 zombies: 50 XP
- Survive 5 minutes: 75 XP

**Weekly Challenges**:
- Survive 10 waves: 200 XP
- Get 100 headshots: 200 XP
- Win 3 co-op games: 250 XP

**Season Challenges**:
- Long-term goals (kill 1,000 zombies, survive 50 waves)
- Large XP rewards (500-2,000 XP)

**Achievement Completion**:
- Unlocking achievements grants battlepass XP
- Encourages achievement hunting

### Battlepass UI

**Progress Bar**:
- Shows current tier and progress to next tier
- Displays total battlepass XP accumulated
- Visual progress indicator

**Tier Track**:
- Horizontal scrollable tier progression
- Each tier shows reward preview
- Unlocked tiers highlighted in orange
- Current tier highlighted with glow effect

**Challenge List**:
- Daily challenges with progress tracking
- Weekly challenges with time remaining
- Season challenges with long-term goals

### Technical Implementation

**Location**: `js/systems/BattlepassSystem.js`

**Key Methods**:
- `initialize(profileData)` - Load battlepass data from profile
- `checkSeasonValidity()` - Reset if season expired
- `addXP(amount)` - Add battlepass XP and check tier unlocks
- `completeChallenge(challengeId, xpReward)` - Complete challenge
- `getSeasonInfo()` - Get current season information
- `getTierReward(tier)` - Get reward for specific tier
- `isTierUnlocked(tier)` - Check if tier is unlocked
- `getProgress()` - Get battlepass progress info

**Dependencies**:
- `js/core/battlepassDefinitions.js` - Season and tier definitions

---

## Player Profile System

### Overview

The Player Profile System manages all permanent player data, including rank, achievements, battlepass progress, and statistics. It handles data persistence, migration, and synchronization.

### Profile Structure

**Data Format**:
```javascript
{
  version: 1,
  username: "Survivor",
  playerId: "player_1234567890_abc123",
  avatar: null, // Future: custom avatar
  title: "Slayer", // Unlocked from achievements
  rank: {
    rankXP: 1500,
    rank: 2,
    rankTier: 3,
    rankName: "Corporal"
  },
  achievements: [
    {
      id: "zombie_slayer_100",
      unlocked: true,
      unlockedDate: "2025-01-15T10:30:00.000Z",
      progress: 100
    }
  ],
  battlepass: {
    currentSeason: 1,
    battlepassXP: 250,
    currentTier: 3,
    unlockedTiers: [1, 2, 3],
    completedChallenges: [],
    dailyChallenges: [],
    weeklyChallenges: [],
    lastDailyReset: null,
    lastWeeklyReset: null
  },
  stats: {
    totalGamesPlayed: 25,
    totalZombiesKilled: 1250,
    totalWavesSurvived: 150,
    totalTimePlayed: 3600,
    highestWave: 12,
    highestScore: 50000,
    averageWave: 6.0,
    favoriteWeapon: null,
    totalHeadshots: 45,
    maxCombo: 15,
    totalPerfectWaves: 2,
    totalSkillsUnlocked: 8,
    totalPickupsCollected: 75,
    totalCoopWins: 3
  }
}
```

### Profile Statistics

**Cumulative Stats**:
- `totalGamesPlayed` - Total number of games played
- `totalZombiesKilled` - Total zombies killed across all games
- `totalWavesSurvived` - Total waves survived
- `totalTimePlayed` - Total play time in seconds

**Record Stats**:
- `highestWave` - Highest wave reached in any game
- `highestScore` - Highest score achieved
- `maxCombo` - Maximum kill combo achieved

**Calculated Stats**:
- `averageWave` - Average wave reached per game
- `favoriteWeapon` - Most used weapon (future feature)

**Specialized Stats**:
- `totalHeadshots` - Total headshots across all games
- `totalPerfectWaves` - Waves completed without taking damage
- `totalSkillsUnlocked` - Unique skills unlocked
- `totalPickupsCollected` - Total pickups collected
- `totalCoopWins` - Co-op games won

### Data Persistence

**Storage**:
- **Key**: `zombobs_player_profile`
- **Format**: JSON object in localStorage
- **Backup**: Export/import functionality (future feature)

**Auto-Save**:
- Profile saved automatically on game over
- All systems update profile data before save
- No manual save required

**Migration**:
- Version 0 → 1: Migrates existing username/high score data
- Creates default profile for new players
- Handles missing data gracefully

### Profile Management

**Username System**:
- Username stored in profile
- Synced with existing username system
- Can be changed from main menu
- Updates profile automatically

**Title System**:
- Titles unlocked from achievements
- Displayed next to username (e.g., "Slayer Survivor")
- Can be changed in profile (future feature)
- Multiple titles available (most recent applied)

### Technical Implementation

**Location**: `js/systems/PlayerProfileSystem.js`

**Key Methods**:
- `loadProfile()` - Load profile from localStorage
- `saveProfile()` - Save profile to localStorage
- `createDefaultProfile()` - Create new player profile
- `migrateProfile(profile)` - Migrate old profile data
- `initializeSystems()` - Initialize all systems from profile
- `processSessionEnd(sessionStats)` - Process game session results
- `updateStats(sessionStats)` - Update profile statistics
- `setUsername(username)` - Update username
- `setTitle(title)` - Set player title
- `exportProfile()` - Export profile as JSON (backup)
- `importProfile(profileJson)` - Import profile from JSON (restore)

---

## Data Persistence

### Storage Strategy

**Primary Storage**: localStorage
- **Key**: `zombobs_player_profile`
- **Format**: Single JSON object containing all permanent data
- **Size**: Typically 5-10 KB per profile

**Data Flow**:
1. Game session ends
2. Session stats calculated
3. Rank XP added
4. Achievements checked
5. Battlepass updated
6. Profile saved to localStorage

### Profile Versioning

**Version System**:
- Profile includes version number
- Migration functions handle version upgrades
- Current version: 1

**Migration Support**:
- Automatic migration from version 0 (no version)
- Preserves existing username and high score data
- Initializes missing fields with defaults
- Graceful handling of corrupted data

### Backup & Restore

**Export Functionality**:
- Export profile as JSON string
- Can be saved to file or copied to clipboard
- Includes all permanent data

**Import Functionality**:
- Import profile from JSON string
- Validates and migrates imported data
- Reinitializes all systems with imported data
- Useful for profile backup/restore

---

## UI Components

### Rank Display (`js/ui/RankDisplay.js`)

**Components**:
- `drawRankBadge(x, y, size)` - Compact rank badge for menus
- `drawRankProgressBar(x, y, width, height)` - Rank progress bar
- `drawFullRankDisplay(x, y, width)` - Full rank display for profile

**Features**:
- Rank badge with rank name and tier
- Progress bar showing current tier progress
- Total rank XP display
- Orange/amber color scheme matching game aesthetic

### Achievement Screen (`js/ui/AchievementScreen.js`)

**Features**:
- Grid layout of all achievements
- Category filtering (All, Combat, Survival, Collection, Skill, Social)
- Progress bars for locked achievements
- Unlock date display for completed achievements
- Scrollable interface for large achievement lists

**Layout**:
- Category filter buttons at top
- Achievement cards in grid (2-3 columns)
- Each card shows icon, name, progress (if locked), or unlock status
- Back button to return to main menu

### Battlepass Screen (`js/ui/BattlepassScreen.js`)

**Features**:
- Horizontal scrollable tier track
- Progress bar showing current tier and XP
- Tier cards showing rewards
- Season information (name, days remaining)
- Unlocked tier highlighting

**Layout**:
- Season title and info at top
- Progress bar below title
- Horizontal tier track (scrollable)
- Each tier shows tier number, reward preview, unlock status
- Back button to return to main menu

### Profile Screen (`js/ui/ProfileScreen.js`)

**Features**:
- Player username and title display
- Full rank display with progress
- Statistics overview
- Achievement summary
- Battlepass progress summary

**Layout**:
- Left side: Username, rank display
- Right side: Statistics, achievement summary, battlepass summary
- Back button to return to main menu

### Achievement Notifications

**In-Game Display**:
- Appears in top-center during gameplay
- Shows achievement icon, name, and "ACHIEVEMENT UNLOCKED!" text
- Fades out after 5 seconds (300 frames at 60fps)
- Non-intrusive, doesn't block gameplay

**Implementation**:
- Stored in `gameState.achievementNotifications[]`
- Updated during gameplay when achievements unlock
- Rendered in `GameHUD.drawAchievementNotifications()`

---

## Integration Points

### Game Start Flow

1. **Load Profile**:
   - `playerProfileSystem.loadProfile()` loads from localStorage
   - Creates default profile if none exists
   - Migrates old data if needed

2. **Initialize Systems**:
   - `playerProfileSystem.initializeSystems()` initializes all systems
   - Rank system loads rank data
   - Achievement system loads achievement progress
   - Battlepass system loads battlepass data

3. **Sync Username**:
   - Profile username synced to `gameState.username`
   - Falls back to existing username system if profile missing

4. **Display Rank**:
   - Rank badge displayed on main menu
   - Shows current rank and tier

### Game Over Flow

1. **Calculate Session Stats**:
   - Score, waves, kills, time survived
   - Max combo, headshots, perfect waves
   - Co-op win status

2. **Process Session**:
   - `playerProfileSystem.processSessionEnd(sessionStats)` called
   - Updates profile statistics
   - Adds rank XP from score and waves
   - Checks achievements for unlocks
   - Updates battlepass progress

3. **Save Profile**:
   - Profile automatically saved to localStorage
   - All systems update their data before save

4. **Display Results**:
   - Game over screen shows rank XP gained
   - Achievement notifications displayed
   - Rank-up notification if player advanced

### In-Game Integration

**Achievement Progress Tracking**:
- Progress tracked during gameplay
- Updates checked on game over
- Real-time tracking for session-based achievements

**Battlepass Challenge Progress**:
- Challenges tracked during gameplay
- Progress updates on game over
- Daily/weekly challenges reset automatically

**Rank Display** (Optional):
- Rank badge can be displayed in HUD
- Currently only shown on main menu
- Future: Optional HUD rank badge

---

## Technical Implementation

### File Structure

**Core Constants**:
- `js/core/rankConstants.js` - Rank names, XP formulas, constants
- `js/core/achievementDefinitions.js` - All achievement definitions
- `js/core/battlepassDefinitions.js` - Battlepass season and tier definitions

**Systems**:
- `js/systems/RankSystem.js` - Rank progression logic
- `js/systems/AchievementSystem.js` - Achievement tracking and unlocks
- `js/systems/BattlepassSystem.js` - Battlepass progression and rewards
- `js/systems/PlayerProfileSystem.js` - Profile data management

**UI Components**:
- `js/ui/RankDisplay.js` - Rank UI components
- `js/ui/AchievementScreen.js` - Achievement gallery UI
- `js/ui/BattlepassScreen.js` - Battlepass UI
- `js/ui/ProfileScreen.js` - Player profile UI

**Modified Files**:
- `js/core/gameState.js` - Added profile state flags
- `js/systems/GameStateManager.js` - Added session end processing
- `js/main.js` - Added profile initialization and screen handling
- `js/ui/GameHUD.js` - Added menu buttons and rank display

### System Initialization

**Startup Sequence**:
```javascript
// 1. Load existing username (for migration)
loadUsername();

// 2. Load and initialize profile
playerProfileSystem.loadProfile();
playerProfileSystem.initializeSystems();

// 3. Sync username from profile
gameState.username = profile.username;
```

### Session End Processing

**Flow**:
```javascript
// 1. Calculate session stats
const sessionStats = {
  score: gameState.score,
  wave: gameState.wave,
  kills: gameState.zombiesKilled,
  timeSurvived: (Date.now() - gameState.gameStartTime) / 1000
};

// 2. Process session
const results = playerProfileSystem.processSessionEnd(sessionStats);

// 3. Store results for UI display
gameState.sessionResults = results;

// 4. Add achievement notifications
results.newlyUnlocked.forEach(achievement => {
  gameState.achievementNotifications.push({
    achievement: achievement,
    life: 300,
    maxLife: 300
  });
});
```

### Data Flow

**Profile Update Flow**:
```
Game Session Ends
    ↓
Calculate Session Stats
    ↓
Update Profile Stats
    ↓
Add Rank XP (score + waves)
    ↓
Check Achievement Progress
    ↓
Unlock Achievements (if thresholds met)
    ↓
Update Battlepass XP
    ↓
Unlock Battlepass Tiers (if thresholds met)
    ↓
Save Profile to localStorage
    ↓
Display Results in UI
```

---

## Balance Notes

### Rank XP Conversion Rate

**Current Rate**: 1 score = 0.1 rank XP
- 1000 score = 100 rank XP
- 10,000 score = 1,000 rank XP
- Provides steady progression without being too fast

**Wave Bonuses**: 10 XP per wave
- Encourages players to survive longer
- Wave 10 = +100 rank XP bonus
- Wave 20 = +200 rank XP bonus

### Achievement Rewards

**XP Rewards by Tier**:
- Small (100-500 XP): Early game achievements
- Medium (750-1,500 XP): Mid-game milestones
- Large (2,000-5,000 XP): Late-game achievements
- Legendary (10,000+ XP): End-game achievements

**Title Rewards**:
- Titles provide cosmetic progression
- No gameplay advantage
- Displayed next to username

### Battlepass Progression

**XP Requirements**:
- Tier 1-10: 100-200 XP per tier
- Tier 11-20: 250-400 XP per tier
- Tier 21-30: 500-1,200 XP per tier
- Tier 31-40: 1,500-4,000 XP per tier
- Tier 41-50: 5,000-25,000 XP per tier

**Completion Time**:
- Casual play: 30-45 days for tier 50
- Regular play: 20-30 days for tier 50
- Dedicated play: 15-20 days for tier 50

---

## Future Considerations

1. **Server-Side Profiles**: Migrate to server for cross-device sync
2. **Leaderboards**: Rank-based leaderboards
3. **Clans/Guilds**: Social features with rank requirements
4. **Prestige System**: Reset rank for permanent bonuses
5. **Seasonal Events**: Special battlepass seasons with unique themes
6. **Trading**: Exchange battlepass rewards (if multiplayer expanded)
7. **Custom Avatars**: Player avatar customization
8. **Title Selection**: Allow players to choose from unlocked titles
9. **Rank Badge in HUD**: Optional rank display during gameplay
10. **Achievement Categories**: Expand achievement categories
11. **Battlepass Premium Track**: Paid track with exclusive rewards
12. **Daily Login Rewards**: Bonus rank XP for daily logins

---

## Summary

The Permanent Rank & Progression System provides:

1. **Long-Term Progression**: Rank system that accumulates across all games
2. **Achievement Hunting**: 30+ achievements to unlock
3. **Seasonal Content**: Battlepass with 50 tiers of rewards
4. **Player Identity**: Username, title, and rank display
5. **Statistics Tracking**: Comprehensive player statistics
6. **Data Persistence**: Automatic save/load via localStorage

The system is fully integrated and provides meaningful long-term progression that encourages players to return and continue playing.

