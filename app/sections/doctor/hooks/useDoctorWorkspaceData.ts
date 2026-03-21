import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import {
  createPatientAllergy,
  createEncounter,
  createPatientVital,
  startVisit,
  updateAppointment,
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

function normalizeGender(value: unknown): PatientGender {
  const text = getString(value).toLowerCase();
  return text === "female" ? "Female" : "Male";
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

function toEncounterDate(value: string) {
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }
  return new Date().toISOString().slice(0, 10);
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

    const nic = getString(
      nestedPatient?.nic ?? row.nic ?? row.patientNic ?? row.patient_nic ?? patientRow?.nic,
      "No NIC"
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
      name,
      patientCode,
      nic,
      guardianName: guardianName || undefined,
      guardianNic: guardianNic || undefined,
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
      name: toName(row, `Patient ${index + 1}`),
      patientCode: getString(row.patient_code, ""),
      nic: getString(row.nic, "No NIC"),
      guardianName: getString(row.guardian_name, "") || undefined,
      guardianNic: getString(row.guardian_nic, "") || undefined,
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
  const [search, setSearchState] = useState("");
  const [patientName, setPatientNameState] = useState("");
  const [patientAge, setPatientAgeState] = useState("");
  const [patientCode, setPatientCodeState] = useState("");
  const [nicNumber, setNicNumberState] = useState("");
  const [nicIdentityLabel, setNicIdentityLabel] = useState<"Patient NIC" | "Guardian NIC" | null>(
    null
  );
  const [gender, setGenderState] = useState<PatientGender>("Male");
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<number | null>(null);
  const [selectedDoctorId, setSelectedDoctorId] = useState<number | null>(null);
  const [selectedAppointmentStatus, setSelectedAppointmentStatus] =
    useState<AppointmentLifecycleStatus | null>(null);
  const [selectedVisitMode, setSelectedVisitMode] = useState<"walk_in" | "queue" | null>(null);
  const [patientLookupNotice, setPatientLookupNotice] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<MutationState>(idleMutationState());
  const [transitionState, setTransitionState] = useState<MutationState>(idleMutationState());
  const [vitalDrafts, setVitalDrafts] = useState<Record<VitalDraftKey, string>>({
    bloodPressure: "",
    heartRate: "",
    temperature: "",
    spo2: "",
  });
  const [vitalsSaveState, setVitalsSaveState] = useState<MutationState>(idleMutationState());
  const [allergyDraftName, setAllergyDraftName] = useState("");
  const [allergyDraftSeverity, setAllergyDraftSeverity] = useState<AllergySeverity>("moderate");
  const [editingAllergyName, setEditingAllergyName] = useState<string | null>(null);
  const [allergySaveState, setAllergySaveState] = useState<MutationState>(idleMutationState());
  const rawPatients = patientsQuery.data ?? EMPTY_ROWS;
  const rawWaitingAppointments = waitingAppointmentsQuery.data ?? EMPTY_ROWS;
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
  const hasDoctorWorkspaceAccess =
    !!currentUserQuery.data &&
    isDoctorRole &&
    hasPermission(currentUserQuery.data, "doctor.workspace.view");
  const canSaveRecord =
    hasDoctorWorkspaceAccess &&
    !!currentUserQuery.data &&
    hasPermission(currentUserQuery.data, "appointment.update") &&
    selectedPatientId !== null &&
    selectedAppointmentId !== null &&
    selectedAppointmentStatus !== "completed" &&
    selectedAppointmentStatus !== "cancelled";
  const canTransitionAppointments =
    hasDoctorWorkspaceAccess &&
    !!currentUserQuery.data &&
    hasPermission(currentUserQuery.data, "appointment.update") &&
    selectedPatientId !== null &&
    selectedAppointmentStatus !== "completed" &&
    selectedAppointmentStatus !== "cancelled";
  const visitActionLabel =
    selectedAppointmentStatus === "waiting" || selectedAppointmentStatus === "in_consultation"
      ? "Continue Visit"
      : "Start Visit";
  const visitModeLabel =
    selectedVisitMode === "queue"
      ? "Queue Visit"
      : selectedVisitMode === "walk_in"
        ? "Walk-In"
        : "No Visit";
  const canEditVitals =
    !!currentUserQuery.data &&
    selectedPatientId !== null &&
    hasPermission(currentUserQuery.data, "patient.vital.write");
  const canEditAllergies =
    !!currentUserQuery.data &&
    selectedPatientId !== null &&
    hasPermission(currentUserQuery.data, "patient.allergy.write");
  const saveDisabledReason =
    currentUserQuery.isPending || currentUserQuery.isFetching
      ? "Checking doctor access before encounter submission."
      : currentUserQuery.data && !isDoctorRole
        ? "Doctor role is required before submitting encounters."
        : currentUserQuery.data && !hasDoctorWorkspaceAccess
          ? "Doctor workspace access is required before submitting encounters."
        : currentUserQuery.data && !hasPermission(currentUserQuery.data, "appointment.update")
          ? "Appointment update permission is required before saving encounters."
        : !selectedPatientId || !selectedAppointmentId
          ? "Start or resume a visit before saving the encounter."
          : selectedAppointmentStatus === "completed" || selectedAppointmentStatus === "cancelled"
            ? "Completed or cancelled appointments cannot be updated from the doctor workspace."
            : null;
  const transitionDisabledReason =
    currentUserQuery.isPending || currentUserQuery.isFetching
      ? "Checking doctor access before starting the active visit."
      : currentUserQuery.data && !isDoctorRole
        ? "Doctor role is required before starting the active visit."
        : currentUserQuery.data && !hasDoctorWorkspaceAccess
          ? "Doctor workspace access is required before starting the active visit."
        : currentUserQuery.data && !hasPermission(currentUserQuery.data, "appointment.update")
          ? "Appointment update permission is required before starting the active visit."
        : !selectedPatientId
          ? "Select a patient before starting the active visit."
          : selectedAppointmentStatus === "completed" || selectedAppointmentStatus === "cancelled"
              ? "Completed or cancelled visits cannot be continued from the doctor workspace."
              : null;
  const vitalsDisabledReason =
    !selectedPatientId
      ? "Select a patient before updating vitals."
      : currentUserQuery.isPending || currentUserQuery.isFetching
        ? "Checking doctor access before updating vitals."
        : currentUserQuery.data && !hasPermission(currentUserQuery.data, "patient.vital.write")
          ? "Patient vital write permission is required before updating vitals."
          : null;
  const allergiesDisabledReason =
    !selectedPatientId
      ? "Select a patient before updating allergies."
      : currentUserQuery.isPending || currentUserQuery.isFetching
        ? "Checking doctor access before updating allergies."
        : currentUserQuery.data && !hasPermission(currentUserQuery.data, "patient.allergy.write")
          ? "Patient allergy write permission is required before updating allergies."
          : null;

  const clearSaveState = () => {
    setSaveState((current) => (current.status === "idle" ? current : idleMutationState()));
  };

  const clearTransitionState = () => {
    setTransitionState((current) => (current.status === "idle" ? current : idleMutationState()));
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
    clearTransitionState();
    clearPatientLookupNotice();
    setSearchState(value);
  };

  const setPatientName = (value: string) => {
    clearSaveState();
    clearTransitionState();
    clearPatientLookupNotice();
    setPatientNameState(value);
  };

  const setPatientAge = (value: string) => {
    clearSaveState();
    clearTransitionState();
    clearPatientLookupNotice();
    setPatientAgeState(value);
  };

  const setPatientCode = (value: string) => {
    clearSaveState();
    clearTransitionState();
    clearPatientLookupNotice();
    setPatientCodeState(value);
  };

  const setNicNumber = (value: string) => {
    clearSaveState();
    clearTransitionState();
    clearPatientLookupNotice();
    setNicIdentityLabel(null);
    setNicNumberState(value);
  };

  const setGender = (value: PatientGender) => {
    clearSaveState();
    clearTransitionState();
    clearPatientLookupNotice();
    setGenderState(value);
  };

  const setVitalDraft = (key: VitalDraftKey, value: string) => {
    clearVitalsSaveState();
    setVitalDrafts((current) => ({ ...current, [key]: value }));
  };

  const setAllergyNameDraft = (value: string) => {
    clearAllergySaveState();
    if (editingAllergyName && normalizeLookupValue(value) !== normalizeLookupValue(editingAllergyName)) {
      setEditingAllergyName(null);
    }
    setAllergyDraftName(value);
  };

  const setAllergySeverityDraft = (value: AllergySeverity) => {
    clearAllergySaveState();
    setAllergyDraftSeverity(value);
  };

  const clearSelectedPatientContext = () => {
    setPatientNameState("");
    setPatientAgeState("");
    setPatientCodeState("");
    setNicNumberState("");
    setNicIdentityLabel(null);
    setGenderState("Male");
    setSelectedPatientId(null);
    setSelectedAppointmentId(null);
    setSelectedDoctorId(null);
    setSelectedAppointmentStatus(null);
    setSelectedVisitMode(null);
    setVitalDrafts({
      bloodPressure: "",
      heartRate: "",
      temperature: "",
      spo2: "",
    });
    setAllergyDraftName("");
    setAllergyDraftSeverity("moderate");
    setEditingAllergyName(null);
    clearVitalsSaveState();
    clearAllergySaveState();
  };

  const handlePatientSelect = (patient: Patient) => {
    const identityField = resolveIdentityField(patient);
    clearSaveState();
    clearTransitionState();
    clearPatientLookupNotice();
    setPatientName(patient.name);
    setPatientAge(patient.age ? String(patient.age) : "");
    setPatientCode(patient.patientCode);
    setNicNumberState(identityField.value);
    setNicIdentityLabel(identityField.label);
    setGender(patient.gender === "Female" ? "Female" : "Male");
    setSelectedPatientId(patient.patientId ?? null);
    setSelectedAppointmentId(patient.appointmentId ?? null);
    setSelectedDoctorId(patient.doctorId ?? null);
    setSelectedAppointmentStatus(patient.appointmentStatus ?? null);
    setSelectedVisitMode(
      patient.appointmentId && patient.appointmentStatus ? "queue" : "walk_in"
    );
    setSearchState("");
    clearVitalsSaveState();
    clearAllergySaveState();
  };

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

    setPatientNameState(resolvedName);
    setPatientCodeState(resolvedPatientCode);
    setPatientAgeState(resolvedAge ? String(resolvedAge) : "");
    setNicNumberState(resolvedIdentity.value);
    setNicIdentityLabel(resolvedIdentity.label);
    setGenderState(normalizeProfileGender(selectedPatientProfile.gender));
  }, [patientCode, patientName, selectedPatientId, selectedPatientProfile]);

  useEffect(() => {
    if (!selectedPatientId) {
      return;
    }

    setVitalDrafts(buildVitalDrafts(patientVitals));
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
    setPatientLookupNotice(
      `No patient records were found for "${query}". Create the patient first, then start the visit to continue treatment.`
    );
  };

  const refreshDoctorQueries = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.patients.list }),
      queryClient.invalidateQueries({ queryKey: ["appointments"] }),
      queryClient.invalidateQueries({ queryKey: queryKeys.patients.directory }),
      queryClient.invalidateQueries({ queryKey: queryKeys.analytics.overview }),
      queryClient.invalidateQueries({ queryKey: queryKeys.encounters.list }),
    ]);
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

  const refreshSelectedPatientAllergies = async () => {
    if (!selectedPatientId) {
      return;
    }

    await queryClient.invalidateQueries({
      queryKey: queryKeys.patients.allergies(selectedPatientId),
    });
  };

  const handleSaveRecord = async () => {
    if (!canSaveRecord) {
      setSaveState(
        errorMutationState(
          saveDisabledReason ?? "Doctor permission is required before saving an encounter."
        )
      );
      return;
    }

    if (!selectedPatientId || !selectedAppointmentId) {
      setSaveState(errorMutationState("Select a waiting appointment before saving encounter."));
      return;
    }

    const doctorId = selectedDoctorId ?? currentUserId;
    if (!doctorId) {
      setSaveState(errorMutationState("Doctor identity missing in token or appointment context."));
      return;
    }

    try {
      setSaveState(pendingMutationState());
      await createEncounter({
        appointmentId: selectedAppointmentId,
        patientId: selectedPatientId,
        doctorId,
        checkedAt: new Date().toISOString(),
        notes:
          clinicalWorkflow.selectedDiseases.join(", ") ||
          "Clinical note recorded from doctor panel.",
        nextVisitDate: toEncounterDate(visitPlanner.nextVisitDate),
        diagnoses: clinicalWorkflow.selectedDiseases.map((diagnosisName) => ({
          diagnosisName,
          icd10Code: "",
        })),
        tests: clinicalWorkflow.selectedTests.map((testName) => ({
          testName,
          status: "ordered",
        })),
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
      });
      await updateAppointment(selectedAppointmentId, {
        status: "completed",
      });
      setSelectedAppointmentStatus("completed");
      setSaveState(successMutationState("Encounter saved to backend."));
      await refreshDoctorQueries();
    } catch (error) {
      setSaveState(
        errorMutationState((error as ApiClientError)?.message ?? "Failed to save encounter.")
      );
    }
  };

  const handleSaveVitals = async () => {
    if (!canEditVitals || !selectedPatientId) {
      setVitalsSaveState(
        errorMutationState(
          vitalsDisabledReason ?? "Select a patient with vital write access before updating vitals."
        )
      );
      return;
    }

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

    const hasAnySupportedVital =
      bpSystolic !== undefined ||
      bpDiastolic !== undefined ||
      heartRate !== undefined ||
      temperatureC !== undefined ||
      spo2 !== undefined;

    if (!hasAnySupportedVital) {
      setVitalsSaveState(errorMutationState("Enter at least one vital value before saving."));
      return;
    }

    if (bloodPressureText && (bpSystolic === undefined || bpDiastolic === undefined)) {
      setVitalsSaveState(
        errorMutationState("Blood pressure must use systolic/diastolic format, like 120/80.")
      );
      return;
    }

    try {
      setVitalsSaveState(pendingMutationState());
      await createPatientVital(selectedPatientId, {
        ...(bpSystolic !== undefined ? { bpSystolic } : {}),
        ...(bpDiastolic !== undefined ? { bpDiastolic } : {}),
        ...(heartRate !== undefined ? { heartRate } : {}),
        ...(temperatureC !== undefined ? { temperatureC } : {}),
        ...(spo2 !== undefined ? { spo2 } : {}),
        recordedAt: new Date().toISOString(),
      });
      await refreshSelectedPatientDetails();
      setVitalsSaveState(successMutationState("Patient vitals updated."));
    } catch (error) {
      setVitalsSaveState(
        errorMutationState((error as ApiClientError)?.message ?? "Failed to update patient vitals.")
      );
    }
  };

  const handleAddOrUpdateAllergy = async () => {
    if (!canEditAllergies || !selectedPatientId) {
      setAllergySaveState(
        errorMutationState(
          allergiesDisabledReason ??
            "Select a patient with allergy write access before updating allergies."
        )
      );
      return;
    }

    const name = allergyDraftName.trim();
    if (!name) {
      setAllergySaveState(errorMutationState("Enter an allergy name before saving."));
      return;
    }

    try {
      setAllergySaveState(pendingMutationState());
      await createPatientAllergy(selectedPatientId, {
        allergyName: name,
        severity: allergyDraftSeverity,
      });
      await refreshSelectedPatientAllergies();
      setAllergyDraftName("");
      setEditingAllergyName(null);
      setAllergySaveState(successMutationState("Patient allergy updated."));
    } catch (error) {
      setAllergySaveState(
        errorMutationState((error as ApiClientError)?.message ?? "Failed to update patient allergy.")
      );
    }
  };

  const handleEditAllergy = (allergy: AllergyAlert) => {
    clearAllergySaveState();
    setEditingAllergyName(allergy.name);
    setAllergyDraftName(allergy.name);
    setAllergyDraftSeverity(allergy.severityKey);
  };

  const handleClearAllergyDraft = () => {
    clearAllergySaveState();
    setEditingAllergyName(null);
    setAllergyDraftName("");
    setAllergyDraftSeverity("moderate");
  };

  const handleStartConsultation = async () => {
    if (!canTransitionAppointments) {
      setTransitionState(
        errorMutationState(
          transitionDisabledReason ??
            "Doctor permission is required before starting the active visit."
        )
      );
      return;
    }

    if (!selectedPatientId) {
      setTransitionState(errorMutationState("Select a patient before starting the active visit."));
      return;
    }

    try {
      setTransitionState(pendingMutationState());
      const response = await startVisit({
        patientId: selectedPatientId,
        reason: "Walk-in consultation",
        priority: "normal",
      });
      const visitId = getNumber(response.visit.id);
      const visitDoctorId = getNumber(response.visit.doctorId ?? response.visit.doctor_id);
      const visitStatus = getString(response.visit.status).toLowerCase();

      setSelectedAppointmentId(visitId);
      setSelectedDoctorId(visitDoctorId);
      setSelectedAppointmentStatus(
        visitStatus === "waiting" ||
          visitStatus === "in_consultation" ||
          visitStatus === "completed" ||
          visitStatus === "cancelled"
          ? (visitStatus as AppointmentLifecycleStatus)
          : "in_consultation"
      );
      setSelectedVisitMode((current) => current ?? "walk_in");
      await refreshDoctorQueries();
      setTransitionState(
        successMutationState(response.reused ? "Active visit resumed." : "Visit started.")
      );
    } catch (error) {
      setTransitionState(
        errorMutationState(
          (error as ApiClientError)?.message ?? "Failed to start the active visit."
        )
      );
    }
  };

  const saveFeedback = getMutationFeedback(saveState, {
    pendingMessage: "Submitting encounter...",
    errorMessage: "Failed to save encounter.",
  });
  const transitionFeedback = getMutationFeedback(transitionState, {
    pendingMessage: "Starting visit...",
    errorMessage: "Failed to start visit.",
  });
  const vitalsFeedback = getMutationFeedback(vitalsSaveState, {
    pendingMessage: "Saving patient vitals...",
    errorMessage: "Failed to update patient vitals.",
  });
  const allergyFeedback = getMutationFeedback(allergySaveState, {
    pendingMessage: "Saving patient allergy...",
    errorMessage: "Failed to update patient allergy.",
  });

  return {
    search,
    setSearch,
    patientName,
    setPatientName,
    patientAge,
    setPatientAge,
    patientCode,
    setPatientCode,
    patientLookupNotice,
    nicNumber,
    nicIdentityLabel,
    setNicNumber,
    gender,
    setGender,
    handleSearchCommit: handleHeaderLookup,
    searchMatches,
    selectedPatientProfileId: selectedPatientId ? String(selectedPatientId) : null,
    selectedPatientLabel: patientName || null,
    patientVitals: selectedPatientId ? patientVitals : [],
    patientAllergies: selectedPatientId ? patientAllergies : [],
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
    queueState,
    patientDetailsState,
    canSaveRecord,
    canTransitionAppointments,
    visitActionLabel,
    visitModeLabel,
    saveDisabledReason,
    transitionDisabledReason,
    selectedAppointmentStatus,
    saveState,
    saveFeedback,
    transitionState,
    transitionFeedback,
    handlePatientSelect,
    handleStartConsultation,
    handleSaveRecord,
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
