import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/app/lib/api-auth";
import { callBackendRoute, toFrontendErrorResponse } from "@/app/lib/backend-route-client";
import { parsePositiveInteger, validationErrorResponse } from "@/app/lib/api-validation";

export async function forwardPatientSupportFeed(
  request: NextRequest,
  params: Promise<{ id: string }>,
  backendSuffix: string,
  fallbackMessage: string,
  contractLabel: string
) {
  const auth = requirePermission(request, "patient.read");
  if (auth.error) {
    return auth.error;
  }

  const { id: idParam } = await params;
  const id = parsePositiveInteger(idParam, "id");
  if (!id.ok) {
    return validationErrorResponse(id.issues);
  }

  const backend = await callBackendRoute(request, `/v1/patients/${id.value}/${backendSuffix}`, {
    includeSearch: false,
  });
  if (!backend.ok) {
    return backend.response;
  }

  if (!backend.response.ok) {
    return toFrontendErrorResponse(backend.response, fallbackMessage);
  }

  let payload: unknown;
  try {
    payload = await backend.response.json();
  } catch {
    return NextResponse.json(
      { error: `Backend contract mismatch for the ${contractLabel} route.` },
      { status: 502 }
    );
  }

  const response = NextResponse.json(payload);
  backend.applyTo(response);
  return response;
}
