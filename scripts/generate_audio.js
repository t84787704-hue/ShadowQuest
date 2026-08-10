import fs from 'fs';
import path from 'path';

// Helper to create a 16-bit PCM Mono WAV File Buffer
function createWavBuffer(samples, sampleRate = 44100) {
  const numSamples = samples.length;
  const buffer = Buffer.alloc(44 + numSamples * 2);

  // RIFF header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + numSamples * 2, 4);
  buffer.write('WAVE', 8);

  // FMT chunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // Chunk size
  buffer.writeUInt16LE(1, 20);  // Audio format (PCM)
  buffer.writeUInt16LE(1, 22);  // Num channels (Mono)
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28); // Byte rate
  buffer.writeUInt16LE(2, 32);  // Block align
  buffer.writeUInt16LE(16, 34); // Bits per sample

  // DATA chunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(numSamples * 2, 40);

  for (let i = 0; i < numSamples; i++) {
    // Clamp to [-1, 1]
    const s = Math.max(-1, Math.min(1, samples[i]));
    const val = s < 0 ? Math.floor(s * 32768) : Math.floor(s * 32767);
    buffer.writeInt16LE(val, 44 + i * 2);
  }

  return buffer;
}

// Rosenberg Glottal Flow Waveform
function glottalPulse(phase, openRatio = 0.6) {
  phase = phase - Math.floor(phase); // Wrap to [0, 1)
  if (phase < openRatio) {
    const t = phase / openRatio;
    return 3 * t * t - 2 * t * t * t;
  } else {
    const t = (phase - openRatio) / (1 - openRatio);
    return Math.pow(1 - t, 2);
  }
}

// Biquad Formant Filter Class for Node synthesis
class BiquadFilter {
  constructor(type, freq, q, sampleRate = 44100) {
    this.sampleRate = sampleRate;
    this.x1 = 0; this.x2 = 0;
    this.y1 = 0; this.y2 = 0;
    this.update(type, freq, q);
  }

  update(type, freq, q) {
    const w0 = 2 * Math.PI * freq / this.sampleRate;
    const alpha = Math.sin(w0) / (2 * q);
    const cosw0 = Math.cos(w0);

    if (type === 'bandpass') {
      this.b0 = alpha;
      this.b1 = 0;
      this.b2 = -alpha;
      this.a0 = 1 + alpha;
      this.a1 = -2 * cosw0;
      this.a2 = 1 - alpha;
    } else if (type === 'lowpass') {
      this.b0 = (1 - cosw0) / 2;
      this.b1 = 1 - cosw0;
      this.b2 = (1 - cosw0) / 2;
      this.a0 = 1 + alpha;
      this.a1 = -2 * cosw0;
      this.a2 = 1 - alpha;
    } else if (type === 'highpass') {
      this.b0 = (1 + cosw0) / 2;
      this.b1 = -(1 + cosw0);
      this.b2 = (1 + cosw0) / 2;
      this.a0 = 1 + alpha;
      this.a1 = -2 * cosw0;
      this.a2 = 1 - alpha;
    }
  }

  process(sample) {
    const y = (this.b0 / this.a0) * sample +
              (this.b1 / this.a0) * this.x1 +
              (this.b2 / this.a0) * this.x2 -
              (this.a1 / this.a0) * this.y1 -
              (this.a2 / this.a0) * this.y2;
    this.x2 = this.x1;
    this.x1 = sample;
    this.y2 = this.y1;
    this.y1 = y;
    return y;
  }
}

