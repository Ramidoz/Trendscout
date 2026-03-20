"""ReAct-style agent that wraps TrendScope's pipeline tools.

The agent receives a user question, reasons about which tools to call,
executes them in sequence, and returns a final answer. Max 5 steps.
"""

import json

import litellm

from app.collectors.youtube import fetch_youtube_trends
from app.services.scoring import score_trends
from app.services.briefing import generate_briefing

# Tool definitions for the LLM (OpenAI function-calling format)
_TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "fetch_youtube_trends",
            "description": (
                "Search YouTube for recent trending videos matching a query. "
                "Returns a list of normalized video data (topic, views, likes, "
                "published_at, channel). Use this first to gather raw trend data."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "Search query for YouTube trends",
                    },
                    "max_results": {
                        "type": "integer",
                        "description": "Max videos to fetch (default 20, max 50)",
                        "default": 20,
                    },
                },
                "required": ["query"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "score_trends",
            "description": (
                "Score and rank raw trend data by velocity, engagement, "
                "competition, relevance, quality, actionability, and specificity. "
                "Filters out spam, gibberish, and irrelevant topics. "
                "Requires output from fetch_youtube_trends as input."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "The original user query, used for relevance scoring",
                    },
                },
                "required": ["query"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "generate_briefing",
            "description": (
                "Generate a content briefing with top opportunities and an "
                "LLM-powered action plan from scored trends. "
                "Requires scored trends from score_trends as input."
            ),
            "parameters": {
                "type": "object",
                "properties": {},
            },
        },
    },
]

_SYSTEM_PROMPT = """You are TrendScope — an AI content strategist for creators.

You help creators find trending topics and generate actionable content ideas by analyzing live YouTube data.

TOOLS:
1. fetch_youtube_trends — searches YouTube for recent trending videos
2. score_trends — scores/ranks trends by relevance, quality, actionability. Requires fetched data.
3. generate_briefing — generates briefing with top opportunities and action plan. Requires scored data.

PLANNING (before first tool call):
- Identify the user's intent in one phrase
- Decide what data you need and which tools in what order
- Keep planning internal — do not output it to the user

REFLECTION (after each tool result):
- Assess: did this give me what I need?
- Decide: call next tool, or answer now?
- Do not repeat a tool call you already made with the same arguments

EFFICIENCY:
- Standard query → fetch → score → briefing (3 calls). ALWAYS complete all 3 steps for any single-topic query.
- Comparison → fetch A, fetch B, score A, score B, then answer from scored data (4 calls, skip briefing)
- Always call fetch_youtube_trends even for broad topics — let the data speak. Only skip tools if the query is completely nonsensical.
- After score_trends, you MUST call generate_briefing unless the query is explicitly a comparison (contains "vs", "compare", "versus", "or"). Single-topic queries always need a full briefing.
- Never call the same tool twice with identical arguments

RULES:
- Never make up trends — always fetch fresh data
- Present results with rankings, scores, and actionable recommendations
- Keep your final answer focused on what the creator should do next
- Max 5 tool calls per request"""

# Max steps to prevent infinite loops
_MAX_STEPS = 5


def _execute_tool(name: str, args: dict, state: dict) -> str:
    """Execute a tool and return its result as a string.

    State tracks intermediate results between tool calls.
    """
    if name == "fetch_youtube_trends":
        query = args.get("query", "")
        max_results = min(args.get("max_results", 20), 50)
        trends = fetch_youtube_trends(query, max_results=max_results)
        state["raw_trends"] = trends
        state["last_query"] = query
        return json.dumps({
            "status": "ok",
            "count": len(trends),
            "topics": [t["topic"] for t in trends[:10]],
        })

    if name == "score_trends":
        raw = state.get("raw_trends")
        if not raw:
            return json.dumps({"error": "No raw trends available. Call fetch_youtube_trends first."})
        query = args.get("query", state.get("last_query", ""))
        scored = score_trends(raw, query=query)
        state["scored_trends"] = scored
        return json.dumps({
            "status": "ok",
            "count": len(scored),
            "top_5": [
                {"topic": s["topic"], "score": s["opportunity_score"], "stage": s["stage"]}
                for s in scored[:5]
            ],
        })

    if name == "generate_briefing":
        scored = state.get("scored_trends")
        if not scored:
            return json.dumps({"error": "No scored trends available. Call score_trends first."})
        briefing = generate_briefing(scored)
        state["briefing"] = briefing
        return json.dumps({
            "status": "ok",
            "top_opportunities": len(briefing.get("top_opportunities", [])),
            "action_plan_ideas": len(briefing.get("action_plan", [])),
            "briefing": briefing,
        })

    return json.dumps({"error": f"Unknown tool: {name}"})


def run_agent(user_message: str, model: str = "gpt-4o-mini") -> dict:
    """Run the ReAct agent loop.

    Args:
        user_message: The user's question or request.
        model: LLM model to use for reasoning.

    Returns:
        dict with keys:
            - answer: The agent's final response text
            - steps: List of (tool_name, tool_args, tool_result) tuples
            - briefing: The full briefing dict if generated, else None
    """
    messages = [
        {"role": "system", "content": _SYSTEM_PROMPT},
        {"role": "user", "content": user_message},
    ]

    state = {}  # Shared state between tool calls
    steps = []

    # Track calls to prevent duplicates
    prior_calls = set()

    for step in range(_MAX_STEPS):
        response = litellm.completion(
            model=model,
            messages=messages,
            tools=_TOOLS,
            tool_choice="auto",
        )

        choice = response.choices[0]
        assistant_msg = choice.message

        # Append assistant message to conversation
        messages.append(assistant_msg.model_dump())

        # If no tool calls, the agent is done — return final answer
        if not assistant_msg.tool_calls:
            return {
                "answer": assistant_msg.content or "",
                "steps": steps,
                "briefing": state.get("briefing"),
            }

        # Execute each tool call
        for tool_call in assistant_msg.tool_calls:
            fn_name = tool_call.function.name
            fn_args = json.loads(tool_call.function.arguments)

            # Deduplicate: skip identical calls
            call_key = (fn_name, json.dumps(fn_args, sort_keys=True))
            if call_key in prior_calls:
                messages.append({
                    "role": "tool",
                    "tool_call_id": tool_call.id,
                    "content": json.dumps({"skipped": "Duplicate call — results already available."}),
                })
                continue

            prior_calls.add(call_key)
            result = _execute_tool(fn_name, fn_args, state)
            steps.append((fn_name, fn_args, result))

            # Append tool result to conversation
            messages.append({
                "role": "tool",
                "tool_call_id": tool_call.id,
                "content": result,
            })

    # Hit max steps — synthesize from whatever state we have
    final = state.get("briefing") or state.get("scored_trends")
    return {
        "answer": "Here's what I found based on the available data.",
        "steps": steps,
        "briefing": state.get("briefing"),
    }
