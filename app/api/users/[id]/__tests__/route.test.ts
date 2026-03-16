import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { BACKEND_ACCESS_COOKIE_NAME, BACKEND_REFRESH_COOKIE_NAME } from "../../../../lib/backend-auth-cookies";
import { createSessionToken, SESSION_COOKIE_NAME } from "../../../../lib/session";
import { PATCH } from "../route";

function buildRequest(body: unknown, role: "owner" | "doctor" | "assistant" = "owner") {
  const sessionToken = createSessionToken({
    userId: 9,
    role,
    email: `${role}@example.com`,
    name: role,
  });

  return new NextRequest("http://localhost/api/users/12", {
    method: "PATCH",
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

describe("PATCH /api/users/[id]", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("updates doctor extra permissions through the backend-backed BFF", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          user: {
            id: 12,
            name: "Dr. Jane Doe",
            email: "doctor@example.com",
            role: "doctor",
            permissions: ["patient.write", "appointment.create"],
            extra_permissions: ["appointment.create"],
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    const response = await PATCH(buildRequest({ extraPermissions: ["appointment.create"] }), {
      params: Promise.resolve({ id: "12" }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(fetchMock.mock.calls[0]?.[0]).toBe("http://localhost:4000/v1/users/12");
    expect(fetchMock.mock.calls[0]?.[1]?.body).toBe(
      JSON.stringify({ extraPermissions: ["appointment.create"] })
    );
    expect(body).toEqual({
      user: {
        id: 12,
        name: "Dr. Jane Doe",
        email: "doctor@example.com",
        role: "doctor",
        created_at: null,
        permissions: ["patient.write", "appointment.create"],
        extraPermissions: ["appointment.create"],
      },
    });
  });

  it("rejects invalid permission update payloads", async () => {
    vi.stubGlobal("fetch", vi.fn());

    const response = await PATCH(buildRequest({ extraPermissions: "appointment.create" }), {
      params: Promise.resolve({ id: "12" }),
    });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({
      error: "Validation failed.",
      issues: [{ field: "extraPermissions", message: "Must be an array of permission strings." }],
    });
  });
});
