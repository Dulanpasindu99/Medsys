'use client';

import React, { useMemo, useState } from 'react';
import { StatsIcon } from '../components/NavigationPanel';
import { NavigationPageShell } from '../components/NavigationPageShell';

interface DiseaseRecord {
  id: string;
  disease: string;
  patient: string;
  gender: 'Male' | 'Female';
  age: number;
  family: string;
  month: string; // YYYY-MM
  recurrence: number;
  source: 'Clinic' | 'Outside';
}

const SHADOWS = {
  card: 'shadow-[0_20px_48px_rgba(15,23,42,0.12)]',
  inset: 'shadow-[inset_0_1px_0_rgba(255,255,255,0.38)]',
  chip: 'shadow-[0_10px_24px_rgba(15,23,42,0.08)]',
} as const;

const diseaseRecords: DiseaseRecord[] = [
  {
    id: 'd-01',
    disease: 'Fever',
    patient: 'Ranil Wickramasinghe',
    gender: 'Male',
    age: 70,
    family: 'Wickramasinghe',
    month: '2024-05',
    recurrence: 2,
    source: 'Clinic',
  },
  {
    id: 'd-02',
    disease: 'Headache',
    patient: 'Chandraka Bandaranayaka',
    gender: 'Female',
    age: 65,
    family: 'Bandaranayaka',
    month: '2024-04',
    recurrence: 1,
    source: 'Clinic',
  },
  {
    id: 'd-03',
    disease: 'Diabetes',
    patient: 'Mahinda Rajapaksha',
    gender: 'Male',
    age: 66,
    family: 'Rajapaksha',
    month: '2024-03',
    recurrence: 4,
    source: 'Clinic',
  },
  {
    id: 'd-04',
    disease: 'Fever',
    patient: 'Chandrika Bandranayaka',
    gender: 'Female',
    age: 63,
    family: 'Bandaranayaka',
    month: '2024-06',
    recurrence: 1,
    source: 'Outside',
  },
  {
    id: 'd-05',
    disease: 'Hypertension',
    patient: 'Premadasa',
    gender: 'Male',
    age: 66,
    family: 'Premadasa',
    month: '2024-06',
    recurrence: 3,
    source: 'Clinic',
  },
  {
    id: 'd-06',
    disease: 'Asthma',
    patient: 'JR Jayawardhana',
    gender: 'Male',
    age: 62,
    family: 'Jayawardhana',
    month: '2024-05',
    recurrence: 2,
    source: 'Outside',
  },
  {
    id: 'd-07',
    disease: 'Fever',
    patient: 'Mitreepala Sirisena',
    gender: 'Male',
    age: 68,
    family: 'Sirisena',
    month: '2024-04',
    recurrence: 1,
    source: 'Clinic',
  },
  {
    id: 'd-08',
    disease: 'Hypertension',
    patient: 'Dulani Wickramasinghe',
    gender: 'Female',
    age: 54,
    family: 'Wickramasinghe',
    month: '2024-02',
    recurrence: 2,
    source: 'Outside',
  },
  {
    id: 'd-09',
    disease: 'Diabetes',
    patient: 'Tharindu Perera',
    gender: 'Male',
    age: 48,
    family: 'Perera',
    month: '2024-05',
    recurrence: 1,
    source: 'Clinic',
  },
  {
    id: 'd-10',
    disease: 'Asthma',
    patient: 'Ishara Perera',
    gender: 'Female',
    age: 44,
    family: 'Perera',
    month: '2024-03',
    recurrence: 2,
    source: 'Clinic',
  },
  {
    id: 'd-11',
    disease: 'Fever',
    patient: 'Pramod Silva',
    gender: 'Male',
    age: 29,
    family: 'Silva',
    month: '2024-06',
    recurrence: 1,
    source: 'Outside',
  },
  {
    id: 'd-12',
    disease: 'Headache',
    patient: 'Samanthi Silva',
    gender: 'Female',
    age: 31,
    family: 'Silva',
    month: '2024-05',
    recurrence: 1,
    source: 'Clinic',
  },
];

