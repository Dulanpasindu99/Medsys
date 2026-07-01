"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AGE_BUCKETS, REGISTRATION_FILTERS } from "../constants";
import type { AgeBucketId, Gender, RegistrationFilterId } from "../types";
import { FilterChip } from "./PatientPrimitives";

type PatientFiltersProps = {
  search: string;
  setSearch: (value: string) => void;
  gender: Gender | "all";
  setGender: (value: Gender | "all") => void;
  family: string;
  setFamily: (value: string) => void;
  families: string[];
  diagnosis: string;
  setDiagnosis: (value: string) => void;
  diagnoses: string[];
  ageRange: AgeBucketId;
  setAgeRange: (value: AgeBucketId) => void;
  registration: RegistrationFilterId;
  setRegistration: (value: RegistrationFilterId) => void;
  registrationCounts: Record<RegistrationFilterId, number>;
  filteredCount: number;
};

/**
 * Search-as-you-type combobox. Used for Family and Diagnosis filters because both
 * lists grow over time and a long dropdown becomes unusable — typing narrows them.
 */
function SearchableSelect({
  label,
  value,
  allLabel,
  options,
  onChange,
}: {
  label: string;
  value: string;
  allLabel: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handle = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return options
      .filter((option) => option !== allLabel)
      .filter((option) => (q ? option.toLowerCase().includes(q) : true))
      .slice(0, 50);
  }, [options, query, allLabel]);

  const isAll = value === allLabel;
  const select = (next: string) => {
    onChange(next);
    setQuery("");
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex min-w-[170px] items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-3.5 py-2 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.42)] transition hover:border-slate-300"
      >
        <span className="flex flex-col">
          <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-slate-400">{label}</span>
          <span className={`truncate text-[13px] font-semibold ${isAll ? "text-slate-500" : "text-slate-900"}`}>
            {isAll ? allLabel : value}
          </span>
        </span>
        <svg className={`h-4 w-4 shrink-0 text-slate-400 transition ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open ? (
        <div className="absolute right-0 z-30 mt-2 w-72 max-w-[80vw] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_18px_44px_rgba(15,23,42,0.18)]">
          <div className="border-b border-slate-100 p-2">
            <input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={`Search ${label.toLowerCase()}…`}
              className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-900 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
            />
          </div>
          <ul className="max-h-64 overflow-y-auto py-1 text-sm">
            <li>
              <button
                type="button"
                onClick={() => select(allLabel)}
                className={`flex w-full items-center px-3 py-2 text-left font-semibold transition hover:bg-slate-50 ${isAll ? "text-sky-700" : "text-slate-600"}`}
              >
                {allLabel}
              </button>
            </li>
            {filtered.map((option) => (
              <li key={option}>
                <button
                  type="button"
                  onClick={() => select(option)}
                  className={`flex w-full items-center px-3 py-2 text-left transition hover:bg-slate-50 ${option === value ? "font-semibold text-sky-700" : "text-slate-700"}`}
                >
                  {option}
                </button>
              </li>
            ))}
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-[13px] text-slate-400">No matches</li>
            ) : null}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

export function PatientFilters({
  search,
  setSearch,
  gender,
  setGender,
  family,
  setFamily,
  families,
  diagnosis,
  setDiagnosis,
  diagnoses,
  ageRange,
  setAgeRange,
  registration,
  setRegistration,
  registrationCounts,
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
              placeholder="Search name, NIC, phone…"
              className="flex-1 bg-transparent text-sm font-semibold text-slate-700 placeholder:text-slate-300 focus:outline-none"
            />
            <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setGender("Male")}
              className={`app-segment app-segment--male px-5 text-[11px] tracking-[0.2em] ${gender === "Male" ? "is-active" : ""}`}
            >
              Male
            </button>
            <button
              onClick={() => setGender("Female")}
              className={`app-segment app-segment--female px-5 text-[11px] tracking-[0.2em] ${gender === "Female" ? "is-active" : ""}`}
            >
              Female
            </button>
            <button
              onClick={() => setGender("Other")}
              className={`rounded-full border px-4 py-2 text-[11px] font-bold uppercase tracking-[0.2em] transition ${
                gender === "Other"
                  ? "border-violet-200 bg-violet-50 text-violet-700"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              Other
            </button>
            {gender !== "all" ? (
              <button onClick={() => setGender("all")} className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-400 transition hover:bg-slate-200">
                <span className="sr-only">Clear gender</span>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3">
          <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">
            Patients: <span className="ml-1 text-slate-900">{filteredCount}</span>
          </div>
          <SearchableSelect
            label="Family"
            value={family}
            allLabel="All Families"
            options={families}
            onChange={setFamily}
          />
          <SearchableSelect
            label="Diagnosis"
            value={diagnosis}
            allLabel="All Diagnoses"
            options={diagnoses}
            onChange={setDiagnosis}
          />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {AGE_BUCKETS.map((bucket) => (
          <FilterChip key={bucket.id} label={bucket.label} active={ageRange === bucket.id} onClick={() => setAgeRange(bucket.id)} />
        ))}

        <span className="mx-1 hidden h-6 w-px self-center bg-slate-200 sm:block" aria-hidden />

        {REGISTRATION_FILTERS.map((option) => (
          <FilterChip
            key={option.id}
            label={`${option.label} · ${registrationCounts[option.id]}`}
            active={registration === option.id}
            onClick={() => setRegistration(option.id)}
          />
        ))}
      </div>
    </>
  );
}
