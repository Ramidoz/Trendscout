interface QueryBarProps {
  query: string;
  loading: boolean;
  onQueryChange: (value: string) => void;
  onSubmit: () => void;
}

export default function QueryBar({
  query,
  loading,
  onQueryChange,
  onSubmit,
}: QueryBarProps) {
  return (
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
        disabled={loading || !query.trim()}
        className="px-6 py-3 rounded-xl bg-purple-600 text-white font-semibold hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? "Analyzing..." : "Generate Strategy"}
      </button>
    </div>
  );
}
