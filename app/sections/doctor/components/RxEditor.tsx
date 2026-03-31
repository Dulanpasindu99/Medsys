import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import FormControl from "@mui/material/FormControl";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import type { SelectChangeEvent } from "@mui/material/Select";
import { FiPlus } from "react-icons/fi";
import type {
  ClinicalDrug,
  ClinicalDrugForm,
  DrugDoseUnit,
  DrugFrequencyCode,
} from "../types";

const DOSE_UNITS: Array<{ value: DrugDoseUnit; label: string }> = [
  { value: "mg", label: "mg" },
  { value: "ml", label: "mL" },
  { value: "mcg", label: "mcg" },
  { value: "g", label: "g" },
  { value: "tablet", label: "tablet" },
  { value: "capsule", label: "capsule" },
  { value: "drops", label: "drops" },
  { value: "puffs", label: "puffs" },
  { value: "sachet", label: "sachet" },
];

const FREQUENCY_OPTIONS: Array<{
  value: DrugFrequencyCode;
  label: string;
  hint: string;
}> = [
  { value: "OD", label: "OD", hint: "Once daily" },
  { value: "BD", label: "BD", hint: "Twice daily" },
  { value: "TDS", label: "TDS", hint: "Three times daily" },
  { value: "QID", label: "QID", hint: "Four times daily" },
  { value: "Q4H", label: "Q4H", hint: "Every 4 hours" },
  { value: "Q6H", label: "Q6H", hint: "Every 6 hours" },
  { value: "Q8H", label: "Q8H", hint: "Every 8 hours" },
  { value: "HS", label: "HS", hint: "At night" },
  { value: "STAT", label: "STAT", hint: "Immediately" },
  { value: "PRN", label: "PRN", hint: "As needed" },
];

type RxEditorProps = {
  onOpenClinical: () => void;
  onOpenNotes: () => void;
  rxRows: ClinicalDrug[];
  drugDraftFeedback?: string | null;
  clinicalDrugForm: ClinicalDrugForm;
  filteredDrugSuggestions: string[];
  onDrugFormChange: (patch: Partial<ClinicalDrugForm>) => void;
  onAddClinicalDrug: () => void;
  onDrugFormKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  onUpdateRxRow: (
    index: number,
    field: keyof ClinicalDrug,
    value: string,
  ) => void;
  onRemoveRxRow: (index: number) => void;
  onDemoFill: () => void;
  onClear: () => void;
};

