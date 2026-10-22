// Turns my photo into halftone dots at build time, dropping the background so only I am drawn.
import path from 'node:path';
import sharp from 'sharp';

const N = 64; // dots per side; each cell is 10 units
const M = 192; // resolution of the cut-out mask

// Cut-out: dark pixels, or warm ones (skin, the shirt print), count as me.
// The landscape behind is green or hazy blue-grey, so it fails both tests.
async function personMask(file: string): Promise<Uint8Array> {
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
  return bg;
}

export async function halftoneSvg(file: string): Promise<string> {
  const src = path.resolve(file);
  const bg = await personMask(src);
  const { data } = await sharp(src).greyscale().normalise().resize(N, N, { fit: 'fill' }).raw().toBuffer({ resolveWithObject: true });

  const s = M / N;
  let dots = '';
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      let inside = 0;
      for (let yy = 0; yy < s; yy++) for (let xx = 0; xx < s; xx++) inside += bg[(y * s + yy) * M + x * s + xx] ? 0 : 1;
      if (inside / (s * s) < 0.5) continue;
      const dark = 1 - data[y * N + x] / 255;
      const r = Math.max(0.9, Math.pow(dark, 2.1) * 5.2);
      dots += `<circle cx="${x * 10 + 5}" cy="${y * 10 + 5}" r="${r.toFixed(1)}"/>`;
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${N * 10} ${N * 10}">${dots}</svg>`;
}
