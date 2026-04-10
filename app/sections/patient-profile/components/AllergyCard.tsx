import type { PatientProfileRecord } from '../types';

type AllergyCardProps = {
    profile: PatientProfileRecord;
};

export function AllergyCard({ profile }: AllergyCardProps) {
    return (
        <>
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Allergies</p>
                    <h2 className="text-xl font-bold text-slate-900">Known reactions</h2>
                </div>
                <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-sky-700 ring-1 ring-sky-100">
                    Doctor view
                </span>
            </div>

            <div className="mt-4 space-y-3">
                {profile.allergies.length > 0 ? (
                    profile.allergies.map((allergy) => (
                        <div
                            key={allergy.id ?? `${allergy.name}-${allergy.severityKey}`}
                            className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-white/90 px-4 py-3"
                        >
                            <div>
                                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Allergy</p>
                                <p className="mt-1 text-base font-semibold text-slate-900">{allergy.name}</p>
                            </div>
                            <span
                                className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${allergy.pill}`}
                            >
                                <span className={`h-2.5 w-2.5 rounded-full ${allergy.dot}`} />
                                {allergy.severity}
                            </span>
                        </div>
                    ))
                ) : (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-white/85 px-4 py-4 text-sm font-semibold text-slate-500">
                        No known allergies
                    </div>
                )}
            </div>
        </>
    );
}
