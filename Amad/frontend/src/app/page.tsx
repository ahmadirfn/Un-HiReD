"use client";

import { useEffect, useRef, useState } from "react";
import { Command as CommandIcon, PanelLeftOpen, Search } from "lucide-react";
import OnboardingWizard, { type BaseProfile } from "../components/OnboardingWizard";
import CommandPalette, { type DashboardCommand } from "../components/CommandPalette";
import MagneticButton from "../components/MagneticButton";
import RoleRanking, { type RoleMatch } from "../components/RoleRanking";
import SdgMapping, { type SdgAlignment } from "../components/SdgMapping";
import Sidebar, { type WorkspaceSection } from "../components/Sidebar";

interface RecommendationResponse {
  roles: RoleMatch[];
  sdgs: SdgAlignment[];
}

const SECTION_TITLES: Record<WorkspaceSection, { eyebrow: string; title: string; description: string }> = {
  profile: { eyebrow: "MY PROFILE", title: "Discover yourself", description: "Your goals and experience shape your career recommendations." },
  cv: { eyebrow: "MY PROFILE", title: "Your CV", description: "Review the skills extracted from your uploaded resume." },
  matches: { eyebrow: "EXPLORE", title: "Career matches", description: "Future-ready roles ranked against your profile." },
  pathway: { eyebrow: "EXPLORE", title: "Learning pathway", description: "Focus areas to help close the gap to your selected role." },
  impact: { eyebrow: "EXPLORE", title: "SDG impact", description: "How your potential career direction aligns with global goals." },
};

