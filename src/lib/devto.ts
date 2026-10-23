// dev.to posts, fetched at build time. The API is public, no key needed.
import profile from '@/data/profile.json';

export interface Post {
  title: string;
  url: string;
  date: string;
  tags: string[];
  minutes: number;
  reactions: number;
  description: string;
}

let posts: Promise<Post[]> | undefined;

export function getPosts(): Promise<Post[]> {
  posts ??= (async () => {
    try {
      const res = await fetch(`https://dev.to/api/articles?username=${profile.devto}&per_page=100`);
      if (!res.ok) throw new Error(`dev.to ${res.status}`);
      const json = (await res.json()) as any[];
      return json.map((a) => ({
        title: a.title,
        url: a.url,
        date: a.published_at,
        tags: a.tag_list ?? [],
        minutes: a.reading_time_minutes,
        reactions: a.public_reactions_count,
        description: a.description ?? '',
      }));
    } catch (e) {
      console.warn('[devto] fetch failed, rendering without posts:', (e as Error).message);
      return [];
    }
  })();
  return posts;
}
