import Image from "next/image";
import dayjs from "dayjs";
import { useEffect, useMemo, useState } from "react";
import FormControl from "@mui/material/FormControl";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import { FiRotateCcw, FiSearch } from "react-icons/fi";
import { appMuiSelectSx } from "../../../components/ui/muiFieldStyles";
import { ExpiryIndicator } from "./ExpiryIndicator";
import type {
  FamilyOption,
  GuardianCaptureMode,
  Patient,
  PatientGender,
} from "../types";

function getAgeFromDateOfBirth(dateOfBirth: string) {
  if (!dateOfBirth) {
    return null;
  }

  const dob = new Date(`${dateOfBirth}T00:00:00`);
  if (Number.isNaN(dob.getTime())) {
    return null;
  }

  const today = new Date();
  let years = today.getFullYear() - dob.getFullYear();
  const beforeBirthday =
    today.getMonth() < dob.getMonth() ||
    (today.getMonth() === dob.getMonth() && today.getDate() < dob.getDate());

  if (beforeBirthday) {
    years -= 1;
  }

  return years >= 0 ? years : null;
}

// Doctors enter a patient's age (in years) rather than an exact birthday — they need the
// age, not the precise DOB, and typing a number is far faster at the point of care.
// We persist this as a real date of birth (today minus N years) so the backend contract,
// which treats dateOfBirth as canonical, is unchanged. Whole-year age <-> DOB round-trips
// are stable, so the field can stay fully controlled off the stored dateOfBirth.
const MAX_AGE_YEARS = 150;

function dateOfBirthFromAgeYears(age: number) {
  return dayjs().subtract(age, "year").format("YYYY-MM-DD");
}

function AgePickerField({
  dateOfBirth,
  onDateOfBirthChange,
  className,
  ariaLabel,
}: {
  dateOfBirth: string;
  onDateOfBirthChange: (value: string) => void;
  className: string;
  ariaLabel: string;
}) {
  const age = getAgeFromDateOfBirth(dateOfBirth);
  return (
    <div className="relative">
      <input
        type="text"
        inputMode="numeric"
        autoComplete="off"
        maxLength={3}
        aria-label={ariaLabel}
        className={className}
        placeholder="Age in years"
        value={age !== null ? String(age) : ""}
        onChange={(event) => {
          const digits = event.target.value.replace(/\D/g, "").slice(0, 3);
          if (!digits) {
            onDateOfBirthChange("");
            return;
          }
          const parsed = Math.min(Number.parseInt(digits, 10), MAX_AGE_YEARS);
          onDateOfBirthChange(dateOfBirthFromAgeYears(parsed));
        }}
      />
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
        yrs
      </span>
    </div>
  );
}

const compactSelectSx = {
  ...appMuiSelectSx,
  minHeight: 38,
  height: 38,
  borderRadius: "0.75rem",
  boxShadow: "none",
  "@media (min-width:1280px)": {
    minHeight: 40,
    height: 40,
  },
  "& .MuiOutlinedInput-notchedOutline": {
    borderRadius: "0.75rem",
  },
  "& .MuiSelect-select": {
    ...appMuiSelectSx["& .MuiSelect-select"],
    minHeight: "38px",
    fontSize: "13px",
    fontWeight: 600,
    "@media (min-width:1280px)": {
      minHeight: "40px",
      fontSize: "13px",
    },
  },
} as const;

const compactSecondarySelectSx = {
  ...compactSelectSx,
  minHeight: 32,
  height: 32,
  "@media (min-width:1280px)": {
    minHeight: 36,
    height: 36,
  },
  "& .MuiSelect-select": {
    ...compactSelectSx["& .MuiSelect-select"],
    minHeight: "32px",
    paddingTop: 0,
    paddingBottom: 0,
    fontSize: "13px",
    fontWeight: 600,
    color: "#0f172a",
    "@media (min-width:1280px)": {
      minHeight: "36px",
      fontSize: "13px",
    },
  },
} as const;

