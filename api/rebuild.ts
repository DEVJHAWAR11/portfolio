// Run once a day by a Vercel cron job: redeploys the site so new posts, PRs and contributions land in the static pages.
// Needs DEPLOY_HOOK_URL (Settings, Git, Deploy Hooks) and CRON_SECRET in the Vercel environment.
export async function GET(req: Request) {
  const { DEPLOY_HOOK_URL: hook, CRON_SECRET: secret } = process.env;
  // Vercel sends the secret with its cron requests, so nobody else can trigger builds.
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) return new Response('Unauthorized', { status: 401 });
  if (!hook) return new Response('DEPLOY_HOOK_URL is not set');
  const res = await fetch(hook, { method: 'POST' });
  return new Response(`deploy hook answered ${res.status}`);
}
