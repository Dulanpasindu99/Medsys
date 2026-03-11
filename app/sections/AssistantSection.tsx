'use client';

import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import { getProfileIdByNicOrName } from '../data/patientProfiles';
import { appointmentsApi, patientsApi, usersApi } from '@/app/lib/api-client';

const SHADOWS = {
    card: 'shadow-[0_18px_42px_rgba(28,63,99,0.08)]',
};

const Panel = ({ children }: { children: React.ReactNode }) => (
    <div className={`rounded-3xl border border-slate-100 bg-white/90 p-5 backdrop-blur ${SHADOWS.card}`}>
        {children}
    </div>
);

interface Prescription {
    id: string;
    patient: string;
    nic: string;
    age: number;
    gender: 'Male' | 'Female';
    diagnosis: string;
    clinical: { name: string; dose: string; terms: string; amount: number }[];
    outside: { name: string; dose: string; terms: string; amount: number }[];
    allergies: string[];
}

type CompletedPatient = {
    name: string;
    age: number;
    nic: string;
    time: string;
    profileId?: string;
};

export default function AssistantSection() {
    const [pendingPatients, setPendingPatients] = useState<Prescription[]>([]);

    const [activeIndex, setActiveIndex] = useState(0);
    const activePrescription = pendingPatients[activeIndex];

    const [formState, setFormState] = useState({
        nic: '',
        name: '',
        mobile: '',
        age: '',
        allergyInput: '',
        allergies: ['No allergies'],
        bloodGroup: 'O+',
        priority: 'Normal' as 'Normal' | 'Urgent' | 'Critical',
        regularDrug: '',
    });

    const [completedSearch, setCompletedSearch] = useState('');

    const [stats, setStats] = useState({ total: 0, male: 0, female: 0, existing: 0, new: 0 });
    const [loadError, setLoadError] = useState<string | null>(null);

    const [availableDoctors, setAvailableDoctors] = useState<{ name: string; status: string }[]>([]);

    const [completed, setCompleted] = useState<CompletedPatient[]>([]);

    useEffect(() => {
        let mounted = true;
        const loadAssistantData = async () => {
            try {
                setLoadError(null);
                const [patientsResponse, waitingResponse, completedResponse, usersResponse] = await Promise.all([
                    patientsApi.list(1, 500),
                    appointmentsApi.list(1, 500, 'waiting'),
                    appointmentsApi.list(1, 500, 'completed'),
                    usersApi.list(1, 200),
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

                const pending = waitingResponse.data
                    .map((appointment) => {
                        const patient = patientById.get(String(appointment.patient_id));
                        if (!patient) return null;
                        return {
                            id: `AP-${appointment.id}`,
                            patient: patient.full_name,
                            nic: patient.nic ?? 'N/A',
                            age: toAge(patient.dob),
                            gender: patient.gender === 'female' ? 'Female' : 'Male',
                            diagnosis: appointment.reason ?? 'Awaiting doctor',
                            clinical: [],
                            outside: [],
                            allergies: (patient.allergies ?? []).map((a) => a.allergy_name),
                        } as Prescription;
                    })
                    .filter((entry): entry is Prescription => Boolean(entry));

                const done = completedResponse.data
                    .map((appointment) => {
                        const patient = patientById.get(String(appointment.patient_id));
                        if (!patient) return null;
                        return {
                            name: patient.full_name,
                            age: toAge(patient.dob),
                            nic: patient.nic ?? 'N/A',
                            time: new Date(appointment.scheduled_at).toLocaleTimeString('en-US', {
                                hour: 'numeric',
                                minute: '2-digit',
                            }),
                            profileId: patient.nic
                                ? getProfileIdByNicOrName(patient.nic, patient.full_name)
                                : undefined,
                        } as CompletedPatient;
                    })
                    .filter((entry): entry is CompletedPatient => Boolean(entry));

                const male = patientsResponse.data.filter((patient) => patient.gender === 'male').length;
                const female = patientsResponse.data.filter((patient) => patient.gender === 'female').length;

                if (!mounted) return;
                setPendingPatients(pending);
                setCompleted(done);
                setAvailableDoctors(
                    usersResponse.data
                        .filter((user) => user.role === 'doctor')
                        .map((user) => ({
                            name: user.full_name,
                            status: user.is_active ? 'Online' : 'Offline',
                        }))
                );
                setStats({
                    total: patientsResponse.data.length,
                    male,
                    female,
                    existing: Math.max(0, patientsResponse.data.length - waitingResponse.data.length),
                    new: waitingResponse.data.length,
                });
            } catch (error) {
                if (mounted) {
                    setLoadError(error instanceof Error ? error.message : 'Failed to load assistant data');
                }
            }
        };

        void loadAssistantData();

        return () => {
            mounted = false;
        };
    }, []);

    const filteredCompleted = completed.filter((entry) =>
        `${entry.name} ${entry.nic}`.toLowerCase().includes(completedSearch.toLowerCase())
    );

    const addPatient = () => {
        if (!formState.nic || !formState.name || !formState.age) return;
        const next: Prescription = {
            id: `MH${(pendingPatients.length + 1).toString().padStart(4, '0')}`,
            patient: formState.name,
            nic: formState.nic,
            age: Number(formState.age),
            gender: 'Male',
            diagnosis: 'Awaiting doctor',
            clinical: [],
            outside: [],
            allergies: formState.allergies,
        };
        setPendingPatients((prev) => [...prev, next]);
        setFormState((prev) => ({
            ...prev,
            nic: '',
            name: '',
            mobile: '',
            age: '',
            allergyInput: '',
            allergies: ['No allergies'],
            regularDrug: '',
            priority: 'Normal',
        }));
    };

    const addAllergy = () => {
        const entry = formState.allergyInput.trim();
        if (!entry) return;
        setFormState((prev) => ({
            ...prev,
            allergies: Array.from(new Set([...prev.allergies.filter((v) => v !== 'No allergies'), entry])),
            allergyInput: '',
        }));
    };

    const markDoneAndNext = () => {
        if (!pendingPatients.length) return;
        const nextIndex = (activeIndex + 1) % pendingPatients.length;
        setActiveIndex(nextIndex);
    };

    return (
        <section id="assistant" className="relative isolate flex min-h-screen items-start justify-center px-4 py-8 text-slate-900">
            <div className="flex w-full flex-col gap-6 lg:flex-row lg:items-start">
                <div className="ios-surface w-full flex-1 overflow-hidden rounded-[30px] ring-1 ring-slate-100/80">
                    <div>
                        <div className="relative flex flex-1 flex-col px-6 py-8 lg:px-10">
                            <div className="mx-auto flex w-full flex-col gap-6">
                                <div className="flex-1 space-y-6">
                                    {loadError ? (
                                        <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                                            {loadError}
                                        </div>
                                    ) : null}
                                    <header className="flex flex-col gap-3 rounded-[22px] border border-white/80 bg-white/70 px-4 py-3 shadow-[0_12px_28px_rgba(15,23,42,0.12)] backdrop-blur-xl lg:flex-row lg:items-center lg:justify-between">
                                        <div className="flex items-center gap-3">
                                            <span className="h-2 w-2 rounded-full bg-slate-400" aria-hidden="true" />
                                            <h1 className="text-xl font-semibold text-slate-900">Assistant Panel</h1>
                                        </div>
                                        <div className="grid flex-1 grid-cols-5 gap-2 text-center text-[11px] font-semibold text-slate-700 lg:max-w-[560px]">
                                            <div className="ios-surface px-2 py-1.5 shadow-sm">
                                                <p className="text-[10px] uppercase tracking-wide text-slate-400">Total</p>
                                                <p className="text-base font-bold text-slate-900">{stats.total}</p>
                                            </div>
                                            <div className="ios-surface px-2 py-1.5 shadow-sm">
                                                <p className="text-[10px] uppercase tracking-wide text-slate-400">Male</p>
                                                <p className="text-base font-bold text-slate-900">{stats.male}</p>
                                            </div>
                                            <div className="ios-surface px-2 py-1.5 shadow-sm">
                                                <p className="text-[10px] uppercase tracking-wide text-slate-400">Female</p>
                                                <p className="text-base font-bold text-slate-900">{stats.female}</p>
                                            </div>
                                            <div className="ios-surface px-2 py-1.5 shadow-sm">
                                                <p className="text-[10px] uppercase tracking-wide text-slate-400">Existing</p>
                                                <p className="text-base font-bold text-slate-900">{stats.existing}</p>
                                            </div>
                                            <div className="ios-surface px-2 py-1.5 shadow-sm">
                                                <p className="text-[10px] uppercase tracking-wide text-slate-400">New</p>
                                                <p className="text-base font-bold text-slate-900">{stats.new}</p>
                                            </div>
                                        </div>
                                    </header>

                                    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_2.2fr_1fr]">
                                        <Panel>
                                            <div className="mb-4 flex items-center justify-between">
                                                <h2 className="text-lg font-semibold text-slate-900">Add Patient to System</h2>
                                                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase text-slate-600">
                                                    Pre-registration
                                                </span>
                                            </div>
                                            <div className="space-y-3 text-sm text-slate-800">
                                                <div className="grid grid-cols-2 gap-3">
                                                    <input
                                                        className="rounded-2xl border border-slate-200 px-4 py-3 shadow-inner"
                                                        placeholder="Enter Patient NIC"
                                                        value={formState.nic}
                                                        onChange={(e) => setFormState((p) => ({ ...p, nic: e.target.value }))}
                                                    />
                                                    <input
                                                        className="rounded-2xl border border-slate-200 px-4 py-3 shadow-inner"
                                                        placeholder="Patient Name"
                                                        value={formState.name}
                                                        onChange={(e) => setFormState((p) => ({ ...p, name: e.target.value }))}
                                                    />
                                                    <input
                                                        className="rounded-2xl border border-slate-200 px-4 py-3 shadow-inner"
                                                        placeholder="Mobile Number"
                                                        value={formState.mobile}
                                                        onChange={(e) => setFormState((p) => ({ ...p, mobile: e.target.value }))}
                                                    />
                                                    <input
                                                        className="rounded-2xl border border-slate-200 px-4 py-3 shadow-inner"
                                                        placeholder="Age"
                                                        value={formState.age}
                                                        onChange={(e) => setFormState((p) => ({ ...p, age: e.target.value.replace(/[^0-9]/g, '') }))}
                                                    />
                                                </div>

                                                <div className="flex flex-wrap items-center gap-2">
                                                    {formState.allergies.map((allergy) => (
                                                        <span
                                                            key={allergy}
                                                            className="flex items-center gap-2 rounded-full bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-700 ring-1 ring-rose-100"
                                                        >
                                                            {allergy}
                                                            <button
                                                                type="button"
                                                                className="rounded-full bg-white px-2 text-rose-600 ring-1 ring-rose-100"
                                                                onClick={() =>
                                                                    setFormState((prev) => ({
                                                                        ...prev,
                                                                        allergies: prev.allergies.filter((entry) => entry !== allergy),
                                                                    }))
                                                                }
                                                            >
                                                                ×
                                                            </button>
                                                        </span>
                                                    ))}
                                                    <div className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2">
                                                        <input
                                                            className="bg-transparent text-xs outline-none"
                                                            placeholder="Add allergies"
                                                            value={formState.allergyInput}
                                                            onChange={(e) => setFormState((p) => ({ ...p, allergyInput: e.target.value }))}
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') {
                                                                    e.preventDefault();
                                                                    addAllergy();
                                                                }
                                                            }}
                                                        />
                                                        <button
                                                            type="button"
                                                            className="rounded-full bg-emerald-500 px-3 py-1 text-[11px] font-semibold text-white shadow-[0_10px_22px_rgba(16,185,129,0.22)] transition hover:bg-emerald-600"
                                                            onClick={addAllergy}
                                                        >
                                                            Add
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="flex flex-wrap items-center gap-3 text-xs font-semibold">
                                                    <div className="flex items-center gap-2 rounded-full bg-white px-3 py-2 shadow-sm ring-1 ring-slate-200">
                                                        Blood Group
                                                        {['A+', 'A-', 'B+', 'O+', 'AB+'].map((group) => (
                                                            <button
                                                                key={group}
                                                                type="button"
                                                                className={`rounded-full px-3 py-1 text-sm font-semibold ${formState.bloodGroup === group
                                                                    ? 'bg-slate-700 text-white shadow-[0_10px_22px_rgba(71,85,105,0.22)]'
                                                                    : 'bg-slate-100 text-slate-700'
                                                                    }`}
                                                                onClick={() => setFormState((p) => ({ ...p, bloodGroup: group }))}
                                                            >
                                                                {group}
                                                            </button>
                                                        ))}
                                                    </div>

                                                    <div className="flex items-center gap-2 rounded-full bg-white px-3 py-2 shadow-sm ring-1 ring-slate-200">
                                                        Priority Level
                                                        {['Normal', 'Urgent', 'Critical'].map((level) => (
                                                            <button
                                                                key={level}
                                                                type="button"
                                                                className={`rounded-full px-3 py-1 ${formState.priority === level ? 'bg-amber-500 text-white' : 'bg-amber-50 text-amber-700'
                                                                    }`}
                                                                onClick={() => setFormState((p) => ({ ...p, priority: level as typeof p.priority }))}
                                                            >
                                                                {level}
                                                            </button>
                                                        ))}
                                                    </div>

                                                    <div className="flex items-center gap-2 rounded-full bg-white px-3 py-2 shadow-sm ring-1 ring-slate-200">
                                                        Add regular Drugs
                                                        <input
                                                            className="w-32 rounded-full bg-slate-100 px-3 py-1 text-xs outline-none"
                                                            placeholder="eg: Aspirin"
                                                            value={formState.regularDrug}
                                                            onChange={(e) => setFormState((p) => ({ ...p, regularDrug: e.target.value }))}
                                                        />
                                                        <button
                                                            type="button"
                                                            className="rounded-full bg-[var(--ioc-blue)] px-3 py-1 text-xs font-semibold text-white shadow-[0_6px_14px_rgba(10,132,255,0.35)] transition hover:bg-[#0070f0]"
                                                        >
                                                            Done
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="flex justify-end">
                                                    <button
                                                        type="button"
                                                        onClick={addPatient}
                                                        className="rounded-2xl bg-[var(--ioc-blue)] px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(10,132,255,0.35)] transition hover:bg-[#0070f0]"
                                                    >
                                                        Confirm
                                                    </button>
                                                </div>
                                            </div>
                                        </Panel>

                                        <Panel>
                                            <div className="mb-4 flex items-center justify-between">
                                                <h2 className="text-lg font-semibold text-slate-900">Doctor Checked Patient</h2>
                                                <div className="flex items-center gap-2 text-xs text-slate-600">
                                                    <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold">03</span>
                                                    <span className="rounded-full bg-slate-200 px-3 py-1 font-semibold text-slate-700 shadow-[0_8px_18px_rgba(148,163,184,0.28)]">Patient</span>
                                                </div>
                                            </div>
                                            {activePrescription ? (
                                                <div className="space-y-4 text-sm text-slate-800">
                                                    <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 shadow-inner">
                                                        <div className="flex items-center justify-between text-xs text-slate-600">
                                                            <div className="flex items-center gap-3">
                                                                <span className="rounded-full bg-slate-200 px-3 py-1 text-slate-700">Patient No</span>
                                                                <span className="rounded-full bg-slate-200 px-3 py-1 text-slate-700">{activePrescription.id}</span>
                                                            </div>
                                                            <span className="rounded-full bg-lime-100 px-3 py-1 font-semibold text-lime-700">Bill paid</span>
                                                        </div>
                                                        <div className="mt-3 grid grid-cols-2 gap-3">
                                                            <div>
                                                                <p className="text-[13px] font-semibold text-slate-500">Patient Name</p>
                                                                <p className="text-lg font-semibold text-slate-900">{activePrescription.patient}</p>
                                                                <p className="text-xs text-slate-500">NIC {activePrescription.nic}</p>
                                                            </div>
                                                            <div className="flex items-end justify-end gap-3 text-sm font-semibold text-slate-700">
                                                                <span className="rounded-full bg-slate-200 px-4 py-2 text-slate-700">Age {activePrescription.age}</span>
                                                                <span className={`rounded-full px-4 py-2 ${activePrescription.gender === 'Female'
                                                                    ? 'bg-rose-600 text-white'
                                                                    : 'bg-slate-100 text-slate-800'
                                                                    }`}>
                                                                    {activePrescription.gender}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs font-semibold">
                                                            <span className="rounded-full bg-slate-200 px-3 py-2 text-slate-700">Disease</span>
                                                            <span className="rounded-full bg-slate-200 px-3 py-2 text-slate-700">{activePrescription.diagnosis}</span>
                                                        </div>
                                                        <div className="mt-3 flex flex-wrap items-center gap-2">
                                                            <span className="rounded-full bg-slate-200 px-3 py-2 text-xs font-semibold text-slate-700">Allergies</span>
                                                            {activePrescription.allergies.map((allergy) => (
                                                                <span key={allergy} className="rounded-full bg-rose-100 px-3 py-2 text-xs font-semibold text-rose-700">
                                                                    {allergy}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-3 text-xs font-semibold text-slate-600">
                                                        <div className="space-y-2 rounded-2xl border border-slate-100 bg-white p-3 shadow-inner">
                                                            <div className="flex items-center justify-between">
                                                                <span className="rounded-full bg-slate-200 px-3 py-1 text-slate-700">Clinical Drugs</span>
                                                                <span className="rounded-full bg-lime-100 px-3 py-1 text-lime-700">Given</span>
                                                            </div>
                                                            <div className="space-y-2">
                                                                {activePrescription.clinical.map((drug) => (
                                                                    <div key={drug.name} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                                                                        <div>
                                                                            <p className="text-slate-900">{drug.name}</p>
                                                                            <p className="text-[11px] text-slate-500">{drug.dose} · {drug.terms}</p>
                                                                        </div>
                                                                        <span className="rounded-full bg-slate-200 px-3 py-1 text-slate-700">{drug.amount}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                        <div className="space-y-2 rounded-2xl border border-slate-100 bg-white p-3 shadow-inner">
                                                            <div className="flex items-center justify-between">
                                                                <span className="rounded-full bg-slate-200 px-3 py-1 text-slate-700">Outside Drugs</span>
                                                                <span className="rounded-full bg-orange-100 px-3 py-1 text-orange-700">Pending</span>
                                                            </div>
                                                            <div className="space-y-2">
                                                                {activePrescription.outside.map((drug) => (
                                                                    <div key={drug.name} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                                                                        <div>
                                                                            <p className="text-slate-900">{drug.name}</p>
                                                                            <p className="text-[11px] text-slate-500">{drug.dose} · {drug.terms}</p>
                                                                        </div>
                                                                        <span className="rounded-full bg-slate-200 px-3 py-1 text-slate-700">{drug.amount}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="rounded-2xl border border-slate-100 bg-white/90 p-4 shadow-inner">
                                                        <div className="mb-3 flex items-center justify-between text-xs font-semibold text-slate-600">
                                                            <span className="rounded-full bg-slate-200 px-3 py-2 text-slate-700">Follow-up Summary</span>
                                                            <span className="rounded-full bg-slate-100 px-3 py-2 text-slate-700">Reviewed with patient</span>
                                                        </div>

                                                        <div className="grid grid-cols-1 gap-3 text-sm text-slate-700 sm:grid-cols-3">
                                                            <div className="flex flex-col gap-2 rounded-xl bg-slate-50 p-3 ring-1 ring-slate-100">
                                                                <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                                                                    <span className="rounded-full bg-slate-200 px-3 py-2 text-slate-700">Medical Tests</span>
                                                                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-700">Clear</span>
                                                                </div>
                                                                <p className="leading-relaxed">No tests were requested during this visit.</p>
                                                            </div>

                                                            <div className="flex flex-col gap-2 rounded-xl bg-slate-50 p-3 ring-1 ring-slate-100">
                                                                <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                                                                    <span className="rounded-full bg-slate-200 px-3 py-2 text-slate-700">Notes</span>
                                                                    <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-700">None</span>
                                                                </div>
                                                                <p className="leading-relaxed">No additional notes were recorded by the doctor.</p>
                                                            </div>

                                                            <div className="flex flex-col gap-2 rounded-xl bg-slate-200 p-3 text-slate-700 ring-1 ring-slate-300 shadow-[0_16px_32px_rgba(148,163,184,0.22)]">
                                                                <div className="flex items-center justify-between text-xs font-semibold">
                                                                    <span className="rounded-full bg-white/60 px-3 py-2">Next Visit</span>
                                                                    <span className="rounded-full bg-white/60 px-3 py-1">Confirmed</span>
                                                                </div>
                                                                <div className="flex items-end gap-2">
                                                                    <div className="text-4xl font-bold leading-none">05</div>
                                                                    <div className="leading-tight">
                                                                        <div className="text-sm font-semibold">November</div>
                                                                        <div className="text-xs font-medium text-slate-500">2025</div>
                                                                    </div>
                                                                </div>
                                                                <p className="text-xs text-slate-600">Please confirm the appointment with the patient before discharge.</p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                                                            <span className="rounded-full bg-[var(--ioc-blue)] px-3 py-2 text-white shadow-[0_6px_14px_rgba(10,132,255,0.35)]">
                                                                Download
                                                            </span>
                                                            <span className="rounded-full bg-slate-100 px-3 py-2 text-slate-400 line-through">Medical report locked</span>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            className="rounded-2xl bg-[var(--ioc-blue)] px-6 py-3 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(10,132,255,0.4)] transition hover:-translate-y-0.5 hover:bg-[#0070f0]"
                                                            onClick={markDoneAndNext}
                                                        >
                                                            Done & Next
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <p className="text-sm text-slate-500">No prescriptions waiting for pickup.</p>
                                            )}
                                        </Panel>

                                        <Panel>
                                            <div className="flex items-center justify-between">
                                                <h2 className="text-lg font-semibold text-slate-900">Available Doctors Today</h2>
                                                <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">Live</div>
                                            </div>
                                            <div className="mt-3 flex flex-wrap gap-2">
                                                {availableDoctors.map((doc, index) => (
                                                    <span
                                                        key={`${doc.name}-${doc.status}-${index}`}
                                                        className={`rounded-full px-4 py-2 text-xs font-semibold ${doc.status === 'Online'
                                                            ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100'
                                                            : 'bg-slate-100 text-slate-600'
                                                            }`}
                                                    >
                                                        {doc.name}
                                                    </span>
                                                ))}
                                            </div>

                                            <div className="mt-6 flex items-center justify-between text-sm font-semibold text-slate-900">
                                                <span>Completed Patient List</span>
                                                <input
                                                    className="rounded-full border border-slate-200 px-3 py-2 text-xs shadow-inner"
                                                    placeholder="Search patient"
                                                    value={completedSearch}
                                                    onChange={(e) => setCompletedSearch(e.target.value)}
                                                />
                                            </div>
                                            <div className="mt-3 space-y-2">
                                                {filteredCompleted.map((entry) => (
                                                    <Link
                                                        key={entry.nic}
                                                        href={entry.profileId ? `?patientId=${entry.profileId}` : '/#patients'}
                                                        scroll={false}
                                                        className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-xs text-slate-700 transition hover:-translate-y-0.5 hover:bg-sky-50 hover:ring-1 hover:ring-sky-200"
                                                    >
                                                        <div>
                                                            <p className="font-semibold text-slate-900">{entry.name}</p>
                                                            <p className="text-[11px] text-slate-500">NIC {entry.nic}</p>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="rounded-full bg-[var(--ioc-blue)] px-3 py-1 text-white">Age {entry.age}</span>
                                                            <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">{entry.time}</span>
                                                        </div>
                                                    </Link>
                                                ))}
                                            </div>
                                        </Panel>
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



