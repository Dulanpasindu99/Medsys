import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import {
  BACKEND_ACCESS_COOKIE_NAME,
  BACKEND_REFRESH_COOKIE_NAME,
} from "../../../lib/backend-auth-cookies";
import { GET, POST } from "../route";
import { PATCH } from "../[id]/route";
import { createSessionToken, SESSION_COOKIE_NAME } from "../../../lib/session";

function buildRequest(
  url: string,
  method = "GET",
  body?: unknown,
  role: "owner" | "doctor" | "assistant" = "doctor"
) {
  const sessionToken = createSessionToken({
    userId: 7,
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

describe("/api/appointments BFF routes", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("loads appointments through the backend-backed BFF", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify([
          { id: 10, patientId: 7, status: "waiting" },
          { id: 11, patientId: 8, status: "completed" },
        ]),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    const response = await GET(
      buildRequest("http://localhost/api/appointments?status=waiting")
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      "http://localhost:4000/v1/appointments?status=waiting"
    );
    expect(body).toEqual([
      { id: 10, patientId: 7, status: "waiting" },
      { id: 11, patientId: 8, status: "completed" },
    ]);
  });

  it("rejects invalid appointment status filters with a validation envelope", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const response = await GET(
      buildRequest("http://localhost/api/appointments?status=scheduled")
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({
      error: "Validation failed.",
      issues: [
        {
          field: "status",
          message: "Must be one of waiting, in_consultation, completed, cancelled.",
        },
      ],
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("passes appointment creation through the backend-backed BFF", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          id: 12,
          patientId: 7,
          doctorId: 5,
          assistantId: 3,
          status: "waiting",
        }),
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
      assistantId: 3,
      scheduledAt: "2026-03-09T08:00:00.000Z",
      status: "waiting",
      reason: "General review",
      priority: "normal",
    };
    const response = await POST(
      buildRequest("http://localhost/api/appointments", "POST", payload, "assistant")
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(fetchMock.mock.calls[0]?.[0]).toBe("http://localhost:4000/v1/appointments");
    expect(fetchMock.mock.calls[0]?.[1]?.body).toBe(JSON.stringify(payload));
    expect(body).toEqual({
      id: 12,
      patientId: 7,
      doctorId: 5,
      assistantId: 3,
      status: "waiting",
    });
  });

  it("allows doctors to create appointments", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          id: 44,
          patientId: 7,
          doctorId: 5,
          assistantId: 3,
          status: "waiting",
        }),
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
      assistantId: 3,
      scheduledAt: "2026-03-09T08:00:00.000Z",
      status: "waiting",
      reason: "General review",
      priority: "normal",
    };

    const response = await POST(
      buildRequest("http://localhost/api/appointments", "POST", payload, "doctor")
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(body).toEqual({
      id: 44,
      patientId: 7,
      doctorId: 5,
      assistantId: 3,
      status: "waiting",
    });
  });

  it("rejects invalid appointment create payloads with a validation envelope", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(
      buildRequest(
        "http://localhost/api/appointments",
        "POST",
        {
          patientId: 0,
          doctorId: "bad",
          assistantId: 3,
          scheduledAt: "09-03-2026",
          status: "scheduled",
          reason: "",
          priority: "urgent",
          extra: true,
        },
        "assistant"
      )
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("Validation failed.");
    expect(body.issues).toEqual(
      expect.arrayContaining([
        { field: "patientId", message: "Must be a positive integer." },
        { field: "doctorId", message: "Must be an integer." },
        { field: "scheduledAt", message: "Must be a valid ISO date-time string." },
        {
          field: "status",
          message: "Must be one of waiting, in_consultation, completed, cancelled.",
        },
        { field: "reason", message: "Is required." },
        { field: "priority", message: "Must be one of low, normal, high, critical." },
        { field: "extra", message: "Unknown field." },
      ])
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("updates appointment status through the backend-backed detail route", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          id: 12,
          patientId: 7,
          status: "in_consultation",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    const response = await PATCH(
      buildRequest(
        "http://localhost/api/appointments/12",
        "PATCH",
        { status: "in_consultation" },
        "doctor"
      ),
      { params: Promise.resolve({ id: "12" }) }
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(fetchMock.mock.calls[0]?.[0]).toBe("http://localhost:4000/v1/appointments/12");
    expect(fetchMock.mock.calls[0]?.[1]?.body).toBe(JSON.stringify({ status: "in_consultation" }));
    expect(body).toEqual({
      id: 12,
      patientId: 7,
      status: "in_consultation",
    });
  });

  it("blocks appointment status updates for roles without lifecycle access", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const response = await PATCH(
      buildRequest(
        "http://localhost/api/appointments/12",
        "PATCH",
        { status: "cancelled" },
        "assistant"
      ),
      { params: Promise.resolve({ id: "12" }) }
    );
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body).toEqual({ error: "Forbidden." });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
