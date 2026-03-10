import { useMemo } from "react";
import {
  emptyLoadState,
  errorLoadState,
  readyLoadState,
  type LoadState,
} from "../../../lib/async-state";
import {
  useAnalyticsOverviewQuery,
  useAppointmentsQuery,
  useAuditLogsQuery,
  usePatientsQuery,
} from "../../../lib/query-hooks";

type AnyRecord = Record<string, unknown>;

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

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() && !Number.isNaN(Number(value))) return Number(value);
  return null;
}

function toString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

export function useAiInsightsData() {
  const overviewQuery = useAnalyticsOverviewQuery();
  const patientsQuery = usePatientsQuery();
  const appointmentsQuery = useAppointmentsQuery();
  const auditLogsQuery = useAuditLogsQuery({ limit: 20 });

  const overview = useMemo(() => asRecord(overviewQuery.data) ?? {}, [overviewQuery.data]);
  const patients = useMemo(() => asArray(patientsQuery.data), [patientsQuery.data]);
  const appointments = useMemo(() => asArray(appointmentsQuery.data), [appointmentsQuery.data]);
  const auditLogs = useMemo(() => asArray(auditLogsQuery.data), [auditLogsQuery.data]);

  const hasData =
    Object.keys(overview).length > 0 ||
    patients.length > 0 ||
    appointments.length > 0 ||
    auditLogs.length > 0;
  const failureCount = [
    overviewQuery.status,
    patientsQuery.status,
    appointmentsQuery.status,
    auditLogsQuery.status,
  ].filter((status) => status === "error").length;
  const firstError =
    overviewQuery.error ??
    patientsQuery.error ??
    appointmentsQuery.error ??
    auditLogsQuery.error;
  const isFetching =
    overviewQuery.isFetching ||
    patientsQuery.isFetching ||
    appointmentsQuery.isFetching ||
    auditLogsQuery.isFetching;
  const isPending =
    overviewQuery.isPending ||
    patientsQuery.isPending ||
    appointmentsQuery.isPending ||
    auditLogsQuery.isPending;

  let loadState: LoadState;
  if ((isPending || isFetching) && !hasData) {
    loadState = { status: "loading", error: null, notice: null };
  } else if (failureCount === 4) {
    loadState = errorLoadState(
      (firstError as { message?: string } | undefined)?.message ?? "Unable to load AI insights."
    );
  } else if (!hasData) {
    loadState = emptyLoadState(failureCount ? "Insight feeds returned no usable data." : null);
  } else {
    loadState = readyLoadState(
      failureCount ? "Some AI insight feeds failed and fallback data is being shown." : null
    );
  }

  const patientTotal = toNumber(overview.totalPatients ?? overview.patientCount) ?? patients.length;
  const appointmentTotal = appointments.length;
  const auditEventCount = auditLogs.length;

  const insights = useMemo(() => {
    const waiting = appointments.filter((row) => toString(row.status).toLowerCase() === "waiting").length;
    const completed = appointments.filter((row) => toString(row.status).toLowerCase() === "completed").length;
    const lastAudit = auditLogs[0];
    const lastAuditAction = lastAudit ? toString(lastAudit.action ?? lastAudit.event, "Unknown action") : "No recent logs";
    const lastAuditEntity = lastAudit ? toString(lastAudit.entityType ?? lastAudit.entity, "system") : "system";

    return [
      `Current patient base is ${patientTotal}.`,
      `Waiting queue has ${waiting} appointments and ${completed} completed visits.`,
      `Latest audited action: ${lastAuditAction} on ${lastAuditEntity}.`,
      waiting > completed
        ? "Recommendation: prioritize queue balancing and assistant handover."
        : "Recommendation: maintain current consultation throughput.",
    ];
  }, [appointments, auditLogs, patientTotal]);

  return {
    patientTotal,
    appointmentTotal,
    auditEventCount,
    insights,
    loadState,
    reload: async () => {
      await Promise.all([
        overviewQuery.refetch(),
        patientsQuery.refetch(),
        appointmentsQuery.refetch(),
        auditLogsQuery.refetch(),
      ]);
    },
  };
}
