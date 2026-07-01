// Browser-side client for the patient portal. All calls go through the same-origin
// /api/portal proxy, which attaches the patient token from httpOnly cookies.

export interface PortalAccount {
  id: number;
  email: string;
  phone: string | null;
  firstName: string | null;
  lastName: string | null;
  dob: string | null;
  gender: string | null;
  nic: string | null;
  address: string | null;
  bloodGroup: string | null;
  allergies: Array<{ name: string; severity?: string }>;
  profileCompleted: boolean;
}

export interface PortalDirectoryDoctor {
  doctorUserId: number;
  name: string;
  organizationId: string;
  clinicName: string;
  clinicSlug: string;
}

export interface PortalLinkedDoctor {
  linkId: number;
  doctorUserId: number;
  organizationId: string;
  patientId: number;
  status: string;
  doctorName: string;
  clinicName: string;
}

export interface PortalTimelineEntry {
  encounterId: number;
  date: string;
  clinicName: string | null;
  doctorName: string | null;
  diagnoses: string[];
  notes: string | null;
  nextVisitDate: string | null;
}

export interface PortalHistoryCard {
  prescriptionId: number;
  encounterId: number;
  date: string;
  clinicName: string | null;
  doctorName: string | null;
  drugCount: number;
  drugPreview: string[];
}

export interface PortalDocument {
  id: number;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  uploadedAt: string;
  reviewedAt?: string | null;
  doctorName: string;
  clinicName: string;
}

export interface PortalReceivedDocument {
  id: number;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  uploadedAt: string;
  reviewedAt?: string | null;
  note?: string | null;
  uploadedByName: string;
  clinicName: string;
}

export interface PortalProfileMatch {
  matched: boolean;
  profile?: {
    firstName: string | null;
    lastName: string | null;
    dob: string | null;
    gender: "male" | "female" | "other" | null;
    phone: string | null;
    address: string | null;
    bloodGroup: string | null;
  };
}

export interface PortalProfileInput {
  firstName: string;
  lastName: string;
  dob: string;
  gender: "male" | "female" | "other";
  nic?: string | null;
  phone?: string | null;
  address?: string | null;
  bloodGroup?: string | null;
  allergies?: Array<{ name: string; severity?: "low" | "moderate" | "high" }>;
}

async function portalFetch<T>(path: string, init?: RequestInit & { json?: unknown }): Promise<T> {
  const headers = new Headers(init?.headers);
  let body = init?.body;
  if (init?.json !== undefined) {
    headers.set("content-type", "application/json");
    body = JSON.stringify(init.json);
  }
  const res = await fetch(`/api/portal/${path}`, { ...init, headers, body, cache: "no-store" });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    throw new Error((data && (data.error || data.message)) || `Request failed (${res.status})`);
  }
  return data as T;
}

// --- auth ---
export const portalSignup = (input: { email: string; phone?: string; password: string }) =>
  portalFetch<{ account: PortalAccount }>("auth/signup", { method: "POST", json: input });
export const portalLogin = (input: { email: string; password: string }) =>
  portalFetch<{ account: PortalAccount }>("auth/login", { method: "POST", json: input });
export const portalLogout = () => portalFetch<{ ok: true }>("auth/logout", { method: "POST" });
export const portalMe = () => portalFetch<PortalAccount>("auth/me");

// --- profile ---
export const portalGetProfile = () => portalFetch<PortalAccount>("profile");
export const portalUpdateProfile = (input: PortalProfileInput) =>
  portalFetch<PortalAccount>("profile", { method: "PUT", json: input });

// --- doctors ---
export const portalDoctorDirectory = () => portalFetch<PortalDirectoryDoctor[]>("doctors/directory");
export const portalMyDoctors = () => portalFetch<PortalLinkedDoctor[]>("doctors");
export const portalLinkDoctor = (doctorUserId: number) =>
  portalFetch<{ linkId: number }>("doctors/link", { method: "POST", json: { doctorUserId } });
export const portalUnlinkDoctor = (linkId: number) =>
  portalFetch<{ ok: true }>(`doctors/${linkId}`, { method: "DELETE" });

// --- clinical ---
export const portalHome = () => portalFetch<{ timeline: PortalTimelineEntry[] }>("home");
export const portalHistory = () => portalFetch<PortalHistoryCard[]>("history");
export const portalEncounter = (encounterId: number) =>
  portalFetch<Record<string, unknown>>(`encounters/${encounterId}`);

// --- documents ---
export const portalDocuments = () => portalFetch<PortalDocument[]>("documents");
export const portalReceivedDocuments = () => portalFetch<PortalReceivedDocument[]>("documents/received");
export const portalDocumentDownloadUrl = (id: number) =>
  portalFetch<{ url: string }>(`documents/${id}/download-url`);
export const portalProfileMatch = (params: { nic?: string; phone?: string }) => {
  const q = new URLSearchParams();
  if (params.nic?.trim()) q.set("nic", params.nic.trim());
  if (params.phone?.trim()) q.set("phone", params.phone.trim());
  return portalFetch<PortalProfileMatch>(`profile/match?${q.toString()}`);
};
export async function portalUploadDocument(doctorUserId: number, file: File): Promise<PortalDocument> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch(`/api/portal/documents?doctorUserId=${doctorUserId}`, {
    method: "POST",
    body: fd,
    cache: "no-store"
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) throw new Error((data && (data.error || data.message)) || "Upload failed");
  return data as PortalDocument;
}
