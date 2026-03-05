'use client';

import { useMemo, useState } from 'react';
import { getProfileIdByNicOrName } from '../data/patientProfiles';
import { usePatientProfilePopup } from '../hooks/usePatientProfilePopup';
import { DoctorSidebar } from './doctor/components/DoctorSidebar';
import { DoctorWorkspace } from './doctor/components/DoctorWorkspace';
import { useDoctorClinicalWorkflow } from './doctor/hooks/useDoctorClinicalWorkflow';
import { useVisitPlanner } from './doctor/hooks/useVisitPlanner';
import type { AllergyAlert, Patient, PatientGender, PatientVital } from './doctor/types';

export default function DoctorSection() {
    const patients = useMemo<Patient[]>(
        () => [
            { id: 'p1', name: 'Premadasa', nic: '61524862V', time: '5.00 PM', reason: 'Fever, Headache', age: 66, gender: 'Male', profileId: getProfileIdByNicOrName('61524862V', 'Premadasa') },
            { id: 'p2', name: 'JR Jayawardhana', nic: '64524862V', time: '5.10 PM', reason: 'Stomach Ache, Headache', age: 62, gender: 'Male', profileId: getProfileIdByNicOrName('64524862V', 'JR Jayawardhana') },
            { id: 'p3', name: 'Mitreepala Siirisena', nic: '78522862V', time: '5.20 PM', reason: 'Fever', age: 68, gender: 'Male', profileId: getProfileIdByNicOrName('78522862V', 'Mitreepala Siirisena') },
            { id: 'p4', name: 'Chandrika Bandranayake', nic: '71524862V', time: '5.30 PM', reason: 'Fever, Headache', age: 63, gender: 'Female', profileId: getProfileIdByNicOrName('71524862V', 'Chandrika Bandranayake') },
            { id: 'p5', name: 'Ranil Vicramasinghe', nic: '77524862V', time: '5.00 PM', reason: 'Fever, Headache', age: 76, gender: 'Male', profileId: getProfileIdByNicOrName('77524862V', 'Ranil Vicramasinghe') },
            { id: 'p6', name: 'Mahinda Rajapakshe', nic: '74524862V', time: '-', reason: 'Headache', age: 66, gender: 'Male', profileId: getProfileIdByNicOrName('74524862V', 'Mahinda Rajapakshe') },
        ],
        []
    );

    const patientVitals = useMemo<PatientVital[]>(
        () => [
            { label: 'Blood Pressure', value: '120/80' },
            { label: 'Sugar', value: '98 mg/dL' },
            { label: 'Temperature', value: '98.6 F' },
            { label: 'Heart Rate', value: '74 bpm' },
        ],
        []
    );

    const patientAllergies = useMemo<AllergyAlert[]>(
        () => [
            { name: 'Penicillin', severity: 'High', dot: 'bg-rose-400', pill: 'bg-rose-50 text-rose-700 ring-rose-100' },
            { name: 'Peanuts', severity: 'Medium', dot: 'bg-amber-400', pill: 'bg-amber-50 text-amber-700 ring-amber-100' },
            { name: 'Latex', severity: 'Low', dot: 'bg-emerald-400', pill: 'bg-emerald-50 text-emerald-700 ring-emerald-100' },
        ],
        []
    );

    const [search, setSearch] = useState('');
    const [patientName, setPatientName] = useState('');
    const [patientAge, setPatientAge] = useState('');
    const [nicNumber, setNicNumber] = useState('');
    const [gender, setGender] = useState<PatientGender>('Male');

    const clinicalWorkflow = useDoctorClinicalWorkflow();
    const visitPlanner = useVisitPlanner();
    const popup = usePatientProfilePopup();

    const searchMatches = useMemo(() => {
        const query = search.trim().toLowerCase();
        if (!query) return [];
        return patients.filter((patient) => patient.name.toLowerCase().includes(query) || patient.nic.toLowerCase().includes(query));
    }, [search, patients]);

    const handleSearchSelect = (patient: Patient) => {
        const profileId = patient.profileId || getProfileIdByNicOrName(patient.nic, patient.name);
        popup.openProfile(profileId);
        setSearch('');
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
                                patientVitals={patientVitals}
                                patientAllergies={patientAllergies}
                                onSaveRecord={() => undefined}
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
