import type { PatientProfileRecord } from '../types';

type FamilyCardProps = {
    profile: PatientProfileRecord;
};

export function FamilyCard({ profile }: FamilyCardProps) {
    return (
        <>
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Family</p>
                    <h2 className="text-xl font-bold text-slate-900">Assignment & members</h2>
                </div>
                <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ring-1 ${profile.family.assigned
                            ? 'bg-emerald-50 text-emerald-700 ring-emerald-100'
                            : 'bg-slate-100 text-slate-600 ring-slate-200'
                        }`}
                >
                    {profile.family.assigned ? 'Assigned' : 'Not assigned'}
                </span>
            </div>

            <div className="mt-4 space-y-3 text-sm text-slate-700">
                <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 ring-1 ring-slate-100">
                    Family name: {profile.family.name}
                </div>
                <div className="space-y-2">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Other members</p>
                    <div className="flex flex-wrap gap-2">
                        {profile.family.members.length ? (
                            profile.family.members.map((member) => (
                                <span key={member} className="rounded-full bg-white/90 px-3 py-1 text-sm font-semibold text-slate-800 ring-1 ring-slate-200">
                                    {member}
                                </span>
                            ))
                        ) : (
                            <span className="rounded-full bg-white/90 px-3 py-1 text-sm font-semibold text-slate-500 ring-1 ring-slate-200">
                                No linked family members
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
