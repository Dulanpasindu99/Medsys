import { NextRequest, NextResponse } from "next/server";
import {
  createPatientHistory,
  findPatientById,
  findUserById,
  listPatientHistory,
} from "@/app/lib/store";
import { requirePermission } from "@/app/lib/api-auth";
import { serializeHistoryEntry } from "@/app/lib/api-serializers";
import {
  parseJsonBody,
  parsePositiveInteger,
  validatePatientHistoryPayload,
  validationErrorResponse,
} from "@/app/lib/api-validation";

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

  const history = listPatientHistory(id.value).map((entry) => {
    const createdBy = entry.createdByUserId ? findUserById(entry.createdByUserId) : undefined;
    return serializeHistoryEntry(entry, createdBy);
  });

  return NextResponse.json({ history });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requirePermission(request, "patient.history.write");
  if (auth.error) {
    return auth.error;
  }
  if (!auth.session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
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

  const patient = findPatientById(id.value);
  if (!patient) {
    return NextResponse.json({ error: "Patient not found." }, { status: 404 });
  }

  const sessionUserId = auth.session.userId;
  if (sessionUserId === null) {
    return NextResponse.json({ error: "Session user is missing." }, { status: 401 });
  }

  const user = findUserById(sessionUserId);
  if (!user) {
    return NextResponse.json({ error: "Session user not found." }, { status: 404 });
  }

  const created = createPatientHistory({
    patientId: id.value,
    note: validated.value.note,
    createdByUserId: sessionUserId,
  });

  return NextResponse.json({
    id: created.id,
    patientId: id.value,
    note: validated.value.note,
    createdByUserId: sessionUserId,
  });
}
