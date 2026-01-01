import { gameState } from '../core/gameState.js';
import { WEAPONS } from '../core/constants.js';
import { settingsManager } from './SettingsManager.js';

// Audio Context for sound effects
let audioContext = null;
let gunshotBuffer = null; // Cache gunshot audio buffer
let masterGainNode = null; // Master volume control
let sfxGainNode = null; // SFX volume control
let menuMusic = null; // HTMLAudioElement for menu music
let menuMusicSource = null; // MediaElementSourceNode
let menuMusicGain = null; // Gain node for menu music

// Initialize audio context (needs user interaction first)
export function initAudio() {
    if (!audioContext) {
        try {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();

            // Create master gain node for global volume control
            masterGainNode = audioContext.createGain();
            const masterVol = settingsManager.getSetting('audio', 'masterVolume');
            masterGainNode.gain.value = masterVol !== undefined ? masterVol : 1.0;
            masterGainNode.connect(audioContext.destination);

            // Create SFX gain node
            sfxGainNode = audioContext.createGain();
            const sfxVol = settingsManager.getSetting('audio', 'sfxVolume');
            sfxGainNode.gain.value = sfxVol !== undefined ? sfxVol : 1.0;
            sfxGainNode.connect(masterGainNode);

            // Pre-create the gunshot buffer once for performance
            createGunshotBuffer();

            // Update music volume if it exists
            if (menuMusicGain) {
                const musicVol = settingsManager.getSetting('audio', 'musicVolume');
                menuMusicGain.gain.value = (musicVol !== undefined ? musicVol : 0.5);
            }

        } catch (error) {
            // Audio context not supported
        }
    }
    return audioContext;
}

export function isAudioInitialized() {
    return audioContext !== null;
}

export function getMasterGainNode() {
    return masterGainNode;
}

export function updateAudioSettings() {
    if (!audioContext) return;

    // Check if audio is muted
    const isMuted = settingsManager.getSetting('audio', 'muted') === true;

    const masterVol = isMuted ? 0 : (settingsManager.getSetting('audio', 'masterVolume') ?? 1.0);
    if (masterGainNode) {
        masterGainNode.gain.value = masterVol;
    }

    const sfxVol = settingsManager.getSetting('audio', 'sfxVolume') ?? 1.0;
    if (sfxGainNode) {
        sfxGainNode.gain.value = sfxVol;
    }

    const musicVol = settingsManager.getSetting('audio', 'musicVolume') ?? 0.5;
    if (menuMusicGain) {
        menuMusicGain.gain.value = musicVol;
    } else if (menuMusic) {
        // Fallback if Web Audio API isn't fully connected for music
        menuMusic.volume = musicVol * masterVol;
    }
}

export function playMenuMusic() {
    if (!menuMusic) {
        menuMusic = new Audio('assets/Shadows of the Wasteland.mp3');
        menuMusic.loop = true;
    }

    if (!audioContext) {
        initAudio();
    }

    if (audioContext && !menuMusicSource) {
        // Connect to Web Audio API if possible for volume control
        try {
            menuMusicSource = audioContext.createMediaElementSource(menuMusic);
            menuMusicGain = audioContext.createGain();
            const musicVol = settingsManager.getSetting('audio', 'musicVolume');
            menuMusicGain.gain.value = musicVol !== undefined ? musicVol : 0.5;
            menuMusicSource.connect(menuMusicGain);
            menuMusicGain.connect(masterGainNode || audioContext.destination);
        } catch (e) {
            // Could not connect menu music to audio context
        }
    }

    // Play if not already playing
    if (menuMusic.paused) {
        menuMusic.play().catch(e => {
            // Ignore AbortError (happens when restarting quickly)
        });
    }
}

export function stopMenuMusic() {
    if (menuMusic) {
        menuMusic.pause();
        menuMusic.currentTime = 0;
    }
}

