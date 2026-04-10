import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import {
  BACKEND_ACCESS_COOKIE_NAME,
  BACKEND_REFRESH_COOKIE_NAME,
} from "../../../lib/backend-auth-cookies";
import { createSessionToken, SESSION_COOKIE_NAME } from "../../../lib/session";
import { GET } from "../route";

function buildRequest() {
  const sessionToken = createSessionToken({
    userId: 7,
    role: "doctor",
    email: "doctor@example.com",
    name: "Dr. Jane Doe",
  });

  return new NextRequest("http://localhost/api/families", {
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

describe("/api/families BFF route", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("loads families through the backend-backed BFF", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify([{ id: 1, name: "Doe Family" }]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    const response = await GET(buildRequest());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(fetchMock.mock.calls[0]?.[0]).toBe("http://localhost:4000/v1/families");
    expect(body).toEqual([{ id: 1, name: "Doe Family" }]);
  });
});
