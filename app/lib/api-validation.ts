import { NextResponse } from "next/server";
import type { AppPermission } from "@/app/lib/authorization";
import type { AppRole } from "@/app/lib/roles";

export type ValidationIssue = {
  field: string;
  message: string;
};

type ValidationSuccess<T> = {
  ok: true;
  value: T;
};

type ValidationFailure = {
  ok: false;
  issues: ValidationIssue[];
};

export type ValidationResult<T> = ValidationSuccess<T> | ValidationFailure;

const VALID_ROLES: readonly AppRole[] = ["owner", "doctor", "assistant"];

function success<T>(value: T): ValidationSuccess<T> {
  return { ok: true, value };
}

function failure(issues: ValidationIssue[]): ValidationFailure {
  return { ok: false, issues };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function ensureAllowedKeys(
  payload: Record<string, unknown>,
  allowedKeys: readonly string[]
): ValidationIssue[] {
  return Object.keys(payload)
    .filter((key) => !allowedKeys.includes(key))
    .map((key) => ({
      field: key,
      message: "Unknown field.",
    }));
}

function normalizeOptionalString(
  value: unknown,
  field: string,
  options?: { maxLength?: number; allowEmpty?: boolean }
) {
  if (value === undefined) {
    return success<string | undefined>(undefined);
  }

  if (value === null) {
    return success<string | null>(null);
  }

  if (typeof value !== "string") {
    return failure([{ field, message: "Must be a string." }]);
  }

  const normalized = value.trim();
  if (!options?.allowEmpty && normalized.length === 0) {
    return success<string | null>(null);
  }

  if (options?.maxLength && normalized.length > options.maxLength) {
    return failure([{ field, message: `Must be at most ${options.maxLength} characters.` }]);
  }

  return success(normalized);
}

function normalizePermissionList(
  value: unknown,
  field: string
): ValidationResult<AppPermission[] | undefined> {
  if (value === undefined) {
    return success(undefined);
  }

  if (!Array.isArray(value)) {
    return failure([{ field, message: "Must be an array of permission strings." }]);
  }

  const issues: ValidationIssue[] = [];
  const normalized = value.flatMap((entry, index) => {
    if (typeof entry !== "string") {
      issues.push({ field: `${field}[${index}]`, message: "Must be a string." });
      return [];
    }

    const permission = entry.trim() as AppPermission;
    if (!permission) {
      issues.push({ field: `${field}[${index}]`, message: "Is required." });
      return [];
    }

    return [permission];
  });

  return issues.length > 0 ? failure(issues) : success(Array.from(new Set(normalized)));
}

function normalizeRequiredString(
  value: unknown,
  field: string,
  options?: { minLength?: number; maxLength?: number }
) {
  if (typeof value !== "string") {
    return failure([{ field, message: "Must be a string." }]);
  }

  const normalized = value.trim();
  if (normalized.length === 0) {
    return failure([{ field, message: "Is required." }]);
  }

  if (options?.minLength && normalized.length < options.minLength) {
    return failure([{ field, message: `Must be at least ${options.minLength} characters.` }]);
  }

  if (options?.maxLength && normalized.length > options.maxLength) {
    return failure([{ field, message: `Must be at most ${options.maxLength} characters.` }]);
  }

  return success(normalized);
}

function normalizeOptionalIsoDate(
  value: unknown,
  field: string
): ValidationResult<string | null | undefined> {
  const normalized = normalizeOptionalString(value, field, { maxLength: 32, allowEmpty: false });
  if (!normalized.ok) {
    return normalized;
  }

  if (normalized.value === undefined || normalized.value === null) {
    return normalized;
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized.value)) {
    return failure([{ field, message: "Must use YYYY-MM-DD format." }]);
  }

  return normalized;
}

function normalizeEmail(value: unknown, field: string) {
  const normalized = normalizeRequiredString(value, field, { maxLength: 160 });
  if (!normalized.ok) {
    return normalized;
  }

  const email = normalized.value.toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return failure([{ field, message: "Must be a valid email address." }]);
  }

  return success(email);
}

function normalizeRole(value: unknown, field: string) {
  if (typeof value !== "string") {
    return failure([{ field, message: "Must be a string." }]);
  }

  if (!VALID_ROLES.includes(value as AppRole)) {
    return failure([{ field, message: "Must be one of owner, doctor, assistant." }]);
  }

  return success(value as AppRole);
}

