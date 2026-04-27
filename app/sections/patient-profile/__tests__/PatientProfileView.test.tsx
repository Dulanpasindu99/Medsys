import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { emptyLoadState, errorLoadState, loadingLoadState, readyLoadState } from "../../../lib/async-state";
import { PatientProfileView } from "../PatientProfileView";
import { usePatientProfileData } from "../hooks/usePatientProfileData";

vi.mock("../hooks/usePatientProfileData", () => ({
  usePatientProfileData: vi.fn(),
}));

const mockedUsePatientProfileData = vi.mocked(usePatientProfileData);

const mediumAllergy = {
  id: "a-1",
  name: "Peanut",
  severity: "Medium" as const,
  severityKey: "moderate" as const,
  pill: "bg-sky-50 text-sky-700 ring-1 ring-sky-100",
  dot: "bg-sky-500",
};

const highAllergy = {
  id: "a-2",
  name: "Dust",
  severity: "High" as const,
  severityKey: "high" as const,
  pill: "bg-rose-50 text-rose-700 ring-1 ring-rose-100",
  dot: "bg-rose-500",
};

describe("PatientProfileView", () => {
  it("renders a loading state before the profile is ready", () => {
    mockedUsePatientProfileData.mockReturnValue({
      profile: null,
      timeline: [],
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
      formatDate: vi.fn(),
      loadState: errorLoadState("Unable to load patient profile."),
      syncError: "Unable to load patient profile.",
      reload,
    });

    render(<PatientProfileView profileId="12" />);

    expect(screen.getByText("Patient profile could not be loaded")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /retry profile/i })).toBeInTheDocument();
  });

  it("renders profile content when ready state contains a notice", () => {
    mockedUsePatientProfileData.mockReturnValue({
      profile: {
        id: "12",
        name: "Jane Doe",
        patientCode: "P-0012",
        nic: "990011223V",
        age: 31,
        gender: "Female",
        mobile: "0771234567",
        family: { assigned: true, name: "Doe", members: ["John Doe"] },
        conditions: ["Hypertension"],
        allergies: [mediumAllergy],
        vitals: [],
        firstSeen: "2026-03-07T10:30:00.000Z",
        timeline: [],
      },
      timeline: [],
      formatDate: (value: string) => value,
      loadState: readyLoadState("Some profile details could not be loaded and fallback data is being shown."),
      syncError: null,
      reload: vi.fn(),
    });

    render(<PatientProfileView profileId="12" />);

    expect(screen.getByText("Jane Doe")).toBeInTheDocument();
    expect(screen.getByText(/patient identity, latest clinical summary/i)).toBeInTheDocument();
  });

  it("shows a no-history empty state when the patient has no timeline entries", () => {
    mockedUsePatientProfileData.mockReturnValue({
      profile: {
        id: "12",
        name: "Jane Doe",
        patientCode: "P-0012",
        nic: "990011223V",
        age: 31,
        gender: "Female",
        mobile: "0771234567",
        family: { assigned: true, name: "Doe", members: ["John Doe"] },
        conditions: [],
        allergies: [highAllergy, mediumAllergy],
        vitals: [],
        firstSeen: "2026-03-07T10:30:00.000Z",
        timeline: [],
      },
      timeline: [],
      formatDate: (value: string) => value,
      loadState: readyLoadState(),
      syncError: null,
      reload: vi.fn(),
    });

    render(<PatientProfileView profileId="12" />);

    expect(screen.getByText(/no completed consultations yet/i)).toBeInTheDocument();
    expect(screen.getByText(/consultation details will appear here after the doctor completes a visit/i)).toBeInTheDocument();
  });
});
