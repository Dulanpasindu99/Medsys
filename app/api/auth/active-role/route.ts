import { NextRequest, NextResponse } from "next/server";
import { adaptAuthenticatedUserResponse } from "@/app/lib/backend-contract-adapters";
import { callBackendRoute } from "@/app/lib/backend-route-client";
import { serializeSessionIdentity } from "@/app/lib/api-serializers";
import { attachSessionCookie } from "@/app/lib/session";
import type { AppRole } from "@/app/lib/roles";

function parseRequestedRole(value: unknown): AppRole | null {
  if (typeof value !== "string") return null;
  const role = value.trim().toLowerCase();
  return role === "owner" || role === "doctor" || role === "assistant"
    ? (role as AppRole)
    : null;
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const requestedRole = parseRequestedRole(
    (body as Record<string, unknown> | null)?.activeRole
  );
  if (!requestedRole) {
    return NextResponse.json(
      { error: "activeRole must be one of owner, doctor, assistant." },
      { status: 400 }
    );
  }

  const backend = await callBackendRoute(request, "/v1/auth/active-role", {
    body: JSON.stringify({ activeRole: requestedRole }),
    includeSearch: false,
    unavailableMessage: "Authentication service is unavailable.",
  });
  if (!backend.ok) {
    return backend.response;
  }

  if (!backend.response.ok) {
    let message = "Unable to switch active role.";
    try {
      const payload = (await backend.response.clone().json()) as { message?: string; error?: string };
      message = payload.message ?? payload.error ?? message;
    } catch {
      // Ignore parse errors and fall back to the generic message.
    }

    const response = NextResponse.json({ error: message }, { status: backend.response.status });
    backend.applyTo(response);
    return response;
  }

  try {
    const authenticatedUser = adaptAuthenticatedUserResponse(await backend.response.json());
    const response = NextResponse.json(
      serializeSessionIdentity({
        id: authenticatedUser.id,
        role: authenticatedUser.active_role ?? authenticatedUser.role,
        roles: authenticatedUser.roles ?? [authenticatedUser.role],
        activeRole: authenticatedUser.active_role ?? authenticatedUser.role,
        email: authenticatedUser.email,
        name: authenticatedUser.name,
        permissions: authenticatedUser.permissions,
        extraPermissions:
          authenticatedUser.extra_permissions ?? authenticatedUser.extraPermissions ?? [],
        doctorWorkflowMode: authenticatedUser.doctorWorkflowMode ?? null,
        workflowProfiles: authenticatedUser.workflow_profiles ?? null,
      })
    );

    attachSessionCookie(response, {
      userId: authenticatedUser.id,
      role: authenticatedUser.active_role ?? authenticatedUser.role,
      roles: authenticatedUser.roles ?? [authenticatedUser.role],
      activeRole: authenticatedUser.active_role ?? authenticatedUser.role,
      email: authenticatedUser.email,
      name: authenticatedUser.name,
      permissions: authenticatedUser.permissions,
      extraPermissions:
        authenticatedUser.extra_permissions ?? authenticatedUser.extraPermissions ?? [],
      doctorWorkflowMode: authenticatedUser.doctorWorkflowMode ?? null,
      workflowProfiles: authenticatedUser.workflow_profiles ?? null,
    });
    backend.applyTo(response);
    return response;
  } catch {
    return NextResponse.json(
      { error: "Backend contract mismatch for the active-role route." },
      { status: 502 }
    );
  }
}
