import { NextRequest, NextResponse } from "next/server";
import { adaptAuthenticatedUserResponse } from "@/app/lib/backend-contract-adapters";
import { callBackendRoute } from "@/app/lib/backend-route-client";
import { serializeSessionIdentity } from "@/app/lib/api-serializers";
import { attachSessionCookie, readSessionFromRequest } from "@/app/lib/session";
import type { OperatingMode } from "@/app/lib/api-client";

function readOperatingMode(value: unknown): OperatingMode {
  const record = value as { organization?: { operating_mode?: unknown } } | null;
  return record?.organization?.operating_mode === "step_up" ? "step_up" : "standard";
}

function serializeSessionFallback(request: NextRequest) {
  const session = readSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  return NextResponse.json(
    serializeSessionIdentity({
      id: session.userId,
      role: session.role,
      roles: session.roles ?? [session.role],
      activeRole: session.activeRole ?? session.role,
      email: session.email,
      name: session.name,
      permissions: session.permissions,
      extraPermissions: session.extraPermissions ?? [],
      doctorWorkflowMode: session.doctorWorkflowMode ?? null,
      workflowProfiles: session.workflowProfiles ?? null,
      operatingMode: session.operatingMode ?? "standard",
    })
  );
}

export async function GET(request: NextRequest) {
  const backend = await callBackendRoute(request, "/v1/auth/me", {
    includeSearch: false,
    unavailableMessage: "Authentication service is unavailable.",
  });
  if (!backend.ok) {
    return backend.response;
  }

  if (!backend.response.ok) {
    return serializeSessionFallback(request);
  }

  try {
    const rawMe = await backend.response.json();
    const authenticatedUser = adaptAuthenticatedUserResponse(rawMe);
    const operatingMode = readOperatingMode(rawMe);
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
        operatingMode,
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
      operatingMode,
    });
    backend.applyTo(response);
    return response;
  } catch {
    return NextResponse.json(
      { error: "Backend contract mismatch for the auth current-user route." },
      { status: 502 }
    );
  }
}
