import { NextRequest, NextResponse } from "next/server";
import {
  deletePatient,
  findPatientById,
  findUserById,
  listPatientHistory,
  updatePatient,
} from "@/app/lib/store";
import { requirePermission } from "@/app/lib/api-auth";
import { serializeHistoryEntry, serializePatient } from "@/app/lib/api-serializers";
import {
  parseJsonBody,
  parsePositiveInteger,
  validatePatientUpdatePayload,
  validationErrorResponse,
} from "@/app/lib/api-validation";

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

  const patient = findPatientById(id.value);

  if (!patient) {
    return NextResponse.json({ error: "Patient not found." }, { status: 404 });
  }

  const history = listPatientHistory(id.value).map((entry) => {
    const createdBy = entry.createdByUserId ? findUserById(entry.createdByUserId) : undefined;
    return serializeHistoryEntry(entry, createdBy);
  });

  return NextResponse.json({
    patient: serializePatient(patient),
    history,
  });
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

  const patient = findPatientById(id.value);
  if (!patient) {
    return NextResponse.json({ error: "Patient not found." }, { status: 404 });
  }

  const updated = updatePatient(id.value, validated.value);

  if (!updated) {
    return NextResponse.json({ error: "Patient not found." }, { status: 404 });
  }

  return NextResponse.json({
    patient: serializePatient(updated),
  });
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

  const deleted = deletePatient(id.value);
  if (!deleted) {
    return NextResponse.json({ error: "Patient not found." }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
