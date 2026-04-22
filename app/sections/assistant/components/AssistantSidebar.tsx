import type React from "react";
import { useMemo, useState } from "react";
import dayjs from "dayjs";
import FormControl from "@mui/material/FormControl";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import type { SelectChangeEvent } from "@mui/material/Select";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import type {
  AssistantDoctorAvailability,
  AssistantPatientOption,
  AssistantScheduleFormState,
  CompletedPatient,
} from "../types";
import {
  appMuiPickerTextFieldProps,
  appMuiSelectSx,
} from "../../../components/ui/muiFieldStyles";

type AssistantSidebarProps = {
  availableDoctors: AssistantDoctorAvailability[];
  patientOptions: AssistantPatientOption[];
  scheduleForm: AssistantScheduleFormState;
  onScheduleFormChange: React.Dispatch<React.SetStateAction<AssistantScheduleFormState>>;
  onScheduleAppointment: () => void;
  onResetScheduleForm?: () => void;
  scheduleFieldErrors?: Partial<Record<"patientId" | "doctorId" | "scheduledAt" | "reason", string>>;
  canCreateAppointments?: boolean;
  appointmentActionDisabledReason?: string | null;
  isScheduling?: boolean;
  completedSearch: string;
  onCompletedSearchChange: (value: string) => void;
  filteredCompleted: CompletedPatient[];
  onOpenProfile: (profileId?: string | null) => void;
  isLoading?: boolean;
  showSchedulingPanel?: boolean;
  showAvailableDoctors?: boolean;
  title?: string;
  fullHeight?: boolean;
  showCompletedList?: boolean;
};

