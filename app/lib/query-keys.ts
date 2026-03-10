export const queryKeys = {
  auth: {
    currentUser: ["auth", "current-user"] as const,
    status: ["auth", "status"] as const,
  },
  analytics: {
    overview: ["analytics", "overview"] as const,
  },
  audit: {
    logs: (limit?: number) =>
      typeof limit === "number" ? (["audit", "logs", limit] as const) : (["audit", "logs"] as const),
  },
  patients: {
    directory: ["patients", "directory"] as const,
    list: ["patients", "list"] as const,
  },
  appointments: {
    list: (status?: string) =>
      status ? (["appointments", "list", status] as const) : (["appointments", "list"] as const),
  },
  prescriptions: {
    pendingDispenseQueue: ["prescriptions", "pending-dispense-queue"] as const,
  },
} as const;
