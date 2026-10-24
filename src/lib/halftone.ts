// Turns my photo into halftone dots at build time, dropping the background so only I am drawn.
import path from 'node:path';
import sharp from 'sharp';

const N = 110; // dots per side; each cell is 10 units
const M = 440; // resolution of the cut-out mask

// Cut-out: dark pixels, or warm ones (skin, the shirt print), count as me.
// The landscape behind is green or hazy blue-grey, so it fails both tests.
// Returns a softened coverage map (255 = me), so the outline follows my shape instead of stepping.
async function personMask(file: string): Promise<Buffer> {
  const { data: rgb } = await sharp(file).resize(M, M, { fit: 'fill' }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const person = new Uint8Array(M * M);
  for (let i = 0; i < M * M; i++) {
    const [r, g, b] = [rgb[i * 3], rgb[i * 3 + 1], rgb[i * 3 + 2]];
    const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    person[i] = lum < 0.33 || (r - b > 18 && r >= g + 4) ? 1 : 0;
  }
  // Background is whatever non-person area touches the border; holes inside (teeth, glints) stay me.
  const bg = new Uint8Array(M * M);
  const queue: number[] = [];
  const seed = (j: number) => {
    if (!person[j] && !bg[j]) {
      bg[j] = 1;
      queue.push(j);
    }
  };
  for (let i = 0; i < M; i++) [i, (M - 1) * M + i, i * M, i * M + M - 1].forEach(seed);
  while (queue.length) {
    const j = queue.pop()!;
    const x = j % M;
    const y = (j / M) | 0;
    if (x > 0) seed(j - 1);
    if (x < M - 1) seed(j + 1);
    if (y > 0) seed(j - M);
    if (y < M - 1) seed(j + M);
  }
  const me = Buffer.from(bg.map((v) => (v ? 0 : 255)));
  return sharp(me, { raw: { width: M, height: M, channels: 1 } }).blur(2.5).extractChannel(0).raw().toBuffer();
}

// By default a bigger dot means a darker spot, for dark ink on paper. With `light`, a bigger dot means a brighter
// spot, for light ink on the dark theme, so I'm drawn as a positive there too rather than a photo negative.
export async function halftoneSvg(file: string, { light = false } = {}): Promise<string> {
  const src = path.resolve(file);
  const mask = await personMask(src);
  // Local contrast first, so the smile, beard and glasses survive at this size.
  const { data } = await sharp(src)
    .greyscale()
    .clahe({ width: 60, height: 60, maxSlope: 3 })
    .normalise()
    .resize(N, N, { fit: 'fill' })
    .extractChannel(0)
    .raw()
    .toBuffer({ resolveWithObject: true });

  // Each dot is a zero-length stroke with round caps, and dots of the same size share one path. That's a few dozen
  // shapes for the browser to style and draw instead of thousands of <circle>s, and a much smaller file.
  const bySize = new Map<number, string>();
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const my = Math.min(M - 1, Math.round(((y + 0.5) / N) * M));
      const mx = Math.min(M - 1, Math.round(((x + 0.5) / N) * M));
      if (mask[my * M + mx] < 128) continue;
      const dark = light ? data[y * N + x] / 255 : 1 - data[y * N + x] / 255;
      // Radius from area, so a dot's ink matches the tone; the darkest dots just touch and merge.
      const r = Math.round(Math.max(0.65, Math.sqrt(Math.pow(dark, 1.3)) * 6.2) * 10) / 10;
      bySize.set(r, (bySize.get(r) ?? '') + `M${x * 10 + 5} ${y * 10 + 5}h0`);
    }
  }
  const paths = [...bySize].map(([r, d]) => `<path stroke-width="${+(r * 2).toFixed(1)}" d="${d}"/>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${N * 10} ${N * 10}"><g fill="none" stroke="#000" stroke-linecap="round">${paths}</g></svg>`;
}
