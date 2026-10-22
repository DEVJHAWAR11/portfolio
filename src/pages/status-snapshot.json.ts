// One round of checks at build time. The page falls back to this when /api/status can't be reached.
import { getTargets } from '@/lib/targets';
import { checkAll } from '@/lib/health';

export async function GET() {
  return Response.json(await checkAll(await getTargets()));
}
