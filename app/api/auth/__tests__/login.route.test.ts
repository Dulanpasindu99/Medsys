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
        password: "secret",
      }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      id: 42,
      name: "Dr. Jane Doe",
      email: "doctor@example.com",
      role: "doctor",
    });
    expect(response.cookies.get(BACKEND_ACCESS_COOKIE_NAME)?.value).toBe(accessToken);
    expect(response.cookies.get(BACKEND_REFRESH_COOKIE_NAME)?.value).toBe(refreshToken);
    expect(response.cookies.get(SESSION_COOKIE_NAME)?.value).toBeTruthy();
  });
});
