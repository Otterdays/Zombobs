/**
 * ArcadeMusicSystem.js - Procedural music generation for arcade mode
 * Uses Web Audio API to generate dynamic, atmospheric zombie game music
 * No external audio files required!
 */

import { settingsManager } from './SettingsManager.js';

// Music state
let audioContext = null;
let masterGain = null;
let musicGain = null;
let isPlaying = false;
let isPaused = false;
let currentIntensity = 0.5; // 0-1, affects music intensity

// Oscillators and nodes
let bassOsc = null;
let padOsc1 = null;
let padOsc2 = null;
let arpeggioOsc = null;
let percussionInterval = null;
let arpeggioInterval = null;
let bassInterval = null;

// Musical settings
const TEMPO = 120; // BPM
const BEAT_MS = (60 / TEMPO) * 1000;

// Dark, ominous key (D minor)
const BASS_NOTES = [73.42, 82.41, 97.99, 110.00]; // D2, E2, G2, A2
const PAD_NOTES = [146.83, 174.61, 196.00, 220.00]; // D3, F3, G3, A3
const ARPEGGIO_NOTES = [293.66, 349.23, 392.00, 440.00, 523.25]; // D4, F4, G4, A4, C5

let currentBassNote = 0;
let currentPattern = 0;
let beatCount = 0;

/**
 * Initialize the arcade music system
 */
export function initArcadeMusic(existingContext = null) {
    if (audioContext) return; // Already initialized

    try {
        audioContext = existingContext || new (window.AudioContext || window.webkitAudioContext)();

        // Create master gain for music
        masterGain = audioContext.createGain();
        masterGain.connect(audioContext.destination);

        // Create music-specific gain (controlled by music volume setting)
        musicGain = audioContext.createGain();
        const musicVol = settingsManager.getSetting('audio', 'musicVolume') ?? 0.5;
        const masterVol = settingsManager.getSetting('audio', 'masterVolume') ?? 1.0;
        musicGain.gain.value = musicVol * masterVol * 0.3; // Keep music subtle
        musicGain.connect(masterGain);

    } catch (error) {
        console.warn('ArcadeMusicSystem: Could not initialize audio context');
    }
}

/**
 * Update music volume based on settings
 */
export function updateMusicVolume() {
    if (!musicGain || isPaused) return; // Don't update volume if paused (keep it muted)

    const isMuted = settingsManager.getSetting('audio', 'muted') === true;
    const musicVol = settingsManager.getSetting('audio', 'musicVolume') ?? 0.5;
    const masterVol = settingsManager.getSetting('audio', 'masterVolume') ?? 1.0;

    musicGain.gain.value = isMuted ? 0 : (musicVol * masterVol * 0.3 * (0.8 + currentIntensity * 0.4));
}

/**
 * Start playing arcade music
 */
export function startArcadeMusic() {
    if (isPlaying || !audioContext) {
        initArcadeMusic();
        if (!audioContext) return;
    }

    // Resume context if suspended
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }

    isPlaying = true;
    currentBassNote = 0;
    beatCount = 0;

    // Start all music layers
    startBassLine();
    startPads();
    startArpeggio();
    startPercussion();
}

/**
 * Stop arcade music
 */
export function stopArcadeMusic() {
    isPlaying = false;

    // Stop all oscillators and intervals
    if (bassInterval) {
        clearInterval(bassInterval);
        bassInterval = null;
    }
    if (bassOsc) {
        try { bassOsc.stop(); } catch (e) { }
        bassOsc = null;
    }
    if (padOsc1) {
        try { padOsc1.stop(); } catch (e) { }
        padOsc1 = null;
    }
    if (padOsc2) {
        try { padOsc2.stop(); } catch (e) { }
        padOsc2 = null;
    }
    if (arpeggioOsc) {
        try { arpeggioOsc.stop(); } catch (e) { }
        arpeggioOsc = null;
    }
    if (percussionInterval) {
        clearInterval(percussionInterval);
        percussionInterval = null;
    }
    if (arpeggioInterval) {
        clearInterval(arpeggioInterval);
        arpeggioInterval = null;
    }
}