export default function Home() {
  const [profile, setProfile] = useState<BaseProfile | null>(null);
  const [hasUploadedCV, setHasUploadedCV] = useState(false);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<RecommendationResponse | null>(null);
  const [error, setError] = useState("");
  const [activeSection, setActiveSection] = useState<WorkspaceSection>("matches");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [commandMessage, setCommandMessage] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const dashboardRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!onboardingComplete || !dashboardRef.current) return;
    dashboardRef.current.animate(
      [{ opacity: 0, transform: "translateY(12px)" }, { opacity: 1, transform: "translateY(0)" }],
      { duration: 500, easing: "ease-out" },
    );
  }, [onboardingComplete]);

  useEffect(() => {
    if (!contentRef.current || !onboardingComplete) return;
    contentRef.current.animate(
      [{ opacity: 0, transform: "translateY(5px)" }, { opacity: 1, transform: "translateY(0)" }],
      { duration: 200, easing: "ease-out" },
    );
  }, [activeSection, onboardingComplete]);

  useEffect(() => {
    const previewUrl = profile?.resumePreviewUrl;
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [profile?.resumePreviewUrl]);

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
          // Keep plain-text errors readable.
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
    setHasUploadedCV(nextProfile.hasUploadedCV);
    const succeeded = await requestRecommendation(nextProfile);
    if (succeeded) setOnboardingComplete(true);
  }

  function handleLogout() {
    setProfile(null);
    setHasUploadedCV(false);
    setResults(null);
    setError("");
    setLoading(false);
    setSelectedRole("");
    setActiveSection("matches");
    setOnboardingComplete(false);
    window.location.href = "/";
  }

  function handleCommand(command: DashboardCommand) {
    setCommandMessage("");
    if (command === "optimize-resume") {
      if (hasUploadedCV) setActiveSection("cv");
      else {
        setActiveSection("profile");
        setCommandMessage("Upload a resume to open your CV workspace.");
      }
    } else if (command === "analyze-skill-gaps") {
      setActiveSection("pathway");
    } else {
      setActiveSection("matches");
      setCommandMessage("Mock interview generation is not connected yet.");
    }

    window.setTimeout(() => setCommandMessage(""), 4000);
  }

  const selectedRoleMatch = results?.roles.find((role) => role.roleName === selectedRole) ?? results?.roles[0];
  const sectionTitle = SECTION_TITLES[activeSection];

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 dark:bg-[#0f1117] dark:text-white">
      {!onboardingComplete ? (
        <div className="flex min-h-screen flex-col items-center justify-center px-4 py-8 sm:px-6 sm:py-12">
          <OnboardingWizard loading={loading} onComplete={handleOnboardingComplete} />
          {error && <div role="alert" className="mx-auto mt-5 max-w-2xl rounded-xl border border-rose-900/70 bg-rose-950/40 p-4 text-sm text-rose-200">{error}</div>}
        </div>
      ) : (
        <div ref={dashboardRef} className="flex min-h-screen flex-col lg:h-screen lg:flex-row">
          <CommandPalette onCommand={handleCommand} />
          <Sidebar
            activeSection={activeSection}
            hasUploadedCV={hasUploadedCV}
            userName={profile?.first_name ?? ""}
            onNavigate={setActiveSection}
            onLogout={handleLogout}
            isOpen={isSidebarOpen}
            onToggle={() => setIsSidebarOpen(false)}
          />

          {!isSidebarOpen && <button
            type="button"
            onClick={() => setIsSidebarOpen(true)}
            aria-label="Expand sidebar"
            title="Open sidebar"
            aria-expanded={false}
            className="fixed left-4 top-4 z-[60] grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white/95 text-slate-700 shadow-lg shadow-black/10 backdrop-blur transition hover:bg-slate-100 hover:text-slate-950 focus:outline-none focus:ring-2 focus:ring-rose-500 dark:border-slate-700 dark:bg-[#161b22]/95 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
          ><PanelLeftOpen aria-hidden="true" className="h-4 w-4" /></button>}

          <div data-lenis-wrapper className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain lg:h-screen">
            <div data-lenis-content className="flex min-h-full flex-col">
            <header className="border-b border-slate-200/80 px-5 py-6 dark:border-slate-800 sm:px-8 lg:px-10">
              <div className="mx-auto flex max-w-6xl flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-700 dark:text-rose-300">{sectionTitle.eyebrow}</p>
                  <h1 className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white sm:text-3xl">{sectionTitle.title}</h1>
                  <p className="mt-2 text-sm text-slate-600 dark:text-gray-400">{sectionTitle.description}</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  {profile?.target_role && <p className="text-sm text-slate-600 dark:text-gray-400">Goal: <span className="font-medium text-slate-900 dark:text-gray-200">{profile.target_role}</span></p>}
                  <MagneticButton strength={0.035}>
                  <button type="button" onClick={() => window.dispatchEvent(new Event("unhired:open-command-palette"))} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-sm transition hover:border-rose-300 hover:text-rose-800 focus:outline-none focus:ring-2 focus:ring-rose-500 dark:border-slate-800 dark:bg-[#161b22] dark:text-slate-300 dark:hover:border-rose-400/40 dark:hover:text-white">
                    <Search className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Commands</span>
                    <kbd className="ml-1 inline-flex items-center gap-0.5 rounded border border-slate-200 px-1.5 py-0.5 text-[10px] text-slate-500 dark:border-slate-700 dark:text-slate-400"><CommandIcon className="h-2.5 w-2.5" />K</kbd>
                  </button>
                  </MagneticButton>
                </div>
              </div>
            </header>

            {commandMessage && <div role="status" className="fixed bottom-5 right-5 z-[70] max-w-sm rounded-xl border border-rose-200 bg-white px-4 py-3 text-sm text-slate-800 shadow-xl dark:border-rose-400/20 dark:bg-[#161b22] dark:text-slate-200">{commandMessage}</div>}

            {error && <div role="alert" className="mx-5 mt-5 rounded-xl border border-rose-900/70 bg-rose-950/40 p-4 text-sm text-rose-200 sm:mx-8 lg:mx-10">{error}</div>}

            <div ref={contentRef} className="mx-auto w-full max-w-6xl flex-1 px-5 py-7 sm:px-8 lg:px-10">
              {activeSection === "profile" && profile && <ProfileOverview profile={profile} />}
              {activeSection === "cv" && hasUploadedCV && profile && <CvOverview profile={profile} roles={results?.roles ?? []} />}
              {activeSection === "matches" && results && (
                <RoleRanking
                  roles={results.roles}
                  selectedRole={selectedRole}
                  loading={loading}
                  onSelectRole={(role) => setSelectedRole(role.roleName)}
                />
              )}
              {activeSection === "pathway" && selectedRoleMatch && <LearningPathway role={selectedRoleMatch} />}
              {activeSection === "impact" && results && <SdgMapping sdgs={results.sdgs} />}

              {loading && !results && <div role="status" className="rounded-2xl border border-slate-200/80 bg-white p-6 text-sm text-slate-700 dark:border-slate-800 dark:bg-[#161b22] dark:text-gray-300">Generating your career workspace…</div>}
            </div>

            <footer className="mt-auto border-t border-slate-200/80 px-5 py-6 text-center text-xs leading-6 text-slate-600 dark:border-slate-800 dark:text-gray-400 sm:px-8 lg:px-10">
              Career trajectories and demand scores are dynamically modeled using insights from{" "}
              <a href="https://www.talentcorp.com.my/mycol/" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 transition hover:text-pink-400">TalentCorp&apos;s MyCOL 2024/2025</a>
              {" "}and{" "}
              <a href="https://open.dosm.gov.my/dashboard/labour-market" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 transition hover:text-pink-400">DOSM Labour Market Data</a>.
            </footer>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function ProfileOverview({ profile }: { profile: BaseProfile }) {
  const entries = [
    ["Career goal", profile.career_goal],
    ["Current situation", profile.current_situation],
    ["Experience", `${profile.experience_level} · ${profile.years_experience} years`],
    ["Role of interest", profile.target_role],
  ] as const;

  return (
    <section id="how-it-works" className="space-y-6">
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 dark:border-slate-800 dark:bg-[#161b22] sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-700 dark:text-rose-300">Your answers</p>
        <h2 className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">A snapshot of your starting point</h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-gray-400">Un-HiReD compares this profile with career possibilities to help you choose a practical next step.</p>
        <dl className="mt-6 grid gap-4 sm:grid-cols-2">
          {entries.map(([label, value]) => <div key={label} className="rounded-xl border border-slate-200/80 bg-slate-50 p-4 dark:border-slate-800 dark:bg-[#0f1117]"><dt className="text-xs text-slate-600 dark:text-gray-400">{label}</dt><dd className="mt-1 font-medium text-slate-900 dark:text-white">{value || "Not provided"}</dd></div>)}
        </dl>
        <div className="mt-5">
          <h3 className="text-sm font-medium text-slate-800 dark:text-gray-300">Skills and tools</h3>
          <SkillChips skills={profile.current_skills} emptyText="No skills were selected yet." />
        </div>
      </div>
    </section>
  );
}

function CvOverview({ profile, roles }: { profile: BaseProfile; roles: RoleMatch[] }) {
  return (
    <section aria-labelledby="cv-overview-title">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-700 dark:text-rose-300">Resume extraction</p>
      <h2 id="cv-overview-title" className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">Your CV and extracted profile</h2>
      <p className="mt-2 text-sm text-slate-600 dark:text-gray-400">Review the document alongside the skills and future roles identified for your profile.</p>
      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(18rem,0.75fr)]">
        <section className="min-w-0 rounded-2xl border border-slate-200/80 bg-white p-4 dark:border-slate-800 dark:bg-[#161b22]" aria-label="Resume document preview">
          {profile.resumePreviewUrl && profile.resumeFileName?.toLowerCase().endsWith(".pdf") ? (
            <iframe src={profile.resumePreviewUrl} className="h-[80vh] min-h-[32rem] w-full rounded-lg border border-slate-200 dark:border-slate-800" title="Your Resume" />
          ) : profile.resumePreviewUrl && profile.resumeFileName ? (
            <div className="flex h-[50vh] flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-slate-300 p-6 text-center dark:border-slate-700">
              <p className="text-sm text-slate-700 dark:text-slate-300">DOCX previews are not supported in the browser.</p>
              <a href={profile.resumePreviewUrl} download={profile.resumeFileName} className="text-sm font-medium text-rose-700 underline underline-offset-4 hover:text-rose-600 dark:text-rose-300 dark:hover:text-rose-200">Download {profile.resumeFileName}</a>
            </div>
          ) : <p className="p-6 text-sm text-slate-700 dark:text-slate-300">The resume preview is unavailable. Upload your CV again to view it here.</p>}
        </section>

        <div className="space-y-5">
          <section className="rounded-2xl border border-slate-200/80 bg-white p-5 dark:border-slate-800 dark:bg-[#161b22]">
            <h3 className="font-semibold text-slate-900 dark:text-white">Extracted Skills</h3>
            <p className="mt-1 text-sm text-slate-600 dark:text-gray-400">Only skills explicitly found in the resume text are listed here. Your selected toolkit is used separately for recommendations.</p>
            <SkillChips skills={profile.resume_extracted_skills} emptyText="No listed skills were explicitly found in the uploaded CV." />
          </section>
          <section className="rounded-2xl border border-slate-200/80 bg-white p-5 dark:border-slate-800 dark:bg-[#161b22]">
            <h3 className="font-semibold text-slate-900 dark:text-white">Future Potentials</h3>
            <p className="mt-1 text-sm text-slate-600 dark:text-gray-400">AI-ranked roles based on your experience and skills.</p>
            {roles.length > 0 ? (
              <ol className="mt-4 space-y-3">
                {roles.slice(0, 5).map((role, index) => (
                  <li key={`${role.roleName}-${index}`} className="rounded-xl border border-slate-200/80 bg-slate-50 p-3 dark:border-slate-800 dark:bg-[#0f1117]">
                    <div className="flex items-start justify-between gap-3">
                      <span className="text-sm font-medium text-slate-900 dark:text-white">{role.roleName}</span>
                      <span className="shrink-0 rounded-full bg-rose-500/10 px-2 py-0.5 text-xs font-semibold text-rose-800 dark:text-rose-200">{role.matchScore}%</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-600 dark:text-gray-400">{role.demandTrajectory}</p>
                  </li>
                ))}
              </ol>
            ) : <p className="mt-3 text-sm text-slate-600 dark:text-gray-400">No future roles are available yet.</p>}
          </section>
        </div>
      </div>
    </section>
  );
}

function LearningPathway({ role }: { role: RoleMatch }) {
  const steps = role.skillsGap.length > 0 ? role.skillsGap : ["Build a small portfolio project for this role", "Practice role-specific problem solving", "Seek feedback from a mentor or professional community"];
  const resources = role.resources ?? [];
  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-6 dark:border-slate-800 dark:bg-[#161b22] sm:p-8" aria-labelledby="learning-pathway-title">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-700 dark:text-rose-300">Selected career match</p>
      <h2 id="learning-pathway-title" className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">Learning pathway for {role.roleName}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-gray-400">Work through these focus areas in order. Choose free or low-cost learning materials that fit your pace.</p>
      <ol className="mt-6 space-y-3">
        {steps.map((step, index) => <li key={`${index}-${step}`} className="flex gap-4 rounded-xl border border-slate-200/80 bg-slate-50 p-4 dark:border-slate-800 dark:bg-[#0f1117]"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-rose-400/30 bg-rose-500/10 text-sm font-semibold text-rose-700 dark:text-rose-200">{index + 1}</span><span className="pt-1 text-sm leading-6 text-slate-800 dark:text-gray-200">{step}</span></li>)}
      </ol>
      <div className="mt-8">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-gray-200">Learning resources</h3>
        {resources.length > 0 ? (
          <ul className="mt-3 grid gap-3 sm:grid-cols-2">
            {resources.map((resource, index) => {
              let safeUrl: string | null = null;
              try {
                const parsedUrl = new URL(resource.url);
                if (parsedUrl.protocol === "https:" || parsedUrl.protocol === "http:") safeUrl = parsedUrl.toString();
              } catch {
                // Show malformed URLs as text instead of rendering an unsafe link.
              }
              return (
                <li key={`${resource.platform}-${resource.title}-${index}`} className="rounded-xl border border-slate-200/80 bg-slate-50 p-4 dark:border-slate-800 dark:bg-[#0f1117]">
                  <p className="text-xs font-medium uppercase tracking-wider text-rose-700 dark:text-rose-300">{resource.platform}</p>
                  {safeUrl ? (
                    <a href={safeUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-slate-900 underline decoration-slate-500 underline-offset-4 transition hover:text-rose-700 hover:decoration-rose-600 dark:text-slate-100 dark:decoration-slate-500 dark:hover:text-rose-200 dark:hover:decoration-rose-300">
                      {resource.title}
                      <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-3.5 w-3.5 shrink-0">
                        <path d="M11 3h6v6M17 3l-8 8M15 11v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span className="sr-only"> (opens in a new tab)</span>
                    </a>
                  ) : <p className="mt-2 text-sm font-medium text-slate-900 dark:text-white">{resource.title}</p>}
                  <p className="mt-2 break-all text-xs text-slate-700 dark:text-slate-300">{resource.url}</p>
                </li>
              );
            })}
          </ul>
        ) : <p className="mt-2 text-sm text-gray-500">No learning links were returned for this role.</p>}
      </div>
    </section>
  );
}

function SkillChips({ skills, emptyText }: { skills: string[]; emptyText: string }) {
  return skills.length > 0 ? (
    <ul className="mt-3 flex flex-wrap gap-2">{skills.map((skill) => <li key={skill} className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-900 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-100">{skill}</li>)}</ul>
  ) : <p className="mt-3 text-sm text-gray-500">{emptyText}</p>;
}
