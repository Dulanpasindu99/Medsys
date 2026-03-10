import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "../status/route";

describe("GET /api/auth/status", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns normalized backend auth status through the BFF", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ bootstrapping: true, users: 0 }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    const response = await GET(new NextRequest("http://localhost/api/auth/status"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(fetchMock.mock.calls[0]?.[0]).toBe("http://localhost:4000/v1/auth/status");
    expect(body).toEqual({ bootstrapping: true, users: 0 });
  });

  it("returns 502 when the backend auth status payload drifts", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ users: 0 }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      )
    );

    const response = await GET(new NextRequest("http://localhost/api/auth/status"));
    const body = await response.json();

    expect(response.status).toBe(502);
    expect(body).toEqual({
      error: "Backend contract mismatch for the auth status route.",
    });
  });
});
