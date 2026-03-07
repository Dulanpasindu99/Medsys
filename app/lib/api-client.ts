export type ApiClientError = {
  message: string;
  status: number;
};

export type AppRole = "owner" | "doctor" | "assistant";
export type AppointmentStatus = "waiting" | "in_consultation" | "completed" | "cancelled";

type TokenPair = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
};

const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";
const USER_ROLE_KEY = "userRole";
const USER_EMAIL_KEY = "userEmail";
const USER_NAME_KEY = "userName";

const DEFAULT_API_BASE = "/backend";
const DEFAULT_ORG_ID = "11111111-1111-1111-1111-111111111111";
const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  process.env.VITE_API_BASE_URL ??
  DEFAULT_API_BASE
).replace(/\/+$/, "");

const ORGANIZATION_ID =
  process.env.NEXT_PUBLIC_ORGANIZATION_ID ?? DEFAULT_ORG_ID;

function inBrowser() {
  return typeof window !== "undefined";
}

function getStoredAccessToken() {
  if (!inBrowser()) return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

function getStoredRefreshToken() {
  if (!inBrowser()) return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

function setStoredAuth(tokens: TokenPair) {
  if (!inBrowser()) return;
  localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
}

export function clearStoredAuth() {
  if (!inBrowser()) return;
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_ROLE_KEY);
  localStorage.removeItem(USER_EMAIL_KEY);
  localStorage.removeItem(USER_NAME_KEY);
}

function base64UrlDecode(input: string) {
  if (!inBrowser()) return "";
  const padded = input.replace(/-/g, "+").replace(/_/g, "/");
  const normalized = padded + "=".repeat((4 - (padded.length % 4)) % 4);
  return atob(normalized);
}

function parseJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const [, payload] = token.split(".");
    if (!payload) return null;
    const json = base64UrlDecode(payload);
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function normalizeRole(value: unknown): AppRole | null {
  if (typeof value !== "string") return null;
  const role = value.toLowerCase();
  if (role === "owner" || role === "doctor" || role === "assistant") {
    return role;
  }
  return null;
}

function getRoleFromToken(accessToken: string): AppRole | null {
  const payload = parseJwtPayload(accessToken);
  if (!payload) return null;
  return (
    normalizeRole(payload.role) ??
    normalizeRole(payload.userRole) ??
    normalizeRole(payload["https://medsys.app/role"])
  );
}

function getIdentityFromToken(accessToken: string) {
  const payload = parseJwtPayload(accessToken);
  if (!payload) return { email: null, name: null };

  const email =
    typeof payload.email === "string"
      ? payload.email
      : typeof payload.sub === "string" && payload.sub.includes("@")
      ? payload.sub
      : null;

  const name =
    typeof payload.name === "string"
      ? payload.name
      : typeof payload.preferred_username === "string"
      ? payload.preferred_username
      : null;

  return { email, name };
}

function getNumericClaim(payload: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = payload[key];
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === "string" && value.trim() && !Number.isNaN(Number(value))) {
      return Number(value);
    }
  }
  return null;
}

function getUserIdFromToken(accessToken: string) {
  const payload = parseJwtPayload(accessToken);
  if (!payload) return null;
  return getNumericClaim(payload, ["userId", "user_id", "id", "sub"]);
}

function buildUrl(path: string) {
  if (/^https?:\/\//i.test(path)) return path;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}

async function parseErrorMessage(response: Response) {
  try {
    const payload = (await response.json()) as { message?: string; error?: string };
    return payload.message ?? payload.error ?? `Request failed with status ${response.status}.`;
  } catch {
    return `Request failed with status ${response.status}.`;
  }
}

async function refreshAccessToken() {
  const refreshToken = getStoredRefreshToken();
  if (!refreshToken) {
    throw { message: "Unauthorized", status: 401 } satisfies ApiClientError;
  }

  const response = await fetch(buildUrl("/v1/auth/refresh"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });

  if (!response.ok) {
    clearStoredAuth();
    const message = await parseErrorMessage(response);
    throw { message, status: response.status } satisfies ApiClientError;
  }

  const payload = (await response.json()) as TokenPair;
  setStoredAuth(payload);
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
  retry = true
): Promise<T> {
  const headers = new Headers(init.headers ?? {});
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (!headers.has("x-request-id")) {
    headers.set("x-request-id", crypto.randomUUID());
  }

  const accessToken = getStoredAccessToken();
  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  const response = await fetch(buildUrl(path), {
    ...init,
    headers,
  });

  if (response.status === 401 && retry && !path.startsWith("/v1/auth/")) {
    await refreshAccessToken();
    return apiFetch<T>(path, init, false);
  }

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
  role: AppRole;
  email: string;
  name: string;
};

export async function loginUser(email: string, password: string, roleHint?: AppRole) {
  const payload = await apiFetch<TokenPair>("/v1/auth/login", {
    method: "POST",
    body: JSON.stringify({
      email,
      password,
      organizationId: ORGANIZATION_ID,
    }),
  });

  setStoredAuth(payload);

  const role = getRoleFromToken(payload.accessToken) ?? roleHint ?? "assistant";
  const identity = getIdentityFromToken(payload.accessToken);
  const resolvedEmail = identity.email ?? email;
  const resolvedName = identity.name ?? resolvedEmail.split("@")[0] ?? "User";

  if (inBrowser()) {
    localStorage.setItem(USER_ROLE_KEY, role);
    localStorage.setItem(USER_EMAIL_KEY, resolvedEmail);
    localStorage.setItem(USER_NAME_KEY, resolvedName);
  }

  return {
    role,
    email: resolvedEmail,
    name: resolvedName,
  } satisfies LoginResponse;
}

export async function logoutUser() {
  clearStoredAuth();
  return { success: true as const };
}

export async function getCurrentUser() {
  if (!inBrowser()) {
    return null;
  }

  const accessToken = getStoredAccessToken();
  if (!accessToken) {
    return null;
  }

  const roleFromToken = getRoleFromToken(accessToken);
  const identity = getIdentityFromToken(accessToken);
  const userId = getUserIdFromToken(accessToken);

  const role =
    roleFromToken ?? normalizeRole(localStorage.getItem(USER_ROLE_KEY)) ?? null;
  if (!role) {
    return null;
  }

  return {
    id: userId,
    role,
    email: identity.email ?? localStorage.getItem(USER_EMAIL_KEY) ?? "",
    name: identity.name ?? localStorage.getItem(USER_NAME_KEY) ?? "User",
  };
}

export async function getAuthStatus() {
  try {
    await apiFetch<{ status?: string }>("/healthz", { method: "GET" }, false);
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
