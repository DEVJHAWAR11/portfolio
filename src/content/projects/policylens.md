---
title: PolicyLens
tagline: "Ask questions of a policy PDF and get answers tied to the exact clause and page."
order: 4
featured: true
year: 2026
problem: "Insurance and policy documents are long and easy to misread. PolicyLens lets you ask the document questions and check each answer against the cited clause."
stack: [FastAPI, Next.js, Node, Supabase, pgvector, BM25, Jina, Groq]
links:
  github: https://github.com/DEVJHAWAR11/policylens
  live: https://policylens-devj-web.onrender.com/
health: https://policylens-devj-web.onrender.com/
interaction: policy
highlights: ["Hybrid search: pgvector plus BM25 merged by reciprocal-rank fusion, then a reranker keeps the best 4 passages", "On a 28-question eval, the current version found evidence for 24/24 answerable questions and handled 4/4 not-in-document cases", "Postgres is the ingest job queue, claimed with FOR UPDATE SKIP LOCKED", "Clicking a source chip opens the PDF at the page with the clause highlighted"]
diagram:
  nodes:
    - { id: web, label: "Next.js", role: "chat, PDF viewer", col: 0, row: 1 }
    - { id: node, label: "Node API", role: "auth, limits, uploads, proxy", col: 1, row: 1 }
    - { id: rag, label: "FastAPI RAG", role: "search, rerank, stream answer", col: 2, row: 1 }
    - { id: db, label: "Supabase", role: "Postgres + pgvector, storage", col: 3, row: 0 }
    - { id: jina, label: "Jina", role: "embeddings + reranker", col: 4, row: 0 }
    - { id: groq, label: "Groq", role: "language model", col: 4, row: 2 }
  edges:
    - [web, node, "HTTPS + token"]
    - [node, rag, "internal key"]
    - [node, db, "uploads, jobs"]
    - [rag, db, "hybrid search"]
    - [rag, jina, "embed, rerank"]
    - [rag, groq, "answer from passages"]
---

## What I built

PolicyLens lets you upload an insurance or policy PDF and ask questions in plain English. Each answer points to the section and page it came from, and clicking the source opens the PDF at that page with the clause highlighted. If the document does not contain the answer, it says so. It also has summaries and a compare mode that asks one question across several policies.

This repo is a fork of arpanz/policylens. I built the RAG engine in it (pull requests #1, #2 and #4, all merged); the web app and the rest of the project are the original author's work.

## How it works

Uploading stores the PDF and queues a job. A worker reads the PDF, chunks it along its own headings, embeds the chunks and writes a summary. A question runs vector and BM25 search, merges them with reciprocal-rank fusion, reranks, and gives only the top passages to the language model, which streams the answer back with its sources.

## Decisions worth noting

- Chunks follow the document's headings, so a chunk is one clause or table row that remembers its section and page.
- Questions and passages use separate embedding modes, and keyword plus meaning search is merged rather than either alone.
- The database is the job queue (`FOR UPDATE SKIP LOCKED`), and failed jobs retry three times before showing Failed.
- Each policy's chunks are ranked directly instead of through a shared approximate index, so one user's data can't crowd out another's.
- Hosted APIs handle embeddings and reranking, which keeps the server small.
