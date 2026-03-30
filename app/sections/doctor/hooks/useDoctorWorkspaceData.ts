import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getPrescriptionById,
  saveConsultation,
  type ApiClientError,
} from "../../../lib/api-client";
import { hasPermission } from "../../../lib/authorization";
import {
  emptyLoadState,
  errorLoadState,
  errorMutationState,
  getMutationFeedback,
  idleMutationState,
  loadingLoadState,
  pendingMutationState,
  readyLoadState,
  successMutationState,
  type LoadState,
  type MutationState,
} from "../../../lib/async-state";
import {
  useAppointmentsQuery,
  useCurrentUserQuery,
  useInventoryQuery,
  usePatientAllergiesQuery,
  usePatientProfileQuery,
  usePatientsQuery,
  usePatientVitalsQuery,
} from "../../../lib/query-hooks";
import { queryKeys } from "../../../lib/query-keys";
import type { useDoctorClinicalWorkflow } from "./useDoctorClinicalWorkflow";
import type { useVisitPlanner } from "./useVisitPlanner";
import type {
  AllergyAlert,
  AppointmentLifecycleStatus,
  ClinicalDiagnosisSelection,
  GuardianCaptureMode,
  Patient,
  PatientGender,
  PatientVital,
} from "../types";

type AnyRecord = Record<string, unknown>;
type ClinicalWorkflow = ReturnType<typeof useDoctorClinicalWorkflow>;
type VisitPlannerState = ReturnType<typeof useVisitPlanner>;
const EMPTY_ROWS: unknown[] = [];
type VitalDraftKey = "bloodPressure" | "heartRate" | "temperature" | "spo2";
type AllergySeverity = "low" | "moderate" | "high";
type ConsultationWorkflowType = "appointment" | "walk_in";

function asRecord(value: unknown): AnyRecord | null {
  return value && typeof value === "object" ? (value as AnyRecord) : null;
}

function unwrapProfileRecord(value: unknown): AnyRecord | null {
  const record = asRecord(value);
  if (!record) {
    return null;
  }

  const directPatient = asRecord(record.patient);
  if (directPatient) {
    return directPatient;
  }

  const dataRecord = asRecord(record.data);
  if (dataRecord) {
    const nestedPatient = asRecord(dataRecord.patient);
    if (nestedPatient) {
      return nestedPatient;
    }

    if (
      dataRecord.nic !== undefined ||
      dataRecord.guardian_nic !== undefined ||
      dataRecord.patient_code !== undefined
    ) {
      return dataRecord;
    }
  }

  return record;
}

function asArray(value: unknown): AnyRecord[] {
  if (Array.isArray(value)) {
    return value.map((entry) => asRecord(entry)).filter((entry): entry is AnyRecord => !!entry);
  }
  const record = asRecord(value);
  if (!record) return [];
  const candidates = [record.data, record.items, record.rows];
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate.map((entry) => asRecord(entry)).filter((entry): entry is AnyRecord => !!entry);
    }
  }
  return [];
}

function getString(value: unknown, fallback = "") {
  if (typeof value === "string") return value;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return fallback;
}

function getNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() && !Number.isNaN(Number(value))) {
    return Number(value);
  }
  return null;
}

