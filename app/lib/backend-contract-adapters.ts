import type { AppRole } from "./roles";

export type ApiContractError = {
  message: string;
  status: number;
};

type AnyRecord = Record<string, unknown>;

type SessionIdentity = {
  id: number | null;
  role: AppRole;
  email: string;
  name: string;
};

type AuthStatus = {
  bootstrapping: boolean;
  users: number;
};

type UserWriteInput = {
  name: string;
  email: string;
  password: string;
  role: AppRole;
};

type PatientWriteInput = {
  name: string;
  nic?: string;
  age?: number;
  gender?: "male" | "female" | "other";
  mobile?: string;
  priority?: "low" | "normal" | "high" | "critical";
  dateOfBirth?: string;
  address?: string;
};

function asRecord(value: unknown): AnyRecord | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as AnyRecord)
    : null;
}

function asArray(value: unknown): AnyRecord[] {
  if (Array.isArray(value)) {
    return value
      .map((entry) => asRecord(entry))
      .filter((entry): entry is AnyRecord => !!entry);
  }

  const record = asRecord(value);
  if (!record) return [];

  const candidates = [
    record.patients,
    record.users,
    record.history,
    record.data,
    record.items,
    record.rows,
  ];
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate
        .map((entry) => asRecord(entry))
        .filter((entry): entry is AnyRecord => !!entry);
    }
  }

  return [];
}

function toString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() && !Number.isNaN(Number(value))) {
    return Number(value);
  }
  return null;
}

function splitName(name: string) {
  const trimmed = name.trim().replace(/\s+/g, " ");
  if (!trimmed) {
    return { firstName: "", lastName: "" };
  }

  const [firstName, ...rest] = trimmed.split(" ");
  return {
    firstName,
    lastName: rest.join(" "),
  };
}

function joinName(record: AnyRecord) {
  const direct = toString(record.name ?? record.fullName).trim();
  if (direct) return direct;

  const firstName = toString(record.firstName ?? record.first_name).trim();
  const lastName = toString(record.lastName ?? record.last_name).trim();
  const combined = `${firstName} ${lastName}`.trim();
  return combined;
}

function contractMismatch(message: string): ApiContractError {
  return {
    message: `Backend contract mismatch: ${message}`,
    status: 502,
  };
}

function normalizePatientRecord(record: AnyRecord) {
  const id = toNumber(record.id ?? record.patientId ?? record.patient_id);
  const name = joinName(record);

  if (id === null || !name) {
    throw contractMismatch("patient record is missing a stable id or name.");
  }

  const dateOfBirth = toString(
    record.date_of_birth ?? record.dateOfBirth ?? record.dob,
    ""
  );
  const phone = toString(record.phone ?? record.mobile, "");
  const address = toString(record.address, "");
  const createdAt = toString(record.created_at ?? record.createdAt, "");
  const nic = toString(record.nic, "");
  const age = toNumber(record.age);
  const gender = toString(record.gender, "");
  const priority = toString(record.priority, "");

  return {
    ...record,
    id,
    name,
    fullName: name,
    dateOfBirth: dateOfBirth || null,
    date_of_birth: dateOfBirth || null,
    phone: phone || null,
    mobile: phone || null,
    address: address || null,
    createdAt: createdAt || null,
    created_at: createdAt || null,
    nic: nic || null,
    age,
    gender: gender || null,
    priority: priority || null,
  };
}

function normalizeHistoryEntry(record: AnyRecord) {
  const id = toNumber(record.id);
  const note = toString(record.note);
  const createdAt = toString(record.created_at ?? record.createdAt);

  if (id === null || !note) {
    throw contractMismatch("patient history entry is missing id or note.");
  }

  return {
    ...record,
    id,
    note,
    created_at: createdAt || null,
    createdAt: createdAt || null,
    created_by_user_id:
      toNumber(record.created_by_user_id ?? record.createdByUserId ?? record.actorUserId) ?? null,
    createdByUserId:
      toNumber(record.createdByUserId ?? record.created_by_user_id ?? record.actorUserId) ?? null,
    created_by_name: toString(record.created_by_name ?? record.createdByName, "") || null,
    createdByName: toString(record.createdByName ?? record.created_by_name, "") || null,
    created_by_role: toString(record.created_by_role ?? record.createdByRole, "") || null,
    createdByRole: toString(record.createdByRole ?? record.created_by_role, "") || null,
  };
}

export function adaptSessionIdentity(raw: unknown): SessionIdentity {
  const record = asRecord(raw);
  if (!record) {
    throw contractMismatch("session identity response is not an object.");
  }

  const role = toString(record.role).toLowerCase();
  const email = toString(record.email).trim().toLowerCase();
  const name = toString(record.name).trim();
  const id = toNumber(record.id ?? record.userId);

  if (
    (role !== "owner" && role !== "doctor" && role !== "assistant") ||
    !email ||
    !name
  ) {
    throw contractMismatch("session identity response is missing role, email, or name.");
  }

  return {
    id,
    role: role as AppRole,
    email,
    name,
  };
}

