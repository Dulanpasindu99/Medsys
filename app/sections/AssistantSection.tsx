'use client';

import { AsyncNotice } from '../components/ui/AsyncStatePanel';
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
        loadState,
        createPatientState,
        createPatientFeedback,
        scheduleAppointmentState,
        scheduleAppointmentFeedback,
        dispenseState,
        dispenseFeedback,
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
        <section id="assistant" className="relative isolate flex min-h-screen items-start justify-center px-4 py-8 text-slate-900">
            <div className="flex w-full flex-col gap-6 lg:flex-row lg:items-start">
                <div className="ios-surface w-full flex-1 overflow-hidden rounded-[30px] ring-1 ring-slate-100/80">
                    <div className="relative flex flex-1 flex-col px-6 py-8 lg:px-10">
                        <div className="mx-auto flex w-full flex-col gap-6">
                            <div className="flex-1 space-y-6">
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
                                {loadState.error ? <AsyncNotice tone="error" message={loadState.error} /> : null}
                                {loadState.notice ? <AsyncNotice tone="warning" message={loadState.notice} /> : null}
                                {!canManageAssistantWorkflow && workflowActionDisabledReason ? (
                                    <AsyncNotice tone="warning" message={workflowActionDisabledReason} />
                                ) : null}
                                {createPatientFeedback ? <AsyncNotice tone={createPatientFeedback.tone} message={createPatientFeedback.message} /> : null}
                                {scheduleAppointmentFeedback ? <AsyncNotice tone={scheduleAppointmentFeedback.tone} message={scheduleAppointmentFeedback.message} /> : null}
                                {dispenseFeedback ? <AsyncNotice tone={dispenseFeedback.tone} message={dispenseFeedback.message} /> : null}

                                <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_2.2fr_1fr]">
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
                                            queueCount={pendingPatients.length}
                                            onDoneAndNext={markDoneAndNext}
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
                                        />
                                    </AssistantPanelShell>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <PatientProfileModal profileId={popup.selectedProfileId || ''} onClose={popup.closeProfile} />
        </section>
    );
}
