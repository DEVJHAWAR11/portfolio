// Tiny synthesized UI sounds: no audio files, just a few milliseconds of oscillator.
// They only ever play in answer to a click or key press, quietly, and stay off once muted.
const KEY = 'sound';
let ctx: AudioContext | null = null;

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

function blip(freq: number, ms: number, { type = 'sine', vol = 0.05, to }: { type?: OscillatorType; vol?: number; to?: number } = {}) {
  if (!soundOn()) return;
  try {
    ctx ??= new AudioContext();
    if (ctx.state === 'suspended') ctx.resume();
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (to) osc.frequency.exponentialRampToValueAtTime(to, t + ms / 1000);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(vol, t + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + ms / 1000);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + ms / 1000 + 0.02);
  } catch {}
}

export const sfx = {
  // A soft key tick; `step` raises the pitch for a run of clicks.
  tick: (step = 0) => blip(1100 + step * 160, 45, { type: 'triangle', vol: 0.06 }),
  // Two rising notes for something opening.
  open: () => {
    blip(660, 90, { vol: 0.05 });
    setTimeout(() => blip(990, 140, { vol: 0.05 }), 80);
  },
  close: () => blip(520, 90, { vol: 0.04, to: 330 }),
  // A line of text arriving.
  line: () => blip(1800, 22, { type: 'square', vol: 0.012 }),
  // Pac-Man's bite.
  chomp: () => blip(420, 60, { type: 'square', vol: 0.018, to: 180 }),
  toggle: () => blip(740, 50, { type: 'triangle', vol: 0.05 }),
};
