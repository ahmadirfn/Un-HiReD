"use client";

import { useEffect, useRef, useState } from "react";
import MarketTrends, { type TrendsData } from "../components/MarketTrends";
import OnboardingWizard, { type BaseProfile } from "../components/OnboardingWizard";
import PathwayDashboard, { type AnalysisData } from "../components/PathwayDashboard";
import RoleRanking, { type RankedRole } from "../components/RoleRanking";
import SdgMapping, { type SdgMappingItem } from "../components/SdgMapping";
import UncertaintyScenario from "../components/UncertaintyScenario";

type DashboardTab = "matches" | "impact" | "scenarios";

interface RecommendationResponse {
  trends?: TrendsData;
  analysis?: AnalysisData;
}

function skillGapLabels(gaps: AnalysisData["skills_gap"]): string[] {
  return (gaps ?? []).map((gap) => (typeof gap === "string" ? gap : gap.skill));
}

function toSdgMappings(analysis?: AnalysisData): SdgMappingItem[] {
  const source = analysis?.sdg_mapping ?? analysis?.sdg_alignment ?? [];
  return source.map((item) => ({
    sdg: item.sdg,
    name: item.name ?? item.goal,
    details: item.details ?? item.justification,
    alignment_score: item.alignment_score,
    impact_indicator: item.impact_indicator,
  }));
}

