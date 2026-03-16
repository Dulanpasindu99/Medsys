'use client';

import { AsyncNotice } from '../components/ui/AsyncStatePanel';
import { usePatientProfilePopup } from '../hooks/usePatientProfilePopup';
import { DoctorAssistantCoverage } from './doctor/components/DoctorAssistantCoverage';
import { DoctorSidebar } from './doctor/components/DoctorSidebar';
import { DoctorWorkspace } from './doctor/components/DoctorWorkspace';
import { useAssistantWorkflow } from './assistant/hooks/useAssistantWorkflow';
import { useDoctorClinicalWorkflow } from './doctor/hooks/useDoctorClinicalWorkflow';
import { useDoctorWorkspaceData } from './doctor/hooks/useDoctorWorkspaceData';
import { useVisitPlanner } from './doctor/hooks/useVisitPlanner';

export default function DoctorSection() {
    const clinicalWorkflow = useDoctorClinicalWorkflow();
    const visitPlanner = useVisitPlanner();
    const assistantWorkflow = useAssistantWorkflow();
    const {
        search,
        setSearch,
        patientName,
        setPatientName,
        patientAge,
        setPatientAge,
        nicNumber,
        setNicNumber,
        gender,
        setGender,
        searchMatches,
        patientVitals,
        patientAllergies,
        queueState,
        patientDetailsState,
        canSaveRecord,
        canTransitionAppointments,
        saveDisabledReason,
        transitionDisabledReason,
        selectedAppointmentStatus,
        saveState,
        saveFeedback,
        transitionState,
        transitionFeedback,
        handlePatientSelect,
        handleStartConsultation,
        handleSaveRecord,
    } = useDoctorWorkspaceData(clinicalWorkflow, visitPlanner);
    const popup = usePatientProfilePopup();
    const hasAssistantCoverage =
        assistantWorkflow.canManageAssistantWorkflow ||
        assistantWorkflow.canCreateAppointmentsInWorkflow;

    return (
        <section id="doctor" className="flex min-h-screen items-start justify-center px-4 py-8 text-slate-900">
            <div className="w-full flex-1 overflow-hidden rounded-[28px] border border-white/70 bg-white/80 shadow-[0_18px_42px_rgba(28,63,99,0.12)] ring-1 ring-sky-50/80 backdrop-blur-xl">
                <div className="relative flex flex-1 flex-col px-6 pb-20 pt-6 lg:px-10">
                    <div className="mx-auto flex w-full flex-1">
                        <div className="grid w-full grid-cols-12 gap-6">
                            <div className="col-span-12 space-y-3">
                                {queueState.error ? <AsyncNotice tone="error" message={queueState.error} /> : null}
                                {queueState.notice ? <AsyncNotice tone="warning" message={queueState.notice} /> : null}
                                {queueState.status === 'empty' ? (
                                    <AsyncNotice tone="warning" message="No waiting appointments are available in the doctor queue right now." />
                                ) : null}
                                {patientDetailsState.notice ? (
                                    <AsyncNotice tone="warning" message={patientDetailsState.notice} />
                                ) : null}
                                {patientDetailsState.error ? (
                                    <AsyncNotice tone="warning" message={patientDetailsState.error} />
                                ) : null}
                            </div>
                            <DoctorSidebar
                                search={search}
                                onSearchChange={setSearch}
                                searchMatches={searchMatches}
                                onSearchSelect={(patient) => {
                                    handlePatientSelect(patient);
                                    if (patient.profileId) {
                                        popup.openProfile(patient.profileId);
                                    }
                                }}
                                patientVitals={patientVitals}
                                patientAllergies={patientAllergies}
                                onStartConsultation={handleStartConsultation}
                                onSaveRecord={handleSaveRecord}
                                canTransitionAppointments={canTransitionAppointments}
                                selectedAppointmentStatus={selectedAppointmentStatus}
                                transitionDisabledReason={transitionDisabledReason}
                                transitionFeedback={transitionFeedback}
                                isTransitioningAppointment={transitionState.status === 'pending'}
                                canSaveRecord={canSaveRecord}
                                saveDisabledReason={saveDisabledReason}
                                saveFeedback={saveFeedback}
                                isSavingRecord={saveState.status === 'pending'}
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
                            {hasAssistantCoverage ? (
                                <DoctorAssistantCoverage
                                    workflow={assistantWorkflow}
                                    onOpenProfile={popup.openProfile}
                                />
                            ) : null}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
