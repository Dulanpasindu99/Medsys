import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import {
  BACKEND_ACCESS_COOKIE_NAME,
  BACKEND_REFRESH_COOKIE_NAME,
} from "../../../../lib/backend-auth-cookies";
import { createSessionToken, SESSION_COOKIE_NAME } from "../../../../lib/session";
import { GET } from "../route";

function buildAuthenticatedRequest(terms: string) {
  const sessionToken = createSessionToken({
    userId: 3,
    role: "doctor",
    email: "doctor@example.com",
    name: "Dr. Jane Doe",
  });

  return new NextRequest(
    `http://localhost/api/clinical/diagnoses?terms=${encodeURIComponent(terms)}&limit=10`,
    {
      method: "GET",
      headers: {
        cookie: [
          `${SESSION_COOKIE_NAME}=${sessionToken}`,
          `${BACKEND_ACCESS_COOKIE_NAME}=backend-access-token`,
          `${BACKEND_REFRESH_COOKIE_NAME}=backend-refresh-token`,
        ].join("; "),
      },
    }
  );
}

describe("/api/clinical/diagnoses BFF route", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("loads backend diagnosis suggestions", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          diagnoses: [
            {
              code: "E11.9",
              codeSystem: "ICD-10-CM",
              display: "Type 2 diabetes mellitus without complications",
            },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    const response = await GET(buildAuthenticatedRequest("diab"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      "http://localhost:4000/v1/clinical/diagnoses?terms=diab&limit=10"
    );
    expect(body.diagnoses).toHaveLength(1);
  });
});
