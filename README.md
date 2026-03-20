# TrendScope

**AI-powered content strategist that tells creators what to post next — and why now.**

TrendScope analyzes live YouTube trend data, scores opportunities using velocity, engagement, and competition signals, and generates prioritized, actionable content recommendations through an LLM-powered briefing engine.

---

## Problem

Content creators face a constant challenge: **knowing what to post next**.

- Trends move fast. By the time a creator notices a topic blowing up, the window has already closed.
- Existing tools (Google Trends, Social Blade) show *what's trending* — but not *what to do about it*.
- Generic "top 10 trending" lists don't account for competition, timing, or a creator's specific niche.

Creators need an analyst who watches the data, identifies the best opportunities *before* they saturate, and delivers a clear action plan. TrendScope is that analyst.

---

## Solution

TrendScope acts as a personalized AI data analyst for content creators:

- **Scores every trend** using a weighted formula that balances growth velocity, audience engagement, and competitive saturation
- **Classifies timing** — is a trend early (high upside), rising (proven momentum), or saturated (too late)?
- **Generates specific, creator-native recommendations** — not generic advice, but scroll-stopping titles, hooks, and formats tied to live data
- **Prioritizes decisively** — Priority #1 is the best bet right now, with a clear explanation of *why*

---

## How It Works

TrendScope runs a 3-stage pipeline on every query:

### 1. Data Collection
Pulls live video data from YouTube's API — titles, view counts, likes, publish timestamps, and channel info. Strips clickbait and normalizes topics for clean analysis.

### 2. Trend Scoring
Each topic gets scored on three dimensions:
- **Velocity** — how fast views are accumulating per hour (with damping for brand-new uploads)
- **Engagement** — like-to-view ratio as a proxy for audience interest
- **Competition** — how many other creators are covering the same topic

These combine into a single **opportunity score** (0–1), and each trend is classified as `early`, `rising`, or `saturated` based on time since publication.

### 3. Recommendation Generation
The top opportunities feed into an LLM that generates 2–3 content ideas, each with:
- A creator-native, outcome-driven title
- A punchy hook designed for the first 2 seconds
- A reason explaining *why now* and *what the viewer gains*
- A clear priority ranking (1 = do this first)

---

## Example Output

**Query: "AI tools for creators"**

### Top Opportunities
| Topic | Score | Stage | Velocity | Engagement |
|-------|-------|-------|----------|------------|
| ai tools creators switching to | 0.87 | early | high | high |
| chatgpt video editing workflow | 0.72 | rising | medium | high |
| free ai thumbnail generators | 0.65 | rising | high | medium |

### Action Plan

**#1 — "3 AI Tools Creators Are Quietly Switching To Right Now"**
- Format: short
- Hook: "There's a shift happening and most creators haven't noticed yet. These three tools just changed my entire workflow."
- Why now: Highest momentum trend in early stage — creators who post now capture audience attention before saturation hits.
- Outcome: Viewers discover tools that save 5+ hours per week on content production.

**#2 — "I Replaced My Editor With ChatGPT — Here's What Happened"**
- Format: long
- Hook: "I gave ChatGPT my raw footage and told it to edit. The result surprised me."
- Why now: Rising engagement signals strong audience curiosity — proven interest with room to grow.
- Outcome: Creators learn a concrete workflow that cuts editing time in half.

**#3 — "Stop Paying for Thumbnails — These Free AI Tools Are Better"**
- Format: post
- Hook: "Canva templates are dead. Here's what's replacing them."
- Why now: Contrarian angle on a rising trend — positions the creator against conventional advice.
- Outcome: Save $50+/month on design tools without sacrificing quality.

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Data Collection | YouTube Data API v3 | Live trend data (search + statistics) |
| Scoring Engine | Python | Velocity, engagement, and competition scoring |
| Briefing Generator | LiteLLM + GPT-4o-mini | Creator-native content recommendations |
| API Server | FastAPI | RESTful endpoint serving briefings |
| Frontend | Next.js + TypeScript + Tailwind | Interactive query interface |

---

## Key Features

- **Opportunity scoring** — weighted formula (60% velocity + 25% engagement + 15% competition gap) surfaces the best bets, not just the most popular topics
- **Timing awareness** — early/rising/saturated classification helps creators catch trends before they peak
- **Priority ranking** — every briefing has a clear #1 recommendation with reasoning for *why this, why now*
- **Creator-native output** — titles and hooks follow real platform conventions, not marketing speak
- **Differentiated angles** — each recommendation targets a different approach (efficiency, growth, contrarian) to avoid redundancy

---

## Scoring Formula

```
opportunity_score = 0.6 * normalized_velocity
                  + 0.25 * normalized_engagement
                  + 0.15 * (1 - competition_penalty)

velocity = views / hours_since_publish  (damped 0.7x if < 2 hours old)
engagement = likes / views
competition_penalty = min(topic_frequency / 10, 1.0)
```

**Stage classification:**
- `early` — published < 12 hours ago (highest upside)
- `rising` — 12–48 hours (proven momentum)
- `saturated` — 48+ hours (crowded, needs contrarian angle)

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

# Create .env from example
cp .env.example .env
# Add your API keys to .env

# Start the API server
uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), enter a topic, and click **Generate Strategy**.

---

## Project Structure

```
trendscope/
├── backend/
│   ├── app/
│   │   ├── collectors/
│   │   │   └── youtube.py          # YouTube API data collection + topic cleaning
│   │   ├── services/
│   │   │   ├── scoring.py          # Velocity, engagement, competition scoring
│   │   │   └── briefing.py         # LLM-powered recommendation engine
│   │   └── main.py                 # FastAPI server
│   ├── requirements.txt
│   └── .env.example
└── frontend/
    └── src/app/
        └── page.tsx                # Next.js query interface
```
