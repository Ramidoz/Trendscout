import os
import re
from datetime import datetime, timezone, timedelta

from googleapiclient.discovery import build


CLICKBAIT_PHRASES = [
    "shocking",
    "insane",
    "you won't believe",
    "must watch",
    "crazy",
    "wtf",
]

NOISE_WORDS = {
    "shorts", "short", "viral", "trending", "official", "video", "videos",
    "2026", "2025", "2024", "ytshorts", "subscribe", "like", "comment",
    "share", "reels", "tiktok", "fyp", "foryou", "foryoupage",
}

LANGUAGE_TAGS = {
    "hindi", "tamil", "telugu", "kannada", "malayalam", "bengali", "marathi",
    "gujarati", "urdu", "punjabi", "english", "spanish", "bangla",
}

# Common concatenated words found in YouTube titles/hashtags
_CONCAT_SPLITS = {
    "musttry": "must try",
    "mustwatch": "must watch",
    "mustknow": "must know",
    "musthave": "must have",
    "howto": "how to",
    "dontmiss": "dont miss",
    "homeworkout": "home workout",
    "fullbody": "full body",
    "fatburn": "fat burn",
    "fatloss": "fat loss",
    "weightloss": "weight loss",
    "bodyweight": "body weight",
    "noequipment": "no equipment",
    "streetworkout": "street workout",
    "voicevideo": "voice video",
}


def _split_concatenated(word: str) -> str:
    """Split known concatenated words. For unknown ones, try camelCase boundaries."""
    if word in _CONCAT_SPLITS:
        return _CONCAT_SPLITS[word]
    # Split on camelCase boundaries (e.g., "explainedTrading" -> "explained Trading")
    split = re.sub(r"([a-z])([A-Z])", r"\1 \2", word).lower()
    if split != word:
        return split
    # Split runs of 12+ chars that look like hashtag concatenation
    if len(word) > 12:
        # Try splitting at common word boundaries
        split = re.sub(
            r"(workout|exercise|fitness|tutorial|challenge|beginner|training|"
            r"motivation|calisthenics|programming|coding|python|crypto|bitcoin|"
            r"content|creator|editing|automation)",
            r" \1", word,
        ).strip()
        if split != word:
            return split
    return word


def clean_topic(title: str) -> str:
    """Clean a video title into a concise topic phrase (max 8 words).

    Steps:
    1. Remove hashtags (#shorts, #viral, etc.)
    2. Lowercase and strip non-alphanumeric characters
    3. Remove clickbait phrases
    4. Split concatenated words (musttry -> must try)
    5. Remove noise words, language tags, and duplicate tokens
    6. Cap at 8 words
    """
    # Remove hashtags before lowercasing (catches #Shorts, #VIRAL, etc.)
    cleaned = re.sub(r"#\w+", "", title)

    cleaned = cleaned.lower()

    # Remove non-alphanumeric except spaces
    cleaned = re.sub(r"[^a-z0-9 ]", "", cleaned)

    # Remove clickbait phrases
    for phrase in CLICKBAIT_PHRASES:
        cleaned = cleaned.replace(phrase, "")

    # Collapse spaces and split into words
    words = cleaned.split()

    # Split concatenated words
    expanded = []
    for word in words:
        expanded.extend(_split_concatenated(word).split())

    # Remove noise words, language tags, and single-character tokens
    filtered = []
    seen = set()
    for word in expanded:
        if word in NOISE_WORDS or word in LANGUAGE_TAGS:
            continue
        if len(word) <= 1:
            continue
        # Remove duplicate tokens
        if word in seen:
            continue
        seen.add(word)
        filtered.append(word)

    # Cap at 8 words
    filtered = filtered[:8]

    cleaned = " ".join(filtered)

    # Fallback if empty
    if not cleaned:
        words = title.lower().split()[:5]
        cleaned = " ".join(words)
        cleaned = re.sub(r"[^a-z0-9 ]", "", cleaned).strip()

    # Final safety
    if not cleaned:
        cleaned = "untitled"

    return cleaned


def fetch_youtube_trends(query: str, max_results: int = 50) -> list[dict]:
    """Fetch trending YouTube videos for a query and return normalized results.

    Uses YouTube Data API v3:
    - search().list() to find videos (100 quota units)
    - videos().list() to batch fetch statistics (1 quota unit)

    Requires YOUTUBE_API_KEY environment variable.
    """
    api_key = os.environ.get("YOUTUBE_API_KEY")
    if not api_key:
        raise ValueError(
            "YOUTUBE_API_KEY environment variable is not set. "
            "Get one at https://console.cloud.google.com/apis/credentials"
        )

    youtube = build("youtube", "v3", developerKey=api_key)

    # Step 1: Search for recent videos (last 3 days)
    published_after = (datetime.now(timezone.utc) - timedelta(days=3)).strftime(
        "%Y-%m-%dT%H:%M:%SZ"
    )
    search_response = youtube.search().list(
        q=query,
        part="snippet",
        type="video",
        order="relevance",
        publishedAfter=published_after,
        maxResults=min(max_results, 50),
    ).execute()

    items = search_response.get("items", [])
    if not items:
        return []

    # Step 2: Collect video IDs
    video_ids = [item["id"]["videoId"] for item in items]

    # Step 3: Batch fetch video statistics (1 quota unit for up to 50 videos)
    videos_response = youtube.videos().list(
        id=",".join(video_ids),
        part="snippet,statistics",
    ).execute()

    # Step 4: Normalize results
    results = []
    for video in videos_response.get("items", []):
        snippet = video.get("snippet", {})
        stats = video.get("statistics", {})

        raw_title = snippet.get("title", "")

        results.append({
            "topic": clean_topic(raw_title),
            "raw_title": raw_title,
            "views": int(stats.get("viewCount", 0)),
            "likes": int(stats.get("likeCount", 0)),
            "published_at": snippet.get("publishedAt", ""),
            "channel": snippet.get("channelTitle", ""),
        })

    return results
