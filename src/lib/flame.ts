// Sit still on the home page for a minute and your visit shows up as a small flame graph:
// the whole visit at the bottom, the sections you spent it in above that, and how much of each was
// moving around versus reading. It's a corner card, shown once, and scrolling, a key or a click away closes it.
import { unlock } from './eggs';
import { sections } from './sections';

const IDLE = 60;
const names: Record<string, string> = { hello: 'Intro', ...Object.fromEntries(sections.map((s) => [s.id, s.title])) };

const clock = (s: number) => (s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, '0')}s`);
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`);

export function watchVisit() {
  const els = [...document.querySelectorAll<HTMLElement>('main section[id]')].filter((el) => names[el.id]);
  if (!els.length) return;
  // Seconds per section: moving (some input in the last couple of seconds) and reading (none).
  const time = new Map(els.map((el) => [el.id, { moving: 0, reading: 0 }]));
  let last = Date.now();
  let idle = 0;
  let card: HTMLElement | null = null;
  let shown = false;

  const here = () => {
    const mid = innerHeight / 2;
    return els.find((el) => {
      const r = el.getBoundingClientRect();
      return r.top <= mid && r.bottom >= mid;
    })?.id;
  };

  const tick = window.setInterval(() => {
    if (document.visibilityState !== 'visible') return;
    idle++;
    const id = here();
    const t = id && time.get(id);
    if (t) Date.now() - last < 2000 ? t.moving++ : t.reading++;
    if (idle >= IDLE && !shown) show();
  }, 1000);

  const active = () => {
    last = Date.now();
    idle = 0;
  };
  for (const ev of ['pointermove', 'pointerdown', 'keydown', 'scroll', 'wheel', 'touchstart']) addEventListener(ev, active, { passive: true });

  function show() {
    shown = true;
    clearInterval(tick);
    const rows = els.map((el) => ({ id: el.id, ...time.get(el.id)! })).filter((r) => r.moving + r.reading > 0);
    const total = rows.reduce((n, r) => n + r.moving + r.reading, 0);
    if (!total) return;
    const pct = (n: number) => `${((n / total) * 100).toFixed(2)}%`;
    const bar = (cls: string, n: number, label: string, title: string) =>
      `<span class="${cls}" style="width:${pct(n)}" title="${esc(title)}">${n / total > 0.16 ? `<b>${esc(label)}</b>` : ''}</span>`;

    card = document.createElement('aside');
    card.className = 'flame';
    card.setAttribute('role', 'dialog');
    card.setAttribute('aria-label', 'Your visit as a flame graph');
    card.innerHTML = `<header class="mono"><span>Your visit, as a flame graph</span><button type="button" aria-label="Close">×</button></header>
<div class="graph" aria-hidden="true">
  <div class="row">${rows
    .map((r) => bar('sub mv', r.moving, 'moving', `${names[r.id]}: ${clock(r.moving)} scrolling`) + bar('sub rd', r.reading, 'reading', `${names[r.id]}: ${clock(r.reading)} reading`))
    .join('')}</div>
  <div class="row">${rows.map((r) => bar('sec', r.moving + r.reading, `${names[r.id]} ${clock(r.moving + r.reading)}`, `${names[r.id]}: ${clock(r.moving + r.reading)}`)).join('')}</div>
  <div class="row"><span class="root" style="width:100%"><b>visit ${clock(total)}</b></span></div>
</div>
<p class="sr-only">${rows.map((r) => `${names[r.id]}: ${clock(r.moving + r.reading)}`).join(', ')}.</p>
<p class="note">You've been still for a minute, so here's where your time went. Wider means longer.</p>`;
    document.body.append(card);
    requestAnimationFrame(() => card?.classList.add('show'));
    card.querySelector('button')!.addEventListener('click', hide);
    // Give the card a moment before input can close it, so the move that noticed it doesn't.
    setTimeout(() => {
      for (const ev of ['keydown', 'scroll', 'wheel']) addEventListener(ev, hide, { passive: true });
      addEventListener('pointerdown', away);
    }, 600);
    unlock('flame');
  }

  const away = (e: Event) => !card?.contains(e.target as Node) && hide();
  function hide() {
    for (const ev of ['keydown', 'scroll', 'wheel']) removeEventListener(ev, hide);
    removeEventListener('pointerdown', away);
    if (!card) return;
    const c = card;
    card = null;
    c.classList.remove('show');
    setTimeout(() => c.remove(), 250);
  }
}
