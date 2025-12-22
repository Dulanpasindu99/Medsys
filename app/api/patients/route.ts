import { NextResponse } from "next/server";
import { createPatient, listPatients } from "@/app/lib/store";

export async function GET() {
  const patients = listPatients().map((patient) => ({
    id: patient.id,
    name: patient.name,
    date_of_birth: patient.dateOfBirth,
    phone: patient.phone,
    address: patient.address,
    created_at: patient.createdAt,
  }));

  return NextResponse.json({ patients });
}

export async function POST(request: Request) {
  const body = await request.json();
  const { name, dateOfBirth, phone, address } = body ?? {};

  if (!name) {
    return NextResponse.json({ error: "Patient name is required." }, { status: 400 });
  }

  const created = createPatient({
    name,
    dateOfBirth: dateOfBirth ?? null,
    phone: phone ?? null,
    address: address ?? null,
  });

  return NextResponse.json({
    id: created.id,
    name,
    dateOfBirth: dateOfBirth ?? null,
    phone: phone ?? null,
    address: address ?? null,
  });
}
