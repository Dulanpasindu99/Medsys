import type { AppRole } from "./roles";
import type { AppPermission } from "./authorization";
import {
  isAnalyticsDashboardResponse,
  type AnalyticsDashboardQuery,
  type AnalyticsDashboardResponse,
} from "./analytics-types";

export type ApiClientError = {
  message: string;
  status: number;
  retryAfterSeconds?: number;
  code?: string;
  severity?: "warning" | "error";
  userMessage?: string;
  requestId?: string;
  issues?: Array<{ field?: string; message?: string }>;
  debugMessage?: string;
};
export type DoctorWorkflowMode = "self_service" | "clinic_supported" | null;
export type WorkflowProfileMode = DoctorWorkflowMode | "standard" | null;
export type WorkflowProfiles = {
  doctor?: { mode: DoctorWorkflowMode } | null;
  assistant?: { mode: WorkflowProfileMode } | null;
  owner?: { mode: WorkflowProfileMode } | null;
};
type ApiContractError = ApiClientError;
type ApiErrorIssue = { field?: string; message?: string };
type ParsedApiError = {
  message: string;
  status: number;
  retryAfterSeconds?: number;
  code?: string;
  severity?: "warning" | "error";
  userMessage?: string;
  requestId?: string;
  issues?: ApiErrorIssue[];
  debugMessage?: string;
};
export type AppointmentStatus = "waiting" | "in_consultation" | "completed" | "cancelled";
export type ApiRecord = Record<string, unknown>;
export type VisitStartPriority = "low" | "normal" | "high" | "critical";
export type ConsultationPriority = VisitStartPriority;
export type InventoryCategory = "medicine" | "consumable" | "equipment" | "other";
export type PrescriptionType = "clinical" | "outside" | "both";
export type StockStatus = "in_stock" | "low_stock" | "out_of_stock" | "near_expiry" | "expired";
export type InventoryMovementType = "in" | "out" | "adjustment";
export type InventoryItem = {
  id: number;
  organizationId?: string;
  sku: string | null;
  name: string;
  genericName: string | null;
  category: InventoryCategory;
  subcategory: string | null;
  description: string | null;
  dosageForm: string | null;
  strength: string | null;
  unit: string;
  route: string | null;
  prescriptionType: PrescriptionType | null;
  dispenseUnit: string | null;
  dispenseUnitSize: string | null;
  purchaseUnit: string | null;
  purchaseUnitSize: string | null;
  brandName: string | null;
  supplierName: string | null;
  leadTimeDays: number | null;
  stock: string;
  reorderLevel: string;
  minStockLevel: string | null;
  maxStockLevel: string | null;
  expiryDate: string | null;
  batchNo: string | null;
  storageLocation: string | null;
  directDispenseAllowed: boolean;
  isAntibiotic: boolean;
  isControlled: boolean;
  isPediatricSafe: boolean;
  requiresPrescription: boolean;
  clinicUseOnly: boolean;
  notes: string | null;
  stockStatus: StockStatus;
  stockSummary?: {
    currentStock?: string | null;
    minimumStock?: string | null;
    shortBy?: string | null;
    purchasePackEquivalent?: string | null;
    dispensePackEquivalent?: string | null;
  } | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
};
export type InventoryBatch = {
  id?: number | null;
  batchNo: string | null;
  quantity: string | number | null;
  expiryDate: string | null;
  supplierName?: string | null;
  storageLocation?: string | null;
  status?: string | null;
  daysUntilExpiry?: number | null;
  note?: string | null;
};
export type InventoryBatchCreatePayload = {
  batchNo: string;
  expiryDate?: string | null;
  quantity: number;
  supplierName?: string | null;
  storageLocation?: string | null;
  note?: string | null;
};
export type InventoryDetailResponse = {
  item?: InventoryItem | null;
  stockSummary?: Record<string, unknown> | null;
  movementSummary?: Record<string, unknown> | null;
  recentMovements?: unknown[];
  batchSummary?: Record<string, unknown> | null;
};
export type InventoryCreatePayload = {
  sku?: string | null;
  name: string;
  genericName?: string | null;
  category: InventoryCategory;
  subcategory?: string | null;
  description?: string | null;
  dosageForm?: string | null;
  strength?: string | null;
  unit: string;
  route?: string | null;
  prescriptionType?: PrescriptionType | null;
  dispenseUnit?: string | null;
  dispenseUnitSize?: number | null;
  purchaseUnit?: string | null;
  purchaseUnitSize?: number | null;
  brandName?: string | null;
  supplierName?: string | null;
  leadTimeDays?: number | null;
  stock?: number;
  reorderLevel?: number;
  minStockLevel?: number | null;
  maxStockLevel?: number | null;
  expiryDate?: string | null;
  batchNo?: string | null;
  storageLocation?: string | null;
  directDispenseAllowed?: boolean;
  isAntibiotic?: boolean;
  isControlled?: boolean;
  isPediatricSafe?: boolean;
  requiresPrescription?: boolean;
  clinicUseOnly?: boolean;
  notes?: string | null;
  isActive?: boolean;
};
export type InventoryUpdatePayload = Partial<InventoryCreatePayload>;
export type InventoryMovementPayload = {
  movementType?: InventoryMovementType;
  type?: InventoryMovementType;
  movementUnit?: string | null;
  quantity: number;
  reason?: "purchase" | "dispense" | "damage" | "expired" | "return" | "adjustment" | "manual" | null;
  note?: string | null;
  referenceType?: string | null;
  referenceId?: number | null;
};
export type InventoryAdjustStockPayload = {
  actualStock: number;
  note?: string | null;
};
export type InventoryAlertItem = {
  id: number;
  sku: string | null;
  name: string;
  genericName: string | null;
  category: InventoryCategory;
  subcategory: string | null;
  dosageForm: string | null;
  strength: string | null;
  unit: string;
  route: string | null;
  prescriptionType: PrescriptionType | null;
  dispenseUnit: string | null;
  dispenseUnitSize: string | null;
  purchaseUnit: string | null;
  purchaseUnitSize: string | null;
  brandName: string | null;
  supplierName: string | null;
  leadTimeDays: number;
  stock: number;
  reorderLevel: number;
  minStockLevel: string | null;
  maxStockLevel: string | null;
  expiryDate: string | null;
  batchNo: string | null;
  storageLocation: string | null;
  directDispenseAllowed: boolean;
  stockStatus: StockStatus;
  totalOutgoing: number;
  averageDailyUsage: number;
  projectedDaysRemaining: number | null;
  recommendedReorderQty: number;
  suggestedPurchasePacks?: string | null;
  suggestedDispensePacks?: string | null;
  lowStock: boolean;
  stockoutRisk: boolean;
  expiryRisk: boolean;
};
export type InventoryAlertsResponse = {
  generatedAt: string;
  rangeDays: number;
  summary: {
    totalItems: number;
    lowStockCount: number;
    stockoutRiskCount: number;
    nearExpiryCount: number;
    expiredCount: number;
    fastMovingCount: number;
  };
  alerts: InventoryAlertItem[];
  recommendations: InventoryAlertItem[];
};
export type InventoryReportsResponse = {
  generatedAt?: string;
  rangeDays?: number;
  supplierSummary?: unknown[];
  fastMoving?: unknown[];
  slowMoving?: unknown[];
  deadStock?: unknown[];
  expiringBatches?: unknown[];
};
export type ConsultationSavePayload = {
  workflowType: "appointment" | "walk_in";
  appointmentId?: number;
  patientId?: number;
  patientDraft?: {
    name: string;
    dateOfBirth: string;
    nic?: string;
    gender?: "male" | "female";
    phone?: string;
    familyId?: number;
    familyCode?: string;
    guardianPatientId?: number;
    guardianName?: string;
    guardianNic?: string;
    guardianPhone?: string;
    guardianRelationship?: string;
  };
  guardianDraft?: {
    name: string;
    dateOfBirth: string;
    nic?: string;
    gender?: "male" | "female";
    phone?: string;
  };
  checkedAt: string;
  reason?: string;
  priority?: ConsultationPriority;
  notes?: string;
  diagnoses: Array<{ diagnosisName: string; icd10Code: string; persistAsCondition?: boolean }>;
  tests?: Array<{ testName: string; status: "ordered" | "in_progress" | "completed" | "cancelled" }>;
  vitals?: {
    heartRate?: number;
    temperatureC?: number;
    spo2?: number;
    bpSystolic?: number;
    bpDiastolic?: number;
  };
  allergies?: Array<{
    allergyName: string;
    severity: "low" | "moderate" | "high";
    isActive: boolean;
  }>;
  clinicalSummary?: string;
  prescription?: {
    items: Array<{
      drugName: string;
      dose: string;
      frequency: string;
      duration: string;
      quantity: number;
      source: "clinical" | "outside";
    }>;
  };
  dispense?: {
    mode: "doctor_direct";
    dispensedAt: string;
    notes?: string;
    items: Array<{ inventoryItemId: number; quantity: number }>;
  };
};

