import { PatientProfileModal } from '../../../components/PatientProfileModal';
import type { PatientGender } from '../types';
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
    nicNumber: string;
    onNicNumberChange: (value: string) => void;
    gender: PatientGender;
    onGenderChange: (value: PatientGender) => void;
    patientName: string;
    onPatientNameChange: (value: string) => void;
    patientAge: string;
    onPatientAgeChange: (value: string) => void;
    clinicalWorkflow: ClinicalWorkflow;
    visitPlanner: VisitPlannerState;
};

export function DoctorWorkspace({
    profileId,
    onCloseProfile,
    nicNumber,
    onNicNumberChange,
    gender,
    onGenderChange,
    patientName,
    onPatientNameChange,
    patientAge,
    onPatientAgeChange,
    clinicalWorkflow,
    visitPlanner,
}: DoctorWorkspaceProps) {
    return (
        <div className="order-1 col-span-12 flex flex-col gap-4 pr-0 lg:order-1 lg:col-span-9 lg:pr-4">
            <div className="flex flex-col gap-6 rounded-[28px] border border-white/70 bg-white/80 p-6 shadow-[0_24px_60px_rgba(14,116,144,0.12)] ring-1 ring-sky-50/80 backdrop-blur-xl">
                <PatientProfileModal profileId={profileId} onClose={onCloseProfile} />

                <DoctorHeader
                    nicNumber={nicNumber}
                    onNicNumberChange={onNicNumberChange}
                    gender={gender}
                    onGenderChange={onGenderChange}
                    patientName={patientName}
                    onPatientNameChange={onPatientNameChange}
                    patientAge={patientAge}
                    onPatientAgeChange={onPatientAgeChange}
                />

                <div className="h-px w-full bg-slate-100" />

                <DiseaseSearch
                    diseaseQuery={clinicalWorkflow.diseaseQuery}
                    setDiseaseQuery={clinicalWorkflow.setDiseaseQuery}
                    handleDiseaseKeyDown={clinicalWorkflow.handleDiseaseKeyDown}
                    isFetchingDiseases={clinicalWorkflow.isFetchingDiseases}
                    diseaseSuggestions={clinicalWorkflow.diseaseSuggestions}
                    highlightedDiseaseIndex={clinicalWorkflow.highlightedDiseaseIndex}
                    addDisease={clinicalWorkflow.addDisease}
                    selectedDiseases={clinicalWorkflow.selectedDiseases}
                    chipsPendingRemoval={clinicalWorkflow.chipsPendingRemoval}
                    toggleChipRemovalState={clinicalWorkflow.toggleChipRemovalState}
                    testQuery={clinicalWorkflow.testQuery}
                    setTestQuery={clinicalWorkflow.setTestQuery}
                    handleMedicalTestKeyDown={clinicalWorkflow.handleMedicalTestKeyDown}
                    filteredTestOptions={clinicalWorkflow.filteredTestOptions}
                    highlightedTestIndex={clinicalWorkflow.highlightedTestIndex}
                    addMedicalTest={clinicalWorkflow.addMedicalTest}
                    selectedTests={clinicalWorkflow.selectedTests}
                    testChipsPendingRemoval={clinicalWorkflow.testChipsPendingRemoval}
                    toggleTestChipRemovalState={clinicalWorkflow.toggleTestChipRemovalState}
                />

                <div className="h-px w-full bg-slate-100" />

                <RxEditor
                    rxRows={clinicalWorkflow.rxRows}
                    clinicalDrugForm={clinicalWorkflow.clinicalDrugForm}
                    filteredDrugSuggestions={clinicalWorkflow.filteredDrugSuggestions}
                    onDrugFormChange={clinicalWorkflow.updateClinicalDrugForm}
                    onToggleDoseUnit={clinicalWorkflow.toggleDoseUnit}
                    onToggleTerms={clinicalWorkflow.toggleTerms}
                    onToggleDrugSource={clinicalWorkflow.toggleDrugSource}
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

                <div className="h-px w-full bg-slate-100" />

                <VisitPlanner
                    nextVisitOption={visitPlanner.nextVisitOption}
                    nextVisitDate={visitPlanner.nextVisitDate}
                    onSelectOption={visitPlanner.handleNextVisitSelect}
                    onDateChange={visitPlanner.setNextVisitDate}
                />
            </div>
        </div>
    );
}
