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
                <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-rose-700 ring-1 ring-rose-100">
                    Keep updated
                </span>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
                {profile.allergies.length > 0 ? (
                    profile.allergies.map((allergy) => (
                        <span key={allergy} className="rounded-full bg-white/90 px-3 py-2 text-sm font-semibold text-slate-800 ring-1 ring-slate-200">
                            {allergy}
                        </span>
                    ))
                ) : (
                    <span className="rounded-full bg-white/90 px-3 py-2 text-sm font-semibold text-slate-500 ring-1 ring-slate-200">
                        No known allergies
                    </span>
                )}
            </div>
        </>
    );
}
