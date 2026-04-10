import type { AgeBucket } from "./types";

export const PATIENT_SHADOWS = {
  card: "shadow-[0_20px_48px_rgba(15,23,42,0.12)]",
  inset: "shadow-[inset_0_1px_0_rgba(255,255,255,0.42)]",
  chip: "shadow-[0_10px_24px_rgba(15,23,42,0.08)]",
} as const;

export const AGE_BUCKETS: AgeBucket[] = [
  { id: "all", label: "All Ages" },
  { id: "18-30", label: "Age 18-30" },
  { id: "31-45", label: "Age 31-45" },
  { id: "46+", label: "Age 46+" },
];
