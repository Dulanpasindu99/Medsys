export type UserRole = "owner" | "doctor" | "assistant";

export type ApiError = {
  code?: number;
  message: string;
  request_id?: string | null;
};

export type ApiErrorEnvelope = {
  error: ApiError;
};

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
};

export type PaginatedResponse<T> = {
  data: T[];
  meta: PaginationMeta;
};

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type RefreshRequest = {
  refreshToken: string;
};

export type LogoutRequest = {
  refreshToken: string;
};

export type UserRecord = {
  id: string | number;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type AllergyInput = {
  allergy_name: string;
  severity?: "low" | "moderate" | "high";
};

export type PatientRecord = {
  id: string | number;
  uuid: string;
  nic: string | null;
  full_name: string;
  dob: string | null;
  gender: "male" | "female" | "other" | null;
  phone: string | null;
  address: string | null;
  blood_group: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  allergies?: {
    id: string | number;
    allergy_name: string;
    severity: "low" | "moderate" | "high" | null;
  }[];
};

export type CreatePatientRequest = {
  nic?: string;
  full_name: string;
  dob?: string;
  gender?: "male" | "female" | "other";
  phone?: string;
  address?: string;
  blood_group?: string;
  allergies?: AllergyInput[];
};

export type AppointmentRecord = {
  id: string | number;
  patient_id: string | number;
  doctor_id: string | number | null;
  assistant_id: string | number | null;
  scheduled_at: string;
  status: "waiting" | "in_consultation" | "completed" | "cancelled";
  reason: string | null;
  priority: "normal" | "urgent" | "critical";
  created_at: string;
  updated_at: string;
};

export type InventoryItemRecord = {
  id: string | number;
  sku: string | null;
  name: string;
  category: "medicine" | "supply" | "equipment";
  unit: string;
  stock: number;
  reorder_level: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type InventoryMovementRequest = {
  movement_type: "in" | "out" | "adjustment";
  quantity: number;
  reference_type?: string;
  reference_id?: number;
  note?: string;
};

export type PrescriptionItemInput = {
  drug_name: string;
  dose?: string;
  frequency?: string;
  duration?: string;
  quantity: number;
  source: "Clinical" | "Outside";
};

export type CreatePrescriptionRequest = {
  encounter_id: number;
  patient_id: number;
  doctor_id: number;
  items: PrescriptionItemInput[];
};
