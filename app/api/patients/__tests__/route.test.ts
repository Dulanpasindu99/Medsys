import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { BACKEND_ACCESS_COOKIE_NAME, BACKEND_REFRESH_COOKIE_NAME } from "../../../lib/backend-auth-cookies";
import { createSessionToken, SESSION_COOKIE_NAME } from "../../../lib/session";
import { GET as listPatientsRoute, POST as createPatientRoute } from "../route";
import {
  DELETE as deletePatientRoute,
  GET as getPatientRoute,
  PATCH as updatePatientRoute,
} from "../[id]/route";
import {
  GET as listPatientHistoryRoute,
  POST as createPatientHistoryRoute,
} from "../[id]/history/route";

function buildRequest(
  url: string,
  role: "owner" | "doctor" | "assistant",
  method = "GET",
  body?: unknown
) {
  const sessionToken = createSessionToken({
    userId: 1,
    role,
    email: `${role}@example.com`,
    name: role,
  });

  return new NextRequest(url, {
    method,
    body: body === undefined ? undefined : JSON.stringify(body),
    headers: {
      cookie: [
        `${SESSION_COOKIE_NAME}=${sessionToken}`,
        `${BACKEND_ACCESS_COOKIE_NAME}=backend-access-token`,
        `${BACKEND_REFRESH_COOKIE_NAME}=backend-refresh-token`,
      ].join("; "),
      "Content-Type": "application/json",
    },
  });
}

