import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/app/lib/api-auth";
import { callBackendRoute, toFrontendErrorResponse } from "@/app/lib/backend-route-client";
import { parsePositiveInteger, validationErrorResponse } from "@/app/lib/api-validation";

function contractMismatchResponse() {
  return NextResponse.json(
    { error: "Backend contract mismatch for the prescription detail route." },
    { status: 502 }
  );
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireSession(request);
  if (auth.error) {
    return auth.error;
  }

  const { id: idParam } = await params;
  const id = parsePositiveInteger(idParam, "id");
  if (!id.ok) {
    return validationErrorResponse(id.issues);
  }

  const backend = await callBackendRoute(request, `/v1/prescriptions/${id.value}`, {
    includeSearch: false,
  });
  if (!backend.ok) {
    return backend.response;
  }

  if (!backend.response.ok) {
    return toFrontendErrorResponse(backend.response, "Unable to load prescription.");
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
