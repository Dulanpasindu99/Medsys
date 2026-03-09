import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createPatient,
  createInventoryItem,
  createInventoryMovement,
  dispensePrescription,
  listAppointments,
  getAuthStatus,
  getCurrentUser,
  getPatientById,
  getPrescriptionById,
  listInventory,
  listInventoryMovements,
  listPatients,
  listPendingDispenseQueue,
  loginUser,
  registerUser,
  updateInventoryItem,
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
      name: "Jane Doe",
      nic: "991234567V",
      age: 27,
      gender: "female",
      mobile: "555-2222",
      priority: "high",
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[0]).toBe("/api/patients");
    expect(fetchMock.mock.calls[0]?.[1]?.body).toBe(
      JSON.stringify({
        name: "Jane Doe",
        nic: "991234567V",
        age: 27,
        gender: "female",
        mobile: "555-2222",
        priority: "high",
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

  it("throws a clear error when the current-user payload drifts from the frontend contract", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ id: 1, role: "doctor" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      )
    );

    await expect(getCurrentUser()).rejects.toMatchObject({
      status: 502,
      message: expect.stringContaining("Backend contract mismatch"),
    });
  });

  it("adapts login identity payloads through the shared session adapter", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            id: 42,
            role: "assistant",
            email: "assistant@example.com",
            name: "Alex Support",
            organizationId: "org-1",
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        )
      )
    );

    await expect(loginUser("assistant@example.com", "secret-123", "assistant")).resolves.toEqual({
      id: 42,
      role: "assistant",
      email: "assistant@example.com",
      name: "Alex Support",
    });
  });

  it("reads auth bootstrap status through the BFF contract", async () => {
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

  it("registers users through the BFF contract without client-side name splitting", async () => {
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
});
