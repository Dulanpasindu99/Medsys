"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getAnalyticsOverview,
  getAuthStatus,
  getCurrentUser,
  listAppointments,
  listAuditLogs,
  listPendingDispenseQueue,
  listPatients,
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

export function useAnalyticsOverviewQuery() {
  return useQuery({
    queryKey: queryKeys.analytics.overview,
    queryFn: getAnalyticsOverview,
  });
}

export function useAuditLogsQuery(input?: { limit?: number }) {
  return useQuery({
    queryKey: queryKeys.audit.logs(input?.limit),
    queryFn: () => listAuditLogs(input),
  });
}

export function usePatientsQuery() {
  return useQuery({
    queryKey: queryKeys.patients.list,
    queryFn: listPatients,
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
