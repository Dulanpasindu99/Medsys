import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/app/lib/api-auth";
import { callBackendRoute, toFrontendErrorResponse } from "@/app/lib/backend-route-client";

function contractMismatchResponse() {
  return NextResponse.json(
    { error: "Backend contract mismatch for the pending dispense queue route." },
    { status: 502 }
  );
}

export async function GET(request: NextRequest) {
  const auth = requireSession(request);
  if (auth.error) {
    return auth.error;
  }

  const backend = await callBackendRoute(request, "/v1/prescriptions/queue/pending-dispense", {
    includeSearch: false,
  });
  if (!backend.ok) {
    return backend.response;
  }

  if (!backend.response.ok) {
    return toFrontendErrorResponse(
      backend.response,
      "Unable to load the pending dispense queue."
    );
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