const DEFAULT_API_BASE = "/api/backend";
const DEFAULT_ORG_ID = "11111111-1111-1111-1111-111111111111";
const API_BASE_URL = DEFAULT_API_BASE;

const ORGANIZATION_ID =
  process.env.NEXT_PUBLIC_ORGANIZATION_ID ?? DEFAULT_ORG_ID;

export function clearStoredAuth() {
  // Legacy no-op kept for compatibility with existing callers.
}

async function parseApiError(response: Response): Promise<ParsedApiError> {
  const fallbackMessage = `Request failed with status ${response.status}.`;

  try {
    const payload = (await response.json()) as {
      message?: string;
      error?: string;
      code?: string;
      severity?: "warning" | "error";
      userMessage?: string;
      requestId?: string;
      statusCode?: number;
      issues?: ApiErrorIssue[];
    };

    const userMessage = payload.userMessage?.trim() || undefined;
    const debugMessage = payload.message?.trim() || payload.error?.trim() || undefined;

    return {
      message: userMessage ?? debugMessage ?? fallbackMessage,
      status:
        typeof payload.statusCode === "number" && Number.isFinite(payload.statusCode)
          ? payload.statusCode
          : response.status,
      retryAfterSeconds: parseRetryAfterSeconds(response),
      code: payload.code?.trim() || undefined,
      severity: payload.severity,
      userMessage,
      requestId: payload.requestId?.trim() || undefined,
      issues: Array.isArray(payload.issues) ? payload.issues : undefined,
      debugMessage,
    };
  } catch {
    return {
      message: fallbackMessage,
      status: response.status,
      retryAfterSeconds: parseRetryAfterSeconds(response),
    };
  }
}

