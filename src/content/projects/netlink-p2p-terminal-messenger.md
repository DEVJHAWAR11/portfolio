---
title: NetLink P2P Terminal Messenger
tagline: "Two-way terminal chat over raw TCP sockets, written in plain C++."
order: 11
featured: false
problem: "A hands-on way to learn how TCP connections and socket programming work underneath chat apps."
stack: [C++, POSIX sockets, TCP, threads, Make]
links:
  github: https://github.com/DEVJHAWAR11/NetLink-P2P-Terminal-Messenger
highlights: ["Uses only standard system headers and seven socket calls", "Separate receive thread so sending and receiving don't block each other", "Runs on Linux or WSL, over localhost or a real network"]
---

NetLink is a terminal messenger where two computers send and receive messages in real time over a TCP connection. The server calls `socket`, `bind`, `listen` and `accept`; the client calls `socket` and `connect`. Each side then runs one thread for typing and sending and another for receiving.

I built it to understand how a TCP connection is established at the lowest level, including the handshake that happens inside `connect()`, and how to use POSIX threads for concurrent I/O.
