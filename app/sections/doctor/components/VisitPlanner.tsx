import type { VisitOption } from "../hooks/useVisitPlanner";

type VisitPlannerProps = {
  nextVisitOption: VisitOption;
  nextVisitDate: string;
  onSelectOption: (option: VisitOption) => void;
  onDateChange: (value: string) => void;
};

export function VisitPlanner({ nextVisitOption, nextVisitDate, onSelectOption, onDateChange }: VisitPlannerProps) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <div className="space-y-3 rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
        <p className="ml-1 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Next Visit Date</p>
        <div className="flex gap-2">
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
          <input
            type="text"
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-center text-sm font-bold text-slate-900 shadow-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-50"
            value={nextVisitDate}
            onChange={(e) => onDateChange(e.target.value)}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold uppercase text-slate-400">DD/MM/YYYY</div>
        </div>
      </div>

      <div className="space-y-3 rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
        <p className="ml-1 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Doctor&apos;s Notes</p>
        <textarea
          className="h-24 w-full resize-none rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-800 shadow-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-50"
          placeholder="Add clinical notes here..."
        />
      </div>
    </div>
  );
}
