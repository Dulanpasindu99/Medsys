import type { PatientProfileRecord, PatientVitalEntry } from '../types';

type VitalsCardProps = {
    profile: PatientProfileRecord;
    formatDate: (date: string) => string;
};

const statClassName =
    'rounded-2xl border border-slate-100 bg-white/90 px-4 py-3 text-sm font-semibold text-slate-800';

function latestVital(vitals: PatientVitalEntry[]) {
    return vitals[0] ?? null;
}

function formatBloodPressure(vital: PatientVitalEntry | null) {
    if (!vital?.bpSystolic || !vital?.bpDiastolic) {
        return 'Not recorded';
    }

    return `${vital.bpSystolic}/${vital.bpDiastolic} mmHg`;
}

export function VitalsCard({ profile, formatDate }: VitalsCardProps) {
    const currentVital = latestVital(profile.vitals);

    return (
        <>
            <div className="flex items-center justify-between gap-3">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Vitals</p>
                    <h2 className="text-xl font-bold text-slate-900">Latest observations</h2>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-700 ring-1 ring-slate-200">
                    Last update: {currentVital ? formatDate(currentVital.recordedAt) : 'Not recorded'}
                </span>
            </div>

            {currentVital ? (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className={statClassName}>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Blood pressure</p>
                        <p className="mt-1 text-base font-semibold text-slate-900">{formatBloodPressure(currentVital)}</p>
                    </div>
                    <div className={statClassName}>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Heart rate</p>
                        <p className="mt-1 text-base font-semibold text-slate-900">
                            {currentVital.heartRate ? `${currentVital.heartRate} bpm` : 'Not recorded'}
                        </p>
                    </div>
                    <div className={statClassName}>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Temperature</p>
                        <p className="mt-1 text-base font-semibold text-slate-900">
                            {currentVital.temperatureC ? `${currentVital.temperatureC} C` : 'Not recorded'}
                        </p>
                    </div>
                    <div className={statClassName}>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">SpO2</p>
                        <p className="mt-1 text-base font-semibold text-slate-900">
                            {typeof currentVital.spo2 === 'number' ? `${currentVital.spo2}%` : 'Not recorded'}
                        </p>
                    </div>
                </div>
            ) : (
                <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-white/85 px-4 py-4 text-sm font-semibold text-slate-500">
                    No vitals recorded yet.
                </div>
            )}
        </>
    );
}
