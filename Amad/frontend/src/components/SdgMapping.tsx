export interface SdgMappingItem {
  sdg: number | string;
  name?: string;
  details?: string;
  alignment_score?: number;
  impact_indicator?: string;
}

interface SdgMappingProps {
  mappings: SdgMappingItem[];
}

const SDG_INFO: Record<number, { name: string; color: string }> = {
  4: { name: "Quality Education", color: "bg-[#C5192D]" },
  8: { name: "Decent Work and Economic Growth", color: "bg-[#A21942]" },
  9: { name: "Industry, Innovation and Infrastructure", color: "bg-[#FD6925]" },
};

function getNumber(sdg: number | string): number {
  const match = String(sdg).match(/\d+/);
  return match ? Number(match[0]) : 0;
}

export default function SdgMapping({ mappings }: SdgMappingProps) {
  const displayed = [4, 8, 9].map((number) => {
    const found = mappings.find((item) => getNumber(item.sdg) === number);
    return {
      number,
      name: found?.name ?? SDG_INFO[number].name,
      details: found?.details,
      score: found?.alignment_score,
      indicator: found?.impact_indicator,
      color: SDG_INFO[number].color,
      available: Boolean(found),
    };
  });

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl sm:p-8" aria-labelledby="sdg-mapping-heading">
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-400">Career impact</p>
        <h2 id="sdg-mapping-heading" className="mt-1 text-xl font-semibold text-white">UN Sustainable Development Goals</h2>
        <p className="mt-2 text-sm text-slate-400">Potential alignment of this learning pathway, not a claim of direct SDG impact.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {displayed.map((item) => (
          <article key={item.number} className={`${item.color} flex min-h-56 flex-col rounded-xl p-5 text-white shadow-lg shadow-black/10`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.15em] text-white/75">Goal {item.number}</p>
                <h3 className="mt-1 text-lg font-bold leading-6">{item.name}</h3>
              </div>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/15 text-lg font-bold">{item.number}</span>
            </div>

            {item.available ? (
              <>
                {typeof item.score === "number" ? (
                  <div className="mt-5">
                    <div className="mb-1 flex items-center justify-between text-xs text-white/85">
                      <span>Estimated alignment</span>
                      <span className="font-semibold">{Math.max(0, Math.min(100, item.score))}%</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-black/20">
                      <div className="h-full rounded-full bg-white/90" style={{ width: `${Math.max(0, Math.min(100, item.score))}%` }} />
                    </div>
                  </div>
                ) : (
                  <p className="mt-4 text-xs font-medium text-white/80">Qualitative alignment</p>
                )}
                <p className="mt-4 text-sm leading-5 text-white/90">{item.details || "No pathway-specific explanation was provided."}</p>
                {item.indicator && <p className="mt-auto pt-4 text-xs font-medium text-white">Indicator: {item.indicator}</p>}
              </>
            ) : (
              <p className="mt-auto pt-5 text-sm leading-5 text-white/85">No pathway-specific alignment was returned for this goal.</p>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
