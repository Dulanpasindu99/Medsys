import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { errorLoadState, readyLoadState } from "../../../lib/async-state";
import PatientSection from "../../PatientSection";
import { usePatientProfilePopup } from "../../../hooks/usePatientProfilePopup";
import { usePatientDirectory } from "../hooks/usePatientDirectory";

vi.mock("../hooks/usePatientDirectory", () => ({
  usePatientDirectory: vi.fn(),
}));

vi.mock("../../../hooks/usePatientProfilePopup", () => ({
  usePatientProfilePopup: vi.fn(),
}));

vi.mock("../../../components/PatientProfileModal", () => ({
  PatientProfileModal: ({ profileId }: { profileId: string }) => (
    <div data-testid="patient-profile-modal">{profileId}</div>
  ),
}));

const mockedUsePatientDirectory = vi.mocked(usePatientDirectory);
const mockedUsePatientProfilePopup = vi.mocked(usePatientProfilePopup);

function buildDirectoryState(overrides?: Partial<ReturnType<typeof usePatientDirectory>>) {
  return {
    search: "",
    setSearch: vi.fn(),
    family: "All Families",
    setFamily: vi.fn(),
    ageRange: "all" as const,
    setAgeRange: vi.fn(),
    gender: "all" as const,
    setGender: vi.fn(),
    patients: [
      {
        patientId: 7,
        name: "Jane Doe",
        nic: "990011223V",
        age: 31,
        gender: "Female" as const,
        mobile: "0771234567",
        family: "Doe",
        visits: 4,
        lastVisit: "2 days ago",
        nextAppointment: "07 Mar, 10:30",
        tags: ["Hypertension"],
        conditions: ["Hypertension"],
        profileId: "7",
      },
    ],
    filteredPatients: [
      {
        patientId: 7,
        name: "Jane Doe",
        nic: "990011223V",
        age: 31,
        gender: "Female" as const,
        mobile: "0771234567",
        family: "Doe",
        visits: 4,
        lastVisit: "2 days ago",
        nextAppointment: "07 Mar, 10:30",
        tags: ["Hypertension"],
        conditions: ["Hypertension"],
        profileId: "7",
      },
    ],
    families: ["All Families", "Doe"],
    loadState: readyLoadState(),
    reload: vi.fn(),
    syncError: null,
    isSyncing: false,
    ...overrides,
  };
}

describe("PatientSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedUsePatientDirectory.mockReturnValue(buildDirectoryState());
    mockedUsePatientProfilePopup.mockReturnValue({
      selectedProfileId: null,
      openProfile: vi.fn(),
      closeProfile: vi.fn(),
    });
  });

  it("renders retryable error feedback when the directory fails to load", () => {
    const reload = vi.fn();
    mockedUsePatientDirectory.mockReturnValue(
      buildDirectoryState({
        patients: [],
        filteredPatients: [],
        loadState: errorLoadState("Unable to load patients."),
        reload,
      })
    );

    render(<PatientSection />);

    expect(screen.getByText("Patient records could not be loaded")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /retry patients/i })).toBeInTheDocument();
  });

  it("shows the no-match state when filters exclude all loaded patients", () => {
    mockedUsePatientDirectory.mockReturnValue(
      buildDirectoryState({
        filteredPatients: [],
      })
    );

    render(<PatientSection />);

    expect(screen.getByText("No patients match the current filters")).toBeInTheDocument();
    expect(screen.getByText("0 of 1 patients")).toBeInTheDocument();
  });

  it("opens the selected patient profile from the directory card", async () => {
    const user = userEvent.setup();
    const openProfile = vi.fn();
    mockedUsePatientProfilePopup.mockReturnValue({
      selectedProfileId: "7",
      openProfile,
      closeProfile: vi.fn(),
    });

    render(<PatientSection />);

    await user.click(screen.getByRole("button", { name: /view patient profile/i }));

    expect(openProfile).toHaveBeenCalledWith("7");
    expect(screen.getByTestId("patient-profile-modal")).toHaveTextContent("7");
  });
});
