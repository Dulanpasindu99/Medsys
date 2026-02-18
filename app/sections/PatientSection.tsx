'use client';

import Link from 'next/link';
import React, { useMemo, useState } from 'react';
import { getProfileIdByNicOrName, patientProfiles, type PatientProfile } from '../data/patientProfiles';
import { PatientProfileModal } from '../components/PatientProfileModal';

type Gender = 'Male' | 'Female';

type Patient = {
    id: string;
    name: string;
    nic: string;
    age: number;
    gender: Gender;
    mobile: string;
    family: string;
    visits: number;
    lastVisit: string;
    nextAppointment?: string;
    tags: string[];
    conditions: string[];
    profileId?: string;
};

const SHADOWS = {
    card: 'shadow-[0_20px_48px_rgba(15,23,42,0.12)]',
    inset: 'shadow-[inset_0_1px_0_rgba(255,255,255,0.42)]',
    chip: 'shadow-[0_10px_24px_rgba(15,23,42,0.08)]',
} as const;

const SectionShell = ({ children }: { children: React.ReactNode }) => (
    <section className={`ios-surface ${SHADOWS.card} p-6 md:p-7`}>{children}</section>
);

const FilterChip = ({
    label,
    active,
    onClick,
}: {
    label: string;
    active?: boolean;
    onClick: () => void;
}) => (
    <button
        onClick={onClick}
        className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition hover:-translate-y-0.5 hover:shadow-md ${active
            ? 'border-sky-200 bg-sky-50 text-sky-800 shadow-[0_12px_26px_rgba(14,165,233,0.22)]'
            : 'border-slate-200/80 bg-white/80 text-slate-700'
            } ${SHADOWS.inset}`}
    >
        {active && <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />} {label}
    </button>
);

const Chip = ({ children }: { children: React.ReactNode }) => (
    <span className={`ios-chip bg-white/80 text-[11px] uppercase tracking-[0.18em] text-slate-700 ${SHADOWS.chip}`}>
        {children}
    </span>
);

const patients: Patient[] = Object.values(patientProfiles).map((profile) => {
    // Sort timeline to find last visit
    const sortedTimeline = [...profile.timeline].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    const lastVisitDate = sortedTimeline[0]?.date;

    // Calculate relative time (simple approximation)
    const daysSince = lastVisitDate
        ? Math.floor((new Date().getTime() - new Date(lastVisitDate).getTime()) / (1000 * 3600 * 24))
        : 0;

    let lastVisitDisplay = 'New patient';
    if (daysSince > 0) {
        if (daysSince < 7) lastVisitDisplay = `${daysSince} days ago`;
        else if (daysSince < 30) lastVisitDisplay = `${Math.floor(daysSince / 7)} weeks ago`;
        else lastVisitDisplay = `${Math.floor(daysSince / 30)} months ago`;
    } else if (lastVisitDate) {
        lastVisitDisplay = 'Today';
    }

    return {
        id: profile.id, // Using profile ID as patient ID for consistency
        name: profile.name,
        nic: profile.nic,
        age: profile.age,
        gender: profile.gender,
        mobile: '+94 71 723 4567', // Mocked as it's not in profile
        family: profile.family.name === 'N/A' ? 'Unassigned' : profile.family.name,
        visits: profile.timeline.length + 1, // Base visits + timeline entries
        lastVisit: lastVisitDisplay,
        nextAppointment: Math.random() > 0.7 ? 'Tomorrow 10:00 AM' : undefined, // Random mock
        tags: profile.conditions,
        conditions: [...profile.conditions, ...profile.allergies.map(a => `Allergy: ${a}`)],
        profileId: profile.id,
    };
});

const ageBuckets = [
    { id: 'all', label: 'All Ages' },
    { id: '18-30', label: 'Age 18-30' },
    { id: '31-45', label: 'Age 31-45' },
    { id: '46+', label: 'Age 46+' },
];

const families = ['All Families', 'Wickramasinghe', 'Bandaranayaka', 'Rajapaksha'];

const genderFilters: { id: Gender | 'all'; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'Male', label: 'Male' },
    { id: 'Female', label: 'Female' },
];

export default function PatientSection() {
    const [search, setSearch] = useState('');
    const [family, setFamily] = useState<string>('All Families');
    const [ageRange, setAgeRange] = useState<string>('all');
    const [gender, setGender] = useState<Gender | 'all'>('all');
    const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);

    const filteredPatients = useMemo(() => {
        return patients.filter((patient) => {
            const matchesSearch = `${patient.name} ${patient.nic} ${patient.mobile} ${patient.family}`
                .toLowerCase()
                .includes(search.toLowerCase());

            const matchesFamily = family === 'All Families' || patient.family === family;

            const matchesGender = gender === 'all' || patient.gender === gender;

            const matchesAge =
                ageRange === 'all' ||
                (ageRange === '18-30' && patient.age >= 18 && patient.age <= 30) ||
                (ageRange === '31-45' && patient.age >= 31 && patient.age <= 45) ||
                (ageRange === '46+' && patient.age >= 46);

            return matchesSearch && matchesFamily && matchesGender && matchesAge;
        });
    }, [search, family, ageRange, gender]);

    return (
        <div id="patients" className="px-4 py-8 md:px-8">
            <div className="mx-auto flex flex-col gap-6">
                <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">
                        <span className="inline-flex h-2 w-2 rounded-full bg-sky-500 shadow-[0_0_0_6px_rgba(14,165,233,0.18)]" />
                        Patient hub
                    </div>
                    <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">Patient Management</h1>
                            <p className="text-sm text-slate-600">Search, filter, and review patient families in one place.</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">
                            <Chip>Patients</Chip>
                            <Chip>Families</Chip>
                            <Chip>Filters</Chip>
                        </div>
                    </div>
                </div>


                <SectionShell>
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                        {/* Search & Filter Group */}
                        <div className="flex flex-1 flex-col gap-4 sm:flex-row sm:items-center">
                            {/* NIC Search Input */}
                            <div className={`flex flex-1 items-center gap-3 rounded-[20px] bg-white px-5 py-2.5 ${SHADOWS.inset} ring-1 ring-slate-200`}>
                                <input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Enter NIC No"
                                    className="flex-1 bg-transparent text-sm font-bold uppercase tracking-wider text-slate-700 placeholder:text-slate-300 focus:outline-none"
                                />
                                <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>

                            {/* Gender Toggles */}
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setGender('Male')}
                                    className={`rounded-full px-6 py-2.5 text-[11px] font-bold uppercase tracking-[0.2em] transition-all ${gender === 'Male'
                                        ? 'bg-slate-800 text-white shadow-lg shadow-slate-200'
                                        : 'bg-white text-slate-400 ring-1 ring-slate-100 hover:bg-slate-50'
                                        }`}
                                >
                                    Male
                                </button>
                                <button
                                    onClick={() => setGender('Female')}
                                    className={`rounded-full px-6 py-2.5 text-[11px] font-bold uppercase tracking-[0.2em] transition-all ${gender === 'Female'
                                        ? 'bg-slate-800 text-white shadow-lg shadow-slate-200'
                                        : 'bg-white text-slate-400 ring-1 ring-slate-100 hover:bg-slate-50'
                                        }`}
                                >
                                    Female
                                </button>
                                {gender !== 'all' && (
                                    <button
                                        onClick={() => setGender('all')}
                                        className="h-8 w-8 rounded-full bg-slate-100 text-slate-400 hover:bg-slate-200 flex items-center justify-center transition"
                                    >
                                        <span className="sr-only">Clear</span>
                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Patient Count */}
                        <div className="flex items-center justify-end gap-6">
                            <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-400">
                                Patient No: <span className="ml-1 text-slate-900">{filteredPatients.length}</span>
                            </div>

                            {/* Additional Search/Filter (Preserving existing family filter) */}
                            <div className={`hidden items-center gap-3 rounded-2xl border border-slate-100 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-700 sm:flex ${SHADOWS.inset}`}>
                                <span className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Family</span>
                                <select
                                    value={family}
                                    onChange={(e) => setFamily(e.target.value)}
                                    className="bg-transparent text-xs font-bold uppercase tracking-wider text-slate-800 outline-none"
                                >
                                    {families.map((item) => (
                                        <option key={item} value={item}>
                                            {item}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                        {ageBuckets.map((bucket) => (
                            <FilterChip key={bucket.id} label={bucket.label} active={ageRange === bucket.id} onClick={() => setAgeRange(bucket.id)} />
                        ))}
                    </div>
                </SectionShell>

                <SectionShell>
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Patient records</p>
                            <h2 className="text-xl font-bold text-slate-900">{filteredPatients.length} of {patients.length} patients</h2>
                        </div>
                        <div className="flex gap-2 text-sm font-semibold text-slate-700">
                            <span className="rounded-full bg-emerald-50 px-3 py-2 text-emerald-700 ring-1 ring-emerald-100">{patients.length * 8}+ total visits</span>
                            <span className="rounded-full bg-sky-50 px-3 py-2 text-sky-700 ring-1 ring-sky-100">Filters ready</span>
                        </div>
                    </div>

                    <div className="mt-5 space-y-4">
                        {filteredPatients.map((patient) => (
                            <article
                                key={patient.id}
                                className={`overflow-hidden rounded-[26px] border border-white/60 bg-gradient-to-br from-white/95 via-white/90 to-sky-50/80 shadow-[0_16px_42px_rgba(15,23,42,0.1)] ring-1 ring-slate-100 backdrop-blur`}
                            >
                                <div className="flex flex-col gap-5 px-5 py-5 md:flex-row md:items-start md:justify-between md:px-6 md:py-6">
                                    <div className="flex flex-1 flex-col gap-3">
                                        <div className="flex flex-wrap items-center gap-3">
                                            <div className="inline-flex items-center gap-2 rounded-full bg-slate-700 px-4 py-2 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(71,85,105,0.3)]">
                                                {patient.id}
                                                <span className="text-slate-300">·</span>
                                                {patient.name}
                                            </div>
                                            <span className="text-sm font-semibold text-slate-700">NIC {patient.nic}</span>
                                            <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700">
                                                {patient.gender}
                                            </span>
                                        </div>

                                        <div className="flex flex-wrap gap-2 text-sm text-slate-600">
                                            <span className="inline-flex items-center gap-1 rounded-full bg-white/70 px-3 py-1 font-semibold text-slate-800 ring-1 ring-slate-100">
                                                Mobile: {patient.mobile}
                                            </span>
                                            <span className="inline-flex items-center gap-1 rounded-full bg-white/70 px-3 py-1 font-semibold text-slate-800 ring-1 ring-slate-100">
                                                {patient.family} Family
                                            </span>
                                            <span className="inline-flex items-center gap-1 rounded-full bg-white/70 px-3 py-1 font-semibold text-slate-800 ring-1 ring-slate-100">
                                                Visits: {patient.visits}
                                            </span>
                                            <span className="inline-flex items-center gap-1 rounded-full bg-white/70 px-3 py-1 font-semibold text-slate-800 ring-1 ring-slate-100">
                                                Last visit: {patient.lastVisit}
                                            </span>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-2">
                                            {patient.tags.map((tag) => (
                                                <span
                                                    key={tag}
                                                    className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-slate-700 to-slate-800 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white shadow-[0_12px_32px_rgba(71,85,105,0.3)]"
                                                >
                                                    {tag}
                                                </span>
                                            ))}
                                            {patient.nextAppointment ? (
                                                <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700 ring-1 ring-emerald-100">
                                                    Next: {patient.nextAppointment}
                                                </span>
                                            ) : null}
                                        </div>
                                    </div>

                                    <div className="flex w-full flex-col gap-3 rounded-2xl bg-white/90 p-4 ring-1 ring-slate-100 md:w-80">
                                        <div className="flex items-center justify-between">
                                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Status</p>
                                            <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-sky-700 ring-1 ring-sky-100">Family</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 text-sm font-semibold text-slate-700">
                                            <span className="rounded-2xl bg-slate-50 px-3 py-2 ring-1 ring-slate-100">Age: {patient.age}</span>
                                            <span className="rounded-2xl bg-slate-50 px-3 py-2 ring-1 ring-slate-100">Visits: {patient.visits}</span>
                                        </div>
                                        <div className="rounded-2xl bg-gradient-to-r from-slate-700 to-slate-800 px-4 py-3 text-sm font-semibold text-white shadow-[0_16px_32px_rgba(71,85,105,0.35)]">
                                            <div className="text-xs uppercase tracking-[0.18em] text-slate-300">Conditions</div>
                                            <div className="mt-1 flex flex-wrap gap-2">
                                                {patient.conditions.map((condition) => (
                                                    <span key={condition} className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-slate-100 ring-1 ring-white/15">
                                                        {condition}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                        {patient.profileId ? (
                                            <button
                                                type="button"
                                                onClick={() => setSelectedProfileId(patient.profileId || null)}
                                                className="ios-button-primary w-full text-center text-sm"
                                            >
                                                View patient profile
                                            </button>
                                        ) : null}
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div >
                </SectionShell >
            </div >
            <PatientProfileModal
                profileId={selectedProfileId || ''}
                onClose={() => setSelectedProfileId(null)}
            />
        </div >
    );
}
