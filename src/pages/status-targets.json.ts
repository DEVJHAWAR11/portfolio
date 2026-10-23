// The list the /api/status function checks, so project files stay the one place it is defined.
import { getTargets } from '@/lib/targets';

export async function GET() {
  return Response.json(await getTargets());
}
