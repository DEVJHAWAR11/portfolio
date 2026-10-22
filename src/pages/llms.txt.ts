// A plain-text profile for language models and agents that visit, following the llms.txt convention.
import { getCollection } from 'astro:content';
import profile from '@/data/profile.json';
import { getPRs } from '@/lib/github';
import { getPosts } from '@/lib/devto';

export async function GET({ site }: { site: URL }) {
  const projects = (await getCollection('projects')).sort((a, b) => a.data.order - b.data.order);
  const [prs, posts] = await Promise.all([getPRs(), getPosts()]);
  const merged = prs.filter((p) => p.state === 'merged');
  const repos = [...new Set(prs.map((p) => p.repo))];
  const url = (path: string) => new URL(path, site).href;

  const text = `# ${profile.name}

> ${profile.role} Final-year B.Tech CSE student at KIIT, Bhubaneswar (class of 2027). Focus: agentic AI, RAG, backend and AI infrastructure.

${profile.bio.join('\n\n')}

Contact: ${profile.email}
Résumé: ${profile.resume}

## Projects

${projects
  .map((p) => {
    const links = [p.data.links.live && `${p.id === 'tidyflow' ? 'download' : 'live'}: ${p.data.links.live}`, p.data.links.github && `code: ${p.data.links.github}`].filter(Boolean).join(', ');
    return `- [${p.data.title}](${url(`/projects/${p.id}`)}): ${p.data.tagline} Stack: ${p.data.stack.join(', ')}.${links ? ` (${links})` : ''}`;
  })
  .join('\n')}

## Open source

${prs.length} pull requests to ${repos.length} repositories, ${merged.length} merged. Repositories: ${repos.join(', ')}.

${prs
  .slice(0, 15)
  .map((p) => `- [${p.repo}#${p.number}](${p.url}) (${p.state}): ${p.title}`)
  .join('\n')}

## Writing

${posts
  .slice(0, 10)
  .map((p) => `- [${p.title}](${p.url})`)
  .join('\n')}

## Elsewhere

${profile.links.map((l) => `- ${l.label}: ${l.href}`).join('\n')}
`;
  return new Response(text, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
