import type React from "react";
import dayjs from "dayjs";
import FormControl from "@mui/material/FormControl";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import type { SelectChangeEvent } from "@mui/material/Select";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { FiPlus } from "react-icons/fi";
import type {
  AssistantFamilyOption,
  AssistantFormState,
  AssistantPatientOption,
} from "../types";
import {
  appMuiPickerTextFieldProps,
  appMuiSelectSx,
} from "../../../components/ui/muiFieldStyles";

type AssistantIntakePanelProps = {
  formState: AssistantFormState;
  setFormState: React.Dispatch<React.SetStateAction<AssistantFormState>>;
  patientOptions: AssistantPatientOption[];
  familyOptions: AssistantFamilyOption[];
  addAllergy: () => void;
  addPatient: () => void;
  onResetForm: () => void;
  fieldErrors?: Partial<
    Record<"firstName" | "lastName" | "dateOfBirth" | "nic" | "guardianNic" | "guardianContact" | "guardianName", string>
  >;
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
  "h-12 w-full rounded-[16px] border border-slate-200/90 bg-white/90 px-3 py-2 text-[0.75rem] font-medium text-slate-800 shadow-[inset_0_1px_2px_rgba(148,163,184,0.15),0_6px_16px_rgba(255,255,255,0.7)] outline-none transition placeholder:text-slate-400 focus:border-sky-300 focus:ring-3 focus:ring-sky-100 disabled:cursor-not-allowed disabled:bg-slate-100/80";
const sectionCardClassName =
  "space-y-2 rounded-[20px] border border-slate-200/90 bg-gradient-to-br from-white via-slate-50 to-sky-50/40 p-3 shadow-[0_12px_24px_rgba(148,163,184,0.08)] ring-1 ring-white/80";
const segmentedButtonClassName =
  "min-h-10 flex-1 rounded-full px-4 py-2 text-center text-xs font-semibold uppercase tracking-[0.16em] transition";
const priorityButtonClassName: Record<(typeof priorityLevels)[number], string> =
  {
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
  onResetForm,
  fieldErrors,
  canCreatePatients = true,
  patientActionDisabledReason = null,
  isSubmitting = false,
}: AssistantIntakePanelProps) {
  const age = calculateAge(formState.dateOfBirth);
  const isMinor = age !== null && age < 18;
  const selectedFamily = familyOptions.find(
    (family) => String(family.id) === formState.guardian.familyId,
  );
  const assistantFieldSx = {
    ...appMuiSelectSx,
    fontSize: "0.75rem",
    "& .MuiSelect-select": {
      ...appMuiSelectSx["& .MuiSelect-select"],
      fontSize: "0.75rem",
      paddingLeft: "0.75rem",
    },
  } as const;

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <div className="flex h-full min-h-0 flex-col">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">
            Add Patient to System
          </h2>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase text-slate-600">
            Pre-registration
          </span>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
          <div className="space-y-3 text-sm text-slate-800">
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-4">
          <input
            className={inputClassName}
            placeholder="First name"
            value={formState.firstName}
            disabled={!canCreatePatients}
            onChange={(e) =>
              setFormState((prev) => ({ ...prev, firstName: e.target.value }))
            }
          />
          {fieldErrors?.firstName ? (
            <p className="text-[11px] font-semibold text-rose-600">{fieldErrors.firstName}</p>
          ) : null}
          <input
            className={inputClassName}
            placeholder="Last name"
            value={formState.lastName}
            disabled={!canCreatePatients}
            onChange={(e) =>
              setFormState((prev) => ({ ...prev, lastName: e.target.value }))
            }
          />
          {fieldErrors?.lastName ? (
            <p className="text-[11px] font-semibold text-rose-600">{fieldErrors.lastName}</p>
          ) : null}
          <input
            className={inputClassName}
            placeholder="Mobile Number (Sri Lanka +94)"
            value={formState.mobile}
            disabled={!canCreatePatients}
            onChange={(e) =>
              setFormState((prev) => ({ ...prev, mobile: e.target.value }))
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
          {fieldErrors?.nic ? (
            <p className="text-[11px] font-semibold text-rose-600">{fieldErrors.nic}</p>
          ) : null}
          <DatePicker
            value={formState.dateOfBirth ? dayjs(formState.dateOfBirth) : null}
            disabled={!canCreatePatients}
            format="DD/MM/YYYY"
            onChange={(value) =>
              setFormState((prev) => ({
                ...prev,
                dateOfBirth: value?.isValid() ? value.format("YYYY-MM-DD") : "",
              }))
            }
            slotProps={{
              textField: {
                ...appMuiPickerTextFieldProps,
                placeholder: "dd/mm/yyyy",
                InputLabelProps: { shrink: false },
                sx: {
                  ...appMuiPickerTextFieldProps.sx,
                  "& .MuiOutlinedInput-root": {
                    ...appMuiPickerTextFieldProps.sx[
                      "& .MuiOutlinedInput-root"
                    ],
                    borderRadius: "16px",
                    fontSize: "0.75rem",
                    minHeight: "48px",
                  },
                  "& .MuiOutlinedInput-notchedOutline": {
                    ...appMuiPickerTextFieldProps.sx[
                      "& .MuiOutlinedInput-notchedOutline"
                    ],
                    borderRadius: "16px",
                  },
                  "& .MuiInputBase-input": {
                    ...appMuiPickerTextFieldProps.sx["& .MuiInputBase-input"],
                    fontSize: "0.75rem",
                  },
                },
              },
            }}
          />
          <div className="flex h-12 items-center rounded-[16px] border border-slate-200/90 bg-gradient-to-br from-slate-50 to-white px-3 py-2 text-[0.75rem] font-semibold text-slate-700 shadow-[inset_0_1px_2px_rgba(148,163,184,0.12),0_6px_16px_rgba(255,255,255,0.7)]">
            {age === null
              ? "Enter date of birth to calculate age"
              : `Age ${age} yrs`}
          </div>
          <input
            className={`${inputClassName} md:col-span-2 xl:col-span-2`}
            placeholder="Address"
            value={formState.address}
            disabled={!canCreatePatients}
            onChange={(e) =>
              setFormState((prev) => ({ ...prev, address: e.target.value }))
            }
          />
          {fieldErrors?.dateOfBirth ? (
            <p className="text-[11px] font-semibold text-rose-600">{fieldErrors.dateOfBirth}</p>
          ) : null}
        </div>

        <div className="grid gap-2 xl:grid-cols-2">
          <div className={sectionCardClassName}>
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">
                Family Link
              </h3>
            </div>
            <div className="grid gap-2 xl:grid-cols-2">
              <FormControl fullWidth>
                <Select
                  value={formState.guardian.familyId}
                  displayEmpty
                  disabled={!canCreatePatients}
                  onChange={(event: SelectChangeEvent) =>
                    setFormState((prev) => ({
                      ...prev,
                      guardian: {
                        ...prev.guardian,
                        familyId: event.target.value,
                        familyCode: event.target.value
                          ? ""
                          : prev.guardian.familyCode,
                      },
                    }))
                  }
                  renderValue={(selected) => {
                    if (!selected) {
                      return (
                        <span className="text-slate-400">
                          Family name
                        </span>
                      );
                    }
                    const family = familyOptions.find(
                      (entry) => String(entry.id) === selected,
                    );
                    return family
                      ? `${family.name}${family.familyCode ? ` | ${family.familyCode}` : ""}`
                      : selected;
                  }}
                  sx={assistantFieldSx}
                >
                  <MenuItem value="">Family name</MenuItem>
                  {familyOptions.map((family) => (
                    <MenuItem key={family.id} value={String(family.id)}>
                      {family.name}
                      {family.familyCode ? ` | ${family.familyCode}` : ""}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <input
                className={inputClassName}
                placeholder="Family code (optional)"
                value={formState.guardian.familyCode}
                disabled={
                  !canCreatePatients || Boolean(formState.guardian.familyId)
                }
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
            </div>
            <div className="rounded-[14px] border border-slate-200/90 bg-white/90 px-3 py-2 text-[11px] font-semibold text-slate-600">
              {selectedFamily
                ? `${selectedFamily.name}${selectedFamily.familyCode ? ` (${selectedFamily.familyCode})` : ""}`
                : formState.guardian.familyCode
                  ? `Using code: ${formState.guardian.familyCode}`
                  : "No family selected"}
            </div>
          </div>
          <div className="rounded-[20px] border border-rose-100/80 bg-gradient-to-br from-white to-rose-50/40 p-3 shadow-[0_10px_24px_rgba(251,113,133,0.06)]">
            <div className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">
              Allergy Notes
            </div>
            <div className="grid gap-2 xl:grid-cols-[minmax(0,1fr)_auto_auto]">
              <input
                className="h-12 w-full rounded-[16px] border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none placeholder:text-slate-400 focus:border-rose-300 focus:ring-3 focus:ring-rose-100"
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
              <div className="flex items-center gap-2">
                {allergySeverityOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    disabled={!canCreatePatients}
                    className={`min-h-10 min-w-16 rounded-full border px-3 text-[10px] font-semibold uppercase tracking-[0.1em] transition ${
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
              <button
                type="button"
                aria-label="Add allergy"
                className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-500 text-white shadow-[0_10px_22px_rgba(16,185,129,0.22)] transition hover:bg-emerald-600 disabled:opacity-70"
                onClick={addAllergy}
                disabled={isSubmitting || !canCreatePatients}
              >
                <FiPlus aria-hidden="true" className="h-5 w-5" />
              </button>
            </div>
            {formState.allergies.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {formState.allergies.map((allergy) => (
                  <span
                    key={`${allergy.name}-${allergy.severity}`}
                    className={`flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ring-1 ${
                      allergySeverityButtonClassName[allergy.severity].chip
                    }`}
                  >
                    <span className="max-w-[10rem] truncate">{allergy.name}</span>
                    <button
                      type="button"
                      className={`grid h-5 w-5 place-items-center rounded-full bg-white text-[11px] ring-1 transition ${
                        allergySeverityButtonClassName[allergy.severity].remove
                      }`}
                      disabled={!canCreatePatients}
                      onClick={() =>
                        setFormState((prev) => ({
                          ...prev,
                          allergies: prev.allergies.filter((entry) => entry.name !== allergy.name),
                        }))
                      }
                    >
                      x
                    </button>
                  </span>
                ))}
              </div>
            ) : null}
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
            <FormControl fullWidth>
              <Select
                value={formState.guardian.guardianPatientId}
                displayEmpty
                disabled={!canCreatePatients}
                onChange={(event: SelectChangeEvent) => {
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
                renderValue={(selected) => {
                  if (!selected) {
                    return (
                      <span className="text-slate-400">
                        Link existing guardian patient (recommended)
                      </span>
                    );
                  }
                  const patient = patientOptions.find(
                    (entry) => String(entry.id) === selected,
                  );
                  return patient
                    ? `${patient.name} | ${patient.patientCode || patient.nic || `Patient #${patient.id}`}`
                    : selected;
                }}
                sx={assistantFieldSx}
              >
                <MenuItem value="">
                  Link existing guardian patient (recommended)
                </MenuItem>
                {patientOptions.map((patient) => (
                  <MenuItem key={patient.id} value={String(patient.id)}>
                    {patient.name} |{" "}
                    {patient.patientCode ||
                      patient.nic ||
                      `Patient #${patient.id}`}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
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
              {fieldErrors?.guardianName ? (
                <p className="text-[11px] font-semibold text-rose-600 md:col-span-2">{fieldErrors.guardianName}</p>
              ) : null}
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
              {fieldErrors?.guardianNic ? (
                <p className="text-[11px] font-semibold text-rose-600 md:col-span-2">{fieldErrors.guardianNic}</p>
              ) : null}
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
              {fieldErrors?.guardianContact ? (
                <p className="text-[11px] font-semibold text-rose-600 md:col-span-2">{fieldErrors.guardianContact}</p>
              ) : null}
            </div>
          </div>
        ) : null}

        <div className="grid gap-2 xl:grid-cols-3">
          <div className="rounded-[20px] border border-slate-200/90 bg-white/90 p-3 shadow-[0_10px_24px_rgba(148,163,184,0.08)]">
            <div className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Gender
            </div>
            <div className="grid grid-cols-2 gap-2">
              {(["Male", "Female"] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  className={`${segmentedButtonClassName} min-h-10 ${
                    option === "Female"
                      ? "app-segment app-segment--female"
                      : "app-segment app-segment--male"
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

          <div className="rounded-[20px] border border-slate-200/90 bg-white/90 p-3 shadow-[0_10px_24px_rgba(148,163,184,0.08)]">
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

          <div className="rounded-[20px] border border-slate-200/90 bg-white/90 p-3 shadow-[0_10px_24px_rgba(148,163,184,0.08)]">
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

          </div>
        </div>
        <div className="mt-3 flex items-center justify-end gap-2 border-t border-slate-200/80 pt-3">
          <button
            type="button"
            onClick={onResetForm}
            disabled={isSubmitting || !canCreatePatients}
            className="app-button app-button--soft h-10 min-w-[160px] px-6 text-xs"
          >
            Reset data
          </button>
          <button
            type="button"
            onClick={addPatient}
            disabled={isSubmitting || !canCreatePatients}
            className="app-button app-button--primary h-10 min-w-[160px] px-6 text-xs"
          >
            {isSubmitting ? "Adding patient..." : "Add patient"}
          </button>
        </div>
        {!canCreatePatients && patientActionDisabledReason ? (
          <p className="mt-2 text-sm font-semibold text-amber-700">
            {patientActionDisabledReason}
          </p>
        ) : null}
      </div>
    </LocalizationProvider>
  );
}
