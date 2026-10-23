// Live health of every demo, cached on Vercel's CDN for five minutes so visits don't each wake a server.
import { checkAll, type Target } from '../src/lib/health';

export async function GET(req: Request) {
  try {
    const res = await fetch(new URL('/status-targets.json', req.url));
    if (!res.ok) throw new Error(`targets ${res.status}`);
    const data = await checkAll((await res.json()) as Target[]);
    return Response.json(data, {
      headers: { 'Cache-Control': 'public, max-age=0, s-maxage=300, stale-while-revalidate=600' },
    });
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 502, headers: { 'Cache-Control': 'no-store' } });
  }
}
