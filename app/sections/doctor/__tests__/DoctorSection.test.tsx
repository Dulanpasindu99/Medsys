import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  emptyLoadState,
  errorLoadState,
  idleMutationState,
  pendingMutationState,
  readyLoadState,
} from "../../../lib/async-state";
import { useCurrentUserQuery } from "../../../lib/query-hooks";
import DoctorSection from "../../DoctorSection";
import { usePatientProfilePopup } from "../../../hooks/usePatientProfilePopup";
import { useDoctorClinicalWorkflow } from "../hooks/useDoctorClinicalWorkflow";
import { useDoctorWorkspaceData } from "../hooks/useDoctorWorkspaceData";
import { useVisitPlanner } from "../hooks/useVisitPlanner";

vi.mock("../hooks/useDoctorClinicalWorkflow", () => ({
  useDoctorClinicalWorkflow: vi.fn(),
}));

vi.mock("../hooks/useVisitPlanner", () => ({
  useVisitPlanner: vi.fn(),
}));

vi.mock("../hooks/useDoctorWorkspaceData", () => ({
  useDoctorWorkspaceData: vi.fn(),
}));

vi.mock("../../../hooks/usePatientProfilePopup", () => ({
  usePatientProfilePopup: vi.fn(),
}));

vi.mock("../../../lib/query-hooks", () => ({
  useCurrentUserQuery: vi.fn(),
}));

vi.mock("../components/DoctorSidebar", () => ({
  DoctorSidebar: ({
    onOpenPatientHistory,
    onSaveRecord,
    canSaveRecord,
    saveDisabledReason,
    isSavingRecord,
    selectedPatientProfileId,
  }: {
    onOpenPatientHistory: () => void;
    onSaveRecord: () => void;
    canSaveRecord?: boolean;
    saveDisabledReason?: string | null;
    isSavingRecord?: boolean;
    selectedPatientProfileId?: string | null;
  }) => (
    <div>
      <button type="button" onClick={onOpenPatientHistory} disabled={!selectedPatientProfileId}>
        View Patient History
      </button>
      <button type="button" onClick={onSaveRecord} disabled={isSavingRecord || !canSaveRecord}>
        {isSavingRecord ? "Saving consultation..." : "Save Consultation"}
      </button>
      {saveDisabledReason ? <p>{saveDisabledReason}</p> : null}
    </div>
  ),
}));

vi.mock("../components/DoctorWorkspace", () => ({
  DoctorWorkspace: ({
    profileId,
    onSearchSelect,
  }: {
    profileId: string;
    onSearchSelect: (patient: {
      patientId: number;
      appointmentId: number;
      doctorId: number;
      appointmentStatus?: string;
      profileId: string;
      name: string;
      patientCode: string;
      nic: string;
      age: number;
      gender: string;
      reason: string;
      time: string;
    }) => void;
  }) => (
    <div>
      <button
        type="button"
        onClick={() =>
          onSearchSelect({
            patientId: 7,
            appointmentId: 22,
            doctorId: 5,
            appointmentStatus: "waiting",
            profileId: "7",
            name: "Jane Doe",
            patientCode: "P-0007",
            nic: "990011223V",
            age: 31,
            gender: "Female",
            reason: "Fever",
            time: "10:30",
          })
        }
      >
        Select patient
      </button>
      <div data-testid="doctor-workspace">{profileId}</div>
    </div>
  ),
}));

const mockedUseDoctorClinicalWorkflow = vi.mocked(useDoctorClinicalWorkflow);
const mockedUseVisitPlanner = vi.mocked(useVisitPlanner);
const mockedUseDoctorWorkspaceData = vi.mocked(useDoctorWorkspaceData);
const mockedUsePatientProfilePopup = vi.mocked(usePatientProfilePopup);
const mockedUseCurrentUserQuery = vi.mocked(useCurrentUserQuery);
type MockDoctorWorkspaceData = ReturnType<typeof useDoctorWorkspaceData>;

