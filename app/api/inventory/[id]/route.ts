import { NextRequest, NextResponse } from "next/server";
import { requirePermission, requireSession } from "@/app/lib/api-auth";
import { callBackendRoute, toFrontendErrorResponse } from "@/app/lib/backend-route-client";
import {
  parseJsonBody,
  parsePositiveInteger,
  validationErrorResponse,
} from "@/app/lib/api-validation";

function contractMismatchResponse() {
  return NextResponse.json(
    { error: "Backend contract mismatch for the inventory item route." },
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

  const backend = await callBackendRoute(request, `/v1/inventory/${id.value}`, {
    includeSearch: false,
  });
  if (!backend.ok) {
    return backend.response;
  }

  if (!backend.response.ok) {
    return toFrontendErrorResponse(backend.response, "Unable to load inventory item.");
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requirePermission(request, "inventory.write");
  if (auth.error) {
    return auth.error;
  }

  const { id: idParam } = await params;
  const id = parsePositiveInteger(idParam, "id");
  if (!id.ok) {
    return validationErrorResponse(id.issues);
  }

  const parsedBody = await parseJsonBody(request);
  if (!parsedBody.ok) {
    return validationErrorResponse(parsedBody.issues);
  }

  const backend = await callBackendRoute(request, `/v1/inventory/${id.value}`, {
    body: JSON.stringify(parsedBody.value),
    includeSearch: false,
  });
  if (!backend.ok) {
    return backend.response;
  }

  if (!backend.response.ok) {
    return toFrontendErrorResponse(backend.response, "Unable to update inventory item.");
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
