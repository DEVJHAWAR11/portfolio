---
title: WatchTower
tagline: "Describe something on the web in plain words and get one alert when it happens."
order: 1
featured: true
year: 2026
problem: "Checking job portals, exam sites and price pages by hand is tedious, and plain change detectors fire on every counter and clock. WatchTower decides whether the condition you described is really met."
stack: [FastAPI, LangGraph, Postgres, Redis, Groq, Supabase, arq, SSE]
links:
  github: https://github.com/DEVJHAWAR11/WatchTower
  live: https://watch-tower-seven.vercel.app
health: https://watch-tower-seven.vercel.app
interaction: watch
gallery:
  - { file: 1-how-it-works.jpg, caption: "How it works: describe it, the agent sets up the watch, checks run quietly, and you get one alert." }
  - { file: 2-live-log.jpg, caption: "The live log of a check: fetch, compare with the last snapshot, rules, then the AI judge with its confidence." }
  - { file: 3-alert.jpg, caption: "What an alert looks like: the details pulled from the page, its source, and a follow-up waiting for approval." }
  - { file: 4-api.jpg, caption: "Everything in the app is also a JSON API with webhooks." }
highlights: ["Evaluation runs a cost ladder: hash gate, learned noise filter, rules, triage model, then the judge model only when needed", "The judge must return a verbatim evidence quote, which is checked against the page and rejected if missing", "Public watches share one fetch and one follow-up across every subscriber", "SSRF guard resolves DNS at connect time and connects to the exact IP it checked"]
hard: "Deciding whether a changed page really meets a plain-English condition without paying for an LLM call on every check. Each check walks a cost ladder and stops as early as it can, and the judge at the top has to quote the page word for word, which is verified before any alert goes out. If the model is down or over budget, the run is deferred instead of guessed."
numbers:
  - { value: "~150", label: "test functions across unit, integration, agent, security, end-to-end and load suites", src: "https://github.com/DEVJHAWAR11/WatchTower/tree/main/backend/tests" }
  - { value: "40+", label: "SSRF bypass attempts the URL guard is tested against", src: "https://github.com/DEVJHAWAR11/WatchTower/blob/main/docs/ARCHITECTURE.md" }
  - { value: "70+", label: "real queries in the intake test set", src: "https://github.com/DEVJHAWAR11/WatchTower/blob/main/backend/README.md" }
diagram:
  nodes:
    - { id: fe, label: "Frontend", role: "watch setup, live view", col: 0, row: 1 }
    - { id: api, label: "FastAPI", role: "stateless REST + SSE", col: 1, row: 1 }
    - { id: pg, label: "Postgres", role: "source of truth, scheduler claims", col: 2, row: 0 }
    - { id: redis, label: "Redis", role: "arq queues, streams, rate limits", col: 2, row: 2 }
    - { id: worker, label: "Workers", role: "checks, agents, notify", col: 3, row: 1 }
    - { id: llm, label: "Groq + search", role: "LLM ladder, Tavily/Brave", col: 4, row: 0 }
    - { id: notify, label: "Notifications", role: "email, push, Telegram, webhooks", col: 4, row: 2 }
  edges:
    - [fe, api, "REST / SSE"]
    - [api, pg, "read/write"]
    - [api, redis, "enqueue"]
    - [redis, worker, "jobs"]
    - [pg, worker, "SKIP LOCKED claim"]
    - [worker, llm, "judge"]
    - [worker, notify, "one alert"]
---

## What I built

WatchTower lets you describe something on the public web in plain language, such as "tell me when this exam notice changes", and keeps watching it for you. Agents turn the sentence into a tested watch, check the page on a schedule, decide whether the condition is actually met, do any follow-up work, and send one complete notification. Watches can be shared, so one check serves every subscriber.

## How it works

Four LangGraph agents do the work: intake (screen, analyse, discover sources, dry run, create), evaluation, act, and refinement. The API is stateless and the scheduler and workers scale as replicas. Postgres is the source of truth, and Redis only holds queues, caches, streams and rate-limit state, so flushing it loses nothing.

Each scheduled check goes down a cost ladder and stops as early as it can: shared fetch, hash gate, learned noise filter, rules, a fast triage model, and finally the smart judge model. Progress streams to the browser over SSE.

## Decisions worth noting

- The scheduler claims due checks with `FOR UPDATE SKIP LOCKED` and leases, so no leader election is needed.
- The judge has to return a verbatim evidence quote. It is verified against the page and rejected if it cannot be found.
- LLM outages or budget limits defer a run without updating state, so a change is never silently swallowed.
- Redis mirrors Groq's per-model request and token limits across all processes, and 15% of daily requests are reserved for interactive intake.
- Page text is treated as hostile: hidden DOM is stripped, content is fenced with an HMAC nonce, and links and dates must be grounded in the page.
- Alerts and deliveries are unique per fingerprint and channel, so a notification can't go out twice.
