"use client";

/* eslint-disable react-hooks/set-state-in-effect -- the page hydrates its session and browser-only PDF preview state. */

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, ChevronDown, Command as CommandIcon, ExternalLink, GraduationCap, PanelLeftOpen, PlayCircle, Search } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import OnboardingWizard, { type BaseProfile } from "../components/OnboardingWizard";
import CommandPalette, { type DashboardCommand } from "../components/CommandPalette";
import LanguageControls from "../components/LanguageControls";
import MagneticButton from "../components/MagneticButton";
import RoleRanking, { type RoleMatch } from "../components/RoleRanking";
import SdgMapping, { type SdgAlignment } from "../components/SdgMapping";
import UncertaintyScenario, { type ResilienceScenario } from "../components/UncertaintyScenario";
import Sidebar, { type WorkspaceSection } from "../components/Sidebar";
import { useLanguage, type Language } from "../store/languageStore";
import { loadResumeFile, removeResumeFile } from "../lib/resumeStorage";

interface RecommendationResponse {
  roles: RoleMatch[];
  sdgs: SdgAlignment[];
  trend_source: string;
  last_updated: string;
  scenarios: ResilienceScenario[];
}

const SECTION_TITLES: Record<WorkspaceSection, { eyebrow: string; title: string; description: string }> = {
  profile: { eyebrow: "MY PROFILE", title: "Discover yourself", description: "Your goals and experience shape your career recommendations." },
  cv: { eyebrow: "MY PROFILE", title: "Your CV", description: "Review the skills extracted from your uploaded resume." },
  matches: { eyebrow: "EXPLORE", title: "Career matches", description: "Future-ready roles ranked against your profile." },
  pathway: { eyebrow: "EXPLORE", title: "Learning pathway", description: "Focus areas to help close the gap to your selected role." },
  impact: { eyebrow: "EXPLORE", title: "SDG impact", description: "How your potential career direction aligns with global goals." },
  "job-match": { eyebrow: "EXPLORE", title: "Job Match Analyzer", description: "Compare your profile skills with a specific job description." },
};

const DASHBOARD_SESSION_KEY = "unhired.dashboard.session";
const RESUME_TEXT_KEY = "resume_text";
const EXTRACTED_SKILLS_KEY = "extracted_skills";

