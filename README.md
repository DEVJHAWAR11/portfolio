# devjhawar.com

My portfolio. Built with Astro as a static site, with a few small Vercel Functions for live data.

## What's in it

- Projects with short interactive explainers of how each one works
- Open source PRs and a contribution heatmap, pulled from GitHub
- Live status checks for the deployed demos, at `/status`
- Search with Ctrl K / ⌘K

## Running it

```bash
npm install
npm run dev
```

`npm run build` writes the site to `dist/`.

Content lives in `src/content/projects/*.md` and `src/data/`. Adding a project means adding a markdown file.

## Environment (optional, on Vercel)

- `GITHUB_TOKEN`: read-only token, avoids GitHub rate limits for the PR list
- `DEPLOY_HOOK_URL` and `CRON_SECRET`: let the daily cron in `vercel.json` redeploy the site
