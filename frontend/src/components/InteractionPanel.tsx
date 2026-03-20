"use client";

import { useState } from "react";

interface Opportunity {
  topic: string;
  opportunity_score: number;
  confidence: number;
  reason: string;
  velocity_label: string;
  engagement_label: string;
  stage: string;
}

interface InteractionPanelProps {
  selectedTopic: string | null;
  refinementInput: string;
  loading: boolean;
  answer: string;
  opportunities: Opportunity[];
  onRefinementChange: (value: string) => void;
  onRefine: () => void;
  onFollowUp: (query: string) => void;
}

/* ── Structured answer parsing ── */

interface ParsedSummary {
  insight: string;
  why: string;
  direction: string;
}

function parseAnswer(raw: string): ParsedSummary | null {
  if (!raw || raw.length < 20) return null;

  const lines = raw
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length < 2) return null;

  const whyPatterns = /\b(because|since|due to|matters|important|significant|key reason)\b/i;
  const directionPatterns = /\b(should|recommend|suggest|consider|try|focus|start|create|post|next step)\b/i;

  let insight = "";
  let why = "";
  let direction = "";

  for (const line of lines) {
    const clean = line.replace(/^[-*•#>\d.]+\s*/, "");
    if (!clean) continue;

    if (!insight) {
      insight = clean;
    } else if (!why && whyPatterns.test(clean)) {
      why = clean;
    } else if (!direction && directionPatterns.test(clean)) {
      direction = clean;
    }
  }

  if (!insight) return null;

  // Fill gaps with remaining lines
  const remaining = lines
    .map((l) => l.replace(/^[-*•#>\d.]+\s*/, ""))
    .filter((l) => l && l !== insight && l !== why && l !== direction);

  if (!why && remaining.length > 0) why = remaining.shift()!;
  if (!direction && remaining.length > 0) direction = remaining.shift()!;

  return { insight, why, direction };
}

export default function InteractionPanel({
  selectedTopic,
  refinementInput,
  loading,
  answer,
  opportunities,
  onRefinementChange,
  onRefine,
  onFollowUp,
}: InteractionPanelProps) {
  const [followUpQuestion, setFollowUpQuestion] = useState("");
  const [followUpTopic, setFollowUpTopic] = useState("");

  const effectiveTopic = selectedTopic ?? followUpTopic;

  function handleAsk() {
    if (!followUpQuestion.trim() || !effectiveTopic) return;
    const query = `About ${effectiveTopic}: ${followUpQuestion.trim()}`;
    onFollowUp(query);
    setFollowUpQuestion("");
  }

  const parsed = parseAnswer(answer);

  return (
    <div className="space-y-5">
      {/* Refine Strategy */}
      <section className="p-4 rounded-xl border border-zinc-800 bg-zinc-900">
        <h3 className="text-sm font-medium text-zinc-400 mb-3">
          Refine Strategy
        </h3>
        <textarea
          value={refinementInput}
          onChange={(e) => onRefinementChange(e.target.value)}
          placeholder="Refine your strategy..."
          rows={3}
          className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-100 placeholder-zinc-500 text-sm focus:outline-none focus:border-purple-500/50 resize-none transition-colors"
          style={{ minHeight: "80px" }}
        />
        <button
          type="button"
          onClick={onRefine}
          disabled={loading || !refinementInput.trim()}
          className="mt-2 w-full px-3 py-2 text-sm rounded-lg bg-purple-600 text-white hover:bg-purple-700 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          Refine
        </button>
      </section>

      {/* Ask Follow-Up */}
      <section className="p-4 rounded-xl border border-zinc-800 bg-zinc-900">
        <h3 className="text-sm font-medium text-zinc-400 mb-3">
          Ask Follow-Up
        </h3>

        {selectedTopic && (
          <div className="mb-3 px-3 py-2 rounded-lg bg-purple-900/30 border border-purple-800/50 text-sm text-purple-300">
            {selectedTopic}
          </div>
        )}

        {!selectedTopic && opportunities.length > 0 && (
          <select
            value={followUpTopic}
            onChange={(e) => setFollowUpTopic(e.target.value)}
            className="w-full mb-3 px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300 text-sm focus:outline-none focus:border-purple-500/50"
          >
            <option value="">Select a topic...</option>
            {opportunities.map((opp) => (
              <option key={opp.topic} value={opp.topic}>
                {opp.topic}
              </option>
            ))}
          </select>
        )}

        <input
          type="text"
          value={followUpQuestion}
          onChange={(e) => setFollowUpQuestion(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAsk()}
          placeholder="e.g., Which one should I post first?"
          className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-100 placeholder-zinc-500 text-sm focus:outline-none focus:border-purple-500/50 transition-colors"
        />
        <button
          type="button"
          onClick={handleAsk}
          disabled={loading || !followUpQuestion.trim() || !effectiveTopic}
          className="mt-2 w-full px-3 py-2 text-sm rounded-lg bg-purple-600 text-white hover:bg-purple-700 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          Ask
        </button>
      </section>

      {/* Agent Summary */}
      {answer && (
        <section className="p-4 rounded-xl border border-zinc-800 bg-zinc-900">
          <h3 className="text-sm font-medium text-zinc-400 mb-3">
            Agent Summary
          </h3>

          {parsed ? (
            <div className="space-y-3">
              <div>
                <p className="text-xs font-medium text-purple-400 mb-1">
                  Key Insight
                </p>
                <p className="text-sm text-zinc-200">{parsed.insight}</p>
              </div>
              {parsed.why && (
                <div>
                  <p className="text-xs font-medium text-blue-400 mb-1">
                    Why It Matters
                  </p>
                  <p className="text-sm text-zinc-300">{parsed.why}</p>
                </div>
              )}
              {parsed.direction && (
                <div>
                  <p className="text-xs font-medium text-green-400 mb-1">
                    Suggested Direction
                  </p>
                  <p className="text-sm text-zinc-300">{parsed.direction}</p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-zinc-300 whitespace-pre-wrap">
              {answer}
            </p>
          )}
        </section>
      )}
    </div>
  );
}
