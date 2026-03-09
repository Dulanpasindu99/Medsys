import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/app/lib/api-auth";
import { callBackendRoute, toFrontendErrorResponse } from "@/app/lib/backend-route-client";
import {
  parseJsonBody,
  validateAppointmentStatusQuery,
  validationErrorResponse,
} from "@/app/lib/api-validation";

function contractMismatchResponse() {
  return NextResponse.json(
    { error: "Backend contract mismatch for the appointments route." },
    { status: 502 }
  );
}

export async function GET(request: NextRequest) {
  const auth = requireSession(request);
  if (auth.error) {
    return auth.error;
  }

  const { searchParams } = new URL(request.url);
  const status = validateAppointmentStatusQuery(searchParams.get("status"));
  if (!status.ok) {
    return validationErrorResponse(status.issues);
  }

  const backend = await callBackendRoute(request, "/v1/appointments");
  if (!backend.ok) {
    return backend.response;
  }

  if (!backend.response.ok) {
    return toFrontendErrorResponse(backend.response, "Unable to load appointments.");
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

export async function POST(request: NextRequest) {
  const auth = requireSession(request);
  if (auth.error) {
    return auth.error;
  }

  const parsedBody = await parseJsonBody(request);
  if (!parsedBody.ok) {
    return validationErrorResponse(parsedBody.issues);
  }

  const backend = await callBackendRoute(request, "/v1/appointments", {
    body: JSON.stringify(parsedBody.value),
    includeSearch: false,
  });
  if (!backend.ok) {
    return backend.response;
  }

  if (!backend.response.ok) {
    return toFrontendErrorResponse(backend.response, "Unable to create appointment.");
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
