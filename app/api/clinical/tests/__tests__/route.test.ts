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
    `http://localhost/api/clinical/tests?terms=${encodeURIComponent(terms)}&limit=10`,
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

describe("/api/clinical/tests BFF route", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("loads backend medical test suggestions", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          tests: [
            {
              code: "1558-6",
              codeSystem: "LOINC",
              display: "Fasting glucose [Mass/volume] in Serum or Plasma",
              category: null,
            },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    const response = await GET(buildAuthenticatedRequest("glucose"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      "http://localhost:4000/v1/clinical/tests?terms=glucose&limit=10"
    );
    expect(body.tests).toHaveLength(1);
  });
});
