"use client";

import { useState, type FormEvent } from "react";
import { AlertCircle, Check, LoaderCircle, Sparkles } from "lucide-react";
import MagneticButton from "./MagneticButton";

export interface JobMatchAnalysis {
  match_score: number;
  matched: string[];
  missing: string[];
  recommendation: string;
}

interface JobAnalyzerProps {
  resumeSkills: string[];
  canTailor?: boolean;
  tailoring?: boolean;
  onAnalysisComplete?: (analysis: JobMatchAnalysis, jobDescription: string) => void;
  onRequestTailor?: () => void;
}

function MatchGauge({ score }: { score: number }) {
  const safeScore = Math.max(0, Math.min(100, score));
  return (
    <div
      role="img"
      aria-label={`Match score: ${safeScore}%`}
      className="grid h-28 w-28 shrink-0 place-items-center rounded-full"
      style={{ background: `conic-gradient(#f43f5e ${safeScore * 3.6}deg, rgb(226 232 240) 0deg)` }}
    >
      <div className="grid h-24 w-24 place-items-center rounded-full bg-white dark:bg-[#11141b]">
        <div className="text-center">
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{safeScore}%</p>
          <p className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400">Match</p>
        </div>
      </div>
    </div>
  );
}

export default function JobAnalyzer({
  resumeSkills,
  canTailor = false,
  tailoring = false,
  onAnalysisComplete,
  onRequestTailor,
}: JobAnalyzerProps) {
  const [jobDescription, setJobDescription] = useState("");
  const [analysis, setAnalysis] = useState<JobMatchAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function analyzeMatch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setAnalysis(null);
    if (resumeSkills.length === 0) {
      setError("Add skills to your profile before comparing it with a job description.");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch("/api/copilot/analyze-match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resume_skills: resumeSkills, job_description: jobDescription.trim() }),
      });
      if (!response.ok) {
        const responseText = await response.text();
        let message = responseText || `Request failed (${response.status})`;
        try {
          const payload = JSON.parse(responseText) as { detail?: unknown };
          if (typeof payload.detail === "string") message = payload.detail;
        } catch {
          // Keep plain-text API errors readable.
        }
        throw new Error(message);
      }
      const data = (await response.json()) as JobMatchAnalysis;
      setAnalysis(data);
      onAnalysisComplete?.(data, jobDescription.trim());
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not analyze this job description. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-5 dark:border-slate-800 dark:bg-[#161b22] sm:p-6" aria-labelledby="job-analyzer-title">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-rose-500/10 text-rose-700 dark:text-rose-300"><Sparkles className="h-5 w-5" aria-hidden="true" /></span>
        <div>
          <h2 id="job-analyzer-title" className="text-lg font-semibold text-slate-900 dark:text-white">Job match &amp; skill gap</h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Compare your profile skills with a specific job description.</p>
        </div>
      </div>

      <form className="mt-5 space-y-3" onSubmit={analyzeMatch}>
        <label htmlFor="job-description" className="block text-sm font-medium text-slate-800 dark:text-slate-200">Job description</label>
        <textarea
          id="job-description"
          required
          minLength={30}
          maxLength={20000}
          value={jobDescription}
          onChange={(event) => setJobDescription(event.target.value)}
          placeholder="Paste the job description here..."
          className="min-h-36 w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-rose-400 focus:ring-2 focus:ring-rose-500/20 dark:border-slate-700 dark:bg-[#0f1117] dark:text-white dark:placeholder:text-slate-500"
        />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-500 dark:text-slate-400">Uses {resumeSkills.length} skill{resumeSkills.length === 1 ? "" : "s"} from your profile.</p>
          <MagneticButton strength={0.035}>
            <button type="submit" disabled={loading || !jobDescription.trim()} className="inline-flex min-w-40 items-center justify-center gap-2 rounded-xl bg-rose-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-rose-600/15 transition hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-60">
              {loading ? <><LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />Analyzing...</> : "Analyze Match"}
            </button>
          </MagneticButton>
        </div>
      </form>

      {error && <p role="alert" className="mt-4 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800 dark:border-rose-900/70 dark:bg-rose-950/30 dark:text-rose-200"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{error}</p>}

      {analysis && (
        <div className="mt-6 border-t border-slate-200 pt-6 dark:border-slate-800" aria-live="polite">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <MatchGauge score={analysis.match_score} />
            <p className="text-sm leading-6 text-slate-700 dark:text-slate-300">{analysis.recommendation}</p>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <SkillList title="Matching skills" skills={analysis.matched} kind="matched" />
            <SkillList title="Missing skills" skills={analysis.missing} kind="missing" />
          </div>
          {onRequestTailor && (
            <div className="mt-6 border-t border-slate-200 pt-5 dark:border-slate-800">
              <MagneticButton strength={0.035}>
                <button type="button" onClick={onRequestTailor} disabled={!canTailor || tailoring} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-rose-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-rose-600/15 transition hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-60">
                  {tailoring ? <><LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />Tailoring CV...</> : "Auto-Tailor CV for this Role"}
                </button>
              </MagneticButton>
              {!canTailor && <p className="mt-2 text-xs text-amber-800 dark:text-amber-300">Parsed resume text is unavailable. Upload your resume again to tailor it.</p>}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function SkillList({ title, skills, kind }: { title: string; skills: string[]; kind: "matched" | "missing" }) {
  const matched = kind === "matched";
  return (
    <section className="rounded-xl border border-slate-200/80 bg-slate-50 p-4 dark:border-slate-800 dark:bg-[#0f1117]" aria-label={title}>
      <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{title}<span className="ml-2 text-xs font-normal text-slate-500">{skills.length}</span></h3>
      {skills.length ? <ul className="mt-3 flex flex-wrap gap-2">{skills.map((skill) => <li key={skill} className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${matched ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800/70 dark:bg-emerald-900/20 dark:text-emerald-300" : "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800/70 dark:bg-amber-900/20 dark:text-amber-200"}`}>{matched && <Check className="h-3 w-3" aria-hidden="true" />}{skill}</li>)}</ul> : <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">{matched ? "No direct matches found." : "No additional skills identified."}</p>}
    </section>
  );
}
