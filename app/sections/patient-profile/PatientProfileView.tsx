'use client';

import { useState } from 'react';
import { AsyncNotice, AsyncStatePanel } from '../../components/ui/AsyncStatePanel';
import { SurfaceCard } from '../../components/ui/SurfaceCard';
import { usePatientProfileData } from './hooks/usePatientProfileData';
import { ProfileHeader } from './components/ProfileHeader';
import { TimelineCard } from './components/TimelineCard';
import { AllergyCard } from './components/AllergyCard';
import { ProfileEditCard } from './components/ProfileEditCard';
import { VitalsCard } from './components/VitalsCard';

export function PatientProfileView({ profileId }: { profileId: string }) {
    const { profile, timeline, formatDate, loadState, reload } = usePatientProfileData(profileId);
    const [isEditing, setIsEditing] = useState(false);

    if (loadState.status === 'loading') {
        return (
            <div className="flex h-screen flex-col gap-4 overflow-hidden p-8">
                <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
                    <span className="inline-flex h-2 w-2 rounded-full bg-slate-200" />
                    Patient profile
                </div>
                <AsyncStatePanel
                    eyebrow="Loading"
                    title="Loading patient profile"
                    description="The patient summary, family data, and timeline are being loaded."
                    tone="loading"
                />
            </div>
        );
    }

    if (loadState.status === 'error') {
        return (
            <div className="flex h-screen flex-col gap-4 overflow-hidden p-8">
                <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
                    <span className="inline-flex h-2 w-2 rounded-full bg-slate-200" />
                    Patient profile
                </div>
                <AsyncStatePanel
                    eyebrow="Error"
                    title="Patient profile could not be loaded"
                    description={loadState.error ?? 'The selected patient profile is unavailable right now.'}
                    tone="error"
                    actionLabel="Retry profile"
                    onAction={reload}
                />
            </div>
        );
    }

    if (!profile || loadState.status === 'empty') {
        return (
            <div className="flex h-screen flex-col gap-4 overflow-hidden p-8">
                <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
                    <span className="inline-flex h-2 w-2 rounded-full bg-slate-200" />
                    Patient profile
                </div>
                <AsyncStatePanel
                    eyebrow="Not found"
                    title="Profile not found"
                    description="The selected patient is not registered yet or the profile reference is invalid."
                    tone="empty"
                />
            </div>
        );
    }

    return (
        <div className="relative mx-auto flex h-screen w-full max-w-[96rem] flex-col gap-4 overflow-hidden px-4 py-4 sm:px-6 sm:py-5 md:px-8 md:py-6">
            <header className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">
                <span className="inline-flex h-2 w-2 rounded-full bg-sky-500 shadow-[0_0_0_6px_rgba(14,165,233,0.18)]" />
                Patient Profile
            </header>

            <SurfaceCard className="p-4 md:p-5">
                <ProfileHeader
                    profile={profile}
                    timelineCount={timeline.length}
                    formatDate={formatDate}
                    onEdit={() => setIsEditing(true)}
                />
            </SurfaceCard>
            {loadState.notice ? <AsyncNotice tone="warning" message={loadState.notice} /> : null}

            <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 xl:grid-cols-[1.3fr_0.8fr]">
                <SurfaceCard className="flex min-h-0 flex-col p-5 md:p-6">
                    <TimelineCard timeline={timeline} formatDate={formatDate} />
                </SurfaceCard>

                <div className="grid min-h-0 grid-rows-[minmax(0,1fr)_minmax(0,1fr)] gap-4">
                    <SurfaceCard className="flex h-full min-h-0 flex-col p-5 md:p-6">
                        <VitalsCard profile={profile} formatDate={formatDate} />
                    </SurfaceCard>
                    <SurfaceCard className="flex h-full min-h-0 flex-col p-5 md:p-6">
                        <AllergyCard profile={profile} />
                    </SurfaceCard>
                </div>
            </div>

            {isEditing ? (
                <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-900/30 px-4 py-6 backdrop-blur-[2px] sm:px-6 md:px-8">
                    <div
                        className="absolute inset-0"
                        aria-hidden="true"
                        onClick={() => setIsEditing(false)}
                    />
                    <SurfaceCard className="relative z-10 flex max-h-[88vh] w-full max-w-5xl flex-col overflow-hidden p-5 md:p-6">
                        <div className="min-h-0 overflow-y-auto pr-1">
                            <ProfileEditCard profile={profile} onClose={() => setIsEditing(false)} />
                        </div>
                    </SurfaceCard>
                </div>
            ) : null}
        </div>
    );
}