// Create and cache the gunshot sound buffer (called once)
function createGunshotBuffer() {
    if (!audioContext || gunshotBuffer) return;

    const duration = 0.1; // 100ms
    const sampleRate = audioContext.sampleRate;
    const buffer = audioContext.createBuffer(1, duration * sampleRate, sampleRate);
    const data = buffer.getChannelData(0);

    // Generate gunshot waveform (sharp attack + decay)
    for (let i = 0; i < buffer.length; i++) {
        const t = i / sampleRate;
        // Initial sharp crack (high frequency noise)
        let sample = Math.random() * 2 - 1;
        // Add low frequency boom
        sample += Math.sin(t * 60) * 0.5;
        // Quick decay envelope
        const envelope = Math.max(0, 1 - (t / duration) * 3);
        data[i] = sample * envelope * 0.3; // Volume
    }

    gunshotBuffer = buffer;
}

// Play cached gunshot sound using Web Audio API
export function playGunshotSound() {
    if (!audioContext) {
        initAudio();
        if (!audioContext) return; // Still can't create, skip sound
    }

    // Ensure buffer exists (in case audioContext was created elsewhere)
    if (!gunshotBuffer) {
        createGunshotBuffer();
        if (!gunshotBuffer) return;
    }

    // Determine weapon type from player
    const player = gameState.players[0]; // Local player
    if (!player) return;

    if (player.currentWeapon === WEAPONS.shotgun) {
        playShotgunSound();
    } else if (player.currentWeapon === WEAPONS.rifle) {
        playRifleSound();
    } else if (player.currentWeapon === WEAPONS.flamethrower) {
        playFlamethrowerSound();
    } else if (player.currentWeapon === WEAPONS.smg) {
        playSMGSound();
    } else if (player.currentWeapon === WEAPONS.sniper) {
        playSniperSound();
    } else if (player.currentWeapon === WEAPONS.rocketLauncher) {
        playRocketLaunchSound();
    } else if (player.currentWeapon === WEAPONS.laser) {
        playLaserSound();
    } else {
        playPistolSound();
    }
}

function playPistolSound() {
    try {
        const source = audioContext.createBufferSource();
        source.buffer = gunshotBuffer;
        const gainNode = audioContext.createGain();
        const specificVol = settingsManager.getSetting('audio', 'gunshotVolume') ?? 1.0;
        gainNode.gain.value = 0.4 * specificVol;
        source.connect(gainNode);
        gainNode.connect(sfxGainNode || masterGainNode || audioContext.destination);
        source.start(0);
    } catch (error) { }
}

function playShotgunSound() {
    try {
        const source = audioContext.createBufferSource();
        source.buffer = gunshotBuffer;
        source.playbackRate.value = 0.8;
        const gainNode = audioContext.createGain();
        const specificVol = settingsManager.getSetting('audio', 'gunshotVolume') ?? 1.0;
        gainNode.gain.value = 0.5 * specificVol;
        source.connect(gainNode);
        gainNode.connect(sfxGainNode || masterGainNode || audioContext.destination);
        source.start(0);
    } catch (error) { }
}

function playRifleSound() {
    try {
        const source = audioContext.createBufferSource();
        source.buffer = gunshotBuffer;
        source.playbackRate.value = 1.2;
        const gainNode = audioContext.createGain();
        const specificVol = settingsManager.getSetting('audio', 'gunshotVolume') ?? 1.0;
        gainNode.gain.value = 0.35 * specificVol;
        source.connect(gainNode);
        gainNode.connect(sfxGainNode || masterGainNode || audioContext.destination);
        source.start(0);
    } catch (error) { }
}

function playFlamethrowerSound() {
    try {
        const source = audioContext.createBufferSource();
        source.buffer = gunshotBuffer;
        source.playbackRate.value = 0.2;
        const gainNode = audioContext.createGain();
        const specificVol = settingsManager.getSetting('audio', 'gunshotVolume') ?? 1.0;
        gainNode.gain.value = 0.1 * specificVol;
        source.connect(gainNode);
        gainNode.connect(sfxGainNode || masterGainNode || audioContext.destination);
        source.start(0);
    } catch (error) { }
}

function playSMGSound() {
    try {
        const source = audioContext.createBufferSource();
        source.buffer = gunshotBuffer;
        source.playbackRate.value = 1.4;
        const gainNode = audioContext.createGain();
        const specificVol = settingsManager.getSetting('audio', 'gunshotVolume') ?? 1.0;
        gainNode.gain.value = 0.25 * specificVol;
        source.connect(gainNode);
        gainNode.connect(sfxGainNode || masterGainNode || audioContext.destination);
        source.start(0);
    } catch (error) { }
}

