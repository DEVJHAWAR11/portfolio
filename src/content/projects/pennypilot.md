---
title: PennyPilot
tagline: "A Telegram bot that logs and answers questions about your spending."
order: 8
featured: false
problem: "Expense apps are easy to install but tedious to keep up. PennyPilot lets you log by text, voice or receipt photo and ask about your spending in plain language."
stack: [Python, aiogram, LangGraph, FastMCP, Supabase, asyncpg, Groq]
links:
  github: https://github.com/DEVJHAWAR11/PennyPilot
  video: http://youtube.com/watch?v=383-_fI73e0
highlights: ["Quick entries like \"200 food\" go through deterministic regex parsing, not the LLM", "A LangGraph agent answers spending questions by calling MCP tools in a background process", "A scheduled job flags unusual spending and sends a monthly summary on the 1st", "Exports CSV and monthly PDF statements, and draws pie charts in memory"]
diagram:
  nodes:
    - { id: tg, label: "Telegram", role: "webhook", col: 0, row: 1 }
    - { id: disp, label: "aiogram", role: "dispatcher", col: 1, row: 1 }
    - { id: agent, label: "LangGraph agent", role: "Groq LLaMA 3", col: 2, row: 0 }
    - { id: mcp, label: "MCP server", role: "tools, background process", col: 3, row: 0 }
    - { id: sched, label: "APScheduler", role: "anomalies, summaries", col: 2, row: 2 }
    - { id: db, label: "Supabase Postgres", role: "asyncpg pool", col: 4, row: 1 }
  edges:
    - [tg, disp, "update"]
    - [disp, agent, "natural language"]
    - [agent, mcp, "tool calls"]
    - [mcp, db]
    - [disp, db, "regex entries"]
    - [sched, db, "cron"]
---

PennyPilot is a Telegram bot for tracking daily expenses. You can type a quick entry, send a voice note that Whisper transcribes, or photograph a receipt, and ask things like "how much did I spend on food this month?" in plain language.

Simple entries use deterministic parsing; questions go to a LangGraph agent that reads the data through an MCP server. It runs on Render via webhooks with a separate, limited database pool for the free tier, and sends proactive anomaly alerts and monthly summaries.
