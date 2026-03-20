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

interface Idea {
  priority: number;
  title: string;
  format: string;
  hook: string;
  reason: string;
  expected_outcome: string;
}

interface Briefing {
  top_opportunities: Opportunity[];
  action_plan: Idea[];
}

interface ApiResponse {
  query: string;
  briefing: Briefing;
}

export default function Home() {
  const [query, setQuery] = useState("");
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleGenerate() {
    if (!query.trim()) return;
    setLoading(true);
    setError("");
    setData(null);

    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(
        `${apiBase}/briefing?query=${encodeURIComponent(query.trim())}`
      );
      if (!res.ok) {
        const errBody = await res.text();
        throw new Error(errBody || `HTTP ${res.status}`);
      }
      const json: ApiResponse = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">TrendScope</h1>
        <p className="text-zinc-400 mb-8">
          Enter a topic to get a prioritized content strategy based on live
          YouTube trends.
        </p>

        {/* Input */}
        <div className="flex gap-3 mb-10">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
            placeholder="e.g., AI tools, fitness, finance"
            className="flex-1 px-4 py-3 rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
          />
          <button
            onClick={handleGenerate}
            disabled={loading || !query.trim()}
            className="px-6 py-3 rounded-lg bg-white text-zinc-900 font-semibold hover:bg-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? "Analyzing..." : "Generate Strategy"}
          </button>
        </div>

        {error && (
          <div className="mb-8 p-4 rounded-lg bg-red-900/30 border border-red-800 text-red-300">
            {error}
          </div>
        )}

        {data && (
          <>
            {/* Top Opportunities */}
            <section className="mb-10">
              <h2 className="text-xl font-semibold mb-4 text-zinc-300">
                Top Opportunities
              </h2>
              <div className="space-y-3">
                {data.briefing.top_opportunities.map((opp, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-lg bg-zinc-900 border border-zinc-800"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-zinc-100">
                        {opp.topic}
                      </span>
                      <span className="text-sm font-mono text-zinc-400">
                        {opp.opportunity_score.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex gap-3 text-xs text-zinc-500 mb-2">
                      <span className="px-2 py-0.5 rounded bg-zinc-800">
                        {opp.stage}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-zinc-800">
                        vel: {opp.velocity_label}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-zinc-800">
                        eng: {opp.engagement_label}
                      </span>
                    </div>
                    <p className="text-sm text-zinc-400">{opp.reason}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Action Plan */}
            <section>
              <h2 className="text-xl font-semibold mb-4 text-zinc-300">
                Action Plan
              </h2>
              <div className="space-y-4">
                {data.briefing.action_plan.map((idea, i) => (
                  <div
                    key={i}
                    className={`p-5 rounded-lg border ${
                      idea.priority === 1
                        ? "bg-zinc-900 border-white/20"
                        : "bg-zinc-900 border-zinc-800"
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <span
                        className={`text-xs font-bold px-2.5 py-1 rounded ${
                          idea.priority === 1
                            ? "bg-white text-zinc-900"
                            : "bg-zinc-700 text-zinc-300"
                        }`}
                      >
                        #{idea.priority}
                      </span>
                      <span className="text-xs uppercase tracking-wide text-zinc-500">
                        {idea.format}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold mb-2 text-zinc-100">
                      {idea.title}
                    </h3>
                    <p className="text-sm text-zinc-400 mb-3 italic">
                      &ldquo;{idea.hook}&rdquo;
                    </p>
                    <p className="text-sm text-zinc-400 mb-2">{idea.reason}</p>
                    {idea.expected_outcome && (
                      <p className="text-sm text-zinc-300 font-medium">
                        Outcome: {idea.expected_outcome}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
