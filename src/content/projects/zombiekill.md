---
title: ZombieKill
tagline: "Drag a locked file onto it and it finds and ends the process holding it."
order: 12
featured: false
problem: "Windows says 'Folder In Use' without telling you which program has the file open. ZombieKill finds that process and removes the lock."
stack: [C++, Windows NT APIs, CMake]
links:
  github: https://github.com/DEVJHAWAR11/ZombieKill
highlights: ["Uses NtQuerySystemInformation and NtQueryObject to scan system handles", "Drag and drop a file onto the .exe, no install", "Needs administrator rights for the kernel-level handle access"]
---

ZombieKill is a small Windows tool for the "folder or file in use" error. You drag the locked file onto the executable; it scans the system handle table for whoever holds the file, ends that process, and deletes the file.

Standard Windows APIs can't break a lock without knowing the process ID, so it uses the NT internal APIs `NtQuerySystemInformation` and `NtQueryObject`. It is written in C++ and built with CMake.
