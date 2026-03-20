interface QueryBarProps {
  query: string;
  loading: boolean;
  onQueryChange: (value: string) => void;
  onSubmit: () => void;
}

const SUGGESTIONS = [
  "AI tools for creators",
  "python automation",
  "crypto news",
];

export default function QueryBar({
  query,
  loading,
  onQueryChange,
  onSubmit,
}: QueryBarProps) {
  return (
    <div className="sticky top-0 z-20 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-4 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800/50">
      <div className="flex gap-3">
        <input
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !loading && onSubmit()}
          placeholder="Try: AI tools for creators, python automation, crypto news"
          className="flex-1 px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-purple-500/50 transition-colors"
        />
        <button
          type="button"
          onClick={onSubmit}
          disabled={loading || query.trim().length < 3}
          className="px-6 py-3 rounded-xl bg-purple-600 text-white font-semibold hover:bg-purple-700 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          {loading ? "Analyzing..." : "Generate Strategy"}
        </button>
      </div>

      <div className="flex gap-2 mt-2.5">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onQueryChange(s)}
            className="px-3 py-1 text-xs rounded-full border border-zinc-700/50 text-zinc-500 hover:text-zinc-300 hover:border-zinc-600 transition-colors"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
