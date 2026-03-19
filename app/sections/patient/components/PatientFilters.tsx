import { AGE_BUCKETS } from "../constants";
import type { AgeBucketId, Gender } from "../types";
import { FilterChip } from "./PatientPrimitives";

type PatientFiltersProps = {
  search: string;
  setSearch: (value: string) => void;
  gender: Gender | "all";
  setGender: (value: Gender | "all") => void;
  family: string;
  setFamily: (value: string) => void;
  families: string[];
  ageRange: AgeBucketId;
  setAgeRange: (value: AgeBucketId) => void;
  filteredCount: number;
};

export function PatientFilters({
  search,
  setSearch,
  gender,
  setGender,
  family,
  setFamily,
  families,
  ageRange,
  setAgeRange,
  filteredCount,
}: PatientFiltersProps) {
  return (
    <>
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-1 flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex flex-1 items-center gap-3 rounded-[20px] bg-white px-5 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.42)] ring-1 ring-slate-200">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Enter NIC No"
              className="flex-1 bg-transparent text-sm font-bold uppercase tracking-wider text-slate-700 placeholder:text-slate-300 focus:outline-none"
            />
            <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setGender("Male")}
              className={`app-segment app-segment--male px-6 text-[11px] tracking-[0.2em] ${gender === "Male" ? "is-active" : ""}`}
            >
              Male
            </button>
            <button
              onClick={() => setGender("Female")}
              className={`app-segment app-segment--female px-6 text-[11px] tracking-[0.2em] ${gender === "Female" ? "is-active" : ""}`}
            >
              Female
            </button>
            {gender !== "all" && (
              <button onClick={() => setGender("all")} className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-400 transition hover:bg-slate-200">
                <span className="sr-only">Clear</span>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-6">
          <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-400">
            Patient No: <span className="ml-1 text-slate-900">{filteredCount}</span>
          </div>

          <div className="hidden items-center gap-3 rounded-2xl border border-slate-100 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.42)] sm:flex">
            <span className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Family</span>
            <select value={family} onChange={(e) => setFamily(e.target.value)} className="bg-transparent text-xs font-bold uppercase tracking-wider text-slate-800 outline-none">
              {families.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {AGE_BUCKETS.map((bucket) => (
          <FilterChip key={bucket.id} label={bucket.label} active={ageRange === bucket.id} onClick={() => setAgeRange(bucket.id)} />
        ))}
      </div>
    </>
  );
}
