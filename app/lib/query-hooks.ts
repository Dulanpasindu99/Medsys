"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getAuthStatus,
  getCurrentUser,
  listAppointments,
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
