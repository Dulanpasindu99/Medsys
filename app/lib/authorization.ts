import type { AppRole } from "@/app/lib/roles";

export type AppPermission =
  | "doctor.workspace.view"
  | "assistant.workspace.view"
  | "patient.directory.view"
  | "analytics.view"
  | "inventory.view"
  | "ai.workspace.view"
  | "owner.workspace.view"
  | "patient.read"
  | "patient.write"
  | "patient.delete"
  | "patient.history.read"
  | "patient.history.write"
  | "user.read"
  | "user.write"
  | "clinical.icd10.read";

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
    "patient.write",
    "patient.history.read",
    "patient.history.write",
    "clinical.icd10.read",
  ],
  assistant: [
    "assistant.workspace.view",
    "patient.directory.view",
    "analytics.view",
    "inventory.view",
    "ai.workspace.view",
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

function isPathMatch(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname.startsWith(href);
}

export function getRoutePolicy(routeId: AppRouteId) {
  return ROUTE_POLICIES.find((route) => route.routeId === routeId) ?? null;
}

export function hasPermission(role: AppRole, permission: AppPermission) {
  return ROLE_PERMISSION_MATRIX[role].includes(permission);
}

export function hasAnyPermission(role: AppRole, permissions: readonly AppPermission[]) {
  return permissions.some((permission) => hasPermission(role, permission));
}

export function canAccessRoute(role: AppRole, routeId: AppRouteId) {
  const route = getRoutePolicy(routeId);
  return route ? hasPermission(role, route.permission) : false;
}

export function getDefaultRouteForRole(role: AppRole) {
  const route = getRoutePolicy(DEFAULT_ROUTE_BY_ROLE[role]);
  return route?.href ?? "/";
}

export function getNavigationItemsForRole(role: AppRole) {
  return ROUTE_POLICIES.filter((route) => hasPermission(role, route.permission)).map(
    ({ navId, href, label, routeId }) => ({
      id: navId,
      href,
      label,
      routeId,
    })
  );
}

export function getNavigationIndexForPath(pathname: string) {
  return ROUTE_POLICIES.findIndex((route) => isPathMatch(pathname, route.href));
}
