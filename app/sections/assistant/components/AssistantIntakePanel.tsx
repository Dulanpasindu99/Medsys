import type React from "react";
import type {
  AssistantFamilyOption,
  AssistantFormState,
  AssistantPatientOption,
} from "../types";

type AssistantIntakePanelProps = {
  formState: AssistantFormState;
  setFormState: React.Dispatch<React.SetStateAction<AssistantFormState>>;
  patientOptions: AssistantPatientOption[];
  familyOptions: AssistantFamilyOption[];
  addAllergy: () => void;
  addPatient: () => void;
  canCreatePatients?: boolean;
  patientActionDisabledReason?: string | null;
  isSubmitting?: boolean;
};

const bloodGroups = ["A+", "A-", "B+", "O+", "AB+"] as const;
const priorityLevels = ["Normal", "Urgent", "Critical"] as const;
const allergySeverityOptions = [
  { value: "low", label: "Low" },
  { value: "moderate", label: "Medium" },
  { value: "high", label: "High" },
] as const;
const inputClassName =
  "min-h-14 w-full rounded-[20px] border border-slate-200/90 bg-white/90 px-4 py-3 text-sm font-medium text-slate-800 shadow-[inset_0_1px_2px_rgba(148,163,184,0.18),0_8px_20px_rgba(255,255,255,0.75)] outline-none transition placeholder:text-slate-400 focus:border-sky-300 focus:ring-4 focus:ring-sky-100 disabled:cursor-not-allowed disabled:bg-slate-100/80";
const sectionCardClassName =
  "space-y-3 rounded-[26px] border border-slate-200/90 bg-gradient-to-br from-white via-slate-50 to-sky-50/40 p-4 shadow-[0_18px_38px_rgba(148,163,184,0.08)] ring-1 ring-white/80";
const segmentedButtonClassName =
  "min-h-10 flex-1 rounded-full px-4 py-2 text-center text-xs font-semibold uppercase tracking-[0.16em] transition";
const priorityButtonClassName: Record<(typeof priorityLevels)[number], string> = {
  Normal: "app-priority app-priority--normal",
  Urgent: "app-priority app-priority--urgent",
  Critical: "app-priority app-priority--critical",
};
const allergySeverityButtonClassName = {
  low: {
    active:
      "border-emerald-500 bg-emerald-500 text-white shadow-[0_10px_22px_rgba(16,185,129,0.22)]",
    idle: "border-emerald-100 bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
    chip: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    badge: "bg-white/90 text-emerald-600 ring-emerald-100",
    remove: "text-emerald-600 ring-emerald-100 hover:bg-emerald-100",
  },
  moderate: {
    active:
      "border-amber-500 bg-amber-500 text-white shadow-[0_10px_22px_rgba(245,158,11,0.22)]",
    idle: "border-amber-100 bg-amber-50 text-amber-700 hover:bg-amber-100",
    chip: "bg-amber-50 text-amber-700 ring-amber-100",
    badge: "bg-white/90 text-amber-600 ring-amber-100",
    remove: "text-amber-600 ring-amber-100 hover:bg-amber-100",
  },
  high: {
    active:
      "border-rose-500 bg-rose-500 text-white shadow-[0_10px_22px_rgba(244,63,94,0.22)]",
    idle: "border-rose-100 bg-rose-50 text-rose-700 hover:bg-rose-100",
    chip: "bg-rose-50 text-rose-700 ring-rose-100",
    badge: "bg-white/90 text-rose-600 ring-rose-100",
    remove: "text-rose-600 ring-rose-100 hover:bg-rose-100",
  },
} as const;

function calculateAge(dateOfBirth: string) {
  if (!dateOfBirth) return null;
  const dob = new Date(`${dateOfBirth}T00:00:00.000Z`);
  if (Number.isNaN(dob.getTime())) return null;
  const today = new Date();
  let years = today.getUTCFullYear() - dob.getUTCFullYear();
  const beforeBirthday =
    today.getUTCMonth() < dob.getUTCMonth() ||
    (today.getUTCMonth() === dob.getUTCMonth() &&
      today.getUTCDate() < dob.getUTCDate());
  if (beforeBirthday) years -= 1;
  return years;
}