function playSniperSound() {
    try {
        const source = audioContext.createBufferSource();
        source.buffer = gunshotBuffer;
        source.playbackRate.value = 0.6;
        const gainNode = audioContext.createGain();
        const specificVol = settingsManager.getSetting('audio', 'gunshotVolume') ?? 1.0;
        gainNode.gain.value = 0.6 * specificVol;
        source.connect(gainNode);
        gainNode.connect(sfxGainNode || masterGainNode || audioContext.destination);
        source.start(0);
    } catch (error) { }
}

function playRocketLaunchSound() {
    if (!audioContext) return;
    const t = audioContext.currentTime;
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, t);
    osc.frequency.exponentialRampToValueAtTime(50, t + 0.5);

    const specificVol = settingsManager.getSetting('audio', 'gunshotVolume') ?? 1.0;
    gain.gain.setValueAtTime(0.3 * specificVol, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.5);

    osc.connect(gain);
    gain.connect(sfxGainNode || masterGainNode || audioContext.destination);

    osc.start(t);
    osc.stop(t + 0.5);

}

function playLaserSound() {
    if (!audioContext) return;
    const t = audioContext.currentTime;
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();

    // Laser Zap: High frequency sweep
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(2000, t);
    osc.frequency.exponentialRampToValueAtTime(500, t + 0.1);

    const specificVol = settingsManager.getSetting('audio', 'gunshotVolume') ?? 1.0;
    gain.gain.setValueAtTime(0.15 * specificVol, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);

    // Filter to remove harshness
    const filter = audioContext.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(3000, t);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(sfxGainNode || masterGainNode || audioContext.destination);

    osc.start(t);
    osc.stop(t + 0.1);
}

export function playMenuClickSound() {
    if (!audioContext) return; // Silent if no audio context
    try {
        const t = audioContext.currentTime;
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();

        // High pitch "pip"
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, t);
        osc.frequency.linearRampToValueAtTime(1200, t + 0.03);

        const sfxVol = settingsManager.getSetting('audio', 'sfxVolume') ?? 1.0;
        gain.gain.setValueAtTime(0.05 * sfxVol, t); // Quiet
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

        osc.connect(gain);
        gain.connect(masterGainNode || audioContext.destination);

        osc.start(t);
        osc.stop(t + 0.05);
    } catch (e) { }
}

export function playMenuHoverSound() {
    if (!audioContext) return;
    try {
        const t = audioContext.currentTime;
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();

        // Subtle low-pitch "tick"
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, t);
        osc.frequency.exponentialRampToValueAtTime(150, t + 0.02);

        const sfxVol = settingsManager.getSetting('audio', 'sfxVolume') ?? 1.0;
        gain.gain.setValueAtTime(0.02 * sfxVol, t); // Very subtle
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.02);

        osc.connect(gain);
        gain.connect(masterGainNode || audioContext.destination);

        osc.start(t);
        osc.stop(t + 0.02);
    } catch (e) { }
}

// Generate damage/hurt sound using Web Audio API
export function playDamageSound() {
    if (!audioContext) {
        initAudio();
        if (!audioContext) return; // Still can't create, skip sound
    }

    try {
        // Create a damage sound (grunt/impact like)
        const duration = 0.2; // 200ms
        const sampleRate = audioContext.sampleRate;
        const buffer = audioContext.createBuffer(1, duration * sampleRate, sampleRate);
        const data = buffer.getChannelData(0);

        // Generate damage waveform (meatier impact)
        // Combine low thud (sine) with high frequency noise (crunch/splatter)
        for (let i = 0; i < buffer.length; i++) {
            const t = i / sampleRate;
            let sample = 0;

            // 1. Low frequency body (thud)
            // Rapid pitch drop 150Hz -> 50Hz for weight
            const freq = 150 - (t * 600);
            if (freq > 0) sample += Math.sin(t * freq * 2 * Math.PI) * 0.5;

            // 2. High frequency texture (crunch/splatter)
            const noise = Math.random() * 2 - 1;
            // Simple high-pass-like effect by ignoring low changes? No, let's just mix it.
            // Decay noise faster than the thud
            sample += noise * 0.4 * Math.exp(-t * 25);

            // 3. Mid-range resonance (gross factor)
            sample += Math.sin(t * 300 * 2 * Math.PI) * 0.2 * Math.exp(-t * 15);

            // Envelope: Immediate attack, natural decay
            const envelope = 1 - (t / duration);
            data[i] = sample * envelope * 0.4; // Slightly louder volume
        }

        // Play the sound
        const source = audioContext.createBufferSource();
        source.buffer = buffer;
        const gainNode = audioContext.createGain();
        gainNode.gain.value = 0.375; // Volume level (reduced by 25%)
        source.connect(gainNode);
        gainNode.connect(sfxGainNode || masterGainNode || audioContext.destination);
        source.start(0);
    } catch (error) {
        // Silently fail if audio can't play
    }
}

