---
title: LocalSqueeze
tagline: "Shrinks photos and videos to an exact target size, entirely on your PC."
order: 10
featured: false
problem: "Forms that demand a file under 2MB push people to upload private ID photos to random online compressors. LocalSqueeze does it offline."
stack: [Python, Tkinter, ffprobe, FFmpeg]
links:
  github: https://github.com/DEVJHAWAR11/LocalSqueeze
highlights: ["Images: iterative binary search over JPEG/PNG quality 1-100 against the size you ask for", "Videos: bitrate computed from duration via ffprobe, as target bits divided by duration minus audio bitrate", "No cloud connection; ships as a single Windows .exe"]
---

LocalSqueeze is a Windows desktop utility with a Tkinter interface. You choose a file, type the size a website wants, such as 2 MB or 500 KB, and it writes a compressed copy next to the original with `_compressed` in the name. Nothing leaves your computer.

For images it binary-searches the quality setting until the output fits the byte limit. For videos it reads the duration with ffprobe and calculates the bitrate needed to hit the target.