export async function parseJsonBody(request: Request) {
  try {
    const parsed = (await request.json()) as unknown;
    if (!isRecord(parsed)) {
      return failure([{ field: "body", message: "Must be a JSON object." }]);
    }
    return success(parsed);
  } catch {
    return failure([{ field: "body", message: "Must be valid JSON." }]);
  }
}

export function validationErrorResponse(issues: ValidationIssue[]) {
  return NextResponse.json(
    {
      error: "Validation failed.",
      issues,
    },
    { status: 400 }
  );
}

export function parsePositiveInteger(value: string, field: string) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return failure([{ field, message: "Must be a positive integer." }]);
  }

  return success(parsed);
}

function normalizeOptionalNonNegativeInteger(
  value: unknown,
  field: string
): ValidationResult<number | undefined> {
  if (value === undefined) {
    return success(undefined);
  }

  if (typeof value !== "number" || !Number.isInteger(value)) {
    return failure([{ field, message: "Must be an integer." }]);
  }

  if (value < 0) {
    return failure([{ field, message: "Must be zero or greater." }]);
  }

  return success(value);
}

function normalizePatientGender(value: unknown, field: string) {
  if (value === undefined) {
    return success<"male" | "female" | "other" | undefined>(undefined);
  }

  if (value !== "male" && value !== "female" && value !== "other") {
    return failure([{ field, message: "Must be one of male, female, other." }]);
  }

  return success(value as "male" | "female" | "other");
}

function normalizePatientPriority(value: unknown, field: string) {
  if (value === undefined) {
    return success<"low" | "normal" | "high" | "critical" | undefined>(undefined);
  }

  if (value !== "low" && value !== "normal" && value !== "high" && value !== "critical") {
    return failure([{ field, message: "Must be one of low, normal, high, critical." }]);
  }

  return success(value as "low" | "normal" | "high" | "critical");
}

export function validatePatientCreatePayload(payload: Record<string, unknown>) {
  const issues: ValidationIssue[] = ensureAllowedKeys(payload, [
    "name",
    "dateOfBirth",
    "phone",
    "address",
    "nic",
    "age",
    "gender",
    "mobile",
    "priority",
  ]);

  const name = normalizeRequiredString(payload.name, "name", { maxLength: 120 });
  if (!name.ok) issues.push(...name.issues);

  const dateOfBirth = normalizeOptionalIsoDate(payload.dateOfBirth, "dateOfBirth");
  if (!dateOfBirth.ok) issues.push(...dateOfBirth.issues);

  const phone = normalizeOptionalString(payload.phone, "phone", { maxLength: 30, allowEmpty: false });
  if (!phone.ok) issues.push(...phone.issues);

  const address = normalizeOptionalString(payload.address, "address", { maxLength: 255, allowEmpty: false });
  if (!address.ok) issues.push(...address.issues);

  const nic = normalizeOptionalString(payload.nic, "nic", { maxLength: 32, allowEmpty: false });
  if (!nic.ok) issues.push(...nic.issues);

  const age = normalizeOptionalNonNegativeInteger(payload.age, "age");
  if (!age.ok) issues.push(...age.issues);

  const gender = normalizePatientGender(payload.gender, "gender");
  if (!gender.ok) issues.push(...gender.issues);

  const mobile = normalizeOptionalString(payload.mobile, "mobile", {
    maxLength: 30,
    allowEmpty: false,
  });
  if (!mobile.ok) issues.push(...mobile.issues);

  const priority =
    payload.priority === undefined
      ? failure([{ field: "priority", message: "Is required." }])
      : normalizePatientPriority(payload.priority, "priority");
  if (!priority.ok) issues.push(...priority.issues);

  if (
    issues.length > 0 ||
    !name.ok ||
    !dateOfBirth.ok ||
    !phone.ok ||
    !address.ok ||
    !nic.ok ||
    !age.ok ||
    !gender.ok ||
    !mobile.ok ||
    !priority.ok
  ) {
    return failure(issues);
  }

  return success({
    name: name.value,
    dateOfBirth: dateOfBirth.value ?? null,
    phone: phone.value ?? mobile.value ?? null,
    address: address.value ?? null,
    nic: nic.value ?? null,
    age: age.value,
    gender: gender.value,
    mobile: mobile.value ?? phone.value ?? null,
    priority: priority.value,
  });
}