// Generate Human Vocal Shout ("Hah!", "Hyaa!", "Hup!", "Toh!", etc.)
function generateHumanVocal({
  duration = 0.12,
  startPitch = 340,
  endPitch = 220,
  f1 = 800, f1End = 800,
  f2 = 1300, f2End = 1300,
  f3 = 2600,
  consonantType = 'H', // 'H', 'K', 'T'
  stopType = 'NONE',   // 'NONE', 'P', 'T'
  sampleRate = 44100
}) {
  const numSamples = Math.floor(sampleRate * duration);
  const samples = new Float32Array(numSamples);

  const filter1 = new BiquadFilter('bandpass', f1, 4.5, sampleRate);
  const filter2 = new BiquadFilter('bandpass', f2, 5.5, sampleRate);
  const filter3 = new BiquadFilter('bandpass', f3, 6.5, sampleRate);
  const breathFilter = new BiquadFilter('bandpass', 3200, 2.0, sampleRate);

  let phase = 0;

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const progress = t / duration;

    // Pitch contour with slight 12Hz vocal jitter
    const jitter = Math.sin(t * 2 * Math.PI * 12) * 5;
    const currentPitch = startPitch * Math.pow(endPitch / startPitch, progress) + jitter;

    // Formant frequency evolution
    const currentF1 = f1 + (f1End - f1) * progress;
    const currentF2 = f2 + (f2End - f2) * progress;
    filter1.update('bandpass', currentF1, 4.5);
    filter2.update('bandpass', currentF2, 5.5);

    // Glottal source wave
    phase += currentPitch / sampleRate;
    const glottal = glottalPulse(phase, 0.55) - 0.5;

    // Vocal tract formants superposition
    const v1 = filter1.process(glottal) * 1.3;
    const v2 = filter2.process(glottal) * 1.0;
    const v3 = filter3.process(glottal) * 0.6;
    let voiced = (v1 + v2 + v3);

    // Consonant Onset ('H' aspiration noise, 'K' or 'T' burst)
    let noise = Math.random() * 2 - 1;
    let breath = breathFilter.process(noise);
    let onsetEnv = 0;

    if (consonantType === 'H') {
      if (t < 0.03) {
        onsetEnv = Math.sin((t / 0.03) * (Math.PI / 2));
        voiced *= Math.pow(t / 0.03, 1.2);
      } else {
        onsetEnv = Math.exp(-(t - 0.03) * 45);
      }
    } else if (consonantType === 'K' || consonantType === 'T') {
      if (t < 0.015) {
        onsetEnv = 1.8;
        voiced *= 0.1;
      } else {
        onsetEnv = Math.exp(-(t - 0.015) * 60);
      }
    }

    let total = voiced + breath * onsetEnv * 0.5;

    // Amplitude Envelope
    let ampEnv = 1.0;
    if (t < 0.01) {
      ampEnv = t / 0.01;
    } else {
      ampEnv = Math.pow(1 - (t - 0.01) / (duration - 0.01), 1.2);
    }

    if (stopType !== 'NONE' && progress > 0.75) {
      const stopProgress = (progress - 0.75) / 0.25;
      ampEnv *= Math.exp(-stopProgress * 10);
    }

    samples[i] = total * ampEnv * 0.55;
  }

  return samples;
}

// Generate Physical Impact Sounds
function generatePhysicalImpact({
  duration = 0.08,
  snapFreq = 2200,
  thudStartFreq = 180,
  thudEndFreq = 40,
  snapGain = 0.7,
  thudGain = 0.8,
  sampleRate = 44100
}) {
  const numSamples = Math.floor(sampleRate * duration);
  const samples = new Float32Array(numSamples);

  const snapFilter = new BiquadFilter('bandpass', snapFreq, 1.8, sampleRate);
  const bodyFilter = new BiquadFilter('lowpass', 350, 1.2, sampleRate);

  let phase = 0;

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const progress = t / duration;

    // Crisp high-frequency impact snap
    const rawNoise = Math.random() * 2 - 1;
    const snapSignal = snapFilter.process(rawNoise) * Math.exp(-t * 130) * snapGain;

    // Sub/body impact thud
    const currentThudFreq = thudStartFreq * Math.pow(thudEndFreq / thudStartFreq, progress);
    phase += currentThudFreq / sampleRate;
    const rawThud = Math.sin(phase * 2 * Math.PI) + 0.3 * Math.sin(phase * 4 * Math.PI);
    const thudSignal = bodyFilter.process(rawThud) * Math.exp(-t * 50) * thudGain;

    samples[i] = (snapSignal + thudSignal) * 0.65;
  }

  return samples;
}

