import Image from "next/image";
import dayjs from "dayjs";
import FormControl from "@mui/material/FormControl";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { FiSearch } from "react-icons/fi";
import { appMuiPickerTextFieldProps, appMuiSelectSx } from "../../../components/ui/muiFieldStyles";
import type { GuardianCaptureMode, Patient, PatientGender } from "../types";

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

const compactPickerSx = {
  ...appMuiPickerTextFieldProps.sx,
  "& .MuiOutlinedInput-root": {
    ...appMuiPickerTextFieldProps.sx["& .MuiOutlinedInput-root"],
    minHeight: 38,
    height: 38,
    borderRadius: "0.75rem",
    boxShadow: "none",
    "@media (min-width:1280px)": {
      minHeight: 40,
      height: 40,
    },
  },
  "& .MuiOutlinedInput-notchedOutline": {
    borderRadius: "0.75rem",
  },
  "& .MuiInputBase-input": {
    ...appMuiPickerTextFieldProps.sx["& .MuiInputBase-input"],
    height: "38px",
    padding: "0 12px",
    "@media (min-width:1280px)": {
      height: "40px",
      padding: "0 14px",
    },
  },
  "& .MuiInputAdornment-root .MuiIconButton-root": {
    padding: "6px",
  },
} as const;

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
    "@media (min-width:1280px)": {
      minHeight: "40px",
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
};

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
}: DoctorHeaderProps) {
  const showSelectedPatientIdentity = Boolean(selectedPatientProfileId && !isCreatingPatientInline);
  const patientAge = getAgeFromDateOfBirth(patientDateOfBirth);
  const selectedQueuePatient =
    waitingQueuePatients.find((patient) => patient.profileId === selectedPatientProfileId) ?? null;
  const isAppointmentMode = workflowType === "appointment";
  const modeLabel = isAppointmentMode ? "Appointment Mode" : "Walk-In Mode";
  const modeToneClass = isAppointmentMode
    ? "bg-sky-50 text-sky-700 ring-sky-100"
    : "bg-emerald-50 text-emerald-700 ring-emerald-100";

  return (
    <div className="grid gap-2.5 p-2 sm:gap-3 sm:p-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:grid-rows-[auto_auto_auto] lg:items-start lg:gap-x-3 xl:gap-4 xl:p-4">
      <div className="relative min-w-0 w-full lg:col-start-1 lg:row-start-1 lg:max-w-[34rem] xl:max-w-[40rem] 2xl:max-w-[48rem]">
        <input
          className="h-9 w-full rounded-[999px] border border-slate-200 bg-white px-3.5 text-[13px] font-semibold text-slate-900 placeholder-slate-400 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100 xl:h-10 xl:px-4 xl:text-sm"
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
                    {patient.appointmentId ? " | Appointment" : " | Walk-in"}
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
      <div
        className={`flex justify-center lg:col-start-2 lg:row-start-1 lg:min-w-[13rem] lg:justify-end xl:min-w-[15rem] ${
          showSelectedPatientIdentity ? "lg:row-span-2" : "lg:row-span-1"
        }`}
      >
        <Image
          src="/assets/brand-logo.png"
          alt="Brand Logo"
          width={160}
          height={40}
          className="h-7 w-auto object-contain opacity-90 sm:h-8 xl:h-10"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2 lg:col-start-1 lg:row-start-2">
        <span className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] ring-1 ${modeToneClass}`}>
          {modeLabel}
        </span>
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
        {isCreatingPatientInline ? (
          <span className="rounded-full bg-amber-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-amber-700 ring-1 ring-amber-100">
            New patient draft
          </span>
        ) : null}
      </div>

      {isAppointmentMode && waitingQueuePatients.length > 0 ? (
        <div className="lg:col-span-2 lg:row-start-3">
          <div className="rounded-[24px] border border-sky-100 bg-sky-50/60 p-3 ring-1 ring-white/70">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-sky-700">
                  Appointment Queue
                </p>
                <p className="text-xs font-medium text-slate-600">
                  Waiting appointments are shown in queue order. Selecting one puts the doctor into appointment mode.
                </p>
              </div>
              <span className="rounded-full bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-sky-700 ring-1 ring-sky-100">
                {waitingQueuePatients.length} waiting
              </span>
            </div>
            <div className="mt-3 grid gap-2 xl:grid-cols-2">
              {waitingQueuePatients.map((patient) => {
                const isActive =
                  selectedPatientProfileId !== null &&
                  patient.profileId === selectedPatientProfileId &&
                  isAppointmentMode;

                return (
                  <button
                    key={`queue-${patient.appointmentId ?? patient.patientId ?? patient.nic}`}
                    type="button"
                    onClick={() => onSearchSelect(patient)}
                    className={`rounded-2xl border px-4 py-3 text-left transition ${
                      isActive
                        ? "border-sky-300 bg-white text-sky-900 shadow-[0_10px_24px_rgba(14,165,233,0.14)]"
                        : "border-white/80 bg-white/90 text-slate-800 hover:border-sky-200 hover:bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-sky-600 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-white">
                            #{patient.queueOrder ?? "-"}
                          </span>
                          <span className="truncate text-sm font-bold text-slate-900">
                            {patient.name}
                          </span>
                        </div>
                        <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                          {patient.reason || "Consultation"}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {patient.patientCode || patient.nic}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-2">
                        <span className="rounded-full bg-sky-50 px-3 py-1 text-[11px] font-semibold text-sky-700 ring-1 ring-sky-100">
                          {patient.time}
                        </span>
                        {patient.appointmentStatus ? (
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-700">
                            {patient.appointmentStatus.replace("_", " ")}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}

      {showSelectedPatientIdentity ? (
        <>
          <div className="grid gap-2.5 lg:col-start-1 lg:row-start-4 lg:grid-cols-[minmax(0,28rem)_minmax(0,1fr)] lg:items-center xl:grid-cols-[minmax(0,36rem)_minmax(0,1fr)] 2xl:grid-cols-[42rem_minmax(0,1fr)]">
            <div className="relative min-w-0">
              <input
                className="h-9 w-full rounded-[999px] border border-slate-200 bg-white px-3.5 pr-24 text-[13px] font-semibold text-slate-900 placeholder-slate-400 outline-none xl:h-10 xl:px-4 xl:text-sm"
                placeholder="NIC / guardian NIC"
                value={nicNumber}
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
                <span className="text-slate-900">{patientCode || "--"}</span>
              </div>
            </div>
          </div>

          <div className="grid gap-2.5 lg:col-span-2 lg:row-start-5 md:grid-cols-[minmax(0,1.4fr)_minmax(180px,0.7fr)]">
            <input
              className="h-9 rounded-xl border border-transparent bg-slate-50/50 px-3.5 text-[15px] font-bold text-slate-900 placeholder-slate-300 outline-none ring-1 ring-slate-200/50 transition sm:text-base xl:h-10 xl:px-4 xl:text-lg"
              placeholder="Patient Name"
              value={patientName}
              readOnly
            />
            <div className="relative">
              <input
                className="h-9 w-full rounded-xl border border-transparent bg-slate-50/50 px-3.5 pr-20 text-[13px] font-semibold text-slate-900 placeholder-slate-300 outline-none ring-1 ring-slate-200/50 transition xl:h-10 xl:px-4 xl:text-sm"
                placeholder="Date of Birth"
                value={patientDateOfBirth}
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
          <div className="grid gap-2.5 md:grid-cols-2 lg:grid-cols-3 lg:gap-3">
            <input
              className="h-9 rounded-xl border border-slate-200 bg-white px-3.5 text-[13px] font-semibold text-slate-900 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100 xl:h-10 xl:px-4 xl:text-sm"
              placeholder="First Name"
              value={patientFirstName}
              onChange={(e) => onPatientFirstNameChange(e.target.value)}
            />
            <input
              className="h-9 rounded-xl border border-slate-200 bg-white px-3.5 text-[13px] font-semibold text-slate-900 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100 xl:h-10 xl:px-4 xl:text-sm"
              placeholder="Last Name"
              value={patientLastName}
              onChange={(e) => onPatientLastNameChange(e.target.value)}
            />
            <div className="relative">
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  value={patientDateOfBirth ? dayjs(patientDateOfBirth) : null}
                  onChange={(value) =>
                    onPatientDateOfBirthChange(value ? value.format("YYYY-MM-DD") : "")
                  }
                  format="DD/MM/YYYY"
                  slotProps={{
                    textField: {
                      ...appMuiPickerTextFieldProps,
                      sx: {
                        ...compactPickerSx,
                      },
                    },
                  }}
                />
              </LocalizationProvider>
              {patientAge !== null ? (
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-sky-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-sky-700 ring-1 ring-sky-100">
                  {patientAge}y
                </span>
              ) : null}
            </div>
            <input
              className="h-9 rounded-xl border border-slate-200 bg-white px-3.5 text-[13px] font-semibold text-slate-900 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100 xl:h-10 xl:px-4 xl:text-sm"
              placeholder="NIC (optional)"
              value={nicNumber}
              onChange={(e) => onNicNumberChange(e.target.value)}
            />
            <input
              className="h-9 rounded-xl border border-slate-200 bg-white px-3.5 text-[13px] font-semibold text-slate-900 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100 xl:h-10 xl:px-4 xl:text-sm"
              placeholder="Phone (optional)"
              value={phoneNumber}
              onChange={(e) => onPhoneNumberChange(e.target.value)}
            />
            <div className="grid h-9 grid-cols-3 gap-2 self-stretch md:col-span-2 lg:col-span-1 xl:h-10">
              <button
                type="button"
                onClick={() => onGenderChange("Male")}
                className={`h-9 rounded-full text-[10px] font-semibold uppercase tracking-[0.11em] transition xl:h-10 xl:text-[11px] xl:tracking-[0.14em] ${
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
                className={`h-9 rounded-full text-[10px] font-semibold uppercase tracking-[0.11em] transition xl:h-10 xl:text-[11px] xl:tracking-[0.14em] ${
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
                className={`h-9 rounded-full text-[10px] font-semibold uppercase tracking-[0.11em] transition xl:h-10 xl:text-[11px] xl:tracking-[0.14em] ${
                  gender === "Unspecified"
                    ? "bg-slate-800 text-white shadow-[0_8px_18px_rgba(15,23,42,0.18)]"
                    : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                Unspecified
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
                            <div className="truncate font-semibold text-slate-900">{guardian.name}</div>
                            <div className="truncate text-[11px] text-slate-500">
                              {guardian.nic !== "No NIC" ? guardian.nic : guardian.phone || "No identity"}
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
                    onChange={(event) => onGuardianRelationshipChange(event.target.value)}
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
                      <div className="relative">
                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                          <DatePicker
                            value={guardianDateOfBirth ? dayjs(guardianDateOfBirth) : null}
                            onChange={(value) =>
                              onGuardianDateOfBirthChange(value ? value.format("YYYY-MM-DD") : "")
                            }
                            format="DD/MM/YYYY"
                            slotProps={{
                              textField: {
                                ...appMuiPickerTextFieldProps,
                                sx: compactPickerSx,
                              },
                            }}
                          />
                        </LocalizationProvider>
                      </div>
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
                              onGuardianGenderChange(event.target.value as PatientGender)
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
