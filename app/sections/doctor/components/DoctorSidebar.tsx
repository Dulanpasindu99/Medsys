import type { ReactNode } from "react";
import { SurfaceCard } from "../../../components/ui/SurfaceCard";
import { SectionHeading } from "../../../components/ui/SectionHeading";
import type {
  AllergyAlert,
  AppointmentLifecycleStatus,
  PatientVital,
} from "../types";

type DoctorSidebarProps = {
  selectedPatientLabel?: string | null;
  selectedPatientProfileId?: string | null;
  patientLookupNotice?: string | null;
  assistantRegistrationHref?: string | null;
  onOpenPatientHistory: () => void;
  patientVitals: PatientVital[];
  patientAllergies: AllergyAlert[];
  vitalDrafts: {
    bloodPressure: string;
    heartRate: string;
    temperature: string;
    spo2: string;
  };
  onVitalDraftChange: (
    key: "bloodPressure" | "heartRate" | "temperature" | "spo2",
    value: string
  ) => void;
  canEditVitals?: boolean;
  vitalsDisabledReason?: string | null;
  vitalsFeedback?: { tone: "info" | "success" | "error"; message: string } | null;
  onSaveVitals: () => void;
  allergyDraftName: string;
  onAllergyDraftNameChange: (value: string) => void;
  allergyDraftSeverity: "low" | "moderate" | "high";
  onAllergyDraftSeverityChange: (value: "low" | "moderate" | "high") => void;
  editingAllergyName?: string | null;
  onEditAllergy: (allergy: AllergyAlert) => void;
  onClearAllergyDraft: () => void;
  canEditAllergies?: boolean;
  allergiesDisabledReason?: string | null;
  allergyFeedback?: { tone: "info" | "success" | "error"; message: string } | null;
  onAddOrUpdateAllergy: () => void;
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
      className={`border-t border-slate-100/90 p-4 first:border-t-0 ${className}`}
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
      <div className="mt-3">{children}</div>
    </section>
  );
}

