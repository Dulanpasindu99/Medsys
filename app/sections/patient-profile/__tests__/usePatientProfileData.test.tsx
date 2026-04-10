import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createQueryWrapper } from "../../../lib/test-query-client";
import { usePatientProfileData } from "../hooks/usePatientProfileData";

vi.mock("../../../lib/api-client", () => ({
  getPatientProfile: vi.fn(),
  getPatientConsultations: vi.fn(),
}));

import { getPatientConsultations, getPatientProfile } from "../../../lib/api-client";

const mockedGetPatientProfile = vi.mocked(getPatientProfile);
const mockedGetPatientConsultations = vi.mocked(getPatientConsultations);

describe("usePatientProfileData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedGetPatientProfile.mockResolvedValue({
      patient: {
        id: 12,
        patientCode: "P-0012",
        fullName: "Jane Doe",
        nic: "990011223V",
        dob: "1995-03-07",
        age: 31,
        gender: "female",
        phone: "0771234567",
        familyId: 8,
        createdAt: "2026-03-07T10:30:00.000Z",
      },
      family: {
        familyId: 8,
        family: {
          id: 8,
          familyCode: "FAM-0008",
          familyName: "Doe Family",
        },
        guardianPatientId: null,
        guardianRelationship: null,
        members: [],
      },
      allergies: [{ allergyName: "Peanut" }],
      conditions: [{ conditionName: "Hypertension" }],
      vitals: [
        {
          recordedAt: "2026-03-08T08:00:00.000Z",
          bpSystolic: 120,
          bpDiastolic: 80,
          spo2: 98,
          heartRate: 76,
          temperatureC: "37.0",
        },
      ],
      timeline: [],
    });
    mockedGetPatientConsultations.mockResolvedValue({
      consultations: [
        {
          encounter_id: 14,
          checked_at: "2026-03-09T11:00:00.000Z",
          event_date: "2026-03-09",
          title: "Consultation completed",
          status: "completed",
          reason: "Follow-up completed",
          diagnoses: [{ name: "Hypertension", code: "I10" }],
          tests: [{ name: "FBC" }],
          drugs: [{ name: "Paracetamol", dose: "250mg", frequency: "TID", duration: "3 days" }],
        },
      ],
    });
  });

  it("returns an immediate error state for an invalid profile id", () => {
    const { result } = renderHook(() => usePatientProfileData("abc"), {
      wrapper: createQueryWrapper(),
    });

    expect(result.current.profile).toBeNull();
    expect(result.current.loadState.status).toBe("error");
    expect(result.current.syncError).toBe("Invalid patient profile reference.");
  });

  it("loads and normalizes the patient profile from the single profile payload", async () => {
    const { result } = renderHook(() => usePatientProfileData("12"), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loadState.status).toBe("ready");
    });

    expect(result.current.profile).toMatchObject({
      id: "12",
      name: "Jane Doe",
      patientCode: "P-0012",
      nic: "990011223V",
      age: 31,
      gender: "Female",
      mobile: "0771234567",
      conditions: ["Hypertension"],
      allergies: [
        expect.objectContaining({
          name: "Peanut",
          severity: "Medium",
        }),
      ],
      family: {
        assigned: true,
        name: "Doe Family",
        members: [],
      },
    });
    expect(result.current.profile?.vitals).toHaveLength(1);
    expect(result.current.timeline).toHaveLength(1);
    expect(result.current.timeline[0]).toMatchObject({
      title: "Consultation completed",
      reason: "Follow-up completed",
      diagnoses: ["Hypertension"],
      tests: ["FBC"],
    });
  });
});
