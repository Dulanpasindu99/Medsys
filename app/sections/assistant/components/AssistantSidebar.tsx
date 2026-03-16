import type React from "react";
import type {
  AssistantDoctorAvailability,
  AssistantPatientOption,
  AssistantScheduleFormState,
  CompletedPatient,
} from "../types";

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
}: AssistantSidebarProps) {
  return (
    <>
      <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4 shadow-inner">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-slate-900">Schedule Appointment</h2>
          <span className="rounded-full bg-sky-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-700 ring-1 ring-sky-100">
            Waiting
          </span>
        </div>
        <div className="mt-4 space-y-3">
          <select
            value={scheduleForm.patientId}
            disabled={!canCreateAppointments}
            onChange={(event) =>
              onScheduleFormChange((prev) => ({ ...prev, patientId: event.target.value }))
            }
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow-inner outline-none"
          >
            <option value="">Select patient</option>
            {patientOptions.map((patient) => (
              <option key={patient.id} value={String(patient.id)}>
                {patient.name} | {patient.patientCode || patient.nic || `Patient #${patient.id}`}
              </option>
            ))}
          </select>
          <select
            value={scheduleForm.doctorId}
            disabled={!canCreateAppointments}
            onChange={(event) =>
              onScheduleFormChange((prev) => ({ ...prev, doctorId: event.target.value }))
            }
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow-inner outline-none"
          >
            <option value="">Select doctor</option>
            {availableDoctors
              .filter((doctor) => doctor.id !== undefined)
              .map((doctor) => (
                <option key={doctor.id} value={String(doctor.id)}>
                  {doctor.name} | {doctor.status}
                </option>
              ))}
          </select>
          <input
            type="datetime-local"
            value={scheduleForm.scheduledAt}
            disabled={!canCreateAppointments}
            onChange={(event) =>
              onScheduleFormChange((prev) => ({ ...prev, scheduledAt: event.target.value }))
            }
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow-inner outline-none"
          />
          <input
            value={scheduleForm.reason}
            disabled={!canCreateAppointments}
            onChange={(event) =>
              onScheduleFormChange((prev) => ({ ...prev, reason: event.target.value }))
            }
            placeholder="Consultation reason"
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow-inner outline-none"
          />
          <div className="flex flex-wrap gap-2">
            {(["Normal", "Urgent", "Critical"] as const).map((priority) => (
              <button
                key={priority}
                type="button"
                disabled={!canCreateAppointments}
                onClick={() =>
                  onScheduleFormChange((prev) => ({ ...prev, priority }))
                }
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  scheduleForm.priority === priority
                    ? "bg-amber-500 text-white"
                    : "bg-white text-amber-700 ring-1 ring-amber-100"
                }`}
              >
                {priority}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={onScheduleAppointment}
            disabled={isScheduling || !canCreateAppointments}
            className="w-full rounded-2xl bg-[var(--ioc-blue)] px-4 py-3 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(10,132,255,0.4)] transition hover:-translate-y-0.5 hover:bg-[#0070f0] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isScheduling ? "Scheduling..." : "Schedule appointment"}
          </button>
          {!canCreateAppointments && appointmentActionDisabledReason ? (
            <p className="text-sm font-semibold text-amber-700">{appointmentActionDisabledReason}</p>
          ) : null}
        </div>
      </div>

      <div className="flex items-center justify-between">
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

      <div className="mt-6 flex items-center justify-between text-sm font-semibold text-slate-900">
        <span>Completed Patient List</span>
        <input
          className="rounded-full border border-slate-200 px-3 py-2 text-xs shadow-inner"
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
            className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-xs text-slate-700 transition hover:-translate-y-0.5 hover:bg-sky-50 hover:ring-1 hover:ring-sky-200"
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
    </>
  );
}
