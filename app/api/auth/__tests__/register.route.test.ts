import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import {
  BACKEND_ACCESS_COOKIE_NAME,
  BACKEND_REFRESH_COOKIE_NAME,
} from "../../../lib/backend-auth-cookies";
import { POST } from "../register/route";
import { createSessionToken, SESSION_COOKIE_NAME } from "../../../lib/session";

function createJwt(payload: Record<string, unknown>) {
  const header = Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString("base64url");
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${header}.${body}.signature`;
}

describe("POST /api/auth/register", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("rejects invalid registration payloads with a validation envelope", async () => {
    const request = new NextRequest("http://localhost/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        name: "",
        email: "bad-email",
        password: "short",
        role: "admin",
      }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({
      error: "Validation failed.",
      issues: expect.arrayContaining([
        { field: "name", message: "Is required." },
        { field: "email", message: "Must be a valid email address." },
        { field: "password", message: "Must be at least 8 characters." },
        { field: "role", message: "Must be one of owner, doctor, assistant." },
      ]),
    });
  });

  it("registers the bootstrap owner through backend routes and sets auth cookies", async () => {
    const accessToken = createJwt({
      userId: 11,
      role: "owner",
      email: "owner@example.com",
      name: "Owner User",
      exp: Math.floor(Date.now() / 1000) + 900,
    });
    const refreshToken = createJwt({
      exp: Math.floor(Date.now() / 1000) + 3600,
    });

    const fetchMock = vi.fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ bootstrapping: true, users: 0 }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            user: {
              id: 11,
              name: "Owner User",
              email: "owner@example.com",
              role: "owner",
              created_at: "2026-03-09T00:00:00.000Z",
            },
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        )
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            accessToken,
            refreshToken,
            expiresIn: 900,
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        )
      );
    vi.stubGlobal("fetch", fetchMock);

    const request = new NextRequest("http://localhost/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        name: "Owner User",
        email: "OWNER@example.com",
        password: "owner-pass-123",
        role: "owner",
      }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      user: {
        id: 11,
        name: "Owner User",
        email: "owner@example.com",
        role: "owner",
        created_at: "2026-03-09T00:00:00.000Z",
      },
    });
    expect(fetchMock.mock.calls[0]?.[0]).toBe("http://localhost:4000/v1/auth/status");
    expect(fetchMock.mock.calls[1]?.[0]).toBe("http://localhost:4000/v1/auth/register");
    expect(fetchMock.mock.calls[2]?.[0]).toBe("http://localhost:4000/v1/auth/login");
    expect(response.cookies.get(BACKEND_ACCESS_COOKIE_NAME)?.value).toBe(accessToken);
    expect(response.cookies.get(BACKEND_REFRESH_COOKIE_NAME)?.value).toBe(refreshToken);
    expect(response.cookies.get(SESSION_COOKIE_NAME)?.value).toBeTruthy();
  });

  it("requires an authorized session for non-bootstrap registration", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ bootstrapping: false, users: 2 }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    const request = new NextRequest("http://localhost/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        name: "Doctor User",
        email: "doctor@example.com",
        password: "doctor-pass-123",
        role: "doctor",
      }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toEqual({ error: "Unauthorized." });
  });

  it("passes authorized non-bootstrap registration through the backend-backed BFF", async () => {
    const sessionToken = createSessionToken({
      userId: 9,
      role: "owner",
      email: "owner@example.com",
      name: "Owner User",
    });
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ bootstrapping: false, users: 2 }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            user: {
              id: 12,
              firstName: "Dr.",
              lastName: "Jane Doe",
              email: "doctor@example.com",
              role: "doctor",
              createdAt: "2026-03-09T00:00:00.000Z",
            },
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        )
      );
    vi.stubGlobal("fetch", fetchMock);

    const request = new NextRequest("http://localhost/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        name: "Dr. Jane Doe",
        email: "Doctor@Example.com",
        password: "doctor-pass-123",
        role: "doctor",
      }),
      headers: {
        "Content-Type": "application/json",
        cookie: `${SESSION_COOKIE_NAME}=${sessionToken}; ${BACKEND_ACCESS_COOKIE_NAME}=backend-access-token; ${BACKEND_REFRESH_COOKIE_NAME}=backend-refresh-token`,
      },
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(fetchMock.mock.calls[1]?.[1]?.body).toBe(
      JSON.stringify({
        name: "Dr. Jane Doe",
        email: "doctor@example.com",
        password: "doctor-pass-123",
        role: "doctor",
      })
    );
    expect(body).toEqual({
      user: {
        id: 12,
        name: "Dr. Jane Doe",
        email: "doctor@example.com",
        role: "doctor",
        created_at: "2026-03-09T00:00:00.000Z",
      },
    });
  });
});
