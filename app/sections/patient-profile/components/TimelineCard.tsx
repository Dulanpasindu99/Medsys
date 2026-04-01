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
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Consultations</p>
                    <h2 className="text-xl font-bold text-slate-900">Completed consultation history</h2>
                </div>
                <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-sky-700 ring-1 ring-sky-100">
                    Scrollable section
                </span>
            </div>

            <div className="relative mt-6 h-full min-h-0 overflow-y-auto pr-2">
                <div className="absolute bottom-0 left-4 top-0 w-px bg-gradient-to-b from-sky-200 via-slate-200 to-transparent" />
                <div className="space-y-6 pb-4">
                    {timeline.length > 0 ? (
                        timeline.map((entry, index) => (
                            <div key={entry.id ?? `${entry.date}-${entry.title}-${entry.value ?? index}`} className="relative pl-10">
                                <span className="absolute left-0 top-1.5 h-3.5 w-3.5 rounded-full bg-sky-500 shadow-[0_0_0_6px_rgba(14,165,233,0.2)]" />
                                <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-600">
                                    <span className="rounded-full bg-white/80 px-3 py-1 ring-1 ring-slate-200">{formatDate(entry.date)}</span>
                                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700 ring-1 ring-emerald-100">
                                        Consultation completed
                                    </span>
                                </div>
                                <div className="mt-2 rounded-2xl bg-white/90 p-4 ring-1 ring-slate-100">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <h3 className="text-base font-semibold text-slate-900">{entry.title}</h3>
                                            {entry.reason ? (
                                                <p className="mt-2 text-sm text-slate-700">
                                                    <span className="font-semibold text-slate-900">Reason:</span> {entry.reason}
                                                </p>
                                            ) : null}
                                        </div>
                                        {entry.value ? (
                                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
                                                {entry.value}
                                            </span>
                                        ) : null}
                                    </div>
                                    <div className="mt-4 grid gap-3 md:grid-cols-3">
                                        <div className="rounded-2xl border border-slate-100 bg-slate-50/90 px-4 py-3">
                                            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Diagnoses</p>
                                            <div className="mt-2 flex flex-wrap gap-2">
                                                {entry.diagnoses && entry.diagnoses.length > 0 ? (
                                                    entry.diagnoses.map((diagnosis) => (
                                                        <span
                                                            key={diagnosis}
                                                            className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 ring-1 ring-slate-200"
                                                        >
                                                            {diagnosis}
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span className="text-sm text-slate-500">No diagnoses recorded</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="rounded-2xl border border-slate-100 bg-slate-50/90 px-4 py-3">
                                            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Tests</p>
                                            <div className="mt-2 flex flex-wrap gap-2">
                                                {entry.tests && entry.tests.length > 0 ? (
                                                    entry.tests.map((test) => (
                                                        <span
                                                            key={test}
                                                            className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 ring-1 ring-slate-200"
                                                        >
                                                            {test}
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span className="text-sm text-slate-500">No tests recorded</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="rounded-2xl border border-slate-100 bg-slate-50/90 px-4 py-3">
                                            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Drugs</p>
                                            <div className="mt-2 flex flex-wrap gap-2">
                                                {entry.drugs && entry.drugs.length > 0 ? (
                                                    entry.drugs.map((drug) => (
                                                        <span
                                                            key={drug}
                                                            className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 ring-1 ring-slate-200"
                                                        >
                                                            {drug}
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span className="text-sm text-slate-500">No drugs recorded</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="relative pl-10">
                            <span className="absolute left-0 top-1.5 h-3.5 w-3.5 rounded-full bg-slate-300 shadow-[0_0_0_6px_rgba(226,232,240,0.9)]" />
                            <div className="rounded-2xl border border-dashed border-slate-200 bg-white/85 p-5">
                                <h3 className="text-base font-semibold text-slate-900">No completed consultations yet</h3>
                                <p className="mt-1 text-sm text-slate-600">
                                    Consultation details will appear here after the doctor completes a visit.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