function buildWorkspaceState(overrides?: Partial<MockDoctorWorkspaceData>): MockDoctorWorkspaceData {
  return {
    search: "",
    setSearch: vi.fn(),
    patientName: "Jane Doe",
    setPatientName: vi.fn(),
    patientFirstName: "Jane",
    setPatientFirstName: vi.fn(),
    patientLastName: "Doe",
    setPatientLastName: vi.fn(),
    patientAge: "31",
    setPatientAge: vi.fn(),
    patientDateOfBirth: "1995-03-01",
    setPatientDateOfBirth: vi.fn(),
    patientCode: "P-0007",
    setPatientCode: vi.fn(),
    selectedPatientProfileId: "7",
    selectedPatientLabel: "Jane Doe",
    patientLookupNotice: null,
    nicNumber: "990011223V",
    nicIdentityLabel: "Patient NIC" as const,
    setNicNumber: vi.fn(),
    phoneNumber: "",
    setPhoneNumber: vi.fn(),
    guardianName: "",
    setGuardianName: vi.fn(),
    guardianNic: "",
    setGuardianNic: vi.fn(),
    guardianPhone: "",
    setGuardianPhone: vi.fn(),
    guardianRelationship: "",
    setGuardianRelationship: vi.fn(),
    guardianMode: "quick" as const,
    setGuardianMode: vi.fn(),
    guardianDateOfBirth: "",
    setGuardianDateOfBirth: vi.fn(),
    guardianGender: "Female" as const,
    setGuardianGender: vi.fn(),
    guardianSearch: "",
    setGuardianSearch: vi.fn(),
    guardianSearchMatches: [],
    selectedGuardian: null,
    handleGuardianSelect: vi.fn(),
    gender: "Female" as const,
    setGender: vi.fn(),
    isCreatingPatientInline: false,
    requiresGuardianDetails: false,
    handleSearchCommit: vi.fn(),
    searchMatches: [],
    patientVitals: [{ label: "BP", value: "120/80" }],
    patientAllergies: [],
    consultationAllergies: [],
    vitalDrafts: {
      bloodPressure: "120/80",
      heartRate: "",
      temperature: "",
      spo2: "",
    },
    setVitalDraft: vi.fn(),
    canEditVitals: true,
    vitalsDisabledReason: null,
    vitalsSaveState: idleMutationState(),
    vitalsFeedback: null,
    handleSaveVitals: vi.fn(),
    allergyDraftName: "",
    setAllergyNameDraft: vi.fn(),
    allergyDraftSeverity: "moderate" as const,
    setAllergySeverityDraft: vi.fn(),
    editingAllergyName: null,
    handleEditAllergy: vi.fn(),
    handleClearAllergyDraft: vi.fn(),
    canEditAllergies: true,
    allergiesDisabledReason: null,
    allergySaveState: idleMutationState(),
    allergyFeedback: null,
    handleAddOrUpdateAllergy: vi.fn(),
    removeConsultationAllergy: vi.fn(),
    queueState: readyLoadState(),
    patientDetailsState: emptyLoadState(),
    canSaveRecord: true,
    canTransitionAppointments: false,
    visitActionLabel: "Save Consultation",
    visitModeLabel: "Existing Patient",
    saveDisabledReason: null,
    transitionDisabledReason: "",
    selectedAppointmentStatus: "waiting" as const,
    workflowType: "appointment" as const,
    workflowStatusLabel: null,
    dispenseStatusLabel: null,
    lastClinicalItemCount: 0,
    lastOutsideItemCount: 0,
    canPrintPrescription: false,
    canDirectDispense: false,
    directDispenseDisabledReason: null,
    saveState: idleMutationState(),
    saveFeedback: null,
    transitionState: idleMutationState(),
    transitionFeedback: null,
    handlePatientSelect: vi.fn(),
    handleStartConsultation: vi.fn(),
    handleSaveRecord: vi.fn(),
    handleSaveAndComplete: vi.fn(),
    handlePrintPrescription: vi.fn(),
    reload: vi.fn(),
    ...overrides,
  };
}

