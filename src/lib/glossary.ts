// Glossary terms from src/data/glossary.yaml, and a splitter that finds them in plain text.
// Used by <Gloss> for strings and by the rehype plugin for markdown bodies.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parse } from 'yaml';

export interface Term {
  id: string;
  term: string;
  def: string;
  match?: string[];
}

export const terms: Term[] = parse(readFileSync(resolve('src/data/glossary.yaml'), 'utf8'));

const byWord = new Map<string, Term>();
for (const t of terms) for (const w of [t.term, ...(t.match ?? [])]) byWord.set(w.toLowerCase(), t);

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// Longest spellings first, so "reciprocal-rank fusion" wins over a shorter overlap.
const re = new RegExp(
  `(?<![\\w-])(${[...byWord.keys()].sort((a, b) => b.length - a.length).map(escape).join('|')})(?![\\w-])`,
  'gi',
);

export type Piece = string | { text: string; term: Term };

/** Split text into plain strings and glossary hits. Each term is marked once per `seen` set. */
export function split(text: string, seen = new Set<string>()): Piece[] {
  const out: Piece[] = [];
  let last = 0;
  for (const m of text.matchAll(re)) {
    const term = byWord.get(m[0].toLowerCase())!;
    if (seen.has(term.id)) continue;
    seen.add(term.id);
    if (m.index > last) out.push(text.slice(last, m.index));
    out.push({ text: m[0], term });
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}
