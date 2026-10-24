"use client";

import { useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
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
  const [dragging, setDragging] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const scenarioIndex = severity < 34 ? 2 : severity < 68 ? 1 : 0;
  const selectedScenario = t(SCENARIO_LABELS[scenarioIndex]);
  const reference = scenarios[scenarioIndex] ?? scenarios[0];
  const baseline = reference
    ? clamp(reference.resilience_score)
    : [86, 78, 91][scenarioIndex];
  const resilience = clamp(baseline - severity * 0.32);
  const stability = clamp(100 - severity * 0.58);
  const severityLabel = severity < 34 ? t("Low risk") : severity < 68 ? t("Medium risk") : t("High risk");

  function updateSeverity(clientX: number) {
    const bounds = trackRef.current?.getBoundingClientRect();
    if (!bounds || bounds.width === 0) return;
    const nextSeverity = ((clientX - bounds.left) / bounds.width) * 100;
    setSeverity(Math.max(0, Math.min(100, Math.round(nextSeverity))));
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
    updateSeverity(event.clientX);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const adjustments: Record<string, number> = {
      ArrowLeft: -5, ArrowDown: -5, ArrowRight: 5, ArrowUp: 5,
      PageDown: -15, PageUp: 15,
    };
    if (event.key === "Home") {
      event.preventDefault();
      setSeverity(0);
    } else if (event.key === "End") {
      event.preventDefault();
      setSeverity(100);
    } else if (adjustments[event.key]) {
      event.preventDefault();
      setSeverity((current) => Math.max(0, Math.min(100, current + adjustments[event.key])));
    }
  }

  return (
    <section className="rounded-2xl border border-gray-800 bg-gray-950 p-6 shadow-xl sm:p-8" aria-labelledby="scenario-heading">
      <div className="mb-7">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-600 dark:text-rose-300">{t("Future changes")}</p>
        <h2 id="scenario-heading" className="mt-1 text-xl font-semibold text-slate-950 dark:text-white">{t("Future market scenarios")}</h2>
      </div>

      {loading ? (
        <div className="h-56 animate-pulse rounded-xl bg-gray-900" role="status" aria-label="Loading scenario estimates" />
      ) : (
        <>
          <div className="mb-6 rounded-xl border border-gray-800 bg-gray-900 p-5 sm:p-7">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-white">{t("Market risk")}</h3>
                <p className="mt-1 text-sm text-gray-300">{t("Hold the wheel and move it from left to right.")}</p>
              </div>
              <span className="rounded-full border border-rose-400/20 bg-rose-400/10 px-3 py-1 text-sm font-semibold text-rose-100">{severityLabel} · {severity}%</span>
            </div>
            <div
              ref={trackRef}
              role="slider"
              aria-label={t("Market risk")}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={severity}
              aria-valuetext={`${severityLabel}, ${severity}%`}
              tabIndex={0}
              onPointerDown={handlePointerDown}
              onPointerMove={(event) => dragging && updateSeverity(event.clientX)}
              onPointerUp={() => setDragging(false)}
              onPointerCancel={() => setDragging(false)}
              onKeyDown={handleKeyDown}
              className="relative mx-5 mt-9 h-14 touch-none cursor-grab rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-rose-400 active:cursor-grabbing"
            >
              <div className="absolute left-0 right-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-gray-700" />
              <div className="absolute left-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-rose-600" style={{ width: `${severity}%` }} />
              <div className="absolute top-1/2 z-10 grid h-12 w-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-4 border-rose-300 bg-gray-950 shadow-lg shadow-black/40" style={{ left: `${severity}%` }}>
                <svg aria-hidden="true" viewBox="0 0 32 32" className="h-7 w-7" style={{ transform: `rotate(${severity * 7.2}deg)` }}>
                  <circle cx="16" cy="16" r="12" fill="none" stroke="white" strokeWidth="2" />
                  <circle cx="16" cy="16" r="2.5" fill="white" />
                  <path d="M16 4v9m0 6v9M4 16h9m6 0h9M7.5 7.5l6.4 6.4m4.2 4.2 6.4 6.4m0-17-6.4 6.4m-4.2 4.2-6.4 6.4" stroke="white" strokeWidth="1.6" />
                </svg>
              </div>
            </div>
            <div className="mx-5 flex justify-between text-sm font-medium text-gray-300"><span>{t("Lower risk")}</span><span>{t("Higher risk")}</span></div>
            <div className="mt-5 flex items-center gap-3 rounded-lg border border-gray-800 bg-gray-950 p-3">
              <span aria-hidden="true" className={`h-3 w-3 shrink-0 rounded-full ${scenarioIndex === 0 ? "bg-rose-500" : scenarioIndex === 1 ? "bg-violet-500" : "bg-emerald-500"}`} />
              <p className="text-sm text-gray-300">{t("Current scenario")}: <strong className="text-white">{t(reference?.scenario ?? selectedScenario)}</strong></p>
            </div>
          </div>
          <div className="rounded-xl border border-gray-800 bg-black/60 p-5 sm:p-6" aria-live="polite">
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

            <div className="mt-7 grid gap-4 sm:grid-cols-2">
              <Metric label={t("Pathway resilience")} value={resilience} />
              <Metric label={t("Estimated job stability")} value={stability} />
            </div>
            <p className="mt-5 text-sm leading-6 text-gray-400">
              {reference?.rationale ?? "Illustrative estimates show how adaptable skills and continuous learning can support career resilience as market conditions shift."}
            </p>
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
