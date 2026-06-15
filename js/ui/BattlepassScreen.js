import { battlepassSystem } from '../systems/BattlepassSystem.js';
import { playerProfileSystem } from '../systems/PlayerProfileSystem.js';
import { gameState } from '../core/gameState.js';
import { PLAYER_SKINS } from '../core/constants.js';

/**
 * BattlepassScreen - UI component for battlepass progression
 * Uses HTML overlay instead of Canvas 2D drawing
 */
export class BattlepassScreen {
    constructor(canvas) {
        this.canvas = canvas;
        this.container = null;
        this.isMounted = false;
    }

    /**
     * Mount the HTML overlay
     */
    mount() {
        if (this.isMounted) {
            this.update();
            return;
        }

        // Create container
        this.container = document.createElement('div');
        this.container.className = 'overlay-container';
        this.container.id = 'battlepass-overlay';

        // Create header
        const header = document.createElement('div');
        header.className = 'overlay-header';

        const headerLeft = document.createElement('div');
        const title = document.createElement('div');
        title.className = 'overlay-title';
        const seasonInfo = battlepassSystem.getSeasonInfo();
        title.textContent = `BATTLEPASS: ${seasonInfo.name}`;

        const subtitle = document.createElement('div');
        subtitle.className = 'overlay-subtitle';
        subtitle.textContent = `${seasonInfo.daysRemaining} days remaining`;

        headerLeft.appendChild(title);
        headerLeft.appendChild(subtitle);
        header.appendChild(headerLeft);

        // Back button
        const backButton = document.createElement('button');
        backButton.className = 'btn-back';
        backButton.innerHTML = '<span>BACK</span>';
        backButton.addEventListener('click', () => {
            gameState.showBattlepass = false;
            gameState.showMainMenu = true;
            this.unmount();
        });
        header.appendChild(backButton);

        // Create main content
        const main = document.createElement('div');
        main.className = 'battlepass-main';

        // Progress bar container
        const progressContainer = document.createElement('div');
        progressContainer.className = 'battlepass-progress-container';

        const progressWrapper = document.createElement('div');
        progressWrapper.className = 'progress-bar-wrapper';

        const progressFill = document.createElement('div');
        progressFill.className = 'progress-bar-fill';
        this.progressFill = progressFill;

        const progressText = document.createElement('div');
        progressText.className = 'progress-bar-text';
        this.progressText = progressText;

        progressWrapper.appendChild(progressFill);
        progressWrapper.appendChild(progressText);
        progressContainer.appendChild(progressWrapper);

        // Challenges Container
        const challengesContainer = document.createElement('div');
        challengesContainer.className = 'battlepass-challenges-container';
        this.challengesContainer = challengesContainer;
        
        main.appendChild(progressContainer);
        main.appendChild(challengesContainer);

        // Track container
        const trackContainer = document.createElement('div');
        trackContainer.className = 'battlepass-track-container';

        const track = document.createElement('div');
        track.className = 'battlepass-track';
        this.track = track;

        trackContainer.appendChild(track);
        main.appendChild(trackContainer);

        // Assemble
        this.container.appendChild(header);
        this.container.appendChild(main);
        document.body.appendChild(this.container);

        // Render content
        this.renderChallenges();
        this.renderTiers();
        this.update();

        this.isMounted = true;

        // Handle scroll events
        trackContainer.addEventListener('wheel', (e) => {
            e.preventDefault();
            trackContainer.scrollLeft += e.deltaY;
        });
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
        this.track = null;
        this.progressFill = null;
        this.progressText = null;
        this.challengesContainer = null;
    }

