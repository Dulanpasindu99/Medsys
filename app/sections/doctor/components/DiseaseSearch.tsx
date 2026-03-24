import type { KeyboardEvent } from "react";
import type {
  ClinicalDiagnosisOption,
  ClinicalDiagnosisSelection,
  ClinicalTestOption,
} from "../types";

type DiseaseSearchProps = {
  diseaseQuery: string;
  setDiseaseQuery: (value: string) => void;
  handleDiseaseKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  isFetchingDiseases: boolean;
  diseaseSuggestions: ClinicalDiagnosisOption[];
  highlightedDiseaseIndex: number;
  addDisease: (disease: ClinicalDiagnosisOption) => void;
  selectedDiseases: ClinicalDiagnosisSelection[];
  togglePersistAsCondition: (diagnosisCode: string) => void;
  chipsPendingRemoval: Set<string>;
  toggleChipRemovalState: (diagnosisCode: string) => void;
  testQuery: string;
  setTestQuery: (value: string) => void;
  handleMedicalTestKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  isFetchingTests: boolean;
  testSearchFeedback: string | null;
  filteredTestOptions: ClinicalTestOption[];
  highlightedTestIndex: number;
  addMedicalTest: (test: ClinicalTestOption) => void;
  selectedTests: ClinicalTestOption[];
  testChipsPendingRemoval: Set<string>;
  toggleTestChipRemovalState: (testCode: string) => void;
  recommendedTests: ClinicalTestOption[];
  addRecommendedTests: () => void;
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
  togglePersistAsCondition,
  chipsPendingRemoval,
  toggleChipRemovalState,
  testQuery,
  setTestQuery,
  handleMedicalTestKeyDown,
  isFetchingTests,
  testSearchFeedback,
  filteredTestOptions,
  highlightedTestIndex,
  addMedicalTest,
  selectedTests,
  testChipsPendingRemoval,
  toggleTestChipRemovalState,
  recommendedTests,
  addRecommendedTests,
}: DiseaseSearchProps) {
  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2 xl:gap-6">
      <div className="space-y-2">
        <p className="ml-1 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Diagnosis (ICD-10)</p>
        <div className="relative">
          <input
            className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 shadow-sm outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-50"
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
                  key={`${suggestion.code}-${suggestion.display}`}
                  type="button"
                  onClick={() => addDisease(suggestion)}
                  className={`block w-full rounded-xl px-3 py-2 text-left text-sm font-medium transition ${
                    idx === highlightedDiseaseIndex ? "bg-sky-50 text-sky-700" : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <span className="block font-semibold">{suggestion.display}</span>
                  <span className="block text-xs text-slate-500">
                    {suggestion.codeSystem} {suggestion.code}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {selectedDiseases.map((d) => {
            const isPending = chipsPendingRemoval.has(d.code);
            const isPersisted = Boolean(d.persistAsCondition);
            return (
              <div
                key={d.code}
                className="inline-flex items-center gap-2 rounded-full bg-white/90 px-2 py-1 ring-1 ring-slate-200"
              >
                <button
                  type="button"
                  data-disease-chip
                  data-pending-removal={isPending}
                  onClick={() => toggleChipRemovalState(d.code)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                    isPending
                      ? "bg-rose-100 text-rose-700 ring-1 ring-rose-200"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {d.display} {isPending ? "x" : ""}
                </button>
                <button
                  type="button"
                  onClick={() => togglePersistAsCondition(d.code)}
                  className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] transition ${
                    isPersisted
                      ? "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200"
                      : "bg-amber-50 text-amber-700 ring-1 ring-amber-200 hover:bg-amber-100"
                  }`}
                >
                  {isPersisted ? "Condition" : "Chronic?"}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <p className="ml-1 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Medical Tests</p>
        <div className="relative">
          <input
            className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 shadow-sm outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-50"
            placeholder="Add tests"
            value={testQuery}
            onChange={(e) => setTestQuery(e.target.value)}
            onKeyDown={handleMedicalTestKeyDown}
          />
          {isFetchingTests && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="size-4 animate-spin rounded-full border-2 border-slate-200 border-t-sky-500" />
            </div>
          )}
          {filteredTestOptions.length > 0 && testQuery.length > 0 && (
            <div className="absolute inset-x-0 top-full z-20 mt-2 max-h-60 overflow-y-auto rounded-2xl bg-white p-2 shadow-xl ring-1 ring-slate-200">
              {filteredTestOptions.map((test, idx) => (
                <button
                  key={`${test.code}-${test.display}`}
                  type="button"
                  onClick={() => addMedicalTest(test)}
                  className={`block w-full rounded-xl px-3 py-2 text-left text-sm font-medium transition ${
                    idx === highlightedTestIndex ? "bg-purple-50 text-purple-700" : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <span className="block font-semibold">{test.display}</span>
                  <span className="block text-xs text-slate-500">
                    {test.codeSystem} {test.code}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
        <p className="ml-1 text-xs font-medium text-slate-500">
          Search lab tests and clinical observations only. Imaging and procedures will come from a separate catalog.
        </p>
        {testSearchFeedback ? (
          <p className="ml-1 text-sm font-semibold text-amber-700">{testSearchFeedback}</p>
        ) : null}
        {recommendedTests.length > 0 ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-700">
                Recommended Tests
              </p>
              <button
                type="button"
                onClick={addRecommendedTests}
                className="rounded-full border border-emerald-200 bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-700"
              >
                Add Recommended
              </button>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {recommendedTests.map((test) => (
                <button
                  key={`recommended-${test.code}`}
                  type="button"
                  onClick={() => addMedicalTest(test)}
                  className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200"
                >
                  {test.display}
                </button>
              ))}
            </div>
          </div>
        ) : null}
        <div className="flex flex-wrap gap-2">
          {selectedTests.map((t) => {
            const isPending = testChipsPendingRemoval.has(t.code);
            return (
              <button
                key={t.code}
                type="button"
                data-test-chip
                data-pending-removal={isPending}
                onClick={() => toggleTestChipRemovalState(t.code)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                  isPending
                    ? "bg-rose-100 text-rose-700 ring-1 ring-rose-200"
                    : "bg-sky-50 text-sky-700 ring-1 ring-sky-100 hover:bg-sky-100"
                }`}
              >
                {t.display} {isPending ? "x" : ""}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
