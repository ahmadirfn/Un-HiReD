export interface SdgAlignment {
  sdgNumber: 4 | 8 | 9;
  alignmentScore: number;
  impactDescription: string;
}

interface SdgMappingProps {
  sdgs: SdgAlignment[];
}

const SDG_INFO: Record<SdgAlignment["sdgNumber"], { name: string; color: string }> = {
  4: { name: "Quality Education", color: "bg-[#C5192D]" },
  8: { name: "Decent Work and Economic Growth", color: "bg-[#A21942]" },
  9: { name: "Industry, Innovation and Infrastructure", color: "bg-[#FD6925]" },
};

export default function SdgMapping({ sdgs }: SdgMappingProps) {
  const orderedSdgs = [4, 8, 9].map((number) => sdgs.find((item) => item.sdgNumber === number)).filter((item): item is SdgAlignment => Boolean(item));

  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-[#161b22] sm:p-8" aria-labelledby="sdg-mapping-heading">
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-700 dark:text-rose-300">Career impact</p>
        <h2 id="sdg-mapping-heading" className="mt-1 text-xl font-semibold text-gray-900 dark:text-white">UN Sustainable Development Goals</h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-gray-400">Potential alignment of this career pathway with global development goals.</p>
      </div>

      {orderedSdgs.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-3">
          {orderedSdgs.map((sdg) => {
            const info = SDG_INFO[sdg.sdgNumber];
            const score = Math.max(0, Math.min(100, Number(sdg.alignmentScore) || 0));
            return (
              <article key={sdg.sdgNumber} className={`${info.color} flex min-h-56 flex-col rounded-xl p-5 text-white shadow-lg shadow-black/10`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.15em] text-white/75">Goal {sdg.sdgNumber}</p>
                    <h3 className="mt-1 text-lg font-bold leading-6">{info.name}</h3>
                  </div>
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/15 text-lg font-bold">{sdg.sdgNumber}</span>
                </div>
                <div className="mt-5">
                  <div className="mb-1 flex items-center justify-between text-xs text-white/85"><span>Estimated alignment</span><span className="font-semibold">{score}%</span></div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-black/20"><div className="h-full rounded-full bg-white/90 transition-[width] duration-500" style={{ width: `${score}%` }} /></div>
                </div>
                <p className="mt-4 text-sm leading-5 text-white/90">{sdg.impactDescription}</p>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-700 dark:border-slate-800 dark:bg-black/50 dark:text-slate-300">SDG alignments will appear after profile analysis.</div>
      )}
    </section>
  );
}
