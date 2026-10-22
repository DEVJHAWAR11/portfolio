---
title: NLP Toolkit
tagline: "A Streamlit app running sentiment, summarisation and entity extraction locally."
order: 17
featured: false
problem: "A simple way to try three common transformer tasks without API keys."
stack: [Python, HuggingFace Transformers, PyTorch, Streamlit]
links:
  github: https://github.com/DEVJHAWAR11/NLP-Toolkit
highlights: ["Sentiment with DistilBERT SST-2", "Summarisation with BART-large-CNN", "Named entity recognition with dslim/bert-base-NER", "Runs on CPU with no API keys"]
---

NLP Toolkit is a Streamlit web app that runs three HuggingFace transformer models on your own machine: sentiment analysis with a confidence score, text summarisation, and named entity recognition for people, organisations and locations.

Models download from the HuggingFace Hub on first run and are cached after that, so no API keys are needed.
