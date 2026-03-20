interface Opportunity {
  topic: string;
  opportunity_score: number;
  confidence: number;
  reason: string;
  velocity_label: string;
  engagement_label: string;
  stage: string;
}

interface OpportunityCardProps {
  opportunity: Opportunity;
  rank: number;
  isSelected: boolean;
  onSelect: () => void;
}

const stageBadgeColor: Record<string, string> = {
  early: "bg-green-900/60 text-green-300",
  rising: "bg-blue-900/60 text-blue-300",
  saturated: "bg-amber-900/60 text-amber-300",
};

export default function OpportunityCard({
  opportunity,
  rank,
  isSelected,
  onSelect,
}: OpportunityCardProps) {
  const { topic, opportunity_score, stage, reason } = opportunity;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full text-left p-4 rounded-xl border transition-colors ${
        isSelected
          ? "border-purple-500/50 bg-zinc-800/80"
          : "border-zinc-800 bg-zinc-900 hover:border-zinc-700"
      }`}
    >
      {rank === 1 && (
        <span className="inline-block mb-2 text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-600 text-white">
          Best Opportunity Right Now
        </span>
      )}

      <div className="flex items-start justify-between gap-2">
        <span className="text-zinc-100 font-medium">
          <span className="text-zinc-500 mr-1.5">#{rank}</span>
          {topic}
        </span>
        <span className="text-sm font-mono text-zinc-400 shrink-0">
          {opportunity_score.toFixed(2)}
        </span>
      </div>

      <div className="flex flex-wrap gap-2 mt-2 text-xs">
        <span className={`px-2 py-0.5 rounded ${stageBadgeColor[stage] ?? "bg-zinc-800 text-zinc-400"}`}>
          {stage}
        </span>
      </div>

      <p className="text-sm text-zinc-500 mt-2 line-clamp-2">{reason}</p>
    </button>
  );
}