export function AssistantIntakePanel({
  formState,
  setFormState,
  patientOptions,
  familyOptions,
  addAllergy,
  addPatient,
  canCreatePatients = true,
  patientActionDisabledReason = null,
  isSubmitting = false,
}: AssistantIntakePanelProps) {
  const age = calculateAge(formState.dateOfBirth);
  const isMinor = age !== null && age < 18;
  const selectedFamily = familyOptions.find(
    (family) => String(family.id) === formState.guardian.familyId
  );

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">
          Add Patient to System
        </h2>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase text-slate-600">
          Pre-registration
        </span>
      </div>
      <div className="space-y-4 text-sm text-slate-800">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <input
            className={inputClassName}
            placeholder="First name"
            value={formState.firstName}
            disabled={!canCreatePatients}
            onChange={(e) =>
              setFormState((prev) => ({ ...prev, firstName: e.target.value }))
            }
          />
          <input
            className={inputClassName}
            placeholder="Last name"
            value={formState.lastName}
            disabled={!canCreatePatients}
            onChange={(e) =>
              setFormState((prev) => ({ ...prev, lastName: e.target.value }))
            }
          />
          <input
            type="date"
            className={inputClassName}
            value={formState.dateOfBirth}
            disabled={!canCreatePatients}
            onChange={(e) =>
              setFormState((prev) => ({ ...prev, dateOfBirth: e.target.value }))
            }
          />
          <input
            className={inputClassName}
            placeholder={
              isMinor ? "Patient NIC (optional for minors)" : "Patient NIC"
            }
            value={formState.nic}
            disabled={!canCreatePatients}
            onChange={(e) =>
              setFormState((prev) => ({ ...prev, nic: e.target.value }))
            }
          />
          <input
            className={inputClassName}
            placeholder="Mobile Number (Sri Lanka +94)"
            value={formState.mobile}
            disabled={!canCreatePatients}
            onChange={(e) =>
              setFormState((prev) => ({ ...prev, mobile: e.target.value }))
            }
          />
          <div className="flex min-h-14 items-center rounded-[20px] border border-slate-200/90 bg-gradient-to-br from-slate-50 to-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-[inset_0_1px_2px_rgba(148,163,184,0.12),0_8px_20px_rgba(255,255,255,0.7)]">
            {age === null
              ? "Enter date of birth to calculate age"
              : `Age ${age} yrs`}
          </div>
          <input
            className={`${inputClassName} md:col-span-2`}
            placeholder="Address"
            value={formState.address}
            disabled={!canCreatePatients}
            onChange={(e) =>
              setFormState((prev) => ({ ...prev, address: e.target.value }))
            }
          />
        </div>

        <div className={sectionCardClassName}>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Family Link
            </h3>
            <p className="mt-1 text-xs leading-5 text-slate-600">
              Pick an existing family by name, use a known family code, or
              leave this blank and let the backend create a family
              automatically.
            </p>
          </div>
          <select
            value={formState.guardian.familyId}
            disabled={!canCreatePatients}
            onChange={(event) =>
              setFormState((prev) => ({
                ...prev,
                guardian: {
                  ...prev.guardian,
                  familyId: event.target.value,
                  familyCode: event.target.value ? "" : prev.guardian.familyCode,
                },
              }))
            }
            className={inputClassName}
          >
            <option value="">Select existing family by name</option>
            {familyOptions.map((family) => (
              <option key={family.id} value={String(family.id)}>
                {family.name}
                {family.familyCode ? ` | ${family.familyCode}` : ""}
              </option>
            ))}
          </select>
          <input
            className={inputClassName}
            placeholder="Known family code (optional)"
            value={formState.guardian.familyCode}
            disabled={!canCreatePatients || Boolean(formState.guardian.familyId)}
            onChange={(e) =>
              setFormState((prev) => ({
                ...prev,
                guardian: {
                  ...prev.guardian,
                  familyCode: e.target.value.toUpperCase(),
                  familyId: "",
                },
              }))
            }
          />
          <div className="rounded-[20px] border border-slate-200/90 bg-white/90 px-4 py-3 text-xs font-semibold leading-5 text-slate-600 shadow-[inset_0_1px_2px_rgba(148,163,184,0.12)]">
            {selectedFamily
              ? `${selectedFamily.name} will be linked for this registration${
                  selectedFamily.familyCode
                    ? ` (${selectedFamily.familyCode})`
                    : ""
                }.`
              : formState.guardian.familyCode
                ? `Family code ${formState.guardian.familyCode} will be sent with registration.`
                : "No family selected yet. Backend will create one automatically if needed."}
          </div>
        </div>

        <div className="rounded-[24px] border border-slate-200/90 bg-white/90 p-3 shadow-[0_14px_32px_rgba(148,163,184,0.08)]">
          <div className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Gender
          </div>
          <div className="grid grid-cols-2 gap-2">
            {(["Male", "Female"] as const).map((option) => (
              <button
                key={option}
                type="button"
                className={`${segmentedButtonClassName} ${
                  option === "Female" ? "app-segment app-segment--female" : "app-segment app-segment--male"
                } ${formState.gender === option ? "is-active" : ""}`}
                disabled={!canCreatePatients}
                onClick={() =>
                  setFormState((prev) => ({ ...prev, gender: option }))
                }
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        {isMinor ? (
          <div className="space-y-3 rounded-[26px] border border-amber-100/90 bg-gradient-to-br from-amber-50 via-white to-amber-50/60 p-4 shadow-[0_18px_38px_rgba(245,158,11,0.08)] ring-1 ring-white/80">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Guardian Details
                </h3>
                <p className="text-xs text-slate-600">
                  For minors, link an existing guardian patient or capture
                  guardian contact details.
                </p>
              </div>
              <span className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-700 ring-1 ring-amber-200">
                Child flow
              </span>
            </div>
            <select
              value={formState.guardian.guardianPatientId}
              disabled={!canCreatePatients}
              onChange={(event) => {
                const selectedId = event.target.value;
                const selectedGuardian = patientOptions.find(
                  (patient) => String(patient.id) === selectedId,
                );
                setFormState((prev) => ({
                  ...prev,
                  guardian: {
                    ...prev.guardian,
                    guardianPatientId: selectedId,
                    guardianName: selectedId
                      ? (selectedGuardian?.name ?? prev.guardian.guardianName)
                      : prev.guardian.guardianName,
                    guardianNic: selectedId
                      ? (selectedGuardian?.nic ?? prev.guardian.guardianNic)
                      : prev.guardian.guardianNic,
                    familyId:
                      selectedId && selectedGuardian?.familyId
                        ? String(selectedGuardian.familyId)
                        : "",
                    familyCode: selectedId ? "" : prev.guardian.familyCode,
                  },
                }));
              }}
              className={inputClassName}
            >
              <option value="">
                Link existing guardian patient (recommended)
              </option>
              {patientOptions.map((patient) => (
                <option key={patient.id} value={String(patient.id)}>
                  {patient.name} |{" "}
                  {patient.patientCode ||
                    patient.nic ||
                    `Patient #${patient.id}`}
                </option>
              ))}
            </select>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <input
                className={inputClassName}
                placeholder="Guardian name"
                value={formState.guardian.guardianName}
                disabled={!canCreatePatients}
                onChange={(e) =>
                  setFormState((prev) => ({
                    ...prev,
                    guardian: {
                      ...prev.guardian,
                      guardianName: e.target.value,
                    },
                  }))
                }
              />
              <input
                className={inputClassName}
                placeholder="Guardian relationship"
                value={formState.guardian.guardianRelationship}
                disabled={!canCreatePatients}
                onChange={(e) =>
                  setFormState((prev) => ({
                    ...prev,
                    guardian: {
                      ...prev.guardian,
                      guardianRelationship: e.target.value,
                    },
                  }))
                }
              />
              <input
                className={inputClassName}
                placeholder="Guardian NIC"
                value={formState.guardian.guardianNic}
                disabled={!canCreatePatients}
                onChange={(e) =>
                  setFormState((prev) => ({
                    ...prev,
                    guardian: { ...prev.guardian, guardianNic: e.target.value },
                  }))
                }
              />
              <input
                className={inputClassName}
                placeholder="Guardian phone (+94)"
                value={formState.guardian.guardianPhone}
                disabled={!canCreatePatients}
                onChange={(e) =>
                  setFormState((prev) => ({
                    ...prev,
                    guardian: {
                      ...prev.guardian,
                      guardianPhone: e.target.value,
                    },
                  }))
                }
              />
              <div className="rounded-[20px] border border-slate-200/90 bg-white/90 px-4 py-3 text-xs font-semibold leading-5 text-slate-600 shadow-[inset_0_1px_2px_rgba(148,163,184,0.12)] md:col-span-2">
                {formState.guardian.familyId
                  ? `Linked to ${
                      selectedFamily?.name ??
                      `family ID ${formState.guardian.familyId}`
                    } from the selected guardian`
                  : formState.guardian.familyCode
                    ? `Family code ${formState.guardian.familyCode} will be sent with registration`
                    : "No family selected yet. Backend will create one automatically if needed."}
              </div>
            </div>
          </div>
        ) : null}

        <div className="rounded-[24px] border border-rose-100/80 bg-gradient-to-br from-white to-rose-50/40 p-4 shadow-[0_14px_30px_rgba(251,113,133,0.06)]">
          <div className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Allergy Notes
          </div>
          <div className="space-y-3">
            {formState.allergies.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {formState.allergies.map((allergy) => (
                  <span
                    key={`${allergy.name}-${allergy.severity}`}
                    className={`flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold ring-1 ${
                      allergySeverityButtonClassName[allergy.severity].chip
                    }`}
                  >
                    <span className="max-w-[10rem] truncate">{allergy.name}</span>
                    <span
                      className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em] ring-1 ${
                        allergySeverityButtonClassName[allergy.severity].badge
                      }`}
                    >
                      {allergy.severity}
                    </span>
                    <button
                      type="button"
                      className={`grid h-5 w-5 place-items-center rounded-full bg-white text-[11px] ring-1 transition ${
                        allergySeverityButtonClassName[allergy.severity].remove
                      }`}
                      disabled={!canCreatePatients}
                      onClick={() =>
                        setFormState((prev) => ({
                          ...prev,
                          allergies: prev.allergies.filter(
                            (entry) => entry.name !== allergy.name,
                          ),
                        }))
                      }
                    >
                      x
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <div className="rounded-[18px] border border-dashed border-rose-100 bg-white/70 px-4 py-3 text-xs font-medium text-slate-500">
                No allergies added yet. Add an allergy name, choose the severity, and save it here.
              </div>
            )}

            <div className="rounded-[22px] border border-white/80 bg-slate-100/85 p-3 shadow-[inset_0_1px_2px_rgba(148,163,184,0.08)]">
              <div className="flex min-h-12 items-center rounded-[18px] bg-white px-4 shadow-[inset_0_1px_2px_rgba(148,163,184,0.08)] ring-1 ring-slate-100">
                <span className="mr-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                  Allergy
                </span>
                <input
                  className="w-full min-w-0 bg-transparent text-sm font-medium text-slate-700 outline-none placeholder:text-slate-400"
                  placeholder="Enter allergy name"
                  value={formState.allergyInput}
                  disabled={!canCreatePatients}
                  onChange={(e) =>
                    setFormState((prev) => ({
                      ...prev,
                      allergyInput: e.target.value,
                    }))
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addAllergy();
                    }
                  }}
                />
              </div>

              <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-2">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Severity
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {allergySeverityOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        disabled={!canCreatePatients}
                        className={`min-h-10 min-w-20 rounded-full border px-4 text-[11px] font-semibold uppercase tracking-[0.14em] transition ${
                          formState.allergySeverity === option.value
                            ? allergySeverityButtonClassName[option.value].active
                            : allergySeverityButtonClassName[option.value].idle
                        }`}
                        onClick={() =>
                          setFormState((prev) => ({
                            ...prev,
                            allergySeverity: option.value,
                          }))
                        }
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  className="min-h-11 rounded-full bg-emerald-500 px-5 text-[11px] font-semibold uppercase tracking-[0.14em] text-white shadow-[0_10px_22px_rgba(16,185,129,0.22)] transition hover:bg-emerald-600 disabled:opacity-70 lg:min-w-36"
                  onClick={addAllergy}
                  disabled={isSubmitting || !canCreatePatients}
                >
                  Add Allergy
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="rounded-[24px] border border-slate-200/90 bg-white/90 p-3 shadow-[0_14px_32px_rgba(148,163,184,0.08)]">
            <div className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Blood Group
            </div>
            <div className="grid grid-cols-5 gap-2">
              {bloodGroups.map((group) => (
                <button
                  key={group}
                  type="button"
                  className={`${segmentedButtonClassName} min-h-11 px-0 text-sm tracking-normal ${
                    formState.bloodGroup === group
                      ? "bg-slate-700 text-white shadow-[0_12px_24px_rgba(71,85,105,0.22)]"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                  disabled={!canCreatePatients}
                  onClick={() =>
                    setFormState((prev) => ({ ...prev, bloodGroup: group }))
                  }
                >
                  {group}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-[24px] border border-slate-200/90 bg-white/90 p-3 shadow-[0_14px_32px_rgba(148,163,184,0.08)]">
            <div className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Priority Level
            </div>
            <div className="grid grid-cols-3 gap-2">
              {priorityLevels.map((level) => (
                <button
                key={level}
                type="button"
                className={`${priorityButtonClassName[level]} w-full min-h-11 tracking-normal ${
                  formState.priority === level ? "is-active" : ""
                }`}
                disabled={!canCreatePatients}
                  onClick={() =>
                    setFormState((prev) => ({ ...prev, priority: level }))
                  }
                >
                  {level}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="pt-1">
          <button
            type="button"
            onClick={addPatient}
            disabled={isSubmitting || !canCreatePatients}
            className="app-button app-button--primary app-button--full"
          >
            {isSubmitting ? "Adding patient..." : "Add Patient"}
          </button>
        </div>
        {!canCreatePatients && patientActionDisabledReason ? (
          <p className="text-sm font-semibold text-amber-700">
            {patientActionDisabledReason}
          </p>
        ) : null}
      </div>
    </>
  );
}