export function validatePatientUpdatePayload(payload: Record<string, unknown>) {
  const issues: ValidationIssue[] = ensureAllowedKeys(payload, [
    "name",
    "dateOfBirth",
    "phone",
    "address",
    "nic",
    "age",
    "gender",
    "mobile",
    "priority",
  ]);

  if (Object.keys(payload).length === 0) {
    issues.push({ field: "body", message: "At least one updatable field is required." });
  }

  const result: {
    name?: string;
    dateOfBirth?: string | null;
    phone?: string | null;
    address?: string | null;
    nic?: string | null;
    age?: number;
    gender?: "male" | "female" | "other";
    mobile?: string | null;
    priority?: "low" | "normal" | "high" | "critical";
  } = {};

  if ("name" in payload) {
    const name = normalizeRequiredString(payload.name, "name", { maxLength: 120 });
    if (!name.ok) {
      issues.push(...name.issues);
    } else {
      result.name = name.value;
    }
  }

  if ("dateOfBirth" in payload) {
    const dateOfBirth = normalizeOptionalIsoDate(payload.dateOfBirth, "dateOfBirth");
    if (!dateOfBirth.ok) {
      issues.push(...dateOfBirth.issues);
    } else {
      result.dateOfBirth = dateOfBirth.value ?? null;
    }
  }

  if ("phone" in payload) {
    const phone = normalizeOptionalString(payload.phone, "phone", { maxLength: 30, allowEmpty: false });
    if (!phone.ok) {
      issues.push(...phone.issues);
    } else {
      result.phone = phone.value ?? null;
    }
  }

  if ("address" in payload) {
    const address = normalizeOptionalString(payload.address, "address", { maxLength: 255, allowEmpty: false });
    if (!address.ok) {
      issues.push(...address.issues);
    } else {
      result.address = address.value ?? null;
    }
  }

  if ("nic" in payload) {
    const nic = normalizeOptionalString(payload.nic, "nic", { maxLength: 32, allowEmpty: false });
    if (!nic.ok) {
      issues.push(...nic.issues);
    } else {
      result.nic = nic.value ?? null;
    }
  }

  if ("age" in payload) {
    const age = normalizeOptionalNonNegativeInteger(payload.age, "age");
    if (!age.ok) {
      issues.push(...age.issues);
    } else if (age.value !== undefined) {
      result.age = age.value;
    }
  }

  if ("gender" in payload) {
    const gender = normalizePatientGender(payload.gender, "gender");
    if (!gender.ok) {
      issues.push(...gender.issues);
    } else if (gender.value !== undefined) {
      result.gender = gender.value;
    }
  }

  if ("mobile" in payload) {
    const mobile = normalizeOptionalString(payload.mobile, "mobile", {
      maxLength: 30,
      allowEmpty: false,
    });
    if (!mobile.ok) {
      issues.push(...mobile.issues);
    } else {
      result.mobile = mobile.value ?? null;
      if (!("phone" in payload)) {
        result.phone = mobile.value ?? null;
      }
    }
  }

  if ("priority" in payload) {
    const priority = normalizePatientPriority(payload.priority, "priority");
    if (!priority.ok) {
      issues.push(...priority.issues);
    } else if (priority.value !== undefined) {
      result.priority = priority.value;
    }
  }

  return issues.length > 0 ? failure(issues) : success(result);
}

export function validatePatientHistoryPayload(payload: Record<string, unknown>) {
  const issues: ValidationIssue[] = ensureAllowedKeys(payload, ["note"]);
  const note = normalizeRequiredString(payload.note, "note", { maxLength: 1000 });
  if (!note.ok) {
    issues.push(...note.issues);
  }

  return issues.length > 0 || !note.ok ? failure(issues) : success({ note: note.value });
}

