// Tiny synthesized UI sounds: no audio files, just a few milliseconds of noise or oscillator.
// They only ever play in answer to a click or key press, and stay off once muted.
const KEY = 'sound';
let ctx: AudioContext | null = null;
let noise: AudioBuffer | null = null;

export const soundOn = () => {
  try {
    return localStorage.getItem(KEY) !== 'off';
  } catch {
    return true;
  }
};

export function setSound(on: boolean) {
  try {
    localStorage.setItem(KEY, on ? 'on' : 'off');
  } catch {}
  document.dispatchEvent(new CustomEvent('sound', { detail: on }));
}

function audio() {
  if (!soundOn()) return null;
  try {
    ctx ??= new AudioContext();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

// A short pitched note with a fast attack and an exponential tail.
function tone(freq: number, ms: number, { type = 'sine', vol = 0.15, to, at = 0 }: { type?: OscillatorType; vol?: number; to?: number; at?: number } = {}) {
  const a = audio();
  if (!a) return;
  const t = a.currentTime + at / 1000;
  const osc = a.createOscillator();
  const gain = a.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (to) osc.frequency.exponentialRampToValueAtTime(to, t + ms / 1000);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(vol, t + 0.004);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + ms / 1000);
  osc.connect(gain).connect(a.destination);
  osc.start(t);
  osc.stop(t + ms / 1000 + 0.02);
}

// A burst of filtered noise: the snap of a key or a switch.
function click(freq: number, vol: number, ms = 28) {
  const a = audio();
  if (!a) return;
  if (!noise) {
    noise = a.createBuffer(1, Math.ceil(a.sampleRate * 0.05), a.sampleRate);
    const d = noise.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  const t = a.currentTime;
  const src = a.createBufferSource();
  const band = a.createBiquadFilter();
  const gain = a.createGain();
  src.buffer = noise;
  band.type = 'bandpass';
  band.frequency.value = freq;
  band.Q.value = 1.2;
  gain.gain.setValueAtTime(vol, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + ms / 1000);
  src.connect(band).connect(gain).connect(a.destination);
  src.start(t);
  src.stop(t + ms / 1000 + 0.01);
}

export const sfx = {
  // A key click; `step` raises the pitch for a run of clicks.
  tick: (step = 0) => {
    click(2400 + step * 350, 0.9);
    tone(900 + step * 140, 70, { type: 'triangle', vol: 0.12 });
  },
  // Two rising notes for something opening.
  open: () => {
    tone(660, 130, { vol: 0.16 });
    tone(990, 200, { vol: 0.16, at: 90 });
  },
  close: () => tone(560, 140, { vol: 0.14, to: 300 }),
  // A line of text arriving: a soft keyboard tap.
  line: () => click(3200, 0.45, 20),
  // Three bright notes for finding an easter egg.
  unlock: () => [784, 988, 1319].forEach((f, i) => tone(f, 160, { vol: 0.13, at: i * 85 })),
  // Pac-Man's bite.
  chomp: () => tone(440, 70, { type: 'square', vol: 0.05, to: 180 }),
  toggle: () => {
    click(1800, 0.8, 35);
    tone(740, 60, { type: 'triangle', vol: 0.1 });
  },
};
