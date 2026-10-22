// One social preview image per page: home, status, and each project.
import { getCollection } from 'astro:content';
import profile from '@/data/profile.json';
import { ogImage, type Card } from '@/lib/og';

export async function getStaticPaths() {
  const projects = (await getCollection('projects')).sort((a, b) => a.data.order - b.data.order);
  const cards: { slug: string; card: Card }[] = [
    { slug: 'home', card: { title: profile.name, kicker: 'Portfolio', line: profile.role, chips: profile.tags, portrait: true } },
    { slug: 'status', card: { title: 'Status', kicker: 'Live checks', line: 'Whether each live demo is up right now.' } },
    ...projects.map((p) => ({
      slug: p.id,
      card: { title: p.data.title, kicker: `Project ${String(p.data.order).padStart(2, '0')}`, line: p.data.tagline, chips: p.data.stack },
    })),
  ];
  return cards.map(({ slug, card }) => ({ params: { slug }, props: { card } }));
}

export async function GET({ props }: { props: { card: Card } }) {
  return new Response(new Uint8Array(await ogImage(props.card)), { headers: { 'Content-Type': 'image/png' } });
}
