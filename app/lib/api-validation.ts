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

function normalizeDoctorWorkflowMode(
  value: unknown,
  field: string
): ValidationResult<"self_service" | "clinic_supported" | undefined> {
  if (value === undefined) {
    return success(undefined);
  }

  if (value !== "self_service" && value !== "clinic_supported") {
    return failure([
      {
        field,
        message: "Must be one of self_service, clinic_supported.",
      },
    ]);
  }

  return success(value);
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

function normalizePhone(value: unknown, field: string) {
  return normalizeOptionalString(value, field, { maxLength: 30, allowEmpty: false });
}

function normalizeSriLankanNic(value: unknown, field: string) {
  const normalized = normalizeOptionalString(value, field, {
    maxLength: 32,
    allowEmpty: false,
  });
  if (!normalized.ok) {
    return normalized;
  }

  if (normalized.value === undefined || normalized.value === null) {
    return normalized;
  }

  const nic = normalized.value.toUpperCase();
  if (!/^(?:\d{12}|\d{9}[VX])$/.test(nic)) {
    return failure([
      {
        field,
        message: "Must be a valid Sri Lankan NIC: 12 digits or 9 digits followed by V/X.",
      },
    ]);
  }

  return success(nic);
}

function normalizeBloodGroup(value: unknown, field: string) {
  const normalized = normalizeOptionalString(value, field, {
    maxLength: 4,
    allowEmpty: false,
  });
  if (!normalized.ok) {
    return normalized;
  }

  if (normalized.value === undefined || normalized.value === null) {
    return normalized;
  }

  const bloodGroup = normalized.value.toUpperCase();
  if (!["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].includes(bloodGroup)) {
    return failure([{ field, message: "Must be a valid blood group." }]);
  }

  return success(bloodGroup);
}

function normalizePatientAllergies(value: unknown, field: string) {
  if (value === undefined) {
    return success<
      | Array<{ allergyName: string; severity: "low" | "moderate" | "high"; isActive: boolean }>
      | undefined
    >(undefined);
  }

  if (!Array.isArray(value)) {
    return failure([{ field, message: "Must be an array of allergy objects." }]);
  }

  const issues: ValidationIssue[] = [];
  const normalized = value.flatMap((entry, index) => {
    if (!isRecord(entry)) {
      issues.push({ field: `${field}[${index}]`, message: "Must be an object." });
      return [];
    }

    const allergyName = normalizeRequiredString(entry.allergyName, `${field}[${index}].allergyName`, {
      maxLength: 120,
    });
    if (!allergyName.ok) {
      issues.push(...allergyName.issues);
    }

    const severityRaw = entry.severity;
    if (severityRaw !== "low" && severityRaw !== "moderate" && severityRaw !== "high") {
      issues.push({
        field: `${field}[${index}].severity`,
        message: "Must be one of low, moderate, high.",
      });
    }

    const isActiveRaw = entry.isActive;
    if (isActiveRaw !== undefined && typeof isActiveRaw !== "boolean") {
      issues.push({
        field: `${field}[${index}].isActive`,
        message: "Must be a boolean.",
      });
    }

    if (!allergyName.ok || (severityRaw !== "low" && severityRaw !== "moderate" && severityRaw !== "high")) {
      return [];
    }

    return [
      {
        allergyName: allergyName.value,
        severity: severityRaw,
        isActive: isActiveRaw === undefined ? true : isActiveRaw,
      } as const,
    ];
  });

  return issues.length > 0 ? failure(issues) : success(normalized);
}

export function validatePatientCreatePayload(payload: Record<string, unknown>) {
  const issues: ValidationIssue[] = ensureAllowedKeys(payload, [
    "firstName",
    "lastName",
    "dob",
    "phone",
    "address",
    "bloodGroup",
    "allergies",
    "priority",
    "nic",
    "gender",
    "familyId",
    "familyCode",
    "guardianPatientId",
    "guardianName",
    "guardianNic",
    "guardianPhone",
    "guardianRelationship",
  ]);

  const firstName = normalizeRequiredString(payload.firstName, "firstName", { maxLength: 80 });
  if (!firstName.ok) issues.push(...firstName.issues);

  const lastName = normalizeRequiredString(payload.lastName, "lastName", { maxLength: 80 });
  if (!lastName.ok) issues.push(...lastName.issues);

  const dob = normalizeOptionalIsoDate(payload.dob, "dob");
  if (!dob.ok) issues.push(...dob.issues);

  const phone = normalizePhone(payload.phone, "phone");
  if (!phone.ok) issues.push(...phone.issues);

  const address = normalizeOptionalString(payload.address, "address", { maxLength: 255, allowEmpty: false });
  if (!address.ok) issues.push(...address.issues);

  const bloodGroup = normalizeBloodGroup(payload.bloodGroup, "bloodGroup");
  if (!bloodGroup.ok) issues.push(...bloodGroup.issues);

  const allergies = normalizePatientAllergies(payload.allergies, "allergies");
  if (!allergies.ok) issues.push(...allergies.issues);

  const priority = normalizePatientPriority(payload.priority, "priority");
  if (!priority.ok) issues.push(...priority.issues);

  const nic = normalizeSriLankanNic(payload.nic, "nic");
  if (!nic.ok) issues.push(...nic.issues);

  const gender = normalizePatientGender(payload.gender, "gender");
  if (!gender.ok) issues.push(...gender.issues);

  const familyId = normalizeRequiredPositiveInteger(payload.familyId, "familyId");
  const familyIdOptional =
    payload.familyId === undefined ? success<number | undefined>(undefined) : familyId;
  if (!familyIdOptional.ok) issues.push(...familyIdOptional.issues);

  const familyCode = normalizeOptionalString(payload.familyCode, "familyCode", {
    maxLength: 60,
    allowEmpty: false,
  });
  if (!familyCode.ok) issues.push(...familyCode.issues);

  const guardianPatientId = normalizeRequiredPositiveInteger(
    payload.guardianPatientId,
    "guardianPatientId"
  );
  const guardianPatientIdOptional =
    payload.guardianPatientId === undefined
      ? success<number | undefined>(undefined)
      : guardianPatientId;
  if (!guardianPatientIdOptional.ok) issues.push(...guardianPatientIdOptional.issues);

  const guardianName = normalizeOptionalString(payload.guardianName, "guardianName", {
    maxLength: 120,
    allowEmpty: false,
  });
  if (!guardianName.ok) issues.push(...guardianName.issues);

  const guardianNic = normalizeSriLankanNic(payload.guardianNic, "guardianNic");
  if (!guardianNic.ok) issues.push(...guardianNic.issues);

  const guardianPhone = normalizePhone(payload.guardianPhone, "guardianPhone");
  if (!guardianPhone.ok) issues.push(...guardianPhone.issues);

  const guardianRelationship = normalizeOptionalString(
    payload.guardianRelationship,
    "guardianRelationship",
    { maxLength: 60, allowEmpty: false }
  );
  if (!guardianRelationship.ok) issues.push(...guardianRelationship.issues);

  const dobDate =
    dob.ok && dob.value ? new Date(`${dob.value}T00:00:00.000Z`) : null;
  const age =
    dobDate && !Number.isNaN(dobDate.getTime())
      ? Math.max(
          0,
          new Date().getUTCFullYear() -
            dobDate.getUTCFullYear() -
            (new Date().getUTCMonth() < dobDate.getUTCMonth() ||
            (new Date().getUTCMonth() === dobDate.getUTCMonth() &&
              new Date().getUTCDate() < dobDate.getUTCDate())
              ? 1
              : 0)
        )
      : null;
  const isMinor = age !== null && age < 18;

  if (!payload.dob) {
    issues.push({ field: "dob", message: "Is required." });
  }

  const guardianPatientIdPresent =
    guardianPatientIdOptional.ok && guardianPatientIdOptional.value !== undefined;
  const guardianNamePresent = guardianName.ok && Boolean(guardianName.value);
  const guardianNicPresent = guardianNic.ok && Boolean(guardianNic.value);
  const guardianPhonePresent = guardianPhone.ok && Boolean(guardianPhone.value);

  if (isMinor && !guardianPatientIdPresent && !guardianNamePresent) {
    issues.push({
      field: "guardian",
      message: "Children without their own NIC need an existing guardian link or guardian name.",
    });
  }

  if (isMinor && !guardianPatientIdPresent && !guardianNicPresent && !guardianPhonePresent) {
    issues.push({
      field: "guardian",
      message: "Guardian NIC or guardian phone is required for child registration.",
    });
  }

  if (
    issues.length > 0 ||
    !firstName.ok ||
    !lastName.ok ||
    !dob.ok ||
    !phone.ok ||
    !address.ok ||
    !bloodGroup.ok ||
    !allergies.ok ||
    !priority.ok ||
    !nic.ok ||
    !gender.ok ||
    !familyIdOptional.ok ||
    !familyCode.ok ||
    !guardianPatientIdOptional.ok ||
    !guardianName.ok ||
    !guardianNic.ok ||
    !guardianPhone.ok ||
    !guardianRelationship.ok
  ) {
    return failure(issues);
  }

  const guardianPatientIdValue = guardianPatientIdOptional.value;
  const familyCodeValue = familyCode.value;
  const guardianNameValue = guardianName.value;
  const guardianNicValue = guardianNic.value;
  const guardianPhoneValue = guardianPhone.value;
  const guardianRelationshipValue = guardianRelationship.value;
  const familyIdValue = familyIdOptional.value;

  return success({
    firstName: firstName.value,
    lastName: lastName.value,
    dob: dob.value ?? null,
    phone: phone.value ?? null,
    address: address.value ?? null,
    ...(bloodGroup.value ? { bloodGroup: bloodGroup.value } : {}),
    ...(allergies.value && allergies.value.length > 0 ? { allergies: allergies.value } : {}),
    ...(priority.value ? { priority: priority.value } : {}),
    nic: nic.value ?? null,
    gender: gender.value,
    ...(familyIdValue ? { familyId: familyIdValue } : {}),
    ...(familyCodeValue ? { familyCode: familyCodeValue } : {}),
    ...(guardianPatientIdValue
      ? { guardianPatientId: guardianPatientIdValue }
      : {}),
    ...(guardianNameValue ? { guardianName: guardianNameValue } : {}),
    ...(guardianNicValue ? { guardianNic: guardianNicValue } : {}),
    ...(guardianPhoneValue ? { guardianPhone: guardianPhoneValue } : {}),
    ...(guardianRelationshipValue
      ? { guardianRelationship: guardianRelationshipValue }
      : {}),
  });
}

export function validatePatientUpdatePayload(payload: Record<string, unknown>) {
  const issues: ValidationIssue[] = ensureAllowedKeys(payload, [
    "firstName",
    "lastName",
    "dob",
    "phone",
    "address",
    "bloodGroup",
    "nic",
    "gender",
    "familyId",
    "familyCode",
    "guardianPatientId",
    "guardianName",
    "guardianNic",
    "guardianPhone",
    "guardianRelationship",
  ]);

  if (Object.keys(payload).length === 0) {
    issues.push({ field: "body", message: "At least one updatable field is required." });
  }

  const result: {
    firstName?: string;
    lastName?: string;
    dob?: string | null;
    phone?: string | null;
    address?: string | null;
    bloodGroup?: string | null;
    nic?: string | null;
    gender?: "male" | "female" | "other";
    familyId?: number | null;
    familyCode?: string | null;
    guardianPatientId?: number | null;
    guardianName?: string | null;
    guardianNic?: string | null;
    guardianPhone?: string | null;
    guardianRelationship?: string | null;
  } = {};

  if ("firstName" in payload) {
    const firstName = normalizeRequiredString(payload.firstName, "firstName", { maxLength: 80 });
    if (!firstName.ok) {
      issues.push(...firstName.issues);
    } else {
      result.firstName = firstName.value;
    }
  }

  if ("lastName" in payload) {
    const lastName = normalizeRequiredString(payload.lastName, "lastName", { maxLength: 80 });
    if (!lastName.ok) {
      issues.push(...lastName.issues);
    } else {
      result.lastName = lastName.value;
    }
  }

  if ("dob" in payload) {
    const dob = normalizeOptionalIsoDate(payload.dob, "dob");
    if (!dob.ok) {
      issues.push(...dob.issues);
    } else {
      result.dob = dob.value ?? null;
    }
  }

  if ("phone" in payload) {
    const phone = normalizePhone(payload.phone, "phone");
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

  if ("bloodGroup" in payload) {
    const bloodGroup = normalizeBloodGroup(payload.bloodGroup, "bloodGroup");
    if (!bloodGroup.ok) {
      issues.push(...bloodGroup.issues);
    } else {
      result.bloodGroup = bloodGroup.value ?? null;
    }
  }

  if ("nic" in payload) {
    const nic = normalizeSriLankanNic(payload.nic, "nic");
    if (!nic.ok) {
      issues.push(...nic.issues);
    } else {
      result.nic = nic.value ?? null;
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

  if ("familyId" in payload) {
    const familyId = payload.familyId === null
      ? success<number | null>(null)
      : normalizeRequiredPositiveInteger(payload.familyId, "familyId");
    if (!familyId.ok) {
      issues.push(...familyId.issues);
    } else {
      result.familyId = familyId.value;
    }
  }

  if ("familyCode" in payload) {
    const familyCode = normalizeOptionalString(payload.familyCode, "familyCode", {
      maxLength: 60,
      allowEmpty: false,
    });
    if (!familyCode.ok) {
      issues.push(...familyCode.issues);
    } else {
      result.familyCode = familyCode.value ?? null;
    }
  }

  if ("guardianPatientId" in payload) {
    const guardianPatientId = payload.guardianPatientId === null
      ? success<number | null>(null)
      : normalizeRequiredPositiveInteger(payload.guardianPatientId, "guardianPatientId");
    if (!guardianPatientId.ok) {
      issues.push(...guardianPatientId.issues);
    } else {
      result.guardianPatientId = guardianPatientId.value;
    }
  }

  if ("guardianName" in payload) {
    const guardianName = normalizeOptionalString(payload.guardianName, "guardianName", {
      maxLength: 120,
      allowEmpty: false,
    });
    if (!guardianName.ok) {
      issues.push(...guardianName.issues);
    } else {
      result.guardianName = guardianName.value ?? null;
    }
  }

  if ("guardianNic" in payload) {
    const guardianNic = normalizeSriLankanNic(payload.guardianNic, "guardianNic");
    if (!guardianNic.ok) {
      issues.push(...guardianNic.issues);
    } else {
      result.guardianNic = guardianNic.value ?? null;
    }
  }

  if ("guardianPhone" in payload) {
    const guardianPhone = normalizePhone(payload.guardianPhone, "guardianPhone");
    if (!guardianPhone.ok) {
      issues.push(...guardianPhone.issues);
    } else {
      result.guardianPhone = guardianPhone.value ?? null;
    }
  }

  if ("guardianRelationship" in payload) {
    const guardianRelationship = normalizeOptionalString(
      payload.guardianRelationship,
      "guardianRelationship",
      { maxLength: 60, allowEmpty: false }
    );
    if (!guardianRelationship.ok) {
      issues.push(...guardianRelationship.issues);
    } else {
      result.guardianRelationship = guardianRelationship.value ?? null;
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
    "doctorWorkflowMode",
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

  const doctorWorkflowMode = normalizeDoctorWorkflowMode(
    payload.doctorWorkflowMode,
    "doctorWorkflowMode"
  );
  if (!doctorWorkflowMode.ok) issues.push(...doctorWorkflowMode.issues);

  const extraPermissions = normalizePermissionList(payload.extraPermissions, "extraPermissions");
  if (!extraPermissions.ok) issues.push(...extraPermissions.issues);

  if (role.ok && extraPermissions.ok && role.value !== "doctor" && extraPermissions.value?.length) {
    issues.push({
      field: "extraPermissions",
      message: "Only doctor users can receive extra permissions.",
    });
  }

  if (
    role.ok &&
    doctorWorkflowMode.ok &&
    role.value !== "doctor" &&
    doctorWorkflowMode.value !== undefined
  ) {
    issues.push({
      field: "doctorWorkflowMode",
      message: "Only doctor users can set doctor workflow mode.",
    });
  }

  if (
    issues.length > 0 ||
    !name.ok ||
    !email.ok ||
    !password.ok ||
    !role.ok ||
    !doctorWorkflowMode.ok ||
    !extraPermissions.ok
  ) {
    return failure(issues);
  }

  return success({
    name: name.value,
    email: email.value,
    password: password.value,
    role: role.value,
    ...(doctorWorkflowMode.value ? { doctorWorkflowMode: doctorWorkflowMode.value } : {}),
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

export function validateVisitStartPayload(payload: Record<string, unknown>) {
  const issues: ValidationIssue[] = ensureAllowedKeys(payload, [
    "patientId",
    "reason",
    "priority",
  ]);

  const patientId = normalizeRequiredPositiveInteger(payload.patientId, "patientId");
  if (!patientId.ok) issues.push(...patientId.issues);

  const reason = normalizeRequiredString(payload.reason, "reason", { maxLength: 255 });
  if (!reason.ok) issues.push(...reason.issues);

  const priority = normalizePatientPriority(payload.priority, "priority");
  if (!priority.ok) issues.push(...priority.issues);

  if (
    issues.length > 0 ||
    !patientId.ok ||
    !reason.ok ||
    !priority.ok ||
    priority.value === undefined
  ) {
    return failure(issues);
  }

  return success({
    patientId: patientId.value,
    reason: reason.value,
    priority: priority.value,
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
    "organizationSlug",
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

  const organizationSlug = normalizeOptionalString(payload.organizationSlug, "organizationSlug", {
    maxLength: 120,
    allowEmpty: false,
  });
  if (!organizationSlug.ok) issues.push(...organizationSlug.issues);

  if (issues.length > 0 || !email.ok || !password.ok || !organizationId.ok || !organizationSlug.ok) {
    return failure(issues);
  }

  return success({
    email: email.value,
    password: password.value,
    roleHint,
    organizationId: organizationId.value ?? undefined,
    organizationSlug: organizationSlug.value ?? undefined,
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