    /**
     * Update the overlay content
     */
    update() {
        if (!this.isMounted) return;

        const progress = battlepassSystem.getProgress();
        const seasonInfo = battlepassSystem.getSeasonInfo();

        // Update progress bar
        if (this.progressFill) {
            const percent = Math.min(100, Math.max(0, progress.progressPercent));
            this.progressFill.style.width = `${percent}%`;
        }

        if (this.progressText) {
            if (progress.currentTier >= progress.maxTier) {
                this.progressText.textContent = `MAX TIER! - ${progress.battlepassXP} XP`;
            } else {
                this.progressText.textContent = `Tier ${progress.currentTier} / ${progress.maxTier} - ${progress.battlepassXP} XP`;
            }
        }

        // Update subtitle
        const subtitle = this.container?.querySelector('.overlay-subtitle');
        if (subtitle) {
            if (seasonInfo.daysRemaining > 0) {
                subtitle.textContent = `${seasonInfo.daysRemaining} days remaining`;
            } else {
                subtitle.textContent = 'Season ended';
            }
        }
        
        // Refresh challenges display to show progress updates
        this.renderChallenges();

        // Update tier states
        this.updateTierStates();
    }

    /**
     * Render active challenges
     */
    renderChallenges() {
        if (!this.challengesContainer) return;
        
        this.challengesContainer.innerHTML = '';
        const progress = battlepassSystem.getProgress();
        
        // Daily Challenges Header
        const dailyHeader = document.createElement('div');
        dailyHeader.className = 'challenges-header';
        dailyHeader.textContent = 'Daily Challenges';
        this.challengesContainer.appendChild(dailyHeader);
        
        const dailyWrapper = document.createElement('div');
        dailyWrapper.className = 'challenges-wrapper';
        
        progress.dailyChallenges.forEach(challenge => {
            this.createChallengeCard(challenge, dailyWrapper);
        });
        this.challengesContainer.appendChild(dailyWrapper);

        // Weekly Challenges Header
        const weeklyHeader = document.createElement('div');
        weeklyHeader.className = 'challenges-header';
        weeklyHeader.textContent = 'Weekly Challenges';
        this.challengesContainer.appendChild(weeklyHeader);

        const weeklyWrapper = document.createElement('div');
        weeklyWrapper.className = 'challenges-wrapper';
        
        progress.weeklyChallenges.forEach(challenge => {
            this.createChallengeCard(challenge, weeklyWrapper);
        });
        this.challengesContainer.appendChild(weeklyWrapper);
    }
    
    /**
     * Create a single challenge card element
     */
    createChallengeCard(challenge, parent) {
        const card = document.createElement('div');
        card.className = `challenge-card ${challenge.completed ? 'completed' : ''}`;
        
        const info = document.createElement('div');
        info.className = 'challenge-info';
        
        const title = document.createElement('div');
        title.className = 'challenge-title';
        title.textContent = challenge.description;
        
        const reward = document.createElement('div');
        reward.className = 'challenge-reward';
        reward.textContent = `+${challenge.reward} XP`;
        
        info.appendChild(title);
        info.appendChild(reward);
        
        const progress = document.createElement('div');
        progress.className = 'challenge-progress';
        progress.textContent = `${challenge.progress} / ${challenge.target}`;
        
        card.appendChild(info);
        card.appendChild(progress);
        
        parent.appendChild(card);
    }

    /**
     * Render all tier cards
     */
    renderTiers() {
        if (!this.track) return;

        this.track.innerHTML = '';

        const progress = battlepassSystem.getProgress();
        const totalTiers = progress.maxTier;

        for (let tier = 1; tier <= totalTiers; tier++) {
            const tierReward = battlepassSystem.getTierReward(tier);
            const isUnlocked = battlepassSystem.isTierUnlocked(tier);
            const isClaimed = battlepassSystem.isTierClaimed(tier);
            const isCurrent = tier === progress.currentTier;

            const card = document.createElement('div');
            card.className = 'tier-card';
            if (isUnlocked) {
                card.classList.add('unlocked');
                if (isClaimed) {
                    card.classList.add('claimed');
                }
            } else if (isCurrent) {
                card.classList.add('current');
            } else {
                card.classList.add('locked');
            }

            // Tier number
            const tierNumber = document.createElement('div');
            tierNumber.className = 'tier-number';
            tierNumber.textContent = `Tier ${tier}`;
            card.appendChild(tierNumber);

            // Reward Container
            const rewardsContainer = document.createElement('div');
            rewardsContainer.className = 'tier-rewards-container';

            // Free Reward
            if (tierReward && tierReward.freeReward) {
                this.createRewardElement(tierReward.freeReward, rewardsContainer, false);
            }

            // Premium Reward
            if (tierReward && tierReward.premiumReward) {
                this.createRewardElement(tierReward.premiumReward, rewardsContainer, true);
            } else {
                // Empty slot for alignment
                const empty = document.createElement('div');
                empty.className = 'tier-reward empty';
                rewardsContainer.appendChild(empty);
            }

            // Claim button for unlocked but unclaimed tiers
            if (isUnlocked && !isClaimed) {
                const claimBtn = document.createElement('button');
                claimBtn.className = 'btn-claim';
                claimBtn.textContent = 'CLAIM';
                claimBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const rewards = battlepassSystem.claimTierReward(tier);
                    if (rewards) {
                        playerProfileSystem.saveProfile();
                        this.renderTiers();
                    }
                });
                card.appendChild(claimBtn);
            }