function getDateLabel(value: unknown) {
  const raw = getString(value);
  if (!raw) return "-";
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return raw;
  return date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

function getDateTimeLabel(value: unknown) {
  const raw = getString(value);
  if (!raw) return "";
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return raw;
  return date.toLocaleString("en-GB", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getResolvedPrescriptionId(value: unknown): number | null {
  const record = asRecord(value);
  if (!record) return null;
  return (
    getNumber(record.prescriptionId ?? record.prescription_id) ??
    getNumber(asRecord(record.prescription)?.id) ??
    null
  );
}

function buildPrescriptionPrintHtml(input: {
  prescriptionId: number;
  patientName: string;
  patientCode?: string;
  nic?: string;
  diagnosis: string;
  notes?: string;
  doctorName: string;
  issuedAt: string;
  items: Array<{ name: string; dose: string; frequency: string; quantity: string; source: string }>;
}) {
  const rows = input.items
    .map(
      (item, index) => `
        <tr>
          <td>${index + 1}</td>
          <td>${escapeHtml(item.name)}</td>
          <td>${escapeHtml(item.dose)}</td>
          <td>${escapeHtml(item.frequency)}</td>
          <td>${escapeHtml(item.quantity)}</td>
          <td>${escapeHtml(item.source)}</td>
        </tr>
      `
    )
    .join("");

  return `<!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="utf-8" />
      <title>Prescription ${escapeHtml(String(input.prescriptionId))}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 32px; color: #0f172a; }
        h1, h2, p { margin: 0; }
        .header { display: flex; justify-content: space-between; gap: 16px; align-items: flex-start; margin-bottom: 24px; }
        .brand { font-size: 26px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; }
        .meta { text-align: right; font-size: 12px; color: #475569; }
        .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px 20px; margin-bottom: 20px; }
        .label { display: block; font-size: 11px; text-transform: uppercase; letter-spacing: 0.12em; color: #64748b; margin-bottom: 4px; }
        .value { font-size: 15px; font-weight: 600; }
        table { width: 100%; border-collapse: collapse; margin-top: 18px; }
        th, td { border: 1px solid #cbd5e1; padding: 10px 12px; text-align: left; font-size: 14px; vertical-align: top; }
        th { background: #e2e8f0; text-transform: uppercase; font-size: 11px; letter-spacing: 0.08em; }
        .notes { margin-top: 18px; border: 1px solid #cbd5e1; border-radius: 10px; padding: 14px; }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <p class="brand">Medlink Prescription</p>
          <p>Doctor consultation medication order</p>
        </div>
        <div class="meta">
          <p>Prescription ID: ${escapeHtml(String(input.prescriptionId))}</p>
          <p>Issued: ${escapeHtml(input.issuedAt)}</p>
          <p>Doctor: ${escapeHtml(input.doctorName)}</p>
        </div>
      </div>
      <div class="grid">
        <div>
          <span class="label">Patient</span>
          <div class="value">${escapeHtml(input.patientName || "-")}</div>
        </div>
        <div>
          <span class="label">Patient Code</span>
          <div class="value">${escapeHtml(input.patientCode || "-")}</div>
        </div>
        <div>
          <span class="label">NIC</span>
          <div class="value">${escapeHtml(input.nic || "-")}</div>
        </div>
        <div>
          <span class="label">Diagnosis</span>
          <div class="value">${escapeHtml(input.diagnosis || "Consultation treatment")}</div>
        </div>
      </div>
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Drug</th>
            <th>Dose</th>
            <th>Frequency</th>
            <th>Quantity</th>
            <th>Source</th>
          </tr>
        </thead>
        <tbody>${rows || '<tr><td colspan="6">No prescription items found.</td></tr>'}</tbody>
      </table>
      ${
        input.notes
          ? `<div class="notes"><span class="label">Clinical Notes</span><div class="value">${escapeHtml(input.notes)}</div></div>`
          : ""
      }
    </body>
  </html>`;
}

function normalizeGender(value: unknown): PatientGender {
  const text = getString(value).toLowerCase();
  if (text === "female") return "Female";
  if (text === "male") return "Male";
  return "Unspecified";
}

function toName(row: AnyRecord, fallback: string) {
  const direct = getString(row.name ?? row.fullName ?? row.full_name).trim();
  if (direct) return direct;
  const firstName = getString(row.firstName ?? row.first_name).trim();
  const lastName = getString(row.lastName ?? row.last_name).trim();
  const combined = `${firstName} ${lastName}`.trim();
  return combined || fallback;
}

function toAge(...values: unknown[]) {
  for (const value of values) {
    const numeric = getNumber(value);
    if (numeric !== null) return numeric;
    const text = getString(value);
    if (!text) continue;
    const dob = new Date(`${text}T00:00:00.000Z`);
    if (Number.isNaN(dob.getTime())) continue;
    const today = new Date();
    let years = today.getUTCFullYear() - dob.getUTCFullYear();
    const beforeBirthday =
      today.getUTCMonth() < dob.getUTCMonth() ||
      (today.getUTCMonth() === dob.getUTCMonth() &&
        today.getUTCDate() < dob.getUTCDate());
    if (beforeBirthday) years -= 1;
    return years;
  }
  return 0;
}

function normalizeIsoDate(value: unknown) {
  const raw = getString(value).trim();
  if (!raw) return "";
  const directMatch = raw.match(/^\d{4}-\d{2}-\d{2}/);
  if (directMatch) {
    return directMatch[0] ?? "";
  }
  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }
  return "";
}

function parseVitalDrafts(vitalDrafts: Record<VitalDraftKey, string>) {
  const bloodPressureText = vitalDrafts.bloodPressure.trim();
  const heartRateText = vitalDrafts.heartRate.trim();
  const temperatureText = vitalDrafts.temperature.trim();
  const spo2Text = vitalDrafts.spo2.trim();
  const bloodPressureMatch = bloodPressureText.match(/^\s*(\d{2,3})\s*\/\s*(\d{2,3})\s*$/);
  const bpSystolic = bloodPressureMatch ? Number(bloodPressureMatch[1]) : undefined;
  const bpDiastolic = bloodPressureMatch ? Number(bloodPressureMatch[2]) : undefined;
  const heartRateMatch = heartRateText.match(/\d+(?:\.\d+)?/);
  const heartRate = heartRateMatch ? Number(heartRateMatch[0]) : undefined;
  const temperatureMatch = temperatureText.match(/\d+(?:\.\d+)?/);
  const temperatureC = temperatureMatch ? Number(temperatureMatch[0]) : undefined;
  const spo2Match = spo2Text.match(/\d+(?:\.\d+)?/);
  const spo2 = spo2Match ? Number(spo2Match[0]) : undefined;

  return {
    bloodPressureText,
    bpSystolic,
    bpDiastolic,
    heartRate,
    temperatureC,
    spo2,
    hasAnySupportedVital:
      bpSystolic !== undefined ||
      bpDiastolic !== undefined ||
      heartRate !== undefined ||
      temperatureC !== undefined ||
      spo2 !== undefined,
  };
}

function buildConsultationAllergyPayload(
  consultationAllergies: Array<{ allergyName: string; severity: AllergySeverity; isActive: boolean }>,
  allergyDraftName: string,
  allergyDraftSeverity: AllergySeverity
) {
  const pendingName = allergyDraftName.trim();
  const merged = [...consultationAllergies];

  if (pendingName) {
    const nextEntry = {
      allergyName: pendingName,
      severity: allergyDraftSeverity,
      isActive: true,
    } as const;
    const existingIndex = merged.findIndex(
      (entry) => normalizeLookupValue(entry.allergyName) === normalizeLookupValue(pendingName)
    );

    if (existingIndex >= 0) {
      merged[existingIndex] = nextEntry;
    } else {
      merged.push(nextEntry);
    }
  }

  return merged;
}

function toDiagnosisPayloadEntry(diagnosis: string | ClinicalDiagnosisSelection) {
  if (typeof diagnosis !== "string") {
    return {
      diagnosisName: diagnosis.display.trim(),
      icd10Code: diagnosis.code.trim().toUpperCase(),
    };
  }

  const trimmed = diagnosis.trim();
  const icdMatch = trimmed.match(/^([A-Z][0-9][A-Z0-9.]{1,10})\s*-\s*(.+)$/i);

  if (!icdMatch) {
    return {
      diagnosisName: trimmed,
      icd10Code: "",
    };
  }

  return {
    diagnosisName: icdMatch[2]?.trim() ?? trimmed,
    icd10Code: icdMatch[1]?.trim().toUpperCase() ?? "",
  };
}

function getResolvedPatientId(payload: AnyRecord) {
  return (
    getNumber(payload.patientId) ??
    getNumber(asRecord(payload.patient)?.id) ??
    getNumber(asRecord(payload.resolvedPatient)?.id) ??
    getNumber(asRecord(payload.createdPatient)?.id)
  );
}

function normalizeWorkflowType(value: unknown): ConsultationWorkflowType | null {
  const raw = getString(value).trim().toLowerCase();
  if (raw === "appointment") return "appointment";
  if (raw === "walk_in" || raw === "walk-in" || raw === "walkin") return "walk_in";
  return null;
}

function isMinorWithoutNic(dateOfBirth: string, nic: string) {
  if (!dateOfBirth || nic.trim()) return false;
  const age = toAge(dateOfBirth);
  return age > 0 && age < 18;
}

function splitPatientNameParts(name: string) {
  const trimmed = name.trim();
  if (!trimmed) {
    return { firstName: "", lastName: "" };
  }

  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) {
    return { firstName: parts[0] ?? "", lastName: "" };
  }

  return {
    firstName: parts[0] ?? "",
    lastName: parts.slice(1).join(" "),
  };
}

function normalizePatients(rawPatients: unknown, rawAppointments: unknown): Patient[] {
  const patientRows = asArray(rawPatients);
  const appointmentRows = asArray(rawAppointments);

  const patientById = new Map<number, AnyRecord>();
  const patientByCode = new Map<string, AnyRecord>();
  patientRows.forEach((row) => {
    const id = getNumber(row.id ?? row.patientId ?? row.patient_id);
    if (id !== null) patientById.set(id, row);
    const code = normalizeLookupValue(getString(row.patient_code));
    if (code) patientByCode.set(code, row);
  });

  const fromAppointments = appointmentRows.map((row, index) => {
    const nestedPatient = asRecord(row.patient) ?? asRecord(row.patientDetails) ?? null;
    const appointmentId = getNumber(row.id ?? row.appointmentId ?? row.appointment_id) ?? undefined;
    const queuePosition =
      getNumber(row.queuePosition ?? row.queue_position) ?? undefined;
    const patientIdFromRow = getNumber(row.patientId ?? row.patient_id ?? nestedPatient?.id) ?? undefined;
    const doctorId = getNumber(row.doctorId ?? row.doctor_id ?? asRecord(row.doctor)?.id) ?? undefined;
    const appointmentPatientCode = normalizeLookupValue(
      getString(nestedPatient?.patient_code ?? row.patient_code)
    );
    const patientRow =
      (patientIdFromRow ? patientById.get(patientIdFromRow) : null) ??
      (appointmentPatientCode ? patientByCode.get(appointmentPatientCode) : null) ??
      null;
    const patientId =
      patientIdFromRow ??
      (patientRow ? getNumber(patientRow.id ?? patientRow.patientId ?? patientRow.patient_id) ?? undefined : undefined);

    const name = toName(
      {
        ...(patientRow ?? {}),
        ...(nestedPatient ?? {}),
        name: row.patientName ?? row.patient_name ?? nestedPatient?.name ?? patientRow?.name,
        fullName: nestedPatient?.fullName ?? patientRow?.fullName,
      },
      `Patient ${patientId ?? index + 1}`
    );
    const patientCode = getString(
      nestedPatient?.patient_code ?? row.patient_code ?? patientRow?.patient_code,
      ""
    );
    const familyId =
      getNumber(
        nestedPatient?.family_id ??
          asRecord(nestedPatient?.family)?.id ??
          row.family_id ??
          asRecord(row.family)?.id ??
          patientRow?.family_id ??
          asRecord(patientRow?.family)?.id
      ) ?? undefined;

    const nic = getString(
      nestedPatient?.nic ?? row.nic ?? row.patientNic ?? row.patient_nic ?? patientRow?.nic,
      "No NIC"
    );
    const dateOfBirth = normalizeIsoDate(
      nestedPatient?.date_of_birth ??
        nestedPatient?.dob ??
        row.date_of_birth ??
        row.dob ??
        patientRow?.date_of_birth ??
        patientRow?.dob
    );
    const phone = getString(
      nestedPatient?.phone ?? row.phone ?? row.patient_phone ?? patientRow?.phone,
      ""
    );

    const age = toAge(
      nestedPatient?.age,
      row.age,
      row.patientAge,
      row.patient_age,
      nestedPatient?.date_of_birth,
      row.date_of_birth,
      patientRow?.age,
      patientRow?.date_of_birth
    );

    const gender = normalizeGender(
      nestedPatient?.gender ??
        row.gender ??
        row.patientGender ??
        row.patient_gender ??
        patientRow?.gender
    );

    const reason = getString(row.reason ?? row.chiefComplaint ?? row.notes, "Consultation");
    const time = getDateLabel(row.scheduledAt ?? row.scheduled_at ?? row.created_at ?? row.createdAt);
    const appointmentStatus = getString(row.status).toLowerCase();
    const guardianName = getString(
      nestedPatient?.guardian_name ??
        row.guardian_name ??
        patientRow?.guardian_name,
      ""
    );
    const guardianNic = getString(
      nestedPatient?.guardian_nic ??
        row.guardian_nic ??
        patientRow?.guardian_nic,
      ""
    );
    const guardianRelationship = getString(
      nestedPatient?.guardian_relationship ??
        row.guardian_relationship ??
        patientRow?.guardian_relationship,
      ""
    );

    return {
      patientId,
      appointmentId,
      doctorId,
      appointmentStatus:
        appointmentStatus === "in_consultation" ||
        appointmentStatus === "completed" ||
        appointmentStatus === "cancelled"
          ? (appointmentStatus as AppointmentLifecycleStatus)
          : "waiting",
      queueOrder: queuePosition,
      name,
      patientCode,
      familyId,
      nic,
      phone: phone || undefined,
      dateOfBirth: dateOfBirth || undefined,
      guardianName: guardianName || undefined,
      guardianNic: guardianNic || undefined,
      guardianPhone:
        getString(nestedPatient?.guardian_phone ?? row.guardian_phone ?? patientRow?.guardian_phone, "") ||
        undefined,
      guardianRelationship: guardianRelationship || undefined,
      time,
      reason,
      age,
      gender,
      profileId: patientId ? String(patientId) : undefined,
    } satisfies Patient;
  });
  const standalonePatients = patientRows.map((row, index) => {
    const id = getNumber(row.id ?? row.patientId ?? row.patient_id);
    return {
      patientId: id ?? undefined,
      familyId:
        getNumber(row.family_id ?? asRecord(row.family)?.id) ?? undefined,
      name: toName(row, `Patient ${index + 1}`),
      patientCode: getString(row.patient_code, ""),
      nic: getString(row.nic, "No NIC"),
      phone: getString(row.phone, "") || undefined,
      dateOfBirth: normalizeIsoDate(row.date_of_birth ?? row.dob) || undefined,
      guardianName: getString(row.guardian_name, "") || undefined,
      guardianNic: getString(row.guardian_nic, "") || undefined,
      guardianPhone: getString(row.guardian_phone, "") || undefined,
      guardianRelationship: getString(row.guardian_relationship, "") || undefined,
      time: "-",
      reason: "General visit",
      age: toAge(row.age, row.date_of_birth),
      gender: normalizeGender(row.gender),
      profileId: id ? String(id) : undefined,
    } satisfies Patient;
  });

  return [...fromAppointments, ...standalonePatients];
}

function normalizeVitals(raw: unknown): PatientVital[] {
  return asArray(raw).flatMap((row, index) => {
    const typedVitals: PatientVital[] = [];
    const bpSystolic = getNumber(row.bpSystolic ?? row.bp_systolic);
    const bpDiastolic = getNumber(row.bpDiastolic ?? row.bp_diastolic);
    const heartRate = getNumber(row.heartRate ?? row.heart_rate);
    const temperatureC = getNumber(row.temperatureC ?? row.temperature_c);
    const spo2 = getNumber(row.spo2 ?? row.spo_2);

    if (bpSystolic !== null || bpDiastolic !== null) {
      typedVitals.push({
        label: "Blood Pressure",
        value:
          bpSystolic !== null && bpDiastolic !== null
            ? `${bpSystolic}/${bpDiastolic}`
            : `${bpSystolic ?? "--"}/${bpDiastolic ?? "--"}`,
      });
    }
    if (heartRate !== null) {
      typedVitals.push({ label: "Heart Rate", value: String(heartRate) });
    }
    if (temperatureC !== null) {
      typedVitals.push({ label: "Temperature", value: String(temperatureC) });
    }
    if (spo2 !== null) {
      typedVitals.push({ label: "SpO2", value: String(spo2) });
    }

    if (typedVitals.length > 0) {
      return typedVitals;
    }

    return [
      {
        label: getString(row.label ?? row.name ?? row.vitalName ?? row.type, `Vital ${index + 1}`),
        value: getString(row.value ?? row.reading ?? row.result, "--"),
      },
    ];
  });
}

function buildVitalDrafts(vitals: PatientVital[]) {
  const drafts: Record<VitalDraftKey, string> = {
    bloodPressure: "",
    heartRate: "",
    temperature: "",
    spo2: "",
  };

  vitals.forEach((vital) => {
    const label = normalizeLookupValue(vital.label);
    if (label === "blood pressure" || label === "bp") {
      drafts.bloodPressure = vital.value;
      return;
    }
    if (label === "heart rate" || label === "pulse") {
      drafts.heartRate = vital.value;
      return;
    }
    if (label === "temperature" || label === "temp") {
      drafts.temperature = vital.value;
      return;
    }
    if (label === "spo2" || label === "spo 2" || label === "oxygen saturation") {
      drafts.spo2 = vital.value;
    }
  });

  return drafts;
}

function normalizeAllergies(raw: unknown): AllergyAlert[] {
  const deduped = new Map<string, AllergyAlert>();

  asArray(raw).forEach((row, index) => {
    const name = getString(row.name ?? row.allergyName ?? row.allergen, `Allergy ${index + 1}`);
    const severity = getString(row.severity, "Medium");
    const level = severity.toLowerCase();
    const key = normalizeLookupValue(name);

    const normalized =
      level === "high" || level === "critical"
        ? {
            name,
            severity: "High",
            severityKey: "high" as const,
            dot: "bg-rose-400",
            pill: "bg-rose-50 text-rose-700 ring-rose-100",
          }
        : level === "low"
          ? {
              name,
              severity: "Low",
              severityKey: "low" as const,
              dot: "bg-emerald-400",
              pill: "bg-emerald-50 text-emerald-700 ring-emerald-100",
            }
          : {
              name,
              severity: "Medium",
              severityKey: "moderate" as const,
              dot: "bg-amber-400",
              pill: "bg-amber-50 text-amber-700 ring-amber-100",
            };

    const current = deduped.get(key);
    const currentRank =
      current?.severityKey === "high" ? 3 : current?.severityKey === "moderate" ? 2 : 1;
    const nextRank =
      normalized.severityKey === "high" ? 3 : normalized.severityKey === "moderate" ? 2 : 1;

    if (!current || nextRank >= currentRank) {
      deduped.set(key, normalized);
    }
  });

  return Array.from(deduped.values());
}

function dedupePatientsByIdentity(patients: Patient[]) {
  const uniquePatients = new Map<string, Patient>();

  patients.forEach((patient) => {
    const identityKey = normalizeLookupValue(
      patient.patientCode ||
        patient.profileId ||
        (patient.nic !== "No NIC" ? patient.nic : "") ||
        patient.guardianNic ||
        patient.name
    );

    if (!identityKey || uniquePatients.has(identityKey)) {
      return;
    }

    uniquePatients.set(identityKey, patient);
  });

  return Array.from(uniquePatients.values());
}

function normalizeLookupValue(value: string) {
  return value.trim().toLowerCase();
}

function matchesInventoryDrugName(inventoryName: string, prescriptionDrugName: string) {
  const normalizedInventory = normalizeLookupValue(inventoryName);
  const normalizedDrug = normalizeLookupValue(prescriptionDrugName);

  if (!normalizedInventory || !normalizedDrug) {
    return false;
  }

  if (normalizedInventory === normalizedDrug) {
    return true;
  }

  return (
    normalizedInventory.startsWith(`${normalizedDrug} `) ||
    normalizedInventory.includes(` ${normalizedDrug} `) ||
    normalizedInventory.endsWith(` ${normalizedDrug}`) ||
    normalizedDrug.startsWith(`${normalizedInventory} `)
  );
}

function normalizeProfileGender(value: unknown): PatientGender {
  const raw = getString(value).toLowerCase();
  if (raw === "female") return "Female";
  if (raw === "other") return "Male";
  return "Male";
}

function toProfileName(profile: AnyRecord | null, fallback: string) {
  if (!profile) {
    return fallback;
  }

  return toName(profile, fallback);
}

function resolveIdentityFromProfile(profile: AnyRecord | null) {
  if (!profile) {
    return { value: "", label: null as "Patient NIC" | "Guardian NIC" | null };
  }

  const nic = getString(profile.nic);
  if (nic) {
    return {
      value: nic,
      label: "Patient NIC" as const,
    };
  }

  const guardianNic = getString(profile.guardian_nic);
  if (guardianNic) {
    return {
      value: guardianNic,
      label: "Guardian NIC" as const,
    };
  }

  return { value: "", label: null as "Patient NIC" | "Guardian NIC" | null };
}

function resolveIdentityField(patient: Patient) {
  if (patient.nic && patient.nic !== "No NIC") {
    return {
      value: patient.nic,
      label: "Patient NIC" as const,
    };
  }

  if (patient.guardianNic) {
    return {
      value: patient.guardianNic,
      label: "Guardian NIC" as const,
    };
  }

  return {
    value: "",
    label: null,
  };
}

function canAutoSelectFromQuery(query: string, patient: Patient) {
  const normalizedQuery = normalizeLookupValue(query);
  if (!normalizedQuery) {
    return false;
  }

  const patientNic = normalizeLookupValue(patient.nic === "No NIC" ? "" : patient.nic);
  const guardianNic = normalizeLookupValue(patient.guardianNic ?? "");
  const patientCode = normalizeLookupValue(patient.patientCode);
  const patientName = normalizeLookupValue(patient.name);

  return (
    normalizedQuery === patientCode ||
    normalizedQuery === patientNic ||
    normalizedQuery === guardianNic ||
    normalizedQuery === patientName
  );
}

export function useDoctorWorkspaceData(
  clinicalWorkflow: ClinicalWorkflow,
  visitPlanner: VisitPlannerState
) {
  const queryClient = useQueryClient();
  const patientsQuery = usePatientsQuery();
  const waitingAppointmentsQuery = useAppointmentsQuery({ status: "waiting" });
  const currentUserQuery = useCurrentUserQuery();
  const inventoryQuery = useInventoryQuery();
  const [search, setSearchState] = useState("");
  const [patientName, setPatientNameState] = useState("");
  const [patientFirstName, setPatientFirstNameState] = useState("");
  const [patientLastName, setPatientLastNameState] = useState("");
  const [patientAge, setPatientAgeState] = useState("");
  const [patientDateOfBirth, setPatientDateOfBirthState] = useState("");
  const [patientCode, setPatientCodeState] = useState("");
  const [nicNumber, setNicNumberState] = useState("");
  const [phoneNumber, setPhoneNumberState] = useState("");
  const [nicIdentityLabel, setNicIdentityLabel] = useState<"Patient NIC" | "Guardian NIC" | null>(
    null
  );
  const [guardianName, setGuardianNameState] = useState("");
  const [guardianNic, setGuardianNicState] = useState("");
  const [guardianPhone, setGuardianPhoneState] = useState("");
  const [guardianRelationship, setGuardianRelationshipState] = useState("");
  const [guardianMode, setGuardianModeState] = useState<GuardianCaptureMode>("quick");
  const [guardianDateOfBirth, setGuardianDateOfBirthState] = useState("");
  const [guardianGender, setGuardianGenderState] = useState<PatientGender>("Female");
  const [guardianSearch, setGuardianSearchState] = useState("");
  const [selectedGuardianId, setSelectedGuardianId] = useState<number | null>(null);
  const [gender, setGenderState] = useState<PatientGender>("Unspecified");
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<number | null>(null);
  const [selectedDoctorId, setSelectedDoctorId] = useState<number | null>(null);
  const [selectedAppointmentStatus, setSelectedAppointmentStatus] =
    useState<AppointmentLifecycleStatus | null>(null);
  const [explicitWorkflowType, setExplicitWorkflowType] =
    useState<ConsultationWorkflowType | null>(null);
  const [workflowStatusLabel, setWorkflowStatusLabel] = useState<string | null>(null);
  const [dispenseStatusLabel, setDispenseStatusLabel] = useState<string | null>(null);
  const [lastClinicalItemCount, setLastClinicalItemCount] = useState<number>(0);
  const [lastOutsideItemCount, setLastOutsideItemCount] = useState<number>(0);
  const [lastSavedPrescriptionId, setLastSavedPrescriptionId] = useState<number | null>(null);
  const [patientLookupNotice, setPatientLookupNotice] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<MutationState>(idleMutationState());
  const [vitalDrafts, setVitalDrafts] = useState<Record<VitalDraftKey, string>>({
    bloodPressure: "",
    heartRate: "",
    temperature: "",
    spo2: "",
  });
  const [vitalsSaveState, setVitalsSaveState] = useState<MutationState>(idleMutationState());
  const [allergyDraftName, setAllergyDraftName] = useState("");
  const [allergyDraftSeverity, setAllergyDraftSeverity] = useState<AllergySeverity>("moderate");
  const [consultationAllergies, setConsultationAllergies] = useState<
    Array<{ allergyName: string; severity: AllergySeverity; isActive: boolean }>
  >([]);
  const [allergySaveState, setAllergySaveState] = useState<MutationState>(idleMutationState());
  const rawPatients = patientsQuery.data ?? EMPTY_ROWS;
  const rawWaitingAppointments = waitingAppointmentsQuery.data ?? EMPTY_ROWS;
  const rawInventory = inventoryQuery.data ?? EMPTY_ROWS;
  const currentUserId = currentUserQuery.data?.id ?? null;
  const patientDetailsEnabled = selectedPatientId !== null;
  const patientProfileQuery = usePatientProfileQuery(
    selectedPatientId ?? "none",
    patientDetailsEnabled
  );
  const patientVitalsQuery = usePatientVitalsQuery(selectedPatientId ?? "none", patientDetailsEnabled);
  const patientAllergiesQuery = usePatientAllergiesQuery(
    selectedPatientId ?? "none",
    patientDetailsEnabled
  );

  const patients = useMemo(
    () => dedupePatientsByIdentity(normalizePatients(rawPatients, rawWaitingAppointments)),
    [rawPatients, rawWaitingAppointments]
  );
  const inventoryItems = useMemo(() => asArray(rawInventory), [rawInventory]);
  const waitingQueuePatients = useMemo(
    () => patients.filter((patient) => patient.appointmentId !== undefined),
    [patients]
  );

  const searchMatches = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return [];
    return patients.filter(
      (patient) =>
        `${patient.name} ${patient.patientCode} ${patient.nic} ${patient.guardianName ?? ""} ${patient.guardianNic ?? ""} ${patient.guardianRelationship ?? ""}`
          .toLowerCase()
          .includes(query)
    ).slice(0, 8);
  }, [patients, search]);
  const guardianSearchMatches = useMemo(() => {
    const query = guardianSearch.trim().toLowerCase();
    if (!query) return [];
    return patients
      .filter((patient) => patient.patientId !== selectedPatientId)
      .filter(
        (patient) =>
          `${patient.name} ${patient.nic} ${patient.guardianNic ?? ""} ${patient.phone ?? ""}`
            .toLowerCase()
            .includes(query)
      )
      .slice(0, 6);
  }, [guardianSearch, patients, selectedPatientId]);
  const selectedGuardian = useMemo(
    () => patients.find((patient) => patient.patientId === selectedGuardianId) ?? null,
    [patients, selectedGuardianId]
  );

  const queueState: LoadState = useMemo(() => {
    const patientRows = asArray(rawPatients);
    const waitingRows = asArray(rawWaitingAppointments);
    const queueFeedsFailed = patientsQuery.isError && waitingAppointmentsQuery.isError;

    if (
      (patientsQuery.isPending || waitingAppointmentsQuery.isPending) &&
      patientRows.length === 0 &&
      waitingRows.length === 0
    ) {
      return loadingLoadState();
    }

    if (queueFeedsFailed) {
      return errorLoadState(
        ((patientsQuery.error as unknown as ApiClientError | undefined)?.message ??
          (waitingAppointmentsQuery.error as unknown as ApiClientError | undefined)?.message ??
          "Unable to load doctor queue."
        )
      );
    }

    const hasQueueData = patientRows.length > 0 || waitingRows.length > 0;
    const partialFailure =
      patientsQuery.isError || waitingAppointmentsQuery.isError || currentUserQuery.isError;

    const partialNotice = partialFailure
      ? "Some doctor queue data failed to load and partial data is being shown."
      : null;
    const identityNotice =
      currentUserQuery.isError
        ? "Doctor identity could not be resolved from the current session. Saving may rely on appointment ownership."
        : null;
    const notice = partialNotice ?? identityNotice;

    return hasQueueData ? readyLoadState(notice) : emptyLoadState(notice);
  }, [
    currentUserQuery.isError,
    patientsQuery.error,
    patientsQuery.isError,
    patientsQuery.isPending,
    rawPatients,
    rawWaitingAppointments,
    waitingAppointmentsQuery.error,
    waitingAppointmentsQuery.isError,
    waitingAppointmentsQuery.isPending,
  ]);

  const patientVitals = useMemo<PatientVital[]>(
    () => normalizeVitals(patientVitalsQuery.data),
    [patientVitalsQuery.data]
  );
  const selectedPatientProfile = useMemo(
    () => unwrapProfileRecord(patientProfileQuery.data),
    [patientProfileQuery.data]
  );
  const patientAllergies = useMemo<AllergyAlert[]>(
    () => normalizeAllergies(patientAllergiesQuery.data),
    [patientAllergiesQuery.data]
  );
  const patientDetailsState: LoadState = useMemo(() => {
    if (!selectedPatientId) {
      return emptyLoadState();
    }

    const profileError = patientProfileQuery.isError;
    const vitalsError = patientVitalsQuery.isError;
    const allergiesError = patientAllergiesQuery.isError;
    const hasDetailData = patientVitals.length > 0 || patientAllergies.length > 0;

    if (
      (patientProfileQuery.isPending ||
        patientProfileQuery.isFetching ||
        patientVitalsQuery.isPending ||
        patientAllergiesQuery.isPending ||
        patientVitalsQuery.isFetching ||
        patientAllergiesQuery.isFetching) &&
      !hasDetailData &&
      !selectedPatientProfile
    ) {
      return loadingLoadState();
    }

    if (profileError && vitalsError && allergiesError) {
      return errorLoadState("Patient profile, vitals, and allergy details could not be loaded.");
    }

    return readyLoadState(
      profileError || vitalsError || allergiesError
        ? "Some patient clinical details could not be loaded and partial data is being shown."
        : null
    );
  }, [
    patientProfileQuery.isError,
    patientProfileQuery.isFetching,
    patientProfileQuery.isPending,
    patientAllergies.length,
    patientAllergiesQuery.isError,
    patientAllergiesQuery.isFetching,
    patientAllergiesQuery.isPending,
    patientVitals.length,
    patientVitalsQuery.isError,
    patientVitalsQuery.isFetching,
    patientVitalsQuery.isPending,
    selectedPatientProfile,
    selectedPatientId,
  ]);
  const isDoctorRole = currentUserQuery.data?.role === "doctor";
  const derivedWorkflowType: ConsultationWorkflowType =
    selectedAppointmentId !== null ? "appointment" : "walk_in";
  const workflowType: ConsultationWorkflowType =
    explicitWorkflowType ?? derivedWorkflowType;
  const hasDoctorWorkspaceAccess =
    !!currentUserQuery.data &&
    isDoctorRole &&
    hasPermission(currentUserQuery.data, "doctor.workspace.view");
  const requiresGuardianDetails = isMinorWithoutNic(patientDateOfBirth, nicNumber);
  const hasDraftPatient =
    patientName.trim().length > 0 || patientDateOfBirth.trim().length > 0 || nicNumber.trim().length > 0;
  const hasValidDraftPatient =
    patientName.trim().length > 0 &&
    patientDateOfBirth.trim().length > 0 &&
    (!requiresGuardianDetails ||
      (selectedGuardian !== null
        ? guardianRelationship.trim().length > 0
        : guardianMode === "draft"
          ? guardianName.trim().length > 0 &&
            guardianDateOfBirth.trim().length > 0 &&
            guardianRelationship.trim().length > 0
          : guardianName.trim().length > 0 &&
            guardianRelationship.trim().length > 0 &&
            (guardianNic.trim().length > 0 || guardianPhone.trim().length > 0)));
  const canSaveRecord = Boolean(
    hasDoctorWorkspaceAccess &&
      !!currentUserQuery.data &&
      hasPermission(currentUserQuery.data, "appointment.update") &&
      (selectedPatientId !== null || hasValidDraftPatient)
  );
  const isCreatingPatientInline = Boolean(selectedPatientId === null && hasDraftPatient);
  const canEditVitals = selectedPatientId !== null || isCreatingPatientInline;
  const canEditAllergies = selectedPatientId !== null || isCreatingPatientInline;
  const hasPrescriptionRows = clinicalWorkflow.rxRows.some((row) => (getNumber(row.amount) ?? 0) > 0);
  const doctorDirectDispenseItems = useMemo(() => {
    if (workflowType !== "walk_in" || !hasPrescriptionRows) {
      return [];
    }

      return clinicalWorkflow.rxRows
        .filter((row) => row.source.toLowerCase() === "clinical")
        .map((row) => {
          const quantity = getNumber(row.amount) ?? 0;
          const match = inventoryItems.find((item) => {
            const inventoryName = getString(item.name);
            return matchesInventoryDrugName(inventoryName, row.drug);
          });

        return {
          drugName: row.drug,
          quantity,
          inventoryItemId: getNumber(match?.id),
        };
      });
  }, [clinicalWorkflow.rxRows, hasPrescriptionRows, inventoryItems, workflowType]);
  const canDirectDispense =
    workflowType === "walk_in" &&
    hasPrescriptionRows &&
    doctorDirectDispenseItems.length > 0 &&
    doctorDirectDispenseItems.every(
      (item) => item.quantity > 0 && item.inventoryItemId !== null
    );
  const directDispenseDisabledReason =
    workflowType !== "walk_in"
      ? "Direct doctor dispense is available only for walk-in consultations."
      : !hasPrescriptionRows
        ? "Add prescription items before using doctor-direct dispense."
        : doctorDirectDispenseItems.some((item) => item.inventoryItemId === null)
          ? "Each clinical prescription item must match an inventory item before direct dispense."
          : null;
  const saveDisabledReason =
    currentUserQuery.isPending || currentUserQuery.isFetching
      ? "Checking doctor access before consultation save."
      : currentUserQuery.data && !isDoctorRole
        ? "Doctor role is required before saving consultations."
        : currentUserQuery.data && !hasDoctorWorkspaceAccess
          ? "Doctor workspace access is required before saving consultations."
        : currentUserQuery.data && !hasPermission(currentUserQuery.data, "appointment.update")
          ? "Appointment update permission is required before saving consultations."
        : selectedPatientId === null && !hasDraftPatient
          ? "Search for a patient or enter quick-create details before saving."
          : selectedPatientId === null && (!patientFirstName.trim() || !patientLastName.trim())
            ? "Enter the patient first and last name before saving."
            : selectedPatientId === null && !patientDateOfBirth.trim()
              ? "Enter the patient date of birth before saving."
              : selectedPatientId === null &&
                  requiresGuardianDetails &&
                  selectedGuardian === null &&
                  guardianMode === "draft" &&
                  !guardianName.trim()
                ? "Guardian full name is required before creating a guardian profile."
                : selectedPatientId === null &&
                    requiresGuardianDetails &&
                    selectedGuardian === null &&
                    guardianMode === "draft" &&
                    !guardianDateOfBirth.trim()
                  ? "Guardian date of birth is required before creating a guardian profile."
                : selectedPatientId === null &&
                    requiresGuardianDetails &&
                    !guardianRelationship.trim()
                  ? "Select the guardian relationship before saving."
                : selectedPatientId === null &&
                    requiresGuardianDetails &&
                    selectedGuardian === null &&
                    guardianMode === "quick" &&
                    !guardianName.trim()
                  ? "Guardian name or selected guardian is required for minors without a NIC."
                : selectedPatientId === null &&
                    requiresGuardianDetails &&
                    guardianMode === "quick" &&
                    !selectedGuardian?.phone &&
                    !(selectedGuardian?.nic && selectedGuardian.nic !== "No NIC") &&
                    !guardianNic.trim() &&
                    !guardianPhone.trim()
                  ? "Guardian NIC or guardian phone is required for minors without a NIC."
            : null;
  const vitalsDisabledReason =
    !canEditVitals
      ? "Search for a patient or enter quick-create details before recording vitals."
          : null;
  const allergiesDisabledReason =
    !canEditAllergies
      ? "Search for a patient or enter quick-create details before adding allergies."
          : null;

  const clearSaveState = () => {
    setSaveState((current) => (current.status === "idle" ? current : idleMutationState()));
    setWorkflowStatusLabel(null);
    setDispenseStatusLabel(null);
  };

  const clearVitalsSaveState = () => {
    setVitalsSaveState((current) => (current.status === "idle" ? current : idleMutationState()));
  };

  const clearAllergySaveState = () => {
    setAllergySaveState((current) => (current.status === "idle" ? current : idleMutationState()));
  };

  const clearPatientLookupNotice = () => {
    setPatientLookupNotice(null);
  };

  const setSearch = (value: string) => {
    clearSaveState();
    clearPatientLookupNotice();
    setSearchState(value);
  };

  const setPatientName = (value: string) => {
    clearSaveState();
    clearPatientLookupNotice();
    setPatientNameState(value);
    const parts = splitPatientNameParts(value);
    setPatientFirstNameState(parts.firstName);
    setPatientLastNameState(parts.lastName);
  };

  const setPatientFirstName = (value: string) => {
    clearSaveState();
    clearPatientLookupNotice();
    setPatientFirstNameState(value);
    setPatientNameState(`${value.trim()} ${patientLastName.trim()}`.trim());
  };

  const setPatientLastName = (value: string) => {
    clearSaveState();
    clearPatientLookupNotice();
    setPatientLastNameState(value);
    setPatientNameState(`${patientFirstName.trim()} ${value.trim()}`.trim());
  };

  const setPatientAge = (value: string) => {
    clearSaveState();
    clearPatientLookupNotice();
    setPatientAgeState(value);
  };

  const setPatientDateOfBirth = (value: string) => {
    clearSaveState();
    clearPatientLookupNotice();
    setPatientDateOfBirthState(value);
    setPatientAgeState(value ? String(toAge(value)) : "");
  };

  const setPatientCode = (value: string) => {
    clearSaveState();
    clearPatientLookupNotice();
    setPatientCodeState(value);
  };

  const setNicNumber = (value: string) => {
    clearSaveState();
    clearPatientLookupNotice();
    setNicIdentityLabel(null);
    setNicNumberState(value);
  };

  const setPhoneNumber = (value: string) => {
    clearSaveState();
    clearPatientLookupNotice();
    setPhoneNumberState(value);
  };

  const setGuardianName = (value: string) => {
    clearSaveState();
    clearPatientLookupNotice();
    setSelectedGuardianId(null);
    setGuardianNameState(value);
  };

  const setGuardianNic = (value: string) => {
    clearSaveState();
    clearPatientLookupNotice();
    setSelectedGuardianId(null);
    setGuardianNicState(value);
  };

  const setGuardianPhone = (value: string) => {
    clearSaveState();
    clearPatientLookupNotice();
    setSelectedGuardianId(null);
    setGuardianPhoneState(value);
  };

  const setGuardianRelationship = (value: string) => {
    clearSaveState();
    clearPatientLookupNotice();
    setGuardianRelationshipState(value);
  };

  const setGuardianMode = (value: GuardianCaptureMode) => {
    clearSaveState();
    clearPatientLookupNotice();
    setSelectedGuardianId(null);
    setGuardianModeState(value);
  };

  const setGuardianDateOfBirth = (value: string) => {
    clearSaveState();
    clearPatientLookupNotice();
    setSelectedGuardianId(null);
    setGuardianDateOfBirthState(value);
  };

  const setGuardianGender = (value: PatientGender) => {
    clearSaveState();
    clearPatientLookupNotice();
    setSelectedGuardianId(null);
    setGuardianGenderState(value);
  };

  const setGuardianSearch = (value: string) => {
    clearSaveState();
    clearPatientLookupNotice();
    setGuardianSearchState(value);
  };

  const handleGuardianSelect = (guardian: Patient) => {
    clearSaveState();
    clearPatientLookupNotice();
    setSelectedGuardianId(guardian.patientId ?? null);
    setGuardianModeState("quick");
    setGuardianSearchState("");
    setGuardianNameState(guardian.name);
    setGuardianNicState(guardian.nic === "No NIC" ? "" : guardian.nic);
    setGuardianPhoneState(guardian.phone ?? "");
  };

  const setGender = (value: PatientGender) => {
    clearSaveState();
    clearPatientLookupNotice();
    setGenderState(value);
  };

  const setVitalDraft = (key: VitalDraftKey, value: string) => {
    clearVitalsSaveState();
    setVitalDrafts((current) => ({ ...current, [key]: value }));
  };

  const setAllergyNameDraft = (value: string) => {
    clearAllergySaveState();
    setAllergyDraftName(value);
  };

  const setAllergySeverityDraft = (value: AllergySeverity) => {
    clearAllergySaveState();
    setAllergyDraftSeverity(value);
  };

  const clearSelectedPatientContext = () => {
    setPatientNameState("");
    setPatientFirstNameState("");
    setPatientLastNameState("");
    setPatientAgeState("");
    setPatientDateOfBirthState("");
    setPatientCodeState("");
    setNicNumberState("");
    setPhoneNumberState("");
    setNicIdentityLabel(null);
    setGuardianNameState("");
    setGuardianNicState("");
    setGuardianPhoneState("");
    setGuardianRelationshipState("");
    setGuardianModeState("quick");
    setGuardianDateOfBirthState("");
    setGuardianGenderState("Female");
    setGuardianSearchState("");
    setSelectedGuardianId(null);
    setGenderState("Unspecified");
    setSelectedPatientId(null);
    setSelectedAppointmentId(null);
    setSelectedDoctorId(null);
    setSelectedAppointmentStatus(null);
    setExplicitWorkflowType(null);
    setVitalDrafts({
      bloodPressure: "",
      heartRate: "",
      temperature: "",
      spo2: "",
    });
    setAllergyDraftName("");
    setAllergyDraftSeverity("moderate");
    setConsultationAllergies([]);
    clearVitalsSaveState();
    clearAllergySaveState();
  };

  const handlePatientSelect = useCallback((patient: Patient) => {
    const identityField = resolveIdentityField(patient);
    setSaveState((current) => (current.status === "idle" ? current : idleMutationState()));
    setPatientLookupNotice(null);
    setPatientNameState(patient.name);
    const patientNameParts = splitPatientNameParts(patient.name);
    setPatientFirstNameState(patientNameParts.firstName);
    setPatientLastNameState(patientNameParts.lastName);
    setPatientAgeState(patient.age ? String(patient.age) : "");
    setPatientDateOfBirthState(patient.dateOfBirth ?? "");
    setPatientCodeState(patient.patientCode);
    setNicNumberState(identityField.value);
    setPhoneNumberState(patient.phone ?? "");
    setNicIdentityLabel(identityField.label);
    setGuardianNameState(patient.guardianName ?? "");
    setGuardianNicState(patient.guardianNic ?? "");
    setGuardianPhoneState(patient.guardianPhone ?? "");
    setGuardianRelationshipState(patient.guardianRelationship ?? "");
    setGuardianModeState("quick");
    setGuardianDateOfBirthState("");
    setGuardianGenderState("Female");
    setGuardianSearchState("");
    setSelectedGuardianId(null);
    setGenderState(
      patient.gender === "Female" ? "Female" : patient.gender === "Male" ? "Male" : "Unspecified"
    );
    setSelectedPatientId(patient.patientId ?? null);
    setSelectedAppointmentId(patient.appointmentId ?? null);
    setSelectedDoctorId(patient.doctorId ?? null);
    setSelectedAppointmentStatus(patient.appointmentStatus ?? null);
    setExplicitWorkflowType(patient.appointmentId ? "appointment" : "walk_in");
    setSearchState("");
    setVitalsSaveState((current) => (current.status === "idle" ? current : idleMutationState()));
    setAllergySaveState((current) => (current.status === "idle" ? current : idleMutationState()));
  }, []);

  useEffect(() => {
    if (!selectedPatientId || !selectedPatientProfile) {
      return;
    }

    const resolvedName = toProfileName(selectedPatientProfile, patientName || `Patient ${selectedPatientId}`);
    const resolvedPatientCode = getString(
      selectedPatientProfile.patient_code,
      patientCode
    );
    const resolvedAge = toAge(
      selectedPatientProfile.age,
      selectedPatientProfile.date_of_birth,
      selectedPatientProfile.dob
    );
    const resolvedIdentity = resolveIdentityFromProfile(selectedPatientProfile);
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) {
        return;
      }
      setPatientNameState(resolvedName);
      const resolvedNameParts = splitPatientNameParts(resolvedName);
      setPatientFirstNameState(resolvedNameParts.firstName);
      setPatientLastNameState(resolvedNameParts.lastName);
      setPatientCodeState(resolvedPatientCode);
      setPatientAgeState(resolvedAge ? String(resolvedAge) : "");
      setPatientDateOfBirthState(
        normalizeIsoDate(selectedPatientProfile.date_of_birth ?? selectedPatientProfile.dob)
      );
      setNicNumberState(resolvedIdentity.value);
      setNicIdentityLabel(resolvedIdentity.label);
      setPhoneNumberState(getString(selectedPatientProfile.phone));
      setGuardianNameState(getString(selectedPatientProfile.guardian_name));
      setGuardianNicState(getString(selectedPatientProfile.guardian_nic));
      setGuardianPhoneState(getString(selectedPatientProfile.guardian_phone));
      setGuardianRelationshipState(getString(selectedPatientProfile.guardian_relationship));
      setGuardianModeState("quick");
      setGuardianDateOfBirthState("");
      setGuardianGenderState("Female");
      setGenderState(normalizeProfileGender(selectedPatientProfile.gender));
    });

    return () => {
      cancelled = true;
    };
  }, [patientCode, patientName, selectedPatientId, selectedPatientProfile]);

  useEffect(() => {
    if (!selectedPatientId) {
      return;
    }

    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) {
        setVitalDrafts(buildVitalDrafts(patientVitals));
      }
    });

    return () => {
      cancelled = true;
    };
  }, [patientVitals, selectedPatientId]);

  useEffect(() => {
    const query = search.trim();
    if (!query || searchMatches.length !== 1) {
      return;
    }

    const matchedPatient = searchMatches[0];
    if (!matchedPatient || !canAutoSelectFromQuery(query, matchedPatient)) {
      return;
    }

    const timer = window.setTimeout(() => {
      handlePatientSelect(matchedPatient);
    }, 180);

    return () => window.clearTimeout(timer);
  }, [handlePatientSelect, search, searchMatches]);

  const findPatientByQuery = (query: string) => {
    const normalizedQuery = normalizeLookupValue(query);
    if (!normalizedQuery) {
      return null;
    }

    const codeMatch = patients.find(
      (patient) => normalizeLookupValue(patient.patientCode) === normalizedQuery
    );
    if (codeMatch) {
      return codeMatch;
    }

    const nicMatch = patients.find((patient) => {
      const patientNic = normalizeLookupValue(patient.nic === "No NIC" ? "" : patient.nic);
      const guardianNic = normalizeLookupValue(patient.guardianNic ?? "");
      return patientNic === normalizedQuery || guardianNic === normalizedQuery;
    });
    if (nicMatch) {
      return nicMatch;
    }

    const nameMatch = patients.find(
      (patient) => normalizeLookupValue(patient.name) === normalizedQuery
    );
    if (nameMatch) {
      return nameMatch;
    }

    if (searchMatches.length === 1) {
      return searchMatches[0] ?? null;
    }

    return null;
  };

  const handleHeaderLookup = () => {
    const query = search.trim();
    const matchedPatient = findPatientByQuery(query);
    if (matchedPatient) {
      handlePatientSelect(matchedPatient);
      return;
    }

    if (!query) {
      clearPatientLookupNotice();
      return;
    }

    clearSelectedPatientContext();
    setPatientNameState(query);
    setPatientLookupNotice(
      `No patient records were found for "${query}". Enter quick-create details below and save the consultation in one step.`
    );
  };

  const refreshDoctorQueries = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.patients.list }),
      queryClient.invalidateQueries({ queryKey: ["appointments"] }),
      queryClient.invalidateQueries({ queryKey: queryKeys.patients.directory }),
      queryClient.invalidateQueries({ queryKey: queryKeys.analytics.overview }),
      queryClient.invalidateQueries({ queryKey: queryKeys.encounters.list }),
      queryClient.invalidateQueries({ queryKey: queryKeys.prescriptions.pendingDispenseQueue }),
    ]);
  };

  const handlePrintPrescription = async () => {
    if (lastSavedPrescriptionId === null || typeof window === "undefined") {
      setSaveState(errorMutationState("Save a consultation with prescription items before printing."));
      return;
    }

    try {
      const detail = await getPrescriptionById(lastSavedPrescriptionId);
      const detailRecord = asRecord(detail) ?? {};
      const detailPatient = asRecord(detailRecord.patient) ?? null;
      const itemRows = asArray(detailRecord.items ?? detailRecord.prescriptionItems ?? detailRecord.drugs);
      const diagnosisText =
        clinicalWorkflow.selectedDiseases
          .map((entry) =>
            typeof entry === "string" ? toDiagnosisPayloadEntry(entry).diagnosisName : entry.display
          )
          .filter(Boolean)
          .join(", ") || "Consultation treatment";
      const popup = window.open("", "_blank", "width=960,height=720");

      if (!popup) {
        setSaveState(errorMutationState("Allow pop-ups to print the prescription."));
        return;
      }

      const html = buildPrescriptionPrintHtml({
        prescriptionId: lastSavedPrescriptionId,
        patientName:
          getString(detailPatient?.name ?? detailRecord.patientName).trim() || patientName.trim() || "-",
        patientCode:
          getString(detailPatient?.patient_code ?? detailRecord.patientCode ?? detailRecord.patient_code).trim() ||
          patientCode.trim(),
        nic:
          getString(detailPatient?.nic ?? detailRecord.nic ?? detailRecord.patientNic ?? detailRecord.patient_nic).trim() ||
          nicNumber.trim(),
        diagnosis: diagnosisText,
        notes: visitPlanner.notes.trim() || undefined,
        doctorName: currentUserQuery.data?.name ?? "Doctor",
        issuedAt: getDateTimeLabel(
          detailRecord.issuedAt ?? detailRecord.createdAt ?? detailRecord.updatedAt ?? new Date().toISOString()
        ),
        items: itemRows.map((item, index) => ({
          name: getString(item.drugName ?? item.name, `Drug ${index + 1}`),
          dose: getString(item.dose, "-"),
          frequency: getString(item.frequency ?? item.terms ?? item.duration, "-"),
          quantity: getString(item.quantity ?? item.amount, "-"),
          source: getString(item.source ?? item.drugSource, "clinical"),
        })),
      });

      popup.document.open();
      popup.document.write(html);
      popup.document.close();
      popup.focus();
      window.setTimeout(() => {
        popup.print();
      }, 250);
    } catch (error) {
      setSaveState(
        errorMutationState(
          (error as ApiClientError)?.message ?? "Unable to load prescription details for printing."
        )
      );
    }
  };

  const refreshSelectedPatientDetails = async () => {
    if (!selectedPatientId) {
      return;
    }

    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.patients.profile(selectedPatientId) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.patients.vitals(selectedPatientId) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.patients.allergies(selectedPatientId) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.patients.timeline(selectedPatientId) }),
    ]);
  };

  const handleSaveRecord = async (saveMode: "standard" | "doctor_direct" = "standard") => {
    if (!canSaveRecord) {
      setSaveState(
        errorMutationState(
          saveDisabledReason ?? "Doctor permission is required before saving a consultation."
        )
      );
      return;
    }

    const doctorId = selectedDoctorId ?? currentUserId;
    if (!doctorId) {
      setSaveState(errorMutationState("Doctor identity missing in token or appointment context."));
      return;
    }

    try {
      setSaveState(pendingMutationState());
      const parsedVitals = parseVitalDrafts(vitalDrafts);
      const consultationAllergyPayload = buildConsultationAllergyPayload(
        consultationAllergies,
        allergyDraftName,
        allergyDraftSeverity
      );
      if (
        parsedVitals.bloodPressureText &&
        (parsedVitals.bpSystolic === undefined || parsedVitals.bpDiastolic === undefined)
      ) {
        setSaveState(
          errorMutationState("Blood pressure must use systolic/diastolic format, like 120/80.")
        );
        return;
      }

      if (saveMode === "doctor_direct" && !canDirectDispense) {
        setSaveState(
          errorMutationState(
            directDispenseDisabledReason ??
              "Doctor-direct dispense is not ready for this consultation."
          )
        );
        return;
      }

      const checkedAt = new Date().toISOString();
      const payload = {
        workflowType,
        ...(workflowType === "appointment" && selectedAppointmentId !== null
          ? { appointmentId: selectedAppointmentId }
          : {}),
        ...(selectedPatientId === null &&
        requiresGuardianDetails &&
        selectedGuardian === null &&
        guardianMode === "draft"
          ? {
              guardianDraft: {
                name: guardianName.trim(),
                dateOfBirth: guardianDateOfBirth.trim(),
                ...(guardianNic.trim() ? { nic: guardianNic.trim() } : {}),
                ...(guardianGender === "Male"
                  ? { gender: "male" as const }
                  : guardianGender === "Female"
                    ? { gender: "female" as const }
                    : {}),
                ...(guardianPhone.trim() ? { phone: guardianPhone.trim() } : {}),
              },
            }
          : {}),
        ...(selectedPatientId !== null
          ? { patientId: selectedPatientId }
          : {
              patientDraft: {
                name: patientName.trim(),
                dateOfBirth: patientDateOfBirth.trim(),
                ...(nicNumber.trim() ? { nic: nicNumber.trim() } : {}),
                ...(gender === "Male"
                  ? { gender: "male" as const }
                  : gender === "Female"
                    ? { gender: "female" as const }
                    : {}),
                ...(phoneNumber.trim() ? { phone: phoneNumber.trim() } : {}),
                ...(requiresGuardianDetails
                  ? selectedGuardian?.patientId && selectedGuardian.familyId
                    ? {
                        guardianPatientId: selectedGuardian.patientId,
                        ...(guardianRelationship.trim()
                          ? { guardianRelationship: guardianRelationship.trim() }
                          : {}),
                      }
                    : guardianMode === "draft"
                      ? {
                          ...(guardianRelationship.trim()
                            ? { guardianRelationship: guardianRelationship.trim() }
                            : {}),
                        }
                      : {
                          guardianName: (selectedGuardian?.name ?? guardianName).trim(),
                          ...((guardianNic.trim()
                            ? {
                                guardianNic: (
                                  selectedGuardian?.nic === "No NIC"
                                    ? ""
                                    : selectedGuardian?.nic ?? guardianNic
                                ).trim(),
                              }
                            : {})),
                          ...((guardianPhone.trim()
                            ? {
                                guardianPhone: (selectedGuardian?.phone ?? guardianPhone).trim(),
                              }
                            : {})),
                          ...(guardianRelationship.trim()
                            ? { guardianRelationship: guardianRelationship.trim() }
                            : {}),
                        }
                  : {}),
              },
            }),
        checkedAt,
        reason:
          workflowType === "appointment"
            ? "Appointment consultation"
            : "Walk-in consultation",
        priority: "normal" as const,
        ...(visitPlanner.notes.trim() ? { notes: visitPlanner.notes.trim() } : {}),
        ...(visitPlanner.notes.trim() ? { clinicalSummary: visitPlanner.notes.trim() } : {}),
        diagnoses: clinicalWorkflow.selectedDiseases.map((diagnosis) => ({
          ...toDiagnosisPayloadEntry(diagnosis),
          ...(clinicalWorkflow.persistedConditionDiagnoses.has(
            typeof diagnosis === "string" ? diagnosis : diagnosis.code
          )
            ? { persistAsCondition: true }
            : {}),
        })),
        ...(clinicalWorkflow.selectedTests.length > 0
          ? {
              tests: clinicalWorkflow.selectedTests.map((test) => ({
                testName: typeof test === "string" ? test : test.display,
                status: "ordered" as const,
              })),
            }
          : {}),
        ...(parsedVitals.hasAnySupportedVital
          ? {
              vitals: {
                ...(parsedVitals.bpSystolic !== undefined ? { bpSystolic: parsedVitals.bpSystolic } : {}),
                ...(parsedVitals.bpDiastolic !== undefined ? { bpDiastolic: parsedVitals.bpDiastolic } : {}),
                ...(parsedVitals.heartRate !== undefined ? { heartRate: parsedVitals.heartRate } : {}),
                ...(parsedVitals.temperatureC !== undefined
                  ? { temperatureC: parsedVitals.temperatureC }
                  : {}),
                ...(parsedVitals.spo2 !== undefined ? { spo2: parsedVitals.spo2 } : {}),
              },
            }
          : {}),
        ...(consultationAllergyPayload.length > 0 ? { allergies: consultationAllergyPayload } : {}),
        ...(clinicalWorkflow.rxRows.length > 0
          ? {
              prescription: {
                items: clinicalWorkflow.rxRows
                  .map((row) => ({
                    drugName: row.drug,
                    dose: row.dose,
                    frequency: row.terms,
                    duration: "As prescribed",
                    quantity: getNumber(row.amount) ?? 0,
                    source: (
                      row.source.toLowerCase() === "outside" ? "outside" : "clinical"
                    ) as "outside" | "clinical",
                  }))
                  .filter((row) => row.quantity > 0),
              },
            }
          : {}),
        ...(saveMode === "doctor_direct" && canDirectDispense
          ? {
              dispense: {
                mode: "doctor_direct" as const,
                dispensedAt: new Date().toISOString(),
                notes: "Handed directly by doctor",
                items: doctorDirectDispenseItems
                  .filter((item) => item.inventoryItemId !== null && item.quantity > 0)
                  .map((item) => ({
                    inventoryItemId: item.inventoryItemId as number,
                    quantity: item.quantity,
                  })),
              },
            }
          : {}),
      };

      const response = await saveConsultation(payload);
      const resolvedPatientId = getResolvedPatientId(response);
      const resolvedPrescriptionId = getResolvedPrescriptionId(response);
      if (resolvedPatientId !== null) {
        setSelectedPatientId(resolvedPatientId);
      }
      setLastSavedPrescriptionId(resolvedPrescriptionId);
      setSelectedDoctorId(doctorId);
      const responseRecord = asRecord(response);
      const responseWorkflowType = normalizeWorkflowType(
        responseRecord?.workflow_type ?? responseRecord?.workflowType
      );
      const responseAppointmentId = getNumber(
        responseRecord?.appointment_id ?? responseRecord?.appointmentId
      );
      const responseWorkflowStatus = getString(
        responseRecord?.workflow_status ?? responseRecord?.workflowStatus
      );
      const responseDispenseStatus = getString(
        responseRecord?.dispense_status ?? responseRecord?.dispenseStatus
      );
      const responseClinicalItemCount = Math.max(
        0,
        getNumber(responseRecord?.clinical_item_count ?? responseRecord?.clinicalItemCount) ?? 0
      );
      const responseOutsideItemCount = Math.max(
        0,
        getNumber(responseRecord?.outside_item_count ?? responseRecord?.outsideItemCount) ?? 0
      );
      setLastClinicalItemCount(responseClinicalItemCount);
      setLastOutsideItemCount(responseOutsideItemCount);
      if (responseWorkflowType) {
        setExplicitWorkflowType(responseWorkflowType);
        if (responseWorkflowType === "walk_in") {
          setSelectedAppointmentId(null);
          setSelectedAppointmentStatus(null);
        } else if (responseAppointmentId !== null) {
          setSelectedAppointmentId(responseAppointmentId);
        }
      }
      setWorkflowStatusLabel(responseWorkflowStatus || null);
      setDispenseStatusLabel(responseDispenseStatus || null);
      setConsultationAllergies([]);
      setAllergyDraftName("");
      setAllergyDraftSeverity("moderate");
      const prescriptionSummary =
        responseClinicalItemCount > 0 && responseOutsideItemCount > 0
          ? `${responseClinicalItemCount} clinical and ${responseOutsideItemCount} outside item(s) saved.`
          : responseClinicalItemCount > 0
            ? `${responseClinicalItemCount} clinical item(s) saved.`
            : responseOutsideItemCount > 0
              ? `${responseOutsideItemCount} outside item(s) saved.`
              : "";
      const successMessage =
        responseClinicalItemCount === 0 && responseOutsideItemCount > 0
          ? `Consultation completed. Outside prescription does not require clinic dispensing. ${prescriptionSummary}`.trim()
          : responseWorkflowStatus === "doctor_completed"
            ? `Consultation saved. Doctor step is complete and clinical dispensing is pending. ${prescriptionSummary}`.trim()
            : responseWorkflowStatus === "ready_for_dispense"
              ? `Consultation saved. Clinical items are ready for dispensing. ${prescriptionSummary}`.trim()
              : responseWorkflowStatus === "completed"
                ? `Consultation completed successfully. ${prescriptionSummary}`.trim()
                : `Consultation saved successfully. ${prescriptionSummary}`.trim();
      setSaveState(successMutationState(successMessage));
      await refreshDoctorQueries();
      if (responseDispenseStatus === "completed") {
        await queryClient.invalidateQueries({ queryKey: queryKeys.inventory.list });
      }
      if (resolvedPatientId !== null) {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: queryKeys.patients.profile(resolvedPatientId) }),
          queryClient.invalidateQueries({ queryKey: queryKeys.patients.vitals(resolvedPatientId) }),
          queryClient.invalidateQueries({ queryKey: queryKeys.patients.allergies(resolvedPatientId) }),
          queryClient.invalidateQueries({ queryKey: queryKeys.patients.timeline(resolvedPatientId) }),
        ]);
      } else if (selectedPatientId) {
        await refreshSelectedPatientDetails();
      }
    } catch (error) {
      setSaveState(
        errorMutationState((error as ApiClientError)?.message ?? "Failed to save consultation.")
      );
    }
  };

  const handleSaveVitals = async () => {
    if (!canEditVitals) {
      setVitalsSaveState(
        errorMutationState(
          vitalsDisabledReason ?? "Search for a patient or enter quick-create details before recording vitals."
        )
      );
      return;
    }

    const parsedVitals = parseVitalDrafts(vitalDrafts);

    if (!parsedVitals.hasAnySupportedVital) {
      setVitalsSaveState(
        successMutationState("Vitals captured locally. They will be sent when you save the consultation.")
      );
      return;
    }

    if (
      parsedVitals.bloodPressureText &&
      (parsedVitals.bpSystolic === undefined || parsedVitals.bpDiastolic === undefined)
    ) {
      setVitalsSaveState(
        errorMutationState("Blood pressure must use systolic/diastolic format, like 120/80.")
      );
      return;
    }

    setVitalsSaveState(
      successMutationState("Vitals captured locally. They will be sent when you save the consultation.")
    );
  };

  const handleAddOrUpdateAllergy = async () => {
    if (!canEditAllergies) {
      setAllergySaveState(
        errorMutationState(
          allergiesDisabledReason ??
            "Search for a patient or enter quick-create details before adding allergies."
        )
      );
      return;
    }

    const name = allergyDraftName.trim();
    if (!name) {
      setAllergySaveState(errorMutationState("Enter an allergy name before saving."));
      return;
    }

    setConsultationAllergies((current) => {
      const next = current.filter(
        (entry) => normalizeLookupValue(entry.allergyName) !== normalizeLookupValue(name)
      );
      return [...next, { allergyName: name, severity: allergyDraftSeverity, isActive: true }];
    });
    setAllergyDraftName("");
    setAllergySaveState(successMutationState("Allergy added to the consultation draft."));
  };

  const handleEditAllergy = (allergy: AllergyAlert) => {
    clearAllergySaveState();
    setAllergyDraftName(allergy.name);
    setAllergyDraftSeverity(allergy.severityKey);
  };

  const handleClearAllergyDraft = () => {
    clearAllergySaveState();
    setAllergyDraftName("");
    setAllergyDraftSeverity("moderate");
  };

  const saveFeedback = getMutationFeedback(saveState, {
    pendingMessage: "Saving consultation...",
    errorMessage: "Failed to save consultation.",
  });
  const vitalsFeedback = getMutationFeedback(vitalsSaveState, {
    pendingMessage: "Capturing vitals...",
    errorMessage: "Failed to prepare vitals.",
  });
  const allergyFeedback = getMutationFeedback(allergySaveState, {
    pendingMessage: "Adding allergy...",
    errorMessage: "Failed to prepare allergy.",
  });
  const editingAllergyName = null;
  const transitionState = idleMutationState();
  const transitionFeedback = null;
  const canTransitionAppointments = false;
  const handleSaveAndComplete = async () => {
    await handleSaveRecord("doctor_direct");
  };
  const visitActionLabel =
    workflowType === "walk_in" && hasPrescriptionRows
      ? "Save Or Complete Walk-In"
      : "Save Consultation";
  const visitModeLabel = selectedPatientId !== null ? "Existing Patient" : isCreatingPatientInline ? "Quick Create" : "No Selection";
  const transitionDisabledReason: string | null =
    "Consultation save now handles visit creation and reuse automatically.";

  return {
    search,
    setSearch,
    patientName,
    setPatientName,
    patientFirstName,
    setPatientFirstName,
    patientLastName,
    setPatientLastName,
    patientAge,
    setPatientAge,
    patientDateOfBirth,
    setPatientDateOfBirth,
    patientCode,
    setPatientCode,
    patientLookupNotice,
    nicNumber,
    nicIdentityLabel,
    setNicNumber,
    phoneNumber,
    setPhoneNumber,
    guardianName,
    setGuardianName,
    guardianNic,
    setGuardianNic,
    guardianPhone,
    setGuardianPhone,
    guardianRelationship,
    setGuardianRelationship,
    guardianMode,
    setGuardianMode,
    guardianDateOfBirth,
    setGuardianDateOfBirth,
    guardianGender,
    setGuardianGender,
    guardianSearch,
    setGuardianSearch,
    guardianSearchMatches,
    selectedGuardian,
    handleGuardianSelect,
    gender,
    setGender,
    isCreatingPatientInline,
    requiresGuardianDetails,
    handleSearchCommit: handleHeaderLookup,
    searchMatches,
    waitingQueuePatients,
    selectedPatientProfileId: selectedPatientId ? String(selectedPatientId) : null,
    selectedPatientLabel: patientName || null,
    patientVitals: selectedPatientId ? patientVitals : [],
    patientAllergies: selectedPatientId ? patientAllergies : [],
    consultationAllergies,
    vitalDrafts,
    setVitalDraft,
    canEditVitals,
    vitalsDisabledReason,
    vitalsSaveState,
    vitalsFeedback,
    handleSaveVitals,
    allergyDraftName,
    setAllergyNameDraft,
    allergyDraftSeverity,
    setAllergySeverityDraft,
    editingAllergyName,
    handleEditAllergy,
    handleClearAllergyDraft,
    canEditAllergies,
    allergiesDisabledReason,
    allergySaveState,
    allergyFeedback,
    handleAddOrUpdateAllergy,
    removeConsultationAllergy: (allergyName: string) =>
      setConsultationAllergies((current) =>
        current.filter(
          (entry) => normalizeLookupValue(entry.allergyName) !== normalizeLookupValue(allergyName)
        )
      ),
    queueState,
    patientDetailsState,
    canSaveRecord,
    canTransitionAppointments,
    visitActionLabel,
    visitModeLabel,
    saveDisabledReason,
    transitionDisabledReason,
    selectedAppointmentStatus,
    workflowType,
    workflowStatusLabel,
    dispenseStatusLabel,
    lastClinicalItemCount,
    lastOutsideItemCount,
    canPrintPrescription: lastSavedPrescriptionId !== null,
    canDirectDispense,
    directDispenseDisabledReason,
    saveState,
    saveFeedback,
    transitionState,
    transitionFeedback,
    handlePatientSelect,
    handleStartConsultation: handleSaveRecord,
    handleSaveRecord,
    handleSaveAndComplete,
    handlePrintPrescription,
    reload: () => {
      void Promise.all([
        refreshDoctorQueries(),
        queryClient.invalidateQueries({ queryKey: queryKeys.auth.currentUser }),
        ...(selectedPatientId
          ? [refreshSelectedPatientDetails()]
          : []),
      ]);
    },
  };
}
