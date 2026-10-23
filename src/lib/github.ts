// GitHub data, fetched at build time and by the /api/github Vercel Function.
// The token is optional, read from the server environment only, and never reaches the browser.
// Imports here stay relative so the function bundler can follow them without the @/ alias.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import profile from '../data/profile.json' with { type: 'json' };

export type PRState = 'merged' | 'open' | 'closed';
export interface PR {
  repo: string;
  number: number;
  title: string;
  url: string;
  state: PRState;
  created: string;
  closed?: string; // merged or closed date
}
/** One day of the contribution calendar: date, count and GitHub's 0-4 level. */
export interface Day {
  d: string;
  n: number;
  l: number;
}
/** One view of the calendar: the past 12 months, or a calendar year. */
export interface Cal {
  id: string;
  label: string;
  days: Day[];
}
export interface GitHubData {
  prs: PR[];
  cals: Cal[];
  at: string; // when this was fetched
}

const user = profile.github;
const headers = (): Record<string, string> => {
  const token = process.env.GITHUB_TOKEN;
  return {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'devjhawar.com',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

async function fetchPRs(retry = true): Promise<PR[]> {
  const q = encodeURIComponent(`author:${user} type:pr -user:${user}`);
  const res = await fetch(`https://api.github.com/search/issues?q=${q}&per_page=100&sort=created&order=desc`, { headers: headers() });
  // Search allows only 10 calls a minute without a token. If the limit resets soon, wait for it once.
  const reset = Number(res.headers.get('x-ratelimit-reset')) * 1000 - Date.now();
  if ((res.status === 403 || res.status === 429) && retry && reset < 65_000) {
    await new Promise((r) => setTimeout(r, Math.max(reset, 0) + 1000));
    return fetchPRs(false);
  }
  if (!res.ok) throw new Error(`PR search ${res.status}`);
  const json = (await res.json()) as { items: any[] };
  return json.items.map((i) => ({
    repo: i.repository_url.split('/repos/')[1],
    number: i.number,
    title: i.title,
    url: i.html_url,
    state: i.pull_request?.merged_at ? 'merged' : i.state === 'open' ? 'open' : 'closed',
    created: i.created_at,
    ...(i.closed_at ? { closed: i.closed_at } : {}),
  }));
}

// With a token the GraphQL API gives exact counts; without one, the public calendar page has the same data.
// No dates means the past 12 months.
async function fetchDays(from?: string, to?: string): Promise<Day[]> {
  if (process.env.GITHUB_TOKEN) {
    const query = `query($u:String!,$f:DateTime,$t:DateTime){user(login:$u){contributionsCollection(from:$f,to:$t){contributionCalendar{weeks{contributionDays{date contributionCount contributionLevel}}}}}}`;
    const res = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ query, variables: { u: user, f: from && `${from}T00:00:00Z`, t: to && `${to}T23:59:59Z` } }),
    });
    if (!res.ok) throw new Error(`GraphQL ${res.status}`);
    const json = (await res.json()) as any;
    const levels = ['NONE', 'FIRST_QUARTILE', 'SECOND_QUARTILE', 'THIRD_QUARTILE', 'FOURTH_QUARTILE'];
    return json.data.user.contributionsCollection.contributionCalendar.weeks.flatMap((w: any) =>
      w.contributionDays.map((c: any) => ({ d: c.date, n: c.contributionCount, l: levels.indexOf(c.contributionLevel) })),
    );
  }
  const range = from ? `?from=${from}&to=${to}` : '';
  const res = await fetch(`https://github.com/users/${user}/contributions${range}`, { headers: { 'User-Agent': 'devjhawar.com' } });
  if (!res.ok) throw new Error(`calendar ${res.status}`);
  const html = await res.text();
  // Counts live in tooltips linked to each day cell by id.
  const counts = new Map<string, number>();
  for (const m of html.matchAll(/<tool-tip[^>]*\bfor="([^"]+)"[^>]*>([^<]*)</g)) {
    counts.set(m[1], Number(m[2].match(/^(\d+)/)?.[1] ?? 0));
  }
  const days: Day[] = [];
  for (const m of html.matchAll(/<td[^>]*\bdata-date="[^"]+"[^>]*>/g)) {
    const attr = (k: string) => m[0].match(new RegExp(`\\b${k}="([^"]*)"`))?.[1] ?? '';
    days.push({ d: attr('data-date'), n: counts.get(attr('id')) ?? 0, l: Number(attr('data-level')) || 0 });
  }
  if (!days.length) throw new Error('calendar markup changed');
  return days.sort((a, b) => a.d.localeCompare(b.d));
}

// The past 12 months, then each calendar year back to when the account started.
// Days after today are dropped, and so are years with almost nothing in them.
async function fetchCals(): Promise<Cal[]> {
  const today = new Date(Date.now() + 5.5 * 36e5).toISOString().slice(0, 10); // IST
  const now = Number(today.slice(0, 4));
  const years = Array.from({ length: now - profile.githubSince + 1 }, (_, i) => now - i);
  const [past, ...rest] = await Promise.all([fetchDays(), ...years.map((y) => fetchDays(`${y}-01-01`, `${y}-12-31`))]);
  const upToToday = (days: Day[]) => days.filter((d) => d.d <= today);
  return [
    { id: 'past', label: 'Past year', days: upToToday(past) },
    ...years.map((y, i) => ({ id: String(y), label: String(y), days: upToToday(rest[i]) })),
  ].filter((c, i) => i === 0 || c.days.reduce((n, d) => n + d.n, 0) >= 10);
}

/** Fresh data, or an error. The Vercel Function uses this, so a failed fetch never replaces good data. */
export async function fetchGitHub(): Promise<GitHubData> {
  const [prs, cals] = await Promise.all([fetchPRs(false), fetchCals()]); // no waiting inside a function
  return { prs, cals, at: new Date().toISOString() };
}

// The last good result is kept on disk, so a failed fetch during a build reuses it instead of showing nothing.
// It lives in node_modules/.cache, which survives local rebuilds and, when the host restores its build cache, deploys too.
const SNAPSHOT = 'node_modules/.cache/devjhawar/github.json';
const load = (): Partial<GitHubData> => {
  try {
    return JSON.parse(readFileSync(SNAPSHOT, 'utf8'));
  } catch {
    return {};
  }
};
const fallback = <T>(what: string, old: T | undefined, empty: T) => (e: Error) => {
  console.warn(`[github] ${what} fetch failed (${e.message}), ${old ? 'using the last good copy' : 'rendering without it'}`);
  return old ?? empty;
};

// Fetched once per build and shared by every page that needs it.
let cached: Promise<GitHubData> | undefined;
export function getGitHub(): Promise<GitHubData> {
  cached ??= (async () => {
    const old = load();
    const [prs, cals] = await Promise.all([
      fetchPRs().catch(fallback('PR', old.prs, [] as PR[])),
      fetchCals().catch(fallback('calendar', old.cals, [] as Cal[])),
    ]);
    const data = { prs, cals, at: new Date().toISOString() };
    try {
      mkdirSync('node_modules/.cache/devjhawar', { recursive: true });
      writeFileSync(SNAPSHOT, JSON.stringify(data));
    } catch {}
    return data;
  })();
  return cached;
}

export const getPRs = () => getGitHub().then((g) => g.prs);
