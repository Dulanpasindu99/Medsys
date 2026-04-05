import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  listPatients,
  type ApiClientError,
} from "../../../lib/api-client";
import {
  emptyLoadState,
  errorLoadState,
  loadingLoadState,
  readyLoadState,
  type LoadState,
} from "../../../lib/async-state";
import { queryKeys } from "../../../lib/query-keys";
import type { AgeBucketId, Gender, Patient } from "../types";

type AnyRecord = Record<string, unknown>;
const EMPTY_PATIENTS: Patient[] = [];

function asRecord(value: unknown): AnyRecord | null {
  return value && typeof value === "object" ? (value as AnyRecord) : null;
}

function toString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() && !Number.isNaN(Number(value))) return Number(value);
  return null;
}

function toGender(value: unknown): Gender {
  const raw = toString(value).toLowerCase();
  if (raw === "female" || raw === "f") return "Female";
  if (raw === "other") return "Other";
  if (raw === "male" || raw === "m") return "Male";
  return "Other";
}

function toName(row: AnyRecord, fallback: string) {
  const direct = toString(row.name ?? row.fullName).trim();
  if (direct) return direct;
  const firstName = toString(row.firstName ?? row.first_name).trim();
  const lastName = toString(row.lastName ?? row.last_name).trim();
  const combined = `${firstName} ${lastName}`.trim();
  return combined || fallback;
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

function toAge(row: AnyRecord) {
  const dob = toString(row.date_of_birth ?? row.dob);
  if (dob) {
    const calculatedAge = calculateAgeFromDob(dob);
    if (calculatedAge !== null) {
      return calculatedAge;
    }
  }

  const directAge = toNumber(row.age);
  if (directAge !== null) return directAge;
  return 0;
}

function getRelativeVisitLabel(lastVisitDate?: string) {
  if (!lastVisitDate) return "New patient";
  const daysSince = Math.floor((Date.now() - new Date(lastVisitDate).getTime()) / (1000 * 3600 * 24));
  if (daysSince > 0) {
    if (daysSince < 7) return `${daysSince} days ago`;
    if (daysSince < 30) return `${Math.floor(daysSince / 7)} weeks ago`;
    return `${Math.floor(daysSince / 30)} months ago`;
  }
  return "Today";
}

function toDisplayDateTime(value: unknown) {
  const raw = toString(value);
  if (!raw) return undefined;
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return raw;
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function toStringArray(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((item) => toString(item).trim()).filter(Boolean);
  }

  const asText = toString(value).trim();
  if (!asText) {
    return [];
  }

  return asText
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function usePatientDirectory() {
  const directoryQuery = useQuery({
    queryKey: queryKeys.patients.directory,
    queryFn: fetchPatientDirectorySnapshot,
  });
  const [search, setSearch] = useState("");
  const [family, setFamily] = useState("All Families");
  const [ageRange, setAgeRange] = useState<AgeBucketId>("all");
  const [gender, setGender] = useState<Gender | "all">("all");
  const patients = directoryQuery.data?.patients ?? EMPTY_PATIENTS;
  let loadState: LoadState;
  if (directoryQuery.isPending || directoryQuery.isFetching) {
    loadState = loadingLoadState();
  } else if (directoryQuery.isError) {
    loadState = errorLoadState(
      ((directoryQuery.error as unknown as ApiClientError | undefined)?.message ??
        "Unable to load patients.")
    );
  } else {
    loadState = directoryQuery.data?.loadState ?? emptyLoadState();
  }

  const families = useMemo(() => {
    const set = new Set<string>(["All Families"]);
    for (const patient of patients) set.add(patient.family);
    return Array.from(set);
  }, [patients]);

  const filteredPatients = useMemo(() => {
    return patients.filter((patient) => {
      const matchesSearch = `${patient.name} ${patient.patientCode} ${patient.nic} ${patient.mobile} ${patient.family} ${patient.guardianName ?? ""} ${patient.guardianNic ?? ""} ${patient.guardianRelationship ?? ""}`
        .toLowerCase()
        .includes(search.toLowerCase());

      const matchesFamily = family === "All Families" || patient.family === family;
      const matchesGender = gender === "all" || patient.gender === gender;
      const matchesAge =
        ageRange === "all" ||
        (ageRange === "18-30" && patient.age >= 18 && patient.age <= 30) ||
        (ageRange === "31-45" && patient.age >= 31 && patient.age <= 45) ||
        (ageRange === "46+" && patient.age >= 46);

      return matchesSearch && matchesFamily && matchesGender && matchesAge;
    });
  }, [ageRange, family, gender, patients, search]);

  return {
    search,
    setSearch,
    family,
    setFamily,
    ageRange,
    setAgeRange,
    gender,
    setGender,
    patients,
    filteredPatients,
    families,
    loadState,
    syncError: loadState.error,
    isSyncing: directoryQuery.isFetching,
    reload: () => {
      void directoryQuery.refetch();
    },
  };
}

async function fetchPatientDirectorySnapshot(): Promise<{
  patients: Patient[];
  loadState: LoadState;
}> {
  try {
    const patientRows = await listPatients({ scope: "organization" });

    const normalized = patientRows.map((row, index) => {
      const patientId = toNumber(row.id ?? row.patient_id) ?? undefined;
      const name = toName(row, `Patient ${index + 1}`);
      const nic = toString(row.nic, "No NIC");
      const age = toAge(row);
      const patientGender = toGender(
        row.gender ?? row.sex ?? row.patient_gender ?? row.patientGender
      );
      const mobile = toString(row.phone ?? row.mobile, "Not provided");
      const patientCode = toString(row.patient_code ?? row.patientCode, "");
      const guardianName = toString(row.guardian_name ?? row.guardianName, "");
      const guardianNic = toString(row.guardian_nic ?? row.guardianNic, "");
      const guardianRelationship = toString(
        row.guardian_relationship ?? row.guardianRelationship,
        ""
      );
      const familyName = toString(
        row.family_name ?? row.familyName ?? asRecord(row.family)?.name,
        "Unassigned"
      );
      const visits = toNumber(row.total_visits ?? row.visit_count ?? row.visits) ?? 0;
      const nextAppointmentRecord = asRecord(row.next_appointment ?? row.nextAppointment);
      const nextAppointment = toDisplayDateTime(
        nextAppointmentRecord?.scheduled_at ??
          nextAppointmentRecord?.scheduledAt ??
          row.next_appointment_at ??
          row.nextAppointmentAt
      );
      const allergyHighlights = toStringArray(
        row.allergy_highlights ?? row.allergyHighlights
      ).map((item) => `Allergy: ${item}`);
      const majorActiveCondition = toString(
        row.major_active_condition ?? row.majorActiveCondition,
        ""
      ).trim();
      const conditionAlerts = majorActiveCondition ? [majorActiveCondition] : [];

      return {
        patientId,
        name,
        patientCode,
        nic,
        guardianName: guardianName || undefined,
        guardianNic: guardianNic || undefined,
        guardianRelationship: guardianRelationship || undefined,
        age,
        gender: patientGender,
        mobile,
        family: familyName,
        visits,
        lastVisit: getRelativeVisitLabel(
          toString(row.last_visit_at ?? row.lastVisitAt, "")
        ),
        nextAppointment: nextAppointment || undefined,
        tags: [],
        conditions: [...allergyHighlights, ...conditionAlerts],
        profileId: patientId ? String(patientId) : undefined,
      } satisfies Patient;
    });

    return {
      patients: normalized,
      loadState: normalized.length ? readyLoadState() : emptyLoadState(),
    };
  } catch (error) {
    const message = (error as ApiClientError)?.message ?? "Unable to load patients.";
    return {
      patients: [],
      loadState: errorLoadState(message),
    };
  }
}
