import type { Patient } from "../types";

type PatientRecordCardProps = {
  patient: Patient;
  onViewProfile: (profileId: string | null) => void;
};

export function PatientRecordCard({
  patient,
  onViewProfile,
}: PatientRecordCardProps) {
  const allergyAlerts = patient.conditions.filter((condition) =>
    condition.startsWith("Allergy:"),
  );
  const conditionAlerts = patient.conditions.filter(
    (condition) => !condition.startsWith("Allergy:"),
  );
  const visibleAlerts = [
    ...allergyAlerts.slice(0, 2),
    ...conditionAlerts,
  ].slice(0, 2);
  const remainingAlertCount = Math.max(
    0,
    patient.conditions.length - visibleAlerts.length,
  );
  const guardianLabel =
    patient.age < 18
      ? patient.guardianName ||
        patient.guardianRelationship ||
        patient.guardianNic ||
        null
      : null;
  const genderToneClass =
    patient.gender === "Male"
      ? "bg-sky-50 text-sky-700 ring-1 ring-sky-100"
      : patient.gender === "Female"
        ? "bg-rose-50 text-rose-700 ring-1 ring-rose-100"
        : "bg-violet-50 text-violet-700 ring-1 ring-violet-100";
  const nicProvided = patient.nic !== "No NIC";
  const phoneProvided = patient.mobile !== "Not provided";

  return (
    <article className="rounded-[22px] border border-white/60 bg-gradient-to-br from-white/95 via-white/90 to-sky-50/80 shadow-[0_12px_32px_rgba(15,23,42,0.08)] ring-1 ring-slate-100 backdrop-blur">
      <div className="flex flex-col gap-3 px-4 py-4 md:px-5 md:py-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 flex-1 flex-col gap-2.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="inline-flex max-w-full items-center gap-2 rounded-full bg-slate-700 px-3.5 py-2 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(71,85,105,0.25)]">
                {patient.patientCode || `#${patient.patientId ?? "--"}`}
                <span className="text-slate-300">|</span>
                <span className="truncate">{patient.name}</span>
              </div>
              <span className="inline-flex min-h-10 items-center rounded-full bg-amber-50/70 px-3.5 text-sm font-semibold text-amber-900 ring-1 ring-amber-100">
                Family: {patient.family}
              </span>
              <span
                className={`inline-flex min-h-10 items-center rounded-full px-3 text-[11px] font-semibold uppercase tracking-[0.18em] ${genderToneClass}`}
              >
                {patient.gender}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex min-h-10 items-center rounded-full px-3.5 text-sm font-semibold ring-1 ${
                  nicProvided
                    ? "bg-white/70 text-slate-800 ring-slate-100"
                    : "bg-white/70 text-orange-700 ring-slate-100"
                }`}
              >
                {nicProvided ? `NIC: ${patient.nic}` : "NIC: Not provided"}
              </span>
              <span className="inline-flex min-h-10 items-center rounded-full bg-slate-50 px-3.5 text-sm font-semibold text-slate-700 ring-1 ring-slate-100">
                Age: {patient.age}
              </span>
              <span className="inline-flex min-h-10 items-center rounded-full bg-slate-50 px-3.5 text-sm font-semibold text-slate-700 ring-1 ring-slate-100">
                Visits: {patient.visits}
              </span>
              <span
                className={`inline-flex min-h-10 items-center rounded-full px-3.5 text-sm font-semibold ring-1 ${
                  phoneProvided
                    ? "bg-white/70 text-slate-800 ring-slate-100"
                    : "bg-white/70 text-orange-700 ring-slate-100"
                }`}
              >
                {phoneProvided
                  ? `Phone: ${patient.mobile}`
                  : "Phone: Not provided"}
              </span>
              <span className="inline-flex min-h-10 items-center rounded-full bg-white/70 px-3.5 text-sm font-semibold text-slate-800 ring-1 ring-slate-100">
                Last visit: {patient.lastVisit}
              </span>
              {guardianLabel ? (
                <span className="inline-flex min-h-10 items-center rounded-full bg-amber-50 px-3.5 text-sm font-semibold text-amber-800 ring-1 ring-amber-100">
                  Guardian: {guardianLabel}
                </span>
              ) : null}
            </div>
          </div>

          {patient.profileId ? (
            <button
              type="button"
              onClick={() => onViewProfile(patient.profileId || null)}
              className="ios-button-primary shrink-0 self-start px-5 py-2.5 text-sm"
            >
              View patient profile
            </button>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {visibleAlerts.map((condition, index) => (
            <span
              key={`${condition}-${index}`}
              className="inline-flex min-h-9 items-center rounded-full bg-gradient-to-r from-rose-50 to-amber-50 px-3 py-1.5 text-[11px] font-semibold text-rose-700 ring-1 ring-rose-100"
            >
              {condition}
            </span>
          ))}
          {remainingAlertCount > 0 ? (
            <span className="inline-flex min-h-9 items-center rounded-full bg-slate-100 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-600 ring-1 ring-slate-200">
              +{remainingAlertCount} more
            </span>
          ) : null}
          {patient.nextAppointment ? (
            <span className="inline-flex min-h-9 items-center rounded-full bg-emerald-50 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700 ring-1 ring-emerald-100">
              Next: {patient.nextAppointment}
            </span>
          ) : null}
        </div>
      </div>
    </article>
  );
}
