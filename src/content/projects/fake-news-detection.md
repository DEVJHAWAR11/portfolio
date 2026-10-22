---
title: Fake News Detection
tagline: "A Bidirectional LSTM with GloVe embeddings that classifies news as real or fake."
order: 16
featured: false
problem: "Misinformation spreads faster than corrections. This model learns what fake news language looks like from raw text instead of hand-made features."
stack: [Python, TensorFlow, Keras, GloVe, LSTM]
links:
  github: https://github.com/DEVJHAWAR11/Fake-News-Detection
highlights: ["Trained on 20,000+ labelled articles", "Compared Naive Bayes (~88%), LSTM (~97%), GRU (~98%), CNN (~97%) and BiLSTM (~99%)", "Pretrained 100-d GloVe vectors, max length 500 tokens, 128-unit BiLSTM"]
---

I built a deep learning classifier for fake news trained on more than 20,000 labelled articles. The README compares five approaches, a TF-IDF Naive Bayes baseline, LSTM, GRU, CNN and a Bidirectional LSTM, and the BiLSTM did best at roughly 99% accuracy.

The final model tokenizes and pads text, uses pretrained GloVe embeddings, then a 128-unit bidirectional LSTM with dropout and a sigmoid output. Reading both directions helps with cases like "not good" versus "good".
