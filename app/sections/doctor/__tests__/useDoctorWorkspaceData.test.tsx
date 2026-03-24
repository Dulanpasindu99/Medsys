import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createQueryWrapper } from "../../../lib/test-query-client";
import { queryKeys } from "../../../lib/query-keys";
import { useDoctorWorkspaceData } from "../hooks/useDoctorWorkspaceData";

vi.mock("../../../lib/api-client", () => ({
  saveConsultation: vi.fn(),
}));

vi.mock("../../../lib/query-hooks", () => ({
  usePatientsQuery: vi.fn(),
  useAppointmentsQuery: vi.fn(),
  useCurrentUserQuery: vi.fn(),
  usePatientProfileQuery: vi.fn(),
  usePatientVitalsQuery: vi.fn(),
  usePatientAllergiesQuery: vi.fn(),
}));

import { saveConsultation } from "../../../lib/api-client";
import {
  useAppointmentsQuery,
  useCurrentUserQuery,
  usePatientAllergiesQuery,
  usePatientProfileQuery,
  usePatientsQuery,
  usePatientVitalsQuery,
} from "../../../lib/query-hooks";

const mockedSaveConsultation = vi.mocked(saveConsultation);
const mockedUsePatientsQuery = vi.mocked(usePatientsQuery);
const mockedUseAppointmentsQuery = vi.mocked(useAppointmentsQuery);
const mockedUseCurrentUserQuery = vi.mocked(useCurrentUserQuery);
const mockedUsePatientProfileQuery = vi.mocked(usePatientProfileQuery);
const mockedUsePatientVitalsQuery = vi.mocked(usePatientVitalsQuery);
const mockedUsePatientAllergiesQuery = vi.mocked(usePatientAllergiesQuery);

