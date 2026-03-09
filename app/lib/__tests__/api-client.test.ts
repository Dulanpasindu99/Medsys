import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createPatient,
  getAuthStatus,
  getCurrentUser,
  getPatientById,
  listPatients,
  loginUser,
  registerUser,
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
