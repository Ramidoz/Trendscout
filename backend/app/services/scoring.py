from collections import Counter
from datetime import datetime, timezone


def _parse_published_at(iso_string: str) -> datetime | None:
    """Safely parse an ISO 8601 datetime string to a timezone-aware datetime.

    Handles trailing 'Z' by replacing with '+00:00'.
    Returns None if parsing fails.
    """
    try:
        # Handle YouTube's trailing Z format
        if iso_string.endswith("Z"):
            iso_string = iso_string[:-1] + "+00:00"
        return datetime.fromisoformat(iso_string)
    except (ValueError, TypeError):
        return None


# Words that carry no intent signal
_FILLER_WORDS = {
    "the", "a", "an", "is", "are", "was", "were", "be", "been", "being",
    "have", "has", "had", "do", "does", "did", "will", "would", "could",
    "should", "may", "might", "shall", "can", "to", "of", "in", "for",
    "on", "with", "at", "by", "from", "as", "into", "about", "and", "or",
    "but", "not", "no", "so", "if", "than", "too", "very", "just", "how",
    "what", "when", "where", "who", "which", "that", "this", "it", "its",
    "my", "your", "our", "their", "his", "her", "all", "each", "every",
    "any", "some", "up", "out", "get", "got", "new", "now", "here",
}

# Topics containing these clickbait/spam phrases get penalized
_NOISE_PENALTY_PHRASES = {
    "make money", "get rich", "free", "bulk", "unlimited", "earn money",
    "side hustle", "passive income", "rich quick", "giveaway",
    "no cost", "easy money",
}

# Toy/low-value project indicators — penalized to prefer real-world workflows
_TOY_PROJECT_PHRASES = {
    "bot", "mouse", "simple project", "demo", "basic script",
}

# Vague phrases that signal low specificity
_VAGUE_PHRASES = [
    "use these", "try this", "do this instead", "this will help",
    "you need to know", "stop doing this", "check this out",
    "watch this", "dont miss", "must see", "need to see",
    "use this", "do this", "these tips", "this will help you",
]

# Words that signal concrete, specific content
_SPECIFICITY_WORDS = {
    # tools & tech
    "tool", "tools", "app", "apps", "software", "plugin", "api", "script",
    "workflow", "framework", "platform", "dashboard", "extension",
    # actions & techniques
    "tutorial", "routine", "workout", "exercise", "technique", "method",
    "strategy", "setup", "template", "formula", "recipe", "hack",
    "guide", "walkthrough", "review", "comparison",
    # domains
    "python", "javascript", "react", "ai", "gpt", "chatgpt", "claude",
    "bitcoin", "ethereum", "xrp", "solana", "nft",
    "calisthenics", "pushup", "pullup", "handstand", "squat", "plank",
    "yoga", "cardio", "hiit", "stretching",
    "automation", "scraping", "deploy", "docker", "kubernetes",
}

# Words that boost actionability — topics a creator can actually make content from
_ACTIONABLE_WORDS = {
    "how", "tutorial", "guide", "workflow", "routine",
    "automation", "step", "setup", "walkthrough", "technique",
    "method", "recipe", "template", "exercise",
}

# Words that reduce actionability — informational/passive content
_PASSIVE_WORDS = {
    "news", "meetup", "reaction", "community", "live", "stream",
    "update", "announcement", "interview", "podcast", "discussion",
}


def _extract_keywords(text: str) -> list[str]:
    """Extract meaningful keywords from text, stripping filler words. Preserves order."""
    return [w for w in text.lower().split() if w not in _FILLER_WORDS]


def _identify_primary_keywords(query: str) -> set[str]:
    """Identify the most intent-heavy keywords in a query.

    For "AI tools for creators" → {"ai", "tools", "creators"} (domain + nouns)
    For "python automation" → {"python", "automation"} (both are primary)
    For "crypto news" → {"crypto"} (news is generic)

    Heuristic: remove generic modifiers, keep domain terms and specific nouns.
    """
    generic_modifiers = {
        "best", "top", "good", "great", "amazing", "easy", "simple",
        "quick", "fast", "latest", "recent", "news", "update", "updates",
        "tips", "tricks", "ideas", "ways", "things", "stuff", "help",
    }
    keywords = _extract_keywords(query)
    primary = [w for w in keywords if w not in generic_modifiers]
    return set(primary) if primary else set(keywords)


