import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { emptyLoadState, errorLoadState, loadingLoadState, readyLoadState } from "../../../lib/async-state";
import { PatientProfileView } from "../PatientProfileView";
import { usePatientProfileData } from "../hooks/usePatientProfileData";

vi.mock("../hooks/usePatientProfileData", () => ({
  usePatientProfileData: vi.fn(),
}));

const mockedUsePatientProfileData = vi.mocked(usePatientProfileData);

describe("PatientProfileView", () => {
  it("renders a loading state before the profile is ready", () => {
    mockedUsePatientProfileData.mockReturnValue({
      profile: null,
      timeline: [],
      totalProfiles: 0,
      formatDate: vi.fn(),
      loadState: loadingLoadState(),
      syncError: null,
      reload: vi.fn(),
    });

    render(<PatientProfileView profileId="12" />);

    expect(screen.getByText("Loading patient profile")).toBeInTheDocument();
  });

  it("renders a not-found state for an unknown profile id", () => {
    mockedUsePatientProfileData.mockReturnValue({
      profile: null,
      timeline: [],
      totalProfiles: 0,
      formatDate: vi.fn(),
      loadState: emptyLoadState(),
      syncError: null,
      reload: vi.fn(),
    });

    render(<PatientProfileView profileId="999" />);

    expect(screen.getByText("Profile not found")).toBeInTheDocument();
  });

  it("renders retryable error feedback for failed profile loads", () => {
    const reload = vi.fn();
    mockedUsePatientProfileData.mockReturnValue({
      profile: null,
      timeline: [],
      totalProfiles: 0,
      formatDate: vi.fn(),
      loadState: errorLoadState("Unable to load patient profile."),
      syncError: "Unable to load patient profile.",
      reload,
    });

    render(<PatientProfileView profileId="12" />);

    expect(screen.getByText("Patient profile could not be loaded")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /retry profile/i })).toBeInTheDocument();
  });

  it("renders the profile notice when fallback data is shown", () => {
    mockedUsePatientProfileData.mockReturnValue({
      profile: {
        id: "12",
        name: "Jane Doe",
        nic: "990011223V",
        age: 31,
        gender: "Female",
        mobile: "0771234567",
        family: { assigned: true, name: "Doe", members: ["John Doe"] },
        conditions: ["Hypertension"],
        allergies: ["Peanut"],
        firstSeen: "2026-03-07T10:30:00.000Z",
        timeline: [],
      },
      timeline: [],
      totalProfiles: 3,
      formatDate: (value: string) => value,
      loadState: readyLoadState("Some profile details could not be loaded and fallback data is being shown."),
      syncError: null,
      reload: vi.fn(),
    });

    render(<PatientProfileView profileId="12" />);

    expect(screen.getByText(/fallback data is being shown/i)).toBeInTheDocument();
    expect(screen.getByText("Jane Doe")).toBeInTheDocument();
  });
});
