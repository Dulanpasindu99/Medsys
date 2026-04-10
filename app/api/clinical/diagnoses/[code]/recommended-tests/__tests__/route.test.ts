import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import {
  BACKEND_ACCESS_COOKIE_NAME,
  BACKEND_REFRESH_COOKIE_NAME,
} from "../../../../../../lib/backend-auth-cookies";
import { createSessionToken, SESSION_COOKIE_NAME } from "../../../../../../lib/session";
import { GET } from "../route";

function buildAuthenticatedRequest(code: string) {
  const sessionToken = createSessionToken({
    userId: 3,
    role: "doctor",
    email: "doctor@example.com",
    name: "Dr. Jane Doe",
  });

  return {
    request: new NextRequest(
      `http://localhost/api/clinical/diagnoses/${encodeURIComponent(code)}/recommended-tests`,
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
    ),
    params: Promise.resolve({ code }),
  };
}

describe("/api/clinical/diagnoses/[code]/recommended-tests BFF route", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("loads backend recommended tests", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          diagnosis: { code: "E11.9", codeSystem: "ICD-10-CM" },
          source: "curated",
          tests: [
            {
              code: "4548-4",
              codeSystem: "LOINC",
              display: "Hemoglobin A1c/Hemoglobin.total in Blood",
              category: "laboratory",
            },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    const { request, params } = buildAuthenticatedRequest("E11.9");
    const response = await GET(request, { params });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      "http://localhost:4000/v1/clinical/diagnoses/E11.9/recommended-tests"
    );
    expect(body.tests).toHaveLength(1);
  });
});