# Semantic neighbors: words that count as partial matches for each other
_SEMANTIC_NEIGHBORS = {
    "automation": {"automate", "automated", "automating", "script", "scripting", "bot"},
    "automate": {"automation", "automated", "automating", "script", "bot"},
    "tools": {"tool", "app", "apps", "software", "platform", "workflow"},
    "tool": {"tools", "app", "apps", "software", "platform"},
    "creators": {"creator", "influencer", "influencers", "youtuber", "content"},
    "creator": {"creators", "influencer", "influencers", "youtuber", "content"},
    "beginners": {"beginner", "basics", "starter", "start", "learn", "learning", "intro"},
    "beginner": {"beginners", "basics", "starter", "start", "learn", "learning", "intro"},
    "workout": {"workouts", "exercise", "exercises", "routine", "training"},
    "exercise": {"exercises", "workout", "workouts", "routine", "training"},
    "crypto": {"cryptocurrency", "bitcoin", "btc", "ethereum", "eth", "xrp", "blockchain"},
    "python": {"py", "scripting", "coding", "programming"},
    "fitness": {"workout", "exercise", "training", "gym", "health"},
    "ai": {"artificial", "intelligence", "gpt", "chatgpt", "llm", "machine"},
}


def _relevance_score(topic: str, query: str) -> tuple[float, bool]:
    """Compute intent-aware relevance between a topic and the user's query.

    Returns (score, has_keyword_match):
    - score: 0.0 to 1.0
    - has_keyword_match: True if topic contains at least one primary keyword (or semantic neighbor)

    Scoring layers:
    1. Full phrase match → 1.0
    2. Keyword overlap (exact + semantic) → proportional
    3. Primary keyword enforcement → penalty if missing core intent words
    4. Bigram adjacency bonus → +0.15 for consecutive keyword pairs
    5. Noise penalty → 0.7x for spammy topics
    """
    query_lower = query.lower()
    topic_lower = topic.lower()

    query_keywords = set(_extract_keywords(query_lower))
    topic_keywords = set(_extract_keywords(topic_lower))
    primary_keywords = _identify_primary_keywords(query_lower)

    if not query_keywords:
        return 1.0, True

    # Full phrase match
    if query_lower in topic_lower:
        return 1.0, True

    # Compute overlap: exact matches + semantic neighbor matches
    exact_overlap = query_keywords & topic_keywords

    # Semantic expansion: check if topic contains a neighbor of a missing query keyword
    semantic_overlap = set()
    for qw in query_keywords - exact_overlap:
        neighbors = _SEMANTIC_NEIGHBORS.get(qw, set())
        if neighbors & topic_keywords:
            semantic_overlap.add(qw)

    total_overlap = exact_overlap | semantic_overlap
    primary_overlap = primary_keywords & total_overlap

    # Hard filter: must match at least one primary keyword (exact or semantic)
    if not primary_overlap:
        return 0.0, False

    # Base score: exact matches count full, semantic matches count 0.7
    keyword_score = (len(exact_overlap) + len(semantic_overlap) * 0.7) / len(query_keywords)
    keyword_score = min(1.0, keyword_score)

    # Primary keyword enforcement: missing primary keywords get penalized
    if len(primary_keywords) >= 2:
        primary_ratio = len(primary_overlap) / len(primary_keywords)
        if primary_ratio < 1.0:
            # Gentle penalty: 0.7x for missing half, 0.85x for missing one of three
            keyword_score *= 0.5 + 0.5 * primary_ratio

    # Bigram adjacency bonus
    query_word_list = _extract_keywords(query_lower)
    if len(query_word_list) >= 2 and len(total_overlap) >= 2:
        for i in range(len(query_word_list) - 1):
            bigram = f"{query_word_list[i]} {query_word_list[i+1]}"
            if bigram in topic_lower:
                keyword_score = min(1.0, keyword_score + 0.15)
                break

    return keyword_score, True


