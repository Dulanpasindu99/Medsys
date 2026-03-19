import type React from "react";
import { SurfaceCard } from "./SurfaceCard";

type AsyncStateTone = "loading" | "empty" | "error";

const toneStyles: Record<
  AsyncStateTone,
  { badge: string; title: string; button: string }
> = {
  loading: {
    badge: "bg-sky-50 text-sky-700 ring-sky-100",
    title: "text-slate-900",
    button: "app-button app-button--secondary",
  },
  empty: {
    badge: "bg-amber-50 text-amber-700 ring-amber-100",
    title: "text-slate-900",
    button: "app-button app-button--secondary",
  },
  error: {
    badge: "bg-rose-50 text-rose-700 ring-rose-100",
    title: "text-rose-900",
    button: "app-button app-button--primary",
  },
};

export function AsyncStatePanel({
  eyebrow,
  title,
  description,
  tone,
  actionLabel,
  onAction,
}: {
  eyebrow: string;
  title: string;
  description: string;
  tone: AsyncStateTone;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const styles = toneStyles[tone];

  return (
    <SurfaceCard className="rounded-[24px] p-8 md:p-10" tone="default">
      <div className="flex flex-col gap-4">
        <span
          className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ring-1 ${styles.badge}`}
        >
          {eyebrow}
        </span>
        <div>
          <h2 className={`text-xl font-bold ${styles.title}`}>{title}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">
            {description}
          </p>
        </div>
        {actionLabel && onAction ? (
          <div>
            <button
              type="button"
              onClick={onAction}
              className={styles.button}
            >
              {actionLabel}
            </button>
          </div>
        ) : null}
      </div>
    </SurfaceCard>
  );
}

export function AsyncNotice({
  tone,
  message,
  actions,
}: {
  tone: "info" | "success" | "warning" | "error";
  message: string;
  actions?: React.ReactNode;
}) {
  const classes = {
    info: "bg-sky-50 text-sky-700 ring-sky-100",
    success: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    warning: "bg-amber-50 text-amber-700 ring-amber-100",
    error: "bg-rose-50 text-rose-700 ring-rose-100",
  } as const;

  return (
    <div
      className={`flex flex-col gap-3 rounded-2xl px-4 py-3 text-sm font-semibold ring-1 md:flex-row md:items-center md:justify-between ${classes[tone]}`}
    >
      <span>{message}</span>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}
