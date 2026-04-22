export const queryKeys = {
  auth: {
    currentUser: ["auth", "current-user"] as const,
    status: ["auth", "status"] as const,
  },
  users: {
    list: (role?: string) =>
      role ? (["users", "list", role] as const) : (["users", "list"] as const),
  },
  analytics: {
    overview: ["analytics", "overview"] as const,
    dashboard: (input?: {
      range?: string;
      role?: string;
      doctorId?: number;
      assistantId?: number;
      dateFrom?: string;
      dateTo?: string;
    }) =>
      ([
        "analytics",
        "dashboard",
        input?.range ?? "7d",
        input?.role ?? "default",
        input?.doctorId ?? "none",
        input?.assistantId ?? "none",
        input?.dateFrom ?? "none",
        input?.dateTo ?? "none",
      ] as const),
  },
  tasks: {
    list: (input?: {
      status?: string;
      priority?: string;
      visitMode?: string;
      doctorWorkflowMode?: string;
      sourceType?: string;
      role?: string;
      assignedUserId?: number | string;
    }) =>
      ([
        "tasks",
        "list",
        input?.status ?? "all",
        input?.priority ?? "all",
        input?.visitMode ?? "all",
        input?.doctorWorkflowMode ?? "all",
        input?.sourceType ?? "all",
        input?.role ?? "all",
        input?.assignedUserId ?? "all",
      ] as const),
  },
  reports: {
    view: (
      reportType: string,
      input?: {
        range?: string;
        dateFrom?: string;
        dateTo?: string;
        doctorId?: number;
        assistantId?: number;
        visitMode?: string;
        doctorWorkflowMode?: string;
      }
    ) =>
      ([
        "reports",
        reportType,
        input?.range ?? "30d",
        input?.dateFrom ?? "none",
        input?.dateTo ?? "none",
        input?.doctorId ?? "none",
        input?.assistantId ?? "none",
        input?.visitMode ?? "all",
        input?.doctorWorkflowMode ?? "all",
      ] as const),
    dailySummary: (
      input?: {
        date?: string;
        role?: string;
        doctorId?: number;
        assistantId?: number;
        visitMode?: string;
        doctorWorkflowMode?: string;
      }
    ) =>
      ([
        "reports",
        "daily-summary",
        input?.date ?? "today",
        input?.role ?? "default",
        input?.doctorId ?? "none",
        input?.assistantId ?? "none",
        input?.visitMode ?? "all",
        input?.doctorWorkflowMode ?? "all",
      ] as const),
    dailySummaryHistory: (
      input?: {
        limit?: number;
        date?: string;
        role?: string;
        doctorId?: number;
        assistantId?: number;
        visitMode?: string;
        doctorWorkflowMode?: string;
      }
    ) =>
      ([
        "reports",
        "daily-summary-history",
        input?.limit ?? 7,
        input?.date ?? "today",
        input?.role ?? "default",
        input?.doctorId ?? "none",
        input?.assistantId ?? "none",
        input?.visitMode ?? "all",
        input?.doctorWorkflowMode ?? "all",
      ] as const),
  },
  encounters: {
    list: ["encounters", "list"] as const,
    detail: (encounterId: number | string) =>
      ["encounters", "detail", String(encounterId)] as const,
  },
  inventory: {
    list: ["inventory", "list"] as const,
    detail: (inventoryId: number | string) => ["inventory", "detail", String(inventoryId)] as const,
    alerts: (days = 30) => ["inventory", "alerts", days] as const,
    reports: (input?: { days?: number; activeOnly?: boolean }) =>
      ([
        "inventory",
        "reports",
        input?.days ?? 30,
        input?.activeOnly ?? "all",
      ] as const),
    movements: (inventoryId: number | string) =>
      ["inventory", "movements", String(inventoryId)] as const,
    batches: (inventoryId: number | string) =>
      ["inventory", "batches", String(inventoryId)] as const,
  },
  audit: {
    logs: (limit?: number) =>
      typeof limit === "number" ? (["audit", "logs", limit] as const) : (["audit", "logs"] as const),
  },
  patients: {
    directory: ["patients", "directory"] as const,
    list: (input?: { scope?: string; doctorId?: number | string }) =>
      input?.scope || input?.doctorId !== undefined
        ? ([
            "patients",
            "list",
            input?.scope ?? "default",
            input?.doctorId !== undefined ? String(input.doctorId) : "none",
          ] as const)
        : (["patients", "list"] as const),
    profile: (patientId: number | string) => ["patients", "profile", String(patientId)] as const,
    consultations: (patientId: number | string) =>
      ["patients", "consultations", String(patientId)] as const,
    family: (patientId: number | string) => ["patients", "family", String(patientId)] as const,
    vitals: (patientId: number | string) => ["patients", "vitals", String(patientId)] as const,
    allergies: (patientId: number | string) =>
      ["patients", "allergies", String(patientId)] as const,
    conditions: (patientId: number | string) =>
      ["patients", "conditions", String(patientId)] as const,
    timeline: (patientId: number | string) => ["patients", "timeline", String(patientId)] as const,
  },
  families: {
    list: ["families", "list"] as const,
  },
  appointments: {
    list: (status?: string) =>
      status ? (["appointments", "list", status] as const) : (["appointments", "list"] as const),
    doctors: ["appointments", "doctors"] as const,
  },
  prescriptions: {
    pendingDispenseQueue: ["prescriptions", "pending-dispense-queue"] as const,
  },
} as const;
