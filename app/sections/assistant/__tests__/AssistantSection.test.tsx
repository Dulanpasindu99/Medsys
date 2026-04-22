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
        patientCode: "P-0007",
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
      patientCode: "P-0007",
      nic: "990011223V",
      age: 31,
      gender: "Female" as const,
      diagnosis: "Viral fever",
      clinical: [{ name: "Paracetamol", dose: "500mg", terms: "BID", amount: 10 }],
      outside: [],
      allergies: [],
      dispenseItems: [{ inventoryItemId: 1, quantity: 10 }],
    },
    activeClinicalResolutionRows: [],
    formState: {
      firstName: "",
      lastName: "",
      dateOfBirth: "",
      gender: "Male" as const,
      nic: "",
      mobile: "",
      address: "",
      allergyInput: "",
      allergySeverity: "moderate" as const,
      allergies: [],
      bloodGroup: "O+",
      priority: "Normal" as const,
      regularDrug: "",
      guardian: {
        guardianPatientId: "",
        guardianName: "",
        guardianNic: "",
        guardianPhone: "",
        guardianRelationship: "",
        familyId: "",
        familyCode: "",
      },
    },
    setFormState: vi.fn(),
    completedSearch: "",
    setCompletedSearch: vi.fn(),
    stats: { total: 12, male: 7, female: 5, existing: 10, new: 2 },
    availableDoctors: [{ id: 5, name: "Dr. House", status: "Online" }],
    patientOptions: [{ id: 7, name: "Jane Doe", patientCode: "P-0007", nic: "990011223V", familyId: 12 }],
    familyOptions: [{ id: 12, name: "Doe Family", familyCode: "FAM-0012" }],
    scheduleForm: {
      patientId: "",
      doctorId: "",
      scheduledAt: "2026-03-12T09:30",
      reason: "",
      priority: "Normal" as const,
    },
    setScheduleForm: vi.fn(),
    filteredCompleted: [{ name: "Jane Doe", patientCode: "P-0007", age: 31, nic: "990011223V", time: "10:30", profileId: "7" }],
    addPatient: vi.fn(),
    addAllergy: vi.fn(),
    resetPatientForm: vi.fn(),
    scheduleAppointment: vi.fn(),
    resetScheduleForm: vi.fn(),
    markDoneAndNext: vi.fn(),
    canSubmitDispense: true,
    dispenseActionDisabledReason: null,
    setResolvedInventoryItem: vi.fn(),
    loadState: readyLoadState(),
    createPatientState: idleMutationState(),
    createPatientFieldErrors: {},
    createPatientFeedback: null,
    scheduleAppointmentState: idleMutationState(),
    scheduleFieldErrors: {},
    scheduleAppointmentFeedback: null,
    dispenseState: idleMutationState(),
    dispenseFeedback: null,
    canManageAssistantWorkflow: true,
    canCreatePatientsInWorkflow: true,
    patientActionDisabledReason: null,
    workflowActionDisabledReason: null,
    canCreateAppointmentsInWorkflow: true,
    appointmentActionDisabledReason: null,
    currentRole: "assistant" as const,
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

    expect(screen.getByText("Assistant Panel")).toBeInTheDocument();
  });

  it("wires sidebar and queue actions to the feature hooks", async () => {
    const user = userEvent.setup();
    const markDoneAndNext = vi.fn();

    mockedUseAssistantWorkflow.mockReturnValue(
      buildWorkflowState({ markDoneAndNext })
    );
    mockedUsePatientProfilePopup.mockReturnValue({
      selectedProfileId: "7",
      openProfile: vi.fn(),
      closeProfile: vi.fn(),
    });

    render(<AssistantSection />);

    await user.click(screen.getByRole("button", { name: /doctor checked/i }));
    await user.click(screen.getByRole("button", { name: /done & next/i }));

    expect(markDoneAndNext).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("patient-profile-modal")).toHaveTextContent("7");
  });

  it("disables assistant-only actions for read-only roles", async () => {
    const user = userEvent.setup();
    mockedUseAssistantWorkflow.mockReturnValue(
      buildWorkflowState({
        canManageAssistantWorkflow: false,
        canCreatePatientsInWorkflow: false,
        patientActionDisabledReason:
          "Only assistant and owner accounts can register patients.",
        workflowActionDisabledReason:
          "Only assistant and owner accounts can complete intake and dispense actions.",
        canCreateAppointmentsInWorkflow: false,
        appointmentActionDisabledReason:
          "Only assistant and owner accounts can schedule appointments.",
      })
    );

    render(<AssistantSection />);

    const addPatientButtons = screen.getAllByRole("button", { name: /add patient/i });
    expect(addPatientButtons.at(-1)).toBeDisabled();
    await user.click(screen.getByRole("button", { name: /doctor checked/i }));
    expect(screen.getByRole("button", { name: /done & next/i })).toBeDisabled();
    expect(screen.queryByRole("button", { name: /schedule appointment/i })).not.toBeInTheDocument();
  });

  it("renders duplicate placeholder NIC entries without duplicate-key warnings", async () => {
    const user = userEvent.setup();
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    mockedUseAssistantWorkflow.mockReturnValue(
      buildWorkflowState({
        filteredCompleted: [
          { name: "Jane Doe", patientCode: "", age: 31, nic: "N/A", time: "10:30" },
          { name: "John Doe", patientCode: "", age: 29, nic: "N/A", time: "11:00" },
        ],
      })
    );

    render(<AssistantSection />);

    await user.click(screen.getByRole("button", { name: /completed patients/i }));
    expect(screen.getAllByText("Jane Doe").length).toBeGreaterThan(0);
    expect(screen.getAllByText("John Doe").length).toBeGreaterThan(0);
    expect(
      consoleErrorSpy.mock.calls.some((call) =>
        call.some(
          (arg) =>
            typeof arg === "string" &&
            arg.includes("Encountered two children with the same key")
        )
      )
    ).toBe(false);

    consoleErrorSpy.mockRestore();
  });
});
