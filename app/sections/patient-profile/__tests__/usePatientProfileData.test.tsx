import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createQueryWrapper } from "../../../lib/test-query-client";
import { usePatientProfileData } from "../hooks/usePatientProfileData";

vi.mock("../../../lib/api-client", () => ({
  getPatientProfile: vi.fn(),
  getPatientFamily: vi.fn(),
  listPatientAllergies: vi.fn(),
  listPatientConditions: vi.fn(),
  listPatientTimeline: vi.fn(),
  listPatientVitals: vi.fn(),
  listPatients: vi.fn(),
}));

import {
  getPatientFamily,
  getPatientProfile,
  listPatientAllergies,
  listPatientConditions,
  listPatientTimeline,
  listPatientVitals,
  listPatients,
} from "../../../lib/api-client";

const mockedGetPatientProfile = vi.mocked(getPatientProfile);
const mockedGetPatientFamily = vi.mocked(getPatientFamily);
const mockedListPatientAllergies = vi.mocked(listPatientAllergies);
const mockedListPatientConditions = vi.mocked(listPatientConditions);
const mockedListPatientTimeline = vi.mocked(listPatientTimeline);
const mockedListPatientVitals = vi.mocked(listPatientVitals);
const mockedListPatients = vi.mocked(listPatients);

describe("usePatientProfileData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedGetPatientProfile.mockResolvedValue({
      id: 12,
      name: "Jane Doe",
      nic: "990011223V",
      age: 31,
      gender: "female",
      mobile: "0771234567",
      createdAt: "2026-03-07T10:30:00.000Z",
    });
    mockedGetPatientFamily.mockResolvedValue({
      name: "Doe",
      members: [{ name: "John Doe" }],
    });
    mockedListPatientAllergies.mockResolvedValue([{ name: "Peanut" }]);
    mockedListPatientConditions.mockResolvedValue([{ name: "Hypertension" }]);
    mockedListPatientTimeline.mockResolvedValue([
      {
        date: "2026-03-09T11:00:00.000Z",
        title: "Review",
        description: "Follow-up completed",
      },
    ]);
    mockedListPatientVitals.mockResolvedValue([
      {
        recordedAt: "2026-03-08T08:00:00.000Z",
        label: "Blood Pressure",
        value: "120/80",
      },
    ]);
    mockedListPatients.mockResolvedValue([
      {
        id: 12,
        name: "Jane Doe",
        nic: "990011223V",
        age: 31,
        gender: "female",
        phone: "0771234567",
        createdAt: "2026-03-07T10:30:00.000Z",
      },
    ]);
  });

  it("returns an immediate error state for an invalid profile id", () => {
    const { result } = renderHook(() => usePatientProfileData("abc"), {
      wrapper: createQueryWrapper(),
    });

    expect(result.current.profile).toBeNull();
    expect(result.current.loadState.status).toBe("error");
    expect(result.current.syncError).toBe("Invalid patient profile reference.");
  });

  it("loads and normalizes the patient profile through the shared query layer", async () => {
    const { result } = renderHook(() => usePatientProfileData("12"), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loadState.status).toBe("ready");
    });

    expect(result.current.profile).toMatchObject({
      id: "12",
      name: "Jane Doe",
      nic: "990011223V",
      age: 31,
      gender: "Female",
      mobile: "0771234567",
      conditions: ["Hypertension"],
      allergies: ["Peanut"],
    });
    expect(result.current.profile?.family).toEqual({
      assigned: true,
      name: "Doe",
      members: ["John Doe"],
    });
    expect(result.current.timeline).toHaveLength(2);
    expect(result.current.totalProfiles).toBe(1);
  });

  it("surfaces a fallback notice when secondary profile feeds fail", async () => {
    mockedGetPatientFamily.mockRejectedValue(new Error("family unavailable"));
    mockedListPatientVitals.mockRejectedValue(new Error("vitals unavailable"));

    const { result } = renderHook(() => usePatientProfileData("12"), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loadState.status).toBe("ready");
    });

    expect(result.current.profile?.name).toBe("Jane Doe");
    expect(result.current.loadState.notice).toMatch(/fallback data is being shown/i);
  });
});
