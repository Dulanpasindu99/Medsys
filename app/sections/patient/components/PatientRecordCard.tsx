import type { Patient } from "../types";

type PatientRecordCardProps = {
  patient: Patient;
  onViewProfile: (profileId: string | null) => void;
};

export function PatientRecordCard({ patient, onViewProfile }: PatientRecordCardProps) {
  return (
    <article className="overflow-hidden rounded-[26px] border border-white/60 bg-gradient-to-br from-white/95 via-white/90 to-sky-50/80 shadow-[0_16px_42px_rgba(15,23,42,0.1)] ring-1 ring-slate-100 backdrop-blur">
      <div className="flex flex-col gap-5 px-5 py-5 md:flex-row md:items-start md:justify-between md:px-6 md:py-6">
        <div className="flex flex-1 flex-col gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-700 px-4 py-2 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(71,85,105,0.3)]">
              {patient.patientCode || `#${patient.patientId ?? "--"}`}
              <span className="text-slate-300">|</span>
              {patient.name}
            </div>
            <span className="text-sm font-semibold text-slate-700">
              {patient.nic !== "No NIC" ? `NIC ${patient.nic}` : "NIC not provided"}
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700">
              {patient.gender}
            </span>
          </div>

          <div className="flex flex-wrap gap-2 text-sm text-slate-600">
            <span className="inline-flex items-center gap-1 rounded-full bg-white/70 px-3 py-1 font-semibold text-slate-800 ring-1 ring-slate-100">
              Mobile: {patient.mobile}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-white/70 px-3 py-1 font-semibold text-slate-800 ring-1 ring-slate-100">
              {patient.family} Family
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-white/70 px-3 py-1 font-semibold text-slate-800 ring-1 ring-slate-100">
              Visits: {patient.visits}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-white/70 px-3 py-1 font-semibold text-slate-800 ring-1 ring-slate-100">
              Last visit: {patient.lastVisit}
            </span>
            {patient.guardianNic ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 font-semibold text-amber-800 ring-1 ring-amber-100">
                Guardian NIC: {patient.guardianNic}
              </span>
            ) : null}
            {patient.guardianRelationship ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 font-semibold text-amber-800 ring-1 ring-amber-100">
                Guardian: {patient.guardianRelationship}
              </span>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {patient.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-slate-700 to-slate-800 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white shadow-[0_12px_32px_rgba(71,85,105,0.3)]"
              >
                {tag}
              </span>
            ))}
            {patient.nextAppointment ? (
              <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700 ring-1 ring-emerald-100">
                Next: {patient.nextAppointment}
              </span>
            ) : null}
          </div>
        </div>

        <div className="flex w-full flex-col gap-3 rounded-2xl bg-white/90 p-4 ring-1 ring-slate-100 md:w-80">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Status</p>
            <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-sky-700 ring-1 ring-sky-100">Family</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm font-semibold text-slate-700">
            <span className="rounded-2xl bg-slate-50 px-3 py-2 ring-1 ring-slate-100">Age: {patient.age}</span>
            <span className="rounded-2xl bg-slate-50 px-3 py-2 ring-1 ring-slate-100">Visits: {patient.visits}</span>
          </div>
          <div className="rounded-2xl bg-gradient-to-r from-slate-700 to-slate-800 px-4 py-3 text-sm font-semibold text-white shadow-[0_16px_32px_rgba(71,85,105,0.35)]">
            <div className="text-xs uppercase tracking-[0.18em] text-slate-300">Conditions</div>
            <div className="mt-1 flex flex-wrap gap-2">
              {patient.conditions.map((condition) => (
                <span key={condition} className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-slate-100 ring-1 ring-white/15">
                  {condition}
                </span>
              ))}
            </div>
          </div>
          {patient.profileId ? (
            <button type="button" onClick={() => onViewProfile(patient.profileId || null)} className="ios-button-primary w-full text-center text-sm">
              View patient profile
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
}