export default function Home() {
  const [profile, setProfile] = useState<BaseProfile | null>(null);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<RecommendationResponse | null>(null);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<DashboardTab>("matches");
  const dashboardRef = useRef<HTMLDivElement>(null);
  const tabPanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!onboardingComplete || !dashboardRef.current) return;
    dashboardRef.current.animate(
      [
        { opacity: 0, transform: "translateY(14px)" },
        { opacity: 1, transform: "translateY(0)" },
      ],
      { duration: 650, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)" },
    );
  }, [onboardingComplete]);

  useEffect(() => {
    const panel = tabPanelRef.current;
    if (!panel || !onboardingComplete) return;
    panel.animate(
      [{ opacity: 0, transform: "translateY(6px)" }, { opacity: 1, transform: "translateY(0)" }],
      { duration: 220, easing: "ease-out" },
    );
  }, [activeTab, onboardingComplete]);

  async function requestRecommendation(nextProfile: BaseProfile): Promise<boolean> {
    setLoading(true);
    setError("");
    setResults(null);

    try {
      const response = await fetch("/api/recommendation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nextProfile),
      });
      if (!response.ok) {
        const responseText = await response.text();
        let message = responseText || `Request failed (${response.status})`;
        try {
          const errorPayload = JSON.parse(responseText) as { detail?: unknown };
          if (typeof errorPayload.detail === "string") {
            message = errorPayload.detail;
          }
        } catch {
          // Keep plain-text server errors readable in the dashboard UI.
        }
        throw new Error(message);
      }
      const data = (await response.json()) as Record<string, unknown>;
      setResults(data as RecommendationResponse);
      return true;
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to analyze your profile. Please try again.",
      );
      return false;
    } finally {
      setLoading(false);
    }
  }

  async function handleOnboardingComplete(nextProfile: BaseProfile) {
    setProfile(nextProfile);
    const succeeded = await requestRecommendation(nextProfile);
    if (succeeded) setOnboardingComplete(true);
  }

  async function handleRoleSelect(role: RankedRole) {
    if (!profile) return;
    const nextProfile = { ...profile, target_role: role.role };
    setProfile(nextProfile);
    await requestRecommendation(nextProfile);
  }

  const analysis = results?.analysis;
  const currentRoleTrend = results?.trends?.matched_trends.find(
    (trend) => trend.skill_or_role.toLowerCase() === profile?.target_role.toLowerCase(),
  );

  const rankedRoles: RankedRole[] = analysis && profile
    ? [
        {
          role: profile.target_role,
          match_score: analysis.match_score,
          skills_gap: analysis.skills_gap ? skillGapLabels(analysis.skills_gap) : undefined,
          demand_status: currentRoleTrend?.demand_status ?? "Unavailable",
          demand_change_pct: currentRoleTrend?.demand_change_pct,
          reason: analysis.match_score_explanation,
        },
        ...(analysis.alternative_roles ?? []).map((role) => {
          const trend = results?.trends?.matched_trends.find(
            (item) => item.skill_or_role.toLowerCase() === role.role.toLowerCase(),
          );
          return {
            role: role.role,
            match_score: role.match_score,
            skills_gap: undefined,
            demand_status: trend?.demand_status ?? "Unavailable",
            demand_change_pct: trend?.demand_change_pct,
            reason: role.reason,
          };
        }),
      ]
    : [];

  return (
    <main className="min-h-screen bg-black px-4 py-10 text-gray-100 sm:px-6 sm:py-14">
      <div className="mx-auto max-w-5xl space-y-8">
        {!onboardingComplete && (
          <header className="pb-2 text-center">
            <div className="mb-5 inline-flex rounded-full border border-rose-400/20 bg-rose-400/5 px-4 py-2 text-xs font-semibold tracking-[0.2em] text-rose-200">
              AIVERSECITY CO-PILOT
            </div>
            <h1 className="mx-auto max-w-3xl text-3xl font-semibold tracking-tight text-white sm:text-5xl">
              A clearer path to your next career move.
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-gray-400">
              A few quick steps will help us shape a career plan around your goals and experience.
            </p>
          </header>
        )}

        {!onboardingComplete && (
          <OnboardingWizard loading={loading} onComplete={handleOnboardingComplete} />
        )}

        {!onboardingComplete && error && (
          <div role="alert" className="mx-auto max-w-2xl rounded-xl border border-rose-900/70 bg-rose-950/40 p-4 text-sm text-rose-200">
            {error}
          </div>
        )}

        {onboardingComplete && (
          <div ref={dashboardRef} className="space-y-8">
            <header className="flex flex-col gap-2 border-b border-gray-800 pb-6 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-300">Your career workspace</p>
                <h1 className="mt-1 text-2xl font-semibold text-white sm:text-3xl">
                  {profile?.first_name ? `Welcome, ${profile.first_name}` : "Your future-ready career plan"}
                </h1>
              </div>
              {profile?.target_role && <p className="text-sm text-gray-400">Exploring: <span className="font-medium text-gray-200">{profile.target_role}</span></p>}
            </header>

            {loading && !results && (
              <div className="rounded-2xl border border-gray-800 bg-gray-950 p-6 text-sm text-gray-300" role="status" aria-live="polite">
                <span className="mr-3 inline-block h-4 w-4 animate-spin rounded-full border-2 border-rose-300/40 border-t-rose-300 align-[-3px]" />
                Refreshing your role pathway and market signals...
              </div>
            )}

            {error && <div role="alert" className="rounded-xl border border-rose-900/70 bg-rose-950/40 p-4 text-sm text-rose-200">{error}</div>}

            {results && (
              <>
                <nav role="tablist" aria-label="Dashboard sections" className="flex gap-1 overflow-x-auto rounded-xl border border-gray-800 bg-gray-950 p-1">
                  {([
                    ["matches", "Career Matches"],
                    ["impact", "Global Impact"],
                    ["scenarios", "Future Scenarios"],
                  ] as const).map(([tab, label]) => (
                    <button
                      key={tab}
                      type="button"
                      role="tab"
                      aria-selected={activeTab === tab}
                      aria-controls="dashboard-tab-panel"
                      onClick={() => setActiveTab(tab)}
                      className={`min-w-max flex-1 rounded-lg px-4 py-3 text-sm font-medium transition-colors duration-200 ${activeTab === tab ? "bg-rose-500/15 text-rose-200 shadow-sm" : "text-gray-400 hover:bg-gray-900 hover:text-gray-100"}`}
                    >
                      {label}
                    </button>
                  ))}
                </nav>

                <div ref={tabPanelRef} id="dashboard-tab-panel" role="tabpanel" className="space-y-8">
                  {activeTab === "matches" && (
                    <div className="space-y-8">
                      <RoleRanking roles={rankedRoles} selectedRole={profile?.target_role ?? ""} loading={loading} onSelectRole={handleRoleSelect} />
                      {results.trends ? (
                        <MarketTrends trends={results.trends} />
                      ) : (
                        <div className="rounded-xl border border-gray-800 bg-gray-950 p-5 text-sm text-gray-400">Market trend data was not returned for this profile.</div>
                      )}
                      {analysis && <PathwayDashboard analysis={analysis} />}
                    </div>
                  )}
                  {activeTab === "impact" && <SdgMapping mappings={toSdgMappings(analysis)} />}
                  {activeTab === "scenarios" && <UncertaintyScenario scenarios={analysis?.scenario_resilience ?? []} loading={loading} />}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
