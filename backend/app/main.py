import os

from dotenv import load_dotenv
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware

from app.collectors.youtube import fetch_youtube_trends
from app.services.scoring import score_trends
from app.services.briefing import generate_briefing
from app.agent import run_agent

# Load .env from backend directory
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

app = FastAPI(title="TrendScope API")

allowed_origins = [
    "http://localhost:3000",
    "https://frontend-ramidozs-projects.vercel.app",
    "https://frontend-omega-eight-ffgnsqg2ba.vercel.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"https://frontend-.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/briefing")
def get_briefing(query: str = Query(..., min_length=1, max_length=200)):
    """Fetch YouTube trends, score them, and generate a content briefing."""
    raw_trends = fetch_youtube_trends(query, max_results=20)
    scored = score_trends(raw_trends, query=query)
    briefing = generate_briefing(scored)

    return {
        "query": query,
        "briefing": briefing,
    }


@app.get("/agent")
def agent_query(q: str = Query(..., min_length=1, max_length=500)):
    """Ask the TrendScope agent a question about content trends."""
    result = run_agent(q)
    return {
        "answer": result["answer"],
        "steps": [
            {"tool": name, "args": args}
            for name, args, _ in result["steps"]
        ],
        "briefing": result["briefing"],
    }
