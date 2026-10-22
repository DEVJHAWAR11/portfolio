---
title: Transaction Fraud Detector
tagline: "An end-to-end MLOps pipeline for credit card fraud, from raw data to monitored model."
order: 13
featured: false
problem: "A fraud model needs more than a good score: it needs gated promotion, safe rollout and retraining when data drifts. This project covers that whole lifecycle."
stack: [Python, XGBoost, MLflow, FastAPI, Evidently, Docker, GitHub Actions]
links:
  github: https://github.com/DEVJHAWAR11/Transaction-Fraud-Detector
highlights: ["Promotion gate checks thresholds and compares against the current champion", "Shadow mode, a canary at 5% of traffic, and A/B analysis with statistical significance", "Drift detection with Evidently and Wasserstein distance triggers automated retraining", "CI on GitHub Actions runs tests and the model validation gate on every push"]
diagram:
  nodes:
    - { id: data, label: "Validate + preprocess", role: "creditcard.csv", col: 0, row: 1 }
    - { id: train, label: "Train", role: "XGBoost + logistic regression", col: 1, row: 1 }
    - { id: mlflow, label: "MLflow", role: "experiment tracking", col: 2, row: 0 }
    - { id: gate, label: "Promotion gate", role: "thresholds + champion check", col: 2, row: 2 }
    - { id: serve, label: "FastAPI /predict", role: "production model", col: 3, row: 1 }
    - { id: mon, label: "Drift + performance", role: "Evidently, rolling metrics", col: 4, row: 1 }
  edges:
    - [data, train]
    - [train, mlflow, "log"]
    - [mlflow, gate]
    - [gate, serve, "pass"]
    - [serve, mon]
    - [mon, train, "retrain"]
---

This is an end-to-end MLOps project built in 10 stages. It validates and preprocesses transaction data, trains XGBoost and logistic regression models tracked in MLflow, and only promotes a model if it passes threshold checks and beats the current champion. The promoted model is served with FastAPI and Pydantic validation.

Around the model sit shadow mode, a canary simulation that routes 5% of traffic to the challenger, A/B analysis, Evidently drift reports, a rolling performance monitor, and a retraining pipeline triggered by drift or degradation. The whole thing is Dockerized with CI on GitHub Actions.
