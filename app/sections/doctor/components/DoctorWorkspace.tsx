import { useState } from "react";
import { PatientProfileModal } from '../../../components/PatientProfileModal';
import type { GuardianCaptureMode, Patient, PatientGender } from '../types';
import { DoctorHeader } from './DoctorHeader';
import { DiseaseSearch } from './DiseaseSearch';
import { RxEditor } from './RxEditor';
import { VisitPlanner } from './VisitPlanner';
import type { useDoctorClinicalWorkflow } from '../hooks/useDoctorClinicalWorkflow';
import type { useVisitPlanner } from '../hooks/useVisitPlanner';

type ClinicalWorkflow = ReturnType<typeof useDoctorClinicalWorkflow>;
type VisitPlannerState = ReturnType<typeof useVisitPlanner>;

type DoctorWorkspaceProps = {
    profileId: string;
    onCloseProfile: () => void;
    search: string;
    onSearchChange: (value: string) => void;
    onSearchCommit: () => void;
    searchMatches: Patient[];
    waitingQueuePatients: Patient[];
    onSearchSelect: (patient: Patient) => void;
    isCreatingPatientInline: boolean;
    patientLookupNotice?: string | null;
    selectedPatientProfileId?: string | null;
    workflowType?: "appointment" | "walk_in";
    patientCode: string;
    nicNumber: string;
    onNicNumberChange: (value: string) => void;
    phoneNumber: string;
    onPhoneNumberChange: (value: string) => void;
    gender: PatientGender;
    onGenderChange: (value: PatientGender) => void;
    patientName: string;
    patientFirstName: string;
    onPatientFirstNameChange: (value: string) => void;
    patientLastName: string;
    onPatientLastNameChange: (value: string) => void;
    patientDateOfBirth: string;
    onPatientDateOfBirthChange: (value: string) => void;
    guardianName: string;
    onGuardianNameChange: (value: string) => void;
    guardianNic: string;
    onGuardianNicChange: (value: string) => void;
    guardianPhone: string;
    onGuardianPhoneChange: (value: string) => void;
    guardianRelationship: string;
    onGuardianRelationshipChange: (value: string) => void;
    guardianMode: GuardianCaptureMode;
    onGuardianModeChange: (value: GuardianCaptureMode) => void;
    guardianDateOfBirth: string;
    onGuardianDateOfBirthChange: (value: string) => void;
    guardianGender: PatientGender;
    onGuardianGenderChange: (value: PatientGender) => void;
    guardianSearch: string;
    onGuardianSearchChange: (value: string) => void;
    guardianSearchMatches: Patient[];
    selectedGuardian: Patient | null;
    onGuardianSelect: (patient: Patient) => void;
    requiresGuardianDetails: boolean;
    nicIdentityLabel?: "Patient NIC" | "Guardian NIC" | null;
    clinicalWorkflow: ClinicalWorkflow;
    visitPlanner: VisitPlannerState;
};