describe("DoctorSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedUseDoctorClinicalWorkflow.mockReturnValue({
      selectedDiseases: [],
      persistedConditionDiagnoses: new Set(),
      selectedTests: [],
      rxRows: [],
      togglePersistAsCondition: vi.fn(),
    } as unknown as ReturnType<typeof useDoctorClinicalWorkflow>);
    mockedUseVisitPlanner.mockReturnValue({
      nextVisitDate: "2026-03-07",
    } as unknown as ReturnType<typeof useVisitPlanner>);
    mockedUseDoctorWorkspaceData.mockReturnValue(buildWorkspaceState());
    mockedUseCurrentUserQuery.mockReturnValue({
      data: {
        id: 5,
        role: "doctor",
        email: "doctor@example.com",
        name: "Doctor",
      },
    } as ReturnType<typeof useCurrentUserQuery>);
    mockedUsePatientProfilePopup.mockReturnValue({
      selectedProfileId: null,
      openProfile: vi.fn(),
      closeProfile: vi.fn(),
    });
  });

  it("surfaces queue and patient detail notices", () => {
    mockedUseDoctorWorkspaceData.mockReturnValue(
      buildWorkspaceState({
        queueState: errorLoadState("Unable to load doctor queue."),
        patientDetailsState: readyLoadState(
          "Some patient clinical details could not be loaded and partial data is being shown."
        ),
      })
    );

    render(<DoctorSection />);

    expect(screen.getByText("Unable to load doctor queue.")).toBeInTheDocument();
    expect(screen.getByText(/partial data is being shown/i)).toBeInTheDocument();
  });

  it("fills the doctor workspace and delegates selection/save actions", async () => {
    const user = userEvent.setup();
    const openProfile = vi.fn();
    const handlePatientSelect = vi.fn();
    const handleSaveRecord = vi.fn();

    mockedUseDoctorWorkspaceData.mockReturnValue(
      buildWorkspaceState({ handlePatientSelect, handleSaveRecord })
    );
    mockedUsePatientProfilePopup.mockReturnValue({
      selectedProfileId: "7",
      openProfile,
      closeProfile: vi.fn(),
    });

    render(<DoctorSection />);

    await user.click(screen.getByRole("button", { name: /select patient/i }));
    await user.click(screen.getByRole("button", { name: /view patient history/i }));
    await user.click(screen.getByRole("button", { name: /save consultation/i }));

    expect(handlePatientSelect).toHaveBeenCalledTimes(1);
    expect(openProfile).toHaveBeenCalledWith("7");
    expect(handleSaveRecord).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("doctor-workspace")).toHaveTextContent("7");
  });

  it("shows the save pending label while consultation submission is in flight", () => {
    mockedUseDoctorWorkspaceData.mockReturnValue(
      buildWorkspaceState({
        saveState: pendingMutationState(),
      })
    );

    render(<DoctorSection />);

    expect(screen.getByRole("button", { name: /saving consultation/i })).toBeDisabled();
  });

  it("keeps only the unified save action visible", () => {
    mockedUseDoctorWorkspaceData.mockReturnValue(
      buildWorkspaceState({
        transitionState: pendingMutationState(),
      })
    );

    render(<DoctorSection />);

    expect(screen.queryByRole("button", { name: /start visit/i })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /save consultation/i })).toBeInTheDocument();
  });

  it("disables consultation submission when the active role cannot save records", () => {
    mockedUseDoctorWorkspaceData.mockReturnValue(
      buildWorkspaceState({
        canSaveRecord: false,
        saveDisabledReason: "Doctor workspace access is required before saving consultations.",
      })
    );

    render(<DoctorSection />);

    expect(screen.getByRole("button", { name: /save consultation/i })).toBeDisabled();
    expect(
      screen.getByText(/doctor workspace access is required before saving consultations/i)
    ).toBeInTheDocument();
  });

  it("keeps assistant tools out of the doctor home screen", () => {
    render(<DoctorSection />);

    expect(
      screen.queryByText(/assistant tasks are enabled for this doctor account/i)
    ).not.toBeInTheDocument();
  });
});
