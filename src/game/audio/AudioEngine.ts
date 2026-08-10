/**
 * Offline Web Audio API Synthesizer for Blaze Adventure.
 * Generates instant sound effects and ambient audio without external audio file dependencies.
 */
class AudioEngine {
  private ctx: AudioContext | null = null;
  private soundFxEnabled: boolean = true;
  private musicEnabled: boolean = true;
  private bgmOscillator: OscillatorNode | null = null;
  private isBgmPlaying: boolean = false;

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

  private noiseBuffer: AudioBuffer | null = null;

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

  public playSwordAttack() {
    this.playLightPunch();
  }

  public playLightPunch() {
    this.playCustomSFX('light_punch');
  }

  public playHeavyPunch() {
    this.playCustomSFX('heavy_punch');
  }

  public playPunch(variant: 'light' | 'heavy' = 'light') {
    if (variant === 'heavy') {
      this.playHeavyPunch();
    } else {
      this.playLightPunch();
    }
  }

  public playKick() {
    this.playCustomSFX('kick');
  }

  public playSpinKick() {
    this.playCustomSFX('spin_kick');
  }

  public playJumpKick() {
    this.playCustomSFX('jump_kick');
  }

  public playFinisher() {
    this.playCustomSFX('finisher');
  }

  public playEnvironmental() {
    this.playCustomSFX('environmental');
  }

  public playCrateBreak() {
    this.playCustomSFX('crate_break');
  }

  public playLand() {
    this.playCustomSFX('land');
  }

  public playHazard() {
    this.playCustomSFX('hazard');
  }

  public playHeal() {
    this.playCustomSFX('heal');
  }

  public playCheckpoint() {
    this.playCustomSFX('checkpoint');
  }

  /**
   * Unified Custom SFX Player optimized for Android & Mobile Web.
   * Uses zero-bandwidth Web Audio API synthesis for zero latency and low CPU overhead.
   */
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
    const noiseBuffer = this.getNoiseBuffer();

