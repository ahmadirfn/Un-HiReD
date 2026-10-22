export interface PathwayStep {
  step?: number;
  title?: string;
  objective?: string;
  resource?: string;
  resource_name?: string;
  resource_url?: string;
  activity?: string;
  skills?: string[];
  cost_note?: string;
}

export interface SdgItem {
  sdg: number | string;
  name?: string;
  details?: string;
  goal?: string;
  justification?: string;
}

export interface AlternativeRole {
  role: string;
  match_score: number;
  reason: string;
}

export interface DisruptionScenarios {
  moderate_disruption: string;
  fast_disruption: string;
}

export interface AnalysisData {
  match_score: number;
  alternative_roles?: AlternativeRole[];
  match_score_explanation?: string;
  skills_gap?: Array<string | { skill: string; reason?: string }>;
  pathway?: PathwayStep[];
  reskilling_pathway?: PathwayStep[];
  sdg_mapping?: SdgItem[];
  sdg_alignment?: SdgItem[];
  uncertainty_scenarios?:
    | DisruptionScenarios
    | Array<{
        scenario: string;
        assumptions?: string[];
        estimated_impact?: string;
      }>;
}

interface PathwayDashboardProps {
  analysis: AnalysisData;
}

function sdgNumber(value: number | string) {
  const match = String(value).match(/\d+/);
  return match ? Number(match[0]) : 0;
}

function sdgColor(number: number) {
  if (number === 4) return "bg-[#C5192D]";
  if (number === 8) return "bg-[#A21942]";
  return "bg-blue-700";
}

function scenarioText(
  scenarios: AnalysisData["uncertainty_scenarios"],
  key: "moderate_disruption" | "fast_disruption",
): string {
  if (!scenarios) return "No scenario estimate was provided.";
  if (Array.isArray(scenarios)) {
    const match = scenarios.find((scenario) =>
      scenario.scenario.toLowerCase().includes(key.split("_")[0]),
    );
    if (!match) return "No scenario estimate was provided.";
    const assumptions = match.assumptions?.join(" ") ?? "";
    return [assumptions, match.estimated_impact].filter(Boolean).join(" ");
  }
  return scenarios[key] ?? "No scenario estimate was provided.";
}

