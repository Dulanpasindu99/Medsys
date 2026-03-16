import { useMemo } from "react";
import {
  emptyLoadState,
  errorLoadState,
  loadingLoadState,
  readyLoadState,
  type LoadState,
} from "../../../lib/async-state";
import type { ApiRecord } from "../../../lib/api-client";
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

function asRecord(value: unknown): ApiRecord | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as ApiRecord) : null;
}

function getMemberRecords(value: unknown): ApiRecord[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((entry): entry is ApiRecord => !!asRecord(entry));
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

function toName(record: ApiRecord | null, fallback: string) {
  const direct = toString(record?.name ?? record?.fullName).trim();
  if (direct) return direct;
  const firstName = toString(record?.firstName ?? record?.first_name).trim();
  const lastName = toString(record?.lastName ?? record?.last_name).trim();
  const combined = `${firstName} ${lastName}`.trim();
  return combined || fallback;
}

function toAge(record: ApiRecord | null) {
  const directAge = toNumber(record?.age);
  if (directAge !== null) return directAge;
  const dob = toString(record?.dateOfBirth ?? record?.date_of_birth ?? record?.dob);
  if (!dob) return 0;
  const parsed = new Date(`${dob}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) return 0;
  const today = new Date();
  let years = today.getUTCFullYear() - parsed.getUTCFullYear();
  const beforeBirthday =
    today.getUTCMonth() < parsed.getUTCMonth() ||
    (today.getUTCMonth() === parsed.getUTCMonth() &&
      today.getUTCDate() < parsed.getUTCDate());
  if (beforeBirthday) years -= 1;
  return years;
}

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

function mapTimelineEntries(rawTimeline: unknown, rawVitals: unknown): PatientTimelineEntry[] {
  const timeline = (Array.isArray(rawTimeline) ? rawTimeline : []).flatMap((entry) => {
    const row = asRecord(entry);
    if (!row) return [];
    return [
      {
        date: toString(row.date ?? row.recordedAt ?? row.createdAt, new Date().toISOString()),
        title: toString(row.title ?? row.event ?? row.noteTitle, "Clinical update"),
        description: toString(row.description ?? row.notes ?? row.note, "No additional notes."),
        kind: "general" as const,
        tags: [toString(row.type ?? row.category)].filter(Boolean),
        value: toString(row.value),
      },
    ];
  });

  const vitals = (Array.isArray(rawVitals) ? rawVitals : []).flatMap((entry) => {
    const row = asRecord(entry);
    if (!row) return [];
    return [
      {
        date: toString(row.recordedAt ?? row.date ?? row.createdAt, new Date().toISOString()),
        title: toString(row.label ?? row.name ?? row.vitalName ?? "Vitals"),
        description: "Vital measurement recorded",
        kind: "bp" as const,
        value: toString(row.value ?? row.reading ?? row.result, "--"),
      },
    ];
  });

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
    () => profileQuery.data ?? null,
    [profileQuery.data]
  );
  const patientRows = useMemo(() => patientsQuery.data ?? [], [patientsQuery.data]);
  const patientRow = useMemo(
    () =>
      patientRows.find((row) => toNumber(row.id ?? row.patientId ?? row.patient_id) === numericId) ?? null,
    [numericId, patientRows]
  );
  const familyRecord = useMemo(
    () => familyQuery.data ?? asRecord(profileRecord?.family) ?? null,
    [familyQuery.data, profileRecord?.family]
  );
  const conditions = useMemo(
    () =>
      (conditionsQuery.data ?? [])
        .map((row) => toString(row.name ?? row.conditionName ?? row.diagnosisName))
        .filter(Boolean),
    [conditionsQuery.data]
  );
  const allergies = useMemo(
    () =>
      (allergiesQuery.data ?? [])
        .map((row) => toString(row.name ?? row.allergyName ?? row.allergen))
        .filter(Boolean),
    [allergiesQuery.data]
  );
  const timeline = useMemo(
    () => mapTimelineEntries(timelineQuery.data, vitalsQuery.data),
    [timelineQuery.data, vitalsQuery.data]
  );

  const totalProfiles = patientRows.length;
  const hasResolvedProfile = profileRecord !== null || patientRow !== null;
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
      name: toName((profileRecord as ApiRecord | null) ?? (patientRow as ApiRecord | null), `Patient ${numericId}`),
      patientCode: toString(
        profileRecord?.patientCode ??
          profileRecord?.patient_code ??
          patientRow?.patientCode ??
          patientRow?.patient_code,
        ""
      ),
      nic: toString(profileRecord?.nic ?? patientRow?.nic, "No NIC"),
      guardianName: toString(
        profileRecord?.guardianName ??
          profileRecord?.guardian_name ??
          patientRow?.guardianName ??
          patientRow?.guardian_name,
        ""
      ) || undefined,
      guardianNic: toString(
        profileRecord?.guardianNic ??
          profileRecord?.guardian_nic ??
          patientRow?.guardianNic ??
          patientRow?.guardian_nic,
        ""
      ) || undefined,
      guardianPhone: toString(
        profileRecord?.guardianPhone ??
          profileRecord?.guardian_phone ??
          patientRow?.guardianPhone ??
          patientRow?.guardian_phone,
        ""
      ) || undefined,
      guardianRelationship: toString(
        profileRecord?.guardianRelationship ??
          profileRecord?.guardian_relationship ??
          patientRow?.guardianRelationship ??
          patientRow?.guardian_relationship,
        ""
      ) || undefined,
      age: toAge((profileRecord as ApiRecord | null) ?? (patientRow as ApiRecord | null)),
      gender: toGender(profileRecord?.gender ?? patientRow?.gender),
      mobile: toString(
        profileRecord?.mobile ?? patientRow?.mobile ?? patientRow?.phone,
        "Not provided"
      ),
      family: {
        assigned: Boolean(
          toString(familyRecord?.name ?? familyRecord?.familyName) ||
            getMemberRecords(familyRecord?.members).length
        ),
        name: toString(familyRecord?.name ?? familyRecord?.familyName, "Unassigned"),
        members: getMemberRecords(familyRecord?.members)
          .map((row) => toString(row.name ?? row.memberName))
          .filter(Boolean),
      },
      conditions,
      allergies,
      firstSeen: toString(
        profileRecord?.firstSeen ?? profileRecord?.createdAt ?? patientRow?.createdAt,
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
