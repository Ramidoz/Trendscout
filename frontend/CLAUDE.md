@AGENTS.md

## Project: TrendScope

### What this is
TrendScope is a production-grade AI agent system that analyzes real-time YouTube trends and generates content strategies.

This is NOT a demo app.
This is a portfolio-grade product designed to showcase:
- agentic reasoning
- decision-making automation
- real-world usability

### Core positioning
This project represents an AI agent that can replace human content strategists.

Every feature, UI decision, and output should reinforce:
- intelligence
- autonomy
- usefulness

### Current architecture
- Backend: FastAPI agent system (/agent endpoint)
- Frontend: Next.js (App Router)
- Agent: ReAct loop with tool calling
- Tools:
  - fetch_youtube_trends
  - score_trends
  - generate_briefing

### Frontend expectations
The UI must feel like:
- a real SaaS product (not a hackathon demo)
- interactive and iterative
- capable of continuous decision refinement

Avoid:
- static outputs
- one-shot experiences
- dead-end flows

Prioritize:
- follow-ups
- refinement loops
- visibility into agent reasoning
- user control over decisions

### Design philosophy
- Clean, minimal, high-signal UI
- Dark theme with subtle depth
- Clear hierarchy (focus attention on best action)
- No clutter, no unnecessary elements

### Product direction (IMPORTANT)
This app will evolve into:
- a continuous content strategy assistant
- potentially connected to user accounts (YouTube, analytics)
- an always-on decision engine

Design choices should be:
- scalable
- extensible
- modular

### Engineering rules
- Do NOT introduce unnecessary libraries
- Do NOT over-engineer
- Prefer simple, readable, production-ready code
- Keep components modular and reusable

### When making changes
Always think like:
- a product builder
- a hiring manager reviewing this project
- a user evaluating if this replaces a human

Every improvement should answer:
"Does this make the agent feel more intelligent and useful?"