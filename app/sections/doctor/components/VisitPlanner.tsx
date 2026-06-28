import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { FiAlertCircle, FiInfo, FiPrinter, FiUserCheck } from "react-icons/fi";
import { appMuiPickerTextFieldProps } from "../../../components/ui/muiFieldStyles";
import type { VisitOption } from "../hooks/useVisitPlanner";

type VisitPlannerProps = {
  nextVisitOption: VisitOption;
  nextVisitDate: string;
  notes: string;
  onSelectOption: (option: VisitOption) => void;
  onDateChange: (value: string) => void;
  onNotesChange: (value: string) => void;
  onSaveRecord: () => void;
  onSaveAndComplete?: () => void;
  onPrintPrescription?: () => void;
  selectedStatusLabel: string;
  workflowType?: "appointment" | "walk_in";
  isStepUpMode?: boolean;
  workflowStatusLabel?: string | null;
  dispenseStatusLabel?: string | null;
  lastClinicalItemCount?: number;
  lastOutsideItemCount?: number;
  canDirectDispense?: boolean;
  canPrintPrescription?: boolean;
  directDispenseDisabledReason?: string | null;
  canSaveRecord?: boolean;
  saveDisabledReason?: string | null;
  saveFeedback?: { tone: "info" | "success" | "error"; message: string } | null;
  isSavingRecord?: boolean;
  summaryDiagnoses?: string[];
  summaryTests?: string[];
  summaryPrescriptions?: Array<{
    drug: string;
    dose: string;
    terms: string;
    amount: string;
    source: string;
  }>;
};

function toCompactGuidance(message: string) {
  const normalized = message.toLowerCase();
  if (
    normalized.includes(
      "search for a patient or enter quick-create details before saving"
    )
  ) {
    return "Select a patient or finish Quick Create to enable save.";
  }
  if (
    normalized.includes("add prescription items before using doctor-direct dispense")
  ) {
    return "Add at least one prescription item to unlock direct dispense.";
  }
  if (normalized.includes("doctor-direct dispense is available only for walk-in")) {
    return "Direct dispense is available only in walk-in mode.";
  }
  if (
    normalized.includes(
      "each clinical prescription item must match an inventory item before direct dispense"
    )
  ) {
    return "Map each clinical medicine to an inventory item before direct dispense.";
  }
  return message;
}

function GuidanceCallout({
  tone,
  message,
}: {
  tone: "warning" | "info";
  message: string;
}) {
  const classes =
    tone === "warning"
      ? "border-amber-200 bg-amber-50/70 text-amber-800"
      : "border-slate-200 bg-slate-50 text-slate-700";
  const compactMessage = toCompactGuidance(message);
  return (
    <div className={`rounded-xl border px-3 py-2 ${classes}`}>
      <p className="flex items-center gap-2 min-w-0 text-[11px] font-semibold">
        <span className="shrink-0">
          {tone === "warning" ? (
            <FiAlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
          ) : (
            <FiInfo className="h-3.5 w-3.5" aria-hidden="true" />
          )}
        </span>
        <span className="truncate whitespace-nowrap" title={compactMessage}>
          {compactMessage}
        </span>
      </p>
    </div>
  );
}

