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
    setPatientCode,
    patientLookupNotice,
    nicNumber,
    setNicNumber,
    gender,
    setGender,
    handlePatientCodeCommit,
    handleNicLookupCommit,
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
      className="flex min-h-screen items-start justify-center px-4 py-8 text-slate-900"
    >
      <div className="w-full flex-1 overflow-hidden rounded-[28px] border border-white/70 bg-white/80 shadow-[0_18px_42px_rgba(28,63,99,0.12)] ring-1 ring-sky-50/80 backdrop-blur-xl">
        <div className="relative flex flex-1 flex-col p-8">
          <div className="mx-auto flex w-full flex-1">
            <div className="grid w-full grid-cols-12 items-stretch gap-6">
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
                search={search}
                onSearchChange={setSearch}
                searchMatches={searchMatches}
                assistantRegistrationHref={assistantRegistrationHref}
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
                patientCode={patientCode}
                onPatientCodeChange={setPatientCode}
                onPatientCodeCommit={handlePatientCodeCommit}
                nicNumber={nicNumber}
                onNicNumberChange={setNicNumber}
                onNicLookupCommit={handleNicLookupCommit}
                gender={gender}
                onGenderChange={setGender}
                patientName={patientName}
                onPatientNameChange={setPatientName}
                patientAge={patientAge}
                onPatientAgeChange={setPatientAge}
                patientLookupNotice={patientLookupNotice}
                patientLookupActionHref={assistantRegistrationHref}
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
