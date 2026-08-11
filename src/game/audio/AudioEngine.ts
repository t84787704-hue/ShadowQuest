/**
 * Real Human Martial Arts Audio Engine for Blaze Adventure.
 * Decodes pre-generated PCM WAV vocalizations ("Hah!", "Hyaa!", "Toh!", "Ugh!")
 * and physical impact hits ("SNAP", "THUMP", "THWACK") with zero synthetic "dub dub" oscillator artifacts.
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

class AudioEngine {
  private ctx: AudioContext | null = null;
  private soundFxEnabled: boolean = true;
  private musicEnabled: boolean = true;
  private isBgmPlaying: boolean = false;

  private decodedBuffers: Map<string, AudioBuffer> = new Map();
  private isPreloading: boolean = false;

  // Anti-Repetition & Cooldown Tracking
  private lastVocalTime: number = 0;
  private lastVocalIndexMap: Record<string, number> = {};
  private lastHurtIndex: number = -1;

  constructor() {
    // AudioContext will be initialized on first user gesture
  }

  private initContext() {
    if (!this.ctx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
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

  public setSoundFxEnabled(enabled: boolean) {
    this.soundFxEnabled = enabled;
  }

  public setMusicEnabled(enabled: boolean) {
    this.musicEnabled = enabled;
    if (!enabled && this.isBgmPlaying) {
      this.stopMusic();
    } else if (enabled && !this.isBgmPlaying) {
      this.playMusic();
    }
  }

  public isSoundEnabled(): boolean {
    return this.soundFxEnabled;
  }

  public isMusicEnabled(): boolean {
    return this.musicEnabled;
  }

  private playClip(key: string, gainValue: number = 0.8) {
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
    gainNode.gain.setValueAtTime(gainValue, this.ctx.currentTime);

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
  // PLAYER HURT REACTION (PAIN VOCAL)
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

  // ==========================================
  // BOSS MONSTER SWING & SPECIALS
  // ==========================================

  public playBossAttackSwing(_type: string = 'heavy_punch') {
    this.playClip('impact_boss', 0.6);
  }

  // ==========================================
  // OTHER GAMEPLAY & UI SOUNDS
  // ==========================================

  public playButtonClick() {
    if (!this.soundFxEnabled) return;
    this.initContext();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, this.ctx.currentTime + 0.05);

    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.05);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.05);
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

    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.15);
  }

  public playEnemyDeath() {
    if (!this.soundFxEnabled) return;
    this.playClip('impact_cross', 0.7);
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

    gain.gain.setValueAtTime(0.25, now);
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
        gain.gain.setValueAtTime(0.25, now);
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
        gain.gain.setValueAtTime(0.2, now);
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
          gain.gain.setValueAtTime(0.22, noteTime);
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

  public playVictory() {
    if (!this.soundFxEnabled) return;
    this.initContext();
    if (!this.ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      const now = this.ctx!.currentTime + idx * 0.12;
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.3, now);
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

      gain.gain.setValueAtTime(0.28, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(t);
      osc.stop(t + 0.28);
    });
  }

  public playGameOver() {
    if (!this.soundFxEnabled) return;
    this.initContext();
    if (!this.ctx) return;

    const notes = [400, 350, 300, 220];
    notes.forEach((freq, idx) => {
      const now = this.ctx!.currentTime + idx * 0.15;
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(now);
      osc.stop(now + 0.3);
    });
  }

  public playMusic() {
    if (!this.musicEnabled || this.isBgmPlaying) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      this.isBgmPlaying = true;
    } catch {
      this.isBgmPlaying = false;
    }
  }

  public stopMusic() {
    this.isBgmPlaying = false;
  }
}

export const audioEngine = new AudioEngine();

export const playCustomSFX = (
  type: 'punch' | 'kick' | 'finisher' | 'jump_kick' | 'environmental' | 'crate_break' | 'land' | 'hazard' | 'heal' | 'checkpoint'
) => {
  audioEngine.playCustomSFX(type);
};
