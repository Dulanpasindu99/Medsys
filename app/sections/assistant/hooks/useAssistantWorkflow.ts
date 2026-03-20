import { type SetStateAction, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  createAppointment,
  createPatient,
  dispensePrescription,
  type ApiClientError,
} from "../../../lib/api-client";
import { hasPermission } from "../../../lib/authorization";
import {
  emptyLoadState,
  errorMutationState,
  getMutationFeedback,
  errorLoadState,
  idleMutationState,
  loadingLoadState,
  pendingMutationState,
  readyLoadState,
  successMutationState,
  type LoadState,
  type MutationState,
} from "../../../lib/async-state";
import {
  useAnalyticsOverviewQuery,
  useAppointmentsQuery,
  useCurrentUserQuery,
  useFamiliesQuery,
  usePatientsQuery,
  usePendingDispenseQueueQuery,
} from "../../../lib/query-hooks";
import { queryKeys } from "../../../lib/query-keys";
import type {
  AssistantAllergyEntry,
  AssistantDoctorAvailability,
  AssistantFamilyOption,
  AssistantFormState,
  AssistantPatientOption,
  AssistantScheduleFormState,
  CompletedPatient,
  Prescription,
} from "../types";

type AnyRecord = Record<string, unknown>;
const EMPTY_ROWS: unknown[] = [];

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
  if (typeof value === "string" && value.trim() && !Number.isNaN(Number(value))) {
    return Number(value);
  }
  return null;
}

function toUiGender(value: unknown): "Male" | "Female" {
  return toString(value).toLowerCase() === "female" ? "Female" : "Male";
}

function toName(row: AnyRecord, fallback: string) {
  const direct = toString(row.name ?? row.fullName).trim();
  if (direct) return direct;
  const firstName = toString(row.firstName ?? row.first_name).trim();
  const lastName = toString(row.lastName ?? row.last_name).trim();
  const combined = `${firstName} ${lastName}`.trim();
  return combined || fallback;
}

function toAge(value: unknown, fallback = 0) {
  const direct = toNumber(value);
  if (direct !== null) return direct;
  const text = toString(value);
  if (!text) return fallback;
  const dob = new Date(`${text}T00:00:00.000Z`);
  if (Number.isNaN(dob.getTime())) return fallback;
  const today = new Date();
  let years = today.getUTCFullYear() - dob.getUTCFullYear();
  const beforeBirthday =
    today.getUTCMonth() < dob.getUTCMonth() ||
    (today.getUTCMonth() === dob.getUTCMonth() &&
      today.getUTCDate() < dob.getUTCDate());
  if (beforeBirthday) years -= 1;
  return years;
}

