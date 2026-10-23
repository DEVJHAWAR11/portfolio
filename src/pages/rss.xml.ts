// Posts as an RSS feed. They live on dev.to, so each item links there.
import profile from '@/data/profile.json';
import { getPosts } from '@/lib/devto';

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&${{ '&': 'amp', '<': 'lt', '>': 'gt', '"': 'quot', "'": 'apos' }[c]};`);

export async function GET({ site }: { site: URL }) {
  const posts = await getPosts();
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${esc(profile.name)}, writing</title>
    <link>${site.href}</link>
    <atom:link href="${new URL('/rss.xml', site).href}" rel="self" type="application/rss+xml" />
    <description>Notes on LLM internals, agents and AI infrastructure.</description>
    <language>en</language>
${posts
  .map(
    (p) => `    <item>
      <title>${esc(p.title)}</title>
      <link>${esc(p.url)}</link>
      <guid isPermaLink="true">${esc(p.url)}</guid>
      <pubDate>${new Date(p.date).toUTCString()}</pubDate>
      <description>${esc(p.description)}</description>
${p.tags.map((t) => `      <category>${esc(t)}</category>`).join('\n')}
    </item>`,
  )
  .join('\n')}
  </channel>
</rss>
`;
  return new Response(body, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
}
