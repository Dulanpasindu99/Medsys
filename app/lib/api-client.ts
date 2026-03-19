import type { AppRole } from "./roles";
import type { AppPermission } from "./authorization";

export type ApiClientError = {
  message: string;
  status: number;
};
type ApiContractError = ApiClientError;
export type AppointmentStatus = "waiting" | "in_consultation" | "completed" | "cancelled";
export type ApiRecord = Record<string, unknown>;

const DEFAULT_API_BASE = "/api/backend";
const DEFAULT_ORG_ID = "11111111-1111-1111-1111-111111111111";
const API_BASE_URL = DEFAULT_API_BASE;

const ORGANIZATION_ID =
  process.env.NEXT_PUBLIC_ORGANIZATION_ID ?? DEFAULT_ORG_ID;

export function clearStoredAuth() {
  // Legacy no-op kept for compatibility with existing callers.
}

async function parseErrorMessage(response: Response) {
  try {
    const payload = (await response.json()) as { message?: string; error?: string };
    return payload.message ?? payload.error ?? `Request failed with status ${response.status}.`;
  } catch {
    return `Request failed with status ${response.status}.`;
  }
}

function toApiClientError(error: unknown): ApiClientError {
  const contractError = error as ApiContractError;
  if (typeof contractError?.message === "string" && typeof contractError?.status === "number") {
    return contractError;
  }

  return {
    message: "An unexpected API client error occurred.",
    status: 500,
  };
}

