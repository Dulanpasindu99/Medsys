import type { AppPermission } from "./authorization";
import type { AppRole } from "./roles";
import type { DoctorWorkflowMode } from "./api-client";

export type ApiContractError = {
  message: string;
  status: number;
};

type AnyRecord = Record<string, unknown>;

type AuthStatus = {
  bootstrapping: boolean;
  users: number;
};

function asRecord(value: unknown): AnyRecord | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as AnyRecord)
    : null;
}

function normalizeRecordArray(value: unknown): AnyRecord[] {
  if (Array.isArray(value)) {
    return value
      .map((entry) => asRecord(entry))
      .filter((entry): entry is AnyRecord => !!entry);
  }

  return [];
}

function readRequiredWrappedArray(
  record: AnyRecord,
  key: string,
  message: string
): AnyRecord[] {
  if (!(key in record)) {
    throw contractMismatch(message);
  }

  return normalizeRecordArray(record[key]);
}

function readOptionalWrappedArray(record: AnyRecord, key: string): AnyRecord[] {
  if (!(key in record)) {
    return [];
  }

  return normalizeRecordArray(record[key]);
}

function toString(value: unknown, fallback = "") {
  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return fallback;
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() && !Number.isNaN(Number(value))) {
    return Number(value);
  }
  return null;
}

function normalizePermissionArray(value: unknown): AppPermission[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return Array.from(
    new Set(
      value
        .filter((entry): entry is string => typeof entry === "string")
        .map((entry) => entry.trim() as AppPermission)
        .filter(Boolean)
    )
  );
}

function normalizeDoctorWorkflowMode(value: unknown): DoctorWorkflowMode {
  const normalized = toString(value).trim().toLowerCase();
  if (normalized === "self_service") return "self_service";
  if (normalized === "clinic_supported") return "clinic_supported";
  return null;
}

