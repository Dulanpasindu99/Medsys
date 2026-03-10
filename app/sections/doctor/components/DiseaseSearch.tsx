import type { KeyboardEvent } from "react";

type DiseaseSearchProps = {
  diseaseQuery: string;
  setDiseaseQuery: (value: string) => void;
  handleDiseaseKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  isFetchingDiseases: boolean;
  diseaseSuggestions: string[];
  highlightedDiseaseIndex: number;
  addDisease: (disease: string) => void;
  selectedDiseases: string[];
  chipsPendingRemoval: Set<string>;
  toggleChipRemovalState: (disease: string) => void;
  testQuery: string;
  setTestQuery: (value: string) => void;
  handleMedicalTestKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  filteredTestOptions: string[];
  highlightedTestIndex: number;
  addMedicalTest: (test: string) => void;
  selectedTests: string[];
  testChipsPendingRemoval: Set<string>;
  toggleTestChipRemovalState: (test: string) => void;
};

export function DiseaseSearch({
  diseaseQuery,
  setDiseaseQuery,
  handleDiseaseKeyDown,
  isFetchingDiseases,
  diseaseSuggestions,
  highlightedDiseaseIndex,
  addDisease,
  selectedDiseases,
  chipsPendingRemoval,
  toggleChipRemovalState,
  testQuery,
  setTestQuery,
  handleMedicalTestKeyDown,
  filteredTestOptions,
  highlightedTestIndex,
  addMedicalTest,
  selectedTests,
  testChipsPendingRemoval,
  toggleTestChipRemovalState,
}: DiseaseSearchProps) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <div className="space-y-2">
        <p className="ml-1 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Diagnosis (ICD-10)</p>
        <div className="relative">
          <input
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow-sm outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-50"
            placeholder="Type to search ICD-10 database..."
            value={diseaseQuery}
            onChange={(e) => setDiseaseQuery(e.target.value)}
            onKeyDown={handleDiseaseKeyDown}
          />
          {isFetchingDiseases && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="size-4 animate-spin rounded-full border-2 border-slate-200 border-t-sky-500" />
            </div>
          )}
          {diseaseSuggestions.length > 0 && (
            <div className="absolute inset-x-0 top-full z-20 mt-2 max-h-60 overflow-y-auto rounded-2xl bg-white p-2 shadow-xl ring-1 ring-slate-200">
              {diseaseSuggestions.map((suggestion, idx) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => addDisease(suggestion)}
                  className={`block w-full rounded-xl px-3 py-2 text-left text-sm font-medium transition ${
                    idx === highlightedDiseaseIndex ? "bg-sky-50 text-sky-700" : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {selectedDiseases.map((d) => {
            const isPending = chipsPendingRemoval.has(d);
            return (
              <button
                key={d}
                type="button"
                data-disease-chip
                data-pending-removal={isPending}
                onClick={() => toggleChipRemovalState(d)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                  isPending ? "bg-rose-100 text-rose-700 ring-1 ring-rose-200" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {d} {isPending ? "x" : ""}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <p className="ml-1 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Medical Tests</p>
        <div className="relative">
          <input
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow-sm outline-none transition focus:border-purple-300 focus:ring-4 focus:ring-purple-50"
            placeholder="Add tests"
            value={testQuery}
            onChange={(e) => setTestQuery(e.target.value)}
            onKeyDown={handleMedicalTestKeyDown}
          />
          {filteredTestOptions.length > 0 && testQuery.length > 0 && (
            <div className="absolute inset-x-0 top-full z-20 mt-2 max-h-60 overflow-y-auto rounded-2xl bg-white p-2 shadow-xl ring-1 ring-slate-200">
              {filteredTestOptions.map((test, idx) => (
                <button
                  key={test}
                  type="button"
                  onClick={() => addMedicalTest(test)}
                  className={`block w-full rounded-xl px-3 py-2 text-left text-sm font-medium transition ${
                    idx === highlightedTestIndex ? "bg-purple-50 text-purple-700" : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {test}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {selectedTests.map((t) => {
            const isPending = testChipsPendingRemoval.has(t);
            return (
              <button
                key={t}
                type="button"
                data-test-chip
                data-pending-removal={isPending}
                onClick={() => toggleTestChipRemovalState(t)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                  isPending
                    ? "bg-rose-100 text-rose-700 ring-1 ring-rose-200"
                    : "bg-purple-50 text-purple-700 ring-1 ring-purple-100 hover:bg-purple-100"
                }`}
              >
                {t} {isPending ? "x" : ""}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
