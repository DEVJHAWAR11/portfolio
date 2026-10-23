---
title: GridMind
tagline: "A spreadsheet where every cell is researched by its own agent, with sources."
order: 2
featured: true
year: 2026
problem: "Researching a list of companies or products means opening dozens of tabs per question. GridMind turns rows and plain-English questions into a grid that fills itself with cited answers."
stack: [FastAPI, LangGraph, Svelte 5, Supabase, Groq, Tavily, Redis]
links:
  github: https://github.com/DEVJHAWAR11/GridMind
  live: https://grid-mind-tan.vercel.app
health: https://grid-mind-tan.vercel.app
interaction: grid
gallery:
  - { file: 1-new-sheet.jpg, caption: "Starting a sheet: rows are the things you research, columns are the questions." }
  - { file: 2-use-cases.jpg, caption: "Templates for common jobs, each opening as an editable sheet." }
  - { file: 3-architecture.jpg, caption: "The architecture from the docs: a stateless API, Postgres as the job queue, and workers running the agent." }
highlights: ["One LangGraph agent per cell: plan queries, search, read pages if snippets are thin, answer, retry at most twice", "Postgres is the job queue, claimed with FOR UPDATE SKIP LOCKED; stale locks over 180s are reclaimed", "Cited URLs are checked against the sources actually retrieved", "Frontend has a demo mode that runs fully in the browser with no backend"]
hard: "Running a research agent in every spreadsheet cell on free-tier rate limits without losing or duplicating work. Postgres is the job queue: cells are claimed with FOR UPDATE SKIP LOCKED, stale locks are reclaimed after three minutes, and rate-limit errors back off. Every cited URL is checked against the sources the agent actually retrieved."
numbers:
  - { value: "~1", label: "LLM call per cell, by design", src: "https://github.com/DEVJHAWAR11/GridMind#readme" }
  - { value: "2", label: "passes at most before a cell gives its best answer", src: "https://github.com/DEVJHAWAR11/GridMind#readme" }
  - { value: "24", label: "tests, with the agent graph run against fakes", src: "https://github.com/DEVJHAWAR11/GridMind/tree/main/backend/tests" }
diagram:
  nodes:
    - { id: ui, label: "Svelte 5 UI", role: "grid editor, trace drawer", col: 0, row: 1 }
    - { id: api, label: "FastAPI", role: "routes + SSE events", col: 1, row: 1 }
    - { id: db, label: "Postgres", role: "cells table is the queue", col: 2, row: 0 }
    - { id: worker, label: "Worker", role: "claim_cells, retry, persist", col: 2, row: 2 }
    - { id: agent, label: "LangGraph agent", role: "plan, search, read, answer", col: 3, row: 1 }
    - { id: web, label: "Tavily + DuckDuckGo", role: "search and page reads", col: 4, row: 1 }
  edges:
    - [ui, api, "run / SSE"]
    - [api, db, "mark queued"]
    - [db, worker, "SKIP LOCKED"]
    - [worker, agent, "ainvoke"]
    - [agent, web, "search, read"]
    - [agent, ui, "step events"]
---

## What I built

GridMind is a spreadsheet that researches for you. Rows are things like companies or products, columns are plain-English questions. You hit Run and each cell gets its own agent that searches the web, answers, and cites sources. The grid fills live, and every answer carries a confidence level, up to four sources and a step-by-step trace.

## How it works

Each cell runs a small LangGraph state machine: it writes two search queries, searches Tavily and DuckDuckGo in parallel, reads two pages only if the snippets are thin, then returns a structured answer. If the answer says the evidence was not sufficient, it loops with feedback on what was missing, at most twice. The agent graph sits inside a job system where Postgres is the queue and workers are stateless.

## Decisions worth noting

- The queue lives in Postgres (`cells.status = queued`) and `claim_cells()` uses `FOR UPDATE SKIP LOCKED`, so there is no extra infrastructure.
- Claims carry `locked_at`, and stale locks are reclaimed, which gives at-least-once execution. Flaky cells retry with exponential backoff and then move to an error state.
- The graph only talks to the LLM and network through an injected `AgentDeps`, so tests run the real graph against fakes.
- The answer is a Pydantic model, and cited URLs are checked against the sources actually retrieved.
- Step events stream over SSE and are saved in one bulk insert when the cell finishes.
- Page fetches are SSRF-guarded, and free-tier limits are handled with sliding-window limiters, retry with jitter, caching and a DuckDuckGo fallback.
