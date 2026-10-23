---
title: ExpenseTracker MCP
tagline: "A small MCP server that lets an assistant add, list and summarise expenses."
order: 9
featured: false
problem: "Letting an AI assistant manage expenses needs a clean tool interface rather than ad-hoc scripts. This server exposes expense tracking as MCP tools."
stack: [Python, FastMCP, aiosqlite, SQLite]
links:
  github: https://github.com/DEVJHAWAR11/ExpenseTracker_MCP
highlights: ["Tools: add_expense, list_expenses and summarize", "Categories are served as an MCP resource from a JSON file", "Async SQLite with WAL mode"]
---

This repo has no README, so this entry comes from the code. It is an MCP server built with FastMCP that exposes three tools: `add_expense` (date, amount, category, optional subcategory and note), `list_expenses` for a date range, and `summarize` for a date range with an optional category filter.

Data is stored in a SQLite database through aiosqlite, and the category list is exposed as a resource at `expense:///categories`.