            card.appendChild(rewardsContainer);
            this.track.appendChild(card);
        }
    }
    
    /**
     * Helper to create reward icon/text
     */
    createRewardElement(rewardData, parent, isPremium) {
        const rewardEl = document.createElement('div');
        rewardEl.className = `tier-reward ${isPremium ? 'premium' : 'free'}`;
        
        let icon = '📦';
        let text = 'REWARD';
        
        if (rewardData.type === 'rankXP') {
            icon = '💎';
            text = `+${rewardData.amount} XP`;
        } else if (rewardData.type === 'title') {
            icon = '🏷️';
            text = `Title: ${rewardData.value}`;
        } else if (rewardData.type === 'emblem') {
            icon = '🎖️';
            text = 'Emblem';
        } else if (rewardData.type === 'cosmetic') {
             icon = '🎨';
             const skinName = PLAYER_SKINS[rewardData.value]?.name || 'Skin';
             text = `${skinName} Skin`;
        }
        
        const iconEl = document.createElement('div');
        iconEl.className = 'reward-icon';
        iconEl.textContent = icon;
        
        const textEl = document.createElement('div');
        textEl.className = 'reward-text';
        textEl.textContent = text;
        
        rewardEl.appendChild(iconEl);
        rewardEl.appendChild(textEl);
        
        if (isPremium) {
            const badge = document.createElement('div');
            badge.className = 'premium-badge';
            badge.textContent = 'PRO';
            rewardEl.appendChild(badge);
        }
        
        parent.appendChild(rewardEl);
    }

    /**
     * Update tier card states
     */
    updateTierStates() {
        if (!this.track) return;

        const progress = battlepassSystem.getProgress();
        const cards = this.track.querySelectorAll('.tier-card');

        cards.forEach((card, index) => {
            const tier = index + 1;
            const isUnlocked = battlepassSystem.isTierUnlocked(tier);
            const isClaimed = battlepassSystem.isTierClaimed(tier);
            const isCurrent = tier === progress.currentTier;

            // Reset classes
            card.classList.remove('unlocked', 'current', 'locked', 'claimed');

            // Apply appropriate class
            if (isUnlocked) {
                card.classList.add('unlocked');
                if (isClaimed) {
                    card.classList.add('claimed');
                }
            } else if (isCurrent) {
                card.classList.add('current');
            } else {
                card.classList.add('locked');
            }
        });
    }

    /**
     * Draw battlepass screen (legacy method - now uses HTML overlay)
     */
    draw() {
        if (gameState.showBattlepass) {
            this.mount();
            this.update();
        } else {
            this.unmount();
        }
    }

    /**
     * Handle click (back button)
     */
    handleClick() {
        gameState.showBattlepass = false;
        this.unmount();
        return { action: 'back' };
    }

    /**
     * Handle scroll (now handled by DOM events)
     */
    handleScroll(deltaX) {
        // Scrolling is now handled by DOM wheel events
        // This method kept for compatibility
    }
}