import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import {
  BACKEND_ACCESS_COOKIE_NAME,
  BACKEND_REFRESH_COOKIE_NAME,
} from "../../../../lib/backend-auth-cookies";
import { createSessionToken, SESSION_COOKIE_NAME } from "../../../../lib/session";
import { POST } from "../route";

function buildRequest(
  body?: unknown,
  role: "owner" | "doctor" | "assistant" = "doctor"
) {
  const sessionToken = createSessionToken({
    userId: 7,
    role,
    email: `${role}@example.com`,
    name: role,
  });

  return new NextRequest("http://localhost/api/visits/start", {
    method: "POST",
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

describe("/api/visits/start BFF route", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("passes visit-start payloads through the backend-backed BFF", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          reused: true,
          visit: { id: 14, patientId: 32, doctorId: 5, status: "in_consultation" },
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    const payload = {
      patientId: 32,
      reason: "Walk-in consultation",
      priority: "normal",
    };
    const response = await POST(buildRequest(payload, "doctor"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(fetchMock.mock.calls[0]?.[0]).toBe("http://localhost:4000/v1/visits/start");
    expect(fetchMock.mock.calls[0]?.[1]?.body).toBe(JSON.stringify(payload));
    expect(body).toEqual({
      reused: true,
      visit: { id: 14, patientId: 32, doctorId: 5, status: "in_consultation" },
    });
  });

  it("rejects invalid visit-start payloads with a validation envelope", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(
      buildRequest(
        {
          patientId: 0,
          reason: "",
          priority: "urgent",
          extra: true,
        },
        "doctor"
      )
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("Validation failed.");
    expect(body.issues).toEqual(
      expect.arrayContaining([
        { field: "patientId", message: "Must be a positive integer." },
        { field: "reason", message: "Is required." },
        { field: "priority", message: "Must be one of low, normal, high, critical." },
        { field: "extra", message: "Unknown field." },
      ])
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
