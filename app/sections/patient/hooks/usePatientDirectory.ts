import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  listAppointments,
  listFamilies,
  listPatientAllergies,
  listPatientConditions,
  listPatientTimeline,
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

function toGender(value: unknown): Gender {
  const raw = toString(value).toLowerCase();
  if (raw === "female") return "Female";
  if (raw === "other") return "Other";
  return "Male";
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
      const matchesSearch = `${patient.name} ${patient.nic} ${patient.mobile} ${patient.family}`
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
    const [patientsResult, familiesResult, appointmentsResult] = await Promise.allSettled([
      listPatients(),
      listFamilies(),
      listAppointments(),
    ]);

    if (patientsResult.status === "rejected") {
      const message =
        (patientsResult.reason as ApiClientError)?.message ?? "Unable to load patients.";
      return {
        patients: [],
        loadState: errorLoadState(message),
      };
    }

    const patientRows = asArray(patientsResult.value);
    const familyRows = familiesResult.status === "fulfilled" ? asArray(familiesResult.value) : [];
    const appointmentRows =
      appointmentsResult.status === "fulfilled" ? asArray(appointmentsResult.value) : [];

    const familyNameById = new Map<number, string>();
    familyRows.forEach((row) => {
      const id = toNumber(row.id ?? row.familyId ?? row.family_id);
      if (id !== null) {
        familyNameById.set(id, toString(row.name ?? row.familyName, `Family ${id}`));
      }
    });

    let detailFailures = 0;
    const normalized = await Promise.all(
      patientRows.map(async (row, index) => {
        const patientId = toNumber(row.id ?? row.patientId ?? row.patient_id) ?? undefined;
        const name = toString(row.name ?? row.fullName, `Patient ${index + 1}`);
        const nic = toString(row.nic, "N/A");
        const age = toNumber(row.age) ?? 0;
        const patientGender = toGender(row.gender);
        const mobile = toString(row.mobile ?? row.phone, "Not provided");

        const familyId = toNumber(row.familyId ?? row.family_id);
        const nestedFamily = asRecord(row.family);
        const familyName =
          toString(nestedFamily?.name) ||
          (familyId !== null ? familyNameById.get(familyId) : undefined) ||
          toString(row.familyName) ||
          "Unassigned";

        let conditions: string[] = [];
        let allergies: string[] = [];
        let timelineRows: AnyRecord[] = [];
        if (patientId !== undefined) {
          const [conditionsResult, allergiesResult, timelineResult] = await Promise.allSettled([
            listPatientConditions(patientId),
            listPatientAllergies(patientId),
            listPatientTimeline(patientId),
          ]);

          if (
            conditionsResult.status === "rejected" ||
            allergiesResult.status === "rejected" ||
            timelineResult.status === "rejected"
          ) {
            detailFailures += 1;
          }

          conditions = asArray(
            conditionsResult.status === "fulfilled" ? conditionsResult.value : []
          )
            .map((entry) => toString(entry.name ?? entry.conditionName ?? entry.diagnosisName))
            .filter(Boolean);
          allergies = asArray(
            allergiesResult.status === "fulfilled" ? allergiesResult.value : []
          )
            .map((entry) => toString(entry.name ?? entry.allergyName))
            .filter(Boolean);
          timelineRows = asArray(timelineResult.status === "fulfilled" ? timelineResult.value : []);
        }

        const relatedAppointments = appointmentRows.filter((appointment) => {
          const apptPatientId = toNumber(
            appointment.patientId ?? appointment.patient_id ?? asRecord(appointment.patient)?.id
          );
          return patientId !== undefined && apptPatientId === patientId;
        });

        const nextAppointment = relatedAppointments
          .filter((appointment) => {
            const status = toString(appointment.status).toLowerCase();
            return status === "waiting" || status === "in_consultation";
          })
          .map((appointment) => appointment.scheduledAt ?? appointment.scheduled_at)
          .map((value) => toDisplayDateTime(value))
          .find(Boolean);

        const lastTimelineDate = timelineRows
          .map((entry) => toString(entry.date ?? entry.recordedAt ?? entry.createdAt))
          .filter(Boolean)
          .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0];

        return {
          patientId,
          name,
          nic,
          age,
          gender: patientGender,
          mobile,
          family: familyName,
          visits: timelineRows.length + 1,
          lastVisit: getRelativeVisitLabel(lastTimelineDate),
          nextAppointment: nextAppointment || undefined,
          tags: conditions.slice(0, 3),
          conditions: [...conditions, ...allergies.map((item) => `Allergy: ${item}`)],
          profileId: patientId ? String(patientId) : undefined,
        } satisfies Patient;
      })
    );

    const baseFeedFailure =
      familiesResult.status === "rejected" || appointmentsResult.status === "rejected";
    const detailNotice =
      detailFailures > 0
        ? "Some patient timeline or allergy details could not be loaded."
        : null;
    const feedNotice = baseFeedFailure
      ? "Some patient family or appointment feeds failed and fallback data is being shown."
      : null;
    const notice = detailNotice ?? feedNotice;

    return {
      patients: normalized,
      loadState: normalized.length ? readyLoadState(notice) : emptyLoadState(notice),
    };
  } catch (error) {
    const message = (error as ApiClientError)?.message ?? "Unable to load patients.";
    return {
      patients: [],
      loadState: errorLoadState(message),
    };
  }
}
