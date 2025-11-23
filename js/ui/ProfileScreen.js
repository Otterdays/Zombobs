import { playerProfileSystem } from '../systems/PlayerProfileSystem.js';
import { rankSystem } from '../systems/RankSystem.js';
import { achievementSystem } from '../systems/AchievementSystem.js';
import { battlepassSystem } from '../systems/BattlepassSystem.js';
import { badgeSystem } from '../systems/BadgeSystem.js';
import { gameState } from '../core/gameState.js';

/**
 * ProfileScreen - UI component for player profile
 * Uses HTML overlay with Dossier theme instead of Canvas 2D drawing
 */
export class ProfileScreen {
    constructor(canvas) {
        this.canvas = canvas;
        this.container = null;
        this.isMounted = false;
    }

    /**
     * Mount the HTML overlay
     */
    mount() {
        // Track profile visit for badge
        playerProfileSystem.trackProfileVisit();
        
        if (this.isMounted) {
            this.update();
            return;
        }

        // Create container
        this.container = document.createElement('div');
        this.container.className = 'dossier-container';
        this.container.id = 'profile-overlay';

        // Create header (Personnel File)
        const header = document.createElement('div');
        header.className = 'personnel-file';

        // Paperclip decoration
        const paperclip = document.createElement('div');
        paperclip.className = 'paperclip-decoration';
        header.appendChild(paperclip);

        // Header left section
        const headerLeft = document.createElement('div');
        const title = document.createElement('div');
        title.className = 'dossier-title';
        title.textContent = 'PERSONNEL DOSSIER';

        const subtitle = document.createElement('div');
        subtitle.className = 'dossier-subtitle';
        subtitle.textContent = 'CLASSIFIED - AUTHORIZED PERSONNEL ONLY';

        headerLeft.appendChild(title);
        headerLeft.appendChild(subtitle);
        header.appendChild(headerLeft);

        // TOP SECRET stamp
        const stamp = document.createElement('div');
        stamp.className = 'stamp-secret';
        stamp.textContent = 'TOP SECRET';
        header.appendChild(stamp);

        // Back button (styled for dossier)
        const backButton = document.createElement('button');
        backButton.className = 'btn-back';
        backButton.style.marginTop = '8px';
        backButton.innerHTML = '<span>BACK</span>';
        backButton.addEventListener('click', () => {
            gameState.showProfile = false;
            gameState.showMainMenu = true;
            this.unmount();
        });
        header.appendChild(backButton);

        // Create main content (2-column grid)
        const main = document.createElement('div');
        main.className = 'dossier-main';
        this.main = main;

        // Assemble
        this.container.appendChild(header);
        this.container.appendChild(main);
        document.body.appendChild(this.container);

        // Render content
        this.renderContent();

        this.isMounted = true;
    }

    /**
     * Unmount the HTML overlay
     */
    unmount() {
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
        this.container = null;
        this.isMounted = false;
        this.main = null;
    }

    /**
     * Update the overlay content
     */
    update() {
        if (!this.isMounted) return;
        this.renderContent();
    }

