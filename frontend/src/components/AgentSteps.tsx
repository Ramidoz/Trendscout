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
      return `Searched YouTube for "${q}"`;
    case "score_trends":
      return `Scored and ranked trends for "${q}"`;
    case "generate_briefing":
      return "Generated content strategy briefing";
    default:
      return `${step.tool}(${JSON.stringify(step.args)})`;
  }
}

const LOADING_STAGES = [
  "Fetching trends...",
  "Scoring opportunities...",
  "Generating strategy...",
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

  const hasContent = loading || steps.length > 0;

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
        <div className="px-4 pb-3 space-y-1.5">
          {loading && (
            <div className="flex items-center gap-2 text-sm text-purple-400">
              <span className="inline-block w-3 h-3 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
              {LOADING_STAGES[loadingStage]}
            </div>
          )}

          {!loading && steps.length === 0 && (
            <p className="text-sm text-zinc-500">
              No tools used — the agent answered directly
            </p>
          )}

          {!loading &&
            steps.map((step, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-zinc-400">
                <span className="text-zinc-600 shrink-0">{i + 1}.</span>
                <span>{formatStep(step)}</span>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
