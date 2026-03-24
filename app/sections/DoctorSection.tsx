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
    patientFirstName,
    setPatientFirstName,
    patientLastName,
    setPatientLastName,
    patientDateOfBirth,
    setPatientDateOfBirth,
    patientCode,
    nicNumber,
    nicIdentityLabel,
    setNicNumber,
    phoneNumber,
    setPhoneNumber,
    gender,
    setGender,
    guardianName,
    setGuardianName,
    guardianNic,
    setGuardianNic,
    guardianPhone,
    setGuardianPhone,
    guardianRelationship,
    setGuardianRelationship,
    guardianMode,
    setGuardianMode,
    guardianDateOfBirth,
    setGuardianDateOfBirth,
    guardianGender,
    setGuardianGender,
    guardianSearch,
    setGuardianSearch,
    guardianSearchMatches,
    selectedGuardian,
    handleGuardianSelect,
    patientLookupNotice,
    isCreatingPatientInline,
    requiresGuardianDetails,
    handleSearchCommit,
    searchMatches,
    selectedPatientProfileId,
    selectedPatientLabel,
    patientVitals,
    patientAllergies,
    consultationAllergies,
    vitalDrafts,
    setVitalDraft,
    canEditVitals,
    vitalsDisabledReason,
    vitalsFeedback,
    allergyDraftName,
    setAllergyNameDraft,
    allergyDraftSeverity,
    setAllergySeverityDraft,
    handleEditAllergy,
    handleClearAllergyDraft,
    canEditAllergies,
    allergiesDisabledReason,
    allergyFeedback,
    handleAddOrUpdateAllergy,
    removeConsultationAllergy,
    queueState,
    patientDetailsState,
    canSaveRecord,
    saveDisabledReason,
    selectedAppointmentStatus,
    workflowType,
    workflowStatusLabel,
    dispenseStatusLabel,
    lastClinicalItemCount,
    lastOutsideItemCount,
    canDirectDispense,
    directDispenseDisabledReason,
    saveState,
    saveFeedback,
    handlePatientSelect,
    handleSaveRecord,
    handleSaveAndComplete,
    handlePrintPrescription,
    canPrintPrescription,
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
      className="flex h-[100dvh] min-h-[100dvh] overflow-hidden items-stretch justify-center px-2 py-2 text-slate-900 sm:px-3 sm:py-3 xl:px-4 xl:py-4"
    >
      <div className="h-full w-full max-w-[2200px] flex-1 overflow-hidden rounded-[24px] border border-white/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.94)_0%,rgba(241,245,249,0.96)_42%,rgba(219,234,254,0.94)_100%)] shadow-[0_18px_42px_rgba(28,63,99,0.12)] ring-1 ring-sky-50/80 backdrop-blur-xl sm:rounded-[28px]">
        <div className="relative flex h-full flex-1 flex-col p-2 sm:p-3 xl:p-4">
          <div className="col-span-12 space-y-3">
            {queueState.error ? (
              <AsyncNotice tone="error" message={queueState.error} />
            ) : null}
            {queueState.notice ? (
              <AsyncNotice tone="warning" message={queueState.notice} />
            ) : null}
            {queueState.status === "empty" ? (
              <AsyncNotice
                tone="warning"
                message="No active queue visits are available right now. You can still search a patient and start a walk-in visit."
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
          <div className="mx-auto flex min-h-0 w-full flex-1">
            <div className="grid h-full min-h-0 w-full grid-cols-12 items-stretch gap-3 xl:gap-4">
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
                consultationAllergies={consultationAllergies}
                onRemoveConsultationAllergy={removeConsultationAllergy}
                vitalDrafts={vitalDrafts}
                onVitalDraftChange={setVitalDraft}
                canEditVitals={canEditVitals}
                vitalsDisabledReason={vitalsDisabledReason}
                vitalsFeedback={vitalsFeedback}
                allergyDraftName={allergyDraftName}
                onAllergyDraftNameChange={setAllergyNameDraft}
                allergyDraftSeverity={allergyDraftSeverity}
                onAllergyDraftSeverityChange={setAllergySeverityDraft}
                onEditAllergy={handleEditAllergy}
                onClearAllergyDraft={handleClearAllergyDraft}
                canEditAllergies={canEditAllergies}
                allergiesDisabledReason={allergiesDisabledReason}
                allergyFeedback={allergyFeedback}
                onAddOrUpdateAllergy={handleAddOrUpdateAllergy}
                onSaveRecord={handleSaveRecord}
                onSaveAndComplete={handleSaveAndComplete}
                onPrintPrescription={handlePrintPrescription}
                selectedAppointmentStatus={selectedAppointmentStatus}
                workflowType={workflowType}
                workflowStatusLabel={workflowStatusLabel}
                dispenseStatusLabel={dispenseStatusLabel}
                lastClinicalItemCount={lastClinicalItemCount}
                lastOutsideItemCount={lastOutsideItemCount}
                canDirectDispense={canDirectDispense}
                canPrintPrescription={canPrintPrescription}
                directDispenseDisabledReason={directDispenseDisabledReason}
                canSaveRecord={canSaveRecord}
                saveDisabledReason={saveDisabledReason}
                saveFeedback={saveFeedback}
                isSavingRecord={saveState.status === "pending"}
                showDraftEditors={isCreatingPatientInline}
              />
              <DoctorWorkspace
                profileId={popup.selectedProfileId || ""}
                onCloseProfile={popup.closeProfile}
                search={search}
                onSearchChange={setSearch}
                onSearchCommit={handleSearchCommit}
                searchMatches={searchMatches}
                onSearchSelect={handlePatientSelect}
                isCreatingPatientInline={isCreatingPatientInline}
                patientLookupNotice={patientLookupNotice}
                selectedPatientProfileId={selectedPatientProfileId}
                patientCode={patientCode}
                nicNumber={nicNumber}
                onNicNumberChange={setNicNumber}
                phoneNumber={phoneNumber}
                onPhoneNumberChange={setPhoneNumber}
                gender={gender}
                onGenderChange={setGender}
                patientName={patientName}
                patientFirstName={patientFirstName}
                onPatientFirstNameChange={setPatientFirstName}
                patientLastName={patientLastName}
                onPatientLastNameChange={setPatientLastName}
                patientDateOfBirth={patientDateOfBirth}
                onPatientDateOfBirthChange={setPatientDateOfBirth}
                guardianName={guardianName}
                onGuardianNameChange={setGuardianName}
                guardianNic={guardianNic}
                onGuardianNicChange={setGuardianNic}
                guardianPhone={guardianPhone}
                onGuardianPhoneChange={setGuardianPhone}
                guardianRelationship={guardianRelationship}
                onGuardianRelationshipChange={setGuardianRelationship}
                guardianMode={guardianMode}
                onGuardianModeChange={setGuardianMode}
                guardianDateOfBirth={guardianDateOfBirth}
                onGuardianDateOfBirthChange={setGuardianDateOfBirth}
                guardianGender={guardianGender}
                onGuardianGenderChange={setGuardianGender}
                guardianSearch={guardianSearch}
                onGuardianSearchChange={setGuardianSearch}
                guardianSearchMatches={guardianSearchMatches}
                selectedGuardian={selectedGuardian}
                onGuardianSelect={handleGuardianSelect}
                requiresGuardianDetails={requiresGuardianDetails}
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
