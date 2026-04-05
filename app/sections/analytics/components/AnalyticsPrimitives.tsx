"use client";

import type { ReactNode } from "react";
import type { AnalyticsAlert, AnalyticsInsight } from "@/app/lib/analytics-types";

type GenericDatum = { label: string; count: number };

function toNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function toLabel(value: unknown) {
  return typeof value === "string" ? value : String(value ?? "");
}

function toChartItems(value: unknown): GenericDatum[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => {
      if (!entry || typeof entry !== "object") {
        return null;
      }
      const row = entry as Record<string, unknown>;
      const label =
        toLabel(row.label) ||
        toLabel(row.date) ||
        (typeof row.hour === "number" ? `${row.hour}:00` : "");
      const count = toNumber(row.count);
      if (!label) {
        return null;
      }
      return { label, count };
    })
    .filter((entry): entry is GenericDatum => entry !== null);
}

function getVerticalScale(max: number) {
  if (max <= 1) return [0, 1];
  const middle = Math.ceil(max / 2);
  return [0, middle, max];
}

function toFunnelItems(value: unknown): GenericDatum[] {
  return toChartItems(value).map((entry) => ({ label: entry.label, count: entry.count }));
}

function toStackedItems(value: unknown) {
  if (!Array.isArray(value)) {
    return [] as Array<{ label: string; values: Record<string, number> }>;
  }

  return value
    .map((entry) => {
      if (!entry || typeof entry !== "object") {
        return null;
      }
      const row = entry as Record<string, unknown>;
      const label = toLabel(row.label);
      if (!label) {
        return null;
      }
      const values = Object.fromEntries(
        Object.entries(row)
          .filter(([key]) => key !== "label")
          .map(([key, raw]) => [key, toNumber(raw)])
      );
      return { label, values };
    })
    .filter((entry): entry is { label: string; values: Record<string, number> } => entry !== null);
}

function toneToClasses(tone?: string) {
  switch ((tone ?? "").toLowerCase()) {
    case "danger":
    case "critical":
    case "high":
      return "bg-rose-50 text-rose-700 ring-rose-100";
    case "warning":
    case "medium":
      return "bg-amber-50 text-amber-700 ring-amber-100";
    case "success":
    case "low":
      return "bg-emerald-50 text-emerald-700 ring-emerald-100";
    default:
      return "bg-sky-50 text-sky-700 ring-sky-100";
  }
}

export function AnalyticsCard({
  title,
  eyebrow,
  children,
  action,
  className = "",
}: {
  title?: string;
  eyebrow?: string;
  children: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`relative h-full overflow-hidden rounded-[24px] border border-white/75 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.96))] p-3 shadow-[0_16px_34px_rgba(15,23,42,0.07)] ring-1 ring-sky-50/80 sm:p-4 ${className}`}>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-12 bg-gradient-to-r from-sky-50/70 via-white/10 to-emerald-50/50" />
      {(title || eyebrow || action) ? (
        <div className="relative mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            {eyebrow ? (
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                {eyebrow}
              </p>
            ) : null}
            {title ? (
              <h3 className="mt-1 text-lg font-bold text-slate-900">{title}</h3>
            ) : null}
          </div>
          {action}
        </div>
      ) : null}
      <div className="relative">{children}</div>
    </div>
  );
}

export function MetricStrip({
  title,
  metrics,
}: {
  title: string;
  metrics: Array<{ label: string; value: unknown; description?: string }>;
}) {
  if (!metrics.length) return null;

  return (
    <AnalyticsCard eyebrow="Summary" title={title}>
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="flex min-h-[92px] flex-col justify-between rounded-[18px] border border-white/80 bg-[linear-gradient(180deg,rgba(248,250,252,0.98),rgba(241,245,249,0.9))] px-3 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] ring-1 ring-slate-100"
            title={String(metric.value ?? "--")}
          >
            <div className="min-h-[38px]">
              <p className="text-[0.58rem] font-semibold uppercase tracking-[0.18em] text-slate-500">
                {metric.label}
              </p>
            </div>
            <p className="break-words text-[0.9rem] font-bold leading-5 tracking-tight text-slate-950 sm:text-[0.98rem]">
              {String(metric.value ?? "--")}
            </p>
            {metric.description ? <p className="mt-1 text-[0.68rem] text-slate-500">{metric.description}</p> : null}
          </div>
        ))}
      </div>
    </AnalyticsCard>
  );
}

