import { useEffect, useMemo, useState } from 'react';
import {
  getAnalyticsOverview,
  listAppointments,
  listEncounters,
  listInventory,
  listPatients,
  type ApiClientError,
} from '../../../lib/api-client';
import {
  emptyLoadState,
  errorLoadState,
  loadingLoadState,
  readyLoadState,
  type LoadState,
} from '../../../lib/async-state';

type AnyRecord = Record<string, unknown>;

function asRecord(value: unknown): AnyRecord | null {
  return value && typeof value === 'object' ? (value as AnyRecord) : null;
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
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() && !Number.isNaN(Number(value))) return Number(value);
  return null;
}

function toString(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback;
}

export function useAnalyticsSnapshot() {
  const [overview, setOverview] = useState<AnyRecord>({});
  const [patients, setPatients] = useState<AnyRecord[]>([]);
  const [appointments, setAppointments] = useState<AnyRecord[]>([]);
  const [encounters, setEncounters] = useState<AnyRecord[]>([]);
  const [inventory, setInventory] = useState<AnyRecord[]>([]);
  const [loadState, setLoadState] = useState<LoadState>(loadingLoadState());

  const reload = async () => {
    setLoadState(loadingLoadState());
    try {
      const [overviewResult, patientsResult, appointmentsResult, encountersResult, inventoryResult] =
        await Promise.allSettled([
          getAnalyticsOverview(),
          listPatients(),
          listAppointments(),
          listEncounters(),
          listInventory(),
        ]);

      const nextOverview =
        overviewResult.status === 'fulfilled' ? asRecord(overviewResult.value) ?? {} : {};
      const nextPatients =
        patientsResult.status === 'fulfilled' ? asArray(patientsResult.value) : [];
      const nextAppointments =
        appointmentsResult.status === 'fulfilled' ? asArray(appointmentsResult.value) : [];
      const nextEncounters =
        encountersResult.status === 'fulfilled' ? asArray(encountersResult.value) : [];
      const nextInventory =
        inventoryResult.status === 'fulfilled' ? asArray(inventoryResult.value) : [];

      const primaryFailureCount = [
        overviewResult,
        patientsResult,
        appointmentsResult,
        encountersResult,
        inventoryResult,
      ].filter((result) => result.status === 'rejected').length;

      if (primaryFailureCount === 5) {
        throw new Error('Unable to load analytics.');
      }

      setOverview(nextOverview);
      setPatients(nextPatients);
      setAppointments(nextAppointments);
      setEncounters(nextEncounters);
      setInventory(nextInventory);

      const hasData =
        nextPatients.length || nextAppointments.length || nextEncounters.length || nextInventory.length;
      setLoadState(
        hasData
          ? readyLoadState(
              primaryFailureCount
                ? 'Some analytics feeds failed and partial data is being shown.'
                : null
            )
          : emptyLoadState()
      );
    } catch (error) {
      const message = (error as ApiClientError)?.message ?? 'Unable to load analytics.';
      setLoadState(errorLoadState(message));
    }
  };

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void reload();
    }, 0);
    return () => {
      window.clearTimeout(timeoutId);
    };
  }, []);

  const patientTotal = toNumber(overview.totalPatients ?? overview.patientCount) ?? patients.length;
  const maleTotal =
    toNumber(overview.totalMale ?? overview.malePatients) ??
    patients.filter((row) => toString(row.gender).toLowerCase() === 'male').length;
  const femaleTotal =
    toNumber(overview.totalFemale ?? overview.femalePatients) ??
    patients.filter((row) => toString(row.gender).toLowerCase() === 'female').length;

  const appointmentStatusSummary = useMemo(() => {
    const counts = {
      waiting: 0,
      in_consultation: 0,
      completed: 0,
      cancelled: 0,
    };
    appointments.forEach((row) => {
      const status = toString(row.status).toLowerCase();
      if (status in counts) {
        counts[status as keyof typeof counts] += 1;
      }
    });
    return counts;
  }, [appointments]);

  const inventoryStock = useMemo(() => {
    const totalItems = inventory.length;
    const totalUnits = inventory.reduce(
      (sum, row) => sum + (toNumber(row.quantity ?? row.stock ?? row.available) ?? 0),
      0
    );
    return { totalItems, totalUnits };
  }, [inventory]);

  const encounterCount =
    toNumber(overview.totalEncounters ?? overview.encounterCount) ?? encounters.length;
  const completionRate = appointments.length
    ? Math.round((appointmentStatusSummary.completed / appointments.length) * 100)
    : 0;

  return {
    patients,
    appointments,
    encounters,
    inventory,
    loadState,
    reload,
    patientTotal,
    maleTotal,
    femaleTotal,
    appointmentStatusSummary,
    inventoryStock,
    encounterCount,
    completionRate,
  };
}
