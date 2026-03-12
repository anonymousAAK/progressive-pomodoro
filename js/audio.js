import { state } from './state.js';

const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;

export function ensureAudioCtx() {
  if (!audioCtx) audioCtx = new AudioCtx();
  if (audioCtx.state === 'suspended') audioCtx.resume();
}

// --- One-shot sound effects ---

export function playSound(type) {
  if (!state.soundEnabled) return;
  ensureAudioCtx();

  const osc  = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);

  const now = audioCtx.currentTime;

  switch (type) {
    case 'work-end':
      osc.frequency.setValueAtTime(523.25, now);        // C5
      osc.frequency.setValueAtTime(659.25, now + 0.15); // E5
      osc.frequency.setValueAtTime(783.99, now + 0.30); // G5
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
      osc.start(now); osc.stop(now + 0.6);
      break;

    case 'break-end':
      osc.frequency.setValueAtTime(783.99, now);
      osc.frequency.setValueAtTime(659.25, now + 0.12);
      osc.frequency.setValueAtTime(523.25, now + 0.24);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
      osc.start(now); osc.stop(now + 0.5);
      break;

    case 'halftime':
      // Two soft high beeps at half-time
      [now, now + 0.25].forEach(t => {
        const o = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        o.frequency.value = 880;
        g.gain.setValueAtTime(0.12, t);
        g.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
        o.connect(g); g.connect(audioCtx.destination);
        o.start(t); o.stop(t + 0.15);
      });
      return; // skip the default osc.start below

    case 'click':
      osc.frequency.setValueAtTime(800, now);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
      osc.start(now); osc.stop(now + 0.05);
      break;

    default:
      return;
  }
}

// --- Ambient sound engine ---

export function startAmbient(type) {
  stopAmbient();
  state.currentAmbient = type;
  if (type === 'none') return;

  ensureAudioCtx();
  state.ambientGain = audioCtx.createGain();
  state.ambientGain.connect(audioCtx.destination);

  if (type === 'whitenoise' || type === 'rain') {
    const bufSize = audioCtx.sampleRate * 2;
    const buf = audioCtx.createBuffer(1, bufSize, audioCtx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;

    const src = audioCtx.createBufferSource();
    src.buffer = buf;
    src.loop = true;

    if (type === 'rain') {
      const filter = audioCtx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 600;
      filter.Q.value = 0.4;
      src.connect(filter);
      filter.connect(state.ambientGain);
      state.ambientGain.gain.value = 0.28;
    } else {
      src.connect(state.ambientGain);
      state.ambientGain.gain.value = 0.15;
    }

    src.start();
    state.ambientSource = src;

  } else if (type === 'lofi') {
    state.ambientGain.gain.value = 1; // individual notes control volume
    _scheduleLofiChord();
  }
}

export function stopAmbient() {
  if (state.ambientSource) {
    try { state.ambientSource.stop(); } catch (_) {}
    state.ambientSource = null;
  }
  if (state.ambientGain) {
    try { state.ambientGain.disconnect(); } catch (_) {}
    state.ambientGain = null;
  }
  if (state.lofiTimeout) {
    clearTimeout(state.lofiTimeout);
    state.lofiTimeout = null;
  }
}

function _scheduleLofiChord() {
  if (state.currentAmbient !== 'lofi') return;
  ensureAudioCtx();

  const chords = [
    [261.63, 329.63, 392.00], // C maj
    [293.66, 369.99, 440.00], // D min
    [329.63, 415.30, 493.88], // E min
    [349.23, 440.00, 523.25], // F maj
  ];
  const chord = chords[Math.floor(Math.random() * chords.length)];
  const now = audioCtx.currentTime;

  chord.forEach(freq => {
    const osc = audioCtx.createOscillator();
    const g   = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(0.025, now + 0.5);
    g.gain.linearRampToValueAtTime(0, now + 3.5);
    osc.connect(g);
    g.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 4);
  });

  state.lofiTimeout = setTimeout(_scheduleLofiChord, 4500);
}