def _is_gibberish(word: str) -> bool:
    """Detect gibberish words: repeated syllables, no vowels (if long), unusual patterns."""
    import re as _re
    if len(word) <= 2:
        return False

    # Repeated syllable patterns: "gugugaga", "hahaha", "lalala", "seeu6"
    if len(word) >= 4:
        # Check if word is made of repeating 2 or 3 char chunks
        for size in (2, 3):
            chunk = word[:size]
            rebuilt = chunk * (len(word) // size)
            remainder = word[len(rebuilt):]
            # Must verify the rebuilt string actually matches the word
            if rebuilt + remainder == word:
                if len(remainder) <= size and (not remainder or chunk.startswith(remainder)):
                    if len(word) >= size * 2:  # At least 2 repetitions
                        return True

        # Alternating consonant-vowel with very repetitive structure
        # Catches "gugugaga" type: short repeating syllables (1-2 chars each)
        if len(word) >= 6:
            syllables = _re.findall(r'[^aeiou]*[aeiou]+', word)
            if len(syllables) >= 3:
                unique_syllables = set(syllables)
                # Only flag if syllables are short (babble-like) AND highly repetitive
                avg_len = sum(len(s) for s in syllables) / len(syllables)
                if len(unique_syllables) <= 2 and avg_len <= 2.0:
                    return True

    # Long words without vowels
    if len(word) > 4 and not any(c in word for c in "aeiou"):
        known_acronyms = {"xrp", "nft", "btc", "eth", "gym", "gpt", "llm", "css", "html"}
        if word not in known_acronyms:
            return True

    # Very long unsplit tokens
    if len(word) > 15:
        return True

    return False


def _topic_quality_score(topic: str) -> float:
    """Score topic quality from 0.0 to 1.0. Low scores = vague, spammy, or gibberish.

    Checks:
    1. Gibberish detection (repeated syllables, nonsense tokens)
    2. Vagueness penalty (generic phrases with no concrete nouns)
    3. Specificity boost (tools, techniques, named entities)
    4. Length sanity (too short or too long)
    """
    words = topic.lower().split()
    if len(words) < 2:
        return 0.3

    score = 1.0

    # Gibberish detection
    gibberish_count = sum(1 for w in words if _is_gibberish(w))
    if gibberish_count > 0:
        gibberish_ratio = gibberish_count / len(words)
        if gibberish_ratio > 0.3:
            return 0.1  # Mostly gibberish — hard drop
        score *= max(0.4, 1.0 - (gibberish_count * 0.25))

    # Filler ratio
    meaningful = [w for w in words if w not in _FILLER_WORDS and len(w) > 1]
    if len(meaningful) < 2:
        score *= 0.4  # Almost no meaningful content
    elif len(words) > 0:
        filler_ratio = 1.0 - (len(meaningful) / len(words))
        if filler_ratio > 0.6:
            score *= 0.5

    # Vagueness penalty
    topic_lower = topic.lower()
    for vague in _VAGUE_PHRASES:
        if vague in topic_lower:
            score *= 0.7
            break

    # Specificity boost
    specific_matches = sum(1 for w in words if w in _SPECIFICITY_WORDS)
    if specific_matches >= 2:
        score = min(1.0, score * 1.2)
    elif specific_matches == 0 and len(meaningful) > 2:
        score *= 0.8

    return round(score, 4)


def _actionability_score(topic: str) -> float:
    """Score how actionable a topic is (0.0 to 1.0).

    Boosts topics a creator can film/produce (tutorials, workflows, routines).
    Penalizes passive/informational topics (news, reactions, meetups).
    """
    words = set(topic.lower().split())
    topic_lower = topic.lower()

    score = 0.5  # neutral baseline

    # Boost for actionable signals
    actionable_hits = len(words & _ACTIONABLE_WORDS)
    # Also check multi-word phrases
    if "step by step" in topic_lower:
        actionable_hits += 1
    score += actionable_hits * 0.15

    # Penalize passive/informational signals
    passive_hits = len(words & _PASSIVE_WORDS)
    score -= passive_hits * 0.15

    return round(min(1.0, max(0.1, score)), 4)


def _specificity_score(topic: str) -> float:
    """Score how specific and concrete a topic is (0.0 to 1.0).

    Boosts topics with concrete nouns (tools, apps, exercises).
    Penalizes vague/generic topics.
    """
    words = topic.lower().split()
    topic_lower = topic.lower()

    score = 0.6  # neutral baseline

    # Boost for specificity words (concrete nouns)
    specific_hits = sum(1 for w in words if w in _SPECIFICITY_WORDS)
    if specific_hits >= 3:
        score += 0.3
    elif specific_hits >= 2:
        score += 0.2
    elif specific_hits >= 1:
        score += 0.1

    # Penalize vague phrases
    for vague in _VAGUE_PHRASES:
        if vague in topic_lower:
            score -= 0.15
            break

    # Boost multi-word meaningful topics (more words = more specific, up to a point)
    meaningful = [w for w in words if w not in _FILLER_WORDS and len(w) > 1]
    if len(meaningful) >= 4:
        score += 0.1

    return round(min(1.0, max(0.1, score)), 4)


def _noise_penalty(topic: str) -> float:
    """Compute cumulative noise penalty for clickbait/spam and toy projects.

    Returns a multiplier (0.0 to 1.0) — lower = more penalized.
    """
    topic_lower = topic.lower()
    penalty = 1.0

    # Clickbait/spam penalty
    for phrase in _NOISE_PENALTY_PHRASES:
        if phrase in topic_lower:
            penalty *= 0.8

    # Toy/low-value project penalty
    words = set(topic_lower.split())
    for phrase in _TOY_PROJECT_PHRASES:
        if " " in phrase:
            if phrase in topic_lower:
                penalty *= 0.7
        else:
            if phrase in words:
                penalty *= 0.7

    return penalty


def score_trends(trends: list[dict], query: str = "") -> list[dict]:
    """Score normalized trend data by velocity, engagement, competition, relevance, and quality.

    Input: list of dicts with keys: topic, raw_title, views, likes, published_at, channel
    Output: list of dicts with keys: topic, velocity, engagement, opportunity_score, stage

    Scoring formula:
        base_score = 0.6 * norm_velocity + 0.25 * norm_engagement + 0.15 * (1 - competition_penalty)
        final = base_score * relevance * quality * actionability * specificity * noise_penalty
    """
    if not trends:
        return []

    now = datetime.now(timezone.utc)

    # Step 1: Compute raw metrics for each trend
    computed = []
    for trend in trends:
        views = max(trend.get("views", 0), 0)
        likes = max(trend.get("likes", 0), 0)
        topic = trend.get("topic", "")

        published_at = _parse_published_at(trend.get("published_at", ""))
        if published_at is None:
            # Skip items with unparseable timestamps
            continue

        # Time calculation
        total_seconds = (now - published_at).total_seconds()
        hours_since_publish = max(total_seconds / 3600, 1)

        # Velocity with damping for brand-new content
        velocity = views / hours_since_publish
        if hours_since_publish < 2:
            velocity *= 0.7

        # Engagement
        engagement = likes / views if views > 0 else 0

        # Stage classification
        if hours_since_publish < 12:
            stage = "early"
        elif hours_since_publish < 48:
            stage = "rising"
        else:
            stage = "saturated"

        computed.append({
            "topic": topic,
            "raw_velocity": velocity,
            "raw_engagement": engagement,
            "stage": stage,
        })

    if not computed:
        return []

    # Step 2: Competition penalty (uses cleaned topic)
    topic_counts = Counter(item["topic"] for item in computed)

    # Step 3: Normalize velocity and engagement to 0-1
    max_velocity = max(item["raw_velocity"] for item in computed)
    max_engagement = max(item["raw_engagement"] for item in computed)

    results = []
    for item in computed:
        norm_velocity = item["raw_velocity"] / max_velocity if max_velocity > 0 else 0
        norm_engagement = item["raw_engagement"] / max_engagement if max_engagement > 0 else 0
        competition_penalty = min(topic_counts[item["topic"]] / 10, 1.0)

        # Base score
        base_score = (
            0.6 * norm_velocity
            + 0.25 * norm_engagement
            + 0.15 * (1 - competition_penalty)
        )

        # Topic quality filter
        quality = _topic_quality_score(item["topic"])
        if quality < 0.3:
            continue  # Drop gibberish / junk topics

        # Relevance filtering and penalty
        if query:
            relevance, has_keyword = _relevance_score(item["topic"], query)

            # Hard filter: must match at least one primary keyword
            if not has_keyword:
                continue

            # Soft penalty based on relevance score
            if relevance >= 0.5:
                relevance_multiplier = 1.0
            else:
                relevance_multiplier = 0.4 + 0.6 * (relevance / 0.5)
        else:
            relevance_multiplier = 1.0

        # Actionability, specificity, and noise penalties
        actionability = _actionability_score(item["topic"])
        specificity = _specificity_score(item["topic"])
        noise = _noise_penalty(item["topic"])

        opportunity_score = (
            base_score * relevance_multiplier * quality
            * actionability * specificity * noise
        )

        results.append({
            "topic": item["topic"],
            "velocity": round(norm_velocity, 4),
            "engagement": round(norm_engagement, 4),
            "opportunity_score": round(opportunity_score, 4),
            "stage": item["stage"],
        })

    # Sort by opportunity_score DESC, tie-breaker: higher velocity first
    results.sort(key=lambda x: (x["opportunity_score"], x["velocity"]), reverse=True)

    return results
