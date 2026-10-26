// The footer's slingshot. Pull the ball back and let go: it flies out of the footer and the page above becomes the
// table, with its buttons and headings as bumpers, three bugs to squash and the lamp to aim for. Once out it
// can't drop back into the footer; the footer's top edge is the floor. Every bounce before a hit doubles the points.
// Nothing shows until someone presses Play; it draws only while a shot is being aimed or is moving, and Done (or
// Escape) puts it all away.
import { sfx } from './sfx';
import { unlock } from './eggs';

type V = { x: number; y: number };
type Box = { x: number; y: number; w: number; h: number; el: HTMLElement };
type Ball = { x: number; y: number; vx: number; vy: number; out: boolean };
type Lamp = { x: number; y: number; r: number }[];

const SHOTS = 5;
const R = 6;
const GRAV = 1400;
const PULL = 90;
const POWER = 27; // launch speed per px of pull: a full pull clears a tall screen
const STEP = 1 / 240;
// Buttons and headings bounce the ball; it flies over text and form fields, so the way up stays open.
const BUMPERS = 'h2, h3, .btn, button';
// The header's buttons too, apart from the lamp, which is a target of its own.
const TOP = 'header .mark, header .btn, header button:not(#theme-toggle)';

function make(area: HTMLElement) {
  const footer = area.closest('footer')!;
  const $ = (s: string) => area.querySelector<HTMLElement>(s)!;
  const say = $('[data-say]');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const lampBtn = document.getElementById('theme-toggle') as HTMLButtonElement | null;
  const c = document.createElement('canvas');
  c.className = 'table';
  c.setAttribute('aria-hidden', 'true');
  c.hidden = true;
  footer.append(c);
  const g = c.getContext('2d')!;

  // The canvas spans the window's width and one screen up from the footer's bottom, scrolling with the page.
  let W = 0, H = 0, top = 0, floorIn = 0, left = 0, right = 0;
  let home: V = { x: 0, y: 0 };
  let col: Record<string, string> = {};
  let font = '';
  function measure() {
    const f = footer.getBoundingClientRect();
    const d = Math.min(devicePixelRatio || 1, 1.5);
    W = document.documentElement.clientWidth;
    H = Math.round(Math.min(innerHeight, f.bottom + scrollY));
    Object.assign(c.style, { left: `${-f.left}px`, width: `${W}px`, height: `${H}px` });
    // Resizing clears and reallocates the canvas, so only when the size really changed.
    if (c.width !== Math.round(W * d) || c.height !== Math.round(H * d)) {
      c.width = Math.round(W * d);
      c.height = Math.round(H * d);
      g.setTransform(d, 0, 0, d, 0, 0);
    }
    const org = f.bottom - H;
    const a = area.getBoundingClientRect();
    top = f.top - org;
    floorIn = a.bottom - org - 10;
    left = a.left;
    right = a.right;
    home = { x: a.left + 48, y: floorIn - 46 };
  }
  function paint() {
    const s = getComputedStyle(document.documentElement);
    col = Object.fromEntries(['bg', 'fg', 'muted', 'faint', 'edge', 'accent', 'pend', 'fail'].map((k) => [k, s.getPropertyValue('--' + k).trim()]));
    font = '600 11px ' + s.getPropertyValue('--mono');
  }

  // The page's buttons and headings above the footer, measured at the start of each shot. Only the sections the
  // table covers are looked into: measuring anything inside the others would make the browser lay out parts of
  // the page that are far off screen.
  let boxes: Box[] = [];
  function bumpers() {
    const cr = c.getBoundingClientRect();
    boxes = [];
    for (const sec of document.querySelectorAll('main > *')) {
      const sr = sec.getBoundingClientRect();
      if (sr.bottom < cr.top || sr.top > cr.top + top) continue;
      for (const el of sec.querySelectorAll<HTMLElement>(BUMPERS)) {
        const r = el.getBoundingClientRect();
        if (!r.width || r.bottom < cr.top || r.top > cr.top + top || r.right < 0 || r.left > W) continue;
        if (r.width * r.height > W * H * 0.2) continue;
        boxes.push({ x: r.left - cr.left, y: r.top - cr.top, w: r.width, h: r.height, el });
      }
    }
    header(cr);
  }
  // The header stays put while the page scrolls under it, so its buttons are measured apart, and again on scroll.
  let heads: Box[] = [];
  function header(cr = c.getBoundingClientRect()) {
    heads = [];
    for (const el of document.querySelectorAll<HTMLElement>(TOP)) {
      const r = el.getBoundingClientRect();
      if (r.width) heads.push({ x: r.left - cr.left, y: r.top - cr.top, w: r.width, h: r.height, el });
    }
  }
  // The lamp's shade and its cord's knob, both worth hitting. Measured once a shot, and again if the page scrolls
  // under it, rather than every frame.
  const grip = document.querySelector<HTMLElement>('#lamp .grip');
  let lampAt: Lamp = [];
  const lamp = (): Lamp => {
    const cr = c.getBoundingClientRect();
    const out: Lamp = [];
    for (const [el, extra] of [[lampBtn, 8], [grip, 2]] as const) {
      const r = el?.getBoundingClientRect();
      if (r?.width) out.push({ x: r.left + r.width / 2 - cr.left, y: r.top + r.height / 2 - cr.top, r: Math.max(r.width, r.height) / 2 + extra });
    }
    return out;
  };

  // Three bugs in the open, clear of the bumpers and of each other. They pop in one after another.
  let bugs: (V & { hit: number; a: number })[] = [];
  let placed = 0;
  function place() {
    bumpers();
    bugs = [];
    placed = performance.now();
    const lo = 100;
    const hi = Math.max(lo + 20, top - 40);
    for (let i = 0; bugs.length < 3 && i < 300; i++) {
      const p = { x: 40 + Math.random() * (W - 80), y: lo + Math.random() * (hi - lo), hit: 0, a: Math.random() * 7 };
      if (boxes.some((b) => p.x > b.x - 20 && p.x < b.x + b.w + 20 && p.y > b.y - 20 && p.y < b.y + b.h + 20)) continue;
      if (bugs.some((o) => Math.hypot(o.x - p.x, o.y - p.y) < 110)) continue;
      bugs.push(p);
    }
  }

  let state: 'off' | 'ready' | 'aim' | 'fly' | 'caught' | 'over' = 'off';
  const ball: Ball = { x: 0, y: 0, vx: 0, vy: 0, out: false };
  let pull: V = { x: 0, y: 0 }; // how far the pocket is drawn back from rest; the launch comes from this
  const pocket = { x: 0, y: 0, vx: 0, vy: 0 }; // where it is after letting go, springing back
  let score = 0, shots = SHOTS, bounces = 0, still = 0, air = 0, lastBump = 0, squash = 0, squashAt = 0;
  let lit = false; // the lamp switches once per shot, however long the ball rattles around it
  let best = 0;
  try {
    best = Number(localStorage.getItem('sling-best')) || 0;
  } catch {}
  const trail: V[] = [];
  let pops: (V & { t: number; text: string })[] = [];
  let creak: ReturnType<typeof sfx.stretch> | null = null;

  const hud = () => {
    $('[data-score]').textContent = score.toLocaleString('en-IN');
    $('[data-best]').textContent = best.toLocaleString('en-IN');
    $('[data-shots]').textContent = '●'.repeat(shots) + '○'.repeat(SHOTS - shots);
  };

  // One small step of flight. With `live` off it's the aiming guide: the same path, without points or sound.
  function move(b: Ball, live: boolean, L: Lamp) {
    let hit = false;
    const bounce = (speed: number, pitch: number, nx: number, ny: number, el?: HTMLElement) => {
      hit = true;
      if (!live || speed < 90) return;
      bounces++;
      const now = performance.now();
      if (now - lastBump > 35) {
        lastBump = now;
        sfx.bump(Math.min(1, speed / 1500), pitch);
      }
      if (speed > 220) {
        squash = 1;
        squashAt = Math.atan2(ny, nx);
      }
      // The thing it hit gives a little, then spbugs back.
      const k = Math.min(7, speed / 180);
      if (el && !reduce) el.animate({ translate: [`${-nx * k}px ${-ny * k}px`, '0 0'] }, { duration: 380, easing: 'cubic-bezier(0.3, 2.2, 0.5, 1)' });
    };
    b.vy += GRAV * STEP;
    b.x += b.vx * STEP;
    b.y += b.vy * STEP;
    if (b.x < R) {
      b.x = R;
      bounce(-b.vx, 150, 1, 0);
      b.vx = Math.abs(b.vx) * 0.82;
    } else if (b.x > W - R) {
      b.x = W - R;
      bounce(b.vx, 150, -1, 0);
      b.vx = -Math.abs(b.vx) * 0.82;
    }
    if (b.y < R) {
      b.y = R;
      bounce(-b.vy, 150, 0, 1);
      b.vy = Math.abs(b.vy) * 0.82;
    }
    if (!b.out && b.y + R < top) b.out = true;
    const floor = b.out ? top : floorIn;
    if (b.y > floor - R) {
      b.y = floor - R;
      if (b.vy > 140) bounce(b.vy, 110, 0, -1);
      b.vy = b.vy > 140 ? -b.vy * 0.5 : 0;
      b.vx *= 1 - 4 * STEP;
    }
    for (const k of [...boxes, ...heads]) {
      const cx = Math.max(k.x, Math.min(b.x, k.x + k.w));
      const cy = Math.max(k.y, Math.min(b.y, k.y + k.h));
      let nx = b.x - cx;
      let ny = b.y - cy;
      const d = Math.hypot(nx, ny);
      if (d >= R) continue;
      if (d < 1e-6) {
        // The centre got inside: leave by the nearest side.
        const s = [b.x - k.x, k.x + k.w - b.x, b.y - k.y, k.y + k.h - b.y];
        const m = s.indexOf(Math.min(...s));
        [nx, ny] = [[-1, 0], [1, 0], [0, -1], [0, 1]][m];
        if (m < 2) b.x = m ? k.x + k.w + R : k.x - R;
        else b.y = m === 3 ? k.y + k.h + R : k.y - R;
      } else {
        nx /= d;
        ny /= d;
        b.x = cx + nx * R;
        b.y = cy + ny * R;
      }
      const vn = b.vx * nx + b.vy * ny;
      if (vn < 0) {
        b.vx -= 1.75 * vn * nx;
        b.vy -= 1.75 * vn * ny;
        bounce(-vn, 520, nx, ny, k.el);
      }
    }
    for (const o of L) {
      const dx = b.x - o.x;
      const dy = b.y - o.y;
      const d = Math.hypot(dx, dy);
      if (d < R + o.r && d > 0) {
        const nx = dx / d;
        const ny = dy / d;
        b.x = o.x + nx * (R + o.r);
        b.y = o.y + ny * (R + o.r);
        const vn = b.vx * nx + b.vy * ny;
        const was = { x: b.x - nx * R, y: b.y - ny * R, vx: b.vx, vy: b.vy };
        if (vn < 0) {
          b.vx -= 1.8 * vn * nx;
          b.vy -= 1.8 * vn * ny;
        }
        hit = true;
        if (live) {
          if (vn < 0) {
            squash = 1;
            squashAt = Math.atan2(ny, nx);
          }
          hitLamp(was);
        }
      }
    }
    if (live)
      for (const p of bugs)
        if (!p.hit && Math.hypot(p.x - b.x, p.y - b.y) < R + 11) {
          p.hit = performance.now();
          const times = 2 ** Math.min(bounces, 5);
          score += 100 * times;
          pops.push({ x: p.x, y: p.y - 16, t: p.hit, text: times > 1 ? `+${100 * times}  ×${times}` : '+100' });
          sfx.squish();
          sfx.ding(Math.min(bounces, 5));
          hud();
        }
    return hit;
  }

  // The lamp is worth hitting too. The blow swings it (or its cord) and switches the light in the same frame, the
  // ball holds still for a beat, as hits in games do, then bounces off and carries on.
  function hitLamp(at: V & { vx: number; vy: number }) {
    if (lit) return;
    lit = true;
    state = 'caught';
    score += 250;
    const speed = Math.hypot(at.vx, at.vy);
    sfx.knock(Math.min(1, 0.5 + speed / 3000));
    const cr = c.getBoundingClientRect();
    lampBtn?.parentElement!.dispatchEvent(new CustomEvent('knock', { detail: { x: at.x + cr.left, y: at.y + cr.top, vx: at.vx, vy: at.vy } }));
    unlock('lamp');
    pops.push({ x: Math.min(Math.max(at.x, 60), W - 60), y: at.y + 50, t: performance.now(), text: 'Lights! +250' });
    hud();
    // Hit once, it's out of the way: the lamp swings off, so the spot it was in is no longer something to hit.
    lampAt = [];
    setTimeout(() => {
      if (state !== 'caught') return;
      state = 'fly';
      prev = 0; // the pause isn't flight time
      wake();
    }, 70);
  }

  function fire() {
    const k = Math.hypot(pull.x, pull.y) / PULL;
    creak?.end();
    creak = null;
    shots--;
    Object.assign(ball, { x: home.x, y: home.y, vx: -pull.x * POWER, vy: -pull.y * POWER, out: false });
    Object.assign(pocket, { ...drawn(), vx: 0, vy: 0 });
    pull = { x: 0, y: 0 };
    bounces = still = air = 0;
    lit = false;
    trail.length = 0;
    state = 'fly';
    say.hidden = true;
    sfx.boing(k);
    sfx.whoosh(k);
    bumpers();
    lampAt = lamp();
    hud();
    wake();
  }
  addEventListener(
    'scroll',
    () => {
      if (state !== 'fly') return;
      if (!lit) lampAt = lamp();
      header();
    },
    { passive: true },
  );

  // The ball has stopped: count up, then load the next one.
  function settle() {
    if (bugs.every((p) => p.hit)) {
      score += shots * 100;
      pops.push({ x: W / 2, y: top - 60, t: performance.now(), text: `All bugs squashed  +${shots * 100}` });
      sfx.cheer();
      shots = SHOTS;
      place();
      state = 'ready';
    } else if (shots === 0) {
      state = 'over';
      best = Math.max(best, score);
      try {
        localStorage.setItem('sling-best', String(best));
      } catch {}
      sfx.close();
      say.textContent = `Out of balls with ${score.toLocaleString('en-IN')} points. Pull again for a new game.`;
      say.hidden = false;
    } else state = 'ready';
    trail.length = 0;
    hud();
  }

  function newGame() {
    score = 0;
    shots = SHOTS;
    place();
    state = 'ready';
    hud();
  }

  let raf = 0;
  let prev = 0;
  function frame(now: number) {
    raf = 0;
    const dt = Math.min(0.05, (now - prev) / 1000);
    prev = now;
    const L = lampAt;
    for (let n = Math.max(1, Math.round(dt / STEP)); n > 0; n--) {
      if (state === 'fly') {
        move(ball, true, L);
        air += STEP;
      }
      if (state !== 'aim') {
        // The pocket spbugs back past its rest and wobbles there.
        pocket.vx += (-900 * pocket.x - 11 * pocket.vx) * STEP;
        pocket.vy += (-900 * pocket.y - 11 * pocket.vy) * STEP;
        pocket.x += pocket.vx * STEP;
        pocket.y += pocket.vy * STEP;
      }
    }
    if (state === 'fly') {
      trail.push({ x: ball.x, y: ball.y });
      if (trail.length > 9) trail.shift();
      still = Math.hypot(ball.vx, ball.vy) < 40 ? still + dt : 0;
      if (still > 0.35 || air > 12) settle();
    }
    squash = Math.max(0, squash - dt * 8);
    pops = pops.filter((p) => now - p.t < 1000);
    draw(now);
    const moving = Math.abs(pocket.x) + Math.abs(pocket.y) + Math.abs(pocket.vx / 40) + Math.abs(pocket.vy / 40) > 0.2;
    if (state === 'off' || state === 'caught') return;
    const popping = now - placed < 800 || bugs.some((p) => p.hit && now - p.hit < 500);
    if (state === 'fly' || state === 'aim' || moving || squash || pops.length || popping) wake();
  }
  function wake() {
    if (raf) return;
    if (!prev || performance.now() - prev > 100) prev = performance.now();
    raf = requestAnimationFrame(frame);
  }

  const band = (from: V, to: V, k: number) => {
    g.strokeStyle = col.accent;
    g.lineWidth = 3.2 - 1.8 * k;
    g.beginPath();
    g.moveTo(from.x, from.y);
    g.lineTo(to.x, to.y);
    g.stroke();
  };
  function drawBall(x: number, y: number, vx: number, vy: number, alpha = 1) {
    g.save();
    g.globalAlpha = alpha;
    g.translate(x, y);
    if (squash) {
      g.rotate(squashAt);
      g.scale(1 - 0.38 * squash, 1 + 0.3 * squash);
    } else {
      const s = Math.min(0.3, Math.hypot(vx, vy) / 5000);
      g.rotate(Math.atan2(vy, vx));
      g.scale(1 + s, 1 - s * 0.6);
    }
    g.fillStyle = col.fg;
    g.beginPath();
    g.arc(0, 0, R, 0, 7);
    g.fill();
    g.restore();
  }

  // The bugs are pixel sprites, two frames each so their legs shuffle while anything is moving; still otherwise.
  const SPRITE = [
    ['.x.....x.', '..x...x..', '..xxxxx..', 'x.x.x.x.x', '.xxxxxxx.', 'x.xx.xx.x', '.xxx.xxx.', 'x..xxx..x'],
    ['x.......x', '.x.....x.', '..xxxxx..', '.xx.x.xx.', 'xxxxxxxxx', '.xxx.xxx.', 'xxxx.xxxx', '.x.xxx.x.'],
  ].map((f) => f.flatMap((row, y) => [...row].flatMap((ch, x) => (ch === 'x' ? [[x - 4, y - 4]] : []))));
  const PX = 2.5;
  function bug(p: V & { a: number }, size: number, now: number) {
    const moving = state === 'aim' || state === 'fly';
    const frame = moving ? Math.floor(now / 160 + p.a) % 2 : 0;
    const px = PX * size;
    g.fillStyle = col.fail;
    for (const [x, y] of SPRITE[frame]) g.fillRect(Math.round(p.x + x * px - px / 2), Math.round(p.y + y * px - px / 2), Math.ceil(px), Math.ceil(px));
  }
  // A squashed bug comes apart into its pixels, which fly off and fade over half a second.
  function splat(p: V & { a: number }, t: number) {
    if (t >= 1) return;
    const k = 1 - (1 - t) ** 2;
    g.globalAlpha = 1 - t;
    g.fillStyle = col.fail;
    SPRITE[0].forEach(([x, y], i) => {
      const spin = ((i * 47) % 13) / 13 - 0.5;
      const dx = x * (1 + 5 * k) + spin * 26 * k;
      const dy = y * (1 + 5 * k) + 30 * k * k - 8 * k;
      g.fillRect(Math.round(p.x + dx * PX - PX / 2), Math.round(p.y + dy * PX - PX / 2), PX, PX);
    });
    g.globalAlpha = 1;
  }

  function draw(now: number) {
    g.clearRect(0, 0, W, H);
    g.lineCap = 'round';
    g.lineJoin = 'round';

    bugs.forEach((p, i) => {
      if (p.hit) return splat(p, (now - p.hit) / 500);
      // Popping in: a small overshoot, then settled.
      const u = Math.min(1, (now - placed - i * 90) / 380) - 1;
      const grow = u < -1 ? 0 : 1 + 2.7 * u ** 3 + 1.7 * u ** 2;
      if (grow > 0) bug(p, grow, now);
    });
    g.globalAlpha = 1;

    // The ground inside the footer.
    g.strokeStyle = col.edge;
    g.lineWidth = 1;
    g.setLineDash([2, 6]);
    g.beginPath();
    g.moveTo(left, floorIn + 0.5);
    g.lineTo(right, floorIn + 0.5);
    g.stroke();
    g.setLineDash([]);

    // While aiming, the lamp is marked as a target.
    if (state === 'aim') {
      g.strokeStyle = col.accent;
      g.lineWidth = 1.5;
      g.setLineDash([3, 4]);
      for (const o of lampAt) {
        g.beginPath();
        g.arc(o.x, o.y, o.r + 3, 0, 7);
        g.stroke();
      }
      g.setLineDash([]);
    }

    // The aiming guide: a short stretch of the path, up to just past the first thing it would hit.
    if (state === 'aim' && Math.hypot(pull.x, pull.y) > 8) {
      const b: Ball = { x: home.x, y: home.y, vx: -pull.x * POWER, vy: -pull.y * POWER, out: false };
      const L = lampAt;
      let after = -1;
      g.fillStyle = col.faint;
      for (let i = 1; i < 160 && after !== 0; i++) {
        if (move(b, false, L) && after < 0) after = 30;
        if (after > 0) after--;
        if (i % 7 === 0) {
          g.beginPath();
          g.arc(b.x, b.y, 1.6, 0, 7);
          g.fill();
        }
      }
    }

    const k = state === 'aim' ? Math.hypot(pull.x, pull.y) / PULL : 0;
    const d = state === 'aim' ? drawn() : pocket;
    const pk = { x: home.x + d.x, y: home.y + d.y };
    const tl = { x: home.x - 13, y: home.y - 3 };
    const tr = { x: home.x + 13, y: home.y - 3 };
    band(tr, pk, k);
    // The frame: a Y on a stem.
    g.strokeStyle = col.muted;
    g.lineWidth = 4.5;
    g.beginPath();
    g.moveTo(home.x, floorIn);
    g.lineTo(home.x, home.y + 18);
    g.quadraticCurveTo(home.x - 13, home.y + 14, tl.x, tl.y);
    g.moveTo(home.x, home.y + 18);
    g.quadraticCurveTo(home.x + 13, home.y + 14, tr.x, tr.y);
    g.stroke();

    if (state === 'fly') {
      trail.forEach((p, i) => drawBall(p.x, p.y, 0, 0, (i / trail.length) * 0.25));
      drawBall(ball.x, ball.y, ball.vx, ball.vy);
    } else drawBall(pk.x, pk.y, 0, 0);
    band(tl, pk, k);

    g.font = font;
    g.textAlign = 'center';
    for (const p of pops) {
      const t = (now - p.t) / 1000;
      g.globalAlpha = 1 - t * t;
      g.fillStyle = col.fg;
      g.fillText(p.text, p.x, p.y - t * 26);
    }
    g.globalAlpha = 1;
  }

  // Where the pocket is drawn: the pull, kept just above the ground. The ground stops the band, not the power.
  const drawn = () => ({ x: pull.x, y: Math.min(pull.y, floorIn - R - home.y) });

  // Aiming: press anywhere in the footer's play area and drag away from where you want it to go.
  let from: V = { x: 0, y: 0 };
  const cancel = () => {
    if (state !== 'aim') return;
    creak?.end();
    creak = null;
    Object.assign(pocket, { ...drawn(), vx: 0, vy: 0 });
    pull = { x: 0, y: 0 };
    state = 'ready';
    wake();
  };
  const aimAt = (dx: number, dy: number) => {
    const d = Math.hypot(dx, dy);
    const s = d > PULL ? PULL / d : 1;
    pull = { x: dx * s, y: dy * s };
    creak?.set(Math.min(1, Math.hypot(pull.x, pull.y) / PULL));
    wake();
  };
  area.addEventListener('pointerdown', (e) => {
    if (state === 'off' || state === 'fly' || state === 'caught' || e.button > 0 || (e.target as Element).closest('button')) return;
    if (state === 'over') newGame();
    measure();
    bumpers();
    lampAt = lamp();
    from = { x: e.clientX, y: e.clientY };
    state = 'aim';
    try {
      area.setPointerCapture(e.pointerId);
    } catch {}
    creak = sfx.stretch();
    aimAt(0, 0);
  });
  area.addEventListener('pointermove', (e) => state === 'aim' && aimAt(e.clientX - from.x, e.clientY - from.y));
  area.addEventListener('pointerup', () => {
    if (state !== 'aim') return;
    if (Math.hypot(pull.x, pull.y) > 12) fire();
    else cancel();
  });
  area.addEventListener('pointercancel', cancel);

  // Keys: arrows aim (left and right turn it, up and down set the power), space or enter lets go.
  let angle = -0.95;
  let power = 0.75;
  const keyAim = () => aimAt(-Math.cos(angle) * power * PULL, -Math.sin(angle) * power * PULL);
  area.addEventListener('keydown', (e) => {
    if (state === 'off' || (e.target as Element).closest('button')) return;
    const turn = { ArrowLeft: [-0.05, 0], ArrowRight: [0.05, 0], ArrowUp: [0, 0.05], ArrowDown: [0, -0.05] }[e.key];
    if (turn) {
      e.preventDefault();
      if (state === 'fly' || state === 'caught') return;
      if (state === 'over') newGame();
      if (state === 'ready') {
        measure();
        bumpers();
        lampAt = lamp();
      }
      angle = Math.min(-0.05, Math.max(-Math.PI + 0.05, angle + turn[0]));
      power = Math.min(1, Math.max(0.2, power + turn[1]));
      state = 'aim';
      keyAim();
    } else if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      if (state === 'fly' || state === 'caught') return;
      if (state === 'over') newGame();
      if (state !== 'aim') {
        measure();
        keyAim();
      }
      fire();
    } else if (e.key === 'Escape') state === 'aim' ? cancel() : stop();
  });

  const redraw = () => {
    if (state === 'off' || state === 'fly' || state === 'caught') return;
    measure();
    draw(performance.now());
  };
  addEventListener('resize', redraw);
  // A new theme's colours are read on the next frame, not in the middle of the switch.
  new MutationObserver(
    () =>
      state !== 'off' &&
      requestAnimationFrame(() => {
        paint();
        if (state !== 'fly' && state !== 'caught') draw(performance.now());
      }),
  ).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme', 'data-accent'],
  });

  function start() {
    if (state !== 'off') return;
    area.classList.add('on');
    c.hidden = false;
    paint();
    measure();
    score = 0;
    shots = SHOTS;
    state = 'ready';
    Object.assign(pocket, { x: 0, y: 0, vx: 0, vy: 0 });
    place();
    hud();
    say.textContent = 'Pull the ball back and let go.';
    say.hidden = false;
    area.focus({ preventScroll: true });
    wake();
  }
  function stop() {
    if (state === 'aim') cancel();
    state = 'off';
    cancelAnimationFrame(raf);
    raf = 0;
    bugs = [];
    pops = [];
    trail.length = 0;
    g.clearRect(0, 0, W, H);
    c.hidden = true;
    area.classList.remove('on');
    $('[data-play]').focus({ preventScroll: true });
  }
  $('[data-quit]').addEventListener('click', stop);
  return { start };
}

let game: ReturnType<typeof make> | null = null;
export const sling = (area: HTMLElement) => (game ??= make(area)).start();
