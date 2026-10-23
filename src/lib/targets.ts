// Which live demos get health checks: every project with a `health` URL, in project order.
import { getCollection } from 'astro:content';
import type { Target } from './health';

export async function getTargets(): Promise<Target[]> {
  const projects = (await getCollection('projects')).sort((a, b) => a.data.order - b.data.order);
  return projects.flatMap((p) => (p.data.health ? [{ id: p.id, title: p.data.title, url: p.data.health, live: p.data.links.live }] : []));
}
