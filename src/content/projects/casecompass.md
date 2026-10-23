---
title: CaseCompass
tagline: "Describe a consumer dispute and see how Indian commissions decided similar cases."
order: 3
featured: true
year: 2026
problem: "People with a consumer complaint rarely know how similar cases ended. CaseCompass searches past NCDRC and state-commission judgments and shows outcomes, amounts and the verbatim final order, without predicting your result."
stack: [FastAPI, Next.js, Postgres, pgvector, Jina embeddings, Groq, networkx]
links:
  github: https://github.com/DEVJHAWAR11/CaseCompass
  live: https://case-compass-zeta.vercel.app
health: https://casecompass-qw3v.onrender.com/health
interaction: rrf
gallery:
  - { file: 1-search.jpg, caption: "Search starts with the dispute in your own words." }
  - { file: 2-index.jpg, caption: "The problem it answers, and what the index holds." }
  - { file: 3-how-it-searches.jpg, caption: "How it searches: plain words rewritten into legal terms, meaning and keyword search fused, every claim cited." }
highlights: ["627 consumer-commission judgments across ten categories, with citation edges", "Hybrid search (HNSW vectors plus tsvector) merged with RRF; shipped setup reached hit@5 1.00 and MRR 0.96 on 27 airline stories", "No AI writes the answer at search time: outcome counts are computed in code and the order sentence is quoted", "Outcome labels are about 71-78% accurate on blind samples, reported openly"]
hard: "Matching a layperson's story to consumer-court judgments written in legal language, without letting a model invent outcomes. One small LLM call rewrites the query, then keyword and vector search are merged with Reciprocal Rank Fusion over late-chunked embeddings. Outcomes come from an offline extraction step plus code rules, and the counts are computed in code."
numbers:
  - { value: "0.96", label: "MRR on a 27-story airline eval, up from 0.87 with plain vector search", src: "https://github.com/DEVJHAWAR11/CaseCompass/blob/main/eval/results.md" }
  - { value: "1.00", label: "hit@5 on the same eval: a relevant case in the top five every time", src: "https://github.com/DEVJHAWAR11/CaseCompass/blob/main/eval/results.md" }
  - { value: "88%", label: "of top-5 results in the right category across 16 stories", src: "https://github.com/DEVJHAWAR11/CaseCompass/blob/main/eval/results_multi.md" }
  - { value: "627", label: "judgments indexed", src: "https://github.com/DEVJHAWAR11/CaseCompass#readme" }
diagram:
  nodes:
    - { id: user, label: "Next.js", role: "story in, cards out", col: 0, row: 1 }
    - { id: api, label: "FastAPI", role: "rate limits, pipeline", col: 1, row: 1 }
    - { id: rewrite, label: "Query rewrite", role: "Groq, up to 3 legal queries", col: 2, row: 0 }
    - { id: embed, label: "Jina", role: "query embeddings, cached", col: 2, row: 2 }
    - { id: pg, label: "Postgres", role: "pgvector HNSW + tsvector GIN", col: 3, row: 1 }
    - { id: rrf, label: "RRF + stats", role: "best chunk per case, counts in code", col: 4, row: 1 }
  edges:
    - [user, api, "POST /search"]
    - [api, rewrite, "story"]
    - [api, embed, "story + rewrites"]
    - [rewrite, pg, "keyword"]
    - [embed, pg, "vector"]
    - [pg, rrf, "ranked chunks"]
    - [rrf, user, "cards"]
---

## What I built

CaseCompass takes a consumer dispute written in plain words and shows how Indian consumer commissions decided similar cases: who won, the refund and compensation, the laws cited, the verbatim sentence of the final order, and a link to the full judgment. It never predicts your result. It started with airline refunds and now covers ten categories.

## How it works

An offline pipeline ingests judgments from Indian Kanoon, dedupes them, has a small model extract outcome fields, applies code rules, then chunks and embeds them twice with Jina (once normally, once with late chunking). A search rewrites the story into up to three legal queries, runs vector and keyword search, merges with RRF and collapses to the best chunk per case. The backend never calls Indian Kanoon during a search.

## Decisions worth noting

- No model writes the answer at search time. Counts like "7 of 10 ruled for the complainant" are computed in code from stored fields.
- Amounts the model extracts must literally appear in the judgment text, or they are dropped. Unsure answers escalate to the larger model.
- Reranking and merging the citation graph into the ranking both scored worse, so the reranker is off and related cases are a separate list.
- The app degrades instead of failing: if Jina is down it falls back to keyword search with a notice.
- Spend is capped in code: a cap of 3 LLM calls per request, a daily token budget, per-IP rate limits and a usage ledger.
- The known weak spot is who appealed, which is why outcome labels are 71-78% accurate and the README says to read the order.
