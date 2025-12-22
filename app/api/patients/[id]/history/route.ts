import { NextResponse } from "next/server";
import {
  createPatientHistory,
  findPatientById,
  findUserById,
  listPatientHistory,
} from "@/app/lib/store";

function parseId(idParam: string) {
  const id = Number(idParam);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const { id: idParam } = params;
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
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id: idParam } = params;
  const id = parseId(idParam);
  if (!id) {
    return NextResponse.json({ error: "Invalid patient id." }, { status: 400 });
  }

  const body = await request.json();
  const { note, createdByUserId } = body ?? {};

  if (!note) {
    return NextResponse.json({ error: "History note is required." }, { status: 400 });
  }

  const patient = findPatientById(id);
  if (!patient) {
    return NextResponse.json({ error: "Patient not found." }, { status: 404 });
  }

  if (createdByUserId) {
    const user = findUserById(Number(createdByUserId));
    if (!user) {
      return NextResponse.json({ error: "Created by user not found." }, { status: 404 });
    }
  }

  const created = createPatientHistory({
    patientId: id,
    note,
    createdByUserId: createdByUserId ?? null,
  });

  return NextResponse.json({
    id: created.id,
    patientId: id,
    note,
    createdByUserId: createdByUserId ?? null,
  });
}
