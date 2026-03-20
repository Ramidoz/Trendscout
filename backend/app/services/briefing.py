import json

import litellm


def _velocity_label(velocity: float) -> str:
    if velocity > 0.66:
        return "high"
    elif velocity > 0.33:
        return "medium"
    return "low"


def _engagement_label(engagement: float) -> str:
    if engagement > 0.66:
        return "high"
    elif engagement > 0.33:
        return "medium"
    return "low"


def generate_briefing(scored_trends: list[dict], model: str = "gpt-4o-mini") -> dict:
    """Generate a content briefing from scored trends.

    Deterministic: top 5 opportunities ranked by score with confidence.
    LLM-powered: 2-3 specific, actionable content ideas.

    Input: list of dicts with keys: topic, velocity, engagement, opportunity_score, stage
    Output: dict with top_opportunities and action_plan
    """
    # Step 1: Deterministic — top opportunities
    top = sorted(scored_trends, key=lambda x: x["opportunity_score"], reverse=True)[:5]

    top_opportunities = []
    for rank, t in enumerate(top, 1):
        score = t["opportunity_score"]
        confidence = min(1.0, max(0.0, score + 0.1))
        stage = t.get("stage", "unknown")

        # Stage-appropriate reason text
        if stage == "early":
            stage_reason = f"Ranked #{rank}. Early stage — high upside, low competition. Act now before others notice."
        elif stage == "rising":
            stage_reason = f"Ranked #{rank}. Rising stage — proven momentum with room to grow."
        else:
            stage_reason = f"Ranked #{rank}. Saturated — high volume but crowded. Needs a unique angle to stand out."

        top_opportunities.append({
            "topic": t["topic"],
            "opportunity_score": score,
            "confidence": round(confidence, 4),
            "reason": stage_reason,
            "velocity_label": _velocity_label(t.get("velocity", 0)),
            "engagement_label": _engagement_label(t.get("engagement", 0)),
            "stage": stage,
        })

    # Step 2: LLM — action plan
    action_plan = _generate_action_plan(top_opportunities, model)

    return {
        "top_opportunities": top_opportunities,
        "action_plan": action_plan,
    }


def _velocity_interpretation(label: str) -> str:
    if label == "high":
        return "rapidly growing"
    elif label == "medium":
        return "steady growth"
    return "slow movement"


def _engagement_interpretation(label: str) -> str:
    if label == "high":
        return "strong audience interest"
    elif label == "medium":
        return "moderate audience interest"
    return "low audience interest"


