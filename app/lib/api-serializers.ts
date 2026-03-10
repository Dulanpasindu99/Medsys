import type { AppRole } from "@/app/lib/roles";

type PatientRecord = {
  id: number;
  name: string;
  dateOfBirth: string | null;
  phone: string | null;
  address: string | null;
  createdAt: string | null;
  nic?: string | null;
  age?: number | null;
  gender?: string | null;
  priority?: string | null;
  mobile?: string | null;
  fullName?: string | null;
};

type UserRecord = {
  id: number;
  name: string;
  email: string;
  role: AppRole;
  createdAt: string | null;
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
  role: AppRole;
} | undefined;

type SessionIdentity = {
  id: number | null;
  name: string;
  email: string;
  role: AppRole;
};

export function serializePatient(patient: PatientRecord) {
  return {
    id: patient.id,
    name: patient.name,
    ...(patient.fullName && patient.fullName !== patient.name
      ? { fullName: patient.fullName }
      : {}),
    date_of_birth: patient.dateOfBirth,
    phone: patient.phone,
    ...(patient.mobile && patient.mobile !== patient.phone
      ? { mobile: patient.mobile }
      : {}),
    address: patient.address,
    created_at: patient.createdAt ?? null,
    ...(patient.nic != null ? { nic: patient.nic } : {}),
    ...(patient.age != null ? { age: patient.age } : {}),
    ...(patient.gender != null ? { gender: patient.gender } : {}),
    ...(patient.priority != null ? { priority: patient.priority } : {}),
  };
}

export function serializeUser(user: UserRecord) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    created_at: user.createdAt ?? null,
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