function isApiRecord(value: unknown): value is ApiRecord {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function contractMismatch(message: string): ApiClientError {
  return {
    message: `Backend contract mismatch: ${message}`,
    status: 502,
  };
}

function expectApiRecord(value: unknown, label: string): ApiRecord {
  if (!isApiRecord(value)) {
    throw contractMismatch(`${label} response is not an object.`);
  }
  return value;
}

function expectApiRecordArray(value: unknown, label: string): ApiRecord[] {
  if (!Array.isArray(value)) {
    throw contractMismatch(`${label} response is not an array.`);
  }

  return value.map((entry, index) => {
    if (!isApiRecord(entry)) {
      throw contractMismatch(`${label} response entry ${index + 1} is not an object.`);
    }
    return entry;
  });
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const url = /^https?:\/\//i.test(path)
    ? path
    : path.startsWith("/api/")
    ? path
    : `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
  const headers = new Headers(init.headers ?? {});
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (!headers.has("x-request-id")) {
    headers.set("x-request-id", crypto.randomUUID());
  }

  const response = await fetch(url, {
    ...init,
    headers,
    credentials: "same-origin",
  });

  if (!response.ok) {
    const message = await parseErrorMessage(response);
    throw { message, status: response.status } satisfies ApiClientError;
  }

  if (response.status === 204) {
    return null as T;
  }

  return (await response.json()) as T;
}

export type LoginResponse = {
  id: number | null;
  role: AppRole;
  email: string;
  name: string;
  permissions?: AppPermission[];
};

export type FrontendUser = {
  id: number;
  name: string;
  email: string;
  role: AppRole;
  created_at?: string | null;
  permissions?: AppPermission[];
  extraPermissions?: AppPermission[];
};

export type PatientWriteInput = {
  firstName: string;
  lastName: string;
  dob: string;
  gender: "male" | "female" | "other";
  nic?: string | null;
  phone?: string | null;
  address?: string | null;
  familyId?: number;
  familyCode?: string | null;
  guardianPatientId?: number;
  guardianName?: string | null;
  guardianNic?: string | null;
  guardianPhone?: string | null;
  guardianRelationship?: string | null;
};

export async function loginUser(email: string, password: string, roleHint?: AppRole) {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, roleHint, organizationId: ORGANIZATION_ID }),
  });

  if (!response.ok) {
    const message = await parseErrorMessage(response);
    throw { message, status: response.status } satisfies ApiClientError;
  }

  return (await response.json()) as LoginResponse;
}

export async function logoutUser() {
  try {
    await fetch("/api/auth/logout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    // Best effort cookie cleanup; local token cleanup still runs below.
  }
  clearStoredAuth();
  return { success: true as const };
}

export async function getCurrentUser() {
  try {
    const response = await fetch("/api/auth/me", {
      method: "GET",
      cache: "no-store",
    });

    if (response.status === 401) {
      return null;
    }

    if (!response.ok) {
      const message = await parseErrorMessage(response);
      throw { message, status: response.status } satisfies ApiClientError;
    }

    return (await response.json()) as LoginResponse;
  } catch (error) {
    if ((error as ApiClientError)?.status === 401) {
      return null;
    }
    throw toApiClientError(error);
  }
}

export async function getAuthStatus() {
  try {
    return await apiFetch<{ bootstrapping: boolean; users: number }>("/api/auth/status", {
      method: "GET",
    });
  } catch {
    return { bootstrapping: false, users: 0 };
  }
}

export async function registerUser(input: {
  name: string;
  email: string;
  password: string;
  role: AppRole;
  extraPermissions?: AppPermission[];
}) {
  const response = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const message = await parseErrorMessage(response);
    throw { message, status: response.status } satisfies ApiClientError;
  }

  const payload = (await response.json()) as {
    user: FrontendUser;
  };

  return payload.user;
}

export async function listUsers(input?: { role?: AppRole }) {
  const query = input?.role ? `?role=${encodeURIComponent(input.role)}` : "";
  const response = await apiFetch<{ users: Array<Record<string, unknown>> }>(`/api/users${query}`, {
    method: "GET",
  });
  return expectApiRecordArray(response.users, "users");
}

export async function createUser(input: {
  name: string;
  email: string;
  password: string;
  role: Extract<AppRole, "doctor" | "assistant">;
  extraPermissions?: AppPermission[];
}) {
  const response = await apiFetch<{
    user: FrontendUser;
  }>("/api/users", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return response.user;
}

export async function updateUserExtraPermissions(
  userId: number | string,
  input: { extraPermissions: AppPermission[] }
) {
  const response = await apiFetch<{ user: FrontendUser }>(`/api/users/${userId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
  return response.user;
}

export async function listPatients() {
  const response = await apiFetch<{ patients: unknown[] }>("/api/patients", { method: "GET" });
  return expectApiRecordArray(response.patients, "patients");
}

export async function listFamilies() {
  const response = await apiFetch<unknown>("/api/families", { method: "GET" });
  return expectApiRecordArray(response, "families");
}

export async function createPatient(input: PatientWriteInput) {
  const response = await apiFetch<{ patient: unknown }>("/api/patients", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return response.patient;
}

export async function getPatientById(patientId: number | string) {
  return apiFetch(`/api/patients/${patientId}`, { method: "GET" });
}

export async function getPatientProfile(patientId: number | string) {
  const response = await apiFetch<unknown>(`/api/patients/${patientId}/profile`, { method: "GET" });
  return expectApiRecord(response, "patient profile");
}

export async function getPatientFamily(patientId: number | string) {
  const response = await apiFetch<unknown>(`/api/patients/${patientId}/family`, { method: "GET" });
  return expectApiRecord(response, "patient family");
}

export async function listPatientVitals(patientId: number | string) {
  const response = await apiFetch<unknown>(`/api/patients/${patientId}/vitals`, { method: "GET" });
  return expectApiRecordArray(response, "patient vitals");
}

export async function createPatientVital(
  patientId: number | string,
  input: { name: string; value: string }
) {
  const response = await apiFetch<unknown>(`/api/backend/v1/patients/${patientId}/vitals`, {
    method: "POST",
    body: JSON.stringify(input),
  });
  return isApiRecord(response) ? response : { success: true };
}

export async function listPatientAllergies(patientId: number | string) {
  const response = await apiFetch<unknown>(`/api/patients/${patientId}/allergies`, { method: "GET" });
  return expectApiRecordArray(response, "patient allergies");
}

export async function createPatientAllergy(
  patientId: number | string,
  input: { name: string; severity: "low" | "medium" | "high" }
) {
  const response = await apiFetch<unknown>(`/api/backend/v1/patients/${patientId}/allergies`, {
    method: "POST",
    body: JSON.stringify(input),
  });
  return isApiRecord(response) ? response : { success: true };
}

export async function listPatientConditions(patientId: number | string) {
  const response = await apiFetch<unknown>(`/api/patients/${patientId}/conditions`, { method: "GET" });
  return expectApiRecordArray(response, "patient conditions");
}

export async function listPatientTimeline(patientId: number | string) {
  const response = await apiFetch<unknown>(`/api/patients/${patientId}/timeline`, { method: "GET" });
  return expectApiRecordArray(response, "patient timeline");
}

export async function listAppointments(input?: { status?: AppointmentStatus }) {
  const query = input?.status ? `?status=${encodeURIComponent(input.status)}` : "";
  const response = await apiFetch<unknown>(`/api/appointments${query}`, { method: "GET" });
  return expectApiRecordArray(response, "appointments");
}

export async function createAppointment(input: {
  patientId: number;
  doctorId: number;
  assistantId: number;
  scheduledAt: string;
  status: AppointmentStatus;
  reason: string;
  priority: "low" | "normal" | "high" | "critical";
}) {
  return apiFetch("/api/appointments", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateAppointment(
  appointmentId: number | string,
  input: {
    status: AppointmentStatus;
  }
) {
  return apiFetch(`/api/appointments/${appointmentId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function createEncounter(input: {
  appointmentId: number;
  patientId: number;
  doctorId: number;
  checkedAt: string;
  notes: string;
  nextVisitDate: string;
  diagnoses: Array<{ diagnosisName: string; icd10Code: string }>;
  tests: Array<{ testName: string; status: "ordered" | "in_progress" | "completed" | "cancelled" }>;
  prescription: {
    items: Array<{
      drugName: string;
      dose: string;
      frequency: string;
      duration: string;
      quantity: number;
      source: "clinical" | "outside";
    }>;
  };
}) {
  return apiFetch("/api/encounters", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function listEncounters() {
  const response = await apiFetch<unknown>("/api/encounters", { method: "GET" });
  return expectApiRecordArray(response, "encounters");
}

export async function listPendingDispenseQueue() {
  const response = await apiFetch<unknown>("/api/prescriptions/queue/pending-dispense", { method: "GET" });
  return expectApiRecordArray(response, "pending dispense queue");
}

export async function getPrescriptionById(prescriptionId: number | string) {
  const response = await apiFetch<unknown>(`/api/prescriptions/${prescriptionId}`, { method: "GET" });
  return expectApiRecord(response, "prescription detail");
}

export async function getAnalyticsOverview() {
  const response = await apiFetch<unknown>("/api/analytics/overview", { method: "GET" });
  return expectApiRecord(response, "analytics overview");
}

export async function listInventory() {
  const response = await apiFetch<unknown>("/api/inventory", { method: "GET" });
  return expectApiRecordArray(response, "inventory");
}

export async function createInventoryItem(input: {
  name: string;
  category: "medicine" | "consumable" | "equipment" | "other";
  quantity: number;
  unit?: string;
}) {
  return apiFetch("/api/inventory", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateInventoryItem(
  inventoryId: number | string,
  input: Record<string, unknown>
) {
  return apiFetch(`/api/inventory/${inventoryId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function createInventoryMovement(
  inventoryId: number | string,
  input: {
    type: "in" | "out" | "adjustment";
    quantity: number;
    note?: string;
  }
) {
  return apiFetch(`/api/inventory/${inventoryId}/movements`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function listInventoryMovements(inventoryId: number | string) {
  const response = await apiFetch<unknown>(`/api/inventory/${inventoryId}/movements`, { method: "GET" });
  return expectApiRecordArray(response, "inventory movements");
}

export async function listAuditLogs(input?: {
  entityType?: string;
  action?: string;
  from?: string;
  to?: string;
  limit?: number;
}) {
  const params = new URLSearchParams();
  if (input?.entityType) params.set("entityType", input.entityType);
  if (input?.action) params.set("action", input.action);
  if (input?.from) params.set("from", input.from);
  if (input?.to) params.set("to", input.to);
  if (typeof input?.limit === "number") params.set("limit", String(input.limit));
  const query = params.size ? `?${params.toString()}` : "";
  const response = await apiFetch<unknown>(`/api/audit/logs${query}`, { method: "GET" });
  return expectApiRecordArray(response, "audit logs");
}

export async function dispensePrescription(
  prescriptionId: number | string,
  input: {
    assistantId: number;
    dispensedAt: string;
    status: "completed" | "partially_completed" | "cancelled";
    notes: string;
    items: Array<{ inventoryItemId: number; quantity: number }>;
  }
) {
  return apiFetch(`/api/prescriptions/${prescriptionId}/dispense`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}
