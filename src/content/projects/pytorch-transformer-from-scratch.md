---
title: Transformer From Scratch
tagline: "A full encoder-decoder Transformer in PyTorch, trained for English to German."
order: 14
featured: false
problem: "A way to understand attention properly by building every part of 'Attention is All You Need' myself."
stack: [Python, PyTorch, Multi30K, Colab]
links:
  github: https://github.com/DEVJHAWAR11/pytorch-transformer-from-scratch
highlights: ["Scaled dot-product and multi-head attention, positional encoding, position-wise feed-forward", "6-layer encoder and 6-layer decoder", "Noam learning-rate scheduler and label smoothing", "Task: English to German translation on Multi30K"]
---

This is a full encoder-decoder Transformer implemented from scratch in PyTorch, following Vaswani et al. (2017). It includes scaled dot-product and multi-head attention, positional encoding, feed-forward layers, and six-layer encoder and decoder stacks.

Training uses the Noam learning-rate scheduler and label smoothing on the Multi30K English-German translation task. The model code lives in `src/`, with step-by-step Colab notebooks alongside.
