/**
 * Real Human Martial Arts & Procedural Web Audio Engine for Blaze Adventure.
 * - Decodes pre-generated PCM WAV vocalizations ("Hah!", "Hyaa!", "Toh!", "Ugh!")
 * - Physical impact hits ("SNAP", "THUMP", "THWACK")
 * - Procedural Web Audio music loops (Menu, Gameplay, Boss) with zero external asset dependencies
 * - Full SFX/Music volume controls, audio throttling, anti-repetition, and mobile optimization
 */

import { VOCAL_DATA_URIS } from './vocalClips';

const VOCAL_MAP: Record<string, string[]> = {
  light_punch: ['vocal_light_1', 'vocal_light_2', 'vocal_light_3'],
  heavy_punch: ['vocal_heavy_1', 'vocal_heavy_2', 'vocal_heavy_3'],
  kick: ['vocal_kick_1', 'vocal_kick_2', 'vocal_kick_3'],
  spin_kick: ['vocal_spin_1', 'vocal_spin_2'],
  jump_kick: ['vocal_jump_1', 'vocal_jump_2'],
  finisher: ['vocal_finisher_1', 'vocal_finisher_2'],
};

const HURT_CLIPS = ['vocal_hurt_1', 'vocal_hurt_2', 'vocal_hurt_3'];

export type MusicTrack = 'NONE' | 'MENU' | 'GAMEPLAY' | 'BOSS';

class AudioEngine {
  private ctx: AudioContext | null = null;
  private soundFxEnabled: boolean = true;
  private musicEnabled: boolean = true;

  private musicVolume: number = 0.7; // 0.0 to 1.0
  private sfxVolume: number = 0.8; // 0.0 to 1.0

  private currentTrack: MusicTrack = 'NONE';
  private lastRequestedTrack: MusicTrack = 'MENU';
  private musicMasterGain: GainNode | null = null;
  private musicSchedulerTimer: number | null = null;
  private stepIndex: number = 0;
  private nextNoteTime: number = 0;

  private decodedBuffers: Map<string, AudioBuffer> = new Map();
  private isPreloading: boolean = false;

  // Anti-Repetition & Cooldown Tracking
  private lastVocalTime: number = 0;
  private lastVocalIndexMap: Record<string, number> = {};
  private lastHurtIndex: number = -1;

  // Audio Throttling to prevent wall-of-sound distortion on multi-hits
  private lastImpactTime: number = 0;
  private recentImpactsInWindow: number = 0;

  // Single-trigger flags
  private isGameOverSoundPlayed: boolean = false;
  private isVictorySoundPlayed: boolean = false;

  constructor() {
    // AudioContext will be initialized on first user gesture
  }