/**
 * Pause arcade music (mute)
 */
export function pauseArcadeMusic() {
    isPaused = true;
    if (musicGain && audioContext) {
        musicGain.gain.setTargetAtTime(0, audioContext.currentTime, 0.1);
    }
}

/**
 * Resume arcade music (unmute)
 */
export function resumeArcadeMusic() {
    if (!isPaused || !isPlaying) return;

    isPaused = false;
    // Restore volume immediately
    if (musicGain && audioContext) {
        updateMusicVolume();
    }
}

/**
 * Set music intensity (0-1)
 * Higher intensity = faster tempo feel, more layers, higher notes
 */
export function setMusicIntensity(intensity) {
    currentIntensity = Math.max(0, Math.min(1, intensity));

    // Adjust music parameters based on intensity
    if (musicGain) {
        const baseVol = settingsManager.getSetting('audio', 'musicVolume') ?? 0.5;
        const masterVol = settingsManager.getSetting('audio', 'masterVolume') ?? 1.0;
        // Slightly louder at higher intensity
        musicGain.gain.value = baseVol * masterVol * 0.3 * (0.8 + currentIntensity * 0.4);
    }
}

/**
 * Start the bass line - 808 Trap Style
 */
function startBassLine() {
    if (!audioContext || !musicGain) return;

    let step = 0;

    // Run sequencing on 8th notes for trap rhythms
    bassInterval = setInterval(() => {
        if (!isPlaying) return;

        step++;
        beatCount = Math.floor(step / 2); // Update global beat count

        const measure = Math.floor(step / 32); // 32 steps = 4 bars (of 4/4)
        const stepInMeasure = step % 32;

        // "Stop entirely" - Break silence on the last 4 beats of every 4th bar (Drop)
        if (stepInMeasure > 28) return;

        // Trap Bass Pattern:
        // Heavy on the 1 (0). Syncopated hits on 3 (dotted quarter feel).
        // Steps: 0, 3, 6, 10, 16...
        const isBassHit = (step % 16 === 0) || (step % 16 === 3) || (step % 16 === 7) || (step % 16 === 10);

        // Randomly skip some syncopated notes for variation, but always hit the 1 (step 0)
        let shouldPlay = isBassHit;
        if (shouldPlay && step % 16 !== 0 && Math.random() < 0.2) shouldPlay = false;

        if (shouldPlay) {
            const now = audioContext.currentTime;
            const freq = BASS_NOTES[currentBassNote];
            // Higher intensity = louder / more distorted 808
            playTrapBass(now, freq, 0.6 + currentIntensity * 0.4);
        }

        // Change root note every 2 measures
        if (step % 32 === 0) {
            currentBassNote = (currentBassNote + 1) % BASS_NOTES.length;
        }

    }, BEAT_MS / 2); // 8th notes
}



/**
 * Start ambient pads - eerie atmosphere
 */
function startPads() {
    if (!audioContext || !musicGain) return;

    // Create two detuned oscillators for thick pad sound
    padOsc1 = audioContext.createOscillator();
    padOsc2 = audioContext.createOscillator();

    padOsc1.type = 'sine';
    padOsc2.type = 'triangle';

    padOsc1.frequency.value = PAD_NOTES[0];
    padOsc2.frequency.value = PAD_NOTES[0] * 1.005; // Slight detune for thickness

    // Create filter for pad
    const padFilter = audioContext.createBiquadFilter();
    padFilter.type = 'lowpass';
    padFilter.frequency.value = 800;

    // Create gain for pads
    const padGain = audioContext.createGain();
    padGain.gain.value = 0.15;

    // Connect pads
    padOsc1.connect(padFilter);
    padOsc2.connect(padFilter);
    padFilter.connect(padGain);
    padGain.connect(musicGain);

    padOsc1.start();
    padOsc2.start();

    // Slowly evolve pad notes
    setInterval(() => {
        if (!isPlaying || !padOsc1 || !padOsc2) return;

        // Change pad chord every 8 beats
        const padNote = PAD_NOTES[Math.floor(Math.random() * PAD_NOTES.length)];
        const now = audioContext.currentTime;

        // Faster transition to prevent "siren" effect (0.1s instead of 2.0s)
        padOsc1.frequency.setTargetAtTime(padNote, now, 0.1);
        padOsc2.frequency.setTargetAtTime(padNote * 1.5, now, 0.1); // Fifth above

        // Subtle pad movement
        padGain.gain.setTargetAtTime(0.12, now, 0.5);
        padGain.gain.setTargetAtTime(0.1, now + 2, 0.5);

    }, BEAT_MS * 8);
}

