/**
 * Offline Web Audio API Synthesizer for Blaze Adventure.
 * Generates energetic martial arts human vocalizations, physical impact hits,
 * and ambient game audio with zero external audio file dependencies.
 */

interface VocalSpec {
  startPitch: number;
  endPitch: number;
  duration: number;
  f1: number;
  f2: number;
  f3: number;
  noiseFreq: number;
  gain: number;
  f1End?: number;
  f2End?: number;
}

const VOCAL_SPECS: Record<string, VocalSpec[]> = {
  light_punch: [
    { startPitch: 230, endPitch: 160, duration: 0.08, f1: 780, f2: 1350, f3: 2600, noiseFreq: 2800, gain: 0.38 }, // Hah!
    { startPitch: 250, endPitch: 180, duration: 0.07, f1: 540, f2: 1100, f3: 2400, noiseFreq: 3200, gain: 0.38 }, // Hup!
    { startPitch: 220, endPitch: 150, duration: 0.075, f1: 680, f2: 1500, f3: 2700, noiseFreq: 3000, gain: 0.38 }, // Hut!
  ],
  heavy_punch: [
    { startPitch: 270, endPitch: 170, duration: 0.13, f1: 720, f1End: 840, f2: 2100, f2End: 1300, f3: 2800, noiseFreq: 3500, gain: 0.42 }, // Hyaa!
    { startPitch: 240, endPitch: 150, duration: 0.12, f1: 820, f2: 1400, f3: 2600, noiseFreq: 2600, gain: 0.42 }, // Hah!
    { startPitch: 280, endPitch: 180, duration: 0.13, f1: 700, f1End: 860, f2: 2300, f2End: 1250, f3: 2900, noiseFreq: 3800, gain: 0.42 }, // Kiah!
  ],
  kick: [
    { startPitch: 240, endPitch: 155, duration: 0.10, f1: 760, f2: 1380, f3: 2650, noiseFreq: 2900, gain: 0.40 }, // Hah!
    { startPitch: 260, endPitch: 165, duration: 0.09, f1: 580, f2: 1150, f3: 2450, noiseFreq: 2700, gain: 0.40 }, // Toh!
    { startPitch: 250, endPitch: 170, duration: 0.10, f1: 650, f2: 1900, f3: 2800, noiseFreq: 3300, gain: 0.40 }, // Ei!
  ],
  spin_kick: [
    { startPitch: 250, endPitch: 140, duration: 0.18, f1: 600, f1End: 820, f2: 1100, f2End: 1400, f3: 2500, noiseFreq: 2400, gain: 0.44 }, // Hwah!
    { startPitch: 270, endPitch: 160, duration: 0.19, f1: 780, f2: 1800, f2End: 1300, f3: 2800, noiseFreq: 3400, gain: 0.44 }, // Hyaah!
    { startPitch: 260, endPitch: 150, duration: 0.17, f1: 800, f2: 1600, f3: 2700, noiseFreq: 4000, gain: 0.44 }, // Ssha!
  ],
  jump_kick: [
    { startPitch: 260, endPitch: 190, duration: 0.09, f1: 520, f2: 1050, f3: 2400, noiseFreq: 3100, gain: 0.40 }, // Hup!
    { startPitch: 270, endPitch: 180, duration: 0.11, f1: 750, f2: 1850, f3: 2800, noiseFreq: 3500, gain: 0.40 }, // Yaa!
    { startPitch: 250, endPitch: 170, duration: 0.10, f1: 790, f2: 1360, f3: 2600, noiseFreq: 2800, gain: 0.40 }, // Hah!
  ],
  finisher: [
    { startPitch: 290, endPitch: 160, duration: 0.22, f1: 800, f1End: 600, f2: 1800, f2End: 1100, f3: 2900, noiseFreq: 3600, gain: 0.46 }, // HYAA-TOH!
    { startPitch: 310, endPitch: 170, duration: 0.24, f1: 720, f1End: 860, f2: 2200, f2End: 1300, f3: 3000, noiseFreq: 4000, gain: 0.46 }, // KII-YAH!
  ],
};

const HURT_SPECS: VocalSpec[] = [
  { startPitch: 170, endPitch: 110, duration: 0.14, f1: 500, f2: 950, f3: 2300, noiseFreq: 2000, gain: 0.45 }, // Ugh!
  { startPitch: 160, endPitch: 100, duration: 0.12, f1: 420, f2: 850, f3: 2200, noiseFreq: 1800, gain: 0.45 }, // Oof!
  { startPitch: 180, endPitch: 120, duration: 0.13, f1: 650, f2: 1200, f3: 2500, noiseFreq: 2200, gain: 0.45 }, // Ah!
];