export function BarChartCard({ title, data }: { title: string; data: unknown }) {
  const items = toChartItems(data).slice(0, 6);
  if (!items.length) return null;
  const max = Math.max(...items.map((item) => item.count), 1);

  return (
    <AnalyticsCard eyebrow="Bar Chart" title={title}>
      <div className="rounded-[20px] bg-slate-50/75 px-3 py-3 ring-1 ring-slate-100">
        <div className="flex h-52 items-end gap-3">
          {items.map((item) => (
            <div key={item.label} className="flex min-w-0 flex-1 flex-col items-center justify-end gap-2" title={item.label}>
              <span className="text-[0.75rem] font-bold text-slate-900">{item.count}</span>
              <div className="flex h-36 w-full items-end rounded-2xl bg-white/80 px-2 py-2 ring-1 ring-slate-100" title={item.label}>
                <div
                  className="w-full rounded-xl bg-gradient-to-t from-blue-600 via-sky-500 to-cyan-300 shadow-[0_10px_20px_rgba(14,165,233,0.22)]"
                  style={{ height: `${Math.max((item.count / max) * 100, 8)}%` }}
                />
              </div>
              <span className="line-clamp-2 text-center text-[0.72rem] font-semibold leading-4 text-slate-600" title={item.label}>
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </AnalyticsCard>
  );
}

export function DonutChartCard({ title, data }: { title: string; data: unknown }) {
  const items = toChartItems(data);
  if (!items.length) return null;
  const total = items.reduce((sum, item) => sum + item.count, 0) || 1;
  const palette = ["#0ea5e9", "#22c55e", "#f59e0b", "#f43f5e", "#6366f1", "#14b8a6"];
  let current = 0;
  const stops = items.map((item, index) => {
    const start = current;
    current += (item.count / total) * 100;
    return `${palette[index % palette.length]} ${start}% ${current}%`;
  });

  return (
    <AnalyticsCard eyebrow="Distribution" title={title}>
      <div className="space-y-4">
        <div className="space-y-2">
          <div
            className="mx-auto size-36 shrink-0 rounded-full ring-1 ring-slate-100"
            style={{
              background: `conic-gradient(${stops.join(", ")})`,
            }}
          />
          <p className="text-center text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Total: <span className="text-slate-900">{total}</span>
          </p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {items.map((item, index) => (
            <div key={item.label} className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50/80 px-3 py-2.5 ring-1 ring-slate-100">
              <div className="flex items-center gap-3">
                <span
                  className="size-3 rounded-full"
                  style={{ backgroundColor: palette[index % palette.length] }}
                />
                <span className="text-sm font-semibold text-slate-700">{item.label}</span>
              </div>
              <span className="text-sm font-bold text-slate-900">{item.count}</span>
            </div>
          ))}
        </div>
      </div>
    </AnalyticsCard>
  );
}

export function LineChartCard({ title, data }: { title: string; data: unknown }) {
  const items = toChartItems(data).slice(0, 10);
  if (!items.length) return null;
  const max = Math.max(...items.map((item) => item.count), 1);
  const scale = getVerticalScale(max);
  const axisLabels = items.map((item) => {
    if (/^\d{4}-\d{2}-\d{2}/.test(item.label)) {
      return item.label.slice(5);
    }
    return item.label;
  });
  const points = items
    .map((item, index) => {
      const x = items.length === 1 ? 150 : (index / (items.length - 1)) * 300;
      const y = 120 - (item.count / max) * 100;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <AnalyticsCard eyebrow="Trend" title={title}>
      <div className="rounded-2xl bg-slate-50/70 px-2 py-3 ring-1 ring-slate-100">
        <div className="flex gap-3">
          <div className="flex h-36 w-8 flex-col justify-between pb-4 text-right text-[0.68rem] font-semibold text-slate-500">
            {scale
              .slice()
              .reverse()
              .map((value) => (
                <span key={value}>{value}</span>
              ))}
          </div>
          <div className="min-w-0 flex-1">
            <svg viewBox="0 0 300 124" className="h-36 w-full overflow-visible">
              <path d="M0 108 H300" stroke="#e2e8f0" strokeWidth="1" fill="none" />
              <polyline
                fill="none"
                stroke="#0ea5e9"
                strokeWidth="3"
                strokeLinejoin="round"
                strokeLinecap="round"
                points={points}
              />
              {items.map((item, index) => {
                const x = items.length === 1 ? 150 : (index / (items.length - 1)) * 300;
                const y = 108 - (item.count / max) * 92;
                return (
                  <g key={item.label}>
                    <circle cx={x} cy={y} r="4" fill="#0284c7" />
                  </g>
                );
              })}
            </svg>
            <div
              className="mt-2 grid gap-2"
              style={{ gridTemplateColumns: `repeat(${axisLabels.length}, minmax(0, 1fr))` }}
            >
              {axisLabels.map((label, index) => (
                <span
                  key={`${label}-${index}`}
                  className="text-center text-[0.68rem] font-semibold text-slate-500"
                >
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AnalyticsCard>
  );
}

export function FunnelChartCard({ title, data }: { title: string; data: unknown }) {
  const items = toFunnelItems(data);
  if (!items.length) return null;
  const max = Math.max(...items.map((item) => item.count), 1);

  return (
    <AnalyticsCard eyebrow="Flow" title={title}>
      <div className="space-y-3">
        {items.map((item, index) => (
          <div key={item.label} className="rounded-[20px] bg-slate-50/70 px-3 py-3 ring-1 ring-slate-100">
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-slate-700">{item.label}</span>
              <span className="font-bold text-slate-900">{item.count}</span>
            </div>
            <div
              className="mt-2 mx-auto rounded-full bg-gradient-to-r from-cyan-500 to-sky-700 py-2 text-center text-xs font-bold uppercase tracking-[0.16em] text-white"
              style={{ width: `${Math.max((item.count / max) * (100 - index * 10), 28)}%` }}
            >
              {item.label}
            </div>
          </div>
        ))}
      </div>
    </AnalyticsCard>
  );
}

export function StackedBarChartCard({ title, data }: { title: string; data: unknown }) {
  const items = toStackedItems(data).slice(0, 6);
  if (!items.length) return null;
  const colors = ["bg-sky-500", "bg-emerald-500", "bg-amber-500", "bg-indigo-500", "bg-rose-500"];

  return (
    <AnalyticsCard eyebrow="Stacked" title={title}>
      <div className="space-y-4">
        {items.map((item) => {
          const entries = Object.entries(item.values);
          const total = entries.reduce((sum, [, count]) => sum + count, 0) || 1;
          return (
            <div key={item.label} className="rounded-[20px] bg-slate-50/70 px-3 py-3 ring-1 ring-slate-100">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="font-semibold text-slate-700">{item.label}</span>
                <span className="font-bold text-slate-900">{total}</span>
              </div>
              <div className="mt-2 flex h-3 overflow-hidden rounded-full bg-slate-100">
                {entries.map(([key, count], index) => (
                  <div
                    key={key}
                    className={colors[index % colors.length]}
                    style={{ width: `${(count / total) * 100}%` }}
                    title={`${key}: ${count}`}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </AnalyticsCard>
  );
}

export function InsightsCard({
  title,
  items,
}: {
  title: string;
  items: AnalyticsInsight[] | AnalyticsAlert[];
}) {
  if (!items.length) return null;

  return (
    <AnalyticsCard eyebrow="Insights" title={title}>
      <div className="grid gap-3 md:grid-cols-2">
        {items.map((item, index) => (
          <div
            key={item.id}
            className={`relative overflow-hidden rounded-[18px] px-3 py-2.5 shadow-sm ring-1 ${toneToClasses("severity" in item ? item.severity : (item as AnalyticsInsight).level)}`}
          >
            <div className="absolute inset-y-0 left-0 w-1.5 rounded-l-[18px] bg-current/70" />
            <div className="pl-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-current/80">
                Insight {index + 1}
              </p>
              <p className="mt-1 text-[0.8rem] font-semibold leading-5 text-current">{item.message}</p>
            </div>
          </div>
        ))}
      </div>
    </AnalyticsCard>
  );
}

export function TableCard({ title, rows }: { title: string; rows: unknown }) {
  if (!Array.isArray(rows) || rows.length === 0) return null;
  const recordRows = rows.filter((row): row is Record<string, unknown> => !!row && typeof row === "object");
  if (!recordRows.length) return null;
  const columns = Object.keys(recordRows[0] ?? {}).slice(0, 5);

  return (
    <AnalyticsCard eyebrow="Details" title={title}>
      <div className="overflow-x-auto rounded-[22px] bg-slate-50/75 ring-1 ring-slate-100">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-[11px] uppercase tracking-[0.18em] text-slate-500">
              {columns.map((column) => (
                <th key={column} className="px-3 py-2 font-semibold">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {recordRows.slice(0, 6).map((row, index) => (
              <tr key={String(row.id ?? index)} className="border-b border-slate-50">
                {columns.map((column) => (
                  <td key={column} className="px-3 py-2 font-medium text-slate-700">
                    {String(row[column] ?? "--")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AnalyticsCard>
  );
}