function toDisplayTime(value: unknown) {
  const raw = toString(value);
  if (!raw) return "-";
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return raw;
  return date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

function normalizeSriLankanPhone(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  const compact = trimmed.replace(/[\s()-]+/g, "");
  if (!compact) return "";
  if (compact.startsWith("+94")) return `+94${compact.slice(3).replace(/\D/g, "")}`;
  if (compact.startsWith("94")) return `+94${compact.slice(2).replace(/\D/g, "")}`;
  if (compact.startsWith("0")) return `+94${compact.slice(1).replace(/\D/g, "")}`;
  return compact;
}

function isValidSriLankanNic(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return true;
  return /^(?:\d{12}|\d{9}[VvXx])$/.test(trimmed);
}

function normalizeAllergyName(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function mapAssistantPriorityToApiPriority(priority: AssistantFormState["priority"]) {
  if (priority === "Critical") return "critical" as const;
  if (priority === "Urgent") return "high" as const;
  return "normal" as const;
}

function toDateTimeLocalValue(value: Date) {
  const local = new Date(value.getTime() - value.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

function getDefaultScheduledAt() {
  const nextSlot = new Date();
  nextSlot.setMinutes(Math.ceil(nextSlot.getMinutes() / 15) * 15, 0, 0);
  return toDateTimeLocalValue(nextSlot);
}

function normalizePatientsById(rawPatients: unknown) {
  const map = new Map<number, AnyRecord>();
  asArray(rawPatients).forEach((row) => {
    const id = toNumber(row.id ?? row.patient_id);
    if (id !== null) {
      map.set(id, row);
    }
  });
  return map;
}

function normalizePendingQueue(rawQueue: unknown, patientById: Map<number, AnyRecord>): Prescription[] {
  return asArray(rawQueue).map((row, index) => {
    const prescriptionId = toNumber(row.id ?? row.prescriptionId ?? row.prescription_id) ?? undefined;
    const appointmentId = toNumber(row.appointmentId ?? row.appointment_id) ?? undefined;
    const patientId =
      toNumber(row.patientId ?? row.patient_id ?? asRecord(row.patient)?.id) ?? undefined;
    const patientRow = patientId ? patientById.get(patientId) : null;
    const nestedPatient = asRecord(row.patient) ?? null;

    const patient = toName(
      {
        ...(patientRow ?? {}),
        ...(nestedPatient ?? {}),
        name: row.patientName ?? row.patient_name ?? nestedPatient?.name ?? patientRow?.name,
        fullName: nestedPatient?.fullName ?? patientRow?.fullName,
      },
      `Patient ${patientId ?? index + 1}`
    );

    const patientCode = toString(
      row.patient_code ?? nestedPatient?.patient_code ?? patientRow?.patient_code,
      ""
    );

    const nic = toString(
      row.nic ??
      row.patientNic ??
      row.patient_nic ??
      nestedPatient?.nic ??
      patientRow?.nic,
      "No NIC"
    );

    const age =
      toAge(
        row.age ??
        row.patientAge ??
        row.patient_age ??
        row.date_of_birth ??
        nestedPatient?.date_of_birth ??
        nestedPatient?.age ??
        patientRow?.date_of_birth ??
        patientRow?.age
      ) ?? 0;

    const gender = toUiGender(
      row.gender ??
      row.patientGender ??
      row.patient_gender ??
      nestedPatient?.gender ??
      patientRow?.gender
    );

    const guardianName = toString(
      row.guardian_name ?? nestedPatient?.guardian_name ?? patientRow?.guardian_name,
      ""
    );
    const guardianNic = toString(
      row.guardian_nic ?? nestedPatient?.guardian_nic ?? patientRow?.guardian_nic,
      ""
    );
    const guardianPhone = toString(
      row.guardian_phone ?? nestedPatient?.guardian_phone ?? patientRow?.guardian_phone,
      ""
    );
    const guardianRelationship = toString(
      row.guardian_relationship ??
        nestedPatient?.guardian_relationship ??
        patientRow?.guardian_relationship,
      ""
    );

    const diagnosis = toString(row.diagnosis ?? row.reason ?? asRecord(row.encounter)?.notes, "Awaiting dispense");

    const itemRows = asArray(row.items ?? row.prescriptionItems ?? row.drugs);
    const normalizedItems = itemRows.map((item, itemIndex) => {
      const source = toString(item.source ?? item.drugSource, "clinical").toLowerCase();
      return {
        name: toString(item.drugName ?? item.name, `Drug ${itemIndex + 1}`),
        dose: toString(item.dose, "-"),
        terms: toString(item.frequency ?? item.terms ?? item.duration, "-"),
        amount: toNumber(item.quantity ?? item.amount) ?? 0,
        source: source === "outside" ? "outside" : "clinical",
        inventoryItemId: toNumber(item.inventoryItemId ?? item.inventory_item_id),
      };
    });

    const clinical = normalizedItems
      .filter((item) => item.source === "clinical")
      .map((item) => ({ name: item.name, dose: item.dose, terms: item.terms, amount: item.amount }));
    const outside = normalizedItems
      .filter((item) => item.source === "outside")
      .map((item) => ({ name: item.name, dose: item.dose, terms: item.terms, amount: item.amount }));

    const allergyRows = asArray(row.allergies);
    const allergies = allergyRows.length
      ? allergyRows.map((entry) => toString(entry.name ?? entry.allergyName, "")).filter(Boolean)
      : [];

    const dispenseItems = normalizedItems
      .filter((item) => item.inventoryItemId !== null && item.amount > 0)
      .map((item) => ({ inventoryItemId: item.inventoryItemId as number, quantity: item.amount }));

    return {
      prescriptionId,
      appointmentId,
      patientId,
      patient,
      patientCode,
      nic,
      guardianName: guardianName || undefined,
      guardianNic: guardianNic || undefined,
      guardianPhone: guardianPhone || undefined,
      guardianRelationship: guardianRelationship || undefined,
      age,
      gender,
      diagnosis,
      clinical,
      outside,
      allergies,
      dispenseItems,
    } satisfies Prescription;
  });
}

function normalizeCompletedPatients(rawCompletedAppointments: unknown, patientById: Map<number, AnyRecord>): CompletedPatient[] {
  return asArray(rawCompletedAppointments).map((row, index) => {
    const patientId = toNumber(row.patientId ?? row.patient_id ?? asRecord(row.patient)?.id);
    const nestedPatient = asRecord(row.patient) ?? null;
    const patientRow = patientId !== null ? patientById.get(patientId) : null;
    const name = toName(
      {
        ...(patientRow ?? {}),
        ...(nestedPatient ?? {}),
        name: row.patientName ?? row.patient_name ?? nestedPatient?.name ?? patientRow?.name,
        fullName: nestedPatient?.fullName ?? patientRow?.fullName,
      },
      `Patient ${index + 1}`
    );
    const patientCode = toString(
      row.patient_code ?? nestedPatient?.patient_code ?? patientRow?.patient_code,
      ""
    );
    const nic = toString(
      row.nic ??
      row.patientNic ??
      row.patient_nic ??
      nestedPatient?.nic ??
      patientRow?.nic,
      "No NIC"
    );
    const age =
      toAge(
        row.age ??
        row.patientAge ??
        row.patient_age ??
        row.date_of_birth ??
        nestedPatient?.date_of_birth ??
        nestedPatient?.age ??
        patientRow?.date_of_birth ??
        patientRow?.age
      ) ?? 0;
    const guardianNic = toString(
      row.guardian_nic ?? nestedPatient?.guardian_nic ?? patientRow?.guardian_nic,
      ""
    );
    const guardianRelationship = toString(
      row.guardian_relationship ??
        nestedPatient?.guardian_relationship ??
        patientRow?.guardian_relationship,
      ""
    );
    const resolvedProfileId = patientId !== null ? String(patientId) : undefined;
    const time = toDisplayTime(row.completedAt ?? row.updatedAt ?? row.scheduledAt ?? row.checkedAt);
    return {
      name,
      patientCode,
      age,
      nic,
      guardianNic: guardianNic || undefined,
      guardianRelationship: guardianRelationship || undefined,
      time,
      profileId: resolvedProfileId,
    } satisfies CompletedPatient;
  });
}

function normalizeDoctorAvailability(rawAppointments: unknown): AssistantDoctorAvailability[] {
  const doctorMap = new Map<string, AssistantDoctorAvailability>();
  asArray(rawAppointments).forEach((row, index) => {
    const nestedDoctor = asRecord(row.doctor);
    const doctorId = toNumber(row.doctorId ?? row.doctor_id ?? nestedDoctor?.id) ?? undefined;
    const doctorName = toString(
      row.doctorName ??
      row.doctor_name ??
      nestedDoctor?.name,
      `Doctor ${doctorId ?? index + 1}`
    );
    const statusRaw = toString(row.status, "");
    const isOnline = statusRaw === "waiting" || statusRaw === "in_consultation";
    const key = doctorId !== undefined ? String(doctorId) : doctorName.toLowerCase();
    const current = doctorMap.get(key);
    if (!current || (current.status !== "Online" && isOnline)) {
      doctorMap.set(key, {
        id: doctorId,
        name: doctorName,
        status: isOnline ? "Online" : "Offline",
      });
    }
  });
  return Array.from(doctorMap.values());
}

function normalizePatientOptions(rawPatients: unknown): AssistantPatientOption[] {
  const normalized: AssistantPatientOption[] = [];
  asArray(rawPatients).forEach((row, index) => {
    const id = toNumber(row.id ?? row.patient_id);
    if (id === null) {
      return;
    }

    normalized.push({
      id,
      name: toName(row, `Patient ${index + 1}`),
      patientCode: toString(row.patient_code, ""),
      nic: toString(row.nic, "No NIC"),
      familyId: toNumber(row.family_id) ?? undefined,
      guardianName: toString(row.guardian_name, "") || undefined,
      guardianNic: toString(row.guardian_nic, "") || undefined,
    });
  });
  return normalized;
}

function normalizeFamilyOptions(rawFamilies: unknown): AssistantFamilyOption[] {
  const normalized: AssistantFamilyOption[] = [];
  asArray(rawFamilies).forEach((row, index) => {
    const id = toNumber(row.id ?? row.family_id);
    if (id === null) {
      return;
    }

    normalized.push({
      id,
      name: toString(row.name ?? row.familyName, `Family ${index + 1}`),
      familyCode: toString(row.family_code ?? row.familyCode, "") || undefined,
    });
  });
  return normalized.sort((left, right) => left.name.localeCompare(right.name));
}

function normalizeStats(rawAnalytics: unknown, rawPatients: unknown) {
  const analytics = asRecord(rawAnalytics) ?? {};
  const patients = asArray(rawPatients);
  const total = toNumber(analytics.totalPatients ?? analytics.total ?? analytics.patientCount) ?? patients.length;
  const male = toNumber(analytics.totalMale ?? analytics.male ?? analytics.malePatients) ??
    patients.filter((patient) => toString(patient.gender).toLowerCase() === "male").length;
  const female = toNumber(analytics.totalFemale ?? analytics.female ?? analytics.femalePatients) ??
    patients.filter((patient) => toString(patient.gender).toLowerCase() === "female").length;
  const existing = toNumber(analytics.existingPatients ?? analytics.existing) ?? Math.max(total - 1, 0);
  const addedToday = toNumber(analytics.newPatients ?? analytics.new ?? analytics.todayNewPatients) ?? 1;
  return { total, male, female, existing, new: addedToday };
}

export function useAssistantWorkflow() {
  const queryClient = useQueryClient();
  const pendingQueueQuery = usePendingDispenseQueueQuery();
  const allAppointmentsQuery = useAppointmentsQuery();
  const completedAppointmentsQuery = useAppointmentsQuery({ status: "completed" });
  const patientsQuery = usePatientsQuery();
  const familiesQuery = useFamiliesQuery();
  const analyticsOverviewQuery = useAnalyticsOverviewQuery();
  const currentUserQuery = useCurrentUserQuery();
  const [activeIndex, setActiveIndex] = useState(0);

  const [formState, setFormStateState] = useState<AssistantFormState>({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    gender: "Male",
    nic: "",
    mobile: "",
    address: "",
    allergyInput: "",
    allergySeverity: "moderate",
    allergies: [],
    bloodGroup: "O+",
    priority: "Normal",
    regularDrug: "",
    guardian: {
      guardianPatientId: "",
      guardianName: "",
      guardianNic: "",
      guardianPhone: "",
      guardianRelationship: "",
      familyId: "",
      familyCode: "",
    },
  });

  const [completedSearch, setCompletedSearch] = useState("");
  const [createPatientState, setCreatePatientState] = useState<MutationState>(idleMutationState());
  const [scheduleAppointmentState, setScheduleAppointmentState] = useState<MutationState>(
    idleMutationState()
  );
  const [dispenseState, setDispenseState] = useState<MutationState>(idleMutationState());
  const [scheduleForm, setScheduleFormState] = useState<AssistantScheduleFormState>({
    patientId: "",
    doctorId: "",
    scheduledAt: getDefaultScheduledAt(),
    reason: "",
    priority: "Normal",
  });

  const clearCreatePatientState = () => {
    setCreatePatientState((current) => (current.status === "idle" ? current : idleMutationState()));
  };

  const clearScheduleAppointmentState = () => {
    setScheduleAppointmentState((current) =>
      current.status === "idle" ? current : idleMutationState()
    );
  };

  const setFormState = (value: SetStateAction<AssistantFormState>) => {
    clearCreatePatientState();
    setFormStateState(value);
  };

  const setScheduleForm = (value: SetStateAction<AssistantScheduleFormState>) => {
    clearScheduleAppointmentState();
    setScheduleFormState(value);
  };
  const rawPatients = patientsQuery.data ?? EMPTY_ROWS;
  const patientById = useMemo(() => normalizePatientsById(rawPatients), [rawPatients]);
  const pendingPatients = useMemo(
    () => normalizePendingQueue(pendingQueueQuery.data ?? EMPTY_ROWS, patientById),
    [patientById, pendingQueueQuery.data]
  );
  const completed = useMemo(
    () => normalizeCompletedPatients(completedAppointmentsQuery.data ?? EMPTY_ROWS, patientById),
    [completedAppointmentsQuery.data, patientById]
  );
  const availableDoctors = useMemo(
    () => normalizeDoctorAvailability(allAppointmentsQuery.data ?? EMPTY_ROWS),
    [allAppointmentsQuery.data]
  );
  const patientOptions = useMemo(
    () => normalizePatientOptions(rawPatients),
    [rawPatients]
  );
  const familyOptions = useMemo(
    () => normalizeFamilyOptions(familiesQuery.data ?? EMPTY_ROWS),
    [familiesQuery.data]
  );
  const stats = useMemo(
    () => normalizeStats(analyticsOverviewQuery.data ?? {}, rawPatients),
    [analyticsOverviewQuery.data, rawPatients]
  );
  const currentUserId = currentUserQuery.data?.id ?? null;
  const canCreatePatientsInWorkflow =
    !!currentUserQuery.data && hasPermission(currentUserQuery.data, "patient.write");
  const patientActionDisabledReason =
    currentUserQuery.isPending || currentUserQuery.isFetching
      ? "Checking patient registration access."
      : currentUserQuery.data && !hasPermission(currentUserQuery.data, "patient.write")
        ? "Patient-write permission is required before registering patients."
        : null;
  const canManageAssistantWorkflow =
    !!currentUserQuery.data && hasPermission(currentUserQuery.data, "prescription.dispense");
  const workflowActionDisabledReason =
    currentUserQuery.isPending || currentUserQuery.isFetching
      ? "Checking dispense access."
      : currentUserQuery.data && !canManageAssistantWorkflow
        ? "Prescription-dispense permission is required before completing pickup actions."
        : null;
  const canCreateAppointmentsInWorkflow =
    !!currentUserQuery.data &&
    hasPermission(currentUserQuery.data, "appointment.create") &&
    currentUserId !== null;
  const appointmentActionDisabledReason =
    currentUserQuery.isPending || currentUserQuery.isFetching
      ? "Checking appointment scheduling access."
      : currentUserQuery.data && !canCreateAppointmentsInWorkflow
        ? "Appointment-create permission with an active session is required before scheduling."
        : currentUserQuery.data && currentUserId === null
          ? "Session identity is missing for appointment scheduling."
        : null;

  const refreshAssistantQueries = async (includeCurrentUser = false) => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.prescriptions.pendingDispenseQueue }),
      queryClient.invalidateQueries({ queryKey: queryKeys.appointments.list() }),
      queryClient.invalidateQueries({ queryKey: queryKeys.patients.list }),
      queryClient.invalidateQueries({ queryKey: queryKeys.patients.directory }),
      queryClient.invalidateQueries({ queryKey: queryKeys.families.list }),
      queryClient.invalidateQueries({ queryKey: queryKeys.analytics.overview }),
      ...(includeCurrentUser
        ? [queryClient.invalidateQueries({ queryKey: queryKeys.auth.currentUser })]
        : []),
      pendingQueueQuery.refetch(),
      allAppointmentsQuery.refetch(),
      completedAppointmentsQuery.refetch(),
      patientsQuery.refetch(),
      familiesQuery.refetch(),
      analyticsOverviewQuery.refetch(),
      ...(includeCurrentUser ? [currentUserQuery.refetch()] : []),
    ]);
  };

  const loadState: LoadState = useMemo(() => {
    const criticalQueries = [pendingQueueQuery, allAppointmentsQuery, completedAppointmentsQuery, patientsQuery];
    const allPending = criticalQueries.every((query) => query.isPending);
    if (allPending) {
      return loadingLoadState();
    }

    const criticalFailures =
      pendingQueueQuery.isError &&
      allAppointmentsQuery.isError &&
      completedAppointmentsQuery.isError &&
      patientsQuery.isError;
    if (criticalFailures) {
      return errorLoadState(
        ((pendingQueueQuery.error as unknown as ApiClientError | undefined)?.message ??
          (allAppointmentsQuery.error as unknown as ApiClientError | undefined)?.message ??
          (completedAppointmentsQuery.error as unknown as ApiClientError | undefined)?.message ??
          (patientsQuery.error as unknown as ApiClientError | undefined)?.message ??
          "Unable to sync assistant data.")
      );
    }

    const hasVisibleData =
      patientById.size > 0 || pendingPatients.length > 0 || completed.length > 0;
    const partialFailure =
      pendingQueueQuery.isError ||
      allAppointmentsQuery.isError ||
      completedAppointmentsQuery.isError ||
      patientsQuery.isError ||
      familiesQuery.isError ||
      analyticsOverviewQuery.isError ||
      currentUserQuery.isError;

    const notice = partialFailure
      ? "Some assistant feeds failed and fallback data is being shown."
      : null;
    return hasVisibleData ? readyLoadState(notice) : emptyLoadState(notice);
  }, [
    allAppointmentsQuery,
    analyticsOverviewQuery.isError,
    completed,
    completedAppointmentsQuery,
    currentUserQuery.isError,
    familiesQuery.isError,
    patientById.size,
    patientsQuery,
    pendingPatients.length,
    pendingQueueQuery,
  ]);

  const filteredCompleted = useMemo(
    () =>
      completed.filter((entry) =>
        `${entry.name} ${entry.patientCode} ${entry.nic} ${entry.guardianNic ?? ""} ${entry.guardianRelationship ?? ""}`
          .toLowerCase()
          .includes(completedSearch.toLowerCase())
      ),
    [completed, completedSearch]
  );

  const addPatient = async () => {
    if (!canCreatePatientsInWorkflow) {
      setCreatePatientState(
        errorMutationState(
          patientActionDisabledReason ??
            "Patient registration access is required before adding patients."
        )
      );
      return;
    }

    const isMinor = (() => {
      if (!formState.dateOfBirth) return false;
      return toAge(formState.dateOfBirth, 0) < 18;
    })();
    const hasGuardianLink = Boolean(formState.guardian.guardianPatientId);
    const hasGuardianName = Boolean(formState.guardian.guardianName.trim());
    const hasGuardianContact = Boolean(
      formState.guardian.guardianNic.trim() || formState.guardian.guardianPhone.trim()
    );

    if (!formState.firstName.trim() || !formState.lastName.trim() || !formState.dateOfBirth) {
      setCreatePatientState(
        errorMutationState("First name, last name, and date of birth are required before adding a patient.")
      );
      return;
    }
    if (!isValidSriLankanNic(formState.nic)) {
      setCreatePatientState(
        errorMutationState("Patient NIC must be 12 digits or 9 digits followed by V/X.")
      );
      return;
    }
    if (!isValidSriLankanNic(formState.guardian.guardianNic)) {
      setCreatePatientState(
        errorMutationState("Guardian NIC must be 12 digits or 9 digits followed by V/X.")
      );
      return;
    }
    if (isMinor && !hasGuardianLink && !hasGuardianName) {
      setCreatePatientState(
        errorMutationState("Child registration needs an existing guardian link or guardian name.")
      );
      return;
    }
    if (isMinor && !hasGuardianLink && !hasGuardianContact) {
      setCreatePatientState(
        errorMutationState("Child registration needs guardian NIC or guardian phone.")
      );
      return;
    }
    try {
      setCreatePatientState(pendingMutationState());
      const createdPatient = await createPatient({
        firstName: formState.firstName.trim(),
        lastName: formState.lastName.trim(),
        dob: formState.dateOfBirth,
        gender: formState.gender.toLowerCase() as "male" | "female",
        nic: formState.nic.trim() || null,
        phone: normalizeSriLankanPhone(formState.mobile) || null,
        address: formState.address.trim() || null,
        bloodGroup: formState.bloodGroup.trim() || null,
        priority: mapAssistantPriorityToApiPriority(formState.priority),
        allergies: formState.allergies.map((entry) => ({
          allergyName: entry.name,
          severity: entry.severity,
          isActive: true,
        })),
        ...(formState.guardian.familyId ? { familyId: Number(formState.guardian.familyId) } : {}),
        ...(!formState.guardian.familyId && formState.guardian.familyCode.trim()
          ? { familyCode: formState.guardian.familyCode.trim() }
          : {}),
        ...(formState.guardian.guardianPatientId
          ? { guardianPatientId: Number(formState.guardian.guardianPatientId) }
          : {}),
        ...(formState.guardian.guardianName.trim()
          ? { guardianName: formState.guardian.guardianName.trim() }
          : {}),
        ...(formState.guardian.guardianNic.trim()
          ? { guardianNic: formState.guardian.guardianNic.trim() }
          : {}),
        ...(formState.guardian.guardianPhone.trim()
          ? { guardianPhone: normalizeSriLankanPhone(formState.guardian.guardianPhone) }
          : {}),
        ...(formState.guardian.guardianRelationship.trim()
          ? { guardianRelationship: formState.guardian.guardianRelationship.trim() }
          : {}),
      });
      const createdPatientRecord = asRecord(createdPatient);
      const createdPatientId = toNumber(
        createdPatientRecord?.id ??
          createdPatientRecord?.patientId ??
          createdPatientRecord?.patient_id
      );

      setFormState((prev) => ({
        ...prev,
        nic: "",
        firstName: "",
        lastName: "",
        dateOfBirth: "",
        gender: "Male",
        mobile: "",
        address: "",
        allergyInput: "",
        allergySeverity: "moderate",
        allergies: [],
        bloodGroup: "O+",
        regularDrug: "",
        priority: "Normal",
        guardian: {
          guardianPatientId: "",
          guardianName: "",
          guardianNic: "",
          guardianPhone: "",
          guardianRelationship: "",
          familyId: "",
          familyCode: "",
        },
      }));
      if (createdPatientId !== null) {
        setScheduleForm((prev) => ({
          ...prev,
          patientId: String(createdPatientId),
        }));
      }
      await refreshAssistantQueries();
      setCreatePatientState(successMutationState("Patient added successfully."));
    } catch (error) {
      const message = (error as ApiClientError)?.message ?? "Failed to create patient.";
      setCreatePatientState(errorMutationState(message));
    }
  };

  const addAllergy = () => {
    const entry = formState.allergyInput.trim().replace(/\s+/g, " ");
    if (!entry) return;
    setFormState((prev) => ({
      ...prev,
      allergies: prev.allergies.some(
        (allergy) => normalizeAllergyName(allergy.name) === normalizeAllergyName(entry)
      )
        ? prev.allergies.map((allergy) =>
            normalizeAllergyName(allergy.name) === normalizeAllergyName(entry)
              ? ({ ...allergy, severity: prev.allergySeverity } satisfies AssistantAllergyEntry)
              : allergy
          )
        : [...prev.allergies, { name: entry, severity: prev.allergySeverity }],
      allergyInput: "",
    }));
  };

  const scheduleAppointment = async () => {
    if (!canCreateAppointmentsInWorkflow) {
      setScheduleAppointmentState(
        errorMutationState(
          appointmentActionDisabledReason ??
            "Appointment scheduling access is required before creating appointments."
        )
      );
      return;
    }

    const patientId = Number(scheduleForm.patientId);
    const doctorId = Number(scheduleForm.doctorId);
    if (!Number.isInteger(patientId) || patientId <= 0) {
      setScheduleAppointmentState(
        errorMutationState("Select a patient before scheduling an appointment.")
      );
      return;
    }

    if (!Number.isInteger(doctorId) || doctorId <= 0) {
      setScheduleAppointmentState(
        errorMutationState("Select a doctor before scheduling an appointment.")
      );
      return;
    }

    if (!scheduleForm.reason.trim()) {
      setScheduleAppointmentState(
        errorMutationState("Consultation reason is required before scheduling an appointment.")
      );
      return;
    }

    if (!scheduleForm.scheduledAt.trim()) {
      setScheduleAppointmentState(
        errorMutationState("Select an appointment time before scheduling.")
      );
      return;
    }

    if (!currentUserId) {
      setScheduleAppointmentState(
        errorMutationState("Session identity is missing for appointment scheduling.")
      );
      return;
    }

    try {
      setScheduleAppointmentState(pendingMutationState());
      await createAppointment({
        patientId,
        doctorId,
        assistantId: currentUserId,
        scheduledAt: new Date(scheduleForm.scheduledAt).toISOString(),
        status: "waiting",
        reason: scheduleForm.reason.trim(),
        priority:
          scheduleForm.priority === "Critical"
            ? "critical"
            : scheduleForm.priority === "Urgent"
              ? "high"
              : "normal",
      });

      setScheduleForm({
        patientId: "",
        doctorId: "",
        scheduledAt: getDefaultScheduledAt(),
        reason: "",
        priority: "Normal",
      });
      await refreshAssistantQueries();
      setScheduleAppointmentState(successMutationState("Appointment scheduled successfully."));
    } catch (error) {
      const message = (error as ApiClientError)?.message ?? "Failed to schedule appointment.";
      setScheduleAppointmentState(errorMutationState(message));
    }
  };

  const markDoneAndNext = async () => {
    if (!canManageAssistantWorkflow) {
      setDispenseState(
        errorMutationState(
          workflowActionDisabledReason ??
            "Assistant workflow access is required before dispensing prescriptions."
        )
      );
      return;
    }

    const activePrescription =
      pendingPatients[
        pendingPatients.length ? Math.min(activeIndex, pendingPatients.length - 1) : 0
      ];
    if (!activePrescription) return;
    if (!activePrescription.prescriptionId || !currentUserId) {
      setDispenseState(
        errorMutationState("Prescription or session identity is missing for this queue item.")
      );
      setActiveIndex((prev) => (pendingPatients.length ? (prev + 1) % pendingPatients.length : 0));
      return;
    }

    try {
      setDispenseState(pendingMutationState());
      await dispensePrescription(activePrescription.prescriptionId, {
        assistantId: currentUserId,
        dispensedAt: new Date().toISOString(),
        status: "completed",
        notes: "Dispensed from assistant queue",
        items: activePrescription.dispenseItems ?? [],
      });
      await refreshAssistantQueries();
      setDispenseState(successMutationState("Prescription marked as dispensed."));
    } catch (error) {
      const message = (error as ApiClientError)?.message ?? "Failed to mark dispense.";
      setDispenseState(errorMutationState(message));
    }
  };

  const createPatientFeedback = getMutationFeedback(createPatientState, {
    pendingMessage: "Adding patient...",
    errorMessage: "Failed to create patient.",
  });
  const scheduleAppointmentFeedback = getMutationFeedback(scheduleAppointmentState, {
    pendingMessage: "Scheduling appointment...",
    errorMessage: "Failed to schedule appointment.",
  });
  const dispenseFeedback = getMutationFeedback(dispenseState, {
    pendingMessage: "Saving dispense action...",
    errorMessage: "Failed to mark dispense.",
  });

  return {
    pendingPatients,
    activePrescription:
      pendingPatients[
        pendingPatients.length ? Math.min(activeIndex, pendingPatients.length - 1) : 0
      ],
    formState,
    setFormState,
    completedSearch,
    setCompletedSearch,
    stats,
    availableDoctors,
    patientOptions,
    familyOptions,
    filteredCompleted,
    addPatient,
    addAllergy,
    scheduleForm,
    setScheduleForm,
    scheduleAppointment,
    markDoneAndNext,
    loadState,
    createPatientState,
    createPatientFeedback,
    scheduleAppointmentState,
    scheduleAppointmentFeedback,
    dispenseState,
    dispenseFeedback,
    canManageAssistantWorkflow,
    canCreatePatientsInWorkflow,
    patientActionDisabledReason,
    workflowActionDisabledReason,
    canCreateAppointmentsInWorkflow,
    appointmentActionDisabledReason,
    reload: () => {
      void refreshAssistantQueries(true);
    },
    isSyncing:
      pendingQueueQuery.isFetching ||
      allAppointmentsQuery.isFetching ||
      completedAppointmentsQuery.isFetching ||
      patientsQuery.isFetching ||
      familiesQuery.isFetching ||
      analyticsOverviewQuery.isFetching ||
      currentUserQuery.isFetching,
    syncError:
      loadState.error ??
      createPatientState.error ??
      scheduleAppointmentState.error ??
      dispenseState.error,
  };
}
