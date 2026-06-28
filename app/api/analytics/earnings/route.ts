import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/app/lib/api-auth";
import { callBackendRoute, toFrontendErrorResponse } from "@/app/lib/backend-route-client";

export async function GET(request: NextRequest) {
  const auth = requirePermission(request, "analytics.view");
  if (auth.error) {
    return auth.error;
  }

  const backend = await callBackendRoute(request, "/v1/analytics/earnings");
  if (!backend.ok) {
    return backend.response;
  }

  if (!backend.response.ok) {
    return toFrontendErrorResponse(backend.response, "Unable to load earnings.");
  }

  try {
    const payload = await backend.response.json();
    const response = NextResponse.json(payload);
    backend.applyTo(response);
    return response;
  } catch {
    return NextResponse.json(
      { error: "Backend contract mismatch for the analytics earnings route." },
      { status: 502 },
    );
  }
}
