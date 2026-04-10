import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import {
  BACKEND_ACCESS_COOKIE_NAME,
  BACKEND_REFRESH_COOKIE_NAME,
} from "../../../../lib/backend-auth-cookies";
import { createSessionToken, SESSION_COOKIE_NAME } from "../../../../lib/session";
import { GET as getProfileRoute } from "../profile/route";
import { GET as getTimelineRoute } from "../timeline/route";
import { GET as getFamilyRoute } from "../family/route";

function buildRequest(url: string, role: "owner" | "doctor" | "assistant" = "doctor") {
  const sessionToken = createSessionToken({
    userId: 7,
    role,
    email: "doctor@example.com",
    name: "Dr. Jane Doe",
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

describe("patient profile support-feed BFF routes", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("loads patient profile through the backend-backed BFF", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ id: 7, name: "Jane Doe", nic: "990011223V" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    const response = await getProfileRoute(
      buildRequest("http://localhost/api/patients/7/profile"),
      { params: Promise.resolve({ id: "7" }) }
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(fetchMock.mock.calls[0]?.[0]).toBe("http://localhost:4000/v1/patients/7/profile");
    expect(body).toEqual({ id: 7, name: "Jane Doe", nic: "990011223V" });
  });

  it("loads patient timeline through the backend-backed BFF", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify([{ id: 3, note: "Observed for 24 hours", createdAt: "2026-03-09T00:00:00.000Z" }]),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    const response = await getTimelineRoute(
      buildRequest("http://localhost/api/patients/7/timeline"),
      { params: Promise.resolve({ id: "7" }) }
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(fetchMock.mock.calls[0]?.[0]).toBe("http://localhost:4000/v1/patients/7/timeline");
    expect(body).toEqual([
      { id: 3, note: "Observed for 24 hours", createdAt: "2026-03-09T00:00:00.000Z" },
    ]);
  });

  it("validates patient ids before loading support feeds", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const response = await getFamilyRoute(
      buildRequest("http://localhost/api/patients/not-a-number/family"),
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
});
