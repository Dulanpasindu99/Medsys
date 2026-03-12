import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  createPatient,
  dispensePrescription,
  type ApiClientError,
} from "../../../lib/api-client";
import {
  emptyLoadState,
  errorMutationState,
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
  usePatientsQuery,
  usePendingDispenseQueueQuery,
} from "../../../lib/query-hooks";
import { queryKeys } from "../../../lib/query-keys";
import type { AssistantFormState, CompletedPatient, Prescription } from "../types";

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

function toDisplayTime(value: unknown) {
  const raw = toString(value);
  if (!raw) return "-";
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return raw;
  return date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

function normalizePatientsById(rawPatients: unknown) {
  const map = new Map<number, AnyRecord>();
  asArray(rawPatients).forEach((row) => {
    const id = toNumber(row.id ?? row.patientId ?? row.patient_id);
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

    const patient = toString(
      row.patientName ??
      row.patient_name ??
      nestedPatient?.name ??
      nestedPatient?.fullName ??
      patientRow?.name ??
      patientRow?.fullName,
      `Patient ${patientId ?? index + 1}`
    );

    const nic = toString(
      row.nic ??
      row.patientNic ??
      row.patient_nic ??
      nestedPatient?.nic ??
      patientRow?.nic,
      "N/A"
    );

    const age =
      toNumber(
        row.age ??
        row.patientAge ??
        row.patient_age ??
        nestedPatient?.age ??
        patientRow?.age
      ) ?? 0;

    const gender = toUiGender(
      row.gender ??
      row.patientGender ??
      row.patient_gender ??
      nestedPatient?.gender ??
      patientRow?.gender
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
      nic,
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
    const name = toString(
      row.patientName ??
      row.patient_name ??
      nestedPatient?.name ??
      nestedPatient?.fullName ??
      patientRow?.name ??
      patientRow?.fullName,
      `Patient ${index + 1}`
    );
    const nic = toString(
      row.nic ??
      row.patientNic ??
      row.patient_nic ??
      nestedPatient?.nic ??
      patientRow?.nic,
      "N/A"
    );
    const age =
      toNumber(
        row.age ??
        row.patientAge ??
        row.patient_age ??
        nestedPatient?.age ??
        patientRow?.age
      ) ?? 0;
    const resolvedProfileId = patientId !== null ? String(patientId) : undefined;
    const time = toDisplayTime(row.completedAt ?? row.updatedAt ?? row.scheduledAt ?? row.checkedAt);
    return {
      name,
      age,
      nic,
      time,
      profileId: resolvedProfileId,
    } satisfies CompletedPatient;
  });
}

function normalizeDoctorAvailability(rawAppointments: unknown) {
  const doctorMap = new Map<string, { name: string; status: string }>();
  asArray(rawAppointments).forEach((row, index) => {
    const nestedDoctor = asRecord(row.doctor);
    const doctorName = toString(
      row.doctorName ??
      row.doctor_name ??
      nestedDoctor?.name,
      `Doctor ${toNumber(row.doctorId ?? row.doctor_id) ?? index + 1}`
    );
    const statusRaw = toString(row.status, "");
    const isOnline = statusRaw === "waiting" || statusRaw === "in_consultation";
    const current = doctorMap.get(doctorName);
    if (!current || (current.status !== "Online" && isOnline)) {
      doctorMap.set(doctorName, { name: doctorName, status: isOnline ? "Online" : "Offline" });
    }
  });
  return Array.from(doctorMap.values());
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
  const analyticsOverviewQuery = useAnalyticsOverviewQuery();
  const currentUserQuery = useCurrentUserQuery();
  const [activeIndex, setActiveIndex] = useState(0);

  const [formState, setFormState] = useState<AssistantFormState>({
    nic: "",
    name: "",
    mobile: "",
    age: "",
    allergyInput: "",
    allergies: ["No allergies"],
    bloodGroup: "O+",
    priority: "Normal",
    regularDrug: "",
  });

  const [completedSearch, setCompletedSearch] = useState("");
  const [createPatientState, setCreatePatientState] = useState<MutationState>(idleMutationState());
  const [dispenseState, setDispenseState] = useState<MutationState>(idleMutationState());
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
  const stats = useMemo(
    () => normalizeStats(analyticsOverviewQuery.data ?? {}, rawPatients),
    [analyticsOverviewQuery.data, rawPatients]
  );
  const currentUserId = currentUserQuery.data?.id ?? null;

  const refreshAssistantQueries = async (includeCurrentUser = false) => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.prescriptions.pendingDispenseQueue }),
      queryClient.invalidateQueries({ queryKey: queryKeys.appointments.list() }),
      queryClient.invalidateQueries({ queryKey: queryKeys.patients.list }),
      queryClient.invalidateQueries({ queryKey: queryKeys.analytics.overview }),
      ...(includeCurrentUser
        ? [queryClient.invalidateQueries({ queryKey: queryKeys.auth.currentUser })]
        : []),
      pendingQueueQuery.refetch(),
      allAppointmentsQuery.refetch(),
      completedAppointmentsQuery.refetch(),
      patientsQuery.refetch(),
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
    patientById.size,
    patientsQuery,
    pendingPatients.length,
    pendingQueueQuery,
  ]);

  const filteredCompleted = useMemo(
    () => completed.filter((entry) => `${entry.name} ${entry.nic}`.toLowerCase().includes(completedSearch.toLowerCase())),
    [completed, completedSearch]
  );

  const addPatient = async () => {
    if (!formState.nic || !formState.name || !formState.age) {
      setCreatePatientState(
        errorMutationState("NIC, patient name, and age are required before adding a patient.")
      );
      return;
    }
    try {
      setCreatePatientState(pendingMutationState());
      await createPatient({
        name: formState.name,
        nic: formState.nic,
        age: Number(formState.age),
        gender: "male",
        mobile: formState.mobile || undefined,
        priority:
          formState.priority === "Critical"
            ? "critical"
            : formState.priority === "Urgent"
            ? "high"
            : "normal",
      });

      setFormState((prev) => ({
        ...prev,
        nic: "",
        name: "",
        mobile: "",
        age: "",
        allergyInput: "",
        allergies: ["No allergies"],
        regularDrug: "",
        priority: "Normal",
      }));
      await refreshAssistantQueries();
      setCreatePatientState(successMutationState("Patient added successfully."));
    } catch (error) {
      const message = (error as ApiClientError)?.message ?? "Failed to create patient.";
      setCreatePatientState(errorMutationState(message));
    }
  };

  const addAllergy = () => {
    const entry = formState.allergyInput.trim();
    if (!entry) return;
    setFormState((prev) => ({
      ...prev,
      allergies: Array.from(new Set([...prev.allergies.filter((v) => v !== "No allergies"), entry])),
      allergyInput: "",
    }));
  };

  const markDoneAndNext = async () => {
    const activePrescription =
      pendingPatients[
        pendingPatients.length ? Math.min(activeIndex, pendingPatients.length - 1) : 0
      ];
    if (!activePrescription) return;
    if (!activePrescription.prescriptionId || !currentUserId) {
      setDispenseState(
        errorMutationState("Prescription or assistant identity is missing for this queue item.")
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
    filteredCompleted,
    addPatient,
    addAllergy,
    markDoneAndNext,
    loadState,
    createPatientState,
    dispenseState,
    reload: () => {
      void refreshAssistantQueries(true);
    },
    isSyncing:
      pendingQueueQuery.isFetching ||
      allAppointmentsQuery.isFetching ||
      completedAppointmentsQuery.isFetching ||
      patientsQuery.isFetching ||
      analyticsOverviewQuery.isFetching ||
      currentUserQuery.isFetching,
    syncError: loadState.error ?? createPatientState.error ?? dispenseState.error,
  };
}
