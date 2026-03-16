import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createQueryWrapper } from "../../../lib/test-query-client";
import { queryKeys } from "../../../lib/query-keys";
import { useDoctorWorkspaceData } from "../hooks/useDoctorWorkspaceData";

vi.mock("../../../lib/api-client", () => ({
  createEncounter: vi.fn(),
  updateAppointment: vi.fn(),
}));

vi.mock("../../../lib/query-hooks", () => ({
  usePatientsQuery: vi.fn(),
  useAppointmentsQuery: vi.fn(),
  useCurrentUserQuery: vi.fn(),
  usePatientVitalsQuery: vi.fn(),
  usePatientAllergiesQuery: vi.fn(),
}));

import { createEncounter, updateAppointment } from "../../../lib/api-client";
import {
  useAppointmentsQuery,
  useCurrentUserQuery,
  usePatientAllergiesQuery,
  usePatientsQuery,
  usePatientVitalsQuery,
} from "../../../lib/query-hooks";

const mockedCreateEncounter = vi.mocked(createEncounter);
const mockedUpdateAppointment = vi.mocked(updateAppointment);
const mockedUsePatientsQuery = vi.mocked(usePatientsQuery);
const mockedUseAppointmentsQuery = vi.mocked(useAppointmentsQuery);
const mockedUseCurrentUserQuery = vi.mocked(useCurrentUserQuery);
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

