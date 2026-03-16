import { AsyncNotice } from "../../../components/ui/AsyncStatePanel";
import { AssistantIntakePanel } from "../../assistant/components/AssistantIntakePanel";
import { AssistantPanelShell } from "../../assistant/components/AssistantPanelShell";
import { AssistantPickupPanel } from "../../assistant/components/AssistantPickupPanel";
import { AssistantSidebar } from "../../assistant/components/AssistantSidebar";
import type { useAssistantWorkflow } from "../../assistant/hooks/useAssistantWorkflow";

type AssistantWorkflowState = ReturnType<typeof useAssistantWorkflow>;

type DoctorAssistantCoverageProps = {
  workflow: AssistantWorkflowState;
  onOpenProfile: (profileId?: string | null) => void;
};

export function DoctorAssistantCoverage({
  workflow,
  onOpenProfile,
}: DoctorAssistantCoverageProps) {
  const hasAssistantCoverage =
    workflow.canManageAssistantWorkflow || workflow.canCreateAppointmentsInWorkflow;

  if (!hasAssistantCoverage) {
    return null;
  }

  return (
    <div className="col-span-12 space-y-4">
      <div className="rounded-[28px] border border-emerald-100 bg-emerald-50/80 px-6 py-5 text-emerald-950 shadow-[0_18px_40px_rgba(5,150,105,0.08)] ring-1 ring-emerald-100">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
              Assistant Coverage
            </p>
            <h2 className="mt-1 text-2xl font-bold">
              Assistant tasks are enabled for this doctor account
            </h2>
          </div>
          <span className="rounded-full bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700 ring-1 ring-emerald-200">
            Shared duty mode
          </span>
        </div>
        <p className="mt-3 max-w-3xl text-sm text-emerald-900/80">
          Use these panels when the doctor is covering intake, scheduling, dispensing, or other
          assistant responsibilities from the same workspace.
        </p>
      </div>

      {workflow.loadState.error ? <AsyncNotice tone="error" message={workflow.loadState.error} /> : null}
      {workflow.loadState.notice ? <AsyncNotice tone="warning" message={workflow.loadState.notice} /> : null}
      {workflow.createPatientFeedback ? (
        <AsyncNotice
          tone={workflow.createPatientFeedback.tone}
          message={workflow.createPatientFeedback.message}
        />
      ) : null}
      {workflow.scheduleAppointmentFeedback ? (
        <AsyncNotice
          tone={workflow.scheduleAppointmentFeedback.tone}
          message={workflow.scheduleAppointmentFeedback.message}
        />
      ) : null}
      {workflow.dispenseFeedback ? (
        <AsyncNotice
          tone={workflow.dispenseFeedback.tone}
          message={workflow.dispenseFeedback.message}
        />
      ) : null}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_2fr_1fr]">
        <AssistantPanelShell>
          <AssistantIntakePanel
            formState={workflow.formState}
            setFormState={workflow.setFormState}
            addAllergy={workflow.addAllergy}
            addPatient={workflow.addPatient}
            canManageAssistantWorkflow={workflow.canManageAssistantWorkflow}
            workflowActionDisabledReason={workflow.workflowActionDisabledReason}
            isSubmitting={workflow.createPatientState.status === "pending"}
          />
        </AssistantPanelShell>

        <AssistantPanelShell>
          <AssistantPickupPanel
            activePrescription={workflow.activePrescription}
            queueCount={workflow.pendingPatients.length}
            onDoneAndNext={workflow.markDoneAndNext}
            canManageAssistantWorkflow={workflow.canManageAssistantWorkflow}
            workflowActionDisabledReason={workflow.workflowActionDisabledReason}
            isSubmitting={workflow.dispenseState.status === "pending"}
            isLoading={workflow.loadState.status === "loading"}
          />
        </AssistantPanelShell>

        <AssistantPanelShell>
          <AssistantSidebar
            availableDoctors={workflow.availableDoctors}
            patientOptions={workflow.patientOptions}
            scheduleForm={workflow.scheduleForm}
            onScheduleFormChange={workflow.setScheduleForm}
            onScheduleAppointment={workflow.scheduleAppointment}
            canCreateAppointments={workflow.canCreateAppointmentsInWorkflow}
            appointmentActionDisabledReason={workflow.appointmentActionDisabledReason}
            isScheduling={workflow.scheduleAppointmentState.status === "pending"}
            completedSearch={workflow.completedSearch}
            onCompletedSearchChange={workflow.setCompletedSearch}
            filteredCompleted={workflow.filteredCompleted}
            onOpenProfile={onOpenProfile}
            isLoading={workflow.loadState.status === "loading"}
          />
        </AssistantPanelShell>
      </div>
    </div>
  );
}
