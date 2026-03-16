import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createAppointment,
  createPatient,
  dispensePrescription,
  getAnalyticsOverview,
  getCurrentUser,
  listAppointments,
  listPatients,
  listPendingDispenseQueue,
} from "../../../lib/api-client";
import { createQueryWrapper } from "../../../lib/test-query-client";
import { useAssistantWorkflow } from "../hooks/useAssistantWorkflow";

vi.mock("../../../lib/api-client", () => ({
  createAppointment: vi.fn(),
  createPatient: vi.fn(),
  dispensePrescription: vi.fn(),
  getAnalyticsOverview: vi.fn(),
  getCurrentUser: vi.fn(),
  listAppointments: vi.fn(),
  listPatients: vi.fn(),
  listPendingDispenseQueue: vi.fn(),
}));

const mockedCreateAppointment = vi.mocked(createAppointment);
const mockedCreatePatient = vi.mocked(createPatient);
const mockedDispensePrescription = vi.mocked(dispensePrescription);
const mockedGetAnalyticsOverview = vi.mocked(getAnalyticsOverview);
const mockedGetCurrentUser = vi.mocked(getCurrentUser);
const mockedListAppointments = vi.mocked(listAppointments);
const mockedListPatients = vi.mocked(listPatients);
const mockedListPendingDispenseQueue = vi.mocked(listPendingDispenseQueue);

function buildPatientFixture(input: {
  id: number;
  name: string;
  nic: string;
  age: number;
  gender: string;
}) {
  const [firstName, ...lastNameParts] = input.name.split(" ");
  return {
    id: input.id,
    name: input.name,
    fullName: input.name,
    firstName,
    first_name: firstName,
    lastName: lastNameParts.join(" "),
    last_name: lastNameParts.join(" "),
    patientCode: `P-${String(input.id).padStart(4, "0")}`,
    patient_code: `P-${String(input.id).padStart(4, "0")}`,
    dateOfBirth: "1995-01-01",
    date_of_birth: "1995-01-01",
    phone: null,
    mobile: null,
    address: null,
    createdAt: "2026-03-09T00:00:00.000Z",
    created_at: "2026-03-09T00:00:00.000Z",
    nic: input.nic,
    age: input.age,
    gender: input.gender,
    priority: null,
  };
}

