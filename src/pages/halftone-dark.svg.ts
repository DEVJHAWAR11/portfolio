// The portrait's dots for the dark theme: same cells, sized by brightness instead of darkness.
import { halftoneSvg } from '@/lib/halftone';

export async function GET() {
  return new Response(await halftoneSvg('src/assets/portrait.jpg', { light: true }), {
    headers: { 'Content-Type': 'image/svg+xml' },
  });
}
