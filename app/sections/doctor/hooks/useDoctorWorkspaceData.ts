import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import {
  createEncounter,
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
      dataRecord.guardianNic !== undefined ||
      dataRecord.patient_code !== undefined ||
      dataRecord.patientCode !== undefined
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
  const direct = getString(row.name ?? row.fullName).trim();
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
    const code = normalizeLookupValue(getString(row.patientCode ?? row.patient_code));
    if (code) patientByCode.set(code, row);
  });

  const fromAppointments = appointmentRows.map((row, index) => {
    const nestedPatient = asRecord(row.patient) ?? asRecord(row.patientDetails) ?? null;
    const appointmentId = getNumber(row.id ?? row.appointmentId ?? row.appointment_id) ?? undefined;
    const patientIdFromRow = getNumber(row.patientId ?? row.patient_id ?? nestedPatient?.id) ?? undefined;
    const doctorId = getNumber(row.doctorId ?? row.doctor_id ?? asRecord(row.doctor)?.id) ?? undefined;
    const appointmentPatientCode = normalizeLookupValue(
      getString(
        nestedPatient?.patientCode ??
          nestedPatient?.patient_code ??
          row.patientCode ??
          row.patient_code
      )
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
      nestedPatient?.patientCode ??
        nestedPatient?.patient_code ??
        row.patientCode ??
        row.patient_code ??
        patientRow?.patientCode ??
        patientRow?.patient_code,
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
      nestedPatient?.dateOfBirth,
      nestedPatient?.date_of_birth,
      row.dateOfBirth,
      row.date_of_birth,
      patientRow?.age,
      patientRow?.dateOfBirth,
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
    const time = getDateLabel(row.scheduledAt ?? row.scheduled_at ?? row.createdAt ?? row.created_at);
    const appointmentStatus = getString(row.status).toLowerCase();
    const guardianName = getString(
      nestedPatient?.guardianName ??
        nestedPatient?.guardian_name ??
        row.guardianName ??
        row.guardian_name ??
        patientRow?.guardianName ??
        patientRow?.guardian_name,
      ""
    );
    const guardianNic = getString(
      nestedPatient?.guardianNic ??
        nestedPatient?.guardian_nic ??
        row.guardianNic ??
        row.guardian_nic ??
        patientRow?.guardianNic ??
        patientRow?.guardian_nic,
      ""
    );
    const guardianRelationship = getString(
      nestedPatient?.guardianRelationship ??
        nestedPatient?.guardian_relationship ??
        row.guardianRelationship ??
        row.guardian_relationship ??
        patientRow?.guardianRelationship ??
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

  if (fromAppointments.length) return fromAppointments;

  return patientRows.map((row, index) => {
    const id = getNumber(row.id ?? row.patientId ?? row.patient_id);
    return {
      patientId: id ?? undefined,
      name: toName(row, `Patient ${index + 1}`),
      patientCode: getString(row.patientCode ?? row.patient_code, ""),
      nic: getString(row.nic, "No NIC"),
      guardianName: getString(row.guardianName ?? row.guardian_name, "") || undefined,
      guardianNic: getString(row.guardianNic ?? row.guardian_nic, "") || undefined,
      guardianRelationship:
        getString(row.guardianRelationship ?? row.guardian_relationship, "") || undefined,
      time: "-",
      reason: "General visit",
      age: toAge(row.age, row.dateOfBirth, row.date_of_birth),
      gender: normalizeGender(row.gender),
      profileId: id ? String(id) : undefined,
    } satisfies Patient;
  });
}

function normalizeVitals(raw: unknown): PatientVital[] {
  return asArray(raw).map((row, index) => ({
    label: getString(row.label ?? row.name ?? row.vitalName ?? row.type, `Vital ${index + 1}`),
    value: getString(row.value ?? row.reading ?? row.result, "--"),
  }));
}

function normalizeAllergies(raw: unknown): AllergyAlert[] {
  return asArray(raw).map((row, index) => {
    const name = getString(row.name ?? row.allergyName ?? row.allergen, `Allergy ${index + 1}`);
    const severity = getString(row.severity, "Medium");
    const level = severity.toLowerCase();

    if (level === "high" || level === "critical") {
      return {
        name,
        severity: "High",
        dot: "bg-rose-400",
        pill: "bg-rose-50 text-rose-700 ring-rose-100",
      };
    }
    if (level === "low") {
      return {
        name,
        severity: "Low",
        dot: "bg-emerald-400",
        pill: "bg-emerald-50 text-emerald-700 ring-emerald-100",
      };
    }
    return {
      name,
      severity: "Medium",
      dot: "bg-amber-400",
      pill: "bg-amber-50 text-amber-700 ring-amber-100",
    };
  });
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

  const guardianNic = getString(profile.guardianNic ?? profile.guardian_nic);
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
  const [patientLookupNotice, setPatientLookupNotice] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<MutationState>(idleMutationState());
  const [transitionState, setTransitionState] = useState<MutationState>(idleMutationState());
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
    () => normalizePatients(rawPatients, rawWaitingAppointments),
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
    selectedAppointmentId !== null &&
    selectedAppointmentStatus === "waiting";
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
          ? "Select a waiting appointment before saving encounter."
          : selectedAppointmentStatus === "completed" || selectedAppointmentStatus === "cancelled"
            ? "Completed or cancelled appointments cannot be updated from the doctor workspace."
            : null;
  const transitionDisabledReason =
    currentUserQuery.isPending || currentUserQuery.isFetching
      ? "Checking doctor access before updating appointment status."
      : currentUserQuery.data && !isDoctorRole
        ? "Doctor role is required before updating appointment status."
        : currentUserQuery.data && !hasDoctorWorkspaceAccess
          ? "Doctor workspace access is required before updating appointment status."
        : currentUserQuery.data && !hasPermission(currentUserQuery.data, "appointment.update")
          ? "Appointment update permission is required before starting consultation."
        : !selectedAppointmentId
          ? "Select a waiting appointment before starting consultation."
          : selectedAppointmentStatus === "in_consultation"
            ? "Consultation already started for this appointment."
            : selectedAppointmentStatus === "completed" || selectedAppointmentStatus === "cancelled"
              ? "Only waiting appointments can be moved into consultation."
              : null;

  const clearSaveState = () => {
    setSaveState((current) => (current.status === "idle" ? current : idleMutationState()));
  };

  const clearTransitionState = () => {
    setTransitionState((current) => (current.status === "idle" ? current : idleMutationState()));
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
    setSearchState("");
  };

  useEffect(() => {
    if (!selectedPatientId || !selectedPatientProfile) {
      return;
    }

    const resolvedName = toProfileName(selectedPatientProfile, patientName || `Patient ${selectedPatientId}`);
    const resolvedPatientCode = getString(
      selectedPatientProfile.patientCode ?? selectedPatientProfile.patient_code,
      patientCode
    );
    const resolvedAge = toAge(
      selectedPatientProfile.age,
      selectedPatientProfile.dateOfBirth,
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
      `No patient records were found for "${query}". Create a new patient in the Assistant page, then return here to continue treatment.`
    );
  };

  const refreshDoctorQueries = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.patients.list }),
      queryClient.invalidateQueries({ queryKey: ["appointments"] }),
      queryClient.invalidateQueries({ queryKey: queryKeys.patients.directory }),
      queryClient.invalidateQueries({ queryKey: queryKeys.analytics.overview }),
      queryClient.invalidateQueries({ queryKey: queryKeys.encounters.list }),
      patientsQuery.refetch(),
      waitingAppointmentsQuery.refetch(),
    ]);
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
      await Promise.all([refreshDoctorQueries(), currentUserQuery.refetch()]);
    } catch (error) {
      setSaveState(
        errorMutationState((error as ApiClientError)?.message ?? "Failed to save encounter.")
      );
    }
  };

  const handleStartConsultation = async () => {
    if (!canTransitionAppointments) {
      setTransitionState(
        errorMutationState(
          transitionDisabledReason ??
            "Doctor permission is required before advancing appointment status."
        )
      );
      return;
    }

    if (!selectedAppointmentId) {
      setTransitionState(
        errorMutationState("Select a waiting appointment before starting consultation.")
      );
      return;
    }

    try {
      setTransitionState(pendingMutationState());
      await updateAppointment(selectedAppointmentId, {
        status: "in_consultation",
      });
      setSelectedAppointmentStatus("in_consultation");
      await refreshDoctorQueries();
      setTransitionState(successMutationState("Appointment moved to in consultation."));
    } catch (error) {
      setTransitionState(
        errorMutationState(
          (error as ApiClientError)?.message ?? "Failed to update appointment status."
        )
      );
    }
  };

  const saveFeedback = getMutationFeedback(saveState, {
    pendingMessage: "Submitting encounter...",
    errorMessage: "Failed to save encounter.",
  });
  const transitionFeedback = getMutationFeedback(transitionState, {
    pendingMessage: "Starting consultation...",
    errorMessage: "Failed to update appointment status.",
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
    queueState,
    patientDetailsState,
    canSaveRecord,
    canTransitionAppointments,
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
        currentUserQuery.refetch(),
        ...(selectedPatientId
          ? [patientProfileQuery.refetch(), patientVitalsQuery.refetch(), patientAllergiesQuery.refetch()]
          : []),
      ]);
    },
  };
}
