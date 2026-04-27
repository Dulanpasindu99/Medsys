import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import {
  BACKEND_ACCESS_COOKIE_NAME,
  BACKEND_REFRESH_COOKIE_NAME,
} from "../../../../lib/backend-auth-cookies";
import { createSessionToken, SESSION_COOKIE_NAME } from "../../../../lib/session";
import { GET as getAllergiesRoute } from "../allergies/route";
import { GET as getConditionsRoute } from "../conditions/route";
import { GET as getConsultationsRoute } from "../consultations/route";
import { GET as getVitalsRoute } from "../vitals/route";

function buildRequest(url: string, role: "owner" | "doctor" | "assistant" = "doctor") {
  const sessionToken = createSessionToken({
    userId: 7,
    role,
    email: `${role}@example.com`,
    name: `${role} user`,
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

describe("patient additional support-feed BFF routes", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it.each([
    { segment: "allergies", route: getAllergiesRoute },
    { segment: "conditions", route: getConditionsRoute },
    { segment: "consultations", route: getConsultationsRoute },
    { segment: "vitals", route: getVitalsRoute },
  ])("loads %s through backend-backed BFF", async ({ segment, route }) => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify([{ id: 1, segment }]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    const response = await route(
      buildRequest(`http://localhost/api/patients/7/${segment}`),
      { params: Promise.resolve({ id: "7" }) }
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(fetchMock.mock.calls[0]?.[0]).toBe(`http://localhost:4000/v1/patients/7/${segment}`);
    expect(body).toEqual([{ id: 1, segment }]);
  });

  it("validates patient id on additional support-feed routes", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const response = await getVitalsRoute(
      buildRequest("http://localhost/api/patients/not-a-number/vitals"),
      { params: Promise.resolve({ id: "not-a-number" }) }
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({
      error: "Validation failed.",
      issues: [{ field: "id", message: "Must be a positive integer." }],
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
