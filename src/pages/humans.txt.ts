// Who made this site, in the humans.txt format.
import profile from '@/data/profile.json';

export function GET() {
  const text = `/* TEAM */
Built by: ${profile.name}
Contact: ${profile.email}
GitHub: https://github.com/${profile.github}
From: ${profile.location}

/* SITE */
Last update: ${new Date().toISOString().slice(0, 10)}
Standards: HTML, CSS, TypeScript
Components: Astro, Vercel Functions
Fonts: Archivo, Geist, JetBrains Mono
`;
  return new Response(text, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
