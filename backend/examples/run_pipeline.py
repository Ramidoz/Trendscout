"""
TrendScope Pipeline Demo

Runs the full pipeline:
1. Fetch YouTube trends → cleaned topics
2. Score trends → velocity, engagement, competition, stage
3. Generate briefing → top opportunities + actionable content ideas

Usage:
    python backend/examples/run_pipeline.py

Requires .env file with:
    YOUTUBE_API_KEY=...
    OPENAI_API_KEY=...  (or ANTHROPIC_API_KEY for Claude models)
"""

import json
import os
import sys

# Add project root to path so imports work
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

from backend.app.collectors.youtube import clean_topic, fetch_youtube_trends
from backend.app.services.scoring import score_trends
from backend.app.services.briefing import generate_briefing


def main():
    query = "AI tools for content creators 2026"
    print(f"{'='*60}")
    print(f"TRENDSCOPE PIPELINE DEMO")
    print(f"Query: {query}")
    print(f"{'='*60}\n")

    # --- Step 1: clean_topic demo ---
    print("[1] TOPIC CLEANING EXAMPLES")
    print("-" * 40)
    test_titles = [
        "SHOCKING!! You Won't Believe This AI Tool 🔥🔥",
        "Best AI Tools for YouTube Creators in 2026",
        "🤖💰 INSANE Money Hack!!! Must Watch!!!",
        "",
    ]
    for title in test_titles:
        cleaned = clean_topic(title)
        print(f"  raw:     {title}")
        print(f"  cleaned: {cleaned}")
        print()

    # --- Step 2: Fetch YouTube data ---
    print(f"[2] FETCHING YOUTUBE DATA")
    print("-" * 40)
    try:
        trends = fetch_youtube_trends(query, max_results=20)
        print(f"  Fetched {len(trends)} videos\n")
        for t in trends[:3]:
            print(f"  topic:    {t['topic']}")
            print(f"  raw:      {t['raw_title']}")
            print(f"  views:    {t['views']:,}")
            print(f"  likes:    {t['likes']:,}")
            print(f"  channel:  {t['channel']}")
            print()
    except Exception as e:
        print(f"  ERROR: {e}")
        print("  Using sample data instead...\n")
        trends = [
            {"topic": "ai tools for content creators", "raw_title": "AI Tools for Content Creators", "views": 500000, "likes": 25000, "published_at": "2026-03-17T10:00:00Z", "channel": "TechCreator"},
            {"topic": "best video editing ai 2026", "raw_title": "Best Video Editing AI 2026", "views": 300000, "likes": 18000, "published_at": "2026-03-18T02:00:00Z", "channel": "EditPro"},
            {"topic": "how to grow on youtube with ai", "raw_title": "How to Grow on YouTube with AI", "views": 200000, "likes": 15000, "published_at": "2026-03-16T15:00:00Z", "channel": "GrowthHacker"},
            {"topic": "ai thumbnail generator", "raw_title": "AI Thumbnail Generator", "views": 150000, "likes": 9000, "published_at": "2026-03-18T08:00:00Z", "channel": "DesignAI"},
            {"topic": "ai tools for content creators", "raw_title": "AI Tools for Content Creators 2", "views": 100000, "likes": 7000, "published_at": "2026-03-17T20:00:00Z", "channel": "CreatorHub"},
            {"topic": "chatgpt for youtube scripts", "raw_title": "ChatGPT for YouTube Scripts", "views": 80000, "likes": 5500, "published_at": "2026-03-18T06:00:00Z", "channel": "ScriptAI"},
        ]

    # --- Step 3: Score trends ---
    print(f"[3] SCORED TRENDS")
    print("-" * 40)
    scored = score_trends(trends)
    for s in scored[:10]:
        print(f"  {s['topic']}")
        print(f"    score: {s['opportunity_score']:.4f} | velocity: {s['velocity']:.4f} | engagement: {s['engagement']:.4f} | stage: {s['stage']}")
        print()

    # --- Step 4: Generate briefing ---
    print(f"[4] BRIEFING")
    print("-" * 40)
    try:
        briefing = generate_briefing(scored, model="gpt-4o-mini")
        print(json.dumps(briefing, indent=2))
    except Exception as e:
        print(f"  ERROR generating briefing: {e}")
        print("  Showing deterministic section only...\n")
        # Show at least the deterministic part
        top = sorted(scored, key=lambda x: x["opportunity_score"], reverse=True)[:5]
        for t in top:
            score = t["opportunity_score"]
            confidence = min(1.0, max(0.0, score + 0.1))
            print(f"  {t['topic']} (score: {score:.4f}, confidence: {confidence:.4f}, stage: {t['stage']})")

    print(f"\n{'='*60}")
    print("PIPELINE COMPLETE")
    print(f"{'='*60}")


if __name__ == "__main__":
    main()
