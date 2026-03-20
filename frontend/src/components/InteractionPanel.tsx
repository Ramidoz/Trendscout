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

  return (
    <div className="space-y-6">
      {/* Refine */}
      <section className="p-4 rounded-xl border border-zinc-800 bg-zinc-900">
        <h3 className="text-sm font-medium text-zinc-400 mb-3">
          Refine / Ask AI
        </h3>
        <textarea
          value={refinementInput}
          onChange={(e) => onRefinementChange(e.target.value)}
          placeholder="Refine your strategy..."
          rows={3}
          className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-100 placeholder-zinc-500 text-sm focus:outline-none focus:border-purple-500/50 resize-none transition-colors"
        />
        <button
          type="button"
          onClick={onRefine}
          disabled={loading || !refinementInput.trim()}
          className="mt-2 w-full px-3 py-2 text-sm rounded-lg bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Refine
        </button>
      </section>

      {/* Follow-up */}
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
          className="mt-2 w-full px-3 py-2 text-sm rounded-lg bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Ask
        </button>
      </section>

      {/* Agent Answer */}
      {answer && (
        <section className="p-4 rounded-xl border border-zinc-800 bg-zinc-900">
          <h3 className="text-sm font-medium text-zinc-400 mb-2">
            Agent Response
          </h3>
          <p className="text-sm text-zinc-300 whitespace-pre-wrap">{answer}</p>
        </section>
      )}
    </div>
  );
}
