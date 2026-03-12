import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { BACKEND_ACCESS_COOKIE_NAME, BACKEND_REFRESH_COOKIE_NAME } from "../../../lib/backend-auth-cookies";
import { createSessionToken, SESSION_COOKIE_NAME } from "../../../lib/session";
import { GET, POST } from "../route";

function buildRequest(
  role: "owner" | "doctor" | "assistant",
  init?: { url?: string; method?: string; body?: unknown }
) {
  const sessionToken = createSessionToken({
    userId: 9,
    role,
    email: `${role}@example.com`,
    name: role,
  });

  return new NextRequest(init?.url ?? "http://localhost/api/users", {
    method: init?.method ?? "GET",
    body: init?.body === undefined ? undefined : JSON.stringify(init.body),
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

describe("/api/users BFF routes", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("allows owners to list users through the backend-backed BFF", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          users: [
            {
              id: 4,
              firstName: "Owner",
              lastName: "User",
              email: "owner@example.com",
              role: "owner",
              createdAt: "2026-03-09T00:00:00.000Z",
            },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    const response = await GET(buildRequest("owner"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(fetchMock.mock.calls[0]?.[0]).toBe("http://localhost:4000/v1/users");
    expect(body).toEqual({
      users: [
        {
          id: 4,
          name: "Owner User",
          email: "owner@example.com",
          role: "owner",
          created_at: "2026-03-09T00:00:00.000Z",
        },
      ],
    });
  });

  it("blocks non-owners from listing users", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const response = await GET(buildRequest("doctor"));
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body).toEqual({ error: "Forbidden." });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects invalid role filters with a validation envelope", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const response = await GET(
      buildRequest("owner", { url: "http://localhost/api/users?role=admin" })
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({
      error: "Validation failed.",
      issues: [{ field: "role", message: "Must be one of owner, doctor, assistant." }],
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("forwards valid role filters to the backend users route", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ users: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    const response = await GET(
      buildRequest("owner", { url: "http://localhost/api/users?role=doctor" })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(fetchMock.mock.calls[0]?.[0]).toBe("http://localhost:4000/v1/users?role=doctor");
    expect(body).toEqual({ users: [] });
  });

  it("rejects invalid user create payloads", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(
      buildRequest("owner", {
        method: "POST",
        body: {
          name: "",
          email: "not-an-email",
          password: "short",
          role: "admin",
          extra: true,
        },
      })
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({
      error: "Validation failed.",
      issues: expect.arrayContaining([
        { field: "name", message: "Is required." },
        { field: "email", message: "Must be a valid email address." },
        { field: "password", message: "Must be at least 8 characters." },
        { field: "role", message: "Must be one of owner, doctor, assistant." },
        { field: "extra", message: "Unknown field." },
      ]),
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("serializes created users through the backend-backed BFF", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          user: {
            id: 10,
            name: "Dr. Jane Doe",
            email: "doctor@example.com",
            role: "doctor",
            created_at: "2026-03-09T00:00:00.000Z",
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(
      buildRequest("owner", {
        method: "POST",
        body: {
          name: "Dr. Jane Doe",
          email: "Doctor@Example.com",
          password: "strong-pass-123",
          role: "doctor",
        },
      })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(fetchMock.mock.calls[0]?.[1]?.body).toBe(
      JSON.stringify({
        name: "Dr. Jane Doe",
        email: "doctor@example.com",
        password: "strong-pass-123",
        role: "doctor",
      })
    );
    expect(body).toEqual({
      user: {
        id: 10,
        name: "Dr. Jane Doe",
        email: "doctor@example.com",
        role: "doctor",
        created_at: "2026-03-09T00:00:00.000Z",
      },
    });
  });

  it("returns 502 when the user collection wrapper drifts", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            items: [
              {
                id: 4,
                firstName: "Owner",
                lastName: "User",
                email: "owner@example.com",
                role: "owner",
              },
            ],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      )
    );

    const response = await GET(buildRequest("owner"));
    const body = await response.json();

    expect(response.status).toBe(502);
    expect(body).toEqual({
      error: "Backend contract mismatch for the user route.",
    });
  });
});
