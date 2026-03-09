import { NextRequest, NextResponse } from "next/server";
import { createPatient, listPatients } from "@/app/lib/store";
import { requirePermission } from "@/app/lib/api-auth";
import { serializePatient } from "@/app/lib/api-serializers";
import {
  parseJsonBody,
  validatePatientCreatePayload,
  validationErrorResponse,
} from "@/app/lib/api-validation";

export async function GET(request: NextRequest) {
  const auth = requirePermission(request, "patient.read");
  if (auth.error) {
    return auth.error;
  }

  const patients = listPatients().map(serializePatient);

  return NextResponse.json({ patients });
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

  const created = createPatient(validated.value);

  return NextResponse.json({ patient: serializePatient(created) });
}
