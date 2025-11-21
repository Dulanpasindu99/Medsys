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

const SHADOWS = {
  card: 'shadow-[0_18px_42px_rgba(28,63,99,0.08)]',
  inset: 'shadow-[inset_0_1px_0_rgba(15,23,42,0.06)]',
  primaryGlow: 'shadow-[0_12px_24px_rgba(14,165,233,0.25)]',
  darkGlow: 'shadow-[0_14px_28px_rgba(15,23,42,0.18)]',
  whiteInset: 'shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]',
  tooltip: 'shadow-[0_12px_24px_rgba(15,23,42,0.18)]',
  roseTooltip: 'shadow-[0_12px_24px_rgba(244,63,94,0.25)]',
} as const;

const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div
    className={`rounded-[24px] border border-white/70 bg-white/80 ${SHADOWS.card} ring-1 ring-sky-50/60 backdrop-blur-xl ${className}`}
  >
    {children}
  </div>
);

const SectionTitle = ({ title, sub }: { title: string; sub?: string }) => (
  <div className="flex items-end justify-between">
    <h2 className="text-lg font-bold tracking-tight text-slate-900">
      <span className="mr-2 inline-block h-2 w-2 rounded-full bg-sky-500 shadow-[0_0_0_4px_rgba(14,165,233,0.15)]" />
      {title}
    </h2>
    {sub ? <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{sub}</span> : null}
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

const SearchIcon: IconRenderer = (props) => (
  <svg {...iconProps} {...props}>
    <circle cx={11} cy={11} r={7} />
    <path d="M16.5 16.5L21 21" />
  </svg>
);

const MicIcon: IconRenderer = (props) => (
  <svg {...iconProps} {...props}>
    <path d="M12 15a3 3 0 003-3V8a3 3 0 10-6 0v4a3 3 0 003 3z" />
    <path d="M6.5 11a5.5 5.5 0 0011 0M12 15.5V19M9.5 19h5" />
  </svg>
);

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
        reason: 'Fever, Headache',
        age: 66,
        gender: 'Male',
      },
      {
        id: 'p2',
        name: 'JR Jayawardhana',
        nic: '64524862V',
        time: '5.10 PM',
        reason: 'Stomach Ache, Headache',
        age: 62,
        gender: 'Male',
      },
      {
        id: 'p3',
        name: 'Mitreepala Siirisena',
        nic: '78522862V',
        time: '5.20 PM',
        reason: 'Fever',
        age: 68,
        gender: 'Male',
      },
      {
        id: 'p4',
        name: 'Chandrika Bandranayake',
        nic: '71524862V',
        time: '5.30 PM',
        reason: 'Fever, Headache',
        age: 63,
        gender: 'Female',
      },
      {
        id: 'p5',
        name: 'Ranil Vicramasinghe',
        nic: '77524862V',
        time: '5.00 PM',
        reason: 'Fever, Headache',
        age: 76,
        gender: 'Male',
      },
      {
        id: 'p6',
        name: 'Mahinda Rajapakshe',
        nic: '74524862V',
        time: '—',
        reason: 'Headache',
        age: 66,
        gender: 'Male',
      },
    ],
    []
  );

  const [search, setSearch] = useState('');

  const [patientName, setPatientName] = useState('');
  const [patientAge, setPatientAge] = useState('');
  const [nicNumber, setNicNumber] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female'>('Male');

  // Right sheet editable state
  const [sheet] = useState({
    disease: 'Fever',
    clinical: ['Ibuprofen', 'Naproxen', 'Acetaminophen'],
    outside: [{ name: 'Paracetamol', dose: '250MG', terms: 'Hourly', amount: 32 }],
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
  const [rxRows] = useState([
    { drug: 'Ibuprofen', dose: '250MG', terms: '1 DAILY', amount: 2 },
    { drug: 'Naproxen', dose: '250MG', terms: '1 DAILY', amount: 2 },
    { drug: 'Acetaminophen', dose: '250MG', terms: '2 Hourly', amount: 3 },
  ]);

  const preSavedTests = useMemo(
    () => [
      'F.B.C',
      'Cholesterol',
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

  const [selectedTests, setSelectedTests] = useState<string[]>(['F.B.C', 'Cholesterol']);
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

  const [selectedDiseases, setSelectedDiseases] = useState<string[]>([]);
  const [diseaseQuery, setDiseaseQuery] = useState('');
  const [diseaseSuggestions, setDiseaseSuggestions] = useState<string[]>([]);
  const [highlightedDiseaseIndex, setHighlightedDiseaseIndex] = useState(-1);
  const [isFetchingDiseases, setIsFetchingDiseases] = useState(false);
  const [chipsPendingRemoval, setChipsPendingRemoval] = useState<Set<string>>(new Set());

  const diseaseQuickTags = selectedDiseases;

  const normalizeDiseaseSuggestions = (payload: unknown, query: string): string[] => {
    if (!Array.isArray(payload)) return [];

    const fields = Array.isArray(payload[1]) ? (payload[1] as unknown[]) : [];
    const entries = Array.isArray(payload[2]) ? (payload[2] as unknown[]) : [];

    const codeIndex = fields.findIndex((field) => field === 'code');
    const nameIndex = fields.findIndex((field) => field === 'name');

    const icd10Names: string[] = entries
      .map((entry) => {
        if (!Array.isArray(entry)) return '';
        const code = codeIndex >= 0 && typeof entry[codeIndex] === 'string' ? entry[codeIndex] : undefined;
        const name = nameIndex >= 0 && typeof entry[nameIndex] === 'string' ? entry[nameIndex] : undefined;

        const codePart = code?.trim() ?? '';
        const namePart = name?.trim() ?? '';

        if (codePart && namePart) return `${codePart} — ${namePart}`;
        return namePart || codePart;
      })
      .filter(Boolean);

    const fallbackCandidates: unknown = payload[2] ?? payload[1];
    const fallbackNames: string[] = Array.isArray(fallbackCandidates)
      ? (fallbackCandidates as unknown[]).map((entry) => {
          if (Array.isArray(entry)) {
            return entry.filter((part) => typeof part === 'string').join(' — ');
          }
          return typeof entry === 'string' ? entry : '';
        })
      : [];

    const combined = Array.from(new Set([...icd10Names, ...fallbackNames]));
    const base = combined.map((name) => name.trim()).filter(Boolean);
    const qLower = query.trim().toLowerCase();

    const prefixMatches = base.filter((name) => name.toLowerCase().startsWith(qLower));
    const fallbackMatches = prefixMatches.length ? prefixMatches : base.filter((name) => name.toLowerCase().includes(qLower));

    return fallbackMatches.slice(0, 8);
  };

  useEffect(() => {
    const q = diseaseQuery.trim();
    if (q.length < 2) {
      setDiseaseSuggestions([]);
      setHighlightedDiseaseIndex(-1);
      return;
    }

    const controller = new AbortController();
    const fetchSuggestions = async () => {
      try {
        setIsFetchingDiseases(true);
        const response = await fetch(
          `https://clinicaltables.nlm.nih.gov/api/icd10cm/v3/search?sf=code,name&maxList=10&terms=${encodeURIComponent(q)}`,
          { signal: controller.signal }
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch suggestions: ${response.status}`);
        }

        const payload = (await response.json()) as unknown;
        const normalized = normalizeDiseaseSuggestions(payload, q);
        setDiseaseSuggestions(normalized);
        setHighlightedDiseaseIndex(normalized.length ? 0 : -1);
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error('Error fetching disease suggestions', error);
          setDiseaseSuggestions([]);
          setHighlightedDiseaseIndex(-1);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsFetchingDiseases(false);
        }
      }
    };

    fetchSuggestions();

    return () => controller.abort();
  }, [diseaseQuery]);

  const addDisease = (disease: string) => {
    const trimmed = disease.trim();
    if (!trimmed) return;
    setSelectedDiseases((prev) => (prev.includes(trimmed) ? prev : [...prev, trimmed]));
    setChipsPendingRemoval((prev) => {
      const next = new Set(prev);
      next.delete(trimmed);
      return next;
    });
    setDiseaseQuery('');
    setDiseaseSuggestions([]);
    setHighlightedDiseaseIndex(-1);
  };

  const toggleChipRemovalState = (disease: string) => {
    setChipsPendingRemoval((prev) => {
      const next = new Set(prev);
      if (next.has(disease)) {
        next.delete(disease);
        setSelectedDiseases((current) => current.filter((entry) => entry !== disease));
      } else {
        next.add(disease);
      }
      return next;
    });
  };

  const handleDiseaseKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown' && diseaseSuggestions.length) {
      event.preventDefault();
      setHighlightedDiseaseIndex((prev) => (prev + 1) % diseaseSuggestions.length);
    } else if (event.key === 'ArrowUp' && diseaseSuggestions.length) {
      event.preventDefault();
      setHighlightedDiseaseIndex((prev) =>
        prev <= 0 ? diseaseSuggestions.length - 1 : prev - 1
      );
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const selected =
        highlightedDiseaseIndex >= 0 && diseaseSuggestions[highlightedDiseaseIndex]
          ? diseaseSuggestions[highlightedDiseaseIndex]
          : diseaseSuggestions[0] || diseaseQuery;
      if (selected) {
        addDisease(selected);
      }
    }
  };

  const searchMatches = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];
    return patients.filter(
      (p) => p.name.toLowerCase().includes(q) || p.nic.toLowerCase().includes(q)
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

  const patientVitals = useMemo(
    () => [
      { label: 'Blood Pressure', value: '118 / 76 mmHg' },
      { label: 'Heart Rate', value: '74 bpm' },
      { label: 'Temperature', value: '98.6°F' },
      { label: 'SpO₂', value: '98%' },
    ],
    []
  );

  const patientAllergies = useMemo(
    () => [
      { name: 'Penicillin', severity: 'High', tone: 'rose', dot: 'bg-rose-400', pill: 'bg-rose-50 text-rose-700 ring-rose-100' },
      { name: 'Peanuts', severity: 'Medium', tone: 'amber', dot: 'bg-amber-400', pill: 'bg-amber-50 text-amber-700 ring-amber-100' },
      { name: 'Latex', severity: 'Low', tone: 'emerald', dot: 'bg-emerald-400', pill: 'bg-emerald-50 text-emerald-700 ring-emerald-100' },
    ],
    []
  );

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

  }, [
    patients,
    sheet.clinical,
    timeStr,
    dateStr,
    gender,
    visitDateOptions,
    occupancy,
    occupancyPercent,
    newPatients,
    existingPatients,
  ]);

  const buildPatientDetailMarkup = (patient: Patient) => {
    const clinicalRows = sheet.clinical
      .map((drug) => `<li class="py-1 text-sm text-slate-800">${drug}</li>`)
      .join('');
    const outsideRows = sheet.outside
      .map(
        (item) =>
          `<li class="flex items-center justify-between border-b border-slate-100 py-2 text-sm text-slate-800"><span>${item.name}</span><span class="text-xs text-slate-500">${item.dose}</span><span class="rounded-full bg-slate-900 px-3 py-1 text-[11px] font-semibold text-white">${item.amount}</span></li>`
      )
      .join('');
    const testsList = selectedTests
      .map((test) => `<span class="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-700 ring-1 ring-slate-200">${test}</span>`)
      .join('');

    return `<!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charSet="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>${patient.name} — Patient Preview</title>
          <style>
            * { box-sizing: border-box; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
            body { margin: 0; padding: 24px; background: #f8fafc; color: #0f172a; }
            .card { border-radius: 28px; background: white; box-shadow: 0 24px 64px rgba(14,116,144,0.18); padding: 20px; max-width: 520px; margin: 0 auto; border: 1px solid rgba(148,163,184,0.25); }
            .header { display: flex; justify-content: space-between; align-items: flex-start; }
            .pill { display: inline-flex; align-items: center; gap: 8px; border-radius: 999px; padding: 8px 12px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.18em; }
            .pill.dark { background: #0f172a; color: white; box-shadow: 0 8px 24px rgba(15,23,42,0.24); }
            .pill.solid { background: #0ea5e9; color: white; box-shadow: 0 8px 20px rgba(14,165,233,0.3); }
            .title { font-size: 22px; font-weight: 800; margin: 4px 0; }
            .subtitle { color: #475569; font-weight: 600; }
            .section { margin-top: 18px; padding-top: 14px; border-top: 1px solid #e2e8f0; }
            .section h3 { margin: 0 0 6px; font-size: 13px; letter-spacing: 0.18em; text-transform: uppercase; color: #6b7280; }
            .grid { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 12px; }
            .chip-row { display: flex; flex-wrap: wrap; gap: 8px; }
            .chip { background: #f8fafc; color: #0f172a; border-radius: 999px; padding: 10px 14px; font-weight: 700; box-shadow: inset 0 1px 0 rgba(148,163,184,0.35); }
            .footer-btn { margin-top: 18px; width: 100%; background: #0f172a; color: white; padding: 12px 16px; border-radius: 14px; border: none; font-weight: 700; letter-spacing: 0.04em; cursor: pointer; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="header">
              <div>
                <div class="title">${patient.name}</div>
                <div class="subtitle">${patient.nic}</div>
                <div class="subtitle">${patient.reason}</div>
              </div>
              <div>
                <div class="subtitle" style="text-align:right;">Age <span style="font-size:20px;font-weight:800;">${patient.age}</span></div>
                <div class="pill solid" style="justify-content:flex-end;">${patient.gender}</div>
              </div>
            </div>
            <div class="section">
              <h3>Disease</h3>
              <div class="chip-row">
                ${diseaseQuickTags.map((tag) => `<span class="chip">${tag}</span>`).join('')}
              </div>
            </div>
            <div class="section grid">
              <div>
                <h3>Clinical Drugs</h3>
                <ul style="list-style:none;padding:0;margin:0;">${clinicalRows}</ul>
              </div>
              <div>
                <h3>Medical Tests</h3>
                <div class="chip-row">${testsList}</div>
              </div>
            </div>
            <div class="section grid">
              <div>
                <h3>Outside Drugs</h3>
                <ul style="list-style:none;padding:0;margin:0;">${outsideRows}</ul>
              </div>
              <div>
                <h3>Special Notes</h3>
                <div class="subtitle">${sheet.notes}</div>
                <div class="subtitle" style="margin-top:12px;">Next Visit Date</div>
                <div class="title" style="font-size:16px;">${sheet.nextVisit}</div>
              </div>
            </div>
            <button class="footer-btn" type="button">Download as Report</button>
          </div>
        </body>
      </html>`;
  };

  const openPatientPreview = (patient: Patient) => {
    const popup = window.open('', '_blank', 'width=640,height=900');
    if (!popup) return;
    popup.document.write(buildPatientDetailMarkup(patient));
    popup.document.close();
    popup.focus();
  };

  const handleSearchSelect = (patient: Patient) => {
    setSearch(patient.name);
    openPatientPreview(patient);
  };

  return (
    <div className="relative flex min-h-screen w-full bg-[#f9fafb] text-slate-900">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(56,189,248,0.08),transparent_32%),radial-gradient(circle_at_85%_8%,rgba(14,165,233,0.12),transparent_25%),radial-gradient(circle_at_70%_70%,rgba(14,165,233,0.08),transparent_30%)]" />

      <div className="relative flex min-h-screen flex-1 flex-col px-6 py-6 lg:px-10">
        <main className="mx-auto flex w-full max-w-[1680px] flex-1 overflow-hidden">
          {/* Two-column layout: LEFT = detailed sheet, RIGHT = search/list */}
          <div className="grid h-full w-full grid-cols-12 gap-6">
            {/* RIGHT: Search + standalone patient suggestion box */}
            <div className="order-2 col-span-3 flex h-full min-h-0 flex-col gap-4 overflow-y-auto pl-1 pr-1">
              <Card className="flex min-h-0 flex-col p-5">
                <SectionTitle title="Search Patients" sub="Name / NIC" />
                <div className="mt-4 rounded-2xl bg-slate-50/70 p-4 ring-1 ring-white/60">
                  <div className="relative">
                    <SearchIcon className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-400" />
                    <input
                      placeholder="Search by name or NIC"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className={`w-full rounded-2xl border border-transparent bg-white px-11 py-3 text-sm text-slate-900 ${SHADOWS.inset} outline-none transition focus:border-sky-200 focus:ring-2 focus:ring-sky-100`}
                    />
                    <MicIcon className="pointer-events-none absolute right-4 top-1/2 size-5 -translate-y-1/2 text-slate-400" />
                  </div>
                  <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Start typing to search by patient name or NIC. Matching patients will appear below.
                  </p>

                  {search && (
                    <div className="mt-4 space-y-2 rounded-2xl bg-white/90 p-3 ring-1 ring-slate-200">
                      {searchMatches.length === 0 ? (
                        <p className="text-sm font-semibold text-slate-500">No matching patients found.</p>
                      ) : (
                        searchMatches.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => handleSearchSelect(p)}
                            className="flex w-full items-center justify-between rounded-xl bg-slate-50 px-3 py-3 text-left text-sm text-slate-800 ring-1 ring-slate-100 transition hover:-translate-y-px hover:bg-sky-50 hover:ring-sky-200"
                          >
                            <div className="min-w-0">
                              <div className="truncate text-sm font-semibold text-slate-900">{p.name}</div>
                              <div className="truncate text-[11px] text-slate-500">{p.nic}</div>
                            </div>
                            <div className="flex flex-col items-end gap-1 text-[11px] font-semibold text-slate-500">
                              <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-emerald-700 ring-1 ring-emerald-100">
                                <span className="size-2 rounded-full bg-emerald-400" />
                                {p.reason}
                              </span>
                              <span className="rounded-full bg-slate-900 px-3 py-1 text-white">{p.time}</span>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </Card>

              <Card className="flex flex-col gap-4 p-5">
                <div className="flex items-center justify-between">
                  <SectionTitle title="Patient Vitals" />
                  <span className="rounded-full bg-sky-600 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white shadow-[0_8px_22px_rgba(14,165,233,0.35)]">
                    Live
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {patientVitals.map((vital) => (
                    <div
                      key={vital.label}
                      className="rounded-2xl border border-white/70 bg-white/80 p-4 shadow-[0_10px_28px_rgba(14,165,233,0.12)] ring-1 ring-sky-50"
                    >
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">{vital.label}</p>
                      <p className="mt-1 text-xl font-bold text-slate-900">{vital.value}</p>
                    </div>
                  ))}
                </div>
              </Card>

            <Card className="flex flex-col gap-4 p-5">
              <div className="flex items-center justify-between">
                <SectionTitle title="Allergies & Alerts" />
                <span className="rounded-full bg-rose-600 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white shadow-[0_10px_24px_rgba(244,63,94,0.35)]">
                  Critical
                </span>
              </div>

              <div className="space-y-3">
                {patientAllergies.map((allergy) => (
                  <div
                    key={allergy.name}
                    className="flex items-center justify-between rounded-2xl bg-white/90 px-4 py-3 ring-1 ring-white/70 shadow-[0_12px_28px_rgba(15,23,42,0.08)]"
                  >
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Allergy</p>
                      <p className="text-base font-semibold text-slate-900">{allergy.name}</p>
                    </div>
                    <span
                      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ${allergy.pill}`}
                    >
                      <span className={`size-2 rounded-full ${allergy.dot}`} />
                      {allergy.severity}
                    </span>
                  </div>
                ))}
              </div>

              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                Status colors: Green = Active · Red/Orange = Allergy
              </p>
            </Card>

          </div>

            {/* LEFT: Full detailed sheet */}
            <div className="order-1 col-span-9 flex h-full min-h-0 flex-col overflow-hidden pr-4">
              <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-[28px] border border-white/70 bg-white/80 p-6 shadow-[0_24px_60px_rgba(14,116,144,0.12)] ring-1 ring-sky-50/80 backdrop-blur-xl">
                {/* Patient quick info */}
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <input
                      className={`flex-1 min-w-[220px] rounded-[999px] border border-transparent bg-white px-5 py-3 text-base font-semibold text-slate-900 placeholder-slate-400 ${SHADOWS.inset} outline-none transition focus:border-sky-200 focus:ring-2 focus:ring-sky-100`}
                      placeholder="Enter Patient Name"
                      value={patientName}
                      onChange={(event) => setPatientName(event.target.value)}
                    />

                    <input
                      className={`w-24 rounded-[999px] border border-transparent bg-white px-4 py-3 text-base font-semibold text-slate-900 placeholder-slate-400 ${SHADOWS.inset} outline-none transition focus:border-sky-200 focus:ring-2 focus:ring-sky-100`}
                      placeholder="Age"
                      value={patientAge}
                      onChange={(event) => setPatientAge(event.target.value)}
                    />

                    <div className={`rounded-full border border-white/80 bg-slate-50/70 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-slate-600 ${SHADOWS.inset}`}>
                      Patient No : MH0001
                    </div>

                    <div className={`inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white ${SHADOWS.darkGlow}`}>
                      <span>Previously patient of Dr. Jay</span>
                      <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] tracking-wide">10 SEP 25</span>
                    </div>
                  </div>

                <div className="flex flex-wrap items-center gap-3">
                  <input
                    className="w-52 rounded-[999px] border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                    placeholder="Enter NIC No"
                    value={nicNumber}
                    onChange={(event) => setNicNumber(event.target.value)}
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
              <div className="mt-4 flex-1 overflow-hidden">
                <div className="flex h-full min-h-0 flex-col gap-4 overflow-y-auto pr-1">
                  {/* Row 1: Disease + Regular / Medical Tests */}
                  <div className="grid grid-cols-12 gap-6">
                  {/* Disease side */}
                  <div className="col-span-8">
                    <div className="rounded-3xl border border-slate-100 bg-slate-50/70 p-5">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <div className="text-2xl font-bold text-slate-900">Disease</div>
                          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6b7280]">
                            Search and pick existing symptoms
                          </div>
                        </div>
                        <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">History</div>
                      </div>
                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        <div className="relative min-w-[220px] flex-1">
                          <input
                            className="w-full rounded-[999px] border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                            placeholder="Search Diseases"
                            value={diseaseQuery}
                            onChange={(event) => {
                              setDiseaseQuery(event.target.value);
                              setHighlightedDiseaseIndex(0);
                            }}
                            onKeyDown={handleDiseaseKeyDown}
                          />
                          {isFetchingDiseases ? (
                            <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                              Searching…
                            </div>
                          ) : null}
                          {Boolean(diseaseSuggestions.length) && (
                            <div className="absolute left-0 right-0 z-10 mt-2 max-h-60 overflow-y-auto rounded-2xl border border-slate-200 bg-white/95 shadow-lg backdrop-blur">
                              <ul className="divide-y divide-slate-100 text-sm text-slate-800">
                                {diseaseSuggestions.map((suggestion, index) => (
                                  <li key={`${suggestion}-${index}`}>
                                    <button
                                      type="button"
                                      className={`flex w-full items-center justify-between px-4 py-2 text-left transition hover:bg-sky-50 ${
                                        index === highlightedDiseaseIndex ? 'bg-sky-50 text-sky-700' : ''
                                      }`}
                                      onMouseDown={(event) => {
                                        event.preventDefault();
                                        addDisease(suggestion);
                                      }}
                                    >
                                      <span className="flex-1 truncate">{suggestion}</span>
                                      {index === highlightedDiseaseIndex ? (
                                        <span className="ml-3 text-[10px] font-bold uppercase tracking-[0.18em] text-sky-600">Enter</span>
                                      ) : null}
                                    </button>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                        <button
                          className="grid size-11 place-items-center rounded-full bg-sky-500 text-white shadow-sm transition hover:bg-sky-600 active:translate-y-px"
                          aria-label="Add selected disease"
                          type="button"
                          onClick={() => {
                            const choice =
                              (highlightedDiseaseIndex >= 0 && diseaseSuggestions[highlightedDiseaseIndex]) ||
                              diseaseSuggestions[0] ||
                              diseaseQuery;
                            if (choice) {
                              addDisease(choice);
                            }
                          }}
                        >
                          <SearchIcon className="size-4" />
                        </button>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {selectedDiseases.map((tag) => {
                          const isPendingRemoval = chipsPendingRemoval.has(tag);
                          return (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => toggleChipRemovalState(tag)}
                              className={`relative rounded-full px-4 py-2 text-sm font-semibold shadow-sm ring-1 transition ${
                                isPendingRemoval
                                  ? 'bg-rose-50 text-rose-700 ring-rose-200'
                                  : 'bg-white text-slate-700 ring-slate-200 hover:bg-slate-50'
                              }`}
                            >
                              <span className={isPendingRemoval ? 'opacity-30' : ''}>{tag}</span>
                              {isPendingRemoval ? (
                                <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-base font-black text-rose-500">
                                  ×
                                </span>
                              ) : null}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Medical Tests side */}
                  <div className="col-span-4">
                    <div className="rounded-3xl border border-slate-100 bg-slate-50/80 p-5 shadow-[0_12px_30px_rgba(15,23,42,0.04)]">
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="text-base font-bold text-slate-900">Medical Test</div>
                        <label className="relative flex-1 min-w-[200px]">
                          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
                            🔍
                          </span>
                          <input
                            type="text"
                            className={`h-11 w-full rounded-full border border-transparent bg-white/80 pl-9 pr-4 text-sm font-medium text-slate-900 placeholder-slate-400 ${SHADOWS.whiteInset} outline-none transition focus:border-sky-300 focus:ring-2 focus:ring-sky-100`}
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
                    </div>
                  </div>
                  </div>

                  {/* Row 2: Clinical / Outside tables + mini cards */}
                  <div className="grid grid-cols-12 gap-6 overflow-hidden">
                  {/* Clinical row: table + mini card */}
                  <div className="col-span-8">
                    <div className="h-full rounded-3xl border border-slate-100 bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="text-2xl font-bold text-slate-900">Clinical Drugs</div>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#6b7280]">
                          3 items
                        </span>
                      </div>
                      <div className="mt-4 overflow-hidden rounded-2xl border border-slate-100">
                        <div className="grid grid-cols-4 gap-2 bg-slate-50 px-4 py-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[#6b7280]">
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
                        <div className="text-2xl font-bold text-slate-900">Outside Drugs</div>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#6b7280]">
                          1 item
                        </span>
                      </div>
                      <div className="mt-4 overflow-hidden rounded-2xl border border-slate-100">
                        <div className="grid grid-cols-4 gap-2 bg-slate-50 px-4 py-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[#6b7280]">
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
                      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                        nextVisitOption === 'TwoWeeks'
                          ? 'bg-sky-500 text-white shadow-sm'
                          : 'border border-slate-300 bg-white text-slate-800'
                      }`}
                    >
                      Two Weeks
                    </button>
                    <button
                      type="button"
                      onClick={() => setNextVisitOption('ThreeWeeks')}
                      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                        nextVisitOption === 'ThreeWeeks'
                          ? 'bg-sky-500 text-white shadow-sm'
                          : 'border border-slate-300 bg-white text-slate-800'
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
                    <span className={`pointer-events-none absolute right-full mr-3 origin-right scale-90 rounded-full bg-slate-900 px-3 py-1 text-xs font-medium uppercase tracking-wide text-white opacity-0 ${SHADOWS.tooltip} transition group-hover:scale-100 group-hover:opacity-100`}>
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
          <span className={`pointer-events-none absolute right-full mr-3 origin-right scale-90 rounded-full bg-rose-600 px-3 py-1 text-xs font-medium uppercase tracking-wide text-white opacity-0 ${SHADOWS.roseTooltip} transition group-hover:scale-100 group-hover:opacity-100`}>
            {logoutItem.label}
          </span>
        </button>
      </aside>
    </div>
  );
}
