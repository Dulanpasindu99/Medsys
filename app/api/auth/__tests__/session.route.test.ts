import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import {
  BACKEND_ACCESS_COOKIE_NAME,
  BACKEND_REFRESH_COOKIE_NAME,
} from "../../../lib/backend-auth-cookies";
import { createSessionToken, SESSION_COOKIE_NAME } from "../../../lib/session";
import { GET as meRoute } from "../me/route";
import { POST as logoutRoute } from "../logout/route";
import { POST as activeRoleRoute } from "../active-role/route";

function buildRequest(
  url: string,
  method = "GET",
  body?: unknown,
  role: "owner" | "doctor" | "assistant" = "doctor"
) {
  const sessionToken = createSessionToken({
    userId: 7,
    role,
    roles: role === "owner" ? ["owner", "doctor"] : [role],
    activeRole: role,
    email: `${role}@example.com`,
    name: `${role} user`,
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

function buildUnauthedRequest(url: string, method = "GET", body?: unknown) {
  return new NextRequest(url, {
    method,
    body: body === undefined ? undefined : JSON.stringify(body),
    headers: {
      "Content-Type": "application/json",
    },
  });
}

describe("/api/auth session routes", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns session fallback from /api/auth/me when backend me call is unauthorized", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: "Unauthorized." }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    const sessionToken = createSessionToken({
      userId: 7,
      role: "doctor",
      email: "doctor@example.com",
      name: "doctor user",
    });
    const response = await meRoute(
      new NextRequest("http://localhost/api/auth/me", {
        method: "GET",
        headers: {
          cookie: [
            `${SESSION_COOKIE_NAME}=${sessionToken}`,
            `${BACKEND_ACCESS_COOKIE_NAME}=backend-access-token`,
          ].join("; "),
        },
      })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(fetchMock.mock.calls[0]?.[0]).toBe("http://localhost:4000/v1/auth/me");
    expect(body).toEqual(
      expect.objectContaining({
        id: 7,
        user_id: 7,
        role: "doctor",
        active_role: "doctor",
        email: "doctor@example.com",
      })
    );
  });

  it("returns 401 from /api/auth/me when backend me fails and no session exists", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: "Unauthorized." }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    const response = await meRoute(buildUnauthedRequest("http://localhost/api/auth/me"));
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toEqual({ error: "Unauthorized." });
  });

  it("validates /api/auth/active-role payload", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const response = await activeRoleRoute(
      buildRequest("http://localhost/api/auth/active-role", "POST", { activeRole: "admin" })
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({
      error: "activeRole must be one of owner, doctor, assistant.",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("switches active role through backend route and refreshes session cookie", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          user: {
            id: 7,
            name: "owner user",
            email: "owner@example.com",
            role: "owner",
            roles: ["owner", "doctor"],
            active_role: "doctor",
            permissions: ["analytics.view"],
          },
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    const response = await activeRoleRoute(
      buildRequest(
        "http://localhost/api/auth/active-role",
        "POST",
        { activeRole: "doctor" },
        "owner"
      )
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(fetchMock.mock.calls[0]?.[0]).toBe("http://localhost:4000/v1/auth/active-role");
    expect(JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body))).toEqual({
      activeRole: "doctor",
    });
    expect(body).toEqual(
      expect.objectContaining({
        id: 7,
        user_id: 7,
        role: "doctor",
        active_role: "doctor",
        roles: ["owner", "doctor"],
      })
    );
    expect(response.cookies.get(SESSION_COOKIE_NAME)?.value).toBeTruthy();
  });

  it("clears auth and session cookies from /api/auth/logout", async () => {
    const response = await logoutRoute();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ success: true });
    expect(response.cookies.get(SESSION_COOKIE_NAME)?.value).toBe("");
    expect(response.cookies.get(BACKEND_ACCESS_COOKIE_NAME)?.value).toBe("");
    expect(response.cookies.get(BACKEND_REFRESH_COOKIE_NAME)?.value).toBe("");
  });
});
