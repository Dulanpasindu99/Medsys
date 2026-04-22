import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import {
  BACKEND_ACCESS_COOKIE_NAME,
  BACKEND_REFRESH_COOKIE_NAME,
} from "../../../../lib/backend-auth-cookies";
import { GET } from "../route";
import { createSessionToken, SESSION_COOKIE_NAME } from "../../../../lib/session";

function buildAuthenticatedRequest(
  url = "http://localhost/api/reports/doctor-performance?range=30d"
) {
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

describe("/api/reports/[reportType] BFF route", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("forwards query params and returns backend payload for doctor-performance", async () => {
    const backendPayload = {
      generatedAt: "2026-04-22T05:00:00.000Z",
      range: {
        preset: "30d",
        dateFrom: "2026-03-23T00:00:00.000Z",
        dateTo: "2026-04-22T23:59:59.999Z",
      },
      filters: {
        doctorId: null,
        assistantId: null,
        visitMode: null,
        doctorWorkflowMode: null,
      },
      summary: {},
      charts: {},
      tables: {},
    };

    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(backendPayload), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    const response = await GET(buildAuthenticatedRequest(), {
      params: Promise.resolve({ reportType: "doctor-performance" }),
    });

    expect(response.status).toBe(200);
    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      "http://localhost:4000/v1/reports/doctor-performance?range=30d"
    );
    expect(await response.json()).toEqual(backendPayload);
  });

  it("passes backend error status and body through without remapping", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: "Query failed." }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    const response = await GET(buildAuthenticatedRequest(), {
      params: Promise.resolve({ reportType: "doctor-performance" }),
    });

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "Query failed." });
  });
});
