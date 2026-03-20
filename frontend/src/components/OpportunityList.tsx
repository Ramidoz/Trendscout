import OpportunityCard from "./OpportunityCard";

interface Opportunity {
  topic: string;
  opportunity_score: number;
  confidence: number;
  reason: string;
  velocity_label: string;
  engagement_label: string;
  stage: string;
}

interface OpportunityListProps {
  opportunities: Opportunity[];
  selectedTopic: string | null;
  onSelectTopic: (topic: string | null) => void;
}

export default function OpportunityList({
  opportunities,
  selectedTopic,
  onSelectTopic,
}: OpportunityListProps) {
  return (
    <section>
      <h2 className="text-lg font-semibold text-zinc-300 mb-4">
        Top Opportunities
      </h2>

      {opportunities.length === 0 ? (
        <p className="text-sm text-zinc-300">
          No strong opportunities found. Try a more specific query.
        </p>
      ) : (
        <div className="space-y-4">
          {opportunities.map((opp, i) => (
            <OpportunityCard
              key={`${opp.topic}-${i}`}
              opportunity={opp}
              rank={i + 1}
              isSelected={selectedTopic === opp.topic}
              onSelect={() =>
                onSelectTopic(selectedTopic === opp.topic ? null : opp.topic)
              }
            />
          ))}
        </div>
      )}
    </section>
  );
}
