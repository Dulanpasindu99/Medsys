'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { IconRenderer } from '../components/NavigationPanel';
import { getPatientProfile, getProfileIdByNicOrName } from '../data/patientProfiles';
import { PatientProfileModal } from '../components/PatientProfileModal';
import { DIAGNOSIS_MAPPING } from '../data/diagnosisMapping';
import { ApiClientError, appointmentsApi, patientsApi } from '@/app/lib/api-client';
import { getAccessToken, getRefreshToken } from '@/app/lib/auth-store';
import type { PatientRecord } from '@/app/lib/types';
import {
    addDrugSchema,
    doctorFormSchema,
    newPatientFormSchema,
    rxRowSchema,
} from '@/app/utils/schema-validation/doctor-section.schema';

// ---- Types ----
interface Patient {
    id: string;
    patientNumber: number;
    name: string;
    nic: string;
    time: string;
    reason: string;
    age: number;
    gender: string;
    profileId?: string;
    allergies?: {
        id: string | number;
        allergy_name: string;
        severity: 'low' | 'moderate' | 'high' | null;
    }[];
}

interface ClinicalDrug {
    drug: string;
    dose: string;
    terms: string;
    amount: string;
    source: 'Clinical' | 'Outside';
}

type GenderLabel = 'Male' | 'Female' | 'Other';

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

    // ------ Queue Data ------
    const [patients, setPatients] = useState<Patient[]>([]);
    const [allPatients, setAllPatients] = useState<Patient[]>([]);
    const [loadError, setLoadError] = useState<string | null>(null);

    useEffect(() => {
        let mounted = true;
        const loadPatients = async () => {
            if (!getAccessToken() && !getRefreshToken()) {
                router.replace('/login');
                return;
            }

            try {
                setLoadError(null);
                const [appointmentsResponse, patientsResponse] = await Promise.all([
                    appointmentsApi.list(1, 200, 'waiting'),
                    patientsApi.list(1, 500),
                ]);

                const patientById = new Map(
                    patientsResponse.data.map((patient) => [String(patient.id), patient])
                );

                const toAge = (dob: string | null) => {
                    if (!dob) return 0;
                    const date = new Date(dob);
                    return Number.isNaN(date.getTime())
                        ? 0
                        : Math.max(0, new Date().getFullYear() - date.getFullYear());
                };
                const toPatientNumber = (id: string | number, fallback: number) => {
                    const parsed = Number(id);
                    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
                };

                const mapped = appointmentsResponse.data
                    .map((appointment, index) => {
                        const patient = patientById.get(String(appointment.patient_id));
                        if (!patient) return null;
                        return {
                            id: `p-${appointment.id}`,
                            patientNumber: toPatientNumber(patient.id, index + 1),
                            name: String(patient.full_name ?? ''),
                            nic: String(patient.nic ?? 'N/A'),
                            time: new Date(appointment.scheduled_at).toLocaleTimeString('en-US', {
                                hour: 'numeric',
                                minute: '2-digit',
                            }),
                            reason: String(appointment.reason ?? 'Consultation'),
                            age: toAge(patient.dob),
                            gender: patient.gender === 'female' ? 'Female' : patient.gender === 'other' ? 'Other' : 'Male',
                            profileId: patient.nic
                                ? getProfileIdByNicOrName(patient.nic, patient.full_name)
                                : undefined,
                            allergies: patient.allergies ?? [],
                        } as Patient;
                    })
                    .filter((entry): entry is Patient => Boolean(entry));

                const allMapped = patientsResponse.data.map((patient, index) => ({
                    id: `patient-${patient.id}`,
                    patientNumber: toPatientNumber(patient.id, index + 1),
                    name: String(patient.full_name ?? ''),
                    nic: String(patient.nic ?? 'N/A'),
                    time: 'N/A',
                    reason: 'General',
                    age: toAge(patient.dob),
                    gender: patient.gender === 'female' ? 'Female' : patient.gender === 'other' ? 'Other' : 'Male',
                    profileId: patient.nic
                        ? getProfileIdByNicOrName(patient.nic, patient.full_name)
                        : undefined,
                    allergies: patient.allergies ?? [],
                })) as Patient[];

                if (!mounted) return;
                setPatients(mapped);
                setAllPatients(allMapped);
            } catch (error) {
                if (error instanceof ApiClientError && error.status === 401) {
                    router.replace('/login');
                    return;
                }
                if (mounted) {
                    setLoadError(error instanceof Error ? error.message : 'Failed to load doctor queue');
                }
            }
        };

        void loadPatients();

        return () => {
            mounted = false;
        };
    }, [router]);

    const [search, setSearch] = useState('');

    const [patientName, setPatientName] = useState('');
    const [patientAge, setPatientAge] = useState('');
    const [nicNumber, setNicNumber] = useState('');
    const [currentPatientNumber, setCurrentPatientNumber] = useState<number | null>(null);
    const [gender, setGender] = useState<GenderLabel>('Male');
    const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
    const [showNewPatientForm, setShowNewPatientForm] = useState(false);
    const [newPatientFirstName, setNewPatientFirstName] = useState('');
    const [newPatientLastName, setNewPatientLastName] = useState('');
    const [newPatientDob, setNewPatientDob] = useState('');
    const [newPatientPhone, setNewPatientPhone] = useState('');
    const [newPatientAddress, setNewPatientAddress] = useState('');
    const [newPatientBloodGroup, setNewPatientBloodGroup] = useState('');
    const [nicLookupMessage, setNicLookupMessage] = useState<string | null>(null);
    const [doctorNotes, setDoctorNotes] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

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
    const [showDrugSuggestions, setShowDrugSuggestions] = useState(false);

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
        const parsed = addDrugSchema.safeParse({
            name,
            doseValue,
            termsValue,
            amount: amountValue,
        });
        if (!parsed.success) {
            const nextErrors: Record<string, string> = {};
            for (const issue of parsed.error.issues) {
                const key = String(issue.path[0] ?? 'drug');
                nextErrors[`drug_${key}`] = issue.message;
            }
            setFieldErrors((prev) => ({ ...prev, ...nextErrors }));
            return;
        }

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
        setFieldErrors((prev) => {
            const next = { ...prev };
            delete next.drug_name;
            delete next.drug_doseValue;
            delete next.drug_termsValue;
            delete next.drug_amount;
            delete next.rxRows;
            return next;
        });
        setShowDrugSuggestions(false);
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
        setFieldErrors((prev) => {
            const next = { ...prev };
            delete next.selectedDiseases;
            return next;
        });
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
        const asLower = (value: unknown) => String(value ?? '').toLowerCase();
        return allPatients.filter((p) =>
            asLower(p.name).includes(q) ||
            asLower(p.nic).includes(q) ||
            asLower(p.id).includes(q)
        );
    }, [allPatients, search]);

    const profile = useMemo(
        () => (selectedProfileId ? getPatientProfile(selectedProfileId) : undefined),
        [selectedProfileId]
    );

    const patientVitals = useMemo(() => {
        const latestBp = profile?.timeline
            ?.slice()
            .reverse()
            .find((entry) => entry.kind === 'bp' && entry.value)?.value;

        return [
            { label: 'Blood Pressure', value: latestBp ?? null },
            { label: 'Heart Rate', value: null },
        ];
    }, [profile]);

    const patientAllergies = useMemo(() => {
        const severityToUi = (severity: 'low' | 'moderate' | 'high' | null | undefined) => {
            if (severity === 'high') {
                return { severity: 'High', dot: 'bg-rose-400', pill: 'bg-rose-50 text-rose-700 ring-rose-100' };
            }
            if (severity === 'low') {
                return { severity: 'Low', dot: 'bg-emerald-400', pill: 'bg-emerald-50 text-emerald-700 ring-emerald-100' };
            }
            return { severity: 'Medium', dot: 'bg-amber-400', pill: 'bg-amber-50 text-amber-700 ring-amber-100' };
        };

        const fromApi = (selectedPatient?.allergies ?? []).map((item) => {
            const ui = severityToUi(item.severity);
            return {
                name: item.allergy_name,
                severity: ui.severity,
                dot: ui.dot,
                pill: ui.pill,
            };
        });
        if (fromApi.length > 0) {
            return fromApi;
        }

        const fromProfile = (profile?.allergies ?? []).map((name) => {
            const ui = severityToUi(null);
            return {
                name,
                severity: ui.severity,
                dot: ui.dot,
                pill: ui.pill,
            };
        });
        return fromProfile;
    }, [profile, selectedPatient]);

    // ------ Header derived state ------
    const occupancy = Math.min(patients.length, CAPACITY);
    const occupancyPercent = Math.round((occupancy / CAPACITY) * 100);
    const newPatients = patients.length === 0 ? 0 : Math.ceil(patients.length * 0.4);
    const existingPatients = Math.max(0, patients.length - newPatients);

    const applyPatientSelection = (patient: Patient) => {
        const profileId = patient.profileId || getProfileIdByNicOrName(patient.nic, patient.name);
        setSelectedProfileId(profileId ?? null);
        setSelectedPatient(patient);
        setShowNewPatientForm(false);
        setNicLookupMessage(null);
        setCurrentPatientNumber(patient.patientNumber);
        setPatientName(String(patient.name ?? ''));
        setNicNumber(String(patient.nic ?? ''));
        setPatientAge(String(patient.age ?? ''));
        setGender(patient.gender === 'Female' ? 'Female' : patient.gender === 'Other' ? 'Other' : 'Male');
        setFieldErrors((prev) => {
            const next = { ...prev };
            delete next.nicNumber;
            delete next.patientName;
            delete next.patientAge;
            return next;
        });
    };

    const clearSelectedPatientContext = () => {
        setSelectedPatient(null);
        setSelectedProfileId(null);
        setCurrentPatientNumber(null);
    };

    const resetNewPatientForm = () => {
        setNewPatientFirstName('');
        setNewPatientLastName('');
        setNewPatientDob('');
        setNewPatientPhone('');
        setNewPatientAddress('');
        setNewPatientBloodGroup('');
    };

    const handleSearchSelect = (patient: Patient) => {
        applyPatientSelection(patient);
    };

    const getNicValidationError = (value: string) => {
        const parsed = doctorFormSchema.shape.nicNumber.safeParse(value.trim());
        if (parsed.success) return null;
        return parsed.error.issues[0]?.message ?? 'Invalid NIC';
    };

    const mapPatientRecordToPatient = (record: PatientRecord, fallbackNumber: number): Patient => {
        const rawRecord = record as PatientRecord & Record<string, unknown>;
        const firstName = String(
            (rawRecord.first_name as string | undefined) ??
            (rawRecord.firstName as string | undefined) ??
            ''
        ).trim();
        const lastName = String(
            (rawRecord.last_name as string | undefined) ??
            (rawRecord.lastName as string | undefined) ??
            ''
        ).trim();
        const combinedName = `${firstName} ${lastName}`.trim();
        const fullName = combinedName || String(
            (rawRecord.full_name as string | undefined) ??
            (rawRecord.fullName as string | undefined) ??
            ''
        ).trim();
        const dobValue =
            (rawRecord.dob as string | null | undefined) ??
            (rawRecord.date_of_birth as string | null | undefined) ??
            (rawRecord.dateOfBirth as string | null | undefined) ??
            null;
        const dobDate = dobValue ? new Date(dobValue) : null;
        const ageFromBackendRaw = rawRecord.age as number | string | null | undefined;
        const ageFromBackend =
            typeof ageFromBackendRaw === 'number'
                ? ageFromBackendRaw
                : typeof ageFromBackendRaw === 'string'
                    ? Number(ageFromBackendRaw)
                    : NaN;
        const computedAge =
            dobDate && !Number.isNaN(dobDate.getTime())
                ? Math.max(0, new Date().getFullYear() - dobDate.getFullYear())
                : 0;
        const age = Number.isFinite(ageFromBackend) && ageFromBackend >= 0
            ? Math.floor(ageFromBackend)
            : computedAge;
        const parsedId = Number(record.id);
        const patientNumber = Number.isFinite(parsedId) && parsedId > 0 ? parsedId : fallbackNumber;

        return {
            id: `patient-${record.id}`,
            patientNumber,
            name: fullName,
            nic: String(record.nic ?? 'N/A'),
            time: 'N/A',
            reason: 'General',
            age,
            gender: record.gender === 'female' ? 'Female' : record.gender === 'other' ? 'Other' : 'Male',
            profileId: record.nic ? getProfileIdByNicOrName(record.nic, fullName) : undefined,
            allergies: record.allergies ?? [],
        };
    };

    const lookupPatientByNic = async (nic: string) => {
        const normalized = nic.trim();
        if (!normalized) return null;

        const firstPage = await patientsApi.list(1, 20);
        const firstMatch = firstPage.data.find((entry) => String(entry.nic ?? '').trim() === normalized);
        if (firstMatch) return firstMatch;

        const total = firstPage.meta?.total ?? firstPage.data.length;
        const totalPages = Math.max(1, Math.ceil(total / 20));
        for (let page = 2; page <= totalPages; page += 1) {
            const pageData = await patientsApi.list(page, 20);
            const matched = pageData.data.find((entry) => String(entry.nic ?? '').trim() === normalized);
            if (matched) {
                return matched;
            }
        }
        return null;
    };

    const handleNicEnterLookup = async () => {
        const nic = nicNumber.trim();
        const nicError = getNicValidationError(nic);
        if (nicError) {
            setFieldErrors((prev) => ({ ...prev, nicNumber: nicError }));
            return;
        }
        try {
            const matchedRecord = await lookupPatientByNic(nic);
            if (!matchedRecord) {
                clearSelectedPatientContext();
                setShowNewPatientForm(true);
                setNicLookupMessage('There are no user under that NIC.');
                return;
            }

            const detailedRecord = await patientsApi.findById(matchedRecord.id);
            const mapped = mapPatientRecordToPatient(detailedRecord, allPatients.length + 1);
            setAllPatients((prev) => {
                const index = prev.findIndex((entry) => entry.id === mapped.id);
                if (index === -1) {
                    return [...prev, mapped];
                }
                const next = [...prev];
                next[index] = mapped;
                return next;
            });
            applyPatientSelection(mapped);
            setShowNewPatientForm(false);
            setNicLookupMessage(null);
            resetNewPatientForm();
            setSaveError(null);
        } catch (error) {
            setSaveError(error instanceof Error ? error.message : 'Failed to lookup patient.');
        }
    };

    useEffect(() => {
        const nic = nicNumber.trim();
        const matchedPatient = allPatients.find((patient) => String(patient.nic ?? '').trim() === nic);
        if (!matchedPatient) {
            if (selectedPatient) {
                clearSelectedPatientContext();
            }
            return;
        }

        if (selectedPatient?.id !== matchedPatient.id) {
            applyPatientSelection(matchedPatient);
            setShowNewPatientForm(false);
            setNicLookupMessage(null);
            resetNewPatientForm();
        }
    }, [allPatients, nicNumber, selectedPatient]);

    const nextPatientNumber = useMemo(
        () => Math.max(0, ...allPatients.map((patient) => patient.patientNumber || 0)) + 1,
        [allPatients]
    );
    const displayedPatientNumber = currentPatientNumber ?? nextPatientNumber;

    const toAgeFromDob = (dobText: string) => {
        const dob = new Date(dobText);
        if (Number.isNaN(dob.getTime())) return '';
        return String(Math.max(0, new Date().getFullYear() - dob.getFullYear()));
    };

    const toDobFromAge = (ageText: string) => {
        const age = Number(ageText);
        if (!Number.isFinite(age) || age <= 0) return undefined;
        const now = new Date();
        const year = now.getFullYear() - Math.floor(age);
        return `${year}-01-01`;
    };

    const handleSaveAndPrint = async () => {
        const fullName = showNewPatientForm
            ? `${newPatientFirstName.trim()} ${newPatientLastName.trim()}`.trim()
            : patientName.trim();
        const ageText = showNewPatientForm ? toAgeFromDob(newPatientDob) : patientAge.trim();
        const formValidation = doctorFormSchema.safeParse({
            nicNumber: nicNumber.trim(),
            patientName: fullName,
            patientAge: ageText,
            selectedDiseases,
        });
        const validationErrors: Record<string, string> = {};
        if (showNewPatientForm) {
            const newPatientValidation = newPatientFormSchema.safeParse({
                firstName: newPatientFirstName,
                lastName: newPatientLastName,
                dob: newPatientDob,
                phone: newPatientPhone,
                address: newPatientAddress,
                gender,
                bloodGroup: newPatientBloodGroup || undefined,
            });
            if (!newPatientValidation.success) {
                for (const issue of newPatientValidation.error.issues) {
                    const key = String(issue.path[0] ?? 'newPatient');
                    if (key === 'firstName') validationErrors.newPatientFirstName = issue.message;
                    if (key === 'lastName') validationErrors.newPatientLastName = issue.message;
                    if (key === 'dob') validationErrors.newPatientDob = issue.message;
                    if (key === 'phone') validationErrors.newPatientPhone = issue.message;
                    if (key === 'address') validationErrors.newPatientAddress = issue.message;
                }
            }
        }
        if (!formValidation.success) {
            for (const issue of formValidation.error.issues) {
                const key = String(issue.path[0] ?? 'form');
                validationErrors[key] = issue.message;
            }
        }
        if (rxRows.length > 0) {
            const invalidDrugRow = rxRows.find((row) => !rxRowSchema.safeParse(row).success);
            if (invalidDrugRow) {
                validationErrors.rxRows = 'Complete all fields for each added prescription row.';
            }
        }
        if (Object.keys(validationErrors).length > 0) {
            setFieldErrors((prev) => ({ ...prev, ...validationErrors }));
            setSaveError('Please fix highlighted fields.');
            setSaveSuccess(null);
            return;
        }
        setFieldErrors({});

        const payload = {
            full_name: fullName,
            nic: nicNumber.trim() || undefined,
            gender: (gender === 'Male' ? 'male' : gender === 'Female' ? 'female' : 'other') as 'male' | 'female' | 'other',
            dob: showNewPatientForm ? newPatientDob : toDobFromAge(patientAge),
            phone: showNewPatientForm ? newPatientPhone.trim() || undefined : undefined,
            address: showNewPatientForm ? newPatientAddress.trim() || undefined : doctorNotes.trim() || undefined,
            blood_group: showNewPatientForm ? newPatientBloodGroup || undefined : undefined,
        };

        setIsSaving(true);
        setSaveError(null);
        setSaveSuccess(null);
        try {
            try {
                await patientsApi.create(payload);
            } catch (error) {
                // NIC may already exist; try update existing patient by NIC from current page.
                if (
                    error instanceof ApiClientError &&
                    (error.status === 400 || error.status === 409) &&
                    payload.nic
                ) {
                    const listed = await patientsApi.list(1, 20);
                    const existing = listed.data.find(
                        (entry) => (entry.nic ?? '').toLowerCase() === payload.nic?.toLowerCase()
                    );
                    if (existing) {
                        await patientsApi.update(existing.id, payload);
                    } else {
                        throw error;
                    }
                } else {
                    throw error;
                }
            }

            setSaveSuccess('Patient record saved successfully.');
            if (typeof window !== 'undefined') {
                window.print();
            }
        } catch (error) {
            setSaveError(error instanceof Error ? error.message : 'Failed to save patient record.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <section id="doctor" className="flex w-full min-h-screen items-start justify-center overflow-x-hidden px-4 py-8 text-slate-900">
            <div className="w-full flex-1 overflow-x-hidden rounded-[28px] border border-white/70 bg-white/80 shadow-[0_18px_42px_rgba(28,63,99,0.12)] ring-1 ring-sky-50/80 backdrop-blur-xl">
                <div>
                    <div className="relative flex flex-1 flex-col px-6 pb-6 pt-6">
                        {loadError ? (
                            <div className="mb-4 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                                {loadError}
                            </div>
                        ) : null}
                        <div className="mx-auto flex w-full flex-1">
                            {/* Two-column layout: LEFT = detailed sheet, RIGHT = search/list */}
                            <div className="grid w-full grid-cols-12 gap-6">
                                {/* RIGHT: Search + standalone patient suggestion box */}
                                <div className="order-2 col-span-12 flex flex-col gap-4 lg:order-2 lg:col-span-3">
                                    <Card className="flex min-h-0 flex-col p-5">
                                        <SectionTitle title="Search Patients" sub="Name / NIC" />
                                        <div className="relative mt-4 rounded-2xl bg-slate-50/70 p-4 ring-1 ring-white/60">
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
                                                <div className="absolute left-0 right-0 top-full z-[120] mt-2 max-h-60 overflow-y-auto rounded-2xl bg-white p-2 shadow-xl ring-1 ring-slate-200">
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
                                                    <p className="mt-1 text-xl font-bold text-slate-900">{vital.value ?? 'N/A'}</p>
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
                                            {patientAllergies.length === 0 ? (
                                                <div className="rounded-2xl bg-white/90 px-4 py-3 text-sm font-semibold text-slate-500 ring-1 ring-white/70 shadow-[0_12px_28px_rgba(15,23,42,0.08)]">
                                                    No allergies for this patient.
                                                </div>
                                            ) : (
                                                patientAllergies.map((allergy, index) => (
                                                    <div
                                                        key={`${allergy.name}-${allergy.severity}-${index}`}
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
                                                ))
                                            )}
                                        </div>

                                    </Card>

                                    <div className="mt-2 flex justify-end">
                                        <button
                                            type="button"
                                            onClick={handleSaveAndPrint}
                                            disabled={isSaving}
                                            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[var(--ioc-blue)] px-8 py-4 text-sm font-bold uppercase tracking-wider text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-[#0070f0] hover:shadow-sky-500/30 active:translate-y-0 active:shadow-md disabled:opacity-60"
                                        >
                                            {isSaving ? 'Saving...' : 'Save & Print Record'}
                                        </button>
                                    </div>
                                    {saveError ? (
                                        <p className="mt-2 text-sm font-semibold text-rose-600">{saveError}</p>
                                    ) : null}
                                    {saveSuccess ? (
                                        <p className="mt-2 text-sm font-semibold text-emerald-700">{saveSuccess}</p>
                                    ) : null}

                                </div>

                                {/* LEFT: Full detailed sheet */}
                                <div className="order-1 col-span-12 flex flex-col gap-4 lg:order-1 lg:col-span-9">
                                    <div className="flex flex-col gap-6 rounded-[28px] border border-white/70 bg-white/80 p-6 shadow-[0_24px_60px_rgba(14,116,144,0.12)] ring-1 ring-sky-50/80 backdrop-blur-xl">
                                        {/* Patient quick info */}
                                        <div className="space-y-3">
                                            <div className="flex flex-wrap items-start gap-3">
                                                <div className="w-52">
                                                    <input
                                                        className={`w-full rounded-[999px] border bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:ring-2 ${fieldErrors.nicNumber
                                                            ? 'border-rose-400 focus:border-rose-400 focus:ring-rose-100'
                                                            : 'border-slate-200 focus:border-sky-400 focus:ring-sky-100'
                                                            }`}
                                                        placeholder="Enter NIC No"
                                                        value={nicNumber}
                                                        onChange={(event) => {
                                                            setCurrentPatientNumber(null);
                                                            const nextNic = event.target.value;
                                                            setNicNumber(nextNic);
                                                            setFieldErrors((prev) => {
                                                                const next = { ...prev };
                                                                const nicErrorMessage = getNicValidationError(nextNic);
                                                                if (!nicErrorMessage) {
                                                                    delete next.nicNumber;
                                                                } else {
                                                                    next.nicNumber = nicErrorMessage;
                                                                }
                                                                return next;
                                                            });
                                                        }}
                                                        onKeyDown={(event) => {
                                                            if (event.key === 'Enter') {
                                                                event.preventDefault();
                                                                void handleNicEnterLookup();
                                                            }
                                                        }}
                                                    />
                                                    <p className={`mt-1 min-h-4 text-xs font-semibold ${fieldErrors.nicNumber ? 'text-rose-600' : 'invisible'}`}>
                                                        {fieldErrors.nicNumber ?? 'placeholder'}
                                                    </p>
                                                    {nicLookupMessage ? (
                                                        <p className="mt-1 text-xs font-semibold text-amber-700">{nicLookupMessage}</p>
                                                    ) : null}
                                                </div>

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
                                                    <button
                                                        type="button"
                                                        onClick={() => setGender('Other')}
                                                        className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wider transition ${gender === 'Other'
                                                            ? 'bg-violet-600 text-white shadow-md'
                                                            : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-violet-50'
                                                            }`}
                                                    >
                                                        Other
                                                    </button>
                                                </div>

                                                <div className="flex-1" />
                                                <img src="/assets/brand-logo.png" alt="Brand Logo" className="h-10 w-auto object-contain opacity-90" />
                                            </div>

                                            {showNewPatientForm ? (
                                                <div className="grid grid-cols-1 gap-3 rounded-2xl border border-sky-100 bg-gradient-to-br from-sky-50/60 to-cyan-50/40 p-4 md:grid-cols-2">
                                                    <div>
                                                        <input
                                                            className={`w-full rounded-2xl border bg-white px-4 py-2.5 text-base font-medium text-slate-900 placeholder-slate-400 outline-none transition ${fieldErrors.newPatientFirstName ? 'border-rose-400' : 'border-slate-200 focus:border-sky-400'}`}
                                                            placeholder="First Name"
                                                            value={newPatientFirstName}
                                                            onChange={(e) => setNewPatientFirstName(e.target.value.replace(/[^A-Za-z ]/g, ''))}
                                                        />
                                                        {fieldErrors.newPatientFirstName ? <p className="mt-1 text-xs font-semibold text-rose-600">{fieldErrors.newPatientFirstName}</p> : null}
                                                    </div>
                                                    <div>
                                                        <input
                                                            className={`w-full rounded-2xl border bg-white px-4 py-2.5 text-base font-medium text-slate-900 placeholder-slate-400 outline-none transition ${fieldErrors.newPatientLastName ? 'border-rose-400' : 'border-slate-200 focus:border-cyan-400'}`}
                                                            placeholder="Last Name"
                                                            value={newPatientLastName}
                                                            onChange={(e) => setNewPatientLastName(e.target.value.replace(/[^A-Za-z ]/g, ''))}
                                                        />
                                                        {fieldErrors.newPatientLastName ? <p className="mt-1 text-xs font-semibold text-rose-600">{fieldErrors.newPatientLastName}</p> : null}
                                                    </div>
                                                    <div>
                                                        <input
                                                            type="date"
                                                            className={`w-full rounded-2xl border bg-white px-4 py-2.5 text-base font-medium text-slate-900 outline-none transition ${fieldErrors.newPatientDob ? 'border-rose-400' : 'border-slate-200 focus:border-violet-400'}`}
                                                            value={newPatientDob}
                                                            onChange={(e) => setNewPatientDob(e.target.value)}
                                                        />
                                                        {fieldErrors.newPatientDob ? <p className="mt-1 text-xs font-semibold text-rose-600">{fieldErrors.newPatientDob}</p> : null}
                                                    </div>
                                                    <div>
                                                        <input
                                                            className={`w-full rounded-2xl border bg-white px-4 py-2.5 text-base font-medium text-slate-900 placeholder-slate-400 outline-none transition ${fieldErrors.newPatientPhone ? 'border-rose-400' : 'border-slate-200 focus:border-teal-400'}`}
                                                            placeholder="Phone"
                                                            value={newPatientPhone}
                                                            onChange={(e) => setNewPatientPhone(e.target.value)}
                                                        />
                                                        {fieldErrors.newPatientPhone ? <p className="mt-1 text-xs font-semibold text-rose-600">{fieldErrors.newPatientPhone}</p> : null}
                                                    </div>
                                                    <div className="md:col-span-2">
                                                        <input
                                                            className={`w-full rounded-2xl border bg-white px-4 py-2.5 text-base font-medium text-slate-900 placeholder-slate-400 outline-none transition ${fieldErrors.newPatientAddress ? 'border-rose-400' : 'border-slate-200 focus:border-emerald-400'}`}
                                                            placeholder="Address"
                                                            value={newPatientAddress}
                                                            onChange={(e) => setNewPatientAddress(e.target.value)}
                                                        />
                                                        {fieldErrors.newPatientAddress ? <p className="mt-1 text-xs font-semibold text-rose-600">{fieldErrors.newPatientAddress}</p> : null}
                                                    </div>
                                                    <div>
                                                        <select
                                                            className={`w-full rounded-2xl border bg-white px-4 py-2.5 text-base font-medium outline-none transition focus:border-indigo-400 ${newPatientBloodGroup ? 'text-slate-900 border-slate-200' : 'text-slate-400 border-slate-200'}`}
                                                            value={newPatientBloodGroup}
                                                            onChange={(e) => setNewPatientBloodGroup(e.target.value)}
                                                        >
                                                            <option value="" disabled hidden>
                                                                Blood Group (Optional)
                                                            </option>
                                                            <option value="A+">A+</option>
                                                            <option value="A-">A-</option>
                                                            <option value="B+">B+</option>
                                                            <option value="B-">B-</option>
                                                            <option value="AB+">AB+</option>
                                                            <option value="AB-">AB-</option>
                                                            <option value="O+">O+</option>
                                                            <option value="O-">O-</option>
                                                        </select>
                                                    </div>
                                                    <div className="flex items-center text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                                                        Patient No: <span className="ml-2 text-slate-900">{displayedPatientNumber}</span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex items-start gap-4">
                                                <div className="flex-1">
                                                    <input
                                                        className={`w-full rounded-xl border bg-slate-50/50 px-4 py-2 text-base font-medium text-slate-900 placeholder-slate-300 outline-none ring-1 transition focus:bg-white focus:ring-2 ${fieldErrors.patientName
                                                            ? 'border-rose-400 ring-rose-200 focus:ring-rose-100'
                                                            : 'border-transparent ring-slate-200/50 focus:ring-sky-100'
                                                            }`}
                                                            placeholder="Patient Name"
                                                            value={patientName ?? ''}
                                                            onChange={(e) => {
                                                                setCurrentPatientNumber(null);
                                                                setPatientName(e.target.value.replace(/[^A-Za-z ]/g, '').replace(/\s{2,}/g, ' '));
                                                                setFieldErrors((prev) => {
                                                                    const next = { ...prev };
                                                                    delete next.patientName;
                                                                    return next;
                                                                });
                                                            }}
                                                        />
                                                        <p className={`mt-1 min-h-4 text-xs font-semibold ${fieldErrors.patientName ? 'text-rose-600' : 'invisible'}`}>
                                                            {fieldErrors.patientName ?? 'placeholder'}
                                                        </p>
                                                    </div>
                                                <div className="w-20">
                                                    <input
                                                        className={`w-full rounded-xl border bg-slate-50/50 px-3 py-2 text-center text-base font-medium text-slate-900 placeholder-slate-300 outline-none ring-1 transition focus:bg-white focus:ring-2 ${fieldErrors.patientAge
                                                            ? 'border-rose-400 ring-rose-200 focus:ring-rose-100'
                                                            : 'border-transparent ring-slate-200/50 focus:ring-sky-100'
                                                            }`}
                                                            placeholder="Age"
                                                            value={patientAge ?? ''}
                                                            onChange={(e) => {
                                                                setPatientAge(e.target.value.replace(/[^0-9]/g, '').slice(0, 3));
                                                                setFieldErrors((prev) => {
                                                                    const next = { ...prev };
                                                                    delete next.patientAge;
                                                                    return next;
                                                                });
                                                            }}
                                                        />
                                                        <p className={`mt-1 min-h-4 text-xs font-semibold ${fieldErrors.patientAge ? 'text-rose-600' : 'invisible'}`}>
                                                            {fieldErrors.patientAge ?? 'placeholder'}
                                                        </p>
                                                    </div>
                                                    <div className="pl-2 text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                                                        Patient No: <span className="text-slate-900">{displayedPatientNumber}</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="h-px w-full bg-slate-100" />

                                        {/* Disease Selection with ICD-10 Search */}
                                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                            <div className="space-y-2">
                                                <p className="ml-1 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Diagnosis (ICD-10)</p>
                                                <div className="relative">
                                                    <input
                                                        className={`w-full rounded-2xl border bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow-sm outline-none transition focus:ring-4 ${fieldErrors.selectedDiseases
                                                            ? 'border-rose-400 focus:border-rose-300 focus:ring-rose-50'
                                                            : 'border-slate-200 focus:border-sky-300 focus:ring-sky-50'
                                                            }`}
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
                                                {fieldErrors.selectedDiseases ? (
                                                    <p className="text-xs font-semibold text-rose-600">{fieldErrors.selectedDiseases}</p>
                                                ) : null}
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
                                            <div className="flex flex-col gap-3 rounded-xl bg-white p-3 shadow-sm ring-1 ring-slate-200 lg:flex-row lg:items-start">
                                                <div className="relative flex-1">
                                                    <label className="mb-1 block text-[10px] font-bold uppercase text-slate-400">Drug Name</label>
                                                    <input
                                                        className={`w-full rounded-xl border bg-slate-50 px-3 py-2 text-sm font-semibold outline-none focus:ring-2 ${fieldErrors.drug_name
                                                            ? 'border-rose-400 focus:border-rose-400 focus:ring-rose-100'
                                                            : 'border-slate-200 focus:border-sky-400 focus:ring-sky-100'
                                                            }`}
                                                        placeholder="e.g. Paracetamol"
                                                        value={clinicalDrugForm.name}
                                                        onChange={(e) => {
                                                            setClinicalDrugForm((prev) => ({ ...prev, name: e.target.value }));
                                                            setShowDrugSuggestions(true);
                                                            setFieldErrors((prev) => {
                                                                const next = { ...prev };
                                                                delete next.drug_name;
                                                                return next;
                                                            });
                                                        }}
                                                        onFocus={() => setShowDrugSuggestions(true)}
                                                        onBlur={() => {
                                                            window.setTimeout(() => {
                                                                setShowDrugSuggestions(false);
                                                            }, 100);
                                                        }}
                                                        onKeyDown={handleDrugFormKeyDown}
                                                    />
                                                    <p className={`mt-1 min-h-4 whitespace-nowrap text-xs font-semibold ${fieldErrors.drug_name ? 'text-rose-600' : 'invisible'}`}>
                                                        {fieldErrors.drug_name ?? 'placeholder'}
                                                    </p>
                                                    {/* Autocomplete for Drug Name */}
                                                    {showDrugSuggestions && clinicalDrugForm.name && filteredDrugSuggestions.length > 0 && (
                                                        <div className="absolute inset-x-0 top-full z-20 mt-2 overflow-hidden rounded-xl bg-white shadow-xl ring-1 ring-slate-200">
                                                            {filteredDrugSuggestions.map((s, index) => (
                                                                <button
                                                                    key={`${s}-${index}`}
                                                                    type="button"
                                                                    onMouseDown={(event) => event.preventDefault()}
                                                                    onClick={() => {
                                                                        setClinicalDrugForm((prev) => ({ ...prev, name: s }));
                                                                        setShowDrugSuggestions(false);
                                                                    }}
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
                                                    <div className={`flex rounded-xl border bg-slate-50 p-0.5 ${fieldErrors.drug_doseValue ? 'border-rose-400' : 'border-slate-200'}`}>
                                                        <input
                                                            className="w-full min-w-0 bg-transparent px-2 py-1.5 text-center text-sm font-semibold outline-none"
                                                            placeholder="500"
                                                            value={clinicalDrugForm.doseValue}
                                                            onChange={(e) => {
                                                                setClinicalDrugForm((prev) => ({ ...prev, doseValue: e.target.value.replace(/[^0-9.]/g, '') }));
                                                                setFieldErrors((prev) => {
                                                                    const next = { ...prev };
                                                                    delete next.drug_doseValue;
                                                                    return next;
                                                                });
                                                            }}
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
                                                    <p className={`mt-1 min-h-4 whitespace-nowrap text-xs font-semibold ${fieldErrors.drug_doseValue ? 'text-rose-600' : 'invisible'}`}>
                                                        {fieldErrors.drug_doseValue ?? 'placeholder'}
                                                    </p>
                                                </div>

                                                <div className="flex-[1.5]">
                                                    <label className="mb-1 block text-[10px] font-bold uppercase text-slate-400">Frequency</label>
                                                    <div className={`flex rounded-xl border bg-slate-50 p-0.5 ${fieldErrors.drug_termsValue ? 'border-rose-400' : 'border-slate-200'}`}>
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
                                                            onChange={(e) => {
                                                                setClinicalDrugForm((prev) => ({ ...prev, termsValue: e.target.value }));
                                                                setFieldErrors((prev) => {
                                                                    const next = { ...prev };
                                                                    delete next.drug_termsValue;
                                                                    return next;
                                                                });
                                                            }}
                                                            onKeyDown={handleDrugFormKeyDown}
                                                        />
                                                    </div>
                                                    <p className={`mt-1 min-h-4 whitespace-nowrap text-xs font-semibold ${fieldErrors.drug_termsValue ? 'text-rose-600' : 'invisible'}`}>
                                                        {fieldErrors.drug_termsValue ?? 'placeholder'}
                                                    </p>
                                                </div>

                                                <div className="w-20">
                                                    <label className="mb-1 block text-[10px] font-bold uppercase text-slate-400">Qty</label>
                                                    <input
                                                        className={`w-full rounded-xl border bg-slate-50 px-3 py-2 text-center text-sm font-semibold outline-none focus:ring-2 ${fieldErrors.drug_amount
                                                            ? 'border-rose-400 focus:border-rose-400 focus:ring-rose-100'
                                                            : 'border-slate-200 focus:border-sky-400 focus:ring-sky-100'
                                                            }`}
                                                        placeholder="12"
                                                        value={clinicalDrugForm.amount}
                                                        onChange={(e) =>
                                                            {
                                                                setClinicalDrugForm((prev) => ({ ...prev, amount: e.target.value.replace(/[^0-9.]/g, '') }));
                                                                setFieldErrors((prev) => {
                                                                    const next = { ...prev };
                                                                    delete next.drug_amount;
                                                                    return next;
                                                                });
                                                            }
                                                        }
                                                        onKeyDown={handleDrugFormKeyDown}
                                                    />
                                                    <p className={`mt-1 min-h-4 whitespace-nowrap text-xs font-semibold ${fieldErrors.drug_amount ? 'text-rose-600' : 'invisible'}`}>
                                                        {fieldErrors.drug_amount ?? 'placeholder'}
                                                    </p>
                                                </div>

                                                <div className="flex w-32 flex-col">
                                                    <span className="mb-1 block h-[14px]" />
                                                    <div className="flex items-center justify-end gap-2">
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
                                                    <span className="mt-1 block min-h-4" />
                                                </div>
                                            </div>

                                            {/* Rx List */}
                                            <div className="flex flex-col gap-2">
                                                {fieldErrors.rxRows ? (
                                                    <p className="text-xs font-semibold text-rose-600">{fieldErrors.rxRows}</p>
                                                ) : null}
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
                                                <p className="ml-1 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Doctor&apos;s Notes</p>
                                                <textarea
                                                    className="h-24 w-full resize-none rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-800 shadow-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-50"
                                                    placeholder="Add clinical notes here..."
                                                    value={doctorNotes}
                                                    onChange={(e) => setDoctorNotes(e.target.value)}
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
