import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/app/lib/api-auth";
import { adaptPatientDetailResponse, adaptSinglePatientResponse } from "@/app/lib/backend-contract-adapters";
import { callBackendRoute, toFrontendErrorResponse } from "@/app/lib/backend-route-client";
import { serializePatient } from "@/app/lib/api-serializers";
import {
  parseJsonBody,
  parsePositiveInteger,
  validatePatientUpdatePayload,
  validationErrorResponse,
} from "@/app/lib/api-validation";

function contractMismatchResponse() {
  return NextResponse.json(
    { error: "Backend contract mismatch for the patient detail route." },
    { status: 502 }
  );
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

  const backend = await callBackendRoute(request, `/v1/patients/${id.value}`, {
    includeSearch: false,
  });
  if (!backend.ok) {
    return backend.response;
  }

  if (!backend.response.ok) {
    return toFrontendErrorResponse(backend.response, "Unable to load patient.");
  }

  try {
    const detail = adaptPatientDetailResponse(await backend.response.json());
    const response = NextResponse.json({
      patient: serializePatient(detail.patient),
      history: detail.history.map((entry) => ({
        id: entry.id,
        note: entry.note,
        created_at: entry.created_at,
        created_by_user_id: entry.created_by_user_id,
        created_by_name: entry.created_by_name,
        created_by_role: entry.created_by_role,
      })),
    });
    backend.applyTo(response);
    return response;
  } catch {
    return contractMismatchResponse();
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requirePermission(request, "patient.write");
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

  const validated = validatePatientUpdatePayload(parsedBody.value);
  if (!validated.ok) {
    return validationErrorResponse(validated.issues);
  }

  const backend = await callBackendRoute(request, `/v1/patients/${id.value}`, {
    body: JSON.stringify(validated.value),
    includeSearch: false,
  });
  if (!backend.ok) {
    return backend.response;
  }

  if (!backend.response.ok) {
    return toFrontendErrorResponse(backend.response, "Unable to update patient.");
  }

  try {
    const updated = adaptSinglePatientResponse(await backend.response.json());
    const response = NextResponse.json({
      patient: serializePatient(updated),
    });
    backend.applyTo(response);
    return response;
  } catch {
    return contractMismatchResponse();
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requirePermission(request, "patient.delete");
  if (auth.error) {
    return auth.error;
  }

  const { id: idParam } = await params;
  const id = parsePositiveInteger(idParam, "id");
  if (!id.ok) {
    return validationErrorResponse(id.issues);
  }

  const backend = await callBackendRoute(request, `/v1/patients/${id.value}`, {
    includeSearch: false,
  });
  if (!backend.ok) {
    return backend.response;
  }

  if (!backend.response.ok) {
    return toFrontendErrorResponse(backend.response, "Unable to delete patient.");
  }

  const response = NextResponse.json({ success: true });
  backend.applyTo(response);
  return response;
}