    switch (type) {
      case 'punch':
      case 'light_punch': {
        // Crisp, short martial jab snap + body thump
        const pitchVar = 0.93 + Math.random() * 0.14; // Slight variation per hit

        // 1. Contact Snap (filtered noise)
        if (noiseBuffer) {
          const noise = this.ctx.createBufferSource();
          noise.buffer = noiseBuffer;

          const filter = this.ctx.createBiquadFilter();
          filter.type = 'bandpass';
          filter.frequency.setValueAtTime(1800 * pitchVar, now);
          filter.Q.value = 1.8;

          const gain = this.ctx.createGain();
          gain.gain.setValueAtTime(0.35, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);

          noise.connect(filter);
          filter.connect(gain);
          gain.connect(this.ctx.destination);

          noise.start(now);
          noise.stop(now + 0.025);
        }

        // 2. Short Body Thump (sub triangle)
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(210 * pitchVar, now);
        osc.frequency.exponentialRampToValueAtTime(45, now + 0.045);

        gain.gain.setValueAtTime(0.32, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.045);
        break;
      }

      case 'heavy_punch': {
        // Deep, heavy cross punch impact
        const pitchVar = 0.92 + Math.random() * 0.16;

        if (noiseBuffer) {
          const noise = this.ctx.createBufferSource();
          noise.buffer = noiseBuffer;

          const filter = this.ctx.createBiquadFilter();
          filter.type = 'bandpass';
          filter.frequency.setValueAtTime(1200 * pitchVar, now);
          filter.Q.value = 1.5;

          const gain = this.ctx.createGain();
          gain.gain.setValueAtTime(0.4, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

          noise.connect(filter);
          filter.connect(gain);
          gain.connect(this.ctx.destination);

          noise.start(now);
          noise.stop(now + 0.035);
        }

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(150 * pitchVar, now);
        osc.frequency.exponentialRampToValueAtTime(32, now + 0.075);

        gain.gain.setValueAtTime(0.45, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.075);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.075);
        break;
      }

      case 'kick': {
        // Strong roundhouse kick impact
        const pitchVar = 0.90 + Math.random() * 0.18;

        if (noiseBuffer) {
          const noise = this.ctx.createBufferSource();
          noise.buffer = noiseBuffer;

          const filter = this.ctx.createBiquadFilter();
          filter.type = 'bandpass';
          filter.frequency.setValueAtTime(900 * pitchVar, now);
          filter.Q.value = 1.2;

          const gain = this.ctx.createGain();
          gain.gain.setValueAtTime(0.38, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

          noise.connect(filter);
          filter.connect(gain);
          gain.connect(this.ctx.destination);

          noise.start(now);
          noise.stop(now + 0.04);
        }

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(130 * pitchVar, now);
        osc.frequency.exponentialRampToValueAtTime(25, now + 0.09);

        gain.gain.setValueAtTime(0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.09);
        break;
      }

      case 'spin_kick': {
        // Sweeping low kick wind + friction impact
        const pitchVar = 0.92 + Math.random() * 0.15;

        if (noiseBuffer) {
          const noise = this.ctx.createBufferSource();
          noise.buffer = noiseBuffer;

          const filter = this.ctx.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(2400 * pitchVar, now);
          filter.frequency.exponentialRampToValueAtTime(300, now + 0.08);

          const gain = this.ctx.createGain();
          gain.gain.setValueAtTime(0.42, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

          noise.connect(filter);
          filter.connect(gain);
          gain.connect(this.ctx.destination);

          noise.start(now);
          noise.stop(now + 0.08);
        }

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(110 * pitchVar, now);
        osc.frequency.exponentialRampToValueAtTime(20, now + 0.11);

        gain.gain.setValueAtTime(0.45, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.11);
        break;
      }

      case 'jump_kick': {
        // Aerial flying kick swoop + snappy contact
        const pitchVar = 0.93 + Math.random() * 0.14;

        if (noiseBuffer) {
          const noise = this.ctx.createBufferSource();
          noise.buffer = noiseBuffer;

          const filter = this.ctx.createBiquadFilter();
          filter.type = 'bandpass';
          filter.frequency.setValueAtTime(2800 * pitchVar, now);
          filter.frequency.exponentialRampToValueAtTime(700, now + 0.06);

          const gain = this.ctx.createGain();
          gain.gain.setValueAtTime(0.38, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

          noise.connect(filter);
          filter.connect(gain);
          gain.connect(this.ctx.destination);

          noise.start(now);
          noise.stop(now + 0.06);
        }

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(220 * pitchVar, now);
        osc.frequency.exponentialRampToValueAtTime(38, now + 0.085);

        gain.gain.setValueAtTime(0.45, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.085);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.085);
        break;
      }

      case 'finisher': {
        // Powerful combo finisher explosion impact
        const pitchVar = 0.94 + Math.random() * 0.12;

        if (noiseBuffer) {
          const noise = this.ctx.createBufferSource();
          noise.buffer = noiseBuffer;

          const filter = this.ctx.createBiquadFilter();
          filter.type = 'bandpass';
          filter.frequency.setValueAtTime(1500 * pitchVar, now);
          filter.Q.value = 1.0;

          const gain = this.ctx.createGain();
          gain.gain.setValueAtTime(0.5, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

          noise.connect(filter);
          filter.connect(gain);
          gain.connect(this.ctx.destination);

          noise.start(now);
          noise.stop(now + 0.06);
        }

        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc1.type = 'sawtooth';
        osc2.type = 'sine';

        osc1.frequency.setValueAtTime(280 * pitchVar, now);
        osc1.frequency.exponentialRampToValueAtTime(35, now + 0.13);

        osc2.frequency.setValueAtTime(140 * pitchVar, now);
        osc2.frequency.exponentialRampToValueAtTime(22, now + 0.13);

        gain.gain.setValueAtTime(0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(this.ctx.destination);

        osc1.start(now);
        osc1.stop(now + 0.13);
        osc2.start(now);
        osc2.stop(now + 0.13);
        break;
      }

      case 'environmental': {
        // Environmental interaction (levers, doors, pressure plates, platforms)
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
        // Pot / crate / obstacle crumbling crunch
        const bufferSize = Math.floor(this.ctx.sampleRate * 0.1);
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const output = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          output[i] = Math.random() * 2 - 1;
        }

        const whiteNoise = this.ctx.createBufferSource();
        whiteNoise.buffer = buffer;

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
        break;
      }

      case 'land': {
        // Landing on floor thud
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
        // Spike / trap hazard hit
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
        // Health potion pickup
        const notes = [659.25, 830.61, 987.77]; // E5, G#5, B5
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
        // Altar / Flag checkpoint activate
        this.playVictory();
        break;
      }
    }
  }

  public playEnemyHit() {
    if (!this.soundFxEnabled) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const pitchVar = 0.92 + Math.random() * 0.16;
    const noiseBuffer = this.getNoiseBuffer();

    // High contact snap (flesh / wood contact)
    if (noiseBuffer) {
      const noise = this.ctx.createBufferSource();
      noise.buffer = noiseBuffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(2600 * pitchVar, now);
      filter.Q.value = 2.5;

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.42, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noise.start(now);
      noise.stop(now + 0.02);
    }

    // Body thud
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(250 * pitchVar, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.065);

    gain.gain.setValueAtTime(0.38, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.065);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.065);
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

  public playPlayerHurt() {
    if (!this.soundFxEnabled) return;
    this.initContext();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(300, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(120, this.ctx.currentTime + 0.2);

    gain.gain.setValueAtTime(0.4, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.2);
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

    osc1.frequency.setValueAtTime(987.77, now); // B5
    osc2.frequency.setValueAtTime(1318.51, now + 0.06); // E6

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

  public playVictory() {
    if (!this.soundFxEnabled) return;
    this.initContext();
    if (!this.ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
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
    // Optional gentle ambient background synth note
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
