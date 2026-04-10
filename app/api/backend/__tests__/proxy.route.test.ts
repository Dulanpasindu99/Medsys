import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "../[...path]/route";
import {
  BACKEND_ACCESS_COOKIE_NAME,
  BACKEND_REFRESH_COOKIE_NAME,
} from "../../../lib/backend-auth-cookies";
import { createSessionToken, SESSION_COOKIE_NAME } from "../../../lib/session";

function createJwt(payload: Record<string, unknown>) {
  const header = Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString("base64url");
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${header}.${body}.signature`;
}

function buildRequest(cookieHeader: string) {
  return new NextRequest("http://localhost/api/backend/v1/patients", {
    method: "GET",
    headers: { cookie: cookieHeader },
  });
}

describe("GET /api/backend/[...path]", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("refreshes backend tokens server-side and retries the original request", async () => {
    const oldAccessToken = "expired-access";
    const oldRefreshToken = "refresh-token";
    const newAccessToken = createJwt({
      userId: 7,
      role: "doctor",
      email: "doctor@example.com",
      name: "Dr. Jane Doe",
      exp: Math.floor(Date.now() / 1000) + 900,
    });
    const newRefreshToken = createJwt({
      exp: Math.floor(Date.now() / 1000) + 3600,
    });
    const sessionToken = createSessionToken({
      userId: 7,
      role: "doctor",
      email: "doctor@example.com",
      name: "Dr. Jane Doe",
    });

    const fetchMock = vi.fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: "expired" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        })
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
            expiresIn: 900,
            access_token: newAccessToken,
            refresh_token: newRefreshToken,
            expires_in: 900,
            tokenType: "Bearer",
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        )
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ data: [{ id: 1, name: "Jane Doe" }] }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      );
    vi.stubGlobal("fetch", fetchMock);

    const request = buildRequest(
      `${BACKEND_ACCESS_COOKIE_NAME}=${oldAccessToken}; ${BACKEND_REFRESH_COOKIE_NAME}=${oldRefreshToken}; ${SESSION_COOKIE_NAME}=${sessionToken}`
    );

    const response = await GET(request, {
      params: Promise.resolve({ path: ["v1", "patients"] }),
    });
    const body = await response.json();
    const firstCallHeaders = fetchMock.mock.calls[0]?.[1]?.headers as Headers;
    const thirdCallHeaders = fetchMock.mock.calls[2]?.[1]?.headers as Headers;

    expect(response.status).toBe(200);
    expect(body).toEqual({ data: [{ id: 1, name: "Jane Doe" }] });
    expect(fetchMock.mock.calls[0]?.[0]).toBe("http://localhost:4000/v1/patients");
    expect(fetchMock.mock.calls[2]?.[0]).toBe("http://localhost:4000/v1/patients");
    expect(firstCallHeaders.get("authorization")).toBe(`Bearer ${oldAccessToken}`);
    expect(thirdCallHeaders.get("authorization")).toBe(`Bearer ${newAccessToken}`);
    expect(response.cookies.get(BACKEND_ACCESS_COOKIE_NAME)?.value).toBe(newAccessToken);
    expect(response.cookies.get(BACKEND_REFRESH_COOKIE_NAME)?.value).toBe(newRefreshToken);
    expect(response.cookies.get(SESSION_COOKIE_NAME)?.value).toBeTruthy();
  });

  it("clears auth cookies when refresh fails", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: "expired" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: "refresh failed" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        })
      );
    vi.stubGlobal("fetch", fetchMock);

    const request = buildRequest(
      `${BACKEND_ACCESS_COOKIE_NAME}=expired; ${BACKEND_REFRESH_COOKIE_NAME}=refresh; ${SESSION_COOKIE_NAME}=session`
    );

    const response = await GET(request, {
      params: Promise.resolve({ path: ["v1", "patients"] }),
    });
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toEqual({ error: "Unauthorized." });
    expect(response.cookies.get(BACKEND_ACCESS_COOKIE_NAME)?.value).toBe("");
    expect(response.cookies.get(BACKEND_REFRESH_COOKIE_NAME)?.value).toBe("");
    expect(response.cookies.get(SESSION_COOKIE_NAME)?.value).toBe("");
  });

  it("clears auth cookies when the refresh payload is malformed", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: "expired" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        })
      )
      .mockResolvedValueOnce(
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
      );
    vi.stubGlobal("fetch", fetchMock);

    const request = buildRequest(
      `${BACKEND_ACCESS_COOKIE_NAME}=expired; ${BACKEND_REFRESH_COOKIE_NAME}=refresh; ${SESSION_COOKIE_NAME}=session`
    );

    const response = await GET(request, {
      params: Promise.resolve({ path: ["v1", "patients"] }),
    });
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toEqual({ error: "Unauthorized." });
    expect(response.cookies.get(BACKEND_ACCESS_COOKIE_NAME)?.value).toBe("");
    expect(response.cookies.get(BACKEND_REFRESH_COOKIE_NAME)?.value).toBe("");
    expect(response.cookies.get(SESSION_COOKIE_NAME)?.value).toBe("");
  });
});
