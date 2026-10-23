// Everything the ⌘K palette can find, built once at build time and fetched the first time the palette opens.
import { getCollection } from 'astro:content';
import profile from '@/data/profile.json';
import { sections } from '@/lib/sections';
import { terms } from '@/lib/glossary';
import { getPRs } from '@/lib/github';
import { getPosts } from '@/lib/devto';
import type { Doc } from '@/components/Palette/search';

export async function GET() {
  const projects = (await getCollection('projects')).sort((a, b) => a.data.order - b.data.order);
  const [prs, posts] = await Promise.all([getPRs(), getPosts()]);

  const docs: Doc[] = [
    { k: 'Action', t: 'Email me', s: profile.email, h: `mailto:${profile.email}`, x: 'mail contact hire', pin: true },
    { k: 'Action', t: 'Switch theme', s: 'Light or dark', a: 'theme', x: 'dark mode light mode colour', pin: true },
    { k: 'Action', t: 'Sounds on or off', s: 'The small click sounds', a: 'sound', x: 'mute audio sfx volume quiet' },
    { k: 'Action', t: 'Open résumé', s: 'Opens in a new tab', h: profile.resume, x: 'resume cv hire', pin: true },
    ...sections.map((s): Doc => ({ k: 'Section', t: s.title, s: s.label ?? '', h: `/#${s.id}`, pin: true })),
    { k: 'Page', t: '60-second view', s: 'The short version, for recruiters', h: '/quick', x: 'quick summary recruiter resume short tldr hire' },
    { k: 'Page', t: 'Terminal', s: 'The site as commands', h: '/cli', x: 'cli shell command line console bash' },
    { k: 'Page', t: 'Status', s: 'Whether each live demo is up right now', h: '/status', x: 'uptime health down asleep wake' },
    ...projects.map(
      (p): Doc => ({
        k: 'Project',
        t: p.data.title,
        s: p.data.tagline,
        h: `/projects/${p.id}`,
        x: [...p.data.stack, ...p.data.highlights, p.data.problem ?? ''].join(' '),
        pin: p.data.featured,
      }),
    ),
    ...posts.map((p): Doc => ({ k: 'Post', t: p.title, s: `dev.to, ${p.minutes} min read`, h: p.url, x: `${p.tags.join(' ')} ${p.description}` })),
    ...prs.map((p): Doc => ({ k: 'PR', t: p.title, s: `${p.repo}#${p.number}, ${p.state}`, h: p.url, x: p.repo.replace('/', ' ') })),
    ...terms.map((t): Doc => {
      const used = projects.find((p) => new RegExp(`\\b${t.term}\\b`, 'i').test(`${p.data.stack} ${p.data.highlights} ${p.body}`));
      return { k: 'Term', t: t.term, s: t.def, h: used && `/projects/${used.id}`, x: (t.match ?? []).join(' ') };
    }),
    ...profile.links.map((l): Doc => ({ k: 'Link', t: l.label, s: l.handle, h: l.href })),
  ];

  return new Response(JSON.stringify(docs), { headers: { 'Content-Type': 'application/json' } });
}
