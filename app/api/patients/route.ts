import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/app/lib/api-auth";
import { adaptPatientCollectionResponse, adaptSinglePatientResponse } from "@/app/lib/backend-contract-adapters";
import { callBackendRoute, toFrontendErrorResponse } from "@/app/lib/backend-route-client";
import { serializePatient } from "@/app/lib/api-serializers";
import {
  parseJsonBody,
  validatePatientCreatePayload,
  validationErrorResponse,
} from "@/app/lib/api-validation";

function contractMismatchResponse() {
  return NextResponse.json(
    { error: "Backend contract mismatch for the patient route." },
    { status: 502 }
  );
}

export async function GET(request: NextRequest) {
  const auth = requirePermission(request, "patient.read");
  if (auth.error) {
    return auth.error;
  }

  const backend = await callBackendRoute(request, "/v1/patients");
  if (!backend.ok) {
    return backend.response;
  }

  if (!backend.response.ok) {
    return toFrontendErrorResponse(backend.response, "Unable to load patients.");
  }

  try {
    const patients = adaptPatientCollectionResponse(await backend.response.json()).map(serializePatient);
    const response = NextResponse.json({ patients });
    backend.applyTo(response);
    return response;
  } catch {
    return contractMismatchResponse();
  }
}

export async function POST(request: NextRequest) {
  const auth = requirePermission(request, "patient.write");
  if (auth.error) {
    return auth.error;
  }

  const parsedBody = await parseJsonBody(request);
  if (!parsedBody.ok) {
    return validationErrorResponse(parsedBody.issues);
  }

  const validated = validatePatientCreatePayload(parsedBody.value);
  if (!validated.ok) {
    return validationErrorResponse(validated.issues);
  }

  const backend = await callBackendRoute(request, "/v1/patients", {
    body: JSON.stringify(validated.value),
  });
  if (!backend.ok) {
    return backend.response;
  }

  if (!backend.response.ok) {
    return toFrontendErrorResponse(backend.response, "Unable to create patient.");
  }

  try {
    const created = adaptSinglePatientResponse(await backend.response.json());
    const response = NextResponse.json({ patient: serializePatient(created) });
    backend.applyTo(response);
    return response;
  } catch {
    return contractMismatchResponse();
  }
}