const monthName = (month: string) => {
  const [year, monthIndex] = month.split('-').map(Number);
  return new Date(year, monthIndex - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
};

const toPercentage = (value: number, total: number) => (total === 0 ? 0 : Math.round((value / total) * 100));

export default function AnalyticsCommandCenter() {
  const [search, setSearch] = useState('');
  const [gender, setGender] = useState<'all' | 'Male' | 'Female'>('all');
  const [month, setMonth] = useState<string>('all');
  const [family, setFamily] = useState<string>('all');
  const [disease, setDisease] = useState<string>('all');
  const [compareDisease, setCompareDisease] = useState<string>('Fever');

  const families = useMemo(() => Array.from(new Set(diseaseRecords.map((item) => item.family))), []);
  const diseaseNames = useMemo(() => Array.from(new Set(diseaseRecords.map((item) => item.disease))), []);
  const months = useMemo(() => Array.from(new Set(diseaseRecords.map((item) => item.month))).sort(), []);

  const filteredRecords = useMemo(() => {
    return diseaseRecords.filter((entry) => {
      const matchesSearch = `${entry.disease} ${entry.patient} ${entry.family}`
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchesGender = gender === 'all' || entry.gender === gender;
      const matchesMonth = month === 'all' || entry.month === month;
      const matchesFamily = family === 'all' || entry.family === family;
      const matchesDisease = disease === 'all' || entry.disease === disease;

      return matchesSearch && matchesGender && matchesMonth && matchesFamily && matchesDisease;
    });
  }, [search, gender, month, family, disease]);

  const diseaseBreakdown = useMemo(() => {
    const map = new Map<string, { total: number; male: number; female: number; ages: number[] }>();
    filteredRecords.forEach((item) => {
      const current = map.get(item.disease) || { total: 0, male: 0, female: 0, ages: [] };
      current.total += 1;
      current.ages.push(item.age);
      if (item.gender === 'Male') current.male += 1;
      if (item.gender === 'Female') current.female += 1;
      map.set(item.disease, current);
    });

    return Array.from(map.entries())
      .map(([key, value]) => ({ disease: key, ...value }))
      .sort((a, b) => b.total - a.total);
  }, [filteredRecords]);

  const topDisease = diseaseBreakdown[0];
  const allFamilies = useMemo(() => new Set(diseaseRecords.map((item) => item.family)), []);
  const activeFamilies = useMemo(() => new Set(filteredRecords.map((item) => item.family)), [filteredRecords]);

  const monthlyTrend = useMemo(() => {
    const map = new Map<string, number>();
    const relevant = disease === 'all' ? filteredRecords : filteredRecords.filter((item) => item.disease === disease);
    relevant.forEach((item) => {
      map.set(item.month, (map.get(item.month) || 0) + 1);
    });
    return months.map((monthKey) => ({
      month: monthKey,
      count: map.get(monthKey) || 0,
    }));
  }, [filteredRecords, months, disease]);

  const comparison = useMemo(() => {
    const targetDisease = compareDisease || 'Fever';
    const sortedMonths = [...months].sort();
    const latest = sortedMonths[sortedMonths.length - 1];
    const previous = sortedMonths[sortedMonths.length - 2];

    const countFor = (monthKey?: string) =>
      filteredRecords.filter((item) => item.disease === targetDisease && (!monthKey || item.month === monthKey)).length;

    const latestCount = countFor(latest);
    const prevCount = countFor(previous);
    const delta = latestCount - prevCount;
    const percentageChange = prevCount === 0 ? 100 : Math.round((delta / prevCount) * 100);

    return { targetDisease, latest, previous, latestCount, prevCount, delta, percentageChange };
  }, [filteredRecords, months, compareDisease]);

  const handleDownload = () => {
    const payload = {
      generatedAt: new Date().toISOString(),
      filters: { search, gender, month, family, disease },
      diseaseBreakdown,
      monthlyTrend,
      comparison,
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'doctor-disease-report.json';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const resetFilters = () => {
    setSearch('');
    setGender('all');
    setMonth('all');
    setFamily('all');
    setDisease('all');
  };

  return (
    <NavigationPageShell activeId="stats" accentIcon={StatsIcon}>
      <main className="relative isolate min-h-screen px-4 py-6 text-slate-900 sm:px-6 md:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <header className="flex flex-col gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">
            <span className="inline-flex h-2 w-2 rounded-full bg-sky-500 shadow-[0_0_0_6px_rgba(14,165,233,0.18)]" />
            Insights control room
          </div>
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">Disease Intelligence</h1>
              <p className="text-sm text-slate-600">
                Interactive infographics, filters, comparisons, and exportable reports to understand how patients arrive with
                different conditions.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">
              <span className={`ios-chip bg-white/80 text-[11px] text-slate-700 ${SHADOWS.chip}`}>Charts</span>
              <span className={`ios-chip bg-white/80 text-[11px] text-slate-700 ${SHADOWS.chip}`}>Filters</span>
              <span className={`ios-chip bg-white/80 text-[11px] text-slate-700 ${SHADOWS.chip}`}>Reports</span>
            </div>
          </div>
        </header>

        <section className={`ios-surface ${SHADOWS.card} p-6 md:p-7`}>
          <div className="grid gap-4 lg:grid-cols-[2fr,1.1fr]">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-2xl border border-slate-100/80 bg-white/90 p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Total filtered patients</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">{filteredRecords.length}</p>
                <p className="text-xs text-slate-500">Out of {diseaseRecords.length} recorded visits</p>
              </div>
              <div className="rounded-2xl border border-slate-100/80 bg-white/90 p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Families represented</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">{activeFamilies.size}</p>
                <p className="text-xs text-slate-500">
                  {toPercentage(activeFamilies.size, allFamilies.size)}% of total families ({allFamilies.size})
                </p>
              </div>
              <div className="rounded-2xl border border-slate-100/80 bg-white/90 p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Most frequent disease</p>
                <p className="mt-2 text-xl font-bold text-slate-900">{topDisease?.disease ?? '—'}</p>
                {topDisease ? (
                  <p className="text-xs text-slate-500">
                    {topDisease.total} visits • {topDisease.male} male / {topDisease.female} female • Avg age{' '}
                    {Math.round(
                      topDisease.ages.reduce((sum, age) => sum + age, 0) / Math.max(topDisease.ages.length, 1)
                    )}
                  </p>
                ) : (
                  <p className="text-xs text-slate-500">Adjust filters to see details</p>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-3 rounded-2xl border border-slate-100/80 bg-white/90 p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Report actions</p>
                <div className="flex gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-600">
                  <span className="rounded-full bg-sky-100 px-3 py-1 text-sky-700">Share</span>
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-700">Export</span>
                </div>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <button
                  onClick={handleDownload}
                  className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-200 transition hover:-translate-y-0.5"
                >
                  <span aria-hidden>⬇️</span> Download as report
                </button>
                <button
                  onClick={resetFilters}
                  className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5"
                >
                  <span aria-hidden>🔄</span> Reset filters
                </button>
              </div>
              <p className="text-xs text-slate-500">
                Exports include disease counts by gender, family distribution, and monthly trend snapshots for your current
                filters.
              </p>
            </div>
          </div>
        </section>

        <section className={`ios-surface ${SHADOWS.card} p-6 md:p-7`}>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex flex-1 flex-wrap gap-3">
              <div className={`flex flex-1 items-center gap-3 rounded-2xl border border-slate-100 bg-white/90 px-4 py-3 ${SHADOWS.inset}`}>
                <svg
                  viewBox="0 0 24 24"
                  className="h-5 w-5 text-slate-500"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.6}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <circle cx="11" cy="11" r="6" />
                  <path d="M16 16l4 4" />
                </svg>
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search disease, patient, or family"
                  className="w-full bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
                />
              </div>
              <select
                value={gender}
                onChange={(event) => setGender(event.target.value as typeof gender)}
                className="rounded-2xl border border-slate-100 bg-white/90 px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm"
              >
                <option value="all">All genders</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
              <select
                value={family}
                onChange={(event) => setFamily(event.target.value)}
                className="rounded-2xl border border-slate-100 bg-white/90 px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm"
              >
                <option value="all">All families</option>
                {families.map((familyName) => (
                  <option key={familyName} value={familyName}>
                    {familyName}
                  </option>
                ))}
              </select>
              <select
                value={disease}
                onChange={(event) => setDisease(event.target.value)}
                className="rounded-2xl border border-slate-100 bg-white/90 px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm"
              >
                <option value="all">All diseases</option>
                {diseaseNames.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
              <select
                value={month}
                onChange={(event) => setMonth(event.target.value)}
                className="rounded-2xl border border-slate-100 bg-white/90 px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm"
              >
                <option value="all">All months</option>
                {months.map((monthKey) => (
                  <option key={monthKey} value={monthKey}>
                    {monthName(monthKey)}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2 rounded-2xl border border-slate-100 bg-white/80 px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-sky-500 shadow-[0_0_0_6px_rgba(14,165,233,0.18)]" />
              Live filters active
            </div>
          </div>

          <div className="mt-6 grid gap-5 lg:grid-cols-[1.5fr,1fr]">
            <div className="rounded-3xl border border-slate-100 bg-white/90 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Disease mix</p>
                  <h3 className="text-lg font-bold text-slate-900">Counts by disease and gender</h3>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
                  <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-3 py-1 text-sky-700">
                    <span className="h-2 w-2 rounded-full bg-sky-500" /> Male
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-pink-50 px-3 py-1 text-rose-600">
                    <span className="h-2 w-2 rounded-full bg-rose-500" /> Female
                  </span>
                </div>
              </div>
              <div className="mt-4 space-y-4">
                {diseaseBreakdown.length === 0 && (
                  <p className="text-sm text-slate-500">No results for the selected filters. Try expanding the search.</p>
                )}
                {diseaseBreakdown.map((item) => {
                  const total = item.male + item.female;
                  const maleWidth = total === 0 ? 0 : Math.round((item.male / total) * 100);
                  const femaleWidth = total === 0 ? 0 : 100 - maleWidth;

                  return (
                    <div key={item.disease} className="rounded-2xl border border-slate-100 bg-gradient-to-r from-white to-sky-50/60 p-4 shadow-sm">
                      <div className="flex items-center justify-between text-sm font-semibold text-slate-700">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex h-2 w-2 rounded-full bg-sky-500 shadow-[0_0_0_6px_rgba(14,165,233,0.18)]" />
                          {item.disease}
                        </div>
                        <div className="text-xs uppercase tracking-[0.18em] text-slate-500">{item.total} patients</div>
                      </div>
                      <div className="mt-3 flex h-3 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full bg-gradient-to-r from-sky-400 to-sky-500"
                          style={{ width: `${maleWidth}%` }}
                        />
                        <div
                          className="h-full bg-gradient-to-r from-rose-400 to-rose-500"
                          style={{ width: `${femaleWidth}%` }}
                        />
                      </div>
                      <div className="mt-2 flex justify-between text-xs text-slate-600">
                        <span>{item.male} male</span>
                        <span>{item.female} female</span>
                        <span>Avg age {Math.round(item.ages.reduce((sum, age) => sum + age, 0) / Math.max(item.ages.length, 1))}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="rounded-3xl border border-slate-100 bg-gradient-to-br from-white to-sky-50/80 p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Dominant profile</p>
                {topDisease ? (
                  <>
                    <h3 className="text-lg font-bold text-slate-900">{topDisease.disease}</h3>
                    <p className="text-sm text-slate-600">
                      Highest incidence with {topDisease.male >= topDisease.female ? 'male' : 'female'} patients and median age{' '}
                      {Math.round(topDisease.ages.sort((a, b) => a - b)[Math.floor(topDisease.ages.length / 2)])}.
                    </p>
                    <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">
                      <div className="rounded-xl bg-white/80 p-3 shadow-inner">
                        <p className="text-xl font-bold text-slate-900">{topDisease.total}</p>
                        <p>Visits</p>
                      </div>
                      <div className="rounded-xl bg-white/80 p-3 shadow-inner">
                        <p className="text-xl font-bold text-slate-900">{topDisease.male}</p>
                        <p>Male</p>
                      </div>
                      <div className="rounded-xl bg-white/80 p-3 shadow-inner">
                        <p className="text-xl font-bold text-slate-900">{topDisease.female}</p>
                        <p>Female</p>
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-slate-500">No active data after filters.</p>
                )}
              </div>

              <div className="rounded-3xl border border-slate-100 bg-white/90 p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Comparison</p>
                    <h3 className="text-lg font-bold text-slate-900">Month-over-month disease change</h3>
                  </div>
                  <select
                    value={compareDisease}
                    onChange={(event) => setCompareDisease(event.target.value)}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm"
                  >
                    {diseaseNames.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mt-3 rounded-2xl border border-slate-100 bg-gradient-to-r from-sky-50 to-cyan-50 p-4 shadow-inner">
                  <div className="grid grid-cols-3 gap-4 text-center text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">
                    <div>
                      <p className="text-2xl font-bold text-slate-900">{comparison.latestCount}</p>
                      <p>{comparison.latest ? monthName(comparison.latest) : 'Latest month'}</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-slate-900">{comparison.prevCount}</p>
                      <p>{comparison.previous ? monthName(comparison.previous) : 'Prev month'}</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-slate-900">{comparison.delta >= 0 ? '+' : ''}{comparison.delta}</p>
                      <p>Change ({comparison.percentageChange}% )</p>
                    </div>
                  </div>
                  <div className="mt-4 flex h-3 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500"
                      style={{ width: `${Math.min(100, Math.max(0, comparison.percentageChange + 100)) / 2}%` }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-slate-500">Quickly compare how {comparison.targetDisease} shifted month to month.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className={`ios-surface ${SHADOWS.card} p-6 md:p-7`}>
          <div className="grid gap-6 lg:grid-cols-[1.2fr,0.8fr]">
            <div className="rounded-3xl border border-slate-100 bg-white/90 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Monthly trending</p>
                  <h3 className="text-lg font-bold text-slate-900">Disease flow by month</h3>
                  <p className="text-sm text-slate-600">Hover the bars to see month-wise counts.</p>
                </div>
                <div className="rounded-full bg-slate-900/90 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white shadow-lg shadow-slate-300">
                  {disease === 'all' ? 'All diseases' : disease}
                </div>
              </div>
              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {monthlyTrend.map((item) => (
                  <div key={item.month} className="rounded-2xl border border-slate-100 bg-gradient-to-br from-sky-50/70 to-white p-4 shadow-sm">
                    <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">
                      <span>{monthName(item.month)}</span>
                      <span className="rounded-full bg-slate-900/80 px-2 py-1 text-white">{item.count}</span>
                    </div>
                    <div className="mt-3 h-28 rounded-xl bg-slate-100">
                      <div
                        className="h-full rounded-xl bg-gradient-to-t from-sky-500 via-cyan-400 to-emerald-300"
                        style={{ height: `${Math.min(100, item.count * 18)}%` }}
                      />
                    </div>
                    <p className="mt-2 text-xs text-slate-500">{item.count} cases recorded</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="rounded-3xl border border-slate-100 bg-white/90 p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Advanced filters</p>
                <h3 className="text-lg font-bold text-slate-900">Make it yours</h3>
                <div className="mt-3 space-y-3 text-sm text-slate-700">
                  <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                    <div>
                      <p className="font-semibold">Source split</p>
                      <p className="text-xs text-slate-500">Clinic vs outside referrals</p>
                    </div>
                    <div className="flex gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">
                      <span className="rounded-full bg-sky-100 px-3 py-1 text-sky-700">
                        Clinic {filteredRecords.filter((item) => item.source === 'Clinic').length}
                      </span>
                      <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-700">
                        Outside {filteredRecords.filter((item) => item.source === 'Outside').length}
                      </span>
                    </div>
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                    <p className="font-semibold">Family penetration</p>
                    <p className="text-xs text-slate-500">
                      {toPercentage(activeFamilies.size, allFamilies.size)}% of families touched; drill down by selecting a family above.
                    </p>
                    <div className="mt-3 flex h-2 overflow-hidden rounded-full bg-slate-200">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500"
                        style={{ width: `${toPercentage(activeFamilies.size, allFamilies.size)}%` }}
                      />
                    </div>
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                    <p className="font-semibold">Customization tips</p>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-slate-600">
                      <li>Use search to narrow by patient name, disease, or family.</li>
                      <li>Apply gender/month filters to understand seasonality and demographics.</li>
                      <li>Download the JSON report to embed insights into your clinic documentation.</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-100 bg-gradient-to-br from-sky-500 to-cyan-500 p-5 text-white shadow-lg shadow-sky-200">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/80">Search & compare</p>
                <h3 className="text-xl font-bold">Answer custom questions fast</h3>
                <p className="mt-2 text-sm text-white/90">
                  Try queries like “fever in June vs May” or “female hypertension cases”. Filters, comparisons, and exports are all
                  tuned for the doctor to get instant clarity.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
      </main>
    </NavigationPageShell>
  );
}
