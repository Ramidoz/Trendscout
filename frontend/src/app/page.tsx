"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import QueryBar from "@/components/QueryBar";
import AgentSteps from "@/components/AgentSteps";
import OpportunityList from "@/components/OpportunityList";
import ActionPlan from "@/components/ActionPlan";
import InteractionPanel from "@/components/InteractionPanel";
import SessionHistory from "@/components/SessionHistory";

/* ───── Types ───── */

interface Opportunity {
  topic: string;
  opportunity_score: number;
  confidence: number;
  reason: string;
  velocity_label: string;
  engagement_label: string;
  stage: string;
}

interface Idea {
  priority: number;
  title: string;
  format: string;
  hook: string;
  reason: string;
  expected_outcome: string;
}

interface AgentStep {
  tool: string;
  args: Record<string, unknown>;
}

interface AgentResponse {
  answer: string;
  steps: AgentStep[];
  briefing: {
    top_opportunities: Opportunity[];
    action_plan: Idea[];
  } | null;
}

/* ───── Helpers ───── */

const HISTORY_KEY = "trendscope_history";
const MAX_HISTORY = 10;

function loadHistory(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveHistory(history: string[]) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch {
    /* ignore quota errors */
  }
}

function addToHistory(history: string[], query: string): string[] {
  const filtered = history.filter(
    (h) => h.toLowerCase() !== query.toLowerCase()
  );
  const updated = [query, ...filtered].slice(0, MAX_HISTORY);
  saveHistory(updated);
  return updated;
}

/* ───── Page ───── */

export default function Home() {
  /* State */
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [answer, setAnswer] = useState("");
  const [steps, setSteps] = useState<AgentStep[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [actionPlan, setActionPlan] = useState<Idea[]>([]);

  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [refinementInput, setRefinementInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);

  /* Request tracking */
  const requestIdRef = useRef(0);

  /* Load history on mount */
  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  /* Core fetch */
  const handleGenerate = useCallback(
    async (overrideQuery?: string) => {
      const q = (overrideQuery ?? query).trim();
      if (!q) return;

      const currentRequestId = ++requestIdRef.current;
      setLoading(true);
      setError("");

      try {
        const apiBase =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const res = await fetch(
          `${apiBase}/agent?q=${encodeURIComponent(q)}`
        );

        /* Stale response check */
        if (currentRequestId !== requestIdRef.current) return;

        if (!res.ok) {
          const errBody = await res.text();
          throw new Error(errBody || `HTTP ${res.status}`);
        }

        const json: AgentResponse = await res.json();

        /* Stale response check (after await) */
        if (currentRequestId !== requestIdRef.current) return;

        setAnswer(json.answer);
        setSteps(json.steps);
        setOpportunities(json.briefing?.top_opportunities ?? []);
        setActionPlan(json.briefing?.action_plan ?? []);
        setSelectedTopic(null);
        setHistory((prev) => addToHistory(prev, q));
      } catch (err) {
        if (currentRequestId !== requestIdRef.current) return;
        setError(
          err instanceof Error ? err.message : "Something went wrong"
        );
        /* Preserve previous results on error */
      } finally {
        if (currentRequestId === requestIdRef.current) {
          setLoading(false);
        }
      }
    },
    [query]
  );

  /* Derived state: filtered action plan */
  const filteredActionPlan = selectedTopic
    ? actionPlan.filter(
        (idea) =>
          idea.title.toLowerCase().includes(selectedTopic.toLowerCase()) ||
          idea.reason.toLowerCase().includes(selectedTopic.toLowerCase())
      )
    : actionPlan;

  const displayedActionPlan =
    filteredActionPlan.length > 0 ? filteredActionPlan : actionPlan;

  /* Handlers */
  function handleRefine() {
    if (!refinementInput.trim()) return;
    setQuery(refinementInput.trim());
    handleGenerate(refinementInput.trim());
  }

  function handleFollowUp(followUpQuery: string) {
    setQuery(followUpQuery);
    handleGenerate(followUpQuery);
  }

  function handleReplay(pastQuery: string) {
    setQuery(pastQuery);
    handleGenerate(pastQuery);
  }

  function handleFocusTopic(title: string) {
    setSelectedTopic((prev) => (prev === title ? null : title));
  }

  function handleRefineTopic(title: string) {
    setRefinementInput(title);
  }

  const hasResults =
    opportunities.length > 0 || actionPlan.length > 0 || answer;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <h1 className="text-3xl font-bold mb-1">TrendScope</h1>
        <p className="text-zinc-400 mb-6">
          Enter a topic to get a prioritized content strategy based on live
          YouTube trends.
        </p>

        {/* Query Bar */}
        <QueryBar
          query={query}
          loading={loading}
          onQueryChange={setQuery}
          onSubmit={() => handleGenerate()}
        />

        {/* Error */}
        {error && (
          <div className="mt-4 p-4 rounded-xl bg-red-900/30 border border-red-800 text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* Agent Steps */}
        {(loading || steps.length > 0) && (
          <div className="mt-6">
            <AgentSteps steps={steps} loading={loading} />
          </div>
        )}

        {/* Main 3-column layout */}
        {hasResults && !loading && (
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left: Opportunities */}
            <div className="lg:col-span-1">
              <OpportunityList
                opportunities={opportunities}
                selectedTopic={selectedTopic}
                onSelectTopic={setSelectedTopic}
              />
            </div>

            {/* Center: Action Plan */}
            <div className="lg:col-span-2">
              <ActionPlan
                ideas={displayedActionPlan}
                onFocusTopic={handleFocusTopic}
                onRefineTopic={handleRefineTopic}
              />
            </div>

            {/* Right: Interaction Panel */}
            <div className="lg:col-span-1">
              <InteractionPanel
                selectedTopic={selectedTopic}
                refinementInput={refinementInput}
                loading={loading}
                answer={answer}
                opportunities={opportunities}
                onRefinementChange={setRefinementInput}
                onRefine={handleRefine}
                onFollowUp={handleFollowUp}
              />
            </div>
          </div>
        )}

        {/* Session History */}
        <SessionHistory history={history} onReplay={handleReplay} />
      </div>
    </div>
  );
}
