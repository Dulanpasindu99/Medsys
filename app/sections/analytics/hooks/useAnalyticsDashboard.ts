"use client";

import { useMemo, useState } from "react";
import type {
  AnalyticsDashboardQuery,
  AnalyticsOperationMode,
  AnalyticsRole,
  AnalyticsRangePreset,
} from "@/app/lib/analytics-types";
import { emptyLoadState, errorLoadState, loadingLoadState, readyLoadState, type LoadState } from "@/app/lib/async-state";
import { useAnalyticsDashboardQuery, useCurrentUserQuery, useUsersQuery } from "@/app/lib/query-hooks";

function getTodayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function getPastIsoDate(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
}

function asUserRows(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.filter((row): row is Record<string, unknown> => !!row && typeof row === "object");
}

function getNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() && !Number.isNaN(Number(value))) return Number(value);
  return null;
}

function getString(value: unknown) {
  return typeof value === "string" ? value : "";
}

export function useAnalyticsDashboard() {
  const currentUserQuery = useCurrentUserQuery();
  const [range, setRange] = useState<AnalyticsRangePreset>("7d");
  const [customDateFrom, setCustomDateFrom] = useState(getPastIsoDate(6));
  const [customDateTo, setCustomDateTo] = useState(getTodayIsoDate());
  const [ownerView, setOwnerView] = useState<"organization" | "doctor" | "assistant">("organization");
  const [ownerOperationMode, setOwnerOperationMode] = useState<AnalyticsOperationMode>("walk_in");
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [selectedAssistantId, setSelectedAssistantId] = useState("");

  const actorRole = currentUserQuery.data?.role ?? null;
  const isOwner = actorRole === "owner";
  const canReadUsers = Boolean(currentUserQuery.data?.permissions?.includes("user.read"));

  const doctorsQuery = useUsersQuery(isOwner ? { role: "doctor" } : undefined, isOwner && canReadUsers);
  const assistantsQuery = useUsersQuery(
    isOwner ? { role: "assistant" } : undefined,
    isOwner && canReadUsers
  );

  const queryInput = useMemo<AnalyticsDashboardQuery>(() => {
    const next: AnalyticsDashboardQuery = { range };
    if (range === "custom") {
      next.dateFrom = customDateFrom;
      next.dateTo = customDateTo;
    }

    if (!isOwner) {
      return next;
    }

    if (ownerView === "doctor" && selectedDoctorId.trim()) {
      next.role = "doctor";
      next.doctorId = Number(selectedDoctorId);
    } else if (ownerView === "assistant" && selectedAssistantId.trim()) {
      next.role = "assistant";
      next.assistantId = Number(selectedAssistantId);
    }
    if (ownerView === "organization") {
      next.operationMode = ownerOperationMode;
    }

    return next;
  }, [
    customDateFrom,
    customDateTo,
    isOwner,
    ownerOperationMode,
    ownerView,
    range,
    selectedAssistantId,
    selectedDoctorId,
  ]);

  const isDashboardQueryEnabled =
    !!currentUserQuery.data &&
    (range !== "custom" || (customDateFrom.trim().length > 0 && customDateTo.trim().length > 0)) &&
    (!isOwner ||
      ownerView === "organization" ||
      (ownerView === "doctor" && selectedDoctorId.trim().length > 0) ||
      (ownerView === "assistant" && selectedAssistantId.trim().length > 0));

  const dashboardQuery = useAnalyticsDashboardQuery(
    isDashboardQueryEnabled ? queryInput : { range },
    isDashboardQueryEnabled
  );

  const doctorOptions = useMemo(
    () =>
      asUserRows(doctorsQuery.data).map((row) => ({
        id: getNumber(row.id ?? row.userId),
        name: getString(row.name ?? row.fullName) || getString(row.email),
      })).filter((row): row is { id: number; name: string } => row.id !== null && Boolean(row.name)),
    [doctorsQuery.data]
  );

  const assistantOptions = useMemo(
    () =>
      asUserRows(assistantsQuery.data).map((row) => ({
        id: getNumber(row.id ?? row.userId),
        name: getString(row.name ?? row.fullName) || getString(row.email),
      })).filter((row): row is { id: number; name: string } => row.id !== null && Boolean(row.name)),
    [assistantsQuery.data]
  );

  let loadState: LoadState;
  if (currentUserQuery.isPending || (dashboardQuery.isPending && isDashboardQueryEnabled)) {
    loadState = loadingLoadState();
  } else if (!isDashboardQueryEnabled) {
    loadState = emptyLoadState(
      isOwner && ownerView !== "organization"
        ? `Select a ${ownerView} to load drill-down analytics.`
        : "Choose a valid range to load analytics."
    );
  } else if (dashboardQuery.isError) {
    loadState = errorLoadState(
      (dashboardQuery.error as { message?: string } | undefined)?.message ?? "Unable to load analytics dashboard."
    );
  } else if (!dashboardQuery.data) {
    loadState = emptyLoadState("No analytics data for the selected range.");
  } else {
    loadState = readyLoadState();
  }

  return {
    currentUser: currentUserQuery.data ?? null,
    data: dashboardQuery.data ?? null,
    loadState,
    range,
    setRange,
    customDateFrom,
    setCustomDateFrom,
    customDateTo,
    setCustomDateTo,
    ownerView,
    setOwnerView,
    ownerOperationMode,
    setOwnerOperationMode,
    selectedDoctorId,
    setSelectedDoctorId,
    selectedAssistantId,
    setSelectedAssistantId,
    doctorOptions,
    assistantOptions,
    reload: () => dashboardQuery.refetch(),
    isRefreshing: dashboardQuery.isFetching,
  };
}
