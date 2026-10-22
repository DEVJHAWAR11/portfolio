---
title: Real Estate AI Suite
tagline: "Gurgaon property price prediction, analytics and recommendations in one Streamlit app."
order: 15
featured: false
year: 2025
problem: "Property listings are hard to compare. This app uses scraped Gurgaon data to estimate prices, show market patterns and suggest similar properties."
stack: [Python, Streamlit, scikit-learn, XGBoost, Plotly, Pandas]
links:
  github: https://github.com/DEVJHAWAR11/Real_Estate
  live: https://realestate-analysis-ml.streamlit.app/
  video: https://www.linkedin.com/posts/dev-jhawar11_realestate-ai-streamlit-activity-7335515596651929600-tioS
highlights: ["Data scraped from 99acres, then cleaned, explored and feature-engineered", "Price predictor takes 12 inputs and returns a range of the prediction plus or minus 0.22 Cr", "Target is log-transformed and inverted with expm1", "Recommender blends three cosine similarity matrices with a location distance matrix"]
---

This is an end-to-end data science project on Gurgaon real estate, from a web scrape of 99acres to a deployed multi-page Streamlit app. It has three modules: an analytics dashboard with Plotly charts and a sector map, a price predictor, and a content-based property recommender.

The predictor is a scikit-learn pipeline with encoding and scaling, trained on a log-transformed price. The recommender combines three cosine similarity matrices and a location distance matrix in a weighted score.
