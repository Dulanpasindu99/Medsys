import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import {
  BACKEND_ACCESS_COOKIE_NAME,
  BACKEND_REFRESH_COOKIE_NAME,
} from "../../../../lib/backend-auth-cookies";
import { GET } from "../route";
import { createSessionToken, SESSION_COOKIE_NAME } from "../../../../lib/session";

function buildAuthenticatedRequest(url = "http://localhost/api/analytics/dashboard?range=7d") {
  const sessionToken = createSessionToken({
    userId: 9,
    role: "owner",
    email: "owner@example.com",
    name: "Owner User",
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

describe("/api/analytics/dashboard BFF route", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("loads analytics dashboard through the backend-backed BFF", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          roleContext: {
            resolvedRole: "owner",
            actorRole: "owner",
            activeRole: "owner",
            roles: ["owner"],
            doctorId: null,
            assistantId: null,
            workflowProfile: { mode: "standard" },
          },
          generatedAt: "2026-04-03T12:00:00.000Z",
          range: {
            preset: "7d",
            dateFrom: "2026-03-27T00:00:00.000Z",
            dateTo: "2026-04-03T23:59:59.999Z",
          },
          summary: {},
          charts: {},
          insights: [],
          tables: {},
          alerts: [],
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
    expect(fetchMock.mock.calls[0]?.[0]).toBe("http://localhost:4000/v1/analytics/dashboard?range=7d");
    expect(body.roleContext.resolvedRole).toBe("owner");
  });
});
