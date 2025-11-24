import { ctx } from '../core/canvas.js';
import { gameState } from '../core/gameState.js';
import { settingsManager } from '../systems/SettingsManager.js';
import { updateAudioSettings } from '../systems/AudioSystem.js';
import { inputSystem } from '../systems/InputSystem.js';

// Style constants matching Style Guide
const COLORS = {
    bgStart: '#02040a',
    bgEnd: '#051b1f',
    accent: '#ff1744',
    accentSoft: '#ff5252',
    cardBg: 'rgba(10, 12, 16, 0.9)',
    cardBorder: 'rgba(255, 255, 255, 0.08)',
    textMain: '#f5f5f5',
    textMuted: '#9e9e9e',
    glassBg: 'rgba(10, 12, 16, 0.95)',
    glassBorder: 'rgba(255, 255, 255, 0.12)'
};

export class SettingsPanel {
    constructor(canvas, settingsManager) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.settingsManager = settingsManager;
        this.visible = false;
        
        // Tabs
        this.activeTab = 'video'; // video, audio, gameplay, controls
        this.tabs = ['video', 'audio', 'gameplay', 'controls'];
        
        // Scrolling
        this.scrollY = 0;
        this.targetScrollY = 0;
        this.contentHeight = 0;
        this.viewportHeight = 0;
        this.scrollBarWidth = 6;
        
        // Interaction
        this.draggingSlider = false;
        this.draggingSliderId = null; // { category, key }
        this.draggingScrollBar = false;
        this.activeDropdown = null; // { category, key, options, x, y, width }
        this.rebindingAction = null;
        
        // Layout (Compact) - Base values for scaling
        this.basePanelWidth = 800;
        this.basePanelHeight = 650;
        this.basePadding = 20;
        this.baseTabHeight = 50;
        
        this.panelX = 0;
        this.panelY = 0;
        this.panelWidth = this.getScaledPanelWidth();
        this.panelHeight = this.getScaledPanelHeight();
        this.padding = this.getScaledPadding();
        this.tabHeight = this.getScaledTabHeight();
        
