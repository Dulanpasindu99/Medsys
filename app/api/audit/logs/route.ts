import { NextRequest, NextResponse } from "next/server";
import { requireAnyPermission } from "@/app/lib/api-auth";
import { callBackendRoute, toFrontendErrorResponse } from "@/app/lib/backend-route-client";

function contractMismatchResponse() {
  return NextResponse.json(
    { error: "Backend contract mismatch for the audit logs route." },
    { status: 502 }
  );
}

export async function GET(request: NextRequest) {
  const auth = requireAnyPermission(request, ["ai.workspace.view", "owner.workspace.view"]);
  if (auth.error) {
    return auth.error;
  }

  const backend = await callBackendRoute(request, "/v1/audit/logs");
  if (!backend.ok) {
    return backend.response;
  }

  if (!backend.response.ok) {
    return toFrontendErrorResponse(backend.response, "Unable to load audit logs.");
  }

  let payload: unknown;
  try {
    payload = await backend.response.json();
  } catch {
    return contractMismatchResponse();
  }

  const response = NextResponse.json(payload);
  backend.applyTo(response);
  return response;
}