export function RxEditor({
  onOpenClinical,
  onOpenNotes,
  rxRows,
  drugDraftFeedback = null,
  clinicalDrugForm,
  filteredDrugSuggestions,
  onDrugFormChange,
  onAddClinicalDrug,
  onDrugFormKeyDown,
  onUpdateRxRow,
  onRemoveRxRow,
  onDemoFill,
  onClear,
}: RxEditorProps) {
  const controlHeightClass = "h-10";
  const rowControlClass = "h-10 rounded-xl";
  const muiSelectSx = {
    borderRadius: "0.75rem",
    backgroundColor: "#f8fafc",
    fontSize: "0.75rem",
    fontWeight: 700,
    minHeight: 40,
    height: 40,
    "& .MuiSelect-select": {
      minHeight: "40px",
      display: "flex",
      alignItems: "center",
      boxSizing: "border-box",
      paddingTop: "0 !important",
      paddingBottom: "0 !important",
    },
  } as const;
  const drugNameInputId = "rx-drug-name";
  const doseValueInputId = "rx-dose-value";
  const doseUnitSelectId = "rx-dose-unit";
  const frequencySelectId = "rx-frequency";
  const quantityInputId = "rx-quantity";
  const [isSuggestionMenuOpen, setIsSuggestionMenuOpen] = useState(false);
  const suggestionContainerRef = useRef<HTMLDivElement | null>(null);
  const showSuggestions =
    isSuggestionMenuOpen &&
    clinicalDrugForm.name.trim().length > 0 &&
    filteredDrugSuggestions.length > 0;

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!suggestionContainerRef.current?.contains(event.target as Node)) {
        setIsSuggestionMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  const canAddDrug =
    clinicalDrugForm.name.trim().length > 0 &&
    clinicalDrugForm.doseValue.trim().length > 0 &&
    clinicalDrugForm.amount.trim().length > 0;

  return (
    <div className="relative z-0 flex h-full min-h-0 flex-col gap-3 rounded-[28px] border border-slate-200/90 bg-[linear-gradient(180deg,rgba(255,255,255,0.96)_0%,rgba(248,250,252,0.95)_100%)] p-3 shadow-[0_20px_42px_rgba(148,163,184,0.12)] ring-1 ring-white/70">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="ml-1 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">
          Prescription / Drugs
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onDemoFill}
            className="rounded-full bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50"
          >
            Demo Fill
          </button>
          <button
            type="button"
            onClick={onClear}
            className="rounded-full bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-rose-500 shadow-sm ring-1 ring-rose-200 hover:bg-rose-50"
          >
            Clear
          </button>
        </div>
      </div>

      <form
        className="rounded-[24px] border border-slate-200/80 bg-white/95 p-3 shadow-[0_12px_28px_rgba(148,163,184,0.12)]"
        onSubmit={(event) => {
          event.preventDefault();
          onAddClinicalDrug();
          setIsSuggestionMenuOpen(false);
        }}
      >
        <div className="grid gap-3">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(0,1.35fr)_220px_minmax(0,1.4fr)_108px_150px_44px] xl:items-end">
            <div className="relative min-w-0" ref={suggestionContainerRef}>
              <label
                htmlFor={drugNameInputId}
                className="mb-1 block text-[10px] font-bold uppercase text-slate-400"
              >
                Drug Name
              </label>
              <input
                id={drugNameInputId}
                className={`${controlHeightClass} w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-[13px] font-semibold outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100`}
                placeholder="e.g. Paracetamol"
                value={clinicalDrugForm.name}
                onChange={(e) => {
                  onDrugFormChange({ name: e.target.value });
                  setIsSuggestionMenuOpen(true);
                }}
                onFocus={() => setIsSuggestionMenuOpen(true)}
                onKeyDown={(event) => {
                  onDrugFormKeyDown(event);
                  if (event.key === "Enter") {
                    setIsSuggestionMenuOpen(false);
                  }
                }}
              />
              {showSuggestions && (
                <div className="absolute inset-x-0 top-full z-20 mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_20px_40px_rgba(15,23,42,0.16)]">
                  {filteredDrugSuggestions.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => {
                        onDrugFormChange({ name: s });
                        setIsSuggestionMenuOpen(false);
                      }}
                      className="block w-full border-b border-slate-100 px-4 py-3 text-left last:border-b-0 hover:bg-sky-50"
                    >
                      <span className="block text-sm font-semibold text-slate-800">
                        {s}
                      </span>
                      <span className="block text-xs text-slate-500">
                        Tap to use this medicine
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="min-w-0">
              <label
                htmlFor={doseValueInputId}
                className="mb-1 block text-[10px] font-bold uppercase text-slate-400"
              >
                Dose
              </label>
              <div className="grid grid-cols-[1.2fr_96px] gap-2">
                <input
                  id={doseValueInputId}
                  className={`${controlHeightClass} w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-[13px] font-semibold outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100`}
                  placeholder="500"
                  value={clinicalDrugForm.doseValue}
                  onChange={(e) =>
                    onDrugFormChange({
                      doseValue: e.target.value.replace(/[^0-9.]/g, ""),
                    })
                  }
                  onKeyDown={onDrugFormKeyDown}
                />
                <div className="relative">
                  <FormControl fullWidth size="small">
                    <Select
                      id={doseUnitSelectId}
                      aria-label="Dose unit"
                      value={clinicalDrugForm.doseUnit}
                      onChange={(event: SelectChangeEvent<DrugDoseUnit>) =>
                        onDrugFormChange({
                          doseUnit: event.target.value as DrugDoseUnit,
                        })
                      }
                      sx={muiSelectSx}
                    >
                      {DOSE_UNITS.map((unit) => (
                        <MenuItem key={unit.value} value={unit.value}>
                          {unit.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </div>
              </div>
            </div>

            <div className="min-w-0">
              <label
                htmlFor={frequencySelectId}
                className="mb-1 block text-[10px] font-bold uppercase text-slate-400"
              >
                Frequency
              </label>
              <FormControl fullWidth size="small">
                <Select
                  id={frequencySelectId}
                  value={clinicalDrugForm.frequencyCode}
                  onChange={(event: SelectChangeEvent<DrugFrequencyCode>) =>
                    onDrugFormChange({
                      frequencyCode: event.target.value as DrugFrequencyCode,
                    })
                  }
                  sx={muiSelectSx}
                >
                  {FREQUENCY_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label} - {option.hint}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </div>

            <div className="min-w-0">
              <label
                htmlFor={quantityInputId}
                className="mb-1 block text-[10px] font-bold uppercase text-slate-400"
              >
                Total Qty
              </label>
              <input
                id={quantityInputId}
                className={`${controlHeightClass} w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-center text-[13px] font-semibold outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100`}
                placeholder="12"
                value={clinicalDrugForm.amount}
                onChange={(e) =>
                  onDrugFormChange({
                    amount: e.target.value.replace(/[^0-9]/g, ""),
                  })
                }
                onKeyDown={onDrugFormKeyDown}
              />
            </div>
            <div className="min-w-0">
              <label className="mb-1 block text-[10px] font-bold uppercase text-slate-400">
                Source
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(["Clinical", "Outside"] as const).map((source) => (
                  <button
                    key={source}
                    type="button"
                    onClick={() => {
                      if (clinicalDrugForm.source !== source) {
                        onDrugFormChange({ source });
                      }
                    }}
                    className={`${controlHeightClass} rounded-xl px-2 text-[11px] font-bold uppercase tracking-[0.12em] transition ${
                      clinicalDrugForm.source === source
                        ? source === "Clinical"
                          ? "bg-emerald-500 text-white shadow-[0_12px_24px_rgba(16,185,129,0.25)]"
                          : "bg-amber-500 text-white shadow-[0_12px_24px_rgba(245,158,11,0.25)]"
                        : "border border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700"
                    }`}
                  >
                    {source}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex min-w-0 flex-col items-end">
              <span className="mb-1 block h-[14px] text-[10px] font-bold uppercase text-transparent select-none">
                Add
              </span>
              <button
                type="submit"
                aria-label="Add drug"
                disabled={!canAddDrug}
                className="flex h-10 w-10 items-center justify-center self-end rounded-full bg-gradient-to-r from-sky-500 via-sky-600 to-blue-600 text-white shadow-[0_14px_28px_rgba(59,130,246,0.28)] transition-transform duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_18px_32px_rgba(59,130,246,0.32)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0 disabled:hover:shadow-[0_14px_28px_rgba(59,130,246,0.18)]"
              >
                <FiPlus aria-hidden="true" className="h-5 w-5" />
              </button>
            </div>
          </div>
          {!canAddDrug ? (
            <p className="text-xs font-medium text-slate-500">
              Enter drug name, dose, and total quantity to add the prescription row.
            </p>
          ) : null}
          {drugDraftFeedback ? (
            <p className="text-xs font-semibold text-rose-600">{drugDraftFeedback}</p>
          ) : null}
        </div>
      </form>

      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        <div className="flex flex-col gap-2">
        {rxRows.length === 0 && (
          <div className="py-4 text-center text-sm italic text-slate-400">
            No drugs added yet.
          </div>
        )}
        {rxRows.map((row, index) => (
          <div
            key={`${row.drug}-${index}`}
            className="group grid gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition hover:border-sky-200 hover:shadow-md md:grid-cols-2 xl:grid-cols-[minmax(0,1.5fr)_180px_96px_210px_110px] xl:items-center"
          >
            <div className="flex min-w-0 flex-[2] flex-col justify-center">
              <span className="text-sm font-bold text-slate-900">
                {row.drug}
              </span>
              <span className="mt-1 text-xs text-slate-500">{row.dose}</span>
            </div>
            <div
              className={`${rowControlClass} flex items-center rounded-xl bg-slate-50 px-3 text-xs font-semibold text-slate-700 ring-1 ring-slate-200`}
            >
              {row.terms}
            </div>
            <div className="min-w-0 text-center text-sm font-bold text-slate-800">
              <input
                className={`${rowControlClass} w-full border border-slate-200 bg-slate-50 px-2 text-center outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100`}
                value={row.amount}
                onChange={(e) => onUpdateRxRow(index, "amount", e.target.value)}
              />
            </div>
            <div className="grid min-w-0 grid-cols-2 gap-2">
              {(["Clinical", "Outside"] as const).map((source) => (
                <button
                  key={source}
                  type="button"
                  onClick={() => onUpdateRxRow(index, "source", source)}
                  className={`${rowControlClass} px-2 text-[10px] font-bold uppercase tracking-[0.16em] ${
                    row.source === source
                      ? source === "Clinical"
                        ? "bg-emerald-500 text-white"
                        : "bg-amber-500 text-white"
                      : "border border-slate-200 bg-white text-slate-500"
                  }`}
                >
                  {source}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => onRemoveRxRow(index)}
              className={`${rowControlClass} border border-rose-200 bg-rose-50 px-3 text-[11px] font-bold uppercase tracking-[0.16em] text-rose-600 transition hover:bg-rose-100 hover:text-rose-700 md:col-span-2 xl:col-span-1`}
            >
              Remove
            </button>
          </div>
        ))}
        <div className="flex flex-wrap justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onOpenClinical}
            className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-sky-700 transition hover:bg-sky-100"
          >
            Clinical
          </button>
          <button
            type="button"
            onClick={onOpenNotes}
            className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-amber-700 transition hover:bg-amber-100"
          >
            Notes
          </button>
        </div>
        </div>
      </div>
    </div>
  );
}
