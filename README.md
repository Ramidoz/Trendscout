# TrendScope -- AI Agent for Content Strategy

**An AI system that analyzes live trends and tells creators exactly what to post next -- ranked by opportunity and timing.**

[Live Demo](https://frontend-ramidozs-projects.vercel.app) | Enter a topic, get a strategy in seconds.

---

## The Problem

- Creators waste hours guessing what to post. Trends move faster than intuition.
- Existing tools (Google Trends, Social Blade) show **what's trending** -- not **what to do about it**.
- "Top 10 trending" lists ignore competition, timing, and saturation. They tell you what everyone else is already doing.
- By the time most creators notice a trend, the window has closed.

---

## The Solution

TrendScope is a **decision-making system**, not a dashboard.

It watches live data, scores every trend on a custom formula, and delivers a prioritized action plan with specific titles, hooks, and formats -- tied to real-time signals.

- **Opportunity scoring** -- surfaces underexploited trends, not just popular ones
- **Timing classification** -- flags whether a trend is early (high upside), rising (proven), or saturated (too late)
- **Actionable output** -- Priority #1 is the single best bet right now, with a clear reason why

---

## How It Works

```
User Query
    |
    v
1. FETCH -- Pull live video data from YouTube API
    |        Titles, views, likes, publish times, channels
    v
2. SCORE -- Apply custom opportunity algorithm
    |        Velocity + Engagement - Competition penalty
    |        Classify: early / rising / saturated
    v
3. REASON -- ReAct agent decides next steps
    |         Orchestrates tools, validates data quality
    v
4. GENERATE -- Produce ranked content strategy
             Titles, hooks, formats, timing rationale
```

The agent runs a **ReAct loop** (Reason + Act) -- it decides which tools to call, inspects intermediate results, and adapts its approach before generating the final strategy. This is not a fixed pipeline. The agent reasons about the data at each step.

---

## Scoring Algorithm

```
opportunity_score = 0.60 * velocity
                  + 0.25 * engagement
                  + 0.15 * (1 - competition_penalty)
```

| Signal | What It Measures | How It's Calculated |
|--------|-----------------|-------------------|
| Velocity | Growth speed | views / hours_since_publish (damped if < 2h) |
| Engagement | Audience interest | likes / views ratio |
| Competition | Saturation risk | topic_frequency / max_frequency |

**Stage classification:**

| Stage | Age | Signal |
|-------|-----|--------|
| Early | < 12 hours | Highest upside, low competition |
| Rising | 12-48 hours | Proven momentum, room to grow |
| Saturated | 48+ hours | Crowded, needs contrarian angle |

---

## Key Features

- **AI agent orchestration** -- ReAct loop with tool calling, not a hardcoded pipeline
- **Custom scoring algorithm** -- weighted formula balancing velocity, engagement, and competition
- **Relevance filtering** -- noise reduction and topic normalization before scoring
- **Timing awareness** -- early/rising/saturated classification catches trends before they peak
- **Interactive refinement** -- follow-up questions and strategy iteration in the UI
- **Agent transparency** -- every tool call is visible, showing how the agent reached its conclusions
- **Real-time data** -- decisions based on live YouTube signals, not cached snapshots

---

## System Architecture

```
+------------------+        +-------------------+        +------------------+
|    Frontend      |  --->  |     Backend       |  --->  |   External       |
|                  |        |                   |        |                  |
|  Next.js 16      |        |  FastAPI          |        |  YouTube API v3  |
|  React 19        |        |  ReAct Agent      |        |  GPT-4o-mini     |
|  Tailwind CSS v4 |        |  LiteLLM          |        |  (via LiteLLM)   |
|  TypeScript      |        |  Scoring Engine   |        |                  |
|                  |        |  Briefing Engine   |        |                  |
+------------------+        +-------------------+        +------------------+
     Vercel                      Railway
```

| Layer | Stack | Role |
|-------|-------|------|
| Frontend | Next.js, TypeScript, Tailwind CSS | Interactive query UI with refinement and follow-ups |
| API | FastAPI | Serves agent responses, orchestrates pipeline |
| Agent | LiteLLM + GPT-4o-mini | ReAct reasoning loop with function calling |
| Scoring | Python | Velocity, engagement, competition scoring |
| Data | YouTube Data API v3 | Live trend signals |

---

## Example Output

**Query: "AI tools for creators"**

### Top Opportunity

| Topic | Score | Stage | Velocity | Engagement |
|-------|-------|-------|----------|------------|
| ai tools creators switching to | 0.87 | early | high | high |

### Top Action

**"3 AI Tools Creators Are Quietly Switching To Right Now"**
- Format: Short-form video
- Hook: "There's a shift happening and most creators haven't noticed yet."
- Why now: Highest momentum trend in early stage -- creators who post now capture attention before saturation.
- Expected outcome: Viewers discover tools that save 5+ hours/week on production.

---

## What Makes This Different

| Typical Trend Tool | TrendScope |
|-------------------|------------|
| Shows what's trending | Tells you **what to do about it** |
| Generic popularity lists | Custom scoring with **competition + timing** signals |
| Static dashboard | **Agentic system** that reasons about data and adapts |
| Requires manual interpretation | Delivers **ready-to-use titles, hooks, and formats** |
| One-shot output | **Interactive refinement** with follow-up questions |

This is not an LLM wrapper. The scoring algorithm, relevance filtering, and stage classification run independently of the language model. The agent orchestrates structured tools -- it does not hallucinate trend data.

---

## Setup

### Prerequisites

- Python 3.11+
- Node.js 18+
- [YouTube Data API key](https://console.cloud.google.com/apis/credentials)
- OpenAI API key (or any LiteLLM-supported provider)

### Backend

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env   # Add your API keys
uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open [localhost:3000](http://localhost:3000) and enter a topic.

---

## Future Improvements

- **Creator personalization** -- factor in the user's niche, audience size, and posting history
- **Channel integration** -- connect YouTube Analytics to tailor recommendations to actual performance data
- **Continuous learning** -- track which recommendations led to high-performing content and feed that back into scoring
- **Multi-platform expansion** -- extend data collection to TikTok, X, and Reddit for cross-platform strategy

---

## Author

**Rohit Ananthan**

Data Scientist focused on AI agents, automation, and high-leverage systems.