// Generate kill confirmed sound using Web Audio API
// zombieType: 'normal', 'fast', 'armored', 'exploding', 'ghost', 'spitter', 'boss'
export function playKillSound(zombieType = 'normal') {
    if (!audioContext) {
        initAudio();
        if (!audioContext) return; // Still can't create, skip sound
    }

    try {
        // Pitch multipliers based on zombie type (higher pitch = lighter/smaller feel)
        const pitchMultipliers = {
            'normal': 1.0,      // Base pitch
            'fast': 1.3,        // Higher pitch (fast = lighter)
            'armored': 0.75,   // Lower pitch (armored = heavier)
            'exploding': 0.9,   // Slightly lower (exploding = heavier)
            'ghost': 1.2,       // Higher pitch (ghost = lighter)
            'spitter': 1.1,     // Slightly higher
            'boss': 0.5         // Much lower pitch (boss = very heavy)
        };
        const pitchMultiplier = pitchMultipliers[zombieType] || 1.0;

        // Create a satisfying kill confirmation sound (pop/thud)
        const duration = 0.15; // 150ms - shorter and punchier than damage sound
        const sampleRate = audioContext.sampleRate;
        const buffer = audioContext.createBuffer(1, duration * sampleRate, sampleRate);
        const data = buffer.getChannelData(0);

        // Generate kill sound waveform (visceral squelch/splat - removing the "boop")
        for (let i = 0; i < buffer.length; i++) {
            const t = i / sampleRate;
            let sample = 0;

            // 1. Wet Squelch (Middle Freq Noise with "wobble" texture)
            // Modulate noise amplitude with a low sine to simulate liquid movement
            const texture = Math.sin(t * 80 * Math.PI); // Wobble texture
            const noise = (Math.random() * 2 - 1);
            // Squelch envelope - slower than a tick, faster than a moan
            const squelchEnv = Math.exp(-t * 25);
            sample += noise * texture * squelchEnv * 0.7;

            // 2. Low Frequency Thud (Body weight)
            // Pitch drop for weight: 120Hz -> 40Hz
            const dropFreq = (120 * pitchMultiplier) - (t * 400);
            if (dropFreq > 0) {
                sample += Math.sin(t * dropFreq * 2 * Math.PI) * 0.5 * Math.exp(-t * 20);
            }

            // 3. Crack/Snap (Initial bone break transient)
            // Short, high frequency burst
            const snapEnv = Math.exp(-t * 150);
            const highNoise = (Math.random() * 2 - 1);
            sample += highNoise * snapEnv * 0.4;

            data[i] = sample * 0.35; // Master volume for this sound
        }

        // Play the sound
        const source = audioContext.createBufferSource();
        source.buffer = buffer;
        const gainNode = audioContext.createGain();
        gainNode.gain.value = 0.4; // Volume level
        source.connect(gainNode);
        gainNode.connect(sfxGainNode || masterGainNode || audioContext.destination);
        source.start(0);
    } catch (error) {
        // Silently fail if audio can't play
    }
}

