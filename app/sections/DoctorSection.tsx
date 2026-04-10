"use client";

import { useMemo } from "react";
import { ViewportBody, ViewportFrame, ViewportPage } from "../components/ui/ViewportLayout";
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
    familyOptions,
    selectedFamilyId,
    setSelectedFamilyId,
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
    waitingQueuePatients,
    selectedPatientProfileId,
    selectedPatientLabel,
    patientVitals,
    patientAllergies,
    consultationAllergies,
    vitalDrafts,
    setVitalDraft,
    temperatureUnit,
    setTemperatureUnit,
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
  const selectedStatusLabel =
    selectedAppointmentStatus
      ? selectedAppointmentStatus.replace("_", " ")
      : selectedPatientProfileId
        ? "ready"
        : isCreatingPatientInline
          ? "draft"
          : "No selection";

  return (
    <ViewportPage className="h-full min-h-0 text-slate-900">
      <ViewportFrame className="h-full max-w-[2200px] bg-[linear-gradient(135deg,rgba(255,255,255,0.94)_0%,rgba(241,245,249,0.96)_42%,rgba(219,234,254,0.94)_100%)] shadow-[0_18px_42px_rgba(28,63,99,0.12)] ring-sky-50/80 sm:rounded-[28px]">
        <ViewportBody className="relative overflow-y-auto p-2 sm:p-3 lg:overflow-hidden xl:p-4">
          <div className="mx-auto flex min-h-0 w-full flex-1">
            <div className="grid min-h-0 w-full flex-1 grid-cols-12 items-start gap-3 lg:items-stretch lg:gap-4">
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
                temperatureUnit={temperatureUnit}
                onTemperatureUnitChange={setTemperatureUnit}
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
                selectedAppointmentStatus={selectedAppointmentStatus}
                showDraftEditors={isCreatingPatientInline}
              />
              <DoctorWorkspace
                profileId={popup.selectedProfileId || ""}
                onCloseProfile={popup.closeProfile}
                search={search}
                onSearchChange={setSearch}
                onSearchCommit={handleSearchCommit}
                searchMatches={searchMatches}
                waitingQueuePatients={waitingQueuePatients}
                onSearchSelect={handlePatientSelect}
                isCreatingPatientInline={isCreatingPatientInline}
                patientLookupNotice={patientLookupNotice}
                selectedPatientProfileId={selectedPatientProfileId}
                workflowType={workflowType}
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
                familyOptions={familyOptions}
                selectedFamilyId={selectedFamilyId}
                onSelectedFamilyIdChange={setSelectedFamilyId}
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
                onSaveRecord={handleSaveRecord}
                onSaveAndComplete={handleSaveAndComplete}
                onPrintPrescription={handlePrintPrescription}
                selectedStatusLabel={selectedStatusLabel}
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
                saveState={saveState}
              />
            </div>
          </div>
        </ViewportBody>
      </ViewportFrame>
    </ViewportPage>
  );
}
