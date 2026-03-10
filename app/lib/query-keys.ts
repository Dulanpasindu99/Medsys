export const queryKeys = {
  auth: {
    currentUser: ["auth", "current-user"] as const,
    status: ["auth", "status"] as const,
  },
  patients: {
    directory: ["patients", "directory"] as const,
  },
  appointments: {
    waitingQueue: ["appointments", "waiting"] as const,
  },
} as const;
