'use client';

import React, { useEffect, useMemo, useState, useRef } from 'react';

// ---- Types ----
interface Patient {
  id: string;
  name: string;
  nic: string;
  time: string;
  reason: string;
  age: number;
  gender: string;
}

const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`rounded-2xl bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)] ring-1 ring-slate-200 ${className}`}>
    {children}
  </div>
);

const SectionTitle = ({ title, sub }: { title: string; sub?: string }) => (
  <div className="flex items-end justify-between">
    <h2 className="text-lg font-semibold tracking-tight text-slate-900">{title}</h2>
    {sub ? <span className="text-xs text-slate-500">{sub}</span> : null}
  </div>
);

export default function MedLinkDoctorDashboard() {
  // ------ Constants ------
  const CAPACITY = 40; // soft cap used to render the compact capacity meter

  // ------ Clock (used only for internal tests, not rendered) ------
  const [now, setNow] = useState<Date>(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000); // update every 30s
    return () => clearInterval(id);
  }, []);
  const timeStr = useMemo(
    () => now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
    [now]
  );
  const dateStr = useMemo(() => now.toLocaleDateString('en-US'), [now]);

  // ------ Demo Data ------
  const patients = useMemo<Patient[]>(
    () => [
      {
        id: 'p1',
        name: 'Premadasa',
        nic: '61524862V',
        time: '5.00 PM',
        reason: 'Feever Headach',
        age: 66,
        gender: 'Male',
      },
      {
        id: 'p2',
        name: 'JR Jayawardhana',
        nic: '64524862V',
        time: '5.10 PM',
        reason: 'Stomached Headach',
        age: 62,
        gender: 'Male',
      },
      {
        id: 'p3',
        name: 'Mitreepala Siirisena',
        nic: '78522862V',
        time: '5.20 PM',
        reason: 'Feever',
        age: 68,
        gender: 'Male',
      },
      {
        id: 'p4',
        name: 'Chandrika Bandranayake',
        nic: '71524862V',
        time: '5.30 PM',
        reason: 'Feever Headach',
        age: 63,
        gender: 'Female',
      },
      {
        id: 'p5',
        name: 'Ranil Vicramasinghe',
        nic: '77524862V',
        time: '5.00 PM',
        reason: 'Feever Headach',
        age: 76,
        gender: 'Male',
      },
      {
        id: 'p6',
        name: 'Mahinda Rajapakshe',
        nic: '74524862V',
        time: '—',
        reason: 'Headach',
        age: 66,
        gender: 'Male',
      },
    ],
    []
  );

  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState('p6');
  const selected = useMemo(
    () => patients.find((p) => p.id === selectedId) || patients[0],
    [patients, selectedId]
  );

  const [gender, setGender] = useState<'Male' | 'Female'>(selected.gender as 'Male' | 'Female');
  // track expanded patient rows (accordion-style) - only one open at a time
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  // keep refs to each patient row so we can scroll into view when expanded
  const rowRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [statsOpen, setStatsOpen] = useState(false);
  const statsButtonRef = useRef<HTMLButtonElement | null>(null);
  const statsPanelRef = useRef<HTMLDivElement | null>(null);

  // when a row expands, scroll it into view (inside the list only)
  useEffect(() => {
    if (!expandedId) return;
    const el = rowRefs.current[expandedId];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [expandedId]);

  useEffect(() => {
    if (!statsOpen) return;
    const handleClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        statsPanelRef.current &&
        !statsPanelRef.current.contains(target) &&
        statsButtonRef.current &&
        !statsButtonRef.current.contains(target)
      ) {
        setStatsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [statsOpen]);

  useEffect(() => {
    if (!statsOpen) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setStatsOpen(false);
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [statsOpen]);

  // Right sheet editable state
  const [sheet] = useState({
    disease: 'Feever',
    clinical: ['Ibuprofen', 'Naproxen', 'Acetaminophen'],
    outside: [{ name: 'Perasitamol', dose: '250MG', terms: 'Hourly', amount: 32 }],
    tests: 'No',
    notes: 'No',
    nextVisit: '05 November 2025',
  });

  const [nextVisitOption, setNextVisitOption] = useState<'TwoWeeks' | 'ThreeWeeks'>('TwoWeeks');

  // Per-patient selected history date index in expanded card
  const visitDateOptions = useMemo(
    () => ['Today', '05/10', '05/09', '05/08', '05/07', '05/06', '05/05', '15/04', '15/04'],
    []
  );
  const [visitSelection, setVisitSelection] = useState<Record<string, number>>({});

  const [rxRows] = useState([
    { drug: 'Ibuprofen', dose: '250MG', terms: '1 DAILY', amount: 2 },
    { drug: 'Naproxen', dose: '250MG', terms: '1 DAILY', amount: 2 },
    { drug: 'Acetaminophen', dose: '250MG', terms: '2 Hourly', amount: 3 },
  ]);

  const medicalTests = useMemo(
    () => [
      { name: 'F.B.C', status: 'Scheduled', note: 'Collect samples tomorrow morning' },
      { name: 'ColestarolC', status: 'Completed', note: 'Reviewed on 05 Oct' },
    ],
    []
  );

  const diseaseQuickTags = useMemo(() => ['Feever', 'Headach'], []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return patients;
    return patients.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.nic.toLowerCase().includes(q) ||
        p.reason.toLowerCase().includes(q)
    );
  }, [patients, search]);

  // ------ Header derived state ------
  const occupancy = Math.min(patients.length, CAPACITY);
  const occupancyPercent = Math.round((occupancy / CAPACITY) * 100);
  const newPatients = Math.max(1, Math.ceil(patients.length * 0.4));
  const existingPatients = Math.max(0, patients.length - newPatients);

  // ------ Dev Smoke Tests (run once on mount) ------
  useEffect(() => {
    console.assert(Array.isArray(patients) && patients.length > 0, 'patients array should be non-empty');
    console.assert(
      Array.isArray(sheet.clinical) && sheet.clinical.every((x) => typeof x === 'string'),
      'sheet.clinical must be string[]'
    );
    const s = new Set<string>();
    s.add('p1');
    console.assert(s.has('p1'), 'Set should add id');
    s.delete('p1');
    console.assert(!s.has('p1'), 'Set should delete id');

    console.assert(CAPACITY === 40, 'Header capacity should stay at 40 slots');
    console.assert(occupancy <= CAPACITY, 'Occupancy cannot exceed capacity');
    console.assert(
      occupancyPercent <= 100 && occupancyPercent >= 0,
      'Occupancy percent should remain within 0-100'
    );
    console.assert(
      newPatients + existingPatients === patients.length,
      'New + Existing counts should match total patients'
    );

    // visitDateOptions basic tests
    console.assert(visitDateOptions.length >= 5, 'visitDateOptions should contain multiple entries');
    console.assert(visitDateOptions[0] === 'Today', 'First visitDateOptions entry should be Today');

    console.assert(typeof timeStr === 'string' && timeStr.length > 0, 'timeStr should be defined');
    console.assert(typeof dateStr === 'string' && dateStr.length > 0, 'dateStr should be defined');

    // Extra tests
    console.assert(selected.id === selectedId, 'Selected patient should match selectedId');
    console.assert(gender === selected.gender, 'Gender toggle should reflect selected patient gender');
    console.assert(filtered.length <= patients.length, 'Filtered list cannot be longer than patients');
  }, [
    patients,
    sheet.clinical,
    timeStr,
    dateStr,
    selected,
    selectedId,
    gender,
    filtered.length,
    visitDateOptions,
    occupancy,
    occupancyPercent,
    newPatients,
    existingPatients,
  ]);

  return (
    <div className="flex min-h-screen w-full flex-col bg-slate-50 text-slate-900">
      {/* Top bar */}
      <header className="shrink-0 border-b border-slate-200/60 bg-slate-50/90 px-8 py-4 backdrop-blur-sm">
        <div className="mx-auto flex max-w-[1680px] flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.4em] text-slate-400">Clinic Overview</p>
            <div className="text-3xl font-semibold leading-tight text-slate-900">MediHelp - Nugegoda</div>
            <div className="text-sm text-slate-500">No.10, Abc Street Nugegoda</div>
            <div className="text-xs text-slate-400">Hotline : +94 11 452 8889</div>
          </div>
          <div className="rounded-[999px] bg-gradient-to-r from-white via-slate-50 to-slate-100 p-[1px] shadow-[0_15px_45px_rgba(15,23,42,0.12)]">
            <div className="flex items-center gap-3 rounded-[999px] border border-white/60 bg-white/95 px-6 py-3">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.4em] text-slate-400">Welcome</div>
                <div className="text-xl font-semibold leading-5 text-slate-900">Hi Dr. Manjith</div>
                <div className="text-[11px] text-slate-500">Surgeon / Family Consultant</div>
              </div>
              <div className="rounded-full bg-slate-900/90 p-0.5 shadow-[0_8px_24px_rgba(15,23,42,0.25)]">
                <div className="flex size-12 items-center justify-center rounded-full bg-gradient-to-br from-slate-900 to-slate-600 text-xs font-semibold uppercase tracking-wide text-white">
                  DR
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto flex w-full max-w-[1680px] flex-1 overflow-hidden px-8 pb-6 pt-2">
        {/* Two-column layout: LEFT = detailed sheet, RIGHT = search/list */}
        <div className="grid h-full w-full grid-cols-12 gap-6">
          {/* RIGHT: Search + expandable patient list */}
          <div className="order-2 col-span-4 flex h-full min-h-0 flex-col overflow-hidden pl-1">
            <Card className="flex h-full min-h-0 flex-col p-4">
              <SectionTitle title="Search Patients" sub="Name / NIC / Mobile" />
              <div className="mt-3 flex items-center gap-2">
                <input
                  placeholder="Search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-2 focus:ring-sky-100"
                />
                <button
                  className="rounded-xl bg-sky-500 px-3 py-2 text-xs font-medium text-white shadow-sm transition hover:bg-sky-600 active:translate-y-px"
                  type="button"
                >
                  Search
                </button>
              </div>

              <div className="mt-4 text-sm font-semibold text-slate-900">Patient List</div>
              <div className="mt-2 flex-1 space-y-2 overflow-y-auto pr-1 text-sm leading-tight">
                {filtered.map((p) => {
                  const isSelected = selectedId === p.id;
                  const isOpen = expandedId === p.id;
                  return (
                    <div
                      key={p.id}
                      ref={(el) => {
                        rowRefs.current[p.id] = el;
                      }}
                      className="w-full rounded-2xl border border-slate-200 bg-white/95 shadow-[0_4px_14px_rgba(15,23,42,0.06)]"
                    >
                      {/* Row header */}
                      <div
                        className={`flex cursor-pointer items-center justify-between px-3 py-2 transition ${
                          isSelected ? 'bg-sky-50' : 'hover:bg-slate-50'
                        }`}
                        onClick={() => {
                          setSelectedId(p.id);
                          setGender(p.gender as 'Male' | 'Female');
                          toggleExpand(p.id);
                        }}
                      >
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium text-slate-900">{p.name}</div>
                          <div className="truncate text-[11px] text-slate-500">{p.nic}</div>
                          <div className="mt-1 text-[11px] text-slate-500">{p.reason}</div>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                          <div className="text-right text-[11px] text-slate-500">{p.time}</div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedId(p.id);
                              setGender(p.gender as 'Male' | 'Female');
                              toggleExpand(p.id);
                            }}
                            className="grid size-6 place-items-center rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-700 hover:bg-white"
                            aria-label={isOpen ? 'Collapse' : 'Expand'}
                          >
                            {isOpen ? '–' : '+'}
                          </button>
                        </div>
                      </div>

                      {/* Expanded preview card */}
                      {isOpen && (
                        <div className="mx-2 mb-2 rounded-2xl bg-slate-50 px-4 py-4 ring-1 ring-slate-200">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="text-lg font-semibold leading-5 text-slate-900">{p.name}</div>
                              <div className="text-sm text-slate-600">{p.nic}</div>
                              <span className="mt-2 inline-block rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-semibold text-white">
                                Father
                              </span>
                            </div>
                            <div className="text-right">
                              <div className="text-sm text-slate-700">
                                Age{' '}
                                <span className="text-xl font-semibold text-slate-900">{p.age}</span>
                              </div>
                              <span className="mt-1 inline-block rounded-full bg-sky-500 px-2 py-0.5 text-[10px] font-semibold text-white">
                                {p.gender}
                              </span>
                            </div>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2 text-xs">
                            {visitDateOptions.map((d, i) => {
                              const selectedIdx = visitSelection[p.id] ?? 0;
                              const isActive = i === selectedIdx;
                              return (
                                <button
                                  key={i}
                                  type="button"
                                  onClick={() =>
                                    setVisitSelection((prev) => ({
                                      ...prev,
                                      [p.id]: i,
                                    }))
                                  }
                                  className={`rounded-full px-3 py-1 transition ${
                                    isActive
                                      ? 'bg-slate-900 text-white shadow-sm'
                                      : 'bg-white text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50'
                                  }`}
                                >
                                  {d}
                                </button>
                              );
                            })}
                          </div>
                          <div className="mt-4 grid grid-cols-2 gap-6 text-sm text-slate-700">
                            <div>
                              <div className="text-base font-semibold text-slate-900">Disease</div>
                              <div className="mt-1 grid grid-cols-2 gap-2">
                                <span>Feever</span>
                                <span>Headach</span>
                              </div>
                              <div className="mt-4 text-base font-semibold text-slate-900">Clinical Drugs</div>
                              <div className="mt-1 space-y-0.5">
                                <div>Ibuprofen</div>
                                <div>Naproxen</div>
                                <div>Acetaminophen</div>
                              </div>
                              <div className="mt-4 text-base font-semibold text-slate-900">Outside Drugs</div>
                              <div className="mt-1">Perasitamol</div>
                            </div>
                            <div>
                              <div className="text-base font-semibold text-slate-900">Medical Tests</div>
                              <div className="mt-1">No</div>
                              <div className="mt-4 text-base font-semibold text-slate-900">Special Notes</div>
                              <div className="mt-1">No</div>
                              <div className="mt-6 text-base font-semibold text-slate-900">Next Visit Date</div>
                              <div className="mt-1 text-slate-700">05 November 2025</div>
                            </div>
                          </div>
                          <div className="mt-6">
                            <button className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-black">
                              Download as Report
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>

          {/* LEFT: Full detailed sheet */}
          <div className="order-1 col-span-8 flex h-full min-h-0 flex-col overflow-hidden pr-4">
            <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-[24px] bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.06)] ring-1 ring-slate-200">
              {/* Top header */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Active Patient</p>
                  <div className="text-2xl font-semibold leading-tight text-slate-900">{selected.name}</div>
                  <div className="text-sm text-slate-500">{selected.nic}</div>
                </div>
                <div className="text-right text-sm text-slate-500">
                  <div className="text-[10px] uppercase tracking-[0.3em] text-slate-400">Updated</div>
                  <div className="text-base font-semibold text-slate-900">{dateStr}</div>
                  <div>{timeStr}</div>
                </div>
              </div>

              {/* Patient quick info */}
              <div className="mt-5 space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <input
                    className="flex-1 min-w-[220px] rounded-[999px] border border-slate-200 bg-slate-50 px-5 py-3 text-base font-semibold text-slate-900 placeholder-slate-400 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-2 focus:ring-sky-100"
                    placeholder="Enter Patient Name"
                    defaultValue={selected.name}
                  />

                  <input
                    className="w-24 rounded-[999px] border border-slate-200 bg-slate-50 px-4 py-3 text-base font-semibold text-slate-900 placeholder-slate-400 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-2 focus:ring-sky-100"
                    placeholder="Age"
                    defaultValue={selected.age}
                  />

                  <div className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Patient No : MH0001
                  </div>

                  <div className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white">
                    <span>Previously patient of Dr. Jay</span>
                    <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] tracking-wide">10 SEP 25</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <input
                    className="w-52 rounded-[999px] border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                    placeholder="Enter NIC No"
                    defaultValue={selected.nic}
                  />

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setGender('Male')}
                      className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                        gender === 'Male'
                          ? 'bg-sky-500 text-white shadow-sm'
                          : 'border border-slate-300 bg-white text-slate-700'
                      }`}
                    >
                      Male
                    </button>
                    <button
                      type="button"
                      onClick={() => setGender('Female')}
                      className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                        gender === 'Female'
                          ? 'bg-rose-500 text-white shadow-sm'
                          : 'border border-slate-300 bg-white text-slate-700'
                      }`}
                    >
                      Female
                    </button>
                  </div>
                </div>
              </div>

              {/* Two-column canvas */}
              <div className="mt-2 flex-1 overflow-hidden">
                <div className="flex h-full min-h-0 flex-col gap-4 overflow-y-auto pr-1">
                  {/* Row 1: Disease + Regular / Medical Tests */}
                  <div className="grid grid-cols-12 gap-6">
                  {/* Disease side */}
                  <div className="col-span-7">
                    <div className="rounded-3xl border border-slate-100 bg-slate-50/70 p-5">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <div className="text-2xl font-semibold text-slate-900">Disease</div>
                          <div className="text-xs text-slate-500">Search and pick existing symptoms</div>
                        </div>
                        <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">History</div>
                      </div>
                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        <input
                          className="min-w-[220px] flex-1 rounded-[999px] border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                          placeholder="Search Diseases"
                        />
                        <button className="inline-flex items-center gap-2 rounded-full bg-sky-500 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-600 active:translate-y-px">
                          <span role="img" aria-hidden="true">
                            🔍
                          </span>
                          Search
                        </button>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {diseaseQuickTags.map((tag) => (
                          <button
                            key={tag}
                            className="rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-100"
                            type="button"
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Medical Tests side */}
                  <div className="col-span-5">
                    <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.08)]">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="text-sm font-semibold text-slate-900">Medical Tests</div>
                          <div className="text-xs text-slate-500">Upcoming & completed</div>
                        </div>
                        <span className="rounded-full bg-slate-900/5 px-3 py-1 text-xs font-semibold text-slate-600">
                          {medicalTests.length} Tests
                        </span>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {medicalTests.map((test, index) => (
                          <button
                            key={test.name}
                            type="button"
                            className={`flex-1 min-w-[140px] rounded-[18px] border px-4 py-3 text-sm font-semibold ${
                              index === 0
                                ? 'border-sky-500 bg-sky-500 text-white shadow-[0_10px_25px_rgba(14,165,233,0.35)]'
                                : 'border-slate-200 bg-slate-50 text-slate-700'
                            }`}
                          >
                            <div>{test.name}</div>
                            <div className="text-[11px] font-medium uppercase tracking-widest opacity-80">
                              {test.status}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  </div>

                  {/* Row 2: Clinical / Outside tables + mini cards */}
                  <div className="grid grid-cols-12 gap-6 overflow-hidden">
                  {/* Clinical row: table + mini card */}
                  <div className="col-span-8">
                    <div className="h-full rounded-3xl border border-slate-100 bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="text-2xl font-semibold text-slate-900">Clinical Drugs</div>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">3 items</span>
                      </div>
                      <div className="mt-4 overflow-hidden rounded-2xl border border-slate-100">
                        <div className="grid grid-cols-4 gap-2 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                          <div>Drug Name</div>
                          <div>Dose</div>
                          <div>Terms</div>
                          <div>Amount</div>
                        </div>
                        <div className="divide-y divide-slate-100 text-sm text-slate-900">
                          {rxRows.map((r, i) => (
                            <div key={i} className="grid grid-cols-4 gap-2 bg-white/80 px-4 py-3 odd:bg-white even:bg-slate-50/60">
                              <div>{r.drug}</div>
                              <div>{r.dose}</div>
                              <div>{(r.terms || '').toString()}</div>
                              <div>{r.amount}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="col-span-4">
                    <div className="flex h-full flex-col justify-between rounded-3xl border border-slate-100 bg-slate-50 p-5">
                      <div className="space-y-2 text-base font-semibold text-slate-900">
                        {sheet.clinical.map((c, i) => (
                          <div key={i} className="rounded-2xl bg-white px-4 py-2 text-slate-700 shadow-sm">
                            {c}
                          </div>
                        ))}
                      </div>
                      <div>
                        <button className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm">
                          <span>↪</span> Use same drugs
                        </button>
                        <p className="mt-2 text-center text-xs text-slate-500">• Clinical Drugs From previous history</p>
                      </div>
                    </div>
                  </div>

                  {/* Outside row: table + mini card */}
                  <div className="col-span-8">
                    <div className="h-full rounded-3xl border border-slate-100 bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="text-2xl font-semibold text-slate-900">Outside Drugs</div>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">1 item</span>
                      </div>
                      <div className="mt-4 overflow-hidden rounded-2xl border border-slate-100">
                        <div className="grid grid-cols-4 gap-2 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                          <div>Drug Name</div>
                          <div>Dose</div>
                          <div>Terms</div>
                          <div>Amount</div>
                        </div>
                        <div className="divide-y divide-slate-100 text-sm text-slate-900">
                          <div className="grid grid-cols-4 gap-2 bg-white px-4 py-3">
                            <div>{sheet.outside[0]?.name}</div>
                            <div>{sheet.outside[0]?.dose}</div>
                            <div>{sheet.outside[0]?.terms}</div>
                            <div>{sheet.outside[0]?.amount}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="col-span-4">
                    <div className="flex h-full flex-col justify-between rounded-3xl border border-slate-100 bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
                      <div>
                        <div className="text-sm font-semibold text-slate-500">Outside Drugs</div>
                        <div className="text-2xl font-semibold text-slate-900">{sheet.outside[0]?.name}</div>
                        <div className="mt-1 text-sm text-slate-500">
                          {sheet.outside[0]?.dose} · {sheet.outside[0]?.terms}
                        </div>
                      </div>
                      <div>
                        <button className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm">
                          <span>↪</span> Use same drugs
                        </button>
                        <p className="mt-2 text-center text-xs text-slate-500">• Outside Drugs From previous history</p>
                      </div>
                    </div>
                  </div>
                  </div>

                  {/* Next Visit Date bar */}
                  <div className="flex flex-wrap items-center gap-3 rounded-[40px] border border-slate-100 bg-white px-6 py-4 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
                    <div className="text-2xl font-semibold text-slate-900">Next Visit Date</div>
                    <button
                      type="button"
                      onClick={() => setNextVisitOption('TwoWeeks')}
                      className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                        nextVisitOption === 'TwoWeeks'
                          ? 'bg-sky-500 text-white shadow-sm'
                          : 'border border-slate-300 bg-white text-slate-700'
                      }`}
                    >
                      Two Weeks
                    </button>
                    <button
                      type="button"
                      onClick={() => setNextVisitOption('ThreeWeeks')}
                      className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                        nextVisitOption === 'ThreeWeeks'
                          ? 'bg-sky-500 text-white shadow-sm'
                          : 'border border-slate-300 bg-white text-slate-700'
                      }`}
                    >
                      Three Weeks
                    </button>
                    <div className="min-w-[220px] rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-800 ring-1 ring-slate-200">
                      {sheet.nextVisit}
                    </div>
                    <button className="ml-auto rounded-full bg-sky-500 px-6 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-sky-600 active:translate-y-px">
                      Confirm
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Floating stats button + popup */}
      {statsOpen && (
        <div
          ref={statsPanelRef}
          id="queue-stats-panel"
          className="fixed bottom-28 right-6 z-40 w-[340px]"
        >
          <Card className="relative space-y-5 px-5 py-5">
            <button
              type="button"
              onClick={() => setStatsOpen(false)}
              aria-label="Hide queue stats"
              className="absolute right-4 top-4 text-slate-400 transition hover:text-slate-600"
            >
              ×
            </button>
            <div className="flex items-center gap-4">
              <div className="rounded-[24px] bg-gradient-to-br from-sky-400 to-sky-600 p-[1px] shadow-inner shadow-sky-200/80">
                <div className="rounded-[22px] bg-white/95 px-3 py-2 text-slate-900">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-400">Queue</p>
                  <div className="flex items-baseline gap-1">
                    <p className="text-2xl font-semibold leading-6">{patients.length}</p>
                    <span className="text-xs text-slate-500">today</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Capacity {occupancy}/{CAPACITY}
                  </p>
                </div>
              </div>
              <div className="space-y-2 text-[11px] font-medium text-slate-600">
                <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-700">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" /> New {newPatients}
                </span>
                <span className="flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">
                  <span className="h-2 w-2 rounded-full bg-slate-300" /> Existing {existingPatients}
                </span>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
                <span>Patients amount</span>
                <span className="text-sm text-slate-900">{occupancyPercent}%</span>
              </div>
              <div className="relative mt-2 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-emerald-400 via-sky-400 to-sky-600 shadow-[0_4px_12px_rgba(14,165,233,0.35)]"
                  style={{ width: `${Math.min(occupancyPercent, 100)}%` }}
                />
                <div className="absolute inset-0 flex justify-between px-2 text-[9px] font-semibold uppercase tracking-widest text-slate-400">
                  <span>Calm</span>
                  <span>Busy</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 text-sm text-slate-600">
              <div className="rounded-2xl bg-slate-50 px-4 py-2 text-center shadow-inner">
                <span className="block text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-400">Total</span>
                <span className="text-2xl font-semibold text-slate-900">{patients.length}</span>
                <span className="block text-[11px]">in queue</span>
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-2 text-center shadow-inner">
                <span className="block text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-400">New</span>
                <span className="text-2xl font-semibold text-slate-900">{newPatients}</span>
                <span className="block text-[11px]">arrivals</span>
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-2 text-center shadow-inner">
                <span className="block text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-400">Existing</span>
                <span className="text-2xl font-semibold text-slate-900">{existingPatients}</span>
                <span className="block text-[11px]">follow ups</span>
              </div>
            </div>
          </Card>
        </div>
      )}
      <button
        ref={statsButtonRef}
        type="button"
        onClick={() => setStatsOpen((prev) => !prev)}
        aria-expanded={statsOpen}
        aria-controls="queue-stats-panel"
        className="fixed bottom-8 right-6 z-30 flex size-14 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white shadow-[0_25px_65px_rgba(15,23,42,0.45)] transition hover:bg-black"
      >
        {statsOpen ? 'Hide' : 'Stats'}
      </button>

    </div>
  );
}
