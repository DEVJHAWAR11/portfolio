// Browser side of the status checks: fetch them once per page, and wake a sleeping server on request.
import type { Result, StatusData } from './health';

async function get(url: string): Promise<StatusData> {
  const res = await fetch(url);
  if (!res.ok || !res.headers.get('content-type')?.includes('json')) throw new Error(String(res.status));
  return res.json();
}

let pending: Promise<(StatusData & { fallback?: boolean }) | null> | undefined;
/** Live results from /api/status, or the build-time snapshot when the function isn't there (local preview). */
export function loadStatus() {
  pending ??= get('/api/status')
    .catch(() => get('/status-snapshot.json').then((d) => ({ ...d, fallback: true })))
    .catch(() => null);
  return pending;
}

export const ago = (iso: string) => {
  const min = Math.round((Date.now() - Date.parse(iso)) / 6e4);
  return min < 1 ? 'just now' : min < 60 ? `${min} min ago` : min < 2880 ? `${Math.round(min / 60)} h ago` : `${Math.round(min / 1440)} days ago`;
};

export function describe(r: Result): string {
  switch (r.state) {
    case 'up':
      return `Up, answered in ${r.ms} ms`;
    case 'asleep':
      return 'Asleep on a free server';
    case 'suspended':
      return 'Offline, switched off for now';
    default:
      return r.code ? `Down, HTTP ${r.code}` : 'Down, not reachable';
  }
}

/**
 * Sends one request from this browser and times how long the server takes to answer.
 * The response is opaque (no-cors), so this only tells that it answered, which is all waking needs.
 */
export async function wake(url: string, tick: (s: number) => void): Promise<number | null> {
  const t0 = performance.now();
  const timer = setInterval(() => tick((performance.now() - t0) / 1000), 100);
  try {
    await fetch(url, { mode: 'no-cors', cache: 'no-store', signal: AbortSignal.timeout(90_000) });
    return (performance.now() - t0) / 1000;
  } catch {
    return null;
  } finally {
    clearInterval(timer);
  }
}
