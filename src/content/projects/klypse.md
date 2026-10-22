---
title: Klypse
tagline: "A Chrome extension that answers questions about any YouTube video."
order: 7
featured: false
problem: "Long videos are slow to skim, and many have no subtitles or are not in English. Klypse lets you ask a question and streams an answer from the transcript."
stack: [FastAPI, LangChain, FAISS, Groq, Whisper, Chrome extension, Docker]
links:
  github: https://github.com/DEVJHAWAR11/Klypse
  live: https://klypse-ai-youtube-extension-bot.netlify.app/
health: https://klypse-ai-youtube-extension-bot.netlify.app/
highlights: ["Transcript fallback chain: YouTubeTranscriptApi, Groq Whisper (under 24MB audio), then local Whisper", "One FAISS index per video, persisted to disk, so repeat questions load instantly", "MMR retrieval (k=3) for relevant but non-redundant chunks", "Answers stream word by word over SSE; the AWS IP block by YouTube was diagnosed and documented"]
diagram:
  nodes:
    - { id: ext, label: "Chrome extension", role: "video_id + question", col: 0, row: 1 }
    - { id: api, label: "FastAPI", role: "/ask/stream", col: 1, row: 1 }
    - { id: tr, label: "Transcript pipeline", role: "subtitles, Groq Whisper, local Whisper", col: 2, row: 0 }
    - { id: faiss, label: "FAISS", role: "per-video index", col: 3, row: 1 }
    - { id: qa, label: "RetrievalQA", role: "MMR k=3, Groq LLaMA-3.3-70b", col: 4, row: 1 }
  edges:
    - [ext, api, "POST"]
    - [api, tr, "no index yet"]
    - [tr, faiss, "chunk + embed"]
    - [api, faiss, "index exists"]
    - [faiss, qa, "retrieve"]
    - [qa, ext, "SSE stream"]
---

Klypse is a Chrome extension with a FastAPI backend. You ask a question about a YouTube video and get an answer streamed back in real time. It handles videos with no subtitles and non-English content by falling back to Whisper, and it can run fully offline with a local model.

The backend cleans and chunks the transcript, stores it in a FAISS index for that video, and answers with a LangChain RetrievalQA chain on Groq's LLaMA-3.3-70b. I also wrote up why the hosted version failed on AWS: YouTube returned HTTP 403 to cloud IPs, which I confirmed by comparing EC2 and local responses and then worked around with a local fallback.