  private initContext() {
    if (!this.ctx) {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        this.ctx = new AudioCtxClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    if (this.ctx && !this.isPreloading) {
      this.isPreloading = true;
      this.preloadBuffers();
    }
  }

  private async preloadBuffers() {
    if (!this.ctx) return;
    for (const [key, dataUri] of Object.entries(VOCAL_DATA_URIS)) {
      try {
        const base64 = dataUri.split(',')[1];
        const binaryString = window.atob(base64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const audioBuffer = await this.ctx.decodeAudioData(bytes.buffer);
        this.decodedBuffers.set(key, audioBuffer);
      } catch (err) {
        console.warn(`Failed to decode audio buffer ${key}:`, err);
      }
    }
  }

  // ==========================================
  // SETTINGS & VOLUME CONTROLS
  // ==========================================

  public setSoundFxEnabled(enabled: boolean) {
    this.soundFxEnabled = enabled;
  }

  public setMusicEnabled(enabled: boolean) {
    this.musicEnabled = enabled;
    if (!enabled && this.currentTrack !== 'NONE') {
      this.stopMusic();
    } else if (enabled && this.currentTrack === 'NONE') {
      this.playMusic(this.lastRequestedTrack || 'MENU');
    }
  }

  public setMusicVolume(volume: number) {
    this.musicVolume = Math.max(0, Math.min(1, volume));
    if (this.musicMasterGain && this.ctx) {
      this.musicMasterGain.gain.setValueAtTime(this.musicVolume * 0.35, this.ctx.currentTime);
    }
  }

  public getMusicVolume(): number {
    return this.musicVolume;
  }

  public setSfxVolume(volume: number) {
    this.sfxVolume = Math.max(0, Math.min(1, volume));
  }

  public getSfxVolume(): number {
    return this.sfxVolume;
  }

  public isSoundEnabled(): boolean {
    return this.soundFxEnabled;
  }

  public isMusicEnabled(): boolean {
    return this.musicEnabled;
  }

  public getCurrentTrack(): MusicTrack {
    return this.currentTrack;
  }

  // ==========================================
  // PROCEDURAL MUSIC SYNTHESIS ENGINE
  // ==========================================

  public playMusic(track: MusicTrack = 'MENU') {
    this.lastRequestedTrack = track;

    if (!this.musicEnabled) return;
    this.initContext();
    if (!this.ctx) return;

    // Avoid restarting if requested track is already playing
    if (this.currentTrack === track && this.musicSchedulerTimer !== null) {
      return;
    }

    // Stop old music smoothly
    this.stopMusicInternal(false);

    this.currentTrack = track;
    if (track === 'NONE') return;

    // Create new master gain node for the requested music track
    const masterGain = this.ctx.createGain();
    const targetGain = this.musicVolume * 0.32;
    masterGain.gain.setValueAtTime(0.001, this.ctx.currentTime);
    masterGain.gain.exponentialRampToValueAtTime(Math.max(0.001, targetGain), this.ctx.currentTime + 0.3);

    masterGain.connect(this.ctx.destination);
    this.musicMasterGain = masterGain;

    this.stepIndex = 0;
    this.nextNoteTime = this.ctx.currentTime + 0.05;

    // Start 40ms interval scheduler
    this.musicSchedulerTimer = window.setInterval(() => {
      this.scheduleMusicStep();
    }, 40);
  }

  public stopMusic() {
    this.lastRequestedTrack = 'NONE';
    this.stopMusicInternal(true);
  }

  private stopMusicInternal(fade: boolean = true) {
    if (this.musicSchedulerTimer !== null) {
      window.clearInterval(this.musicSchedulerTimer);
      this.musicSchedulerTimer = null;
    }

    if (this.musicMasterGain && this.ctx) {
      const gain = this.musicMasterGain;
      this.musicMasterGain = null;
      if (fade) {
        gain.gain.setValueAtTime(gain.gain.value, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.25);
        setTimeout(() => {
          try { gain.disconnect(); } catch {}
        }, 300);
      } else {
        try { gain.disconnect(); } catch {}
      }
    }

    this.currentTrack = 'NONE';
  }

  private scheduleMusicStep() {
    if (!this.ctx || !this.musicMasterGain) return;

    const scheduleAheadTime = 0.2; // Schedule notes 200ms in advance
    while (this.nextNoteTime < this.ctx.currentTime + scheduleAheadTime) {
      this.renderMusicNote(this.nextNoteTime, this.stepIndex);
      this.advanceStep();
    }
  }

  private advanceStep() {
    let secondsPer16th = 0.125; // 120 BPM default

    if (this.currentTrack === 'MENU') {
      secondsPer16th = 0.178; // 84 BPM calm
    } else if (this.currentTrack === 'GAMEPLAY') {
      secondsPer16th = 0.125; // 120 BPM martial groove
    } else if (this.currentTrack === 'BOSS') {
      secondsPer16th = 0.105; // 142 BPM intense boss theme
    }

    this.nextNoteTime += secondsPer16th;
    this.stepIndex = (this.stepIndex + 1) % 32;
  }

  private renderMusicNote(time: number, step: number) {
    if (!this.ctx || !this.musicMasterGain) return;

    if (this.currentTrack === 'MENU') {
      // MENU MUSIC: Atmospheric Martial Pentatonic Ambient Pad & Gentle Arpeggio (A Minor / Pentatonic)
      // Notes: A2 (110), C3 (130.8), D3 (146.8), E3 (164.8), G3 (196), A3 (220), C4 (261.6), E4 (329.6)
      const menuNotes = [220, 261.63, 329.63, 392.0, 440, 523.25];

      // Bass drone on beats 0 & 16
      if (step === 0 || step === 16) {
        this.playSynthNote(110, time, 1.4, 'sine', 0.22, 200); // Low A2
      } else if (step === 8 || step === 24) {
        this.playSynthNote(146.83, time, 1.2, 'sine', 0.18, 250); // Low D3
      }

      // Arpeggio melody notes on specific steps
      if ([0, 3, 6, 10, 12, 14, 16, 19, 22, 26, 28, 30].includes(step)) {
        const noteIdx = (step * 3 + 2) % menuNotes.length;
        const freq = menuNotes[noteIdx];
        this.playSynthNote(freq, time, 0.35, 'triangle', 0.12, 1200);
      }
    } else if (this.currentTrack === 'GAMEPLAY') {
      // GAMEPLAY MUSIC: Energetic Martial Combat Theme (G Minor Pentatonic)
      // Scale: G2 (98), Bb2 (116.5), C3 (130.8), D3 (146.8), F3 (174.6), G3 (196)
      const bassNotes = [98, 98, 116.54, 98, 130.81, 98, 146.83, 116.54];

      // Driving Bass synth line on every quarter/eighth step
      if (step % 2 === 0) {
        const bFreq = bassNotes[(step / 2) % bassNotes.length];
        this.playSynthNote(bFreq, time, 0.16, 'sawtooth', 0.25, 450);
      }

      // Percussion Hi-Hat / Snare Noise tick
      if (step % 2 === 1) {
        this.playPercussionNoise(time, 0.03, 0.06, 3500); // Hi-Hat
      }
      if (step === 4 || step === 12 || step === 20 || step === 28) {
        this.playPercussionNoise(time, 0.08, 0.16, 1200); // Snare
      }

      // Martial Lead Motif
      const leadPattern: Record<number, number> = {
        0: 392.0, // G4
        3: 466.16, // Bb4
        6: 523.25, // C5
        10: 587.33, // D5
        14: 523.25,
        16: 392.0,
        19: 349.23, // F4
        22: 392.0,
        26: 466.16,
        30: 523.25,
      };

      if (leadPattern[step] !== undefined) {
        this.playSynthNote(leadPattern[step], time, 0.2, 'square', 0.14, 1800);
      }
    } else if (this.currentTrack === 'BOSS') {
      // BOSS MUSIC: Intense, Fast D-Phrygian Saw Bass + Tension Pulse
      // Scale: D2 (73.4), Eb2 (77.78), F2 (87.3), G2 (98), A2 (110), D3 (146.8)
      const bossBass = [73.42, 73.42, 77.78, 73.42, 87.31, 73.42, 98.0, 77.78];

      // Driving Heavy Saw Bass
      const bFreq = bossBass[(step % bossBass.length)];
      this.playSynthNote(bFreq, time, 0.14, 'sawtooth', 0.32, 600);

      // Heavy Kick Sub Drop on beats 0, 8, 16, 24
      if (step % 8 === 0) {
        this.playSynthNote(65.41, time, 0.22, 'sine', 0.45, 120);
      }

      // Rapid Snare / Percussion Pulses
      if (step % 4 === 2) {
        this.playPercussionNoise(time, 0.07, 0.22, 1000);
      } else if (step % 2 === 1) {
        this.playPercussionNoise(time, 0.02, 0.08, 4500);
      }

      // High Tension Arpeggio
      const tensionNotes = [293.66, 311.13, 349.23, 392.0, 440.0, 587.33];
      if (step % 2 === 0) {
        const tNote = tensionNotes[(step / 2) % tensionNotes.length];
        this.playSynthNote(tNote, time, 0.12, 'triangle', 0.16, 2200);
      }
    }
  }

  private playSynthNote(
    freq: number,
    time: number,
    duration: number,
    type: OscillatorType,
    gainVal: number,
    filterCutoff: number
  ) {
    if (!this.ctx || !this.musicMasterGain) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, time);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(filterCutoff, time);

      const actualGain = gainVal * this.musicVolume;
      gain.gain.setValueAtTime(actualGain, time);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicMasterGain);

      osc.start(time);
      osc.stop(time + duration + 0.05);
    } catch {}
  }

  private playPercussionNoise(time: number, duration: number, gainVal: number, cutoff: number) {
    if (!this.ctx || !this.musicMasterGain) return;

    try {
      const bufferSize = Math.floor(this.ctx.sampleRate * duration);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = buffer.getChannelData(0);

      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(cutoff, time);

      const gain = this.ctx.createGain();
      const actualGain = gainVal * this.musicVolume;
      gain.gain.setValueAtTime(actualGain, time);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicMasterGain);

      whiteNoise.start(time);
      whiteNoise.stop(time + duration + 0.02);
    } catch {}
  }

  // ==========================================
  // PLAY CLIP HELPER & SFX
  // ==========================================

  private playClip(key: string, baseGainValue: number = 0.8) {
    if (!this.soundFxEnabled) return;
    this.initContext();
    if (!this.ctx) return;

    const buffer = this.decodedBuffers.get(key);
    if (!buffer) return;

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;

    // Subtle pitch variation (0.96 - 1.04) for organic, non-monotonous human audio
    source.playbackRate.value = 0.96 + Math.random() * 0.08;

    const gainNode = this.ctx.createGain();
    const finalGain = baseGainValue * this.sfxVolume;
    gainNode.gain.setValueAtTime(finalGain, this.ctx.currentTime);

    source.connect(gainNode);
    gainNode.connect(this.ctx.destination);

    source.start(0);
  }

  // ==========================================
  // HUMAN MARTIAL-ARTS VOCAL EXERTION SOUNDS
  // ==========================================

  public playVocal(category: 'light_punch' | 'heavy_punch' | 'kick' | 'spin_kick' | 'jump_kick' | 'finisher') {
    if (!this.soundFxEnabled) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    // Anti-overlap short cooldown (60ms)
    if (now - this.lastVocalTime < 0.06) {
      return;
    }
    this.lastVocalTime = now;

    const clips = VOCAL_MAP[category] || VOCAL_MAP.light_punch;
    const count = clips.length;
    let varIdx = Math.floor(Math.random() * count);
    const lastIdx = this.lastVocalIndexMap[category] ?? -1;

    // Avoid immediate repetition of exact same vocal clip
    if (count > 1 && varIdx === lastIdx) {
      varIdx = (varIdx + 1) % count;
    }
    this.lastVocalIndexMap[category] = varIdx;

    this.playClip(clips[varIdx], 0.85);
  }

  // ==========================================
  // PHYSICAL COMBAT IMPACT SOUNDS (ON HIT ONLY)
  // ==========================================

  public playHitImpact(target: 'enemy' | 'boss', attackType: string = 'JAB') {
    if (!this.soundFxEnabled) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    // Audio Throttling: If multiple impact sounds trigger within 35ms, throttle volume/playback
    if (now - this.lastImpactTime < 0.035) {
      this.recentImpactsInWindow++;
      if (this.recentImpactsInWindow > 2) {
        return; // Skip excess simultaneous impact sounds to prevent wall-of-sound clipping
      }
    } else {
      this.lastImpactTime = now;
      this.recentImpactsInWindow = 1;
    }

    if (target === 'boss') {
      this.playClip('impact_boss', 0.95);
      return;
    }

    switch (attackType) {
      case 'JAB':
      case 'light_punch':
        this.playClip('impact_jab', 0.8);
        break;

      case 'CROSS':
      case 'heavy_punch':
        this.playClip('impact_cross', 0.85);
        break;

      case 'KICK':
        this.playClip('impact_kick', 0.85);
        break;

      case 'SPIN_KICK':
        this.playClip('impact_kick', 0.9);
        break;

      case 'JUMP_KICK':
        this.playClip('impact_kick', 0.85);
        break;

      case 'FINISHER':
      default:
        this.playClip('impact_finisher', 0.95);
        break;
    }
  }

  // ==========================================
  // PLAYER ATTACK WRAPPERS
  // ==========================================

  public playLightPunch() {
    this.playVocal('light_punch');
  }

  public playHeavyPunch() {
    this.playVocal('heavy_punch');
  }

  public playSwordAttack() {
    this.playVocal('light_punch');
  }

  public playPunch(variant: 'light' | 'heavy' = 'light') {
    if (variant === 'heavy') {
      this.playHeavyPunch();
    } else {
      this.playLightPunch();
    }
  }

  public playKick() {
    this.playVocal('kick');
  }

  public playSpinKick() {
    this.playVocal('spin_kick');
  }

  public playJumpKick() {
    this.playVocal('jump_kick');
  }

  public playFinisher() {
    this.playVocal('finisher');
  }

  public playLand() {
    this.playCustomSFX('land');
  }

  public playHeal() {
    this.playCustomSFX('heal');
  }

  // ==========================================
  // PLAYER HURT & DEATH REACTION
  // ==========================================

  public playPlayerHurt() {
    if (!this.soundFxEnabled) return;
    const count = HURT_CLIPS.length;
    let varIdx = Math.floor(Math.random() * count);
    if (count > 1 && varIdx === this.lastHurtIndex) {
      varIdx = (varIdx + 1) % count;
    }
    this.lastHurtIndex = varIdx;

    this.playClip(HURT_CLIPS[varIdx], 0.9);
  }

  public playEnemyHit(attackType: string = 'JAB') {
    this.playHitImpact('enemy', attackType);
  }

  public playEnemyBlock() {
    if (!this.soundFxEnabled) return;
    this.playClip('impact_jab', 0.65);
  }

  public playEnemyDodge() {
    if (!this.soundFxEnabled) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.08);

    gain.gain.setValueAtTime(0.2 * this.sfxVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.08);
  }

  public playEnemyDeath() {
    if (!this.soundFxEnabled) return;
    this.playClip('impact_cross', 0.65);
  }

  // ==========================================
  // BOSS AUDIO EVENTS
  // ==========================================

  public playBossIntro() {
    if (!this.soundFxEnabled) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    // Resonant Boss Horn / Gong strike
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sawtooth';
    osc2.type = 'square';

    osc1.frequency.setValueAtTime(130.81, now); // C3
    osc1.frequency.exponentialRampToValueAtTime(65.41, now + 0.6); // C2

    osc2.frequency.setValueAtTime(196.0, now); // G3
    osc2.frequency.exponentialRampToValueAtTime(98.0, now + 0.6); // G2

    gain.gain.setValueAtTime(0.35 * this.sfxVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.6);
    osc2.stop(now + 0.6);
  }

  public playBossPhaseTransition() {
    if (!this.soundFxEnabled) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    // High energy explosive pitch riser
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(1200, now + 0.4);

    gain.gain.setValueAtTime(0.4 * this.sfxVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.4);

    // Follow with boss hit impact
    this.playClip('impact_boss', 0.95);
  }

  public playBossAttackSwing(_type: string = 'heavy_punch') {
    this.playClip('impact_boss', 0.65);
  }

  public playBossDefeat() {
    if (!this.soundFxEnabled) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    // Multi-hit crash explosion
    this.playClip('impact_finisher', 1.0);

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.8);

    gain.gain.setValueAtTime(0.5 * this.sfxVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.8);

    // Stop boss music and prepare victory
    this.stopMusicInternal(true);
  }

  // ==========================================
  // UI & MENU BUTTON SOUNDS
  // ==========================================

  public playButtonClick() {
    if (!this.soundFxEnabled) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(500, now);
    osc.frequency.exponentialRampToValueAtTime(850, now + 0.04);

    gain.gain.setValueAtTime(0.18 * this.sfxVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.04);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.04);
  }

  public playSelect() {
    this.playButtonClick();
  }

  public playBack() {
    if (!this.soundFxEnabled) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(650, now);
    osc.frequency.exponentialRampToValueAtTime(320, now + 0.05);

    gain.gain.setValueAtTime(0.16 * this.sfxVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.05);
  }

  public playJump() {
    if (!this.soundFxEnabled) return;
    this.initContext();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(150, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(450, this.ctx.currentTime + 0.15);

    gain.gain.setValueAtTime(0.18 * this.sfxVolume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.15);
  }

  public playCoinPickup() {
    if (!this.soundFxEnabled) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sine';
    osc2.type = 'sine';

    osc1.frequency.setValueAtTime(987.77, now);
    osc2.frequency.setValueAtTime(1318.51, now + 0.06);

    gain.gain.setValueAtTime(0.22 * this.sfxVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.ctx.destination);

    osc1.start(now);
    osc1.stop(now + 0.06);
    osc2.start(now + 0.06);
    osc2.stop(now + 0.18);
  }

  public playCustomSFX(
    type:
      | 'punch'
      | 'light_punch'
      | 'heavy_punch'
      | 'kick'
      | 'spin_kick'
      | 'jump_kick'
      | 'finisher'
      | 'environmental'
      | 'crate_break'
      | 'land'
      | 'hazard'
      | 'heal'
      | 'checkpoint'
  ) {
    if (!this.soundFxEnabled) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    switch (type) {
      case 'punch':
      case 'light_punch':
        this.playLightPunch();
        break;
      case 'heavy_punch':
        this.playHeavyPunch();
        break;
      case 'kick':
        this.playKick();
        break;
      case 'spin_kick':
        this.playSpinKick();
        break;
      case 'jump_kick':
        this.playJumpKick();
        break;
      case 'finisher':
        this.playFinisher();
        break;

      case 'environmental': {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(580, now);
        osc.frequency.exponentialRampToValueAtTime(290, now + 0.1);
        gain.gain.setValueAtTime(0.22 * this.sfxVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.1);
        break;
      }

      case 'crate_break': {
        this.playClip('impact_jab', 0.8);
        break;
      }

      case 'land': {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(110, now);
        osc.frequency.exponentialRampToValueAtTime(35, now + 0.06);
        gain.gain.setValueAtTime(0.18 * this.sfxVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.06);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.06);
        break;
      }

      case 'hazard': {
        this.playPlayerHurt();
        break;
      }

      case 'heal': {
        const notes = [659.25, 830.61, 987.77];
        notes.forEach((freq, idx) => {
          const noteTime = now + idx * 0.05;
          const osc = this.ctx!.createOscillator();
          const gain = this.ctx!.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, noteTime);
          gain.gain.setValueAtTime(0.2 * this.sfxVolume, noteTime);
          gain.gain.exponentialRampToValueAtTime(0.01, noteTime + 0.12);
          osc.connect(gain);
          gain.connect(this.ctx!.destination);
          osc.start(noteTime);
          osc.stop(noteTime + 0.12);
        });
        break;
      }

      case 'checkpoint': {
        this.playVictory();
        break;
      }
    }
  }

  // Reset single-trigger flags on level restart or screen change
  public resetTriggerFlags() {
    this.isGameOverSoundPlayed = false;
    this.isVictorySoundPlayed = false;
  }

  public playVictory() {
    if (!this.soundFxEnabled || this.isVictorySoundPlayed) return;
    this.isVictorySoundPlayed = true;

    this.initContext();
    if (!this.ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      const now = this.ctx!.currentTime + idx * 0.12;
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.28 * this.sfxVolume, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(now);
      osc.stop(now + 0.25);
    });
  }

  public playSecretDiscovered() {
    if (!this.soundFxEnabled) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const arpeggio = [440, 554.37, 659.25, 880, 1108.73];
    arpeggio.forEach((freq, idx) => {
      const t = now + idx * 0.08;
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.25 * this.sfxVolume, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(t);
      osc.stop(t + 0.28);
    });
  }

  public playGameOver() {
    if (!this.soundFxEnabled || this.isGameOverSoundPlayed) return;
    this.isGameOverSoundPlayed = true;

    this.initContext();
    if (!this.ctx) return;

    const notes = [400, 350, 300, 220];
    notes.forEach((freq, idx) => {
      const now = this.ctx!.currentTime + idx * 0.15;
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.28 * this.sfxVolume, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(now);
      osc.stop(now + 0.3);
    });
  }
}

export const audioEngine = new AudioEngine();

export const playCustomSFX = (
  type:
    | 'punch'
    | 'kick'
    | 'finisher'
    | 'jump_kick'
    | 'environmental'
    | 'crate_break'
    | 'land'
    | 'hazard'
    | 'heal'
    | 'checkpoint'
) => {
  audioEngine.playCustomSFX(type);
};