function joinName(record: AnyRecord) {
  const direct = toString(record.name ?? record.fullName ?? record.full_name).trim();
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

  const dateOfBirth = toString(record.date_of_birth ?? record.dob, "");
  const phone = toString(record.phone ?? record.mobile, "");
  const address = toString(record.address, "");
  const createdAt = toString(record.created_at, "");
  const nic = toString(record.nic, "");
  const age = toNumber(record.age);
  const gender = toString(record.gender, "");
  const priority = toString(record.priority, "");
  const patientCode = toString(record.patient_code, "");
  const familyId = toNumber(record.family_id ?? asRecord(record.family)?.id);
  const guardianPatientId = toNumber(
    record.guardian_patient_id ??
      asRecord(record.guardian_patient)?.id ??
      asRecord(record.guardianPatient)?.id
  );
  const guardianName = toString(
    record.guardian_name ?? asRecord(record.guardian_patient)?.name,
    ""
  );
  const guardianNic = toString(
    record.guardian_nic ?? asRecord(record.guardian_patient)?.nic,
    ""
  );
  const guardianPhone = toString(
    record.guardian_phone ?? asRecord(record.guardian_patient)?.phone,
    ""
  );
  const guardianRelationship = toString(record.guardian_relationship, "");
  const firstName = toString(record.first_name, "");
  const lastName = toString(record.last_name, "");

  return {
    ...record,
    id,
    name,
    fullName: name,
    firstName: firstName || null,
    first_name: firstName || null,
    lastName: lastName || null,
    last_name: lastName || null,
    dateOfBirth: dateOfBirth || null,
    date_of_birth: dateOfBirth || null,
    phone: phone || null,
    mobile: phone || null,
    address: address || null,
    createdAt: createdAt || null,
    created_at: createdAt || null,
    patientCode: patientCode || null,
    patient_code: patientCode || null,
    familyId,
    family_id: familyId,
    guardianPatientId,
    guardian_patient_id: guardianPatientId,
    guardianName: guardianName || null,
    guardian_name: guardianName || null,
    guardianNic: guardianNic || null,
    guardian_nic: guardianNic || null,
    guardianPhone: guardianPhone || null,
    guardian_phone: guardianPhone || null,
    guardianRelationship: guardianRelationship || null,
    guardian_relationship: guardianRelationship || null,
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

export function adaptAuthStatusResponse(raw: unknown): AuthStatus {
  const record = asRecord(raw);
  if (!record) {
    throw contractMismatch("auth status response is not an object.");
  }

  if (typeof record.bootstrapping !== "boolean") {
    throw contractMismatch("auth status response is missing bootstrapping.");
  }

  const users = toNumber(record.users);
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
    return normalizeRecordArray(raw).map(normalizePatientRecord);
  }

  const record = asRecord(raw);
  if (!record) {
    throw contractMismatch("patient collection response is not an object or array.");
  }

  return readRequiredWrappedArray(
    record,
    "patients",
    "patient collection response does not contain a patients array."
  ).map(normalizePatientRecord);
}

export function adaptPatientDetailResponse(raw: unknown) {
  const record = asRecord(raw);
  if (!record) {
    throw contractMismatch("patient detail response is not an object.");
  }

  const patient = asRecord(record.patient);
  if (!patient) {
    throw contractMismatch("patient detail payload is missing patient object.");
  }

  return {
    patient: normalizePatientRecord(patient),
    history: readOptionalWrappedArray(record, "history").map(normalizeHistoryEntry),
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
    roles: Array.from(
      new Set(
        (Array.isArray(record.roles) ? record.roles : [record.active_role ?? record.role])
          .map((entry) => toString(entry).toLowerCase())
          .filter((entry): entry is AppRole =>
            entry === "owner" || entry === "doctor" || entry === "assistant"
          )
      )
    ),
    active_role:
      (() => {
        const activeRole = toString(record.active_role ?? record.activeRole).toLowerCase();
        return activeRole === "owner" || activeRole === "doctor" || activeRole === "assistant"
          ? (activeRole as AppRole)
          : (role as AppRole);
      })(),
    createdAt: toString(record.createdAt ?? record.created_at) || null,
    created_at: toString(record.created_at ?? record.createdAt) || null,
    permissions: normalizePermissionArray(record.permissions),
    extraPermissions: normalizePermissionArray(
      record.extraPermissions ?? record.extra_permissions
    ),
    extra_permissions: normalizePermissionArray(
      record.extra_permissions ?? record.extraPermissions
    ),
    doctorWorkflowMode: normalizeDoctorWorkflowMode(
      record.doctorWorkflowMode ?? record.doctor_workflow_mode
    ),
    doctor_workflow_mode: normalizeDoctorWorkflowMode(
      record.doctor_workflow_mode ?? record.doctorWorkflowMode
    ),
    workflow_profiles: asRecord(record.workflow_profiles ?? record.workflowProfiles),
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
    return normalizeRecordArray(raw).map(normalizeUserRecord);
  }

  const record = asRecord(raw);
  if (!record) {
    throw contractMismatch("user collection response is not an object or array.");
  }

  return readRequiredWrappedArray(
    record,
    "users",
    "user collection response does not contain a users array."
  ).map(normalizeUserRecord);
}

export function adaptAuthenticatedUserResponse(raw: unknown) {
  const record = asRecord(raw);
  if (!record) {
    throw contractMismatch("authenticated user response is not an object.");
  }

  if ("user" in record) {
    const user = asRecord(record.user);
    if (!user) {
      throw contractMismatch("authenticated user response is missing user object.");
    }
    return normalizeUserRecord(user);
  }

  return normalizeUserRecord(record);
}

export function adaptPatientHistoryResponse(raw: unknown) {
  if (Array.isArray(raw)) {
    return normalizeRecordArray(raw).map(normalizeHistoryEntry);
  }

  const record = asRecord(raw);
  if (!record) {
    throw contractMismatch("patient history response is not an object or array.");
  }

  return readRequiredWrappedArray(
    record,
    "history",
    "patient history response does not contain a history array."
  ).map(normalizeHistoryEntry);
}
