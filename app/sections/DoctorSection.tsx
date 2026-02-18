'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { IconRenderer } from '../components/NavigationPanel';
import { getProfileIdByNicOrName } from '../data/patientProfiles';
import { PatientProfileModal } from '../components/PatientProfileModal';
import { DIAGNOSIS_MAPPING } from '../data/diagnosisMapping';

// ---- Types ----
interface Patient {
    id: string;
    name: string;
    nic: string;
    time: string;
    reason: string;
    age: number;
    gender: string;
    profileId?: string;
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

export default function DoctorSection() {
    // ------ Constants ------
    const CAPACITY = 40; // soft cap used to render the compact capacity meter
    const router = useRouter();

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
                profileId: getProfileIdByNicOrName('61524862V', 'Premadasa'),
            },
            {
                id: 'p2',
                name: 'JR Jayawardhana',
                nic: '64524862V',
                time: '5.10 PM',
                reason: 'Stomach Ache, Headache',
                age: 62,
                gender: 'Male',
                profileId: getProfileIdByNicOrName('64524862V', 'JR Jayawardhana'),
            },
            {
                id: 'p3',
                name: 'Mitreepala Siirisena',
                nic: '78522862V',
                time: '5.20 PM',
                reason: 'Fever',
                age: 68,
                gender: 'Male',
                profileId: getProfileIdByNicOrName('78522862V', 'Mitreepala Siirisena'),
            },
            {
                id: 'p4',
                name: 'Chandrika Bandranayake',
                nic: '71524862V',
                time: '5.30 PM',
                reason: 'Fever, Headache',
                age: 63,
                gender: 'Female',
                profileId: getProfileIdByNicOrName('71524862V', 'Chandrika Bandranayake'),
            },
            {
                id: 'p5',
                name: 'Ranil Vicramasinghe',
                nic: '77524862V',
                time: '5.00 PM',
                reason: 'Fever, Headache',
                age: 76,
                gender: 'Male',
                profileId: getProfileIdByNicOrName('77524862V', 'Ranil Vicramasinghe'),
            },
            {
                id: 'p6',
                name: 'Mahinda Rajapakshe',
                nic: '74524862V',
                time: '—',
                reason: 'Headache',
                age: 66,
                gender: 'Male',
                profileId: getProfileIdByNicOrName('74524862V', 'Mahinda Rajapakshe'),
            },
        ],
        []
    );

    const [search, setSearch] = useState('');

    const [patientName, setPatientName] = useState('');
    const [patientAge, setPatientAge] = useState('');
    const [nicNumber, setNicNumber] = useState('');
    const [gender, setGender] = useState<'Male' | 'Female'>('Male');
    const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);

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
                // Parse NLM API response: [count, codes, null, [[code, name], ...]]
                const entries = Array.isArray(payload) && Array.isArray(payload[3])
                    ? (payload[3] as [string, string][])
                    : [];

                const suggestions = entries.map(([code, name]) => `${code} — ${name}`);
                setDiseaseSuggestions(suggestions);
                setHighlightedDiseaseIndex(suggestions.length ? 0 : -1);
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

        // Add disease if not present
        setSelectedDiseases((prev) => (prev.includes(trimmed) ? prev : [...prev, trimmed]));

        // Remove from pending removal if needed
        setChipsPendingRemoval((prev) => {
            const next = new Set(prev);
            next.delete(trimmed);
            return next;
        });

        // Auto-fill drugs based on keywords
        const lowerCaseDisease = trimmed.toLowerCase();
        let drugsToAdd: ClinicalDrug[] = [];

        // Check for exact matches or keyword containment in our mapping
        Object.entries(DIAGNOSIS_MAPPING).forEach(([key, drugs]) => {
            if (lowerCaseDisease.includes(key.toLowerCase())) {
                drugsToAdd = [...drugsToAdd, ...drugs];
            }
        });

        if (drugsToAdd.length > 0) {
            setRxRows((prev) => {
                // Avoid duplicates based on drug name
                const existingNames = new Set(prev.map(r => r.drug.toLowerCase()));
                const uniqueNewDrugs = drugsToAdd.filter(d => !existingNames.has(d.drug.toLowerCase()));
                return [...prev, ...uniqueNewDrugs];
            });
        }

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

    const handleSearchSelect = (patient: Patient) => {
        const profileId = patient.profileId || getProfileIdByNicOrName(patient.nic, patient.name);
        if (profileId) {
            setSelectedProfileId(profileId);
        }
    };

    return (
        <section id="doctor" className="flex min-h-screen items-start justify-center px-4 py-8 text-slate-900">
            <div className="w-full flex-1 overflow-hidden rounded-[28px] border border-white/70 bg-white/80 shadow-[0_18px_42px_rgba(28,63,99,0.12)] ring-1 ring-sky-50/80 backdrop-blur-xl">
                <div>
                    <div className="relative flex flex-1 flex-col px-6 pb-20 pt-6 lg:px-10">
                        <div className="mx-auto flex w-full flex-1">
                            {/* Two-column layout: LEFT = detailed sheet, RIGHT = search/list */}
                            <div className="grid w-full grid-cols-12 gap-6">
                                {/* RIGHT: Search + standalone patient suggestion box */}
                                <div className="order-2 col-span-12 flex flex-col gap-4 pl-1 pr-1 lg:order-2 lg:col-span-3">
                                    <Card className="flex min-h-0 flex-col p-5">
                                        <SectionTitle title="Search Patients" sub="Name / NIC" />
                                        <div className="mt-4 rounded-2xl bg-slate-50/70 p-4 ring-1 ring-white/60">
                                            <div className="relative z-[100]">
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
                                                <div className="absolute left-0 right-0 top-full z-[100] mt-2 max-h-60 overflow-y-auto rounded-2xl bg-white p-2 shadow-xl ring-1 ring-slate-200">
                                                    {searchMatches.length === 0 ? (
                                                        <p className="p-3 text-sm font-semibold text-slate-500">No matching patients found.</p>
                                                    ) : (
                                                        searchMatches.map((p) => (
                                                            <button
                                                                key={p.id}
                                                                type="button"
                                                                onClick={() => {
                                                                    handleSearchSelect(p);
                                                                    setSearch(''); // Clear search on selection
                                                                }}
                                                                className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-sm text-slate-800 transition hover:bg-sky-50"
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

                                    <div className="mt-2 flex justify-end">
                                        <button className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[var(--ioc-blue)] px-8 py-4 text-sm font-bold uppercase tracking-wider text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-[#0070f0] hover:shadow-sky-500/30 active:translate-y-0 active:shadow-md">
                                            Save & Print Record
                                        </button>
                                    </div>

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
                                                    <PatientProfileModal
                                                        profileId={selectedProfileId || ''}
                                                        onClose={() => setSelectedProfileId(null)}
                                                    />

                                                    <button
                                                        type="button"
                                                        onClick={() => setGender('Male')}
                                                        className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wider transition ${gender === 'Male'
                                                            ? 'bg-slate-800 text-white shadow-md'
                                                            : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'
                                                            }`}
                                                    >
                                                        Male
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setGender('Female')}
                                                        className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wider transition ${gender === 'Female'
                                                            ? 'bg-rose-600 text-white shadow-md'
                                                            : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-rose-50'
                                                            }`}
                                                    >
                                                        Female
                                                    </button>
                                                </div>

                                                <div className="flex-1" />
                                                <img src="/assets/brand-logo.png" alt="Brand Logo" className="h-10 w-auto object-contain opacity-90" />
                                            </div>

                                            <div className="flex items-center gap-4">
                                                <input
                                                    className="flex-1 rounded-xl border border-transparent bg-slate-50/50 px-4 py-2 text-lg font-bold text-slate-900 placeholder-slate-300 outline-none ring-1 ring-slate-200/50 transition focus:bg-white focus:ring-2 focus:ring-sky-100"
                                                    placeholder="Patient Name"
                                                    value={patientName}
                                                    onChange={(e) => setPatientName(e.target.value)}
                                                />
                                                <input
                                                    className="w-20 rounded-xl border border-transparent bg-slate-50/50 px-3 py-2 text-center text-lg font-bold text-slate-900 placeholder-slate-300 outline-none ring-1 ring-slate-200/50 transition focus:bg-white focus:ring-2 focus:ring-sky-100"
                                                    placeholder="Age"
                                                    value={patientAge}
                                                    onChange={(e) => setPatientAge(e.target.value)}
                                                />
                                                <div className="pl-2 text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                                                    Patient No: <span className="text-slate-900">12</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="h-px w-full bg-slate-100" />

                                        {/* Disease Selection with ICD-10 Search */}
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
                                                                    className={`block w-full rounded-xl px-3 py-2 text-left text-sm font-medium transition ${idx === highlightedDiseaseIndex
                                                                        ? 'bg-sky-50 text-sky-700'
                                                                        : 'text-slate-700 hover:bg-slate-50'
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
                                                                className={`rounded-full px-3 py-1 text-xs font-semibold transition ${isPending
                                                                    ? 'bg-rose-100 text-rose-700 ring-1 ring-rose-200'
                                                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                                                    }`}
                                                            >
                                                                {d} {isPending ? '×' : ''}
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
                                                                    className={`block w-full rounded-xl px-3 py-2 text-left text-sm font-medium transition ${idx === highlightedTestIndex
                                                                        ? 'bg-purple-50 text-purple-700'
                                                                        : 'text-slate-700 hover:bg-slate-50'
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
                                                                className={`rounded-full px-3 py-1 text-xs font-semibold transition ${isPending
                                                                    ? 'bg-rose-100 text-rose-700 ring-1 ring-rose-200'
                                                                    : 'bg-purple-50 text-purple-700 ring-1 ring-purple-100 hover:bg-purple-100'
                                                                    }`}
                                                            >
                                                                {t} {isPending ? '×' : ''}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="h-px w-full bg-slate-100" />

                                        {/* Drug Prescription Table */}
                                        <div className="relative z-0 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
                                            <div className="flex items-center justify-between">
                                                <p className="ml-1 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">
                                                    Prescription / Drugs
                                                </p>
                                                <div className="flex gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            // Example quick-fill
                                                            setRxRows([
                                                                {
                                                                    drug: 'Paracetamol',
                                                                    dose: '500MG',
                                                                    terms: 'Daily 3 x 4',
                                                                    amount: '12',
                                                                    source: 'Clinical',
                                                                },
                                                                {
                                                                    drug: 'Amoxicillin',
                                                                    dose: '250MG',
                                                                    terms: 'Hourly 6',
                                                                    amount: '10',
                                                                    source: 'Outside',
                                                                },
                                                            ]);
                                                        }}
                                                        className="rounded-full bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50"
                                                    >
                                                        Demo Fill
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setRxRows([])}
                                                        className="rounded-full bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-rose-500 shadow-sm ring-1 ring-rose-200 hover:bg-rose-50"
                                                    >
                                                        Clear
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Add Drug Row */}
                                            <div className="flex flex-col gap-3 rounded-xl bg-white p-3 shadow-sm ring-1 ring-slate-200 lg:flex-row lg:items-end">
                                                <div className="relative flex-1">
                                                    <label className="mb-1 block text-[10px] font-bold uppercase text-slate-400">Drug Name</label>
                                                    <input
                                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                                                        placeholder="e.g. Paracetamol"
                                                        value={clinicalDrugForm.name}
                                                        onChange={(e) => setClinicalDrugForm((prev) => ({ ...prev, name: e.target.value }))}
                                                        onKeyDown={handleDrugFormKeyDown}
                                                    />
                                                    {/* Autocomplete for Drug Name */}
                                                    {clinicalDrugForm.name && filteredDrugSuggestions.length > 0 && (
                                                        <div className="absolute inset-x-0 top-full z-20 mt-2 overflow-hidden rounded-xl bg-white shadow-xl ring-1 ring-slate-200">
                                                            {filteredDrugSuggestions.map((s) => (
                                                                <button
                                                                    key={s}
                                                                    type="button"
                                                                    onClick={() => setClinicalDrugForm((prev) => ({ ...prev, name: s }))}
                                                                    className="block w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                                                                >
                                                                    {s}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="w-28">
                                                    <label className="mb-1 block text-[10px] font-bold uppercase text-slate-400">Dose</label>
                                                    <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-0.5">
                                                        <input
                                                            className="w-full min-w-0 bg-transparent px-2 py-1.5 text-center text-sm font-semibold outline-none"
                                                            placeholder="500"
                                                            value={clinicalDrugForm.doseValue}
                                                            onChange={(e) => setClinicalDrugForm((prev) => ({ ...prev, doseValue: e.target.value }))}
                                                            onKeyDown={handleDrugFormKeyDown}
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={toggleDoseUnit}
                                                            className="rounded-lg bg-white px-2 py-1 text-[10px] font-bold text-slate-600 shadow-sm ring-1 ring-slate-200"
                                                        >
                                                            {clinicalDrugForm.doseUnit}
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="flex-[1.5]">
                                                    <label className="mb-1 block text-[10px] font-bold uppercase text-slate-400">Frequency</label>
                                                    <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-0.5">
                                                        <button
                                                            type="button"
                                                            onClick={toggleTerms}
                                                            className="px-2 text-[10px] font-bold uppercase text-slate-500 hover:text-slate-800"
                                                        >
                                                            {clinicalDrugForm.terms}
                                                        </button>
                                                        <input
                                                            className="w-full min-w-0 bg-transparent px-2 py-1.5 text-sm font-semibold outline-none"
                                                            placeholder="e.g. 3 x 4"
                                                            value={clinicalDrugForm.termsValue}
                                                            onChange={(e) => setClinicalDrugForm((prev) => ({ ...prev, termsValue: e.target.value }))}
                                                            onKeyDown={handleDrugFormKeyDown}
                                                        />
                                                    </div>
                                                </div>

                                                <div className="w-20">
                                                    <label className="mb-1 block text-[10px] font-bold uppercase text-slate-400">Qty</label>
                                                    <input
                                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-center text-sm font-semibold outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                                                        placeholder="12"
                                                        value={clinicalDrugForm.amount}
                                                        onChange={(e) =>
                                                            setClinicalDrugForm((prev) => ({ ...prev, amount: e.target.value.replace(/[^0-9]/g, '') }))
                                                        }
                                                        onKeyDown={handleDrugFormKeyDown}
                                                    />
                                                </div>

                                                <div className="flex w-32 items-center justify-end gap-2 pb-0.5">
                                                    <button
                                                        type="button"
                                                        onClick={toggleDrugSource}
                                                        className={`h-10 flex-1 rounded-xl text-[10px] font-bold uppercase tracking-wider transition ${clinicalDrugForm.source === 'Clinical'
                                                            ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 hover:bg-emerald-100'
                                                            : 'bg-amber-50 text-amber-700 ring-1 ring-amber-200 hover:bg-amber-100'
                                                            }`}
                                                    >
                                                        {clinicalDrugForm.source}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={addClinicalDrug}
                                                        className="flex size-10 items-center justify-center rounded-xl bg-slate-900 text-white hover:bg-slate-700"
                                                    >
                                                        +
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Rx List */}
                                            <div className="flex flex-col gap-2">
                                                {rxRows.length === 0 && (
                                                    <div className="py-4 text-center text-sm italic text-slate-400">No drugs added yet.</div>
                                                )}
                                                {rxRows.map((row, index) => (
                                                    <div
                                                        key={`${row.drug}-${index}`}
                                                        className="group flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition hover:border-sky-200 hover:shadow-md lg:flex-row lg:items-center"
                                                    >
                                                        <div className="flex flex-[2] flex-col">
                                                            <span className="text-sm font-bold text-slate-900">{row.drug}</span>
                                                            <span className="text-xs text-slate-500">{row.dose}</span>
                                                        </div>
                                                        <div className="flex-1 text-xs font-medium text-slate-600">{row.terms}</div>
                                                        <div className="w-20 text-center text-sm font-bold text-slate-800">
                                                            <input
                                                                className="w-full bg-transparent text-center outline-none"
                                                                value={row.amount}
                                                                onChange={(e) => updateRxRow(index, 'amount', e.target.value)}
                                                            />
                                                        </div>
                                                        <div className="w-24 text-center">
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    updateRxRow(index, 'source', row.source === 'Clinical' ? 'Outside' : 'Clinical')
                                                                }
                                                                className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${row.source === 'Clinical'
                                                                    ? 'bg-emerald-50 text-emerald-700'
                                                                    : 'bg-amber-50 text-amber-700'
                                                                    }`}
                                                            >
                                                                {row.source}
                                                            </button>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => removeRxRow(index)}
                                                            className="ml-2 text-slate-300 hover:text-rose-500"
                                                        >
                                                            x
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="h-px w-full bg-slate-100" />

                                        {/* Next Visit & Notes */}
                                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                            <div className="space-y-3 rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
                                                <p className="ml-1 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Next Visit Date</p>
                                                <div className="flex gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleNextVisitSelect('TwoWeeks')}
                                                        className={`flex-1 rounded-xl px-3 py-2 text-xs font-semibold uppercase transition ${nextVisitOption === 'TwoWeeks'
                                                            ? 'bg-slate-800 text-white shadow-md'
                                                            : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'
                                                            }`}
                                                    >
                                                        2 Weeks
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleNextVisitSelect('ThreeWeeks')}
                                                        className={`flex-1 rounded-xl px-3 py-2 text-xs font-semibold uppercase transition ${nextVisitOption === 'ThreeWeeks'
                                                            ? 'bg-slate-800 text-white shadow-md'
                                                            : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'
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
                                                        onChange={(e) => setNextVisitDate(e.target.value)}
                                                    />
                                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold uppercase text-slate-400">
                                                        DD/MM/YYYY
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-3 rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
                                                <p className="ml-1 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Doctor's Notes</p>
                                                <textarea
                                                    className="h-24 w-full resize-none rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-800 shadow-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-50"
                                                    placeholder="Add clinical notes here..."
                                                />
                                            </div>
                                        </div>


                                    </div>
                                </div>

                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
