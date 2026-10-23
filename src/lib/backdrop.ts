// The page's dot grid wakes up around the pointer, and a click sends a ripple through it.
// Drawn on one fixed canvas behind everything, only while something is moving. Mouse and trackpad only,
// and off for anyone who prefers reduced motion.
const GAP = 20; // matches the body's background-size, so these dots sit exactly on the printed ones
const GLOW = 150;
const RING = 36;
const RIPPLE_MS = 1100;
const RIPPLE_R = 520;

if (matchMedia('(pointer: fine)').matches && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;z-index:-1;pointer-events:none';
  document.body.prepend(canvas);
  const ctx = canvas.getContext('2d')!;

  let w = 0;
  let h = 0;
  const size = () => {
    const dpr = Math.min(2, devicePixelRatio || 1);
    w = innerWidth;
    h = innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  size();
  addEventListener('resize', () => (size(), wake()));

  let color = '';
  const readColor = () => (color = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim());
  readColor();
  new MutationObserver(() => (readColor(), wake())).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  const ptr = { x: -1e4, y: -1e4, in: false };
  let glow = 0;
  const ripples: { x: number; y: number; t0: number }[] = []; // page coordinates, so they scroll with the dots

  // Each dot within reach gets the strongest of the glow and any ripple passing over it.
  function draw(now: number) {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = color;
    const sx = scrollX;
    const sy = scrollY;
    const live = ripples.map((r) => ({ x: r.x - sx, y: r.y - sy, rad: ((now - r.t0) / RIPPLE_MS) * RIPPLE_R, fade: 1 - (now - r.t0) / RIPPLE_MS }));
    const areas = [
      glow > 0.01 && { x: ptr.x, y: ptr.y, reach: GLOW },
      ...live.map((r) => ({ x: r.x, y: r.y, reach: r.rad + RING })),
    ].filter(Boolean) as { x: number; y: number; reach: number }[];
    const seen = new Set<number>();
    for (const a of areas) {
      const i0 = Math.floor((a.x - a.reach + sx) / GAP);
      const i1 = Math.ceil((a.x + a.reach + sx) / GAP);
      const j0 = Math.floor((a.y - a.reach + sy) / GAP);
      const j1 = Math.ceil((a.y + a.reach + sy) / GAP);
      for (let i = i0; i <= i1; i++) {
        for (let j = j0; j <= j1; j++) {
          const key = i * 100003 + j;
          if (seen.has(key)) continue;
          const x = i * GAP + GAP / 2 - sx;
          const y = j * GAP + GAP / 2 - sy;
          if (x < -4 || y < -4 || x > w + 4 || y > h + 4) continue;
          let k = 0;
          const dg = Math.hypot(x - ptr.x, y - ptr.y);
          if (dg < GLOW) k = (1 - dg / GLOW) ** 2 * glow;
          for (const r of live) {
            const off = Math.abs(Math.hypot(x - r.x, y - r.y) - r.rad);
            if (off < RING) k = Math.max(k, (1 - off / RING) * r.fade * 0.9);
          }
          if (k < 0.03) continue;
          seen.add(key);
          ctx.globalAlpha = Math.min(1, k);
          ctx.beginPath();
          ctx.arc(x, y, 1 + 2.4 * k, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
    ctx.globalAlpha = 1;
  }

  let running = false;
  function tick(now: number) {
    glow += ((ptr.in ? 1 : 0) - glow) * 0.12;
    while (ripples.length && now - ripples[0].t0 > RIPPLE_MS) ripples.shift();
    draw(now);
    if (ptr.in || glow > 0.01 || ripples.length) requestAnimationFrame(tick);
    else {
      running = false;
      ctx.clearRect(0, 0, w, h);
    }
  }
  function wake() {
    if (running) return;
    running = true;
    requestAnimationFrame(tick);
  }

  addEventListener(
    'pointermove',
    (e) => {
      if (e.pointerType !== 'mouse' && e.pointerType !== 'pen') return;
      ptr.x = e.clientX;
      ptr.y = e.clientY;
      ptr.in = true;
      wake();
    },
    { passive: true },
  );
  document.addEventListener('mouseout', (e) => !e.relatedTarget && (ptr.in = false));
  addEventListener('blur', () => (ptr.in = false));
  addEventListener('scroll', () => ptr.in && wake(), { passive: true });
  addEventListener('pointerdown', (e) => {
    if (ripples.length > 4) ripples.shift();
    ripples.push({ x: e.clientX + scrollX, y: e.clientY + scrollY, t0: performance.now() });
    wake();
  });
}
