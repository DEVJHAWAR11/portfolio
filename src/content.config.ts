import { defineCollection } from 'astro:content';
import { glob, file } from 'astro/loaders';
import { z } from 'astro/zod';

const projects = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    tagline: z.string(),
    order: z.number(),
    featured: z.boolean().default(false),
    year: z.number().optional(),
    problem: z.string().optional(),
    stack: z.array(z.string()),
    links: z.object({
      github: z.string().optional(),
      live: z.string().optional(),
      video: z.string().optional(),
      docs: z.string().optional(),
    }),
    health: z.string().optional(),
    highlights: z.array(z.string()).default([]),
    // The hardest problem the project solves, in a few plain sentences.
    hard: z.string().optional(),
    // Figures stated in the repo itself (evals, tests, limits), each with where it comes from.
    numbers: z.array(z.object({ value: z.string(), label: z.string(), src: z.string().optional() })).default([]),
    interaction: z.string().optional(),
    // More screenshots, in src/assets/projects/<slug>/<file>, shown under the cover on the case study.
    gallery: z.array(z.object({ file: z.string(), caption: z.string() })).default([]),
    diagram: z
      .object({
        nodes: z.array(
          z.object({ id: z.string(), label: z.string(), role: z.string().optional(), col: z.number(), row: z.number() }),
        ),
        edges: z.array(z.array(z.string()).min(2).max(3)),
      })
      .optional(),
  }),
});

const posts = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/posts' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    description: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});

const timeline = z.object({
  title: z.string(),
  org: z.string(),
  start: z.string(),
  end: z.string().optional(),
  detail: z.string(),
  current: z.boolean().default(false),
});

const experience = defineCollection({ loader: file('./src/data/experience.yaml'), schema: timeline });
const education = defineCollection({ loader: file('./src/data/education.yaml'), schema: timeline });

const skills = defineCollection({
  loader: file('./src/data/skills.yaml'),
  schema: z.object({ name: z.string(), group: z.string(), icon: z.string(), match: z.array(z.string()).default([]) }),
});

const glossary = defineCollection({
  loader: file('./src/data/glossary.yaml'),
  schema: z.object({ term: z.string(), def: z.string(), match: z.array(z.string()).default([]) }),
});

const now = defineCollection({
  loader: file('./src/data/now.yaml'),
  schema: z.object({ cron: z.string(), task: z.string() }),
});

export const collections = { projects, posts, experience, education, skills, glossary, now };
