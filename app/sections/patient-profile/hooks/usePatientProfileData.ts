import { useEffect, useMemo, useState } from "react";
import {
  getPatientFamily,
  getPatientProfile,
  listPatientAllergies,
  listPatientConditions,
  listPatientTimeline,
  listPatientVitals,
  listPatients,
} from "../../../lib/api-client";
import type { PatientProfileRecord, PatientTimelineEntry } from "../types";

type AnyRecord = Record<string, unknown>;

function asRecord(value: unknown): AnyRecord | null {
  return value && typeof value === "object" ? (value as AnyRecord) : null;
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

function toString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() && !Number.isNaN(Number(value))) return Number(value);
  return null;
}

function toGender(value: unknown): "Male" | "Female" | "Other" {
  const raw = toString(value).toLowerCase();
  if (raw === "female") return "Female";
  if (raw === "other") return "Other";
  return "Male";
}

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

function mapTimelineEntries(rawTimeline: unknown, rawVitals: unknown): PatientTimelineEntry[] {
  const timeline = asArray(rawTimeline).map((row) => ({
    date: toString(row.date ?? row.recordedAt ?? row.createdAt, new Date().toISOString()),
    title: toString(row.title ?? row.event ?? row.noteTitle, "Clinical update"),
    description: toString(row.description ?? row.notes ?? row.note, "No additional notes."),
    kind: "general" as const,
    tags: [toString(row.type ?? row.category)].filter(Boolean),
    value: toString(row.value),
  }));

  const vitals = asArray(rawVitals).map((row) => ({
    date: toString(row.recordedAt ?? row.date ?? row.createdAt, new Date().toISOString()),
    title: toString(row.label ?? row.name ?? row.vitalName ?? "Vitals"),
    description: "Vital measurement recorded",
    kind: "bp" as const,
    value: toString(row.value ?? row.reading ?? row.result, "--"),
  }));

  return [...timeline, ...vitals].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function usePatientProfileData(profileId: string) {
  const numericId = Number(profileId);
  const hasInvalidProfileId = Number.isNaN(numericId);
  const [profile, setProfile] = useState<PatientProfileRecord | null>(null);
  const [totalProfiles, setTotalProfiles] = useState(0);
  const [syncError, setSyncError] = useState<string | null>(null);

  useEffect(() => {
    if (hasInvalidProfileId) {
      return;
    }

    let active = true;
    const load = async () => {
      try {
        const [profileResponse, familyResponse, allergiesResponse, conditionsResponse, timelineResponse, vitalsResponse, patientsResponse] =
          await Promise.all([
            getPatientProfile(numericId).catch(() => ({})),
            getPatientFamily(numericId).catch(() => ({})),
            listPatientAllergies(numericId).catch(() => []),
            listPatientConditions(numericId).catch(() => []),
            listPatientTimeline(numericId).catch(() => []),
            listPatientVitals(numericId).catch(() => []),
            listPatients().catch(() => []),
          ]);

        if (!active) return;

        const profileRecord = asRecord(profileResponse) ?? {};
        const patientRows = asArray(patientsResponse);
        setTotalProfiles(patientRows.length);
        const patientRow =
          patientRows.find((row) => toNumber(row.id ?? row.patientId ?? row.patient_id) === numericId) ?? {};
        const familyRecord = asRecord(familyResponse) ?? asRecord(profileRecord.family) ?? {};

        const conditions = asArray(conditionsResponse)
          .map((row) => toString(row.name ?? row.conditionName ?? row.diagnosisName))
          .filter(Boolean);
        const allergies = asArray(allergiesResponse)
          .map((row) => toString(row.name ?? row.allergyName ?? row.allergen))
          .filter(Boolean);
        const timeline = mapTimelineEntries(timelineResponse, vitalsResponse);

        const nextProfile: PatientProfileRecord = {
          id: String(numericId),
          name: toString(profileRecord.name ?? patientRow.name ?? patientRow.fullName, `Patient ${numericId}`),
          nic: toString(profileRecord.nic ?? patientRow.nic, "N/A"),
          age: toNumber(profileRecord.age ?? patientRow.age) ?? 0,
          gender: toGender(profileRecord.gender ?? patientRow.gender),
          mobile: toString(profileRecord.mobile ?? patientRow.mobile ?? patientRow.phone, "Not provided"),
          family: {
            assigned: Boolean(
              toString(familyRecord.name ?? familyRecord.familyName) ||
                asArray(familyRecord.members).length
            ),
            name: toString(familyRecord.name ?? familyRecord.familyName, "Unassigned"),
            members: asArray(familyRecord.members)
              .map((row) => toString(row.name ?? row.memberName))
              .filter(Boolean),
          },
          conditions,
          allergies,
          firstSeen: toString(profileRecord.firstSeen ?? profileRecord.createdAt ?? patientRow.createdAt, new Date().toISOString()),
          timeline,
        };

        setProfile(nextProfile);
        setSyncError(null);
      } catch (error) {
        if (!active) return;
        setSyncError((error as Error)?.message ?? "Unable to load patient profile.");
        setProfile(null);
        setTotalProfiles(0);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [hasInvalidProfileId, numericId]);

  const timeline = useMemo(
    () =>
      profile
        ? [...profile.timeline].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        : [],
    [profile]
  );

  if (hasInvalidProfileId) {
    return {
      profile: null,
      timeline: [] as PatientTimelineEntry[],
      totalProfiles: 0,
      formatDate,
      syncError: "Invalid patient profile reference.",
    };
  }

  return { profile, timeline, totalProfiles, formatDate, syncError };
}
