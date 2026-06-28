import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/app/lib/api-auth";
import { callBackendRoute, toFrontendErrorResponse } from "@/app/lib/backend-route-client";
import { parseJsonBody, validationErrorResponse } from "@/app/lib/api-validation";

export async function GET(request: NextRequest) {
  const auth = requirePermission(request, "owner.workspace.view");
  if (auth.error) {
    return auth.error;
  }

  const backend = await callBackendRoute(request, "/v1/organizations/current", {
    includeSearch: false,
  });
  if (!backend.ok) {
    return backend.response;
  }
  if (!backend.response.ok) {
    return toFrontendErrorResponse(backend.response, "Unable to load clinic settings.");
  }

  const response = NextResponse.json(await backend.response.json());
  backend.applyTo(response);
  return response;
}

export async function PATCH(request: NextRequest) {
  const auth = requirePermission(request, "owner.workspace.view");
  if (auth.error) {
    return auth.error;
  }

  const parsedBody = await parseJsonBody(request);
  if (!parsedBody.ok) {
    return validationErrorResponse(parsedBody.issues);
  }

  const operatingMode = (parsedBody.value as { operatingMode?: unknown }).operatingMode;
  if (operatingMode !== "standard" && operatingMode !== "step_up") {
    return NextResponse.json(
      { error: "operatingMode must be 'standard' or 'step_up'." },
      { status: 400 },
    );
  }

  const backend = await callBackendRoute(request, "/v1/organizations/current", {
    body: JSON.stringify({ operatingMode }),
  });
  if (!backend.ok) {
    return backend.response;
  }
  if (!backend.response.ok) {
    return toFrontendErrorResponse(backend.response, "Unable to update clinic mode.");
  }

  const response = NextResponse.json(await backend.response.json());
  backend.applyTo(response);
  return response;
}
