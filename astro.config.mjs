import { defineConfig } from 'astro/config';
import { satteri } from '@astrojs/markdown-satteri';
import glossaryPlugin from './src/lib/md-glossary.ts';

export default defineConfig({
  site: 'https://devjhawar.com',
  trailingSlash: 'never',
  build: { format: 'file', inlineStylesheets: 'always' },
  markdown: { processor: satteri({ hastPlugins: [glossaryPlugin] }) },
  prefetch: { prefetchAll: false, defaultStrategy: 'hover' },
});
