// Markup for the contribution map and the PR list, as plain strings.
// The page renders them at build time, and the browser re-renders them if /api/github has newer data.
import type { Cal, Day, PR } from './github';

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => `&${{ '&': 'amp', '<': 'lt', '>': 'gt', '"': 'quot' }[c]};`);
const MONTHS = 'Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec'.split(' ');
const date = (iso: string) => {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
};

// One cell per day. A busier day gets a bigger dot, like the halftone portrait at the top of the page.
// Quiet days stay as small specks so the active ones carry the picture.
const CELL = 12;
const LEFT = 28;
const TOP = 16;
const R = [1, 3.4, 4.2, 4.9, 5.6];

export function heatmap(days: Day[], label = 'the past year'): string {
  if (!days.length) return '';
  const lead = new Date(`${days[0].d}T00:00:00Z`).getUTCDay();
  const weeks = Math.ceil((days.length + lead) / 7);
  const w = LEFT + weeks * CELL;
  const h = TOP + 7 * CELL;
  const dots: string[] = [];
  const months: string[] = [];
  let lastLabel = -3;
  days.forEach((day, i) => {
    const wk = Math.floor((i + lead) / 7);
    const dow = (i + lead) % 7;
    dots.push(
      `<circle data-i="${i}" data-w="${wk}" class="l${day.l}" cx="${LEFT + wk * CELL + CELL / 2}" cy="${TOP + dow * CELL + CELL / 2}" r="${R[day.l] ?? R[0]}"/>`,
    );
    if (day.d.endsWith('-01') && wk - lastLabel >= 3) {
      months.push(`<text x="${LEFT + wk * CELL}" y="10">${MONTHS[Number(day.d.slice(5, 7)) - 1]}</text>`);
      lastLabel = wk;
    }
  });
  const rows = [
    [1, 'Mon'],
    [3, 'Wed'],
    [5, 'Fri'],
  ]
    .map(([r, t]) => `<text x="0" y="${TOP + (r as number) * CELL + 9}">${t}</text>`)
    .join('');
  return `<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="Contributions per day in ${esc(label)}">${months.join('')}${rows}${dots.join('')}</svg>`;
}

export interface Stats {
  total: number;
  longest: number;
  current: number;
  best?: Day;
  active: number;
}

export const total = (days: Day[]) => days.reduce((n, d) => n + d.n, 0);

export function stats(days: Day[]): Stats {
  let run = 0;
  let longest = 0;
  let best: Day | undefined;
  for (const d of days) {
    run = d.n > 0 ? run + 1 : 0;
    longest = Math.max(longest, run);
    if (!best || d.n > best.n) best = d;
  }
  // Today may simply not have a commit yet, so the current streak can end yesterday.
  let i = days.length - 1;
  if (i >= 0 && days[i].n === 0) i--;
  let current = 0;
  while (i >= 0 && days[i].n > 0) {
    current++;
    i--;
  }
  return { total: total(days), longest, current, best: best?.n ? best : undefined, active: days.filter((d) => d.n > 0).length };
}

function busiestMonth(days: Day[]) {
  const by = new Map<string, number>();
  days.forEach((d) => by.set(d.d.slice(0, 7), (by.get(d.d.slice(0, 7)) ?? 0) + d.n));
  const [m, n] = [...by].sort((a, b) => b[1] - a[1])[0] ?? ['', 0];
  return n ? `${MONTHS[Number(m.slice(5)) - 1]}, ${n}` : 'none';
}

// A finished year has no current streak, so it shows its busiest month instead.
export function statsList(days: Day[], live = true): string {
  const s = stats(days);
  const n = (v: number, unit: string) => `${v} ${unit}${v === 1 ? '' : 's'}`;
  return [
    ['Contributions', `<span data-total>${s.total.toLocaleString('en-IN')}</span>`],
    ['Active days', `${s.active} of ${days.length}`],
    ['Longest streak', n(s.longest, 'day')],
    live ? ['Current streak', n(s.current, 'day')] : ['Busiest month', busiestMonth(days)],
    ['Busiest day', s.best ? `${s.best.n} on ${date(s.best.d)}` : 'none yet'],
  ]
    .map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`)
    .join('');
}

/** Calendars packed small for the page: first date, one count per day, and the levels as a digit string. */
export const packCals = (cals: Cal[]) =>
  JSON.stringify(cals.map((c) => ({ id: c.id, label: c.label, s: c.days[0]?.d ?? '', n: c.days.map((d) => d.n), l: c.days.map((d) => d.l).join('') })));

export function unpackCals(json: string): Cal[] {
  return (JSON.parse(json) as { id: string; label: string; s: string; n: number[]; l: string }[]).map((c) => {
    const t0 = Date.parse(`${c.s}T00:00:00Z`);
    return { id: c.id, label: c.label, days: c.n.map((n, i) => ({ d: new Date(t0 + i * 864e5).toISOString().slice(0, 10), n, l: Number(c.l[i]) })) };
  });
}

export const dayLabel = (d: Day) => `${d.n === 0 ? 'No' : d.n} contribution${d.n === 1 ? '' : 's'} on ${date(d.d)}`;

// Each PR is drawn as a branch off main: merged ones join back in, open ones are still out, closed ones stop.
const BRANCH = {
  merged: 'M8 64 C8 46 26 48 26 32 C26 16 8 18 8 0',
  open: 'M8 64 C8 46 26 48 26 32',
  closed: 'M8 64 C8 46 26 48 26 32',
};

const days = (a: string, b: string) => Math.max(0, Math.round((Date.parse(b) - Date.parse(a)) / 864e5));

export function prRows(prs: PR[]): string {
  return prs
    .map((p) => {
      const owner = p.repo.split('/')[0];
      const when =
        p.state === 'merged' && p.closed
          ? ((n) => (n === 0 ? 'merged the same day' : `merged in ${n} day${n === 1 ? '' : 's'}`))(days(p.created, p.closed))
          : p.state === 'closed'
            ? 'closed without merging'
            : 'in review';
      return `<li data-state="${p.state}">
  <span class="graph" aria-hidden="true"><svg viewBox="0 0 36 64" preserveAspectRatio="none"><path class="main" d="M8 0V64"/><path class="br" d="${BRANCH[p.state]}"/></svg><i class="node"></i>${p.state === 'merged' ? '<i class="join"></i>' : ''}</span>
  <a href="${esc(p.url)}" target="_blank" rel="noopener">
    <img src="https://github.com/${esc(owner)}.png?size=64" alt="" width="32" height="32" loading="lazy" decoding="async">
    <span class="main"><span class="mono repo">${esc(p.repo)} <span class="num">#${p.number}</span> <span class="when">${when}</span></span><span class="title">${esc(p.title)}</span></span>
    <span class="side"><span class="state mono">${p.state}</span><span class="mono date">${date(p.created)}</span></span>
  </a>
</li>`;
    })
    .join('');
}
