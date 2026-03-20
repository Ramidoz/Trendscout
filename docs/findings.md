# TrendScope Evaluation Findings

**Date:** 2026-03-18
**Queries tested:** 6
**Pipeline:** fetch_youtube_trends(query, max_results=20) -> score_trends() -> generate_briefing()

---

## Query: "AI tools for creators"

### Priority #1
"I tested 3 AI tools for student projects — here's what saved me hours!"

### What Works
- Title follows the creator-native format ("I tested X — here's what happened")
- The 3 ideas target distinct angles: student efficiency, paid vs free tools, market saturation

### Issues
- **Priority #1 is about students, not creators.** The query was "AI tools for creators" but the top-scoring topic was "5 ai tools every student musttry" — the system ranked a student-focused topic as #1 for a creator audience. The LLM followed the data but lost the user's intent.
- **All 5 top opportunities are "saturated" stage** — the deterministic reason says "strong relative momentum" for every single one, which is misleading. A saturated topic doesn't have "strong relative momentum" — it has high absolute velocity from old views. The reason template is contradictory.
- **Topic cleaning is poor.** "5 ai tools every student musttry" — "musttry" is a concatenation artifact. "easiest way to become a content creator 3 ai tools techshorts shorts techiela chatgpt" is an entire sentence plus hashtags, not a clean topic.
- **Hook uses a banned phrase-adjacent pattern.** "Stop scrambling for project ideas!" is close to the banned "Are you looking for..." opener style — it's soft, not punchy.

### Suggested Fixes
- The deterministic reason template must NOT say "strong relative momentum" when the stage is `saturated`. Use stage-appropriate language: "High view volume in a competitive space" for saturated topics.
- Topic cleaning needs to handle concatenated words ("musttry" → "must try") and strip YouTube hashtag spam (shorts, techshorts, techiela).
- The LLM prompt should receive the user's original query so it can align recommendations to the creator's niche, not just react to whatever topics the scoring engine surfaces.

---

## Query: "python automation"

### Priority #1
"Stop using outdated bots — This Python Mouse Moving Bot Will Save You Time!"

### What Works
- Title uses the "Stop doing X — do this instead" format correctly
- The 3 ideas cover distinct angles: automation tool, workflow platform (n8n), career/salary info
- Priority #3 (developer salaries in India) is a legitimate contrarian play with local targeting

### Issues
- **Priority #1 is about a mouse-moving bot**, which is a toy project — not a serious automation recommendation. It scored high on engagement but has almost zero practical value for someone searching "python automation." The system has no quality filter on topic relevance.
- **Top opportunity is a Hindi tutorial** ("python tutorial for beginners in hindi complete python course") — it scored highest on velocity but has nothing to do with automation. The YouTube search API returned broadly popular Python videos, not automation-specific ones.
- **Topic strings are still too long.** "how much a python developer earn python developer salary in india shorts simplilearn" is not a topic — it's a title dump. Same with "mouse moving bot in python python coding programming".
- **The reason for Priority #1 fabricates urgency.** "There's an untapped potential to simplify complex tasks" — a mouse-moving bot is neither untapped nor complex. The LLM is manufacturing justification.

### Suggested Fixes
- Topic cleaning must cap length (e.g., first 6-8 meaningful words) and strip channel names, hashtags, and language tags.
- The YouTube API search uses `order="viewCount"` which biases toward all-time popular videos, not trending ones. Consider `order="date"` or `order="relevance"` with `publishedAfter` filter to get actually recent content.
- Add a relevance check: if a cleaned topic has low semantic overlap with the user's query, deprioritize it.

---

## Query: "home workout no equipment"

### Priority #1
"Stop Doing Traditional Workouts — Try This Home Workout for Fat Loss Instead"

### What Works
- Title is direct and actionable — a real creator could post this
- The 3 ideas target different audiences: general fat loss, full body routine, teen niche
- Priority #3 (teen chest workout) is a genuinely differentiated contrarian play targeting a specific demographic

