// The hero portrait, redrawn on a canvas so it can move. Once a session its dots gather out of the page's dot grid,
// and after that they lean away from the cursor (or a tap on a phone), taking the accent colour while pushed.
// The CSS-mask copy underneath stays the fallback: no JS, reduced motion, or a failed fetch all show it as before.

const GRID = 20; // the body's background-size; its dots sit at 10px past every multiple of 20
const BUILD_MS = 1800;
const PAD = 0.1; // the canvas reaches this far past the box, so pushed and gathering dots aren't clipped
const REACH = 0.14; // cursor reach, as a share of the portrait's width
const KEY = 'portrait-built';
const TAU = Math.PI * 2;
const FILE = { light: '/halftone.svg', dark: '/halftone-dark.svg' };
type Theme = keyof typeof FILE;
const theme = (): Theme => (document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light');
// The SVG groups dots by size: <path stroke-width="<diameter>" d="M<cx> <cy>h0M...">. Returns [cx, cy, r] in
// viewBox units, sorted by position, so both themes' files list the same cells in the same order.
const dotsIn = (svg: string) => {
  const dots: number[][] = [];
  for (const [, width, d] of svg.matchAll(/stroke-width="([\d.]+)" d="([^"]+)"/g))
    for (const [, x, y] of d.matchAll(/M(\d+) (\d+)/g)) dots.push([Number(x), Number(y), Number(width) / 2]);
  return dots.sort((a, b) => a[1] - b[1] || a[0] - b[0]);
};

export async function livePortrait(el: HTMLElement) {
  const get = (url: string) =>
    fetch(url)
      .then((r) => (r.ok ? r.text() : ''))
      .catch(() => '');
  // Only the current theme's dots; the mask has usually fetched that file already. The other set loads on a switch.
  const first = theme();
  const svg = await get(FILE[first]);
  const view = Number(/viewBox="0 0 (\d+)/.exec(svg)?.[1]);
  const found = dotsIn(svg);
  if (!view || !found.length) {
    delete el.dataset.assemble;
    return;
  }

  // Dot positions and radii as shares of the box, so a resize only changes the scale.
  const n = found.length;
  const bx = new Float32Array(n);
  const by = new Float32Array(n);
  const br = new Float32Array(n);
  found.forEach(([x, y, r], i) => {
    bx[i] = x / view;
    by[i] = y / view;
    br[i] = r / view;
  });
  // Both themes' sets have the same cells in the same order, only the radii differ.
  const sets: Partial<Record<Theme, Float32Array>> = { [first]: br };
  const radiiFor = (t: Theme) => {
    if (sets[t]) return sets[t];
    sets[t] = br; // until it arrives
    get(FILE[t]).then((other) => {
      const m = dotsIn(other);
      if (m.length === n) sets[t] = Float32Array.from(m, (d) => d[2] / view);
      readColors();
      wake();
    });
    return br;
  };
  const ox = new Float32Array(n); // current push, in px
  const oy = new Float32Array(n);

  const canvas = document.createElement('canvas');
  canvas.className = 'live';
  canvas.setAttribute('aria-hidden', 'true');
  el.prepend(canvas);
  const ctx = canvas.getContext('2d')!;

  let size = 0;
  let pad = 0;
  const fit = () => {
    const dpr = Math.min(2, devicePixelRatio || 1);
    size = el.clientWidth;
    pad = size * PAD;
    canvas.width = (size + pad * 2) * dpr;
    canvas.height = (size + pad * 2) * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, pad * dpr, pad * dpr);
    wake();
  };

  let ink = '';
  let accent = '';
  let radii = br;
  const readColors = () => {
    radii = radiiFor(theme());
    const css = getComputedStyle(document.documentElement);
    ink = css.getPropertyValue('--fg').trim();
    accent = css.getPropertyValue('--accent').trim();
  };
  readColors();
  new MutationObserver(() => (readColors(), wake())).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme', 'data-accent'],
  });

  // The gathering: each dot starts on one of the page's printed grid dots near the box, faint and small like them,
  // and travels to its place. Rows near the top leave first, so the face settles from the hair down.
  let waiting = el.dataset.assemble !== undefined; // draw nothing until the gathering starts
  let build: { t0: number; sx: Float32Array; sy: Float32Array; at: Float32Array } | null = null;
  const startBuild = () => {
    const r = el.getBoundingClientRect();
    const left = r.left + scrollX;
    const top = r.top + scrollY;
    const span = size * (1 + PAD * 2);
    const snap = (page: number) => Math.round((page - 10) / GRID) * GRID + 10;
    const sx = new Float32Array(n);
    const sy = new Float32Array(n);
    const at = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      sx[i] = snap(left - pad + Math.random() * span) - left;
      sy[i] = snap(top - pad + Math.random() * span) - top;
      at[i] = by[i] * 0.45 + Math.random() * 0.15;
    }
    build = { t0: performance.now(), sx, sy, at };
    waiting = false;
    delete el.dataset.assemble;
    wake();
  };

  // A device that can't hold about 20 frames a second through the gathering, or needs over 12ms to draw one, skips to
  // the end of it rather than keep the page busy.
  let prev = 0;
  let slow = 0;
  let ptr: { x: number; y: number } | null = null;
  const BANDS = 6; // alpha steps while gathering, each drawn as one path
  const frame = (now: number) => {
    const began = performance.now();
    raf = 0;
    const s = size;
    const reach = s * REACH;
    let t = 1;
    if (build) {
      t = (now - build.t0) / BUILD_MS;
      if (prev && now - prev > 50) slow++;
      prev = now;
      if (t >= 1 || slow >= 3) {
        build = null;
        t = 1;
        try {
          sessionStorage.setItem(KEY, '1');
        } catch {}
      }
    }
    const plain = Array.from({ length: BANDS }, () => new Path2D());
    const hot = new Path2D();
    let moving = !!build;
    for (let i = 0; i < n; i++) {
      // Push: dots inside the reach lean straight away from the pointer, most at the centre, and spring back after.
      let tx = 0;
      let ty = 0;
      if (ptr) {
        const dx = bx[i] * s - ptr.x;
        const dy = by[i] * s - ptr.y;
        const d = Math.hypot(dx, dy);
        if (d < reach && d > 0.01) {
          const f = ((1 - d / reach) ** 2 * reach * 0.3) / d;
          tx = dx * f;
          ty = dy * f;
        }
      }
      const vx = (tx - ox[i]) * 0.2;
      const vy = (ty - oy[i]) * 0.2;
      ox[i] += vx;
      oy[i] += vy;
      if (Math.abs(vx) + Math.abs(vy) > 0.02) moving = true;

      let x = bx[i] * s + ox[i];
      let y = by[i] * s + oy[i];
      let r = radii[i] * s;
      let band = BANDS - 1;
      if (build) {
        const p = Math.min(1, Math.max(0, (t - build.at[i]) / 0.4));
        const e = 1 - (1 - p) ** 3;
        x = build.sx[i] + (x - build.sx[i]) * e;
        y = build.sy[i] + (y - build.sy[i]) * e;
        r = 1 + (r - 1) * e;
        band = Math.round(e * (BANDS - 1));
      }
      const path = Math.abs(ox[i]) + Math.abs(oy[i]) > 1.2 ? hot : plain[band];
      path.moveTo(x + r, y);
      path.arc(x, y, r, 0, TAU);
    }
    ctx.clearRect(-pad, -pad, s + pad * 2, s + pad * 2);
    ctx.fillStyle = ink;
    plain.forEach((p, b) => {
      ctx.globalAlpha = 0.18 + (0.82 * b) / (BANDS - 1);
      ctx.fill(p);
    });
    ctx.globalAlpha = 1;
    ctx.fillStyle = accent;
    ctx.fill(hot);
    if (build && performance.now() - began > 12) slow++;
    if (moving) wake();
  };
  let raf = 0;
  function wake() {
    if (!raf && size && !waiting) raf = requestAnimationFrame(frame);
  }

  new ResizeObserver(fit).observe(el);
  el.classList.add('live');

  const local = (e: { clientX: number; clientY: number }) => {
    const r = el.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  if (matchMedia('(hover: hover)').matches) {
    el.addEventListener('pointermove', (e) => ((ptr = local(e)), wake()));
    el.addEventListener('pointerleave', () => ((ptr = null), wake()));
  } else {
    // On a phone a tap pushes the dots away for a moment. Only taps, so scrolling over the photo works as usual.
    let lift = 0;
    el.addEventListener('click', (e) => {
      ptr = local(e);
      wake();
      clearTimeout(lift);
      lift = window.setTimeout(() => ((ptr = null), wake()), 650);
    });
  }

  if (waiting) {
    // The intro (Intro.astro) covers the page first; gather as it lifts.
    if (document.documentElement.dataset.intro === '')
      await new Promise((go) => {
        document.documentElement.addEventListener('intro-done', go, { once: true });
        setTimeout(go, 5000);
      });
    // Wait until the portrait is on screen, in case the page loaded scrolled down.
    const io = new IntersectionObserver((entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      io.disconnect();
      requestAnimationFrame(startBuild);
    });
    io.observe(el);
  }
}
