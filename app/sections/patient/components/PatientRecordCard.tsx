import { FiArrowUpRight, FiUser } from "react-icons/fi";
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
  const visibleAlerts = [...allergyAlerts.slice(0, 2), ...conditionAlerts].slice(0, 2);
  const remainingAlertCount = Math.max(0, patient.conditions.length - visibleAlerts.length);
  const guardianLabel =
    patient.age < 18
      ? patient.guardianName || patient.guardianRelationship || patient.guardianNic || null
      : null;
  const genderDot =
    patient.gender === "Male" ? "bg-sky-500" : patient.gender === "Female" ? "bg-rose-500" : "bg-violet-500";
  const nicProvided = patient.nic !== "No NIC";
  const phoneProvided = patient.mobile !== "Not provided";

  const meta: Array<{ label: string; value: string; warn?: boolean }> = [
    { label: "NIC", value: nicProvided ? patient.nic : "Not provided", warn: !nicProvided },
    { label: "Age", value: String(patient.age) },
    { label: "Visits", value: String(patient.visits) },
    { label: "Phone", value: phoneProvided ? patient.mobile : "Not provided", warn: !phoneProvided },
    { label: "Last visit", value: patient.lastVisit },
  ];

  return (
    <article className="rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-[0_4px_16px_rgba(15,23,42,0.05)] transition hover:border-sky-200 hover:shadow-[0_8px_24px_rgba(15,23,42,0.09)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {/* Name front and center */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${genderDot}`} aria-hidden="true" />
            <h3 className="truncate text-base font-bold text-slate-900">{patient.name}</h3>
            <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-semibold text-slate-500">
              {patient.patientCode || `#${patient.patientId ?? "--"}`}
            </span>
            <span className="rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
              {patient.family}
            </span>
          </div>

          {/* Compact meta line */}
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-slate-500">
            {meta.map((item) => (
              <span key={item.label} className="whitespace-nowrap">
                <span className="text-slate-400">{item.label}:</span>{" "}
                <span className={`font-semibold ${item.warn ? "text-orange-600" : "text-slate-700"}`}>
                  {item.value}
                </span>
              </span>
            ))}
            {guardianLabel ? (
              <span className="whitespace-nowrap">
                <span className="text-slate-400">Guardian:</span>{" "}
                <span className="font-semibold text-amber-700">{guardianLabel}</span>
              </span>
            ) : null}
          </div>

          {/* Alerts */}
          {visibleAlerts.length || patient.nextAppointment ? (
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {visibleAlerts.map((condition, index) => (
                <span
                  key={`${condition}-${index}`}
                  className="inline-flex items-center rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-700 ring-1 ring-rose-100"
                >
                  {condition}
                </span>
              ))}
              {remainingAlertCount > 0 ? (
                <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                  +{remainingAlertCount}
                </span>
              ) : null}
              {patient.nextAppointment ? (
                <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 ring-1 ring-emerald-100">
                  Next: {patient.nextAppointment}
                </span>
              ) : null}
            </div>
          ) : null}
        </div>

        {patient.profileId ? (
          <button
            type="button"
            onClick={() => onViewProfile(patient.profileId || null)}
            aria-label={`View patient profile for ${patient.name}`}
            className="group inline-flex shrink-0 items-center gap-1.5 self-center rounded-full border border-sky-200 bg-white px-3 py-1.5 text-[13px] font-semibold text-sky-700 transition hover:border-sky-300 hover:bg-sky-50"
          >
            <FiUser className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">View profile</span>
            <FiArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
          </button>
        ) : null}
      </div>
    </article>
  );
}
