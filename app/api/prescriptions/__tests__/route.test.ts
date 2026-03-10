import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import {
  BACKEND_ACCESS_COOKIE_NAME,
  BACKEND_REFRESH_COOKIE_NAME,
} from "../../../lib/backend-auth-cookies";
import { createSessionToken, SESSION_COOKIE_NAME } from "../../../lib/session";
import { GET as queueRoute } from "../queue/pending-dispense/route";
import { GET as detailRoute } from "../[id]/route";
import { POST as dispenseRoute } from "../[id]/dispense/route";

function buildRequest(url: string, method = "GET", body?: unknown) {
  const sessionToken = createSessionToken({
    userId: 42,
    role: "assistant",
    email: "assistant@example.com",
    name: "Assistant User",
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

describe("/api/prescriptions BFF routes", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("loads the pending dispense queue through the backend-backed BFF", async () => {
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

    const response = await queueRoute(
      buildRequest("http://localhost/api/prescriptions/queue/pending-dispense")
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      "http://localhost:4000/v1/prescriptions/queue/pending-dispense"
    );
    expect(body).toEqual([{ id: 101, patientId: 7, status: "pending_dispense" }]);
  });

  it("validates prescription detail ids before calling backend", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const response = await detailRoute(
      buildRequest("http://localhost/api/prescriptions/not-a-number"),
      { params: Promise.resolve({ id: "not-a-number" }) }
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({
      error: "Validation failed.",
      issues: [{ field: "id", message: "Must be a positive integer." }],
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("loads prescription detail through the backend-backed BFF", async () => {
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

    const response = await detailRoute(
      buildRequest("http://localhost/api/prescriptions/101"),
      { params: Promise.resolve({ id: "101" }) }
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(fetchMock.mock.calls[0]?.[0]).toBe("http://localhost:4000/v1/prescriptions/101");
    expect(body).toEqual({ id: 101, patientId: 7, items: [{ name: "Paracetamol" }] });
  });

  it("dispenses prescriptions through the backend-backed BFF", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({ success: true, prescriptionId: 101 }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    const payload = {
      assistantId: 42,
      dispensedAt: "2026-03-09T10:00:00.000Z",
      status: "completed",
      notes: "Dispensed",
      items: [{ inventoryItemId: 99, quantity: 10 }],
    };

    const response = await dispenseRoute(
      buildRequest("http://localhost/api/prescriptions/101/dispense", "POST", payload),
      { params: Promise.resolve({ id: "101" }) }
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      "http://localhost:4000/v1/prescriptions/101/dispense"
    );
    expect(fetchMock.mock.calls[0]?.[1]?.body).toBe(JSON.stringify(payload));
    expect(body).toEqual({ success: true, prescriptionId: 101 });
  });
});
