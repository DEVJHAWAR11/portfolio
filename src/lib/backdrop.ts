// The page's dot grid is never quite still: every so often a soft band of accent passes down the screen, like a
// health check going over every dot. It keeps to the empty paper. Dots under text, buttons and pictures are mapped
// out and never light, so nothing moves behind what you're reading. One fixed canvas behind everything, about
// 30 frames a second, paused while the tab is hidden, and off with reduced motion.
const GAP = 20; // matches the body's background-size, so these dots sit exactly on the printed ones
const HEADER = 60; // the fixed header covers this much of the top
const FPS = 30;
const PERIOD = 13; // seconds between passes
const BAND = 3; // rows lit either side of the band's centre
const PEAK = 0.45; // brightest a dot gets
// What counts as content: anything with words, a control, or a picture.
const CONTENT =
  'h1,h2,h3,h4,p,li,dt,dd,a,button,input,textarea,label,figure,img,svg,pre,table,blockquote,.chip,.tag,.note,[data-portrait]';

// Which grid dots sit under content, in page coordinates. Rebuilt when the layout changes, never while scrolling.
let cols = 0;
let rows = 0;
let blocked = new Uint8Array(0);
function free(i: number, j: number) {
  return i >= 0 && j >= 0 && i < cols && j < rows && !blocked[j * cols + i];
}
function mapContent() {
  const root = document.documentElement;
  cols = Math.ceil(root.scrollWidth / GAP);
  rows = Math.ceil(root.scrollHeight / GAP);
  blocked = new Uint8Array(cols * rows);
  const sx = scrollX;
  const sy = scrollY;
  for (const el of document.querySelectorAll(CONTENT)) {
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) continue;
    // A dot is covered if its centre falls within the element, plus a few pixels of breathing room.
    const i0 = Math.max(0, Math.floor((r.left + sx - 6 - GAP / 2) / GAP) + 1);
    const i1 = Math.min(cols - 1, Math.floor((r.right + sx + 6 - GAP / 2) / GAP));
    const j0 = Math.max(0, Math.floor((r.top + sy - 6 - GAP / 2) / GAP) + 1);
    const j1 = Math.min(rows - 1, Math.floor((r.bottom + sy + 6 - GAP / 2) / GAP));
    for (let j = j0; j <= j1; j++) blocked.fill(1, j * cols + i0, j * cols + i1 + 1);
  }
}

if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
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

  let color = '';
  const readColor = () => (color = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim());
  readColor();
  new MutationObserver(readColor).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme', 'data-accent'],
  });

  let remap = 0;
  const later = () => {
    clearTimeout(remap);
    remap = window.setTimeout(mapContent, 250);
  };
  mapContent();
  addEventListener('resize', () => (size(), later()));
  addEventListener('load', later);
  new ResizeObserver(later).observe(document.body);

  let last = 0;
  let raf = 0;
  const frame = (now: number) => {
    raf = requestAnimationFrame(frame);
    if (now - last < 1000 / FPS - 2) return;
    last = now;
    const sx = scrollX;
    const sy = scrollY;
    const i0 = Math.floor(sx / GAP);
    const i1 = Math.min(cols - 1, Math.ceil((sx + w) / GAP));
    const j0 = Math.floor((sy + HEADER) / GAP);
    const j1 = Math.min(rows - 1, Math.ceil((sy + h) / GAP));
    // The band starts above the screen and leaves below it, so each pass enters and exits softly.
    const c = j0 - BAND * 2 + (((now / 1000) % PERIOD) / PERIOD) * (j1 - j0 + BAND * 4);
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = color;
    for (let j = Math.max(j0, Math.floor(c - BAND)); j <= Math.min(j1, Math.ceil(c + BAND)); j++) {
      const d = Math.abs(j - c) / BAND;
      if (d >= 1) continue;
      const y = j * GAP + GAP / 2 - sy;
      if (y < HEADER) continue;
      for (let i = i0; i <= i1; i++) {
        if (!free(i, j)) continue;
        // A little fixed grain per dot, so the band reads as light on dots rather than a solid stripe.
        const k = (1 - d) ** 2 * PEAK * (0.55 + 0.45 * Math.abs(Math.sin(i * 12.9898 + j * 78.233)));
        if (k < 0.03) continue;
        ctx.globalAlpha = k;
        ctx.beginPath();
        ctx.arc(i * GAP + GAP / 2 - sx, y, 1 + 2.2 * k, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  };
  const run = () => {
    cancelAnimationFrame(raf);
    if (!document.hidden) raf = requestAnimationFrame(frame);
  };
  document.addEventListener('visibilitychange', run);
  run();
}
