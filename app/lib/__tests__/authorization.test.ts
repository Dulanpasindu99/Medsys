import { describe, expect, it } from "vitest";
import {
  canAccessRoute,
  canCreateAppointments,
  getDefaultRouteForRole,
  getNavigationIndexForPath,
  getNavigationItemsForRole,
  hasPermission,
} from "../authorization";

describe("authorization policy", () => {
  it("returns the expected default route for each role", () => {
    expect(getDefaultRouteForRole("owner")).toBe("/owner");
    expect(getDefaultRouteForRole("doctor")).toBe("/");
    expect(getDefaultRouteForRole("assistant")).toBe("/assistant");
  });

  it("enforces route access through the permission matrix", () => {
    expect(canAccessRoute("doctor", "doctorHome")).toBe(true);
    expect(canAccessRoute("doctor", "assistantWorkspace")).toBe(false);
    expect(canAccessRoute("assistant", "assistantWorkspace")).toBe(true);
    expect(canAccessRoute("assistant", "doctorHome")).toBe(false);
    expect(canAccessRoute("owner", "ownerWorkspace")).toBe(true);
    expect(canAccessRoute("owner", "doctorHome")).toBe(true);
  });

  it("reuses the same matrix for API permissions", () => {
    expect(hasPermission("assistant", "patient.read")).toBe(true);
    expect(hasPermission("assistant", "patient.delete")).toBe(false);
    expect(hasPermission("doctor", "user.read")).toBe(false);
    expect(hasPermission("owner", "user.write")).toBe(true);
  });

  it("matches appointment creation to the live backend policy", () => {
    expect(canCreateAppointments("owner")).toBe(true);
    expect(canCreateAppointments("assistant")).toBe(true);
    expect(canCreateAppointments("doctor")).toBe(false);
  });

  it("returns role-specific navigation sets from the same policy", () => {
    expect(getNavigationItemsForRole("doctor").map((item) => item.id)).toEqual([
      "doctor",
      "patient",
      "analytics",
      "inventory",
      "ai",
    ]);

    expect(getNavigationItemsForRole("assistant").map((item) => item.id)).toEqual([
      "patient",
      "analytics",
      "inventory",
      "ai",
      "assistant",
    ]);

    expect(getNavigationItemsForRole("owner").map((item) => item.id)).toEqual([
      "doctor",
      "patient",
      "analytics",
      "inventory",
      "ai",
      "assistant",
      "owner",
    ]);
  });

  it("keeps navigation ordering stable for page transitions", () => {
    expect(getNavigationIndexForPath("/")).toBe(0);
    expect(getNavigationIndexForPath("/inventory")).toBe(3);
    expect(getNavigationIndexForPath("/owner")).toBe(6);
  });
});
