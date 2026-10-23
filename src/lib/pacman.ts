// Pac-Man for the contribution map: he visits every day that has contributions, in order, turning corners
// along the grid like the arcade maze, and eats it. Quiet days are left alone. Runs on the map's own SVG,
// so the dots he eats are the real days.
import type { Day } from './github';
import { sfx } from './sfx';

const NS = 'http://www.w3.org/2000/svg';
const SPEED = 110; // map units per second, about nine days' worth of grid
const LONGEST = 30_000; // a very busy year speeds up rather than run past half a minute

// Facing right with the mouth open by `a` radians either side.
const body = (a: number, r = 5.6) =>
  `M0 0 L${(r * Math.cos(a)).toFixed(2)} ${(r * Math.sin(a)).toFixed(2)} A${r} ${r} 0 1 1 ${(r * Math.cos(a)).toFixed(2)} ${(-r * Math.sin(a)).toFixed(2)}Z`;

interface Stop {
  x: number;
  y: number;
  at: number; // distance along the path
  dot?: SVGCircleElement;
  n?: number;
}

export function pacman(svg: SVGSVGElement, days: Day[], onScore: (score: number) => void): Promise<{ score: number; ms: number }> {
  const dots = [...svg.querySelectorAll<SVGCircleElement>('circle[data-i]')]
    .map((c) => ({ c, i: Number(c.dataset.i), x: +c.getAttribute('cx')!, y: +c.getAttribute('cy')! }))
    .filter((d) => (days[d.i]?.n ?? 0) > 0)
    .sort((a, b) => a.i - b.i);
  if (!dots.length) return Promise.resolve({ score: 0, ms: 0 });

  // He walks along the row to the next day's week, then up or down the week to it.
  const stops: Stop[] = [{ x: dots[0].x - 14, y: dots[0].y, at: 0 }];
  const go = (x: number, y: number, d?: (typeof dots)[number]) => {
    const p = stops.at(-1)!;
    const len = Math.abs(x - p.x) + Math.abs(y - p.y);
    if (len || d) stops.push({ x, y, at: p.at + len, dot: d?.c, n: d ? days[d.i].n : undefined });
  };
  for (const d of dots) {
    go(d.x, stops.at(-1)!.y);
    go(d.x, d.y, d);
  }
  const total = stops.at(-1)!.at;
  const speed = Math.max(SPEED, (total / LONGEST) * 1000);

  const pac = el('g', { class: 'pac', 'pointer-events': 'none' });
  const mouth = el('path', { fill: '#ffd21f', d: body(0.6) });
  pac.append(mouth);
  svg.append(pac);

  let next = 1;
  let score = 0;
  let deg = 0;
  let bit = -1e9; // last chomp sound, so a dense stretch doesn't buzz
  return new Promise((resolve) => {
    const t0 = performance.now();
    const frame = (now: number) => {
      const t = now - t0;
      const dist = Math.min(total, (t / 1000) * speed);
      while (next < stops.length && stops[next].at <= dist) {
        const s = stops[next++];
        if (s.dot) {
          s.dot.classList.add('eaten');
          score += s.n!;
          onScore(score);
          if (t - bit > 120) (sfx.chomp(), (bit = t));
        }
      }
      const a = stops[Math.max(0, next - 1)];
      const b = stops[Math.min(next, stops.length - 1)];
      const f = b.at > a.at ? (dist - a.at) / (b.at - a.at) : 1;
      if (b.x !== a.x || b.y !== a.y) deg = (Math.atan2(Math.sign(b.y - a.y), Math.sign(b.x - a.x)) * 180) / Math.PI;
      pac.setAttribute('transform', `translate(${a.x + (b.x - a.x) * f} ${a.y + (b.y - a.y) * f}) rotate(${deg})`);
      mouth.setAttribute('d', body(0.08 + 0.55 * Math.abs(Math.sin(t / 110))));
      if (dist < total) return requestAnimationFrame(frame);
      // Board cleared: the days grow back.
      setTimeout(() => {
        pac.remove();
        dots.forEach((d) => d.c.classList.remove('eaten'));
        resolve({ score, ms: t });
      }, 600);
    };
    requestAnimationFrame(frame);
  });
}

function el(tag: string, attrs: Record<string, string>) {
  const n = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  return n;
}
