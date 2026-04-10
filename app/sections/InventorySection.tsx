"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AppSelectField } from "../components/ui/AppSelectField";
import { AsyncStatePanel } from "../components/ui/AsyncStatePanel";
import {
  ViewportBody,
  ViewportFrame,
  ViewportHeader,
  ViewportPage,
  ViewportPanel,
  ViewportScrollBody,
  ViewportTabs,
} from "../components/ui/ViewportLayout";
import {
  type InventoryItemView,
  toString,
  useInventoryBoard,
} from "./inventory/hooks/useInventoryBoard";

const UNIT_OPTIONS = [
  "tablet",
  "capsule",
  "ml",
  "vial",
  "kit",
  "bottle",
  "piece",
];
const DISPENSE_UNIT_OPTIONS = [
  "tablet",
  "capsule",
  "card",
  "bottle",
  "tube",
  "vial",
  "piece",
  "ml",
];
const PURCHASE_UNIT_OPTIONS = [
  "box",
  "pack",
  "bottle",
  "strip",
  "carton",
  "unit",
];
const DOSAGE_FORM_OPTIONS = [
  "tablet",
  "capsule",
  "syrup",
  "injection",
  "cream",
  "ointment",
  "drops",
  "kit",
  "dressing",
  "other",
];
const ROUTE_OPTIONS = [
  "oral",
  "topical",
  "iv",
  "im",
  "nasal",
  "ophthalmic",
  "other",
];
function badgeClass(
  tone: "slate" | "amber" | "rose" | "emerald" | "sky" = "slate",
) {
  if (tone === "amber") return "bg-amber-50 text-amber-700 ring-amber-100";
  if (tone === "rose") return "bg-rose-50 text-rose-700 ring-rose-100";
  if (tone === "emerald")
    return "bg-emerald-50 text-emerald-700 ring-emerald-100";
  if (tone === "sky") return "bg-sky-50 text-sky-700 ring-sky-100";
  return "bg-slate-100 text-slate-700 ring-slate-200";
}

function MetricCard({
  label,
  value,
  tone = "slate",
}: {
  label: string;
  value: string | number;
  tone?: "slate" | "amber" | "rose" | "emerald" | "sky";
}) {
  return (
    <div
      className={`rounded-3xl px-4 py-4 ring-1 ${badgeClass(tone)} bg-white/85`}
    >
      <p className="text-[11px] font-bold uppercase tracking-[0.18em]">
        {label}
      </p>
      <p className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
        {value}
      </p>
    </div>
  );
}

function FieldLabel({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="space-y-1">
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
        {title}
      </p>
      {hint ? (
        <p className="text-[0.78rem] leading-5 text-slate-500">{hint}</p>
      ) : null}
    </div>
  );
}

function FormField({
  label,
  optional,
  children,
}: {
  label: string;
  optional?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="space-y-1.5">
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
          {label}
        </span>
        {optional ? (
          <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
            Optional
          </span>
        ) : null}
      </div>
      {children}
    </label>
  );
}

function ItemSignals({ item }: { item: InventoryItemView }) {
  return (
    <div className="flex flex-wrap gap-2">
      <span
        className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${
          item.stockStatus === "in_stock"
            ? badgeClass("emerald")
            : item.stockStatus === "low_stock" ||
                item.stockStatus === "near_expiry"
              ? badgeClass("amber")
              : badgeClass("rose")
        }`}
      >
        {item.stockStatus.replace(/_/g, " ")}
      </span>
      <span
        className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${badgeClass(item.isActive ? "emerald" : "slate")}`}
      >
        {item.isActive ? "Active" : "Inactive"}
      </span>
      {item.lowStock ? (
        <span
          className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${badgeClass("amber")}`}
        >
          Low stock
        </span>
      ) : null}
      {item.stockoutRisk ? (
        <span
          className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${badgeClass("rose")}`}
        >
          Stockout risk
        </span>
      ) : null}
    </div>
  );
}

function asReportRecord(value: unknown) {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function asReportArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((row): row is Record<string, unknown> => !!row && typeof row === "object")
    : [];
}

function reportValue(value: unknown) {
  if (typeof value === "number") return String(value);
  if (typeof value === "string") return value;
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return "--";
}

function ReportMetricGrid({
  summary,
  emptyMessage,
}: {
  summary: Record<string, unknown>;
  emptyMessage: string;
}) {
  const entries = Object.entries(summary).slice(0, 6);
  if (!entries.length) {
    return <p className="text-sm text-slate-500">{emptyMessage}</p>;
  }
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {entries.map(([key, value]) => (
        <MetricCard
          key={key}
          label={key.replace(/([A-Z])/g, " $1").replace(/_/g, " ").trim()}
          value={reportValue(value)}
          tone="sky"
        />
      ))}
    </div>
  );
}

