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
  onFocus: () => void;
  onRefine: () => void;
}

const formatConfig: Record<string, { label: string; icon: string; color: string }> = {
  short: { label: "SHORT", icon: "▶", color: "bg-blue-900/50 text-blue-300" },
  long: { label: "LONG", icon: "📄", color: "bg-purple-900/50 text-purple-300" },
  post: { label: "POST", icon: "💬", color: "bg-green-900/50 text-green-300" },
};

export default function ActionCard({ idea, onFocus, onRefine }: ActionCardProps) {
  const fmt = formatConfig[idea.format] ?? formatConfig.short;

  return (
    <div className="p-5 rounded-xl border border-zinc-800 bg-zinc-900 hover:border-zinc-700 transition-colors">
      <div className="flex items-center gap-3 mb-3">
        <span className={`text-xs font-bold px-2.5 py-1 rounded ${fmt.color}`}>
          {fmt.icon} {fmt.label}
        </span>
        {idea.priority === 1 && (
          <span className="text-xs font-bold px-2.5 py-1 rounded bg-white text-zinc-900">
            #1
          </span>
        )}
      </div>

      <h3 className="text-lg font-semibold text-zinc-100 mb-2">{idea.title}</h3>

      <p className="text-sm text-zinc-400 mb-3 italic">
        &ldquo;{idea.hook}&rdquo;
      </p>

      <p className="text-sm text-zinc-400 mb-2">{idea.reason}</p>

      {idea.expected_outcome && (
        <p className="text-sm text-zinc-300 font-medium mb-4">
          Outcome: {idea.expected_outcome}
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onFocus}
          className="px-3 py-1.5 text-sm rounded-lg border border-zinc-700 text-zinc-300 hover:bg-zinc-800 transition-colors"
        >
          Focus on this
        </button>
        <button
          type="button"
          onClick={onRefine}
          className="px-3 py-1.5 text-sm rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors"
        >
          Refine this
        </button>
      </div>
    </div>
  );
}
