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
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    return ctx;
  } catch {
    return null;
  }
}

// Opening the audio device takes 40 to 130ms, long enough to hold up the first click that plays a sound (the lamp,
// usually). So it opens ahead of time, in a quiet moment once someone first moves, scrolls or presses a key, and the
// click only has to resume it.
const signs = ['pointermove', 'pointerdown', 'keydown', 'scroll'] as const;
const warm = () => {
  signs.forEach((e) => removeEventListener(e, warm, true));
  const open = () => {
    if (!soundOn() || ctx) return;
    try {
      ctx = new AudioContext();
    } catch {}
  };
  if ('requestIdleCallback' in window) requestIdleCallback(open, { timeout: 1500 });
  else setTimeout(open, 200);
};
if (typeof window !== 'undefined') signs.forEach((e) => addEventListener(e, warm, { capture: true, passive: true }));

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

// A note whose pitch wobbles, fast at first and settling: the twang of something elastic.
function wobble(freq: number, to: number, ms: number, { type = 'triangle', vol = 0.12, rate = 16, depth = 40 }: { type?: OscillatorType; vol?: number; rate?: number; depth?: number } = {}) {
  const a = audio();
  if (!a) return;
  const t = a.currentTime;
  const end = t + ms / 1000;
  const osc = a.createOscillator();
  const lfo = a.createOscillator();
  const swing = a.createGain();
  const gain = a.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  osc.frequency.exponentialRampToValueAtTime(to, end);
  lfo.frequency.value = rate;
  swing.gain.setValueAtTime(depth, t);
  swing.gain.exponentialRampToValueAtTime(1, end);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(vol, t + 0.006);
  gain.gain.exponentialRampToValueAtTime(0.0001, end);
  lfo.connect(swing).connect(osc.frequency);
  osc.connect(gain).connect(a.destination);
  osc.start(t);
  lfo.start(t);
  osc.stop(end + 0.02);
  lfo.stop(end + 0.02);
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
  // The lamp cord's switch catching: a small click as the pull gets far enough to switch the light.
  notch: () => click(2600, 0.35, 18),
  // An elastic cord under strain: a creak that tightens and rises as it stretches. Returns a handle to set the strain
  // (0 to 1) as it changes, and to stop the sound.
  stretch: () => {
    let on: { a: AudioContext; creak: OscillatorNode; band: BiquadFilterNode; whine: OscillatorNode; lfo: OscillatorNode; gain: GainNode } | null = null;
    return {
      set(k: number) {
        if (!on) {
          if (k <= 0) return;
          const a = audio();
          if (!a) return;
          // A slow sawtooth rung through a narrow band: each tooth is one tick of rubber slipping, the creak.
          const creak = a.createOscillator();
          const band = a.createBiquadFilter();
          const whine = a.createOscillator();
          const lfo = a.createOscillator();
          const vib = a.createGain();
          const quiet = a.createGain();
          const gain = a.createGain();
          creak.type = 'sawtooth';
          band.type = 'bandpass';
          band.Q.value = 8;
          whine.type = 'triangle';
          lfo.frequency.value = 7;
          vib.gain.value = 6;
          quiet.gain.value = 0.08;
          gain.gain.value = 0;
          creak.connect(band).connect(gain);
          lfo.connect(vib).connect(whine.frequency);
          whine.connect(quiet).connect(gain);
          gain.connect(a.destination);
          [creak, whine, lfo].forEach((o) => o.start());
          on = { a, creak, band, whine, lfo, gain };
        }
        const t = on.a.currentTime;
        on.creak.frequency.setTargetAtTime(14 + k * 46, t, 0.03);
        on.band.frequency.setTargetAtTime(700 + k * 2200, t, 0.03);
        on.whine.frequency.setTargetAtTime(160 + k * 480, t, 0.03);
        on.gain.gain.setTargetAtTime(k > 0 ? 0.12 + k * 0.38 : 0, t, 0.03);
      },
      end() {
        if (!on) return;
        const t = on.a.currentTime;
        on.gain.gain.setTargetAtTime(0, t, 0.02);
        [on.creak, on.whine, on.lfo].forEach((o) => o.stop(t + 0.15));
        on = null;
      },
    };
  },
  // A stretched cord let go: a boing, bigger the further it was pulled (0 to 1).
  boing: (k = 1) => wobble(110 + 90 * k, 70 + 30 * k, 260 + 320 * k, { vol: 0.08 + 0.1 * k, rate: 15, depth: 25 + 55 * k }),
  // The cord snapping: a crack, and a twang that sags away.
  snap: () => {
    click(3400, 1, 22);
    click(700, 0.7, 70);
    wobble(260, 55, 520, { type: 'sawtooth', vol: 0.07, rate: 22, depth: 30 });
  },
  // The cord's knob smacking into the lamp shade, louder the harder (0 to 1).
  knock: (k = 1) => {
    click(2200, 0.3 + 0.6 * k, 30);
    tone(1250, 90, { type: 'triangle', vol: 0.04 + 0.08 * k, to: 1100 });
  },
  // A new cord dropping out of the lamp.
  drop: () => tone(380, 110, { type: 'triangle', vol: 0.09, to: 820 }),
  toggle: () => {
    click(1800, 0.8, 35);
    tone(740, 60, { type: 'triangle', vol: 0.1 });
  },
};
