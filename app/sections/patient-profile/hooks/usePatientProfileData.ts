import { useMemo } from "react";
import {
  emptyLoadState,
  errorLoadState,
  loadingLoadState,
  readyLoadState,
  type LoadState,
} from "../../../lib/async-state";
import {
  usePatientAllergiesQuery,
  usePatientConditionsQuery,
  usePatientFamilyQuery,
  usePatientProfileQuery,
  usePatientTimelineQuery,
  usePatientsQuery,
  usePatientVitalsQuery,
} from "../../../lib/query-hooks";
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
  const enabled = !hasInvalidProfileId;

  const profileQuery = usePatientProfileQuery(numericId, enabled);
  const familyQuery = usePatientFamilyQuery(numericId, enabled);
  const allergiesQuery = usePatientAllergiesQuery(numericId, enabled);
  const conditionsQuery = usePatientConditionsQuery(numericId, enabled);
  const timelineQuery = usePatientTimelineQuery(numericId, enabled);
  const vitalsQuery = usePatientVitalsQuery(numericId, enabled);
  const patientsQuery = usePatientsQuery(enabled);

  const profileRecord = useMemo(
    () => asRecord(profileQuery.data) ?? {},
    [profileQuery.data]
  );
  const patientRows = useMemo(
    () => asArray(patientsQuery.data),
    [patientsQuery.data]
  );
  const patientRow = useMemo(
    () =>
      patientRows.find((row) => toNumber(row.id ?? row.patientId ?? row.patient_id) === numericId) ?? {},
    [numericId, patientRows]
  );
  const familyRecord = useMemo(
    () => asRecord(familyQuery.data) ?? asRecord(profileRecord.family) ?? {},
    [familyQuery.data, profileRecord.family]
  );
  const conditions = useMemo(
    () =>
      asArray(conditionsQuery.data)
        .map((row) => toString(row.name ?? row.conditionName ?? row.diagnosisName))
        .filter(Boolean),
    [conditionsQuery.data]
  );
  const allergies = useMemo(
    () =>
      asArray(allergiesQuery.data)
        .map((row) => toString(row.name ?? row.allergyName ?? row.allergen))
        .filter(Boolean),
    [allergiesQuery.data]
  );
  const timeline = useMemo(
    () => mapTimelineEntries(timelineQuery.data, vitalsQuery.data),
    [timelineQuery.data, vitalsQuery.data]
  );

  const totalProfiles = patientRows.length;
  const hasResolvedProfile =
    Object.keys(profileRecord).length > 0 || Object.keys(patientRow).length > 0;
  const primaryFailureCount = [profileQuery.status, patientsQuery.status].filter(
    (status) => status === "error"
  ).length;
  const detailFailureCount = [
    familyQuery.status,
    allergiesQuery.status,
    conditionsQuery.status,
    timelineQuery.status,
    vitalsQuery.status,
  ].filter((status) => status === "error").length;
  const isPending =
    profileQuery.isPending ||
    familyQuery.isPending ||
    allergiesQuery.isPending ||
    conditionsQuery.isPending ||
    timelineQuery.isPending ||
    vitalsQuery.isPending ||
    patientsQuery.isPending;
  const isFetching =
    profileQuery.isFetching ||
    familyQuery.isFetching ||
    allergiesQuery.isFetching ||
    conditionsQuery.isFetching ||
    timelineQuery.isFetching ||
    vitalsQuery.isFetching ||
    patientsQuery.isFetching;

  const profile = useMemo<PatientProfileRecord | null>(() => {
    if (!hasResolvedProfile) {
      return null;
    }

    return {
      id: String(numericId),
      name: toString(profileRecord.name ?? patientRow.name ?? patientRow.fullName, `Patient ${numericId}`),
      nic: toString(profileRecord.nic ?? patientRow.nic, "N/A"),
      age: toNumber(profileRecord.age ?? patientRow.age) ?? 0,
      gender: toGender(profileRecord.gender ?? patientRow.gender),
      mobile: toString(profileRecord.mobile ?? patientRow.mobile ?? patientRow.phone, "Not provided"),
      family: {
        assigned: Boolean(
          toString(familyRecord.name ?? familyRecord.familyName) || asArray(familyRecord.members).length
        ),
        name: toString(familyRecord.name ?? familyRecord.familyName, "Unassigned"),
        members: asArray(familyRecord.members)
          .map((row) => toString(row.name ?? row.memberName))
          .filter(Boolean),
      },
      conditions,
      allergies,
      firstSeen: toString(
        profileRecord.firstSeen ?? profileRecord.createdAt ?? patientRow.createdAt,
        new Date().toISOString()
      ),
      timeline,
    };
  }, [
    allergies,
    conditions,
    familyRecord,
    hasResolvedProfile,
    numericId,
    patientRow,
    profileRecord,
    timeline,
  ]);

  let loadState: LoadState;
  if (hasInvalidProfileId) {
    loadState = errorLoadState("Invalid patient profile reference.");
  } else if ((isPending || isFetching) && !hasResolvedProfile) {
    loadState = loadingLoadState();
  } else if (primaryFailureCount === 2) {
    const firstError = profileQuery.error ?? patientsQuery.error;
    loadState = errorLoadState(
      (firstError as { message?: string } | undefined)?.message ?? "Unable to load patient profile."
    );
  } else if (!hasResolvedProfile) {
    loadState = emptyLoadState();
  } else {
    loadState = readyLoadState(
      detailFailureCount || primaryFailureCount
        ? "Some profile details could not be loaded and fallback data is being shown."
        : null
    );
  }

  const reload = () => {
    void Promise.all([
      profileQuery.refetch(),
      familyQuery.refetch(),
      allergiesQuery.refetch(),
      conditionsQuery.refetch(),
      timelineQuery.refetch(),
      vitalsQuery.refetch(),
      patientsQuery.refetch(),
    ]);
  };

  return {
    profile,
    timeline,
    totalProfiles,
    formatDate,
    loadState,
    syncError: loadState.error,
    reload,
  };
}