### Issues
- **The reason for Priority #1 claims "rising interest" and "before it gets saturated"** — but the actual stage data shows ALL 5 top opportunities are already `saturated`. The LLM is contradicting the data it was given. It says "Early adopters can dominate this trend" about a saturated topic.
- **Hook for Priority #2 is 2 sentences but reads like a paragraph.** "If you're looking for a workout that you can do anywhere and gets results, now's the time to join the no-equipment trend! Ditch your gym membership and find out why this simple routine is trending." — this is 36 words. Too long and too soft for a hook. The prompt says "punchy" but the output is wordy.
- **25 results returned** when max_results=20 was passed. The YouTube API sometimes returns more items in the videos().list batch call than were in the search results, suggesting a data consistency issue.
- **Topic cleaning failure again.** "middle split tutorial tips stretching homeworkout flexibility flexible gymnastics splits" is hashtag soup, not a topic.

### Suggested Fixes
- The LLM prompt must enforce that reasons cannot contradict the stage data. Add explicit instruction: "If all topics are saturated, do NOT claim 'early' or 'rising' opportunities. Instead, focus on differentiation angles within a competitive space."
- Enforce a hard word limit on hooks (15-20 words max).
- Investigate why more results than max_results are returned.

---

## Query: "calisthenics beginners"

### Priority #1
"Why Calisthenics Meetups Are Surging Right Now"

### What Works
- Priority #3 ("Stop Making These Calisthenics Mistakes Right Now") is the strongest idea — it's specific, actionable, and directly serves a beginner audience
- The contrarian framing in #3's reason ("engagement remains low, limiting potential reach") is honest about trade-offs

### Issues
- **Priority #1 is the weakest idea, not the strongest.** "Why Calisthenics Meetups Are Surging Right Now" is neither actionable nor creator-native. A beginner searching "calisthenics beginners" doesn't want to hear about meetups — they want to learn exercises. The ranking is inverted.
- **Title violates the prompt rules.** "Why Calisthenics Meetups Are Surging Right Now" has no outcome or payoff for the viewer. It reads like a news headline, not a creator-native title. The prompt bans patterns like "how X works" but doesn't catch "why X is surging."
- **Topic cleaning is severely degraded here.** "perfect your lsit common mistakes explainedtradingbodybuildingexercise" — "lsit" is a typo passthrough, "explainedtradingbodybuildingexercise" is concatenated hashtags. "pov you are ready for anything calisthenics strength strong pullup viral pushup workout" is hashtag spam that survived cleaning.
- **All 5 opportunities are saturated.** The system has no useful timing signal here — every reason says the same generic "strong relative momentum" line. The entire timing feature is non-functional for this query.

### Suggested Fixes
- The LLM prompt needs stronger enforcement: "Priority #1 MUST be the most actionable and specific idea. If meetups or community trends are less directly useful to the audience than technique tips, rank technique tips higher."
- Ban news-headline title formats ("Why X is surging") in addition to the existing banned phrases.
- Topic cleaning must split concatenated words and strip hashtag runs aggressively.

---

## Query: "crypto news"

### Priority #1
"Why Bitcoin Could Hit $0 — Here's What You Need to Know"

### What Works
- Priority #1 is genuinely the most compelling topic — high velocity, high engagement, urgent narrative
- The 3 ideas are well-differentiated: market crash fear, regulatory angle, personal loss story
- Priority #3 uses a personal narrative format ("I Just Lost Everything") which is effective for crypto content

### Issues
- **Title uses a banned phrase.** "Here's What You Need to Know" is generic filler — the prompt bans similar patterns but doesn't explicitly list this one. The title would be stronger as "Why Bitcoin Could Hit $0 — And What Smart Money Is Doing."
- **The reason for Priority #1 says "This is the BEST opportunity to engage with a concerned audience before the conversation peaks."** But the stage is `saturated` — the conversation has already peaked. Same contradiction pattern as other queries.
- **Priority #3's hook says "Learn from my mistakes" but the LLM is not the creator** — it's generating a first-person narrative that the creator didn't experience. The hook should frame it as a third-party story or template, not assume the creator lost money.
- **"Bloomberg business news live" is the #2 top opportunity** — this is a live stream, not a trend topic. The system can't distinguish between a trending topic and a permanently high-traffic live channel.

### Suggested Fixes
- Add "here's what you need to know" and "here's what happened" to the banned phrases list.
- The LLM prompt should specify: "Hooks must be framed as templates the creator can use, not first-person claims they didn't make."
- Filter out live streams and permanently running channels from the data collection step (these inflate velocity artificially).

---

## Query: "content"

### Priority #1
"Stop Editing Like a Rookie – Use This Quick Videography Trick Instead"