export function AssistantSidebar({
  availableDoctors,
  patientOptions,
  scheduleForm,
  onScheduleFormChange,
  onScheduleAppointment,
  onResetScheduleForm,
  scheduleFieldErrors,
  canCreateAppointments = true,
  appointmentActionDisabledReason = null,
  isScheduling = false,
  completedSearch,
  onCompletedSearchChange,
  filteredCompleted,
  onOpenProfile,
  isLoading = false,
  showSchedulingPanel = true,
  showAvailableDoctors = true,
  title = "Completed Patient List",
  fullHeight = false,
  showCompletedList = true,
}: AssistantSidebarProps) {
  const [rowsPerPage, setRowsPerPage] = useState("5");
  const [page, setPage] = useState(1);
  const controlClassName =
    "min-h-14 w-full rounded-[20px] border border-slate-200/90 bg-white/90 px-4 py-3 text-sm font-medium text-slate-900 shadow-[inset_0_1px_2px_rgba(148,163,184,0.18),0_8px_20px_rgba(255,255,255,0.75)] outline-none transition placeholder:text-slate-400 focus:border-sky-300 focus:ring-4 focus:ring-sky-100 disabled:cursor-not-allowed disabled:bg-slate-100/80";
  const resolvedRowsPerPage = Number(rowsPerPage) || 5;
  const totalPages = Math.max(1, Math.ceil(filteredCompleted.length / resolvedRowsPerPage));
  const safePage = Math.min(page, totalPages);
  const pagedCompleted = useMemo(
    () =>
      filteredCompleted.slice(
        (safePage - 1) * resolvedRowsPerPage,
        safePage * resolvedRowsPerPage
      ),
    [filteredCompleted, resolvedRowsPerPage, safePage]
  );

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <div className={fullHeight ? "flex h-full min-h-0 flex-col" : ""}>
      {showSchedulingPanel ? (
        <div className="flex h-full min-h-0 flex-col rounded-[26px] border border-slate-200/90 bg-gradient-to-br from-white via-slate-50 to-sky-50/50 px-4 py-4 shadow-[0_18px_38px_rgba(148,163,184,0.08)] ring-1 ring-white/80">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-900">Schedule Appointment</h2>
            <span className="rounded-full bg-sky-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-700 ring-1 ring-sky-100">
              Waiting
            </span>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <FormControl fullWidth>
              <Select
                value={scheduleForm.patientId}
                displayEmpty
                disabled={!canCreateAppointments}
                onChange={(event: SelectChangeEvent) =>
                  onScheduleFormChange((prev) => ({ ...prev, patientId: event.target.value }))
                }
                renderValue={(selected) => {
                  if (!selected) return <span className="text-slate-400">Select patient</span>;
                  const patient = patientOptions.find((entry) => String(entry.id) === selected);
                  return patient
                    ? `${patient.name} | ${patient.patientCode || patient.nic || `Patient #${patient.id}`}`
                    : selected;
                }}
                sx={appMuiSelectSx}
              >
                {patientOptions.map((patient) => (
                  <MenuItem key={patient.id} value={String(patient.id)}>
                    {patient.name} | {patient.patientCode || patient.nic || `Patient #${patient.id}`}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {scheduleFieldErrors?.patientId ? (
              <p className="text-[11px] font-semibold text-rose-600 md:col-span-2">{scheduleFieldErrors.patientId}</p>
            ) : null}
            <FormControl fullWidth>
              <Select
                value={scheduleForm.doctorId}
                displayEmpty
                disabled={!canCreateAppointments}
                onChange={(event: SelectChangeEvent) =>
                  onScheduleFormChange((prev) => ({ ...prev, doctorId: event.target.value }))
                }
                renderValue={(selected) => {
                  if (!selected) return <span className="text-slate-400">Select doctor</span>;
                  const doctor = availableDoctors.find(
                    (entry) => entry.id !== undefined && String(entry.id) === selected,
                  );
                  if (!doctor) return selected;
                  return doctor.email
                    ? `${doctor.name} (${doctor.email})`
                    : `${doctor.name} | ${doctor.status}`;
                }}
                sx={appMuiSelectSx}
              >
                {availableDoctors
                  .filter((doctor) => doctor.id !== undefined)
                  .map((doctor) => (
                    <MenuItem key={doctor.id} value={String(doctor.id)}>
                      {doctor.email
                        ? `${doctor.name} (${doctor.email})`
                        : `${doctor.name} | ${doctor.status}`}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
            {scheduleFieldErrors?.doctorId ? (
              <p className="text-[11px] font-semibold text-rose-600 md:col-span-2">{scheduleFieldErrors.doctorId}</p>
            ) : null}
            <DateTimePicker
              value={scheduleForm.scheduledAt ? dayjs(scheduleForm.scheduledAt) : null}
              disabled={!canCreateAppointments}
              format="DD/MM/YYYY hh:mm a"
              onChange={(value) =>
                onScheduleFormChange((prev) => ({
                  ...prev,
                  scheduledAt: value?.isValid() ? value.format("YYYY-MM-DDTHH:mm") : "",
                }))
              }
              slotProps={{
                textField: {
                  ...appMuiPickerTextFieldProps,
                  placeholder: "Select date & time",
                },
              }}
            />
            {scheduleFieldErrors?.scheduledAt ? (
              <p className="text-[11px] font-semibold text-rose-600 md:col-span-2">{scheduleFieldErrors.scheduledAt}</p>
            ) : null}
            <input
              value={scheduleForm.reason}
              disabled={!canCreateAppointments}
              onChange={(event) =>
                onScheduleFormChange((prev) => ({ ...prev, reason: event.target.value }))
              }
              placeholder="Consultation reason"
              className={`${controlClassName} md:col-span-2`}
            />
            {scheduleFieldErrors?.reason ? (
              <p className="text-[11px] font-semibold text-rose-600 md:col-span-2">{scheduleFieldErrors.reason}</p>
            ) : null}
            <div className="grid grid-cols-3 gap-2 md:col-span-2">
              {(["Normal", "Urgent", "Critical"] as const).map((priority) => (
                <button
                  key={priority}
                  type="button"
                  disabled={!canCreateAppointments}
                  onClick={() =>
                    onScheduleFormChange((prev) => ({ ...prev, priority }))
                  }
                  className={`w-full ${
                    priority === "Normal"
                      ? "app-priority app-priority--normal"
                      : priority === "Urgent"
                        ? "app-priority app-priority--urgent"
                        : "app-priority app-priority--critical"
                  } ${scheduleForm.priority === priority ? "is-active" : ""}`}
                >
                  {priority}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-auto flex items-center justify-end gap-2 border-t border-slate-200/80 pt-3">
              <button
                type="button"
                onClick={onResetScheduleForm}
                disabled={isScheduling || !canCreateAppointments}
                className="app-button app-button--soft h-10 min-w-[160px] px-6 text-xs"
              >
                Reset data
              </button>
              <button
                type="button"
                onClick={onScheduleAppointment}
                disabled={isScheduling || !canCreateAppointments}
                className="app-button app-button--primary h-10 min-w-[160px] px-6 text-xs"
              >
                {isScheduling ? "Scheduling..." : "Schedule"}
              </button>
          </div>
            {!canCreateAppointments && appointmentActionDisabledReason ? (
              <p className="text-sm font-semibold text-amber-700">{appointmentActionDisabledReason}</p>
            ) : null}
        </div>
      ) : null}

      {showAvailableDoctors ? (
        <>
          <div className={`${showSchedulingPanel ? "" : "mt-1"} flex items-center justify-between`}>
            <h2 className="text-lg font-semibold text-slate-900">Available Doctors Today</h2>
            <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">Live</div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {isLoading ? (
              <p className="text-sm font-semibold text-slate-500">Loading live doctor availability...</p>
            ) : availableDoctors.length ? availableDoctors.map((doc) => (
              <span
                key={doc.id ?? doc.name}
                className={`rounded-full px-4 py-2 text-xs font-semibold ${
                  doc.status === "Online" ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100" : "bg-slate-100 text-slate-600"
                }`}
              >
                {doc.name}
              </span>
            )) : (
              <p className="text-sm text-slate-500">No doctor availability is published yet.</p>
            )}
          </div>
        </>
      ) : null}

      {showCompletedList ? (
      <div className={`${showAvailableDoctors ? "mt-6" : "mt-1"} shrink-0 space-y-3`}>
        <div className="flex items-center justify-between gap-3 text-sm font-semibold text-slate-900">
          <span>{title}</span>
          <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
            {filteredCompleted.length} records
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_116px]">
          <input
            className="min-h-11 w-full rounded-full border border-slate-200/90 bg-white/90 px-4 py-2 text-xs font-medium shadow-[inset_0_1px_2px_rgba(148,163,184,0.16)] outline-none transition placeholder:text-slate-400 focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
            placeholder="Search patient"
            value={completedSearch}
            onChange={(e) => {
              onCompletedSearchChange(e.target.value);
              setPage(1);
            }}
          />
          <FormControl fullWidth size="small">
            <Select
              value={rowsPerPage}
              onChange={(event: SelectChangeEvent) => {
                setRowsPerPage(event.target.value);
                setPage(1);
              }}
              sx={appMuiSelectSx}
            >
              <MenuItem value="5">5 rows</MenuItem>
              <MenuItem value="10">10 rows</MenuItem>
              <MenuItem value="15">15 rows</MenuItem>
            </Select>
          </FormControl>
        </div>
      </div>
      ) : null}
      {showCompletedList ? (
      <div className={`mt-3 space-y-2 ${fullHeight ? "min-h-0 flex-1" : ""} ${resolvedRowsPerPage > 5 ? "overflow-y-auto pr-1" : ""} ${fullHeight && resolvedRowsPerPage > 5 ? "max-h-full" : resolvedRowsPerPage > 5 ? "max-h-[420px]" : ""}`}>
        {pagedCompleted.length ? pagedCompleted.map((entry, index) => (
          <button
            key={`${entry.profileId ?? "completed"}-${entry.nic}-${entry.time}-${index}-${safePage}`}
            type="button"
            onClick={() => onOpenProfile(entry.profileId)}
            className="flex w-full items-center justify-between rounded-[22px] border border-slate-100 bg-slate-50/90 px-4 py-3 text-left text-xs text-slate-700 transition hover:-translate-y-0.5 hover:bg-sky-50 hover:ring-1 hover:ring-sky-200"
          >
            <div>
              <p className="font-semibold text-slate-900">{entry.name}</p>
              <p className="text-[11px] text-slate-500">
                {entry.patientCode ? `Code ${entry.patientCode}` : `NIC ${entry.nic}`}
                {entry.guardianNic ? ` | Guardian NIC ${entry.guardianNic}` : ""}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-[var(--ioc-blue)] px-3 py-1 text-white">Age {entry.age}</span>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">{entry.time}</span>
            </div>
          </button>
        )) : (
          <p className="text-sm text-slate-500">No completed patients match the current search.</p>
        )}
      </div>
      ) : null}
      {showCompletedList ? (
      <div className="mt-3 flex items-center justify-between gap-3 text-xs font-semibold text-slate-600">
        <span>
          Showing {filteredCompleted.length ? (safePage - 1) * resolvedRowsPerPage + 1 : 0}-
          {Math.min(safePage * resolvedRowsPerPage, filteredCompleted.length)} of {filteredCompleted.length}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={safePage <= 1}
            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Prev
          </button>
          <span>
            {safePage} / {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
            disabled={safePage >= totalPages}
            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
      ) : null}
      </div>
    </LocalizationProvider>
  );
}
