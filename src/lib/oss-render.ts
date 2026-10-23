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

export const total = (days: Day[]) => days.reduce((n, d) => n + d.n, 0);

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

// PRs grouped by repo, busiest-recent repo first. Each repo is a short line of stops, one per PR:
// filled when merged, hollow while in review, crossed out when closed.
const days = (a: string, b: string) => Math.max(0, Math.round((Date.parse(b) - Date.parse(a)) / 864e5));
const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? '' : 's'}`;

// Repos under this many stars go in the "smaller repos" fold.
const BIG = 30;
const kstars = (n: number) => (n < 1000 ? String(n) : `${(n / 1000).toFixed(n < 10_000 ? 1 : 0).replace(/.0$/, '')}k`);

/** PR cards grouped by repo, biggest repos first; the small ones fold away under a disclosure. */
export function prGroups(prs: PR[]): string {
  const repos = new Map<string, PR[]>();
  prs.forEach((p) => repos.set(p.repo, [...(repos.get(p.repo) ?? []), p]));
  const sorted = [...repos].sort(([, a], [, b]) => (b[0].stars ?? 0) - (a[0].stars ?? 0));
  const big = sorted.filter(([, l]) => (l[0].stars ?? 0) >= BIG);
  const small = sorted.filter(([, l]) => (l[0].stars ?? 0) < BIG);
  // Without star counts (an old snapshot) there's nothing to rank by, so everything stays open.
  const fold = big.length > 0 && small.length > 0;
  const cards = (list: typeof sorted) => list.map(([repo, l]) => card(repo, l)).join('');
  if (!fold) return `<ul class="prs">${cards(sorted)}</ul>`;
  return `<ul class="prs">${cards(big)}</ul>
<details class="more" data-more>
  <summary class="mono">${plural(small.length, 'smaller repo')}<span>${small.map(([r]) => esc(r.split('/')[1])).join(', ')}</span></summary>
  <ul class="prs">${cards(small)}</ul>
</details>`;
}

function card(repo: string, list: PR[]): string {
  const [org, name] = repo.split('/');
  const merged = list.filter((p) => p.state === 'merged').length;
  const open = list.filter((p) => p.state === 'open').length;
  const closed = list.length - merged - open;
  const tally = [merged && `${merged} merged`, open && `${open} in review`, closed && `${closed} closed`].filter(Boolean).join(', ');
  const bar = [
    ['ok', merged],
    ['pend', open],
    ['fail', closed],
  ]
    .filter(([, n]) => n)
    .map(([c, n]) => `<i class="${c}" style="flex:${n}"></i>`)
    .join('');
  const rows = list
    .map((p) => {
      const when =
        p.state === 'merged' && p.closed
          ? ((n) => (n === 0 ? 'merged the same day' : `merged in ${plural(n, 'day')}`))(days(p.created, p.closed))
          : p.state === 'closed'
            ? 'closed'
            : 'in review';
      return `<li data-state="${p.state}"><a href="${esc(p.url)}" target="_blank" rel="noopener"><i class="stop" aria-hidden="true"></i><span class="t">${esc(p.title)}</span><span class="mono m"><span class="num">#${p.number}</span> ${when}</span></a></li>`;
    })
    .join('');
  return `<li class="repo" data-repo>
  <div class="rh">
    <img src="https://github.com/${esc(org)}.png?size=64" alt="" width="30" height="30" loading="lazy" decoding="async">
    <a class="mono name" href="https://github.com/${esc(repo)}" target="_blank" rel="noopener"><span>${esc(org)}/</span>${esc(name)}</a>${
      list[0].stars != null ? `<span class="mono stars" title="${list[0].stars.toLocaleString('en-IN')} stars on GitHub">★ ${kstars(list[0].stars)}</span>` : ''
    }
    <span class="tally"><span class="bar" aria-hidden="true">${bar}</span><span class="mono">${tally}</span></span>
  </div>
  <ol class="track">${rows}</ol>
</li>`;
}
