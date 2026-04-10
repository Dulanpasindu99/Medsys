import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import {
  BACKEND_ACCESS_COOKIE_NAME,
  BACKEND_REFRESH_COOKIE_NAME,
} from "../../../../lib/backend-auth-cookies";
import { createSessionToken, SESSION_COOKIE_NAME } from "../../../../lib/session";
import { GET as searchInventoryRoute } from "../route";

function buildRequest(url: string) {
  const sessionToken = createSessionToken({
    userId: 42,
    role: "assistant",
    email: "assistant@example.com",
    name: "assistant user",
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

describe("/api/inventory/search BFF route", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("searches inventory through the backend-backed BFF", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify([{ id: 12, name: "Paracetamol 500mg", quantity: 149, category: "medicine" }]),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    const response = await searchInventoryRoute(
      buildRequest("http://localhost/api/inventory/search?q=Paracetamol&limit=10&category=medicine")
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      "http://localhost:4000/v1/inventory/search?q=Paracetamol&limit=10&category=medicine"
    );
    expect(body).toEqual([{ id: 12, name: "Paracetamol 500mg", quantity: 149, category: "medicine" }]);
  });
});
