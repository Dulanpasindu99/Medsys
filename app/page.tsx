'use client';

import React, { useEffect, useMemo, useState } from 'react';

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
  <div
    className={`rounded-[24px] border border-white/70 bg-white/80 shadow-[0_18px_42px_rgba(28,63,99,0.08)] ring-1 ring-sky-50/60 backdrop-blur-xl ${className}`}
  >
    {children}
  </div>
);

const SectionTitle = ({ title, sub }: { title: string; sub?: string }) => (
  <div className="flex items-end justify-between">
    <h2 className="text-lg font-semibold tracking-tight text-slate-900">
      <span className="mr-2 inline-block h-2 w-2 rounded-full bg-sky-500 shadow-[0_0_0_4px_rgba(14,165,233,0.15)]" />
      {title}
    </h2>
    {sub ? <span className="text-xs text-slate-500">{sub}</span> : null}
  </div>
);

type IconRenderer = (props: React.SVGProps<SVGSVGElement>) => JSX.Element;

const iconProps = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const;

const DoctorIcon: IconRenderer = (props) => (
  <svg {...iconProps} {...props}>
    <circle cx={12} cy={7} r={3.5} />
    <path d="M6 20c.6-3.2 3.1-5.5 6-5.5s5.4 2.3 6 5.5" />
    <path d="M9 14h6" />
  </svg>
);

const AssistantIcon: IconRenderer = (props) => (
  <svg {...iconProps} {...props}>
    <path d="M4 10.5l2.2-4.5h11.6l2.2 4.5" />
    <path d="M6.5 10.5v4.8a5.5 5.5 0 0011 0v-4.8" />
    <path d="M12 9v2.3M10.7 10.2h2.6" />
  </svg>
);

const PatientsIcon: IconRenderer = (props) => (
  <svg {...iconProps} {...props}>
    <path d="M6 7h12a2 2 0 012 2v8a2 2 0 01-2 2H6a2 2 0 01-2-2V9a2 2 0 012-2z" />
    <path d="M9 4h6l1 3H8l1-3z" />
    <path d="M9 13h6M9 17h4" />
  </svg>
);

const StatsIcon: IconRenderer = (props) => (
  <svg {...iconProps} {...props}>
    <path d="M5 20h14" />
    <path d="M8 16V9" />
    <path d="M12 16V6" />
    <path d="M16 16v-4" />
  </svg>
);

const InventoryIcon: IconRenderer = (props) => (
  <svg {...iconProps} {...props}>
    <path d="M3 7l9-4 9 4-9 4-9-4z" />
    <path d="M3 7v10l9 4 9-4V7" />
    <path d="M12 11v10" />
  </svg>
);

const ChatIcon: IconRenderer = (props) => (
  <svg {...iconProps} {...props}>
    <path d="M6 6h12a3 3 0 013 3v5a3 3 0 01-3 3h-2.5L12 20.5 10.5 17H6a3 3 0 01-3-3V9a3 3 0 013-3z" />
    <path d="M9 11h6M9 14h4" />
  </svg>
);

