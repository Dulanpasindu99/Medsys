import type { AppRole } from "@/app/lib/roles";
import type { AppPermission } from "@/app/lib/authorization";
import type { DoctorWorkflowMode } from "@/app/lib/api-client";

export type TokenRole = AppRole;

export type TokenClaims = {
  role: TokenRole | null;
  email: string | null;
  name: string | null;
  userId: number | null;
  exp: number | null;
  permissions: AppPermission[];
  doctorWorkflowMode: DoctorWorkflowMode;
};

function normalizeDoctorWorkflowMode(value: unknown): DoctorWorkflowMode {
  if (typeof value !== "string") return null;
  const mode = value.trim().toLowerCase();
  if (mode === "self_service") return "self_service";
  if (mode === "clinic_supported") return "clinic_supported";
  return null;
}

function decodeBase64Url(input: string) {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/");
  const normalized = padded + "=".repeat((4 - (padded.length % 4)) % 4);

  if (typeof window !== "undefined") {
    return atob(normalized);
  }

  return Buffer.from(normalized, "base64").toString("utf8");
}

function parseJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const [, payload] = token.split(".");
    if (!payload) return null;
    return JSON.parse(decodeBase64Url(payload)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function normalizeTokenRole(value: unknown): TokenRole | null {
  if (typeof value !== "string") return null;
  const role = value.toLowerCase();
  if (role === "owner" || role === "doctor" || role === "assistant") {
    return role;
  }
  return null;
}

function normalizePermission(value: unknown): AppPermission | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim() as AppPermission;
  return normalized ? normalized : null;
}

function readPermissionClaims(payload: Record<string, unknown>) {
  const candidates = [
    payload.permissions,
    payload.permission,
    payload.authorities,
    payload.scopes,
    payload.scope,
    payload["https://medsys.app/permissions"],
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate
        .map((entry) => normalizePermission(entry))
        .filter((entry): entry is AppPermission => !!entry);
    }

    if (typeof candidate === "string") {
      return candidate
        .split(/[,\s]+/)
        .map((entry) => normalizePermission(entry))
        .filter((entry): entry is AppPermission => !!entry);
    }
  }

  return [];
}

function getNumericClaim(payload: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = payload[key];
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === "string" && value.trim() && !Number.isNaN(Number(value))) {
      return Number(value);
    }
  }
  return null;
}

export function readTokenClaims(token: string): TokenClaims {
  const payload = parseJwtPayload(token);
  if (!payload) {
    return {
      role: null,
      email: null,
      name: null,
      userId: null,
      exp: null,
      permissions: [],
      doctorWorkflowMode: null,
    };
  }

  const email =
    typeof payload.email === "string"
      ? payload.email
      : typeof payload.sub === "string" && payload.sub.includes("@")
        ? payload.sub
        : null;

  const name =
    typeof payload.name === "string"
      ? payload.name
      : typeof payload.preferred_username === "string"
        ? payload.preferred_username
        : null;

  return {
    role:
      normalizeTokenRole(payload.role) ??
      normalizeTokenRole(payload.userRole) ??
      normalizeTokenRole(payload["https://medsys.app/role"]),
    email,
    name,
    userId: getNumericClaim(payload, ["userId", "user_id", "id", "sub"]),
    exp: getNumericClaim(payload, ["exp"]),
    permissions: readPermissionClaims(payload),
    doctorWorkflowMode:
      normalizeDoctorWorkflowMode(payload.doctor_workflow_mode) ??
      normalizeDoctorWorkflowMode(payload.doctorWorkflowMode) ??
      normalizeDoctorWorkflowMode(payload["https://medsys.app/doctor_workflow_mode"]),
  };
}
