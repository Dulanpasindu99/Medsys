import type { AppRole } from "@/app/lib/roles";

export type KnownAppPermission =
  | "doctor.workspace.view"
  | "assistant.workspace.view"
  | "patient.directory.view"
  | "analytics.view"
  | "analytics.read"
  | "inventory.view"
  | "inventory.write"
  | "ai.workspace.view"
  | "owner.workspace.view"
  | "appointment.create"
  | "appointment.update"
  | "encounter.read"
  | "encounter.write"
  | "family.read"
  | "family.write"
  | "prescription.dispense"
  | "prescription.read"
  | "patient.read"
  | "patient.write"
  | "patient.delete"
  | "patient.profile.read"
  | "patient.family.read"
  | "patient.history.read"
  | "patient.history.write"
  | "patient.allergy.read"
  | "patient.allergy.write"
  | "patient.condition.read"
  | "patient.condition.write"
  | "patient.timeline.read"
  | "patient.timeline.write"
  | "patient.vital.read"
  | "patient.vital.write"
  | "user.read"
  | "user.write"
  | "clinical.icd10.read";

export type AppPermission = KnownAppPermission | (string & {});

export type AppRouteId =
  | "doctorHome"
  | "patientDirectory"
  | "analyticsOverview"
  | "inventoryBoard"
  | "aiWorkspace"
  | "assistantWorkspace"
  | "ownerWorkspace";

export type NavigationItemId =
  | "doctor"
  | "patient"
  | "analytics"
  | "inventory"
  | "ai"
  | "assistant"
  | "owner";

export type PermissionSubject =
  | AppRole
  | {
      role: AppRole;
      permissions?: readonly AppPermission[] | null;
    };

type RoutePolicy = {
  routeId: AppRouteId;
  navId: NavigationItemId;
  href: string;
  label: string;
  permission: AppPermission;
};

const ROUTE_POLICIES: RoutePolicy[] = [
  {
    routeId: "doctorHome",
    navId: "doctor",
    href: "/",
    label: "Doctor Page",
    permission: "doctor.workspace.view",
  },
  {
    routeId: "patientDirectory",
    navId: "patient",
    href: "/patient",
    label: "Patient Management",
    permission: "patient.directory.view",
  },
  {
    routeId: "analyticsOverview",
    navId: "analytics",
    href: "/analytics",
    label: "Insights control room,Disease Intelligence",
    permission: "analytics.view",
  },
  {
    routeId: "inventoryBoard",
    navId: "inventory",
    href: "/inventory",
    label: "Inventory Management",
    permission: "inventory.view",
  },
  {
    routeId: "aiWorkspace",
    navId: "ai",
    href: "/ai",
    label: "Analytics Ai Tools",
    permission: "ai.workspace.view",
  },
  {
    routeId: "assistantWorkspace",
    navId: "assistant",
    href: "/assistant",
    label: "Assistant Panel",
    permission: "assistant.workspace.view",
  },
  {
    routeId: "ownerWorkspace",
    navId: "owner",
    href: "/owner",
    label: "Manage Staff Access",
    permission: "owner.workspace.view",
  },
];

const ROLE_PERMISSION_MATRIX: Record<AppRole, readonly AppPermission[]> = {
  owner: [
    ...ROUTE_POLICIES.map((route) => route.permission),
    "inventory.write",
    "appointment.create",
    "appointment.update",
    "prescription.dispense",
    "patient.read",
    "patient.write",
    "patient.delete",
    "patient.history.read",
    "patient.history.write",
    "user.read",
    "user.write",
    "clinical.icd10.read",
  ],
  doctor: [
    "doctor.workspace.view",
    "patient.directory.view",
    "analytics.view",
    "inventory.view",
    "ai.workspace.view",
    "patient.read",
    "patient.history.read",
    "patient.history.write",
    "appointment.update",
    "clinical.icd10.read",
  ],
  assistant: [
    "assistant.workspace.view",
    "patient.directory.view",
    "analytics.view",
    "inventory.view",
    "inventory.write",
    "ai.workspace.view",
    "appointment.create",
    "prescription.dispense",
    "patient.read",
    "patient.write",
    "patient.history.read",
    "patient.history.write",
    "clinical.icd10.read",
  ],
};

