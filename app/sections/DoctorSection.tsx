'use client';

import { useEffect, useMemo, useState } from 'react';
import {
    createEncounter,
    getCurrentUser,
    listAppointments,
    listPatientAllergies,
    listPatients,
    listPatientVitals,
    type ApiClientError,
} from '../lib/api-client';
import { usePatientProfilePopup } from '../hooks/usePatientProfilePopup';
import { DoctorSidebar } from './doctor/components/DoctorSidebar';
import { DoctorWorkspace } from './doctor/components/DoctorWorkspace';
import { useDoctorClinicalWorkflow } from './doctor/hooks/useDoctorClinicalWorkflow';
import { useVisitPlanner } from './doctor/hooks/useVisitPlanner';
import type { AllergyAlert, Patient, PatientGender, PatientVital } from './doctor/types';

type AnyRecord = Record<string, unknown>;

function asRecord(value: unknown): AnyRecord | null {
    return value && typeof value === 'object' ? (value as AnyRecord) : null;
}

function asArray(value: unknown): AnyRecord[] {
    if (Array.isArray(value)) {
        return value.map((entry) => asRecord(entry)).filter((entry): entry is AnyRecord => !!entry);
    }
    const record = asRecord(value);
    if (!record) return [];
    const candidates = [record.data, record.items, record.rows];
    for (const candidate of candidates) {
        if (Array.isArray(candidate)) {
            return candidate.map((entry) => asRecord(entry)).filter((entry): entry is AnyRecord => !!entry);
        }
    }
    return [];
}

function getString(value: unknown, fallback = '') {
    return typeof value === 'string' ? value : fallback;
}

function getNumber(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim() && !Number.isNaN(Number(value))) {
        return Number(value);
    }
    return null;
}

function getDateLabel(value: unknown) {
    const raw = getString(value);
    if (!raw) return '-';
    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) return raw;
    return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function normalizeGender(value: unknown): PatientGender {
    const text = getString(value).toLowerCase();
    return text === 'female' ? 'Female' : 'Male';
}

function toEncounterDate(value: string) {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
        return parsed.toISOString().slice(0, 10);
    }
    return new Date().toISOString().slice(0, 10);
}

function normalizePatients(rawPatients: unknown, rawAppointments: unknown): Patient[] {
    const patientRows = asArray(rawPatients);
    const appointmentRows = asArray(rawAppointments);

    const patientById = new Map<number, AnyRecord>();
    patientRows.forEach((row) => {
        const id = getNumber(row.id ?? row.patientId ?? row.patient_id);
        if (id !== null) patientById.set(id, row);
    });

    const fromAppointments = appointmentRows.map((row, index) => {
        const nestedPatient = asRecord(row.patient) ?? asRecord(row.patientDetails) ?? null;
        const appointmentId = getNumber(row.id ?? row.appointmentId ?? row.appointment_id) ?? undefined;
        const patientId =
            getNumber(row.patientId ?? row.patient_id ?? nestedPatient?.id) ?? undefined;
        const doctorId =
            getNumber(row.doctorId ?? row.doctor_id ?? asRecord(row.doctor)?.id) ?? undefined;
        const patientRow = patientId ? patientById.get(patientId) : null;

        const name = getString(
            nestedPatient?.name ??
            nestedPatient?.fullName ??
            row.patientName ??
            row.patient_name ??
            patientRow?.name ??
            patientRow?.fullName,
            `Patient ${patientId ?? index + 1}`
        );

        const nic = getString(
            nestedPatient?.nic ??
            row.nic ??
            row.patientNic ??
            row.patient_nic ??
            patientRow?.nic,
            'N/A'
        );

        const age = getNumber(
            nestedPatient?.age ??
            row.age ??
            row.patientAge ??
            row.patient_age ??
            patientRow?.age
        ) ?? 0;

        const gender = normalizeGender(
            nestedPatient?.gender ??
            row.gender ??
            row.patientGender ??
            row.patient_gender ??
            patientRow?.gender
        );

        const reason = getString(
            row.reason ?? row.chiefComplaint ?? row.notes,
            'Consultation'
        );

        const time = getDateLabel(row.scheduledAt ?? row.scheduled_at ?? row.createdAt ?? row.created_at);

        return {
            patientId,
            appointmentId,
            doctorId,
            name,
            nic,
            time,
            reason,
            age,
            gender,
            profileId: patientId ? String(patientId) : undefined,
        } satisfies Patient;
    });

    if (fromAppointments.length) return fromAppointments;

    return patientRows.map((row, index) => {
        const id = getNumber(row.id ?? row.patientId ?? row.patient_id);
        const name = getString(row.name ?? row.fullName, `Patient ${index + 1}`);
        const nic = getString(row.nic, 'N/A');
        const age = getNumber(row.age) ?? 0;
        const gender = normalizeGender(row.gender);
        return {
            patientId: id ?? undefined,
            name,
            nic,
            time: '-',
            reason: 'General visit',
            age,
            gender,
            profileId: id ? String(id) : undefined,
        } satisfies Patient;
    });
}

