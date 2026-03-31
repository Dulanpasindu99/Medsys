import dayjs from "dayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { appMuiPickerTextFieldProps } from "../../../components/ui/muiFieldStyles";
import type { VisitOption } from "../hooks/useVisitPlanner";

type VisitPlannerProps = {
  onOpenClinical: () => void;
  onOpenPrescription: () => void;
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
};

export function VisitPlanner({
  onOpenClinical,
  onOpenPrescription,
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
}: VisitPlannerProps) {
  return (
    <div className="flex min-h-full flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2 xl:gap-6">
        <div className="space-y-3 rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
          <p className="ml-1 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Next Visit Date</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onSelectOption("TwoWeeks")}
              className={`flex-1 rounded-xl px-3 py-2 text-xs font-semibold uppercase transition ${
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
              className={`flex-1 rounded-xl px-3 py-2 text-xs font-semibold uppercase transition ${
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
                        minHeight: 40,
                        height: 40,
                        boxShadow: "none",
                      },
                      "& .MuiOutlinedInput-notchedOutline": {
                        borderRadius: "0.75rem",
                      },
                      "& .MuiInputBase-input": {
                        ...appMuiPickerTextFieldProps.sx["& .MuiInputBase-input"],
                        textAlign: "center",
                        fontSize: "0.875rem",
                        height: "40px",
                      },
                    },
                  },
                }}
              />
            </LocalizationProvider>
          </div>
        </div>

        <div className="space-y-3 rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
          <p className="ml-1 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Doctor&apos;s Notes</p>
          <textarea
            className="h-24 w-full resize-none rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-800 shadow-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-50"
            placeholder="Add clinical notes here..."
            value={notes}
            onChange={(event) => onNotesChange(event.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-3">
        <button
          type="button"
          onClick={onOpenClinical}
          className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-sky-700 transition hover:bg-sky-100"
        >
          Clinical
        </button>
        <button
          type="button"
          onClick={onOpenPrescription}
          className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-700 transition hover:bg-emerald-100"
        >
          Prescription
        </button>
      </div>

      <div className="mt-auto space-y-3 rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-base font-semibold text-slate-900">Consultation Save</p>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
              Unified workflow
            </p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-700">
            {selectedStatusLabel}
          </span>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <button
            type="button"
            onClick={onSaveRecord}
            disabled={isSavingRecord || !canSaveRecord}
            className="inline-flex min-h-10 w-full items-center justify-center rounded-xl bg-gradient-to-r from-sky-500 via-sky-600 to-blue-600 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.14em] text-white shadow-[0_14px_24px_rgba(59,130,246,0.24)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
          >
            {isSavingRecord ? "Saving consultation..." : "Save Consultation"}
          </button>
          <button
            type="button"
            onClick={onSaveAndComplete}
            disabled={workflowType !== "walk_in" || isSavingRecord || !canDirectDispense}
            className="inline-flex min-h-10 w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
          >
            Save + Dispense + Complete
          </button>
          <button
            type="button"
            onClick={onPrintPrescription}
            disabled={isSavingRecord || !canPrintPrescription || !onPrintPrescription}
            className="inline-flex min-h-10 w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
          >
            Print Prescription
          </button>
        </div>

        <div className="space-y-2">
          {!canSaveRecord && saveDisabledReason ? (
            <p className="text-sm font-semibold text-amber-700">{saveDisabledReason}</p>
          ) : null}
          {workflowType === "walk_in" && !canDirectDispense && directDispenseDisabledReason ? (
            <p className="text-sm font-semibold text-amber-700">
              {directDispenseDisabledReason}
            </p>
          ) : null}
          {workflowStatusLabel ? (
            <p className="text-sm font-semibold text-slate-600">Workflow: {workflowStatusLabel}</p>
          ) : null}
          {dispenseStatusLabel ? (
            <p className="text-sm font-semibold text-slate-600">Dispense: {dispenseStatusLabel}</p>
          ) : null}
          {lastClinicalItemCount > 0 || lastOutsideItemCount > 0 ? (
            <p className="text-sm font-semibold text-slate-600">
              Prescription: {lastClinicalItemCount} clinical / {lastOutsideItemCount} outside
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
    </div>
  );
}
