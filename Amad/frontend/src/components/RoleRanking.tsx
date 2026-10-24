import MagneticButton from "./MagneticButton";
import { useLanguage } from "../store/languageStore";

export interface LearningResource {
  platform: string;
  title: string;
  url: string;
}

export interface RoleMatch {
  roleName: string;
  matchScore: number;
  skillsGap: string[];
  demandTrajectory: string;
  resources: LearningResource[];
  scoring_basis: string;
  learning_pathway: { step: number; skill: string; estimated_time: string }[];
  sdgs: import("./SdgMapping").SdgAlignment[];
}

interface RoleRankingProps {
  roles: RoleMatch[];
  selectedRole: string;
  loading?: boolean;
  onSelectRole: (role: RoleMatch) => void;
  trendSource?: string;
  lastUpdated?: string;
}

export default function RoleRanking({
  roles,
  selectedRole,
  loading = false,
  onSelectRole,
  trendSource,
  lastUpdated,
}: RoleRankingProps) {
  const { t } = useLanguage();
  return (
    <section className="rounded-2xl border border-slate-200/90 bg-slate-100/80 p-6 shadow-sm dark:border-slate-800 dark:bg-[#161b22] sm:p-8" aria-labelledby="role-ranking-heading">
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-700 dark:text-rose-300">{t("Explore your options")}</p>
        <h2 id="role-ranking-heading" className="mt-1 text-xl font-semibold text-slate-950 dark:text-white">{t("Ranked future roles")}</h2>
        <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">{t("Scores reflect how closely each path fits your current profile.")}</p>
        {trendSource && <p className="mt-3 inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">Source: {trendSource} <span className="mx-1.5 text-slate-400">|</span> Updated: {lastUpdated || "date unavailable"}</p>}
      </div>

      {loading ? (
        <div className="space-y-3" aria-live="polite" aria-busy="true">
          {[0, 1, 2].map((item) => <div key={item} className="h-32 animate-pulse rounded-xl border border-slate-200/80 bg-slate-100 dark:border-slate-800 dark:bg-black/70" />)}
          <span className="sr-only">Generating role rankings</span>
        </div>
      ) : roles.length > 0 ? (
        <ol className="space-y-3">
          {roles.map((role, index) => {
            const score = Math.max(0, Math.min(100, Number(role.matchScore) || 0));
            const selected = role.roleName === selectedRole;
            return (
              <li key={`${role.roleName}-${index}`}>
                <MagneticButton className="w-full" strength={0.035}>
                <button
                  type="button"
                  aria-pressed={selected}
                  onClick={() => onSelectRole(role)}
                  className={`w-full rounded-xl border p-4 text-left transition hover:-translate-y-0.5 hover:border-rose-500/40 focus:outline-none focus:ring-2 focus:ring-rose-500 ${selected ? "border-rose-500/50 bg-rose-500/5" : "border-slate-200/80 bg-slate-50 dark:border-slate-800 dark:bg-[#0f1117]"}`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">#{index + 1} {t("match")}</p>
                      <h3 className="mt-1 font-semibold text-gray-900 dark:text-white">{role.roleName}</h3>
                    </div>
                    <span className="rounded-full border border-rose-500/20 bg-rose-500/10 px-2.5 py-1 text-xs font-semibold text-rose-800 dark:text-rose-200">{score}% match</span>
                  </div>
                  {role.scoring_basis && <p className="mb-3 text-sm leading-5 text-slate-700 dark:text-slate-300">{t("Why this match")}: {role.scoring_basis}</p>}
                  <div
                    className="mt-3 mb-4 h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700"
                    role="progressbar"
                    aria-label={`${role.roleName} match score`}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={score}
                  >
                    <div className="h-2 rounded-full bg-emerald-500 transition-all duration-1000" style={{ width: `${score}%` }} />
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="mr-2 inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-800 dark:border dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                      <span className="font-semibold">{t("Market Insight:")} </span>&nbsp;{role.demandTrajectory}
                    </span>
                    {role.skillsGap.length > 0 && <span className="rounded-full border border-amber-500/30 bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-950 dark:bg-amber-500/10 dark:text-amber-200">{t("Reskilling required")}</span>}
                  </div>
                  {role.skillsGap.length > 0 && <p className="mt-3 text-sm leading-5 text-slate-700 dark:text-slate-300">{t("Skills to build:")} {role.skillsGap.join(", ")}</p>}
                </button>
                </MagneticButton>
              </li>
            );
          })}
        </ol>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-700 dark:border-slate-800 dark:bg-black/50 dark:text-slate-300">No role matches were returned. Please submit your profile again.</div>
      )}
    </section>
  );
}
