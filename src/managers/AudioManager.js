import { GAME_CONFIG } from '../config/gameConfig.js';

/**
 * AudioManager
 * Procedural Web Audio API sound synthesizer with zero external sound file dependencies.
 * Complies with Mobile Safari/Chrome strict autoplay policies via explicit unlock.
 */
export class AudioManager {
  constructor() {
    this.ctx = null;
    this.unlocked = false;
    this.masterGain = null;
    this.masterVolume = GAME_CONFIG.AUDIO.MASTER_VOLUME;
    this.isMuted = false;
  }

  /**
   * Toggles audio mute state
   */
  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      const vol = this.isMuted ? 0 : this.masterVolume;
      this.masterGain.gain.setValueAtTime(vol, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  /**
   * Called on first user touch / 'Tap to Drop' to safely resume AudioContext
   */
  unlockAudio() {
    if (this.unlocked && this.ctx) return;

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;

      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.masterVolume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }

      this.unlocked = true;
    } catch (e) {
      console.warn('AudioContext initialization deferred:', e);
    }
  }

  playSound(soundId) {
    if (!this.unlocked || !this.ctx || !GAME_CONFIG.AUDIO.SYNTH_ENABLED) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    const t = this.ctx.currentTime;

    switch (soundId) {
      case 'hit_dirt':
        this.synthThud(t, 120, 45, 0.08);
        break;
      case 'hit_stone':
        this.synthSnap(t, 380, 0.06);
        break;
      case 'hit_metal':
      case 'clank':
        this.synthTone(t, 880, 'sine', 0.12, 0.3);
        this.synthTone(t, 1760, 'triangle', 0.08, 0.15);
        break;
      case 'break_stone':
      case 'break_dirt':
        this.synthNoiseCrunch(t, 0.15);
        break;
      case 'break_gem':
        this.synthChime(t, [587, 880, 1174], 0.25);
        break;
      case 'explode':
        this.synthExplosion(t);
        break;
      case 'repair_chime':
        this.synthChime(t, [523, 659, 783], 0.3);
        break;
      case 'upgrade_fanfare':
        this.synthChime(t, [440, 554, 659, 880], 0.45);
        break;
      case 'boing':
      case 'hit_bounce':
        this.synthPitchSlide(t, 150, 480, 0.22);
        break;
      case 'swing':
        this.synthPitchSlide(t, 320, 120, 0.1);
        break;
      case 'pickaxe_break':
        this.synthNoiseCrunch(t, 0.35);
        this.synthTone(t, 220, 'sawtooth', 0.25, 0.2);
        break;
    }
  }

  synthTone(startTime, freq, type, duration, volume = 0.2) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);

    gain.gain.setValueAtTime(volume, startTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(startTime);
    osc.stop(startTime + duration);
  }

  synthThud(startTime, startFreq, endFreq, duration) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(startFreq, startTime);
    osc.frequency.exponentialRampToValueAtTime(Math.max(10, endFreq), startTime + duration);

    gain.gain.setValueAtTime(0.3, startTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(startTime);
    osc.stop(startTime + duration);
  }

  synthSnap(startTime, freq, duration) {
    this.synthTone(startTime, freq, 'triangle', duration, 0.25);
    this.synthNoiseCrunch(startTime, duration * 0.5);
  }

  synthPitchSlide(startTime, startFreq, endFreq, duration) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(startFreq, startTime);
    osc.frequency.exponentialRampToValueAtTime(endFreq, startTime + duration);

    gain.gain.setValueAtTime(0.35, startTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(startTime);
    osc.stop(startTime + duration);
  }

  synthChime(startTime, freqs, duration) {
    freqs.forEach((f, idx) => {
      this.synthTone(startTime + idx * 0.06, f, 'sine', duration, 0.22);
    });
  }

  synthExplosion(startTime) {
    // Deep sub drop
    this.synthThud(startTime, 160, 20, 0.6);

    // Filtered noise blast
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.5);
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, startTime);
    filter.frequency.exponentialRampToValueAtTime(80, startTime + 0.5);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.4, startTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.5);

    whiteNoise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    whiteNoise.start(startTime);
    whiteNoise.stop(startTime + 0.5);
  }

  synthNoiseCrunch(startTime, duration) {
    const bufferSize = Math.floor(this.ctx.sampleRate * duration);
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * 0.5;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.18, startTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    noise.connect(gain);
    gain.connect(this.masterGain);

    noise.start(startTime);
    noise.stop(startTime + duration);
  }
}

