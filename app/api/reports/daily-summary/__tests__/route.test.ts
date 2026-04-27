import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import {
  BACKEND_ACCESS_COOKIE_NAME,
  BACKEND_REFRESH_COOKIE_NAME,
} from "../../../../lib/backend-auth-cookies";
import { createSessionToken, SESSION_COOKIE_NAME } from "../../../../lib/session";
import { GET as dailySummaryRoute } from "../route";
import { GET as dailySummaryHistoryRoute } from "../history/route";

function buildRequest(url: string, role: "owner" | "doctor" | "assistant" = "doctor") {
  const sessionToken = createSessionToken({
    userId: 10,
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

describe("/api/reports/daily-summary BFF routes", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("loads daily summary through backend-backed BFF and forwards query", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ summaryDate: "2026-04-10", summary: {} }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    const response = await dailySummaryRoute(
      buildRequest(
        "http://localhost/api/reports/daily-summary?date=2026-04-10&visitMode=walk_in"
      )
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      "http://localhost:4000/v1/reports/daily-summary?date=2026-04-10&visitMode=walk_in"
    );
    expect(body).toEqual({ summaryDate: "2026-04-10", summary: {} });
  });

  it("loads daily summary history through backend-backed BFF and forwards query", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ roleContext: "doctor", items: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    const response = await dailySummaryHistoryRoute(
      buildRequest("http://localhost/api/reports/daily-summary/history?limit=10&visitMode=walk_in")
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      "http://localhost:4000/v1/reports/daily-summary/history?limit=10&visitMode=walk_in"
    );
    expect(body).toEqual({ roleContext: "doctor", items: [] });
  });

  it("blocks unauthenticated daily summary reads", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const response = await dailySummaryRoute(
      buildUnauthedRequest("http://localhost/api/reports/daily-summary")
    );
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toEqual({ error: "Unauthorized." });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
