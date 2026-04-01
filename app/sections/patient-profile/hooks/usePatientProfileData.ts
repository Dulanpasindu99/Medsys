import { useMemo } from "react";
import {
  emptyLoadState,
  errorLoadState,
  loadingLoadState,
  readyLoadState,
  type LoadState,
} from "../../../lib/async-state";
import type { ApiRecord } from "../../../lib/api-client";
import { usePatientConsultationsQuery, usePatientProfileQuery } from "../../../lib/query-hooks";
import type {
  PatientAllergyEntry,
  PatientProfileRecord,
  PatientTimelineEntry,
  PatientVitalEntry,
} from "../types";

function asRecord(value: unknown): ApiRecord | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as ApiRecord) : null;
}

function asRecordArray(value: unknown): ApiRecord[] {
  return Array.isArray(value)
    ? value.filter((entry): entry is ApiRecord => !!asRecord(entry))
    : [];
}

function toString(value: unknown, fallback = "") {
  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return fallback;
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() && !Number.isNaN(Number(value))) return Number(value);
  return null;
}

function toGender(value: unknown): "Male" | "Female" | "Other" {
  const raw = toString(value).toLowerCase();
  if (raw === "female" || raw === "f") return "Female";
  if (raw === "other") return "Other";
  if (raw === "male" || raw === "m") return "Male";
  return "Other";
}

function toName(record: ApiRecord | null, fallback: string) {
  const firstName = toString(record?.firstName ?? record?.first_name).trim();
  const lastName = toString(record?.lastName ?? record?.last_name).trim();
  const combined = `${firstName} ${lastName}`.trim();
  if (combined) return combined;

  const direct = toString(record?.name ?? record?.fullName ?? record?.full_name).trim();
  return direct || fallback;
}

