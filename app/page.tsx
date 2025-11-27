'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { IconRenderer } from './components/NavigationPanel';
import { DoctorIcon } from './components/NavigationPanel';
import { NavigationPageShell } from './components/NavigationPageShell';

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

interface ClinicalDrug {
  drug: string;
  dose: string;
  terms: string;
  amount: string;
  source: 'Clinical' | 'Outside';
}

const SHADOWS = {
  card: 'shadow-[0_20px_48px_rgba(15,23,42,0.12)]',
  inset: 'shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]',
  primaryGlow: 'shadow-[0_14px_28px_rgba(10,132,255,0.28)]',
  darkGlow: 'shadow-[0_14px_28px_rgba(10,132,255,0.24)]',
  whiteInset: 'shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]',
  tooltip: 'shadow-[0_12px_24px_rgba(10,132,255,0.18)]',
  roseTooltip: 'shadow-[0_12px_24px_rgba(244,63,94,0.25)]',
} as const;

const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`ios-surface ${SHADOWS.card} ${className}`}>{children}</div>
);

const SectionTitle = ({ title, sub }: { title: string; sub?: string }) => (
  <div className="flex items-end justify-between">
    <h2 className="text-lg font-bold tracking-tight text-slate-900">
      <span className="mr-2 inline-block h-2 w-2 rounded-full bg-[var(--ioc-blue)] shadow-[0_0_0_4px_rgba(10,132,255,0.18)]" />
      {title}
    </h2>
    {sub ? <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{sub}</span> : null}
  </div>
);

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
    clinical: [],
    outside: [{ name: 'Paracetamol', dose: '250MG', terms: 'Hourly', amount: 32 }],
    tests: 'No',
    notes: 'No',
  });

  const formatDate = (date: Date) =>
    date.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });

  const getNextVisitDate = (option: 'TwoWeeks' | 'ThreeWeeks') => {
    const today = new Date();
    const daysToAdd = option === 'TwoWeeks' ? 14 : 21;
    today.setDate(today.getDate() + daysToAdd);
    return formatDate(today);
  };

  const [nextVisitOption, setNextVisitOption] = useState<'TwoWeeks' | 'ThreeWeeks'>('TwoWeeks');
  const [nextVisitDate, setNextVisitDate] = useState(() => getNextVisitDate('TwoWeeks'));

  // Per-patient selected history date index in expanded card
  const visitDateOptions = useMemo(
    () => ['Today', '05/10', '05/09', '05/08', '05/07', '05/06', '05/05', '15/04', '15/04'],
    []
  );
  const [rxRows, setRxRows] = useState<ClinicalDrug[]>([]);

  const suggestedDrugNames = useMemo(
    () => [
      'Ibuprofen',
      'Naproxen',
      'Acetaminophen',
      'Paracetamol',
      'Amoxicillin',
      'Azithromycin',
      'Metformin',
      'Omeprazole',
      'Amlodipine',
      'Prednisone',
      'Ciprofloxacin',
      'Clopidogrel',
    ],
    []
  );

  const [clinicalDrugForm, setClinicalDrugForm] = useState({
    name: '',
    doseValue: '',
    doseUnit: 'MG' as 'MG' | 'ML',
    terms: 'Daily' as 'Daily' | 'Hourly',
    termsValue: '',
    amount: '',
    source: 'Clinical' as ClinicalDrug['source'],
  });

  const filteredDrugSuggestions = useMemo(() => {
    const query = clinicalDrugForm.name.trim().toLowerCase();
    if (!query) {
      return suggestedDrugNames.slice(0, 6);
    }
    return suggestedDrugNames.filter((name) => name.toLowerCase().includes(query)).slice(0, 6);
  }, [clinicalDrugForm.name, suggestedDrugNames]);

  const toggleDoseUnit = () => {
    setClinicalDrugForm((prev) => ({
      ...prev,
      doseUnit: prev.doseUnit === 'MG' ? 'ML' : 'MG',
    }));
  };

  const toggleTerms = () => {
    setClinicalDrugForm((prev) => ({
      ...prev,
      terms: prev.terms === 'Daily' ? 'Hourly' : 'Daily',
    }));
  };

  const toggleDrugSource = () => {
    setClinicalDrugForm((prev) => ({
      ...prev,
      source: prev.source === 'Clinical' ? 'Outside' : 'Clinical',
    }));
  };

  const addClinicalDrug = () => {
    const name = clinicalDrugForm.name.trim();
    const doseValue = clinicalDrugForm.doseValue.trim();
    const termsValue = clinicalDrugForm.termsValue.trim();
    const amountValue = clinicalDrugForm.amount.trim();

    if (!name || !doseValue || !amountValue) return;

    const dose = `${doseValue}${clinicalDrugForm.doseUnit}`;
    const termsDisplay = termsValue ? `${clinicalDrugForm.terms} ${termsValue}` : clinicalDrugForm.terms;

    const newEntry: ClinicalDrug = {
      drug: name,
      dose,
      terms: termsDisplay,
      amount: amountValue,
      source: clinicalDrugForm.source,
    };

    setRxRows((prev) => [...prev, newEntry]);
    setClinicalDrugForm({
      name: '',
      doseValue: '',
      doseUnit: 'MG',
      terms: 'Daily',
      termsValue: '',
      amount: '',
      source: 'Clinical',
    });
  };

  const handleDrugFormKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      addClinicalDrug();
    }
  };

  const updateRxRow = (index: number, field: keyof ClinicalDrug, value: string) => {
    setRxRows((prev) =>
      prev.map((row, i) =>
        i === index
          ? {
              ...row,
              [field]:
                field === 'amount'
                  ? value.replace(/[^0-9.]/g, '')
                  : field === 'source'
                    ? (value as ClinicalDrug['source'])
                    : value,
            }
          : row
      )
    );
  };

  const removeRxRow = (index: number) => {
    setRxRows((prev) => prev.filter((_, i) => i !== index));
  };

  const handleNextVisitSelect = (option: 'TwoWeeks' | 'ThreeWeeks') => {
    setNextVisitOption(option);
    setNextVisitDate(getNextVisitDate(option));
  };

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

  const [selectedTests, setSelectedTests] = useState<string[]>([]);
  const [testQuery, setTestQuery] = useState('');
  const [highlightedTestIndex, setHighlightedTestIndex] = useState(-1);
  const [testChipsPendingRemoval, setTestChipsPendingRemoval] = useState<Set<string>>(new Set());

  const testChipsPendingRemovalRef = useRef(testChipsPendingRemoval);

  const filteredTestOptions = useMemo(() => {
    const available = preSavedTests.filter((test) => !selectedTests.includes(test));
    const q = testQuery.trim().toLowerCase();
    if (!q) {
      return available.slice(0, 5);
    }
    return available.filter((test) => test.toLowerCase().includes(q));
  }, [preSavedTests, selectedTests, testQuery]);

  useEffect(() => {
    const shouldHighlight = testQuery.trim().length > 0;
    setHighlightedTestIndex(shouldHighlight && filteredTestOptions.length ? 0 : -1);
  }, [filteredTestOptions, testQuery]);

  const addMedicalTest = (test: string) => {
    const trimmed = test.trim();
    if (!trimmed) return;
    setSelectedTests((prev) => (prev.includes(trimmed) ? prev : [...prev, trimmed]));
    setTestChipsPendingRemoval((prev) => {
      const next = new Set(prev);
      next.delete(trimmed);
      return next;
    });
    setTestQuery('');
    setHighlightedTestIndex(-1);
  };

  const toggleTestChipRemovalState = (test: string) => {
    setTestChipsPendingRemoval((prev) => {
      const next = new Set(prev);
      if (next.has(test)) {
        next.delete(test);
        setSelectedTests((current) => current.filter((entry) => entry !== test));
      } else {
        next.add(test);
      }
      return next;
    });
  };

  useEffect(() => {
    testChipsPendingRemovalRef.current = testChipsPendingRemoval;
  }, [testChipsPendingRemoval]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (!testChipsPendingRemovalRef.current.size) return;
      const target = event.target as HTMLElement | null;
      const pendingChip = target?.closest('[data-test-chip]');
      const isPendingChip = pendingChip?.getAttribute('data-pending-removal') === 'true';

      if (!isPendingChip) {
        setTestChipsPendingRemoval(new Set());
      }
    };

    document.addEventListener('click', handleOutsideClick, true);

    return () => {
      document.removeEventListener('click', handleOutsideClick, true);
    };
  }, []);

  const handleMedicalTestKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown' && filteredTestOptions.length) {
      event.preventDefault();
      setHighlightedTestIndex((prev) => (prev + 1) % filteredTestOptions.length);
      return;
    }

    if (event.key === 'ArrowUp' && filteredTestOptions.length) {
      event.preventDefault();
      setHighlightedTestIndex((prev) => (prev - 1 + filteredTestOptions.length) % filteredTestOptions.length);
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      const selected =
        (highlightedTestIndex >= 0 && filteredTestOptions[highlightedTestIndex]) || filteredTestOptions[0] || testQuery;
      if (selected) {
        addMedicalTest(selected);
      }
    }
  };

  const [selectedDiseases, setSelectedDiseases] = useState<string[]>([]);
  const [diseaseQuery, setDiseaseQuery] = useState('');
  const [diseaseSuggestions, setDiseaseSuggestions] = useState<string[]>([]);
  const [highlightedDiseaseIndex, setHighlightedDiseaseIndex] = useState(-1);
  const [isFetchingDiseases, setIsFetchingDiseases] = useState(false);
  const [chipsPendingRemoval, setChipsPendingRemoval] = useState<Set<string>>(new Set());

  const chipsPendingRemovalRef = useRef(chipsPendingRemoval);

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

  useEffect(() => {
    chipsPendingRemovalRef.current = chipsPendingRemoval;
  }, [chipsPendingRemoval]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (!chipsPendingRemovalRef.current.size) return;
      const target = event.target as HTMLElement | null;
      const pendingChip = target?.closest('[data-disease-chip]');
      const isPendingChip = pendingChip?.getAttribute('data-pending-removal') === 'true';

      if (!isPendingChip) {
        setChipsPendingRemoval(new Set());
      }
    };

    document.addEventListener('click', handleOutsideClick, true);

    return () => {
      document.removeEventListener('click', handleOutsideClick, true);
    };
  }, []);

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
    const drugRows = [
      ...sheet.clinical.map((drug) => ({ name: drug, dose: '—', terms: '', amount: '—', source: 'Clinical D.' })),
      ...sheet.outside.map((item) => ({
        name: item.name,
        dose: item.dose,
        terms: item.terms,
        amount: String(item.amount),
        source: 'Outside D.',
      })),
    ];

    const drugList = drugRows
      .map(
        (drug) =>
          `<li style="display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #e2e8f0;padding:8px 0;font-size:14px;color:#0f172a;">` +
          `<div>` +
          `<div style="font-weight:700;">${drug.name}</div>` +
          `<div style="color:#64748b;font-size:12px;">${drug.dose}${drug.terms ? ` · ${drug.terms}` : ''}</div>` +
          `</div>` +
          `<div style="display:flex;align-items:center;gap:8px;">` +
          `<span style="border-radius:999px;padding:6px 10px;font-size:10px;font-weight:800;text-transform:uppercase;background:${
            drug.source === 'Clinical D.' ? '#0f172a' : '#fef3c7'
          };color:${drug.source === 'Clinical D.' ? 'white' : '#78350f'};">${drug.source}</span>` +
          `<span style="border-radius:12px;background:#0f172a;color:white;padding:6px 10px;font-weight:700;font-size:12px;">${drug.amount}</span>` +
          `</div>` +
          `</li>`
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
            * { box-sizing: border-box; font-family: 'SF Pro Text', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif; }
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
                <h3>Drugs</h3>
                <ul style="list-style:none;padding:0;margin:0;">${drugList}</ul>
              </div>
              <div>
                <h3>Medical Tests</h3>
                <div class="chip-row">${testsList}</div>
              </div>
            </div>
            <div class="section">
              <h3>Special Notes</h3>
              <div class="subtitle">${sheet.notes}</div>
              <div class="subtitle" style="margin-top:12px;">Next Visit Date</div>
              <div class="title" style="font-size:16px;">${nextVisitDate}</div>
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
    <NavigationPageShell activeId="doctor" accentIcon={DoctorIcon}>
      <main className="flex min-h-screen items-start justify-center bg-gradient-to-br from-sky-50 via-white to-blue-50 px-4 py-6 text-slate-900">
      <div className="flex w-full max-w-[1760px] flex-col gap-6 lg:flex-row lg:items-start">
        <div className="w-full max-w-[1680px] flex-1 overflow-hidden rounded-[28px] border border-white/70 bg-white/80 shadow-[0_18px_42px_rgba(28,63,99,0.12)] ring-1 ring-sky-50/80 backdrop-blur-xl">
          <div className="relative flex w-full bg-gradient-to-br from-sky-50 via-white to-blue-50">
            <div className="relative flex flex-1 flex-col px-6 pb-20 pt-6 lg:px-10">
              <div className="mx-auto flex w-full flex-1">
          {/* Two-column layout: LEFT = detailed sheet, RIGHT = search/list */}
          <div className="grid w-full grid-cols-12 gap-6">
            {/* RIGHT: Search + standalone patient suggestion box */}
            <div className="order-2 col-span-12 flex flex-col gap-4 pl-1 pr-1 lg:order-2 lg:col-span-3">
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
                              <span className="rounded-full bg-[var(--ioc-blue)] px-3 py-1 text-white">{p.time}</span>
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

            </Card>

          </div>

            {/* LEFT: Full detailed sheet */}
            <div className="order-1 col-span-12 flex flex-col gap-4 pr-0 lg:order-1 lg:col-span-9 lg:pr-4">
              <div className="flex flex-col gap-6 rounded-[28px] border border-white/70 bg-white/80 p-6 shadow-[0_24px_60px_rgba(14,116,144,0.12)] ring-1 ring-sky-50/80 backdrop-blur-xl">
                {/* Patient quick info */}
                <div className="space-y-3">
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

                  <div className={`inline-flex items-center gap-2 rounded-full bg-[var(--ioc-blue)] px-4 py-2 text-xs font-semibold text-white ${SHADOWS.darkGlow}`}>
                    <span>Previously patient of Dr. Jay</span>
                    <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] tracking-wide">10 SEP 25</span>
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
                              data-disease-chip
                              data-pending-removal={isPendingRemoval}
                              onClick={() => toggleChipRemovalState(tag)}
                              className={`group relative flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold shadow-sm ring-1 transition ${
                                isPendingRemoval
                                  ? 'bg-rose-50 text-rose-700 ring-rose-200'
                                  : 'bg-white text-slate-700 ring-slate-200 hover:bg-slate-50'
                              }`}
                            >
                              <span className={isPendingRemoval ? 'opacity-70' : ''}>{tag}</span>
                              {isPendingRemoval ? (
                                <span className="ml-1 text-base font-black text-rose-500 transition group-hover:scale-110">×</span>
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
                        <div className="relative flex-1 min-w-[200px]">
                          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                          <input
                            type="text"
                            className={`h-11 w-full rounded-full border border-transparent bg-white/80 pl-10 pr-4 text-sm font-medium text-slate-900 placeholder-slate-400 ${SHADOWS.whiteInset} outline-none transition focus:border-sky-300 focus:ring-2 focus:ring-sky-100`}
                            placeholder="Search test by name"
                            value={testQuery}
                            onChange={(event) => setTestQuery(event.target.value)}
                            onKeyDown={handleMedicalTestKeyDown}
                            aria-label="Search pre-saved medical tests"
                          />
                          {Boolean(filteredTestOptions.length && (testQuery.trim() || highlightedTestIndex >= 0)) && (
                            <div className="absolute left-0 right-0 z-10 mt-2 max-h-48 overflow-y-auto rounded-2xl border border-slate-200 bg-white/95 shadow-lg">
                              <ul className="divide-y divide-slate-100 text-sm text-slate-800">
                                {filteredTestOptions.map((test, index) => (
                                  <li key={`${test}-${index}`}>
                                    <button
                                      type="button"
                                      className={`flex w-full items-center justify-between px-4 py-2 text-left transition hover:bg-sky-50 ${
                                        index === highlightedTestIndex ? 'bg-sky-50 text-sky-700' : ''
                                      }`}
                                      onMouseDown={(event) => {
                                        event.preventDefault();
                                        addMedicalTest(test);
                                      }}
                                    >
                                      <span className="flex-1 truncate">{test}</span>
                                      {index === highlightedTestIndex ? (
                                        <span className="ml-3 text-[10px] font-bold uppercase tracking-[0.18em] text-sky-600">
                                          Enter
                                        </span>
                                      ) : null}
                                    </button>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm">
                          {selectedTests.length} Tests
                        </span>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {selectedTests.map((test) => {
                          const isPendingRemoval = testChipsPendingRemoval.has(test);
                          return (
                            <button
                              key={test}
                              type="button"
                              data-test-chip
                              data-pending-removal={isPendingRemoval}
                              onClick={() => toggleTestChipRemovalState(test)}
                              className={`group relative flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold shadow-sm ring-1 transition ${
                                isPendingRemoval
                                  ? 'bg-rose-50 text-rose-700 ring-rose-200'
                                  : 'bg-white text-slate-700 ring-slate-200 hover:bg-slate-50'
                              }`}
                            >
                              <span className={isPendingRemoval ? 'opacity-70' : ''}>{test}</span>
                              {isPendingRemoval ? (
                                <span className="ml-1 text-base font-black text-rose-500 transition group-hover:scale-110">×</span>
                              ) : null}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  </div>

                  {/* Row 2: Drugs table + mini card */}
                  <div className="grid grid-cols-12 gap-6 overflow-hidden">
                    <div className="col-span-9">
                      <div className="h-full rounded-3xl border border-slate-100 bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="text-2xl font-bold text-slate-900">Drugs</div>
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#6b7280]">
                            {rxRows.length} {rxRows.length === 1 ? 'item' : 'items'}
                          </span>
                        </div>

                        <div className="mt-4 space-y-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                          <div className="grid grid-cols-12 gap-3">
                            <div className="col-span-5">
                              <div className="flex items-center justify-between gap-3">
                                <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Drug Name</label>
                                <button
                                  type="button"
                                  onClick={toggleDrugSource}
                                  className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] transition ${
                                    clinicalDrugForm.source === 'Clinical'
                                      ? 'bg-sky-100 text-sky-700 ring-1 ring-sky-200'
                                      : 'bg-amber-100 text-amber-700 ring-1 ring-amber-200'
                                  }`}
                                >
                                  {clinicalDrugForm.source === 'Clinical' ? 'Clinical' : 'Outside'}
                                </button>
                              </div>
                              <div className="relative mt-1">
                                <input
                                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm outline-none transition focus:border-sky-200 focus:ring-2 focus:ring-sky-100"
                                  placeholder="Type to search"
                                  value={clinicalDrugForm.name}
                                  onChange={(event) =>
                                    setClinicalDrugForm((prev) => ({ ...prev, name: event.target.value }))
                                  }
                                  onKeyDown={handleDrugFormKeyDown}
                                />
                                {Boolean(filteredDrugSuggestions.length) && clinicalDrugForm.name.trim() !== '' && (
                                  <div className="absolute left-0 right-0 z-10 mt-2 max-h-44 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg">
                                    <ul className="divide-y divide-slate-100 text-sm text-slate-700">
                                      {filteredDrugSuggestions.map((drug) => (
                                        <li key={drug}>
                                          <button
                                            type="button"
                                            className="flex w-full items-center justify-between px-3 py-2 text-left transition hover:bg-sky-50"
                                            onMouseDown={(event) => {
                                              event.preventDefault();
                                              setClinicalDrugForm((prev) => ({ ...prev, name: drug }));
                                            }}
                                          >
                                            <span>{drug}</span>
                                            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                                              Press Enter
                                            </span>
                                          </button>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="col-span-2">
                              <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Dose</label>
                              <div className="mt-1 flex items-center overflow-hidden rounded-full border border-slate-200 bg-white shadow-sm focus-within:border-sky-200 focus-within:ring-2 focus-within:ring-sky-100">
                                <input
                                  className="w-full border-none bg-transparent px-4 py-2 text-sm font-semibold text-slate-800 placeholder:text-slate-400 outline-none"
                                  placeholder="Value"
                                  inputMode="numeric"
                                  value={clinicalDrugForm.doseValue}
                                  onChange={(event) =>
                                    setClinicalDrugForm((prev) => ({ ...prev, doseValue: event.target.value }))
                                  }
                                  onKeyDown={handleDrugFormKeyDown}
                                />
                                <button
                                  type="button"
                                  onClick={toggleDoseUnit}
                                  aria-label="Toggle dose unit"
                                  aria-pressed={clinicalDrugForm.doseUnit === 'MG'}
                                  className="h-full rounded-none bg-slate-100 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-700 transition hover:bg-slate-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400"
                                >
                                  {clinicalDrugForm.doseUnit}
                                </button>
                              </div>
                            </div>

                            <div className="col-span-2">
                              <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Terms</label>
                              <div className="mt-1 flex items-center overflow-hidden rounded-full border border-slate-200 bg-white shadow-sm focus-within:border-sky-200 focus-within:ring-2 focus-within:ring-sky-100">
                                <input
                                  className="w-full border-none bg-transparent px-4 py-2 text-sm font-semibold text-slate-800 placeholder:text-slate-400 outline-none"
                                  placeholder="Value"
                                  inputMode="numeric"
                                  value={clinicalDrugForm.termsValue}
                                  onChange={(event) =>
                                    setClinicalDrugForm((prev) => ({ ...prev, termsValue: event.target.value }))
                                  }
                                  onKeyDown={handleDrugFormKeyDown}
                                />
                                <button
                                  type="button"
                                  onClick={toggleTerms}
                                  aria-label="Toggle terms"
                                  aria-pressed={clinicalDrugForm.terms === 'Daily'}
                                  className="h-full rounded-none bg-slate-100 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-700 transition hover:bg-slate-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400"
                                >
                                  {clinicalDrugForm.terms === 'Daily' ? 'D' : 'H'}
                                </button>
                              </div>
                            </div>

                            <div className="col-span-2">
                              <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Amount</label>
                              <div className="mt-1">
                                <input
                                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm outline-none transition focus:border-sky-200 focus:ring-2 focus:ring-sky-100"
                                  placeholder="Qty"
                                  inputMode="numeric"
                                  value={clinicalDrugForm.amount}
                                  onChange={(event) =>
                                    setClinicalDrugForm((prev) => ({ ...prev, amount: event.target.value }))
                                  }
                                  onKeyDown={handleDrugFormKeyDown}
                                />
                              </div>
                            </div>
                          </div>

                          <div className="mt-4 overflow-hidden rounded-2xl border border-slate-100">
                            <div className="grid grid-cols-[1.5fr_0.9fr_1fr_1fr_0.8fr_0.5fr] gap-2 bg-slate-50 px-4 py-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[#6b7280]">
                              <div>Drug Name</div>
                              <div>Type</div>
                              <div>Dose</div>
                              <div>Terms</div>
                              <div>Amount</div>
                              <div className="text-center">Action</div>
                            </div>
                            <div className="divide-y divide-slate-100 text-sm text-slate-900">
                              {rxRows.map((r, i) => (
                                <div
                                  key={i}
                                  className="group grid grid-cols-[1.5fr_0.9fr_1fr_1fr_0.8fr_0.5fr] items-center gap-2 bg-white/80 px-4 py-3 odd:bg-white even:bg-slate-50/60"
                                >
                                  <input
                                  className="w-full rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-600 shadow-sm outline-none focus:border-slate-200 focus:ring-0"
                                  value={r.drug}
                                  readOnly
                                  aria-readonly
                                />
                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateRxRow(i, 'source', r.source === 'Clinical' ? 'Outside' : 'Clinical')
                                    }
                                    className={`w-full rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition ${
                                      r.source === 'Clinical'
                                        ? 'bg-sky-50 text-sky-700 ring-1 ring-sky-200'
                                        : 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'
                                    }`}
                                  >
                                    {r.source === 'Clinical' ? 'Clinical' : 'Outside'}
                                  </button>
                                  <input
                                    className="w-full rounded-lg border border-transparent bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm outline-none transition focus:border-sky-200 focus:ring-2 focus:ring-sky-100"
                                    value={r.dose}
                                    onChange={(event) => updateRxRow(i, 'dose', event.target.value)}
                                  />
                                  <input
                                    className="w-full rounded-lg border border-transparent bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm outline-none transition focus:border-sky-200 focus:ring-2 focus:ring-sky-100"
                                    value={r.terms}
                                    onChange={(event) => updateRxRow(i, 'terms', event.target.value)}
                                  />
                                  <input
                                    className="w-full rounded-lg border border-transparent bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm outline-none transition focus:border-sky-200 focus:ring-2 focus:ring-sky-100"
                                    value={r.amount}
                                    inputMode="numeric"
                                    onChange={(event) => updateRxRow(i, 'amount', event.target.value)}
                                  />
                                  <div className="flex justify-center">
                                    <button
                                      type="button"
                                      onClick={() => removeRxRow(i)}
                                      className="opacity-0 transition hover:text-rose-600 group-hover:opacity-100"
                                      aria-label="Delete drug"
                                    >
                                      ×
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="col-span-3">
                      <div className="flex h-full flex-col justify-between rounded-3xl border border-slate-100 bg-slate-50 p-5">
                        <div className="space-y-2 text-base font-semibold text-slate-900">
                          {sheet.clinical.map((c, i) => (
                            <div key={i} className="rounded-2xl bg-white px-4 py-2 text-slate-700 shadow-sm">
                              {c}
                            </div>
                          ))}
                        </div>
                        <div className="rounded-2xl bg-white px-4 py-4 shadow-sm">
                          <div className="flex flex-col items-center gap-3 text-center">
                            <div className="text-base font-bold text-slate-900">Next Visit Date</div>
                            <div className="grid w-full max-w-md grid-cols-1 gap-3">
                              <button
                                type="button"
                                onClick={() => handleNextVisitSelect('TwoWeeks')}
                                className={`w-full rounded-full px-4 py-2 text-sm font-semibold transition ${
                                  nextVisitOption === 'TwoWeeks'
                                    ? 'bg-sky-500/90 text-white shadow-[0_10px_25px_rgba(14,165,233,0.35)]'
                                    : 'border border-slate-200 bg-white text-slate-800 hover:border-slate-300'
                                }`}
                              >
                                <span className="whitespace-nowrap">Two Weeks</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleNextVisitSelect('ThreeWeeks')}
                                className={`w-full rounded-full px-4 py-2 text-sm font-semibold transition ${
                                  nextVisitOption === 'ThreeWeeks'
                                    ? 'bg-sky-500/90 text-white shadow-[0_10px_25px_rgba(14,165,233,0.35)]'
                                    : 'border border-slate-200 bg-white text-slate-800 hover:border-slate-300'
                                }`}
                              >
                                <span className="whitespace-nowrap">Three Weeks</span>
                              </button>
                            </div>
                            <div className="w-full max-w-md space-y-3">
                              <div className="w-full rounded-full bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-800 ring-1 ring-slate-200">
                                {nextVisitDate}
                              </div>
                              <button className="w-full rounded-full bg-[var(--ioc-blue)] px-4 py-2 text-sm font-semibold text-white shadow-[0_10px_22px_rgba(0,114,206,0.28)] transition hover:-translate-y-0.5 hover:bg-[#0065b8]">
                                Confirm
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  </div>
      </div>
      </div>
    </main>
    </NavigationPageShell>
  );
}
