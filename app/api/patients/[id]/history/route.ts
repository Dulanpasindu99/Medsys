import { NextResponse } from "next/server";
import { getDb } from "@/app/lib/db";

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

  const db = getDb();
  const history = db
    .prepare(
      `SELECT patient_history.id, patient_history.note, patient_history.created_at,
        users.id as created_by_user_id, users.name as created_by_name, users.role as created_by_role
      FROM patient_history
      LEFT JOIN users ON users.id = patient_history.created_by_user_id
      WHERE patient_history.patient_id = ?
      ORDER BY patient_history.created_at DESC`
    )
    .all(id);

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

  const db = getDb();
  const patient = db.prepare("SELECT id FROM patients WHERE id = ?").get(id);
  if (!patient) {
    return NextResponse.json({ error: "Patient not found." }, { status: 404 });
  }

  if (createdByUserId) {
    const user = db.prepare("SELECT id FROM users WHERE id = ?").get(createdByUserId);
    if (!user) {
      return NextResponse.json({ error: "Created by user not found." }, { status: 404 });
    }
  }

  const result = db
    .prepare("INSERT INTO patient_history (patient_id, note, created_by_user_id) VALUES (?, ?, ?)")
    .run(id, note, createdByUserId ?? null);

  return NextResponse.json({
    id: result.lastInsertRowid,
    patientId: id,
    note,
    createdByUserId: createdByUserId ?? null,
  });
}