### What Works
- Priority #2 (influencer lawsuits) is genuinely timely and differentiated — it's a real current event with clear viewer value
- The overall spread is decent: technique tip, legal awareness, trend fatigue

### Issues
- **Priority #1's reason lies about the data.** It says "This is the highest momentum trend in early stage" — but the actual stage is `saturated`. The LLM is hallucinating stage data. This is the most critical systemic issue: the LLM ignores or fabricates stage information.
- **The query "content" is too broad** — the results are a random mix of videography tips, funny videos, ice cream content, and nostalgia clips. The system doesn't warn the user that their query is too vague to produce coherent recommendations.
- **Topic cleaning fails badly.** "yayayuyi icecream fun comedy icecream shop shots content hindi masti desi relatable" is gibberish. "funny video content seeu funny voicevideo comedy seeu6" preserves channel names and random words.
- **Uses a banned phrase:** "game-changing" appears in the hook ("game-changing videography hack"). The prompt bans "game-changer" but the LLM found a workaround with the adjective form.

### Suggested Fixes
- The banned phrases list should use stem matching: "game-chang*" catches both "game-changer" and "game-changing."
- Add input validation: if a query is a single generic word, prompt the user to be more specific.
- The LLM must be forced to cite the actual stage value from the data, not generate its own. E.g., require the format: "Stage: [saturated]. Despite saturation, ..."

---

## Overall Observations

### Common Strengths
- **Differentiated angles work.** Across all 6 queries, the 3 ideas generally target distinct approaches (efficiency, growth, contrarian). The prompt engineering for differentiation is effective.
- **Creator-native title formats land more often than not.** Most titles follow the "I tried X", "Stop doing X", "This X will save you Y" patterns. The format is right even when the content is wrong.
- **The scoring formula produces reasonable relative rankings** within a set. The highest-velocity, highest-engagement topics do surface to the top.

### Common Weaknesses
- **Stage data is universally "saturated" and the LLM ignores it.** In all 6 queries, every single top opportunity was classified as `saturated`. The LLM then fabricated "early stage" or "rising" claims in its reasons. This is the #1 systemic failure — the timing feature (early/rising/saturated) provides zero value because the YouTube search API with `order="viewCount"` returns old, high-view videos, not actually trending or recent ones.
- **Topic cleaning is inadequate.** Across all queries, cleaned topics contain concatenated words, hashtag spam, channel names, language tags, and full video titles. The `clean_topic()` function only removes special characters and clickbait phrases — it doesn't handle YouTube-specific patterns like hashtag runs, channel mentions, or word concatenation.
- **The deterministic reason template is contradictory.** Every opportunity says "strong relative momentum" regardless of stage. When all 5 opportunities are saturated, this phrase is meaningless and misleading.

### Highest Impact Improvement

**Fix the data freshness problem.** The root cause of most issues is that `youtube.search().list(order="viewCount")` returns the most-viewed videos of all time for a query, not currently trending content. This means:
- All stages are `saturated` (published >48h ago)
- The timing feature is non-functional
- The LLM has no real timing signal to work with

**Prompt-level fix (no code changes):** Since the user requested prompt-level improvements only:

1. **Add a stage-accuracy enforcement rule to the prompt:**
   ```
   CRITICAL: The stage field in the data is GROUND TRUTH. If a topic is "saturated", you MUST NOT claim it is "early" or "rising" or say "before it peaks." Instead, explain why it's still worth covering despite saturation (unique angle, underserved sub-audience, contrarian take).
   ```

2. **Add a data-honesty clause:**
   ```
   If ALL topics are saturated, acknowledge this in your first idea's reason: "Most topics in this space have matured, so differentiation matters more than speed. Here's how to stand out in a crowded field."
   ```

3. **Tighten banned phrases with wildcards:**
   Add to banned list: "here's what you need to know", "here's what happened", "game-changing", "game-changer", "surging", "taking over", and any "Why X is [verb]ing" headline patterns.

4. **Force stage citation in reasons:**
   ```
   Every reason MUST start with "Stage: [actual stage value]." followed by your analysis. Do not skip or override this.
   ```

5. **Add hook word limit:**
   ```
   Hooks must be 15-20 words maximum. Cut ruthlessly. If it doesn't fit in 2 seconds of spoken delivery, it's too long.
   ```