function parseRetryAfterSeconds(response: Response) {
  const raw = response.headers.get("Retry-After");
  if (!raw) {
    return undefined;
  }

  const asSeconds = Number(raw);
  if (Number.isFinite(asSeconds) && asSeconds >= 0) {
    return Math.ceil(asSeconds);
  }

  const retryDate = new Date(raw);
  if (Number.isNaN(retryDate.getTime())) {
    return undefined;
  }

  const seconds = Math.ceil((retryDate.getTime() - Date.now()) / 1000);
  return seconds > 0 ? seconds : undefined;
}

function toApiClientError(error: unknown): ApiClientError {
  const contractError = error as ApiContractError;
  if (typeof contractError?.message === "string" && typeof contractError?.status === "number") {
    return contractError;
  }

  return {
    message: "An unexpected API client error occurred.",
    status: 500,
    retryAfterSeconds: undefined,
    severity: "error",
  };
}

function hasUnknownBloodGroupFieldIssue(error: unknown) {
  const apiError = error as ApiClientError | undefined;
  if (apiError?.status !== 400 || !Array.isArray(apiError.issues)) {
    return false;
  }

  return apiError.issues.some(
    (issue) =>
      issue?.field === "bloodGroup" &&
      typeof issue.message === "string" &&
      issue.message.toLowerCase().includes("unknown field")
  );
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
    throw (await parseApiError(response)) satisfies ApiClientError;
  }

  if (response.status === 204) {
    return null as T;
  }

  return (await response.json()) as T;
}

export type LoginResponse = {
  id: number | null;
  user_id?: number | null;
  role: AppRole;
  roles?: AppRole[];
  active_role?: AppRole;
  email: string;
  name: string;
  permissions?: AppPermission[];
  extra_permissions?: AppPermission[];
  doctor_workflow_mode?: DoctorWorkflowMode;
  workflow_profiles?: WorkflowProfiles | null;
};

