'use client';

import { ViewportBody, ViewportFrame, ViewportPage, ViewportScrollBody } from '../components/ui/ViewportLayout';
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
        scheduleForm,
        setScheduleForm,
        scheduleAppointment,
        markDoneAndNext,
        canSubmitDispense,
        dispenseActionDisabledReason,
        setResolvedInventoryItem,
        loadState,
        createPatientState,
        scheduleAppointmentState,
        dispenseState,
        canManageAssistantWorkflow,
        canCreatePatientsInWorkflow,
        patientActionDisabledReason,
        workflowActionDisabledReason,
        canCreateAppointmentsInWorkflow,
        appointmentActionDisabledReason,
        reload,
    } = useAssistantWorkflow();
    const popup = usePatientProfilePopup();

    return (
        <ViewportPage className="relative isolate text-slate-900">
            <ViewportFrame>
                <ViewportBody className="px-4 py-5 sm:px-6 sm:py-6 lg:px-10">
                    <ViewportScrollBody className="pr-0">
                        <div className="mx-auto flex w-full flex-col gap-6 pb-1">
                            <div className="space-y-6">
                                <div className="flex flex-col gap-3">
                                    <AssistantHeader stats={stats} />
                                    <div className="flex flex-wrap gap-3">
                                        <button
                                            type="button"
                                            onClick={reload}
                                            disabled={loadState.status === 'loading'}
                                            className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
                                        >
                                            {loadState.status === 'loading' ? 'Refreshing...' : 'Refresh assistant data'}
                                        </button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 gap-8 xl:grid-cols-[1fr_1.92fr_1.16fr]">
                                    <AssistantPanelShell>
                                        <AssistantIntakePanel
                                            formState={formState}
                                            setFormState={setFormState}
                                            patientOptions={patientOptions}
                                            familyOptions={familyOptions}
                                            addAllergy={addAllergy}
                                            addPatient={addPatient}
                                            canCreatePatients={canCreatePatientsInWorkflow}
                                            patientActionDisabledReason={patientActionDisabledReason}
                                            isSubmitting={createPatientState.status === 'pending'}
                                        />
                                    </AssistantPanelShell>

                                    <AssistantPanelShell>
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

                                    <AssistantPanelShell>
                                        <AssistantSidebar
                                            availableDoctors={availableDoctors}
                                            patientOptions={patientOptions}
                                            scheduleForm={scheduleForm}
                                            onScheduleFormChange={setScheduleForm}
                                            onScheduleAppointment={scheduleAppointment}
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
                                        />
                                    </AssistantPanelShell>
                                </div>
                            </div>
                        </div>
                    </ViewportScrollBody>
                </ViewportBody>
            </ViewportFrame>
            <PatientProfileModal profileId={popup.selectedProfileId || ''} onClose={popup.closeProfile} />
        </ViewportPage>
    );
}