// Generate walking/footstep sound using Web Audio API
export function playFootstepSound(isSprinting = false) {
    if (!audioContext) {
        initAudio();
        if (!audioContext) return; // Still can't create, skip sound
    }

    try {
        // Create a footstep sound (thud/tap like)
        const duration = 0.15; // 150ms
        const sampleRate = audioContext.sampleRate;
        const buffer = audioContext.createBuffer(1, duration * sampleRate, sampleRate);
        const data = buffer.getChannelData(0);

        // Generate footstep waveform (impact + low thud)
        for (let i = 0; i < buffer.length; i++) {
            const t = i / sampleRate;
            let sample = 0;

            // Initial impact (high frequency tap)
            // Sprinting footsteps have slightly higher frequency for more impact
            const impactFreq = isSprinting ? (900 + Math.random() * 200) : (800 + Math.random() * 200);
            sample += Math.sin(t * impactFreq * 2 * Math.PI) * 0.3 * Math.exp(-t * 30);

            // Low frequency thud (bass) - louder when sprinting
            const bassVolume = isSprinting ? 0.5 : 0.4;
            sample += Math.sin(t * 80 * 2 * Math.PI) * bassVolume;
            sample += Math.sin(t * 120 * 2 * Math.PI) * (bassVolume * 0.5);

            // Add texture with filtered noise (like ground contact) - more noise when sprinting
            const noiseAmount = isSprinting ? 0.2 : 0.15;
            const noise = (Math.random() * 2 - 1) * noiseAmount;
            const noiseFilter = Math.exp(-t * 15); // High frequency decays quickly
            sample += noise * noiseFilter;

            // Envelope: very quick attack, medium decay
            const attack = Math.min(1, t / 0.01); // 10ms attack
            const decay = Math.max(0, 1 - (t - 0.01) / (duration - 0.01));
            const envelope = attack * decay;
            data[i] = sample * envelope * 0.2; // Volume
        }

        // Play the sound
        const source = audioContext.createBufferSource();
        source.buffer = buffer;
        const gainNode = audioContext.createGain();
        // Sprinting footsteps are louder (50% increase vs normal)
        const specificVol = settingsManager.getSetting('audio', 'walkingVolume') ?? 1.0;
        gainNode.gain.value = (isSprinting ? 0.5625 : 0.375) * specificVol;
        source.connect(gainNode);
        gainNode.connect(sfxGainNode || masterGainNode || audioContext.destination);
        source.start(0);
    } catch (error) {
        // Silently fail if audio can't play
    }
}

// Play explosion sound
export function playExplosionSound(size = 1.0) {
    if (!audioContext) {
        initAudio();
        if (!audioContext) return;
    }

    try {
        // Longer duration for larger explosions
        const duration = 0.4 + (size - 1.0) * 0.2; // 0.4s base, up to 0.6s for large
        const sampleRate = audioContext.sampleRate;
        const buffer = audioContext.createBuffer(1, duration * sampleRate, sampleRate);
        const data = buffer.getChannelData(0);

        // Generate explosion waveform (low rumble with high crack)
        for (let i = 0; i < buffer.length; i++) {
            const t = i / sampleRate;
            let sample = 0;
            // Low frequency rumble (deeper for larger explosions)
            const baseFreq = 60 / size; // Lower frequency for larger explosions
            sample += Math.sin(t * baseFreq * 2 * Math.PI) * 0.4 * size;
            sample += Math.sin(t * baseFreq * 2 * 2 * Math.PI) * 0.3 * size;
            // High frequency crack
            sample += Math.sin(t * 800 * 2 * Math.PI) * 0.2 * Math.exp(-t * 5);
            // Envelope: quick attack, slow decay (longer for larger)
            const decayRate = 2 / size; // Slower decay for larger explosions
            const envelope = Math.exp(-t * decayRate);
            data[i] = sample * envelope * (0.3 * size); // Louder for larger explosions
        }

        const source = audioContext.createBufferSource();
        source.buffer = buffer;
        const gainNode = audioContext.createGain();
        gainNode.gain.value = 0.4 * Math.min(size, 1.5); // Cap volume increase
        source.connect(gainNode);
        gainNode.connect(sfxGainNode || masterGainNode || audioContext.destination);
        source.start(0);
    } catch (error) {
        // Silently fail if audio can't play
    }
}

