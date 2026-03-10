import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import {
  BACKEND_ACCESS_COOKIE_NAME,
  BACKEND_REFRESH_COOKIE_NAME,
} from "../../../lib/backend-auth-cookies";
import { createSessionToken, SESSION_COOKIE_NAME } from "../../../lib/session";
import { GET, POST } from "../route";

function buildRequest(url: string, method = "GET", body?: unknown) {
  const sessionToken = createSessionToken({
    userId: 42,
    role: "doctor",
    email: "doctor@example.com",
    name: "Dr. Jane Doe",
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

describe("/api/encounters BFF route", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("loads encounters through the backend-backed BFF", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify([{ id: 12, appointmentId: 7, notes: "Stable" }]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    const response = await GET(buildRequest("http://localhost/api/encounters"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(fetchMock.mock.calls[0]?.[0]).toBe("http://localhost:4000/v1/encounters");
    expect(body).toEqual([{ id: 12, appointmentId: 7, notes: "Stable" }]);
  });

  it("saves encounters through the backend-backed BFF", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
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
      tests: [{ testName: "CBC", status: "ordered" }],
      prescription: { items: [] },
    };
    const response = await POST(
      buildRequest("http://localhost/api/encounters", "POST", payload)
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(fetchMock.mock.calls[0]?.[0]).toBe("http://localhost:4000/v1/encounters");
    expect(fetchMock.mock.calls[0]?.[1]?.body).toBe(JSON.stringify(payload));
    expect(body).toEqual({ id: 13, appointmentId: 7, saved: true });
  });
});
