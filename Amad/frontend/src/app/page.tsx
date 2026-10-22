"use client";

import { useState } from "react";
import MarketTrends, { type TrendsData } from "../components/MarketTrends";
import PathwayDashboard, { type AnalysisData } from "../components/PathwayDashboard";
import RoleRanking, { type RankedRole } from "../components/RoleRanking";
import SdgMapping, { type SdgMappingItem } from "../components/SdgMapping";
import SkillIntake, { type BaseProfile } from "../components/SkillIntake";
import UncertaintyScenario from "../components/UncertaintyScenario";

interface RecommendationResponse {
  trends?: TrendsData;
  analysis?: AnalysisData;
}

const INITIAL_PROFILE: BaseProfile = {
  current_role: "",
  current_skills: [],
  years_experience: 0,
  target_role: "AI and Machine Learning Specialist",
};

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
  const [profile, setProfile] = useState<BaseProfile>(INITIAL_PROFILE);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<RecommendationResponse | null>(null);
  const [error, setError] = useState("");

  async function requestRecommendation(nextProfile: BaseProfile) {
    setLoading(true);
    setError("");
    setResults(null);

    try {
      const response = await fetch("/api/recommendation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          current_skills: nextProfile.current_skills,
          target_role: nextProfile.target_role,
          current_role: nextProfile.current_role,
          years_experience: nextProfile.years_experience,
        }),
      });
      const data = (await response.json()) as Record<string, unknown>;

      if (!response.ok) {
        const detail =
          typeof data.detail === "string"
            ? data.detail
            : `Request failed (${response.status})`;
        throw new Error(detail);
      }

      setResults(data as RecommendationResponse);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to analyze your profile. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleProfileSubmit(nextProfile: BaseProfile) {
    setProfile(nextProfile);
    await requestRecommendation(nextProfile);
  }

  async function handleRoleSelect(role: RankedRole) {
    const nextProfile = { ...profile, target_role: role.role };
    setProfile(nextProfile);
    await requestRecommendation(nextProfile);
  }

  const analysis = results?.analysis;
  const currentRoleTrend = results?.trends?.matched_trends.find(
    (trend) => trend.skill_or_role.toLowerCase() === profile.target_role.toLowerCase(),
  );

  const rankedRoles: RankedRole[] = analysis
    ? [
        {
          role: profile.target_role,
          match_score: analysis.match_score,
          skills_gap: analysis.skills_gap
            ? skillGapLabels(analysis.skills_gap)
            : undefined,
          demand_status: currentRoleTrend?.demand_status ?? "Unavailable",
          demand_change_pct: currentRoleTrend?.demand_change_pct,
          reason: analysis.match_score_explanation,
        },
        ...(analysis.alternative_roles ?? []).map((role) => ({
          role: role.role,
          match_score: role.match_score,
          skills_gap: undefined,
          demand_status:
            results?.trends?.matched_trends.find(
              (trend) => trend.skill_or_role.toLowerCase() === role.role.toLowerCase(),
            )?.demand_status ?? "Unavailable",
          demand_change_pct: results?.trends?.matched_trends.find(
            (trend) => trend.skill_or_role.toLowerCase() === role.role.toLowerCase(),
          )?.demand_change_pct,
          reason: role.reason,
        })),
      ]
    : [];

  return (
    <main className="min-h-screen px-4 py-12 sm:px-6">
      <div className="mx-auto max-w-5xl space-y-8">
        <header className="pb-2 text-center">
          <div className="mb-5 inline-flex rounded-full bg-gradient-to-r from-blue-500/20 via-indigo-500/20 to-cyan-400/20 p-px">
            <span className="rounded-full bg-slate-950/90 px-4 py-2 text-xs font-semibold tracking-[0.2em] text-blue-200 sm:text-sm">
              AIVERSECITY CO-PILOT
            </span>
          </div>
          <h1 className="mx-auto max-w-3xl bg-gradient-to-r from-white via-blue-100 to-cyan-300 bg-clip-text text-3xl font-bold tracking-tight text-transparent sm:text-5xl sm:leading-tight">
            Make your next career move with confidence.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-400 sm:text-lg">
            Turn your experience into a practical, evidence-aware plan for
            future-ready work.
          </p>
        </header>

        <SkillIntake
          loading={loading}
          initialTargetRole={profile.target_role}
          onProfileSubmit={handleProfileSubmit}
        />

        {error && (
          <div role="alert" className="rounded-xl border border-red-900/70 bg-red-950/50 p-4 text-sm text-red-200">
            {error}
          </div>
        )}

        {loading && !results && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-sm text-slate-300" role="status" aria-live="polite">
            <span className="mr-3 inline-block h-4 w-4 animate-spin rounded-full border-2 border-blue-300/40 border-t-blue-300 align-[-3px]" />
            Preparing your trends, role rankings, and pathway dashboard...
          </div>
        )}

        {results && (
          <div className="space-y-8">
            {results.trends ? (
              <MarketTrends trends={results.trends} />
            ) : (
              <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 text-sm text-slate-400">
                Market trend data was not returned for this profile.
              </div>
            )}

            {analysis && <PathwayDashboard analysis={analysis} />}

            <RoleRanking
              roles={rankedRoles}
              selectedRole={profile.target_role}
              loading={loading}
              onSelectRole={handleRoleSelect}
            />

            <SdgMapping mappings={toSdgMappings(analysis)} />

            <UncertaintyScenario
              scenarios={analysis?.scenario_resilience ?? []}
              loading={loading}
            />
          </div>
        )}

        {!results && !loading && !error && (
          <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/50 px-6 py-8 text-center text-sm text-slate-400">
            Your market signals, role rankings, learning pathway, and SDG
            alignment will appear here after profile analysis.
          </div>
        )}
      </div>
    </main>
  );
}
