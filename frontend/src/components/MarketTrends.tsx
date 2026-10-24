export interface MatchedTrend {
  skill_or_role: string;
  demand_change_pct: string;
  demand_status: string;
}

export interface TrendCitation {
  source_name: string;
  source_url: string;
  last_updated: string;
  sample_size: string;
}

export interface TrendsData {
  matched_trends: MatchedTrend[];
  citations: TrendCitation[];
}

interface MarketTrendsProps {
  trends: TrendsData;
}

function statusStyle(status: string) {
  switch (status.toLowerCase()) {
    case "rising":
      return "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";
    case "emerging":
      return "border-cyan-400/20 bg-cyan-400/10 text-cyan-300";
    case "declining":
      return "border-rose-400/20 bg-rose-400/10 text-rose-300";
    default:
      return "border-slate-700 bg-slate-800 text-slate-300";
  }
}

function demandStyle(change: string) {
  if (change.trim().startsWith("+")) return "text-emerald-400";
  if (change.trim().startsWith("-")) return "text-rose-400";
  return "text-slate-100";
}

export default function MarketTrends({ trends }: MarketTrendsProps) {
  const matchedTrends = trends.matched_trends ?? [];
  const citations = trends.citations ?? [];

  return (
    <section className="space-y-10" aria-label="Market trends and citations">
      <div>
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-400">
              Trend snapshot
            </p>
            <h2 className="mt-1 text-2xl font-semibold text-white">
              Market Demand Signals
            </h2>
          </div>
          <span className="rounded-full border border-slate-800 bg-slate-900 px-3 py-1 text-xs text-slate-400">
            {matchedTrends.length} {matchedTrends.length === 1 ? "signal" : "signals"}
          </span>
        </div>

        {matchedTrends.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {matchedTrends.map((trend, index) => (
              <article
                key={`${trend.skill_or_role}-${index}`}
                className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-lg shadow-black/10 transition-colors hover:border-slate-700"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="truncate text-base font-semibold text-slate-100">
                      {trend.skill_or_role}
                    </h3>
                    <p className="mt-1 text-xs text-slate-500">Demand change</p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium ${statusStyle(trend.demand_status)}`}
                  >
                    {trend.demand_status}
                  </span>
                </div>
                <p className={`mt-5 text-3xl font-semibold tracking-tight ${demandStyle(trend.demand_change_pct)}`}>
                  {trend.demand_change_pct}
                </p>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/60 px-5 py-8 text-center text-sm text-slate-400">
            No trend signals matched this profile. Try adding skills or a role
            from the trend dataset.
          </div>
        )}
      </div>

      <div>
        <div className="mb-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-400">
            Evidence
          </p>
          <h2 className="mt-1 text-2xl font-semibold text-white">
            Verified Data Sources
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Review the sources and coverage behind these market signals.
          </p>
        </div>

        {citations.length > 0 ? (
          <div className="space-y-3">
            {citations.map((citation, index) => (
              <article
                key={`${citation.source_url}-${citation.last_updated}-${index}`}
                className="flex flex-col gap-4 rounded-xl border border-slate-800/80 bg-slate-900/70 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <h3 className="font-medium text-slate-200">
                    {citation.source_name}
                  </h3>
                  <p className="mt-1 text-sm text-slate-400">
                    {citation.sample_size}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Updated {citation.last_updated}
                  </p>
                </div>
                {citation.source_url && (
                  <a
                    href={citation.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex shrink-0 items-center gap-2 self-start rounded-lg border border-slate-700 px-3 py-2 text-sm text-blue-300 transition-colors hover:border-blue-500/50 hover:bg-blue-500/10 hover:text-blue-200 sm:self-auto"
                  >
                    View source
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 20 20"
                      fill="none"
                      className="h-4 w-4"
                    >
                      <path
                        d="M11.25 3.75h5v5m-.5-4.5-7 7m3.5-5.5H6.5a2.75 2.75 0 0 0-2.75 2.75v5.75A2.75 2.75 0 0 0 6.5 18h5.75A2.75 2.75 0 0 0 15 15.25V10.5"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </a>
                )}
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-slate-800/80 bg-slate-900/70 p-4 text-sm text-slate-400">
            No source citations were returned for this profile.
          </div>
        )}
      </div>
    </section>
  );
}
