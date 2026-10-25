// The theme switch is a pendant lamp with a pull cord. Pull the cord a little and let go, or just tap it, and the light
// (the theme) switches. Pull further and the cord stretches like elastic, creaking more the further it goes, and
// springs back with a boing when let go. Pull too far and it snaps: the loose end falls away, the stub whips up into
// the lamp, the lamp jumps and swings, the bulb flickers, and a new cord drops out of it a few seconds later. The
// lamp itself is the button, so keyboards, the search palette and /cli still switch the theme with it.
import { sfx } from './sfx';
import { unlock } from './eggs';

const BULB = 37; // the bulb's lowest point, in px below the top of the header
const L = 30; // the cord's resting length below the bulb
const STUB = 7; // what's left of it after it snaps
const TOGGLE = 22; // px of pull that switches the light when you let go
const SNAP = 190; // px of pull that snaps the cord
const GIVE = 150; // the most the elastic stretches; it stiffens on the way there
const LOOSE = L * 0.7; // the length of the piece that falls away
const REGROW = 6000; // ms before a new cord drops down
const GRAVITY = 2400; // px/s²

type P = { x: number; y: number; vx: number; vy: number };

// `flip(at)` switches the theme; `at` is the bulb, in viewport px, for the reveal to spread from.
export function lamp(wrap: HTMLElement, flip: (at: { x: number; y: number }) => void) {
  const btn = wrap.querySelector('button')!;
  const svg = wrap.querySelector<SVGSVGElement>('.rig')!;
  const $ = <T extends SVGElement>(s: string) => svg.querySelector<T>(s)!;
  const head = $<SVGGElement>('.head');
  const wire = $<SVGPathElement>('.wire');
  const cord = $<SVGPathElement>('.cord');
  const knob = $<SVGGElement>('.knob');
  const grip = wrap.querySelector<HTMLElement>('.grip')!;
  const piece = $<SVGGElement>('.piece');
  const still = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

  // The lamp swings (radians) and sags on its wire (px) on damped springs. The knob at the end of the cord and the
  // cord's middle are points with a velocity; the middle trails behind, so the cord moves like a cord.
  const swing = { a: 0, va: 0, s: 0, vs: 0 };
  const end: P = { x: 0, y: BULB + L, vx: 0, vy: 0 };
  const mid: P = { x: 0, y: BULB + L / 2, vx: 0, vy: 0 };
  const want = { x: 0, y: BULB + L }; // where the hand holds the knob
  let len = L;
  let cut = false;
  let knock = 0; // the speed the knob hit the lamp at this frame, for its sound
  let fall: { a: P; b: P } | null = null;
  let grab: { id: number; x0: number; y0: number; t0: number; pull: number; far: number; armed: boolean; sound: ReturnType<typeof sfx.stretch> } | null =
    null;

  // A phone that can buzz does, at the catch and at the snap.
  const buzz = (ms: number | number[]) => {
    try {
      navigator.vibrate?.(ms);
    } catch {}
  };
  const bulb = () => {
    const r = BULB + swing.s;
    return { x: -Math.sin(swing.a) * r, y: Math.cos(swing.a) * r };
  };
  const pull = (o: P, x: number, y: number, k: number, c: number, dt: number) => {
    o.vx += (-k * (o.x - x) - c * o.vx) * dt;
    o.vy += (-k * (o.y - y) - c * o.vy) * dt;
    o.x += o.vx * dt;
    o.y += o.vy * dt;
  };
  // Elastic: each px of pull stretches it a little less than the one before.
  const give = (p: number) => (p < 0 ? Math.max(p * 0.5, -L * 0.6) : GIVE * (1 - Math.exp(-p / GIVE)));

  function step(dt: number) {
    const b = bulb();
    // The lamp leans toward a pull and sags on its wire under the strain.
    let lean = 0;
    let sag = 0;
    if (grab) {
      sag = Math.min(9, Math.max(0, Math.hypot(end.x - b.x, end.y - b.y) - len) * 0.06);
      lean = Math.max(-0.4, Math.min(0.4, -Math.atan2(end.x, end.y) * 0.5));
    }
    swing.va += (-170 * (swing.a - lean) - 3.2 * swing.va) * dt;
    swing.a += swing.va * dt;
    swing.vs += (-500 * (swing.s - sag) - 20 * swing.vs) * dt;
    swing.s += swing.vs * dt;
    if (grab) pull(end, want.x, want.y, 3000, 100, dt);
    else pull(end, b.x, b.y + len, 420, 7.5, dt);
    // Let go from a long stretch, the knob flies back up and smacks the lamp, which jumps.
    if (!cut && end.y < b.y + 6) {
      end.y = b.y + 6;
      if (end.vy < 0) {
        if (end.vy < -300) knock = Math.max(knock, -end.vy);
        swing.vs += end.vy * 0.04;
        swing.va += end.vx * 0.003;
        end.vy *= -0.3;
      }
    }
    // Slack, the cord bows out to one side instead of shrinking.
    const dx = end.x - b.x;
    const dy = end.y - b.y;
    const d = Math.hypot(dx, dy) || 1;
    const bow = d < len ? Math.sqrt(len * len - d * d) / 2 : 0;
    pull(mid, (b.x + end.x) / 2 + (dy / d) * bow, (b.y + end.y) / 2 - (dx / d) * bow, grab ? 2400 : 700, grab ? 70 : 16, dt);
    if (fall) {
      const { a, b: z } = fall;
      const dx = z.x - a.x;
      const dy = z.y - a.y;
      const d = Math.hypot(dx, dy) || 1;
      const f = (d - LOOSE) * 260 * dt;
      a.vx += (dx / d) * f;
      a.vy += (dy / d) * f + GRAVITY * dt;
      z.vx -= (dx / d) * f;
      z.vy += -(dy / d) * f + GRAVITY * dt;
      for (const o of [a, z]) {
        o.x += o.vx * dt;
        o.y += o.vy * dt;
      }
    }
  }

  function draw() {
    const b = bulb();
    head.setAttribute('transform', `rotate(${(swing.a * 180) / Math.PI}) translate(0 ${swing.s})`);
    const top = 13 + swing.s;
    wire.setAttribute('d', `M0 0L${-Math.sin(swing.a) * top} ${Math.cos(swing.a) * top}`);
    const strain = Math.max(0, Math.hypot(end.x - b.x, end.y - b.y) - len);
    // Close to snapping it trembles and takes the accent colour.
    const near = grab ? Math.max(0, (grab.pull - SNAP * 0.6) / (SNAP * 0.4)) : 0;
    const ex = end.x + (near ? (Math.random() - 0.5) * 3 * near : 0);
    const cx = 2 * mid.x - (b.x + ex) / 2;
    const cy = 2 * mid.y - (b.y + end.y) / 2;
    cord.setAttribute('d', `M${b.x} ${b.y}Q${cx} ${cy} ${ex} ${end.y}`);
    cord.style.strokeWidth = String(Math.max(0.7, 1.6 - strain / 110));
    cord.classList.toggle('taut', near > 0);
    const st = Math.min(1, strain / GIVE);
    knob.setAttribute('transform', `translate(${ex} ${end.y}) rotate(${(-Math.atan2(ex - cx, end.y - cy) * 180) / Math.PI}) scale(${1 - st * 0.2} ${1 + st * 0.45})`);
    grip.style.transform = `translate(${end.x}px, ${end.y - BULB - L}px)`;
    if (fall) {
      const { a, b: z } = fall;
      piece.firstElementChild!.setAttribute('d', `M${a.x} ${a.y}L${z.x} ${z.y}`);
      piece.lastElementChild!.setAttribute('transform', `translate(${z.x} ${z.y}) rotate(${(-Math.atan2(z.x - a.x, z.y - a.y) * 180) / Math.PI})`);
    }
  }

  let raf = 0;
  let prev = 0;
  const frame = (now: number) => {
    raf = 0;
    const dt = Math.max(0, Math.min((now - prev) / 1000, 1 / 30));
    prev = now;
    if (still() && !grab) {
      // Reduced motion: no swinging or bouncing, everything goes straight back to rest.
      Object.assign(swing, { a: 0, va: 0, s: 0, vs: 0 });
      Object.assign(end, { x: 0, y: BULB + len, vx: 0, vy: 0 });
      Object.assign(mid, { x: 0, y: BULB + len / 2, vx: 0, vy: 0 });
      return draw();
    }
    for (let i = 0; i < 3; i++) step(dt / 3);
    if (knock) {
      sfx.knock(Math.min(1, knock / 1600));
      knock = 0;
    }
    if (fall && Math.min(fall.a.y, fall.b.y) > innerHeight + 40) {
      fall = null;
      piece.style.display = 'none';
    }
    draw();
    const b = bulb();
    const left =
      Math.abs(swing.a) * 100 + Math.abs(swing.va) * 10 + Math.abs(swing.s) + Math.abs(swing.vs) * 0.1 +
      Math.abs(end.x - b.x) + Math.abs(end.y - b.y - len) + (Math.abs(end.vx) + Math.abs(end.vy) + Math.abs(mid.vx) + Math.abs(mid.vy)) * 0.05;
    if (grab || fall || left > 0.05) wake();
  };
  function wake() {
    if (raf) return;
    if (!prev || performance.now() - prev > 100) prev = performance.now();
    raf = requestAnimationFrame(frame);
  }

  const toggle = () => {
    const r = svg.getBoundingClientRect();
    const b = bulb();
    flip({ x: r.left + r.width / 2 + b.x, y: r.top + b.y });
    swing.vs += 90; // the lamp bobs as the switch inside clicks
  };

  function start(e: PointerEvent) {
    if (cut || grab || e.button > 0) return;
    e.preventDefault();
    try {
      grip.setPointerCapture(e.pointerId);
    } catch {}
    grab = { id: e.pointerId, x0: e.clientX, y0: e.clientY, t0: performance.now(), pull: 0, far: 0, armed: false, sound: sfx.stretch() };
    want.x = 0;
    want.y = BULB + L;
    wrap.classList.add('pulling');
    wake();
  }
  grip.addEventListener('pointerdown', start);
  grip.addEventListener('pointermove', (e) => {
    if (!grab || e.pointerId !== grab.id) return;
    const dx = e.clientX - grab.x0;
    const p = e.clientY - grab.y0;
    grab.pull = p;
    grab.far = Math.max(grab.far, Math.hypot(dx, p));
    want.x = Math.max(-70, Math.min(70, dx * 0.6));
    want.y = BULB + L + give(p);
    if (p >= SNAP) return snap();
    // The switch inside catches at a short pull, with a small click to say so; letting go then switches the light.
    if (!grab.armed && p >= TOGGLE) {
      grab.armed = true;
      sfx.notch();
      buzz(8);
    } else if (grab.armed && p < TOGGLE / 2) grab.armed = false;
    grab.sound.set(Math.max(0, (p - TOGGLE) / (SNAP - TOGGLE)));
    wake();
  });
  const release = (e: PointerEvent) => {
    if (!grab || e.pointerId !== grab.id) return;
    const g = grab;
    grab = null;
    g.sound.end();
    wrap.classList.remove('pulling');
    if (e.type === 'pointerup') {
      if (g.far < 6 && performance.now() - g.t0 < 400) {
        // A tap: give it a little tug.
        end.vy += 700;
        toggle();
      } else if (g.armed) {
        toggle();
        const k = (g.pull - TOGGLE) / (SNAP - TOGGLE);
        if (k > 0.15) sfx.boing(k);
      }
    }
    wake();
  };
  grip.addEventListener('pointerup', release);
  grip.addEventListener('pointercancel', release);

  function snap() {
    const g = grab!;
    grab = null;
    g.sound.end();
    wrap.classList.remove('pulling');
    try {
      grip.releasePointerCapture(g.id);
    } catch {}
    cut = true;
    sfx.snap();
    buzz([25, 40, 15]);
    unlock('cord');
    const b = bulb();
    const at = { x: b.x + (end.x - b.x) * 0.3, y: b.y + (end.y - b.y) * 0.3 };
    // The loose end shoots off toward the hand and falls, shrinking back to its own length on the way down.
    if (!still()) {
      fall = { a: { ...at, vx: (end.x - at.x) * 4, vy: (end.y - at.y) * 6 }, b: { ...end, vx: end.vx * 0.3, vy: 120 } };
      piece.style.display = '';
    }
    // The stub whips back up into the lamp, which jumps and swings while the bulb flickers.
    Object.assign(end, { x: at.x, y: at.y, vx: 0, vy: -400 });
    len = STUB;
    knob.style.display = grip.style.display = 'none';
    swing.vs = -260;
    swing.va += (at.x >= 0 ? -1 : 1) * 2.5;
    wrap.classList.remove('flicker');
    void wrap.offsetWidth;
    wrap.classList.add('flicker');
    btn.title = 'The cord snapped. The lamp still works.';
    setTimeout(regrow, REGROW);
    wake();
  }

  // A new cord drops out of the lamp and bounces to its length.
  function regrow() {
    cut = false;
    len = L;
    const b = bulb();
    Object.assign(end, { x: b.x, y: b.y + 2, vx: 0, vy: 0 });
    Object.assign(mid, { x: b.x, y: b.y + 1, vx: 0, vy: 0 });
    knob.style.display = grip.style.display = '';
    btn.removeAttribute('title');
    sfx.drop();
    wake();
  }

  // Clicking the lamp switches it too, and knocks it swinging.
  btn.addEventListener('click', () => {
    toggle();
    swing.va += (Math.random() < 0.5 ? -1 : 1) * 1.2;
    if (!cut) end.vy += 300;
    wake();
  });

  // While the theme's reveal plays, the pointer lands on the page root instead of the lamp; pass those presses on.
  const root = document.documentElement;
  const on = (el: Element, e: MouseEvent) => {
    const r = el.getBoundingClientRect();
    return e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
  };
  document.addEventListener('pointerdown', (e) => {
    if (e.target === root && !cut && on(grip, e)) start(e);
  });
  document.addEventListener('click', (e) => {
    if (e.target === root && on(btn, e)) btn.click();
  });
}
