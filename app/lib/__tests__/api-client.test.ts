import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createAppointment,
  saveConsultation,
  createEncounter,
  createPatient,
  createUser,
  createInventoryItem,
  createInventoryMovement,
  dispensePrescription,
  getAnalyticsOverview,
  listAppointments,
  listAuditLogs,
  getAuthStatus,
  getCurrentUser,
  listFamilies,
  getPatientFamily,
  getPatientById,
  getPatientProfile,
  getPrescriptionById,
  listInventory,
  searchInventory,
  listInventoryMovements,
  listEncounters,
  listPatientAllergies,
  listPatientConditions,
  listPatientTimeline,
  listPatientVitals,
  listPatients,
  listPendingDispenseQueue,
  listUsers,
  loginUser,
  registerUser,
  updateAppointment,
  startVisit,
  updateInventoryItem,
  updateUserExtraPermissions,
} from "../api-client";

describe("api client backend compatibility", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("loads patients through the BFF contract instead of direct backend adaptation", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            patients: [{ id: 7, name: "Jane Doe", nic: "990011223V", age: 31, gender: "female" }],
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        )
      )
    );

    await expect(listPatients()).resolves.toEqual([
      expect.objectContaining({ id: 7, name: "Jane Doe", nic: "990011223V" }),
    ]);
  });

  it("sends the current frontend patient payload shape to the BFF route", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          patient: { id: 8, name: "Jane Doe", nic: "991234567V", age: 27, gender: "female" },
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    await createPatient({
      firstName: "Jane",
      lastName: "Doe",
      dob: "1999-01-01",
      gender: "female",
      nic: "991234567V",
      phone: "555-2222",
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[0]).toBe("/api/patients");
    expect(fetchMock.mock.calls[0]?.[1]?.body).toBe(
      JSON.stringify({
        firstName: "Jane",
        lastName: "Doe",
        dob: "1999-01-01",
        gender: "female",
        nic: "991234567V",
        phone: "555-2222",
      })
    );
  });

  it("loads patient detail through the BFF route", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          patient: { id: 7, name: "Jane Doe", nic: "990011223V", age: 31, gender: "female" },
          history: [{ id: 3, note: "Observed for 24 hours" }],
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(getPatientById(7)).resolves.toEqual({
      patient: expect.objectContaining({ id: 7, name: "Jane Doe" }),
      history: [expect.objectContaining({ id: 3, note: "Observed for 24 hours" })],
    });
    expect(fetchMock.mock.calls[0]?.[0]).toBe("/api/patients/7");
  });

  it("loads patient-profile support feeds through dedicated BFF routes", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ id: 7, name: "Jane Doe" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ name: "Doe Family", members: [{ name: "John Doe" }] }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify([{ name: "Blood Pressure", value: "120/80" }]), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify([{ name: "Peanut" }]), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify([{ name: "Hypertension" }]), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify([{ title: "Clinical update" }]), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      );
    vi.stubGlobal("fetch", fetchMock);

    await expect(getPatientProfile(7)).resolves.toEqual({ id: 7, name: "Jane Doe" });
    await expect(getPatientFamily(7)).resolves.toEqual({
      name: "Doe Family",
      members: [{ name: "John Doe" }],
    });
    await expect(listPatientVitals(7)).resolves.toEqual([
      { name: "Blood Pressure", value: "120/80" },
    ]);
    await expect(listPatientAllergies(7)).resolves.toEqual([{ name: "Peanut" }]);
    await expect(listPatientConditions(7)).resolves.toEqual([{ name: "Hypertension" }]);
    await expect(listPatientTimeline(7)).resolves.toEqual([{ title: "Clinical update" }]);

    expect(fetchMock.mock.calls[0]?.[0]).toBe("/api/patients/7/profile");
    expect(fetchMock.mock.calls[1]?.[0]).toBe("/api/patients/7/family");
    expect(fetchMock.mock.calls[2]?.[0]).toBe("/api/patients/7/vitals");
    expect(fetchMock.mock.calls[3]?.[0]).toBe("/api/patients/7/allergies");
    expect(fetchMock.mock.calls[4]?.[0]).toBe("/api/patients/7/conditions");
    expect(fetchMock.mock.calls[5]?.[0]).toBe("/api/patients/7/timeline");
  });

  it("rejects malformed patient-profile support feed payloads with a contract error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ value: "120/80" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      )
    );

    await expect(listPatientVitals(7)).rejects.toMatchObject({
      status: 502,
      message: expect.stringContaining("patient vitals response is not an array"),
    });
  });

  it("loads appointments through the dedicated BFF route", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify([{ id: 10, patientId: 7, status: "waiting" }]),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(listAppointments({ status: "waiting" })).resolves.toEqual([
      { id: 10, patientId: 7, status: "waiting" },
    ]);
    expect(fetchMock.mock.calls[0]?.[0]).toBe("/api/appointments?status=waiting");
  });

  it("creates appointments through the dedicated BFF route", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({ id: 12, patientId: 7, doctorId: 5, assistantId: 42, status: "waiting" }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    const payload = {
      patientId: 7,
      doctorId: 5,
      assistantId: 42,
      scheduledAt: "2026-03-12T09:30:00.000Z",
      status: "waiting" as const,
      reason: "Follow-up review",
      priority: "high" as const,
    };

    await expect(createAppointment(payload)).resolves.toEqual({
      id: 12,
      patientId: 7,
      doctorId: 5,
      assistantId: 42,
      status: "waiting",
    });
    expect(fetchMock.mock.calls[0]?.[0]).toBe("/api/appointments");
    expect(fetchMock.mock.calls[0]?.[1]?.body).toBe(JSON.stringify(payload));
  });

  it("updates appointment lifecycle state through the dedicated BFF route", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({ id: 12, status: "completed" }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      updateAppointment(12, {
        status: "completed",
      })
    ).resolves.toEqual({ id: 12, status: "completed" });

    expect(fetchMock.mock.calls[0]?.[0]).toBe("/api/appointments/12");
    expect(fetchMock.mock.calls[0]?.[1]?.body).toBe(JSON.stringify({ status: "completed" }));
  });

  it("starts walk-in visits through the dedicated BFF route", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          reused: false,
          visit: { id: 14, patientId: 7, doctorId: 5, status: "in_consultation" },
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      startVisit({
        patientId: 7,
        reason: "Walk-in consultation",
        priority: "normal",
      })
    ).resolves.toEqual({
      reused: false,
      visit: { id: 14, patientId: 7, doctorId: 5, status: "in_consultation" },
    });

    expect(fetchMock.mock.calls[0]?.[0]).toBe("/api/visits/start");
    expect(fetchMock.mock.calls[0]?.[1]?.body).toBe(
      JSON.stringify({
        patientId: 7,
        reason: "Walk-in consultation",
        priority: "normal",
      })
    );
  });

  it("loads and saves encounters through the dedicated BFF route", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify([{ id: 12, appointmentId: 7, notes: "Stable" }]), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ id: 13, appointmentId: 7, saved: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      );
    vi.stubGlobal("fetch", fetchMock);

    const payload = {
      appointmentId: 7,
      patientId: 5,
      doctorId: 42,
      checkedAt: "2026-03-10T08:00:00.000Z",
      notes: "Stable follow-up",
      nextVisitDate: "2026-03-17",
      diagnoses: [{ diagnosisName: "Hypertension", icd10Code: "I10" }],
      tests: [{ testName: "CBC", status: "ordered" as const }],
      prescription: { items: [] },
    };

    await expect(listEncounters()).resolves.toEqual([
      { id: 12, appointmentId: 7, notes: "Stable" },
    ]);
    await expect(createEncounter(payload)).resolves.toEqual({
      id: 13,
      appointmentId: 7,
      saved: true,
    });

    expect(fetchMock.mock.calls[0]?.[0]).toBe("/api/encounters");
    expect(fetchMock.mock.calls[1]?.[0]).toBe("/api/encounters");
    expect(fetchMock.mock.calls[1]?.[1]?.body).toBe(JSON.stringify(payload));
  });

  it("saves consultations through the dedicated BFF route", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ encounterId: 13, prescriptionId: 21, newlyCreatedPatient: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    const payload = {
      workflowType: "walk_in" as const,
      patientId: 7,
      checkedAt: "2026-03-24T10:30:00Z",
      reason: "Walk-in consultation",
      priority: "normal" as const,
      diagnoses: [{ diagnosisName: "Acute viral fever", icd10Code: "B34.9" }],
      vitals: { heartRate: 84, temperatureC: 37.8 },
      allergies: [{ allergyName: "Penicillin", severity: "high" as const, isActive: true }],
      prescription: {
        items: [
          {
            drugName: "Paracetamol",
            dose: "500mg",
            frequency: "TID",
            duration: "3 days",
            quantity: 9,
            source: "clinical" as const,
          },
        ],
      },
    };

    await expect(saveConsultation(payload)).resolves.toEqual({
      encounterId: 13,
      prescriptionId: 21,
      newlyCreatedPatient: true,
    });

    expect(fetchMock.mock.calls[0]?.[0]).toBe("/api/consultations/save");
    expect(fetchMock.mock.calls[0]?.[1]?.body).toBe(JSON.stringify(payload));
  });

  it("loads families and audit logs through dedicated BFF routes", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify([{ id: 1, name: "Doe Family" }]), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify([{ id: 2, action: "staff.login" }]), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      );
    vi.stubGlobal("fetch", fetchMock);

    await expect(listFamilies()).resolves.toEqual([{ id: 1, name: "Doe Family" }]);
    await expect(listAuditLogs({ limit: 20 })).resolves.toEqual([
      { id: 2, action: "staff.login" },
    ]);

    expect(fetchMock.mock.calls[0]?.[0]).toBe("/api/families");
    expect(fetchMock.mock.calls[1]?.[0]).toBe("/api/audit/logs?limit=20");
  });

  it("loads analytics overview through the dedicated BFF route", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          totalPatients: 42,
          totalEncounters: 18,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(getAnalyticsOverview()).resolves.toEqual({
      totalPatients: 42,
      totalEncounters: 18,
    });
    expect(fetchMock.mock.calls[0]?.[0]).toBe("/api/analytics/overview");
  });

  it("rejects malformed analytics overview payloads with a contract error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify([{ totalPatients: 42 }]), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      )
    );

    await expect(getAnalyticsOverview()).rejects.toMatchObject({
      status: 502,
      message: expect.stringContaining("analytics overview response is not an object"),
    });
  });

  it("loads the pending dispense queue through the dedicated BFF route", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify([{ id: 101, patientId: 7, status: "pending_dispense" }]),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(listPendingDispenseQueue()).resolves.toEqual([
      { id: 101, patientId: 7, status: "pending_dispense" },
    ]);
    expect(fetchMock.mock.calls[0]?.[0]).toBe("/api/prescriptions/queue/pending-dispense");
  });

  it("loads prescription detail through the dedicated BFF route", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({ id: 101, patientId: 7, items: [{ name: "Paracetamol" }] }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(getPrescriptionById(101)).resolves.toEqual({
      id: 101,
      patientId: 7,
      items: [{ name: "Paracetamol" }],
    });
    expect(fetchMock.mock.calls[0]?.[0]).toBe("/api/prescriptions/101");
  });

  it("dispenses prescriptions through the dedicated BFF route", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    const payload = {
      assistantId: 42,
      dispensedAt: "2026-03-09T10:00:00.000Z",
      status: "completed" as const,
      notes: "Dispensed",
      items: [{ inventoryItemId: 99, quantity: 10 }],
    };

    await expect(dispensePrescription(101, payload)).resolves.toEqual({ success: true });
    expect(fetchMock.mock.calls[0]?.[0]).toBe("/api/prescriptions/101/dispense");
    expect(fetchMock.mock.calls[0]?.[1]?.body).toBe(JSON.stringify(payload));
  });

  it("loads inventory through the dedicated BFF route", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify([{ id: 1, name: "Paracetamol", quantity: 24 }]),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(listInventory()).resolves.toEqual([
      { id: 1, name: "Paracetamol", quantity: 24 },
    ]);
    expect(fetchMock.mock.calls[0]?.[0]).toBe("/api/inventory");
  });

  it("searches inventory through the dedicated BFF route", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify([{ id: 12, name: "Paracetamol 500mg", quantity: 149 }]),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      searchInventory({ q: "Paracetamol", limit: 10, category: "medicine" })
    ).resolves.toEqual([{ id: 12, name: "Paracetamol 500mg", quantity: 149 }]);
    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      "/api/inventory/search?q=Paracetamol&limit=10&category=medicine"
    );
  });

  it("writes inventory mutations through the dedicated BFF routes", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ id: 2, name: "Ibuprofen" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ id: 2, quantity: 15 }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ id: 100, type: "out", quantity: 1 }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      );
    vi.stubGlobal("fetch", fetchMock);

    await createInventoryItem({
      name: "Ibuprofen",
      category: "medicine",
      quantity: 10,
      unit: "units",
    });
    await updateInventoryItem(2, { quantity: 15 });
    await createInventoryMovement(2, { type: "out", quantity: 1, note: "Quick out" });

    expect(fetchMock.mock.calls[0]?.[0]).toBe("/api/inventory");
    expect(fetchMock.mock.calls[1]?.[0]).toBe("/api/inventory/2");
    expect(fetchMock.mock.calls[2]?.[0]).toBe("/api/inventory/2/movements");
  });

  it("loads inventory movements through the dedicated BFF route", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify([{ id: 99, type: "in", quantity: 1 }]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(listInventoryMovements(2)).resolves.toEqual([
      { id: 99, type: "in", quantity: 1 },
    ]);
    expect(fetchMock.mock.calls[0]?.[0]).toBe("/api/inventory/2/movements");
  });

  it("reads current-user identity through the normalized auth BFF route", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            id: 42,
            role: "doctor",
            email: "doctor@example.com",
            name: "Dr. Jane Doe",
            permissions: ["patient.write", "appointment.create"],
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        )
      )
    );

    await expect(getCurrentUser()).resolves.toEqual({
      id: 42,
      role: "doctor",
      email: "doctor@example.com",
      name: "Dr. Jane Doe",
      permissions: ["patient.write", "appointment.create"],
    });
  });

  it("reads login identity directly from the normalized auth BFF route", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            id: 42,
            role: "assistant",
            email: "assistant@example.com",
            name: "Alex Support",
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        )
      )
    );

    await expect(loginUser("assistant@example.com", "secret-123", "assistant")).resolves.toEqual(
      {
        id: 42,
        role: "assistant",
        email: "assistant@example.com",
        name: "Alex Support",
      }
    );
  });

  it("reads auth bootstrap status through the normalized BFF contract", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ bootstrapping: true, users: 0 }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      )
    );

    await expect(getAuthStatus()).resolves.toEqual({
      bootstrapping: true,
      users: 0,
    });
  });

  it("registers users through the normalized BFF contract without client-side adaptation", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          user: {
            id: 11,
            name: "Owner User",
            email: "owner@example.com",
            role: "owner",
          },
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      registerUser({
        name: "Owner User",
        email: "OWNER@example.com",
        password: "owner-pass-123",
        role: "owner",
      })
    ).resolves.toEqual(
      expect.objectContaining({
        id: 11,
        name: "Owner User",
        email: "owner@example.com",
        role: "owner",
      })
    );

    expect(fetchMock.mock.calls[0]?.[1]?.body).toBe(
      JSON.stringify({
        name: "Owner User",
        email: "OWNER@example.com",
        password: "owner-pass-123",
        role: "owner",
      })
    );
  });

  it("loads users through the dedicated users BFF route", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          users: [{ id: 5, name: "Dr. Jane Doe", email: "doctor@example.com", role: "doctor" }],
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(listUsers()).resolves.toEqual([
      { id: 5, name: "Dr. Jane Doe", email: "doctor@example.com", role: "doctor" },
    ]);
    expect(fetchMock.mock.calls[0]?.[0]).toBe("/api/users");
  });

  it("creates staff users through the dedicated users BFF route", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          user: { id: 6, name: "Alex Support", email: "assistant@example.com", role: "assistant" },
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      createUser({
        name: "Alex Support",
        email: "assistant@example.com",
        password: "secret-123",
        role: "assistant",
      })
    ).resolves.toEqual({
      id: 6,
      name: "Alex Support",
      email: "assistant@example.com",
      role: "assistant",
    });

    expect(fetchMock.mock.calls[0]?.[0]).toBe("/api/users");
    expect(fetchMock.mock.calls[0]?.[1]?.body).toBe(
      JSON.stringify({
        name: "Alex Support",
        email: "assistant@example.com",
        password: "secret-123",
        role: "assistant",
      })
    );
  });

  it("creates doctor users with explicit support permissions", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          user: {
            id: 9,
            name: "Dr. Jane Doe",
            email: "doctor@example.com",
            role: "doctor",
            extraPermissions: ["appointment.create", "prescription.dispense"],
          },
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      createUser({
        name: "Dr. Jane Doe",
        email: "doctor@example.com",
        password: "secret-123",
        role: "doctor",
        extraPermissions: ["appointment.create", "prescription.dispense"],
      })
    ).resolves.toEqual({
      id: 9,
      name: "Dr. Jane Doe",
      email: "doctor@example.com",
      role: "doctor",
      extraPermissions: ["appointment.create", "prescription.dispense"],
    });

    expect(fetchMock.mock.calls[0]?.[1]?.body).toBe(
      JSON.stringify({
        name: "Dr. Jane Doe",
        email: "doctor@example.com",
        password: "secret-123",
        role: "doctor",
        extraPermissions: ["appointment.create", "prescription.dispense"],
      })
    );
  });

  it("updates doctor support permissions through the dedicated user-detail BFF route", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          user: {
            id: 9,
            name: "Dr. Jane Doe",
            email: "doctor@example.com",
            role: "doctor",
            extraPermissions: ["appointment.create"],
          },
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      updateUserExtraPermissions(9, {
        extraPermissions: ["appointment.create"],
      })
    ).resolves.toEqual({
      id: 9,
      name: "Dr. Jane Doe",
      email: "doctor@example.com",
      role: "doctor",
      extraPermissions: ["appointment.create"],
    });

    expect(fetchMock.mock.calls[0]?.[0]).toBe("/api/users/9");
    expect(fetchMock.mock.calls[0]?.[1]?.body).toBe(
      JSON.stringify({ extraPermissions: ["appointment.create"] })
    );
  });
});
