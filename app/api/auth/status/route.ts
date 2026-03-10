import { NextRequest, NextResponse } from "next/server";
import { adaptAuthStatusResponse } from "@/app/lib/backend-contract-adapters";
import { callBackendRoute } from "@/app/lib/backend-route-client";

function contractMismatchResponse() {
  return NextResponse.json(
    { error: "Backend contract mismatch for the auth status route." },
    { status: 502 }
  );
}

export async function GET(request: NextRequest) {
  const backend = await callBackendRoute(request, "/v1/auth/status", {
    allowUnauthenticated: true,
    includeSearch: false,
    unavailableMessage: "Authentication service is unavailable.",
  });
  if (!backend.ok) {
    return backend.response;
  }

  if (!backend.response.ok) {
    const message =
      backend.response.status >= 500
        ? "Authentication service is unavailable."
        : "Unable to determine authentication status.";
    return NextResponse.json({ error: message }, { status: backend.response.status });
  }

  try {
    const status = adaptAuthStatusResponse(await backend.response.json());
    const response = NextResponse.json(status);
    backend.applyTo(response);
    return response;
  } catch {
    return contractMismatchResponse();
  }
}