function buildQueryState(overrides: Record<string, unknown> = {}) {
  return {
    data: [],
    error: null,
    isError: false,
    isFetching: false,
    isPending: false,
    status: "success",
    refetch: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

function buildClinicalWorkflow(overrides: Record<string, unknown> = {}) {
  return {
    selectedDiseases: [],
    persistedConditionDiagnoses: new Set<string>(),
    selectedTests: [],
    rxRows: [],
    togglePersistAsCondition: vi.fn(),
    ...overrides,
  } as never;
}

function buildVisitPlanner(overrides: Record<string, unknown> = {}) {
  return {
    nextVisitDate: "2026-03-11",
    notes: "",
    ...overrides,
  } as never;
}

describe("useDoctorWorkspaceData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedUsePatientsQuery.mockReturnValue(
      buildQueryState({
        data: [
          { id: 7, name: "Jane Doe", patient_code: "P-0007", nic: "990011223V", age: 31, gender: "female" },
          { id: 55, name: "Kasuni Silva", patient_code: "P-0055", nic: "198812345678", phone: "+94771112233", age: 38, gender: "female", family_id: 3 },
        ],
      }) as never
    );
    mockedUseAppointmentsQuery.mockReturnValue(
      buildQueryState({
        data: [
          {
            id: 22,
            patientId: 7,
            doctorId: 5,
            patientName: "Jane Doe",
            patient_code: "P-0007",
            nic: "990011223V",
            age: 31,
            gender: "female",
            reason: "Fever",
            status: "waiting",
            scheduledAt: "2026-03-10T10:30:00.000Z",
          },
        ],
      }) as never
    );
    mockedUseCurrentUserQuery.mockReturnValue(
      buildQueryState({ data: { id: 5, role: "doctor", permissions: ["appointment.update"] } }) as never
    );
    mockedUsePatientVitalsQuery.mockReturnValue(
      buildQueryState({ data: [{ label: "BP", value: "120/80" }] }) as never
    );
    mockedUsePatientProfileQuery.mockImplementation(
      (patientId: number | string) =>
        buildQueryState({
          data:
            String(patientId) === "7"
              ? {
                  id: 7,
                  patient_code: "P-0007",
                  full_name: "Jane Doe",
                  nic: "990011223V",
                  age: 31,
                  gender: "female",
                  date_of_birth: "1995-03-01",
                }
              : null,
        }) as never
    );
    mockedUsePatientAllergiesQuery.mockReturnValue(
      buildQueryState({ data: [{ name: "Peanut", severity: "high" }] }) as never
    );
    mockedSaveConsultation.mockResolvedValue({ patient: { id: 7 }, encounterId: 91 });
  });

  it("loads selected patient details and normalizes clinical feeds", async () => {
    const { result } = renderHook(
      () => useDoctorWorkspaceData(buildClinicalWorkflow(), buildVisitPlanner()),
      { wrapper: createQueryWrapper() }
    );

    act(() => {
      result.current.handlePatientSelect({
        patientId: 7,
        appointmentId: 22,
        doctorId: 5,
        name: "Jane Doe",
        patientCode: "P-0007",
        nic: "990011223V",
        age: 31,
        gender: "Female",
        reason: "Fever",
        time: "10:30",
        profileId: "7",
      });
    });

    await waitFor(() => {
      expect(result.current.patientDetailsState.status).toBe("ready");
    });

    expect(result.current.patientVitals).toEqual([{ label: "BP", value: "120/80" }]);
    expect(result.current.patientAllergies[0]).toMatchObject({
      name: "Peanut",
      severity: "High",
      severityKey: "high",
    });
  });

  it("fills doctor fields from an exact patient lookup", async () => {
    const { result } = renderHook(
      () => useDoctorWorkspaceData(buildClinicalWorkflow(), buildVisitPlanner()),
      { wrapper: createQueryWrapper() }
    );

    act(() => {
      result.current.setSearch("P-0007");
      result.current.handleSearchCommit();
    });

    await waitFor(() => {
      expect(result.current.patientName).toBe("Jane Doe");
    });

    expect(result.current.nicNumber).toBe("990011223V");
    expect(result.current.nicIdentityLabel).toBe("Patient NIC");
    expect(result.current.gender).toBe("Female");
    expect(result.current.patientLookupNotice).toBeNull();
  });

  it("shows inline quick-create mode when no patient is found", async () => {
    const { result } = renderHook(
      () => useDoctorWorkspaceData(buildClinicalWorkflow(), buildVisitPlanner()),
      { wrapper: createQueryWrapper() }
    );

    act(() => {
      result.current.setSearch("200012345678");
    });

    act(() => {
      result.current.handleSearchCommit();
    });

    await waitFor(() => {
      expect(result.current.patientName).toBe("200012345678");
    });
  });

  it("requires guardian details for minors without a NIC", async () => {
    const { result } = renderHook(
      () => useDoctorWorkspaceData(buildClinicalWorkflow(), buildVisitPlanner()),
      { wrapper: createQueryWrapper() }
    );

    act(() => {
      result.current.setPatientName("Nethmi Silva");
      result.current.setPatientDateOfBirth("2012-04-15");
    });

    expect(result.current.requiresGuardianDetails).toBe(true);
    expect(result.current.canSaveRecord).toBe(false);
    expect(result.current.saveDisabledReason).toMatch(/guardian relationship|guardian name|guardian nic|guardian phone/i);
  });

  it("keeps vitals local until the final consultation save", async () => {
    const { result } = renderHook(
      () => useDoctorWorkspaceData(buildClinicalWorkflow(), buildVisitPlanner()),
      { wrapper: createQueryWrapper() }
    );

    act(() => {
      result.current.handlePatientSelect({
        patientId: 7,
        appointmentId: 22,
        doctorId: 5,
        name: "Jane Doe",
        patientCode: "P-0007",
        nic: "990011223V",
        age: 31,
        gender: "Female",
        reason: "Fever",
        time: "10:30",
        profileId: "7",
      });
      result.current.setVitalDraft("bloodPressure", "120/80");
      result.current.setVitalDraft("heartRate", "72 bpm");
      result.current.setVitalDraft("temperature", "36.8");
      result.current.setVitalDraft("spo2", "99");
    });

    await act(async () => {
      await result.current.handleSaveVitals();
    });

    expect(mockedSaveConsultation).not.toHaveBeenCalled();
    expect(result.current.vitalsFeedback?.message).toMatch(/captured locally/i);
  });

  it("adds allergies to the consultation draft without a separate backend call", async () => {
    const { result } = renderHook(
      () => useDoctorWorkspaceData(buildClinicalWorkflow(), buildVisitPlanner()),
      { wrapper: createQueryWrapper() }
    );

    act(() => {
      result.current.handlePatientSelect({
        patientId: 7,
        appointmentId: 22,
        doctorId: 5,
        name: "Jane Doe",
        patientCode: "P-0007",
        nic: "990011223V",
        age: 31,
        gender: "Female",
        reason: "Fever",
        time: "10:30",
        profileId: "7",
      });
      result.current.setAllergyNameDraft("Peanut");
      result.current.setAllergySeverityDraft("high");
    });

    await act(async () => {
      await result.current.handleAddOrUpdateAllergy();
    });

    expect(result.current.consultationAllergies).toEqual([
      { allergyName: "Peanut", severity: "high", isActive: true },
    ]);
    expect(mockedSaveConsultation).not.toHaveBeenCalled();
  });

  it("submits one consultation payload for an existing patient", async () => {
    const invalidateQueriesSpy = vi
      .spyOn(QueryClient.prototype, "invalidateQueries")
      .mockResolvedValue(undefined);
    const { result } = renderHook(
      () =>
        useDoctorWorkspaceData(
          buildClinicalWorkflow({
            selectedDiseases: ["Influenza"],
            persistedConditionDiagnoses: new Set(["Influenza"]),
            selectedTests: ["CBC"],
            rxRows: [{ drug: "Paracetamol", dose: "500mg", terms: "BID", amount: "10", source: "clinical" }],
          }),
          buildVisitPlanner({ notes: "Stable follow-up" })
        ),
      { wrapper: createQueryWrapper() }
    );

    act(() => {
      result.current.handlePatientSelect({
        patientId: 7,
        appointmentId: 22,
        doctorId: 5,
        name: "Jane Doe",
        patientCode: "P-0007",
        nic: "990011223V",
        age: 31,
        gender: "Female",
        reason: "Fever",
        time: "10:30",
        profileId: "7",
      });
      result.current.setVitalDraft("heartRate", "84");
      result.current.setAllergyNameDraft("Penicillin");
      result.current.setAllergySeverityDraft("high");
    });

    await act(async () => {
      await result.current.handleAddOrUpdateAllergy();
    });

    await waitFor(() => {
      expect(result.current.consultationAllergies).toHaveLength(1);
    });

    await act(async () => {
      await result.current.handleSaveRecord();
    });

    expect(mockedSaveConsultation).toHaveBeenCalledWith(
      expect.objectContaining({
        patientId: 7,
        reason: "Walk-in consultation",
        priority: "normal",
        notes: "Stable follow-up",
        clinicalSummary: "Stable follow-up",
        diagnoses: [{ diagnosisName: "Influenza", icd10Code: "", persistAsCondition: true }],
        tests: [{ testName: "CBC", status: "ordered" }],
        vitals: expect.any(Object),
        allergies: [{ allergyName: "Penicillin", severity: "high", isActive: true }],
      })
    );
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.patients.list,
    });
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({
      queryKey: ["appointments"],
    });
    expect(result.current.saveState.status).toBe("success");
    expect(result.current.selectedAppointmentStatus).toBe("completed");
  });

  it("includes the current allergy draft in the final consultation save even before add is clicked", async () => {
    const { result } = renderHook(
      () => useDoctorWorkspaceData(buildClinicalWorkflow(), buildVisitPlanner()),
      { wrapper: createQueryWrapper() }
    );

    act(() => {
      result.current.handlePatientSelect({
        patientId: 7,
        appointmentId: 22,
        doctorId: 5,
        name: "Jane Doe",
        patientCode: "P-0007",
        nic: "990011223V",
        age: 31,
        gender: "Female",
        reason: "Fever",
        time: "10:30",
        profileId: "7",
      });
      result.current.setAllergyNameDraft("Dust");
      result.current.setAllergySeverityDraft("moderate");
    });

    await act(async () => {
      await result.current.handleSaveRecord();
    });

    expect(mockedSaveConsultation).toHaveBeenCalledWith(
      expect.objectContaining({
        allergies: [{ allergyName: "Dust", severity: "moderate", isActive: true }],
      })
    );
  });

  it("splits ICD-coded diagnosis labels into diagnosis text and icd10Code on save", async () => {
    const { result } = renderHook(
      () =>
        useDoctorWorkspaceData(
          buildClinicalWorkflow({
            selectedDiseases: [
              "T59.3X3A - Toxic effect of lacrimogenic gas, assault, initial encounter",
            ],
          }),
          buildVisitPlanner()
        ),
      { wrapper: createQueryWrapper() }
    );

    act(() => {
      result.current.handlePatientSelect({
        patientId: 7,
        appointmentId: 22,
        doctorId: 5,
        name: "Jane Doe",
        patientCode: "P-0007",
        nic: "990011223V",
        age: 31,
        gender: "Female",
        reason: "Fever",
        time: "10:30",
        profileId: "7",
      });
    });

    await act(async () => {
      await result.current.handleSaveRecord();
    });

    expect(mockedSaveConsultation).toHaveBeenCalledWith(
      expect.objectContaining({
        diagnoses: [
          {
            diagnosisName: "Toxic effect of lacrimogenic gas, assault, initial encounter",
            icd10Code: "T59.3X3A",
          },
        ],
      })
    );
  });

  it("submits quick-create drafts through the same consultation save action", async () => {
    mockedSaveConsultation.mockResolvedValue({ patient: { id: 55 }, encounterId: 91 });

    const { result } = renderHook(
      () => useDoctorWorkspaceData(buildClinicalWorkflow(), buildVisitPlanner()),
      { wrapper: createQueryWrapper() }
    );

    act(() => {
      result.current.setPatientName("Nethmi Silva");
      result.current.setPatientDateOfBirth("2012-04-15");
      result.current.setGuardianRelationship("Mother");
      result.current.setGuardianName("Kasuni Silva");
      result.current.setGuardianNic("198812345678");
    });

    await act(async () => {
      await result.current.handleSaveRecord();
    });

    expect(mockedSaveConsultation).toHaveBeenCalledWith(
      expect.objectContaining({
        patientDraft: expect.objectContaining({
          name: "Nethmi Silva",
          dateOfBirth: "2012-04-15",
          guardianName: "Kasuni Silva",
          guardianNic: "198812345678",
        }),
      })
    );
    expect(result.current.selectedPatientProfileId).toBe("55");
  });

  it("prefers guardianPatientId when an existing guardian is selected", async () => {
    mockedSaveConsultation.mockResolvedValue({ patient: { id: 56 }, encounterId: 91 });

    const { result } = renderHook(
      () => useDoctorWorkspaceData(buildClinicalWorkflow(), buildVisitPlanner()),
      { wrapper: createQueryWrapper() }
    );

    act(() => {
      result.current.setPatientName("Nethmi Silva");
      result.current.setPatientDateOfBirth("2012-04-15");
      result.current.handleGuardianSelect({
        patientId: 55,
        familyId: 3,
        name: "Kasuni Silva",
        patientCode: "P-0055",
        nic: "198812345678",
        phone: "+94771112233",
        age: 38,
        gender: "Female",
        reason: "Guardian record",
        time: "-",
      });
      result.current.setGuardianRelationship("Mother");
    });

    await act(async () => {
      await result.current.handleSaveRecord();
    });

    expect(mockedSaveConsultation).toHaveBeenCalledWith(
      expect.objectContaining({
        patientDraft: expect.objectContaining({
          name: "Nethmi Silva",
          guardianPatientId: 55,
          guardianRelationship: "Mother",
        }),
      })
    );
  });

  it("falls back to lightweight guardian fields when selected guardian has no family", async () => {
    mockedSaveConsultation.mockResolvedValue({ patient: { id: 58 }, encounterId: 91 });

    const { result } = renderHook(
      () => useDoctorWorkspaceData(buildClinicalWorkflow(), buildVisitPlanner()),
      { wrapper: createQueryWrapper() }
    );

    act(() => {
      result.current.setPatientName("Nethmi Silva");
      result.current.setPatientDateOfBirth("2012-04-15");
      result.current.handleGuardianSelect({
        patientId: 99,
        name: "Kasuni Silva",
        patientCode: "P-0099",
        nic: "198812345678",
        phone: "+94771112233",
        age: 38,
        gender: "Female",
        reason: "Guardian record",
        time: "-",
      });
      result.current.setGuardianRelationship("Sister");
    });

    await act(async () => {
      await result.current.handleSaveRecord();
    });

    expect(mockedSaveConsultation).toHaveBeenCalledWith(
      expect.objectContaining({
        patientDraft: expect.objectContaining({
          guardianName: "Kasuni Silva",
          guardianNic: "198812345678",
          guardianPhone: "+94771112233",
          guardianRelationship: "Sister",
        }),
      })
    );
    expect(mockedSaveConsultation).not.toHaveBeenCalledWith(
      expect.objectContaining({
        patientDraft: expect.objectContaining({
          guardianPatientId: 99,
        }),
      })
    );
  });

  it("sends guardianDraft when full guardian creation is chosen", async () => {
    mockedSaveConsultation.mockResolvedValue({ patient: { id: 57 }, encounterId: 91 });

    const { result } = renderHook(
      () => useDoctorWorkspaceData(buildClinicalWorkflow(), buildVisitPlanner()),
      { wrapper: createQueryWrapper() }
    );

    act(() => {
      result.current.setPatientName("Nethmi Silva");
      result.current.setPatientDateOfBirth("2012-04-15");
      result.current.setGuardianMode("draft");
      result.current.setGuardianName("Kasuni Silva");
      result.current.setGuardianDateOfBirth("1988-06-20");
      result.current.setGuardianNic("198812345678");
      result.current.setGuardianPhone("+94771112233");
      result.current.setGuardianRelationship("Mother");
    });

    await act(async () => {
      await result.current.handleSaveRecord();
    });

    expect(mockedSaveConsultation).toHaveBeenCalledWith(
      expect.objectContaining({
        patientDraft: expect.objectContaining({
          name: "Nethmi Silva",
          guardianRelationship: "Mother",
        }),
        guardianDraft: expect.objectContaining({
          name: "Kasuni Silva",
          dateOfBirth: "1988-06-20",
          nic: "198812345678",
          phone: "+94771112233",
        }),
      })
    );
  });

  it("blocks consultation save for non-doctor roles", async () => {
    mockedUseCurrentUserQuery.mockReturnValue(
      buildQueryState({ data: { id: 5, role: "owner" } }) as never
    );

    const { result } = renderHook(
      () => useDoctorWorkspaceData(buildClinicalWorkflow(), buildVisitPlanner()),
      { wrapper: createQueryWrapper() }
    );

    act(() => {
      result.current.handlePatientSelect({
        patientId: 7,
        appointmentId: 22,
        doctorId: 5,
        name: "Jane Doe",
        patientCode: "P-0007",
        nic: "990011223V",
        age: 31,
        gender: "Female",
        reason: "Fever",
        time: "10:30",
        profileId: "7",
      });
    });

    await act(async () => {
      await result.current.handleSaveRecord();
    });

    expect(result.current.canSaveRecord).toBe(false);
    expect(mockedSaveConsultation).not.toHaveBeenCalled();
    expect(result.current.saveState.status).toBe("error");
  });
});