def _generate_action_plan(opportunities: list[dict], model: str) -> list[dict]:
    """Use LLM to generate 2-3 specific content ideas from top opportunities."""
    if not opportunities:
        return []

    # Format trending topics with interpreted context
    topics_text = ""
    for i, opp in enumerate(opportunities, 1):
        vel = opp['velocity_label']
        eng = opp['engagement_label']
        topics_text += (
            f"{i}. Topic: {opp['topic']}\n"
            f"   Stage: {opp['stage']}\n"
            f"   Velocity: {vel} ({_velocity_interpretation(vel)})\n"
            f"   Engagement: {eng} ({_engagement_interpretation(eng)})\n"
        )

    prompt = f"""You are a creator-native content strategist reacting to LIVE trend data. You write like a top-performing YouTube/TikTok creator — not a blogger or journalist. Your ideas must feel scroll-stopping and outcome-driven.

STAGE ACCURACY (CRITICAL — NEVER VIOLATE):
- The "Stage" field in the data below is GROUND TRUTH. You MUST NOT contradict it.
- If stage = "saturated": NEVER say "early", "rising", "before it peaks", "before saturation", "early adopters", or "before others catch on." Instead explain why it's worth covering despite saturation (unique angle, underserved audience, contrarian take).
- If stage = "early": emphasize first-mover advantage and low competition.
- If stage = "rising": emphasize proven momentum with room to grow.
- If ALL topics are saturated, acknowledge it: "This space is competitive — differentiation matters more than speed."

TITLE RULES (MANDATORY):
- Every title MUST include a clear outcome or payoff (save time, make money, grow faster, improve workflow)
- Be specific and concrete — name the trend directly
- Use creator-native formats:
  "This [X] will save you [Y]"
  "I tried [X] for a week — here's what changed"
  "Stop doing [X] — do this instead"
  "[Number] [things] that actually [outcome]"
- BANNED phrases (including variations): "how X works", "transforming", "introduction to", "unlock", "game-changer", "game-changing", "revolutionary", "ultimate guide", "you didn't know", "top 10", "you won't believe", "here's what you need to know", "here's what happened", "surging", "taking over", "everything you need to know"
- Include a time anchor where appropriate ("right now", "in 2026", "this week")

HOOK RULES:
- MAXIMUM 20 words. Cut ruthlessly — if it won't work in 2 seconds of spoken delivery, it's too long.
- Start with tension, curiosity, or a bold claim — never a slow setup
- BANNED openings: "With the rise of...", "In today's world...", "Are you looking for...", "Have you ever wondered...", "If you're looking for..."
- Must sound SPOKEN, not written — imagine saying it to camera

CONTENT RULES:
- Ideas must react to LIVE trends, not evergreen content
- Each idea must be differentiated — no overlapping angles
- Prefer early and rising stage trends — most upside before saturation
- Avoid saturated topics unless you have a truly contrarian angle
- Every idea must clearly answer: "What does the viewer gain?"
- Hooks must be framed as templates the creator can use — do NOT write first-person claims the creator didn't make (e.g., don't say "I lost everything" unless the creator actually did)

BAD vs GOOD examples:
BAD: "How AI Tools Are Transforming Content Creation"
GOOD: "3 AI Tools Creators Are Switching To Right Now (And Why)"
BAD: "Automate Your Workflow with Python"
GOOD: "This Python Script Replaces 3 Hours of Work Daily"
BAD: "Why Calisthenics Meetups Are Surging Right Now"
GOOD: "This 15-Min Calisthenics Routine Builds More Muscle Than the Gym"

PRIORITY & DIFFERENTIATION:
- Assign priority 1, 2, or 3 to each idea (1 = do this FIRST)
- Priority 1 MUST be the most ACTIONABLE idea — something a creator can film today and post. Not informational, not news commentary. A viewer should be able to DO something after watching.
- Priority 2: next best opportunity
- Priority 3: lowest score or saturated/contrarian play
- Prefer early/rising stage topics for Priority 1. Only use saturated topics for Priority 1 if no early/rising topics exist.
- Each idea must target a DIFFERENT angle: one for efficiency, one for growth, one for contrarian insight. No overlap.

Trending topics (live data):
{topics_text}

For each idea return:
- priority: 1, 2, or 3 (1 = do this first)
- title: creator-native, outcome-driven, specific to the trend
- format: "short", "long", or "post"
- hook: 1-2 punchy spoken-style sentences, MAXIMUM 20 words
- reason: MUST start with "Stage: [actual stage value]." Then explain (1) why NOW and (2) what the viewer gains. Do not contradict the stage.
- expected_outcome: 1 short sentence describing what the viewer gains (e.g., "Save hours of editing time", "Capture early audience before competition rises")

Return ONLY valid JSON. The response must be a JSON object with an "ideas" key containing an array of 2-3 idea objects, sorted by priority (1 first)."""

    messages = [{"role": "user", "content": prompt}]

    # Try up to 2 times (initial + 1 retry)
    for attempt in range(2):
        try:
            response = litellm.completion(
                model=model,
                messages=messages,
                response_format={"type": "json_object"},
            )

            content = response.choices[0].message.content
            parsed = json.loads(content)

            # Extract ideas from various possible JSON shapes
            ideas = _extract_ideas(parsed)

            if ideas:
                # Enforce 2-3 items max
                ideas = ideas[:3]

                # Validate each idea has required fields
                validated = []
                for idea in ideas:
                    validated.append({
                        "priority": idea.get("priority", len(validated) + 1),
                        "title": idea.get("title", "Untitled"),
                        "format": idea.get("format", "short") if idea.get("format") in ("short", "long", "post") else "short",
                        "hook": idea.get("hook", ""),
                        "reason": idea.get("reason", ""),
                        "expected_outcome": idea.get("expected_outcome", ""),
                    })
                # Sort by priority ascending (1 first)
                validated.sort(key=lambda x: x["priority"])
                return validated

        except (json.JSONDecodeError, KeyError, IndexError, TypeError):
            if attempt == 0:
                continue  # Retry once
            break
        except Exception:
            # LLM API error — don't crash
            break

    # Fallback: return empty action plan
    return []


def _extract_ideas(parsed: dict | list) -> list[dict]:
    """Extract idea objects from various JSON response shapes."""
    # Direct array
    if isinstance(parsed, list):
        return parsed

    # Object with "ideas" key
    if isinstance(parsed, dict):
        for key in ("ideas", "action_plan", "items", "content_ideas"):
            if key in parsed and isinstance(parsed[key], list):
                return parsed[key]

        # If the dict itself looks like a single idea
        if "title" in parsed:
            return [parsed]

    return []
