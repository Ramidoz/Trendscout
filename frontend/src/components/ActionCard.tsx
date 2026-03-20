"use client";

import { useState, memo } from "react";

interface Idea {
  priority: number;
  title: string;
  format: string;
  hook: string;
  reason: string;
  expected_outcome: string;
}

interface ActionCardProps {
  idea: Idea;
  isTopPick: boolean;
  onFocus: () => void;
  onRefine: () => void;
}

const formatConfig: Record<
  string,
  { label: string; icon: string; color: string }
> = {
  short: { label: "SHORT", icon: "▶", color: "bg-blue-900/50 text-blue-300" },
  long: {
    label: "LONG",
    icon: "📄",
    color: "bg-purple-900/50 text-purple-300",
  },
  post: {
    label: "POST",
    icon: "💬",
    color: "bg-green-900/50 text-green-300",
  },
};

const ActionCard = memo(function ActionCard({
  idea,
  isTopPick,
  onFocus,
  onRefine,
}: ActionCardProps) {
  const [copied, setCopied] = useState(false);
  const fmt = formatConfig[idea.format] ?? formatConfig.short;

  function handleCopy() {
    const text = `${idea.title}\n\nHook: ${idea.hook}\n\nWhy: ${idea.reason}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div
      className={`p-5 rounded-xl border transition-all ${
        isTopPick
          ? "border-purple-500/40 bg-purple-950/20 shadow-[0_0_20px_rgba(168,85,247,0.1)] hover:border-purple-500/60 hover:-translate-y-0.5"
          : "border-zinc-800 bg-zinc-900 hover:border-zinc-700 hover:-translate-y-px"
      }`}
    >
      <div className="flex items-center gap-2.5 mb-3 flex-wrap">
        {isTopPick && (
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-purple-600 text-white shadow-sm">
            🔥 Recommended Action
          </span>
        )}
        <span
          className={`text-xs font-bold px-2.5 py-1 rounded ${fmt.color}`}
        >
          {fmt.icon} {fmt.label}
        </span>
      </div>

      <h3
        className={`font-semibold text-zinc-100 mb-2 ${
          isTopPick ? "text-xl" : "text-lg"
        }`}
      >
        {idea.title}
      </h3>

      <p className="text-sm text-zinc-400 mb-3 italic">
        &ldquo;{idea.hook}&rdquo;
      </p>

      <p className="text-sm text-zinc-400 mb-2">{idea.reason}</p>

      {idea.expected_outcome && (
        <p className="text-sm text-zinc-300 font-medium mb-4">
          Outcome: {idea.expected_outcome}
        </p>
      )}

      <div className="flex gap-2.5 mt-4">
        <button
          type="button"
          onClick={onFocus}
          className="px-4 py-1.5 text-sm font-medium rounded-lg bg-purple-600 text-white hover:bg-purple-700 active:scale-[0.98] transition-all"
        >
          Focus on this
        </button>
        <button
          type="button"
          onClick={onRefine}
          className="px-4 py-1.5 text-sm rounded-lg border border-zinc-700 text-zinc-400 hover:text-zinc-300 hover:border-zinc-600 hover:bg-zinc-800/50 active:scale-[0.98] transition-all"
        >
          Refine
        </button>
        <button
          type="button"
          onClick={handleCopy}
          className="px-3 py-1.5 text-sm rounded-lg text-zinc-500 hover:text-zinc-300 active:scale-[0.98] transition-all ml-auto"
        >
          {copied ? "Copied!" : "Copy Idea"}
        </button>
      </div>
    </div>
  );
});

export default ActionCard;
