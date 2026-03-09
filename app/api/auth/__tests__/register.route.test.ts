import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "../register/route";
import { SESSION_COOKIE_NAME } from "../../../lib/session";
import { createUser, findUserByEmail, listUsers } from "../../../lib/store";

vi.mock("../../../lib/store", () => ({
  createUser: vi.fn(),
  findUserByEmail: vi.fn(),
  listUsers: vi.fn(),
}));

const mockedListUsers = vi.mocked(listUsers);
const mockedFindUserByEmail = vi.mocked(findUserByEmail);
const mockedCreateUser = vi.mocked(createUser);

describe("POST /api/auth/register", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects invalid registration payloads with a validation envelope", async () => {
    mockedListUsers.mockReturnValue([]);

    const request = new NextRequest("http://localhost/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        name: "",
        email: "bad-email",
        password: "short",
        role: "admin",
      }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({
      error: "Validation failed.",
      issues: expect.arrayContaining([
        { field: "name", message: "Is required." },
        { field: "email", message: "Must be a valid email address." },
        { field: "password", message: "Must be at least 8 characters." },
        { field: "role", message: "Must be one of owner, doctor, assistant." },
      ]),
    });
    expect(mockedCreateUser).not.toHaveBeenCalled();
  });

  it("serializes the bootstrap registration response and sets the session cookie", async () => {
    mockedListUsers.mockReturnValue([]);
    mockedFindUserByEmail.mockReturnValue(undefined);
    mockedCreateUser.mockReturnValue({
      id: 11,
      name: "Owner User",
      email: "owner@example.com",
      role: "owner",
      passwordHash: "hashed",
      createdAt: "2026-03-09T00:00:00.000Z",
    });

    const request = new NextRequest("http://localhost/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        name: "Owner User",
        email: "OWNER@example.com",
        password: "owner-pass-123",
        role: "owner",
      }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      user: {
        id: 11,
        name: "Owner User",
        email: "owner@example.com",
        role: "owner",
        created_at: "2026-03-09T00:00:00.000Z",
      },
    });
    expect(response.cookies.get(SESSION_COOKIE_NAME)?.value).toBeTruthy();
  });
});