    /**
     * Render all content sections
     */
    renderContent() {
        if (!this.main) return;

        this.main.innerHTML = '';

        const profile = playerProfileSystem.getProfile();
        const stats = profile.stats;
        const rankData = rankSystem.getData();
        const rankProgress = rankSystem.getProgress(); // Get progress data for progress bar
        const achievementStats = achievementSystem.getStatistics();
        const battlepassProgress = battlepassSystem.getProgress();

        // Left column - Personnel Info
        const leftColumn = document.createElement('div');
        leftColumn.className = 'dossier-section';

        const personnelTitle = document.createElement('div');
        personnelTitle.className = 'section-title';
        personnelTitle.textContent = 'PERSONNEL INFORMATION';
        leftColumn.appendChild(personnelTitle);

        const personnelInfo = document.createElement('div');
        personnelInfo.className = 'personnel-info';

        // Username
        const nameDiv = document.createElement('div');
        const name = document.createElement('div');
        name.className = 'personnel-name';
        let usernameText = profile.username || 'Survivor';
        if (profile.title) {
            usernameText = `${profile.title} ${usernameText}`;
        }
        name.textContent = usernameText.toUpperCase();
        nameDiv.appendChild(name);

        // Player ID
        const playerId = document.createElement('div');
        playerId.className = 'personnel-title';
        playerId.textContent = `ID: ${profile.playerId || 'UNKNOWN'}`;
        nameDiv.appendChild(playerId);

        personnelInfo.appendChild(nameDiv);

        // Rank Display
        const rankDiv = document.createElement('div');
        rankDiv.className = 'rank-display-dossier';
        
        const rankBadge = document.createElement('div');
        rankBadge.className = 'rank-badge-dossier';
        
        const rankName = document.createElement('div');
        rankName.className = 'rank-name-dossier';
        rankName.textContent = rankData.rankName || 'PRIVATE';
        
        const rankTier = document.createElement('div');
        rankTier.className = 'rank-tier-dossier';
        rankTier.textContent = `TIER ${rankData.rankTier || 1}`;
        
        rankBadge.appendChild(rankName);
        rankBadge.appendChild(rankTier);
        rankDiv.appendChild(rankBadge);

        // Rank XP
        const rankXP = document.createElement('div');
        rankXP.style.marginTop = '12px';
        rankXP.style.fontSize = '12px';
        rankXP.style.color = '#8b6914';
        rankXP.style.fontFamily = "'Courier Prime', monospace";
        rankXP.textContent = `RANK XP: ${rankData.rankXP || 0}`;
        rankDiv.appendChild(rankXP);

        // Rank XP Progress Bar
        const progressContainer = document.createElement('div');
        progressContainer.style.marginTop = '16px';
        
        const progressWrapper = document.createElement('div');
        progressWrapper.className = 'progress-bar-wrapper';
        progressWrapper.style.height = '24px'; // Smaller than battlepass bar
        progressWrapper.style.border = '1px solid #8b6914';
        progressWrapper.style.background = 'rgba(0, 0, 0, 0.5)';
        progressWrapper.style.borderRadius = '4px';
        progressWrapper.style.overflow = 'hidden';
        progressWrapper.style.position = 'relative';
        
        const progressFill = document.createElement('div');
        progressFill.className = 'progress-bar-fill';
        const progressPercent = Math.min(100, Math.max(0, rankProgress.progressPercent || 0));
        progressFill.style.width = `${progressPercent}%`;
        progressFill.style.height = '100%';
        progressFill.style.background = 'linear-gradient(90deg, #d4af37 0%, #ffd700 100%)';
        progressFill.style.borderRadius = '4px';
        progressFill.style.transition = 'width 0.3s ease';
        progressFill.style.boxShadow = '0 0 10px rgba(212, 175, 55, 0.6)';
        
        const progressText = document.createElement('div');
        progressText.className = 'progress-bar-text';
        progressText.style.position = 'absolute';
        progressText.style.inset = '0';
        progressText.style.display = 'flex';
        progressText.style.alignItems = 'center';
        progressText.style.justifyContent = 'center';
        progressText.style.fontWeight = '700';
        progressText.style.fontSize = '11px';
        progressText.style.color = '#ffffff';
        progressText.style.fontFamily = "'Courier Prime', monospace";
        progressText.style.textShadow = '0 0 8px rgba(0, 0, 0, 0.8)';
        progressText.style.pointerEvents = 'none';
        const currentXP = rankProgress.currentTierXP || 0;
        const nextXP = rankProgress.nextTierXP || 100;
        progressText.textContent = `${currentXP} / ${nextXP} XP (${Math.floor(progressPercent)}%)`;
        
        progressWrapper.appendChild(progressFill);
        progressWrapper.appendChild(progressText);
        progressContainer.appendChild(progressWrapper);
        rankDiv.appendChild(progressContainer);

        personnelInfo.appendChild(rankDiv);

        // Badge Bar
        const badgeBarContainer = document.createElement('div');
        badgeBarContainer.style.marginTop = '24px';
        
        const badgeBarLabel = document.createElement('div');
        badgeBarLabel.style.fontSize = '12px';
        badgeBarLabel.style.color = '#8b6914';
        badgeBarLabel.style.fontFamily = "'Courier Prime', monospace";
        badgeBarLabel.style.marginBottom = '8px';
        badgeBarLabel.textContent = 'BADGES';
        badgeBarContainer.appendChild(badgeBarLabel);

        const badgeBar = document.createElement('div');
        badgeBar.className = 'badge-bar';
        badgeBar.style.display = 'flex';
        badgeBar.style.gap = '8px';

        // Get unlocked badges (most recent first, limit to 3)
        const unlockedBadges = badgeSystem.getUnlockedBadges().slice(0, 3);
        
        // Create 3 badge slots
        for (let i = 0; i < 3; i++) {
            const badgeSlot = document.createElement('div');
            badgeSlot.className = 'badge-slot';
            
            if (i < unlockedBadges.length) {
                // Show unlocked badge
                badgeSlot.classList.add('filled');
                badgeSlot.textContent = unlockedBadges[i].icon;
                badgeSlot.title = unlockedBadges[i].name;
            } else {
                // Show empty slot
                badgeSlot.classList.add('empty');
                badgeSlot.textContent = '?';
            }
            
            badgeBar.appendChild(badgeSlot);
        }

        badgeBarContainer.appendChild(badgeBar);

        // VIEW BADGES button
        const viewBadgesButton = document.createElement('button');
        viewBadgesButton.className = 'btn-view-badges';
        viewBadgesButton.style.marginTop = '12px';
        viewBadgesButton.style.width = '100%';
        viewBadgesButton.style.padding = '10px 16px';
        viewBadgesButton.style.background = 'rgba(0, 0, 0, 0.4)';
        viewBadgesButton.style.border = '2px solid #8b6914';
        viewBadgesButton.style.borderRadius = '4px';
        viewBadgesButton.style.color = '#d4af37';
        viewBadgesButton.style.fontFamily = "'Courier Prime', monospace";
        viewBadgesButton.style.fontSize = '12px';
        viewBadgesButton.style.fontWeight = '700';
        viewBadgesButton.style.textTransform = 'uppercase';
        viewBadgesButton.style.letterSpacing = '0.1em';
        viewBadgesButton.style.cursor = 'pointer';
        viewBadgesButton.style.transition = 'all 0.2s ease';
        viewBadgesButton.textContent = 'VIEW BADGES';
        
        viewBadgesButton.addEventListener('mouseenter', () => {
            viewBadgesButton.style.borderColor = '#d4af37';
            viewBadgesButton.style.boxShadow = '0 0 10px rgba(212, 175, 55, 0.4)';
        });
        
        viewBadgesButton.addEventListener('mouseleave', () => {
            viewBadgesButton.style.borderColor = '#8b6914';
            viewBadgesButton.style.boxShadow = 'none';
        });
        
        viewBadgesButton.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            // Ensure profile screen unmounts first
            if (this.isMounted) {
                this.unmount();
            }
            
            // Close profile and open badge screen
            gameState.showProfile = false;
            gameState.showMainMenu = false;
            gameState.showBadges = true;
            
            // Force badge screen to render on next frame
            requestAnimationFrame(() => {
                if (window.badgeScreen) {
                    window.badgeScreen.draw();
                }
            });
        });
        
        // Also try mousedown as backup
        viewBadgesButton.addEventListener('mousedown', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            // Ensure profile screen unmounts first
            if (this.isMounted) {
                this.unmount();
            }
            
            // Close profile and open badge screen
            gameState.showProfile = false;
            gameState.showMainMenu = false;
            gameState.showBadges = true;
            
            // Force badge screen to render on next frame
            requestAnimationFrame(() => {
                if (window.badgeScreen) {
                    window.badgeScreen.draw();
                }
            });
        });

        badgeBarContainer.appendChild(viewBadgesButton);
        personnelInfo.appendChild(badgeBarContainer);

        leftColumn.appendChild(personnelInfo);
        this.main.appendChild(leftColumn);

        // Right column - Field Statistics & Commendations
        const rightColumn = document.createElement('div');
        rightColumn.style.display = 'flex';
        rightColumn.style.flexDirection = 'column';
        rightColumn.style.gap = '24px';

        // Field Statistics Section
        const statsSection = document.createElement('div');
        statsSection.className = 'dossier-section';

        const statsTitle = document.createElement('div');
        statsTitle.className = 'section-title';
        statsTitle.textContent = 'FIELD STATISTICS';
        statsSection.appendChild(statsTitle);

        const statGrid = document.createElement('div');
        statGrid.className = 'stat-grid';

        // Games Played
        this.createStatItem(statGrid, 'GAMES PLAYED', stats.totalGamesPlayed.toLocaleString());
        
        // Zombies Killed
        this.createStatItem(statGrid, 'ZOMBIES KILLED', stats.totalZombiesKilled.toLocaleString());
        
        // Waves Survived
        this.createStatItem(statGrid, 'WAVES SURVIVED', stats.totalWavesSurvived.toLocaleString());
        
        // Highest Wave
        this.createStatItem(statGrid, 'HIGHEST WAVE', stats.highestWave.toString());
        
        // Highest Score
        this.createStatItem(statGrid, 'HIGHEST SCORE', stats.highestScore.toLocaleString());
        
        // Time Played
        const timePlayedHours = Math.floor(stats.totalTimePlayed / 3600);
        const timePlayedMinutes = Math.floor((stats.totalTimePlayed % 3600) / 60);
        const timePlayedText = timePlayedHours > 0 ? `${timePlayedHours}h ${timePlayedMinutes}m` : `${timePlayedMinutes}m`;
        this.createStatItem(statGrid, 'TIME PLAYED', timePlayedText);

        statsSection.appendChild(statGrid);
        rightColumn.appendChild(statsSection);

        // Commendations Section
        const commendationsSection = document.createElement('div');
        commendationsSection.className = 'dossier-section';

        const commendationsTitle = document.createElement('div');
        commendationsTitle.className = 'section-title';
        commendationsTitle.textContent = 'COMMENDATIONS';
        commendationsSection.appendChild(commendationsTitle);

        const commendationsGrid = document.createElement('div');
        commendationsGrid.className = 'stat-grid';

        // Achievements
        this.createStatItem(commendationsGrid, 'ACHIEVEMENTS', `${achievementStats.unlocked} / ${achievementStats.total}`);
        this.createStatItem(commendationsGrid, 'ACHIEVEMENT COMPLETION', `${Math.floor(achievementStats.completionPercent)}%`);
        
        // Battlepass
        this.createStatItem(commendationsGrid, 'BATTLEPASS TIER', `${battlepassProgress.currentTier} / ${battlepassProgress.maxTier}`);
        this.createStatItem(commendationsGrid, 'UNLOCKED TIERS', battlepassProgress.unlockedTiers.toString());

        commendationsSection.appendChild(commendationsGrid);
        rightColumn.appendChild(commendationsSection);

        this.main.appendChild(rightColumn);
    }

    /**
     * Create a stat item
     */
    createStatItem(container, label, value) {
        const statItem = document.createElement('div');
        statItem.className = 'stat-item';

        const statLabel = document.createElement('div');
        statLabel.className = 'stat-label';
        statLabel.textContent = label;

        const statValue = document.createElement('div');
        statValue.className = 'stat-value';
        statValue.textContent = value;

        statItem.appendChild(statLabel);
        statItem.appendChild(statValue);
        container.appendChild(statItem);
    }

    /**
     * Draw profile screen (legacy method - now uses HTML overlay)
     */
    draw() {
        if (gameState.showProfile) {
            this.mount();
            this.update();
        } else {
            this.unmount();
        }
    }

    /**
     * Handle click (back button - now handled by DOM events)
     */
    handleClick() {
        gameState.showProfile = false;
        gameState.showMainMenu = true;
        this.unmount();
        return { action: 'back' };
    }
}