class AudioEngine {
  private ctx: AudioContext | null = null;
  private soundFxEnabled: boolean = true;
  private musicEnabled: boolean = true;
  private bgmOscillator: OscillatorNode | null = null;
  private isBgmPlaying: boolean = false;

  private noiseBuffer: AudioBuffer | null = null;

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

  private getNoiseBuffer(): AudioBuffer | null {
    if (!this.ctx) return null;
    if (!this.noiseBuffer) {
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.2);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      this.noiseBuffer = buffer;
    }
    return this.noiseBuffer;
  }

  // ==========================================
  // HUMAN MARTIAL-ARTS VOCAL EXERTION SYNTHESIS
  // ==========================================

  public playVocal(category: 'light_punch' | 'heavy_punch' | 'kick' | 'spin_kick' | 'jump_kick' | 'finisher') {
    if (!this.soundFxEnabled) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    // Anti-overlap short cooldown (70ms) to ensure clarity during rapid combos
    if (now - this.lastVocalTime < 0.07) {
      return;
    }
    this.lastVocalTime = now;

    const specs = VOCAL_SPECS[category] || VOCAL_SPECS.light_punch;
    const count = specs.length;
    let varIdx = Math.floor(Math.random() * count);
    const lastIdx = this.lastVocalIndexMap[category] ?? -1;

    // Avoid immediate repetition of exact same vocal
    if (count > 1 && varIdx === lastIdx) {
      varIdx = (varIdx + 1) % count;
    }
    this.lastVocalIndexMap[category] = varIdx;

    this.synthesizeVocalShout(specs[varIdx], now);
  }

  private synthesizeVocalShout(spec: VocalSpec, now: number) {
    if (!this.ctx) return;

    // 1. Glottal Source (Sawtooth glottal wave with pitch sweep & human jitter)
    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';

    const jitter = (Math.random() * 8 - 4);
    const startP = spec.startPitch + jitter;
    const endP = spec.endPitch + jitter * 0.5;

    osc.frequency.setValueAtTime(startP, now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(50, endP), now + spec.duration);

    // 2. Vocal Tract Resonators (Parallel Formant Biquad Filters)
    const masterGain = this.ctx.createGain();
    masterGain.gain.setValueAtTime(0.001, now);
    masterGain.gain.linearRampToValueAtTime(spec.gain, now + 0.006);
    masterGain.gain.exponentialRampToValueAtTime(0.001, now + spec.duration);

    const f1 = this.ctx.createBiquadFilter();
    f1.type = 'bandpass';
    f1.Q.value = 4.2;
    f1.frequency.setValueAtTime(spec.f1, now);
    if (spec.f1End) {
      f1.frequency.exponentialRampToValueAtTime(spec.f1End, now + spec.duration);
    }

    const f2 = this.ctx.createBiquadFilter();
    f2.type = 'bandpass';
    f2.Q.value = 4.8;
    f2.frequency.setValueAtTime(spec.f2, now);
    if (spec.f2End) {
      f2.frequency.exponentialRampToValueAtTime(spec.f2End, now + spec.duration);
    }

    const f3 = this.ctx.createBiquadFilter();
    f3.type = 'bandpass';
    f3.Q.value = 5.5;
    f3.frequency.setValueAtTime(spec.f3, now);

    osc.connect(f1);
    osc.connect(f2);
    osc.connect(f3);

    f1.connect(masterGain);
    f2.connect(masterGain);
    f3.connect(masterGain);

    // 3. Consonant Onset ("H", "K", "T" breath force)
    const noiseBuffer = this.getNoiseBuffer();
    if (noiseBuffer) {
      const noise = this.ctx.createBufferSource();
      noise.buffer = noiseBuffer;

      const noiseFilter = this.ctx.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.setValueAtTime(spec.noiseFreq, now);
      noiseFilter.Q.value = 2.0;

      const noiseGain = this.ctx.createGain();
      const noiseDur = 0.022;
      noiseGain.gain.setValueAtTime(spec.gain * 0.45, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + noiseDur);

      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(this.ctx.destination);

      noise.start(now);
      noise.stop(now + noiseDur);
    }

    masterGain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + spec.duration);
  }

  // ==========================================
  // PHYSICAL COMBAT IMPACT SYNTHESIS (ON HIT ONLY)
  // ==========================================

  public playHitImpact(target: 'enemy' | 'boss', attackType: string = 'JAB') {
    if (!this.soundFxEnabled) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const noiseBuffer = this.getNoiseBuffer();
    const pitchVar = 0.94 + Math.random() * 0.12;

    if (target === 'boss') {
      // Heavy, deep, resonant Boss / Titan impact
      if (noiseBuffer) {
        const noise = this.ctx.createBufferSource();
        noise.buffer = noiseBuffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1400 * pitchVar, now);
        filter.Q.value = 1.2;

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        noise.start(now);
        noise.stop(now + 0.035);
      }

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(160 * pitchVar, now);
      osc.frequency.exponentialRampToValueAtTime(30, now + 0.1);

      gain.gain.setValueAtTime(0.55, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.1);
      return;
    }

    // Normal Enemy Physical Impacts
    switch (attackType) {
      case 'JAB':
      case 'light_punch': {
        // Crisp jab punch impact: high snap + body thud
        if (noiseBuffer) {
          const noise = this.ctx.createBufferSource();
          noise.buffer = noiseBuffer;
          const filter = this.ctx.createBiquadFilter();
          filter.type = 'bandpass';
          filter.frequency.setValueAtTime(2200 * pitchVar, now);
          filter.Q.value = 2.2;
          const gain = this.ctx.createGain();
          gain.gain.setValueAtTime(0.38, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.022);
          noise.connect(filter);
          filter.connect(gain);
          gain.connect(this.ctx.destination);
          noise.start(now);
          noise.stop(now + 0.022);
        }

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(190 * pitchVar, now);
        osc.frequency.exponentialRampToValueAtTime(45, now + 0.045);
        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.045);
        break;
      }

      case 'CROSS':
      case 'heavy_punch': {
        // Deep cross punch impact: heavy snap + body thud
        if (noiseBuffer) {
          const noise = this.ctx.createBufferSource();
          noise.buffer = noiseBuffer;
          const filter = this.ctx.createBiquadFilter();
          filter.type = 'bandpass';
          filter.frequency.setValueAtTime(1500 * pitchVar, now);
          filter.Q.value = 1.8;
          const gain = this.ctx.createGain();
          gain.gain.setValueAtTime(0.42, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
          noise.connect(filter);
          filter.connect(gain);
          gain.connect(this.ctx.destination);
          noise.start(now);
          noise.stop(now + 0.03);
        }

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(150 * pitchVar, now);
        osc.frequency.exponentialRampToValueAtTime(32, now + 0.065);
        gain.gain.setValueAtTime(0.42, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.065);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.065);
        break;
      }

      case 'KICK': {
        // Strong roundhouse kick impact: thwack + deep impact
        if (noiseBuffer) {
          const noise = this.ctx.createBufferSource();
          noise.buffer = noiseBuffer;
          const filter = this.ctx.createBiquadFilter();
          filter.type = 'bandpass';
          filter.frequency.setValueAtTime(1200 * pitchVar, now);
          filter.Q.value = 1.5;
          const gain = this.ctx.createGain();
          gain.gain.setValueAtTime(0.42, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.032);
          noise.connect(filter);
          filter.connect(gain);
          gain.connect(this.ctx.destination);
          noise.start(now);
          noise.stop(now + 0.032);
        }

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(130 * pitchVar, now);
        osc.frequency.exponentialRampToValueAtTime(28, now + 0.08);
        gain.gain.setValueAtTime(0.45, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.08);
        break;
      }

      case 'SPIN_KICK': {
        // Low sweeping kick impact: friction sweep + heavy thud
        if (noiseBuffer) {
          const noise = this.ctx.createBufferSource();
          noise.buffer = noiseBuffer;
          const filter = this.ctx.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(1800 * pitchVar, now);
          filter.frequency.exponentialRampToValueAtTime(280, now + 0.06);
          const gain = this.ctx.createGain();
          gain.gain.setValueAtTime(0.42, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
          noise.connect(filter);
          filter.connect(gain);
          gain.connect(this.ctx.destination);
          noise.start(now);
          noise.stop(now + 0.06);
        }

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(110 * pitchVar, now);
        osc.frequency.exponentialRampToValueAtTime(22, now + 0.09);
        gain.gain.setValueAtTime(0.45, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.09);
        break;
      }

      case 'JUMP_KICK': {
        // Flying side kick impact: snappy contact + thud
        if (noiseBuffer) {
          const noise = this.ctx.createBufferSource();
          noise.buffer = noiseBuffer;
          const filter = this.ctx.createBiquadFilter();
          filter.type = 'bandpass';
          filter.frequency.setValueAtTime(2400 * pitchVar, now);
          filter.Q.value = 2.0;
          const gain = this.ctx.createGain();
          gain.gain.setValueAtTime(0.4, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);
          noise.connect(filter);
          filter.connect(gain);
          gain.connect(this.ctx.destination);
          noise.start(now);
          noise.stop(now + 0.025);
        }

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(160 * pitchVar, now);
        osc.frequency.exponentialRampToValueAtTime(35, now + 0.07);
        gain.gain.setValueAtTime(0.42, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.07);
        break;
      }

      case 'FINISHER':
      default: {
        // Heavy combo finisher impact
        if (noiseBuffer) {
          const noise = this.ctx.createBufferSource();
          noise.buffer = noiseBuffer;
          const filter = this.ctx.createBiquadFilter();
          filter.type = 'bandpass';
          filter.frequency.setValueAtTime(1600 * pitchVar, now);
          filter.Q.value = 1.2;
          const gain = this.ctx.createGain();
          gain.gain.setValueAtTime(0.48, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);
          noise.connect(filter);
          filter.connect(gain);
          gain.connect(this.ctx.destination);
          noise.start(now);
          noise.stop(now + 0.045);
        }

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220 * pitchVar, now);
        osc.frequency.exponentialRampToValueAtTime(30, now + 0.095);
        gain.gain.setValueAtTime(0.48, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.095);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.095);
        break;
      }
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
  // PLAYER HURT REACTION (PAIN VOCAL WITH VARIATIONS)
  // ==========================================

  public playPlayerHurt() {
    if (!this.soundFxEnabled) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const count = HURT_SPECS.length;
    let varIdx = Math.floor(Math.random() * count);
    if (count > 1 && varIdx === this.lastHurtIndex) {
      varIdx = (varIdx + 1) % count;
    }
    this.lastHurtIndex = varIdx;

    const spec = HURT_SPECS[varIdx];

    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';

    const jitter = (Math.random() * 6 - 3);
    const startP = spec.startPitch + jitter;
    const endP = spec.endPitch + jitter * 0.5;

    osc.frequency.setValueAtTime(startP, now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(50, endP), now + spec.duration);

    const masterGain = this.ctx.createGain();
    masterGain.gain.setValueAtTime(0.001, now);
    masterGain.gain.linearRampToValueAtTime(spec.gain, now + 0.006);
    masterGain.gain.exponentialRampToValueAtTime(0.001, now + spec.duration);

    const f1 = this.ctx.createBiquadFilter();
    f1.type = 'bandpass';
    f1.Q.value = 3.5;
    f1.frequency.setValueAtTime(spec.f1, now);

    const f2 = this.ctx.createBiquadFilter();
    f2.type = 'bandpass';
    f2.Q.value = 4.0;
    f2.frequency.setValueAtTime(spec.f2, now);

    osc.connect(f1);
    osc.connect(f2);
    f1.connect(masterGain);
    f2.connect(masterGain);

    masterGain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + spec.duration);
  }

  public playEnemyHit(attackType: string = 'JAB') {
    this.playHitImpact('enemy', attackType);
  }

  // ==========================================
  // BOSS MONSTER SWING & SPECIALS
  // ==========================================

  public playBossAttackSwing(type: string = 'heavy_punch') {
    if (!this.soundFxEnabled) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const noiseBuffer = this.getNoiseBuffer();

    if (noiseBuffer) {
      const noise = this.ctx.createBufferSource();
      noise.buffer = noiseBuffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, now);
      filter.frequency.exponentialRampToValueAtTime(150, now + 0.12);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.45, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noise.start(now);
      noise.stop(now + 0.12);
    }

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.exponentialRampToValueAtTime(25, now + 0.14);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.14);
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
    this.initContext();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.25);

    gain.gain.setValueAtTime(0.35, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.25);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.25);
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
        const noiseBuffer = this.getNoiseBuffer();
        if (noiseBuffer) {
          const whiteNoise = this.ctx.createBufferSource();
          whiteNoise.buffer = noiseBuffer;
          const filter = this.ctx.createBiquadFilter();
          filter.type = 'bandpass';
          filter.frequency.setValueAtTime(800, now);
          filter.frequency.exponentialRampToValueAtTime(200, now + 0.1);
          filter.Q.value = 2;
          const gain = this.ctx.createGain();
          gain.gain.setValueAtTime(0.3, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
          whiteNoise.connect(filter);
          filter.connect(gain);
          gain.connect(this.ctx.destination);
          whiteNoise.start(now);
          whiteNoise.stop(now + 0.1);
        }
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
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(260, now);
        osc.frequency.linearRampToValueAtTime(110, now + 0.15);
        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.15);
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
    if (this.bgmOscillator) {
      try {
        this.bgmOscillator.stop();
      } catch {
        // ignore
      }
      this.bgmOscillator = null;
    }
  }
}

export const audioEngine = new AudioEngine();

export const playCustomSFX = (
  type: 'punch' | 'kick' | 'finisher' | 'jump_kick' | 'environmental' | 'crate_break' | 'land' | 'hazard' | 'heal' | 'checkpoint'
) => {
  audioEngine.playCustomSFX(type);
};
