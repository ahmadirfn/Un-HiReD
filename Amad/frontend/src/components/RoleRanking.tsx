export interface RankedRole {
  role: string;
  match_score: number;
  skills_gap?: string[];
  demand_status: string;
  demand_change_pct?: string;
  reason?: string;
}

interface RoleRankingProps {
  roles: RankedRole[];
  selectedRole: string;
  loading?: boolean;
  onSelectRole: (role: RankedRole) => void;
}

function demandBadge(status: string) {
  const normalized = status.toLowerCase();
  if (normalized === "rising" || normalized === "emerging") {
    return "border-emerald-400/20 bg-emerald-400/10 text-emerald-200";
  }
  if (normalized === "declining") {
    return "border-rose-400/20 bg-rose-400/10 text-rose-200";
  }
  return "border-slate-700 bg-slate-800 text-slate-300";
}

export default function RoleRanking({
  roles,
  selectedRole,
  loading = false,
  onSelectRole,
}: RoleRankingProps) {
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl sm:p-8" aria-labelledby="role-ranking-heading">
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-400">Explore your options</p>
        <h2 id="role-ranking-heading" className="mt-1 text-xl font-semibold text-white">Ranked future roles</h2>
        <p className="mt-2 text-sm text-slate-400">Select a role to refresh its pathway and market signals.</p>
      </div>

      {loading ? (
        <div className="space-y-3" aria-live="polite" aria-busy="true">
          {[0, 1].map((item) => (
            <div key={item} className="h-28 animate-pulse rounded-xl border border-slate-800 bg-slate-950/70" />
          ))}
          <span className="sr-only">Updating role rankings</span>
        </div>
      ) : roles.length > 0 ? (
        <ol className="space-y-3">
          {roles.map((role, index) => {
            const score = Math.max(0, Math.min(100, Number(role.match_score) || 0));
            const selected = role.role.toLowerCase() === selectedRole.toLowerCase();
            const hasGap = (role.skills_gap?.length ?? 0) > 0;
            return (
              <li key={`${role.role}-${index}`}>
                <button
                  type="button"
                  aria-pressed={selected}
                  onClick={() => onSelectRole(role)}
                  className={`w-full rounded-xl border p-4 text-left transition hover:-translate-y-0.5 hover:border-blue-500/40 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    selected ? "border-blue-500/50 bg-blue-500/5" : "border-slate-800 bg-slate-950/60"
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">#{index + 1} match</p>
                      <h3 className="mt-1 font-semibold text-white">{role.role}</h3>
                    </div>
                    <span className="rounded-full border border-blue-400/20 bg-blue-400/10 px-2.5 py-1 text-xs font-semibold text-blue-200">
                      {score}% match
                    </span>
                  </div>

                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-800">
                    <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-300" style={{ width: `${score}%` }} />
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className={`rounded-full border px-2.5 py-1 text-xs ${demandBadge(role.demand_status)}`}>
                      {role.demand_status === "Unavailable" ? "Demand data unavailable" : `${role.demand_status} demand`}
                      {role.demand_change_pct ? ` · ${role.demand_change_pct}` : ""}
                    </span>
                    {hasGap && (
                      <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-2.5 py-1 text-xs text-amber-200">
                        Reskilling required
                      </span>
                    )}
                    {!hasGap && role.skills_gap && (
                      <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-xs text-emerald-200">
                        No listed skill gaps
                      </span>
                    )}
                    {!role.skills_gap && (
                      <span className="rounded-full border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs text-slate-300">
                        Gap data unavailable
                      </span>
                    )}
                  </div>

                  {(role.skills_gap?.length ?? 0) > 0 && (
                    <p className="mt-3 text-xs leading-5 text-slate-400">
                      Skills to build: {role.skills_gap?.join(", ")}
                    </p>
                  )}
                  {role.reason && <p className="mt-2 text-xs leading-5 text-slate-400">{role.reason}</p>}
                </button>
              </li>
            );
          })}
        </ol>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-800 bg-slate-950/50 p-6 text-center text-sm text-slate-400">
          Analyze a profile to see ranked role matches.
        </div>
      )}
    </section>
  );
}
