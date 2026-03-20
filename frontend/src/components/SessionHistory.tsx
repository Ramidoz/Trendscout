interface SessionHistoryProps {
  history: string[];
  onReplay: (query: string) => void;
}

export default function SessionHistory({ history, onReplay }: SessionHistoryProps) {
  if (history.length === 0) return null;

  return (
    <section className="mt-8 pt-6 border-t border-zinc-800">
      <h3 className="text-sm font-medium text-zinc-500 mb-3">Session History</h3>
      <div className="flex flex-wrap gap-2">
        {history.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => onReplay(q)}
            className="px-3 py-1.5 text-sm rounded-full border border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:border-zinc-600 transition-colors"
          >
            {q}
          </button>
        ))}
      </div>
    </section>
  );
}
