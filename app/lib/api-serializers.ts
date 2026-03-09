import type { Role } from "@/app/lib/store";

type PatientRecord = {
  id: number;
  name: string;
  dateOfBirth: string | null;
  phone: string | null;
  address: string | null;
  createdAt: string;
};

type UserRecord = {
  id: number;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
};

type HistoryEntry = {
  id: number;
  note: string;
  createdAt: string;
  createdByUserId: number | null;
};

type HistoryActor = {
  id: number;
  name: string;
  role: Role;
} | undefined;

type SessionIdentity = {
  id: number | null;
  name: string;
  email: string;
  role: Role;
};

export function serializePatient(patient: PatientRecord) {
  return {
    id: patient.id,
    name: patient.name,
    date_of_birth: patient.dateOfBirth,
    phone: patient.phone,
    address: patient.address,
    created_at: patient.createdAt,
  };
}

export function serializeUser(user: UserRecord) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    created_at: user.createdAt,
  };
}

export function serializeHistoryEntry(entry: HistoryEntry, actor?: HistoryActor) {
  return {
    id: entry.id,
    note: entry.note,
    created_at: entry.createdAt,
    created_by_user_id: actor?.id ?? entry.createdByUserId ?? null,
    created_by_name: actor?.name ?? null,
    created_by_role: actor?.role ?? null,
  };
}

export function serializeSessionIdentity(identity: SessionIdentity) {
  return {
    id: identity.id,
    name: identity.name,
    email: identity.email,
    role: identity.role,
  };
}
