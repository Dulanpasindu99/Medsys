import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/app/lib/api-auth";
import { callBackendRoute, toFrontendErrorResponse } from "@/app/lib/backend-route-client";

function contractMismatchResponse() {
  return NextResponse.json(
    { error: "Backend contract mismatch for the analytics overview route." },
    { status: 502 }
  );
}

export async function GET(request: NextRequest) {
  const auth = requirePermission(request, "analytics.view");
  if (auth.error) {
    return auth.error;
  }

  const backend = await callBackendRoute(request, "/v1/analytics/overview", {
    includeSearch: false,
  });
  if (!backend.ok) {
    return backend.response;
  }

  if (!backend.response.ok) {
    return toFrontendErrorResponse(backend.response, "Unable to load analytics overview.");
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
