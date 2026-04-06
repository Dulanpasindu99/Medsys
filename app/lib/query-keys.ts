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
  encounters: {
    list: ["encounters", "list"] as const,
  },
  inventory: {
    list: ["inventory", "list"] as const,
    detail: (inventoryId: number | string) => ["inventory", "detail", String(inventoryId)] as const,
    alerts: (days = 30) => ["inventory", "alerts", days] as const,
    reports: (days = 30) => ["inventory", "reports", days] as const,
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
  },
  prescriptions: {
    pendingDispenseQueue: ["prescriptions", "pending-dispense-queue"] as const,
  },
} as const;
