// The hero portrait's dots, built once and served as a static, cacheable SVG.
import { halftoneSvg } from '@/lib/halftone';

export async function GET() {
  return new Response(await halftoneSvg('src/assets/portrait.jpg'), { headers: { 'Content-Type': 'image/svg+xml' } });
}
