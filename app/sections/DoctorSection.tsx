"use client";

import { useMemo } from "react";
import { AsyncNotice } from "../components/ui/AsyncStatePanel";
import { usePatientProfilePopup } from "../hooks/usePatientProfilePopup";
import { canAccessRoute } from "../lib/authorization";
import { useCurrentUserQuery } from "../lib/query-hooks";
import { DoctorSidebar } from "./doctor/components/DoctorSidebar";
import { DoctorWorkspace } from "./doctor/components/DoctorWorkspace";
import { useDoctorClinicalWorkflow } from "./doctor/hooks/useDoctorClinicalWorkflow";
import { useDoctorWorkspaceData } from "./doctor/hooks/useDoctorWorkspaceData";
import { useVisitPlanner } from "./doctor/hooks/useVisitPlanner";

export default function DoctorSection() {
  const clinicalWorkflow = useDoctorClinicalWorkflow();
  const visitPlanner = useVisitPlanner();
  const currentUserQuery = useCurrentUserQuery();
  const {
    search,
    setSearch,
    patientName,
    setPatientName,
    patientAge,
    setPatientAge,
    patientCode,
    patientLookupNotice,
    nicNumber,
    nicIdentityLabel,
    gender,
    setGender,
    handleSearchCommit,
    searchMatches,
    selectedPatientProfileId,
    selectedPatientLabel,
    patientVitals,
    patientAllergies,
    vitalDrafts,
    setVitalDraft,
    canEditVitals,
    vitalsDisabledReason,
    vitalsFeedback,
    handleSaveVitals,
    allergyDraftName,
    setAllergyNameDraft,
    allergyDraftSeverity,
    setAllergySeverityDraft,
    canEditAllergies,
    allergiesDisabledReason,
    allergyFeedback,
    handleAddOrUpdateAllergy,
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
  const canOpenAssistantRegistration =
    !!currentUserQuery.data &&
    canAccessRoute(currentUserQuery.data, "assistantWorkspace");
  const assistantRegistrationHref = useMemo(
    () =>
      !canOpenAssistantRegistration
        ? null
        : search.trim()
          ? `/assistant?returnTo=${encodeURIComponent("/")}&search=${encodeURIComponent(search.trim())}`
          : "/assistant",
    [canOpenAssistantRegistration, search],
  );

  return (
    <section
      id="doctor"
      className="flex min-h-screen items-start justify-center px-4 py-4 text-slate-900"
    >
      <div className="w-full flex-1 overflow-hidden rounded-[28px] border border-white/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.94)_0%,rgba(241,245,249,0.96)_42%,rgba(219,234,254,0.94)_100%)] shadow-[0_18px_42px_rgba(28,63,99,0.12)] ring-1 ring-sky-50/80 backdrop-blur-xl">
        <div className="relative flex flex-1 flex-col p-4">
          <div className="mx-auto flex w-full flex-1">
            <div className="grid w-full grid-cols-12 items-stretch gap-4">
              <div className="col-span-12 space-y-4">
                {queueState.error ? (
                  <AsyncNotice tone="error" message={queueState.error} />
                ) : null}
                {queueState.notice ? (
                  <AsyncNotice tone="warning" message={queueState.notice} />
                ) : null}
                {queueState.status === "empty" ? (
                  <AsyncNotice
                    tone="warning"
                    message="No waiting appointments are available in the doctor queue right now."
                  />
                ) : null}
                {patientDetailsState.notice ? (
                  <AsyncNotice
                    tone="warning"
                    message={patientDetailsState.notice}
                  />
                ) : null}
                {patientDetailsState.error ? (
                  <AsyncNotice
                    tone="warning"
                    message={patientDetailsState.error}
                  />
                ) : null}
              </div>
              <DoctorSidebar
                selectedPatientLabel={selectedPatientLabel}
                selectedPatientProfileId={selectedPatientProfileId}
                patientLookupNotice={patientLookupNotice}
                assistantRegistrationHref={assistantRegistrationHref}
                onOpenPatientHistory={() =>
                  popup.openProfile(selectedPatientProfileId)
                }
                patientVitals={patientVitals}
                patientAllergies={patientAllergies}
                vitalDrafts={vitalDrafts}
                onVitalDraftChange={setVitalDraft}
                canEditVitals={canEditVitals}
                vitalsDisabledReason={vitalsDisabledReason}
                vitalsFeedback={vitalsFeedback}
                onSaveVitals={handleSaveVitals}
                allergyDraftName={allergyDraftName}
                onAllergyDraftNameChange={setAllergyNameDraft}
                allergyDraftSeverity={allergyDraftSeverity}
                onAllergyDraftSeverityChange={setAllergySeverityDraft}
                canEditAllergies={canEditAllergies}
                allergiesDisabledReason={allergiesDisabledReason}
                allergyFeedback={allergyFeedback}
                onAddOrUpdateAllergy={handleAddOrUpdateAllergy}
                onStartConsultation={handleStartConsultation}
                onSaveRecord={handleSaveRecord}
                canTransitionAppointments={canTransitionAppointments}
                selectedAppointmentStatus={selectedAppointmentStatus}
                transitionDisabledReason={transitionDisabledReason}
                transitionFeedback={transitionFeedback}
                isTransitioningAppointment={
                  transitionState.status === "pending"
                }
                canSaveRecord={canSaveRecord}
                saveDisabledReason={saveDisabledReason}
                saveFeedback={saveFeedback}
                isSavingRecord={saveState.status === "pending"}
              />
              <DoctorWorkspace
                profileId={popup.selectedProfileId || ""}
                onCloseProfile={popup.closeProfile}
                search={search}
                onSearchChange={setSearch}
                onSearchCommit={handleSearchCommit}
                searchMatches={searchMatches}
                onSearchSelect={handlePatientSelect}
                patientCode={patientCode}
                nicNumber={nicNumber}
                gender={gender}
                onGenderChange={setGender}
                patientName={patientName}
                onPatientNameChange={setPatientName}
                patientAge={patientAge}
                onPatientAgeChange={setPatientAge}
                nicIdentityLabel={nicIdentityLabel}
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
