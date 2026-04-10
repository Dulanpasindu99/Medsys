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
    onEdit: () => void;
};

export function ProfileHeader({ profile, timelineCount, formatDate, onEdit }: ProfileHeaderProps) {
    const genderToneClass =
        profile.gender === 'Male'
            ? 'bg-sky-50 text-sky-700 ring-sky-100'
            : profile.gender === 'Female'
                ? 'bg-rose-50 text-rose-700 ring-rose-100'
                : 'bg-violet-50 text-violet-700 ring-violet-100';
    return (
        <div className="space-y-3">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                <div className="space-y-1.5">
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-[2rem]">
                        {profile.name}
                        <span className="ml-3 text-xl font-semibold text-slate-400 md:text-2xl">#{profile.id}</span>
                    </h1>
                    <p className="text-sm text-slate-600">Patient identity, latest clinical summary, and editable profile details.</p>
                    <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                        {profile.conditions.map((condition) => (
                            <span key={condition} className="rounded-full bg-slate-100 px-3 py-1 text-slate-700 ring-1 ring-slate-200">
                                {condition}
                            </span>
                        ))}
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-2.5 text-sm font-semibold text-slate-800">
                    <button
                        type="button"
                        onClick={onEdit}
                        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-slate-700 ring-1 ring-white/70 transition hover:bg-slate-50"
                    >
                        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path d="M13.586 2.586a2 2 0 112.828 2.828l-8.25 8.25a2 2 0 01-.878.497l-2.828.707a.75.75 0 01-.91-.91l.707-2.828a2 2 0 01.497-.878l8.25-8.25zM12.525 4.354L5.336 11.543a.5.5 0 00-.124.22l-.456 1.825 1.825-.456a.5.5 0 00.22-.124l7.19-7.19-1.466-1.464z" />
                        </svg>
                        Edit profile
                    </button>
                    <span className="rounded-full bg-slate-700 px-4 py-2 text-white shadow-[0_12px_32px_rgba(71,85,105,0.28)]">
                        {profile.patientCode ? `Code ${profile.patientCode}` : `NIC ${profile.nic}`}
                    </span>
                    <span className={`rounded-full px-4 py-2 ring-1 ${genderToneClass}`}>Gender {profile.gender}</span>
                    {profile.guardianRelationship ? (
                        <span className="rounded-full bg-amber-50 px-4 py-2 text-amber-800 ring-1 ring-amber-100">
                            Guardian {profile.guardianRelationship}
                        </span>
                    ) : null}
                </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                <InfoPill label="Age" value={`${profile.age} yrs`} />
                <InfoPill label="Family" value={profile.family.assigned ? `${profile.family.name} family` : 'Not assigned'} />
                <InfoPill label="Blood group" value={profile.bloodGroup ?? 'Not provided'} />
                <InfoPill label="First added" value={formatDate(profile.firstSeen)} />
                <InfoPill label="Consultations" value={String(timelineCount)} />
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
