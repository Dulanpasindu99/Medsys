import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import {
  BACKEND_ACCESS_COOKIE_NAME,
  BACKEND_REFRESH_COOKIE_NAME,
} from "../../../../lib/backend-auth-cookies";
import { createSessionToken, SESSION_COOKIE_NAME } from "../../../../lib/session";
import { GET } from "../route";

function buildRequest(url: string, role: "owner" | "doctor" | "assistant" = "owner") {
  const sessionToken = createSessionToken({
    userId: 11,
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

describe("/api/audit/logs BFF route", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("loads audit logs through the backend-backed BFF", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify([{ id: 1, action: "staff.login" }]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    const response = await GET(buildRequest("http://localhost/api/audit/logs?limit=20", "owner"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(fetchMock.mock.calls[0]?.[0]).toBe("http://localhost:4000/v1/audit/logs?limit=20");
    expect(body).toEqual([{ id: 1, action: "staff.login" }]);
  });

  it("allows AI workspace access to audit logs", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify([{ id: 2, action: "audit.read" }]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    const response = await GET(buildRequest("http://localhost/api/audit/logs?limit=5", "doctor"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual([{ id: 2, action: "audit.read" }]);
  });
});
