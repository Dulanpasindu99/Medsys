'use client';

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
        filteredCompleted,
        addPatient,
        addAllergy,
        markDoneAndNext,
        syncError,
    } = useAssistantWorkflow();
    const popup = usePatientProfilePopup();

    return (
        <section id="assistant" className="relative isolate flex min-h-screen items-start justify-center px-4 py-8 text-slate-900">
            <div className="flex w-full flex-col gap-6 lg:flex-row lg:items-start">
                <div className="ios-surface w-full flex-1 overflow-hidden rounded-[30px] ring-1 ring-slate-100/80">
                    <div className="relative flex flex-1 flex-col px-6 py-8 lg:px-10">
                        <div className="mx-auto flex w-full flex-col gap-6">
                            <div className="flex-1 space-y-6">
                                <AssistantHeader stats={stats} />
                                {syncError ? (
                                    <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 ring-1 ring-rose-100">
                                        {syncError}
                                    </p>
                                ) : null}

                                <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_2.2fr_1fr]">
                                    <AssistantPanelShell>
                                        <AssistantIntakePanel formState={formState} setFormState={setFormState} addAllergy={addAllergy} addPatient={addPatient} />
                                    </AssistantPanelShell>

                                    <AssistantPanelShell>
                                        <AssistantPickupPanel
                                            activePrescription={activePrescription}
                                            queueCount={pendingPatients.length}
                                            onDoneAndNext={markDoneAndNext}
                                        />
                                    </AssistantPanelShell>

                                    <AssistantPanelShell>
                                        <AssistantSidebar
                                            availableDoctors={availableDoctors}
                                            completedSearch={completedSearch}
                                            onCompletedSearchChange={setCompletedSearch}
                                            filteredCompleted={filteredCompleted}
                                            onOpenProfile={popup.openProfile}
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
