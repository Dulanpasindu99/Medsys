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
  const patient = db
    .prepare("SELECT id, name, date_of_birth, phone, address, created_at FROM patients WHERE id = ?")
    .get(id);

  if (!patient) {
    return NextResponse.json({ error: "Patient not found." }, { status: 404 });
  }

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

  return NextResponse.json({ patient, history });
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id: idParam } = params;
  const id = parseId(idParam);
  if (!id) {
    return NextResponse.json({ error: "Invalid patient id." }, { status: 400 });
  }

  const body = await request.json();
  const { name, dateOfBirth, phone, address } = body ?? {};

  const db = getDb();
  const patient = db.prepare("SELECT id FROM patients WHERE id = ?").get(id);
  if (!patient) {
    return NextResponse.json({ error: "Patient not found." }, { status: 404 });
  }

  db.prepare(
    "UPDATE patients SET name = COALESCE(?, name), date_of_birth = COALESCE(?, date_of_birth), phone = COALESCE(?, phone), address = COALESCE(?, address) WHERE id = ?"
  ).run(name ?? null, dateOfBirth ?? null, phone ?? null, address ?? null, id);

  const updated = db
    .prepare("SELECT id, name, date_of_birth, phone, address, created_at FROM patients WHERE id = ?")
    .get(id);

  return NextResponse.json({ patient: updated });
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const { id: idParam } = params;
  const id = parseId(idParam);
  if (!id) {
    return NextResponse.json({ error: "Invalid patient id." }, { status: 400 });
  }

  const db = getDb();
  const patient = db.prepare("SELECT id FROM patients WHERE id = ?").get(id);
  if (!patient) {
    return NextResponse.json({ error: "Patient not found." }, { status: 404 });
  }

  db.prepare("DELETE FROM patients WHERE id = ?").run(id);

  return NextResponse.json({ success: true });
}
