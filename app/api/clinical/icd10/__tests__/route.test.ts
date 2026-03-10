import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import {
  BACKEND_ACCESS_COOKIE_NAME,
  BACKEND_REFRESH_COOKIE_NAME,
} from "../../../../lib/backend-auth-cookies";
import { GET } from "../route";
import { createSessionToken, SESSION_COOKIE_NAME } from "../../../../lib/session";

function buildAuthenticatedRequest(terms: string) {
  const sessionToken = createSessionToken({
    userId: 3,
    role: "doctor",
    email: "doctor@example.com",
    name: "Dr. Jane Doe",
  });

  return new NextRequest(`http://localhost/api/clinical/icd10?terms=${encodeURIComponent(terms)}`, {
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

describe("/api/clinical/icd10 BFF route", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("loads ICD-10 suggestions through the backend-backed BFF", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ suggestions: ["A00 - Cholera"] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    const response = await GET(buildAuthenticatedRequest("chol"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      "http://localhost:4000/v1/clinical/icd10?terms=chol"
    );
    expect(body).toEqual({ suggestions: ["A00 - Cholera"] });
  });

  it("returns an empty list without calling backend when terms are too short", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const response = await GET(buildAuthenticatedRequest("a"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ suggestions: [] });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("requires an authenticated session", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const response = await GET(
      new NextRequest("http://localhost/api/clinical/icd10?terms=chol", {
        method: "GET",
      })
    );
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toEqual({ error: "Unauthorized." });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
