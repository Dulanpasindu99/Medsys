'use client';

import { useEffect, useMemo, useState } from 'react';
import { ViewportBody, ViewportFrame, ViewportPage, ViewportTabs } from '../components/ui/ViewportLayout';
import { PatientProfileModal } from '../components/PatientProfileModal';
import { usePatientProfilePopup } from '../hooks/usePatientProfilePopup';
import { AssistantHeader } from './assistant/components/AssistantHeader';
import { AssistantIntakePanel } from './assistant/components/AssistantIntakePanel';
import { AssistantPanelShell } from './assistant/components/AssistantPanelShell';
import { AssistantPickupPanel } from './assistant/components/AssistantPickupPanel';
import { AssistantSidebar } from './assistant/components/AssistantSidebar';
import { useAssistantWorkflow } from './assistant/hooks/useAssistantWorkflow';

export default function AssistantSection() {
    const {
        pendingPatients,
        activePrescription,
        activeClinicalResolutionRows,
        formState,
        setFormState,
        completedSearch,
        setCompletedSearch,
        stats,
        availableDoctors,
        patientOptions,
        familyOptions,
        filteredCompleted,
        addPatient,
        addAllergy,
        resetPatientForm,
        scheduleForm,
        setScheduleForm,
        scheduleAppointment,
        resetScheduleForm,
        markDoneAndNext,
        canSubmitDispense,
        dispenseActionDisabledReason,
        setResolvedInventoryItem,
        loadState,
        createPatientState,
        createPatientFieldErrors,
        scheduleAppointmentState,
        scheduleFieldErrors,
        dispenseState,
        canManageAssistantWorkflow,
        canCreatePatientsInWorkflow,
        patientActionDisabledReason,
        workflowActionDisabledReason,
        canCreateAppointmentsInWorkflow,
        appointmentActionDisabledReason,
        currentRole,
    } = useAssistantWorkflow();
    const popup = usePatientProfilePopup();
    const tabOptions = useMemo(() => {
        if (currentRole === 'doctor') {
            return [
                { key: 'doctor-checked', label: 'Doctor Checked' },
                { key: 'completed', label: 'Completed Patients' },
            ] as const;
        }

        return [
            { key: 'add-patient', label: 'Add Patient' },
            { key: 'schedule', label: 'Schedule' },
            { key: 'doctor-checked', label: 'Doctor Checked' },
            { key: 'completed', label: 'Completed Patients' },
        ] as const;
    }, [currentRole]);
    const [activeTab, setActiveTab] = useState<(typeof tabOptions)[number]['key']>(
        currentRole === 'doctor' ? 'doctor-checked' : 'add-patient'
    );

    useEffect(() => {
        setActiveTab(currentRole === 'doctor' ? 'doctor-checked' : 'add-patient');
    }, [currentRole]);

    return (
        <ViewportPage className="relative isolate h-full min-h-0 overflow-hidden text-slate-900">
            <ViewportFrame>
                <ViewportBody className="h-full min-h-0 overflow-hidden px-4 py-5 sm:px-6 sm:py-6 lg:px-10">
                    <div className="mx-auto flex h-full min-h-0 w-full flex-col gap-4">
                        <div className="flex flex-col gap-3">
                            <AssistantHeader stats={stats} />
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <ViewportTabs
                                    tabs={tabOptions.map((tab) => ({
                                        key: tab.key,
                                        label: tab.label,
                                        active: activeTab === tab.key,
                                        onClick: () => setActiveTab(tab.key),
                                    }))}
                                />
                            </div>
                        </div>

                        <div className="min-h-0 flex-1 overflow-hidden">
                            <div className={`h-full pr-1 ${activeTab === 'add-patient' ? 'overflow-hidden' : 'overflow-y-auto'}`}>
                                {activeTab === 'add-patient' ? (
                                    <AssistantPanelShell className="h-full min-h-0">
                                        <AssistantIntakePanel
                                            formState={formState}
                                            setFormState={setFormState}
                                            patientOptions={patientOptions}
                                            familyOptions={familyOptions}
                                            addAllergy={addAllergy}
                                            addPatient={addPatient}
                                            onResetForm={resetPatientForm}
                                            fieldErrors={createPatientFieldErrors}
                                            canCreatePatients={canCreatePatientsInWorkflow}
                                            patientActionDisabledReason={patientActionDisabledReason}
                                            isSubmitting={createPatientState.status === 'pending'}
                                        />
                                    </AssistantPanelShell>
                                ) : null}

                                {activeTab === 'doctor-checked' ? (
                                    <AssistantPanelShell className="h-full min-h-0">
                                        <AssistantPickupPanel
                                            activePrescription={activePrescription}
                                            activeClinicalResolutionRows={activeClinicalResolutionRows}
                                            queueCount={pendingPatients.length}
                                            onDoneAndNext={markDoneAndNext}
                                            onResolvedInventoryItemChange={setResolvedInventoryItem}
                                            canSubmitDispense={canSubmitDispense}
                                            dispenseActionDisabledReason={dispenseActionDisabledReason}
                                            canManageAssistantWorkflow={canManageAssistantWorkflow}
                                            workflowActionDisabledReason={workflowActionDisabledReason}
                                            isSubmitting={dispenseState.status === 'pending'}
                                            isLoading={loadState.status === 'loading'}
                                        />
                                    </AssistantPanelShell>
                                ) : null}

                                {activeTab === 'completed' ? (
                                    <AssistantPanelShell className="flex h-full min-h-0 flex-col">
                                        <AssistantSidebar
                                            availableDoctors={availableDoctors}
                                            patientOptions={patientOptions}
                                            scheduleForm={scheduleForm}
                                            onScheduleFormChange={setScheduleForm}
                                            onScheduleAppointment={scheduleAppointment}
                                            onResetScheduleForm={resetScheduleForm}
                                            scheduleFieldErrors={scheduleFieldErrors}
                                            canCreateAppointments={canCreateAppointmentsInWorkflow}
                                            appointmentActionDisabledReason={appointmentActionDisabledReason}
                                            isScheduling={scheduleAppointmentState.status === 'pending'}
                                            completedSearch={completedSearch}
                                            onCompletedSearchChange={setCompletedSearch}
                                            filteredCompleted={filteredCompleted}
                                            onOpenProfile={popup.openProfile}
                                            isLoading={loadState.status === 'loading'}
                                            showSchedulingPanel={false}
                                            showAvailableDoctors={false}
                                            title="Completed Patient List"
                                            fullHeight
                                        />
                                    </AssistantPanelShell>
                                ) : null}

                                {activeTab === 'schedule' ? (
                                    <AssistantPanelShell className="flex h-full min-h-0 flex-col overflow-hidden">
                                        <AssistantSidebar
                                            availableDoctors={availableDoctors}
                                            patientOptions={patientOptions}
                                            scheduleForm={scheduleForm}
                                            onScheduleFormChange={setScheduleForm}
                                            onScheduleAppointment={scheduleAppointment}
                                            onResetScheduleForm={resetScheduleForm}
                                            scheduleFieldErrors={scheduleFieldErrors}
                                            canCreateAppointments={canCreateAppointmentsInWorkflow}
                                            appointmentActionDisabledReason={appointmentActionDisabledReason}
                                            isScheduling={scheduleAppointmentState.status === 'pending'}
                                            completedSearch={completedSearch}
                                            onCompletedSearchChange={setCompletedSearch}
                                            filteredCompleted={filteredCompleted}
                                            onOpenProfile={popup.openProfile}
                                            isLoading={loadState.status === 'loading'}
                                            showSchedulingPanel
                                            showAvailableDoctors={false}
                                            showCompletedList={false}
                                            fullHeight
                                        />
                                    </AssistantPanelShell>
                                ) : null}
                            </div>
                        </div>
                    </div>
                </ViewportBody>
            </ViewportFrame>
            <PatientProfileModal profileId={popup.selectedProfileId || ''} onClose={popup.closeProfile} />
        </ViewportPage>
    );
}
