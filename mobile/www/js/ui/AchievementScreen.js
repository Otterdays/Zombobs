import { achievementSystem } from '../systems/AchievementSystem.js';
import { getAchievementCategories } from '../core/achievementDefinitions.js';
import { gameState } from '../core/gameState.js';

/**
 * AchievementScreen - UI component for achievement gallery
 * Uses HTML overlay instead of Canvas 2D drawing
 */
export class AchievementScreen {
    constructor(canvas) {
        this.canvas = canvas;
        this.container = null;
        this.isMounted = false;
        this.selectedCategory = 'all';
        this.gridContainer = null;
        this.achievementsGrid = null;
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
        this.container.id = 'achievements-overlay';

        // Create header
        const header = document.createElement('div');
        header.className = 'overlay-header';

        const headerLeft = document.createElement('div');
        const title = document.createElement('div');
        title.className = 'overlay-title';
        title.textContent = 'ACHIEVEMENTS';

        headerLeft.appendChild(title);
        header.appendChild(headerLeft);

        // Back button
        const backButton = document.createElement('button');
        backButton.className = 'btn-back';
        backButton.innerHTML = '<span>BACK</span>';
        backButton.addEventListener('click', () => {
            gameState.showAchievements = false;
            gameState.showMainMenu = true;
            this.unmount();
        });
        header.appendChild(backButton);

        // Create main content (2-column layout)
        const main = document.createElement('div');
        main.className = 'achievements-main';

        // Sidebar for categories
        const sidebar = document.createElement('div');
        sidebar.className = 'achievements-sidebar';
        this.sidebar = sidebar;

        // Main grid container
        const gridContainer = document.createElement('div');
        gridContainer.className = 'achievements-grid-container';
        this.gridContainer = gridContainer;

        const achievementsGrid = document.createElement('div');
        achievementsGrid.className = 'achievements-grid';
        this.achievementsGrid = achievementsGrid;

        gridContainer.appendChild(achievementsGrid);
        main.appendChild(sidebar);
        main.appendChild(gridContainer);

        // Assemble
        this.container.appendChild(header);
        this.container.appendChild(main);
        document.body.appendChild(this.container);

        // Render categories and achievements
        this.renderCategories();
        this.renderList(this.selectedCategory);

        this.isMounted = true;

        // Handle scroll events
        gridContainer.addEventListener('wheel', (e) => {
            e.preventDefault();
            gridContainer.scrollTop += e.deltaY;
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
        this.sidebar = null;
        this.gridContainer = null;
        this.achievementsGrid = null;
    }

    /**
     * Update the overlay content
     */
    update() {
        if (!this.isMounted) return;
        this.renderList(this.selectedCategory);
    }

    /**
     * Render category buttons in sidebar
     */
    renderCategories() {
        if (!this.sidebar) return;

        this.sidebar.innerHTML = '';

        const categories = ['all', ...getAchievementCategories()];

        categories.forEach(category => {
            const button = document.createElement('button');
            button.className = 'category-button';
            if (category === this.selectedCategory) {
                button.classList.add('active');
            }

            const categoryName = category === 'all' 
                ? 'All' 
                : category.charAt(0).toUpperCase() + category.slice(1);
            button.textContent = categoryName;

            button.addEventListener('click', () => {
                this.selectedCategory = category;
                this.renderCategories(); // Update active state
                this.renderList(category);
            });

            this.sidebar.appendChild(button);
        });
    }

    /**
     * Render achievement list based on category filter
     */
    renderList(category) {
        if (!this.achievementsGrid) return;

        // Get filtered achievements
        let achievements = category === 'all'
            ? achievementSystem.getAllAchievements()
            : achievementSystem.getAchievementsByCategory(category);

        // Sort: unlocked first, then by progress
        achievements.sort((a, b) => {
            if (a.unlocked && !b.unlocked) return -1;
            if (!a.unlocked && b.unlocked) return 1;
            if (a.unlocked && b.unlocked) return 0;
            // Both locked - sort by progress (descending)
            return (b.progress || 0) - (a.progress || 0);
        });

        // Clear grid
        this.achievementsGrid.innerHTML = '';

        // Create achievement cards
        achievements.forEach(achievement => {
            const card = document.createElement('div');
            card.className = 'achievement-card';
            if (achievement.unlocked) {
                card.classList.add('unlocked');
            } else {
                card.classList.add('locked');
            }

            // Icon
            const icon = document.createElement('div');
            icon.className = 'achievement-icon';
            icon.textContent = achievement.icon;
            card.appendChild(icon);

            // Name
            const name = document.createElement('div');
            name.className = 'achievement-name';
            name.textContent = achievement.name;
            card.appendChild(name);

            // Progress or unlocked indicator
            if (!achievement.unlocked && achievement.requirement) {
                const progress = document.createElement('div');
                progress.className = 'achievement-progress';

                const progressPercent = Math.min(100, 
                    (achievement.progress / achievement.requirement.value) * 100
                );

                const progressBar = document.createElement('div');
                progressBar.className = 'progress-bar-mini';

                const progressFill = document.createElement('div');
                progressFill.className = 'progress-bar-mini-fill';
                progressFill.style.width = `${progressPercent}%`;

                progressBar.appendChild(progressFill);

                const progressText = document.createElement('div');
                progressText.className = 'progress-text';
                progressText.textContent = `${Math.floor(progressPercent)}% - ${achievement.progress} / ${achievement.requirement.value}`;

                progress.appendChild(progressBar);
                progress.appendChild(progressText);
                card.appendChild(progress);
            } else if (achievement.unlocked) {
                const unlockedText = document.createElement('div');
                unlockedText.className = 'achievement-unlocked-text';
                unlockedText.textContent = '✓ UNLOCKED';
                card.appendChild(unlockedText);
            }

            // Description tooltip on hover
            card.title = achievement.description;

            this.achievementsGrid.appendChild(card);
        });
    }

    /**
     * Draw achievement screen (legacy method - now uses HTML overlay)
     */
    draw() {
        if (gameState.showAchievements) {
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
        gameState.showAchievements = false;
        this.unmount();
        return { action: 'back' };
    }

    /**
     * Handle scroll (now handled by DOM events)
     */
    handleScroll(deltaY) {
        // Scrolling is now handled by DOM wheel events
        // This method kept for compatibility
    }
}
