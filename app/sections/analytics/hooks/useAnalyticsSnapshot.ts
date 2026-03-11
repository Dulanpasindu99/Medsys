import { useMemo } from 'react';
import {
  emptyLoadState,
  errorLoadState,
  readyLoadState,
  type LoadState,
} from '../../../lib/async-state';
import type { ApiRecord } from '../../../lib/api-client';
import {
  useAnalyticsOverviewQuery,
  useAppointmentsQuery,
  useEncountersQuery,
  useInventoryQuery,
  usePatientsQuery,
} from '../../../lib/query-hooks';

function toNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() && !Number.isNaN(Number(value))) return Number(value);
  return null;
}

function toString(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback;
}

export function useAnalyticsSnapshot() {
  const overviewQuery = useAnalyticsOverviewQuery();
  const patientsQuery = usePatientsQuery();
  const appointmentsQuery = useAppointmentsQuery();
  const encountersQuery = useEncountersQuery();
  const inventoryQuery = useInventoryQuery();

  const overview = overviewQuery.data ?? null;
  const patients = useMemo<ApiRecord[]>(() => patientsQuery.data ?? [], [patientsQuery.data]);
  const appointments = useMemo<ApiRecord[]>(
    () => appointmentsQuery.data ?? [],
    [appointmentsQuery.data]
  );
  const encounters = useMemo<ApiRecord[]>(() => encountersQuery.data ?? [], [encountersQuery.data]);
  const inventory = useMemo<ApiRecord[]>(() => inventoryQuery.data ?? [], [inventoryQuery.data]);

  const hasData =
    overview !== null ||
    patients.length > 0 ||
    appointments.length > 0 ||
    encounters.length > 0 ||
    inventory.length > 0;
  const failureCount = [
    overviewQuery.status,
    patientsQuery.status,
    appointmentsQuery.status,
    encountersQuery.status,
    inventoryQuery.status,
  ].filter((status) => status === 'error').length;
  const firstError =
    overviewQuery.error ??
    patientsQuery.error ??
    appointmentsQuery.error ??
    encountersQuery.error ??
    inventoryQuery.error;
  const isFetching =
    overviewQuery.isFetching ||
    patientsQuery.isFetching ||
    appointmentsQuery.isFetching ||
    encountersQuery.isFetching ||
    inventoryQuery.isFetching;
  const isPending =
    overviewQuery.isPending ||
    patientsQuery.isPending ||
    appointmentsQuery.isPending ||
    encountersQuery.isPending ||
    inventoryQuery.isPending;

  let loadState: LoadState;
  if ((isPending || isFetching) && !hasData) {
    loadState = { status: 'loading', error: null, notice: null };
  } else if (failureCount === 5) {
    loadState = errorLoadState(
      (firstError as { message?: string } | undefined)?.message ?? 'Unable to load analytics.'
    );
  } else if (!hasData) {
    loadState = emptyLoadState(
      failureCount ? 'Some analytics feeds failed and returned no usable data.' : null
    );
  } else {
    loadState = readyLoadState(
      failureCount ? 'Some analytics feeds failed and partial data is being shown.' : null
    );
  }

  const reload = async () => {
    await Promise.all([
      overviewQuery.refetch(),
      patientsQuery.refetch(),
      appointmentsQuery.refetch(),
      encountersQuery.refetch(),
      inventoryQuery.refetch(),
    ]);
  };

  const patientTotal =
    toNumber(overview?.totalPatients ?? overview?.patientCount) ?? patients.length;
  const maleTotal =
    toNumber(overview?.totalMale ?? overview?.malePatients) ??
    patients.filter((row) => toString(row.gender).toLowerCase() === 'male').length;
  const femaleTotal =
    toNumber(overview?.totalFemale ?? overview?.femalePatients) ??
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
      (sum, row) =>
        sum +
        (toNumber(row.quantity ?? row.stock ?? row.available) ?? 0),
      0
    );
    return { totalItems, totalUnits };
  }, [inventory]);

  const encounterCount =
    toNumber(overview?.totalEncounters ?? overview?.encounterCount) ?? encounters.length;
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