function normalizeVitals(raw: unknown): PatientVital[] {
    const rows = asArray(raw);
    if (!rows.length) return [];
    return rows.map((row, index) => {
        const label = getString(row.label ?? row.name ?? row.vitalName ?? row.type, `Vital ${index + 1}`);
        const value = getString(row.value ?? row.reading ?? row.result, '--');
        return { label, value };
    });
}

function normalizeAllergies(raw: unknown): AllergyAlert[] {
    const rows = asArray(raw);
    if (!rows.length) return [];
    return rows.map((row, index) => {
        const name = getString(row.name ?? row.allergyName ?? row.allergen, `Allergy ${index + 1}`);
        const severity = getString(row.severity, 'Medium');
        const level = severity.toLowerCase();
        if (level === 'high' || level === 'critical') {
            return {
                name,
                severity: 'High',
                dot: 'bg-rose-400',
                pill: 'bg-rose-50 text-rose-700 ring-rose-100',
            };
        }
        if (level === 'low') {
            return {
                name,
                severity: 'Low',
                dot: 'bg-emerald-400',
                pill: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
            };
        }
        return {
            name,
            severity: 'Medium',
            dot: 'bg-amber-400',
            pill: 'bg-amber-50 text-amber-700 ring-amber-100',
        };
    });
}

