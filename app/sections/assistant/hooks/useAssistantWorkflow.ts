import { type SetStateAction, useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  createAppointment,
  createPatient,
  dispensePrescription,
  type ApiClientError,
  searchInventory,
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
  useAppointmentDoctorsQuery,
  useAppointmentsQuery,
  useCurrentUserQuery,
  useFamiliesQuery,
  usePatientsQuery,
  usePendingDispenseQueueQuery,
} from "../../../lib/query-hooks";
import { queryKeys } from "../../../lib/query-keys";
import { notifyError, notifySuccess, notifyWarning } from "../../../lib/notifications";
import {
  assistantPatientFormSchema,
  assistantScheduleFormSchema,
  mapZodFieldErrors,
} from "../../../lib/validation/forms";
import type {
  AssistantAllergyEntry,
  AssistantDoctorAvailability,
  AssistantFamilyOption,
  AssistantFormState,
  AssistantPatientOption,
  AssistantScheduleFormState,
  CompletedPatient,
  Prescription,
  PrescriptionDrugEntry,
} from "../types";

type AnyRecord = Record<string, unknown>;
type InventorySearchOption = { id: number; name: string; quantity: number; category?: string };
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

function normalizeLookupValue(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function buildDispenseDrugKey(
  prescriptionId: number | undefined,
  item: Pick<PrescriptionDrugEntry, "name" | "dose" | "terms" | "amount">
) {
  return [
    prescriptionId ?? "draft",
    normalizeLookupValue(item.name),
    normalizeLookupValue(item.dose),
    normalizeLookupValue(item.terms),
    item.amount,
  ].join("::");
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

function buildInitialAssistantFormState(): AssistantFormState {
  return {
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
  };
}

function buildInitialScheduleFormState(): AssistantScheduleFormState {
  return {
    patientId: "",
    doctorId: "",
    scheduledAt: getDefaultScheduledAt(),
    reason: "",
    priority: "Normal",
  };
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
    const encounterId = toNumber(row.encounterId ?? row.encounter_id) ?? undefined;
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
      .map((item) => ({
        name: item.name,
        dose: item.dose,
        terms: item.terms,
        amount: item.amount,
        ...(item.inventoryItemId !== null ? { inventoryItemId: item.inventoryItemId } : {}),
      }));
    const outside = normalizedItems
      .filter((item) => item.source === "outside")
      .map((item) => ({
        name: item.name,
        dose: item.dose,
        terms: item.terms,
        amount: item.amount,
        ...(item.inventoryItemId !== null ? { inventoryItemId: item.inventoryItemId } : {}),
      }));

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
      encounterId,
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

function normalizeAppointmentDoctors(rawDoctors: unknown): Array<{
  id: number;
  name: string;
  email?: string;
  isActive?: boolean;
  doctorWorkflowMode: "self_service" | "clinic_supported" | null;
}> {
  return asArray(rawDoctors)
    .map((row, index) => {
      const id = toNumber(row.id ?? row.user_id ?? row.userId);
      if (id === null) return null;
      const name = toString(row.name, `Doctor ${index + 1}`);
      const modeRaw = toString(
        row.doctor_workflow_mode ?? row.doctorWorkflowMode,
        ""
      );
      const doctorWorkflowMode =
        modeRaw === "self_service" || modeRaw === "clinic_supported"
          ? (modeRaw as "self_service" | "clinic_supported")
          : null;
      const email = toString(row.email, "");
      const isActive = typeof row.is_active === "boolean" ? row.is_active : undefined;
      return {
        id,
        name,
        doctorWorkflowMode,
        ...(email ? { email } : {}),
        ...(isActive !== undefined ? { isActive } : {}),
      };
    })
    .filter(
      (
        row
      ): row is {
        id: number;
        name: string;
        email?: string;
        isActive?: boolean;
        doctorWorkflowMode: "self_service" | "clinic_supported" | null;
      } => row !== null
    );
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
  const patientsQuery = usePatientsQuery({ scope: "organization" });
  const familiesQuery = useFamiliesQuery();
  const analyticsOverviewQuery = useAnalyticsOverviewQuery();
  const currentUserQuery = useCurrentUserQuery();
  const appointmentDoctorsQuery = useAppointmentDoctorsQuery();
  const [activeIndex, setActiveIndex] = useState(0);

  const [formState, setFormStateState] = useState<AssistantFormState>(
    buildInitialAssistantFormState()
  );

  const [completedSearch, setCompletedSearch] = useState("");
  const [createPatientState, setCreatePatientState] = useState<MutationState>(idleMutationState());
  const [createPatientFieldErrors, setCreatePatientFieldErrors] = useState<
    Partial<Record<"firstName" | "lastName" | "dateOfBirth" | "nic" | "guardianNic" | "guardianContact" | "guardianName", string>>
  >({});
  const [scheduleAppointmentState, setScheduleAppointmentState] = useState<MutationState>(
    idleMutationState()
  );
  const [scheduleFieldErrors, setScheduleFieldErrors] = useState<
    Partial<Record<"patientId" | "doctorId" | "scheduledAt" | "reason", string>>
  >({});
  const [dispenseState, setDispenseState] = useState<MutationState>(idleMutationState());
  const [scheduleForm, setScheduleFormState] = useState<AssistantScheduleFormState>(
    buildInitialScheduleFormState()
  );

  const clearCreatePatientState = () => {
    setCreatePatientState((current) => (current.status === "idle" ? current : idleMutationState()));
    setCreatePatientFieldErrors({});
  };

  const clearScheduleAppointmentState = () => {
    setScheduleAppointmentState((current) =>
      current.status === "idle" ? current : idleMutationState()
    );
    setScheduleFieldErrors({});
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
  const availableDoctors = useMemo(() => {
    const appointmentDoctors = normalizeDoctorAvailability(
      allAppointmentsQuery.data ?? EMPTY_ROWS
    );
    const doctorDirectory = normalizeAppointmentDoctors(
      appointmentDoctorsQuery.data ?? EMPTY_ROWS
    );

    if (!doctorDirectory.length) {
      return appointmentDoctors;
    }

    const hasExplicitWorkflowMode = doctorDirectory.some(
      (doctor) => doctor.doctorWorkflowMode !== null
    );
    const orgAppointmentDoctors = hasExplicitWorkflowMode
      ? doctorDirectory.filter(
          (doctor) => doctor.doctorWorkflowMode === "clinic_supported"
        )
      : doctorDirectory;

    const appointmentStatusByDoctorId = new Map(
      appointmentDoctors
        .filter((doctor) => typeof doctor.id === "number")
        .map((doctor) => [doctor.id as number, doctor.status])
    );

    return orgAppointmentDoctors.map((doctor) => ({
      id: doctor.id,
      name: doctor.name,
      email: doctor.email,
      doctorWorkflowMode: doctor.doctorWorkflowMode,
      isActive: doctor.isActive,
      status:
        appointmentStatusByDoctorId.get(doctor.id) ??
        (doctor.isActive === false ? "Inactive" : "Active"),
    }));
  }, [allAppointmentsQuery.data, appointmentDoctorsQuery.data]);
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
  const currentRole = currentUserQuery.data?.role ?? null;
  const [inventorySearchOptions, setInventorySearchOptions] = useState<
    Record<string, InventorySearchOption[]>
  >({});
  const [resolvedInventorySelections, setResolvedInventorySelections] = useState<Record<string, number>>(
    {}
  );
  const [dispenseCooldownUntil, setDispenseCooldownUntil] = useState<number | null>(null);
  const [dispenseCooldownSeconds, setDispenseCooldownSeconds] = useState(0);
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
  const activePrescription =
    pendingPatients[
      pendingPatients.length ? Math.min(activeIndex, pendingPatients.length - 1) : 0
    ];
  const activeClinicalResolutionRows = useMemo(
    () =>
      (activePrescription?.clinical ?? []).map((item) => {
        const key = buildDispenseDrugKey(activePrescription?.prescriptionId, item);
        const resolvedInventoryItemId =
          item.inventoryItemId ?? resolvedInventorySelections[key] ?? null;
        return {
          key,
          item,
          resolvedInventoryItemId,
          options: inventorySearchOptions[key] ?? [],
        };
      }),
    [activePrescription, inventorySearchOptions, resolvedInventorySelections]
  );
  const dispensePayloadItems = useMemo(
    () =>
      activeClinicalResolutionRows
        .filter((entry) => entry.resolvedInventoryItemId !== null && entry.item.amount > 0)
        .map((entry) => ({
          inventoryItemId: entry.resolvedInventoryItemId as number,
          quantity: entry.item.amount,
        })),
    [activeClinicalResolutionRows]
  );
  const hasClinicalItemsToResolve = activeClinicalResolutionRows.length > 0;
  const canSubmitDispense =
    canManageAssistantWorkflow &&
    !!activePrescription?.prescriptionId &&
    dispenseCooldownSeconds === 0 &&
    (!hasClinicalItemsToResolve ||
      (dispensePayloadItems.length > 0 &&
        activeClinicalResolutionRows.every((entry) => entry.resolvedInventoryItemId !== null)));
  const dispenseActionDisabledReason =
    !activePrescription
      ? "No prescription is selected for dispensing."
      : dispenseCooldownSeconds > 0
        ? `Too many dispense attempts. Try again in ${dispenseCooldownSeconds} seconds.`
      : !canManageAssistantWorkflow
        ? workflowActionDisabledReason
        : hasClinicalItemsToResolve && dispensePayloadItems.length === 0
          ? "Resolve at least one stock item before dispensing."
          : hasClinicalItemsToResolve &&
              activeClinicalResolutionRows.some((entry) => entry.resolvedInventoryItemId === null)
            ? "Resolve every clinical drug to a stock item before dispensing."
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
      queryClient.invalidateQueries({ queryKey: queryKeys.patients.list() }),
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
      notifyWarning(
        patientActionDisabledReason ??
          "Patient registration access is required before adding patients."
      );
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

    const patientValidation = assistantPatientFormSchema.safeParse({
      firstName: formState.firstName,
      lastName: formState.lastName,
      dateOfBirth: formState.dateOfBirth,
      nic: formState.nic,
      guardianNic: formState.guardian.guardianNic,
      isMinor,
      hasGuardianLink,
      guardianName: formState.guardian.guardianName,
      guardianContact: `${formState.guardian.guardianNic} ${formState.guardian.guardianPhone}`.trim(),
    });
    if (!patientValidation.success) {
      const mapped = mapZodFieldErrors(patientValidation.error);
      setCreatePatientFieldErrors({
        firstName: mapped.firstName,
        lastName: mapped.lastName,
        dateOfBirth: mapped.dateOfBirth,
        nic: mapped.nic,
        guardianNic: mapped.guardianNic,
        guardianContact: mapped.guardianContact,
        guardianName: mapped.guardianName,
      });
      notifyError("Please fix the highlighted patient form errors.");
      setCreatePatientState(errorMutationState("Please fix the highlighted patient form errors."));
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

      setFormState(buildInitialAssistantFormState());
      if (createdPatientId !== null) {
        setScheduleForm((prev) => ({
          ...prev,
          patientId: String(createdPatientId),
        }));
      }
      await refreshAssistantQueries();
      setCreatePatientState(successMutationState("Patient added successfully."));
      notifySuccess("Patient added successfully.");
    } catch (error) {
      const message = (error as ApiClientError)?.message ?? "Failed to create patient.";
      notifyError(message);
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
      notifyWarning(
        appointmentActionDisabledReason ??
          "Appointment scheduling access is required before creating appointments."
      );
      setScheduleAppointmentState(
        errorMutationState(
          appointmentActionDisabledReason ??
            "Appointment scheduling access is required before creating appointments."
        )
      );
      return;
    }

    const scheduleValidation = assistantScheduleFormSchema.safeParse({
      patientId: scheduleForm.patientId,
      doctorId: scheduleForm.doctorId,
      scheduledAt: scheduleForm.scheduledAt,
      reason: scheduleForm.reason,
    });
    if (!scheduleValidation.success) {
      const mapped = mapZodFieldErrors(scheduleValidation.error);
      setScheduleFieldErrors({
        patientId: mapped.patientId,
        doctorId: mapped.doctorId,
        scheduledAt: mapped.scheduledAt,
        reason: mapped.reason,
      });
      notifyError("Please fix the highlighted appointment form errors.");
      setScheduleAppointmentState(
        errorMutationState("Please fix the highlighted appointment form errors.")
      );
      return;
    }
    const patientId = Number(scheduleForm.patientId);
    const doctorId = Number(scheduleForm.doctorId);

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

      setScheduleForm(buildInitialScheduleFormState());
      await refreshAssistantQueries();
      setScheduleAppointmentState(successMutationState("Appointment scheduled successfully."));
      notifySuccess("Appointment scheduled successfully.");
    } catch (error) {
      const message = (error as ApiClientError)?.message ?? "Failed to schedule appointment.";
      notifyError(message);
      setScheduleAppointmentState(errorMutationState(message));
    }
  };

  useEffect(() => {
    const unresolvedEntries = activeClinicalResolutionRows.filter(
      (entry) => entry.resolvedInventoryItemId === null
    );
    if (unresolvedEntries.length === 0) {
      return;
    }

    let cancelled = false;
    void Promise.all(
      unresolvedEntries.map(async (entry) => {
        if (Object.prototype.hasOwnProperty.call(inventorySearchOptions, entry.key)) {
          return;
        }
        try {
          const results = await searchInventory({
            q: entry.item.name,
            limit: 10,
            category: "medicine",
          });
          if (cancelled) {
            return;
          }
          const normalized = results
            .map((row): InventorySearchOption | null => {
              const record = asRecord(row);
              if (!record) {
                return null;
              }
              const id = toNumber(record.id ?? record.inventoryId ?? record.inventory_id);
              const name = toString(record.name ?? record.itemName, "").trim();
              const quantity = toNumber(record.quantity ?? record.stockQuantity) ?? 0;
              if (id === null || !name) {
                return null;
              }
              return {
                id,
                name,
                quantity,
                ...(toString(record.category ?? record.type, "").trim()
                  ? { category: toString(record.category ?? record.type, "").trim() }
                  : {}),
              };
            })
            .filter((option): option is InventorySearchOption => option !== null);

          setInventorySearchOptions((current) => ({
            ...current,
            [entry.key]: normalized,
          }));
          if (normalized.length === 1) {
            setResolvedInventorySelections((current) =>
              current[entry.key] ? current : { ...current, [entry.key]: normalized[0]!.id }
            );
          }
        } catch {
          if (!cancelled) {
            setInventorySearchOptions((current) => ({
              ...current,
              [entry.key]: [],
            }));
          }
        }
      })
    );

    return () => {
      cancelled = true;
    };
  }, [activeClinicalResolutionRows, inventorySearchOptions]);

  useEffect(() => {
    if (dispenseCooldownUntil === null) {
      return;
    }

    const updateCountdown = () => {
      const remainingSeconds = Math.max(
        0,
        Math.ceil((dispenseCooldownUntil - Date.now()) / 1000)
      );
      setDispenseCooldownSeconds(remainingSeconds);
      if (remainingSeconds === 0) {
        setDispenseCooldownUntil(null);
      }
      return remainingSeconds;
    };

    if (updateCountdown() === 0) {
      return;
    }

    const intervalId = window.setInterval(() => {
      updateCountdown();
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [dispenseCooldownUntil]);

  const setResolvedInventoryItem = (drugKey: string, inventoryItemId: number) => {
    setResolvedInventorySelections((current) => ({
      ...current,
      [drugKey]: inventoryItemId,
    }));
  };

  const markDoneAndNext = async () => {
    if (!canManageAssistantWorkflow) {
      setDispenseState(
        errorMutationState(
          workflowActionDisabledReason ??
            "Assistant workflow access is required before dispensing prescriptions."
        )
      );
      notifyWarning(
        workflowActionDisabledReason ??
          "Assistant workflow access is required before dispensing prescriptions."
      );
      return;
    }

    if (!activePrescription) return;
    if (!activePrescription.prescriptionId || !currentUserId) {
      setDispenseState(
        errorMutationState("Prescription or session identity is missing for this queue item.")
      );
      notifyError("Prescription or session identity is missing for this queue item.");
      setActiveIndex((prev) => (pendingPatients.length ? (prev + 1) % pendingPatients.length : 0));
      return;
    }
    if (!canSubmitDispense) {
      setDispenseState(
        errorMutationState(
          dispenseActionDisabledReason ?? "Resolve stock items before completing dispense."
        )
      );
      notifyWarning(dispenseActionDisabledReason ?? "Resolve stock items before completing dispense.");
      return;
    }

    try {
      setDispenseState(pendingMutationState());
      await dispensePrescription(activePrescription.prescriptionId, {
        assistantId: currentUserId,
        dispensedAt: new Date().toISOString(),
        status: "completed",
        notes: "Dispensed from assistant queue",
        items: dispensePayloadItems,
      });
      await refreshAssistantQueries();
      setDispenseCooldownUntil(null);
      setDispenseCooldownSeconds(0);
      setDispenseState(successMutationState("Prescription marked as dispensed."));
      notifySuccess("Prescription marked as dispensed.");
    } catch (error) {
      const apiError = error as ApiClientError;
      if (apiError?.status === 429) {
        const retryAfterSeconds =
          apiError.retryAfterSeconds && apiError.retryAfterSeconds > 0
            ? apiError.retryAfterSeconds
            : 10;
        setDispenseCooldownUntil(Date.now() + retryAfterSeconds * 1000);
        setDispenseCooldownSeconds(retryAfterSeconds);
        setDispenseState(
          errorMutationState(
            `Too many dispense attempts. Try again in ${retryAfterSeconds} seconds.`
          )
        );
        notifyWarning(`Too many dispense attempts. Try again in ${retryAfterSeconds} seconds.`);
        return;
      }
      const message = apiError?.message ?? "Failed to mark dispense.";
      notifyError(message);
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
    activePrescription,
    activeClinicalResolutionRows,
    canSubmitDispense,
    dispenseActionDisabledReason,
    setResolvedInventoryItem,
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
    resetPatientForm: () => {
      setFormState(buildInitialAssistantFormState());
      clearCreatePatientState();
    },
    scheduleForm,
    setScheduleForm,
    scheduleAppointment,
    resetScheduleForm: () => {
      setScheduleForm(buildInitialScheduleFormState());
      clearScheduleAppointmentState();
    },
    markDoneAndNext,
    loadState,
    createPatientState,
    createPatientFieldErrors,
    createPatientFeedback,
    scheduleAppointmentState,
    scheduleFieldErrors,
    scheduleAppointmentFeedback,
    dispenseState,
    dispenseFeedback,
    canManageAssistantWorkflow,
    canCreatePatientsInWorkflow,
    patientActionDisabledReason,
    workflowActionDisabledReason,
    canCreateAppointmentsInWorkflow,
    appointmentActionDisabledReason,
    currentRole,
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
