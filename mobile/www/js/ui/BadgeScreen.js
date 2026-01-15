import { badgeSystem } from '../systems/BadgeSystem.js';
import { gameState } from '../core/gameState.js';
import { playerProfileSystem } from '../systems/PlayerProfileSystem.js';

/**
 * BadgeScreen - UI component for badge gallery
 * Uses HTML overlay with Dossier theme
 */
export class BadgeScreen {
    constructor(canvas) {
        this.canvas = canvas;
        this.container = null;
        this.isMounted = false;
        this.badgesGrid = null;
    }

    /**
     * Mount the HTML overlay
     */
    mount() {
        if (this.isMounted) {
            this.update();
            return;
        }

        // Track badge screen visit for badge
        playerProfileSystem.trackBadgeVisit();

        // Create container
        this.container = document.createElement('div');
        this.container.className = 'dossier-container';
        this.container.id = 'badges-overlay';

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
        title.textContent = 'BADGE COLLECTION';

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
            gameState.showBadges = false;
            gameState.showProfile = true;
            this.unmount();
        });
        header.appendChild(backButton);

        // Create main content
        const main = document.createElement('div');
        main.className = 'dossier-main';
        main.style.gridTemplateColumns = '1fr';
        this.main = main;

        // Badge statistics
        const statsSection = document.createElement('div');
        statsSection.className = 'dossier-section';
        statsSection.style.marginBottom = '24px';

        const statsTitle = document.createElement('div');
        statsTitle.className = 'section-title';
        statsTitle.textContent = 'BADGE STATISTICS';
        statsSection.appendChild(statsTitle);

        const badgeStats = badgeSystem.getStatistics();
        const statsGrid = document.createElement('div');
        statsGrid.className = 'stat-grid';
        this.createStatItem(statsGrid, 'TOTAL BADGES', badgeStats.total.toString());
        this.createStatItem(statsGrid, 'UNLOCKED', badgeStats.unlocked.toString());
        this.createStatItem(statsGrid, 'LOCKED', badgeStats.locked.toString());
        this.createStatItem(statsGrid, 'COMPLETION', `${Math.floor(badgeStats.completionPercent)}%`);
        statsSection.appendChild(statsGrid);
        main.appendChild(statsSection);

        // Badges grid container
        const badgesSection = document.createElement('div');
        badgesSection.className = 'dossier-section';

        const badgesTitle = document.createElement('div');
        badgesTitle.className = 'section-title';
        badgesTitle.textContent = 'ALL BADGES';
        badgesSection.appendChild(badgesTitle);

        const badgesGrid = document.createElement('div');
        badgesGrid.className = 'badges-grid';
        this.badgesGrid = badgesGrid;
        badgesSection.appendChild(badgesGrid);
        main.appendChild(badgesSection);

        // Assemble
        this.container.appendChild(header);
        this.container.appendChild(main);
        document.body.appendChild(this.container);

        // Render badges
        this.renderBadges();

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
        this.badgesGrid = null;
    }

    /**
     * Update the overlay content
     */
    update() {
        if (!this.isMounted) return;
        this.renderBadges();
    }

    /**
     * Render all badges in grid
     */
    renderBadges() {
        if (!this.badgesGrid) return;

        const badges = badgeSystem.getAllBadges();
        
        // Sort: unlocked first, then by ID
        badges.sort((a, b) => {
            if (a.unlocked && !b.unlocked) return -1;
            if (!a.unlocked && b.unlocked) return 1;
            return a.id.localeCompare(b.id);
        });

        // Clear grid
        this.badgesGrid.innerHTML = '';

        // Create badge cards
        badges.forEach(badge => {
            const card = document.createElement('div');
            card.className = 'badge-card';
            if (badge.unlocked) {
                card.classList.add('unlocked');
            } else {
                card.classList.add('locked');
            }

            // Icon
            const icon = document.createElement('div');
            icon.className = 'badge-card-icon';
            icon.textContent = badge.icon;
            card.appendChild(icon);

            // Name
            const name = document.createElement('div');
            name.className = 'badge-card-name';
            name.textContent = badge.name;
            card.appendChild(name);

            // Description
            const description = document.createElement('div');
            description.className = 'badge-card-description';
            description.textContent = badge.description;
            card.appendChild(description);

            // Unlocked indicator
            if (badge.unlocked) {
                const unlockedText = document.createElement('div');
                unlockedText.className = 'badge-card-unlocked';
                unlockedText.textContent = '✓ UNLOCKED';
                card.appendChild(unlockedText);
            } else {
                const lockedText = document.createElement('div');
                lockedText.className = 'badge-card-locked';
                lockedText.textContent = 'LOCKED';
                card.appendChild(lockedText);
            }

            this.badgesGrid.appendChild(card);
        });
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
     * Draw badge screen (legacy method - now uses HTML overlay)
     */
    draw() {
        if (gameState.showBadges) {
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
        gameState.showBadges = false;
        gameState.showProfile = true;
        this.unmount();
        return { action: 'back' };
    }
}

