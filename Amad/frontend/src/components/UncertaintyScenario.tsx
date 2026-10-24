"use client";

import { useState } from "react";
import { useLanguage } from "../store/languageStore";

export interface ResilienceScenario {
  scenario: string;
  label?: "Estimates";
  resilience_score: number;
  rationale: string;
}

interface UncertaintyScenarioProps {
  scenarios: ResilienceScenario[];
  loading?: boolean;
}

const SCENARIO_LABELS = ["Rapid AI Automation", "Economic Recession", "Green Tech Boom"];

function clamp(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export default function UncertaintyScenario({
  scenarios,
  loading = false,
}: UncertaintyScenarioProps) {
  const { t } = useLanguage();
  const [severity, setSeverity] = useState(38);
  const scenarioIndex = severity < 34 ? 0 : severity < 68 ? 1 : 2;
  const selectedScenario = t(SCENARIO_LABELS[scenarioIndex]);
  const reference = scenarios[scenarioIndex] ?? scenarios[0];
  const baseline = reference
    ? clamp(reference.resilience_score)
    : [86, 78, 91][scenarioIndex];
  const resilience = clamp(baseline - severity * 0.32);
  const stability = clamp(100 - severity * 0.58);
  const severityLabel = severity < 34 ? "Low" : severity < 68 ? "Moderate" : "High";

  return (
    <section className="rounded-2xl border border-gray-800 bg-gray-950 p-6 shadow-xl sm:p-8" aria-labelledby="scenario-heading">
      <div className="mb-7">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-600 dark:text-rose-300">{t("Stress-test your pathway")}</p>
        <h2 id="scenario-heading" className="mt-1 text-xl font-semibold text-slate-950 dark:text-white">{t("Future market scenarios")}</h2>
        <p className="mt-2 text-sm text-slate-700 dark:text-gray-300">{t("Adjust disruption severity to see how your pathway may hold up under changing market conditions.")}</p>
      </div>

      {loading ? (
        <div className="h-56 animate-pulse rounded-xl bg-gray-900" role="status" aria-label="Loading scenario estimates" />
      ) : (
        <>
          <div className="rounded-xl border border-gray-800 bg-black/60 p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm text-slate-700 dark:text-gray-300">{t("Selected scenario")}</p>
                <h3 className="mt-1 text-lg font-semibold text-slate-950 dark:text-white">{reference?.scenario ?? selectedScenario}</h3>
              </div>
              <span className="rounded-full border border-rose-400/20 bg-rose-400/10 px-3 py-1 text-xs font-semibold text-rose-200">
                {severityLabel} disruption · {severity}%
              </span>
            </div>
            <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-300">{t(reference?.label ?? "Estimates")}</p>

            <label htmlFor="disruption-severity" className="mt-7 block text-sm font-medium text-slate-800 dark:text-gray-300">
              {t("Market disruption severity")}
            </label>
            <input
              id="disruption-severity"
              type="range"
              min={0}
              max={100}
              step={1}
              value={severity}
              onChange={(event) => setSeverity(Number(event.target.value))}
              className="mt-3 h-2 w-full cursor-pointer appearance-none rounded-full bg-gray-800 accent-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-400/50"
              aria-valuetext={`${severityLabel} disruption, ${severity} percent`}
            />
            <div className="mt-2 flex justify-between text-xs text-slate-600 dark:text-gray-400"><span>{t("Lower")}</span><span>{t("Higher")}</span></div>

            <div className="mt-7 grid gap-4 sm:grid-cols-2">
              <Metric label={t("Pathway resilience")} value={resilience} />
              <Metric label={t("Estimated job stability")} value={stability} />
            </div>
            <p className="mt-5 text-sm leading-6 text-gray-400">
              {reference?.rationale ?? "Illustrative estimates show how adaptable skills and continuous learning can support career resilience as market conditions shift."}
            </p>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {SCENARIO_LABELS.map((label, index) => (
              <button
                key={label}
                type="button"
                onClick={() => setSeverity(index === 0 ? 20 : index === 1 ? 50 : 82)}
                aria-pressed={scenarioIndex === index}
                className={`rounded-xl border px-4 py-3 text-left text-sm transition ${scenarioIndex === index ? "border-rose-400/50 bg-rose-500/10 text-rose-100" : "border-gray-800 bg-gray-900/60 text-gray-400 hover:border-gray-600 hover:text-gray-200"}`}
              >
                {t(label)}
              </button>
            ))}
          </div>
          <p className="mt-4 text-xs text-gray-500">Illustrative scenario estimates for comparison; these are not observed labor-market statistics.</p>
        </>
      )}
    </section>
  );
}

interface MetricProps {
  label: string;
  value: number;
}

function Metric({ label, value }: MetricProps) {
  return (
    <div className="rounded-lg border border-gray-800 bg-gray-950 p-4">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-gray-400">{label}</span>
        <span className="text-xl font-semibold tabular-nums text-white">{value}<span className="ml-0.5 text-xs text-gray-500">%</span></span>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-gray-800" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={value}>
        <div className="h-full rounded-full bg-gradient-to-r from-rose-600 to-pink-300 transition-[width] duration-300" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}
