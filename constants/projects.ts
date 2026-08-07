export const projects = [
  {
    title: "PennyPilot",
    slug: "pennypilot",
    tagline: "An Expense Tracker Telegram Bot.",
    overview: "PennyPilot is a Telegram bot designed to manage and track your daily expenses seamlessly. By leveraging natural language processing through LangGraph and an MCP Server, it allows users to log expenses, check balances, and generate summaries using simple conversational commands.",
    features: [
      "Natural language expense logging",
      "Interactive balance checking and summaries",
      "Seamless integration with Telegram",
      "Robust data persistence with PostgreSQL"
    ],
    techStack: ["Python", "LangGraph", "MCP Server", "PostgreSQL", "Telegram API"],
    challenges: [
      "Handling complex conversational flows",
      "Ensuring robust state management with PostgreSQL"
    ],
    feedback: false,
    links: {
      video: "http://youtube.com/watch?v=383-_fI73e0",
      github: "https://github.com/DEVJHAWAR11/PennyPilot",
    },
  },
  {
    title: "PolicyLens",
    slug: "policylens",
    tagline: "An AI-powered tool to analyze and summarize complex policies.",
    overview: "PolicyLens leverages advanced NLP models to parse lengthy privacy policies and legal documents, summarizing key points and identifying potential red flags for users. It solves the problem of users blindly agreeing to terms without understanding them.",
    features: [
      "Automated policy summarization",
      "Highlighting of critical clauses",
      "User-friendly dashboard for document upload",
      "Fast processing powered by LLMs"
    ],
    techStack: ["Python", "FastAPI", "OpenAI API", "RAG", "LangChain", "Jina Embeddings"],
    challenges: [
      "Handling large documents efficiently",
      "Ensuring accurate and unbiased summaries"
    ],
    feedback: false,
    links: {
      live: "https://policylens-ai.vercel.app",
      github: "https://github.com/DEVJHAWAR11/policylens",
    },
  },
  {
    title: "Klypse AI",
    slug: "klypse",
    tagline: "An AI-powered YouTube extension bot.",
    overview: "Klypse AI is a powerful browser extension that integrates with YouTube to provide AI-driven insights, summaries, and interactions directly within the video player. It helps users quickly extract information from long videos.",
    features: [
      "Automated video summarization",
      "Interactive chatbot for video context",
      "Seamless YouTube DOM integration",
      "Real-time processing"
    ],
    techStack: ["Python", "LangChain", "FastAPI", "RAG", "Docker"],
    challenges: [
      "Integrating smoothly with YouTube's dynamic DOM",
      "Managing state across extension content scripts and background service workers"
    ],
    feedback: true,
    links: {
      live: "https://klypse-ai-youtube-extension-bot.netlify.app/",
      github: "http://github.com/DEVJHAWAR11/Klypse",
    },
  },
  {
    title: "LLM Semantic Cache",
    slug: "llm-semantic-cache",
    tagline: "A semantic caching layer for Large Language Models to reduce latency and API costs.",
    overview: "LLM Semantic Cache improves the efficiency of LLM applications by caching and retrieving semantically similar queries. It reduces redundant API calls, saving costs and significantly decreasing response times.",
    features: [
      "Semantic similarity matching",
      "Configurable caching strategies",
      "Integration with popular LLM providers",
      "Low-latency retrieval"
    ],
    techStack: ["Python", "Redis", "Sentence Transformers", "FastAPI"],
    challenges: [
      "Optimizing embedding generation for speed",
      "Managing cache eviction policies"
    ],
    feedback: true,
    links: {
      live: "https://llm-semantic-cache-1.onrender.com/docs",
      github: "https://github.com/DEVJHAWAR11/LLM_Semantic_Cache",
    },
  },
  {
    title: "Real Estate Platform",
    slug: "real-estate",
    tagline: "A comprehensive real estate platform for property search and listing.",
    overview: "This platform connects buyers, sellers, and agents by providing a centralized hub for property listings. It simplifies the property search process with advanced filtering and real-time updates.",
    features: [
      "Advanced search and filtering",
      "Property listing management for agents",
      "Interactive map view",
      "Real-time notifications"
    ],
    techStack: ["Python", "Streamlit", "Scikit-learn", "Pandas", "NumPy", "Machine Learning"],
    challenges: [
      "Implementing efficient geospatial queries",
      "Building a scalable real-time notification system"
    ],
    feedback: false,
    links: {
      live: "https://realestate-analysis-ml.streamlit.app/",
      github: "https://github.com/DEVJHAWAR11/Real_Estate",
    },
  },
  {
    title: "Transformer from Scratch",
    slug: "transformer-from-scratch",
    tagline: "A custom implementation of the Transformer architecture.",
    overview: "This project involves building the core components of the Transformer architecture from the ground up. It serves as an educational tool to deeply understand self-attention mechanisms and sequence-to-sequence modeling.",
    features: [
      "Implementation of Multi-Head Attention",
      "Custom Positional Encoding",
      "Encoder-Decoder structure",
      "Training scripts for basic translation tasks"
    ],
    techStack: ["Python", "PyTorch", "NumPy"],
    challenges: [
      "Correctly implementing the complex mathematical operations",
      "Optimizing the model for efficient training on limited hardware"
    ],
    feedback: true,
    links: {
      github: "https://github.com/DEVJHAWAR11/pytorch-transformer-from-scratch",
    },
  },
  {
    title: "ZombieKill",
    slug: "zombiekill",
    tagline: "A system for detecting and neutralizing malicious processes.",
    overview: "ZombieKill is an intelligent system designed to monitor and terminate unauthorized or harmful processes in real-time. It enhances system security by proactively identifying anomalous behavior.",
    features: [
      "Real-time process monitoring",
      "Anomaly detection using ML",
      "Automated threat termination",
      "Detailed security logs"
    ],
    techStack: ["C++", "System APIs"],
    challenges: [
      "Minimizing false positives",
      "Ensuring low overhead on system resources"
    ],
    feedback: false,
    links: {
      github: "https://github.com/DEVJHAWAR11/ZombieKill",
    },
  },
  {
    title: "LocalSqueeze",
    slug: "localsqueeze",
    tagline: "A local file compression and optimization utility.",
    overview: "LocalSqueeze is a desktop utility that allows users to compress and optimize various file formats locally without relying on cloud services. It ensures data privacy while significantly reducing file sizes.",
    features: [
      "Support for multiple file formats (images, documents)",
      "Offline processing for maximum privacy",
      "Adjustable compression levels",
      "Batch processing capabilities"
    ],
    techStack: ["Python"],
    challenges: [
      "Integrating C++ compression libraries with Node.js",
      "Designing an intuitive user interface"
    ],
    feedback: false,
    links: {
      github: "https://github.com/DEVJHAWAR11/LocalSqueeze",
    },
  }
];
