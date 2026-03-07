'use client';

import { AsyncNotice, AsyncStatePanel } from '../../components/ui/AsyncStatePanel';
import { SurfaceCard } from '../../components/ui/SurfaceCard';
import { usePatientProfileData } from './hooks/usePatientProfileData';
import { ProfileHeader } from './components/ProfileHeader';
import { TimelineCard } from './components/TimelineCard';
import { FamilyCard } from './components/FamilyCard';
import { AllergyCard } from './components/AllergyCard';
import { CoverageCard } from './components/CoverageCard';

export function PatientProfileView({ profileId }: { profileId: string }) {
    const { profile, timeline, totalProfiles, formatDate, loadState, reload } = usePatientProfileData(profileId);

    if (loadState.status === 'loading') {
        return (
            <div className="flex flex-col gap-4 p-8">
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
            <div className="flex flex-col gap-4 p-8">
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
            <div className="flex flex-col gap-4 p-8">
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
        <div className="mx-auto flex max-w-7xl flex-col gap-6 p-4 sm:p-6 md:p-8">
            <header className="sticky top-0 z-10 -mx-2 -my-4 flex flex-col gap-3 bg-[#F4F4F9]/80 px-2 py-4 backdrop-blur-md md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">
                    <span className="inline-flex h-2 w-2 rounded-full bg-sky-500 shadow-[0_0_0_6px_rgba(14,165,233,0.18)]" />
                    Patient Profile
                </div>
            </header>

            <SurfaceCard className="p-6 md:p-7">
                <ProfileHeader profile={profile} timelineCount={timeline.length} formatDate={formatDate} />
            </SurfaceCard>
            {loadState.notice ? <AsyncNotice tone="warning" message={loadState.notice} /> : null}

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.05fr_0.95fr]">
                <SurfaceCard className="p-6 md:p-7">
                    <TimelineCard timeline={timeline} formatDate={formatDate} />
                </SurfaceCard>

                <div className="flex flex-col gap-6">
                    <SurfaceCard className="p-6 md:p-7">
                        <FamilyCard profile={profile} />
                    </SurfaceCard>
                    <SurfaceCard className="p-6 md:p-7">
                        <AllergyCard profile={profile} />
                    </SurfaceCard>
                </div>
            </div>

            <SurfaceCard className="p-6 md:p-7">
                <CoverageCard totalProfiles={totalProfiles} />
            </SurfaceCard>
        </div>
    );
}
