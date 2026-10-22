import { useState } from "react";

export interface ResilienceScenario {
  scenario: string;
  resilience_score: number;
  rationale: string;
}

interface UncertaintyScenarioProps {
  scenarios: ResilienceScenario[];
  loading?: boolean;
}

export default function UncertaintyScenario({
  scenarios,
  loading = false,
}: UncertaintyScenarioProps) {
  const [selectedScenario, setSelectedScenario] = useState("");
  const active = scenarios.find((scenario) => scenario.scenario === selectedScenario) ?? scenarios[0];
  const score = active
    ? Math.max(0, Math.min(100, Number(active.resilience_score) || 0))
    : 0;

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl sm:p-8" aria-labelledby="scenario-heading">
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-400">Stress-test your pathway</p>
        <h2 id="scenario-heading" className="mt-1 text-xl font-semibold text-white">Uncertainty scenarios</h2>
        <p className="mt-2 text-sm text-slate-400">Select a market scenario to compare its estimated resilience score.</p>
      </div>

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-3" aria-live="polite" aria-busy="true">
          {[0, 1, 2].map((item) => <div key={item} className="h-24 animate-pulse rounded-xl bg-slate-800" />)}
          <span className="sr-only">Loading market scenarios</span>
        </div>
      ) : scenarios.length > 0 && active ? (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            {scenarios.map((scenario) => {
              const selected = scenario.scenario === active.scenario;
              return (
                <button
                  key={scenario.scenario}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setSelectedScenario(scenario.scenario)}
                  className={`rounded-xl border p-4 text-left transition focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    selected ? "border-blue-500/50 bg-blue-500/10" : "border-slate-800 bg-slate-950/60 hover:border-slate-600"
                  }`}
                >
                  <span className={`mb-3 block h-1 w-10 rounded-full ${selected ? "bg-blue-400" : "bg-slate-700"}`} />
                  <span className="text-sm font-semibold text-slate-100">{scenario.scenario}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-5 rounded-xl border border-slate-800 bg-slate-950/70 p-5" aria-live="polite">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-sm text-slate-400">Estimated pathway resilience</p>
                <h3 className="mt-1 text-lg font-semibold text-white">{active.scenario}</h3>
              </div>
              <p className="text-3xl font-bold text-cyan-300">
                {score}<span className="ml-1 text-base font-medium text-slate-500">/100</span>
              </p>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-800" role="progressbar" aria-label={`${active.scenario} resilience`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={score}>
              <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-300 transition-[width] duration-500" style={{ width: `${score}%` }} />
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-300">{active.rationale}</p>
            <p className="mt-3 text-xs text-slate-500">Model estimate for comparison; not an observed labor-market statistic.</p>
          </div>
        </>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-800 bg-slate-950/50 p-6 text-center text-sm text-slate-400">
          Scenario estimates will appear after profile analysis.
        </div>
      )}
    </section>
  );
}
