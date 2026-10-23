---
title: TidyFlow
tagline: "Reads a messy folder, proposes a clean structure, and moves nothing until you approve."
order: 5
featured: true
year: 2026
problem: "Downloads and Desktop folders fill up with files named scan_0412.pdf. TidyFlow reads what is inside each file, proposes folders from your actual files, and lets you review before anything is touched."
stack: [Python, FastAPI, React, TypeScript, Tailwind, OCR, SHA-256]
links:
  github: https://github.com/DEVJHAWAR11/Tidyflow
  live: https://github.com/DEVJHAWAR11/Tidyflow/releases/latest
interaction: tidy
highlights: ["Reads file contents, with on-device OCR (Apple Vision on macOS, PaddleOCR on Windows)", "Copies by default, verifies every copy with SHA-256, never overwrites", "Undo checks each file's hash before removing anything", "Works with no API key by falling back to rules and file types"]
hard: "Sorting files by what's inside them without ever losing one. Text is extracted, with on-device OCR for scans, and the folder plan is built from the actual files. Only moves above 0.85 confidence happen on their own and the rest wait for review. Every copy is verified with SHA-256 and never overwrites, and undo re-checks the hashes before removing anything."
numbers:
  - { value: "~106", label: "tests", src: "https://github.com/DEVJHAWAR11/Tidyflow/tree/main/tests" }
  - { value: "0.85", label: "confidence needed before a file is sorted without asking", src: "https://github.com/DEVJHAWAR11/Tidyflow/blob/main/config.yaml" }
  - { value: "2", label: "platforms shipped: macOS and Windows builds", src: "https://github.com/DEVJHAWAR11/Tidyflow/releases" }
diagram:
  nodes:
    - { id: pick, label: "Pick folder", role: "Downloads, Desktop, any", col: 0, row: 1 }
    - { id: read, label: "Read files", role: "text extraction + on-device OCR", col: 1, row: 1 }
    - { id: plan, label: "Propose plan", role: "folders from your files", col: 2, row: 1 }
    - { id: review, label: "Review", role: "low-confidence files wait for you", col: 3, row: 1 }
    - { id: apply, label: "Copy + verify", role: "SHA-256, undoable", col: 4, row: 1 }
  edges:
    - [pick, read, "scan"]
    - [read, plan, "excerpts"]
    - [plan, review, "proposal"]
    - [review, apply, "approve"]
---

## What I built

TidyFlow is a desktop app for macOS and Windows. You point it at a messy folder and it reads the files, proposes a clean set of folders, shows where everything will go, and only touches a file after you say so. You can also ask for changes to the plan in plain English.

## How it works

It reads text from PDFs, Office documents, code and spreadsheets, and uses on-device OCR for scans and screenshots, so a file called `scan_0412.pdf` can land next to your other invoices. The folder plan comes from your actual files, with a detail level from Fewer to Detailed. Files it is sure about are pre-placed, and the uncertain ones wait for review. Duplicates are flagged, including near-identical images.

## Decisions worth noting

- Files are copied into an `Organized` folder by default, each copy is checked with SHA-256, and existing files are never overwritten.
- Undo is hash-checked before it removes anything, then it cleans up the empty folders it created.
- Files and OCR stay on the machine. If you connect an AI provider, only file names and short excerpts are sent, with passwords, keys and tokens scrubbed first.
- With no key it falls back to rules and file types. With one, you can choose DeepSeek, OpenAI, Gemini, Groq, OpenRouter or any OpenAI-compatible endpoint.