export type FrontendUser = {
  id: number;
  user_id?: number;
  name: string;
  email: string;
  role: AppRole;
  roles?: AppRole[];
  active_role?: AppRole;
  created_at?: string | null;
  permissions?: AppPermission[];
  extraPermissions?: AppPermission[];
  extra_permissions?: AppPermission[];
  doctor_workflow_mode?: DoctorWorkflowMode;
  workflow_profiles?: WorkflowProfiles | null;
};

export type PatientWriteInput = {
  firstName: string;
  lastName: string;
  dob: string;
  gender: "male" | "female" | "other";
  nic?: string | null;
  phone?: string | null;
  address?: string | null;
  bloodGroup?: string | null;
  allergies?: Array<{
    allergyName: string;
    severity: "low" | "moderate" | "high";
    isActive?: boolean;
  }>;
  priority?: "low" | "normal" | "high" | "critical";
  familyId?: number;
  familyCode?: string | null;
  guardianPatientId?: number;
  guardianName?: string | null;
  guardianNic?: string | null;
  guardianPhone?: string | null;
  guardianRelationship?: string | null;
};

export type PatientUpdateInput = {
  firstName?: string | null;
  lastName?: string | null;
  dob?: string | null;
  gender?: "male" | "female" | "other" | null;
  nic?: string | null;
  phone?: string | null;
  address?: string | null;
  bloodGroup?: string | null;
  familyId?: number | null;
  guardianPatientId?: number | null;
  guardianName?: string | null;
  guardianNic?: string | null;
  guardianPhone?: string | null;
  guardianRelationship?: string | null;
};

export type ListPatientsInput = {
  scope?: "my_patients" | "organization";
  doctorId?: number | string;
};

export async function loginUser(email: string, password: string, roleHint?: AppRole) {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, roleHint, organizationId: ORGANIZATION_ID }),
  });

  if (!response.ok) {
    throw (await parseApiError(response)) satisfies ApiClientError;
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

export async function setActiveRole(activeRole: AppRole) {
  const response = await fetch("/api/auth/active-role", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ activeRole }),
  });

  if (!response.ok) {
    throw (await parseApiError(response)) satisfies ApiClientError;
  }

  return (await response.json()) as LoginResponse;
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
      throw (await parseApiError(response)) satisfies ApiClientError;
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
    throw (await parseApiError(response)) satisfies ApiClientError;
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

