// Every page worth indexing. Built by hand because the site has only a handful of routes.
import { getCollection } from 'astro:content';

export async function GET({ site }: { site: URL }) {
  const projects = await getCollection('projects');
  const today = new Date().toISOString().slice(0, 10);
  const urls = ['/', '/quick', '/status', ...projects.map((p) => `/projects/${p.id}`)];
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${new URL(u, site).href}</loc><lastmod>${today}</lastmod></url>`).join('\n')}
</urlset>
`;
  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}
