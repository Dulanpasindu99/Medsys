import type { KeyboardEvent } from "react";
import type { ClinicalDrug, ClinicalDrugForm } from "../types";

type RxEditorProps = {
  rxRows: ClinicalDrug[];
  clinicalDrugForm: ClinicalDrugForm;
  filteredDrugSuggestions: string[];
  onDrugFormChange: (patch: Partial<ClinicalDrugForm>) => void;
  onToggleDoseUnit: () => void;
  onToggleTerms: () => void;
  onToggleDrugSource: () => void;
  onAddClinicalDrug: () => void;
  onDrugFormKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  onUpdateRxRow: (index: number, field: keyof ClinicalDrug, value: string) => void;
  onRemoveRxRow: (index: number) => void;
  onDemoFill: () => void;
  onClear: () => void;
};

export function RxEditor({
  rxRows,
  clinicalDrugForm,
  filteredDrugSuggestions,
  onDrugFormChange,
  onToggleDoseUnit,
  onToggleTerms,
  onToggleDrugSource,
  onAddClinicalDrug,
  onDrugFormKeyDown,
  onUpdateRxRow,
  onRemoveRxRow,
  onDemoFill,
  onClear,
}: RxEditorProps) {
  return (
    <div className="relative z-0 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
      <div className="flex items-center justify-between">
        <p className="ml-1 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">Prescription / Drugs</p>
        <div className="flex gap-2">
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

      <div className="flex flex-col gap-3 rounded-xl bg-white p-3 shadow-sm ring-1 ring-slate-200 lg:flex-row lg:items-end">
        <div className="relative flex-1">
          <label className="mb-1 block text-[10px] font-bold uppercase text-slate-400">Drug Name</label>
          <input
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
            placeholder="e.g. Paracetamol"
            value={clinicalDrugForm.name}
            onChange={(e) => onDrugFormChange({ name: e.target.value })}
            onKeyDown={onDrugFormKeyDown}
          />
          {clinicalDrugForm.name && filteredDrugSuggestions.length > 0 && (
            <div className="absolute inset-x-0 top-full z-20 mt-2 overflow-hidden rounded-xl bg-white shadow-xl ring-1 ring-slate-200">
              {filteredDrugSuggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => onDrugFormChange({ name: s })}
                  className="block w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="w-28">
          <label className="mb-1 block text-[10px] font-bold uppercase text-slate-400">Dose</label>
          <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-0.5">
            <input
              className="w-full min-w-0 bg-transparent px-2 py-1.5 text-center text-sm font-semibold outline-none"
              placeholder="500"
              value={clinicalDrugForm.doseValue}
              onChange={(e) => onDrugFormChange({ doseValue: e.target.value })}
              onKeyDown={onDrugFormKeyDown}
            />
            <button
              type="button"
              onClick={onToggleDoseUnit}
              className="rounded-lg bg-white px-2 py-1 text-[10px] font-bold text-slate-600 shadow-sm ring-1 ring-slate-200"
            >
              {clinicalDrugForm.doseUnit}
            </button>
          </div>
        </div>

        <div className="flex-[1.5]">
          <label className="mb-1 block text-[10px] font-bold uppercase text-slate-400">Frequency</label>
          <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-0.5">
            <button type="button" onClick={onToggleTerms} className="px-2 text-[10px] font-bold uppercase text-slate-500 hover:text-slate-800">
              {clinicalDrugForm.terms}
            </button>
            <input
              className="w-full min-w-0 bg-transparent px-2 py-1.5 text-sm font-semibold outline-none"
              placeholder="e.g. 3 x 4"
              value={clinicalDrugForm.termsValue}
              onChange={(e) => onDrugFormChange({ termsValue: e.target.value })}
              onKeyDown={onDrugFormKeyDown}
            />
          </div>
        </div>

        <div className="w-20">
          <label className="mb-1 block text-[10px] font-bold uppercase text-slate-400">Qty</label>
          <input
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-center text-sm font-semibold outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
            placeholder="12"
            value={clinicalDrugForm.amount}
            onChange={(e) => onDrugFormChange({ amount: e.target.value.replace(/[^0-9]/g, "") })}
            onKeyDown={onDrugFormKeyDown}
          />
        </div>

        <div className="flex w-32 items-center justify-end gap-2 pb-0.5">
          <button
            type="button"
            onClick={onToggleDrugSource}
            className={`h-10 flex-1 rounded-xl text-[10px] font-bold uppercase tracking-wider transition ${
              clinicalDrugForm.source === "Clinical"
                ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 hover:bg-emerald-100"
                : "bg-amber-50 text-amber-700 ring-1 ring-amber-200 hover:bg-amber-100"
            }`}
          >
            {clinicalDrugForm.source}
          </button>
          <button type="button" onClick={onAddClinicalDrug} className="flex size-10 items-center justify-center rounded-xl bg-slate-900 text-white hover:bg-slate-700">
            +
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {rxRows.length === 0 && <div className="py-4 text-center text-sm italic text-slate-400">No drugs added yet.</div>}
        {rxRows.map((row, index) => (
          <div
            key={`${row.drug}-${index}`}
            className="group flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition hover:border-sky-200 hover:shadow-md lg:flex-row lg:items-center"
          >
            <div className="flex flex-[2] flex-col">
              <span className="text-sm font-bold text-slate-900">{row.drug}</span>
              <span className="text-xs text-slate-500">{row.dose}</span>
            </div>
            <div className="flex-1 text-xs font-medium text-slate-600">{row.terms}</div>
            <div className="w-20 text-center text-sm font-bold text-slate-800">
              <input className="w-full bg-transparent text-center outline-none" value={row.amount} onChange={(e) => onUpdateRxRow(index, "amount", e.target.value)} />
            </div>
            <div className="w-24 text-center">
              <button
                type="button"
                onClick={() => onUpdateRxRow(index, "source", row.source === "Clinical" ? "Outside" : "Clinical")}
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                  row.source === "Clinical" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                }`}
              >
                {row.source}
              </button>
            </div>
            <button type="button" onClick={() => onRemoveRxRow(index)} className="ml-2 text-slate-300 hover:text-rose-500">
              x
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
