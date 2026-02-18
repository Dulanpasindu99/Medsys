'use client';

import React from 'react';
import { getPatientProfile, patientProfiles, type PatientProfile } from '../data/patientProfiles';
import { PatientsIcon } from './NavigationPanel'; // Just for icon reference if needed

const SHADOWS = {
    card: 'shadow-[0_20px_48px_rgba(15,23,42,0.12)]',
    inset: 'shadow-[inset_0_1px_0_rgba(255,255,255,0.42)]',
} as const;

const InfoPill = ({ label, value }: { label: string; value: string }) => (
    <div className={`rounded-2xl border border-slate-100 bg-white/90 px-4 py-3 text-sm font-semibold text-slate-800 ${SHADOWS.inset}`}>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
        <p className="mt-1 text-base text-slate-900">{value}</p>
    </div>
);

const SectionShell = ({ children }: { children: React.ReactNode }) => (
    <section className={`ios-surface ${SHADOWS.card} p-6 md:p-7`}>{children}</section>
);

const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });

export function PatientProfileView({ profileId, onClose }: { profileId: string; onClose: () => void }) {
    const profile = getPatientProfile(profileId);

    if (!profile) {
        return (
            <div className="flex flex-col gap-4 p-8">
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
                        <span className="inline-flex h-2 w-2 rounded-full bg-slate-200" />
                        Patient profile
                    </div>
                </div>
                <div className={`ios-surface ${SHADOWS.card} flex flex-col justify-center rounded-[24px] p-8 md:p-10`}>
                    <h2 className="text-base font-bold text-slate-700">Profile not found.</h2>
                    <p className="mt-1 text-sm text-slate-400">The selected patient is not registered yet.</p>
                </div>
            </div>
        );
    }

    const timeline = [...profile.timeline].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    return (
        <div className="mx-auto flex max-w-7xl flex-col gap-6 p-4 sm:p-6 md:p-8">
            <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between sticky top-0 z-10 bg-[#F4F4F9]/80 backdrop-blur-md py-4 -my-4 px-2 -mx-2">
                <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">
                    <span className="inline-flex h-2 w-2 rounded-full bg-sky-500 shadow-[0_0_0_6px_rgba(14,165,233,0.18)]" />
                    Patient Profile
                </div>
                {/* Close Button handled by parent overlay usually, but here for header context if needed */}
            </header>

            <SectionShell>
                <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                    <div className="space-y-2">
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">{profile.name}</h1>
                        <p className="text-sm text-slate-600">Automatically generated record shared across all panels.</p>
                        <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                            {profile.conditions.map((condition) => (
                                <span
                                    key={condition}
                                    className="rounded-full bg-slate-100 px-3 py-1 text-slate-700 ring-1 ring-slate-200"
                                >
                                    {condition}
                                </span>
                            ))}
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-3 text-sm font-semibold text-slate-800">
                        <span className="rounded-full bg-slate-700 px-4 py-2 text-white shadow-[0_12px_32px_rgba(71,85,105,0.28)]">
                            NIC {profile.nic}
                        </span>
                        <span className="rounded-full bg-slate-100 px-4 py-2 text-slate-700 ring-1 ring-slate-200">
                            Gender {profile.gender}
                        </span>
                    </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <InfoPill label="Age" value={`${profile.age} yrs`} />
                    <InfoPill label="Family" value={profile.family.assigned ? `${profile.family.name} family` : 'Not assigned'} />
                    <InfoPill label="First added" value={formatDate(profile.firstSeen)} />
                    <InfoPill label="Total timeline notes" value={String(timeline.length)} />
                </div>
            </SectionShell>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.05fr_0.95fr]">
                <SectionShell>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Health Timeline</p>
                            <h2 className="text-xl font-bold text-slate-900">Diseases & blood pressure log</h2>
                        </div>
                        <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-sky-700 ring-1 ring-sky-100">
                            Vertical view
                        </span>
                    </div>

                    <div className="relative mt-6 space-y-6">
                        <div className="absolute left-4 top-0 bottom-0 w-px bg-gradient-to-b from-sky-200 via-slate-200 to-transparent" />
                        {timeline.map((entry) => (
                            <div key={`${entry.date}-${entry.title}`} className="relative pl-10">
                                <span className="absolute left-0 top-1.5 h-3.5 w-3.5 rounded-full bg-sky-500 shadow-[0_0_0_6px_rgba(14,165,233,0.2)]" />
                                <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-600">
                                    <span className="rounded-full bg-white/80 px-3 py-1 ring-1 ring-slate-200">{formatDate(entry.date)}</span>
                                    {entry.kind === 'bp' ? (
                                        <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700 ring-1 ring-emerald-100">Blood pressure</span>
                                    ) : null}
                                    {entry.tags?.map((tag) => (
                                        <span key={tag} className="rounded-full bg-slate-700 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                                <div className="mt-2 rounded-2xl bg-white/90 p-4 ring-1 ring-slate-100">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <h3 className="text-base font-semibold text-slate-900">{entry.title}</h3>
                                            <p className="mt-1 text-sm text-slate-600">{entry.description}</p>
                                        </div>
                                        {entry.value ? (
                                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
                                                {entry.value}
                                            </span>
                                        ) : null}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </SectionShell>

                <div className="flex flex-col gap-6">
                    <SectionShell>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Family</p>
                                <h2 className="text-xl font-bold text-slate-900">Assignment & members</h2>
                            </div>
                            <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ring-1 ${profile.family.assigned
                                ? 'bg-emerald-50 text-emerald-700 ring-emerald-100'
                                : 'bg-slate-100 text-slate-600 ring-slate-200'
                                }`}>
                                {profile.family.assigned ? 'Assigned' : 'Not assigned'}
                            </span>
                        </div>

                        <div className="mt-4 space-y-3 text-sm text-slate-700">
                            <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 ring-1 ring-slate-100">
                                Family name: {profile.family.name}
                            </div>
                            <div className="space-y-2">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Other members</p>
                                <div className="flex flex-wrap gap-2">
                                    {profile.family.members.length ? (
                                        profile.family.members.map((member) => (
                                            <span
                                                key={member}
                                                className="rounded-full bg-white/90 px-3 py-1 text-sm font-semibold text-slate-800 ring-1 ring-slate-200"
                                            >
                                                {member}
                                            </span>
                                        ))
                                    ) : (
                                        <span className="rounded-full bg-white/90 px-3 py-1 text-sm font-semibold text-slate-500 ring-1 ring-slate-200">
                                            No linked family members
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </SectionShell>

                    <SectionShell>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Allergies</p>
                                <h2 className="text-xl font-bold text-slate-900">Known reactions</h2>
                            </div>
                            <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-rose-700 ring-1 ring-rose-100">
                                Keep updated
                            </span>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                            {profile.allergies.map((allergy) => (
                                <span
                                    key={allergy}
                                    className="rounded-full bg-white/90 px-3 py-2 text-sm font-semibold text-slate-800 ring-1 ring-slate-200"
                                >
                                    {allergy}
                                </span>
                            ))}
                        </div>
                    </SectionShell>
                </div>
            </div>

            <SectionShell>
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">System status</p>
                        <h2 className="text-xl font-bold text-slate-900">Profile coverage</h2>
                    </div>
                    <span className="rounded-full bg-slate-700 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white shadow-[0_12px_30px_rgba(71,85,105,0.35)]">
                        {Object.keys(patientProfiles).length} patients auto-styled
                    </span>
                </div>
                <p className="mt-3 text-sm text-slate-600">
                    Every patient shares this exact layout. Linking from the patient management hub, assistant completed list, or doctor search automatically opens the correct profile page for a unified iOS-inspired experience.
                </p>
            </SectionShell>
        </div>
    );
}
