// The palette's search, the same shape as CaseCompass's retrieval in miniature:
// a keyword ranking (BM25) and a fuzzy ranking (character trigrams) merged with Reciprocal Rank Fusion.

// One searchable thing. Built in src/pages/search.json.ts.
export interface Doc {
  k: 'Action' | 'Section' | 'Page' | 'Project' | 'Post' | 'PR' | 'Term' | 'Link';
  t: string; // title
  s: string; // one line under the title
  h?: string; // where it goes
  a?: 'copy-email' | 'theme'; // or what it does
  x?: string; // extra words to match on, not shown
  pin?: boolean; // listed before anything is typed
}

const STOP = new Set('a an and the of to in on for with by is it my i at as from or'.split(' '));
const words = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .split(/[^a-z0-9]+/)
    .filter((w) => w && !STOP.has(w));

const grams = (s: string) => {
  const out = new Set<string>();
  for (const w of words(s)) {
    const p = `  ${w} `;
    for (let i = 0; i < p.length - 2; i++) out.add(p.slice(i, i + 3));
  }
  return out;
};

export interface Hit {
  doc: Doc;
  score: number;
  kw?: number; // rank in the keyword list, 1-based
  fz?: number; // rank in the fuzzy list
}

export function createIndex(docs: Doc[]) {
  // Title words count three times, so a project named "WatchTower" beats a post that mentions it once.
  const toks = docs.map((d) => [...words(d.t), ...words(d.t), ...words(d.t), ...words(`${d.s} ${d.k} ${d.x ?? ''}`)]);
  const tf = toks.map((ws) => {
    const m = new Map<string, number>();
    for (const w of ws) m.set(w, (m.get(w) ?? 0) + 1);
    return m;
  });
  const df = new Map<string, number>();
  for (const m of tf) for (const w of m.keys()) df.set(w, (df.get(w) ?? 0) + 1);
  const vocab = [...df.keys()];
  const avg = toks.reduce((n, ws) => n + ws.length, 0) / docs.length;
  const N = docs.length;
  const titleGrams = docs.map((d) => grams(d.t));

  const idf = (w: string) => Math.log(1 + (N - df.get(w)! + 0.5) / (df.get(w)! + 0.5));

  function bm25(q: string) {
    const qs = words(q);
    if (!qs.length) return [];
    // The last word may still be half typed, so it matches any word it starts.
    const expand = qs.map((w, i) => (i === qs.length - 1 && w.length > 1 ? vocab.filter((v) => v.startsWith(w)) : df.has(w) ? [w] : []));
    const k1 = 1.2;
    const b = 0.5;
    return docs
      .map((_, i) => {
        let score = 0;
        for (const opts of expand) {
          let best = 0;
          for (const w of opts) {
            const f = tf[i].get(w);
            if (!f) continue;
            best = Math.max(best, (idf(w) * f * (k1 + 1)) / (f + k1 * (1 - b + (b * toks[i].length) / avg)));
          }
          score += best;
        }
        return { i, score };
      })
      .filter((r) => r.score > 0)
      .sort((x, y) => y.score - x.score);
  }

  function fuzzy(q: string) {
    const qg = grams(q);
    if (qg.size < 3) return [];
    return titleGrams
      .map((g, i) => {
        let shared = 0;
        for (const t of qg) if (g.has(t)) shared++;
        // Dice overlap: a typo of a short name scores high, a long title that merely shares a word does not.
        return { i, score: (2 * shared) / (qg.size + g.size) };
      })
      .filter((r) => r.score >= 0.5)
      .sort((x, y) => y.score - x.score)
      .slice(0, 20);
  }

  return function search(q: string, k = 60, limit = 9): Hit[] {
    const kw = bm25(q);
    const fz = fuzzy(q);
    const hits = new Map<number, Hit>();
    const add = (list: { i: number }[], key: 'kw' | 'fz') =>
      list.forEach(({ i }, r) => {
        const h = hits.get(i) ?? { doc: docs[i], score: 0 };
        h[key] = r + 1;
        h.score += 1 / (k + r + 1);
        hits.set(i, h);
      });
    add(kw, 'kw');
    add(fz, 'fz');
    return [...hits.values()].sort((x, y) => y.score - x.score).slice(0, limit);
  };
}
