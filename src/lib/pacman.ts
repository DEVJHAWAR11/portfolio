// Pac-Man for the contribution map: he snakes down one week and up the next, eating every day,
// with two ghosts following a little behind. Runs on the map's own SVG, so the dots he eats are the real days.
import type { Day } from './github';

const NS = 'http://www.w3.org/2000/svg';
const SPEED = 55; // days per second
const GHOSTS = [
  { color: '#ff4f4f', lag: 12 },
  { color: '#ff9fe0', lag: 22 },
];

const el = (tag: string, attrs: Record<string, string | number>) => {
  const n = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, String(v));
  return n;
};

// Facing right with the mouth open by `a` radians either side.
const body = (a: number, r = 5.6) =>
  `M0 0 L${(r * Math.cos(a)).toFixed(2)} ${(r * Math.sin(a)).toFixed(2)} A${r} ${r} 0 1 1 ${(r * Math.cos(a)).toFixed(2)} ${(-r * Math.sin(a)).toFixed(2)}Z`;

function ghost(color: string) {
  const g = el('g', { class: 'ghost' });
  g.append(
    el('path', { d: 'M-5.4 5.4V-0.6A5.4 5.4 0 0 1 5.4 -0.6V5.4L3.6 3.7 1.8 5.4 0 3.7 -1.8 5.4 -3.6 3.7Z', fill: color }),
    el('circle', { cx: -2, cy: -1, r: 1.7, fill: '#fff' }),
    el('circle', { cx: 2, cy: -1, r: 1.7, fill: '#fff' }),
  );
  const eyes = [el('circle', { cx: -2, cy: -1, r: 0.9, fill: '#1b2a8f' }), el('circle', { cx: 2, cy: -1, r: 0.9, fill: '#1b2a8f' })];
  g.append(...eyes);
  return { g, eyes };
}

export function pacman(svg: SVGSVGElement, days: Day[], onScore: (score: number) => void): Promise<{ score: number; ms: number }> {
  // The route: every day in order, down even weeks and up odd ones.
  const weeks = new Map<number, SVGCircleElement[]>();
  svg.querySelectorAll<SVGCircleElement>('circle[data-i]').forEach((c) => {
    const w = Number(c.dataset.w);
    weeks.set(w, [...(weeks.get(w) ?? []), c]);
  });
  const route = [...weeks.keys()]
    .sort((a, b) => a - b)
    .flatMap((w) => {
      const col = weeks.get(w)!.sort((a, b) => +a.getAttribute('cy')! - +b.getAttribute('cy')!);
      return w % 2 ? col.reverse() : col;
    })
    .map((c) => ({ c, x: +c.getAttribute('cx')!, y: +c.getAttribute('cy')!, n: days[Number(c.dataset.i)]?.n ?? 0 }));
  if (route.length < 2) return Promise.resolve({ score: 0, ms: 0 });

  const layer = el('g', { class: 'arcade', 'pointer-events': 'none' });
  const pac = el('g', { class: 'pac' });
  const mouth = el('path', { fill: '#ffd21f', d: body(0.6) });
  pac.append(mouth);
  const ghosts = GHOSTS.map((g) => ({ ...g, ...ghost(g.color) }));
  ghosts.forEach((g) => (g.g.style.opacity = '0'));
  layer.append(...ghosts.map((g) => g.g), pac);
  svg.append(layer);

  // Position along the route, `p` days in, plus the direction of travel there.
  const at = (p: number) => {
    const i = Math.min(Math.floor(p), route.length - 2);
    const f = Math.min(1, p - i);
    const a = route[i];
    const b = route[i + 1];
    return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f, dx: Math.sign(b.x - a.x), dy: Math.sign(b.y - a.y) };
  };

  let eaten = 0;
  let score = 0;
  const end = route.length - 1;
  return new Promise((resolve) => {
    const t0 = performance.now();
    const frame = (now: number) => {
      const t = now - t0;
      const p = Math.min(end, (t / 1000) * SPEED);
      while (eaten <= Math.round(p) && eaten <= end) {
        route[eaten].c.classList.add('eaten');
        score += route[eaten].n;
        eaten++;
        onScore(score);
      }
      const s = at(p);
      const deg = (Math.atan2(s.dy, s.dx) * 180) / Math.PI;
      pac.setAttribute('transform', `translate(${s.x} ${s.y}) rotate(${deg})`);
      mouth.setAttribute('d', body(0.08 + 0.55 * Math.abs(Math.sin(t / 70))));
      for (const g of ghosts) {
        const q = p - g.lag;
        g.g.style.opacity = q < 0 ? '0' : '1';
        const gs = at(Math.max(0, q));
        g.g.setAttribute('transform', `translate(${gs.x} ${gs.y})`);
        g.eyes.forEach((e, k) => {
          e.setAttribute('cx', String((k ? 2 : -2) + gs.dx * 0.8));
          e.setAttribute('cy', String(-1 + gs.dy * 0.8));
        });
      }
      if (p < end) return requestAnimationFrame(frame);
      // Board cleared: the ghosts give up, and the days grow back.
      setTimeout(() => {
        layer.remove();
        route.forEach((r) => r.c.classList.remove('eaten'));
        resolve({ score, ms: t });
      }, 500);
    };
    requestAnimationFrame(frame);
  });
}