// Play rocket launcher fire sound
export function playRocketFireSound() {
    if (!audioContext) {
        initAudio();
        if (!audioContext) return;
    }

    try {
        const duration = 0.35; // 350ms - longer than regular gunshot
        const sampleRate = audioContext.sampleRate;
        const buffer = audioContext.createBuffer(1, duration * sampleRate, sampleRate);
        const data = buffer.getChannelData(0);

        // Generate rocket launcher firing waveform (deep rumble with sharp crack)
        for (let i = 0; i < buffer.length; i++) {
            const t = i / sampleRate;
            let sample = 0;

            // Low frequency rumble (80-120Hz) - deeper than gunshot
            sample += Math.sin(t * 100 * 2 * Math.PI) * 0.5;
            sample += Math.sin(t * 80 * 2 * Math.PI) * 0.3;

            // Sharp crack/click (800-1000Hz) - distinctive launch sound
            sample += Math.sin(t * 900 * 2 * Math.PI) * 0.3 * Math.exp(-t * 8);

            // Whoosh/thump component (200-300Hz)
            sample += Math.sin(t * 250 * 2 * Math.PI) * 0.2 * Math.exp(-t * 3);

            // Add slight noise for texture
            sample += (Math.random() * 2 - 1) * 0.1;

            // Envelope: quick attack, medium decay
            const attack = Math.min(1, t / 0.02); // 20ms attack
            const decay = Math.max(0, 1 - (t - 0.02) / (duration - 0.02));
            const envelope = attack * decay;
            data[i] = sample * envelope * 0.4; // Slightly louder than gunshot
        }

        const source = audioContext.createBufferSource();
        source.buffer = buffer;
        const gainNode = audioContext.createGain();
        const specificVol = settingsManager.getSetting('audio', 'gunshotVolume') ?? 1.0;
        gainNode.gain.value = 0.5 * specificVol; // Louder than regular gunshot
        source.connect(gainNode);
        gainNode.connect(sfxGainNode || masterGainNode || audioContext.destination);
        source.start(0);
    } catch (error) {
        // Silently fail if audio can't play
    }
}

export function playRestartSound() {
    // Play a restart confirmation sound
    if (!audioContext) {
        initAudio();
        if (!audioContext) return;
    }

    try {
        // Create a rising tone for restart confirmation
        const duration = 0.3; // 300ms
        const sampleRate = audioContext.sampleRate;
        const buffer = audioContext.createBuffer(1, duration * sampleRate, sampleRate);
        const data = buffer.getChannelData(0);

        // Generate rising tone waveform
        for (let i = 0; i < buffer.length; i++) {
            const t = i / sampleRate;
            // Rising frequency from 200Hz to 800Hz
            const freq = 200 + (t / duration) * 600;
            let sample = Math.sin(t * freq * 2 * Math.PI);
            // Add some harmonics for richness
            sample += Math.sin(t * freq * 2 * 2 * Math.PI) * 0.3;
            sample += Math.sin(t * freq * 3 * 2 * Math.PI) * 0.1;
            // Envelope: medium attack, medium decay
            const attack = Math.min(1, t / 0.05); // 50ms attack
            const decay = Math.max(0, 1 - (t - 0.05) / (duration - 0.05));
            const envelope = attack * decay;
            data[i] = sample * envelope * 0.2; // Volume
        }

        // Play the sound
        const source = audioContext.createBufferSource();
        source.buffer = buffer;
        const gainNode = audioContext.createGain();
        gainNode.gain.value = 0.3; // Volume level
        source.connect(gainNode);
        gainNode.connect(sfxGainNode || masterGainNode || audioContext.destination);
        source.start(0);
    } catch (error) {
        // Silently fail if audio can't play
    }
}

