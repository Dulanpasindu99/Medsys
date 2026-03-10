export const queryKeys = {
  auth: {
    currentUser: ["auth", "current-user"] as const,
    status: ["auth", "status"] as const,
  },
  patients: {
    directory: ["patients", "directory"] as const,
    list: ["patients", "list"] as const,
  },
  appointments: {
    list: (status?: string) =>
      status ? (["appointments", "list", status] as const) : (["appointments", "list"] as const),
  },
} as const;