/**
 * Start arpeggio - tense, driving pattern
 */
function startArpeggio() {
    if (!audioContext || !musicGain) return;

    let arpeggioIndex = 0;
    const arpeggioGain = audioContext.createGain();
    arpeggioGain.gain.value = 0;
    arpeggioGain.connect(musicGain);

    arpeggioInterval = setInterval(() => {
        if (!isPlaying) return;

        // Only play arpeggio at higher intensity
        if (currentIntensity < 0.3) return;

        // Create new oscillator for each note
        const osc = audioContext.createOscillator();
        osc.type = 'square';

        // Select note from arpeggio
        const noteIndex = arpeggioIndex % ARPEGGIO_NOTES.length;
        osc.frequency.value = ARPEGGIO_NOTES[noteIndex];
        arpeggioIndex++;

        // Create note envelope
        const noteGain = audioContext.createGain();
        const now = audioContext.currentTime;
        noteGain.gain.setValueAtTime(0.08 * currentIntensity, now);
        noteGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

        // Filter for less harsh square wave
        const filter = audioContext.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 2000;

        osc.connect(filter);
        filter.connect(noteGain);
        noteGain.connect(musicGain);

        osc.start(now);
        osc.stop(now + 0.15);

    }, BEAT_MS / 4); // 16th notes
}

/**
 * Start percussion - kick and hi-hat pattern
 */
function startPercussion() {
    if (!audioContext || !musicGain) return;

    let percBeat = 0;

    percussionInterval = setInterval(() => {
        if (!isPlaying) return;

        // Always play drums (base beat), enhance relative to intensity
        // if (currentIntensity < 0.4) return; // REMOVED: Drums are essential now

        const now = audioContext.currentTime;
        const volumeScale = 0.5 + (currentIntensity * 0.5); // 0.5 to 1.0 volume based on intensity

        // Bass Drum (Kick) - Pattern: X . X . (Driving)
        if (percBeat % 4 === 0 || percBeat % 4 === 2) {
            playKick(now, volumeScale);
        }

        // Snare Drum - Pattern: . X . X (Backbeat)
        if (percBeat % 4 === 2) { // Snare on 3 (half-time feel) or 2 & 4
            // Let's do a standard backbeat: Kick on 1, Snare on 2, Kick on 3, Snare on 4?
            // Actually, let's keep the Kick on 1 & 3 and add Snare on 2 & 4
        }

        // Simple Rock Beat: Kick 1,3 | Snare 2,4
        if (percBeat % 4 === 1 || percBeat % 4 === 3) {
            playSnare(now, volumeScale);
        }

        // Hi-hat - Fast 8th notes
        playHiHat(now, percBeat % 2 === 0, volumeScale);

        percBeat++;

    }, BEAT_MS / 2); // 8th notes
}

/**
 * Play a kick drum sound
 */
