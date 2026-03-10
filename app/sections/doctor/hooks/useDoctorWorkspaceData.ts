import { useMemo, useState } from "react";
import {
  createEncounter,
  type ApiClientError,
} from "../../../lib/api-client";
import {
  emptyLoadState,
  errorLoadState,
  errorMutationState,
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
  usePatientsQuery,
  usePatientVitalsQuery,
} from "../../../lib/query-hooks";
import type { useDoctorClinicalWorkflow } from "./useDoctorClinicalWorkflow";
import type { useVisitPlanner } from "./useVisitPlanner";
import type { AllergyAlert, Patient, PatientGender, PatientVital } from "../types";

type AnyRecord = Record<string, unknown>;
type ClinicalWorkflow = ReturnType<typeof useDoctorClinicalWorkflow>;
type VisitPlannerState = ReturnType<typeof useVisitPlanner>;
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

function getString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
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
  patientRows.forEach((row) => {
    const id = getNumber(row.id ?? row.patientId ?? row.patient_id);
    if (id !== null) patientById.set(id, row);
  });

  const fromAppointments = appointmentRows.map((row, index) => {
    const nestedPatient = asRecord(row.patient) ?? asRecord(row.patientDetails) ?? null;
    const appointmentId = getNumber(row.id ?? row.appointmentId ?? row.appointment_id) ?? undefined;
    const patientId = getNumber(row.patientId ?? row.patient_id ?? nestedPatient?.id) ?? undefined;
    const doctorId = getNumber(row.doctorId ?? row.doctor_id ?? asRecord(row.doctor)?.id) ?? undefined;
    const patientRow = patientId ? patientById.get(patientId) : null;

    const name = getString(
      nestedPatient?.name ??
        nestedPatient?.fullName ??
        row.patientName ??
        row.patient_name ??
        patientRow?.name ??
        patientRow?.fullName,
      `Patient ${patientId ?? index + 1}`
    );

    const nic = getString(
      nestedPatient?.nic ?? row.nic ?? row.patientNic ?? row.patient_nic ?? patientRow?.nic,
      "N/A"
    );

    const age =
      getNumber(
        nestedPatient?.age ?? row.age ?? row.patientAge ?? row.patient_age ?? patientRow?.age
      ) ?? 0;

    const gender = normalizeGender(
      nestedPatient?.gender ??
        row.gender ??
        row.patientGender ??
        row.patient_gender ??
        patientRow?.gender
    );

    const reason = getString(row.reason ?? row.chiefComplaint ?? row.notes, "Consultation");
    const time = getDateLabel(row.scheduledAt ?? row.scheduled_at ?? row.createdAt ?? row.created_at);

    return {
      patientId,
      appointmentId,
      doctorId,
      name,
      nic,
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
      name: getString(row.name ?? row.fullName, `Patient ${index + 1}`),
      nic: getString(row.nic, "N/A"),
      time: "-",
      reason: "General visit",
      age: getNumber(row.age) ?? 0,
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

export function useDoctorWorkspaceData(
  clinicalWorkflow: ClinicalWorkflow,
  visitPlanner: VisitPlannerState
) {
  const patientsQuery = usePatientsQuery();
  const waitingAppointmentsQuery = useAppointmentsQuery({ status: "waiting" });
  const currentUserQuery = useCurrentUserQuery();
  const [search, setSearch] = useState("");
  const [patientName, setPatientName] = useState("");
  const [patientAge, setPatientAge] = useState("");
  const [nicNumber, setNicNumber] = useState("");
  const [gender, setGender] = useState<PatientGender>("Male");
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<number | null>(null);
  const [selectedDoctorId, setSelectedDoctorId] = useState<number | null>(null);
  const [saveState, setSaveState] = useState<MutationState>(idleMutationState());
  const rawPatients = patientsQuery.data ?? EMPTY_ROWS;
  const rawWaitingAppointments = waitingAppointmentsQuery.data ?? EMPTY_ROWS;
  const currentUserId = currentUserQuery.data?.id ?? null;
  const patientDetailsEnabled = selectedPatientId !== null;
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
        patient.name.toLowerCase().includes(query) || patient.nic.toLowerCase().includes(query)
    );
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
  const patientAllergies = useMemo<AllergyAlert[]>(
    () => normalizeAllergies(patientAllergiesQuery.data),
    [patientAllergiesQuery.data]
  );
  const patientDetailsState: LoadState = useMemo(() => {
    if (!selectedPatientId) {
      return emptyLoadState();
    }

    const vitalsError = patientVitalsQuery.isError;
    const allergiesError = patientAllergiesQuery.isError;
    const hasDetailData = patientVitals.length > 0 || patientAllergies.length > 0;

    if (
      (patientVitalsQuery.isPending ||
        patientAllergiesQuery.isPending ||
        patientVitalsQuery.isFetching ||
        patientAllergiesQuery.isFetching) &&
      !hasDetailData
    ) {
      return loadingLoadState();
    }

    if (vitalsError && allergiesError) {
      return errorLoadState("Patient vitals and allergy details could not be loaded.");
    }

    return readyLoadState(
      vitalsError || allergiesError
        ? "Some patient clinical details could not be loaded and partial data is being shown."
        : null
    );
  }, [
    patientAllergies.length,
    patientAllergiesQuery.isError,
    patientAllergiesQuery.isFetching,
    patientAllergiesQuery.isPending,
    patientVitals.length,
    patientVitalsQuery.isError,
    patientVitalsQuery.isFetching,
    patientVitalsQuery.isPending,
    selectedPatientId,
  ]);

  const handlePatientSelect = (patient: Patient) => {
    setPatientName(patient.name);
    setPatientAge(patient.age ? String(patient.age) : "");
    setNicNumber(patient.nic);
    setGender(patient.gender === "Female" ? "Female" : "Male");
    setSelectedPatientId(patient.patientId ?? null);
    setSelectedAppointmentId(patient.appointmentId ?? null);
    setSelectedDoctorId(patient.doctorId ?? null);
    setSearch("");
  };

  const handleSaveRecord = async () => {
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
      setSaveState(successMutationState("Encounter saved to backend."));
      await Promise.all([
        patientsQuery.refetch(),
        waitingAppointmentsQuery.refetch(),
        currentUserQuery.refetch(),
      ]);
    } catch (error) {
      setSaveState(
        errorMutationState((error as ApiClientError)?.message ?? "Failed to save encounter.")
      );
    }
  };

  const saveFeedback =
    saveState.status === "error"
      ? { tone: "error" as const, message: saveState.error ?? "Failed to save encounter." }
      : saveState.status === "success" && saveState.message
        ? { tone: "success" as const, message: saveState.message }
        : saveState.status === "pending"
          ? { tone: "info" as const, message: "Submitting encounter..." }
          : null;

  return {
    search,
    setSearch,
    patientName,
    setPatientName,
    patientAge,
    setPatientAge,
    nicNumber,
    setNicNumber,
    gender,
    setGender,
    searchMatches,
    patientVitals: selectedPatientId ? patientVitals : [],
    patientAllergies: selectedPatientId ? patientAllergies : [],
    queueState,
    patientDetailsState,
    saveState,
    saveFeedback,
    handlePatientSelect,
    handleSaveRecord,
    reload: () => {
      void Promise.all([
        patientsQuery.refetch(),
        waitingAppointmentsQuery.refetch(),
        currentUserQuery.refetch(),
        ...(selectedPatientId
          ? [patientVitalsQuery.refetch(), patientAllergiesQuery.refetch()]
          : []),
      ]);
    },
  };
}