describe("useAssistantWorkflow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedListPendingDispenseQueue.mockResolvedValue([]);
    mockedListPatients.mockResolvedValue([]);
    mockedGetAnalyticsOverview.mockResolvedValue({});
    mockedGetCurrentUser.mockResolvedValue({
      id: 42,
      role: "assistant",
      email: "assistant@medsys.test",
      name: "Assistant",
      permissions: ["patient.write", "appointment.create", "prescription.dispense"],
    });
    mockedCreatePatient.mockResolvedValue({
      id: 99,
      name: "Created Patient",
      fullName: "Created Patient",
      firstName: "Created",
      lastName: "Patient",
      patientCode: "P-0099",
      dateOfBirth: null,
      date_of_birth: null,
      phone: null,
      mobile: null,
      address: null,
      createdAt: "2026-03-09T00:00:00.000Z",
      created_at: "2026-03-09T00:00:00.000Z",
      nic: null,
      age: null,
      gender: null,
      priority: null,
    });
    mockedCreateAppointment.mockResolvedValue({ id: 301 });
    mockedDispensePrescription.mockResolvedValue({});
    mockedListAppointments.mockImplementation(async (input?: { status?: string }) => {
      if (input?.status === "completed") {
        return [];
      }
      return [];
    });
  });

  it("loads and normalizes assistant dashboard data on mount", async () => {
    mockedListPendingDispenseQueue.mockResolvedValue([
      {
        id: 101,
        patientId: 7,
        diagnosis: "Viral fever",
        items: [
          {
            name: "Paracetamol",
            dose: "500mg",
            frequency: "BID",
            quantity: 10,
            source: "clinical",
            inventoryItemId: 99,
          },
        ],
      },
    ]);
    mockedListPatients.mockResolvedValue([
      buildPatientFixture({
        id: 7,
        name: "Jane Doe",
        nic: "990011223V",
        age: 31,
        gender: "female",
      }),
    ]);
    mockedGetAnalyticsOverview.mockResolvedValue({
      totalPatients: 12,
      totalMale: 7,
      totalFemale: 5,
      existingPatients: 10,
      newPatients: 2,
    });
    mockedListAppointments.mockImplementation(async (input?: { status?: string }) => {
      if (input?.status === "completed") {
        return [{ patientId: 7, completedAt: "2026-03-07T10:30:00.000Z" }];
      }
      return [{ doctorName: "Dr. House", status: "waiting" }];
    });

    const { result } = renderHook(() => useAssistantWorkflow(), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => {
      expect(result.current.pendingPatients).toHaveLength(1);
    });

    expect(result.current.activePrescription?.patient).toBe("Jane Doe");
    expect(result.current.activePrescription?.gender).toBe("Female");
    expect(result.current.availableDoctors).toEqual([
      expect.objectContaining({ name: "Dr. House", status: "Online" }),
    ]);
    expect(result.current.filteredCompleted).toHaveLength(1);
    expect(result.current.filteredCompleted[0]).toEqual(
      expect.objectContaining({
        name: "Jane Doe",
        patientCode: "P-0007",
        age: 31,
        nic: "990011223V",
        profileId: "7",
      })
    );
    expect(result.current.filteredCompleted[0]?.time).toEqual(expect.any(String));
    expect(result.current.stats).toEqual({ total: 12, male: 7, female: 5, existing: 10, new: 2 });
  });

  it("adds allergies without keeping the default sentinel or duplicates", async () => {
    const { result } = renderHook(() => useAssistantWorkflow(), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => {
      expect(mockedListPendingDispenseQueue).toHaveBeenCalled();
    });

    act(() => {
      result.current.setFormState((prev) => ({ ...prev, allergyInput: "Peanut" }));
    });
    act(() => {
      result.current.addAllergy();
    });

    expect(result.current.formState.allergies).toEqual(["Peanut"]);
    expect(result.current.formState.allergyInput).toBe("");

    act(() => {
      result.current.setFormState((prev) => ({ ...prev, allergyInput: "Peanut" }));
    });
    act(() => {
      result.current.addAllergy();
    });

    expect(result.current.formState.allergies).toEqual(["Peanut"]);
  });

  it("does not submit patient creation when required fields are missing", async () => {
    const { result } = renderHook(() => useAssistantWorkflow(), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => {
      expect(mockedListPendingDispenseQueue).toHaveBeenCalled();
    });

    await act(async () => {
      await result.current.addPatient();
    });

    expect(mockedCreatePatient).not.toHaveBeenCalled();
  });

  it("advances to the next queue item when dispense identifiers are unavailable", async () => {
    mockedListPendingDispenseQueue.mockResolvedValue([
      {
        patientId: 7,
        patientName: "Jane Doe",
        diagnosis: "Viral fever",
        items: [{ name: "Paracetamol", dose: "500mg", frequency: "BID", quantity: 10 }],
      },
      {
        patientId: 8,
        patientName: "John Doe",
        diagnosis: "Headache",
        items: [{ name: "Ibuprofen", dose: "200mg", frequency: "TID", quantity: 6 }],
      },
    ]);
    mockedListPatients.mockResolvedValue([
      buildPatientFixture({
        id: 7,
        name: "Jane Doe",
        nic: "990011223V",
        age: 31,
        gender: "female",
      }),
      buildPatientFixture({
        id: 8,
        name: "John Doe",
        nic: "881234567V",
        age: 29,
        gender: "male",
      }),
    ]);
    mockedGetCurrentUser.mockResolvedValue({
      id: null,
      role: "assistant",
      email: "assistant@medsys.test",
      name: "Assistant",
    } as never);

    const { result } = renderHook(() => useAssistantWorkflow(), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => {
      expect(result.current.pendingPatients).toHaveLength(2);
    });

    expect(result.current.activePrescription?.patient).toBe("Jane Doe");

    await act(async () => {
      await result.current.markDoneAndNext();
    });

    expect(mockedDispensePrescription).not.toHaveBeenCalled();
    expect(result.current.activePrescription?.patient).toBe("John Doe");
  });

  it("blocks assistant workflow actions for read-only roles", async () => {
    mockedGetCurrentUser.mockResolvedValue({
      id: 5,
      role: "doctor",
      email: "doctor@medsys.test",
      name: "Doctor",
    });

    const { result } = renderHook(() => useAssistantWorkflow(), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => {
      expect(mockedListPendingDispenseQueue).toHaveBeenCalled();
    });

    await act(async () => {
      await result.current.addPatient();
    });

    expect(result.current.canManageAssistantWorkflow).toBe(false);
    expect(mockedCreatePatient).not.toHaveBeenCalled();
    expect(result.current.createPatientState.error).toMatch(/patient registration access/i);
  });

  it("unlocks assistant workflow actions for doctors with explicit assistant coverage permissions", async () => {
    mockedGetCurrentUser.mockResolvedValue({
      id: 5,
      role: "doctor",
      email: "doctor@medsys.test",
      name: "Doctor",
      permissions: ["patient.write", "appointment.create", "prescription.dispense"],
    });

    const { result } = renderHook(() => useAssistantWorkflow(), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => {
      expect(result.current.canManageAssistantWorkflow).toBe(true);
    });

    expect(result.current.canManageAssistantWorkflow).toBe(true);
    expect(result.current.canCreatePatientsInWorkflow).toBe(true);
    expect(result.current.canCreateAppointmentsInWorkflow).toBe(true);
  });

  it("schedules appointments through the backend-backed appointments API", async () => {
    mockedListPatients.mockResolvedValue([
      buildPatientFixture({
        id: 7,
        name: "Jane Doe",
        nic: "990011223V",
        age: 31,
        gender: "female",
      }),
    ]);
    mockedListAppointments.mockImplementation(async (input?: { status?: string }) => {
      if (input?.status === "completed") {
        return [];
      }
      return [{ doctorId: 5, doctorName: "Dr. House", status: "waiting" }];
    });

    const { result } = renderHook(() => useAssistantWorkflow(), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => {
      expect(result.current.patientOptions).toHaveLength(1);
      expect(result.current.availableDoctors).toHaveLength(1);
    });

    act(() => {
      result.current.setScheduleForm((prev) => ({
        ...prev,
        patientId: "7",
        doctorId: "5",
        scheduledAt: "2026-03-12T09:30",
        reason: "Follow-up review",
        priority: "Urgent",
      }));
    });

    await act(async () => {
      await result.current.scheduleAppointment();
    });

    expect(mockedCreateAppointment).toHaveBeenCalledWith({
      patientId: 7,
      doctorId: 5,
      assistantId: 42,
      scheduledAt: new Date("2026-03-12T09:30").toISOString(),
      status: "waiting",
      reason: "Follow-up review",
      priority: "high",
    });
    expect(result.current.scheduleAppointmentState.status).toBe("success");
    expect(result.current.scheduleAppointmentFeedback).toEqual({
      tone: "success",
      message: "Appointment scheduled successfully.",
    });
  });

  it("clears stale patient-intake feedback when the form changes", async () => {
    const { result } = renderHook(() => useAssistantWorkflow(), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => {
      expect(mockedListPendingDispenseQueue).toHaveBeenCalled();
    });

    await act(async () => {
      await result.current.addPatient();
    });

    expect(result.current.createPatientState.status).toBe("error");

    act(() => {
      result.current.setFormState((prev) => ({ ...prev, nic: "991234567V" }));
    });

    expect(result.current.createPatientState.status).toBe("idle");
    expect(result.current.createPatientFeedback).toBeNull();
  });

  it("clears stale scheduling feedback when the appointment form changes", async () => {
    const { result } = renderHook(() => useAssistantWorkflow(), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => {
      expect(mockedListPendingDispenseQueue).toHaveBeenCalled();
    });

    await act(async () => {
      await result.current.scheduleAppointment();
    });

    expect(result.current.scheduleAppointmentState.status).toBe("error");

    act(() => {
      result.current.setScheduleForm((prev) => ({ ...prev, reason: "Follow-up review" }));
    });

    expect(result.current.scheduleAppointmentState.status).toBe("idle");
    expect(result.current.scheduleAppointmentFeedback).toBeNull();
  });
});