export default function Home() {
  const router = useRouter();
  const { t, language, hydrated: languageHydrated } = useLanguage();
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
  const priorLanguage = useRef<Language | null>(null);

  useEffect(() => {
    try {
      const requestedSection = new URLSearchParams(window.location.search).get("section");
      const validSections: WorkspaceSection[] = ["profile", "cv", "matches", "pathway", "impact", "job-match"];
      if (requestedSection && validSections.includes(requestedSection as WorkspaceSection)) {
        setActiveSection(requestedSection as WorkspaceSection);
      }
      const saved = sessionStorage.getItem(DASHBOARD_SESSION_KEY);
      if (!saved) return;
      const session = JSON.parse(saved) as {
        profile?: BaseProfile;
        results?: RecommendationResponse;
        selectedRole?: string;
        language?: Language;
      };
      if (!session.profile || !Array.isArray(session.profile.current_skills) || !session.results || !Array.isArray(session.results.roles) || !Array.isArray(session.results.sdgs)) return;
      priorLanguage.current = session.language ?? "en";
      const persistedResume = localStorage.getItem(RESUME_TEXT_KEY);
      const persistedSkills = localStorage.getItem(EXTRACTED_SKILLS_KEY);
      setProfile({
        ...session.profile,
        resume_text: persistedResume ?? session.profile.resume_text,
        resume_extracted_skills: persistedSkills ? JSON.parse(persistedSkills) as string[] : session.profile.resume_extracted_skills,
        // Blob URLs expire on reload. A fresh URL is made from the IndexedDB
        // copy below instead of showing a broken PDF preview.
        resumePreviewUrl: session.profile.hasUploadedCV ? null : session.profile.resumePreviewUrl,
      });
      setHasUploadedCV(session.profile.hasUploadedCV);
      setResults(session.results);
      setSelectedRole(session.selectedRole ?? session.results.roles[0]?.roleName ?? "");
      setOnboardingComplete(true);
    } catch {
      sessionStorage.removeItem(DASHBOARD_SESSION_KEY);
    }
  }, []);

  useEffect(() => {
    if (!profile?.hasUploadedCV || profile.resumePreviewUrl) return;
    let cancelled = false;
    let restoredUrl: string | null = null;

    void loadResumeFile().then((savedResume) => {
      if (!savedResume || cancelled) return;
      restoredUrl = URL.createObjectURL(savedResume.blob);
      setProfile((current) => {
        if (!current?.hasUploadedCV || current.resumePreviewUrl) {
          if (restoredUrl) URL.revokeObjectURL(restoredUrl);
          return current;
        }
        return {
          ...current,
          resumePreviewUrl: restoredUrl,
          resumeFileName: savedResume.fileName || current.resumeFileName,
        };
      });
    }).catch(() => {
      // The parsed resume text and skills remain available if browser storage
      // is unavailable; only the document preview cannot be restored.
    });

    return () => {
      cancelled = true;
    };
  }, [profile?.hasUploadedCV, profile?.resumePreviewUrl]);

  useEffect(() => {
    if (!languageHydrated) return;
    if (priorLanguage.current === null) {
      priorLanguage.current = language;
      return;
    }
    if (priorLanguage.current === language) return;
    priorLanguage.current = language;
    if (!onboardingComplete || !profile) return;
    setLoading(true);
    setError("");
    void fetchRecommendationData(profile, language).then((localized) => {
      setResults(localized);
      setSelectedRole(localized.roles[0]?.roleName ?? "");
      sessionStorage.setItem(DASHBOARD_SESSION_KEY, JSON.stringify({ profile, results: localized, selectedRole: localized.roles[0]?.roleName ?? "", language }));
    }).catch((requestError: unknown) => {
      setError(requestError instanceof Error ? requestError.message : "Could not update the language. Please try again.");
    }).finally(() => setLoading(false));
  }, [language, languageHydrated, onboardingComplete, profile]);

  useEffect(() => {
    if (!profile) return;
    localStorage.setItem(RESUME_TEXT_KEY, profile.resume_text ?? "");
    localStorage.setItem(EXTRACTED_SKILLS_KEY, JSON.stringify(profile.resume_extracted_skills ?? []));
  }, [profile]);

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

  async function requestRecommendation(nextProfile: BaseProfile): Promise<RecommendationResponse | null> {
    setLoading(true);
    setError("");
    try {
      const data = await fetchRecommendationData(nextProfile, language);
      setResults(data);
      setSelectedRole(data.roles[0]?.roleName ?? "");
      return data;
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to analyze your profile. Please try again.");
      return null;
    } finally {
      setLoading(false);
    }
  }

  async function handleOnboardingComplete(nextProfile: BaseProfile) {
    priorLanguage.current = language;
    setProfile(nextProfile);
    setHasUploadedCV(nextProfile.hasUploadedCV);
    const recommendation = await requestRecommendation(nextProfile);
    if (recommendation) {
      sessionStorage.setItem(DASHBOARD_SESSION_KEY, JSON.stringify({
        profile: nextProfile,
        results: recommendation,
        selectedRole: recommendation.roles[0]?.roleName ?? "",
        language,
      }));
      setOnboardingComplete(true);
    }
  }

  function handleLogout() {
    sessionStorage.removeItem(DASHBOARD_SESSION_KEY);
    localStorage.removeItem(RESUME_TEXT_KEY);
    localStorage.removeItem(EXTRACTED_SKILLS_KEY);
    localStorage.removeItem("tailored_resume_bullets");
    void removeResumeFile().catch(() => undefined);
    setProfile(null);
    setHasUploadedCV(false);
    setResults(null);
    setError("");
    setLoading(false);
    setSelectedRole("");
    setActiveSection("matches");
    setOnboardingComplete(false);
    router.push("/");
  }

  function handleSidebarNavigate(section: WorkspaceSection) {
    if (section === "job-match") {
      router.push("/dashboard/job-match");
      return;
    }
    setActiveSection(section);
  }

  function handleCommand(command: DashboardCommand) {
    setCommandMessage("");
    if (command === "optimize-resume") {
      if (hasUploadedCV) router.push("/dashboard/job-match");
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
    <main className="min-h-screen bg-[#f2f4f7] text-slate-900 dark:bg-[#0f1117] dark:text-white">
      {!onboardingComplete ? (
        <div className="flex min-h-screen flex-col items-center justify-center px-4 py-8 sm:px-6 sm:py-12">
          <OnboardingWizard loading={loading} onComplete={handleOnboardingComplete} />
          {error && <div role="alert" className="mx-auto mt-5 max-w-2xl rounded-xl border border-rose-900/70 bg-rose-950/40 p-4 text-sm text-rose-200">{error}</div>}
        </div>
      ) : (
        <div ref={dashboardRef} className="flex min-h-screen flex-col md:h-screen md:flex-row">
          <CommandPalette onCommand={handleCommand} />
          <Sidebar
            activeSection={activeSection}
            hasUploadedCV={hasUploadedCV}
            userName={profile?.first_name ?? ""}
            onNavigate={handleSidebarNavigate}
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
            className="fixed left-4 top-4 z-[60] hidden h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white/95 text-slate-700 shadow-lg shadow-black/10 backdrop-blur transition hover:bg-slate-100 hover:text-slate-950 focus:outline-none focus:ring-2 focus:ring-rose-500 dark:border-slate-700 dark:bg-[#161b22]/95 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white md:grid"
          ><PanelLeftOpen aria-hidden="true" className="h-4 w-4" /></button>}

          <div data-lenis-wrapper className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto overscroll-contain md:h-screen">
            <div data-lenis-content className="flex min-h-full flex-col">
            <header className="border-b border-slate-200/80 px-5 py-6 dark:border-slate-800 sm:px-8 lg:px-10">
              <div className="mx-auto flex max-w-6xl flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-700 dark:text-rose-300">{t(sectionTitle.eyebrow)}</p>
                  <h1 className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white sm:text-3xl">{t(sectionTitle.title)}</h1>
                  <p className="mt-2 text-sm text-slate-600 dark:text-gray-400">{t(sectionTitle.description)}</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  {profile?.target_role && <p className="text-sm text-slate-600 dark:text-gray-400">{t("Goal")}: <span className="font-medium text-slate-900 dark:text-gray-200">{profile.target_role}</span></p>}
                  <LanguageControls />
                  <MagneticButton strength={0.035}>
                  <button type="button" onClick={() => window.dispatchEvent(new Event("unhired:open-command-palette"))} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-sm transition hover:border-rose-300 hover:text-rose-800 focus:outline-none focus:ring-2 focus:ring-rose-500 dark:border-slate-800 dark:bg-[#161b22] dark:text-slate-300 dark:hover:border-rose-400/40 dark:hover:text-white">
                    <Search className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>{t("Commands")}</span>
                    <kbd className="ml-1 inline-flex items-center gap-0.5 rounded border border-slate-200 px-1.5 py-0.5 text-[10px] text-slate-500 dark:border-slate-700 dark:text-slate-400"><CommandIcon className="h-2.5 w-2.5" />K</kbd>
                  </button>
                  </MagneticButton>
                </div>
              </div>
            </header>

            {commandMessage && <div role="status" className="fixed bottom-5 right-5 z-[70] max-w-sm rounded-xl border border-rose-200 bg-white px-4 py-3 text-sm text-slate-800 shadow-xl dark:border-rose-400/20 dark:bg-[#161b22] dark:text-slate-200">{commandMessage}</div>}

            {error && <div role="alert" className="mx-5 mt-5 rounded-xl border border-rose-900/70 bg-rose-950/40 p-4 text-sm text-rose-200 sm:mx-8 lg:mx-10">{error}</div>}

            <div ref={contentRef} className="mx-auto w-full max-w-6xl flex-1 p-4 md:p-8">
              {activeSection === "profile" && profile && <ProfileOverview profile={profile} />}
              {activeSection === "cv" && hasUploadedCV && profile && <CvOverview profile={profile} roles={results?.roles ?? []} />}
              {activeSection === "matches" && results && (
                <RoleRanking
                  roles={results.roles}
                  selectedRole={selectedRole}
                  loading={loading}
                  onSelectRole={(role) => setSelectedRole(role.roleName)}
                  trendSource={results.trend_source}
                  lastUpdated={results.last_updated}
                />
              )}
              {activeSection === "pathway" && selectedRoleMatch && <LearningPathway role={selectedRoleMatch} />}
              {activeSection === "impact" && results && <SdgMapping sdgs={results.sdgs} selectedRole={selectedRoleMatch ?? null} />}
              {activeSection === "matches" && results && <div className="mt-8"><UncertaintyScenario scenarios={results.scenarios ?? []} /></div>}

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

async function fetchRecommendationData(profile: BaseProfile, language: Language): Promise<RecommendationResponse> {
  let response: Response;
  try {
    response = await fetch("/api/recommendation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: profile.first_name,
        goal: `${profile.career_goal}; interested role: ${profile.target_role}; current role: ${profile.current_role}`,
        situation: profile.current_situation,
        experience: `${profile.experience_level} (${profile.years_experience} years)`,
        techStack: profile.current_skills,
        language,
      }),
    });
  } catch {
    throw new Error("Could not connect to the career service. Restart the backend, then try again.");
  }
  if (!response.ok) {
    const responseText = await response.text();
    let message = response.status >= 500
      ? "The career service is not responding. Restart the backend, then try again."
      : responseText || `Request failed (${response.status})`;
    try {
      const errorPayload = JSON.parse(responseText) as { detail?: unknown };
      if (typeof errorPayload.detail === "string") message = errorPayload.detail;
    } catch {
      // Keep plain-text proxy errors readable.
    }
    throw new Error(message);
  }
  return await response.json() as RecommendationResponse;
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
  const [previewState, setPreviewState] = useState<"checking" | "available" | "missing">("checking");
  const previewUrl = profile.resumePreviewUrl;

  useEffect(() => {
    let cancelled = false;
    if (!previewUrl) {
      setPreviewState("missing");
      return;
    }
    setPreviewState("checking");
    fetch(previewUrl)
      .then((response) => {
        if (!response.ok) throw new Error("Resume preview is unavailable");
        return response.blob();
      })
      .then(() => { if (!cancelled) setPreviewState("available"); })
      .catch(() => { if (!cancelled) setPreviewState("missing"); });
    return () => { cancelled = true; };
  }, [previewUrl]);

  return (
    <section aria-labelledby="cv-overview-title">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-700 dark:text-rose-300">Resume extraction</p>
      <h2 id="cv-overview-title" className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">Your CV and extracted profile</h2>
      <p className="mt-2 text-sm text-slate-600 dark:text-gray-400">Review the document alongside the skills and future roles identified for your profile.</p>
      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(18rem,0.75fr)]">
        <section className="min-w-0 rounded-2xl border border-slate-200/80 bg-white p-4 dark:border-slate-800 dark:bg-[#161b22]" aria-label="Resume document preview">
          {previewState === "checking" ? (
            <div className="flex h-[80vh] min-h-[32rem] items-center justify-center text-sm text-slate-500 dark:text-gray-400">Checking resume preview…</div>
          ) : previewState === "available" && profile.resumeFileName?.toLowerCase().endsWith(".pdf") ? (
            <iframe src={previewUrl ?? undefined} onError={() => setPreviewState("missing")} className="h-[80vh] min-h-[32rem] w-full rounded-lg border border-slate-200 dark:border-slate-800" title="Your Resume" />
          ) : previewState === "available" && previewUrl && profile.resumeFileName ? (
            <div className="flex h-[50vh] flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-slate-300 p-6 text-center dark:border-slate-700">
              <p className="text-sm text-slate-700 dark:text-slate-300">DOCX previews are not supported in the browser.</p>
              <a href={previewUrl} download={profile.resumeFileName} className="text-sm font-medium text-rose-700 underline underline-offset-4 hover:text-rose-600 dark:text-rose-300 dark:hover:text-rose-200">Download {profile.resumeFileName}</a>
            </div>
          ) : <div className="flex h-[80vh] min-h-[32rem] items-center justify-center rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-600 dark:border-slate-700 dark:text-gray-400">Resume session expired or not found. Please re-upload via the dashboard to view the document.</div>}
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
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const { t } = useLanguage();
  const steps = role.learning_pathway?.length ? role.learning_pathway : (role.skillsGap.length > 0 ? role.skillsGap : ["Build a small portfolio project for this role", "Practice role-specific problem solving", "Seek feedback from a mentor or professional community"]).map((skill, index) => ({ step: index + 1, skill, estimated_time: "Time estimate unavailable" }));
  const roadmapSlug = getRoadmapSlug(role.roleName);
  const roadmapUrl = `https://roadmap.sh/${roadmapSlug}`;

  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-6 dark:border-slate-800 dark:bg-[#161b22] sm:p-8" aria-labelledby="learning-pathway-title">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-700 dark:text-rose-300">{t("Selected career match")}</p>
      <h2 id="learning-pathway-title" className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">{t("Learning pathway for")} {role.roleName}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-gray-300">{t("Open a focus area for curated starting points, then use the visual roadmap to explore the full skill tree.")}</p>
      <ol className="mt-6 space-y-3">
        {steps.map((pathwayStep, index) => {
          const step = pathwayStep.skill;
          const expanded = expandedId === index;
          const searchTopic = encodeURIComponent(`${step} full course tutorial`).replace(/%20/g, "+");
          const courseQuery = encodeURIComponent(`${step} course`).replace(/%20/g, "+");
          const docsUrl = getOfficialDocsUrl(step);
          const links = [
            { label: "YouTube full courses", href: `https://www.youtube.com/results?search_query=${searchTopic}`, Icon: PlayCircle },
            ...(docsUrl ? [{ label: "Official documentation", href: docsUrl, Icon: BookOpen }] : []),
            { label: "Guided courses", href: `https://www.coursera.org/search?query=${courseQuery}`, Icon: GraduationCap },
          ];

          const resourceLinks = <div className="flex flex-wrap gap-2 border-t border-slate-200 px-4 py-4 pl-[4.25rem] dark:border-slate-800">
            {links.map(({ label, href, Icon }) => <a key={label} href={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-rose-300 hover:text-rose-800 dark:border-slate-700 dark:bg-white/[0.03] dark:text-slate-300 dark:hover:border-rose-400/40 dark:hover:text-rose-200"><Icon aria-hidden="true" className="h-3.5 w-3.5" />{label}<ExternalLink aria-hidden="true" className="h-3 w-3 opacity-60" /></a>)}
          </div>;

          return (
            <li key={`${index}-${step}`} className={`overflow-hidden rounded-xl border bg-slate-50 transition-colors dark:bg-[#0f1117] ${expanded ? "border-rose-300 shadow-lg shadow-rose-500/5 dark:border-rose-400/40" : "border-slate-200/80 hover:border-rose-200 dark:border-slate-800 dark:hover:border-rose-400/30"}`}>
              <button type="button" aria-expanded={expanded} aria-controls={`pathway-resources-${index}`} onClick={() => setExpandedId(expanded ? null : index)} className="flex w-full items-center gap-4 p-4 text-left">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-rose-400/30 bg-rose-500/10 text-sm font-semibold text-rose-700 dark:text-rose-200">{pathwayStep.step}</span>
                <span className="min-w-0 flex-1 text-sm font-medium leading-6 text-slate-800 dark:text-gray-200">{step}</span>
                <span className="shrink-0 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-medium text-blue-900 dark:border-blue-400/20 dark:bg-blue-400/10 dark:text-blue-100">{t(pathwayStep.estimated_time)}</span>
                <ChevronDown aria-hidden="true" className={`h-4 w-4 shrink-0 text-slate-500 transition-transform duration-200 dark:text-slate-400 ${expanded ? "rotate-180" : ""}`} />
              </button>
              <AnimatePresence initial={false}>
                {expanded && (
                  <motion.div id={`pathway-resources-${index}`} initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.24, ease: "easeInOut" }} className="overflow-hidden">
                    {resourceLinks}
                  </motion.div>
                )}
              </AnimatePresence>
            </li>
          );
        })}
      </ol>

      <div className="group relative mt-8 overflow-hidden rounded-2xl border border-rose-200/80 bg-gradient-to-br from-white via-rose-50 to-slate-50 p-6 shadow-sm transition duration-300 hover:border-rose-300 hover:shadow-xl hover:shadow-rose-500/10 dark:border-rose-400/20 dark:from-rose-950/20 dark:via-[#17131d] dark:to-[#10141c] dark:hover:border-rose-300/40 sm:p-7">
        <div className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-rose-400/10 blur-3xl transition group-hover:bg-rose-400/20" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-700 dark:text-rose-300">{t("Visual career guide")}</p>
            <h3 className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">{t("The Complete Visual Roadmap")}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">{t("Explore the industry-standard visual guide for")} {role.roleName}, powered by roadmap.sh.</p>
          </div>
          <MagneticButton strength={0.035}>
            <a href={roadmapUrl} target="_blank" rel="noopener noreferrer" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-rose-700 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-rose-700/20 transition hover:bg-rose-600 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 focus:ring-offset-white dark:bg-rose-600 dark:hover:bg-rose-500 dark:focus:ring-offset-[#161b22]">{t("Explore roadmap.sh")}<ExternalLink aria-hidden="true" className="h-4 w-4" /></a>
          </MagneticButton>
        </div>
        <p className="relative mt-4 break-all text-xs text-slate-500 dark:text-slate-500">{roadmapUrl}</p>
      </div>
    </section>
  );
}

function getRoadmapSlug(roleName: string): string {
  const role = roleName.toLowerCase();
  if (role.includes("data engineer")) return "data-engineer";
  if (role.includes("data scientist") || role.includes("machine learning") || role.includes("ai engineer")) return "ai-data-scientist";
  if (role.includes("frontend")) return "frontend";
  if (role.includes("backend")) return "backend";
  if (role.includes("full stack") || role.includes("full-stack")) return "full-stack";
  if (role.includes("devops") || role.includes("cloud")) return "devops";
  if (role.includes("product manager")) return "product-manager";
  if (role.includes("software architect")) return "software-architect";
  return "";
}

function getOfficialDocsUrl(skill: string): string | null {
  const normalized = skill.trim().toLowerCase();
  const officialDocs: Record<string, string> = {
    spark: "https://spark.apache.org/docs/latest/",
    "apache spark": "https://spark.apache.org/docs/latest/",
    airflow: "https://airflow.apache.org/docs/",
    "apache airflow": "https://airflow.apache.org/docs/",
    aws: "https://docs.aws.amazon.com/",
    "amazon web services": "https://docs.aws.amazon.com/",
    gcp: "https://cloud.google.com/docs",
    "google cloud": "https://cloud.google.com/docs",
    python: "https://docs.python.org/3/",
    typescript: "https://www.typescriptlang.org/docs/",
    javascript: "https://developer.mozilla.org/en-US/docs/Web/JavaScript",
    react: "https://react.dev/learn",
    "next.js": "https://nextjs.org/docs",
    nextjs: "https://nextjs.org/docs",
    sql: "https://www.postgresql.org/docs/current/",
    docker: "https://docs.docker.com/",
    kubernetes: "https://kubernetes.io/docs/home/",
    kafka: "https://kafka.apache.org/documentation/",
    "apache kafka": "https://kafka.apache.org/documentation/",
    "kafka streams": "https://kafka.apache.org/documentation/streams/",
    "kafka connect": "https://kafka.apache.org/documentation/#connect",
    postgresql: "https://www.postgresql.org/docs/current/",
    postgres: "https://www.postgresql.org/docs/current/",
    mongodb: "https://www.mongodb.com/docs/",
    redis: "https://redis.io/docs/latest/",
    git: "https://git-scm.com/doc",
    github: "https://docs.github.com/",
    "github actions": "https://docs.github.com/en/actions",
    gitlab: "https://docs.gitlab.com/",
    linux: "https://www.kernel.org/doc/html/latest/",
    terraform: "https://developer.hashicorp.com/terraform/docs",
    "google cloud platform": "https://cloud.google.com/docs",
    "power bi": "https://learn.microsoft.com/power-bi/",
    tableau: "https://help.tableau.com/",
    excel: "https://support.microsoft.com/excel",
    figma: "https://help.figma.com/hc/en-us",
    pandas: "https://pandas.pydata.org/docs/",
    numpy: "https://numpy.org/doc/",
    django: "https://docs.djangoproject.com/",
    fastapi: "https://fastapi.tiangolo.com/",
    flask: "https://flask.palletsprojects.com/en/stable/",
    node: "https://nodejs.org/docs/latest/api/",
    "node.js": "https://nodejs.org/docs/latest/api/",
    express: "https://expressjs.com/en/guide/routing.html",
    vue: "https://vuejs.org/guide/",
    angular: "https://angular.dev/overview",
    svelte: "https://svelte.dev/docs",
    spring: "https://docs.spring.io/spring-framework/reference/",
    "html/css": "https://developer.mozilla.org/en-US/docs/Learn_web_development",
    html: "https://developer.mozilla.org/en-US/docs/Web/HTML",
    css: "https://developer.mozilla.org/en-US/docs/Web/CSS",
    tailwind: "https://tailwindcss.com/docs",
    "tailwind css": "https://tailwindcss.com/docs",
    azure: "https://learn.microsoft.com/azure/",
    "microsoft azure": "https://learn.microsoft.com/azure/",
    java: "https://docs.oracle.com/en/java/",
    "c#": "https://learn.microsoft.com/dotnet/csharp/",
    ".net": "https://learn.microsoft.com/dotnet/",
    "c++": "https://en.cppreference.com/w/",
    php: "https://www.php.net/docs.php",
    ruby: "https://www.ruby-lang.org/en/documentation/",
    go: "https://go.dev/doc/",
    golang: "https://go.dev/doc/",
    rust: "https://doc.rust-lang.org/",
    graphql: "https://graphql.org/learn/",
    "data modeling": "https://docs.getdbt.com/docs/build/data-models",
    dbt: "https://docs.getdbt.com/",
    snowflake: "https://docs.snowflake.com/",
    databricks: "https://docs.databricks.com/",
    bigquery: "https://cloud.google.com/bigquery/docs",
    redshift: "https://docs.aws.amazon.com/redshift/",
    flink: "https://nightlies.apache.org/flink/flink-docs-stable/",
    hadoop: "https://hadoop.apache.org/docs/",
    hive: "https://hive.apache.org/",
    "apache beam": "https://beam.apache.org/documentation/",
    airbyte: "https://docs.airbyte.com/",
    fivetran: "https://fivetran.com/docs",
    looker: "https://cloud.google.com/looker/docs",
    metabase: "https://www.metabase.com/docs/latest/",
    jupyter: "https://docs.jupyter.org/",
    "scikit-learn": "https://scikit-learn.org/stable/user_guide.html",
    sklearn: "https://scikit-learn.org/stable/user_guide.html",
    pytorch: "https://docs.pytorch.org/tutorials/",
    tensorflow: "https://www.tensorflow.org/learn",
    keras: "https://keras.io/guides/",
    jest: "https://jestjs.io/docs/getting-started",
    cypress: "https://docs.cypress.io/",
    playwright: "https://playwright.dev/docs/intro",
    "prompt engineering": "https://developers.openai.com/api/docs/guides/prompt-engineering",
    pinecone: "https://docs.pinecone.io/",
    weaviate: "https://docs.weaviate.io/",
    chroma: "https://docs.trychroma.com/",
    qdrant: "https://qdrant.tech/documentation/",
    langchain: "https://docs.langchain.com/",
    llamaindex: "https://docs.llamaindex.ai/",
    "openai api": "https://developers.openai.com/api/docs/",
  };

  return officialDocs[normalized] ?? null;
}

function SkillChips({ skills, emptyText }: { skills: string[]; emptyText: string }) {
  return skills.length > 0 ? (
    <ul className="mt-3 flex flex-wrap gap-2">{skills.map((skill) => <li key={skill} className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-900 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-100">{skill}</li>)}</ul>
  ) : <p className="mt-3 text-sm text-gray-500">{emptyText}</p>;
}
