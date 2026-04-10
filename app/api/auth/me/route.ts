import { NextRequest, NextResponse } from "next/server";
import { adaptAuthenticatedUserResponse } from "@/app/lib/backend-contract-adapters";
import { callBackendRoute } from "@/app/lib/backend-route-client";
import { serializeSessionIdentity } from "@/app/lib/api-serializers";
import { attachSessionCookie, readSessionFromRequest } from "@/app/lib/session";

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
      { error: "Backend contract mismatch for the auth current-user route." },
      { status: 502 }
    );
  }
}
