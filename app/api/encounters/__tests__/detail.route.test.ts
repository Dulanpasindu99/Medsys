import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import {
  BACKEND_ACCESS_COOKIE_NAME,
  BACKEND_REFRESH_COOKIE_NAME,
} from "../../../lib/backend-auth-cookies";
import { createSessionToken, SESSION_COOKIE_NAME } from "../../../lib/session";
import { GET } from "../[id]/route";

function buildRequest(url: string) {
  const sessionToken = createSessionToken({
    userId: 5,
    role: "doctor",
    email: "doctor@example.com",
    name: "doctor user",
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

describe("/api/encounters/:id BFF route", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("loads encounter detail through the backend-backed BFF", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ id: 44, notes: "Stable follow-up" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    const response = await GET(buildRequest("http://localhost/api/encounters/44"), {
      params: Promise.resolve({ id: "44" }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(fetchMock.mock.calls[0]?.[0]).toBe("http://localhost:4000/v1/encounters/44");
    expect(body).toEqual({ id: 44, notes: "Stable follow-up" });
  });

  it("blocks unauthenticated encounter detail reads", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const response = await GET(buildUnauthedRequest("http://localhost/api/encounters/44"), {
      params: Promise.resolve({ id: "44" }),
    });
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toEqual({ error: "Unauthorized." });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns contract mismatch when backend payload is not JSON", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response("ok", {
        status: 200,
        headers: { "Content-Type": "text/plain" },
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    const response = await GET(buildRequest("http://localhost/api/encounters/44"), {
      params: Promise.resolve({ id: "44" }),
    });
    const body = await response.json();

    expect(response.status).toBe(502);
    expect(body).toEqual({
      error: "Backend contract mismatch for the encounter detail route.",
    });
  });
});
