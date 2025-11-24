import { battlepassSystem } from '../systems/BattlepassSystem.js';
import { gameState } from '../core/gameState.js';

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

        // Track container
        const trackContainer = document.createElement('div');
        trackContainer.className = 'battlepass-track-container';

        const track = document.createElement('div');
        track.className = 'battlepass-track';
        this.track = track;

        trackContainer.appendChild(track);
        main.appendChild(progressContainer);
        main.appendChild(trackContainer);

        // Assemble
        this.container.appendChild(header);
        this.container.appendChild(main);
        document.body.appendChild(this.container);

        // Render tiers
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
            this.progressText.textContent = `Tier ${progress.currentTier} / ${progress.maxTier} - ${progress.battlepassXP} XP`;
        }

        // Update subtitle
        const subtitle = this.container?.querySelector('.overlay-subtitle');
        if (subtitle) {
            subtitle.textContent = `${seasonInfo.daysRemaining} days remaining`;
        }

        // Update tier states
        this.updateTierStates();
    }

    /**
     * Render all tier cards
     */
    renderTiers() {
        if (!this.track) return;

        this.track.innerHTML = '';

        const seasonInfo = battlepassSystem.getSeasonInfo();
        const progress = battlepassSystem.getProgress();
        const totalTiers = 50; // Season 1 has 50 tiers

        for (let tier = 1; tier <= totalTiers; tier++) {
            const tierReward = battlepassSystem.getTierReward(tier);
            const isUnlocked = battlepassSystem.isTierUnlocked(tier);
            const isCurrent = tier === progress.currentTier;

            const card = document.createElement('div');
            card.className = 'tier-card';
            if (isUnlocked) {
                card.classList.add('unlocked');
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

            // Reward
            const reward = document.createElement('div');
            reward.className = 'tier-reward';

            if (tierReward && tierReward.freeReward) {
                const freeReward = tierReward.freeReward;
                if (freeReward.type === 'rankXP') {
                    reward.textContent = '💎';
                    const rewardText = document.createElement('div');
                    rewardText.className = 'tier-reward-text';
                    rewardText.textContent = `+${freeReward.amount} XP`;
                    card.appendChild(rewardText);
                } else if (freeReward.type === 'title') {
                    reward.textContent = '🏷️';
                    const rewardText = document.createElement('div');
                    rewardText.className = 'tier-reward-text';
                    rewardText.textContent = 'TITLE';
                    card.appendChild(rewardText);
                } else if (freeReward.type === 'emblem') {
                    reward.textContent = '🎖️';
                    const rewardText = document.createElement('div');
                    rewardText.className = 'tier-reward-text';
                    rewardText.textContent = 'EMBLEM';
                    card.appendChild(rewardText);
                }
            } else {
                reward.textContent = '📦';
            }

            card.appendChild(reward);
            this.track.appendChild(card);
        }
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
            const isCurrent = tier === progress.currentTier;

            // Reset classes
            card.classList.remove('unlocked', 'current', 'locked');

            // Apply appropriate class
            if (isUnlocked) {
                card.classList.add('unlocked');
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