export function validateUserWritePayload(payload: Record<string, unknown>) {
  const issues: ValidationIssue[] = ensureAllowedKeys(payload, [
    "name",
    "email",
    "password",
    "role",
    "extraPermissions",
  ]);

  const name = normalizeRequiredString(payload.name, "name", { maxLength: 120 });
  if (!name.ok) issues.push(...name.issues);

  const email = normalizeEmail(payload.email, "email");
  if (!email.ok) issues.push(...email.issues);

  const password = normalizeRequiredString(payload.password, "password", {
    minLength: 8,
    maxLength: 128,
  });
  if (!password.ok) issues.push(...password.issues);

  const role = normalizeRole(payload.role, "role");
  if (!role.ok) issues.push(...role.issues);

  const extraPermissions = normalizePermissionList(payload.extraPermissions, "extraPermissions");
  if (!extraPermissions.ok) issues.push(...extraPermissions.issues);

  if (role.ok && extraPermissions.ok && role.value !== "doctor" && extraPermissions.value?.length) {
    issues.push({
      field: "extraPermissions",
      message: "Only doctor users can receive extra permissions.",
    });
  }

  if (
    issues.length > 0 ||
    !name.ok ||
    !email.ok ||
    !password.ok ||
    !role.ok ||
    !extraPermissions.ok
  ) {
    return failure(issues);
  }

  return success({
    name: name.value,
    email: email.value,
    password: password.value,
    role: role.value,
    ...(extraPermissions.value?.length ? { extraPermissions: extraPermissions.value } : {}),
  });
}

export function validateUserPermissionUpdatePayload(payload: Record<string, unknown>) {
  const issues: ValidationIssue[] = ensureAllowedKeys(payload, ["extraPermissions"]);
  const extraPermissions = normalizePermissionList(payload.extraPermissions, "extraPermissions");
  if (!extraPermissions.ok) {
    issues.push(...extraPermissions.issues);
  }

  if (issues.length > 0 || !extraPermissions.ok) {
    return failure(issues);
  }

  return success({
    extraPermissions: extraPermissions.value ?? [],
  });
}

export function validateUserRoleQuery(value: string | null) {
  if (value === null) {
    return success<AppRole | undefined>(undefined);
  }

  return normalizeRole(value, "role");
}

export function validateAppointmentStatusQuery(value: string | null) {
  if (value === null) {
    return success<"waiting" | "in_consultation" | "completed" | "cancelled" | undefined>(
      undefined
    );
  }

  if (
    value !== "waiting" &&
    value !== "in_consultation" &&
    value !== "completed" &&
    value !== "cancelled"
  ) {
    return failure([
      {
        field: "status",
        message: "Must be one of waiting, in_consultation, completed, cancelled.",
      },
    ]);
  }

  return success(value);
}

function normalizeRequiredPositiveInteger(value: unknown, field: string) {
  if (typeof value !== "number" || !Number.isInteger(value)) {
    return failure([{ field, message: "Must be an integer." }]);
  }

  if (value <= 0) {
    return failure([{ field, message: "Must be a positive integer." }]);
  }

  return success(value);
}

function normalizeAppointmentStatus(
  value: unknown,
  field: string
): ValidationResult<"waiting" | "in_consultation" | "completed" | "cancelled"> {
  if (value !== "waiting" && value !== "in_consultation" && value !== "completed" && value !== "cancelled") {
    return failure([
      {
        field,
        message: "Must be one of waiting, in_consultation, completed, cancelled.",
      },
    ]);
  }

  return success(value);
}

function normalizeRequiredIsoDateTime(value: unknown, field: string) {
  const normalized = normalizeRequiredString(value, field, { maxLength: 64 });
  if (!normalized.ok) {
    return normalized;
  }

  if (!/^\d{4}-\d{2}-\d{2}T/.test(normalized.value) || Number.isNaN(Date.parse(normalized.value))) {
    return failure([{ field, message: "Must be a valid ISO date-time string." }]);
  }

  return normalized;
}

export function validateAppointmentCreatePayload(payload: Record<string, unknown>) {
  const issues: ValidationIssue[] = ensureAllowedKeys(payload, [
    "patientId",
    "doctorId",
    "assistantId",
    "scheduledAt",
    "status",
    "reason",
    "priority",
  ]);

  const patientId = normalizeRequiredPositiveInteger(payload.patientId, "patientId");
  if (!patientId.ok) issues.push(...patientId.issues);

  const doctorId = normalizeRequiredPositiveInteger(payload.doctorId, "doctorId");
  if (!doctorId.ok) issues.push(...doctorId.issues);

  const assistantId = normalizeRequiredPositiveInteger(payload.assistantId, "assistantId");
  if (!assistantId.ok) issues.push(...assistantId.issues);

  const scheduledAt = normalizeRequiredIsoDateTime(payload.scheduledAt, "scheduledAt");
  if (!scheduledAt.ok) issues.push(...scheduledAt.issues);

  const status = normalizeAppointmentStatus(payload.status, "status");
  if (!status.ok) issues.push(...status.issues);

  const reason = normalizeRequiredString(payload.reason, "reason", { maxLength: 255 });
  if (!reason.ok) issues.push(...reason.issues);

  const priority = normalizePatientPriority(payload.priority, "priority");
  if (!priority.ok) issues.push(...priority.issues);

  if (
    issues.length > 0 ||
    !patientId.ok ||
    !doctorId.ok ||
    !assistantId.ok ||
    !scheduledAt.ok ||
    !status.ok ||
    !reason.ok ||
    !priority.ok ||
    priority.value === undefined
  ) {
    return failure(issues);
  }

  return success({
    patientId: patientId.value,
    doctorId: doctorId.value,
    assistantId: assistantId.value,
    scheduledAt: scheduledAt.value,
    status: status.value,
    reason: reason.value,
    priority: priority.value,
  });
}