function ReportListPanel({
  title,
  rows,
  labelKeys,
  valueKeys,
  emptyMessage,
}: {
  title: string;
  rows: Record<string, unknown>[];
  labelKeys: string[];
  valueKeys: string[];
  emptyMessage: string;
}) {
  return (
    <ViewportPanel>
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
        {title}
      </p>
      <div className="mt-4 space-y-2">
        {rows.length ? (
          rows.slice(0, 8).map((row, index) => {
            const primary =
              labelKeys.map((key) => row[key]).find((value) => typeof value === "string" && value) ?? "Unnamed row";
            const secondary = valueKeys
              .map((key) => row[key])
              .filter((value) => value !== undefined && value !== null && value !== "");
            return (
              <div
                key={`${title}-${index}`}
                className="flex items-center justify-between rounded-2xl bg-slate-50/85 px-4 py-3 ring-1 ring-slate-100"
              >
                <div>
                  <p className="font-semibold text-slate-900">{String(primary)}</p>
                  <p className="text-xs text-slate-500">
                    {secondary.length ? secondary.map(reportValue).join(" | ") : "No extra detail"}
                  </p>
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-sm text-slate-500">{emptyMessage}</p>
        )}
      </div>
    </ViewportPanel>
  );
}

function ReportTablePanel({
  title,
  rows,
  emptyMessage,
}: {
  title: string;
  rows: Record<string, unknown>[];
  emptyMessage: string;
}) {
  const columns = rows.length ? Object.keys(rows[0]).slice(0, 5) : [];
  return (
    <ViewportPanel>
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
        {title}
      </p>
      {rows.length ? (
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] uppercase tracking-[0.18em] text-slate-500">
                {columns.map((column) => (
                  <th key={column} className="px-2 py-2 font-semibold">
                    {column.replace(/([A-Z])/g, " $1").replace(/_/g, " ").trim()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 8).map((row, index) => (
                <tr key={`${title}-${index}`} className="border-b border-slate-50">
                  {columns.map((column) => (
                    <td key={column} className="px-2 py-3 text-slate-700">
                      {reportValue(row[column])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="mt-4 text-sm text-slate-500">{emptyMessage}</p>
      )}
    </ViewportPanel>
  );
}

function ActionIcon({
  kind,
}: {
  kind: "add" | "remove" | "adjust" | "batches" | "detail" | "edit";
}) {
  if (kind === "add") {
    return (
      <svg
        className="h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2.2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 5v14M5 12h14"
        />
      </svg>
    );
  }
  if (kind === "remove") {
    return (
      <svg
        className="h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2.2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
      </svg>
    );
  }
  if (kind === "adjust") {
    return (
      <svg
        className="h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4 7h11M4 17h7M17 5v4M15 7h4M13 17l2 2 5-5"
        />
      </svg>
    );
  }
  if (kind === "batches") {
    return (
      <svg
        className="h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4 7l8-4 8 4-8 4-8-4z"
        />
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 12l8 4 8-4" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 17l8 4 8-4" />
      </svg>
    );
  }
  if (kind === "detail") {
    return (
      <svg
        className="h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M11 5h8M11 9h8M11 13h5M5 6h.01M5 10h.01M5 14h.01M5 18h.01M11 17h8"
        />
      </svg>
    );
  }
  return (
    <svg
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16.862 4.487l2.651 2.651M9 7H5a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M15 5l4 4L9 19H5v-4L15 5z"
      />
    </svg>
  );
}

function InventoryTable({
  items,
  selectedItemId,
  onEdit,
  onAddStock,
  onRemoveStock,
  onAdjustStock,
  onViewDetail,
  onViewBatches,
}: {
  items: InventoryItemView[];
  selectedItemId: number | null;
  onEdit: (item: InventoryItemView) => void;
  onAddStock: (item: InventoryItemView) => void;
  onRemoveStock: (item: InventoryItemView) => void;
  onAdjustStock: (item: InventoryItemView) => void;
  onViewDetail: (item: InventoryItemView) => void;
  onViewBatches: (item: InventoryItemView) => void;
}) {
  return (
    <div className="overflow-x-auto rounded-[24px] border border-slate-100 bg-white">
      <table className="min-w-[1120px] w-full text-left text-[0.82rem]">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50/80 text-[10px] uppercase tracking-[0.16em] text-slate-500">
            {[
              "SKU",
              "Name",
              "Category",
              "Base Unit",
              "Dispense",
              "Purchase",
              "Supplier",
              "Stock",
              "Min Stock",
              "Lead Time",
              "Status",
              "Actions",
            ].map((label) => (
              <th key={label} className="px-4 py-2.5 font-semibold">
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr
              key={String(item.id ?? item.name)}
              className={
                item.id === selectedItemId
                  ? "bg-sky-50/70"
                  : "border-b border-slate-50"
              }
            >
              <td className="px-4 py-2.5 font-semibold text-slate-700">
                {item.sku}
              </td>
              <td className="px-4 py-2.5">
                <p className="font-semibold text-slate-900">{item.name}</p>
                <p className="text-[11px] text-slate-500">
                  {item.brandName === "N/A" ? "Brand not set" : item.brandName}
                </p>
              </td>
              <td className="px-4 py-2.5 text-slate-700">{item.category}</td>
              <td className="px-4 py-2.5 text-slate-700">{item.unit}</td>
              <td className="px-4 py-2.5 text-slate-700">
                {item.dispenseUnit} x {item.dispenseUnitSize}
              </td>
              <td className="px-4 py-2.5 text-slate-700">
                {item.purchaseUnit} x {item.purchaseUnitSize}
              </td>
              <td className="px-4 py-2.5 text-slate-700">
                {item.supplierName === "N/A" ? "Not set" : item.supplierName}
              </td>
              <td className="px-4 py-2.5 font-semibold text-slate-900">
                {item.stockSummary.currentStock}
              </td>
              <td className="px-4 py-2.5 text-slate-700">
                {item.stockSummary.minimumStock}
              </td>
              <td className="px-4 py-2.5 text-slate-700">
                {item.leadTimeDays}d
              </td>
              <td className="px-4 py-2.5">
                <ItemSignals item={item} />
              </td>
              <td className="px-4 py-2.5">
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => onAddStock(item)}
                    title="Add Stock"
                    aria-label={`Add stock for ${item.name}`}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-600 text-white"
                  >
                    <ActionIcon kind="add" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onRemoveStock(item)}
                    title="Remove Stock"
                    aria-label={`Remove stock for ${item.name}`}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-amber-200 bg-amber-50 text-amber-800"
                  >
                    <ActionIcon kind="remove" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onAdjustStock(item)}
                    title="Adjust Stock"
                    aria-label={`Adjust stock for ${item.name}`}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-violet-200 bg-violet-50 text-violet-800"
                  >
                    <ActionIcon kind="adjust" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onViewBatches(item)}
                    title="View Batches"
                    aria-label={`View batches for ${item.name}`}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700"
                  >
                    <ActionIcon kind="batches" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onViewDetail(item)}
                    title="View Detail"
                    aria-label={`View detail for ${item.name}`}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-sky-200 bg-sky-50 text-sky-800"
                  >
                    <ActionIcon kind="detail" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onEdit(item)}
                    title="Edit Details"
                    aria-label={`Edit details for ${item.name}`}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-white"
                  >
                    <ActionIcon kind="edit" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StockActionModal({
  open,
  item,
  mode,
  quantity,
  unitLabel,
  unitSize,
  disabled,
  onClose,
  onQuantityChange,
  onSubmit,
}: {
  open: boolean;
  item: InventoryItemView | null;
  mode: "in" | "out" | "adjustment";
  quantity: string;
  unitLabel: string;
  unitSize: number;
  disabled: boolean;
  onClose: () => void;
  onQuantityChange: (value: string) => void;
  onSubmit: () => void | Promise<void>;
}) {
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [open]);

  if (!open || !item || typeof document === "undefined") return null;

  const title =
    mode === "in"
      ? "Add Stock"
      : mode === "out"
        ? "Remove Stock"
        : "Adjust Stock";
  const quantityLabel = mode === "adjustment" ? "Actual Count" : "Quantity";
  const quantityPlaceholder =
    mode === "adjustment" ? `Final stock in ${item.unit}` : `2 ${unitLabel}`;
  const helperText =
    mode === "adjustment"
      ? `Enter the final counted stock in ${item.unit}. The backend will calculate the difference automatically.`
      : `1 ${unitLabel} = ${unitSize} ${item.unit}. Example: enter 2 to ${
          mode === "in" ? "add" : "remove"
        } ${2 * unitSize} ${item.unit}.`;

  return createPortal(
    <div className="fixed inset-0 z-[230] flex items-center justify-center bg-slate-950/28 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-[30px] border border-white/80 bg-white p-6 shadow-[0_28px_70px_rgba(15,23,42,0.22)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
              {title}
            </p>
            <h2 className="mt-2 text-2xl font-bold text-slate-900">
              {item.name}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {mode === "adjustment"
                ? "Correct the final counted stock in one step."
                : `Enter only the stock quantity in ${unitLabel}.`}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-700"
            aria-label="Close add stock modal"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="mt-5 grid gap-3 rounded-[24px] border border-slate-100 bg-slate-50/80 p-4 md:grid-cols-2">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
              Current Stock
            </p>
            <p className="mt-2 text-lg font-bold text-slate-900">
              {item.stock} {item.unit}
            </p>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
              {mode === "in"
                ? "Purchase Pack"
                : mode === "out"
                  ? "Dispense Pack"
                  : "Stock Unit"}
            </p>
            <p className="mt-2 text-lg font-bold text-slate-900">
              {mode === "adjustment" ? item.unit : `${unitLabel} x ${unitSize}`}
            </p>
          </div>
        </div>

        <label className="mt-5 block space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
            {quantityLabel}
          </span>
          <input
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400"
            value={quantity}
            onChange={(e) =>
              onQuantityChange(e.target.value.replace(/[^0-9]/g, ""))
            }
            placeholder={quantityPlaceholder}
            disabled={disabled}
          />
          <p className="text-xs text-slate-500">{helperText}</p>
        </label>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={disabled}
            className="ios-button-primary rounded-2xl px-5 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-70"
          >
            {title}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function PaginationControls({
  page,
  pageCount,
  totalItems,
  pageSize,
  onPageSizeChange,
  onPrevious,
  onNext,
}: {
  page: number;
  pageCount: number;
  totalItems: number;
  pageSize: number;
  onPageSizeChange: (value: number) => void;
  onPrevious: () => void;
  onNext: () => void;
}) {
  const start = totalItems === 0 ? 0 : page * pageSize + 1;
  const end = Math.min(totalItems, (page + 1) * pageSize);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-[22px] border border-slate-100 bg-slate-50/80 px-4 py-3">
      <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
        Showing{" "}
        <span className="font-semibold text-slate-900">
          {start}-{end}
        </span>{" "}
        of <span className="font-semibold text-slate-900">{totalItems}</span>{" "}
        items
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
            Rows
          </span>
          <div className="min-w-[76px]">
            <AppSelectField
              value={pageSize}
              onValueChange={(value) => onPageSizeChange(Number(value))}
              ariaLabel="Inventory rows per page"
              options={[5, 10, 15].map((size) => ({
                value: size,
                label: String(size),
              }))}
              sx={{
                "& .MuiSelect-select": { fontSize: "0.75rem", fontWeight: 600 },
              }}
            />
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="mr-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
          Page {pageCount === 0 ? 0 : page + 1} / {pageCount}
        </span>
        <button
          type="button"
          onClick={onPrevious}
          disabled={page <= 0}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:border-slate-300 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Previous inventory page"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={page >= pageCount - 1}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:border-slate-300 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Next inventory page"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}

function InventoryItemModal({
  open,
  isEditingItem,
  canWriteInventory,
  createState,
  duplicateItem,
  itemForm,
  updateItemForm,
  onClose,
  onReset,
  onSave,
  onUseExisting,
}: {
  open: boolean;
  isEditingItem: boolean;
  canWriteInventory: boolean;
  createState: { status: string };
  duplicateItem: InventoryItemView | null;
  itemForm: ReturnType<typeof useInventoryBoard>["itemForm"];
  updateItemForm: ReturnType<typeof useInventoryBoard>["updateItemForm"];
  onClose: () => void;
  onReset: () => void;
  onSave: () => void;
  onUseExisting: (item: InventoryItemView) => void;
}) {
  const fieldClass =
    "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none";
  const helperFieldClass =
    "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-[0.92rem] font-medium text-slate-900 outline-none placeholder:font-normal placeholder:text-slate-400";
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setShowAdvanced(isEditingItem);
  }, [isEditingItem, open]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[220] flex items-center justify-center bg-slate-950/28 p-4 backdrop-blur-sm">
      <div className="relative flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-[32px] border border-white/75 bg-white shadow-[0_30px_80px_rgba(15,23,42,0.22)]">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-700"
          aria-label="Close inventory item modal"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        <div className="border-b border-slate-100 px-6 py-5 sm:px-7">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
            {isEditingItem ? "Edit Inventory Item" : "Add Inventory Item"}
          </p>
          <h2 className="mt-2 text-2xl font-bold text-slate-900">
            {isEditingItem
              ? "Update item details"
              : "Create item in a simple flow"}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Start with only the essentials. Open advanced settings only when you
            really need them.
          </p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5 sm:px-7">
          <div className="space-y-4">
            {!isEditingItem && duplicateItem ? (
              <div className="rounded-[24px] border border-amber-200 bg-amber-50/90 px-4 py-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-amber-700">
                  Possible Duplicate
                </p>
                <p className="mt-2 text-sm font-medium text-amber-900">
                  A similar item already exists: {duplicateItem.name}
                  {duplicateItem.strength ? ` ${duplicateItem.strength}` : ""}.
                </p>
                <p className="mt-1 text-sm text-amber-800">
                  To keep stock clean, edit the existing item instead of adding
                  another copy.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => onUseExisting(duplicateItem)}
                    className="rounded-full bg-amber-600 px-4 py-2 text-xs font-semibold text-white"
                  >
                    Edit Existing Item
                  </button>
                </div>
              </div>
            ) : null}

            <div className="rounded-[28px] bg-gradient-to-br from-sky-50 via-white to-cyan-50 p-4 ring-1 ring-sky-100">
              <FieldLabel
                title="Block 1: Item Details"
                hint="What is this item? Keep this part short and clear."
              />
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <FormField label="Item name">
                  <input
                    className={helperFieldClass}
                    value={itemForm.name}
                    onChange={(e) => updateItemForm("name", e.target.value)}
                    disabled={!canWriteInventory}
                    placeholder="Paracetamol 500mg"
                  />
                </FormField>
                <FormField label="Category">
                  <AppSelectField
                    value={itemForm.category}
                    onValueChange={(value) =>
                      updateItemForm(
                        "category",
                        value as typeof itemForm.category,
                      )
                    }
                    disabled={!canWriteInventory}
                    ariaLabel="Inventory category"
                    options={[
                      { value: "medicine", label: "Medicine" },
                      { value: "consumable", label: "Consumable" },
                      { value: "equipment", label: "Equipment" },
                      { value: "other", label: "Other" },
                    ]}
                  />
                </FormField>
                <FormField label="Strength" optional>
                  <input
                    className={helperFieldClass}
                    value={itemForm.strength}
                    onChange={(e) => updateItemForm("strength", e.target.value)}
                    disabled={!canWriteInventory}
                    placeholder="500mg"
                  />
                </FormField>
                <FormField label="Base unit">
                  <AppSelectField
                    value={itemForm.unit}
                    onValueChange={(value) => updateItemForm("unit", value)}
                    disabled={!canWriteInventory}
                    ariaLabel="Base unit"
                    options={UNIT_OPTIONS.map((option) => ({
                      value: option,
                      label: option,
                    }))}
                  />
                </FormField>
              </div>
            </div>

            <div className="rounded-[28px] bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-4 ring-1 ring-emerald-100">
              <FieldLabel
                title="Block 2: Stock Rules"
                hint={
                  isEditingItem
                    ? "Keep the stock rule here. Use movements when the real count changes."
                    : "Set opening stock and the minimum safe stock level."
                }
              />
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <FormField
                  label={isEditingItem ? "Current Stock" : "Opening Stock"}
                >
                  <p className="min-h-[2.75rem] text-[0.74rem] leading-5 text-slate-500">
                    {isEditingItem
                      ? "Stock is changed from Add Stock, Remove Stock, or Adjust Stock so the movement history stays clean."
                      : "Starting quantity currently available in base units when creating this item."}
                  </p>
                  {isEditingItem ? (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-[0.92rem] font-semibold text-slate-900">
                      {itemForm.stock || "0"} {itemForm.unit}
                    </div>
                  ) : (
                    <input
                      className={helperFieldClass}
                      value={itemForm.stock}
                      onChange={(e) =>
                        updateItemForm(
                          "stock",
                          e.target.value.replace(/[^0-9]/g, ""),
                        )
                      }
                      disabled={!canWriteInventory}
                      placeholder="200"
                    />
                  )}
                </FormField>
                <FormField label="Minimum Stock Level">
                  <p className="min-h-[2.75rem] text-[0.74rem] leading-5 text-slate-500">
                    Set the lowest safe stock quantity for this item. If current
                    stock goes below this, the system shows a low-stock warning.
                  </p>
                  <input
                    className={helperFieldClass}
                    value={itemForm.reorderLevel}
                    onChange={(e) =>
                      updateItemForm(
                        "reorderLevel",
                        e.target.value.replace(/[^0-9]/g, ""),
                      )
                    }
                    disabled={!canWriteInventory}
                    placeholder="50"
                  />
                </FormField>
              </div>
            </div>

            <div className="rounded-[28px] bg-gradient-to-br from-violet-50 via-white to-fuchsia-50 p-4 ring-1 ring-violet-100">
              <FieldLabel
                title="Block 3: Clinical Usage"
                hint="Keep only the doctor-facing usage details here."
              />
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <FormField label="Prescription type" optional>
                  <AppSelectField
                    value={itemForm.prescriptionType}
                    onValueChange={(value) =>
                      updateItemForm(
                        "prescriptionType",
                        value as typeof itemForm.prescriptionType,
                      )
                    }
                    disabled={!canWriteInventory}
                    displayEmpty
                    ariaLabel="Prescription type"
                    options={[
                      { value: "", label: "Clinical / outside / both" },
                      { value: "clinical", label: "Clinical" },
                      { value: "outside", label: "Outside" },
                      { value: "both", label: "Both" },
                    ]}
                  />
                </FormField>
                <FormField label="Direct dispense">
                  <label className="flex items-center gap-3 rounded-2xl border border-violet-100 bg-white px-4 py-3 text-[0.92rem] font-medium text-slate-700">
                    <input
                      type="checkbox"
                      checked={itemForm.directDispenseAllowed}
                      onChange={(e) =>
                        updateItemForm(
                          "directDispenseAllowed",
                          e.target.checked,
                        )
                      }
                      disabled={!canWriteInventory}
                    />
                    Allowed for clinic dispensing
                  </label>
                </FormField>
                <FormField label="Notes" optional>
                  <textarea
                    className={`${helperFieldClass} min-h-[88px] md:col-span-2`}
                    value={itemForm.notes}
                    onChange={(e) => updateItemForm("notes", e.target.value)}
                    disabled={!canWriteInventory}
                    placeholder="Fast-moving clinic stock item"
                  />
                </FormField>
              </div>
            </div>

            <div className="rounded-[24px] border border-slate-200 bg-white px-4 py-4">
              <button
                type="button"
                onClick={() => setShowAdvanced((current) => !current)}
                className="flex w-full items-center justify-between gap-3 text-left"
              >
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
                    Advanced Settings
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    Optional details for admin correction, supplier setup, and
                    special item flags.
                  </p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                  {showAdvanced ? "Hide" : "Show"}
                </span>
              </button>
              {showAdvanced ? (
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <FormField label="Generic name" optional>
                    <input
                      className={helperFieldClass}
                      value={itemForm.genericName}
                      onChange={(e) =>
                        updateItemForm("genericName", e.target.value)
                      }
                      disabled={!canWriteInventory}
                      placeholder="Paracetamol"
                    />
                  </FormField>
                  <FormField label="Brand name" optional>
                    <input
                      className={helperFieldClass}
                      value={itemForm.brandName}
                      onChange={(e) =>
                        updateItemForm("brandName", e.target.value)
                      }
                      disabled={!canWriteInventory}
                      placeholder="Panadol"
                    />
                  </FormField>
                  <FormField label="SKU" optional>
                    <input
                      className={helperFieldClass}
                      value={itemForm.sku}
                      onChange={(e) => updateItemForm("sku", e.target.value)}
                      disabled={!canWriteInventory}
                      placeholder="PCM-500"
                    />
                  </FormField>
                  <FormField label="Subcategory" optional>
                    <input
                      className={helperFieldClass}
                      value={itemForm.subcategory}
                      onChange={(e) =>
                        updateItemForm("subcategory", e.target.value)
                      }
                      disabled={!canWriteInventory}
                      placeholder="Tablet / consumable / kit"
                    />
                  </FormField>
                  <FormField label="Dosage form" optional>
                    <AppSelectField
                      value={itemForm.dosageForm}
                      onValueChange={(value) =>
                        updateItemForm("dosageForm", value)
                      }
                      disabled={!canWriteInventory}
                      displayEmpty
                      ariaLabel="Dosage form"
                      options={[
                        { value: "", label: "Dosage form" },
                        ...DOSAGE_FORM_OPTIONS.map((option) => ({
                          value: option,
                          label: option,
                        })),
                      ]}
                    />
                  </FormField>
                  <FormField label="Supplier name" optional>
                    <input
                      className={helperFieldClass}
                      value={itemForm.supplierName}
                      onChange={(e) =>
                        updateItemForm("supplierName", e.target.value)
                      }
                      disabled={!canWriteInventory}
                      placeholder="ABC Pharma"
                    />
                  </FormField>
                  <FormField label="Description" optional>
                    <input
                      className={helperFieldClass}
                      value={itemForm.description}
                      onChange={(e) =>
                        updateItemForm("description", e.target.value)
                      }
                      disabled={!canWriteInventory}
                      placeholder="Common fever medication"
                    />
                  </FormField>
                  <FormField label="Purchase unit" optional>
                    <AppSelectField
                      value={itemForm.purchaseUnit}
                      onValueChange={(value) =>
                        updateItemForm("purchaseUnit", value)
                      }
                      disabled={!canWriteInventory}
                      ariaLabel="Purchase unit"
                      options={PURCHASE_UNIT_OPTIONS.map((option) => ({
                        value: option,
                        label: option,
                      }))}
                    />
                  </FormField>
                  <FormField label="Base units per purchase" optional>
                    <input
                      className={helperFieldClass}
                      value={itemForm.purchaseUnitSize}
                      onChange={(e) =>
                        updateItemForm(
                          "purchaseUnitSize",
                          e.target.value.replace(/[^0-9]/g, ""),
                        )
                      }
                      disabled={!canWriteInventory}
                      placeholder="100"
                    />
                  </FormField>
                  <FormField label="Dispense unit" optional>
                    <AppSelectField
                      value={itemForm.dispenseUnit}
                      onValueChange={(value) =>
                        updateItemForm("dispenseUnit", value)
                      }
                      disabled={!canWriteInventory}
                      ariaLabel="Dispense unit"
                      options={DISPENSE_UNIT_OPTIONS.map((option) => ({
                        value: option,
                        label: option,
                      }))}
                    />
                  </FormField>
                  <FormField label="Base units per dispense" optional>
                    <input
                      className={helperFieldClass}
                      value={itemForm.dispenseUnitSize}
                      onChange={(e) =>
                        updateItemForm(
                          "dispenseUnitSize",
                          e.target.value.replace(/[^0-9]/g, ""),
                        )
                      }
                      disabled={!canWriteInventory}
                      placeholder="10"
                    />
                  </FormField>
                  <FormField label="Batch number" optional>
                    <input
                      className={helperFieldClass}
                      value={itemForm.batchNo}
                      onChange={(e) =>
                        updateItemForm("batchNo", e.target.value)
                      }
                      disabled={!canWriteInventory}
                      placeholder="B-001"
                    />
                  </FormField>
                  <FormField label="Expiry date" optional>
                    <input
                      className={helperFieldClass}
                      value={itemForm.expiryDate}
                      onChange={(e) =>
                        updateItemForm("expiryDate", e.target.value)
                      }
                      disabled={!canWriteInventory}
                      type="date"
                    />
                  </FormField>
                  <FormField label="Storage location" optional>
                    <input
                      className={helperFieldClass}
                      value={itemForm.storageLocation}
                      onChange={(e) =>
                        updateItemForm("storageLocation", e.target.value)
                      }
                      disabled={!canWriteInventory}
                      placeholder="Shelf A"
                    />
                  </FormField>
                  <FormField label="Lead Time (days)" optional>
                    <p className="min-h-[2.75rem] text-[0.74rem] leading-5 text-slate-500">
                      How many days supplier usually takes to deliver.
                    </p>
                    <input
                      className={helperFieldClass}
                      value={itemForm.leadTimeDays}
                      onChange={(e) =>
                        updateItemForm(
                          "leadTimeDays",
                          e.target.value.replace(/[^0-9]/g, ""),
                        )
                      }
                      disabled={!canWriteInventory}
                      placeholder="7"
                    />
                  </FormField>
                  <FormField label="Minimum Stock Level" optional>
                    <input
                      className={helperFieldClass}
                      value={itemForm.minStockLevel}
                      onChange={(e) =>
                        updateItemForm(
                          "minStockLevel",
                          e.target.value.replace(/[^0-9]/g, ""),
                        )
                      }
                      disabled={!canWriteInventory}
                      placeholder="40"
                    />
                  </FormField>
                  <FormField label="Maximum stock" optional>
                    <input
                      className={helperFieldClass}
                      value={itemForm.maxStockLevel}
                      onChange={(e) =>
                        updateItemForm(
                          "maxStockLevel",
                          e.target.value.replace(/[^0-9]/g, ""),
                        )
                      }
                      disabled={!canWriteInventory}
                      placeholder="500"
                    />
                  </FormField>
                  <FormField label="Route" optional>
                    <AppSelectField
                      value={itemForm.route}
                      onValueChange={(value) => updateItemForm("route", value)}
                      disabled={!canWriteInventory}
                      displayEmpty
                      ariaLabel="Route"
                      options={[
                        { value: "", label: "Route" },
                        ...ROUTE_OPTIONS.map((option) => ({
                          value: option,
                          label: option,
                        })),
                      ]}
                    />
                  </FormField>
                  <FormField label="Prescription requirement">
                    <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-[0.92rem] font-medium text-slate-700">
                      <input
                        type="checkbox"
                        checked={itemForm.requiresPrescription}
                        onChange={(e) =>
                          updateItemForm(
                            "requiresPrescription",
                            e.target.checked,
                          )
                        }
                        disabled={!canWriteInventory}
                      />
                      Needs prescription
                    </label>
                  </FormField>
                  <FormField label="Antibiotic">
                    <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-[0.92rem] font-medium text-slate-700">
                      <input
                        type="checkbox"
                        checked={itemForm.isAntibiotic}
                        onChange={(e) =>
                          updateItemForm("isAntibiotic", e.target.checked)
                        }
                        disabled={!canWriteInventory}
                      />
                      Mark as antibiotic
                    </label>
                  </FormField>
                  <FormField label="Controlled item">
                    <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-[0.92rem] font-medium text-slate-700">
                      <input
                        type="checkbox"
                        checked={itemForm.isControlled}
                        onChange={(e) =>
                          updateItemForm("isControlled", e.target.checked)
                        }
                        disabled={!canWriteInventory}
                      />
                      Requires control handling
                    </label>
                  </FormField>
                  <FormField label="Pediatric safe">
                    <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-[0.92rem] font-medium text-slate-700">
                      <input
                        type="checkbox"
                        checked={itemForm.isPediatricSafe}
                        onChange={(e) =>
                          updateItemForm("isPediatricSafe", e.target.checked)
                        }
                        disabled={!canWriteInventory}
                      />
                      Safe for children
                    </label>
                  </FormField>
                  <FormField label="Clinic use only">
                    <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-[0.92rem] font-medium text-slate-700">
                      <input
                        type="checkbox"
                        checked={itemForm.clinicUseOnly}
                        onChange={(e) =>
                          updateItemForm("clinicUseOnly", e.target.checked)
                        }
                        disabled={!canWriteInventory}
                      />
                      Not for patient dispense
                    </label>
                  </FormField>
                  <FormField label="Item status">
                    <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-[0.92rem] font-medium text-slate-700 md:col-span-2">
                      <input
                        type="checkbox"
                        checked={itemForm.isActive}
                        onChange={(e) =>
                          updateItemForm("isActive", e.target.checked)
                        }
                        disabled={!canWriteInventory}
                      />
                      Item is active
                    </label>
                  </FormField>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 px-6 py-4 sm:px-7">
          <div className="flex flex-wrap justify-end gap-3">
            <button
              type="button"
              onClick={onReset}
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
            >
              New item
            </button>
            <button
              type="button"
              onClick={onSave}
              disabled={!canWriteInventory || createState.status === "pending"}
              className="ios-button-primary rounded-2xl px-5 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-70"
            >
              {createState.status === "pending"
                ? isEditingItem
                  ? "Updating item..."
                  : "Creating item..."
                : isEditingItem
                  ? "Update inventory item"
                  : "Add inventory item"}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export default function InventorySection() {
  const [activeReportView, setActiveReportView] = useState<
    "clinic-overview" | "doctor-performance" | "assistant-performance" | "inventory-usage" | "patient-followup"
  >("inventory-usage");
  const {
    activeTab,
    setActiveTab,
    items,
    filteredItems,
    inventorySummary,
    alertSummary,
    lowStockItems,
    stockoutRiskItems,
    topMovingItems,
    recommendedReorders,
    selectedItemId,
    setSelectedItemId,
    selectedItem,
    movements,
    batches,
    movementLoadState,
    alertsLoadState,
    canWriteInventory,
    canPostMovement,
    inventorySearch,
    setInventorySearch,
    categoryFilter,
    setCategoryFilter,
    statusFilter,
    setStatusFilter,
    alertDays,
    setAlertDays,
    reportsRange,
    setReportsRange,
    reportsDateFrom,
    setReportsDateFrom,
    reportsDateTo,
    setReportsDateTo,
    reportsDoctorId,
    setReportsDoctorId,
    reportsAssistantId,
    setReportsAssistantId,
    doctorOptions,
    assistantOptions,
    itemForm,
    updateItemForm,
    movementForm,
    updateMovementForm,
    batchForm,
    updateBatchForm,
    movementUnitType,
    movementUnitLabel,
    movementUnitSize,
    isEditingItem,
    duplicateItem,
    startCreateItem,
    startEditItem,
    loadState,
    createState,
    movementState,
    detailSummary,
    detailRecentMovements,
    reportShell,
    reportSections,
    currentUser,
    refresh,
    handleSaveItem,
    handleSubmitMovement,
    handleCreateBatch,
  } = useInventoryBoard(activeReportView);

  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [isStockActionModalOpen, setIsStockActionModalOpen] = useState(false);
  const [stockActionMode, setStockActionMode] = useState<
    "in" | "out" | "adjustment"
  >("in");
  const [inventoryPage, setInventoryPage] = useState(0);
  const [inventoryPageSize, setInventoryPageSize] = useState(5);
  const fieldClass =
    "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none";

  const inventoryPageCount = Math.max(
    1,
    Math.ceil(filteredItems.length / inventoryPageSize),
  );
  const paginatedItems = useMemo(() => {
    const start = inventoryPage * inventoryPageSize;
    return filteredItems.slice(start, start + inventoryPageSize);
  }, [filteredItems, inventoryPage]);
  const reportRole = currentUser?.role ?? "owner";
  const reportViewOptions = useMemo(() => {
    if (reportRole === "doctor") {
      return [
        { key: "doctor-performance", label: "Doctor Performance" },
        { key: "patient-followup", label: "Patient Follow-up" },
      ] as const;
    }
    if (reportRole === "assistant") {
      return [
        { key: "assistant-performance", label: "Assistant Performance" },
        { key: "inventory-usage", label: "Inventory Usage" },
      ] as const;
    }
    return [
      { key: "clinic-overview", label: "Clinic Overview" },
      { key: "doctor-performance", label: "Doctor Performance" },
      { key: "assistant-performance", label: "Assistant Performance" },
      { key: "inventory-usage", label: "Inventory Usage" },
      { key: "patient-followup", label: "Patient Follow-up" },
    ] as const;
  }, [reportRole]);

  useEffect(() => {
    if (createState.status === "success") {
      setIsItemModalOpen(false);
    }
  }, [createState.status]);

  useEffect(() => {
    setInventoryPage(0);
  }, [inventorySearch, categoryFilter, statusFilter, inventoryPageSize]);

  useEffect(() => {
    if (inventoryPage > inventoryPageCount - 1) {
      setInventoryPage(Math.max(0, inventoryPageCount - 1));
    }
  }, [inventoryPage, inventoryPageCount]);

  useEffect(() => {
    if (!reportViewOptions.some((option) => option.key === activeReportView)) {
      setActiveReportView(reportViewOptions[0]?.key ?? "inventory-usage");
    }
  }, [activeReportView, reportViewOptions]);

  useEffect(() => {
    if (activeTab !== "inventory") return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const tagName = target?.tagName?.toLowerCase();
      const isTypingTarget =
        tagName === "input" ||
        tagName === "textarea" ||
        tagName === "select" ||
        target?.isContentEditable;
      if (isTypingTarget) return;

      if (event.key === "ArrowLeft") {
        setInventoryPage((current) => Math.max(0, current - 1));
      }

      if (event.key === "ArrowRight") {
        setInventoryPage((current) =>
          Math.min(inventoryPageCount - 1, current + 1),
        );
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeTab, inventoryPageCount]);

  const openCreateModal = () => {
    startCreateItem();
    setIsItemModalOpen(true);
  };

  const openEditModal = (item: InventoryItemView) => {
    startEditItem(item);
    setIsItemModalOpen(true);
  };

  const openStockActionModal = (
    item: InventoryItemView,
    mode: "in" | "out" | "adjustment",
  ) => {
    setSelectedItemId(item.id);
    setStockActionMode(mode);
    updateMovementForm("type", mode);
    updateMovementForm(
      "reason",
      mode === "in" ? "purchase" : mode === "out" ? "dispense" : "adjustment",
    );
    updateMovementForm("quantity", "1");
    updateMovementForm("note", "");
    updateMovementForm("referenceType", "");
    updateMovementForm("referenceId", "");
    setIsStockActionModalOpen(true);
  };

  const handleStockActionSubmit = async () => {
    const didSave = await handleSubmitMovement();
    if (didSave) {
      setIsStockActionModalOpen(false);
    }
  };

  const openDetailTab = (item: InventoryItemView) => {
    setSelectedItemId(item.id);
    setActiveTab("detail");
  };

  const openBatchesTab = (item: InventoryItemView) => {
    setSelectedItemId(item.id);
    setActiveTab("batches");
  };

  return (
    <ViewportPage className="h-full overflow-hidden">
      <ViewportFrame>
        <ViewportBody className="gap-5 overflow-hidden px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
          <ViewportHeader
            eyebrow="Inventory"
            title="Inventory Control Center"
            description="Use stock master records, movement history, and alerts as one connected inventory workflow."
            actions={
              <button
                type="button"
                onClick={refresh}
                className="ios-button-primary rounded-2xl px-4 py-2 text-xs"
              >
                Refresh inventory
              </button>
            }
          />

          <ViewportPanel>
            <ViewportTabs
              tabs={[
                {
                  key: "overview",
                  label: "Overview",
                  active: activeTab === "overview",
                  onClick: () => setActiveTab("overview"),
                },
                {
                  key: "inventory",
                  label: "Inventory",
                  active: activeTab === "inventory",
                  onClick: () => setActiveTab("inventory"),
                },
                {
                  key: "detail",
                  label: "Detail",
                  active: activeTab === "detail",
                  onClick: () => setActiveTab("detail"),
                },
                {
                  key: "movements",
                  label: "Movements",
                  active: activeTab === "movements",
                  onClick: () => setActiveTab("movements"),
                },
                {
                  key: "batches",
                  label: "Batches",
                  active: activeTab === "batches",
                  onClick: () => setActiveTab("batches"),
                },
                {
                  key: "alerts",
                  label: "Alerts",
                  active: activeTab === "alerts",
                  onClick: () => setActiveTab("alerts"),
                },
                {
                  key: "reports",
                  label: "Reports",
                  active: activeTab === "reports",
                  onClick: () => setActiveTab("reports"),
                },
              ]}
            />
          </ViewportPanel>

          {activeTab === "overview" ? (
            <div className="space-y-5">
              <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
                <MetricCard label="Items" value={inventorySummary.totalItems} />
                <MetricCard
                  label="Active"
                  value={inventorySummary.activeCount}
                  tone="emerald"
                />
                <MetricCard
                  label="Units"
                  value={inventorySummary.totalUnits}
                  tone="sky"
                />
                <MetricCard
                  label="Low Stock"
                  value={alertSummary.lowStockCount}
                  tone="amber"
                />
                <MetricCard
                  label="Risk"
                  value={alertSummary.stockoutRiskCount}
                  tone="rose"
                />
                <MetricCard
                  label="Recommended Reorders"
                  value={alertSummary.recommendedReorderCount}
                  tone="emerald"
                />
              </div>

              <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
                <ViewportPanel>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
                        Recommended Reorders
                      </p>
                      <h2 className="mt-1 text-xl font-bold text-slate-900">
                        Reorder recommendations
                      </h2>
                    </div>
                    <div className="w-[112px]">
                      <AppSelectField
                        value={alertDays}
                        onValueChange={(value) => setAlertDays(Number(value))}
                        ariaLabel="Alert days"
                        options={[
                          { value: 7, label: "7 days" },
                          { value: 30, label: "30 days" },
                          { value: 60, label: "60 days" },
                        ]}
                      />
                    </div>
                  </div>
                  <div className="mt-4 overflow-x-auto">
                    <table className="min-w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-slate-100 text-[11px] uppercase tracking-[0.18em] text-slate-500">
                          {[
                            "Item",
                            "Current",
                            "Min Stock",
                            "Avg/day",
                            "Days Left",
                            "Recommended Reorder Qty",
                            "Suggested Packs",
                          ].map((label) => (
                            <th key={label} className="px-2 py-2 font-semibold">
                              {label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {recommendedReorders.slice(0, 8).map((row, index) => (
                          <tr
                            key={`${row.itemName}-${index}`}
                            className="border-b border-slate-50"
                          >
                            <td className="px-2 py-3 font-semibold text-slate-900">
                              {row.itemName}
                            </td>
                            <td className="px-2 py-3">{row.currentStock}</td>
                            <td className="px-2 py-3">{row.reorderLevel}</td>
                            <td className="px-2 py-3">
                              {row.averageDailyUsage}
                            </td>
                            <td className="px-2 py-3">
                              {row.projectedDaysRemaining}
                            </td>
                            <td className="px-2 py-3 font-semibold text-slate-900">
                              {row.recommendedReorderQty}
                            </td>
                            <td className="px-2 py-3 text-slate-700">
                              {row.suggestedPurchasePacks ||
                                row.suggestedDispensePacks ||
                                "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {!recommendedReorders.length &&
                    alertsLoadState.status !== "loading" ? (
                      <p className="px-2 py-4 text-sm text-slate-500">
                        No reorder recommendations for this range.
                      </p>
                    ) : null}
                  </div>
                </ViewportPanel>

                <div className="grid gap-5">
                  <ViewportPanel>
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
                      Low Stock Items
                    </p>
                    <div className="mt-4 space-y-2">
                      {lowStockItems.slice(0, 5).map((item) => (
                        <div
                          key={String(item.id ?? item.name)}
                          className="flex items-center justify-between rounded-2xl bg-slate-50/85 px-4 py-3 ring-1 ring-slate-100"
                        >
                          <div>
                            <p className="font-semibold text-slate-900">
                              {item.name}
                            </p>
                            <p className="text-xs text-slate-500">
                              Current stock {item.stockSummary.currentStock} -
                              min stock {item.stockSummary.minimumStock}
                            </p>
                          </div>
                          <span
                            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${badgeClass("amber")}`}
                          >
                            Low stock
                          </span>
                        </div>
                      ))}
                      {!lowStockItems.length &&
                      alertsLoadState.status !== "loading" ? (
                        <p className="text-sm text-slate-500">
                          No low stock items.
                        </p>
                      ) : null}
                    </div>
                  </ViewportPanel>
                  <ViewportPanel>
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
                      Top Moving Items
                    </p>
                    <div className="mt-4 space-y-2">
                      {topMovingItems.slice(0, 5).map((item) => (
                        <div
                          key={String(item.id ?? item.name)}
                          className="flex items-center justify-between rounded-2xl bg-slate-50/85 px-4 py-3 ring-1 ring-slate-100"
                        >
                          <div>
                            <p className="font-semibold text-slate-900">
                              {item.name}
                            </p>
                            <p className="text-xs text-slate-500">
                              {item.category}
                            </p>
                          </div>
                          <span
                            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${badgeClass("sky")}`}
                          >
                            {item.stockSummary.currentStock}
                          </span>
                        </div>
                      ))}
                      {!topMovingItems.length &&
                      alertsLoadState.status !== "loading" ? (
                        <p className="text-sm text-slate-500">
                          No movement insights returned yet.
                        </p>
                      ) : null}
                    </div>
                  </ViewportPanel>
                </div>
              </div>
            </div>
          ) : null}

          {activeTab === "inventory" ? (
            <div className="flex min-h-0 flex-1 flex-col">
              <ViewportPanel className="flex min-h-0 flex-col">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
                      Inventory Master List
                    </p>
                    <h2 className="mt-1 text-xl font-bold text-slate-900">
                      Stock table
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={openCreateModal}
                    className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white"
                  >
                    Add new item
                  </button>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_160px]">
                  <input
                    value={inventorySearch}
                    onChange={(e) => setInventorySearch(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none"
                    placeholder="Search SKU, name, brand, supplier"
                  />
                  <AppSelectField
                    value={categoryFilter}
                    onValueChange={setCategoryFilter}
                    ariaLabel="Inventory category filter"
                    options={[
                      { value: "all", label: "All categories" },
                      { value: "medicine", label: "Medicine" },
                      { value: "consumable", label: "Consumable" },
                      { value: "equipment", label: "Equipment" },
                      { value: "other", label: "Other" },
                    ]}
                  />
                  <AppSelectField
                    value={statusFilter}
                    onValueChange={(value) =>
                      setStatusFilter(value as typeof statusFilter)
                    }
                    ariaLabel="Inventory status filter"
                    options={[
                      { value: "all", label: "All status" },
                      { value: "active", label: "Active" },
                      { value: "inactive", label: "Inactive" },
                    ]}
                  />
                </div>
                <div className="mt-4 min-h-0 flex-1">
                  {loadState.status === "loading" ? (
                    <AsyncStatePanel
                      eyebrow="Loading"
                      title="Loading inventory items"
                      description="Stock levels and inventory records are being synchronized."
                      tone="loading"
                    />
                  ) : loadState.status === "empty" ? (
                    <AsyncStatePanel
                      eyebrow="Empty"
                      title="No inventory items yet"
                      description="Create the first stock item to start tracking inventory movements."
                      tone="empty"
                    />
                  ) : (
                    <div className="space-y-4">
                      <div
                        className={
                          inventoryPageSize > 5
                            ? "max-h-[380px] overflow-y-scroll pr-2 scrollbar-thin scrollbar-track-slate-100 scrollbar-thumb-slate-300"
                            : ""
                        }
                      >
                        <InventoryTable
                          items={paginatedItems}
                          selectedItemId={selectedItemId}
                          onEdit={openEditModal}
                          onAddStock={(item) =>
                            openStockActionModal(item, "in")
                          }
                          onRemoveStock={(item) =>
                            openStockActionModal(item, "out")
                          }
                          onAdjustStock={(item) =>
                            openStockActionModal(item, "adjustment")
                          }
                          onViewDetail={openDetailTab}
                          onViewBatches={openBatchesTab}
                        />
                      </div>
                      <PaginationControls
                        page={inventoryPage}
                        pageCount={inventoryPageCount}
                        totalItems={filteredItems.length}
                        pageSize={inventoryPageSize}
                        onPageSizeChange={setInventoryPageSize}
                        onPrevious={() =>
                          setInventoryPage((current) =>
                            Math.max(0, current - 1),
                          )
                        }
                        onNext={() =>
                          setInventoryPage((current) =>
                            Math.min(inventoryPageCount - 1, current + 1),
                          )
                        }
                      />
                    </div>
                  )}
                </div>
              </ViewportPanel>
            </div>
          ) : null}

          {activeTab === "detail" ? (
            <div className="grid gap-5 xl:grid-cols-[0.92fr_1.08fr]">
              <ViewportPanel>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
                  Inventory Detail
                </p>
                <h2 className="mt-1 text-xl font-bold text-slate-900">
                  {selectedItem
                    ? selectedItem.name
                    : "Select an inventory item"}
                </h2>
                {selectedItem ? (
                  <>
                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      <MetricCard
                        label="Current Stock"
                        value={`${detailSummary.currentStock} ${selectedItem.unit}`}
                        tone="sky"
                      />
                      <MetricCard
                        label="Minimum Stock"
                        value={`${detailSummary.minimumStock} ${selectedItem.unit}`}
                        tone="amber"
                      />
                      <MetricCard
                        label="Short By"
                        value={`${detailSummary.shortBy} ${selectedItem.unit}`}
                        tone={detailSummary.shortBy > 0 ? "rose" : "emerald"}
                      />
                      <MetricCard
                        label="Status"
                        value={selectedItem.stockStatus.replace(/_/g, " ")}
                        tone={
                          selectedItem.stockStatus === "in_stock"
                            ? "emerald"
                            : selectedItem.stockStatus === "low_stock" ||
                                selectedItem.stockStatus === "near_expiry"
                              ? "amber"
                              : "rose"
                        }
                      />
                    </div>
                    <div className="mt-4 space-y-3 rounded-[24px] border border-slate-100 bg-slate-50/80 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-semibold text-slate-700">
                          Purchase Pack Equivalent
                        </span>
                        <span className="text-sm font-bold text-slate-900">
                          {detailSummary.purchasePackEquivalent || "-"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-semibold text-slate-700">
                          Dispense Pack Equivalent
                        </span>
                        <span className="text-sm font-bold text-slate-900">
                          {detailSummary.dispensePackEquivalent || "-"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-semibold text-slate-700">
                          Recent Movements
                        </span>
                        <span className="text-sm font-bold text-slate-900">
                          {detailSummary.totalMovementCount}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-semibold text-slate-700">
                          Batches
                        </span>
                        <span className="text-sm font-bold text-slate-900">
                          {detailSummary.totalBatchCount}
                        </span>
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="mt-4 text-sm text-slate-500">
                    Pick an item from the inventory tab to view detail.
                  </p>
                )}
              </ViewportPanel>

              <ViewportPanel className="flex min-h-0 flex-col">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
                  Recent Movements
                </p>
                <ViewportScrollBody className="mt-4">
                  {detailRecentMovements.length ? (
                    <div className="space-y-2">
                      {detailRecentMovements.map((movement, index) => (
                        <div
                          key={String(movement.id ?? index)}
                          className="rounded-2xl bg-slate-50/85 px-4 py-3 ring-1 ring-slate-100"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="font-semibold capitalize text-slate-900">
                                {movement.type} - {movement.reason}
                              </p>
                              <p className="text-xs text-slate-500">
                                {movement.note ||
                                  movement.createdAt ||
                                  "No note"}
                              </p>
                            </div>
                            <p className="text-lg font-bold text-slate-900">
                              {movement.quantity}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">
                      No recent movements yet.
                    </p>
                  )}
                </ViewportScrollBody>
              </ViewportPanel>
            </div>
          ) : null}

          {activeTab === "movements" ? (
            <div className="grid gap-5 xl:grid-cols-[0.92fr_1.08fr]">
              <ViewportPanel>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
                  Stock Movement Screen
                </p>
                <h2 className="mt-1 text-xl font-bold text-slate-900">
                  {selectedItem
                    ? selectedItem.name
                    : "Select an inventory item"}
                </h2>
                {selectedItem ? (
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <MetricCard
                      label="Current Stock"
                      value={`${selectedItem.stockSummary.currentStock} ${selectedItem.unit}`}
                      tone="sky"
                    />
                    <MetricCard
                      label="Minimum Stock Level"
                      value={`${selectedItem.stockSummary.minimumStock} ${selectedItem.unit}`}
                      tone="amber"
                    />
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-slate-500">
                    Pick an item from the inventory tab to post stock in, stock
                    out, or adjustments.
                  </p>
                )}
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <AppSelectField
                    value={movementForm.type}
                    onValueChange={(value) =>
                      updateMovementForm(
                        "type",
                        value as typeof movementForm.type,
                      )
                    }
                    disabled={!canPostMovement}
                    ariaLabel="Movement type"
                    options={[
                      { value: "in", label: "Add Stock" },
                      { value: "out", label: "Remove Stock" },
                      { value: "adjustment", label: "Adjust Stock" },
                    ]}
                  />
                  <div className="space-y-1">
                    <input
                      className={fieldClass}
                      value={movementForm.quantity}
                      onChange={(e) =>
                        updateMovementForm(
                          "quantity",
                          e.target.value.replace(/[^0-9]/g, ""),
                        )
                      }
                      disabled={!canPostMovement}
                      placeholder={`Quantity in ${movementUnitLabel}`}
                    />
                    <p className="px-1 text-xs text-slate-500">
                      {movementUnitType === "base"
                        ? `Enter the final counted stock in ${movementUnitLabel}. The backend will create the adjustment movement automatically.`
                        : `Send the quantity in ${movementUnitLabel}. The backend converts it using ${movementUnitSize} ${selectedItem?.unit ?? "base units"} per ${movementUnitLabel}.`}
                    </p>
                  </div>
                  <AppSelectField
                    value={movementForm.reason}
                    onValueChange={(value) =>
                      updateMovementForm(
                        "reason",
                        value as typeof movementForm.reason,
                      )
                    }
                    disabled={!canPostMovement}
                    ariaLabel="Movement reason"
                    options={[
                      { value: "purchase", label: "Purchase" },
                      { value: "dispense", label: "Dispense" },
                      { value: "damage", label: "Damage" },
                      { value: "expired", label: "Expired" },
                      { value: "return", label: "Return" },
                      { value: "adjustment", label: "Adjustment" },
                      { value: "manual", label: "Manual" },
                    ]}
                  />
                  <input
                    className={fieldClass}
                    value={movementForm.note}
                    onChange={(e) => updateMovementForm("note", e.target.value)}
                    disabled={!canPostMovement}
                    placeholder="Note"
                  />
                  <input
                    className={fieldClass}
                    value={movementForm.referenceType}
                    onChange={(e) =>
                      updateMovementForm("referenceType", e.target.value)
                    }
                    disabled={!canPostMovement}
                    placeholder="Reference type"
                  />
                  <input
                    className={fieldClass}
                    value={movementForm.referenceId}
                    onChange={(e) =>
                      updateMovementForm("referenceId", e.target.value)
                    }
                    disabled={!canPostMovement}
                    placeholder="Reference id"
                  />
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleSubmitMovement}
                    disabled={!canPostMovement}
                    className="ios-button-primary rounded-2xl px-4 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    Post movement
                  </button>
                </div>
              </ViewportPanel>

              <ViewportPanel className="flex min-h-0 flex-col">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
                  Movement History
                </p>
                <ViewportScrollBody className="mt-4">
                  {movementLoadState.status === "loading" ? (
                    <AsyncStatePanel
                      eyebrow="Loading"
                      title="Loading movement history"
                      description="Inventory movements are being synchronized."
                      tone="loading"
                    />
                  ) : movements.length ? (
                    <div className="space-y-2">
                      {movements.map((movement, index) => (
                        <div
                          key={String(movement.id ?? index)}
                          className="rounded-2xl bg-slate-50/85 px-4 py-3 ring-1 ring-slate-100"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-700">
                                {movement.type} - {movement.reason}
                              </p>
                              <p className="text-xs text-slate-500">
                                {movement.referenceType || movement.referenceId
                                  ? `${movement.referenceType || "Ref"} ${movement.referenceId || ""}`
                                  : toString(movement.note, "No note")}
                              </p>
                            </div>
                            <p className="text-lg font-bold text-slate-900">
                              {movement.quantity}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">
                      No movement history yet.
                    </p>
                  )}
                </ViewportScrollBody>
              </ViewportPanel>
            </div>
          ) : null}

          {activeTab === "batches" ? (
            <div className="grid gap-5 xl:grid-cols-[0.92fr_1.08fr]">
              <ViewportPanel>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
                  Batch Management
                </p>
                <h2 className="mt-1 text-xl font-bold text-slate-900">
                  {selectedItem
                    ? selectedItem.name
                    : "Select an inventory item"}
                </h2>
                {selectedItem ? (
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <input
                      className={fieldClass}
                      value={batchForm.batchNo}
                      onChange={(e) =>
                        updateBatchForm("batchNo", e.target.value)
                      }
                      placeholder="Batch no"
                      disabled={!canWriteInventory}
                    />
                    <input
                      className={fieldClass}
                      value={batchForm.quantity}
                      onChange={(e) =>
                        updateBatchForm(
                          "quantity",
                          e.target.value.replace(/[^0-9]/g, ""),
                        )
                      }
                      placeholder="Quantity"
                      disabled={!canWriteInventory}
                    />
                    <input
                      className={fieldClass}
                      value={batchForm.expiryDate}
                      onChange={(e) =>
                        updateBatchForm("expiryDate", e.target.value)
                      }
                      type="date"
                      disabled={!canWriteInventory}
                    />
                    <input
                      className={fieldClass}
                      value={batchForm.supplierName}
                      onChange={(e) =>
                        updateBatchForm("supplierName", e.target.value)
                      }
                      placeholder="Supplier"
                      disabled={!canWriteInventory}
                    />
                    <input
                      className={fieldClass}
                      value={batchForm.storageLocation}
                      onChange={(e) =>
                        updateBatchForm("storageLocation", e.target.value)
                      }
                      placeholder="Storage location"
                      disabled={!canWriteInventory}
                    />
                    <input
                      className={fieldClass}
                      value={batchForm.note}
                      onChange={(e) => updateBatchForm("note", e.target.value)}
                      placeholder="Note"
                      disabled={!canWriteInventory}
                    />
                    <button
                      type="button"
                      onClick={() => void handleCreateBatch()}
                      disabled={
                        !canWriteInventory || createState.status === "pending"
                      }
                      className="ios-button-primary rounded-2xl px-4 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-70 md:col-span-2"
                    >
                      Add Batch
                    </button>
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-slate-500">
                    Pick an item from the inventory tab to manage batches.
                  </p>
                )}
              </ViewportPanel>

              <ViewportPanel className="flex min-h-0 flex-col">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
                  Batch List
                </p>
                <ViewportScrollBody className="mt-4">
                  {batches.length ? (
                    <div className="space-y-2">
                      {batches.map((batch, index) => (
                        <div
                          key={String(batch.id ?? `${batch.batchNo}-${index}`)}
                          className="rounded-2xl bg-slate-50/85 px-4 py-3 ring-1 ring-slate-100"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-semibold text-slate-900">
                                {batch.batchNo}
                              </p>
                              <p className="text-xs text-slate-500">
                                Qty {batch.quantity} | Expiry{" "}
                                {batch.expiryDate || "Not set"}
                              </p>
                              <p className="mt-1 text-xs text-slate-500">
                                {batch.supplierName || "No supplier"} |{" "}
                                {batch.storageLocation || "No location"}
                              </p>
                            </div>
                            <span
                              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${badgeClass(batch.status === "expired" ? "rose" : batch.daysUntilExpiry !== null && batch.daysUntilExpiry <= 30 ? "amber" : "emerald")}`}
                            >
                              {batch.status || "active"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">
                      No batches added yet.
                    </p>
                  )}
                </ViewportScrollBody>
              </ViewportPanel>
            </div>
          ) : null}

          {activeTab === "alerts" ? (
            <div className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <MetricCard
                  label="Low Stock"
                  value={alertSummary.lowStockCount}
                  tone="amber"
                />
                <MetricCard
                  label="Stockout Risk"
                  value={alertSummary.stockoutRiskCount}
                  tone="rose"
                />
                <MetricCard
                  label="Fast Moving"
                  value={alertSummary.fastMovingCount}
                  tone="sky"
                />
                <MetricCard
                  label="Recommended Reorders"
                  value={alertSummary.recommendedReorderCount}
                  tone="emerald"
                />
              </div>
              <div className="grid gap-5 xl:grid-cols-2">
                <ViewportPanel>
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
                    Stockout Risk Items
                  </p>
                  <div className="mt-4 space-y-2">
                    {stockoutRiskItems.slice(0, 8).map((item) => (
                      <div
                        key={String(item.id ?? item.name)}
                        className="flex items-center justify-between rounded-2xl bg-slate-50/85 px-4 py-3 ring-1 ring-slate-100"
                      >
                        <div>
                          <p className="font-semibold text-slate-900">
                            {item.name}
                          </p>
                          <p className="text-xs text-slate-500">
                            Current stock {item.stock} - min stock{" "}
                            {item.reorderLevel}
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${badgeClass("rose")}`}
                        >
                          Risk
                        </span>
                      </div>
                    ))}
                  </div>
                </ViewportPanel>
                <ViewportPanel>
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
                    Recommended Reorder Quantities
                  </p>
                  <div className="mt-4 space-y-2">
                    {recommendedReorders.slice(0, 8).map((row, index) => (
                      <div
                        key={`${row.itemName}-${index}`}
                        className="flex items-center justify-between rounded-2xl bg-slate-50/85 px-4 py-3 ring-1 ring-slate-100"
                      >
                        <div>
                          <p className="font-semibold text-slate-900">
                            {row.itemName}
                          </p>
                          <p className="text-xs text-slate-500">
                            {row.currentStock} on hand -{" "}
                            {row.projectedDaysRemaining} days left
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${badgeClass("emerald")}`}
                        >
                          {row.recommendedReorderQty}
                        </span>
                      </div>
                    ))}
                  </div>
                </ViewportPanel>
              </div>
            </div>
          ) : null}

          {activeTab === "reports" ? (
            <div className="space-y-5">
              <ViewportPanel>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
                      Reports Workspace
                    </p>
                    <h2 className="mt-1 text-xl font-bold text-slate-900">
                      Role-based operational reports
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Open one focused report at a time and let the backend summaries do the heavy work.
                    </p>
                  </div>
                  <div className="grid min-w-[260px] gap-2 sm:grid-cols-2">
                    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
                        Generated
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">
                        {reportShell.generatedAt || "--"}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
                        Role
                      </p>
                      <p className="mt-1 text-sm font-semibold capitalize text-slate-900">
                        {reportRole}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <FormField label="Range">
                    <AppSelectField
                      value={reportsRange}
                      onValueChange={(value) => setReportsRange(value as "7d" | "30d" | "custom")}
                      ariaLabel="Reports range"
                      options={[
                        { value: "7d", label: "Last 7 days" },
                        { value: "30d", label: "Last 30 days" },
                        { value: "custom", label: "Custom range" },
                      ]}
                    />
                  </FormField>
                  {reportsRange === "custom" ? (
                    <>
                      <FormField label="Date from">
                        <input
                          className={fieldClass}
                          type="date"
                          value={reportsDateFrom}
                          onChange={(event) => setReportsDateFrom(event.target.value)}
                        />
                      </FormField>
                      <FormField label="Date to">
                        <input
                          className={fieldClass}
                          type="date"
                          value={reportsDateTo}
                          onChange={(event) => setReportsDateTo(event.target.value)}
                        />
                      </FormField>
                    </>
                  ) : null}
                  {reportRole === "owner" ? (
                    <>
                      <FormField label="Doctor filter" optional>
                        <AppSelectField
                          value={reportsDoctorId}
                          onValueChange={setReportsDoctorId}
                          ariaLabel="Doctor reports filter"
                          options={[
                            { value: "", label: "All doctors" },
                            ...doctorOptions.map((doctor) => ({
                              value: String(doctor.id),
                              label: doctor.name,
                            })),
                          ]}
                        />
                      </FormField>
                      <FormField label="Assistant filter" optional>
                        <AppSelectField
                          value={reportsAssistantId}
                          onValueChange={setReportsAssistantId}
                          ariaLabel="Assistant reports filter"
                          options={[
                            { value: "", label: "All assistants" },
                            ...assistantOptions.map((assistant) => ({
                              value: String(assistant.id),
                              label: assistant.name,
                            })),
                          ]}
                        />
                      </FormField>
                    </>
                  ) : null}
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {reportViewOptions.map((option) => (
                    <button
                      key={option.key}
                      type="button"
                      onClick={() => setActiveReportView(option.key)}
                      className={
                        activeReportView === option.key
                          ? "rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white"
                          : "rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700"
                      }
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </ViewportPanel>

              {activeReportView === "clinic-overview" ? (
                <div className="space-y-5">
                  <ReportMetricGrid summary={reportShell.summary} emptyMessage="No clinic overview summary returned yet." />
                  <div className="grid gap-5 xl:grid-cols-2">
                    <ReportListPanel
                      title="Appointment Status Distribution"
                      rows={asReportArray(reportShell.charts.appointmentStatusDistribution)}
                      labelKeys={["label", "status", "name"]}
                      valueKeys={["count", "value"]}
                      emptyMessage="No appointment status chart returned yet."
                    />
                    <ReportTablePanel
                      title="Recent Appointments"
                      rows={asReportArray(reportShell.tables.recentAppointments)}
                      emptyMessage="No recent appointments returned yet."
                    />
                  </div>
                </div>
              ) : null}

              {activeReportView === "doctor-performance" ? (
                <div className="space-y-5">
                  <ReportMetricGrid summary={reportShell.summary} emptyMessage="No doctor performance summary returned yet." />
                  <div className="grid gap-5 xl:grid-cols-2">
                    <ReportListPanel
                      title="Encounters By Doctor"
                      rows={asReportArray(reportShell.charts.encountersByDoctor)}
                      labelKeys={["label", "doctorName", "name"]}
                      valueKeys={["count", "value", "encounters"]}
                      emptyMessage="No doctor chart returned yet."
                    />
                    <ReportTablePanel
                      title="Doctors"
                      rows={asReportArray(reportShell.tables.doctors)}
                      emptyMessage="No doctor table returned yet."
                    />
                  </div>
                </div>
              ) : null}

              {activeReportView === "assistant-performance" ? (
                <div className="space-y-5">
                  <ReportMetricGrid summary={reportShell.summary} emptyMessage="No assistant performance summary returned yet." />
                  <div className="grid gap-5 xl:grid-cols-2">
                    <ReportListPanel
                      title="Throughput By Assistant"
                      rows={asReportArray(reportShell.charts.throughputByAssistant)}
                      labelKeys={["label", "assistantName", "name"]}
                      valueKeys={["count", "value", "throughput"]}
                      emptyMessage="No assistant throughput chart returned yet."
                    />
                    <ReportTablePanel
                      title="Assistants"
                      rows={asReportArray(reportShell.tables.assistants)}
                      emptyMessage="No assistant table returned yet."
                    />
                  </div>
                </div>
              ) : null}

              {activeReportView === "inventory-usage" ? (
                <div className="space-y-5">
                  <ReportMetricGrid summary={reportShell.summary} emptyMessage="No inventory usage summary returned yet." />
                  <div className="grid gap-5 xl:grid-cols-3">
                    <ReportListPanel
                      title="Top Consumed Items"
                      rows={asReportArray(reportShell.charts.topConsumedItems).length ? asReportArray(reportShell.charts.topConsumedItems) : reportSections.fastMoving}
                      labelKeys={["label", "name", "itemName"]}
                      valueKeys={["count", "value", "averageDailyUsage", "currentStock"]}
                      emptyMessage="No top consumed items returned yet."
                    />
                    <ReportTablePanel
                      title="Low Stock Items"
                      rows={asReportArray(reportShell.tables.lowStockItems).length ? asReportArray(reportShell.tables.lowStockItems) : reportSections.deadStock}
                      emptyMessage="No low stock table returned yet."
                    />
                    <ReportTablePanel
                      title="Consumed Inventory"
                      rows={asReportArray(reportShell.tables.topConsumedItems).length ? asReportArray(reportShell.tables.topConsumedItems) : reportSections.fastMoving}
                      emptyMessage="No top consumed inventory table returned yet."
                    />
                  </div>
                </div>
              ) : null}

              {activeReportView === "patient-followup" ? (
                <div className="space-y-5">
                  <ReportMetricGrid summary={reportShell.summary} emptyMessage="No follow-up summary returned yet." />
                  <div className="grid gap-5 xl:grid-cols-3">
                    <ReportListPanel
                      title="Follow-up Buckets"
                      rows={asReportArray(reportShell.charts.followupBuckets)}
                      labelKeys={["label", "bucket", "name"]}
                      valueKeys={["count", "value"]}
                      emptyMessage="No follow-up bucket chart returned yet."
                    />
                    <ReportTablePanel
                      title="Overdue"
                      rows={asReportArray(reportShell.tables.overdue)}
                      emptyMessage="No overdue rows returned yet."
                    />
                    <ReportTablePanel
                      title="Due Soon"
                      rows={asReportArray(reportShell.tables.dueSoon)}
                      emptyMessage="No due-soon rows returned yet."
                    />
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
        </ViewportBody>
      </ViewportFrame>
      <InventoryItemModal
        open={isItemModalOpen}
        isEditingItem={isEditingItem}
        canWriteInventory={canWriteInventory}
        createState={createState}
        duplicateItem={duplicateItem}
        itemForm={itemForm}
        updateItemForm={updateItemForm}
        onClose={() => setIsItemModalOpen(false)}
        onReset={openCreateModal}
        onSave={handleSaveItem}
        onUseExisting={openEditModal}
      />
      <StockActionModal
        open={isStockActionModalOpen}
        item={selectedItem}
        mode={stockActionMode}
        quantity={movementForm.quantity}
        unitLabel={movementUnitLabel}
        unitSize={movementUnitSize}
        disabled={!canPostMovement || movementState.status === "pending"}
        onClose={() => setIsStockActionModalOpen(false)}
        onQuantityChange={(value) => updateMovementForm("quantity", value)}
        onSubmit={() => {
          void handleStockActionSubmit();
        }}
      />
    </ViewportPage>
  );
}
