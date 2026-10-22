// Fresh GitHub data for the open source section, cached on Vercel's CDN for an hour.
// GITHUB_TOKEN, if set in the Vercel environment, stays here on the server.
import { fetchGitHub } from '../src/lib/github';

export async function GET() {
  try {
    return Response.json(await fetchGitHub(), {
      headers: { 'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400' },
    });
  } catch (e) {
    // The page keeps its build-time snapshot when this fails.
    return Response.json({ error: (e as Error).message }, { status: 502, headers: { 'Cache-Control': 'no-store' } });
  }
}
