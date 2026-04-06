"use client";

import { useQuery } from "@tanstack/react-query";
import type { AnalyticsDashboardQuery } from "./analytics-types";
import {
  getInventoryItem,
  getAnalyticsDashboard,
  getAnalyticsOverview,
  getAuthStatus,
  getCurrentUser,
  getPatientConsultations,
  getPatientFamily,
  getPatientProfile,
  listFamilies,
  listUsers,
  listAppointments,
  listPatientAllergies,
  listPatientConditions,
  listPatientTimeline,
  listPatientVitals,
  listAuditLogs,
  listEncounters,
  listInventoryAlerts,
  listInventory,
  listInventoryBatches,
  listInventoryMovements,
  listInventoryReports,
  listPendingDispenseQueue,
  listPatients,
  type ListPatientsInput,
  type AppointmentStatus,
} from "./api-client";
import { queryKeys } from "./query-keys";

export function useCurrentUserQuery() {
  return useQuery({
    queryKey: queryKeys.auth.currentUser,
    queryFn: getCurrentUser,
    staleTime: 60_000,
  });
}

export function useAuthStatusQuery() {
  return useQuery({
    queryKey: queryKeys.auth.status,
    queryFn: getAuthStatus,
    staleTime: 60_000,
  });
}

export function useUsersQuery(
  input?: { role?: "owner" | "doctor" | "assistant" },
  enabled = true
) {
  return useQuery({
    queryKey: queryKeys.users.list(input?.role),
    queryFn: () => listUsers(input),
    enabled,
  });
}

export function useAnalyticsOverviewQuery() {
  return useQuery({
    queryKey: queryKeys.analytics.overview,
    queryFn: getAnalyticsOverview,
  });
}

export function useAnalyticsDashboardQuery(input?: AnalyticsDashboardQuery, enabled = true) {
  return useQuery({
    queryKey: queryKeys.analytics.dashboard(input),
    queryFn: () => getAnalyticsDashboard(input),
    enabled,
  });
}

export function useEncountersQuery() {
  return useQuery({
    queryKey: queryKeys.encounters.list,
    queryFn: listEncounters,
  });
}

export function useInventoryQuery() {
  return useQuery({
    queryKey: queryKeys.inventory.list,
    queryFn: listInventory,
  });
}

export function useInventoryDetailQuery(inventoryId: number | string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.inventory.detail(inventoryId),
    queryFn: () => getInventoryItem(inventoryId),
    enabled,
  });
}

export function useInventoryAlertsQuery(days = 30, enabled = true) {
  return useQuery({
    queryKey: queryKeys.inventory.alerts(days),
    queryFn: () => listInventoryAlerts({ days }),
    enabled,
  });
}

export function useInventoryReportsQuery(days = 30, enabled = true) {
  return useQuery({
    queryKey: queryKeys.inventory.reports(days),
    queryFn: () => listInventoryReports({ days }),
    enabled,
  });
}

export function useInventoryMovementsQuery(inventoryId: number | string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.inventory.movements(inventoryId),
    queryFn: () => listInventoryMovements(inventoryId),
    enabled,
  });
}

export function useAuditLogsQuery(input?: { limit?: number }) {
  return useQuery({
    queryKey: queryKeys.audit.logs(input?.limit),
    queryFn: () => listAuditLogs(input),
  });
}

export function usePatientsQuery(input?: ListPatientsInput | boolean, enabled = true) {
  const resolvedInput = typeof input === "boolean" ? undefined : input;
  const resolvedEnabled = typeof input === "boolean" ? input : enabled;

  return useQuery({
    queryKey: queryKeys.patients.list(resolvedInput),
    queryFn: () => listPatients(resolvedInput),
    enabled: resolvedEnabled,
  });
}

export function useInventoryBatchesQuery(inventoryId: number | string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.inventory.batches(inventoryId),
    queryFn: () => listInventoryBatches(inventoryId),
    enabled,
  });
}

export function useFamiliesQuery(enabled = true) {
  return useQuery({
    queryKey: queryKeys.families.list,
    queryFn: listFamilies,
    enabled,
  });
}

export function usePatientProfileQuery(patientId: number | string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.patients.profile(patientId),
    queryFn: () => getPatientProfile(patientId),
    enabled,
  });
}

export function usePatientConsultationsQuery(patientId: number | string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.patients.consultations(patientId),
    queryFn: () => getPatientConsultations(patientId),
    enabled,
  });
}

export function usePatientFamilyQuery(patientId: number | string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.patients.family(patientId),
    queryFn: () => getPatientFamily(patientId),
    enabled,
  });
}

export function usePatientVitalsQuery(patientId: number | string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.patients.vitals(patientId),
    queryFn: () => listPatientVitals(patientId),
    enabled,
  });
}

export function usePatientAllergiesQuery(patientId: number | string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.patients.allergies(patientId),
    queryFn: () => listPatientAllergies(patientId),
    enabled,
  });
}

export function usePatientConditionsQuery(patientId: number | string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.patients.conditions(patientId),
    queryFn: () => listPatientConditions(patientId),
    enabled,
  });
}

export function usePatientTimelineQuery(patientId: number | string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.patients.timeline(patientId),
    queryFn: () => listPatientTimeline(patientId),
    enabled,
  });
}

export function useAppointmentsQuery(input?: { status?: AppointmentStatus }) {
  return useQuery({
    queryKey: queryKeys.appointments.list(input?.status),
    queryFn: () => listAppointments(input),
  });
}

export function usePendingDispenseQueueQuery() {
  return useQuery({
    queryKey: queryKeys.prescriptions.pendingDispenseQueue,
    queryFn: listPendingDispenseQueue,
  });
}
