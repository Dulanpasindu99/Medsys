import type { ReactNode } from "react";
import { PATIENT_SHADOWS } from "../constants";

export function SectionShell({ children }: { children: ReactNode }) {
  return <section className={`ios-surface ${PATIENT_SHADOWS.card} p-6 md:p-7`}>{children}</section>;
}

export function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition hover:-translate-y-0.5 hover:shadow-md ${
        active ? "border-sky-200 bg-sky-50 text-sky-800 shadow-[0_12px_26px_rgba(14,165,233,0.22)]" : "border-slate-200/80 bg-white/80 text-slate-700"
      } ${PATIENT_SHADOWS.inset}`}
    >
      {active && <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />} {label}
    </button>
  );
}

export function TopChip({ children }: { children: ReactNode }) {
  return <span className={`ios-chip bg-white/80 text-[11px] uppercase tracking-[0.18em] text-slate-700 ${PATIENT_SHADOWS.chip}`}>{children}</span>;
}
