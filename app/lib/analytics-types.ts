export type AnalyticsRole = "doctor" | "assistant" | "owner";
export type AnalyticsRangePreset = "1d" | "7d" | "30d" | "custom";
export type AnalyticsOperationMode = "walk_in" | "appointment" | "hybrid";

export type AnalyticsDashboardQuery = {
  range?: AnalyticsRangePreset;
  role?: AnalyticsRole;
  doctorId?: number;
  assistantId?: number;
  dateFrom?: string;
  dateTo?: string;
  operationMode?: AnalyticsOperationMode;
};

export type AnalyticsWorkflowProfile = {
  mode: string;
};

export type AnalyticsRoleContext = {
  resolvedRole: AnalyticsRole;
  actorRole: AnalyticsRole;
  activeRole: AnalyticsRole | null;
  roles: AnalyticsRole[];
  doctorId: number | null;
  assistantId: number | null;
  operationMode?: AnalyticsOperationMode;
  workflowProfile: AnalyticsWorkflowProfile;
};

export type AnalyticsRange = {
  preset: AnalyticsRangePreset;
  dateFrom: string;
  dateTo: string;
};

export type AnalyticsInsight = {
  id: string;
  level?: string;
  message: string;
};

export type AnalyticsAlert = {
  id: string;
  severity?: string;
  message: string;
};

export type AnalyticsDashboardResponse = {
  roleContext: AnalyticsRoleContext;
  generatedAt: string;
  range: AnalyticsRange;
  summary: Record<string, unknown>;
  charts: Record<string, unknown>;
  insights: AnalyticsInsight[];
  tables: Record<string, unknown>;
  alerts: AnalyticsAlert[];
  modePolicy?: {
    showAppointmentMetrics?: boolean;
    showWalkInMetrics?: boolean;
  };
};

export type ChartDatum = {
  label: string;
  count: number;
};

export type HourDatum = {
  hour: number;
  label: string;
  count: number;
};

export type DayDatum = {
  date: string;
  count: number;
};

export function isAnalyticsRole(value: unknown): value is AnalyticsRole {
  return value === "doctor" || value === "assistant" || value === "owner";
}

export function isAnalyticsRangePreset(value: unknown): value is AnalyticsRangePreset {
  return value === "1d" || value === "7d" || value === "30d" || value === "custom";
}

export function isAnalyticsDashboardResponse(value: unknown): value is AnalyticsDashboardResponse {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const record = value as Record<string, unknown>;
  const roleContext =
    record.roleContext && typeof record.roleContext === "object" && !Array.isArray(record.roleContext)
      ? (record.roleContext as Record<string, unknown>)
      : null;
  const range =
    record.range && typeof record.range === "object" && !Array.isArray(record.range)
      ? (record.range as Record<string, unknown>)
      : null;

  return Boolean(
    roleContext &&
      range &&
      isAnalyticsRole(roleContext.resolvedRole) &&
      isAnalyticsRole(roleContext.actorRole) &&
      (roleContext.activeRole === null || isAnalyticsRole(roleContext.activeRole)) &&
      Array.isArray(roleContext.roles) &&
      roleContext.roles.every((entry) => isAnalyticsRole(entry)) &&
      typeof record.generatedAt === "string" &&
      isAnalyticsRangePreset(range.preset) &&
      typeof range.dateFrom === "string" &&
      typeof range.dateTo === "string" &&
      record.summary &&
      typeof record.summary === "object" &&
      !Array.isArray(record.summary) &&
      record.charts &&
      typeof record.charts === "object" &&
      !Array.isArray(record.charts) &&
      Array.isArray(record.insights) &&
      record.tables &&
      typeof record.tables === "object" &&
      !Array.isArray(record.tables) &&
      Array.isArray(record.alerts)
  );
}

export function isDoctorAnalytics(data: AnalyticsDashboardResponse) {
  return data.roleContext.resolvedRole === "doctor";
}

export function isAssistantAnalytics(data: AnalyticsDashboardResponse) {
  return data.roleContext.resolvedRole === "assistant";
}

export function isOwnerAnalytics(data: AnalyticsDashboardResponse) {
  return data.roleContext.resolvedRole === "owner";
}
