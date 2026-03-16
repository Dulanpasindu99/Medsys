import type { PatientProfileRecord } from '../types';

const insetShadow = 'shadow-[inset_0_1px_0_rgba(255,255,255,0.42)]';

const InfoPill = ({ label, value }: { label: string; value: string }) => (
    <div className={`rounded-2xl border border-slate-100 bg-white/90 px-4 py-3 text-sm font-semibold text-slate-800 ${insetShadow}`}>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
        <p className="mt-1 text-base text-slate-900">{value}</p>
    </div>
);

type ProfileHeaderProps = {
    profile: PatientProfileRecord;
    timelineCount: number;
    formatDate: (date: string) => string;
};

export function ProfileHeader({ profile, timelineCount, formatDate }: ProfileHeaderProps) {
    return (
        <div className="space-y-5">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">{profile.name}</h1>
                    <p className="text-sm text-slate-600">Automatically generated record shared across all panels.</p>
                    <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                        {profile.conditions.map((condition) => (
                            <span key={condition} className="rounded-full bg-slate-100 px-3 py-1 text-slate-700 ring-1 ring-slate-200">
                                {condition}
                            </span>
                        ))}
                    </div>
                </div>
                <div className="flex flex-wrap gap-3 text-sm font-semibold text-slate-800">
                    <span className="rounded-full bg-slate-700 px-4 py-2 text-white shadow-[0_12px_32px_rgba(71,85,105,0.28)]">
                        {profile.patientCode ? `Code ${profile.patientCode}` : `NIC ${profile.nic}`}
                    </span>
                    <span className="rounded-full bg-slate-100 px-4 py-2 text-slate-700 ring-1 ring-slate-200">Gender {profile.gender}</span>
                    {profile.guardianRelationship ? (
                        <span className="rounded-full bg-amber-50 px-4 py-2 text-amber-800 ring-1 ring-amber-100">
                            Guardian {profile.guardianRelationship}
                        </span>
                    ) : null}
                </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <InfoPill label="Age" value={`${profile.age} yrs`} />
                <InfoPill label="Family" value={profile.family.assigned ? `${profile.family.name} family` : 'Not assigned'} />
                <InfoPill label="First added" value={formatDate(profile.firstSeen)} />
                <InfoPill label="Total timeline notes" value={String(timelineCount)} />
            </div>
            {(profile.guardianName || profile.guardianNic || profile.guardianPhone) ? (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <InfoPill label="Guardian" value={profile.guardianName ?? 'Linked guardian'} />
                    <InfoPill label="Guardian NIC" value={profile.guardianNic ?? 'Not provided'} />
                    <InfoPill label="Guardian Phone" value={profile.guardianPhone ?? 'Not provided'} />
                </div>
            ) : null}
        </div>
    );
}
