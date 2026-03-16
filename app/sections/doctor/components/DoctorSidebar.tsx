import Link from "next/link";
import type { ReactNode } from "react";
import { SurfaceCard } from "../../../components/ui/SurfaceCard";
import { SectionHeading } from "../../../components/ui/SectionHeading";
import type {
  AllergyAlert,
  AppointmentLifecycleStatus,
  Patient,
  PatientVital,
} from "../types";

type DoctorSidebarProps = {
  search: string;
  onSearchChange: (value: string) => void;
  searchMatches: Patient[];
  assistantRegistrationHref?: string | null;
  onSearchSelect: (patient: Patient) => void;
  patientVitals: PatientVital[];
  patientAllergies: AllergyAlert[];
  onStartConsultation: () => void;
  onSaveRecord: () => void;
  canTransitionAppointments?: boolean;
  selectedAppointmentStatus?: AppointmentLifecycleStatus | null;
  transitionDisabledReason?: string | null;
  transitionFeedback?: {
    tone: "info" | "success" | "error";
    message: string;
  } | null;
  isTransitioningAppointment?: boolean;
  canSaveRecord?: boolean;
  saveDisabledReason?: string | null;
  saveFeedback?: { tone: "info" | "success" | "error"; message: string } | null;
  isSavingRecord?: boolean;
};

const inputInsetShadow = "shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]";

const iconProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

const SearchIcon = ({ className }: { className?: string }) => (
  <svg {...iconProps} className={className}>
    <circle cx={11} cy={11} r={7} />
    <path d="M16.5 16.5L21 21" />
  </svg>
);

const MicIcon = ({ className }: { className?: string }) => (
  <svg {...iconProps} className={className}>
    <path d="M12 15a3 3 0 003-3V8a3 3 0 10-6 0v4a3 3 0 003 3z" />
    <path d="M6.5 11a5.5 5.5 0 0011 0M12 15.5V19M9.5 19h5" />
  </svg>
);

