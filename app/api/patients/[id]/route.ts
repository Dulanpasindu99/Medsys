import { NextResponse } from "next/server";
import {
  deletePatient,
  findPatientById,
  findUserById,
  listPatientHistory,
  updatePatient,
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

  const patient = findPatientById(id);

  if (!patient) {
    return NextResponse.json({ error: "Patient not found." }, { status: 404 });
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

  return NextResponse.json({
    patient: {
      id: patient.id,
      name: patient.name,
      date_of_birth: patient.dateOfBirth,
      phone: patient.phone,
      address: patient.address,
      created_at: patient.createdAt,
    },
    history,
  });
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

  const patient = findPatientById(id);
  if (!patient) {
    return NextResponse.json({ error: "Patient not found." }, { status: 404 });
  }

  const updated = updatePatient(id, {
    name,
    dateOfBirth: dateOfBirth ?? undefined,
    phone: phone ?? undefined,
    address: address ?? undefined,
  });

  if (!updated) {
    return NextResponse.json({ error: "Patient not found." }, { status: 404 });
  }

  return NextResponse.json({
    patient: {
      id: updated.id,
      name: updated.name,
      date_of_birth: updated.dateOfBirth,
      phone: updated.phone,
      address: updated.address,
      created_at: updated.createdAt,
    },
  });
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

  const deleted = deletePatient(id);
  if (!deleted) {
    return NextResponse.json({ error: "Patient not found." }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
