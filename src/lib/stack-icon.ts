// Map a free-text stack label from project frontmatter to an icon name for Icon.astro.
const aliases: Record<string, string> = {
  postgres: 'postgresql',
  'next.js': 'nextdotjs',
  nextjs: 'nextdotjs',
  'node.js': 'nodedotjs',
  node: 'nodedotjs',
  'svelte 5': 'svelte',
  'scikit-learn': 'scikitlearn',
  'c++': 'cplusplus',
  'hugging face': 'huggingface',
  'tailwind css': 'tailwindcss',
  'mcp server': 'modelcontextprotocol',
  mcp: 'modelcontextprotocol',
  fastmcp: 'modelcontextprotocol',
  'groq llama': 'groq',
  'chrome extension': 'googlechrome',
  'telegram api': 'telegram',
  'telegram bot api': 'telegram',
  keras: 'keras',
};

export function stackIcon(label: string): string {
  const k = label.trim().toLowerCase();
  return aliases[k] ?? k.replace(/[\s.]+/g, '');
}
