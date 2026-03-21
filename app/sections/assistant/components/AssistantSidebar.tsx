import type React from "react";
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
};

export function AssistantSidebar({
  availableDoctors,
  patientOptions,
  scheduleForm,
  onScheduleFormChange,
  onScheduleAppointment,
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
}: AssistantSidebarProps) {
  const controlClassName =
    "min-h-14 w-full rounded-[20px] border border-slate-200/90 bg-white/90 px-4 py-3 text-sm font-medium text-slate-900 shadow-[inset_0_1px_2px_rgba(148,163,184,0.18),0_8px_20px_rgba(255,255,255,0.75)] outline-none transition placeholder:text-slate-400 focus:border-sky-300 focus:ring-4 focus:ring-sky-100 disabled:cursor-not-allowed disabled:bg-slate-100/80";

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      {showSchedulingPanel ? (
        <div className="rounded-[26px] border border-slate-200/90 bg-gradient-to-br from-white via-slate-50 to-sky-50/50 px-4 py-4 shadow-[0_18px_38px_rgba(148,163,184,0.08)] ring-1 ring-white/80">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-900">Schedule Appointment</h2>
            <span className="rounded-full bg-sky-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-700 ring-1 ring-sky-100">
              Waiting
            </span>
          </div>
          <div className="mt-4 space-y-3">
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
                <MenuItem value="">Select patient</MenuItem>
                {patientOptions.map((patient) => (
                  <MenuItem key={patient.id} value={String(patient.id)}>
                    {patient.name} | {patient.patientCode || patient.nic || `Patient #${patient.id}`}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
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
                  return doctor ? `${doctor.name} | ${doctor.status}` : selected;
                }}
                sx={appMuiSelectSx}
              >
                <MenuItem value="">Select doctor</MenuItem>
                {availableDoctors
                  .filter((doctor) => doctor.id !== undefined)
                  .map((doctor) => (
                    <MenuItem key={doctor.id} value={String(doctor.id)}>
                      {doctor.name} | {doctor.status}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
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
            <input
              value={scheduleForm.reason}
              disabled={!canCreateAppointments}
              onChange={(event) =>
                onScheduleFormChange((prev) => ({ ...prev, reason: event.target.value }))
              }
              placeholder="Consultation reason"
              className={controlClassName}
            />
            <div className="grid grid-cols-3 gap-2">
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
            <button
              type="button"
              onClick={onScheduleAppointment}
              disabled={isScheduling || !canCreateAppointments}
              className="app-button app-button--primary app-button--full"
            >
              {isScheduling ? "Scheduling..." : "Schedule appointment"}
            </button>
            {!canCreateAppointments && appointmentActionDisabledReason ? (
              <p className="text-sm font-semibold text-amber-700">{appointmentActionDisabledReason}</p>
            ) : null}
          </div>
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
                key={doc.name}
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

      <div className={`${showAvailableDoctors ? "mt-6" : "mt-1"} flex items-center justify-between gap-3 text-sm font-semibold text-slate-900`}>
        <span>Completed Patient List</span>
        <input
          className="min-h-11 w-full max-w-[220px] rounded-full border border-slate-200/90 bg-white/90 px-4 py-2 text-xs font-medium shadow-[inset_0_1px_2px_rgba(148,163,184,0.16)] outline-none transition placeholder:text-slate-400 focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
          placeholder="Search patient"
          value={completedSearch}
          onChange={(e) => onCompletedSearchChange(e.target.value)}
        />
      </div>
      <div className="mt-3 space-y-2">
        {filteredCompleted.length ? filteredCompleted.map((entry, index) => (
          <button
            key={`${entry.profileId ?? "completed"}-${entry.nic}-${entry.time}-${index}`}
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
    </LocalizationProvider>
  );
}
