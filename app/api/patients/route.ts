import { NextResponse } from "next/server";
import { getDb } from "@/app/lib/db";

export async function GET() {
  const db = getDb();
  const patients = db
    .prepare("SELECT id, name, date_of_birth, phone, address, created_at FROM patients ORDER BY created_at DESC")
    .all();

  return NextResponse.json({ patients });
}

export async function POST(request: Request) {
  const body = await request.json();
  const { name, dateOfBirth, phone, address } = body ?? {};

  if (!name) {
    return NextResponse.json({ error: "Patient name is required." }, { status: 400 });
  }

  const db = getDb();
  const result = db
    .prepare(
      "INSERT INTO patients (name, date_of_birth, phone, address) VALUES (?, ?, ?, ?)"
    )
    .run(name, dateOfBirth ?? null, phone ?? null, address ?? null);

  return NextResponse.json({
    id: result.lastInsertRowid,
    name,
    dateOfBirth: dateOfBirth ?? null,
    phone: phone ?? null,
    address: address ?? null,
  });
}
