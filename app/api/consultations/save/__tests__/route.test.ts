import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import {
  BACKEND_ACCESS_COOKIE_NAME,
  BACKEND_REFRESH_COOKIE_NAME,
} from "../../../../lib/backend-auth-cookies";
import { createSessionToken, SESSION_COOKIE_NAME } from "../../../../lib/session";
import { POST } from "../route";

function buildRequest(url: string, body: unknown) {
  const sessionToken = createSessionToken({
    userId: 42,
    role: "doctor",
    email: "doctor@example.com",
    name: "Dr. Jane Doe",
  });

  return new NextRequest(url, {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      cookie: [
        `${SESSION_COOKIE_NAME}=${sessionToken}`,
        `${BACKEND_ACCESS_COOKIE_NAME}=backend-access-token`,
        `${BACKEND_REFRESH_COOKIE_NAME}=backend-refresh-token`,
      ].join("; "),
      "Content-Type": "application/json",
    },
  });
}

describe("/api/consultations/save BFF route", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("saves consultations through the backend-backed BFF", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          encounterId: 13,
          prescriptionId: 21,
          newlyCreatedPatient: true,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    const payload = {
      patientDraft: {
        name: "Kamal Silva",
        dateOfBirth: "1999-06-10",
      },
      checkedAt: "2026-03-24T10:30:00Z",
      diagnoses: [{ diagnosisName: "Acute viral fever", icd10Code: "B34.9" }],
    };
    const response = await POST(buildRequest("http://localhost/api/consultations/save", payload));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(fetchMock.mock.calls[0]?.[0]).toBe("http://localhost:4000/v1/consultations/save");
    expect(fetchMock.mock.calls[0]?.[1]?.body).toBe(JSON.stringify(payload));
    expect(body).toEqual({ encounterId: 13, prescriptionId: 21, newlyCreatedPatient: true });
  });
});
