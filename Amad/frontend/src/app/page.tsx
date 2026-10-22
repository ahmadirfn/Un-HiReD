"use client";

import { useState, type FormEvent } from "react";
import MarketTrends, { type TrendsData } from "../components/MarketTrends";
import PathwayDashboard, {
  type AnalysisData,
} from "../components/PathwayDashboard";

interface RecommendationResponse {
  trends?: TrendsData;
  analysis?: AnalysisData;
}

export default function Home() {
  const [currentSkills, setCurrentSkills] = useState<string[]>([]);
  const [targetRole, setTargetRole] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<RecommendationResponse | null>(null);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setResults(null);

    try {
      const response = await fetch("/api/recommendation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          current_skills: currentSkills,
          target_role: targetRole.trim(),
        }),
      });
      const data = await response.json();

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

  return (
    <main className="min-h-screen px-4 py-12 sm:px-6">
      <div className="mx-auto max-w-4xl">
        <header className="mb-10 text-center sm:mb-12">
          <div className="mb-5 inline-flex rounded-full bg-gradient-to-r from-blue-500/20 via-indigo-500/20 to-cyan-400/20 p-px">
            <span className="rounded-full bg-slate-950/90 px-4 py-2 text-xs font-semibold tracking-[0.2em] text-blue-200 sm:text-sm">
              AIVERSECITY CO-PILOT
            </span>
          </div>
          <h1 className="mx-auto max-w-3xl bg-gradient-to-r from-white via-blue-100 to-cyan-300 bg-clip-text text-3xl font-bold tracking-tight text-transparent sm:text-5xl sm:leading-tight">
            Make your next career move with confidence.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-400 sm:text-lg">
            See how your current skills connect to future-ready work and get a
            practical pathway to close the gap.
          </p>
        </header>

        <section className="space-y-5 rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl shadow-black/20 sm:p-8">
          <div>
            <p className="text-sm font-medium text-blue-400">Start with you</p>
            <h2 className="mt-1 text-xl font-semibold text-white sm:text-2xl">
              Build your career snapshot
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Share a few skills and the role you are aiming for. We’ll map a
              starting point for your next steps.
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label
                className="block text-sm font-medium text-slate-200"
                htmlFor="current-skills"
              >
                Current skills
              </label>
              <input
                id="current-skills"
                name="current_skills"
                type="text"
                value={currentSkills.join(", ")}
                onChange={(event) =>
                  setCurrentSkills(
                    event.target.value
                      .split(",")
                      .map((skill) => skill.trim())
                      .filter(Boolean),
                  )
                }
                placeholder="HTML/CSS, JavaScript, Python, SQL"
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-slate-100 outline-none placeholder:text-slate-600 focus:ring-2 focus:ring-blue-500"
                autoComplete="off"
              />
              <p className="text-xs text-slate-500">
                Separate each skill with a comma.
              </p>
            </div>

            <div className="space-y-2">
              <label
                className="block text-sm font-medium text-slate-200"
                htmlFor="target-role"
              >
                Target future role
              </label>
              <input
                id="target-role"
                name="target_role"
                type="text"
                required
                value={targetRole}
                onChange={(event) => setTargetRole(event.target.value)}
                placeholder="AI and Machine Learning Specialist"
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-slate-100 outline-none placeholder:text-slate-600 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 font-semibold text-white shadow-lg shadow-blue-950/50 transition-all hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading && (
                <span
                  aria-hidden="true"
                  className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
                />
              )}
              {loading ? "Analyzing your profile..." : "Analyze My Career Path"}
            </button>
          </form>
        </section>

        {error && (
          <div
            role="alert"
            className="mt-6 rounded-xl border border-red-900/70 bg-red-950/50 p-4 text-sm text-red-200"
          >
            {error}
          </div>
        )}

        {(results?.trends || results?.analysis) && (
          <div className="mt-10 space-y-8">
            {results.trends && <MarketTrends trends={results.trends} />}
            {results.analysis && (
              <PathwayDashboard analysis={results.analysis} />
            )}
          </div>
        )}
      </div>
    </main>
  );
}