const DEFAULT_ROUTE_BY_ROLE: Record<AppRole, AppRouteId> = {
  owner: "ownerWorkspace",
  doctor: "doctorHome",
  assistant: "assistantWorkspace",
};

const ASSISTANT_SUPPORT_ROUTE_PERMISSIONS: readonly AppPermission[] = [
  "assistant.workspace.view",
  "patient.write",
  "appointment.create",
  "prescription.dispense",
  "inventory.write",
  "family.write",
];

function isPermissionSubject(value: PermissionSubject): value is Exclude<PermissionSubject, AppRole> {
  return typeof value === "object" && value !== null;
}

function getSubjectRole(subject: PermissionSubject): AppRole {
  return typeof subject === "string" ? subject : subject.role;
}

function normalizePermissions(value: readonly AppPermission[] | null | undefined) {
  if (!value?.length) {
    return [];
  }

  return Array.from(new Set(value));
}

export function getRolePermissions(role: AppRole) {
  return ROLE_PERMISSION_MATRIX[role];
}

export function getEffectivePermissions(subject: PermissionSubject) {
  const rolePermissions = getRolePermissions(getSubjectRole(subject));
  if (!isPermissionSubject(subject)) {
    return [...rolePermissions];
  }

  return Array.from(new Set([...rolePermissions, ...normalizePermissions(subject.permissions)]));
}

function isPathMatch(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname.startsWith(href);
}

export function getRoutePolicy(routeId: AppRouteId) {
  return ROUTE_POLICIES.find((route) => route.routeId === routeId) ?? null;
}

export function hasPermission(subject: PermissionSubject, permission: AppPermission) {
  return getEffectivePermissions(subject).includes(permission);
}

export function hasAnyPermission(subject: PermissionSubject, permissions: readonly AppPermission[]) {
  return permissions.some((permission) => hasPermission(subject, permission));
}

export function canCreateAppointments(subject: PermissionSubject) {
  return hasPermission(subject, "appointment.create");
}

export function canUpdateAppointments(subject: PermissionSubject) {
  return hasPermission(subject, "appointment.update");
}

function canAccessAssistantWorkspace(subject: PermissionSubject) {
  return hasAnyPermission(subject, ASSISTANT_SUPPORT_ROUTE_PERMISSIONS);
}

export function canAccessRoute(subject: PermissionSubject, routeId: AppRouteId) {
  if (routeId === "assistantWorkspace") {
    return canAccessAssistantWorkspace(subject);
  }

  const route = getRoutePolicy(routeId);
  return route ? hasPermission(subject, route.permission) : false;
}

export function getDefaultRouteForRole(role: AppRole) {
  return getDefaultRouteForSubject(role);
}

export function getDefaultRouteForSubject(subject: PermissionSubject) {
  const role = getSubjectRole(subject);
  const route = getRoutePolicy(DEFAULT_ROUTE_BY_ROLE[role]);
  if (route && hasPermission(subject, route.permission)) {
    return route.href;
  }

  const firstAccessibleRoute = ROUTE_POLICIES.find((entry) =>
    hasPermission(subject, entry.permission)
  );
  if (firstAccessibleRoute) {
    return firstAccessibleRoute.href;
  }

  return route?.href ?? "/";
}

export function getNavigationItemsForRole(role: AppRole) {
  return getNavigationItemsForSubject(role);
}

export function getNavigationItemsForSubject(subject: PermissionSubject) {
  return ROUTE_POLICIES.filter((route) =>
    route.routeId === "assistantWorkspace"
      ? canAccessAssistantWorkspace(subject)
      : hasPermission(subject, route.permission)
  ).map(({ navId, href, label, routeId }) => ({
    id: navId,
    href,
    label,
    routeId,
  }));
}

export function getNavigationIndexForPath(pathname: string) {
  return ROUTE_POLICIES.findIndex((route) => isPathMatch(pathname, route.href));
}