function SidebarSection({
  title,
  subtitle,
  accent,
  children,
  className = "",
}: {
  title: string;
  subtitle?: string;
  accent?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`border-t border-slate-100/90 p-5 first:border-t-0 ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <SectionHeading title={title} compact />
          {subtitle ? (
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
              {subtitle}
            </p>
          ) : null}
        </div>
        {accent}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function DoctorSidebar({
  search,
  onSearchChange,
  searchMatches,
  assistantRegistrationHref = null,
  onSearchSelect,
  patientVitals,
  patientAllergies,
  onStartConsultation,
  onSaveRecord,
  canTransitionAppointments = true,
  selectedAppointmentStatus = null,
  transitionDisabledReason = null,
  transitionFeedback,
  isTransitioningAppointment = false,
  canSaveRecord = true,
  saveDisabledReason = null,
  saveFeedback,
  isSavingRecord = false,
}: DoctorSidebarProps) {
  return (
    <div className="order-2 col-span-12 flex h-full flex-col pl-1 pr-1 lg:order-2 lg:col-span-4 xl:col-span-4">
      <div className="flex h-full flex-col lg:sticky lg:top-6">
        <SurfaceCard className="flex h-full min-h-0 flex-col overflow-visible rounded-[28px] p-0">
          <SidebarSection
            title="Search Patients"
            subtitle="Name / patient code / NIC / guardian"
          >
            <div className="rounded-[24px] bg-slate-50/80 p-4 ring-1 ring-white/70">
              <div className="relative z-[100]">
                <SearchIcon className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-400" />
                <input
                  placeholder="Search by name, code, NIC, or guardian"
                  value={search}
                  onChange={(event) => onSearchChange(event.target.value)}
                  className={`w-full rounded-2xl border border-transparent bg-white px-11 py-3 text-sm text-slate-900 ${inputInsetShadow} outline-none transition focus:border-sky-200 focus:ring-2 focus:ring-sky-100`}
                />
                <MicIcon className="pointer-events-none absolute right-4 top-1/2 size-5 -translate-y-1/2 text-slate-400" />

                {search ? (
                  <div className="absolute left-0 right-0 top-full z-[100] mt-2 max-h-60 overflow-y-auto rounded-2xl bg-white p-2 shadow-xl ring-1 ring-slate-200">
                    {searchMatches.length === 0 ? (
                      <div className="space-y-3 p-3">
                        <p className="text-sm font-semibold text-slate-500">
                          No matching patients found.
                        </p>
                        {assistantRegistrationHref ? (
                          <>
                            <p className="text-xs text-slate-500">
                              Register the patient in the assistant page, then
                              return here and search again to continue the
                              doctor workflow.
                            </p>
                            <Link
                              href={assistantRegistrationHref}
                              className="inline-flex rounded-full bg-[var(--ioc-blue)] px-4 py-2 text-xs font-semibold text-white shadow-[0_10px_22px_rgba(10,132,255,0.3)] transition hover:bg-[#0070f0]"
                            >
                              Open Assistant Panel
                            </Link>
                          </>
                        ) : (
                          <p className="text-xs text-amber-700">
                            This account does not have assistant registration
                            access. Use an assistant-enabled account to register
                            the patient first.
                          </p>
                        )}
                      </div>
                    ) : (
                      searchMatches.map((patient) => (
                        <button
                          key={`${patient.patientId ?? "unknown"}-${patient.appointmentId ?? patient.nic}`}
                          type="button"
                          onClick={() => onSearchSelect(patient)}
                          className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-sm text-slate-800 transition hover:bg-sky-50"
                        >
                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold text-slate-900">
                              {patient.name}
                            </div>
                            <div className="truncate text-[11px] text-slate-500">
                              {patient.patientCode || patient.nic}
                              {patient.guardianNic
                                ? ` | Guardian ${patient.guardianNic}`
                                : ""}
                            </div>
                          </div>
                          <div className="ml-3 flex flex-col items-end gap-1 text-[11px] font-semibold text-slate-500">
                            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-emerald-700 ring-1 ring-emerald-100">
                              <span className="size-2 rounded-full bg-emerald-400" />
                              {patient.reason}
                            </span>
                            <span className="rounded-full bg-[var(--ioc-blue)] px-3 py-1 text-white">
                              {patient.time}
                            </span>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                ) : null}
              </div>
            </div>
          </SidebarSection>

          <SidebarSection
            title="Patient Vitals"
            accent={
              <span className="rounded-full bg-sky-600 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white shadow-[0_8px_22px_rgba(14,165,233,0.35)]">
                Live
              </span>
            }
          >
            <div className="grid grid-cols-2 gap-3">
              {patientVitals.length ? (
                patientVitals.map((vital) => (
                  <div
                    key={vital.label}
                    className="rounded-2xl border border-white/70 bg-white/80 p-4 shadow-[0_10px_28px_rgba(14,165,233,0.12)] ring-1 ring-sky-50"
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                      {vital.label}
                    </p>
                    <p className="mt-1 text-xl font-bold text-slate-900">
                      {vital.value}
                    </p>
                  </div>
                ))
              ) : (
                <p className="col-span-2 rounded-2xl bg-slate-50 px-4 py-4 text-sm font-semibold text-slate-500 ring-1 ring-slate-100">
                  Select a patient to load live vitals.
                </p>
              )}
            </div>
          </SidebarSection>

          <SidebarSection
            title="Allergies & Alerts"
            accent={
              <span className="rounded-full bg-rose-600 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white shadow-[0_10px_24px_rgba(244,63,94,0.35)]">
                Critical
              </span>
            }
          >
            <div className="space-y-3">
              {patientAllergies.length ? (
                patientAllergies.map((allergy) => (
                  <div
                    key={allergy.name}
                    className="flex items-center justify-between rounded-2xl bg-white/90 px-4 py-3 ring-1 ring-white/70 shadow-[0_12px_28px_rgba(15,23,42,0.08)]"
                  >
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                        Allergy
                      </p>
                      <p className="text-base font-semibold text-slate-900">
                        {allergy.name}
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ${allergy.pill}`}
                    >
                      <span className={`size-2 rounded-full ${allergy.dot}`} />
                      {allergy.severity}
                    </span>
                  </div>
                ))
              ) : (
                <p className="rounded-2xl bg-slate-50 px-4 py-4 text-sm font-semibold text-slate-500 ring-1 ring-slate-100">
                  Allergy alerts will appear after patient selection.
                </p>
              )}
            </div>
          </SidebarSection>

          <SidebarSection
            title="Consultation Status"
            subtitle="Appointment lifecycle"
            accent={
              <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-700">
                {selectedAppointmentStatus
                  ? selectedAppointmentStatus.replace("_", " ")
                  : "No selection"}
              </span>
            }
            className="mt-auto"
          >
            <div className="space-y-4">
              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={onStartConsultation}
                  disabled={
                    isTransitioningAppointment || !canTransitionAppointments
                  }
                  className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-bold uppercase tracking-wider text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isTransitioningAppointment
                    ? "Starting consultation..."
                    : "Start Consultation"}
                </button>
                <button
                  type="button"
                  onClick={onSaveRecord}
                  disabled={isSavingRecord || !canSaveRecord}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--ioc-blue)] px-8 py-4 text-sm font-bold uppercase tracking-wider text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-[#0070f0] hover:shadow-sky-500/30 active:translate-y-0 active:shadow-md disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSavingRecord ? "Saving record..." : "Save & Print Record"}
                </button>
              </div>
              <div className="space-y-3">
                {!canTransitionAppointments && transitionDisabledReason ? (
                  <p className="text-sm font-semibold text-amber-700">
                    {transitionDisabledReason}
                  </p>
                ) : null}
                {transitionFeedback ? (
                  <p
                    className={`text-sm font-semibold ${
                      transitionFeedback.tone === "success"
                        ? "text-emerald-700"
                        : transitionFeedback.tone === "error"
                          ? "text-rose-700"
                          : "text-slate-600"
                    }`}
                  >
                    {transitionFeedback.message}
                  </p>
                ) : null}
                {!canSaveRecord && saveDisabledReason ? (
                  <p className="text-sm font-semibold text-amber-700">
                    {saveDisabledReason}
                  </p>
                ) : null}
                {saveFeedback ? (
                  <p
                    className={`text-sm font-semibold ${
                      saveFeedback.tone === "success"
                        ? "text-emerald-700"
                        : saveFeedback.tone === "error"
                          ? "text-rose-700"
                          : "text-slate-600"
                    }`}
                  >
                    {saveFeedback.message}
                  </p>
                ) : null}
              </div>
            </div>
          </SidebarSection>
        </SurfaceCard>
      </div>
    </div>
  );
}
