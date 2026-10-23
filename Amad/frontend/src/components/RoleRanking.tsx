export interface RoleMatch {
  roleName: string;
  matchScore: number;
  skillsGap: string[];
  demandTrajectory: string;
}

interface RoleRankingProps {
  roles: RoleMatch[];
  selectedRole: string;
  loading?: boolean;
  onSelectRole: (role: RoleMatch) => void;
}

export default function RoleRanking({
  roles,
  selectedRole,
  loading = false,
  onSelectRole,
}: RoleRankingProps) {
  return (
    <section className="rounded-2xl border border-gray-800 bg-gray-950 p-6 shadow-xl sm:p-8" aria-labelledby="role-ranking-heading">
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-300">Explore your options</p>
        <h2 id="role-ranking-heading" className="mt-1 text-xl font-semibold text-white">Ranked future roles</h2>
        <p className="mt-2 text-sm text-gray-400">Scores reflect how closely each path fits your current profile.</p>
      </div>

      {loading ? (
        <div className="space-y-3" aria-live="polite" aria-busy="true">
          {[0, 1, 2].map((item) => <div key={item} className="h-32 animate-pulse rounded-xl border border-gray-800 bg-black/70" />)}
          <span className="sr-only">Generating role rankings</span>
        </div>
      ) : roles.length > 0 ? (
        <ol className="space-y-3">
          {roles.map((role, index) => {
            const score = Math.max(0, Math.min(100, Number(role.matchScore) || 0));
            const selected = role.roleName === selectedRole;
            return (
              <li key={`${role.roleName}-${index}`}>
                <button
                  type="button"
                  aria-pressed={selected}
                  onClick={() => onSelectRole(role)}
                  className={`w-full rounded-xl border p-4 text-left transition hover:-translate-y-0.5 hover:border-rose-500/40 focus:outline-none focus:ring-2 focus:ring-rose-500 ${selected ? "border-rose-500/50 bg-rose-500/5" : "border-gray-800 bg-black/60"}`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">#{index + 1} match</p>
                      <h3 className="mt-1 font-semibold text-white">{role.roleName}</h3>
                    </div>
                    <span className="rounded-full border border-rose-400/20 bg-rose-400/10 px-2.5 py-1 text-xs font-semibold text-rose-200">{score}% match</span>
                  </div>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-gray-800">
                    <div className="h-full rounded-full bg-gradient-to-r from-rose-600 to-pink-300 transition-[width] duration-500" style={{ width: `${score}%` }} />
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-xs text-emerald-200">{role.demandTrajectory}</span>
                    {role.skillsGap.length > 0 && <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-2.5 py-1 text-xs text-amber-200">Reskilling required</span>}
                  </div>
                  {role.skillsGap.length > 0 && <p className="mt-3 text-xs leading-5 text-gray-400">Skills to build: {role.skillsGap.join(", ")}</p>}
                </button>
              </li>
            );
          })}
        </ol>
      ) : (
        <div className="rounded-xl border border-dashed border-gray-800 bg-black/50 p-6 text-center text-sm text-gray-400">No role matches were returned. Please submit your profile again.</div>
      )}
    </section>
  );
}
