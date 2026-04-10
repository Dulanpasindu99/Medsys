import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import {
  BACKEND_ACCESS_COOKIE_NAME,
  BACKEND_REFRESH_COOKIE_NAME,
} from "../../../../lib/backend-auth-cookies";
import { GET } from "../route";
import { createSessionToken, SESSION_COOKIE_NAME } from "../../../../lib/session";

function buildAuthenticatedRequest() {
  const sessionToken = createSessionToken({
    userId: 9,
    role: "doctor",
    email: "doctor@example.com",
    name: "Dr. Jane Doe",
  });

  return new NextRequest("http://localhost/api/analytics/overview", {
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

describe("/api/analytics/overview BFF route", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("loads analytics overview through the backend-backed BFF", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          totalPatients: 42,
          totalEncounters: 18,
          totalMale: 20,
          totalFemale: 22,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    const response = await GET(buildAuthenticatedRequest());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(fetchMock.mock.calls[0]?.[0]).toBe("http://localhost:4000/v1/analytics/overview");
    expect(body).toEqual({
      totalPatients: 42,
      totalEncounters: 18,
      totalMale: 20,
      totalFemale: 22,
    });
  });

  it("requires an authenticated analytics session", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const response = await GET(
      new NextRequest("http://localhost/api/analytics/overview", {
        method: "GET",
      })
    );
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toEqual({ error: "Unauthorized." });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