export default function PathwayDashboard({
  analysis,
}: PathwayDashboardProps) {
  const score = Math.max(0, Math.min(100, Number(analysis.match_score) || 0));
  const skillsGap = analysis.skills_gap ?? [];
  const alternativeRoles = analysis.alternative_roles ?? [];
  const pathway = analysis.pathway ?? analysis.reskilling_pathway ?? [];
  const sdgItems = analysis.sdg_mapping ?? analysis.sdg_alignment ?? [];
  const moderateScenario = scenarioText(
    analysis.uncertainty_scenarios,
    "moderate_disruption",
  );
  const fastScenario = scenarioText(
    analysis.uncertainty_scenarios,
    "fast_disruption",
  );

  return (
    <section
      className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl shadow-black/20"
      aria-label="AI reskilling and SDG dashboard"
    >
      <div className="border-b border-slate-800 bg-gradient-to-r from-blue-500/10 via-indigo-500/5 to-transparent px-6 py-6 sm:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-400">
          Your career outlook
        </p>
        <h2 className="mt-1 text-2xl font-semibold text-white">
          Reskilling &amp; impact dashboard
        </h2>
      </div>

      <div className="space-y-10 p-6 sm:p-8">
        <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <section
            className="rounded-xl border border-slate-800 bg-slate-950/70 p-5"
            aria-labelledby="match-score-heading"
          >
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-sm text-slate-400">Current profile alignment</p>
                <h3
                  id="match-score-heading"
                  className="mt-1 text-lg font-semibold text-white"
                >
                  Match score
                </h3>
              </div>
              <p className="text-4xl font-bold tracking-tight text-cyan-300">
                {score}
                <span className="text-xl text-slate-500">/100</span>
              </p>
            </div>
            <div
              className="mt-5 h-2.5 overflow-hidden rounded-full bg-slate-800"
              role="progressbar"
              aria-label="Profile match score"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={score}
            >
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-300 transition-[width] duration-700"
                style={{ width: `${score}%` }}
              />
            </div>
            {analysis.match_score_explanation && (
              <p className="mt-4 text-sm leading-6 text-slate-400">
                {analysis.match_score_explanation}
              </p>
            )}

            <div className="mt-6 border-t border-slate-800 pt-5">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h4 className="text-sm font-semibold text-slate-200">
                  Alternative Ranked Roles
                </h4>
                <span className="text-xs text-slate-500">Based on your skills</span>
              </div>
              {alternativeRoles.length > 0 ? (
                <ol className="space-y-2">
                  {alternativeRoles.map((alternative, index) => {
                    const roleScore = Math.max(
                      0,
                      Math.min(100, Number(alternative.match_score) || 0),
                    );
                    return (
                      <li
                        key={`${alternative.role}-${index}`}
                        className="group rounded-lg border border-slate-800 bg-slate-900/80 p-3 transition duration-200 hover:-translate-y-0.5 hover:border-blue-500/40 hover:bg-slate-900"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex min-w-0 items-center gap-2.5">
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-blue-500/10 text-xs font-semibold text-blue-300">
                              {index + 1}
                            </span>
                            <span className="truncate text-sm font-medium text-slate-100 group-hover:text-white">
                              {alternative.role}
                            </span>
                          </div>
                          <span className="shrink-0 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2 py-1 text-xs font-semibold text-cyan-200">
                            {roleScore}% match
                          </span>
                        </div>
                        <p className="ml-[34px] mt-2 text-xs leading-5 text-slate-400">
                          {alternative.reason}
                        </p>
                      </li>
                    );
                  })}
                </ol>
              ) : (
                <p className="rounded-lg border border-slate-800 bg-slate-900/60 p-3 text-xs text-slate-500">
                  No alternative roles were provided.
                </p>
              )}
            </div>
          </section>

          <section aria-labelledby="skills-gap-heading">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3
                id="skills-gap-heading"
                className="text-lg font-semibold text-white"
              >
                Skills to build
              </h3>
              <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-2.5 py-1 text-xs font-medium text-amber-300">
                {skillsGap.length} {skillsGap.length === 1 ? "gap" : "gaps"}
              </span>
            </div>
            {skillsGap.length > 0 ? (
              <ul className="flex flex-wrap gap-2.5">
                {skillsGap.map((item, index) => {
                  const skill = typeof item === "string" ? item : item.skill;
                  const reason = typeof item === "string" ? undefined : item.reason;
                  return (
                    <li
                      key={`${skill}-${index}`}
                      title={reason}
                      className="rounded-lg border border-amber-400/20 bg-amber-400/5 px-3 py-2 text-sm text-amber-100"
                    >
                      <span className="mr-2 text-amber-400" aria-hidden="true">
                        +
                      </span>
                      {skill}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 text-sm text-slate-400">
                No specific skill gaps were provided.
              </p>
            )}
          </section>
        </div>

        <section aria-labelledby="pathway-heading">
          <div className="mb-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-400">
              Your next steps
            </p>
            <h3
              id="pathway-heading"
              className="mt-1 text-xl font-semibold text-white"
            >
              Action plan
            </h3>
          </div>
          {pathway.length > 0 ? (
            <ol className="relative space-y-4 before:absolute before:bottom-8 before:left-[19px] before:top-8 before:w-px before:bg-slate-700">
              {pathway.map((step, index) => {
                const title = step.title ?? step.objective ?? `Learning step ${index + 1}`;
                const resource = step.resource ?? step.resource_name;
                const stepNumber = step.step ?? index + 1;
                return (
                  <li
                    key={`${stepNumber}-${title}`}
                    className="relative flex gap-4 rounded-xl border border-slate-800 bg-slate-950/50 p-4"
                  >
                    <span className="z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-blue-400/30 bg-slate-900 text-sm font-bold text-blue-300">
                      {stepNumber}
                    </span>
                    <div className="min-w-0 flex-1 py-0.5">
                      <h4 className="font-semibold text-slate-100">{title}</h4>
                      {step.activity && (
                        <p className="mt-1 text-sm leading-6 text-slate-400">
                          {step.activity}
                        </p>
                      )}
                      {step.skills && step.skills.length > 0 && (
                        <p className="mt-2 text-xs text-slate-500">
                          Focus: {step.skills.join(", ")}
                        </p>
                      )}
                      {resource && (
                        <p className="mt-3 text-sm text-slate-400">
                          Resource: {" "}
                          {step.resource_url ? (
                            <a
                              href={step.resource_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-medium text-blue-300 underline decoration-blue-300/30 underline-offset-4 hover:text-blue-200"
                            >
                              {resource}
                            </a>
                          ) : (
                            <span className="font-medium text-blue-300">
                              {resource}
                            </span>
                          )}
                        </p>
                      )}
                      {step.cost_note && (
                        <p className="mt-2 text-xs text-slate-500">
                          {step.cost_note}
                        </p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          ) : (
            <p className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 text-sm text-slate-400">
              No learning pathway was provided.
            </p>
          )}
        </section>

        <section aria-labelledby="sdg-heading">
          <div className="mb-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-400">
              Learning and opportunity
            </p>
            <h3
              id="sdg-heading"
              className="mt-1 text-xl font-semibold text-white"
            >
              UN Sustainable Development Goals
            </h3>
          </div>
          {sdgItems.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {sdgItems.map((item, index) => {
                const number = sdgNumber(item.sdg);
                const detail = item.details ?? item.justification ?? "";
                const name = item.name ?? item.goal ?? `Sustainable Development Goal ${number}`;
                return (
                  <article
                    key={`${number}-${index}`}
                    className={`${sdgColor(number)} min-h-44 rounded-xl p-5 text-white shadow-lg shadow-black/10`}
                  >
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/75">
                      UN Sustainable Development Goal
                    </p>
                    <div className="mt-3 flex items-start gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/15 text-lg font-bold">
                        {number}
                      </span>
                      <div>
                        <h4 className="text-lg font-bold leading-6">{name}</h4>
                        <p className="mt-2 text-sm leading-6 text-white/90">
                          {detail}
                        </p>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <p className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 text-sm text-slate-400">
              No SDG alignment was provided.
            </p>
          )}
        </section>

        <section aria-labelledby="scenarios-heading">
          <div className="mb-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-400">
              Plan for change
            </p>
            <h3
              id="scenarios-heading"
              className="mt-1 text-xl font-semibold text-white"
            >
              Future scenarios
            </h3>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <article className="rounded-xl border border-cyan-400/20 bg-cyan-400/5 p-5">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-cyan-300" />
                <h4 className="font-semibold text-cyan-100">
                  Moderate AI disruption
                </h4>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                {moderateScenario}
              </p>
            </article>
            <article className="rounded-xl border border-fuchsia-400/20 bg-fuchsia-400/5 p-5">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-fuchsia-300" />
                <h4 className="font-semibold text-fuchsia-100">
                  Fast AI disruption
                </h4>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                {fastScenario}
              </p>
            </article>
          </div>
        </section>
      </div>
    </section>
  );
}
