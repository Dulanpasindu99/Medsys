import { describe, expect, it } from "vitest";
import {
  type AppPermission,
  canAccessRoute,
  canCreateAppointments,
  canUpdateAppointments,
  getDefaultRouteForRole,
  getDefaultRouteForSubject,
  getNavigationIndexForPath,
  getNavigationItemsForRole,
  getNavigationItemsForSubject,
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
    expect(hasPermission("assistant", "inventory.write")).toBe(true);
    expect(hasPermission("assistant", "prescription.dispense")).toBe(true);
    expect(hasPermission("assistant", "appointment.update")).toBe(false);
    expect(hasPermission("doctor", "user.read")).toBe(false);
    expect(hasPermission("doctor", "patient.write")).toBe(false);
    expect(hasPermission("doctor", "inventory.write")).toBe(false);
    expect(hasPermission("doctor", "prescription.dispense")).toBe(false);
    expect(hasPermission("doctor", "appointment.update")).toBe(true);
    expect(hasPermission("owner", "user.write")).toBe(true);
    expect(hasPermission("owner", "inventory.write")).toBe(true);
    expect(hasPermission("owner", "prescription.dispense")).toBe(true);
    expect(hasPermission("owner", "appointment.update")).toBe(true);
  });

  it("allows explicit permission overrides on top of the role matrix", () => {
    const permissions: AppPermission[] = [
      "patient.write",
      "appointment.create",
      "prescription.dispense",
    ];
    const doctorWithAssistantCoverage = {
      role: "doctor" as const,
      permissions,
    };

    expect(hasPermission(doctorWithAssistantCoverage, "doctor.workspace.view")).toBe(true);
    expect(hasPermission(doctorWithAssistantCoverage, "patient.write")).toBe(true);
    expect(hasPermission(doctorWithAssistantCoverage, "appointment.create")).toBe(true);
    expect(hasPermission(doctorWithAssistantCoverage, "prescription.dispense")).toBe(true);
    expect(canAccessRoute(doctorWithAssistantCoverage, "assistantWorkspace")).toBe(true);
    expect(getNavigationItemsForSubject(doctorWithAssistantCoverage).map((item) => item.id)).toContain(
      "assistant"
    );
    expect(getDefaultRouteForSubject(doctorWithAssistantCoverage)).toBe("/");
  });

  it("matches appointment creation to the live backend policy", () => {
    expect(canCreateAppointments("owner")).toBe(true);
    expect(canCreateAppointments("assistant")).toBe(true);
    expect(canCreateAppointments("doctor")).toBe(false);
  });

  it("matches appointment lifecycle updates to the live frontend policy", () => {
    expect(canUpdateAppointments("owner")).toBe(true);
    expect(canUpdateAppointments("doctor")).toBe(true);
    expect(canUpdateAppointments("assistant")).toBe(false);
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
