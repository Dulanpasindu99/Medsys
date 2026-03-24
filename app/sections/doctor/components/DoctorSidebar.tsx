import { useState, type ReactNode } from "react";
import FormControl from "@mui/material/FormControl";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import { SurfaceCard } from "../../../components/ui/SurfaceCard";
import { SectionHeading } from "../../../components/ui/SectionHeading";
import { appMuiSelectSx } from "../../../components/ui/muiFieldStyles";
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
  consultationAllergies: Array<{
    allergyName: string;
    severity: "low" | "moderate" | "high";
    isActive: boolean;
  }>;
  onRemoveConsultationAllergy: (allergyName: string) => void;
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
  onSaveRecord: () => void;
  selectedAppointmentStatus?: AppointmentLifecycleStatus | null;
  canSaveRecord?: boolean;
  saveDisabledReason?: string | null;
  saveFeedback?: { tone: "info" | "success" | "error"; message: string } | null;
  isSavingRecord?: boolean;
  showDraftEditors?: boolean;
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
    <section className={`border-t border-slate-100/90 p-3 first:border-t-0 ${className}`}>
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
      <div className="mt-2">{children}</div>
    </section>
  );
}

export function DoctorSidebar({
  selectedPatientLabel = null,
  selectedPatientProfileId = null,
  patientLookupNotice = null,
  assistantRegistrationHref = null,
  onOpenPatientHistory,
  patientAllergies,
  consultationAllergies,
  onRemoveConsultationAllergy,
  vitalDrafts,
  onVitalDraftChange,
  canEditVitals = false,
  vitalsDisabledReason = null,
  vitalsFeedback = null,
  allergyDraftName,
  onAllergyDraftNameChange,
  allergyDraftSeverity,
  onAllergyDraftSeverityChange,
  editingAllergyName = null,
  canEditAllergies = false,
  allergiesDisabledReason = null,
  allergyFeedback = null,
  onAddOrUpdateAllergy,
  onSaveRecord,
  selectedAppointmentStatus = null,
  canSaveRecord = true,
  saveDisabledReason = null,
  saveFeedback,
  isSavingRecord = false,
  showDraftEditors = false,
}: DoctorSidebarProps) {
  const showPatientEditors = Boolean(selectedPatientProfileId || showDraftEditors);
  const [activeSidebarTab, setActiveSidebarTab] = useState<"overview" | "vitals" | "allergies">(
    "overview"
  );
  const statusLabel = selectedAppointmentStatus
    ? selectedAppointmentStatus.replace("_", " ")
    : selectedPatientProfileId
      ? "ready"
      : showDraftEditors
        ? "draft"
        : "No selection";

  return (
    <div className="order-2 col-span-12 flex h-full min-h-0 flex-col xl:col-span-4 2xl:col-span-3">
      <div className="flex h-full min-h-0 flex-col xl:sticky xl:top-4">
        <SurfaceCard className="flex h-full min-h-0 flex-col overflow-hidden rounded-[24px] p-0 sm:rounded-[28px]">
          <div className="border-b border-slate-100/90 p-3">
            <div className="flex flex-wrap gap-2">
              {[
                { key: "overview", label: "Overview" },
                { key: "vitals", label: "Vitals" },
                { key: "allergies", label: "Allergies" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() =>
                    setActiveSidebarTab(tab.key as "overview" | "vitals" | "allergies")
                  }
                  className={`rounded-full px-3 py-2 text-[10px] font-bold uppercase tracking-[0.16em] transition sm:px-4 ${
                    activeSidebarTab === tab.key
                      ? "bg-slate-800 text-white shadow-md"
                      : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {activeSidebarTab === "overview" ? (
              <SidebarSection title="Patient Actions" subtitle="History and registration">
                {selectedPatientProfileId ? (
                  <div className="space-y-3">
                    <p className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600 ring-1 ring-slate-100">
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
                ) : showDraftEditors ? (
                  <div className="space-y-3">
                    <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
                      Quick-create patient mode is active. Vitals, allergies, and consultation details will all save together.
                    </p>
                  </div>
                ) : patientLookupNotice ? (
                  <div className="space-y-3">
                    <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
                      {patientLookupNotice}
                    </p>
                    {assistantRegistrationHref ? (
                      <a
                        href={assistantRegistrationHref}
                        className="app-button app-button--primary app-button--full"
                      >
                        Create Patient & Start Visit
                      </a>
                    ) : (
                      <div className="space-y-2">
                        <button
                          type="button"
                          disabled
                          className="app-button app-button--soft app-button--full"
                        >
                          Create Patient & Start Visit
                        </button>
                        <p className="text-xs text-amber-700">
                          This account does not have assistant registration access yet.
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-500 ring-1 ring-slate-100">
                    Search for a patient on the left to begin treatment or review history.
                  </p>
                )}
              </SidebarSection>
            ) : null}

            {activeSidebarTab === "vitals" ? (
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
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {[
                        ["bloodPressure", "Blood Pressure"],
                        ["heartRate", "Heart Rate"],
                        ["temperature", "Temperature"],
                        ["spo2", "SpO2"],
                      ].map(([key, label]) => (
                        <label
                          key={key}
                          className="rounded-2xl border border-white/70 bg-white/80 p-3 shadow-[0_10px_28px_rgba(14,165,233,0.12)] ring-1 ring-sky-50"
                        >
                          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
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
                            className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-sky-300 focus:bg-white focus:ring-2 focus:ring-sky-100 disabled:cursor-not-allowed disabled:opacity-70"
                            placeholder={`Enter ${label.toLowerCase()}`}
                          />
                        </label>
                      ))}
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-slate-500">
                        Vitals stay local until the consultation is saved.
                      </p>
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
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <p className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-500 ring-1 ring-slate-100 sm:col-span-2">
                      Search for a patient or enter quick-create details to start entering vitals.
                    </p>
                  </div>
                )}
              </SidebarSection>
            ) : null}

            {activeSidebarTab === "allergies" ? (
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
                          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
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
                    <p className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-500 ring-1 ring-slate-100">
                      Existing allergy alerts appear after patient selection. You can still add consultation allergies for a new patient below.
                    </p>
                  )}
                  {consultationAllergies.length ? (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-3">
                      <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-700">
                        Pending Consultation Allergies
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {consultationAllergies.map((allergy) => (
                          <button
                            key={allergy.allergyName}
                            type="button"
                            onClick={() => onRemoveConsultationAllergy(allergy.allergyName)}
                            className="rounded-full bg-white px-3 py-2 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200"
                          >
                            {allergy.allergyName} ({allergy.severity}) x
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  {showPatientEditors ? (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3 ring-1 ring-slate-100">
                      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_140px]">
                        <input
                          value={allergyDraftName}
                          onChange={(event) => onAllergyDraftNameChange(event.target.value)}
                          disabled={!canEditAllergies}
                          className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-rose-300 focus:ring-2 focus:ring-rose-100 disabled:cursor-not-allowed disabled:opacity-70"
                          placeholder="Add or update allergy"
                        />
                        <FormControl sx={{ minWidth: 150 }}>
                          <Select
                            value={allergyDraftSeverity}
                            onChange={(event) =>
                              onAllergyDraftSeverityChange(
                                event.target.value as "low" | "moderate" | "high"
                              )
                            }
                            disabled={!canEditAllergies}
                            sx={{
                              ...appMuiSelectSx,
                              minHeight: 48,
                              height: 48,
                              borderRadius: "0.75rem",
                              boxShadow: "none",
                              "& .MuiSelect-select": {
                                minHeight: "48px",
                                paddingTop: "0 !important",
                                paddingBottom: "0 !important",
                              },
                            }}
                          >
                            <MenuItem value="low">Low</MenuItem>
                            <MenuItem value="moderate">Medium</MenuItem>
                            <MenuItem value="high">High</MenuItem>
                          </Select>
                        </FormControl>
                      </div>
                      <div className="mt-3 space-y-2">
                        <button
                          type="button"
                          onClick={onAddOrUpdateAllergy}
                          disabled={!canEditAllergies}
                          className="app-button app-button--secondary app-button--full uppercase tracking-wider"
                        >
                          Add To Consultation
                        </button>
                        <p className="text-xs font-medium text-slate-500">
                          Added allergies will be sent together with the final consultation save.
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
            ) : null}
          </div>

          <SidebarSection
            title="Consultation Save"
            subtitle="Unified workflow"
            accent={
              <div className="flex flex-wrap items-center justify-end gap-2">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-700">
                  {statusLabel}
                </span>
              </div>
            }
            className="mt-auto"
          >
            <div className="space-y-3">
              <button
                type="button"
                onClick={onSaveRecord}
                disabled={isSavingRecord || !canSaveRecord}
                className="app-button app-button--primary app-button--full uppercase tracking-wider"
              >
                {isSavingRecord ? "Saving consultation..." : "Save Consultation"}
              </button>
              <div className="space-y-2">
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
