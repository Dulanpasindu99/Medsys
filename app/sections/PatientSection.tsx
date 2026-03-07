'use client';

import { PatientProfileModal } from '../components/PatientProfileModal';
import { usePatientProfilePopup } from '../hooks/usePatientProfilePopup';
import { PatientFilters } from './patient/components/PatientFilters';
import { PatientHeader } from './patient/components/PatientHeader';
import { PatientRecordCard } from './patient/components/PatientRecordCard';
import { SectionShell } from './patient/components/PatientPrimitives';
import { usePatientDirectory } from './patient/hooks/usePatientDirectory';

export default function PatientSection() {
    const {
        search,
        setSearch,
        family,
        setFamily,
        ageRange,
        setAgeRange,
        gender,
        setGender,
        patients,
        filteredPatients,
        families,
        syncError,
    } = usePatientDirectory();
    const popup = usePatientProfilePopup();

    return (
        <div id="patients" className="px-4 py-8 md:px-8">
            <div className="mx-auto flex flex-col gap-6">
                <PatientHeader />
                {syncError ? (
                    <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 ring-1 ring-rose-100">
                        {syncError}
                    </p>
                ) : null}

                <SectionShell>
                    <PatientFilters
                        search={search}
                        setSearch={setSearch}
                        gender={gender}
                        setGender={setGender}
                        family={family}
                        setFamily={setFamily}
                        families={families}
                        ageRange={ageRange}
                        setAgeRange={setAgeRange}
                        filteredCount={filteredPatients.length}
                    />
                </SectionShell>

                <SectionShell>
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Patient records</p>
                            <h2 className="text-xl font-bold text-slate-900">
                                {filteredPatients.length} of {patients.length} patients
                            </h2>
                        </div>
                        <div className="flex gap-2 text-sm font-semibold text-slate-700">
                            <span className="rounded-full bg-emerald-50 px-3 py-2 text-emerald-700 ring-1 ring-emerald-100">{patients.length * 8}+ total visits</span>
                            <span className="rounded-full bg-sky-50 px-3 py-2 text-sky-700 ring-1 ring-sky-100">Filters ready</span>
                        </div>
                    </div>

                    <div className="mt-5 space-y-4">
                        {filteredPatients.map((patient) => (
                            <PatientRecordCard
                                key={patient.patientId ?? `${patient.nic}-${patient.name}`}
                                patient={patient}
                                onViewProfile={popup.openProfile}
                            />
                        ))}
                    </div>
                </SectionShell>
            </div>
            <PatientProfileModal profileId={popup.selectedProfileId || ''} onClose={popup.closeProfile} />
        </div>
    );
}