export function DoctorSidebar({
  selectedPatientLabel = null,
  selectedPatientProfileId = null,
  patientLookupNotice = null,
  assistantRegistrationHref = null,
  onOpenPatientHistory,
  patientVitals,
  patientAllergies,
  vitalDrafts,
  onVitalDraftChange,
  canEditVitals = false,
  vitalsDisabledReason = null,
  vitalsFeedback = null,
  onSaveVitals,
  allergyDraftName,
  onAllergyDraftNameChange,
  allergyDraftSeverity,
  onAllergyDraftSeverityChange,
  editingAllergyName = null,
  onEditAllergy,
  onClearAllergyDraft,
  canEditAllergies = false,
  allergiesDisabledReason = null,
  allergyFeedback = null,
  onAddOrUpdateAllergy,
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
  const showPatientEditors = Boolean(selectedPatientProfileId);

  return (
    <div className="order-2 col-span-12 flex h-full flex-col lg:order-2 lg:col-span-4 xl:col-span-4">
      <div className="flex h-full flex-col lg:sticky lg:top-4">
        <SurfaceCard className="flex h-full min-h-0 flex-col overflow-visible rounded-[28px] p-0">
          <SidebarSection
            title="Patient Actions"
            subtitle="History and registration"
          >
            {selectedPatientProfileId ? (
              <div className="space-y-3">
                <p className="rounded-2xl bg-slate-50 px-4 py-4 text-sm font-semibold text-slate-600 ring-1 ring-slate-100">
                  {selectedPatientLabel
                    ? `${selectedPatientLabel} is loaded and ready for treatment.`
                    : "Patient details are loaded and ready for treatment."}
                </p>
                <button
                  type="button"
                  onClick={onOpenPatientHistory}
                  className="app-button app-button--secondary app-button--full uppercase tracking-wider"
                >
                  View Patient History
                </button>
              </div>
            ) : patientLookupNotice ? (
              <div className="space-y-3">
                <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm font-semibold text-amber-800">
                  {patientLookupNotice}
                </p>
                {assistantRegistrationHref ? (
                  <a
                    href={assistantRegistrationHref}
                    className="app-button app-button--primary app-button--full"
                  >
                    Create Patient
                  </a>
                ) : (
                  <div className="space-y-2">
                    <button
                      type="button"
                      disabled
                      className="app-button app-button--soft app-button--full"
                    >
                      Create Patient
                    </button>
                    <p className="text-xs text-amber-700">
                      This account does not have assistant registration access yet.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <p className="rounded-2xl bg-slate-50 px-4 py-4 text-sm font-semibold text-slate-500 ring-1 ring-slate-100">
                Search for a patient on the left to begin treatment or review history.
              </p>
            )}
          </SidebarSection>

          <SidebarSection
            title="Patient Vitals"
            accent={
              <span className="rounded-full bg-sky-600 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white shadow-[0_8px_22px_rgba(14,165,233,0.35)]">
                Live
              </span>
            }
          >
            {showPatientEditors ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    ["bloodPressure", "Blood Pressure"],
                    ["heartRate", "Heart Rate"],
                    ["temperature", "Temperature"],
                    ["spo2", "SpO2"],
                  ].map(([key, label]) => (
                    <label
                      key={key}
                      className="rounded-2xl border border-white/70 bg-white/80 p-4 shadow-[0_10px_28px_rgba(14,165,233,0.12)] ring-1 ring-sky-50"
                    >
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                        {label}
                      </p>
                      <input
                        value={vitalDrafts[key as keyof typeof vitalDrafts]}
                        onChange={(event) =>
                          onVitalDraftChange(
                            key as "bloodPressure" | "heartRate" | "temperature" | "spo2",
                            event.target.value
                          )
                        }
                        disabled={!canEditVitals}
                        className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900 outline-none transition focus:border-sky-300 focus:bg-white focus:ring-2 focus:ring-sky-100 disabled:cursor-not-allowed disabled:opacity-70"
                        placeholder={`Enter ${label.toLowerCase()}`}
                      />
                    </label>
                  ))}
                </div>
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={onSaveVitals}
                    disabled={!canEditVitals}
                    className="app-button app-button--secondary app-button--full uppercase tracking-wider"
                  >
                    Save Vitals
                  </button>
                  {!canEditVitals && vitalsDisabledReason ? (
                    <p className="text-sm font-semibold text-amber-700">
                      {vitalsDisabledReason}
                    </p>
                  ) : null}
                  {vitalsFeedback ? (
                    <p
                      className={`text-sm font-semibold ${
                        vitalsFeedback.tone === "success"
                          ? "text-emerald-700"
                          : vitalsFeedback.tone === "error"
                            ? "text-rose-700"
                            : "text-slate-600"
                      }`}
                    >
                      {vitalsFeedback.message}
                    </p>
                  ) : null}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <p className="col-span-2 rounded-2xl bg-slate-50 px-4 py-4 text-sm font-semibold text-slate-500 ring-1 ring-slate-100">
                  Select a patient to load live vitals.
                </p>
              </div>
            )}
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
                    className={`flex items-center justify-between rounded-2xl bg-white/90 px-4 py-3 ring-1 shadow-[0_12px_28px_rgba(15,23,42,0.08)] ${
                      editingAllergyName?.toLowerCase() === allergy.name.toLowerCase()
                        ? "ring-rose-200"
                        : "ring-white/70"
                    }`}
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
                    <button
                      type="button"
                      disabled={!canEditAllergies}
                      onClick={() => onEditAllergy(allergy)}
                      className="ml-3 rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-600 transition hover:border-rose-200 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      Edit
                    </button>
                  </div>
                ))
              ) : (
                <p className="rounded-2xl bg-slate-50 px-4 py-4 text-sm font-semibold text-slate-500 ring-1 ring-slate-100">
                  Allergy alerts will appear after patient selection.
                </p>
              )}
              {showPatientEditors ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3 ring-1 ring-slate-100">
                  {editingAllergyName ? (
                    <div className="mb-3 flex items-center justify-between rounded-xl bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 ring-1 ring-rose-100">
                      <span>Editing {editingAllergyName}</span>
                      <button
                        type="button"
                        onClick={onClearAllergyDraft}
                        className="rounded-full bg-white px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-slate-600 ring-1 ring-rose-100 transition hover:text-rose-600"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : null}
                  <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
                    <input
                      value={allergyDraftName}
                      onChange={(event) => onAllergyDraftNameChange(event.target.value)}
                      disabled={!canEditAllergies}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 outline-none transition focus:border-rose-300 focus:ring-2 focus:ring-rose-100 disabled:cursor-not-allowed disabled:opacity-70"
                      placeholder="Add or update allergy"
                    />
                    <select
                      value={allergyDraftSeverity}
                      onChange={(event) =>
                        onAllergyDraftSeverityChange(
                          event.target.value as "low" | "moderate" | "high"
                        )
                      }
                      disabled={!canEditAllergies}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 outline-none transition focus:border-rose-300 focus:ring-2 focus:ring-rose-100 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      <option value="low">Low</option>
                      <option value="moderate">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                  <div className="mt-3 space-y-2">
                    <button
                      type="button"
                      onClick={onAddOrUpdateAllergy}
                      disabled={!canEditAllergies}
                      className="app-button app-button--secondary app-button--full uppercase tracking-wider"
                    >
                      {editingAllergyName ? "Update Allergy" : "Add Allergy"}
                    </button>
                    <p className="text-xs font-medium text-slate-500">
                      Removal is not available yet because the backend delete allergy endpoint is not exposed in this app.
                    </p>
                    {!canEditAllergies && allergiesDisabledReason ? (
                      <p className="text-sm font-semibold text-amber-700">
                        {allergiesDisabledReason}
                      </p>
                    ) : null}
                    {allergyFeedback ? (
                      <p
                        className={`text-sm font-semibold ${
                          allergyFeedback.tone === "success"
                            ? "text-emerald-700"
                            : allergyFeedback.tone === "error"
                              ? "text-rose-700"
                              : "text-slate-600"
                        }`}
                      >
                        {allergyFeedback.message}
                      </p>
                    ) : null}
                  </div>
                </div>
              ) : null}
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
                  className="app-button app-button--secondary app-button--full uppercase tracking-wider"
                >
                  {isTransitioningAppointment
                    ? "Starting consultation..."
                    : "Start Consultation"}
                </button>
                <button
                  type="button"
                  onClick={onSaveRecord}
                  disabled={isSavingRecord || !canSaveRecord}
                  className="app-button app-button--primary app-button--full uppercase tracking-wider"
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
