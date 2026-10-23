// Health checks for the live demos, run by the /api/status Vercel Function and once at build time.
// Each check is one GET with a timeout, timed from the server.

export interface Target {
  id: string;
  title: string;
  url: string; // what gets checked: the backend's health route, or the site itself
  live?: string; // what a visitor opens
}
/**
 * up: answered. asleep: a free Render service that is still booting (the check itself starts the boot).
 * suspended: turned off by its owner. down: errored or unreachable.
 */
export type State = 'up' | 'asleep' | 'suspended' | 'down';
export interface Result {
  id: string;
  state: State;
  ms?: number;
  code?: number;
}
export interface StatusData {
  services: Result[];
  at: string;
}

// Keep every check well inside a serverless function's 10 s limit.
const TIMEOUT = 7000;

export const sleepy = (url: string) => new URL(url).hostname.endsWith('.onrender.com');

async function check(t: Target): Promise<Result> {
  const t0 = performance.now();
  try {
    const res = await fetch(t.url, {
      redirect: 'follow',
      signal: AbortSignal.timeout(TIMEOUT),
      headers: { 'User-Agent': 'devjhawar.com status check' },
    });
    const ms = Math.round(performance.now() - t0);
    await res.body?.cancel();
    if (res.ok) return { id: t.id, state: 'up', ms, code: res.status };
    if (res.headers.get('x-render-routing')?.includes('suspend')) return { id: t.id, state: 'suspended', code: res.status };
    return { id: t.id, state: 'down', ms, code: res.status };
  } catch (e) {
    const timedOut = (e as Error).name === 'TimeoutError';
    return { id: t.id, state: timedOut && sleepy(t.url) ? 'asleep' : 'down' };
  }
}

export async function checkAll(targets: Target[]): Promise<StatusData> {
  return { services: await Promise.all(targets.map(check)), at: new Date().toISOString() };
}