export default function DoctorSection() {
    const [search, setSearch] = useState('');
    const [patientName, setPatientName] = useState('');
    const [patientAge, setPatientAge] = useState('');
    const [nicNumber, setNicNumber] = useState('');
    const [gender, setGender] = useState<PatientGender>('Male');
    const [rawPatients, setRawPatients] = useState<unknown>([]);
    const [rawWaitingAppointments, setRawWaitingAppointments] = useState<unknown>([]);
    const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
    const [selectedAppointmentId, setSelectedAppointmentId] = useState<number | null>(null);
    const [selectedDoctorId, setSelectedDoctorId] = useState<number | null>(null);
    const [currentUserId, setCurrentUserId] = useState<number | null>(null);
    const [patientVitals, setPatientVitals] = useState<PatientVital[]>([]);
    const [patientAllergies, setPatientAllergies] = useState<AllergyAlert[]>([]);
    const [saveFeedback, setSaveFeedback] = useState<{ tone: 'info' | 'success' | 'error'; message: string } | null>(null);

    const clinicalWorkflow = useDoctorClinicalWorkflow();
    const visitPlanner = useVisitPlanner();
    const popup = usePatientProfilePopup();

    const patients = useMemo(() => normalizePatients(rawPatients, rawWaitingAppointments), [rawPatients, rawWaitingAppointments]);

    const searchMatches = useMemo(() => {
        const query = search.trim().toLowerCase();
        if (!query) return [];
        return patients.filter((patient) => patient.name.toLowerCase().includes(query) || patient.nic.toLowerCase().includes(query));
    }, [search, patients]);

    const loadDoctorData = async () => {
        const [patientsResponse, waitingResponse, user] = await Promise.all([
            listPatients(),
            listAppointments({ status: 'waiting' }),
            getCurrentUser(),
        ]);
        setRawPatients(patientsResponse);
        setRawWaitingAppointments(waitingResponse);
        setCurrentUserId(user?.id ?? null);
    };

    useEffect(() => {
        let active = true;
        const load = async () => {
            try {
                await loadDoctorData();
            } catch (error) {
                if (!active) return;
                const message = (error as ApiClientError)?.message ?? 'Unable to load doctor queue.';
                setSaveFeedback({ tone: 'error', message });
            }
        };
        load();
        return () => {
            active = false;
        };
    }, []);

    useEffect(() => {
        if (!selectedPatientId) return;

        let active = true;
        const loadPatientDetails = async () => {
            try {
                const [vitalsResponse, allergiesResponse] = await Promise.all([
                    listPatientVitals(selectedPatientId),
                    listPatientAllergies(selectedPatientId),
                ]);
                if (!active) return;
                setPatientVitals(normalizeVitals(vitalsResponse));
                setPatientAllergies(normalizeAllergies(allergiesResponse));
            } catch {
                if (!active) return;
                setPatientVitals([]);
                setPatientAllergies([]);
            }
        };

        loadPatientDetails();
        return () => {
            active = false;
        };
    }, [selectedPatientId]);

    const displayedVitals = selectedPatientId ? patientVitals : [];
    const displayedAllergies = selectedPatientId ? patientAllergies : [];

    const handleSearchSelect = (patient: Patient) => {
        setPatientName(patient.name);
        setPatientAge(patient.age ? String(patient.age) : '');
        setNicNumber(patient.nic);
        setGender(patient.gender === 'Female' ? 'Female' : 'Male');
        setSelectedPatientId(patient.patientId ?? null);
        setSelectedAppointmentId(patient.appointmentId ?? null);
        setSelectedDoctorId(patient.doctorId ?? null);
        if (patient.profileId) {
            popup.openProfile(patient.profileId);
        }
        setSearch('');
    };

    const handleSaveRecord = async () => {
        if (!selectedPatientId || !selectedAppointmentId) {
            setSaveFeedback({ tone: 'info', message: 'Select a waiting appointment before saving encounter.' });
            return;
        }

        const doctorId = selectedDoctorId ?? currentUserId;
        if (!doctorId) {
            setSaveFeedback({ tone: 'error', message: 'Doctor identity missing in token/appointment context.' });
            return;
        }

        try {
            setSaveFeedback({ tone: 'info', message: 'Submitting encounter...' });
            await createEncounter({
                appointmentId: selectedAppointmentId,
                patientId: selectedPatientId,
                doctorId,
                checkedAt: new Date().toISOString(),
                notes: clinicalWorkflow.selectedDiseases.join(', ') || 'Clinical note recorded from doctor panel.',
                nextVisitDate: toEncounterDate(visitPlanner.nextVisitDate),
                diagnoses: clinicalWorkflow.selectedDiseases.map((diagnosisName) => ({
                    diagnosisName,
                    icd10Code: '',
                })),
                tests: clinicalWorkflow.selectedTests.map((testName) => ({
                    testName,
                    status: 'ordered',
                })),
                prescription: {
                    items: clinicalWorkflow.rxRows
                        .map((row) => ({
                            drugName: row.drug,
                            dose: row.dose,
                            frequency: row.terms,
                            duration: 'As prescribed',
                            quantity: getNumber(row.amount) ?? 0,
                            source: (row.source.toLowerCase() === 'outside' ? 'outside' : 'clinical') as 'outside' | 'clinical',
                        }))
                        .filter((row) => row.quantity > 0),
                },
            });
            setSaveFeedback({ tone: 'success', message: 'Encounter saved to backend.' });
            await loadDoctorData();
        } catch (error) {
            const message = (error as ApiClientError)?.message ?? 'Failed to save encounter.';
            setSaveFeedback({ tone: 'error', message });
        }
    };

    return (
        <section id="doctor" className="flex min-h-screen items-start justify-center px-4 py-8 text-slate-900">
            <div className="w-full flex-1 overflow-hidden rounded-[28px] border border-white/70 bg-white/80 shadow-[0_18px_42px_rgba(28,63,99,0.12)] ring-1 ring-sky-50/80 backdrop-blur-xl">
                <div className="relative flex flex-1 flex-col px-6 pb-20 pt-6 lg:px-10">
                    <div className="mx-auto flex w-full flex-1">
                        <div className="grid w-full grid-cols-12 gap-6">
                            <DoctorSidebar
                                search={search}
                                onSearchChange={setSearch}
                                searchMatches={searchMatches}
                                onSearchSelect={handleSearchSelect}
                                patientVitals={displayedVitals}
                                patientAllergies={displayedAllergies}
                                onSaveRecord={handleSaveRecord}
                                saveFeedback={saveFeedback}
                            />
                            <DoctorWorkspace
                                profileId={popup.selectedProfileId || ''}
                                onCloseProfile={popup.closeProfile}
                                nicNumber={nicNumber}
                                onNicNumberChange={setNicNumber}
                                gender={gender}
                                onGenderChange={setGender}
                                patientName={patientName}
                                onPatientNameChange={setPatientName}
                                patientAge={patientAge}
                                onPatientAgeChange={setPatientAge}
                                clinicalWorkflow={clinicalWorkflow}
                                visitPlanner={visitPlanner}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
