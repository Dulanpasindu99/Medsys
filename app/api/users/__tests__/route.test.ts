import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET, POST } from "../route";
import { createSessionToken, SESSION_COOKIE_NAME } from "../../../lib/session";
import { createUser, findUserByEmail, listUsers } from "../../../lib/store";

vi.mock("../../../lib/store", () => ({
  listUsers: vi.fn(),
  createUser: vi.fn(),
  findUserByEmail: vi.fn(),
}));

const mockedListUsers = vi.mocked(listUsers);
const mockedFindUserByEmail = vi.mocked(findUserByEmail);
const mockedCreateUser = vi.mocked(createUser);

function buildRequest(role: "owner" | "doctor" | "assistant", init?: { url?: string; method?: string; body?: unknown }) {
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
      cookie: `${SESSION_COOKIE_NAME}=${sessionToken}`,
      "Content-Type": "application/json",
    },
  });
}

describe("/api/users permissions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("allows owners to list users", async () => {
    mockedListUsers.mockReturnValue([
      {
        id: 4,
        name: "Owner User",
        email: "owner@example.com",
        role: "owner",
        createdAt: "2026-03-09T00:00:00.000Z",
        passwordHash: "hashed",
      },
    ]);

    const response = await GET(buildRequest("owner"));
    const body = await response.json();

    expect(response.status).toBe(200);
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
    const response = await GET(buildRequest("doctor"));
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body).toEqual({ error: "Forbidden." });
    expect(mockedListUsers).not.toHaveBeenCalled();
  });

  it("rejects invalid role filters with a validation envelope", async () => {
    const response = await GET(
      buildRequest("owner", { url: "http://localhost/api/users?role=admin" })
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({
      error: "Validation failed.",
      issues: [{ field: "role", message: "Must be one of owner, doctor, assistant." }],
    });
  });

  it("rejects invalid user create payloads", async () => {
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
    expect(mockedCreateUser).not.toHaveBeenCalled();
  });

  it("serializes created users through the shared response mapper", async () => {
    mockedFindUserByEmail.mockReturnValue(undefined);
    mockedCreateUser.mockReturnValue({
      id: 10,
      name: "Dr. Jane Doe",
      email: "doctor@example.com",
      role: "doctor",
      passwordHash: "hashed",
      createdAt: "2026-03-09T00:00:00.000Z",
    });

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
});