// Generate hit marker sound using Web Audio API
export function playHitSound() {
    if (!audioContext) {
        initAudio();
        if (!audioContext) return;
    }

    try {
        // Create a quick, sharp hit marker sound (like a "tick" or "click")
        const duration = 0.08; // 80ms - very short and sharp
        const sampleRate = audioContext.sampleRate;
        const buffer = audioContext.createBuffer(1, duration * sampleRate, sampleRate);
        const data = buffer.getChannelData(0);

        // Generate hit sound waveform (sharp mechanical tick/thwack - removing the "boop")
        for (let i = 0; i < buffer.length; i++) {
            const t = i / sampleRate;
            let sample = 0;

            // 1. High frequency noise burst (The "Tick")
            // Filtered white noise (poor man's high pass via rapid decay of low freq components? No, just noise)
            const noise = Math.random() * 2 - 1;

            // Envelope: Extremely fast attack and decay
            const tickEnv = Math.exp(-t * 200); // Very sharp

            sample += noise * tickEnv * 0.4;

            // 2. Subtle impact body (The "Thwack") - Non-tonal
            // Low sine that drops pitch rapidly to avoid "tone" feel, acting more like a kick drum
            const thudFreq = 200 - (t * 2000);
            if (thudFreq > 0) {
                sample += Math.sin(t * thudFreq * 2 * Math.PI) * 0.3 * Math.exp(-t * 50);
            }

            // 3. Crisp shine (High freq sine sweep, very subtle - 4kHz)
            // Increases perceived sharpness without "beeping"
            sample += Math.sin(t * 4000 * 2 * Math.PI) * 0.1 * tickEnv;

            data[i] = sample * 0.3; // Volume scaling
        }

        // Play the sound
        const source = audioContext.createBufferSource();
        source.buffer = buffer;
        const gainNode = audioContext.createGain();
        const specificVol = settingsManager.getSetting('audio', 'hitSoundVolume') ?? 1.0;
        gainNode.gain.value = 0.35 * specificVol; // Volume level
        source.connect(gainNode);
        gainNode.connect(sfxGainNode || masterGainNode || audioContext.destination);
        source.start(0);
    } catch (error) {
        // Silently fail if audio can't play
    }
}


// Score Multiplier Audio Feedback

/**
 * Play multiplier tier-up sound
 * @param {number} tier - The new multiplier tier (2.0, 3.0, 4.0, 5.0)
 */
export function playMultiplierUpSound(tier) {
    if (!audioContext) {
        initAudio();
    }
    if (!audioContext) return;

    // Generate a "Crystal Shimmer" effect (dual oscillator for richness)
    // Oscillator 1: Main tone (Sine)
    const osc1 = audioContext.createOscillator();
    const gain1 = audioContext.createGain();

    // Oscillator 2: Overtone (Sine, +1 Octave, detuned slightly)
    const osc2 = audioContext.createOscillator();
    const gain2 = audioContext.createGain();

    // Base pitch (higher/glassier than before)
    const pitch = 500 + (tier * 150);

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(pitch, audioContext.currentTime);

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(pitch * 2 + 5, audioContext.currentTime); // +5Hz detune for "shimmer"

    // Connections
    const multVol = settingsManager.getSetting('audio', 'multiplierVolume') ?? 1.0;
    osc1.connect(gain1);
    gain1.connect(sfxGainNode || masterGainNode || audioContext.destination);

    osc2.connect(gain2);
    gain2.connect(sfxGainNode || masterGainNode || audioContext.destination);

    const now = audioContext.currentTime;
    const duration = 0.3;

    // Envelopes (Bell-like: Soft attack, shorter decay)
    // Main Tone
    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.15 * multVol, now + 0.03);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + duration);

    // Overtone (Quiet but adds high-end sheen)
    gain2.gain.setValueAtTime(0, now);
    gain2.gain.linearRampToValueAtTime(0.10 * multVol, now + 0.03);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + (duration * 0.7));

    // Play
    osc1.start(now);
    osc1.stop(now + duration + 0.1);
    osc2.start(now);
    osc2.stop(now + duration + 0.1);
}

/**
 * Play special max multiplier sound (5x)
 */
export function playMultiplierMaxSound() {
    if (!audioContext) {
        initAudio();
    }
    if (!audioContext) return;

    // Create a fanfare with multiple tones
    const frequencies = [523, 659, 784, 1047]; // C, E, G, C (major chord)

    frequencies.forEach((freq, index) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.frequency.value = freq;
        oscillator.type = 'sine';

        oscillator.connect(gainNode);
        gainNode.connect(sfxGainNode || masterGainNode || audioContext.destination);

        const startTime = audioContext.currentTime + (index * 0.05);
        gainNode.gain.setValueAtTime(0.2, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.4);

        oscillator.start(startTime);
        oscillator.stop(startTime + 0.4);
    });
}

/**
 * Play multiplier lost sound (negative feedback)
 */
export function playMultiplierLostSound() {
    if (!audioContext) {
        initAudio();
    }
    if (!audioContext) return;

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    // Descending tone for negative feedback
    oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.3);
    oscillator.type = 'sawtooth';

    oscillator.connect(gainNode);
    gainNode.connect(sfxGainNode || masterGainNode || audioContext.destination);

    gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.3);
}
