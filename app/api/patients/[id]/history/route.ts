import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/app/lib/api-auth";
import { adaptPatientHistoryResponse } from "@/app/lib/backend-contract-adapters";
import { callBackendRoute, toFrontendErrorResponse } from "@/app/lib/backend-route-client";
import {
  parseJsonBody,
  parsePositiveInteger,
  validatePatientHistoryPayload,
  validationErrorResponse,
} from "@/app/lib/api-validation";

function contractMismatchResponse() {
  return NextResponse.json(
    { error: "Backend contract mismatch for the patient history route." },
    { status: 502 }
  );
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requirePermission(request, "patient.history.read");
  if (auth.error) {
    return auth.error;
  }

  const { id: idParam } = await params;
  const id = parsePositiveInteger(idParam, "id");
  if (!id.ok) {
    return validationErrorResponse(id.issues);
  }

  const backend = await callBackendRoute(request, `/v1/patients/${id.value}/history`, {
    includeSearch: false,
  });
  if (!backend.ok) {
    return backend.response;
  }

  if (!backend.response.ok) {
    return toFrontendErrorResponse(backend.response, "Unable to load patient history.");
  }

  try {
    const history = adaptPatientHistoryResponse(await backend.response.json()).map((entry) => ({
      id: entry.id,
      note: entry.note,
      created_at: entry.created_at,
      created_by_user_id: entry.created_by_user_id,
      created_by_name: entry.created_by_name,
      created_by_role: entry.created_by_role,
    }));
    const response = NextResponse.json({ history });
    backend.applyTo(response);
    return response;
  } catch {
    return contractMismatchResponse();
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requirePermission(request, "patient.history.write");
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

  const validated = validatePatientHistoryPayload(parsedBody.value);
  if (!validated.ok) {
    return validationErrorResponse(validated.issues);
  }

  const backend = await callBackendRoute(request, `/v1/patients/${id.value}/history`, {
    body: JSON.stringify(validated.value),
    includeSearch: false,
  });
  if (!backend.ok) {
    return backend.response;
  }

  if (!backend.response.ok) {
    return toFrontendErrorResponse(backend.response, "Unable to create patient history entry.");
  }

  const payload = (await backend.response.json()) as Record<string, unknown>;
  if (
    typeof payload?.id !== "number" ||
    typeof payload?.patientId !== "number" ||
    typeof payload?.note !== "string"
  ) {
    return contractMismatchResponse();
  }

  const response = NextResponse.json({
    id: payload.id,
    patientId: payload.patientId,
    note: payload.note,
    createdByUserId:
      typeof payload.createdByUserId === "number" ? payload.createdByUserId : null,
  });
  backend.applyTo(response);
  return response;
}
