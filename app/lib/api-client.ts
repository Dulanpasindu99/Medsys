import type { AppRole } from "./roles";

export type ApiClientError = {
  message: string;
  status: number;
};
export type AppointmentStatus = "waiting" | "in_consultation" | "completed" | "cancelled";

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

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const url = /^https?:\/\//i.test(path)
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

    const payload = (await response.json()) as {
      id: number | null;
      role: AppRole;
      email: string;
      name: string;
    };
    return payload;
  } catch (error) {
    if ((error as ApiClientError)?.status === 401) {
      return null;
    }
    return null;
  }
}

export async function getAuthStatus() {
  try {
    await apiFetch<{ status?: string }>("/healthz", { method: "GET" });
    return { bootstrapping: false, users: 1 };
  } catch {
    return { bootstrapping: false, users: 0 };
  }
}

export async function registerUser() {
  throw {
    message: "Registration is not exposed in the backend auth contract.",
    status: 501,
  } satisfies ApiClientError;
}

export async function listPatients() {
  return apiFetch("/v1/patients", { method: "GET" });
}

export async function listFamilies() {
  return apiFetch("/v1/families", { method: "GET" });
}

export async function createPatient(input: {
  name: string;
  nic: string;
  age: number;
  gender: "male" | "female" | "other";
  mobile?: string;
  priority?: "low" | "normal" | "high" | "critical";
}) {
  return apiFetch("/v1/patients", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function getPatientById(patientId: number | string) {
  return apiFetch(`/v1/patients/${patientId}`, { method: "GET" });
}

export async function getPatientProfile(patientId: number | string) {
  return apiFetch(`/v1/patients/${patientId}/profile`, { method: "GET" });
}

export async function getPatientFamily(patientId: number | string) {
  return apiFetch(`/v1/patients/${patientId}/family`, { method: "GET" });
}

export async function listPatientVitals(patientId: number | string) {
  return apiFetch(`/v1/patients/${patientId}/vitals`, { method: "GET" });
}

export async function listPatientAllergies(patientId: number | string) {
  return apiFetch(`/v1/patients/${patientId}/allergies`, { method: "GET" });
}

export async function listPatientConditions(patientId: number | string) {
  return apiFetch(`/v1/patients/${patientId}/conditions`, { method: "GET" });
}

export async function listPatientTimeline(patientId: number | string) {
  return apiFetch(`/v1/patients/${patientId}/timeline`, { method: "GET" });
}

export async function listAppointments(input?: { status?: AppointmentStatus }) {
  const query = input?.status ? `?status=${encodeURIComponent(input.status)}` : "";
  return apiFetch(`/v1/appointments${query}`, { method: "GET" });
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
  return apiFetch("/v1/appointments", {
    method: "POST",
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
  return apiFetch("/v1/encounters", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function listEncounters() {
  return apiFetch("/v1/encounters", { method: "GET" });
}

export async function listPendingDispenseQueue() {
  return apiFetch("/v1/prescriptions/queue/pending-dispense", { method: "GET" });
}

export async function getPrescriptionById(prescriptionId: number | string) {
  return apiFetch(`/v1/prescriptions/${prescriptionId}`, { method: "GET" });
}

export async function getAnalyticsOverview() {
  return apiFetch("/v1/analytics/overview", { method: "GET" });
}

export async function listInventory() {
  return apiFetch("/v1/inventory", { method: "GET" });
}

export async function createInventoryItem(input: {
  name: string;
  category: "medicine" | "consumable" | "equipment" | "other";
  quantity: number;
  unit?: string;
}) {
  return apiFetch("/v1/inventory", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateInventoryItem(
  inventoryId: number | string,
  input: Record<string, unknown>
) {
  return apiFetch(`/v1/inventory/${inventoryId}`, {
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
  return apiFetch(`/v1/inventory/${inventoryId}/movements`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function listInventoryMovements(inventoryId: number | string) {
  return apiFetch(`/v1/inventory/${inventoryId}/movements`, { method: "GET" });
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
  return apiFetch(`/v1/audit/logs${query}`, { method: "GET" });
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
  return apiFetch(`/v1/prescriptions/${prescriptionId}/dispense`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}
