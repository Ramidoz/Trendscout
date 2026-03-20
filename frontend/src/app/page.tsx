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

const DEMO_PROMPTS = [
  { icon: "🎬", query: "AI tools for creators", description: "Discover trending AI tools" },
  { icon: "🐍", query: "python automation", description: "Find automation opportunities" },
  { icon: "💰", query: "crypto news", description: "Analyze crypto content trends" },
];

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

  /* Request tracking + fade-in */
  const requestIdRef = useRef(0);
  const [resultsKey, setResultsKey] = useState(0);

  /* Refs for scroll/focus */
  const resultsRef = useRef<HTMLDivElement>(null);
  const refinementRef = useRef<HTMLTextAreaElement>(null);

  /* Load history on mount */
  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  /* Core fetch */
  const handleGenerate = useCallback(
    async (overrideQuery?: string) => {
      const q = (overrideQuery ?? query).trim();
      if (!q || q.length < 3) return;

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
        setResultsKey((k) => k + 1);
        setHistory((prev) => addToHistory(prev, q));

        /* Scroll to results after render */
        setTimeout(() => {
          resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 100);
      } catch (err) {
        if (currentRequestId !== requestIdRef.current) return;

        if (err instanceof TypeError && err.message === "Failed to fetch") {
          setError("Could not reach the server — check your connection and try again");
        } else {
          setError(
            err instanceof Error ? err.message : "Something went wrong"
          );
        }
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
    setTimeout(() => refinementRef.current?.focus(), 50);
  }

  const hasResults =
    opportunities.length > 0 || actionPlan.length > 0 || answer;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <h1 className="text-3xl font-bold mb-1">TrendScope</h1>
        <p className="text-zinc-500 text-sm mb-8">
          Powered by real-time YouTube trend analysis
        </p>

        {/* Query Bar (sticky) */}
        <QueryBar
          query={query}
          loading={loading}
          onQueryChange={setQuery}
          onSubmit={() => handleGenerate()}
        />

        {/* Spacer for sticky bar */}
        <div className="h-4" />

        {/* Error */}
        {error && (
          <div className="mt-2 p-4 rounded-xl bg-red-900/30 border border-red-800 text-red-300 text-sm flex items-center justify-between">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => handleGenerate()}
              className="ml-4 shrink-0 px-3 py-1 text-xs rounded-lg border border-red-700 text-red-300 hover:bg-red-900/40 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* Agent Steps */}
        {(loading || steps.length > 0) && (
          <div className="mt-6">
            <AgentSteps steps={steps} loading={loading} />
          </div>
        )}

        {/* Demo Empty State */}
        {!hasResults && !loading && !error && (
          <div className="mt-16 flex flex-col items-center text-center">
            <p className="text-zinc-400 text-sm mb-6">
              Ask anything like a creator:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl w-full">
              {DEMO_PROMPTS.map((prompt) => (
                <button
                  key={prompt.query}
                  type="button"
                  onClick={() => {
                    setQuery(prompt.query);
                    handleGenerate(prompt.query);
                  }}
                  className="p-4 rounded-xl border border-zinc-800 bg-zinc-900 hover:border-purple-500/40 hover:bg-zinc-800/50 transition-all text-left group"
                >
                  <span className="text-2xl mb-2 block">{prompt.icon}</span>
                  <span className="text-sm font-medium text-zinc-200 group-hover:text-purple-300 transition-colors">
                    {prompt.query}
                  </span>
                  <span className="text-xs text-zinc-500 block mt-1">
                    {prompt.description}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Main 3-column layout */}
        {hasResults && !loading && (
          <div
            ref={resultsRef}
            key={resultsKey}
            className="mt-8 grid grid-cols-1 lg:grid-cols-4 gap-6 animate-fade-in"
          >
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
                ref={refinementRef}
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