const VOCALS = {
  vocal_light_1: generateHumanVocal({ duration: 0.10, startPitch: 340, endPitch: 240, f1: 820, f2: 1350, consonantType: 'H' }),
  vocal_light_2: generateHumanVocal({ duration: 0.08, startPitch: 360, endPitch: 260, f1: 450, f2: 1000, consonantType: 'H', stopType: 'P' }),
  vocal_light_3: generateHumanVocal({ duration: 0.08, startPitch: 350, endPitch: 250, f1: 650, f2: 1400, consonantType: 'H', stopType: 'T' }),

  vocal_heavy_1: generateHumanVocal({ duration: 0.16, startPitch: 380, endPitch: 220, f1: 400, f1End: 850, f2: 2100, f2End: 1250, consonantType: 'H' }),
  vocal_heavy_2: generateHumanVocal({ duration: 0.15, startPitch: 390, endPitch: 230, f1: 700, f1End: 860, f2: 2200, f2End: 1280, consonantType: 'K' }),
  vocal_heavy_3: generateHumanVocal({ duration: 0.14, startPitch: 360, endPitch: 220, f1: 850, f2: 1300, consonantType: 'H' }),

  vocal_kick_1: generateHumanVocal({ duration: 0.11, startPitch: 350, endPitch: 230, f1: 800, f2: 1320, consonantType: 'H' }),
  vocal_kick_2: generateHumanVocal({ duration: 0.10, startPitch: 360, endPitch: 240, f1: 520, f2: 1050, consonantType: 'T' }),
  vocal_kick_3: generateHumanVocal({ duration: 0.10, startPitch: 370, endPitch: 250, f1: 400, f2: 2100, consonantType: 'H' }),

  vocal_spin_1: generateHumanVocal({ duration: 0.20, startPitch: 350, endPitch: 200, f1: 500, f1End: 820, f2: 950, f2End: 1350, consonantType: 'H' }),
  vocal_spin_2: generateHumanVocal({ duration: 0.21, startPitch: 380, endPitch: 210, f1: 420, f1End: 860, f2: 2150, f2End: 1200, consonantType: 'H' }),

  vocal_jump_1: generateHumanVocal({ duration: 0.09, startPitch: 370, endPitch: 270, f1: 450, f2: 1050, consonantType: 'H', stopType: 'P' }),
  vocal_jump_2: generateHumanVocal({ duration: 0.12, startPitch: 390, endPitch: 260, f1: 780, f2: 1800, consonantType: 'H' }),

  vocal_finisher_1: generateHumanVocal({ duration: 0.26, startPitch: 420, endPitch: 200, f1: 450, f1End: 850, f2: 2100, f2End: 1300, consonantType: 'H' }),
  vocal_finisher_2: generateHumanVocal({ duration: 0.28, startPitch: 430, endPitch: 210, f1: 350, f1End: 860, f2: 2300, f2End: 1250, consonantType: 'K' }),

  vocal_hurt_1: generateHumanVocal({ duration: 0.14, startPitch: 260, endPitch: 160, f1: 480, f2: 920, consonantType: 'H' }),
  vocal_hurt_2: generateHumanVocal({ duration: 0.13, startPitch: 250, endPitch: 150, f1: 400, f2: 800, consonantType: 'H' }),
  vocal_hurt_3: generateHumanVocal({ duration: 0.13, startPitch: 270, endPitch: 170, f1: 750, f2: 1250, consonantType: 'H' }),

  impact_jab: generatePhysicalImpact({ duration: 0.05, snapFreq: 2400, thudStartFreq: 190, thudEndFreq: 45, snapGain: 0.75, thudGain: 0.7 }),
  impact_cross: generatePhysicalImpact({ duration: 0.07, snapFreq: 1600, thudStartFreq: 150, thudEndFreq: 35, snapGain: 0.8, thudGain: 0.85 }),
  impact_kick: generatePhysicalImpact({ duration: 0.08, snapFreq: 1200, thudStartFreq: 130, thudEndFreq: 30, snapGain: 0.8, thudGain: 0.9 }),
  impact_finisher: generatePhysicalImpact({ duration: 0.10, snapFreq: 1800, thudStartFreq: 220, thudEndFreq: 25, snapGain: 0.85, thudGain: 1.0 }),
  impact_boss: generatePhysicalImpact({ duration: 0.12, snapFreq: 1000, thudStartFreq: 120, thudEndFreq: 20, snapGain: 0.9, thudGain: 1.1 })
};

// Ensure directories exist
const publicAudioDir = path.resolve('public/audio');
if (!fs.existsSync(publicAudioDir)) {
  fs.mkdirSync(publicAudioDir, { recursive: true });
}

const dataUris = {};

for (const [name, samples] of Object.entries(VOCALS)) {
  const wavBuf = createWavBuffer(samples);
  const filePath = path.join(publicAudioDir, `${name}.wav`);
  fs.writeFileSync(filePath, wavBuf);

  const b64 = wavBuf.toString('base64');
  dataUris[name] = `data:audio/wav;base64,${b64}`;
}

// Also write a TypeScript module with embedded Base64 DataURIs
const tsContent = `/**
 * Pre-generated, high-fidelity PCM audio DataURIs for human vocal shouting & impacts.
 * Zero network dependencies & instant decoding in Web Audio API.
 */

export const VOCAL_DATA_URIS: Record<string, string> = ${JSON.stringify(dataUris, null, 2)};
`;

fs.writeFileSync(path.resolve('src/game/audio/vocalClips.ts'), tsContent);

console.log("Successfully generated all audio files & DataURIs in public/audio and src/game/audio/vocalClips.ts!");
