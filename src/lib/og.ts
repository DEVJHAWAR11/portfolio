// Social preview images (1200 × 630), drawn at build time in the site's own look:
// satori lays out the card and turns text into paths, then sharp turns that SVG into a PNG.
import { readFileSync } from 'node:fs';
import satori from 'satori';
import sharp from 'sharp';
import { halftoneSvg } from './halftone';

const font = (pkg: string, file: string) => readFileSync(`node_modules/@fontsource/${pkg}/files/${file}`);
const fonts = [
  { name: 'Display', data: font('archivo-narrow', 'archivo-narrow-latin-700-normal.woff'), weight: 700 as const, style: 'normal' as const },
  { name: 'Body', data: font('archivo-narrow', 'archivo-narrow-latin-600-normal.woff'), weight: 600 as const, style: 'normal' as const },
  { name: 'Mono', data: font('jetbrains-mono', 'jetbrains-mono-latin-400-normal.woff'), weight: 400 as const, style: 'normal' as const },
];

const C = { bg: '#ebeae4', panel: '#f5f4ef', fg: '#121317', muted: '#55575f', faint: '#8b8d94', edge: '#c4c2b9', accent: '#2b37e6' };

type Node = { type: string; props: Record<string, unknown> };
const h = (type: string, style: Record<string, unknown>, ...children: (Node | string | false | undefined)[]): Node => ({
  type,
  props: { style: { display: 'flex', ...style }, children: children.filter(Boolean) },
});

export interface Card {
  title: string;
  kicker: string; // small line top right, e.g. "Project 01"
  line?: string; // one sentence under the title
  chips?: string[];
  portrait?: boolean;
}

let portrait: Promise<string> | undefined;

export async function ogImage(card: Card): Promise<Buffer> {
  const size = card.title.length > 22 ? 84 : card.title.length > 13 ? 104 : 132;
  const dots = card.portrait
    ? `data:image/svg+xml;base64,${Buffer.from(await (portrait ??= halftoneSvg('src/assets/portrait.jpg'))).toString('base64')}`
    : undefined;

  const tree = h(
    'div',
    {
      width: '100%',
      height: '100%',
      padding: 40,
      backgroundColor: C.bg,
      backgroundImage: 'radial-gradient(circle, rgba(18,19,23,0.18) 1.4px, transparent 1.6px)',
      backgroundSize: '20px 20px',
    },
    h(
      'div',
      { flex: 1, flexDirection: 'column', justifyContent: 'space-between', padding: '40px 48px', backgroundColor: C.panel, border: `1px solid ${C.edge}`, position: 'relative' },
      h(
        'div',
        { justifyContent: 'space-between', alignItems: 'center', fontFamily: 'Mono', fontSize: 22, color: C.muted },
        h(
          'div',
          { alignItems: 'center', gap: 14 },
          h('div', { width: 30, height: 30, backgroundColor: C.fg, position: 'relative' }, h('div', { position: 'absolute', right: 0, bottom: 0, width: 15, height: 15, backgroundColor: C.accent })),
          'devjhawar.com',
        ),
        card.kicker,
      ),
      h(
        'div',
        { flexDirection: 'column', maxWidth: card.portrait ? 620 : 1000, gap: 22 },
        h('div', { fontFamily: 'Display', fontSize: size, lineHeight: 0.9, letterSpacing: -1, textTransform: 'uppercase', color: C.fg }, card.title),
        card.line && h('div', { fontFamily: 'Body', fontSize: 34, lineHeight: 1.25, color: C.muted }, card.line),
      ),
      h(
        'div',
        { flexWrap: 'wrap', gap: 10, maxWidth: card.portrait ? 620 : 1040, fontFamily: 'Mono', fontSize: 19, color: C.muted },
        ...(card.chips ?? []).slice(0, 6).map((c) => h('div', { padding: '5px 12px', border: `1px solid ${C.edge}`, backgroundColor: C.bg }, c)),
      ),
      dots && { type: 'img', props: { src: dots, width: 470, height: 470, style: { position: 'absolute', right: 20, bottom: 0 } } },
    ),
  );

  const svg = await satori(tree as any, { width: 1200, height: 630, fonts });
  return sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer();
}