describe("useDoctorWorkspaceData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedUsePatientsQuery.mockReturnValue(
      buildQueryState({
        data: [{ id: 7, name: "Jane Doe", patientCode: "P-0007", nic: "990011223V", age: 31, gender: "female" }],
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
            patientCode: "P-0007",
            nic: "990011223V",
            age: 31,
            gender: "female",
            reason: "Fever",
            scheduledAt: "2026-03-10T10:30:00.000Z",
          },
        ],
      }) as never
    );
    mockedUseCurrentUserQuery.mockReturnValue(
      buildQueryState({ data: { id: 5, role: "doctor" } }) as never
    );
    mockedUsePatientVitalsQuery.mockReturnValue(
      buildQueryState({ data: [{ label: "BP", value: "120/80" }] }) as never
    );
    mockedUsePatientAllergiesQuery.mockReturnValue(
      buildQueryState({ data: [{ name: "Peanut", severity: "high" }] }) as never
    );
    mockedCreateEncounter.mockResolvedValue({ id: 91 });
    mockedUpdateAppointment.mockResolvedValue({ id: 22, status: "in_consultation" });
  });

  it("loads selected patient clinical detail queries and normalizes the results", async () => {
    const clinicalWorkflow = {
      selectedDiseases: [],
      selectedTests: [],
      rxRows: [],
    } as never;
    const visitPlanner = { nextVisitDate: "2026-03-11" } as never;

    const { result } = renderHook(() => useDoctorWorkspaceData(clinicalWorkflow, visitPlanner), {
      wrapper: createQueryWrapper(),
    });

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

    expect(mockedUsePatientVitalsQuery).toHaveBeenLastCalledWith(7, true);
    expect(mockedUsePatientAllergiesQuery).toHaveBeenLastCalledWith(7, true);
    expect(result.current.patientVitals).toEqual([{ label: "BP", value: "120/80" }]);
    expect(result.current.patientAllergies[0]).toMatchObject({
      name: "Peanut",
      severity: "High",
    });
  });

  it("fills the top doctor fields from an exact patient code lookup", async () => {
    const clinicalWorkflow = {
      selectedDiseases: [],
      selectedTests: [],
      rxRows: [],
    } as never;
    const visitPlanner = { nextVisitDate: "2026-03-11" } as never;

    const { result } = renderHook(() => useDoctorWorkspaceData(clinicalWorkflow, visitPlanner), {
      wrapper: createQueryWrapper(),
    });

    act(() => {
      result.current.setPatientCode("P-0007");
    });

    act(() => {
      result.current.handlePatientCodeCommit();
    });

    await waitFor(() => {
      expect(result.current.patientName).toBe("Jane Doe");
    });
    expect(result.current.patientAge).toBe("31");
    expect(result.current.nicNumber).toBe("990011223V");
    expect(result.current.patientLookupNotice).toBeNull();
  });

  it("shows a lookup notice when top identity lookup finds no patient", async () => {
    const clinicalWorkflow = {
      selectedDiseases: [],
      selectedTests: [],
      rxRows: [],
    } as never;
    const visitPlanner = { nextVisitDate: "2026-03-11" } as never;

    const { result } = renderHook(() => useDoctorWorkspaceData(clinicalWorkflow, visitPlanner), {
      wrapper: createQueryWrapper(),
    });

    act(() => {
      result.current.setNicNumber("200012345678");
    });

    act(() => {
      result.current.handleNicLookupCommit();
    });

    await waitFor(() => {
      expect(result.current.patientLookupNotice).toEqual(expect.stringMatching(/no patient was found/i));
    });
    expect(result.current.patientName).toBe("");
  });

  it("submits encounters and refetches queue queries after save", async () => {
    const invalidateQueriesSpy = vi
      .spyOn(QueryClient.prototype, "invalidateQueries")
      .mockResolvedValue(undefined);
    const patientsQuery = buildQueryState({
      data: [{ id: 7, name: "Jane Doe", patientCode: "P-0007", nic: "990011223V", age: 31, gender: "female" }],
    });
    const appointmentsQuery = buildQueryState({
      data: [{ id: 22, patientId: 7, doctorId: 5, patientName: "Jane Doe", patientCode: "P-0007", nic: "990011223V", age: 31, gender: "female", reason: "Fever", scheduledAt: "2026-03-10T10:30:00.000Z" }],
    });
    const currentUserQuery = buildQueryState({ data: { id: 5, role: "doctor" } });
    mockedUsePatientsQuery.mockReturnValue(patientsQuery as never);
    mockedUseAppointmentsQuery.mockReturnValue(appointmentsQuery as never);
    mockedUseCurrentUserQuery.mockReturnValue(currentUserQuery as never);

    const clinicalWorkflow = {
      selectedDiseases: ["Influenza"],
      selectedTests: ["CBC"],
      rxRows: [{ drug: "Paracetamol", dose: "500mg", terms: "BID", amount: "10", source: "clinical" }],
    } as never;
    const visitPlanner = { nextVisitDate: "2026-03-11" } as never;

    const { result } = renderHook(() => useDoctorWorkspaceData(clinicalWorkflow, visitPlanner), {
      wrapper: createQueryWrapper(),
    });

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

    expect(mockedCreateEncounter).toHaveBeenCalledTimes(1);
    expect(mockedUpdateAppointment).toHaveBeenCalledWith(22, {
      status: "completed",
    });
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.patients.list,
    });
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({
      queryKey: ["appointments"],
    });
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.encounters.list,
    });
    expect(patientsQuery.refetch).toHaveBeenCalled();
    expect(appointmentsQuery.refetch).toHaveBeenCalled();
    expect(currentUserQuery.refetch).toHaveBeenCalled();
    expect(result.current.saveState.status).toBe("success");
    expect(result.current.selectedAppointmentStatus).toBe("completed");
  });

  it("blocks encounter submission for non-doctor roles", async () => {
    mockedUseCurrentUserQuery.mockReturnValue(
      buildQueryState({ data: { id: 5, role: "owner" } }) as never
    );

    const clinicalWorkflow = {
      selectedDiseases: ["Influenza"],
      selectedTests: [],
      rxRows: [],
    } as never;
    const visitPlanner = { nextVisitDate: "2026-03-11" } as never;

    const { result } = renderHook(() => useDoctorWorkspaceData(clinicalWorkflow, visitPlanner), {
      wrapper: createQueryWrapper(),
    });

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
    expect(mockedCreateEncounter).not.toHaveBeenCalled();
    expect(result.current.saveState.status).toBe("error");
    expect(result.current.saveState.error).toMatch(/doctor role|doctor workspace access|appointment update permission/i);
  });

  it("disables save and transition actions until a waiting appointment is selected", async () => {
    const clinicalWorkflow = {
      selectedDiseases: [],
      selectedTests: [],
      rxRows: [],
    } as never;
    const visitPlanner = { nextVisitDate: "2026-03-11" } as never;

    const { result } = renderHook(() => useDoctorWorkspaceData(clinicalWorkflow, visitPlanner), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => {
      expect(result.current.queueState.status).toBe("ready");
    });

    expect(result.current.canSaveRecord).toBe(false);
    expect(result.current.canTransitionAppointments).toBe(false);
    expect(result.current.saveDisabledReason).toMatch(/select a waiting appointment/i);
    expect(result.current.transitionDisabledReason).toMatch(/select a waiting appointment/i);
  });

  it("starts consultation and refreshes appointment queries", async () => {
    const invalidateQueriesSpy = vi
      .spyOn(QueryClient.prototype, "invalidateQueries")
      .mockResolvedValue(undefined);
    const patientsQuery = buildQueryState({
      data: [{ id: 7, name: "Jane Doe", patientCode: "P-0007", nic: "990011223V", age: 31, gender: "female" }],
    });
    const appointmentsQuery = buildQueryState({
      data: [{ id: 22, patientId: 7, doctorId: 5, patientName: "Jane Doe", patientCode: "P-0007", nic: "990011223V", age: 31, gender: "female", reason: "Fever", status: "waiting", scheduledAt: "2026-03-10T10:30:00.000Z" }],
    });
    mockedUsePatientsQuery.mockReturnValue(patientsQuery as never);
    mockedUseAppointmentsQuery.mockReturnValue(appointmentsQuery as never);

    const clinicalWorkflow = {
      selectedDiseases: [],
      selectedTests: [],
      rxRows: [],
    } as never;
    const visitPlanner = { nextVisitDate: "2026-03-11" } as never;

    const { result } = renderHook(() => useDoctorWorkspaceData(clinicalWorkflow, visitPlanner), {
      wrapper: createQueryWrapper(),
    });

    act(() => {
      result.current.handlePatientSelect({
        patientId: 7,
        appointmentId: 22,
        doctorId: 5,
        appointmentStatus: "waiting",
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
      await result.current.handleStartConsultation();
    });

    expect(mockedUpdateAppointment).toHaveBeenCalledWith(22, {
      status: "in_consultation",
    });
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({
      queryKey: ["appointments"],
    });
    expect(appointmentsQuery.refetch).toHaveBeenCalled();
    expect(result.current.transitionState.status).toBe("success");
    expect(result.current.selectedAppointmentStatus).toBe("in_consultation");
  });

  it("clears stale save feedback when the selected patient context changes", async () => {
    const clinicalWorkflow = {
      selectedDiseases: [],
      selectedTests: [],
      rxRows: [],
    } as never;
    const visitPlanner = { nextVisitDate: "2026-03-11" } as never;

    const { result } = renderHook(() => useDoctorWorkspaceData(clinicalWorkflow, visitPlanner), {
      wrapper: createQueryWrapper(),
    });

    act(() => {
      result.current.handlePatientSelect({
        patientId: 7,
        appointmentId: 22,
        doctorId: 5,
        appointmentStatus: "waiting",
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

    expect(result.current.saveState.status).toBe("success");

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

    expect(result.current.saveState.status).toBe("idle");
    expect(result.current.saveFeedback).toBeNull();
  });
});
