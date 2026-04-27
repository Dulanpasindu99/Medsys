import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import {
  BACKEND_ACCESS_COOKIE_NAME,
  BACKEND_REFRESH_COOKIE_NAME,
} from "../../../lib/backend-auth-cookies";
import { createSessionToken, SESSION_COOKIE_NAME } from "../../../lib/session";
import { GET } from "../doctors/route";

function buildRequest(url: string, role: "owner" | "doctor" | "assistant" = "assistant") {
  const sessionToken = createSessionToken({
    userId: 5,
    role,
    email: `${role}@example.com`,
    name: `${role} user`,
  });

  return new NextRequest(url, {
    method: "GET",
    headers: {
      cookie: [
        `${SESSION_COOKIE_NAME}=${sessionToken}`,
        `${BACKEND_ACCESS_COOKIE_NAME}=backend-access-token`,
        `${BACKEND_REFRESH_COOKIE_NAME}=backend-refresh-token`,
      ].join("; "),
    },
  });
}

function buildUnauthedRequest(url: string) {
  return new NextRequest(url, { method: "GET" });
}

describe("/api/appointments/doctors BFF route", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("loads appointment doctors through the backend-backed BFF", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          doctors: [{ id: 7, name: "Dr. Jane Doe", email: "doctor@medsys.local" }],
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    const response = await GET(buildRequest("http://localhost/api/appointments/doctors"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(fetchMock.mock.calls[0]?.[0]).toBe("http://localhost:4000/v1/appointments/doctors");
    expect(body).toEqual({
      doctors: [{ id: 7, name: "Dr. Jane Doe", email: "doctor@medsys.local" }],
    });
  });

  it("blocks unauthenticated access to appointment doctors", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const response = await GET(buildUnauthedRequest("http://localhost/api/appointments/doctors"));
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toEqual({ error: "Unauthorized." });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
