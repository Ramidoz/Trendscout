"use client";

import { useState, useEffect } from "react";

interface Step {
  tool: string;
  args: Record<string, unknown>;
}

interface AgentStepsProps {
  steps: Step[];
  loading: boolean;
}

function formatStep(step: Step): string {
  const q = (step.args.query as string) ?? "";
  switch (step.tool) {
    case "fetch_youtube_trends":
      return `Fetch trends for "${q}"`;
    case "score_trends":
      return `Score opportunities for "${q}"`;
    case "generate_briefing":
      return "Generate strategy";
    default:
      return `${step.tool}(${JSON.stringify(step.args)})`;
  }
}

const LOADING_STAGES = [
  "Fetching trends",
  "Scoring opportunities",
  "Generating strategy",
];

export default function AgentSteps({ steps, loading }: AgentStepsProps) {
  const [expanded, setExpanded] = useState(true);
  const [loadingStage, setLoadingStage] = useState(0);

  useEffect(() => {
    if (!loading) {
      setLoadingStage(0);
      return;
    }

    setLoadingStage(0);
    const t1 = setTimeout(() => setLoadingStage(1), 3000);
    const t2 = setTimeout(() => setLoadingStage(2), 6000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [loading]);

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm text-zinc-400 hover:text-zinc-300 transition-colors"
      >
        <span className="font-medium">Agent Steps</span>
        <span className="text-xs">{expanded ? "▾" : "▸"}</span>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-2.5">
          {loading &&
            LOADING_STAGES.map((label, i) => (
              <div
                key={label}
                className={`flex items-center gap-3 text-sm transition-colors ${
                  i <= loadingStage ? "text-purple-400" : "text-zinc-600"
                }`}
              >
                <span className="w-4 flex items-center justify-center shrink-0">
                  {i < loadingStage ? (
                    <span className="text-green-400">✓</span>
                  ) : i === loadingStage ? (
                    <span className="inline-block w-3 h-3 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span className="inline-block w-2 h-2 rounded-full bg-zinc-700" />
                  )}
                </span>
                <span>{label}</span>
              </div>
            ))}

          {!loading && steps.length === 0 && (
            <p className="text-sm text-zinc-500">
              No tools used — the agent answered directly
            </p>
          )}

          {!loading &&
            steps.map((step, i) => (
              <div
                key={i}
                className="flex items-center gap-3 text-sm text-zinc-400"
              >
                <span className="w-4 flex items-center justify-center shrink-0 text-green-400">✓</span>
                <span>
                  {i + 1}. {formatStep(step)}
                </span>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
