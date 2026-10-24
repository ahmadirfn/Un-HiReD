"use client";

/* eslint-disable react-hooks/set-state-in-effect -- hydrate the saved dashboard profile and draft from browser storage. */

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, PanelLeftOpen, Sparkles } from "lucide-react";
import CommandPalette, { type DashboardCommand } from "../../../components/CommandPalette";
import JobAnalyzer, { type JobMatchAnalysis } from "../../../components/JobAnalyzer";
import LanguageControls from "../../../components/LanguageControls";
import type { BaseProfile } from "../../../components/OnboardingWizard";
import Sidebar, { type WorkspaceSection } from "../../../components/Sidebar";
import { useLanguage } from "../../../store/languageStore";

const SESSION_KEY = "unhired.dashboard.session";
const TAILORED_BULLETS_KEY = "tailored_resume_bullets";

interface ResumeSuggestion {
  bullet: string;
  rationale: string;
}

interface OptimizationResult {
  suggestions: ResumeSuggestion[];
}

export default function JobMatchPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [profile, setProfile] = useState<BaseProfile | null>(null);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [analysis, setAnalysis] = useState<JobMatchAnalysis | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [showTailoring, setShowTailoring] = useState(false);
  const [tailoring, setTailoring] = useState(false);
  const [optimized, setOptimized] = useState<OptimizationResult | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(SESSION_KEY);
      if (stored) {
        const session = JSON.parse(stored) as { profile?: BaseProfile };
        if (session.profile && Array.isArray(session.profile.current_skills)) {
          const resumeText = localStorage.getItem("resume_text");
          const extractedSkills = localStorage.getItem("extracted_skills");
          setProfile({
            ...session.profile,
            resume_text: resumeText ?? session.profile.resume_text,
            resume_extracted_skills: extractedSkills ? JSON.parse(extractedSkills) as string[] : session.profile.resume_extracted_skills,
          });
        }
      }
      const savedBullets = localStorage.getItem(TAILORED_BULLETS_KEY);
      if (savedBullets) {
        const parsed = JSON.parse(savedBullets) as OptimizationResult;
        if (Array.isArray(parsed.suggestions)) setOptimized(parsed);
      }
    } catch {
      sessionStorage.removeItem(SESSION_KEY);
    } finally {
      setProfileLoaded(true);
    }
  }, []);

  const requestTailoring = useCallback(async () => {
    setShowTailoring(true);
    setOptimized(null);
    setError("");
    if (!profile?.resume_text?.trim()) {
      setError("Parsed resume text is not available in this session. Return to your CV workspace and upload your resume again.");
      return;
    }
    if (!jobDescription.trim()) {
      setError("Analyze a job description before tailoring your CV.");
      return;
    }

    setTailoring(true);
    try {
      const response = await fetch("/api/copilot/optimize-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ original_resume: profile.resume_text, job_description: jobDescription }),
      });
      if (!response.ok) throw await responseError(response);
      const result = (await response.json()) as OptimizationResult;
      setOptimized(result);
      localStorage.setItem(TAILORED_BULLETS_KEY, JSON.stringify(result));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not tailor this resume. Please try again.");
    } finally {
      setTailoring(false);
    }
  }, [jobDescription, profile]);

  function handleAnalysisComplete(nextAnalysis: JobMatchAnalysis, jd: string) {
    setAnalysis(nextAnalysis);
    setJobDescription(jd);
    setShowTailoring(false);
    setOptimized(null);
    setError("");
  }

  function handleCommand(command: DashboardCommand) {
    if (command === "optimize-resume") {
      document.getElementById(analysis ? "tailoring-workspace" : "job-analyzer")?.scrollIntoView({ behavior: "smooth", block: "center" });
      setNotice(analysis ? "Choose Auto-Tailor CV below the match results." : "Analyze a job description first, then tailor your CV.");
    } else if (command === "analyze-skill-gaps") {
      document.getElementById("job-analyzer")?.scrollIntoView({ behavior: "smooth", block: "center" });
      setNotice("Paste a job description to compare your profile skills.");
    } else {
      setNotice("Mock interview generation is not connected yet.");
    }
    window.setTimeout(() => setNotice(""), 4000);
  }

  function handleSidebarNavigate(section: WorkspaceSection) {
    if (section === "job-match") return;
    router.push(`/?section=${section}`);
  }

  function handleLogout() {
    sessionStorage.removeItem(SESSION_KEY);
    localStorage.removeItem("resume_text");
    localStorage.removeItem("extracted_skills");
    localStorage.removeItem(TAILORED_BULLETS_KEY);
    router.push("/");
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 dark:bg-[#0f1117] dark:text-white">
      <CommandPalette onCommand={handleCommand} onNavigate={handleSidebarNavigate} />
      <div className="flex h-screen flex-col overflow-hidden md:flex-row">
        <Sidebar activeSection="job-match" hasUploadedCV={Boolean(profile?.hasUploadedCV)} userName={profile?.first_name ?? ""} onNavigate={handleSidebarNavigate} onLogout={handleLogout} isOpen={sidebarOpen} onToggle={() => setSidebarOpen(false)} />
        {!sidebarOpen && <button type="button" onClick={() => setSidebarOpen(true)} aria-label="Expand sidebar" title="Open sidebar" className="fixed left-4 top-4 z-[60] hidden h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white/95 text-slate-700 shadow-lg backdrop-blur transition hover:bg-slate-100 dark:border-slate-700 dark:bg-[#161b22]/95 dark:text-slate-300 dark:hover:bg-slate-800 md:grid"><PanelLeftOpen aria-hidden="true" className="h-4 w-4" /></button>}
      <div data-lenis-wrapper className="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain p-4 md:h-screen md:p-8">
      <div data-lenis-content className="mx-auto min-h-full max-w-6xl">
        <Link href="/" className="inline-flex items-center gap-2 rounded-lg text-sm font-medium text-slate-600 transition hover:text-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-500 dark:text-slate-400 dark:hover:text-rose-300">
          <ArrowLeft aria-hidden="true" className="h-4 w-4" /> {t("Career workspace")}
        </Link>
        <header className="mb-7 mt-7 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-700 dark:text-rose-300">{t("Resume co-pilot")}</p>
            <h1 className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white sm:text-3xl">{t("Job Match & CV Tailoring")}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-400">{t("Compare your profile to a target role, then create a fact-grounded draft for that same job.")}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2"><LanguageControls /><button type="button" onClick={() => window.dispatchEvent(new Event("unhired:open-command-palette"))} className="inline-flex items-center gap-2 self-start rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-sm hover:border-rose-300 dark:border-slate-800 dark:bg-[#161b22] dark:text-slate-300 sm:self-auto">Open commands <kbd className="rounded border border-slate-200 px-1.5 py-0.5 text-[10px] dark:border-slate-700">Ctrl K</kbd></button></div>
        </header>

        {notice && <p role="status" className="mb-4 rounded-xl border border-rose-200 bg-white p-3 text-sm text-slate-700 dark:border-rose-400/20 dark:bg-[#161b22] dark:text-slate-200">{notice}</p>}
        {!profileLoaded ? (
          <div role="status" className="h-72 animate-pulse rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-[#161b22]" />
        ) : !profile ? (
          <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6 dark:border-amber-900/60 dark:bg-amber-950/20">
            <h2 className="font-semibold text-amber-950 dark:text-amber-200">Your profile is not loaded</h2>
            <p className="mt-2 text-sm text-amber-900 dark:text-amber-100">Open your career workspace and complete onboarding first. Your saved profile and resume will be available here.</p>
            <Link href="/" className="mt-4 inline-flex rounded-lg bg-amber-900 px-4 py-2 text-sm font-semibold text-white dark:bg-amber-200 dark:text-amber-950">Open workspace</Link>
          </section>
        ) : (
          <div className="space-y-8">
            <div id="job-analyzer">
              <JobAnalyzer
                resumeSkills={profile.current_skills}
                canTailor={Boolean(profile.resume_text?.trim())}
                tailoring={tailoring}
                onAnalysisComplete={handleAnalysisComplete}
                onRequestTailor={requestTailoring}
              />
            </div>

            {analysis && showTailoring && (
              <section id="tailoring-workspace" className="scroll-mt-6" aria-labelledby="tailoring-title">
                <div className="mb-4 flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"><Sparkles className="h-5 w-5" aria-hidden="true" /></span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-300">Based on the analyzed job</p>
                    <h2 id="tailoring-title" className="text-lg font-semibold text-slate-900 dark:text-white">CV tailoring workspace</h2>
                  </div>
                </div>
                {error && <p role="alert" className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800 dark:border-rose-900/70 dark:bg-rose-950/30 dark:text-rose-200">{error}</p>}
                <div className="min-w-0 rounded-2xl border border-slate-200/80 bg-white p-5 dark:border-slate-800 dark:bg-[#161b22] sm:p-6">
                    <div className="flex items-center gap-3">
                      <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"><Sparkles className="h-5 w-5" aria-hidden="true" /></span>
                      <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-300">Resume improvement ideas</p><h3 id="optimized-draft-title" className="text-lg font-semibold text-slate-900 dark:text-white">Suggested Resume Bullets</h3></div>
                    </div>
                    {tailoring ? <SuggestionsSkeleton /> : optimized ? <SuggestionList suggestions={optimized.suggestions} /> : (
                      <div className="mt-5 flex min-h-56 flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50/70 px-6 py-8 text-center dark:border-slate-700 dark:bg-[#0f1117]/70">
                        <Sparkles className="h-6 w-6 text-emerald-600 dark:text-emerald-300" aria-hidden="true" />
                        <p className="mt-3 text-sm font-semibold text-slate-900 dark:text-white">Ready to suggest improvements</p>
                        <p className="mt-1 max-w-xl text-sm text-slate-600 dark:text-slate-400">Suggestions use active verbs and the XYZ formula where possible. Unverified details are marked for you to confirm rather than invented.</p>
                        <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">Choose “Auto-Tailor CV for this Role” above to generate 3–5 suggestions.</p>
                      </div>
                    )}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
      </div>
      </div>
    </main>
  );
}

async function responseError(response: Response): Promise<Error> {
  const text = await response.text();
  let message = text || `Request failed (${response.status})`;
  try { const body = JSON.parse(text) as { detail?: unknown }; if (typeof body.detail === "string") message = body.detail; } catch { /* preserve plain text */ }
  return new Error(message);
}

function SuggestionsSkeleton() {
  return <div role="status" aria-label="Generating optimized resume draft" className="mt-5 animate-pulse space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-[#0f1117]"><span className="block h-4 w-1/3 rounded bg-slate-200 dark:bg-slate-700" /><span className="block h-3 w-full rounded bg-slate-200 dark:bg-slate-700" /><span className="block h-3 w-5/6 rounded bg-slate-200 dark:bg-slate-700" /><span className="block h-3 w-4/6 rounded bg-slate-200 dark:bg-slate-700" /><span className="block h-20 rounded-lg bg-slate-200 dark:bg-slate-800" /></div>;
}

function SuggestionList({ suggestions }: { suggestions: ResumeSuggestion[] }) {
  return <ol className="mt-5 space-y-3" aria-live="polite">{suggestions.map((suggestion, index) => <li key={`${index}-${suggestion.bullet}`} className="rounded-xl border border-slate-200/80 bg-slate-50 p-4 dark:border-slate-800 dark:bg-[#0f1117]"><div className="flex items-start gap-3"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">{index + 1}</span><p className="min-w-0 text-sm font-medium leading-6 text-slate-900 dark:text-slate-100">{suggestion.bullet}</p></div></li>)}</ol>;
}