function playKick(time, volume = 1.0) {
    if (!audioContext || !musicGain) return;

    const osc = audioContext.createOscillator();
    osc.type = 'sine';

    // Pitch envelope for punchy kick
    osc.frequency.setValueAtTime(150, time);
    osc.frequency.exponentialRampToValueAtTime(40, time + 0.1);

    const gain = audioContext.createGain();
    gain.gain.setValueAtTime(0.5 * volume * 1.2, time); // Boost kick volume
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.2);

    osc.connect(gain);
    gain.connect(musicGain);

    osc.start(time);
    osc.stop(time + 0.25);
}

/**
 * Play a snare drum sound
 */
function playSnare(time, volume = 1.0) {
    if (!audioContext || !musicGain) return;

    // Snare is a mix of tone and noise

    // 1. Tonal component (body)
    const osc = audioContext.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(250, time);

    const oscGain = audioContext.createGain();
    oscGain.gain.setValueAtTime(0.2 * volume, time);
    oscGain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);

    osc.connect(oscGain);
    oscGain.connect(musicGain);
    osc.start(time);
    osc.stop(time + 0.15);

    // 2. Noise component (snap/rattle)
    const bufferSize = audioContext.sampleRate * 0.1;
    const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }

    const noise = audioContext.createBufferSource();
    noise.buffer = buffer;

    const noiseFilter = audioContext.createBiquadFilter();
    noiseFilter.type = 'highpass';
    noiseFilter.frequency.value = 1000;

    const noiseGain = audioContext.createGain();
    noiseGain.gain.setValueAtTime(0.25 * volume, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(musicGain);

    noise.start(time);
    noise.stop(time + 0.2);
}

/**
 * Play a hi-hat sound
 */
function playHiHat(time, accent = false, volume = 1.0) {
    if (!audioContext || !musicGain) return;

    // Create noise for hi-hat
    const bufferSize = audioContext.sampleRate * 0.05;
    const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }

    const noise = audioContext.createBufferSource();
    noise.buffer = buffer;

    // High-pass filter for hi-hat character
    const filter = audioContext.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 7000;

    const gain = audioContext.createGain();
    const baseVol = accent ? 0.15 : 0.08;
    gain.gain.setValueAtTime(baseVol * volume, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(musicGain);

    noise.start(time);
    noise.stop(time + 0.06);
}

/**
 * Check if music is currently playing
 */
export function isMusicPlaying() {
    return isPlaying;
}

/**
 * Get current intensity level
 */
export function getMusicIntensity() {
    return currentIntensity;
}

/**
 * Play an 808-style trap bass sub
 */
function playTrapBass(time, freq, intensity) {
    if (!audioContext || !musicGain) return;

    const osc = audioContext.createOscillator();
    osc.type = 'sine'; // 808 Sub is sine-based

    // 808 Pitch Envelope (Punch -> Settle)
    // Reduced range to prevent "weeeuuuu" sliding sound
    osc.frequency.setValueAtTime(freq * 1.2, time); // Less aggressive start
    osc.frequency.exponentialRampToValueAtTime(freq, time + 0.05); // Faster settle
    osc.frequency.linearRampToValueAtTime(freq * 0.95, time + 0.4); // Subtle decay drop

    // Saturation/Distortion (Make it audible on small speakers & grittier)
    const shaper = audioContext.createWaveShaper();
    shaper.curve = makeDistortionCurve(10 + (intensity * 20)); // More intensity = more grit
    shaper.oversample = '4x';

    const gain = audioContext.createGain();
    gain.gain.setValueAtTime(0.8 * intensity, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.8); // Long 808 decay

    osc.connect(shaper);
    shaper.connect(gain);
    gain.connect(musicGain);

    osc.start(time);
    osc.stop(time + 0.9);
}

// Helper for distortion curve
function makeDistortionCurve(amount) {
    const k = typeof amount === 'number' ? amount : 50;
    const n_samples = 44100;
    const curve = new Float32Array(n_samples);
    const deg = Math.PI / 180;
    for (let i = 0; i < n_samples; ++i) {
        const x = i * 2 / n_samples - 1;
        curve[i] = (3 + k) * x * 20 * deg / (Math.PI + k * Math.abs(x));
    }
    return curve;
}


