import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "../login/route";
import {
  BACKEND_ACCESS_COOKIE_NAME,
  BACKEND_REFRESH_COOKIE_NAME,
} from "../../../lib/backend-auth-cookies";
import { SESSION_COOKIE_NAME } from "../../../lib/session";

function createJwt(payload: Record<string, unknown>) {
  const header = Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString("base64url");
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${header}.${body}.signature`;
}

describe("POST /api/auth/login", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    delete process.env.NEXT_PUBLIC_ORGANIZATION_SLUG;
    delete process.env.AUTH_ORGANIZATION_SLUG;
  });

  it("rejects invalid login payloads with a validation envelope", async () => {
    const request = new NextRequest("http://localhost/api/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: "not-an-email",
        password: "short",
        roleHint: "admin",
      }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({
      error: "Validation failed.",
      issues: expect.arrayContaining([
        { field: "email", message: "Must be a valid email address." },
        { field: "password", message: "Must be at least 8 characters." },
        { field: "roleHint", message: "Must be one of owner, doctor, assistant." },
      ]),
    });
  });

  it("sets secure backend auth cookies and a signed app session", async () => {
    const accessToken = createJwt({
      userId: 42,
      role: "doctor",
      email: "doctor@example.com",
      name: "Dr. Jane Doe",
      exp: Math.floor(Date.now() / 1000) + 900,
    });
    const refreshToken = createJwt({
      exp: Math.floor(Date.now() / 1000) + 3600,
    });

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
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
      )
    );

    const request = new NextRequest("http://localhost/api/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: "doctor@example.com",
        password: "secret-123",
        organizationSlug: "sunrise",
      }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual(
      expect.objectContaining({
        id: 42,
        user_id: 42,
        name: "Dr. Jane Doe",
        email: "doctor@example.com",
        role: "doctor",
        active_role: "doctor",
        roles: ["doctor"],
      })
    );
    expect(response.cookies.get(BACKEND_ACCESS_COOKIE_NAME)?.value).toBe(accessToken);
    expect(response.cookies.get(BACKEND_REFRESH_COOKIE_NAME)?.value).toBe(refreshToken);
    expect(response.cookies.get(SESSION_COOKIE_NAME)?.value).toBeTruthy();
  });

  it("returns explicit permissions when the backend token carries them", async () => {
    const accessToken = createJwt({
      userId: 42,
      role: "doctor",
      email: "doctor@example.com",
      name: "Dr. Jane Doe",
      permissions: ["assistant.workspace.view", "appointment.create", "prescription.dispense"],
      exp: Math.floor(Date.now() / 1000) + 900,
    });
    const refreshToken = createJwt({
      exp: Math.floor(Date.now() / 1000) + 3600,
    });

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
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
      )
    );

    const request = new NextRequest("http://localhost/api/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: "doctor@example.com",
        password: "secret-123",
        organizationSlug: "sunrise",
      }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await POST(request);
    const body = await response.json();

    expect(body).toEqual(
      expect.objectContaining({
        id: 42,
        user_id: 42,
        name: "Dr. Jane Doe",
        email: "doctor@example.com",
        role: "doctor",
        active_role: "doctor",
        roles: ["doctor"],
        permissions: ["assistant.workspace.view", "appointment.create", "prescription.dispense"],
      })
    );
  });

  it("falls back to backend user permissions when tokens omit them", async () => {
    const accessToken = createJwt({
      userId: 42,
      role: "doctor",
      email: "doctor@example.com",
      name: "Dr. Jane Doe",
      exp: Math.floor(Date.now() / 1000) + 900,
    });
    const refreshToken = createJwt({
      exp: Math.floor(Date.now() / 1000) + 3600,
    });

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            accessToken,
            refreshToken,
            expiresIn: 900,
            user: {
              id: 42,
              name: "Dr. Jane Doe",
              email: "doctor@example.com",
              role: "doctor",
              permissions: ["patient.write", "appointment.create", "prescription.dispense"],
              extra_permissions: ["appointment.create", "prescription.dispense"],
            },
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        )
      )
    );

    const request = new NextRequest("http://localhost/api/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: "doctor@example.com",
        password: "secret-123",
        organizationSlug: "sunrise",
      }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual(
      expect.objectContaining({
        id: 42,
        user_id: 42,
        name: "Dr. Jane Doe",
        email: "doctor@example.com",
        role: "doctor",
        active_role: "doctor",
        roles: ["doctor"],
        permissions: ["patient.write", "appointment.create", "prescription.dispense"],
        extra_permissions: ["appointment.create", "prescription.dispense"],
      })
    );
  });

  it("accepts backend auth payloads with extra metadata and snake_case duplicates", async () => {
    const accessToken = createJwt({
      userId: 42,
      role: "doctor",
      email: "doctor@example.com",
      name: "Dr. Jane Doe",
      exp: Math.floor(Date.now() / 1000) + 900,
    });
    const refreshToken = createJwt({
      exp: Math.floor(Date.now() / 1000) + 3600,
    });

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            accessToken,
            refreshToken,
            expiresIn: 900,
            access_token: accessToken,
            refresh_token: refreshToken,
            expires_in: 900,
            tokenType: "Bearer",
            user: {
              id: 42,
              name: "Dr. Jane Doe",
              email: "doctor@example.com",
              role: "doctor",
            },
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        )
      )
    );

    const request = new NextRequest("http://localhost/api/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: "doctor@example.com",
        password: "secret-123",
        organizationSlug: "sunrise",
      }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual(
      expect.objectContaining({
        id: 42,
        user_id: 42,
        name: "Dr. Jane Doe",
        email: "doctor@example.com",
        role: "doctor",
        active_role: "doctor",
        roles: ["doctor"],
      })
    );
  });

  it("returns 502 when the backend login payload is malformed", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            accessToken: "",
            refreshToken: "refresh-token",
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        )
      )
    );

    const request = new NextRequest("http://localhost/api/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: "doctor@example.com",
        password: "secret-123",
        organizationSlug: "sunrise",
      }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(502);
    expect(body).toEqual({
      error: "Authentication service returned an invalid token payload.",
      issues: expect.arrayContaining([
        { field: "accessToken", message: "Is required." },
      ]),
    });
  });

  it("uses slug-based login when organizationSlug is provided in request body", async () => {
    const accessToken = createJwt({
      userId: 42,
      role: "owner",
      email: "owner@sunrise.local",
      name: "Owner",
      exp: Math.floor(Date.now() / 1000) + 900,
    });
    const refreshToken = createJwt({
      exp: Math.floor(Date.now() / 1000) + 3600,
    });

    const fetchMock = vi.fn().mockResolvedValueOnce(
      new Response(JSON.stringify({ accessToken, refreshToken, expiresIn: 900 }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );

    vi.stubGlobal("fetch", fetchMock);

    const request = new NextRequest("http://localhost/api/auth/login", {
      method: "POST",
      body: JSON.stringify({
        organizationSlug: "sunrise",
        email: "owner@sunrise.local",
        password: "ownerSun@123",
        roleHint: "owner",
      }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    expect(fetchMock.mock.calls[0]?.[0]).toBe("http://localhost:4000/v1/auth/login-with-slug");
  });

  it("uses legacy login when organizationId is provided without slug", async () => {
    const accessToken = createJwt({
      userId: 77,
      role: "owner",
      email: "owner@sunrise.local",
      name: "Sunrise Owner",
      exp: Math.floor(Date.now() / 1000) + 900,
    });
    const refreshToken = createJwt({
      exp: Math.floor(Date.now() / 1000) + 3600,
    });

    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ accessToken, refreshToken, expiresIn: 900 }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );

    vi.stubGlobal("fetch", fetchMock);

    const request = new NextRequest("http://localhost/api/auth/login", {
      method: "POST",
      body: JSON.stringify({
        organizationId: "742a1bcf-c8fd-49b3-b729-3c6d67c19979",
        email: "owner@example.com",
        password: "ownerSun@123",
        roleHint: "owner",
      }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    expect(fetchMock.mock.calls[0]?.[0]).toBe("http://localhost:4000/v1/auth/login");
  });

  it("returns 400 when neither organizationSlug nor organizationId can be resolved", async () => {
    delete process.env.NEXT_PUBLIC_ORGANIZATION_SLUG;
    delete process.env.AUTH_ORGANIZATION_SLUG;

    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const request = new NextRequest("http://localhost/api/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: "owner@example.com",
        password: "ownerSun@123",
        roleHint: "owner",
      }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({
      error: "organizationSlug or organizationId is required",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