export function validateAppointmentUpdatePayload(payload: Record<string, unknown>) {
  const issues: ValidationIssue[] = ensureAllowedKeys(payload, ["status"]);

  const status = normalizeAppointmentStatus(payload.status, "status");
  if (!status.ok) issues.push(...status.issues);

  return issues.length > 0 || !status.ok
    ? failure(issues)
    : success({
        status: status.value,
      });
}

export function validateDiseaseSuggestionQuery(value: string | null) {
  const terms = normalizeRequiredString(value ?? "", "terms", { minLength: 2, maxLength: 100 });
  return terms.ok ? success({ terms: terms.value }) : terms;
}

function normalizePositiveNumber(value: unknown, field: string) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return failure([{ field, message: "Must be a number." }]);
  }

  if (value <= 0) {
    return failure([{ field, message: "Must be greater than zero." }]);
  }

  return success(value);
}

export function validateAuthLoginPayload(payload: Record<string, unknown>) {
  const issues: ValidationIssue[] = ensureAllowedKeys(payload, [
    "email",
    "password",
    "roleHint",
    "organizationId",
  ]);

  const email = normalizeEmail(payload.email, "email");
  if (!email.ok) issues.push(...email.issues);

  const password = normalizeRequiredString(payload.password, "password", {
    minLength: 8,
    maxLength: 128,
  });
  if (!password.ok) issues.push(...password.issues);

  let roleHint: AppRole | undefined;
  if ("roleHint" in payload && payload.roleHint !== undefined && payload.roleHint !== null) {
    const normalizedRoleHint = normalizeRole(payload.roleHint, "roleHint");
    if (!normalizedRoleHint.ok) {
      issues.push(...normalizedRoleHint.issues);
    } else {
      roleHint = normalizedRoleHint.value;
    }
  }

  const organizationId = normalizeOptionalString(payload.organizationId, "organizationId", {
    maxLength: 64,
    allowEmpty: false,
  });
  if (!organizationId.ok) issues.push(...organizationId.issues);

  if (issues.length > 0 || !email.ok || !password.ok || !organizationId.ok) {
    return failure(issues);
  }

  return success({
    email: email.value,
    password: password.value,
    roleHint,
    organizationId: organizationId.value ?? undefined,
  });
}

export function validateBackendTokenPairPayload(payload: unknown) {
  if (!isRecord(payload)) {
    return failure([{ field: "body", message: "Must be a JSON object." }]);
  }

  const issues: ValidationIssue[] = [];
  const accessToken = normalizeRequiredString(
    payload.accessToken ?? payload.access_token,
    "accessToken",
    {
      maxLength: 4096,
    }
  );
  if (!accessToken.ok) issues.push(...accessToken.issues);

  const refreshToken = normalizeRequiredString(
    payload.refreshToken ?? payload.refresh_token,
    "refreshToken",
    {
      maxLength: 4096,
    }
  );
  if (!refreshToken.ok) issues.push(...refreshToken.issues);

  let expiresIn: number | undefined;
  const expiresInValue = payload.expiresIn ?? payload.expires_in;
  if (expiresInValue !== undefined) {
    const normalizedExpiresIn = normalizePositiveNumber(expiresInValue, "expiresIn");
    if (!normalizedExpiresIn.ok) {
      issues.push(...normalizedExpiresIn.issues);
    } else {
      expiresIn = normalizedExpiresIn.value;
    }
  }

  if (issues.length > 0 || !accessToken.ok || !refreshToken.ok) {
    return failure(issues);
  }

  return success({
    accessToken: accessToken.value,
    refreshToken: refreshToken.value,
    expiresIn,
  });
}
