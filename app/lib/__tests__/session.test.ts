import { afterEach, describe, expect, it, vi } from "vitest";
import { createSessionToken, verifySessionToken } from "../session";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("session secret enforcement", () => {
  it("allows the development fallback secret when no env value is set", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("MEDSYS_SESSION_SECRET", "");

    const token = createSessionToken({
      userId: 7,
      role: "doctor",
      email: "doctor@example.com",
      name: "Doctor Example",
    });

    expect(verifySessionToken(token)).toMatchObject({
      userId: 7,
      role: "doctor",
      email: "doctor@example.com",
      name: "Doctor Example",
    });
  });

  it("rejects missing secrets in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("MEDSYS_SESSION_SECRET", "");

    expect(() =>
      createSessionToken({
        userId: 7,
        role: "doctor",
        email: "doctor@example.com",
        name: "Doctor Example",
      })
    ).toThrow(/MEDSYS_SESSION_SECRET must be set/i);
  });

  it("rejects placeholder secrets in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("MEDSYS_SESSION_SECRET", "change-me");

    expect(() =>
      createSessionToken({
        userId: 7,
        role: "doctor",
        email: "doctor@example.com",
        name: "Doctor Example",
      })
    ).toThrow(/MEDSYS_SESSION_SECRET must be replaced/i);
  });

  it("accepts strong secrets in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("MEDSYS_SESSION_SECRET", "prod-secret-32-characters-minimum");

    const token = createSessionToken({
      userId: 9,
      role: "owner",
      email: "owner@example.com",
      name: "Owner Example",
    });

    expect(verifySessionToken(token)).toMatchObject({
      userId: 9,
      role: "owner",
      email: "owner@example.com",
      name: "Owner Example",
    });
  });
});
