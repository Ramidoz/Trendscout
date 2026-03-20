import ActionCard from "./ActionCard";

interface Idea {
  priority: number;
  title: string;
  format: string;
  hook: string;
  reason: string;
  expected_outcome: string;
}

interface ActionPlanProps {
  ideas: Idea[];
  onFocusTopic: (title: string) => void;
  onRefineTopic: (title: string) => void;
}

export default function ActionPlan({
  ideas,
  onFocusTopic,
  onRefineTopic,
}: ActionPlanProps) {
  return (
    <section>
      <h2 className="text-lg font-semibold text-zinc-300 mb-4">Action Plan</h2>

      {ideas.length === 0 ? (
        <p className="text-sm text-zinc-300">
          No strategy generated yet. Refine your query.
        </p>
      ) : (
        <div className="space-y-5">
          {ideas.map((idea, i) => (
            <ActionCard
              key={`${idea.title}-${i}`}
              idea={idea}
              isTopPick={i === 0}
              onFocus={() => onFocusTopic(idea.title)}
              onRefine={() => onRefineTopic(idea.title)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