export function VisitPlanner({
  nextVisitOption,
  nextVisitDate,
  notes,
  onSelectOption,
  onDateChange,
  onNotesChange,
  onSaveRecord,
  onSaveAndComplete,
  onPrintPrescription,
  selectedStatusLabel,
  workflowType = "walk_in",
  isStepUpMode = false,
  workflowStatusLabel = null,
  dispenseStatusLabel = null,
  lastClinicalItemCount = 0,
  lastOutsideItemCount = 0,
  canDirectDispense = false,
  canPrintPrescription = false,
  directDispenseDisabledReason = null,
  canSaveRecord = true,
  saveDisabledReason = null,
  saveFeedback = null,
  isSavingRecord = false,
  summaryDiagnoses = [],
  summaryTests = [],
  summaryPrescriptions = [],
}: VisitPlannerProps) {
  const diagnosisPreview = summaryDiagnoses;
  const testPreview = summaryTests;
  const prescriptionPreview = summaryPrescriptions;

  // The save/dispense guidance warnings stay hidden until the doctor actually tries to
  // save without enough data; a successful save clears them again.
  const [showSaveHints, setShowSaveHints] = useState(false);
  useEffect(() => {
    if (saveFeedback?.tone === "success") {
      setShowSaveHints(false);
    }
  }, [saveFeedback?.tone, saveFeedback?.message]);

  const handleSaveClick = () => {
    if (!canSaveRecord) {
      setShowSaveHints(true);
      return;
    }
    setShowSaveHints(false);
    onSaveRecord();
  };

  return (
    <div className="flex min-h-full flex-col gap-3">
      <div className="grid grid-cols-1 gap-3 xl:grid-cols-2 xl:grid-rows-[auto_auto] xl:gap-4">
        <div className="space-y-2 rounded-2xl border border-slate-100 bg-slate-50/50 p-3 xl:col-start-1 xl:row-start-1">
          <p className="ml-1 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Next Visit Date</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onSelectOption("TwoWeeks")}
              className={`flex-1 rounded-xl px-3 py-1.5 text-[11px] font-semibold uppercase transition ${
                nextVisitOption === "TwoWeeks"
                  ? "bg-slate-800 text-white shadow-md"
                  : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
              }`}
            >
              2 Weeks
            </button>
            <button
              type="button"
              onClick={() => onSelectOption("ThreeWeeks")}
              className={`flex-1 rounded-xl px-3 py-1.5 text-[11px] font-semibold uppercase transition ${
                nextVisitOption === "ThreeWeeks"
                  ? "bg-slate-800 text-white shadow-md"
                  : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
              }`}
            >
              3 Weeks
            </button>
          </div>
          <div className="relative">
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                value={nextVisitDate ? dayjs(nextVisitDate) : null}
                onChange={(value) => onDateChange(value ? value.format("YYYY-MM-DD") : "")}
                format="DD/MM/YYYY"
                slotProps={{
                  textField: {
                    ...appMuiPickerTextFieldProps,
                    sx: {
                      ...appMuiPickerTextFieldProps.sx,
                      "& .MuiOutlinedInput-root": {
                        ...appMuiPickerTextFieldProps.sx["& .MuiOutlinedInput-root"],
                        borderRadius: "0.75rem",
                        backgroundColor: "#ffffff",
                        fontWeight: 700,
                        minHeight: 36,
                        height: 36,
                        boxShadow: "none",
                      },
                      "& .MuiOutlinedInput-notchedOutline": {
                        borderRadius: "0.75rem",
                      },
                      "& .MuiInputBase-input": {
                        ...appMuiPickerTextFieldProps.sx["& .MuiInputBase-input"],
                        textAlign: "center",
                        fontSize: "0.8125rem",
                        height: "36px",
                      },
                    },
                  },
                }}
              />
            </LocalizationProvider>
          </div>
        </div>

        <div className="space-y-2 rounded-2xl border border-slate-100 bg-slate-50/50 p-3 xl:col-start-1 xl:row-start-2">
          <p className="ml-1 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Doctor&apos;s Notes</p>
          <textarea
            className="h-20 w-full resize-none rounded-xl border border-slate-200 bg-white p-2.5 text-[13px] text-slate-800 shadow-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-50"
            placeholder="Add clinical notes here..."
            value={notes}
            onChange={(event) => onNotesChange(event.target.value)}
          />
        </div>

        <div className="space-y-2 rounded-2xl border border-slate-100 bg-slate-50/50 p-3 xl:col-start-2 xl:row-start-1 xl:row-span-2">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Consultation Summary</p>
              <p className="mt-0.5 text-[13px] font-semibold text-slate-900">Doctor Review Snapshot</p>
            </div>
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-white">
              <FiUserCheck className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-center">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Dx</p>
              <p className="text-sm font-semibold text-slate-900">{summaryDiagnoses.length}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-center">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Tests</p>
              <p className="text-sm font-semibold text-slate-900">{summaryTests.length}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-center">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Rx</p>
              <p className="text-sm font-semibold text-slate-900">{summaryPrescriptions.length}</p>
            </div>
          </div>

          <div
            className="max-h-[280px] space-y-2 overflow-y-auto pr-1 [scrollbar-width:thin] [scrollbar-color:#94a3b8_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-400/70 hover:[&::-webkit-scrollbar-thumb]:bg-slate-500/80 xl:max-h-[300px]"
          >
            <div className="rounded-xl border border-slate-200 bg-white p-2.5">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Diagnosis</p>
              {diagnosisPreview.length > 0 ? (
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {diagnosisPreview.map((diagnosis) => (
                    <span
                      key={`diagnosis-${diagnosis}`}
                      className="rounded-full bg-slate-900/5 px-2 py-0.5 text-[11px] font-semibold text-slate-700"
                    >
                      {diagnosis}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="mt-1.5 text-[11px] text-slate-500">No diagnosis selected yet.</p>
              )}
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-2.5">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Tests</p>
              {testPreview.length > 0 ? (
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {testPreview.map((test) => (
                    <span
                      key={`test-${test}`}
                      className="rounded-full bg-sky-50 px-2 py-0.5 text-[11px] font-semibold text-sky-700"
                    >
                      {test}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="mt-1.5 text-[11px] text-slate-500">No tests selected yet.</p>
              )}
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-2.5">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Prescriptions</p>
              {prescriptionPreview.length > 0 ? (
                <div className="mt-1.5 space-y-1.5">
                  {prescriptionPreview.map((item, index) => (
                    <div key={`${item.drug}-${index}`} className="rounded-lg bg-slate-50 px-2.5 py-1.5">
                      <p className="truncate text-[11px] font-semibold text-slate-900">{item.drug}</p>
                      <p className="truncate text-[10px] text-slate-600">
                        {item.dose || "-"} | {item.terms || "-"} | Qty {item.amount || "-"} | {item.source}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-1.5 text-[11px] text-slate-500">No medicines added yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-auto space-y-2.5 rounded-2xl border border-slate-100 bg-slate-50/50 p-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-slate-900">Consultation Save</p>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
              Unified workflow
            </p>
          </div>
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-700">
            {selectedStatusLabel}
          </span>
        </div>

        <div className="flex items-stretch gap-2">
          <button
            type="button"
            onClick={handleSaveClick}
            disabled={isSavingRecord}
            className="inline-flex min-h-9 flex-1 items-center justify-center rounded-xl bg-gradient-to-r from-sky-500 via-sky-600 to-blue-600 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-white shadow-[0_12px_20px_rgba(59,130,246,0.24)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
          >
            {isSavingRecord ? "Saving consultation..." : "Save Consultation"}
          </button>
          {/* Step Up clinics complete dispense on the assistant side, so the doctor does
              not get the one-shot dispense+complete action here. */}
          {!isStepUpMode ? (
            <button
              type="button"
              onClick={onSaveAndComplete}
              disabled={workflowType !== "walk_in" || isSavingRecord || !canDirectDispense}
              className="inline-flex min-h-9 flex-1 items-center justify-center rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
            >
              Save + Dispense + Complete
            </button>
          ) : null}
          <button
            type="button"
            onClick={onPrintPrescription}
            disabled={isSavingRecord || !canPrintPrescription || !onPrintPrescription}
            aria-label="Print prescription"
            title={
              canPrintPrescription
                ? "Print current consultation summary or latest saved prescription."
                : "Add patient details, diagnosis, tests, or prescription items to enable print."
            }
            className="inline-flex min-h-9 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-300 bg-slate-50 text-slate-700 transition hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <FiPrinter className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="space-y-1.5">
          {showSaveHints && !canSaveRecord && saveDisabledReason ? (
            <GuidanceCallout tone="warning" message={saveDisabledReason} />
          ) : null}
          {showSaveHints &&
          !isStepUpMode &&
          workflowType === "walk_in" &&
          !canDirectDispense &&
          directDispenseDisabledReason ? (
            <GuidanceCallout tone="warning" message={directDispenseDisabledReason} />
          ) : null}
          {workflowStatusLabel || dispenseStatusLabel || lastClinicalItemCount > 0 || lastOutsideItemCount > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {workflowStatusLabel ? (
                <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                  Workflow: {workflowStatusLabel}
                </span>
              ) : null}
              {dispenseStatusLabel ? (
                <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                  Dispense: {dispenseStatusLabel}
                </span>
              ) : null}
              {lastClinicalItemCount > 0 || lastOutsideItemCount > 0 ? (
                <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                  Rx: {lastClinicalItemCount} clinical / {lastOutsideItemCount} outside
                </span>
              ) : null}
            </div>
          ) : null}
          {saveFeedback ? (
            <p
              title={saveFeedback.message}
              className={`text-[11px] font-semibold ${
                saveFeedback.tone === "success"
                  ? "text-emerald-700"
                  : saveFeedback.tone === "error"
                    ? "text-rose-700"
                    : "text-slate-600"
              } truncate whitespace-nowrap`}
            >
              {saveFeedback.message}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
