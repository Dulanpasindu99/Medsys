import { useEffect, useMemo, useState } from "react";
import {
  getAnalyticsOverview,
  listAppointments,
  listAuditLogs,
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
  const [overview, setOverview] = useState<AnyRecord>({});
  const [patients, setPatients] = useState<AnyRecord[]>([]);
  const [appointments, setAppointments] = useState<AnyRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AnyRecord[]>([]);
  const [loadState, setLoadState] = useState<LoadState>(loadingLoadState());
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    const timeoutId = window.setTimeout(() => {
      void (async () => {
        setLoadState(loadingLoadState());
        const [overviewResult, patientsResult, appointmentsResult, auditLogsResult] =
          await Promise.allSettled([
            getAnalyticsOverview(),
            listPatients(),
            listAppointments(),
            listAuditLogs({ limit: 20 }),
          ]);

        if (!active) return;

        const allFailed =
          overviewResult.status === "rejected" &&
          patientsResult.status === "rejected" &&
          appointmentsResult.status === "rejected" &&
          auditLogsResult.status === "rejected";
        if (allFailed) {
          const firstError =
            (overviewResult.reason as ApiClientError | undefined)?.message ??
            (patientsResult.reason as ApiClientError | undefined)?.message ??
            (appointmentsResult.reason as ApiClientError | undefined)?.message ??
            (auditLogsResult.reason as ApiClientError | undefined)?.message ??
            "Unable to load AI insights.";
          setOverview({});
          setPatients([]);
          setAppointments([]);
          setAuditLogs([]);
          setLoadState(errorLoadState(firstError));
          return;
        }

        const nextOverview =
          overviewResult.status === "fulfilled" ? asRecord(overviewResult.value) ?? {} : {};
        const nextPatients =
          patientsResult.status === "fulfilled" ? asArray(patientsResult.value) : [];
        const nextAppointments =
          appointmentsResult.status === "fulfilled" ? asArray(appointmentsResult.value) : [];
        const nextAuditLogs =
          auditLogsResult.status === "fulfilled" ? asArray(auditLogsResult.value) : [];

        setOverview(nextOverview);
        setPatients(nextPatients);
        setAppointments(nextAppointments);
        setAuditLogs(nextAuditLogs);

        const hasData =
          Object.keys(nextOverview).length > 0 ||
          nextPatients.length > 0 ||
          nextAppointments.length > 0 ||
          nextAuditLogs.length > 0;
        const partialFailure =
          overviewResult.status === "rejected" ||
          patientsResult.status === "rejected" ||
          appointmentsResult.status === "rejected" ||
          auditLogsResult.status === "rejected";

        if (!hasData) {
          setLoadState(emptyLoadState(partialFailure ? "Insight feeds returned no usable data." : null));
          return;
        }

        setLoadState(
          readyLoadState(
            partialFailure
              ? "Some AI insight feeds failed and fallback data is being shown."
              : null
          )
        );
      })();
    }, 0);

    return () => {
      active = false;
      window.clearTimeout(timeoutId);
    };
  }, [reloadKey]);

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
    reload: () => setReloadKey((prev) => prev + 1),
  };
}
