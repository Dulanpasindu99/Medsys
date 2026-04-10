import type { ReactNode } from "react";
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
  temperatureUnit: "C" | "F";
  onTemperatureUnitChange: (value: "C" | "F") => void;
  onVitalDraftChange: (
    key: "bloodPressure" | "heartRate" | "temperature" | "spo2",
    value: string,
  ) => void;
  canEditVitals?: boolean;
  vitalsDisabledReason?: string | null;
  vitalsFeedback?: {
    tone: "info" | "success" | "error";
    message: string;
  } | null;
  allergyDraftName: string;
  onAllergyDraftNameChange: (value: string) => void;
  allergyDraftSeverity: "low" | "moderate" | "high";
  onAllergyDraftSeverityChange: (value: "low" | "moderate" | "high") => void;
  editingAllergyName?: string | null;
  onEditAllergy: (allergy: AllergyAlert) => void;
  onClearAllergyDraft: () => void;
  canEditAllergies?: boolean;
  allergiesDisabledReason?: string | null;
  allergyFeedback?: {
    tone: "info" | "success" | "error";
    message: string;
  } | null;
  onAddOrUpdateAllergy: () => void;
  selectedAppointmentStatus?: AppointmentLifecycleStatus | null;
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
    <section
      className={`border-t border-slate-100/90 p-3 first:border-t-0 ${className}`}
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
  temperatureUnit,
  onTemperatureUnitChange,
  onVitalDraftChange,
  canEditVitals = false,
  vitalsDisabledReason = null,
  vitalsFeedback = null,
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
  showDraftEditors = false,
}: DoctorSidebarProps) {
  const showPatientEditors = Boolean(
    selectedPatientProfileId || showDraftEditors,
  );
  const vitalFieldMeta: Array<{
    key: "bloodPressure" | "heartRate" | "temperature" | "spo2";
    label: string;
    placeholder: string;
  }> = [
    { key: "bloodPressure", label: "Blood Pressure", placeholder: "120/" },
    { key: "heartRate", label: "Heart Rate", placeholder: "72" },
    {
      key: "temperature",
      label: "Temperature",
      placeholder: temperatureUnit === "F" ? "98.6" : "36.8",
    },
    { key: "spo2", label: "SpO2", placeholder: "99" },
  ];

  return (
    <div className="order-2 col-span-12 flex h-auto min-h-0 flex-col lg:col-span-4 lg:h-full 2xl:col-span-3">
      <div className="flex h-auto min-h-0 flex-col lg:sticky lg:top-0 lg:h-full">
        <SurfaceCard className="flex h-auto min-h-0 flex-1 flex-col overflow-hidden rounded-[24px] p-0 sm:rounded-[28px] lg:h-full">
          <div className="min-h-0 flex-1 overflow-visible lg:overflow-y-auto">
            <SidebarSection
              title="Patient Actions"
              subtitle="History and registration"
            >
              {selectedPatientProfileId ? (
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={onOpenPatientHistory}
                    className="inline-flex min-h-10 w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-700 transition hover:bg-slate-50"
                  >
                    View Patient History
                  </button>
                  <p className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-500 ring-1 ring-slate-100">
                    {selectedPatientLabel
                      ? `${selectedPatientLabel} is loaded. Open history if you need more context.`
                      : "Patient details are loaded. Open history if you need more context."}
                  </p>
                </div>
              ) : showDraftEditors ? (
                <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
                  Quick-create patient mode is active. Save the consultation
                  from the Notes section when you are ready.
                </p>
              ) : patientLookupNotice ? (
                <div className="space-y-3">
                  <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
                    {patientLookupNotice}
                  </p>
                  {assistantRegistrationHref ? (
                    <a
                      href={assistantRegistrationHref}
                      className="inline-flex min-h-10 w-full items-center justify-center rounded-xl bg-gradient-to-r from-sky-500 via-sky-600 to-blue-600 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.14em] text-white shadow-[0_14px_24px_rgba(59,130,246,0.24)] transition hover:-translate-y-0.5"
                    >
                      Create Patient & Start Visit
                    </a>
                  ) : (
                    <div className="space-y-2">
                      <button
                        type="button"
                        disabled
                        className="inline-flex min-h-10 w-full items-center justify-center rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500"
                      >
                        Create Patient & Start Visit
                      </button>
                      <p className="text-xs text-amber-700">
                        This account does not have assistant registration access
                        yet.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-500 ring-1 ring-slate-100">
                  Search for a patient on the left to begin treatment or review
                  history.
                </p>
              )}
            </SidebarSection>

            <SidebarSection title="Patient Vitals">
              {showPatientEditors ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {vitalFieldMeta.map(({ key, label, placeholder }) => (
                      <label
                        key={key}
                        className="rounded-2xl border border-white/70 bg-white/80 p-3 shadow-[0_10px_28px_rgba(14,165,233,0.12)] ring-1 ring-sky-50"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                            {label}
                          </p>
                          {key === "temperature" ? (
                            <FormControl size="small" sx={{ minWidth: 52 }}>
                              <Select
                                value={temperatureUnit}
                                onChange={(event) =>
                                  onTemperatureUnitChange(event.target.value as "C" | "F")
                                }
                                disabled={!canEditVitals}
                                sx={{
                                  ...appMuiSelectSx,
                                  minHeight: 28,
                                  height: 28,
                                  borderRadius: "999px",
                                  "& .MuiSelect-select": {
                                    ...appMuiSelectSx["& .MuiSelect-select"],
                                    minHeight: "28px",
                                    py: 0,
                                    fontSize: "11px",
                                    fontWeight: 700,
                                  },
                                }}
                              >
                                <MenuItem value="C">C</MenuItem>
                                <MenuItem value="F">F</MenuItem>
                              </Select>
                            </FormControl>
                          ) : null}
                        </div>
                        <input
                          value={
                            key === "bloodPressure"
                              ? vitalDrafts.bloodPressure || "120/"
                              : vitalDrafts[key]
                          }
                          onChange={(event) =>
                            onVitalDraftChange(
                              key,
                              key === "bloodPressure"
                                ? `120/${event.target.value.replace(/^120\//, "").replace(/[^\d]/g, "")}`
                                : event.target.value
                            )
                          }
                          disabled={!canEditVitals}
                          className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-[12px] placeholder:font-medium placeholder:text-slate-400 focus:border-sky-300 focus:bg-white focus:ring-2 focus:ring-sky-100 disabled:cursor-not-allowed disabled:opacity-70"
                          placeholder={placeholder}
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
                <p className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-500 ring-1 ring-slate-100">
                  Search for a patient or enter quick-create details to start
                  entering vitals.
                </p>
              )}
            </SidebarSection>

            <SidebarSection title="Allergies & Alerts">
              <div className="space-y-3">
                {patientAllergies.length ? (
                  patientAllergies.map((allergy) => (
                    <div
                      key={allergy.name}
                      className={`flex items-center justify-between rounded-2xl bg-white/90 px-4 py-3 ring-1 shadow-[0_12px_28px_rgba(15,23,42,0.08)] ${
                        editingAllergyName?.toLowerCase() ===
                        allergy.name.toLowerCase()
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
                        <span
                          className={`size-2 rounded-full ${allergy.dot}`}
                        />
                        {allergy.severity}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-500 ring-1 ring-slate-100">
                    Allergy alerts will appear here after patient selection.
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
                          onClick={() =>
                            onRemoveConsultationAllergy(allergy.allergyName)
                          }
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
                    <div className="grid items-stretch gap-3 md:grid-cols-[minmax(0,1fr)_156px]">
                      <input
                        value={allergyDraftName}
                        onChange={(event) =>
                          onAllergyDraftNameChange(event.target.value)
                        }
                        disabled={!canEditAllergies}
                        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-rose-300 focus:ring-2 focus:ring-rose-100 disabled:cursor-not-allowed disabled:opacity-70"
                        placeholder="Add or update allergy"
                      />
                      <FormControl fullWidth sx={{ minWidth: 0 }}>
                        <Select
                          value={allergyDraftSeverity}
                          onChange={(event) =>
                            onAllergyDraftSeverityChange(
                              event.target.value as "low" | "moderate" | "high",
                            )
                          }
                          disabled={!canEditAllergies}
                          sx={{
                            ...appMuiSelectSx,
                            minHeight: 44,
                            height: 44,
                            borderRadius: "0.75rem",
                            boxShadow: "none",
                            backgroundColor: "#ffffff",
                            "& .MuiSelect-select": {
                              minHeight: "44px",
                              display: "flex",
                              alignItems: "center",
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
                    <div className="mt-3 flex min-h-6 flex-wrap gap-2">
                      {editingAllergyName ||
                      allergyDraftName.trim().length > 0 ? (
                        <button
                          type="button"
                          onClick={onClearAllergyDraft}
                          className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500 transition hover:bg-slate-50"
                        >
                          Clear
                        </button>
                      ) : null}
                    </div>
                  </div>
                ) : null}
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
            </SidebarSection>
          </div>
        </SurfaceCard>
      </div>
    </div>
  );
}
