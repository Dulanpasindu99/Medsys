import {
  clearSession,
  getAccessToken,
  getRefreshToken,
  setTokens,
} from "@/app/lib/auth-store";
import type {
  ApiErrorEnvelope,
  AppointmentRecord,
  AuthTokens,
  CreatePatientRequest,
  CreatePrescriptionRequest,
  InventoryItemRecord,
  InventoryMovementRequest,
  LoginRequest,
  LogoutRequest,
  PaginatedResponse,
  PatientRecord,
  RefreshRequest,
  UserRecord,
} from "@/app/lib/types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") ?? "http://localhost:4000/api/v1";

type Method = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

type RequestOptions = {
  method?: Method;
  auth?: boolean;
  credentials?: RequestCredentials;
  headers?: HeadersInit;
  body?: unknown;
  signal?: AbortSignal;
  retryOn401?: boolean;
};

type MaybePaginated<T> = PaginatedResponse<T> | T[];

export class ApiClientError extends Error {
  status: number;
  code?: number;
  requestId?: string | null;

  constructor(message: string, status: number, code?: number, requestId?: string | null) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.code = code;
    this.requestId = requestId;
  }
}

let refreshInFlight: Promise<boolean> | null = null;

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const {
    method = "GET",
    auth = true,
    credentials = "include",
    headers = {},
    body,
    signal,
    retryOn401 = true,
  } = options;

  const url = `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
  const requestHeaders = new Headers(headers);
  requestHeaders.set("Content-Type", "application/json");
  if (auth) {
    const accessToken = getAccessToken();
    if (accessToken) {
      requestHeaders.set("Authorization", `Bearer ${accessToken}`);
    }
  }

  const response = await fetch(url, {
    method,
    headers: requestHeaders,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    credentials,
    signal,
  });

  if (response.status === 401 && auth && retryOn401) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      return request<T>(path, { ...options, retryOn401: false });
    }
  }

  if (!response.ok) {
    throw await buildApiError(response);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

async function buildApiError(response: Response): Promise<ApiClientError> {
  let message = `Request failed with status ${response.status}`;
  let code: number | undefined;
  let requestId: string | null | undefined = null;

  try {
    const payload = (await response.json()) as ApiErrorEnvelope;
    if (payload?.error) {
      message = payload.error.message ?? message;
      code = payload.error.code;
      requestId = payload.error.request_id;
    }
  } catch {
    // Ignore parsing errors and keep default message.
  }

  return new ApiClientError(message, response.status, code, requestId);
}

async function refreshAccessToken() {
  if (refreshInFlight) {
    return refreshInFlight;
  }

  refreshInFlight = (async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      clearSession();
      return false;
    }

    try {
      const tokens = await authApi.refresh({ refreshToken });
      setTokens(tokens.accessToken, tokens.refreshToken);
      return true;
    } catch {
      clearSession();
      return false;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

function buildQuery(params?: Record<string, string | number | boolean | undefined>) {
  if (!params) return "";
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      search.set(key, String(value));
    }
  }
  const query = search.toString();
  return query ? `?${query}` : "";
}

function normalizeLimit(limit: number) {
  return Math.max(1, Math.min(limit, 20));
}

function normalizePaginatedResponse<T>(
  payload: MaybePaginated<T>,
  page: number,
  limit: number
): PaginatedResponse<T> {
  if (Array.isArray(payload)) {
    const total = payload.length;
    return {
      data: payload.slice((page - 1) * limit, page * limit),
      meta: { page, limit, total },
    };
  }
  return payload;
}

export const authApi = {
  login: (payload: LoginRequest) =>
    request<AuthTokens>("/auth/login", { method: "POST", auth: false, body: payload }),
  refresh: (payload: RefreshRequest) =>
    request<AuthTokens>("/auth/refresh", {
      method: "POST",
      auth: false,
      body: payload,
      retryOn401: false,
    }),
  logout: (payload: LogoutRequest) =>
    request<void>("/auth/logout", {
      method: "POST",
      auth: false,
      body: payload,
      retryOn401: false,
    }),
};

export const usersApi = {
  list: (page = 1, limit = 20) =>
    request<PaginatedResponse<UserRecord>>(`/users${buildQuery({ page, limit: normalizeLimit(limit) })}`),
  create: (payload: Partial<UserRecord> & { password: string }) =>
    request<UserRecord>("/users", { method: "POST", body: payload }),
  update: (id: string | number, payload: Partial<UserRecord>) =>
    request<UserRecord>(`/users/${id}`, { method: "PATCH", body: payload }),
};

export const patientsApi = {
  list: (page = 1, limit = 20) =>
    request<PaginatedResponse<PatientRecord>>(`/patients${buildQuery({ page, limit: normalizeLimit(limit) })}`),
  findById: (id: string | number) =>
    request<PatientRecord>(`/patients/${id}`),
  create: (payload: CreatePatientRequest) =>
    request<PatientRecord>("/patients", { method: "POST", body: payload }),
  update: (id: string | number, payload: Partial<CreatePatientRequest>) =>
    request<PatientRecord>(`/patients/${id}`, { method: "PATCH", body: payload }),
};

export const appointmentsApi = {
  list: async (
    page = 1,
    limit = 20,
    status?: "waiting" | "in_consultation" | "completed" | "cancelled"
  ) => {
    const safeLimit = normalizeLimit(limit);
    try {
      const response = await request<PaginatedResponse<AppointmentRecord>>(
        `/appointments${buildQuery({ page, limit: safeLimit })}`
      );
      if (!status) return response;
      const filtered = response.data.filter((item) => item.status === status);
      return {
        ...response,
        data: filtered,
        meta: { ...response.meta, total: filtered.length },
      };
    } catch (error) {
      // Some backend implementations reject pagination query params.
      if (error instanceof ApiClientError && error.status === 400) {
        const raw = await request<MaybePaginated<AppointmentRecord>>(`/appointments`);
        const normalized = normalizePaginatedResponse(raw, page, safeLimit);
        if (!status) return normalized;
        return {
          ...normalized,
          data: normalized.data.filter((item) => item.status === status),
          meta: {
            ...normalized.meta,
            total: normalized.data.filter((item) => item.status === status).length,
          },
        };
      }
      throw error;
    }
  },
  update: (id: string | number, payload: Partial<AppointmentRecord>) =>
    request<AppointmentRecord>(`/appointments/${id}`, { method: "PATCH", body: payload }),
};

export const inventoryApi = {
  list: (page = 1, limit = 20) =>
    request<PaginatedResponse<InventoryItemRecord>>(
      `/inventory${buildQuery({ page, limit: normalizeLimit(limit) })}`
    ),
  addMovement: (id: string | number, payload: InventoryMovementRequest) =>
    request<{ success: boolean }>(`/inventory/${id}/movements`, {
      method: "POST",
      body: payload,
    }),
};

export const encountersApi = {
  create: (payload: Record<string, unknown>) =>
    request<Record<string, unknown>>("/encounters", { method: "POST", body: payload }),
  addDiagnoses: (encounterId: string | number, payload: Record<string, unknown>) =>
    request<Record<string, unknown>>(`/encounters/${encounterId}/diagnoses`, {
      method: "POST",
      body: payload,
    }),
  addTests: (encounterId: string | number, payload: Record<string, unknown>) =>
    request<Record<string, unknown>>(`/encounters/${encounterId}/tests`, {
      method: "POST",
      body: payload,
    }),
};

export const prescriptionsApi = {
  create: (payload: CreatePrescriptionRequest) =>
    request<Record<string, unknown>>("/prescriptions", { method: "POST", body: payload }),
  findById: (id: string | number) =>
    request<Record<string, unknown>>(`/prescriptions/${id}`),
};

export const analyticsApi = {
  overview: () => request<Record<string, unknown>>("/analytics/overview"),
};

export const auditApi = {
  list: (page = 1, limit = 20) =>
    request<PaginatedResponse<Record<string, unknown>>>(
      `/audit/logs${buildQuery({ page, limit: normalizeLimit(limit) })}`
    ),
};

export { API_BASE_URL, request as apiRequest };