export function DoctorWorkspace({
    profileId,
    onCloseProfile,
    search,
    onSearchChange,
    onSearchCommit,
    searchMatches,
    waitingQueuePatients,
    onSearchSelect,
    isCreatingPatientInline,
    patientLookupNotice = null,
    selectedPatientProfileId = null,
    workflowType = "walk_in",
    patientCode,
    nicNumber,
    onNicNumberChange,
    phoneNumber,
    onPhoneNumberChange,
    gender,
    onGenderChange,
    patientName,
    patientFirstName,
    onPatientFirstNameChange,
    patientLastName,
    onPatientLastNameChange,
    patientDateOfBirth,
    onPatientDateOfBirthChange,
    guardianName,
    onGuardianNameChange,
    guardianNic,
    onGuardianNicChange,
    guardianPhone,
    onGuardianPhoneChange,
    guardianRelationship,
    onGuardianRelationshipChange,
    guardianMode,
    onGuardianModeChange,
    guardianDateOfBirth,
    onGuardianDateOfBirthChange,
    guardianGender,
    onGuardianGenderChange,
    guardianSearch,
    onGuardianSearchChange,
    guardianSearchMatches,
    selectedGuardian,
    onGuardianSelect,
    requiresGuardianDetails,
    nicIdentityLabel = null,
    clinicalWorkflow,
    visitPlanner,
}: DoctorWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<"clinical" | "prescription" | "notes">("clinical");

  return (
        <div className="order-1 col-span-12 flex h-auto min-h-0 flex-col lg:col-span-8 lg:h-full 2xl:col-span-9">
            <div className="flex h-auto min-h-0 flex-col gap-2 rounded-[24px] border border-white/70 bg-white/80 p-2.5 shadow-[0_24px_60px_rgba(14,116,144,0.12)] ring-1 ring-sky-50/80 backdrop-blur-xl sm:rounded-[28px] sm:p-3 lg:h-full lg:gap-3 lg:p-4">
                <PatientProfileModal profileId={profileId} onClose={onCloseProfile} />

                <DoctorHeader
                    search={search}
                    onSearchChange={onSearchChange}
                    onSearchCommit={onSearchCommit}
                    searchMatches={searchMatches}
                    waitingQueuePatients={waitingQueuePatients}
                    onSearchSelect={onSearchSelect}
                    isCreatingPatientInline={isCreatingPatientInline}
                    patientLookupNotice={patientLookupNotice}
                    selectedPatientProfileId={selectedPatientProfileId}
                    workflowType={workflowType}
                    patientCode={patientCode}
                    nicNumber={nicNumber}
                    onNicNumberChange={onNicNumberChange}
                    phoneNumber={phoneNumber}
                    onPhoneNumberChange={onPhoneNumberChange}
                    gender={gender}
                    onGenderChange={onGenderChange}
                    patientName={patientName}
                    patientFirstName={patientFirstName}
                    onPatientFirstNameChange={onPatientFirstNameChange}
                    patientLastName={patientLastName}
                    onPatientLastNameChange={onPatientLastNameChange}
                    patientDateOfBirth={patientDateOfBirth}
                    onPatientDateOfBirthChange={onPatientDateOfBirthChange}
                    guardianName={guardianName}
                    onGuardianNameChange={onGuardianNameChange}
                    guardianNic={guardianNic}
                    onGuardianNicChange={onGuardianNicChange}
                    guardianPhone={guardianPhone}
                    onGuardianPhoneChange={onGuardianPhoneChange}
                    guardianRelationship={guardianRelationship}
                    onGuardianRelationshipChange={onGuardianRelationshipChange}
                    guardianMode={guardianMode}
                    onGuardianModeChange={onGuardianModeChange}
                    guardianDateOfBirth={guardianDateOfBirth}
                    onGuardianDateOfBirthChange={onGuardianDateOfBirthChange}
                    guardianGender={guardianGender}
                    onGuardianGenderChange={onGuardianGenderChange}
                    guardianSearch={guardianSearch}
                    onGuardianSearchChange={onGuardianSearchChange}
                    guardianSearchMatches={guardianSearchMatches}
                    selectedGuardian={selectedGuardian}
                    onGuardianSelect={onGuardianSelect}
                    requiresGuardianDetails={requiresGuardianDetails}
                    nicIdentityLabel={nicIdentityLabel}
                />

                <div className="mobile-visible-x-scroll flex flex-nowrap items-center gap-2 overflow-x-auto border-t border-slate-100 pt-2 pb-1 lg:flex-wrap lg:overflow-visible lg:pb-0">
                    {[
                        { key: "clinical", label: "Clinical" },
                        { key: "prescription", label: "Prescription" },
                        { key: "notes", label: "Notes" },
                    ].map((tab) => (
                        <button
                            key={tab.key}
                            type="button"
                            onClick={() => setActiveTab(tab.key as "clinical" | "prescription" | "notes")}
                            className={`shrink-0 rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] transition lg:px-4 lg:py-2 lg:text-[11px] lg:tracking-[0.14em] ${
                                activeTab === tab.key
                                    ? "bg-slate-800 text-white shadow-md"
                                    : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="min-h-0 flex-1 overflow-visible lg:overflow-y-auto lg:pr-1">
                    {activeTab === "clinical" ? (
                        <DiseaseSearch
                            diseaseQuery={clinicalWorkflow.diseaseQuery}
                            setDiseaseQuery={clinicalWorkflow.setDiseaseQuery}
                            handleDiseaseKeyDown={clinicalWorkflow.handleDiseaseKeyDown}
                            isFetchingDiseases={clinicalWorkflow.isFetchingDiseases}
                            diseaseSuggestions={clinicalWorkflow.diseaseSuggestions}
                            highlightedDiseaseIndex={clinicalWorkflow.highlightedDiseaseIndex}
                            addDisease={clinicalWorkflow.addDisease}
                            selectedDiseases={clinicalWorkflow.selectedDiseases}
                            togglePersistAsCondition={clinicalWorkflow.togglePersistAsCondition}
                            chipsPendingRemoval={clinicalWorkflow.chipsPendingRemoval}
                            toggleChipRemovalState={clinicalWorkflow.toggleChipRemovalState}
                            testQuery={clinicalWorkflow.testQuery}
                            setTestQuery={clinicalWorkflow.setTestQuery}
                            handleMedicalTestKeyDown={clinicalWorkflow.handleMedicalTestKeyDown}
                            isFetchingTests={clinicalWorkflow.isFetchingTests}
                            testSearchFeedback={clinicalWorkflow.testSearchFeedback}
                            filteredTestOptions={clinicalWorkflow.filteredTestOptions}
                            highlightedTestIndex={clinicalWorkflow.highlightedTestIndex}
                            addMedicalTest={clinicalWorkflow.addMedicalTest}
                            selectedTests={clinicalWorkflow.selectedTests}
                            testChipsPendingRemoval={clinicalWorkflow.testChipsPendingRemoval}
                            toggleTestChipRemovalState={clinicalWorkflow.toggleTestChipRemovalState}
                            recommendedTests={clinicalWorkflow.recommendedTests}
                            addRecommendedTests={clinicalWorkflow.addRecommendedTests}
                        />
                    ) : null}

                    {activeTab === "prescription" ? (
                        <RxEditor
                            rxRows={clinicalWorkflow.rxRows}
                            clinicalDrugForm={clinicalWorkflow.clinicalDrugForm}
                            filteredDrugSuggestions={clinicalWorkflow.filteredDrugSuggestions}
                            onDrugFormChange={clinicalWorkflow.updateClinicalDrugForm}
                            onAddClinicalDrug={clinicalWorkflow.addClinicalDrug}
                            onDrugFormKeyDown={clinicalWorkflow.handleDrugFormKeyDown}
                            onUpdateRxRow={clinicalWorkflow.updateRxRow}
                            onRemoveRxRow={clinicalWorkflow.removeRxRow}
                            onDemoFill={() =>
                                clinicalWorkflow.setRxRows([
                                    { drug: 'Paracetamol', dose: '500MG', terms: 'Daily 3 x 4', amount: '12', source: 'Clinical' },
                                    { drug: 'Amoxicillin', dose: '250MG', terms: 'Hourly 6', amount: '10', source: 'Outside' },
                                ])
                            }
                            onClear={() => clinicalWorkflow.setRxRows([])}
                        />
                    ) : null}

                    {activeTab === "notes" ? (
                        <VisitPlanner
                            nextVisitOption={visitPlanner.nextVisitOption}
                            nextVisitDate={visitPlanner.nextVisitDate}
                            notes={visitPlanner.notes}
                            onSelectOption={visitPlanner.handleNextVisitSelect}
                            onDateChange={visitPlanner.setNextVisitDate}
                            onNotesChange={visitPlanner.setNotes}
                        />
                    ) : null}
                </div>
            </div>
        </div>
    );
}
