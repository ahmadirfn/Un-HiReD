"use client";

import { useEffect, useRef, useState } from "react";
import OnboardingWizard, { type BaseProfile } from "../components/OnboardingWizard";
import RoleRanking, { type RoleMatch } from "../components/RoleRanking";
import SdgMapping, { type SdgAlignment } from "../components/SdgMapping";
import UncertaintyScenario from "../components/UncertaintyScenario";

type DashboardTab = "matches" | "impact" | "scenarios";

interface RecommendationResponse {
  roles: RoleMatch[];
  sdgs: SdgAlignment[];
}

export default function Home() {
  const [profile, setProfile] = useState<BaseProfile | null>(null);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<RecommendationResponse | null>(null);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<DashboardTab>("matches");
  const [selectedRole, setSelectedRole] = useState("");
  const dashboardRef = useRef<HTMLDivElement>(null);
  const tabPanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!onboardingComplete || !dashboardRef.current) return;
    dashboardRef.current.animate(
      [{ opacity: 0, transform: "translateY(14px)" }, { opacity: 1, transform: "translateY(0)" }],
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

    const intake = {
      firstName: nextProfile.first_name,
      goal: `${nextProfile.career_goal}; interested role: ${nextProfile.target_role}; current role: ${nextProfile.current_role}`,
      situation: nextProfile.current_situation,
      experience: `${nextProfile.experience_level} (${nextProfile.years_experience} years)`,
      techStack: nextProfile.current_skills,
    };

    try {
      const response = await fetch("/api/recommendation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(intake),
      });
      if (!response.ok) {
        const responseText = await response.text();
        let message = responseText || `Request failed (${response.status})`;
        try {
          const errorPayload = JSON.parse(responseText) as { detail?: unknown };
          if (typeof errorPayload.detail === "string") message = errorPayload.detail;
        } catch {
          // Show plain-text server errors without causing a JSON parse error.
        }
        throw new Error(message);
      }
      const data = (await response.json()) as RecommendationResponse;
      setResults(data);
      setSelectedRole(data.roles[0]?.roleName ?? "");
      return true;
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to analyze your profile. Please try again.");
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

  const selectRole = (role: RoleMatch) => setSelectedRole(role.roleName);

  return (
    <main className="min-h-screen bg-black px-4 py-10 text-gray-100 sm:px-6 sm:py-14">
      <div className="mx-auto max-w-5xl space-y-8">
        {!onboardingComplete && (
          <header className="pb-2 text-center">
            <div className="mb-5 inline-flex rounded-full border border-rose-400/20 bg-rose-400/5 px-4 py-2 text-xs font-semibold tracking-[0.2em] text-rose-200">AIVERSECITY CO-PILOT</div>
            <h1 className="mx-auto max-w-3xl text-3xl font-semibold tracking-tight text-white sm:text-5xl">A clearer path to your next career move.</h1>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-gray-400">A few quick steps will help us shape a career plan around your goals and experience.</p>
          </header>
        )}

        {!onboardingComplete && <OnboardingWizard loading={loading} onComplete={handleOnboardingComplete} />}

        {!onboardingComplete && error && (
          <div role="alert" className="mx-auto max-w-2xl rounded-xl border border-rose-900/70 bg-rose-950/40 p-4 text-sm text-rose-200">{error}</div>
        )}

        {onboardingComplete && (
          <div ref={dashboardRef} className="space-y-8">
            <header className="flex flex-col gap-2 border-b border-gray-800 pb-6 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-300">Your career workspace</p>
                <h1 className="mt-1 text-2xl font-semibold text-white sm:text-3xl">{profile?.first_name ? `Welcome, ${profile.first_name}` : "Your future-ready career plan"}</h1>
              </div>
              {profile?.target_role && <p className="text-sm text-gray-400">Exploring: <span className="font-medium text-gray-200">{profile.target_role}</span></p>}
            </header>

            {error && <div role="alert" className="rounded-xl border border-rose-900/70 bg-rose-950/40 p-4 text-sm text-rose-200">{error}</div>}

            {results && (
              <>
                <nav role="tablist" aria-label="Dashboard sections" className="flex gap-1 overflow-x-auto rounded-xl border border-gray-800 bg-gray-950 p-1">
                  {([ ["matches", "Career Matches"], ["impact", "Global Impact"], ["scenarios", "Future Scenarios"] ] as const).map(([tab, label]) => (
                    <button key={tab} type="button" role="tab" aria-selected={activeTab === tab} aria-controls="dashboard-tab-panel" onClick={() => setActiveTab(tab)} className={`min-w-max flex-1 rounded-lg px-4 py-3 text-sm font-medium transition-colors duration-200 ${activeTab === tab ? "bg-rose-500/15 text-rose-200 shadow-sm" : "text-gray-400 hover:bg-gray-900 hover:text-gray-100"}`}>
                      {label}
                    </button>
                  ))}
                </nav>

                <div ref={tabPanelRef} id="dashboard-tab-panel" role="tabpanel" className="space-y-8">
                  {activeTab === "matches" && <RoleRanking roles={results.roles} selectedRole={selectedRole} loading={loading} onSelectRole={selectRole} />}
                  {activeTab === "impact" && <SdgMapping sdgs={results.sdgs} />}
                  {activeTab === "scenarios" && <UncertaintyScenario scenarios={[]} loading={loading} />}
                </div>
              </>
            )}
          </div>
        )}

        {onboardingComplete && (
          <p className="mt-12 mb-8 text-center text-sm text-gray-500">
            Career trajectories and demand scores are dynamically modeled using insights from{" "}
            <a href="https://www.talentcorp.com.my/mycol/" target="_blank" rel="noopener noreferrer" className="underline hover:text-pink-500">TalentCorp&apos;s MyCOL 2024/2025</a>
            {" "}and{" "}
            <a href="https://open.dosm.gov.my/dashboard/labour-market" target="_blank" rel="noopener noreferrer" className="underline hover:text-pink-500">DOSM Labour Market Data</a>.
          </p>
        )}
      </div>
    </main>
  );
}
