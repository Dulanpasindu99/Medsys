import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { idleMutationState, readyLoadState, errorLoadState } from "../../../lib/async-state";
import AssistantSection from "../../AssistantSection";
import { usePatientProfilePopup } from "../../../hooks/usePatientProfilePopup";
import { useAssistantWorkflow } from "../hooks/useAssistantWorkflow";

vi.mock("../hooks/useAssistantWorkflow", () => ({
  useAssistantWorkflow: vi.fn(),
}));

vi.mock("../../../hooks/usePatientProfilePopup", () => ({
  usePatientProfilePopup: vi.fn(),
}));

vi.mock("../../../components/PatientProfileModal", () => ({
  PatientProfileModal: ({ profileId }: { profileId: string }) => (
    <div data-testid="patient-profile-modal">{profileId}</div>
  ),
}));

const mockedUseAssistantWorkflow = vi.mocked(useAssistantWorkflow);
const mockedUsePatientProfilePopup = vi.mocked(usePatientProfilePopup);

function buildWorkflowState(overrides?: Partial<ReturnType<typeof useAssistantWorkflow>>) {
  return {
    pendingPatients: [
      {
        prescriptionId: 101,
        patientId: 7,
        patient: "Jane Doe",
        nic: "990011223V",
        age: 31,
        gender: "Female" as const,
        diagnosis: "Viral fever",
        clinical: [{ name: "Paracetamol", dose: "500mg", terms: "BID", amount: 10 }],
        outside: [],
        allergies: [],
        dispenseItems: [{ inventoryItemId: 1, quantity: 10 }],
      },
    ],
    activePrescription: {
      prescriptionId: 101,
      patientId: 7,
      patient: "Jane Doe",
      nic: "990011223V",
      age: 31,
      gender: "Female" as const,
      diagnosis: "Viral fever",
      clinical: [{ name: "Paracetamol", dose: "500mg", terms: "BID", amount: 10 }],
      outside: [],
      allergies: [],
      dispenseItems: [{ inventoryItemId: 1, quantity: 10 }],
    },
    formState: {
      nic: "",
      name: "",
      mobile: "",
      age: "",
      allergyInput: "",
      allergies: ["No allergies"],
      bloodGroup: "O+",
      priority: "Normal" as const,
      regularDrug: "",
    },
    setFormState: vi.fn(),
    completedSearch: "",
    setCompletedSearch: vi.fn(),
    stats: { total: 12, male: 7, female: 5, existing: 10, new: 2 },
    availableDoctors: [{ name: "Dr. House", status: "Online" }],
    filteredCompleted: [{ name: "Jane Doe", age: 31, nic: "990011223V", time: "10:30", profileId: "7" }],
    addPatient: vi.fn(),
    addAllergy: vi.fn(),
    markDoneAndNext: vi.fn(),
    loadState: readyLoadState(),
    createPatientState: idleMutationState(),
    dispenseState: idleMutationState(),
    canManageAssistantWorkflow: true,
    workflowActionDisabledReason: null,
    reload: vi.fn(),
    isSyncing: false,
    syncError: null,
    ...overrides,
  };
}

describe("AssistantSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedUseAssistantWorkflow.mockReturnValue(buildWorkflowState());
    mockedUsePatientProfilePopup.mockReturnValue({
      selectedProfileId: null,
      openProfile: vi.fn(),
      closeProfile: vi.fn(),
    });
  });

  it("renders the workflow error banner when sync fails", () => {
    mockedUseAssistantWorkflow.mockReturnValue(
      buildWorkflowState({
        loadState: errorLoadState("Unable to sync assistant data."),
        syncError: "Unable to sync assistant data.",
      })
    );

    render(<AssistantSection />);

    expect(screen.getByText("Unable to sync assistant data.")).toBeInTheDocument();
    expect(screen.getByText("Assistant Panel")).toBeInTheDocument();
  });

  it("wires sidebar and queue actions to the feature hooks", async () => {
    const user = userEvent.setup();
    const openProfile = vi.fn();
    const closeProfile = vi.fn();
    const markDoneAndNext = vi.fn();

    mockedUseAssistantWorkflow.mockReturnValue(
      buildWorkflowState({ markDoneAndNext })
    );
    mockedUsePatientProfilePopup.mockReturnValue({
      selectedProfileId: "7",
      openProfile,
      closeProfile,
    });

    render(<AssistantSection />);

    await user.click(screen.getByRole("button", { name: /jane doe/i }));
    await user.click(screen.getByRole("button", { name: /done & next/i }));

    expect(openProfile).toHaveBeenCalledWith("7");
    expect(markDoneAndNext).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("patient-profile-modal")).toHaveTextContent("7");
  });

  it("disables assistant-only actions for read-only roles", () => {
    mockedUseAssistantWorkflow.mockReturnValue(
      buildWorkflowState({
        canManageAssistantWorkflow: false,
        workflowActionDisabledReason:
          "Only assistant and owner accounts can complete intake and dispense actions.",
      })
    );

    render(<AssistantSection />);

    expect(screen.getByRole("button", { name: /done & next/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /add patient/i })).toBeDisabled();
    expect(
      screen.getAllByText(/only assistant and owner accounts can complete intake and dispense actions/i)
        .length
    ).toBeGreaterThan(0);
  });
});