export function adaptAuthStatusResponse(raw: unknown): AuthStatus {
  const record = asRecord(raw);
  if (!record) {
    throw contractMismatch("auth status response is not an object.");
  }

  if (typeof record.bootstrapping !== "boolean") {
    throw contractMismatch("auth status response is missing bootstrapping.");
  }

  const users = toNumber(record.users ?? record.userCount ?? record.count);
  if (users === null) {
    throw contractMismatch("auth status response is missing users.");
  }

  return {
    bootstrapping: record.bootstrapping,
    users,
  };
}

export function adaptPatientCollectionResponse(raw: unknown) {
  if (Array.isArray(raw)) {
    return asArray(raw).map(normalizePatientRecord);
  }

  const record = asRecord(raw);
  if (!record) {
    throw contractMismatch("patient collection response is not an object or array.");
  }

  if ("patients" in record || "data" in record || "items" in record || "rows" in record) {
    return asArray(record).map(normalizePatientRecord);
  }

  throw contractMismatch("patient collection response does not contain a patients array.");
}

export function adaptPatientDetailResponse(raw: unknown) {
  const record = asRecord(raw);
  if (!record) {
    throw contractMismatch("patient detail response is not an object.");
  }

  if ("patient" in record) {
    const patient = asRecord(record.patient);
    if (!patient) {
      throw contractMismatch("patient detail payload is missing patient object.");
    }
    return {
      patient: normalizePatientRecord(patient),
      history: asArray(record.history).map(normalizeHistoryEntry),
    };
  }

  return {
    patient: normalizePatientRecord(record),
    history: asArray(record.history).map(normalizeHistoryEntry),
  };
}

export function adaptPatientWriteRequest(input: PatientWriteInput) {
  const { firstName, lastName } = splitName(input.name);
  if (!firstName) {
    throw contractMismatch("patient create/update requires a non-empty name.");
  }

  return {
    firstName,
    lastName,
    gender: input.gender ?? "male",
    nic: input.nic,
    age: input.age,
    mobile: input.mobile,
    priority: input.priority,
    phone: input.mobile,
    dateOfBirth: input.dateOfBirth,
    address: input.address,
  };
}

export function adaptSinglePatientResponse(raw: unknown) {
  const record = asRecord(raw);
  if (!record) {
    throw contractMismatch("patient write response is not an object.");
  }

  if ("patient" in record) {
    const patient = asRecord(record.patient);
    if (!patient) {
      throw contractMismatch("patient write response is missing patient object.");
    }
    return normalizePatientRecord(patient);
  }

  return normalizePatientRecord(record);
}

function normalizeUserRecord(record: AnyRecord) {
  const id = toNumber(record.id ?? record.userId);
  const email = toString(record.email).trim().toLowerCase();
  const role = toString(record.role).toLowerCase();
  const name = joinName(record);

  if (id === null || !email || !name || (role !== "owner" && role !== "doctor" && role !== "assistant")) {
    throw contractMismatch("user record is missing id, name, email, or role.");
  }

  return {
    ...record,
    id,
    name,
    fullName: name,
    email,
    role: role as AppRole,
    createdAt: toString(record.createdAt ?? record.created_at) || null,
    created_at: toString(record.created_at ?? record.createdAt) || null,
  };
}

export function adaptUserWriteRequest(input: UserWriteInput) {
  const { firstName, lastName } = splitName(input.name);
  if (!firstName) {
    throw contractMismatch("user create/register requires a non-empty name.");
  }

  return {
    firstName,
    lastName,
    email: input.email.trim().toLowerCase(),
    password: input.password,
    role: input.role,
  };
}

export function adaptCreatedUserResponse(raw: unknown) {
  const record = asRecord(raw);
  if (!record) {
    throw contractMismatch("user write response is not an object.");
  }

  if ("user" in record) {
    const user = asRecord(record.user);
    if (!user) {
      throw contractMismatch("user write response is missing user object.");
    }
    return normalizeUserRecord(user);
  }

  return normalizeUserRecord(record);
}

export function adaptUserCollectionResponse(raw: unknown) {
  if (Array.isArray(raw)) {
    return asArray(raw).map(normalizeUserRecord);
  }

  const record = asRecord(raw);
  if (!record) {
    throw contractMismatch("user collection response is not an object or array.");
  }

  if ("users" in record || "data" in record || "items" in record || "rows" in record) {
    return asArray(record).map(normalizeUserRecord);
  }

  throw contractMismatch("user collection response does not contain a users array.");
}

export function adaptPatientHistoryResponse(raw: unknown) {
  if (Array.isArray(raw)) {
    return raw.map((entry) => normalizeHistoryEntry(asRecord(entry) ?? {}));
  }

  const record = asRecord(raw);
  if (!record) {
    throw contractMismatch("patient history response is not an object or array.");
  }

  if ("history" in record || "data" in record || "items" in record || "rows" in record) {
    return asArray(record).map(normalizeHistoryEntry);
  }

  throw contractMismatch("patient history response does not contain a history array.");
}
