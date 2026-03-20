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

export default function ActionCard({
  idea,
  isTopPick,
  onFocus,
  onRefine,
}: ActionCardProps) {
  const fmt = formatConfig[idea.format] ?? formatConfig.short;

  return (
    <div
      className={`p-5 rounded-xl border transition-all ${
        isTopPick
          ? "border-purple-500/40 bg-zinc-900 shadow-[0_0_20px_rgba(168,85,247,0.08)] hover:border-purple-500/60"
          : "border-zinc-800 bg-zinc-900 hover:border-zinc-700"
      }`}
    >
      <div className="flex items-center gap-2.5 mb-3 flex-wrap">
        {isTopPick && (
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-purple-600 text-white">
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

      <div className="flex gap-2 mt-4">
        <button
          type="button"
          onClick={onFocus}
          className="px-3 py-1.5 text-sm rounded-lg bg-purple-600 text-white hover:bg-purple-700 active:scale-95 transition-all"
        >
          Focus on this
        </button>
        <button
          type="button"
          onClick={onRefine}
          className="px-3 py-1.5 text-sm rounded-lg border border-zinc-700 text-zinc-300 hover:bg-zinc-800 active:scale-95 transition-all"
        >
          Refine
        </button>
      </div>
    </div>
  );
}