        this.controls = []; // List of interactive elements for hit testing
    }

    getUIScale() {
        return this.settingsManager.getSetting('video', 'uiScale') ?? 1.0;
    }

    getScaledPanelWidth() {
        return this.basePanelWidth * this.getUIScale();
    }

    getScaledPanelHeight() {
        return this.basePanelHeight * this.getUIScale();
    }

    getScaledPadding() {
        return this.basePadding * this.getUIScale();
    }

    getScaledTabHeight() {
        return this.baseTabHeight * this.getUIScale();
    }

    open() {
        this.visible = true;
        this.scrollY = 0;
        this.targetScrollY = 0;
        this.activeDropdown = null;
        this.rebindingAction = null;
        // Restore last viewed tab (V0.7.1)
        const lastTab = localStorage.getItem('zombobs_settings_last_tab');
        if (lastTab && this.tabs.includes(lastTab)) {
            this.activeTab = lastTab;
        } else {
            this.activeTab = 'video'; // Default to first tab
        }
    }

    close() {
        this.visible = false;
        this.draggingSlider = false;
        this.draggingSliderId = null;
        this.draggingScrollBar = false;
        this.activeDropdown = null;
        this.rebindingAction = null;
        inputSystem.cancelRebind();
        gameState.showSettingsPanel = false;
    }

    draw(mouse) {
        if (!this.visible) return;

        // Update scaled dimensions dynamically
        const scale = this.getUIScale();
        this.panelWidth = this.getScaledPanelWidth();
        this.panelHeight = Math.min(this.getScaledPanelHeight(), this.canvas.height - (60 * scale));
        this.padding = this.getScaledPadding();
        this.tabHeight = this.getScaledTabHeight();
        this.panelX = (this.canvas.width - this.panelWidth) / 2;
        this.panelY = (this.canvas.height - this.panelHeight) / 2;
        // Calculate header and tab heights dynamically based on scale
        const headerHeight = (35 * scale) + (30 * scale) + (15 * scale); // Title + divider spacing + extra spacing
        const tabAreaHeight = this.tabHeight + (5 * scale); // Tab height + bottom border spacing
        const footerHeight = 50 * scale; // Footer button area
        this.viewportHeight = this.panelHeight - headerHeight - tabAreaHeight - footerHeight;

        // Smooth Scroll
        this.scrollY += (this.targetScrollY - this.scrollY) * 0.2;
        // Clamp scroll
        const maxScroll = Math.max(0, this.contentHeight - this.viewportHeight);
        if (this.targetScrollY < 0) this.targetScrollY = 0;
        if (this.targetScrollY > maxScroll) this.targetScrollY = maxScroll;
        
        // Clamp actual scroll for rendering (stops rubber banding visual)
        let renderScrollY = this.scrollY;
        if (renderScrollY < 0) renderScrollY = 0;
        if (renderScrollY > maxScroll) renderScrollY = maxScroll;

        this.controls = []; // Reset controls for this frame

        this.drawOverlay();
        this.drawPanelBackground();
        this.drawHeader();
        this.drawTabs(mouse);
        
        // Content Area with Clipping - use same calculation as drawTabs
        const contentStartY = this.panelY + headerHeight + this.tabHeight + (5 * scale);
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.rect(this.panelX, contentStartY, this.panelWidth, this.viewportHeight);
        this.ctx.clip();

        let currentY = contentStartY - renderScrollY;

        // Render content based on active tab
        if (this.activeTab === 'video') {
            currentY = this.drawVideoSettings(currentY, mouse);
        } else if (this.activeTab === 'audio') {
            currentY = this.drawAudioSettings(currentY, mouse);
        } else if (this.activeTab === 'gameplay') {
            currentY = this.drawGameplaySettings(currentY, mouse);
        } else if (this.activeTab === 'controls') {
            currentY = this.drawControlsSettings(currentY, mouse);
        }

        this.contentHeight = currentY + renderScrollY - contentStartY + 30; // Total height + padding
        this.ctx.restore();

        this.drawScrollBar(renderScrollY, maxScroll, mouse);
        this.drawFooter(mouse);

        // Draw active dropdown on top if exists
        if (this.activeDropdown) {
            this.drawDropdownMenu(this.activeDropdown, mouse);
        }
    }

    drawOverlay() {
        const overlayGradient = this.ctx.createRadialGradient(
            this.canvas.width / 2, this.canvas.height / 2, 0,
            this.canvas.width / 2, this.canvas.height / 2, Math.max(this.canvas.width, this.canvas.height)
        );
        overlayGradient.addColorStop(0, 'rgba(2, 4, 10, 0.92)');
        overlayGradient.addColorStop(1, 'rgba(0, 0, 0, 0.95)');
        this.ctx.fillStyle = overlayGradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawPanelBackground() {
        // Glass-morphism panel
        this.ctx.fillStyle = COLORS.glassBg;
        this.ctx.fillRect(this.panelX, this.panelY, this.panelWidth, this.panelHeight);

        this.ctx.strokeStyle = COLORS.accent;
        this.ctx.lineWidth = 2;
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = 'rgba(255, 23, 68, 0.5)';
        this.ctx.strokeRect(this.panelX, this.panelY, this.panelWidth, this.panelHeight);
        this.ctx.shadowBlur = 0;

        // Inner border
        this.ctx.strokeStyle = COLORS.glassBorder;
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(this.panelX + 1, this.panelY + 1, this.panelWidth - 2, this.panelHeight - 2);
    }

    drawHeader() {
        const scale = this.getUIScale();
        const titleFontSize = Math.max(24, 32 * scale); // Scale title font, min 24px
        const titleY = this.panelY + (35 * scale); // Scale title position
        const dividerY = this.panelY + (65 * scale); // Scale divider position
        const dividerPadding = 20 * scale; // Scale divider padding
        
        this.ctx.save();
        this.ctx.font = `bold ${titleFontSize}px "Creepster", cursive`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        // Glow effect (scale with UI scale)
        this.ctx.shadowBlur = 20 * scale;
        this.ctx.shadowColor = 'rgba(255, 23, 68, 0.8)';
        
        const gradient = this.ctx.createLinearGradient(this.panelX, titleY, this.panelX + this.panelWidth, titleY);
        gradient.addColorStop(0, COLORS.accentSoft);
        gradient.addColorStop(1, COLORS.accent);
        this.ctx.fillStyle = gradient;
        
        this.ctx.fillText("SETTINGS", this.panelX + this.panelWidth / 2, titleY);
        this.ctx.restore();

        // Divider
        this.ctx.fillStyle = COLORS.glassBorder;
        this.ctx.fillRect(this.panelX + dividerPadding, dividerY, this.panelWidth - (dividerPadding * 2), 1);
    }

    drawTabs(mouse) {
        const scale = this.getUIScale();
        // Increased spacing from header to prevent intersection at larger scales
        // Base spacing: 80px, but we need more room for scaled title + divider
        const headerHeight = (35 * scale) + (30 * scale); // Title Y + spacing to divider
        const tabY = this.panelY + headerHeight + (15 * scale); // Extra 15px scaled spacing
        const tabWidth = this.panelWidth / this.tabs.length;
        
        this.tabs.forEach((tab, index) => {
            const tabX = this.panelX + index * tabWidth;
            const isActive = this.activeTab === tab;
            const isHovered = mouse.x >= tabX && mouse.x <= tabX + tabWidth &&
                              mouse.y >= tabY && mouse.y <= tabY + this.tabHeight;
            
            // Tab background
            if (isActive) {
                const activeGradient = this.ctx.createLinearGradient(tabX, tabY, tabX, tabY + this.tabHeight);
                activeGradient.addColorStop(0, 'rgba(255, 23, 68, 0.3)');
                activeGradient.addColorStop(1, 'rgba(255, 23, 68, 0.1)');
                this.ctx.fillStyle = activeGradient;
                this.ctx.fillRect(tabX, tabY, tabWidth, this.tabHeight);
                
                // Active tab border (top accent)
                this.ctx.fillStyle = COLORS.accent;
                this.ctx.fillRect(tabX, tabY, tabWidth, 3 * scale);
            } else if (isHovered) {
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
                this.ctx.fillRect(tabX, tabY, tabWidth, this.tabHeight);
            }
            
            // Tab divider
            if (index > 0) {
                this.ctx.fillStyle = COLORS.glassBorder;
                this.ctx.fillRect(tabX, tabY + (10 * scale), 1, this.tabHeight - (20 * scale));
            }
            
            // Tab label
            const tabFontSize = Math.max(8, Math.round(14 * scale));
            this.ctx.font = isActive ? `bold ${tabFontSize}px "Roboto Mono", monospace` : `${tabFontSize}px "Roboto Mono", monospace`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillStyle = isActive ? COLORS.textMain : COLORS.textMuted;
            
            if (isActive) {
                this.ctx.shadowBlur = 8;
                this.ctx.shadowColor = COLORS.accent;
            }
            
            this.ctx.fillText(tab.toUpperCase(), tabX + tabWidth / 2, tabY + this.tabHeight / 2);
            this.ctx.shadowBlur = 0;
            
            // Register tab as clickable control
            this.controls.push({
                type: 'tab',
                tab: tab,
                x: tabX, y: tabY, width: tabWidth, height: this.tabHeight
            });
        });
        
        // Bottom border
        this.ctx.fillStyle = COLORS.glassBorder;
        this.ctx.fillRect(this.panelX, tabY + this.tabHeight, this.panelWidth, 1);
    }

    drawFooter(mouse) {
        const scale = this.getUIScale();
        const btnWidth = 120 * scale;
        const btnHeight = 40 * scale;
        const btnX = this.panelX + (this.panelWidth - btnWidth) / 2;
        const btnY = this.panelY + this.panelHeight - (50 * scale);
        
        const isHovered = mouse.x >= btnX && mouse.x <= btnX + btnWidth &&
                         mouse.y >= btnY && mouse.y <= btnY + btnHeight;
        
        // Back Button background
        if (isHovered) {
            this.ctx.fillStyle = 'rgba(255, 23, 68, 0.4)';
            this.ctx.strokeStyle = COLORS.accent;
            this.ctx.shadowBlur = 8;
            this.ctx.shadowColor = 'rgba(255, 23, 68, 0.6)';
        } else {
            this.ctx.fillStyle = 'rgba(255, 23, 68, 0.2)';
            this.ctx.strokeStyle = COLORS.glassBorder;
            this.ctx.shadowBlur = 0;
        }
        
        this.ctx.fillRect(btnX, btnY, btnWidth, btnHeight);
        this.ctx.lineWidth = isHovered ? 2 : 1;
        this.ctx.strokeRect(btnX, btnY, btnWidth, btnHeight);
        
        // Text
        this.ctx.shadowBlur = 0;
        this.ctx.fillStyle = COLORS.textMain;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        const btnFontSize = Math.max(8, Math.round(16 * scale));
        this.ctx.font = `bold ${btnFontSize}px "Roboto Mono", monospace`;
        this.ctx.fillText("BACK", btnX + btnWidth / 2, btnY + btnHeight / 2);
        
        this.controls.push({
            type: 'button',
            action: 'close',
            x: btnX, y: btnY, width: btnWidth, height: btnHeight
        });
    }

    drawScrollBar(scrollY, maxScroll, mouse) {
        if (maxScroll <= 0) return;

        const trackX = this.panelX + this.panelWidth - 15;
        const trackY = this.panelY + 80;
        const trackHeight = this.viewportHeight;
        
        // Scrollbar thumb
        const thumbHeight = Math.max(30, (this.viewportHeight / this.contentHeight) * trackHeight);
        const thumbY = trackY + (scrollY / maxScroll) * (trackHeight - thumbHeight);
        
        const isHovered = mouse.x >= trackX - 5 && mouse.x <= trackX + this.scrollBarWidth + 5 &&
                          mouse.y >= trackY && mouse.y <= trackY + trackHeight;
        
        // Draw rounded rect manually (for compatibility)
        const radius = 3;
        this.ctx.fillStyle = (isHovered || this.draggingScrollBar) ? COLORS.accent : 'rgba(255, 255, 255, 0.2)';
        this.ctx.beginPath();
        this.ctx.moveTo(trackX + radius, thumbY);
        this.ctx.lineTo(trackX + this.scrollBarWidth - radius, thumbY);
        this.ctx.quadraticCurveTo(trackX + this.scrollBarWidth, thumbY, trackX + this.scrollBarWidth, thumbY + radius);
        this.ctx.lineTo(trackX + this.scrollBarWidth, thumbY + thumbHeight - radius);
        this.ctx.quadraticCurveTo(trackX + this.scrollBarWidth, thumbY + thumbHeight, trackX + this.scrollBarWidth - radius, thumbY + thumbHeight);
        this.ctx.lineTo(trackX + radius, thumbY + thumbHeight);
        this.ctx.quadraticCurveTo(trackX, thumbY + thumbHeight, trackX, thumbY + thumbHeight - radius);
        this.ctx.lineTo(trackX, thumbY + radius);
        this.ctx.quadraticCurveTo(trackX, thumbY, trackX + radius, thumbY);
        this.ctx.closePath();
        this.ctx.fill();
        
        this.controls.push({
            type: 'scrollbar',
            x: trackX - 5, y: trackY, width: 20, height: trackHeight,
            maxScroll: maxScroll, thumbHeight: thumbHeight
        });
    }

    drawVideoSettings(y, mouse) {
        const scale = this.getUIScale();
        y += 20 * scale; // Top padding
        
        // WebGPU Settings
        y = this.drawSectionHeader("WEBGPU", y);
        y = this.drawToggle("WebGPU Enabled", "video", "webgpuEnabled", y, mouse);
        y = this.drawSlider("Bloom Intensity", "video", "bloomIntensity", 0, 1, y, mouse);
        y = this.drawDropdown("Particle Count", "video", "particleCount", ['low', 'high', 'ultra'], y, mouse);
        y = this.drawDropdown("Lighting Quality", "video", "lightingQuality", ['off', 'simple', 'advanced'], y, mouse);
        y = this.drawToggle("Distortion Effects", "video", "distortionEffects", y, mouse);
        y = this.drawToggle("Spore Cloud Effect", "video", "zombobsFXEnabled", y, mouse);
        
        // General Video Settings
        y = this.drawSectionHeader("GENERAL", y);
        y = this.drawDropdown("Quality Preset", "video", "qualityPreset", ['low', 'medium', 'high', 'ultra', 'custom'], y, mouse);
        if (this.settingsManager.getSetting('video', 'qualityPreset') === 'custom') {
            y = this.drawSlider("Resolution Scale", "video", "resolutionScale", 0.5, 2.0, y, mouse);
            y = this.drawToggle("Vignette", "video", "vignette", y, mouse);
            y = this.drawToggle("Shadows", "video", "shadows", y, mouse);
            y = this.drawToggle("Lighting", "video", "lighting", y, mouse);
        }
        y = this.drawSlider("Screen Shake", "video", "screenShakeMultiplier", 0, 2, y, mouse);
        y = this.drawSlider("Blood & Gore", "video", "bloodGoreLevel", 0, 1, y, mouse);
        y = this.drawDropdown("Crosshair Style", "video", "crosshairStyle", ['default', 'dot', 'cross', 'circle'], y, mouse);
        y = this.drawToggle("Dynamic Crosshair", "video", "dynamicCrosshair", y, mouse);
        y = this.drawSlider("Crosshair Size", "video", "crosshairSize", 0.5, 2.0, y, mouse);
        y = this.drawSlider("Crosshair Opacity", "video", "crosshairOpacity", 0.0, 1.0, y, mouse);
        y = this.drawDropdown("Damage Numbers", "video", "damageNumberStyle", ['floating', 'stacking', 'off'], y, mouse);
        y = this.drawSlider("Damage Number Scale", "video", "damageNumberScale", 0.5, 2.0, y, mouse);
        y = this.drawToggle("Low Health Warning", "video", "lowHealthWarning", y, mouse);
        y = this.drawToggle("Enemy Health Bars", "video", "enemyHealthBars", y, mouse);
        y = this.drawDropdown("Enemy Health Bar Style", "video", "enemyHealthBarStyle", ['gradient', 'solid', 'simple'], y, mouse);
        y = this.drawToggle("Reload Bar", "video", "reloadBar", y, mouse);
        y = this.drawToggle("Show Debug Stats", "video", "showDebugStats", y, mouse);
        y = this.drawDropdown("FPS Limit", "video", "fpsLimit", [0, 30, 60, 120], y, mouse);
        y = this.drawToggle("VSync", "video", "vsync", y, mouse);
        // UI Scale with enhanced display
        const uiScaleValue = this.settingsManager.getSetting('video', 'uiScale') ?? 1.0;
        y = this.drawSlider("UI Scale", "video", "uiScale", 0.5, 1.5, y, mouse);
        
        // Add preset buttons below slider
        const presetScale = this.getUIScale();
        const presetY = y + 5 * presetScale;
        const presetButtonWidth = 60 * presetScale;
        const presetButtonHeight = 25 * presetScale;
        const presetSpacing = 10 * presetScale;
        const presetStartX = this.panelX + this.padding + 200 * presetScale;
        
        const presets = [
            { label: 'Small', value: 0.7 },
            { label: 'Medium', value: 1.0 },
            { label: 'Large', value: 1.3 }
        ];
        
        presets.forEach((preset, index) => {
            const presetX = presetStartX + index * (presetButtonWidth + presetSpacing);
            const isActive = Math.abs(uiScaleValue - preset.value) < 0.05;
            const isHovered = mouse && mouse.x >= presetX && mouse.x <= presetX + presetButtonWidth &&
                              mouse.y >= presetY && mouse.y <= presetY + presetButtonHeight;
            
            // Button background
            if (isActive) {
                const gradient = this.ctx.createLinearGradient(presetX, presetY, presetX, presetY + presetButtonHeight);
                gradient.addColorStop(0, COLORS.accentSoft);
                gradient.addColorStop(1, COLORS.accent);
                this.ctx.fillStyle = gradient;
            } else {
                this.ctx.fillStyle = isHovered ? 'rgba(255, 23, 68, 0.3)' : 'rgba(255, 23, 68, 0.15)';
            }
            this.ctx.fillRect(presetX, presetY, presetButtonWidth, presetButtonHeight);
            
            // Button border
            this.ctx.strokeStyle = isActive ? COLORS.accent : (isHovered ? COLORS.accentSoft : 'rgba(255, 255, 255, 0.12)');
            this.ctx.lineWidth = isActive ? 2 : 1;
            this.ctx.strokeRect(presetX, presetY, presetButtonWidth, presetButtonHeight);
            
            if (isActive || isHovered) {
                this.ctx.shadowBlur = 8;
                this.ctx.shadowColor = 'rgba(255, 23, 68, 0.6)';
                this.ctx.strokeRect(presetX, presetY, presetButtonWidth, presetButtonHeight);
                this.ctx.shadowBlur = 0;
            }
            
            // Button text
            this.ctx.fillStyle = isActive ? '#ffffff' : COLORS.textMain;
            this.ctx.font = `bold ${Math.max(10, 11 * presetScale)}px "Roboto Mono", monospace`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(preset.label, presetX + presetButtonWidth / 2, presetY + presetButtonHeight / 2);
            
            // Store for click detection
            this.controls.push({
                type: 'uiScalePreset',
                x: presetX,
                y: presetY,
                width: presetButtonWidth,
                height: presetButtonHeight,
                value: preset.value
            });
        });
        
        y += presetButtonHeight + 10 * presetScale;
        
        // Text Rendering Quality
        y = this.drawDropdown("Text Rendering Quality", "video", "textRenderingQuality", ['low', 'medium', 'high'], y, mouse);
        
        // UI Elements section
        y = this.drawSectionHeader("UI ELEMENTS", y);
        y = this.drawToggle("Show Rank Badge", "video", "showRankBadge", y, mouse);
        y = this.drawDropdown("Rank Badge Size", "video", "rankBadgeSize", ['small', 'normal', 'large'], y, mouse);
        
        // New graphics quality settings
        y = this.drawSectionHeader("QUALITY", y);
        y = this.drawSlider("Effect Intensity", "video", "effectIntensity", 0, 2, y, mouse);
        y = this.drawDropdown("Post-Processing", "video", "postProcessingQuality", ['off', 'low', 'medium', 'high'], y, mouse);
        y = this.drawDropdown("Particle Detail", "video", "particleDetail", ['minimal', 'standard', 'detailed', 'ultra'], y, mouse);
        
        return y;
    }

    drawAudioSettings(y, mouse) {
        const scale = this.getUIScale();
        y += 20 * scale; // Top padding
        
        y = this.drawSectionHeader("VOLUME", y);
        y = this.drawSlider("Master Volume", "audio", "masterVolume", 0, 1, y, mouse);
        y = this.drawSlider("Music Volume", "audio", "musicVolume", 0, 1, y, mouse);
        y = this.drawSlider("SFX Volume", "audio", "sfxVolume", 0, 1, y, mouse);
        
        y = this.drawSectionHeader("EFFECTS", y);
        y = this.drawToggle("Spatial Audio", "audio", "spatialAudio", y, mouse);
        
        return y;
    }

    drawGameplaySettings(y, mouse) {
        const scale = this.getUIScale();
        y += 20 * scale; // Top padding
        
        y = this.drawSectionHeader("GAME", y);
        y = this.drawToggle("Enable AI Companion", "gameplay", "enableAICompanion", y, mouse);

        y = this.drawSectionHeader("CONTROLS", y);
        y = this.drawToggle("Auto Sprint", "gameplay", "autoSprint", y, mouse);
        y = this.drawToggle("Auto Reload", "gameplay", "autoReload", y, mouse);
        
        y = this.drawSectionHeader("UI", y);
        y = this.drawToggle("Show FPS", "gameplay", "showFps", y, mouse);
        y = this.drawToggle("Pause on Focus Loss", "gameplay", "pauseOnFocusLoss", y, mouse);
        
        return y;
    }

    drawControlsSettings(y, mouse) {
        const scale = this.getUIScale();
        y += 20 * scale; // Top padding
        y = this.drawKeybinds(y, mouse);
        return y;
    }

    drawSectionHeader(title, y) {
        const scale = this.getUIScale();
        const fontSize = Math.max(10, 12 * scale);
        const spacing = 15 * scale;
        const lineY = y + (25 * scale);
        const returnOffset = 40 * scale;
        
        this.ctx.fillStyle = COLORS.textMuted;
        this.ctx.font = `bold ${fontSize}px "Roboto Mono", monospace`;
        this.ctx.textAlign = 'left';
        this.ctx.fillText(title, this.panelX + this.padding, y + spacing);
        
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.fillRect(this.panelX + this.padding, lineY, this.panelWidth - this.padding * 2, 1);
        
        return y + returnOffset;
    }

    drawSlider(label, category, key, min, max, y, mouse, decimalPlaces = 2) {
        const scale = this.getUIScale();
        const rowHeight = 35 * scale; // Reduced from 40
        const value = this.settingsManager.getSetting(category, key) ?? min;
        const labelX = this.panelX + this.padding + (10 * scale);
        const sliderWidth = 180 * scale; // Reduced from 200
        const sliderX = this.panelX + this.panelWidth - this.padding - sliderWidth - (50 * scale); // Space for value text
        const sliderY = y + (13 * scale); // Vertical center offset
        const headerHeight = (35 * scale) + (30 * scale) + (15 * scale);
        const contentStartY = this.panelY + headerHeight + this.tabHeight + (5 * scale);

        // Label
        this.ctx.textAlign = 'left';
        this.ctx.fillStyle = COLORS.textMain;
        const fontSize = Math.max(8, Math.round(13 * scale));
        this.ctx.font = `${fontSize}px "Roboto Mono", monospace`;
        this.ctx.fillText(label, labelX, y + (18 * scale));

        // Slider Track
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        const trackHeight = 4 * scale;
        this.ctx.fillRect(sliderX, sliderY - (2 * scale), sliderWidth, trackHeight);

        // Slider Fill
        const normalized = (value - min) / (max - min);
        const fillWidth = sliderWidth * normalized;
        
        const fillGradient = this.ctx.createLinearGradient(sliderX, sliderY, sliderX + fillWidth, sliderY);
        fillGradient.addColorStop(0, COLORS.accentSoft);
        fillGradient.addColorStop(1, COLORS.accent);
        this.ctx.fillStyle = fillGradient;
        this.ctx.fillRect(sliderX, sliderY - (2 * scale), fillWidth, trackHeight);

        // Handle
        const handleX = sliderX + fillWidth;
        const hoverMargin = 5 * scale;
        const isHovered = mouse.x >= sliderX - hoverMargin && mouse.x <= sliderX + sliderWidth + hoverMargin &&
                          mouse.y >= sliderY - (10 * scale) && mouse.y <= sliderY + (10 * scale) &&
                          mouse.y >= contentStartY && mouse.y <= contentStartY + this.viewportHeight; // Clip check
        const handleRadius = isHovered ? 7 * scale : 5 * scale;

        this.ctx.beginPath();
        this.ctx.arc(handleX, sliderY, handleRadius, 0, Math.PI * 2);
        this.ctx.fillStyle = COLORS.textMain;
        this.ctx.fill();
        if (isHovered || (this.draggingSliderId && this.draggingSliderId.key === key)) {
            this.ctx.shadowBlur = 8 * scale;
            this.ctx.shadowColor = COLORS.accent;
            this.ctx.strokeStyle = COLORS.accent;
            this.ctx.stroke();
            this.ctx.shadowBlur = 0;
        }

        // Value Text
        this.ctx.textAlign = 'right';
        this.ctx.fillStyle = COLORS.textMuted;
        const valueFontSize = Math.max(8, Math.round(12 * scale));
        this.ctx.font = `${valueFontSize}px "Roboto Mono", monospace`;
        let displayValue = value;
        if (max <= 1) displayValue = Math.round(value * 100) + '%';
        else if (key === 'fpsLimit') displayValue = value === 0 ? 'OFF' : value.toString();
        else if (key === 'resolutionScale' || key === 'damageNumberScale' || key === 'uiScale' || key === 'effectIntensity') displayValue = Math.round(value * 100) + '%';
        else displayValue = Math.round(value);
        
        this.ctx.fillText(displayValue, this.panelX + this.panelWidth - this.padding - (10 * scale), y + (18 * scale));

        this.controls.push({
            type: 'slider',
            category, key, min, max,
            x: sliderX, y: sliderY - (10 * scale), width: sliderWidth, height: 20 * scale
        });

        return y + rowHeight;
    }

    drawToggle(label, category, key, y, mouse) {
        const scale = this.getUIScale();
        const rowHeight = 35 * scale; // Reduced from 40
        const isOn = this.settingsManager.getSetting(category, key) ?? false;
        
        const labelX = this.panelX + this.padding + (10 * scale);
        const toggleWidth = 40 * scale; // Reduced from 44
        const toggleHeight = 22 * scale; // Reduced from 24
        const toggleX = this.panelX + this.panelWidth - this.padding - toggleWidth - (10 * scale);
        const toggleY = y + (7 * scale);
        const headerHeight = (35 * scale) + (30 * scale) + (15 * scale);
        const contentStartY = this.panelY + headerHeight + this.tabHeight + (5 * scale);

        // Label
        this.ctx.textAlign = 'left';
        this.ctx.fillStyle = COLORS.textMain;
        const fontSize = Math.max(8, Math.round(13 * scale));
        this.ctx.font = `${fontSize}px "Roboto Mono", monospace`;
        this.ctx.fillText(label, labelX, y + (20 * scale));

        const isHovered = mouse.x >= toggleX && mouse.x <= toggleX + toggleWidth &&
                          mouse.y >= toggleY && mouse.y <= toggleY + toggleHeight &&
                          mouse.y >= contentStartY && mouse.y <= contentStartY + this.viewportHeight;

        // Toggle Body
        this.ctx.fillStyle = isOn ? COLORS.accent : 'rgba(255, 255, 255, 0.1)';
        if (isHovered && !isOn) this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        
        const radius = 12 * scale;
        this.ctx.beginPath();
        this.ctx.moveTo(toggleX + radius, toggleY);
        this.ctx.lineTo(toggleX + toggleWidth - radius, toggleY);
        this.ctx.quadraticCurveTo(toggleX + toggleWidth, toggleY, toggleX + toggleWidth, toggleY + radius);
        this.ctx.lineTo(toggleX + toggleWidth, toggleY + toggleHeight - radius);
        this.ctx.quadraticCurveTo(toggleX + toggleWidth, toggleY + toggleHeight, toggleX + toggleWidth - radius, toggleY + toggleHeight);
        this.ctx.lineTo(toggleX + radius, toggleY + toggleHeight);
        this.ctx.quadraticCurveTo(toggleX, toggleY + toggleHeight, toggleX, toggleY + toggleHeight - radius);
        this.ctx.lineTo(toggleX, toggleY + radius);
        this.ctx.quadraticCurveTo(toggleX, toggleY, toggleX + radius, toggleY);
        this.ctx.closePath();
        this.ctx.fill();

        if (isOn) {
            this.ctx.shadowBlur = 8 * scale;
            this.ctx.shadowColor = 'rgba(255, 23, 68, 0.5)';
            this.ctx.fill();
            this.ctx.shadowBlur = 0;
        }

        // Toggle Handle
        const handleRadius = 8 * scale;
        const handleX = isOn ? toggleX + toggleWidth - (20 * scale) : toggleX + (4 * scale);
        this.ctx.fillStyle = '#ffffff';
        this.ctx.beginPath();
        this.ctx.arc(handleX + handleRadius, toggleY + (12 * scale), handleRadius, 0, Math.PI * 2);
        this.ctx.fill();

        this.controls.push({
            type: 'toggle',
            category, key,
            x: toggleX, y: toggleY, width: toggleWidth, height: toggleHeight
        });

        return y + rowHeight;
    }

    drawDropdown(label, category, key, options, y, mouse) {
        const scale = this.getUIScale();
        const rowHeight = 35 * scale; // Reduced from 40
        const currentValue = this.settingsManager.getSetting(category, key);
        
        const labelX = this.panelX + this.padding + (10 * scale);
        const dropdownWidth = 140 * scale; // Reduced from 150
        const dropdownHeight = 28 * scale; // Reduced from 30
        const dropdownX = this.panelX + this.panelWidth - this.padding - dropdownWidth - (10 * scale);
        const dropdownY = y + (4 * scale);
        const headerHeight = (35 * scale) + (30 * scale) + (15 * scale);
        const contentStartY = this.panelY + headerHeight + this.tabHeight + (5 * scale);

        // Label
        this.ctx.textAlign = 'left';
        this.ctx.fillStyle = COLORS.textMain;
        const labelFontSize = Math.max(10, Math.round(13 * scale));
        this.ctx.font = `${labelFontSize}px "Roboto Mono", monospace`;
        this.ctx.fillText(label, labelX, y + 20 * scale);

        const isHovered = mouse.x >= dropdownX && mouse.x <= dropdownX + dropdownWidth &&
                          mouse.y >= dropdownY && mouse.y <= dropdownY + dropdownHeight &&
                          mouse.y >= contentStartY && mouse.y <= contentStartY + this.viewportHeight;

        // Dropdown Box
        this.ctx.fillStyle = isHovered ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.1)';
        this.ctx.fillRect(dropdownX, dropdownY, dropdownWidth, dropdownHeight);
        this.ctx.strokeStyle = COLORS.glassBorder;
        this.ctx.strokeRect(dropdownX, dropdownY, dropdownWidth, dropdownHeight);

        // Text
        this.ctx.fillStyle = COLORS.textMain;
        this.ctx.textAlign = 'left';
        const textFontSize = Math.max(8, Math.round(12 * scale));
        this.ctx.font = `${textFontSize}px "Roboto Mono", monospace`;
        let displayValue = currentValue;
        if (key === 'fpsLimit') displayValue = currentValue === 0 ? 'OFF' : currentValue.toString();
        else if (key === 'particleCount') {
            // Map internal values to display names
            if (currentValue === 'low') displayValue = 'LOW';
            else if (currentValue === 'high') displayValue = 'HIGH';
            else if (currentValue === 'ultra') displayValue = 'ULTRA';
            else displayValue = String(currentValue).toUpperCase();
        } else if (key === 'lightingQuality') {
            displayValue = String(currentValue).toUpperCase();
        } else {
            displayValue = String(currentValue).toUpperCase();
        }
        this.ctx.fillText(displayValue, dropdownX + (10 * scale), dropdownY + (18 * scale));

        // Arrow
        this.ctx.fillStyle = COLORS.textMuted;
        this.ctx.beginPath();
        this.ctx.moveTo(dropdownX + dropdownWidth - (18 * scale), dropdownY + (11 * scale));
        this.ctx.lineTo(dropdownX + dropdownWidth - (13 * scale), dropdownY + (11 * scale));
        this.ctx.lineTo(dropdownX + dropdownWidth - (15.5 * scale), dropdownY + (16 * scale));
        this.ctx.fill();

        this.controls.push({
            type: 'dropdown',
            category, key, options,
            x: dropdownX, y: dropdownY, width: dropdownWidth, height: dropdownHeight
        });

        return y + rowHeight;
    }

    drawDropdownMenu(dropdown, mouse) {
        const { x, y, width, options } = dropdown;
        const scale = this.getUIScale();
        const itemHeight = 30 * scale;
        const menuHeight = options.length * itemHeight;
        const headerHeight = (35 * scale) + (30 * scale) + (15 * scale);
        const contentStartY = this.panelY + headerHeight + this.tabHeight + (5 * scale);
        const viewportBottom = contentStartY + this.viewportHeight;
        
        // Check if dropdown would overflow bottom of viewport
        const dropdownOffset = 30 * scale;
        const spaceBelow = viewportBottom - (y + dropdownOffset);
        const spaceAbove = (y + dropdownOffset) - contentStartY;
        const drawUpward = spaceBelow < menuHeight && spaceAbove >= menuHeight;
        const menuStartY = drawUpward ? y - menuHeight : y + dropdownOffset;
        
        // Store direction in dropdown for click detection
        dropdown.drawUpward = drawUpward;
        dropdown.menuStartY = menuStartY;
        
        // Background
        this.ctx.fillStyle = '#1a1a1a';
        this.ctx.fillRect(x, menuStartY, width, menuHeight);
        this.ctx.strokeStyle = COLORS.accent;
        this.ctx.strokeRect(x, menuStartY, width, menuHeight);

        options.forEach((opt, index) => {
            const itemY = menuStartY + index * itemHeight;
            const isItemHovered = mouse.x >= x && mouse.x <= x + width &&
                                  mouse.y >= itemY && mouse.y <= itemY + itemHeight;

            if (isItemHovered) {
                this.ctx.fillStyle = COLORS.accent;
                this.ctx.fillRect(x, itemY, width, itemHeight);
            }

            this.ctx.fillStyle = isItemHovered ? '#fff' : COLORS.textMuted;
            this.ctx.textAlign = 'left';
            const itemFontSize = Math.max(8, Math.round(12 * scale));
            this.ctx.font = `${itemFontSize}px "Roboto Mono", monospace`;
            let displayOpt = opt;
            if (typeof opt === 'number' && opt === 0) displayOpt = 'OFF';
            else if (typeof opt === 'number') displayOpt = opt.toString();
            this.ctx.fillText(String(displayOpt).toUpperCase(), x + (10 * scale), itemY + (20 * scale));
        });
    }

    drawKeybinds(y, mouse) {
        const controls = this.controlMode === 'keyboard' ? 
            this.settingsManager.settings.controls : 
            (this.settingsManager.settings.gamepad || {});

        // Toggle Button (Keyboard / Controller)
        const keybindScale = this.getUIScale();
        const toggleWidth = 280 * keybindScale; // Scale toggle width
        const toggleHeight = 34 * keybindScale; // Scale toggle height
        const toggleX = this.panelX + (this.panelWidth - toggleWidth) / 2;
        const toggleY = y + (5 * keybindScale);
        
        // Background
        this.ctx.fillStyle = COLORS.glassBg;
        this.ctx.fillRect(toggleX, toggleY, toggleWidth, toggleHeight);
        this.ctx.strokeStyle = COLORS.glassBorder;
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(toggleX, toggleY, toggleWidth, toggleHeight);
        
        // Active Selection
        const activeX = this.controlMode === 'keyboard' ? toggleX : toggleX + toggleWidth / 2;
        const activeGradient = this.ctx.createLinearGradient(activeX, toggleY, activeX, toggleY + toggleHeight);
        activeGradient.addColorStop(0, COLORS.accentSoft);
        activeGradient.addColorStop(1, COLORS.accent);
        this.ctx.fillStyle = activeGradient;
        this.ctx.fillRect(activeX, toggleY, toggleWidth / 2, toggleHeight);
        
        // Glow on active
        this.ctx.shadowBlur = 8;
        this.ctx.shadowColor = 'rgba(255, 23, 68, 0.5)';
        this.ctx.strokeStyle = COLORS.accent;
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(activeX, toggleY, toggleWidth / 2, toggleHeight);
        this.ctx.shadowBlur = 0;
        
        // Text
        const toggleFontSize = Math.max(10, 13 * keybindScale);
        this.ctx.font = `bold ${toggleFontSize}px "Roboto Mono", monospace`;
        this.ctx.textBaseline = 'middle';
        this.ctx.textAlign = 'center';
        
        this.ctx.fillStyle = this.controlMode === 'keyboard' ? COLORS.textMain : COLORS.textMuted;
        this.ctx.fillText('KEYBOARD', toggleX + toggleWidth / 4, toggleY + toggleHeight / 2);
        
        this.ctx.fillStyle = this.controlMode === 'gamepad' ? COLORS.textMain : COLORS.textMuted;
        this.ctx.fillText('CONTROLLER', toggleX + 3 * toggleWidth / 4, toggleY + toggleHeight / 2);

        this.controls.push({
            type: 'controlModeToggle',
            x: toggleX, y: toggleY, width: toggleWidth, height: toggleHeight
        });

        y += 50; // Reduced from 60

        let labels;
        if (this.controlMode === 'keyboard') {
            labels = {
                moveUp: 'Move Up',
                moveDown: 'Move Down',
                moveLeft: 'Move Left',
                moveRight: 'Move Right',
                sprint: 'Sprint',
                reload: 'Reload',
                grenade: 'Grenade',
                melee: 'Melee',
                weapon1: 'Pistol',
                weapon2: 'Shotgun',
                weapon3: 'Rifle',
                weapon4: 'Flamethrower'
            };
            // Toggle Switch for Scroll Wheel (only show for keyboard mode)
            y = this.drawToggle("Scroll Switch", "controls", "scrollWheelSwitch", y, mouse);
        } else {
            labels = {
                fire: 'Fire',
                reload: 'Reload',
                grenade: 'Grenade',
                sprint: 'Sprint',
                melee: 'Melee',
                prevWeapon: 'Prev Weapon',
                nextWeapon: 'Next Weapon',
                pause: 'Pause'
            };
        }

        // Keybind List
        const keys = Object.keys(labels);
        keys.forEach(key => {
            const label = labels[key];
            let boundKey = '---';
            
            if (this.controlMode === 'keyboard') {
                boundKey = (controls[key] || '').toUpperCase();
            } else {
                boundKey = this.getGamepadButtonName(controls[key]);
            }

            const scale = this.getUIScale();
            const rowHeight = 35 * scale; // Scale row height
            const headerHeight = (35 * scale) + (30 * scale) + (15 * scale);
            const contentStartY = this.panelY + headerHeight + this.tabHeight + (5 * scale);
            
            const labelX = this.panelX + this.padding + (10 * scale);
            const btnWidth = 90 * scale; // Scale button width
            const btnHeight = 28 * scale; // Scale button height
            const btnX = this.panelX + this.panelWidth - this.padding - btnWidth - (10 * scale);
            const btnY = y + (4 * scale);

            // Label
            this.ctx.textAlign = 'left';
            this.ctx.fillStyle = COLORS.textMain;
            const labelFontSize = Math.max(10, Math.round(13 * scale));
            this.ctx.font = `${labelFontSize}px "Roboto Mono", monospace`;
            this.ctx.fillText(label, labelX, y + 20 * scale);

            const isRebinding = this.rebindingAction === key;
            const isHovered = mouse.x >= btnX && mouse.x <= btnX + btnWidth &&
                              mouse.y >= btnY && mouse.y <= btnY + btnHeight &&
                              mouse.y >= contentStartY && mouse.y <= contentStartY + this.viewportHeight;

            // Button
            if (isRebinding) {
                this.ctx.fillStyle = COLORS.accent;
                this.ctx.strokeStyle = '#fff';
            } else {
                this.ctx.fillStyle = isHovered ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.1)';
                this.ctx.strokeStyle = COLORS.glassBorder;
            }
            
            this.ctx.fillRect(btnX, btnY, btnWidth, btnHeight);
            this.ctx.strokeRect(btnX, btnY, btnWidth, btnHeight);

            // Key Text
            this.ctx.fillStyle = isRebinding ? '#fff' : COLORS.textMain;
            this.ctx.textAlign = 'center';
            const keyFontSize = Math.max(8, Math.round(12 * keybindScale));
            this.ctx.font = `${keyFontSize}px "Roboto Mono", monospace`;
            this.ctx.fillText(isRebinding ? '...' : boundKey.toUpperCase(), btnX + btnWidth / 2, btnY + (18 * keybindScale));

            this.controls.push({
                type: 'keybind',
                action: key,
                x: btnX, y: btnY, width: btnWidth, height: btnHeight
            });

            y += rowHeight;
        });

        return y;
    }

    handleWheel(e) {
        if (!this.visible) return;
        
        // Add delta to target scroll
        this.targetScrollY += e.deltaY;
        
        // Clamp target immediately to prevent infinite scroll accumulation
        const maxScroll = Math.max(0, this.contentHeight - this.viewportHeight);
        if (this.targetScrollY < 0) this.targetScrollY = 0;
        if (this.targetScrollY > maxScroll) this.targetScrollY = maxScroll;
    }

    handleClick(x, y) {
        if (!this.visible) return false;

        // Handle active dropdown selection
        if (this.activeDropdown) {
            const { x: dropX, y: dropY, width, options, category, key, menuStartY } = this.activeDropdown;
            const itemHeight = 30;
            const menuHeight = options.length * itemHeight;
            const menuY = menuStartY !== undefined ? menuStartY : dropY + 30;
            
            // Check if clicked inside menu
            if (x >= dropX && x <= dropX + width && y >= menuY && y <= menuY + menuHeight) {
                const index = Math.floor((y - menuY) / itemHeight);
                if (index >= 0 && index < options.length) {
                    const selected = options[index];
                    if (category === 'video' && key === 'qualityPreset') {
                        this.settingsManager.applyVideoPreset(selected);
                    } else {
                        this.settingsManager.setSetting(category, key, selected);
                    }
                    
                    // Apply FPS limit immediately if changed (only if VSync is disabled)
                    if (category === 'video' && key === 'fpsLimit') {
                        if (window.gameEngine) {
                            const vsyncEnabled = this.settingsManager.getSetting('video', 'vsync') ?? true;
                            if (!vsyncEnabled) {
                                window.gameEngine.setFPSLimit(selected);
                            }
                        }
                    }
                }
                this.activeDropdown = null;
                return true;
            }
            
            // Clicked outside, close dropdown
            this.activeDropdown = null;
            return true;
        }

        // Handle Rebinding Cancel
        if (this.rebindingAction) {
            // Clicking anywhere cancels rebind (except handled keys)
            this.cancelRebind();
            return true;
        }

        // Check controls
        for (const ctrl of this.controls) {
            // Skip controls if they are clipped (not visible in viewport)
            // Exception: Scrollbar, Footer, Tab, and ControlModeToggle are always clickable
            if (ctrl.type !== 'button' && ctrl.type !== 'scrollbar' && ctrl.type !== 'controlModeToggle' && ctrl.type !== 'tab') {
                const scale = this.getUIScale();
                const headerHeight = (35 * scale) + (30 * scale) + (15 * scale);
                const contentStartY = this.panelY + headerHeight + this.tabHeight + (5 * scale);
                if (ctrl.y < contentStartY || ctrl.y + ctrl.height > contentStartY + this.viewportHeight) {
                    continue;
                }
            }

            if (x >= ctrl.x && x <= ctrl.x + ctrl.width && y >= ctrl.y && y <= ctrl.y + ctrl.height) {
                if (ctrl.type === 'tab') {
                    this.activeTab = ctrl.tab;
                    // Save last viewed tab (V0.7.1)
                    localStorage.setItem('zombobs_settings_last_tab', ctrl.tab);
                    this.scrollY = 0;
                    this.targetScrollY = 0;
                    return true;
                }
                else if (ctrl.type === 'button' && ctrl.action === 'close') {
                    this.close();
                    return true;
                }
                else if (ctrl.type === 'slider') {
                    this.draggingSlider = true;
                    this.draggingSliderId = { category: ctrl.category, key: ctrl.key, min: ctrl.min, max: ctrl.max, width: ctrl.width, x: ctrl.x };
                    this.updateSlider(x);
                    return true;
                }
                else if (ctrl.type === 'toggle') {
                    const current = this.settingsManager.getSetting(ctrl.category, ctrl.key);
                    this.settingsManager.setSetting(ctrl.category, ctrl.key, !current);
                    return true;
                }
                else if (ctrl.type === 'uiScalePreset') {
                    this.settingsManager.setSetting('video', 'uiScale', ctrl.value);
                    return true;
                }
                else if (ctrl.type === 'dropdown') {
                    this.activeDropdown = ctrl;
                    return true;
                }
                else if (ctrl.type === 'controlModeToggle') {
                    const relativeX = x - ctrl.x;
                    if (relativeX < ctrl.width / 2) {
                        this.controlMode = 'keyboard';
                    } else {
                        this.controlMode = 'gamepad';
                    }
                    return true;
                }
                else if (ctrl.type === 'keybind') {
                    this.startRebind(ctrl.action);
                    return true;
                }
                else if (ctrl.type === 'scrollbar') {
                    this.draggingScrollBar = true;
                    // Move scroll immediately
                    this.updateScrollBar(y, ctrl);
                    return true;
                }
            }
        }

        return false;
    }

    handleMouseMove(x, y) {
        if (!this.visible) return;

        if (this.draggingSlider && this.draggingSliderId) {
            this.updateSlider(x);
        }

        if (this.draggingScrollBar) {
            const scale = this.getUIScale();
            const headerHeight = (35 * scale) + (30 * scale) + (15 * scale);
            const trackY = this.panelY + headerHeight + this.tabHeight + (5 * scale);
            const trackHeight = this.viewportHeight;
            const relativeY = Math.max(0, Math.min(trackHeight, y - trackY));
            const percent = relativeY / trackHeight;
            const maxScroll = Math.max(0, this.contentHeight - this.viewportHeight);
            
            this.targetScrollY = percent * maxScroll;
            this.scrollY = this.targetScrollY; // Snappy scroll when dragging bar
        }
    }

    handleMouseUp() {
        this.draggingSlider = false;
        this.draggingSliderId = null;
        this.draggingScrollBar = false;
    }

    updateSlider(x) {
        const ctrl = this.draggingSliderId;
        if (!ctrl) return;

        const relativeX = Math.max(0, Math.min(ctrl.width, x - ctrl.x));
        const percent = relativeX / ctrl.width;
        let value = ctrl.min + percent * (ctrl.max - ctrl.min);
        
        // Special cases handling
        if (ctrl.category === 'video' && ctrl.key === 'screenShakeMultiplier') {
            // Keep as float 0-1
        } else if (ctrl.category === 'video' && (ctrl.key === 'particleCount' || ctrl.key === 'fpsLimit')) {
             value = Math.round(value);
        } else if (ctrl.category === 'video' && ctrl.key === 'resolutionScale') {
            // Keep as float, but clamp to 0.5-2.0 range
            value = Math.max(0.5, Math.min(2.0, value));
        } else if (ctrl.category === 'audio') {
            // Keep as float 0-1
        }

        this.settingsManager.setSetting(ctrl.category, ctrl.key, value);
        
        // Live updates
        if (ctrl.category === 'audio') {
            updateAudioSettings();
        }
        
        // Apply resolution scale immediately if changed
        if (ctrl.category === 'video' && ctrl.key === 'resolutionScale') {
            // Trigger canvas resize to apply new resolution scale
            if (gameState.players.length > 0) {
                resizeCanvas(gameState.players[0]);
            }
        }
    }

    updateScrollBar(y, ctrl) {
         // Logic handled in mousemove for smoother dragging, but click-to-jump handled here
         const trackY = this.panelY + 80;
         const trackHeight = this.viewportHeight;
         const relativeY = Math.max(0, Math.min(trackHeight, y - trackY));
         const percent = relativeY / trackHeight;
         
         this.targetScrollY = percent * ctrl.maxScroll;
    }

    startRebind(action) {
        this.rebindingAction = action;
        
        if (this.controlMode === 'gamepad') {
             inputSystem.startRebind((buttonIndex) => {
                 this.handleGamepadRebind(buttonIndex);
             });
        }
    }

    cancelRebind() {
        this.rebindingAction = null;
        if (this.controlMode === 'gamepad') {
            inputSystem.cancelRebind();
        }
    }

    handleRebind(key) {
        if (!this.rebindingAction || this.controlMode !== 'keyboard') return;
        
        // Prevent binding Escape
        if (key === 'Escape') {
            this.cancelRebind();
            return;
        }
        
        const lowerKey = key.toLowerCase();
        this.settingsManager.setSetting('controls', this.rebindingAction, lowerKey);
        this.rebindingAction = null;
    }
    
    handleGamepadRebind(buttonIndex) {
        if (!this.rebindingAction || this.controlMode !== 'gamepad') return;
        
        this.settingsManager.setSetting('gamepad', this.rebindingAction, buttonIndex);
        this.rebindingAction = null;
    }
    
    getGamepadButtonName(index) {
        const names = [
            'A', 'B', 'X', 'Y', 
            'LB', 'RB', 'LT', 'RT', 
            'View', 'Menu', 'L3', 'R3', 
            'D-Up', 'D-Down', 'D-Left', 'D-Right'
        ];
        return names[index] !== undefined ? names[index] : `Btn ${index}`;
    }
}