function calculateAgeFromDob(dob: string) {
  const parsed = new Date(`${dob}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) return null;
  const today = new Date();
  let years = today.getUTCFullYear() - parsed.getUTCFullYear();
  const beforeBirthday =
    today.getUTCMonth() < parsed.getUTCMonth() ||
    (today.getUTCMonth() === parsed.getUTCMonth() &&
      today.getUTCDate() < parsed.getUTCDate());
  if (beforeBirthday) years -= 1;
  return years;
}

function toAge(record: ApiRecord | null) {
  const dob = toString(record?.date_of_birth ?? record?.dob);
  if (dob) {
    const calculatedAge = calculateAgeFromDob(dob);
    if (calculatedAge !== null) {
      return calculatedAge;
    }
  }

  const directAge = toNumber(record?.age);
  if (directAge !== null) return directAge;
  return 0;
}

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

function uniqueList(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function parseConsultationDescription(description: string) {
  const lines = description
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const reason = lines.find((line) => line.toLowerCase().startsWith("reason:"));
  const diagnoses = lines.find((line) => line.toLowerCase().startsWith("diagnoses:"));
  const tests = lines.find((line) => line.toLowerCase().startsWith("tests:"));
  const drugs = lines.find((line) => line.toLowerCase().startsWith("drugs:"));

  const stripLabel = (value?: string) => value?.split(":").slice(1).join(":").trim() ?? "";
  const splitItems = (value?: string) =>
    stripLabel(value)
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

  return {
    reason: stripLabel(reason) || undefined,
    diagnoses: splitItems(diagnoses),
    tests: splitItems(tests),
    drugs: splitItems(drugs),
  };
}

function mapTimelineEntries(rawTimeline: unknown): PatientTimelineEntry[] {
  return asRecordArray(rawTimeline)
    .map((row) => {
      const diagnoses = asRecordArray(row.diagnoses).map((item) =>
        toString(item.name ?? item.diagnosisName ?? item.label)
      ).filter(Boolean);
      const tests = asRecordArray(row.tests).map((item) =>
        toString(item.name ?? item.testName ?? item.label)
      ).filter(Boolean);
      const drugs = asRecordArray(row.drugs).map((item) => {
        const drugName = toString(item.name ?? item.drugName ?? item.label);
        const dose = toString(item.dose);
        const frequency = toString(item.frequency);
        const duration = toString(item.duration);
        return [drugName, dose, frequency, duration].filter(Boolean).join(" • ").trim();
      }).filter(Boolean);
      const description = toString(row.description ?? row.notes ?? row.note, "No additional notes.");
      const parsed = parseConsultationDescription(description);

      return {
        id:
          toString(row.encounter_id ?? row.encounterId, "") ||
          toString(row.id, "") ||
          toString(row.uuid, "") ||
          undefined,
        date: toString(
          row.checked_at ?? row.checkedAt ?? row.event_date ?? row.eventDate ?? row.date ?? row.recordedAt ?? row.created_at ?? row.createdAt,
          new Date().toISOString()
        ),
        title: toString(row.title ?? row.event ?? row.noteTitle, "Consultation completed"),
        description,
        kind: "general" as const,
        tags: Array.isArray(row.tags) ? row.tags.map((tag) => toString(tag)).filter(Boolean) : [],
        value:
          toString(row.status, "") ||
          (toString(row.encounter_id ?? row.encounterId, "") ? `encounter:${toString(row.encounter_id ?? row.encounterId)}` : ""),
        reason: toString(row.reason, "") || parsed.reason,
        diagnoses: diagnoses.length > 0 ? diagnoses : parsed.diagnoses,
        tests: tests.length > 0 ? tests : parsed.tests,
        drugs: drugs.length > 0 ? drugs : parsed.drugs,
      };
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

function mapVitals(rawVitals: unknown): PatientVitalEntry[] {
  return asRecordArray(rawVitals)
    .map((row) => ({
      id:
        toString(row.id, "") ||
        toString(row.uuid, "") ||
        toString(row.encounterId ?? row.encounter_id, "") ||
        undefined,
      recordedAt: toString(
        row.recordedAt ?? row.date ?? row.created_at ?? row.createdAt,
        new Date().toISOString()
      ),
      ...(toNumber(row.bpSystolic ?? row.bp_systolic) !== null
        ? { bpSystolic: toNumber(row.bpSystolic ?? row.bp_systolic) ?? undefined }
        : {}),
      ...(toNumber(row.bpDiastolic ?? row.bp_diastolic) !== null
        ? { bpDiastolic: toNumber(row.bpDiastolic ?? row.bp_diastolic) ?? undefined }
        : {}),
      ...(toNumber(row.heartRate ?? row.heart_rate) !== null
        ? { heartRate: toNumber(row.heartRate ?? row.heart_rate) ?? undefined }
        : {}),
      ...(toString(row.temperatureC ?? row.temperature_c).trim()
        ? { temperatureC: toString(row.temperatureC ?? row.temperature_c).trim() }
        : {}),
      ...(toNumber(row.spo2) !== null ? { spo2: toNumber(row.spo2) ?? undefined } : {}),
    }))
    .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime());
}

function mapAllergies(rawAllergies: unknown): PatientAllergyEntry[] {
  const severityMeta = (severity: string) => {
    const normalized = severity.toLowerCase();
    if (normalized === "high") {
      return {
        severity: "High" as const,
        severityKey: "high" as const,
        pill: "bg-rose-50 text-rose-700 ring-1 ring-rose-100",
        dot: "bg-rose-500",
      };
    }
    if (normalized === "low") {
      return {
        severity: "Low" as const,
        severityKey: "low" as const,
        pill: "bg-amber-50 text-amber-700 ring-1 ring-amber-100",
        dot: "bg-amber-500",
      };
    }
    return {
      severity: "Medium" as const,
      severityKey: "moderate" as const,
      pill: "bg-sky-50 text-sky-700 ring-1 ring-sky-100",
      dot: "bg-sky-500",
    };
  };

  const entries = asRecordArray(rawAllergies)
    .map<PatientAllergyEntry | null>((row, index) => {
      const name = toString(row.allergyName ?? row.name ?? row.allergen, `Allergy ${index + 1}`).trim();
      if (!name) return null;
      const meta = severityMeta(toString(row.severity, "moderate"));
      return {
        id: toString(row.id, "") || undefined,
        name,
        severity: meta.severity,
        severityKey: meta.severityKey,
        pill: meta.pill,
        dot: meta.dot,
      } satisfies PatientAllergyEntry;
    })
    .filter((entry): entry is PatientAllergyEntry => entry !== null);

  return entries
    .sort((left, right) => {
      const rank = (entry: PatientAllergyEntry) =>
        entry.severityKey === "high" ? 3 : entry.severityKey === "moderate" ? 2 : 1;
      return rank(right) - rank(left);
    });
}

export function usePatientProfileData(profileId: string) {
  const numericId = Number(profileId);
  const hasInvalidProfileId = Number.isNaN(numericId);
  const enabled = !hasInvalidProfileId;

  const profileQuery = usePatientProfileQuery(numericId, enabled);
  const consultationsQuery = usePatientConsultationsQuery(numericId, enabled);
  const profilePayload = useMemo(() => asRecord(profileQuery.data), [profileQuery.data]);
  const consultationsPayload = useMemo(() => asRecord(consultationsQuery.data), [consultationsQuery.data]);
  const patientRecord = useMemo(() => asRecord(profilePayload?.patient) ?? profilePayload, [profilePayload]);
  const allergies = useMemo(() => mapAllergies(profilePayload?.allergies), [profilePayload?.allergies]);
  const conditions = useMemo(
    () =>
      uniqueList(
        asRecordArray(profilePayload?.conditions)
          .map((row) => toString(row.conditionName ?? row.diagnosisName ?? row.name))
          .filter(Boolean)
      ),
    [profilePayload?.conditions]
  );
  const vitals = useMemo(() => mapVitals(profilePayload?.vitals), [profilePayload?.vitals]);
  const timeline = useMemo(
    () => mapTimelineEntries(consultationsPayload?.consultations),
    [consultationsPayload?.consultations]
  );

  const hasResolvedProfile = patientRecord !== null;

  const profile = useMemo<PatientProfileRecord | null>(() => {
    if (!patientRecord) {
      return null;
    }

    const familyRecord = asRecord(profilePayload?.family);
    const nestedFamily = asRecord(familyRecord?.family);
    const familyId = toNumber(
      patientRecord.familyId ?? patientRecord.family_id ?? familyRecord?.familyId ?? familyRecord?.family_id
    );
    const familyName = toString(
      patientRecord.familyName ??
        patientRecord.family_name ??
        nestedFamily?.familyName ??
        nestedFamily?.family_name ??
        nestedFamily?.name ??
        familyRecord?.name,
      familyId !== null ? `Family #${familyId}` : "Unassigned"
    );
    const familyMembers = asRecordArray(familyRecord?.members)
      .map((row) => toString(row.name ?? row.memberName ?? row.fullName ?? row.full_name))
      .filter(Boolean);

    return {
      id: String(numericId),
      name: toName(patientRecord, `Patient ${numericId}`),
      patientCode: toString(patientRecord.patientCode ?? patientRecord.patient_code, ""),
      firstName:
        toString(patientRecord.firstName ?? patientRecord.first_name, "") || undefined,
      lastName:
        toString(patientRecord.lastName ?? patientRecord.last_name, "") || undefined,
      nic: toString(patientRecord.nic, "No NIC"),
      dateOfBirth:
        toString(patientRecord.dob ?? patientRecord.dateOfBirth ?? patientRecord.date_of_birth, "") ||
        undefined,
      guardianName:
        toString(
          patientRecord.guardianName ?? patientRecord.guardian_name ?? familyRecord?.guardianName ?? familyRecord?.guardian_name,
          ""
        ) || undefined,
      guardianNic:
        toString(patientRecord.guardianNic ?? patientRecord.guardian_nic, "") || undefined,
      guardianPhone:
        toString(patientRecord.guardianPhone ?? patientRecord.guardian_phone, "") || undefined,
      guardianRelationship:
        toString(
          patientRecord.guardianRelationship ??
            patientRecord.guardian_relationship ??
            familyRecord?.guardianRelationship ??
            familyRecord?.guardian_relationship,
          ""
        ) || undefined,
      age: toAge(patientRecord),
      gender: toGender(
        patientRecord.gender ??
          patientRecord.sex ??
          patientRecord.patient_gender ??
          patientRecord.patientGender
      ),
      mobile: toString(patientRecord.phone ?? patientRecord.mobile, "Not provided"),
      address:
        toString(patientRecord.address, "") || undefined,
      bloodGroup:
        toString(patientRecord.bloodGroup ?? patientRecord.blood_group, "") || undefined,
      familyId: familyId ?? undefined,
      family: {
        assigned: familyId !== null && familyName !== "Unassigned",
        name: familyName,
        members: familyMembers,
      },
      conditions,
      allergies,
      vitals,
      firstSeen: toString(
        patientRecord.createdAt ??
          patientRecord.created_at ??
          patientRecord.firstSeen,
        new Date().toISOString()
      ),
      timeline,
    };
  }, [allergies, conditions, numericId, patientRecord, profilePayload?.family, timeline, vitals]);

  let loadState: LoadState;
  if (hasInvalidProfileId) {
    loadState = errorLoadState("Invalid patient profile reference.");
  } else if ((profileQuery.isPending || profileQuery.isFetching) && !hasResolvedProfile) {
    loadState = loadingLoadState();
  } else if (profileQuery.status === "error") {
    loadState = errorLoadState(
      (profileQuery.error as { message?: string } | undefined)?.message ??
        "Unable to load patient profile."
    );
  } else if (!hasResolvedProfile) {
    loadState = emptyLoadState();
  } else {
    const consultationNotice =
      consultationsQuery.status === "error"
        ? (consultationsQuery.error as { message?: string } | undefined)?.message ??
          "Consultation history is unavailable right now."
        : undefined;
    loadState = consultationNotice ? readyLoadState(consultationNotice) : readyLoadState();
  }

  const reload = () => {
    void profileQuery.refetch();
    void consultationsQuery.refetch();
  };

  return {
    profile,
    timeline,
    formatDate,
    loadState,
    syncError: loadState.error,
    reload,
  };
}