describe("/api/patients BFF routes", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("allows assistants to read the patient list through the backend-backed BFF", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          patients: [
            {
              id: 7,
              firstName: "Jane",
              lastName: "Doe",
              nic: "990011223V",
              age: 31,
              gender: "female",
              phone: "555-0000",
              createdAt: "2026-03-09T00:00:00.000Z",
            },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    const response = await listPatientsRoute(
      buildRequest("http://localhost/api/patients", "assistant")
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(fetchMock.mock.calls[0]?.[0]).toBe("http://localhost:4000/v1/patients");
    expect(body).toEqual({
      patients: [
        {
          id: 7,
          name: "Jane Doe",
          date_of_birth: null,
          phone: "555-0000",
          address: null,
          created_at: "2026-03-09T00:00:00.000Z",
          nic: "990011223V",
          age: 31,
          gender: "female",
        },
      ],
    });
  });

  it("serializes patient detail responses from backend payloads", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            patient: {
              id: 7,
              firstName: "Jane",
              lastName: "Doe",
              nic: "990011223V",
              age: 31,
              gender: "female",
              createdAt: "2026-03-09T00:00:00.000Z",
            },
            history: [
              {
                id: 3,
                note: "Observed for 24 hours",
                createdAt: "2026-03-09T00:00:00.000Z",
                createdByUserId: 1,
                createdByName: "Doctor User",
                createdByRole: "doctor",
              },
            ],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      )
    );

    const response = await getPatientRoute(
      buildRequest("http://localhost/api/patients/7", "doctor"),
      { params: Promise.resolve({ id: "7" }) }
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      patient: {
        id: 7,
        name: "Jane Doe",
        date_of_birth: null,
        address: null,
        phone: null,
        created_at: "2026-03-09T00:00:00.000Z",
        nic: "990011223V",
        age: 31,
        gender: "female",
      },
      history: [
        {
          id: 3,
          note: "Observed for 24 hours",
          created_at: "2026-03-09T00:00:00.000Z",
          created_by_user_id: 1,
          created_by_name: "Doctor User",
          created_by_role: "doctor",
        },
      ],
    });
  });

  it("blocks doctors from deleting patients", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const response = await deletePatientRoute(
      buildRequest("http://localhost/api/patients/7", "doctor", "DELETE"),
      { params: Promise.resolve({ id: "7" }) }
    );
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body).toEqual({ error: "Forbidden." });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects invalid patient create payloads with a validation envelope", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const response = await createPatientRoute(
      buildRequest("http://localhost/api/patients", "assistant", "POST", {
        name: "",
        dateOfBirth: "09-03-2026",
        phone: 12345,
        age: -1,
        gender: "unknown",
        priority: "urgent",
        extra: "field",
      })
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({
      error: "Validation failed.",
      issues: expect.arrayContaining([
        { field: "name", message: "Is required." },
        { field: "dateOfBirth", message: "Must use YYYY-MM-DD format." },
        { field: "phone", message: "Must be a string." },
        { field: "age", message: "Must be zero or greater." },
        { field: "gender", message: "Must be one of male, female, other." },
        { field: "priority", message: "Must be one of low, normal, high, critical." },
        { field: "extra", message: "Unknown field." },
      ]),
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("passes the current frontend patient payload shape through the BFF", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          patient: {
            id: 9,
            name: "Jane Doe",
            nic: "991234567V",
            age: 27,
            gender: "female",
            phone: "555-2222",
            created_at: "2026-03-09T00:00:00.000Z",
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    const response = await createPatientRoute(
      buildRequest("http://localhost/api/patients", "assistant", "POST", {
        name: " Jane Doe ",
        nic: "991234567V",
        age: 27,
        gender: "female",
        mobile: "555-2222",
        priority: "high",
      })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(fetchMock.mock.calls[0]?.[1]?.body).toBe(
      JSON.stringify({
        name: "Jane Doe",
        dateOfBirth: null,
        phone: "555-2222",
        address: null,
        nic: "991234567V",
        age: 27,
        gender: "female",
        mobile: "555-2222",
        priority: "high",
      })
    );
    expect(body).toEqual({
      patient: {
        id: 9,
        name: "Jane Doe",
        date_of_birth: null,
        phone: "555-2222",
        address: null,
        created_at: "2026-03-09T00:00:00.000Z",
        nic: "991234567V",
        age: 27,
        gender: "female",
      },
    });
  });

  it("rejects empty patient patch payloads", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const response = await updatePatientRoute(
      buildRequest("http://localhost/api/patients/7", "doctor", "PATCH", {}),
      { params: Promise.resolve({ id: "7" }) }
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({
      error: "Validation failed.",
      issues: [{ field: "body", message: "At least one updatable field is required." }],
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects invalid patient history payloads", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const response = await createPatientHistoryRoute(
      buildRequest("http://localhost/api/patients/7/history", "doctor", "POST", {
        note: "",
        extra: true,
      }),
      { params: Promise.resolve({ id: "7" }) }
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({
      error: "Validation failed.",
      issues: expect.arrayContaining([
        { field: "note", message: "Is required." },
        { field: "extra", message: "Unknown field." },
      ]),
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("serializes patient history reads consistently", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            history: [
              {
                id: 3,
                note: "Observed for 24 hours",
                createdAt: "2026-03-09T00:00:00.000Z",
                createdByUserId: 1,
                createdByName: "Doctor User",
                createdByRole: "doctor",
              },
            ],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      )
    );

    const response = await listPatientHistoryRoute(
      buildRequest("http://localhost/api/patients/7/history", "assistant"),
      { params: Promise.resolve({ id: "7" }) }
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      history: [
        {
          id: 3,
          note: "Observed for 24 hours",
          created_at: "2026-03-09T00:00:00.000Z",
          created_by_user_id: 1,
          created_by_name: "Doctor User",
          created_by_role: "doctor",
        },
      ],
    });
  });

  it("returns 502 when the patient detail wrapper drifts", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            id: 7,
            firstName: "Jane",
            lastName: "Doe",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      )
    );

    const response = await getPatientRoute(
      buildRequest("http://localhost/api/patients/7", "doctor"),
      { params: Promise.resolve({ id: "7" }) }
    );
    const body = await response.json();

    expect(response.status).toBe(502);
    expect(body).toEqual({
      error: "Backend contract mismatch for the patient detail route.",
    });
  });
});
