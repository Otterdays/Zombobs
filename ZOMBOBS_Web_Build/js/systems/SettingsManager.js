export class SettingsManager {
    constructor() {
        this.callbacks = []; // Array of callback functions to call when settings change
        this.defaultSettings = {
            audio: {
                masterVolume: 1.0,
                musicVolume: 0.5,
                sfxVolume: 1.0,
                spatialAudio: false // Stereo panning based on position
            },
            video: {
                // WebGPU Settings
                webgpuEnabled: true,
                bloomIntensity: 0.5, // 0.0 to 1.0
                particleCount: 'high', // 'low' (CPU), 'high' (GPU 10k), 'ultra' (GPU 50k)
                lightingQuality: 'simple', // 'off', 'simple', 'advanced'
                distortionEffects: true,

                // General Video Settings
                qualityPreset: 'high', // low, medium, high, ultra, custom
                resolutionScale: 1.0,
                vignette: true,
                shadows: true,
                lighting: true,
                lowHealthWarning: true,
                floatingText: true,
                dynamicCrosshair: true,
                enemyHealthBars: true,
                reloadBar: true,
                crosshairStyle: 'default', // default, dot, cross, circle
                crosshairColor: '#00ff00', // Hex color code
                screenShakeMultiplier: 1.0, // 0.0 to 2.0 (expanded from screenShakeIntensity)
                bloodGoreLevel: 1.0, // 0.0 to 1.0
                damageNumberStyle: 'floating', // floating, stacking, off
                damageNumberScale: 1.0, // 0.5 to 2.0
                fpsLimit: 0, // 0 = unlimited, 30, 60, 120
                vsync: true, // Enable VSync (browser handles frame timing)
                uiScale: 1.0, // UI scaling factor (0.5 = 50%, 1.0 = 100%, 1.5 = 150%)
                showDebugStats: false,
                // New graphics quality settings
                effectIntensity: 1.0, // 0.0 to 2.0 (0% to 200%) - multiplier for all visual effects
                postProcessingQuality: 'medium', // 'off', 'low', 'medium', 'high' - post-processing effects
                particleDetail: 'standard', // 'minimal', 'standard', 'detailed', 'ultra' - particle rendering quality
                // Text rendering quality
                textRenderingQuality: 'high', // 'low', 'medium', 'high'
                // Rank badge settings
                rankBadgeSize: 'normal', // 'small', 'normal', 'large'
                showRankBadge: true, // boolean
                // Crosshair settings
                crosshairSize: 1.0, // 0.5 to 2.0 multiplier
                crosshairOpacity: 1.0, // 0.0 to 1.0
                // Enemy health bar style
                enemyHealthBarStyle: 'gradient' // 'gradient', 'solid', 'simple'
            },
            gameplay: {
                enableAICompanion: true,
                autoSprint: false,
                autoReload: true, // Disable for "hardcore" feel
                pauseOnFocusLoss: true,
                showFps: false
            },
            controls: {
                moveUp: 'w',
                moveDown: 's',
                moveLeft: 'a',
                moveRight: 'd',
                sprint: 'shift',
                reload: 'r',
                grenade: 'g',
                melee: 'v',
                weapon1: '1',
                weapon2: '2',
                weapon3: '3',
                weapon4: '4',
                weapon5: '5',
                weapon6: '6',
                weapon7: '7',
                scrollWheelSwitch: true
            },
            gamepad: {
                fire: 7, // RT
                reload: 2, // X
                grenade: 5, // RB
                // interact: 0, // A (Not used in game logic yet, but good to have)
                sprint: 10, // L3
                pause: 9, // Start
                prevWeapon: 4, // LB
                nextWeapon: 3, // Y
                melee: 11 // R3
            }
        };
        this.settings = this.loadSettings();
    }

    loadSettings() {
        try {
            const saved = localStorage.getItem('zombobs_settings');
            if (saved) {
                const parsed = JSON.parse(saved);
                // Merge with defaults to ensure all keys exist
                return this.mergeSettings(this.defaultSettings, parsed);
            }
        } catch (error) {
            console.log('Failed to load settings:', error);
        }
        // Return defaults copy
        return JSON.parse(JSON.stringify(this.defaultSettings));
    }

    mergeSettings(defaults, saved) {
        const merged = JSON.parse(JSON.stringify(defaults));

        // Merge saved values
        for (const category in saved) {
            if (merged[category]) {
                for (const key in saved[category]) {
                    merged[category][key] = saved[category][key];
                }
            }
        }

        // Migration: Check if autoSprint is in video (old location) and move to gameplay
        if (saved.video && saved.video.autoSprint !== undefined) {
            if (!merged.gameplay) merged.gameplay = {};
            merged.gameplay.autoSprint = saved.video.autoSprint;
            // We don't delete it from video in 'merged' because it wasn't there in defaults (we overwrote defaults structure initially but then merged saved into it... wait)
            // Actually merged starts as defaults. 
            // If saved.video has autoSprint, it gets added to merged.video because of the loop above if we are not careful.
            // But wait, the loop above iterates keys in saved[category]. If 'autoSprint' is in saved.video, it gets added to merged.video.
            // We should clean it up from merged.video if it shouldn't be there.
            delete merged.video.autoSprint;
        }

        // Ensure all default categories and keys exist (handles new updates)
        for (const category in defaults) {
            if (!merged[category]) {
                merged[category] = JSON.parse(JSON.stringify(defaults[category]));
            } else {
                for (const key in defaults[category]) {
                    if (merged[category][key] === undefined) {
                        merged[category][key] = defaults[category][key];
                    }
                }
            }
        }

        return merged;
    }

    saveSettings() {
        try {
            localStorage.setItem('zombobs_settings', JSON.stringify(this.settings));
        } catch (error) {
            console.log('Failed to save settings:', error);
        }
    }

    getSetting(category, key) {
        return this.settings[category]?.[key];
    }

    setSetting(category, key, value) {
        if (!this.settings[category]) {
            this.settings[category] = {};
        }
        this.settings[category][key] = value;

        // If a video setting changes that isn't the preset itself, switch preset to 'custom'
        if (category === 'video' && key !== 'qualityPreset') {
            this.settings.video.qualityPreset = 'custom';
        }

        // When VSync is enabled, disable FPS limiting (let browser handle timing)
        if (category === 'video' && key === 'vsync' && value === true) {
            this.settings.video.fpsLimit = 0;
        }

        this.saveSettings();

        // Notify callbacks
        this.callbacks.forEach(callback => callback(category, key, value));
        
        // If VSync was enabled, also notify about fpsLimit change
        if (category === 'video' && key === 'vsync' && value === true) {
            this.callbacks.forEach(callback => callback('video', 'fpsLimit', 0));
        }
    }

    addChangeListener(callback) {
        this.callbacks.push(callback);
    }

    removeChangeListener(callback) {
        const index = this.callbacks.indexOf(callback);
        if (index > -1) {
            this.callbacks.splice(index, 1);
        }
    }

    applyVideoPreset(preset) {
        if (preset === 'low') {
            this.settings.video.particleCount = 'low';
            this.settings.video.resolutionScale = 0.75;
            this.settings.video.vignette = false;
            this.settings.video.shadows = false;
            this.settings.video.lighting = false;
            this.settings.video.webgpuEnabled = false;
            this.settings.video.bloomIntensity = 0;
            this.settings.video.lightingQuality = 'off';
            this.settings.video.distortionEffects = false;
        } else if (preset === 'medium') {
            this.settings.video.particleCount = 'low';
            this.settings.video.resolutionScale = 1.0;
            this.settings.video.vignette = true;
            this.settings.video.shadows = true;
            this.settings.video.lighting = false;
            this.settings.video.webgpuEnabled = true;
            this.settings.video.bloomIntensity = 0.3;
            this.settings.video.lightingQuality = 'simple';
            this.settings.video.distortionEffects = true;
        } else if (preset === 'high') {
            this.settings.video.particleCount = 'high';
            this.settings.video.resolutionScale = 1.0;
            this.settings.video.vignette = true;
            this.settings.video.shadows = true;
            this.settings.video.lighting = true;
            this.settings.video.webgpuEnabled = true;
            this.settings.video.bloomIntensity = 0.5;
            this.settings.video.lightingQuality = 'simple';
            this.settings.video.distortionEffects = true;
        } else if (preset === 'ultra') {
            this.settings.video.particleCount = 'ultra';
            this.settings.video.resolutionScale = 1.25;
            this.settings.video.vignette = true;
            this.settings.video.shadows = true;
            this.settings.video.lighting = true;
            this.settings.video.webgpuEnabled = true;
            this.settings.video.bloomIntensity = 0.7;
            this.settings.video.lightingQuality = 'advanced';
            this.settings.video.distortionEffects = true;
        }
        this.settings.video.qualityPreset = preset;
        this.saveSettings();

        this.callbacks.forEach(cb => {
            cb('video', 'qualityPreset', preset);
            cb('video', 'bloomIntensity', this.settings.video.bloomIntensity);
            cb('video', 'distortionEffects', this.settings.video.distortionEffects);
            cb('video', 'lightingQuality', this.settings.video.lightingQuality);
            cb('video', 'particleCount', this.settings.video.particleCount);
        });
    }
}

// Export a singleton instance
export const settingsManager = new SettingsManager();
