import { gameState } from '../core/gameState.js';
import { settingsManager } from '../systems/SettingsManager.js';
import { WEAPONS } from '../core/constants.js';

export class GalleryScreen {
    constructor(canvas, ctx, hud) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.hud = hud;
        this.hoveredButton = null;
        this.galleryScrollY = 0;
        this.galleryTargetScrollY = 0;
    }

    getUIScale() {
        return this.hud.getUIScale();
    }

    draw() {
        this.hud.drawCreepyBackground();

        const scale = this.getUIScale();
        const centerX = this.canvas.width / 2;
        const canvas = this.canvas;
        const ctx = this.ctx;

        // Initialize scroll if not exists
        if (!this.galleryScrollY) this.galleryScrollY = 0;
        if (!this.galleryTargetScrollY) this.galleryTargetScrollY = 0;

        // Title - scaled
        const galleryTitleFontSize = Math.max(36, 48 * scale);
        ctx.font = `bold ${galleryTitleFontSize}px "Creepster", cursive`;
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ff1744';
        ctx.shadowBlur = 30 * scale;
        ctx.shadowColor = 'rgba(255, 23, 68, 0.8)';
        ctx.fillText('GALLERY', centerX, 60 * scale);
        ctx.shadowBlur = 0;

        // Subtitle
        const subtitleFontSize = Math.max(12, 16 * scale);
        ctx.font = `${subtitleFontSize}px "Roboto Mono", monospace`;
        ctx.fillStyle = '#9e9e9e';
        ctx.fillText('Showcase of Zombies, Weapons & Pickups', centerX, 90 * scale);

        // Smooth scroll
        this.galleryScrollY += (this.galleryTargetScrollY - this.galleryScrollY) * 0.2;
        
        // Content area with clipping
        const contentStartY = 120 * scale;
        const contentHeight = canvas.height - contentStartY - (120 * scale); // Space for back button
        const padding = 20 * scale;
        
        ctx.save();
        ctx.beginPath();
        ctx.rect(padding, contentStartY, canvas.width - padding * 2, contentHeight);
        ctx.clip();

        let currentY = contentStartY - this.galleryScrollY;

        // Section spacing
        const sectionSpacing = 40 * scale;
        const cardSpacing = 20 * scale;
        const cardWidth = (canvas.width - padding * 4) / 2; // 2 columns
        const cardHeight = 140 * scale;

        // ZOMBIES SECTION
        currentY = this.drawGallerySection('ZOMBIES', centerX, currentY, scale, cardWidth, cardHeight, cardSpacing, padding, [
            { type: 'normal', name: 'Normal Zombie', health: 'Base', speed: 'Base', desc: 'Standard zombie enemy', spawn: 'Always' },
            { type: 'fast', name: 'Fast Zombie', health: '60%', speed: '1.6x', desc: 'The Runner - faster but weaker', spawn: 'Wave 3+' },
            { type: 'exploding', name: 'Exploding Zombie', health: '80%', speed: '0.9x', desc: 'The Boomer - explodes on death', spawn: 'Wave 5+' },
            { type: 'armored', name: 'Armored Zombie', health: '2x', speed: '0.8x', desc: 'The Tank - heavily armored', spawn: 'Wave 4+' },
            { type: 'ghost', name: 'Ghost Zombie', health: '80%', speed: '1.3x', desc: 'Semi-transparent spectral enemy', spawn: 'Wave 4+' },
            { type: 'spitter', name: 'Spitter Zombie', health: '80%', speed: '1.2x', desc: 'Ranged acid projectile attacks', spawn: 'Wave 6+' },
            { type: 'boss', name: 'Boss Zombie', health: 'Massive', speed: '1.2x', desc: 'Epic boss with devastating attacks', spawn: 'Every 5 waves' }
        ], 'zombie');

        currentY += sectionSpacing;

        // WEAPONS SECTION
        currentY = this.drawGallerySection('WEAPONS', centerX, currentY, scale, cardWidth, cardHeight, cardSpacing, padding, [
            { key: 'pistol', name: 'Pistol', damage: '1', fireRate: '400ms', ammo: '10', desc: 'Balanced starting weapon' },
            { key: 'shotgun', name: 'Shotgun', damage: '3', fireRate: '800ms', ammo: '5', desc: 'High damage, close range' },
            { key: 'rifle', name: 'Rifle', damage: '2', fireRate: '200ms', ammo: '30', desc: 'Fast firing, high capacity' },
            { key: 'flamethrower', name: 'Flamethrower', damage: '0.5/tick', fireRate: '50ms', ammo: '100', desc: 'Short range DoT weapon' },
            { key: 'smg', name: 'SMG', damage: '0.8', fireRate: '80ms', ammo: '40', desc: 'Rapid fire submachine gun' },
            { key: 'sniper', name: 'Sniper', damage: '15', fireRate: '1500ms', ammo: '5', desc: 'High damage, piercing shots' },
            { key: 'rocketLauncher', name: 'RPG', damage: '60 AOE', fireRate: '2000ms', ammo: '3', desc: 'Explosive area damage' }
        ], 'weapon');

        currentY += sectionSpacing;

        // PICKUPS SECTION
        currentY = this.drawGallerySection('PICKUPS', centerX, currentY, scale, cardWidth, cardHeight, cardSpacing, padding, [
            { type: 'health', name: 'Health Pickup', effect: '+25 HP', desc: 'Restores health' },
            { type: 'ammo', name: 'Ammo Pickup', effect: '+15 Ammo', desc: 'Refills ammo and grenades' },
            { type: 'damage', name: 'Damage Buff', effect: '2x Damage (10s)', desc: 'Double damage for 10 seconds' },
            { type: 'nuke', name: 'Tactical Nuke', effect: 'Instant Kill All', desc: 'Rare - clears all zombies' },
            { type: 'speed', name: 'Speed Boost', effect: '1.5x Speed (8s)', desc: 'Increased movement speed' },
            { type: 'rapidfire', name: 'Rapid Fire', effect: '2x Fire Rate (10s)', desc: 'Faster weapon firing' },
            { type: 'shield', name: 'Shield', effect: '+50 Shield', desc: 'Absorbs damage before health' },
            { type: 'adrenaline', name: 'Adrenaline', effect: 'Multiple Buffs', desc: 'Combined power-up effects' }
        ], 'pickup');

        const totalContentHeight = currentY + this.galleryScrollY - contentStartY;
        const maxScroll = Math.max(0, totalContentHeight - contentHeight);
        
        // Clamp scroll
        if (this.galleryTargetScrollY < 0) this.galleryTargetScrollY = 0;
        if (this.galleryTargetScrollY > maxScroll) this.galleryTargetScrollY = maxScroll;
        if (this.galleryScrollY < 0) this.galleryScrollY = 0;
        if (this.galleryScrollY > maxScroll) this.galleryScrollY = maxScroll;

        ctx.restore();

        // Scroll indicator (if scrollable)
        if (maxScroll > 0) {
            const scrollBarWidth = 6 * scale;
            const scrollBarX = canvas.width - padding - scrollBarWidth;
            const scrollBarHeight = contentHeight;
            const scrollBarY = contentStartY;
            const thumbHeight = Math.max(20 * scale, (contentHeight / totalContentHeight) * scrollBarHeight);
            const thumbY = scrollBarY + (this.galleryScrollY / maxScroll) * (scrollBarHeight - thumbHeight);

            // Scrollbar track
            ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.fillRect(scrollBarX, scrollBarY, scrollBarWidth, scrollBarHeight);

            // Scrollbar thumb
            ctx.fillStyle = 'rgba(255, 23, 68, 0.6)';
            ctx.fillRect(scrollBarX, thumbY, scrollBarWidth, thumbHeight);
        }

        // Back button (always visible)
        const buttonWidth = 240 * scale;
        const buttonHeight = 50 * scale;
        const backY = canvas.height - (100 * scale);
        this.hud.drawMenuButton('Back', centerX - buttonWidth / 2, backY - buttonHeight / 2, buttonWidth, buttonHeight, this.hoveredButton === 'gallery_back', false);
    }

    drawGallerySection(title, centerX, startY, scale, cardWidth, cardHeight, cardSpacing, padding, items, itemType) {
        const ctx = this.ctx;
        const canvas = this.canvas;
        
        // Section title
        const sectionTitleSize = Math.max(20, 24 * scale);
        ctx.font = `bold ${sectionTitleSize}px "Roboto Mono", monospace`;
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ff9800';
        ctx.shadowBlur = 15 * scale;
        ctx.shadowColor = 'rgba(255, 152, 0, 0.5)';
        ctx.fillText(title, centerX, startY);
        ctx.shadowBlur = 0;
        
        let currentY = startY + (40 * scale);
        
        // Draw items in 2-column grid
        for (let i = 0; i < items.length; i++) {
            const row = Math.floor(i / 2);
            const col = i % 2;
            const cardX = padding + col * (cardWidth + cardSpacing);
            const cardY = currentY + row * (cardHeight + cardSpacing);
            
            // Draw glass card
            this.hud.drawGlassCard(cardX, cardY, cardWidth, cardHeight);
            
            // Icon area (left side)
            const iconSize = 60 * scale;
            const iconX = cardX + (30 * scale);
            const iconY = cardY + cardHeight / 2;
            
            // Draw icon based on type
            if (itemType === 'zombie') {
                this.drawZombieIcon(iconX, iconY, iconSize, items[i].type);
            } else if (itemType === 'weapon') {
                this.drawWeaponIcon(iconX, iconY, iconSize, items[i].key);
            } else if (itemType === 'pickup') {
                this.drawPickupIcon(iconX, iconY, iconSize, items[i].type);
            }
            
            // Text area (right side)
            const textX = cardX + (100 * scale);
            const textY = cardY + (20 * scale);
            const textWidth = cardWidth - (110 * scale);
            
            // Name
            const nameSize = Math.max(14, 16 * scale);
            ctx.font = `bold ${nameSize}px "Roboto Mono", monospace`;
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            ctx.fillText(items[i].name, textX, textY);
            
            // Stats/Info
            const statSize = Math.max(10, 12 * scale);
            ctx.font = `${statSize}px "Roboto Mono", monospace`;
            ctx.fillStyle = '#ff9800';
            let statY = textY + (22 * scale);
            
            if (itemType === 'zombie') {
                ctx.fillText(`Health: ${items[i].health}`, textX, statY);
                statY += (18 * scale);
                ctx.fillText(`Speed: ${items[i].speed}`, textX, statY);
                statY += (18 * scale);
                ctx.fillText(`Spawn: ${items[i].spawn}`, textX, statY);
            } else if (itemType === 'weapon') {
                ctx.fillText(`Damage: ${items[i].damage}`, textX, statY);
                statY += (18 * scale);
                ctx.fillText(`Fire Rate: ${items[i].fireRate}`, textX, statY);
                statY += (18 * scale);
                ctx.fillText(`Ammo: ${items[i].ammo}`, textX, statY);
            } else if (itemType === 'pickup') {
                ctx.fillText(`Effect: ${items[i].effect}`, textX, statY);
            }
            
            // Description
            const descSize = Math.max(9, 11 * scale);
            ctx.font = `${descSize}px "Roboto Mono", monospace`;
            ctx.fillStyle = '#cccccc';
            statY += (22 * scale);
            ctx.fillText(items[i].desc, textX, statY, textWidth);
        }
        
        // Calculate final Y position
        const rows = Math.ceil(items.length / 2);
        return startY + (40 * scale) + rows * (cardHeight + cardSpacing);
    }

    drawZombieIcon(x, y, size, type) {
        const ctx = this.ctx;
        const time = Date.now();
        ctx.save();
        ctx.translate(x, y);

        const radius = size * 0.4;
        
        switch(type) {
            case 'normal':
                // Green zombie
                const normalGradient = ctx.createRadialGradient(-3, -3, 0, 0, 0, radius);
                normalGradient.addColorStop(0, '#9acd32');
                normalGradient.addColorStop(1, '#33691e');
                ctx.fillStyle = normalGradient;
                ctx.beginPath();
                ctx.arc(0, 0, radius, 0, Math.PI * 2);
                ctx.fill();
                // Eyes
                ctx.fillStyle = `rgba(255, 0, 0, ${0.7 + Math.sin(time / 167) * 0.3})`;
                ctx.beginPath();
                ctx.arc(-radius * 0.4, -radius * 0.25, radius * 0.25, 0, Math.PI * 2);
                ctx.arc(radius * 0.4, -radius * 0.25, radius * 0.25, 0, Math.PI * 2);
                ctx.fill();
                break;
            case 'fast':
                // Reddish/orange zombie
                const fastGradient = ctx.createRadialGradient(-3, -3, 0, 0, 0, radius);
                fastGradient.addColorStop(0, '#ff8c42');
                fastGradient.addColorStop(1, '#8b4513');
                ctx.fillStyle = fastGradient;
                ctx.beginPath();
                ctx.arc(0, 0, radius * 0.9, 0, Math.PI * 2);
                ctx.fill();
                // Bright red eyes
                ctx.fillStyle = `rgba(255, 0, 0, ${0.8 + Math.sin(time / 100) * 0.2})`;
                ctx.beginPath();
                ctx.arc(-radius * 0.35, -radius * 0.2, radius * 0.2, 0, Math.PI * 2);
                ctx.arc(radius * 0.35, -radius * 0.2, radius * 0.2, 0, Math.PI * 2);
                ctx.fill();
                break;
            case 'exploding':
                // Orange/yellow pulsing zombie
                const pulse = 0.8 + Math.sin(time / 150) * 0.2;
                const explodeGradient = ctx.createRadialGradient(-3, -3, 0, 0, 0, radius);
                explodeGradient.addColorStop(0, `rgba(255, ${165 + pulse * 50}, 0, 1)`);
                explodeGradient.addColorStop(1, '#ff6600');
                ctx.fillStyle = explodeGradient;
                ctx.beginPath();
                ctx.arc(0, 0, radius, 0, Math.PI * 2);
                ctx.fill();
                // Yellow eyes
                ctx.fillStyle = '#ffeb3b';
                ctx.beginPath();
                ctx.arc(-radius * 0.4, -radius * 0.25, radius * 0.2, 0, Math.PI * 2);
                ctx.arc(radius * 0.4, -radius * 0.25, radius * 0.2, 0, Math.PI * 2);
                ctx.fill();
                break;
            case 'armored':
                // Dark gray with armor plates
                const armorGradient = ctx.createRadialGradient(-3, -3, 0, 0, 0, radius);
                armorGradient.addColorStop(0, '#616161');
                armorGradient.addColorStop(1, '#212121');
                ctx.fillStyle = armorGradient;
                ctx.beginPath();
                ctx.arc(0, 0, radius * 1.1, 0, Math.PI * 2);
                ctx.fill();
                // Armor plates
                ctx.strokeStyle = '#9e9e9e';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(0, -radius * 0.3, radius * 0.3, 0, Math.PI);
                ctx.stroke();
                // Red eyes
                ctx.fillStyle = '#ff1744';
                ctx.beginPath();
                ctx.arc(-radius * 0.4, -radius * 0.25, radius * 0.2, 0, Math.PI * 2);
                ctx.arc(radius * 0.4, -radius * 0.25, radius * 0.2, 0, Math.PI * 2);
                ctx.fill();
                break;
            case 'ghost':
                // Semi-transparent pale blue
                ctx.globalAlpha = 0.5;
                const ghostGradient = ctx.createRadialGradient(-3, -3, 0, 0, 0, radius);
                ghostGradient.addColorStop(0, '#b3e5fc');
                ghostGradient.addColorStop(1, '#0277bd');
                ctx.fillStyle = ghostGradient;
                ctx.beginPath();
                ctx.arc(0, 0, radius * 0.9, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1.0;
                // Pale blue eyes
                ctx.fillStyle = '#81d4fa';
                ctx.beginPath();
                ctx.arc(-radius * 0.4, -radius * 0.25, radius * 0.2, 0, Math.PI * 2);
                ctx.arc(radius * 0.4, -radius * 0.25, radius * 0.2, 0, Math.PI * 2);
                ctx.fill();
                break;
            case 'spitter':
                // Green with toxic aura
                const spitterGradient = ctx.createRadialGradient(-3, -3, 0, 0, 0, radius);
                spitterGradient.addColorStop(0, '#66bb6a');
                spitterGradient.addColorStop(1, '#1b5e20');
                ctx.fillStyle = spitterGradient;
                ctx.beginPath();
                ctx.arc(0, 0, radius, 0, Math.PI * 2);
                ctx.fill();
                // Toxic green eyes
                ctx.fillStyle = '#4caf50';
                ctx.beginPath();
                ctx.arc(-radius * 0.4, -radius * 0.25, radius * 0.2, 0, Math.PI * 2);
                ctx.arc(radius * 0.4, -radius * 0.25, radius * 0.2, 0, Math.PI * 2);
                ctx.fill();
                break;
            case 'boss':
                // Large dark red zombie
                const bossGradient = ctx.createRadialGradient(-4, -4, 0, 0, 0, radius * 1.3);
                bossGradient.addColorStop(0, '#d32f2f');
                bossGradient.addColorStop(1, '#b71c1c');
                ctx.fillStyle = bossGradient;
                ctx.beginPath();
                ctx.arc(0, 0, radius * 1.3, 0, Math.PI * 2);
                ctx.fill();
                // Glowing red eyes
                ctx.shadowBlur = 8;
                ctx.shadowColor = '#ff0000';
                ctx.fillStyle = '#ff5252';
                ctx.beginPath();
                ctx.arc(-radius * 0.5, -radius * 0.3, radius * 0.3, 0, Math.PI * 2);
                ctx.arc(radius * 0.5, -radius * 0.3, radius * 0.3, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;
                break;
        }
        ctx.restore();
    }

    drawWeaponIcon(x, y, size, weaponKey) {
        const ctx = this.ctx;
        ctx.save();
        ctx.translate(x, y);

        const width = size * 0.6;
        const height = size * 0.3;

        switch(weaponKey) {
            case 'pistol':
                // Simple pistol shape
                ctx.fillStyle = '#424242';
                ctx.fillRect(-width/2, -height/2, width, height);
                ctx.fillStyle = '#212121';
                ctx.fillRect(-width/2 + width * 0.7, -height/2, width * 0.3, height);
                break;
            case 'shotgun':
                // Wider shotgun
                ctx.fillStyle = '#424242';
                ctx.fillRect(-width/2, -height/2, width * 1.2, height * 1.2);
                ctx.fillStyle = '#212121';
                ctx.fillRect(-width/2 + width * 0.8, -height/2, width * 0.4, height * 1.2);
                break;
            case 'rifle':
                // Long rifle
                ctx.fillStyle = '#424242';
                ctx.fillRect(-width/2, -height/2, width * 1.5, height);
                ctx.fillStyle = '#212121';
                ctx.fillRect(-width/2 + width * 1.2, -height/2, width * 0.3, height);
                break;
            case 'flamethrower':
                // Flamethrower with flame
                ctx.fillStyle = '#424242';
                ctx.fillRect(-width/2, -height/2, width * 1.2, height * 1.3);
                // Flame effect
                const flameGradient = ctx.createRadialGradient(width/2, 0, 0, width/2, 0, width * 0.4);
                flameGradient.addColorStop(0, '#ffeb3b');
                flameGradient.addColorStop(0.5, '#ff9800');
                flameGradient.addColorStop(1, 'rgba(255, 152, 0, 0)');
                ctx.fillStyle = flameGradient;
                ctx.beginPath();
                ctx.arc(width/2, 0, width * 0.4, 0, Math.PI * 2);
                ctx.fill();
                break;
            case 'smg':
                // Compact SMG
                ctx.fillStyle = '#424242';
                ctx.fillRect(-width/2, -height/2, width * 1.1, height * 0.9);
                ctx.fillStyle = '#212121';
                ctx.fillRect(-width/2 + width * 0.9, -height/2, width * 0.2, height * 0.9);
                break;
            case 'sniper':
                // Long sniper with scope
                ctx.fillStyle = '#424242';
                ctx.fillRect(-width/2, -height/2, width * 1.8, height);
                // Scope
                ctx.fillStyle = '#212121';
                ctx.fillRect(-width/2 + width * 0.3, -height/2 - height * 0.3, width * 0.4, height * 0.6);
                break;
            case 'rocketLauncher':
                // RPG launcher
                ctx.fillStyle = '#424242';
                ctx.fillRect(-width/2, -height/2, width * 1.3, height * 1.5);
                // Rocket tip
                ctx.fillStyle = '#ff1744';
                ctx.beginPath();
                ctx.moveTo(width/2, -height/2);
                ctx.lineTo(width/2 + width * 0.3, 0);
                ctx.lineTo(width/2, height/2);
                ctx.closePath();
                ctx.fill();
                break;
        }
        ctx.restore();
    }

    drawPickupIcon(x, y, size, type) {
        const ctx = this.ctx;
        const time = Date.now();
        ctx.save();
        ctx.translate(x, y);

        const radius = size * 0.35;
        const pulse = 0.8 + Math.sin(time / 500) * 0.15;

        switch(type) {
            case 'health':
                // Red health orb
                const healthGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, radius * 2.2 * pulse);
                healthGlow.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
                healthGlow.addColorStop(1, 'rgba(255, 0, 80, 0)');
                ctx.fillStyle = healthGlow;
                ctx.beginPath();
                ctx.arc(0, 0, radius * 2.2 * pulse, 0, Math.PI * 2);
                ctx.fill();
                const healthGradient = ctx.createRadialGradient(-2, -2, 0, 0, 0, radius);
                healthGradient.addColorStop(0, '#ff8a80');
                healthGradient.addColorStop(1, '#d50000');
                ctx.fillStyle = healthGradient;
                ctx.beginPath();
                ctx.arc(0, 0, radius, 0, Math.PI * 2);
                ctx.fill();
                // Cross
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(-radius/2, 0);
                ctx.lineTo(radius/2, 0);
                ctx.moveTo(0, -radius/2);
                ctx.lineTo(0, radius/2);
                ctx.stroke();
                break;
            case 'ammo':
                // Yellow ammo box
                const ammoGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, radius * 2.2 * pulse);
                ammoGlow.addColorStop(0, 'rgba(255, 255, 200, 0.9)');
                ammoGlow.addColorStop(1, 'rgba(255, 152, 0, 0)');
                ctx.fillStyle = ammoGlow;
                ctx.beginPath();
                ctx.arc(0, 0, radius * 2.2 * pulse, 0, Math.PI * 2);
                ctx.fill();
                const ammoGradient = ctx.createRadialGradient(-2, -2, 0, 0, 0, radius);
                ammoGradient.addColorStop(0, '#ffd54f');
                ammoGradient.addColorStop(1, '#ff9800');
                ctx.fillStyle = ammoGradient;
                ctx.beginPath();
                ctx.arc(0, 0, radius, 0, Math.PI * 2);
                ctx.fill();
                // Bullet icon
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(-radius/3, -radius/2, radius * 0.4, radius);
                break;
            case 'damage':
                // Purple damage buff
                const damageGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, radius * 2.2 * pulse);
                damageGlow.addColorStop(0, 'rgba(224, 64, 251, 0.9)');
                damageGlow.addColorStop(1, 'rgba(123, 31, 162, 0)');
                ctx.fillStyle = damageGlow;
                ctx.beginPath();
                ctx.arc(0, 0, radius * 2.2 * pulse, 0, Math.PI * 2);
                ctx.fill();
                const damageGradient = ctx.createRadialGradient(-2, -2, 0, 0, 0, radius);
                damageGradient.addColorStop(0, '#e1bee7');
                damageGradient.addColorStop(1, '#7b1fa2');
                ctx.fillStyle = damageGradient;
                ctx.beginPath();
                ctx.arc(0, 0, radius, 0, Math.PI * 2);
                ctx.fill();
                // 2x text
                ctx.fillStyle = '#ffffff';
                ctx.font = `bold ${radius * 0.8}px "Roboto Mono", monospace`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('2x', 0, 0);
                break;
            case 'nuke':
                // Black/yellow nuke
                const nukeGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, radius * 2.5 * pulse);
                nukeGlow.addColorStop(0, 'rgba(255, 235, 59, 0.9)');
                nukeGlow.addColorStop(1, 'rgba(255, 235, 59, 0)');
                ctx.fillStyle = nukeGlow;
                ctx.beginPath();
                ctx.arc(0, 0, radius * 2.5 * pulse, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#212121';
                ctx.beginPath();
                ctx.arc(0, 0, radius, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#ffeb3b';
                ctx.lineWidth = 2;
                ctx.stroke();
                // Radiation symbol
                ctx.strokeStyle = '#ffeb3b';
                ctx.lineWidth = 2;
                for (let i = 0; i < 3; i++) {
                    const angle = (i * Math.PI * 2 / 3) - Math.PI / 2;
                    ctx.beginPath();
                    ctx.moveTo(0, 0);
                    ctx.lineTo(Math.cos(angle) * radius * 0.6, Math.sin(angle) * radius * 0.6);
                    ctx.stroke();
                }
                ctx.beginPath();
                ctx.arc(0, 0, radius * 0.2, 0, Math.PI * 2);
                ctx.fill();
                break;
            case 'speed':
                // Cyan speed boost
                const speedGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, radius * 2.2 * pulse);
                speedGlow.addColorStop(0, 'rgba(0, 255, 255, 0.9)');
                speedGlow.addColorStop(1, 'rgba(0, 172, 193, 0)');
                ctx.fillStyle = speedGlow;
                ctx.beginPath();
                ctx.arc(0, 0, radius * 2.2 * pulse, 0, Math.PI * 2);
                ctx.fill();
                const speedGradient = ctx.createRadialGradient(-2, -2, 0, 0, 0, radius);
                speedGradient.addColorStop(0, '#80deea');
                speedGradient.addColorStop(1, '#00acc1');
                ctx.fillStyle = speedGradient;
                ctx.beginPath();
                ctx.arc(0, 0, radius, 0, Math.PI * 2);
                ctx.fill();
                // Double arrow
                ctx.fillStyle = '#ffffff';
                ctx.font = `bold ${radius * 0.8}px Arial`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('»', 0, 0);
                break;
            case 'rapidfire':
                // Orange rapid fire
                const rapidGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, radius * 2.2 * pulse);
                rapidGlow.addColorStop(0, 'rgba(255, 152, 0, 0.9)');
                rapidGlow.addColorStop(1, 'rgba(245, 124, 0, 0)');
                ctx.fillStyle = rapidGlow;
                ctx.beginPath();
                ctx.arc(0, 0, radius * 2.2 * pulse, 0, Math.PI * 2);
                ctx.fill();
                const rapidGradient = ctx.createRadialGradient(-2, -2, 0, 0, 0, radius);
                rapidGradient.addColorStop(0, '#ffcc80');
                rapidGradient.addColorStop(1, '#f57c00');
                ctx.fillStyle = rapidGradient;
                ctx.beginPath();
                ctx.arc(0, 0, radius, 0, Math.PI * 2);
                ctx.fill();
                // Lightning
                ctx.fillStyle = '#ffffff';
                ctx.font = `bold ${radius * 0.8}px Arial`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('⚡', 0, 0);
                break;
            case 'shield':
                // Light blue shield
                const shieldGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, radius * 2.2 * pulse);
                shieldGlow.addColorStop(0, 'rgba(129, 212, 250, 0.9)');
                shieldGlow.addColorStop(1, 'rgba(2, 136, 209, 0)');
                ctx.fillStyle = shieldGlow;
                ctx.beginPath();
                ctx.arc(0, 0, radius * 2.2 * pulse, 0, Math.PI * 2);
                ctx.fill();
                const shieldGradient = ctx.createRadialGradient(-2, -2, 0, 0, 0, radius);
                shieldGradient.addColorStop(0, '#b3e5fc');
                shieldGradient.addColorStop(1, '#0288d1');
                ctx.fillStyle = shieldGradient;
                ctx.beginPath();
                ctx.arc(0, 0, radius, 0, Math.PI * 2);
                ctx.fill();
                // Shield hexagon
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 2;
                ctx.beginPath();
                for (let i = 0; i < 6; i++) {
                    const angle = (i * Math.PI * 2 / 6) - Math.PI / 2;
                    const px = Math.cos(angle) * radius * 0.7;
                    const py = Math.sin(angle) * radius * 0.7;
                    if (i === 0) ctx.moveTo(px, py);
                    else ctx.lineTo(px, py);
                }
                ctx.closePath();
                ctx.stroke();
                break;
            case 'adrenaline':
                // Green/yellow adrenaline
                const adrenGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, radius * 2.2 * pulse);
                adrenGlow.addColorStop(0, 'rgba(200, 230, 201, 0.9)');
                adrenGlow.addColorStop(1, 'rgba(76, 175, 80, 0)');
                ctx.fillStyle = adrenGlow;
                ctx.beginPath();
                ctx.arc(0, 0, radius * 2.2 * pulse, 0, Math.PI * 2);
                ctx.fill();
                const adrenGradient = ctx.createRadialGradient(-2, -2, 0, 0, 0, radius);
                adrenGradient.addColorStop(0, '#c8e6c9');
                adrenGradient.addColorStop(1, '#4caf50');
                ctx.fillStyle = adrenGradient;
                ctx.beginPath();
                ctx.arc(0, 0, radius, 0, Math.PI * 2);
                ctx.fill();
                // Plus symbol
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(-radius/2, 0);
                ctx.lineTo(radius/2, 0);
                ctx.moveTo(0, -radius/2);
                ctx.lineTo(0, radius/2);
                ctx.stroke();
                break;
        }
        ctx.restore();
    }

    checkButtonClick(x, y) {
        const centerX = this.canvas.width / 2;
        const scale = this.getUIScale();
        const mainMenuButtonWidth = 240 * scale;
        const mainMenuButtonHeight = 50 * scale;
        const backY = this.canvas.height - 100;

        // Check Gallery screen back button
        if (x >= centerX - mainMenuButtonWidth / 2 && x <= centerX + mainMenuButtonWidth / 2 &&
            y >= backY - mainMenuButtonHeight / 2 && y <= backY + mainMenuButtonHeight / 2) {
            return 'gallery_back';
        }
        return null;
    }

    updateHover(x, y) {
        this.hoveredButton = this.checkButtonClick(x, y);
        return this.hoveredButton;
    }
}

