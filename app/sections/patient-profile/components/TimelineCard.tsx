import type { PatientTimelineEntry } from '../types';

type TimelineCardProps = {
    timeline: PatientTimelineEntry[];
    formatDate: (date: string) => string;
};

export function TimelineCard({ timeline, formatDate }: TimelineCardProps) {
    return (
        <>
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Health Timeline</p>
                    <h2 className="text-xl font-bold text-slate-900">Diseases & blood pressure log</h2>
                </div>
                <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-sky-700 ring-1 ring-sky-100">
                    Vertical view
                </span>
            </div>

            <div className="relative mt-6 space-y-6">
                <div className="absolute bottom-0 left-4 top-0 w-px bg-gradient-to-b from-sky-200 via-slate-200 to-transparent" />
                {timeline.length > 0 ? (
                    timeline.map((entry) => (
                        <div key={`${entry.date}-${entry.title}`} className="relative pl-10">
                            <span className="absolute left-0 top-1.5 h-3.5 w-3.5 rounded-full bg-sky-500 shadow-[0_0_0_6px_rgba(14,165,233,0.2)]" />
                            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-600">
                                <span className="rounded-full bg-white/80 px-3 py-1 ring-1 ring-slate-200">{formatDate(entry.date)}</span>
                                {entry.kind === 'bp' ? (
                                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700 ring-1 ring-emerald-100">Blood pressure</span>
                                ) : null}
                                {entry.tags?.map((tag) => (
                                    <span key={tag} className="rounded-full bg-slate-700 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                            <div className="mt-2 rounded-2xl bg-white/90 p-4 ring-1 ring-slate-100">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <h3 className="text-base font-semibold text-slate-900">{entry.title}</h3>
                                        <p className="mt-1 text-sm text-slate-600">{entry.description}</p>
                                    </div>
                                    {entry.value ? (
                                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
                                            {entry.value}
                                        </span>
                                    ) : null}
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="relative pl-10">
                        <span className="absolute left-0 top-1.5 h-3.5 w-3.5 rounded-full bg-slate-300 shadow-[0_0_0_6px_rgba(226,232,240,0.9)]" />
                        <div className="rounded-2xl border border-dashed border-slate-200 bg-white/85 p-5">
                            <h3 className="text-base font-semibold text-slate-900">No patient history yet</h3>
                            <p className="mt-1 text-sm text-slate-600">
                                This patient has no recorded history, timeline notes, or vitals yet.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
