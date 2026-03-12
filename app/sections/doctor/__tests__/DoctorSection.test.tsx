import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  emptyLoadState,
  errorLoadState,
  idleMutationState,
  pendingMutationState,
  readyLoadState,
} from "../../../lib/async-state";
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

vi.mock("../components/DoctorSidebar", () => ({
  DoctorSidebar: ({
    onSearchSelect,
    onStartConsultation,
    onSaveRecord,
    canTransitionAppointments,
    transitionDisabledReason,
    canSaveRecord,
    saveDisabledReason,
    isTransitioningAppointment,
    isSavingRecord,
  }: {
    onSearchSelect: (patient: {
      patientId: number;
      appointmentId: number;
      doctorId: number;
      appointmentStatus?: string;
      profileId: string;
      name: string;
      nic: string;
      age: number;
      gender: string;
      reason: string;
      time: string;
    }) => void;
    onStartConsultation: () => void;
    onSaveRecord: () => void;
    canTransitionAppointments?: boolean;
    transitionDisabledReason?: string | null;
    canSaveRecord?: boolean;
    saveDisabledReason?: string | null;
    isTransitioningAppointment?: boolean;
    isSavingRecord?: boolean;
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
      <button
        type="button"
        onClick={onStartConsultation}
        disabled={isTransitioningAppointment || !canTransitionAppointments}
      >
        {isTransitioningAppointment ? "Starting consultation..." : "Start Consultation"}
      </button>
      <button type="button" onClick={onSaveRecord} disabled={isSavingRecord || !canSaveRecord}>
        {isSavingRecord ? "Saving record..." : "Save & Print Record"}
      </button>
      {transitionDisabledReason ? <p>{transitionDisabledReason}</p> : null}
      {saveDisabledReason ? <p>{saveDisabledReason}</p> : null}
    </div>
  ),
}));

vi.mock("../components/DoctorWorkspace", () => ({
  DoctorWorkspace: ({ profileId }: { profileId: string }) => (
    <div data-testid="doctor-workspace">{profileId}</div>
  ),
}));

const mockedUseDoctorClinicalWorkflow = vi.mocked(useDoctorClinicalWorkflow);
const mockedUseVisitPlanner = vi.mocked(useVisitPlanner);
const mockedUseDoctorWorkspaceData = vi.mocked(useDoctorWorkspaceData);
const mockedUsePatientProfilePopup = vi.mocked(usePatientProfilePopup);
type MockDoctorWorkspaceData = ReturnType<typeof useDoctorWorkspaceData>;

function buildWorkspaceState(overrides?: Partial<MockDoctorWorkspaceData>): MockDoctorWorkspaceData {
  return {
    search: "",
    setSearch: vi.fn(),
    patientName: "Jane Doe",
    setPatientName: vi.fn(),
    patientAge: "31",
    setPatientAge: vi.fn(),
    nicNumber: "990011223V",
    setNicNumber: vi.fn(),
    gender: "Female" as const,
    setGender: vi.fn(),
    searchMatches: [],
    patientVitals: [{ label: "BP", value: "120/80" }],
    patientAllergies: [],
    queueState: readyLoadState(),
    patientDetailsState: emptyLoadState(),
    canSaveRecord: true,
    canTransitionAppointments: true,
    saveDisabledReason: null,
    transitionDisabledReason: null,
    selectedAppointmentStatus: "waiting" as const,
    saveState: idleMutationState(),
    saveFeedback: null,
    transitionState: idleMutationState(),
    transitionFeedback: null,
    handlePatientSelect: vi.fn(),
    handleStartConsultation: vi.fn(),
    handleSaveRecord: vi.fn(),
    reload: vi.fn(),
    ...overrides,
  };
}

describe("DoctorSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedUseDoctorClinicalWorkflow.mockReturnValue({
      selectedDiseases: [],
      selectedTests: [],
      rxRows: [],
    } as unknown as ReturnType<typeof useDoctorClinicalWorkflow>);
    mockedUseVisitPlanner.mockReturnValue({
      nextVisitDate: "2026-03-07",
    } as unknown as ReturnType<typeof useVisitPlanner>);
    mockedUseDoctorWorkspaceData.mockReturnValue(buildWorkspaceState());
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
        patientDetailsState: readyLoadState("Some patient clinical details could not be loaded and partial data is being shown."),
      })
    );

    render(<DoctorSection />);

    expect(screen.getByText("Unable to load doctor queue.")).toBeInTheDocument();
    expect(screen.getByText(/partial data is being shown/i)).toBeInTheDocument();
  });

  it("opens the patient profile and delegates selection/save actions", async () => {
    const user = userEvent.setup();
    const openProfile = vi.fn();
    const handlePatientSelect = vi.fn();
    const handleStartConsultation = vi.fn();
    const handleSaveRecord = vi.fn();

    mockedUseDoctorWorkspaceData.mockReturnValue(
      buildWorkspaceState({ handlePatientSelect, handleStartConsultation, handleSaveRecord })
    );
    mockedUsePatientProfilePopup.mockReturnValue({
      selectedProfileId: "7",
      openProfile,
      closeProfile: vi.fn(),
    });

    render(<DoctorSection />);

    await user.click(screen.getByRole("button", { name: /select patient/i }));
    await user.click(screen.getByRole("button", { name: /start consultation/i }));
    await user.click(screen.getByRole("button", { name: /save & print record/i }));

    expect(handlePatientSelect).toHaveBeenCalledTimes(1);
    expect(handleStartConsultation).toHaveBeenCalledTimes(1);
    expect(openProfile).toHaveBeenCalledWith("7");
    expect(handleSaveRecord).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("doctor-workspace")).toHaveTextContent("7");
  });

  it("shows the save pending label while encounter submission is in flight", () => {
    mockedUseDoctorWorkspaceData.mockReturnValue(
      buildWorkspaceState({
        saveState: pendingMutationState(),
      })
    );

    render(<DoctorSection />);

    expect(screen.getByRole("button", { name: /saving record/i })).toBeDisabled();
  });

  it("shows the consultation transition pending label while appointment status updates are in flight", () => {
    mockedUseDoctorWorkspaceData.mockReturnValue(
      buildWorkspaceState({
        transitionState: pendingMutationState(),
      })
    );

    render(<DoctorSection />);

    expect(screen.getByRole("button", { name: /starting consultation/i })).toBeDisabled();
  });

  it("disables encounter submission when the active role cannot save records", () => {
    mockedUseDoctorWorkspaceData.mockReturnValue(
      buildWorkspaceState({
        canSaveRecord: false,
        canTransitionAppointments: false,
        saveDisabledReason: "Only doctor accounts can submit encounters from this workspace.",
        transitionDisabledReason: "Only doctor accounts can advance appointment status from this workspace.",
      })
    );

    render(<DoctorSection />);

    expect(screen.getByRole("button", { name: /start consultation/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /save & print record/i })).toBeDisabled();
    expect(screen.getByText(/only doctor accounts can advance appointment status/i)).toBeInTheDocument();
    expect(screen.getByText(/only doctor accounts can submit encounters/i)).toBeInTheDocument();
  });
});
