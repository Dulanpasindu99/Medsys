import { NextRequest, NextResponse } from "next/server";
import {
  createPatientHistory,
  findPatientById,
  findUserById,
  listPatientHistory,
} from "@/app/lib/store";
import { requireRole } from "@/app/lib/api-auth";

function parseId(idParam: string) {
  const id = Number(idParam);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireRole(request, ["owner", "doctor", "assistant"]);
  if (auth.error) {
    return auth.error;
  }

  const { id: idParam } = await params;
  const id = parseId(idParam);
  if (!id) {
    return NextResponse.json({ error: "Invalid patient id." }, { status: 400 });
  }

  const history = listPatientHistory(id).map((entry) => {
    const createdBy = entry.createdByUserId ? findUserById(entry.createdByUserId) : undefined;
    return {
      id: entry.id,
      note: entry.note,
      created_at: entry.createdAt,
      created_by_user_id: createdBy?.id ?? null,
      created_by_name: createdBy?.name ?? null,
      created_by_role: createdBy?.role ?? null,
    };
  });

  return NextResponse.json({ history });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireRole(request, ["owner", "doctor", "assistant"]);
  if (auth.error) {
    return auth.error;
  }

  const { id: idParam } = await params;
  const id = parseId(idParam);
  if (!id) {
    return NextResponse.json({ error: "Invalid patient id." }, { status: 400 });
  }

  const body = await request.json();
  const { note } = body ?? {};

  if (!note) {
    return NextResponse.json({ error: "History note is required." }, { status: 400 });
  }

  const patient = findPatientById(id);
  if (!patient) {
    return NextResponse.json({ error: "Patient not found." }, { status: 404 });
  }

  const user = findUserById(auth.session!.userId);
  if (!user) {
    return NextResponse.json({ error: "Session user not found." }, { status: 404 });
  }

  const created = createPatientHistory({
    patientId: id,
    note,
    createdByUserId: auth.session!.userId,
  });

  return NextResponse.json({
    id: created.id,
    patientId: id,
    note,
    createdByUserId: auth.session!.userId,
  });
}
