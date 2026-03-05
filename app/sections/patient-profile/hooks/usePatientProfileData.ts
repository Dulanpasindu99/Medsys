import { useMemo } from 'react';
import { getPatientProfile, patientProfiles } from '../../../data/patientProfiles';
import type { PatientTimelineEntry } from '../types';

const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });

export function usePatientProfileData(profileId: string) {
    const profile = useMemo(() => getPatientProfile(profileId), [profileId]);

    const timeline = useMemo<PatientTimelineEntry[]>(
        () =>
            profile
                ? [...profile.timeline].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                : [],
        [profile]
    );

    return {
        profile,
        timeline,
        totalProfiles: Object.keys(patientProfiles).length,
        formatDate,
    };
}