type DoctorHeaderProps = {
  search: string;
  onSearchChange: (value: string) => void;
  onSearchCommit: () => void;
  searchMatches: Patient[];
  waitingQueuePatients: Patient[];
  onSearchSelect: (patient: Patient) => void;
  isCreatingPatientInline: boolean;
  patientLookupNotice?: string | null;
  selectedPatientProfileId?: string | null;
  workflowType?: "appointment" | "walk_in";
  patientCode: string;
  nicNumber: string;
  onNicNumberChange: (value: string) => void;
  phoneNumber: string;
  onPhoneNumberChange: (value: string) => void;
  gender: PatientGender;
  onGenderChange: (value: PatientGender) => void;
  patientName: string;
  patientFirstName: string;
  onPatientFirstNameChange: (value: string) => void;
  patientLastName: string;
  onPatientLastNameChange: (value: string) => void;
  patientDateOfBirth: string;
  onPatientDateOfBirthChange: (value: string) => void;
  familyOptions: FamilyOption[];
  selectedFamilyId: string;
  onSelectedFamilyIdChange: (value: string) => void;
  guardianName: string;
  onGuardianNameChange: (value: string) => void;
  guardianNic: string;
  onGuardianNicChange: (value: string) => void;
  guardianPhone: string;
  onGuardianPhoneChange: (value: string) => void;
  guardianRelationship: string;
  onGuardianRelationshipChange: (value: string) => void;
  guardianMode: GuardianCaptureMode;
  onGuardianModeChange: (value: GuardianCaptureMode) => void;
  guardianDateOfBirth: string;
  onGuardianDateOfBirthChange: (value: string) => void;
  guardianGender: PatientGender;
  onGuardianGenderChange: (value: PatientGender) => void;
  guardianSearch: string;
  onGuardianSearchChange: (value: string) => void;
  guardianSearchMatches: Patient[];
  selectedGuardian: Patient | null;
  onGuardianSelect: (patient: Patient) => void;
  requiresGuardianDetails: boolean;
  nicIdentityLabel?: "Patient NIC" | "Guardian NIC" | null;
  onClearForm?: () => void;
  canClearForm?: boolean;
  isStepUpMode?: boolean;
};

type QueueFilterKey = "all" | "waiting" | "in_consultation";

function normalizeQueueStatus(status: Patient["appointmentStatus"] | undefined) {
  const normalized = String(status ?? "waiting").toLowerCase();
  if (normalized === "in_consultation") return "in_consultation" as const;
  if (normalized === "completed") return "completed" as const;
  return "waiting" as const;
}

