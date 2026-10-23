---
title: LLM Semantic Cache
tagline: "A cache that answers repeat questions by meaning, so the LLM isn't called twice."
order: 6
featured: false
problem: "LLM apps pay for and wait on near-identical questions again and again. This layer returns a stored answer when a new question is close enough in meaning."
stack: [FastAPI, Redis, Jina embeddings, Groq, PostgreSQL, Docker]
links:
  github: https://github.com/DEVJHAWAR11/LLM_Semantic_Cache
highlights: ["Questions are embedded with Jina v3 into 1024-d vectors and matched at cosine similarity 0.85 or higher", "Redis holds the vectors (as hashes) and the rate limiter, 10 requests a minute", "Each query is logged to PostgreSQL, and /analytics reports hit rate and cost savings", "Runs as three Docker Compose containers: app, Redis, Postgres"]
diagram:
  nodes:
    - { id: req, label: "POST /ask", role: "user question", col: 0, row: 1 }
    - { id: rl, label: "Rate limiter", role: "Redis, 10 req/min", col: 1, row: 1 }
    - { id: emb, label: "Jina", role: "1024-d embedding", col: 2, row: 1 }
    - { id: cache, label: "Redis cache", role: "cosine >= 0.85", col: 3, row: 0 }
    - { id: llm, label: "Groq LLM", role: "on a miss", col: 3, row: 2 }
    - { id: log, label: "PostgreSQL", role: "analytics log", col: 4, row: 1 }
  edges:
    - [req, rl]
    - [rl, emb]
    - [emb, cache, "lookup"]
    - [cache, llm, "miss"]
    - [llm, cache, "store"]
    - [cache, log, "hit or miss"]
---

I built this as a semantic caching layer for LLM apps. It intercepts a question, turns it into a vector with Jina embeddings, and checks Redis for a previous question that is close enough in meaning. On a hit it returns the stored answer immediately; on a miss it calls Groq, stores the result, and returns it.

The service is a FastAPI app with a per-client rate limit in Redis and a PostgreSQL log of every query. `GET /analytics` reports total queries, hits and misses and the estimated cost saved, and `DELETE /cache` clears the cache. Everything starts with one `docker-compose up`.