export async function listPatients(input?: ListPatientsInput) {
  const params = new URLSearchParams();
  if (input?.scope) {
    params.set("scope", input.scope);
  }
  if (input?.doctorId !== undefined && input.doctorId !== null && String(input.doctorId).trim()) {
    params.set("doctorId", String(input.doctorId));
  }
  const query = params.size ? `?${params.toString()}` : "";
  const response = await apiFetch<{ patients: unknown[] }>(`/api/patients${query}`, { method: "GET" });
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

export async function updatePatient(
  patientId: number | string,
  input: PatientUpdateInput
) {
  try {
    const response = await apiFetch<{ patient: unknown }>(`/api/patients/${patientId}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    });
    return response.patient;
  } catch (error) {
    if (!hasUnknownBloodGroupFieldIssue(error) || !Object.prototype.hasOwnProperty.call(input, "bloodGroup")) {
      throw error;
    }

    const { bloodGroup: _bloodGroup, ...fallbackInput } = input;
    const response = await apiFetch<{ patient: unknown }>(`/api/patients/${patientId}`, {
      method: "PATCH",
      body: JSON.stringify(fallbackInput),
    });
    return response.patient;
  }
}

export async function getPatientProfile(patientId: number | string) {
  const response = await apiFetch<unknown>(`/api/patients/${patientId}/profile`, { method: "GET" });
  return expectApiRecord(response, "patient profile");
}

export async function getPatientConsultations(patientId: number | string) {
  const response = await apiFetch<unknown>(`/api/patients/${patientId}/consultations`, { method: "GET" });
  return expectApiRecord(response, "patient consultations");
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
  input: {
    encounterId?: number | null;
    bpSystolic?: number | null;
    bpDiastolic?: number | null;
    heartRate?: number | null;
    temperatureC?: number | null;
    spo2?: number | null;
    recordedAt: string;
  }
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
  input: { allergyName: string; severity: "low" | "moderate" | "high" }
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

export async function startVisit(input: {
  patientId: number;
  reason: string;
  priority: VisitStartPriority;
}) {
  const response = await apiFetch<{
    reused?: boolean;
    visit?: unknown;
  }>("/api/visits/start", {
    method: "POST",
    body: JSON.stringify(input),
  });

  return {
    reused: Boolean(response.reused),
    visit: expectApiRecord(response.visit, "visit start"),
  };
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

export async function saveConsultation(input: ConsultationSavePayload) {
  return apiFetch<ApiRecord>("/api/consultations/save", {
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

export async function getAnalyticsDashboard(
  input: AnalyticsDashboardQuery = {}
): Promise<AnalyticsDashboardResponse> {
  const params = new URLSearchParams();
  if (input.range) params.set("range", input.range);
  if (input.role) params.set("role", input.role);
  if (typeof input.doctorId === "number") params.set("doctorId", String(input.doctorId));
  if (typeof input.assistantId === "number") params.set("assistantId", String(input.assistantId));
  if (input.dateFrom) params.set("dateFrom", input.dateFrom);
  if (input.dateTo) params.set("dateTo", input.dateTo);
  const query = params.size ? `?${params.toString()}` : "";
  const response = await apiFetch<unknown>(`/api/analytics/dashboard${query}`, { method: "GET" });
  if (!isAnalyticsDashboardResponse(response)) {
    throw contractMismatch("analytics dashboard response is not an object.");
  }
  return response;
}

export async function listInventory() {
  const response = await apiFetch<unknown>("/api/inventory", { method: "GET" });
  return expectApiRecordArray(response, "inventory");
}

export async function getInventoryItem(inventoryId: number | string) {
  return apiFetch<InventoryDetailResponse>(`/api/inventory/${inventoryId}`, { method: "GET" });
}

export async function listInventoryAlerts(input?: { days?: number }) {
  const params = new URLSearchParams();
  if (typeof input?.days === "number") params.set("days", String(input.days));
  const query = params.size ? `?${params.toString()}` : "";
  return apiFetch<InventoryAlertsResponse>(`/api/inventory/alerts${query}`, { method: "GET" });
}

export async function listInventoryReports(input?: { days?: number }) {
  const params = new URLSearchParams();
  if (typeof input?.days === "number") params.set("days", String(input.days));
  const query = params.size ? `?${params.toString()}` : "";
  return apiFetch<InventoryReportsResponse>(`/api/inventory/reports${query}`, { method: "GET" });
}

export async function searchInventory(input: {
  q: string;
  limit?: number;
  category?: InventoryCategory;
  activeOnly?: boolean;
}) {
  const params = new URLSearchParams();
  params.set("q", input.q);
  if (typeof input.limit === "number") params.set("limit", String(input.limit));
  if (input.category) params.set("category", input.category);
  if (typeof input.activeOnly === "boolean") params.set("activeOnly", String(input.activeOnly));
  const query = `?${params.toString()}`;
  const response = await apiFetch<unknown>(`/api/inventory/search${query}`, { method: "GET" });
  return expectApiRecordArray(response, "inventory search");
}

export async function createInventoryItem(input: InventoryCreatePayload) {
  return apiFetch("/api/inventory", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateInventoryItem(
  inventoryId: number | string,
  input: InventoryUpdatePayload
) {
  return apiFetch(`/api/inventory/${inventoryId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function createInventoryMovement(
  inventoryId: number | string,
  input: InventoryMovementPayload
) {
  return apiFetch(`/api/inventory/${inventoryId}/movements`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function adjustInventoryStock(
  inventoryId: number | string,
  input: InventoryAdjustStockPayload
) {
  return apiFetch(`/api/inventory/${inventoryId}/adjust-stock`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function listInventoryMovements(inventoryId: number | string) {
  const response = await apiFetch<unknown>(`/api/inventory/${inventoryId}/movements`, { method: "GET" });
  return expectApiRecordArray(response, "inventory movements");
}

export async function listInventoryBatches(inventoryId: number | string) {
  const response = await apiFetch<unknown>(`/api/inventory/${inventoryId}/batches`, { method: "GET" });
  return expectApiRecordArray(response, "inventory batches");
}

export async function createInventoryBatch(
  inventoryId: number | string,
  input: InventoryBatchCreatePayload
) {
  return apiFetch(`/api/inventory/${inventoryId}/batches`, {
    method: "POST",
    body: JSON.stringify(input),
  });
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