const LogoutIcon: IconRenderer = (props) => (
  <svg {...iconProps} {...props}>
    <path d="M15 7l5 5-5 5" />
    <path d="M10 12h10" />
    <path d="M4 5v14" />
  </svg>
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
  const rowRefs = React.useRef<Record<string, HTMLDivElement | null>>({});

  // when a row expands, scroll it into view (inside the list only)
  useEffect(() => {
    if (!expandedId) return;
    const el = rowRefs.current[expandedId];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [expandedId]);

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

  const preSavedTests = useMemo(
    () => [
      'F.B.C',
      'Colestarol.C',
      'Lipid Profile',
      'Thyroid Panel',
      'D-Dimer',
      'Vitamin D',
      'Electrolyte Panel',
      'MRI Brain',
      'X-Ray Chest',
      'Blood Sugar Fasting',
    ],
    []
  );

  const [selectedTests, setSelectedTests] = useState<string[]>(['F.B.C', 'Colestarol.C']);
  const [testQuery, setTestQuery] = useState('');

  const filteredTestOptions = useMemo(() => {
    const available = preSavedTests.filter((test) => !selectedTests.includes(test));
    const q = testQuery.trim().toLowerCase();
    if (!q) {
      return available.slice(0, 5);
    }
    return available.filter((test) => test.toLowerCase().includes(q));
  }, [preSavedTests, selectedTests, testQuery]);

  const addMedicalTest = (test: string) => {
    setSelectedTests((prev) => (prev.includes(test) ? prev : [...prev, test]));
    setTestQuery('');
  };

  const handleMedicalTestKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && filteredTestOptions[0]) {
      event.preventDefault();
      addMedicalTest(filteredTestOptions[0]);
    }
  };

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

  const navigationItems = useMemo(
    () => [
      { id: 'doctor', label: 'Doctor Screen', icon: DoctorIcon, isActive: true },
      { id: 'assistant', label: 'Assistant Screen', icon: AssistantIcon },
      { id: 'patient', label: 'Patiant Management', icon: PatientsIcon },
      { id: 'stats', label: 'Stats', icon: StatsIcon },
      { id: 'inventory', label: 'Inventry Management', icon: InventoryIcon },
      { id: 'ai', label: 'Ai Chat', icon: ChatIcon },
    ],
    []
  );

  const logoutItem = useMemo(() => ({ id: 'logout', label: 'Logout', icon: LogoutIcon }), []);

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
    <div className="relative flex min-h-screen w-full bg-gradient-to-br from-[#e9f4ff] via-[#f7fbff] to-[#eef3ff] text-slate-900">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(56,189,248,0.14),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(14,165,233,0.18),transparent_25%),radial-gradient(circle_at_70%_70%,rgba(14,165,233,0.1),transparent_35%)]" />

      <div className="relative flex min-h-screen flex-1 flex-col px-6 py-6 lg:px-10">
        <main className="mx-auto flex w-full max-w-[1680px] flex-1 overflow-hidden">
          {/* Two-column layout: LEFT = detailed sheet, RIGHT = search/list */}
          <div className="grid h-full w-full grid-cols-12 gap-6">
          {/* RIGHT: Search + expandable patient list */}
          <div className="order-2 col-span-4 flex h-full min-h-0 flex-col overflow-hidden pl-1">
            <Card className="flex h-full min-h-0 flex-col p-5">
              <SectionTitle title="Search Patients" sub="Name / NIC / Mobile" />
              <div className="mt-4 flex items-center gap-3 rounded-2xl bg-slate-50/70 px-3 py-3 ring-1 ring-white/60">
                <div className="relative flex-1">
                  <svg className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" {...iconProps}>
                    <circle cx={11} cy={11} r={7} />
                    <path d="M16.5 16.5L21 21" />
                  </svg>
                  <input
                    placeholder="Search by name, NIC or reason"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full rounded-xl border border-transparent bg-white px-9 py-2.5 text-sm text-slate-900 shadow-inner shadow-slate-100 outline-none transition focus:border-sky-200 focus:ring-2 focus:ring-sky-100"
                  />
                </div>
                <button
                  className="inline-flex items-center gap-2 rounded-xl bg-sky-500 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white shadow-lg shadow-sky-200 transition hover:bg-sky-600 active:translate-y-px"
                  type="button"
                >
                  <svg {...iconProps} className="size-4">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  Search
                </button>
              </div>

              <div className="mt-5 flex items-center justify-between text-sm font-semibold text-slate-900">
                <span>Patient List</span>
                <span className="flex items-center gap-2 text-xs font-medium text-slate-500">
                  <span className="inline-flex size-2 rounded-full bg-emerald-400" /> {filtered.length} active
                </span>
              </div>
              <div className="mt-3 flex-1 space-y-3 overflow-y-auto pr-1 text-sm leading-tight">
                {filtered.map((p) => {
                  const isSelected = selectedId === p.id;
                  const isOpen = expandedId === p.id;
                  return (
                    <div
                      key={p.id}
                      ref={(el) => {
                        rowRefs.current[p.id] = el;
                      }}
                      className={`w-full rounded-2xl border border-white/70 bg-white/90 shadow-[0_12px_32px_rgba(14,116,144,0.08)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(14,116,144,0.12)] ${
                        isSelected ? 'ring-2 ring-sky-300/70' : 'ring-1 ring-slate-200'
                      }`}
                    >
                      {/* Row header */}
                      <div
                        className={`flex cursor-pointer items-center justify-between px-4 py-3 transition ${
                          isSelected ? 'bg-sky-50/70' : 'hover:bg-slate-50'
                        }`}
                        onClick={() => {
                          setSelectedId(p.id);
                          setGender(p.gender as 'Male' | 'Female');
                          toggleExpand(p.id);
                        }}
                      >
                        <div className="min-w-0 space-y-0.5">
                          <div className="truncate text-sm font-semibold text-slate-900">{p.name}</div>
                          <div className="truncate text-[11px] text-slate-500">{p.nic}</div>
                          <div className="flex items-center gap-2 text-[11px] text-slate-500">
                            <span className="inline-flex size-2 rounded-full bg-emerald-400" />
                            <span className="truncate">{p.reason}</span>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                          <div className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-600 ring-1 ring-white/70">
                            {p.time}
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedId(p.id);
                              setGender(p.gender as 'Male' | 'Female');
                              toggleExpand(p.id);
                            }}
                            className="grid size-7 place-items-center rounded-full border border-slate-200 bg-white text-xs text-slate-700 shadow-inner shadow-slate-100 transition hover:bg-slate-50"
                            aria-label={isOpen ? 'Collapse' : 'Expand'}
                          >
                            {isOpen ? '–' : '+'}
                          </button>
                        </div>
                      </div>

                      {/* Expanded preview card */}
                      {isOpen && (
                        <div className="mx-2 mb-2 rounded-2xl bg-gradient-to-b from-sky-50/90 via-white to-white px-4 py-4 ring-1 ring-sky-100">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="text-lg font-semibold leading-5 text-slate-900">{p.name}</div>
                              <div className="text-sm text-slate-600">{p.nic}</div>
                              <span className="mt-2 inline-flex items-center gap-2 rounded-full bg-slate-900 px-3 py-1 text-[11px] font-semibold text-white shadow-md">
                                <svg {...iconProps} className="size-3">
                                  <path d="M3 12h18" />
                                  <path d="M7 5h10l3 7-3 7H7L4 12l3-7z" />
                                </svg>
                                Father
                              </span>
                            </div>
                            <div className="text-right">
                              <div className="text-sm text-slate-700">
                                Age{' '}
                                <span className="text-xl font-semibold text-slate-900">{p.age}</span>
                              </div>
                              <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-sky-500 px-3 py-1 text-[11px] font-semibold text-white shadow-md">
                                <svg {...iconProps} className="size-3">
                                  <path d="M12 6v12" />
                                  <path d="M8 12h8" />
                                </svg>
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
            <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-[28px] border border-white/70 bg-white/80 p-6 shadow-[0_24px_60px_rgba(14,116,144,0.12)] ring-1 ring-sky-50/80 backdrop-blur-xl">
                {/* Patient quick info */}
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <input
                      className="flex-1 min-w-[220px] rounded-[999px] border border-transparent bg-white px-5 py-3 text-base font-semibold text-slate-900 placeholder-slate-400 shadow-inner shadow-slate-100 outline-none transition focus:border-sky-200 focus:ring-2 focus:ring-sky-100"
                      placeholder="Enter Patient Name"
                      defaultValue={selected.name}
                    />

                    <input
                      className="w-24 rounded-[999px] border border-transparent bg-white px-4 py-3 text-base font-semibold text-slate-900 placeholder-slate-400 shadow-inner shadow-slate-100 outline-none transition focus:border-sky-200 focus:ring-2 focus:ring-sky-100"
                      placeholder="Age"
                      defaultValue={selected.age}
                    />

                    <div className="rounded-full border border-white/80 bg-slate-50/70 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-slate-600 shadow-inner shadow-slate-100">
                      Patient No : MH0001
                    </div>

                    <div className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-slate-400/50">
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
                    <div className="rounded-3xl border border-slate-100 bg-slate-50/80 p-5 shadow-[0_12px_30px_rgba(15,23,42,0.04)]">
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="text-base font-semibold text-slate-900">Medical Test</div>
                        <label className="relative flex-1 min-w-[200px]">
                          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
                            🔍
                          </span>
                          <input
                            type="text"
                            className="h-11 w-full rounded-full border border-transparent bg-white/80 pl-9 pr-4 text-sm font-medium text-slate-900 placeholder-slate-400 shadow-inner shadow-white/40 outline-none transition focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
                            placeholder="Search test by name"
                            value={testQuery}
                            onChange={(event) => setTestQuery(event.target.value)}
                            onKeyDown={handleMedicalTestKeyDown}
                            aria-label="Search pre-saved medical tests"
                          />
                        </label>
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm">
                          {selectedTests.length} Tests
                        </span>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {selectedTests.map((test) => (
                          <span
                            key={test}
                            className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200"
                          >
                            {test}
                          </span>
                        ))}
                      </div>
                      <p className="mt-4 text-xs text-slate-500">
                        Type a test name and press Enter to add it to the patient&apos;s order.
                      </p>
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
      </div>

      <aside className="sticky top-0 flex h-screen w-28 flex-col items-center justify-between bg-transparent py-10">
        <div className="flex flex-col items-center gap-5">
          <div className="flex size-20 items-center justify-center rounded-full bg-slate-900 text-white shadow-[0_25px_40px_rgba(15,23,42,0.35)]">
            <svg {...iconProps} className="size-9">
              <circle cx={12} cy={8} r={3.5} />
              <path d="M7 19.5c.7-3.3 3.1-5.5 5-5.5s4.3 2.2 5 5.5" />
              <path d="M9.5 13h5" />
            </svg>
          </div>
          <div className="h-10 w-px rounded-full bg-slate-200" />
          <div className="flex flex-col items-center rounded-[999px] border border-slate-100 bg-white/90 px-3 py-6 text-slate-600 shadow-[0_25px_45px_rgba(15,23,42,0.08)] backdrop-blur">
            <ul className="flex flex-col items-center gap-4">
              {navigationItems.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    className={`group relative flex items-center justify-center rounded-full transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-400 ${
                      item.isActive
                        ? 'size-14 bg-slate-800 text-white shadow-[0_18px_32px_rgba(15,23,42,0.35)]'
                        : 'size-12 bg-white text-slate-500 ring-1 ring-slate-200 hover:ring-slate-300'
                    }`}
                    aria-label={item.label}
                  >
                    <item.icon className="size-5" />
                    <span className="pointer-events-none absolute right-full mr-3 origin-right scale-90 rounded-full bg-slate-900 px-3 py-1 text-xs font-medium uppercase tracking-wide text-white opacity-0 shadow-lg transition group-hover:scale-100 group-hover:opacity-100">
                      {item.label}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div className="h-10 w-px rounded-full bg-slate-200" />
        </div>

        <button
          type="button"
          className="group relative flex size-14 items-center justify-center rounded-full border border-rose-100 bg-white text-rose-500 shadow-[0_12px_24px_rgba(244,63,94,0.25)] transition hover:-translate-y-0.5 hover:border-rose-200"
          aria-label={logoutItem.label}
        >
          <logoutItem.icon className="size-5" />
          <span className="pointer-events-none absolute right-full mr-3 origin-right scale-90 rounded-full bg-rose-600 px-3 py-1 text-xs font-medium uppercase tracking-wide text-white opacity-0 shadow-lg transition group-hover:scale-100 group-hover:opacity-100">
            {logoutItem.label}
          </span>
        </button>
      </aside>
    </div>
  );
}