export function DoctorHeader({
  search,
  onSearchChange,
  onSearchCommit,
  searchMatches,
  waitingQueuePatients,
  onSearchSelect,
  isCreatingPatientInline,
  patientLookupNotice = null,
  selectedPatientProfileId = null,
  workflowType = "walk_in",
  patientCode,
  nicNumber,
  onNicNumberChange,
  phoneNumber,
  onPhoneNumberChange,
  gender,
  onGenderChange,
  patientName,
  patientFirstName,
  onPatientFirstNameChange,
  patientLastName,
  onPatientLastNameChange,
  patientDateOfBirth,
  onPatientDateOfBirthChange,
  familyOptions,
  selectedFamilyId,
  onSelectedFamilyIdChange,
  guardianName,
  onGuardianNameChange,
  guardianNic,
  onGuardianNicChange,
  guardianPhone,
  onGuardianPhoneChange,
  guardianRelationship,
  onGuardianRelationshipChange,
  guardianMode,
  onGuardianModeChange,
  guardianDateOfBirth,
  onGuardianDateOfBirthChange,
  guardianGender,
  onGuardianGenderChange,
  guardianSearch,
  onGuardianSearchChange,
  guardianSearchMatches,
  selectedGuardian,
  onGuardianSelect,
  requiresGuardianDetails,
  nicIdentityLabel = null,
  onClearForm,
  canClearForm = false,
  isStepUpMode = false,
}: DoctorHeaderProps) {
  const showSelectedPatientIdentity = Boolean(
    selectedPatientProfileId && !isCreatingPatientInline,
  );
  const patientAge = getAgeFromDateOfBirth(patientDateOfBirth);
  const queuePatients = useMemo(
    () =>
      waitingQueuePatients.filter(
        (patient) => normalizeQueueStatus(patient.appointmentStatus) !== "completed",
      ),
    [waitingQueuePatients],
  );
  const selectedQueuePatient =
    queuePatients.find(
      (patient) => patient.profileId === selectedPatientProfileId,
    ) ?? null;
  const [queueFilter, setQueueFilter] = useState<QueueFilterKey>("all");
  const [queueSearch, setQueueSearch] = useState("");
  const [queuePopupOpen, setQueuePopupOpen] = useState(false);
  const isAppointmentMode = workflowType === "appointment";
  const modeLabel = isStepUpMode
    ? "Step Up Mode"
    : isAppointmentMode
      ? "Appointment Mode"
      : "Walk-In Mode";
  const modeToneClass = isAppointmentMode
    ? "bg-sky-50 text-sky-700 ring-sky-100"
    : "bg-emerald-50 text-emerald-700 ring-emerald-100";
  const hasHeaderMetaRow =
    Boolean(selectedQueuePatient?.queueOrder) ||
    Boolean(selectedQueuePatient?.time) ||
    isCreatingPatientInline;
  const queueStatusCounts = useMemo(() => {
    const counts = {
      waiting: 0,
      in_consultation: 0,
    };

    queuePatients.forEach((patient) => {
      const status = normalizeQueueStatus(patient.appointmentStatus);
      if (status === "completed") {
        return;
      }
      counts[status] += 1;
    });

    return counts;
  }, [queuePatients]);
  const filteredQueuePatients = useMemo(() => {
    const normalizedSearch = queueSearch.trim().toLowerCase();
    return queuePatients.filter((patient) => {
      const status = normalizeQueueStatus(patient.appointmentStatus);
      if (status === "completed") {
        return false;
      }
      if (queueFilter !== "all" && status !== queueFilter) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const searchable = [
        patient.name,
        patient.reason,
        patient.patientCode,
        patient.nic,
        patient.guardianName,
        patient.guardianNic,
        patient.time,
        typeof patient.queueOrder === "number" ? String(patient.queueOrder) : "",
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchable.includes(normalizedSearch);
    });
  }, [queueFilter, queueSearch, queuePatients]);
  const queueFilterOptions: Array<{ key: QueueFilterKey; label: string; count: number }> = [
    {
      key: "all",
      label: "All",
      count: queuePatients.length,
    },
    {
      key: "waiting",
      label: "Waiting",
      count: queueStatusCounts.waiting,
    },
    {
      key: "in_consultation",
      label: "In Consultation",
      count: queueStatusCounts.in_consultation,
    },
  ];
  const hasMultipleQueuePatients = queuePatients.length > 1;
  const hasQueuePatients = queuePatients.length > 0;
  const resolvedPatientNo = useMemo(() => {
    const code = patientCode.trim();
    if (code) return code;
    if (selectedQueuePatient?.patientId !== undefined && selectedQueuePatient.patientId !== null) {
      return String(selectedQueuePatient.patientId);
    }
    if (selectedPatientProfileId?.trim()) return selectedPatientProfileId.trim();
    return "--";
  }, [patientCode, selectedQueuePatient?.patientId, selectedPatientProfileId]);
  const nicDisplayValue = nicNumber.trim() || "No NIC";
  const hasNicValue = nicNumber.trim().length > 0;
  const patientNameDisplay = patientName.trim() || "No patient name";
  const hasPatientName = patientName.trim().length > 0;
  const patientDobDisplay = patientDateOfBirth.trim() || "No date of birth";
  const hasPatientDob = patientDateOfBirth.trim().length > 0;
  const handleQueueSelect = (patient: Patient) => {
    onSearchSelect(patient);
    setQueuePopupOpen(false);
  };

  useEffect(() => {
    if (!isAppointmentMode || queuePatients.length === 0) {
      setQueuePopupOpen(false);
    }
  }, [isAppointmentMode, queuePatients.length]);

  return (
    <div className="grid gap-x-2.5 gap-y-1.5 p-2 sm:gap-x-3 sm:gap-y-2 sm:p-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start lg:gap-x-3 xl:gap-x-4 xl:p-4">
      <div className="min-w-0 w-full lg:col-start-1 lg:row-start-1">
        <div className="flex items-center gap-2 overflow-visible">
          <div className="relative min-w-0 flex-1">
            <input
              className="h-9 w-full rounded-[999px] border border-slate-200 bg-white px-3.5 text-[13px] font-semibold text-slate-900 placeholder:text-[13px] placeholder:font-semibold placeholder:text-slate-400 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100 xl:h-10 xl:px-4 xl:text-sm"
              placeholder="Search by name, patient code, NIC, or guardian"
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              onBlur={onSearchCommit}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  onSearchCommit();
                }
              }}
            />
            {search.trim() && searchMatches.length > 0 ? (
              <div className="absolute left-0 right-0 top-full z-[100] mt-2 max-h-60 overflow-y-auto rounded-2xl bg-white p-2 shadow-xl ring-1 ring-slate-200">
                {searchMatches.map((patient) => (
                  <button
                    key={`${patient.patientId ?? "unknown"}-${patient.appointmentId ?? patient.nic}`}
                    type="button"
                    onMouseDown={(event) => {
                      event.preventDefault();
                      onSearchSelect(patient);
                    }}
                    className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-[13px] text-slate-800 transition hover:bg-sky-50 xl:py-3 xl:text-sm"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        {typeof patient.queueOrder === "number" ? (
                          <span className="rounded-full bg-sky-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-white">
                            #{patient.queueOrder}
                          </span>
                        ) : null}
                        <div className="truncate text-sm font-semibold text-slate-900">
                          {patient.name}
                        </div>
                      </div>
                      <div className="truncate text-[11px] text-slate-500">
                        {patient.patientCode || patient.nic}
                        {patient.guardianNic
                          ? ` | Guardian ${patient.guardianNic}`
                          : ""}
                        {patient.appointmentId
                          ? " | Appointment"
                          : " | Walk-in"}
                      </div>
                    </div>
                    <span className="ml-3 rounded-full bg-sky-50 px-3 py-1 text-[11px] font-semibold text-sky-700 ring-1 ring-sky-100">
                      {patient.time}
                    </span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          <span
            className={`inline-flex h-9 shrink-0 items-center rounded-[999px] px-3.5 text-[11px] font-bold uppercase tracking-[0.16em] ring-1 xl:h-10 xl:px-4 ${modeToneClass}`}
          >
            {modeLabel}
          </span>
          {isAppointmentMode ? (
            <button
              type="button"
              onClick={() => hasQueuePatients && setQueuePopupOpen(true)}
              disabled={!hasQueuePatients}
              className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-[999px] px-3.5 text-[10px] font-extrabold uppercase tracking-[0.16em] ring-2 transition xl:h-10 xl:px-4 ${
                !hasQueuePatients
                  ? "cursor-not-allowed border border-slate-300 bg-slate-300/80 text-slate-700 ring-slate-200"
                  : hasMultipleQueuePatients
                    ? "border border-lime-600 bg-lime-500 text-slate-900 shadow-[0_10px_22px_rgba(132,204,22,0.34)] ring-lime-200 hover:-translate-y-0.5 hover:bg-lime-400"
                    : "border border-sky-500 bg-sky-600 text-white shadow-[0_10px_22px_rgba(14,116,144,0.32)] ring-sky-100 hover:-translate-y-0.5 hover:bg-sky-700"
              }`}
              title={hasQueuePatients ? "Open appointment queue" : "No patients in queue"}
            >
              <span
                aria-hidden="true"
                className={`inline-block h-1.5 w-1.5 rounded-full ${
                  !hasQueuePatients
                    ? "bg-slate-600/80 shadow-[0_0_0_3px_rgba(100,116,139,0.18)]"
                    : hasMultipleQueuePatients
                      ? "bg-lime-950 shadow-[0_0_0_3px_rgba(217,249,157,0.55)]"
                      : "bg-white shadow-[0_0_0_3px_rgba(255,255,255,0.28)]"
                }`}
              />
              Queue ({queuePatients.length})
            </button>
          ) : null}
          {isCreatingPatientInline ? (
            <span className="inline-flex h-9 shrink-0 items-center rounded-[999px] bg-amber-50 px-3.5 text-[11px] font-bold uppercase tracking-[0.16em] text-amber-700 ring-1 ring-amber-100 xl:h-10 xl:px-4">
              New patient draft
            </span>
          ) : null}
          {onClearForm && canClearForm ? (
            <button
              type="button"
              onClick={onClearForm}
              title="Clear all fields"
              className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-[999px] border border-rose-200 bg-white px-3.5 text-[10px] font-extrabold uppercase tracking-[0.16em] text-rose-600 transition hover:bg-rose-50 xl:h-10 xl:px-4"
            >
              <FiRotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              Clear
            </button>
          ) : null}
        </div>
      </div>
      <div
        className={`flex items-center justify-center gap-2 lg:col-start-2 lg:row-start-1 lg:min-w-[13rem] lg:justify-end xl:min-w-[15rem] ${
          showSelectedPatientIdentity ? "lg:row-span-2" : "lg:row-span-1"
        }`}
      >
        <ExpiryIndicator />
        <Image
          src="/assets/medlink-logo-optimized.png"
          alt="Medlink Logo"
          width={200}
          height={44}
          className="h-7 w-auto object-contain opacity-90 sm:h-8 xl:h-10"
        />
      </div>

      {hasHeaderMetaRow ? (
        <div className="flex flex-wrap items-center gap-2 lg:col-start-1 lg:row-start-2">
          {selectedQueuePatient?.queueOrder ? (
            <span className="rounded-full bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-700 ring-1 ring-slate-200">
              Queue #{selectedQueuePatient.queueOrder}
            </span>
          ) : null}
          {selectedQueuePatient?.time ? (
            <span className="rounded-full bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-700 ring-1 ring-slate-200">
              Time {selectedQueuePatient.time}
            </span>
          ) : null}
        </div>
      ) : null}

      {isAppointmentMode && queuePatients.length > 0 && queuePopupOpen ? (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/30 p-4"
          onClick={() => setQueuePopupOpen(false)}
        >
          <div
            className="w-full max-w-3xl rounded-2xl border border-sky-100 bg-white p-3 shadow-2xl ring-1 ring-white/80"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-sky-700">
                  Appointment Queue
                </p>
                <p className="text-[12px] font-medium text-slate-600">
                  Select a patient to continue. Queue popup closes automatically.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-sky-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-sky-700 ring-1 ring-sky-100">
                  {queuePatients.length} in queue
                </span>
                <button
                  type="button"
                  onClick={() => setQueuePopupOpen(false)}
                  className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-700 transition hover:bg-slate-50"
                >
                  Minimize
                </button>
              </div>
            </div>

            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              <div className="relative min-w-[220px] flex-1">
                <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  className="h-8 w-full rounded-full border border-slate-200 bg-white pl-9 pr-3 text-[12px] font-semibold text-slate-800 placeholder-slate-400 outline-none transition focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
                  placeholder="Search queue..."
                  value={queueSearch}
                  onChange={(event) => setQueueSearch(event.target.value)}
                />
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {queueFilterOptions.map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => setQueueFilter(option.key)}
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] transition ${
                      queueFilter === option.key
                        ? "bg-slate-800 text-white shadow-sm"
                        : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {option.label} {option.count}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-2.5 max-h-[56vh] overflow-y-auto pr-1 [scrollbar-width:thin] [scrollbar-color:#94a3b8_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-400/70 hover:[&::-webkit-scrollbar-thumb]:bg-slate-500/80">
              <div className="space-y-1.5">
                {filteredQueuePatients.length === 0 ? (
                  <p className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-[12px] font-semibold text-slate-500">
                    No patients match this queue filter.
                  </p>
                ) : null}
                {filteredQueuePatients.map((patient) => {
                  const isActive =
                    selectedPatientProfileId !== null &&
                    patient.profileId === selectedPatientProfileId &&
                    isAppointmentMode;
                  const displayIdentity =
                    patient.patientCode || (patient.nic && patient.nic !== "No NIC" ? patient.nic : "No NIC");
                  const normalizedStatus = normalizeQueueStatus(patient.appointmentStatus);
                  const statusLabel =
                    normalizedStatus === "in_consultation" ? "In Consultation" : "Waiting";

                  return (
                    <button
                      key={`queue-${patient.appointmentId ?? patient.patientId ?? patient.nic}`}
                      type="button"
                      onClick={() => handleQueueSelect(patient)}
                      className={`flex w-full items-center gap-2 rounded-xl border px-2.5 py-1.5 text-left transition ${
                        isActive
                          ? "border-sky-300 bg-white text-sky-900 shadow-[0_8px_18px_rgba(14,165,233,0.12)]"
                          : "border-slate-200 bg-white text-slate-800 hover:border-sky-200 hover:bg-sky-50/30"
                      }`}
                    >
                      <span className="shrink-0 rounded-full bg-sky-600 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em] text-white">
                        #{patient.queueOrder ?? "-"}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-semibold text-slate-900">
                          {patient.name}
                        </p>
                        <p className="truncate text-[11px] text-slate-500">
                          {patient.reason || "Consultation"} | {displayIdentity}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-semibold text-sky-700 ring-1 ring-sky-100">
                        {patient.time}
                      </span>
                      <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-700">
                        {statusLabel}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {showSelectedPatientIdentity ? (
        <>
          <div className="grid gap-2.5 lg:col-start-1 lg:row-start-4 lg:grid-cols-[minmax(0,28rem)_minmax(0,1fr)] lg:items-center xl:grid-cols-[minmax(0,36rem)_minmax(0,1fr)] 2xl:grid-cols-[42rem_minmax(0,1fr)]">
            <div className="relative min-w-0">
            <input
              className={`h-9 w-full rounded-[999px] border border-slate-200 bg-white px-3.5 pr-24 text-[13px] font-semibold outline-none xl:h-10 xl:px-4 xl:text-sm ${
                hasNicValue ? "text-slate-900" : "text-slate-500 italic"
              }`}
              placeholder="NIC / guardian NIC"
              value={nicDisplayValue}
              readOnly
            />
              {nicIdentityLabel ? (
                <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-sky-50 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-sky-700 ring-1 ring-sky-100">
                  {nicIdentityLabel}
                </span>
              ) : null}
            </div>
            <div className="flex min-w-0 flex-col items-start gap-2 lg:flex-row lg:items-center lg:gap-2">
              <div className="flex w-full flex-nowrap items-center gap-2 lg:w-auto">
                <button
                  type="button"
                  onClick={() => onGenderChange("Male")}
                  className={`app-segment app-segment--male ${gender === "Male" ? "is-active" : ""}`}
                >
                  Male
                </button>
                <button
                  type="button"
                  onClick={() => onGenderChange("Female")}
                  className={`app-segment app-segment--female ${gender === "Female" ? "is-active" : ""}`}
                >
                  Female
                </button>
              </div>
              <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400 lg:ml-auto lg:shrink-0 lg:whitespace-nowrap lg:pl-1 xl:tracking-[0.14em]">
                Patient No:{" "}
                <span className={`${resolvedPatientNo === "--" ? "italic text-slate-500" : "text-slate-900"}`}>
                  {resolvedPatientNo}
                </span>
              </div>
            </div>
          </div>

          <div className="grid gap-2.5 lg:col-span-2 lg:row-start-5 md:grid-cols-[minmax(0,1.4fr)_minmax(180px,0.7fr)]">
            <input
              className={`h-9 rounded-xl border border-transparent bg-slate-50/50 px-3.5 text-[13px] font-semibold placeholder:text-[13px] placeholder:font-semibold placeholder:text-slate-300 outline-none ring-1 ring-slate-200/50 transition xl:h-10 xl:px-4 ${
                hasPatientName ? "text-slate-900 not-italic" : "text-slate-500 italic"
              }`}
              placeholder="Patient Name"
              value={patientNameDisplay}
              readOnly
            />
            <div className="relative">
              <input
                className={`h-9 w-full rounded-xl border border-transparent bg-slate-50/50 px-3.5 pr-20 text-[13px] font-semibold placeholder:text-[13px] placeholder:font-semibold placeholder:text-slate-300 outline-none ring-1 ring-slate-200/50 transition xl:h-10 xl:px-4 xl:text-sm ${
                  hasPatientDob ? "text-slate-900 not-italic" : "text-slate-500 italic"
                }`}
                placeholder="Date of Birth"
                value={patientDobDisplay}
                readOnly
              />
              {patientAge !== null ? (
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-sky-50 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-sky-700 ring-1 ring-sky-100">
                  {patientAge}y
                </span>
              ) : null}
            </div>
          </div>
        </>
      ) : (
        <div className="space-y-3 lg:col-start-1 lg:col-span-2 lg:row-start-4 lg:space-y-4">
          {patientLookupNotice ? (
            <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
              {patientLookupNotice}
            </p>
          ) : null}
          <div className="grid gap-2.5 md:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_210px] lg:gap-3">
            <input
              className="h-9 rounded-xl border border-slate-200 bg-white px-3.5 text-[13px] font-semibold text-slate-900 placeholder:text-[13px] placeholder:font-semibold placeholder:text-slate-400 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100 xl:h-10 xl:px-4 xl:text-sm"
              placeholder="First Name"
              value={patientFirstName}
              onChange={(e) => onPatientFirstNameChange(e.target.value)}
            />
            <input
              className="h-9 rounded-xl border border-slate-200 bg-white px-3.5 text-[13px] font-semibold text-slate-900 placeholder:text-[13px] placeholder:font-semibold placeholder:text-slate-400 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100 xl:h-10 xl:px-4 xl:text-sm"
              placeholder="Last Name"
              value={patientLastName}
              onChange={(e) => onPatientLastNameChange(e.target.value)}
            />
            <AgePickerField
              dateOfBirth={patientDateOfBirth}
              onDateOfBirthChange={onPatientDateOfBirthChange}
              ariaLabel="Patient age in years"
              className="h-9 w-full rounded-xl border border-slate-200 bg-white pl-3.5 pr-11 text-[13px] font-semibold text-slate-900 placeholder:text-[13px] placeholder:font-semibold placeholder:text-slate-400 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100 xl:h-10 xl:pr-12 xl:text-sm"
            />
          </div>
          <div className="grid gap-2.5 md:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_210px] lg:gap-3">
            <div className="grid gap-2.5 md:grid-cols-2">
              <input
                className="h-8 rounded-xl border border-slate-200 bg-white px-3.5 text-[13px] font-semibold text-slate-900 placeholder:text-[13px] placeholder:font-semibold placeholder:text-slate-400 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100 xl:h-9 xl:px-4"
                placeholder="NIC"
                value={nicNumber}
                onChange={(e) => onNicNumberChange(e.target.value)}
              />
              <input
                className="h-8 rounded-xl border border-slate-200 bg-white px-3.5 text-[13px] font-semibold text-slate-900 placeholder:text-[13px] placeholder:font-semibold placeholder:text-slate-400 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100 xl:h-9 xl:px-4"
                placeholder="Phone"
                value={phoneNumber}
                onChange={(e) => onPhoneNumberChange(e.target.value)}
              />
            </div>
            {!requiresGuardianDetails ? (
              <FormControl fullWidth size="small">
                <Select
                  value={selectedFamilyId}
                  onChange={(event) =>
                    onSelectedFamilyIdChange(String(event.target.value))
                  }
                  displayEmpty
                  sx={compactSecondarySelectSx}
                >
                  <MenuItem value="">New family</MenuItem>
                  {familyOptions.map((family) => (
                    <MenuItem key={family.id} value={String(family.id)}>
                      {family.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            ) : (
              <div className="hidden lg:block" />
            )}
            <div className="grid h-8 grid-cols-3 gap-1 self-stretch xl:h-9">
              <button
                type="button"
                onClick={() => onGenderChange("Male")}
                className={`h-8 rounded-full px-1.5 text-[13px] font-semibold text-slate-900 transition xl:h-9 xl:px-2 ${
                  gender === "Male"
                    ? "border border-sky-300 bg-sky-50 text-sky-700 shadow-[0_8px_18px_rgba(14,165,233,0.12)]"
                    : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                Male
              </button>
              <button
                type="button"
                onClick={() => onGenderChange("Female")}
                className={`h-8 rounded-full px-1.5 text-[13px] font-semibold text-slate-900 transition xl:h-9 xl:px-2 ${
                  gender === "Female"
                    ? "border border-rose-300 bg-rose-50 text-rose-700 shadow-[0_8px_18px_rgba(244,63,94,0.12)]"
                    : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                Female
              </button>
              <button
                type="button"
                onClick={() => onGenderChange("Unspecified")}
                className={`h-8 rounded-full px-1.5 text-[13px] font-semibold text-slate-900 transition xl:h-9 xl:px-2 ${
                  gender === "Unspecified"
                    ? "bg-slate-800 text-white shadow-[0_8px_18px_rgba(15,23,42,0.18)]"
                    : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                Other
              </button>
            </div>
          </div>
          {requiresGuardianDetails ? (
            <div className="space-y-3 rounded-2xl border border-amber-200 bg-amber-50/70 p-3">
              <div className="grid gap-2.5 md:grid-cols-2 lg:grid-cols-3 lg:gap-3">
                <div className="relative">
                  <FiSearch className="pointer-events-none absolute left-4 top-1/2 z-[1] -translate-y-1/2 text-slate-400" />
                  <input
                    className="h-9 w-full rounded-xl border border-amber-200 bg-white px-10 text-[13px] font-semibold text-slate-900 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100 xl:h-10 xl:px-11 xl:text-sm"
                    placeholder="Search existing guardian"
                    value={guardianSearch}
                    onChange={(e) => onGuardianSearchChange(e.target.value)}
                  />
                  {guardianSearch.trim() && guardianSearchMatches.length > 0 ? (
                    <div className="absolute left-0 right-0 top-full z-[100] mt-2 max-h-56 overflow-y-auto rounded-2xl bg-white p-2 shadow-xl ring-1 ring-amber-200">
                      {guardianSearchMatches.map((guardian) => (
                        <button
                          key={`${guardian.patientId ?? guardian.nic}-${guardian.name}`}
                          type="button"
                          onMouseDown={(event) => {
                            event.preventDefault();
                            onGuardianSelect(guardian);
                          }}
                          className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-sm text-slate-800 transition hover:bg-amber-50"
                        >
                          <div className="min-w-0">
                            <div className="truncate font-semibold text-slate-900">
                              {guardian.name}
                            </div>
                            <div className="truncate text-[11px] text-slate-500">
                              {guardian.nic !== "No NIC"
                                ? guardian.nic
                                : guardian.phone || "No identity"}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
                <FormControl fullWidth size="small">
                  <Select
                    value={guardianRelationship}
                    onChange={(event) =>
                      onGuardianRelationshipChange(event.target.value)
                    }
                    displayEmpty
                    sx={compactSelectSx}
                  >
                    <MenuItem value="">Select relationship</MenuItem>
                    <MenuItem value="Mother">Mother</MenuItem>
                    <MenuItem value="Father">Father</MenuItem>
                    <MenuItem value="Grandmother">Grandmother</MenuItem>
                    <MenuItem value="Grandfather">Grandfather</MenuItem>
                    <MenuItem value="Sister">Sister</MenuItem>
                    <MenuItem value="Brother">Brother</MenuItem>
                    <MenuItem value="Aunt">Aunt</MenuItem>
                    <MenuItem value="Uncle">Uncle</MenuItem>
                    <MenuItem value="Guardian">Guardian</MenuItem>
                    <MenuItem value="Other">Other</MenuItem>
                  </Select>
                </FormControl>
                <div className="grid h-9 grid-cols-2 gap-2 md:col-span-2 lg:col-span-1 xl:h-10">
                  <button
                    type="button"
                    onClick={() => onGuardianModeChange("quick")}
                    className={`h-9 rounded-full px-3 text-[9px] font-semibold uppercase tracking-[0.11em] transition xl:h-10 xl:text-[10px] xl:tracking-[0.14em] ${
                      guardianMode === "quick"
                        ? "bg-amber-500 text-white shadow-[0_10px_20px_rgba(245,158,11,0.24)]"
                        : "border border-amber-200 bg-white text-amber-800 hover:bg-amber-50"
                    }`}
                  >
                    Quick Details
                  </button>
                  <button
                    type="button"
                    onClick={() => onGuardianModeChange("draft")}
                    className={`h-9 rounded-full px-3 text-[9px] font-semibold uppercase tracking-[0.11em] transition xl:h-10 xl:text-[10px] xl:tracking-[0.14em] ${
                      guardianMode === "draft"
                        ? "bg-sky-600 text-white shadow-[0_10px_20px_rgba(14,165,233,0.22)]"
                        : "border border-sky-200 bg-white text-sky-800 hover:bg-sky-50"
                    }`}
                  >
                    Create Fully
                  </button>
                </div>
              </div>
              {selectedGuardian ? (
                <div className="rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm font-semibold text-emerald-800 shadow-[0_10px_24px_rgba(16,185,129,0.08)]">
                  {selectedGuardian.name}
                  <div className="mt-1 text-xs font-medium text-emerald-700">
                    {selectedGuardian.nic !== "No NIC"
                      ? selectedGuardian.nic
                      : selectedGuardian.phone || "Existing guardian selected"}
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid gap-2.5 md:grid-cols-2 lg:grid-cols-3 lg:gap-3">
                    <input
                      className="h-9 rounded-xl border border-amber-200 bg-white px-3.5 text-[13px] font-semibold text-slate-900 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100 xl:h-10 xl:px-4 xl:text-sm"
                      placeholder="Guardian Full Name"
                      value={guardianName}
                      onChange={(e) => onGuardianNameChange(e.target.value)}
                    />
                    {guardianMode === "draft" ? (
                      <AgePickerField
                        dateOfBirth={guardianDateOfBirth}
                        onDateOfBirthChange={onGuardianDateOfBirthChange}
                        ariaLabel="Guardian age in years"
                        className="h-9 w-full rounded-xl border border-amber-200 bg-white pl-3.5 pr-11 text-[13px] font-semibold text-slate-900 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100 xl:h-10 xl:pr-12 xl:text-sm"
                      />
                    ) : (
                      <input
                        className="h-9 rounded-xl border border-amber-200 bg-white px-3.5 text-[13px] font-semibold text-slate-900 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100 xl:h-10 xl:px-4 xl:text-sm"
                        placeholder="Guardian NIC"
                        value={guardianNic}
                        onChange={(e) => onGuardianNicChange(e.target.value)}
                      />
                    )}
                    {guardianMode === "draft" ? (
                      <div className="grid grid-cols-2 gap-2">
                        <FormControl fullWidth size="small">
                          <Select
                            value={guardianGender}
                            onChange={(event) =>
                              onGuardianGenderChange(
                                event.target.value as PatientGender,
                              )
                            }
                            sx={compactSelectSx}
                          >
                            <MenuItem value="Female">Female</MenuItem>
                            <MenuItem value="Male">Male</MenuItem>
                            <MenuItem value="Unspecified">Unspecified</MenuItem>
                          </Select>
                        </FormControl>
                        <input
                          className="h-9 rounded-xl border border-amber-200 bg-white px-3.5 text-[13px] font-semibold text-slate-900 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100 xl:h-10 xl:px-4 xl:text-sm"
                          placeholder="Guardian NIC"
                          value={guardianNic}
                          onChange={(e) => onGuardianNicChange(e.target.value)}
                        />
                      </div>
                    ) : null}
                    <input
                      className="h-9 rounded-xl border border-amber-200 bg-white px-3.5 text-[13px] font-semibold text-slate-900 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100 md:col-span-2 xl:h-10 xl:px-4 xl:text-sm lg:col-span-1"
                      placeholder="Guardian Phone"
                      value={guardianPhone}
                      onChange={(e) => onGuardianPhoneChange(e.target.value)}
                    />
                  </div>
                </>
              )}
            </div>
          ) : null}
          <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500 xl:text-[11px] xl:tracking-[0.18em]">
            {isCreatingPatientInline
              ? "Quick-create mode is active. Save Consultation will create the patient and consultation in one request."
              : "Search for an existing patient or enter quick-create details to continue."}
          </div>
        </div>
      )}
    </div>
  );
}
