// A greeting for people who open DevTools, and a few commands on window.dev.
import profile from '@/data/profile.json';
import { loadStatus } from './status-client';

const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#2b37e6';
console.log(
  `%c${profile.name}%c\n${profile.role}\nYou opened the console, so here are a few commands. Type dev.help() to see them.`,
  `font: 700 22px system-ui, sans-serif; color: ${accent};`,
  'font: 13px system-ui, sans-serif; line-height: 1.6;',
);

const help = {
  'dev.help()': 'this list',
  'dev.projects()': 'projects as a table',
  'dev.status()': 'live health of the demos',
  'dev.hire()': 'opens an email to me',
  'dev.links()': 'where else to find me',
};

(window as unknown as { dev: object }).dev = {
  help: () => console.table(help),
  async projects() {
    const docs = (await fetch('/search.json').then((r) => r.json())) as { k: string; t: string; s: string; h: string }[];
    console.table(docs.filter((d) => d.k === 'Project').map((d) => ({ name: d.t, what: d.s, page: new URL(d.h, location.href).href })));
  },
  async status() {
    const data = await loadStatus();
    if (!data) return console.warn('Status is unavailable right now.');
    console.table(data.services.map((s) => ({ service: s.id, state: s.state, ms: s.ms ?? '' })));
  },
  hire() {
    location.href = `mailto:${profile.email}?subject=${encodeURIComponent('Hello from your site')}`;
    return `Opening an email to ${profile.email}`;
  },
  links: () => console.table(Object.fromEntries(profile.links.map((l) => [l.label, l.href]))),
};
