import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  adjustInventoryStock,
  createInventoryItem,
  createInventoryBatch,
  createInventoryMovement,
  type InventoryAlertsResponse,
  type InventoryAdjustStockPayload,
  type InventoryBatchCreatePayload,
  type InventoryCategory,
  type InventoryCreatePayload,
  type InventoryItem,
  type InventoryMovementPayload,
  type InventoryMovementType,
  type PrescriptionType,
  type StockStatus,
  updateInventoryItem,
  type ApiClientError,
} from "../../../lib/api-client";
import { hasPermission } from "../../../lib/authorization";
import {
  emptyLoadState,
  errorLoadState,
  errorMutationState,
  getMutationFeedback,
  idleLoadState,
  idleMutationState,
  loadingLoadState,
  pendingMutationState,
  readyLoadState,
  successMutationState,
  type LoadState,
  type MutationState,
} from "../../../lib/async-state";
import {
  useCurrentUserQuery,
  useInventoryAlertsQuery,
  useInventoryBatchesQuery,
  useInventoryDetailQuery,
  useInventoryMovementsQuery,
  useInventoryQuery,
  useInventoryReportsQuery,
} from "../../../lib/query-hooks";
import { queryKeys } from "../../../lib/query-keys";

type AnyRecord = Record<string, unknown>;

export type InventoryTab = "overview" | "inventory" | "detail" | "movements" | "batches" | "alerts" | "reports";

export type InventoryFormState = {
  sku: string;
  name: string;
  genericName: string;
  category: InventoryCategory;
  subcategory: string;
  description: string;
  dosageForm: string;
  strength: string;
  unit: string;
  route: string;
  prescriptionType: PrescriptionType | "";
  dispenseUnit: string;
  dispenseUnitSize: string;
  purchaseUnit: string;
  purchaseUnitSize: string;
  brandName: string;
  supplierName: string;
  leadTimeDays: string;
  stock: string;
  reorderLevel: string;
  minStockLevel: string;
  maxStockLevel: string;
  expiryDate: string;
  batchNo: string;
  storageLocation: string;
  directDispenseAllowed: boolean;
  isAntibiotic: boolean;
  isControlled: boolean;
  isPediatricSafe: boolean;
  requiresPrescription: boolean;
  clinicUseOnly: boolean;
  notes: string;
  isActive: boolean;
};

export type MovementFormState = {
  type: InventoryMovementType;
  quantity: string;
  reason: "purchase" | "dispense" | "damage" | "expired" | "return" | "adjustment" | "manual";
  note: string;
  referenceType: string;
  referenceId: string;
};

export type InventoryItemView = {
  id: number | null;
  sku: string;
  name: string;
  genericName: string;
  category: InventoryCategory;
  subcategory: string;
  description: string;
  dosageForm: string;
  strength: string;
  unit: string;
  route: string;
  prescriptionType: PrescriptionType | "";
  dispenseUnit: string;
  dispenseUnitSize: number;
  purchaseUnit: string;
  purchaseUnitSize: number;
  brandName: string;
  supplierName: string;
  leadTimeDays: number;
  stock: number;
  reorderLevel: number;
  minStockLevel: number | null;
  maxStockLevel: number | null;
  expiryDate: string;
  batchNo: string;
  storageLocation: string;
  directDispenseAllowed: boolean;
  isAntibiotic: boolean;
  isControlled: boolean;
  isPediatricSafe: boolean;
  requiresPrescription: boolean;
  clinicUseOnly: boolean;
  notes: string;
  stockStatus: StockStatus;
  stockSummary: {
    currentStock: number;
    minimumStock: number;
    shortBy: number;
    purchasePackEquivalent: string;
    dispensePackEquivalent: string;
  };
  isActive: boolean;
  lowStock: boolean;
  stockoutRisk: boolean;
  expiryRisk: boolean;
};

export type InventoryMovementView = {
  id: number | null;
  type: string;
  quantity: number;
  reason: string;
  note: string;
  referenceType: string;
  referenceId: string;
  createdAt: string;
};

export type InventoryBatchFormState = {
  batchNo: string;
  quantity: string;
  expiryDate: string;
  supplierName: string;
  storageLocation: string;
  note: string;
};

export type InventoryBatchView = {
  id: number | null;
  batchNo: string;
  quantity: number;
  expiryDate: string;
  supplierName: string;
  storageLocation: string;
  status: string;
  daysUntilExpiry: number | null;
  note: string;
};

const EMPTY_FORM: InventoryFormState = {
  sku: "",
  name: "",
  genericName: "",
  category: "medicine",
  subcategory: "",
  description: "",
  dosageForm: "",
  strength: "",
  unit: "tablet",
  route: "",
  prescriptionType: "",
  dispenseUnit: "card",
  dispenseUnitSize: "1",
  purchaseUnit: "box",
  purchaseUnitSize: "1",
  brandName: "",
  supplierName: "",
  leadTimeDays: "7",
  stock: "0",
  reorderLevel: "0",
  minStockLevel: "",
  maxStockLevel: "",
  expiryDate: "",
  batchNo: "",
  storageLocation: "",
  directDispenseAllowed: false,
  isAntibiotic: false,
  isControlled: false,
  isPediatricSafe: false,
  requiresPrescription: false,
  clinicUseOnly: false,
  notes: "",
  isActive: true,
};

const EMPTY_MOVEMENT_FORM: MovementFormState = {
  type: "in",
  quantity: "1",
  reason: "purchase",
  note: "",
  referenceType: "",
  referenceId: "",
};

const EMPTY_BATCH_FORM: InventoryBatchFormState = {
  batchNo: "",
  quantity: "1",
  expiryDate: "",
  supplierName: "",
  storageLocation: "",
  note: "",
};

function asRecord(value: unknown): AnyRecord | null {
  return value && typeof value === "object" ? (value as AnyRecord) : null;
}

function asArray(value: unknown): AnyRecord[] {
  if (Array.isArray(value)) {
    return value.map((entry) => asRecord(entry)).filter((entry): entry is AnyRecord => !!entry);
  }
  const record = asRecord(value);
  if (!record) return [];
  for (const candidate of [record.data, record.items, record.rows, record.results]) {
    if (Array.isArray(candidate)) {
      return candidate.map((entry) => asRecord(entry)).filter((entry): entry is AnyRecord => !!entry);
    }
  }
  return [];
}

function getNested(value: unknown, ...keys: string[]) {
  let current: unknown = value;
  for (const key of keys) {
    const record = asRecord(current);
    if (!record) return undefined;
    current = record[key];
  }
  return current;
}

function getRecordArrayAtPaths(value: unknown, paths: string[][]) {
  for (const path of paths) {
    const candidate = path.length ? getNested(value, ...path) : value;
    const rows = asArray(candidate);
    if (rows.length) return rows;
  }
  return [] as AnyRecord[];
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() && !Number.isNaN(Number(value))) return Number(value);
  return null;
}

export function toString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function toBoolean(value: unknown, fallback = true) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    if (value.toLowerCase() === "true") return true;
    if (value.toLowerCase() === "false") return false;
  }
  return fallback;
}

function getText(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function getNullableNumber(value: unknown) {
  return toNumber(value);
}

function normalizeItem(row: AnyRecord): InventoryItemView {
  const stockSummaryRecord = asRecord(row.stockSummary ?? row.stock_summary);
  const stock =
    toNumber(
      stockSummaryRecord?.currentStock ??
        row.stock ??
        row.quantity ??
        row.currentStock ??
        row.current_stock ??
        row.available
    ) ?? 0;
  const reorderLevel =
    toNumber(
      stockSummaryRecord?.minimumStock ?? row.reorderLevel ?? row.reorder_level
    ) ?? 0;
  const leadTimeDays = toNumber(row.leadTimeDays ?? row.lead_time_days) ?? 0;
  const dispenseUnitSize =
    toNumber(row.dispenseUnitSize ?? row.dispense_unit_size ?? row.packageSize ?? row.package_size) ?? 1;
  const purchaseUnitSize =
    toNumber(row.purchaseUnitSize ?? row.purchase_unit_size ?? row.packageSize ?? row.package_size) ?? 1;
  const stockStatus = getText(row.stockStatus ?? row.stock_status, "") as StockStatus;
  const lowStock = toBoolean(
    row.lowStock ??
      row.low_stock ??
      row.isLowStock ??
      (stockStatus ? stockStatus === "low_stock" : reorderLevel > 0 ? stock <= reorderLevel : false),
    stockStatus ? stockStatus === "low_stock" : reorderLevel > 0 ? stock <= reorderLevel : false
  );
  const stockoutRisk = toBoolean(
    row.stockoutRisk ??
      row.stockout_risk ??
      row.isStockoutRisk ??
      (stockStatus ? stockStatus === "out_of_stock" : leadTimeDays > 0 && reorderLevel > 0 ? stock <= reorderLevel * 1.5 : lowStock),
    stockStatus ? stockStatus === "out_of_stock" : leadTimeDays > 0 && reorderLevel > 0 ? stock <= reorderLevel * 1.5 : lowStock
  );
  const expiryRisk = toBoolean(
    row.expiryRisk ?? row.expiry_risk ?? (stockStatus ? stockStatus === "near_expiry" || stockStatus === "expired" : false),
    stockStatus ? stockStatus === "near_expiry" || stockStatus === "expired" : false
  );

  return {
    id: toNumber(row.id ?? row.inventoryId ?? row.inventory_id),
    sku: toString(row.sku, "N/A"),
    name: toString(row.name ?? row.itemName, "Unnamed item"),
    genericName: toString(row.genericName ?? row.generic_name, ""),
    category: (toString(row.category, "other") as InventoryCategory),
    subcategory: toString(row.subcategory, ""),
    description: toString(row.description, ""),
    dosageForm: toString(row.dosageForm ?? row.dosage_form, ""),
    strength: toString(row.strength, ""),
    unit: toString(row.unit, "unit"),
    route: toString(row.route, ""),
    prescriptionType: ((row.prescriptionType ?? row.prescription_type ?? "") as PrescriptionType | "") || "",
    dispenseUnit: toString(row.dispenseUnit ?? row.dispense_unit ?? row.packageUnit ?? row.package_unit, "unit"),
    dispenseUnitSize,
    purchaseUnit: toString(row.purchaseUnit ?? row.purchase_unit ?? row.packageUnit ?? row.package_unit, "pack"),
    purchaseUnitSize,
    brandName: toString(row.brandName ?? row.brand_name, "N/A"),
    supplierName: toString(row.supplierName ?? row.supplier_name, "N/A"),
    leadTimeDays,
    stock,
    reorderLevel,
    minStockLevel: getNullableNumber(row.minStockLevel ?? row.min_stock_level),
    maxStockLevel: getNullableNumber(row.maxStockLevel ?? row.max_stock_level),
    expiryDate: toString(row.expiryDate ?? row.expiry_date, ""),
    batchNo: toString(row.batchNo ?? row.batch_no, ""),
    storageLocation: toString(row.storageLocation ?? row.storage_location, ""),
    directDispenseAllowed: toBoolean(row.directDispenseAllowed ?? row.direct_dispense_allowed, false),
    isAntibiotic: toBoolean(row.isAntibiotic ?? row.is_antibiotic, false),
    isControlled: toBoolean(row.isControlled ?? row.is_controlled, false),
    isPediatricSafe: toBoolean(row.isPediatricSafe ?? row.is_pediatric_safe, false),
    requiresPrescription: toBoolean(row.requiresPrescription ?? row.requires_prescription, false),
    clinicUseOnly: toBoolean(row.clinicUseOnly ?? row.clinic_use_only, false),
    notes: toString(row.notes, ""),
    stockStatus: stockStatus || (stock <= 0 ? "out_of_stock" : lowStock ? "low_stock" : "in_stock"),
    stockSummary: {
      currentStock: stock,
      minimumStock: reorderLevel,
      shortBy:
        toNumber(stockSummaryRecord?.shortBy ?? stockSummaryRecord?.short_by) ??
        Math.max(0, reorderLevel - stock),
      purchasePackEquivalent: toString(
        stockSummaryRecord?.purchasePackEquivalent ?? stockSummaryRecord?.purchase_pack_equivalent,
        ""
      ),
      dispensePackEquivalent: toString(
        stockSummaryRecord?.dispensePackEquivalent ?? stockSummaryRecord?.dispense_pack_equivalent,
        ""
      ),
    },
    isActive: toBoolean(row.isActive ?? row.is_active, true),
    lowStock,
    stockoutRisk,
    expiryRisk,
  };
}

function normalizeMovement(row: AnyRecord): InventoryMovementView {
  return {
    id: toNumber(row.id ?? row.movementId ?? row.movement_id),
    type: toString(row.type ?? row.movementType, "movement"),
    quantity: toNumber(row.quantity) ?? 0,
    reason: toString(row.reason, "manual"),
    note: toString(row.note, ""),
    referenceType: toString(row.referenceType ?? row.reference_type, ""),
    referenceId: toString(row.referenceId ?? row.reference_id, ""),
    createdAt: toString(row.createdAt ?? row.created_at ?? row.timestamp, ""),
  };
}

function normalizeBatch(row: AnyRecord): InventoryBatchView {
  return {
    id: toNumber(row.id ?? row.batchId ?? row.batch_id),
    batchNo: toString(row.batchNo ?? row.batch_no, "No batch"),
    quantity: toNumber(row.quantity) ?? 0,
    expiryDate: toString(row.expiryDate ?? row.expiry_date, ""),
    supplierName: toString(row.supplierName ?? row.supplier_name, ""),
    storageLocation: toString(row.storageLocation ?? row.storage_location, ""),
    status: toString(row.status, ""),
    daysUntilExpiry: toNumber(row.daysUntilExpiry ?? row.days_until_expiry),
    note: toString(row.note, ""),
  };
}

function toFormState(item?: InventoryItemView | null): InventoryFormState {
  if (!item) return EMPTY_FORM;

  return {
    sku: item.sku === "N/A" ? "" : item.sku,
    name: item.name,
    genericName: item.genericName,
    category: (["medicine", "consumable", "equipment", "other"].includes(item.category)
      ? item.category
      : "other") as InventoryFormState["category"],
    subcategory: item.subcategory,
    description: item.description,
    dosageForm: item.dosageForm,
    strength: item.strength,
    unit: item.unit,
    route: item.route,
    prescriptionType: item.prescriptionType,
    dispenseUnit: item.dispenseUnit,
    dispenseUnitSize: String(item.dispenseUnitSize || 1),
    purchaseUnit: item.purchaseUnit,
    purchaseUnitSize: String(item.purchaseUnitSize || 1),
    brandName: item.brandName === "N/A" ? "" : item.brandName,
    supplierName: item.supplierName === "N/A" ? "" : item.supplierName,
    leadTimeDays: String(item.leadTimeDays || 0),
    stock: String(item.stock || 0),
    reorderLevel: String(item.reorderLevel || 0),
    minStockLevel: item.minStockLevel === null ? "" : String(item.minStockLevel),
    maxStockLevel: item.maxStockLevel === null ? "" : String(item.maxStockLevel),
    expiryDate: item.expiryDate,
    batchNo: item.batchNo,
    storageLocation: item.storageLocation,
    directDispenseAllowed: item.directDispenseAllowed,
    isAntibiotic: item.isAntibiotic,
    isControlled: item.isControlled,
    isPediatricSafe: item.isPediatricSafe,
    requiresPrescription: item.requiresPrescription,
    clinicUseOnly: item.clinicUseOnly,
    notes: item.notes,
    isActive: item.isActive,
  };
}

function formatApiError(error: unknown, fallback: string) {
  return ((error as ApiClientError | undefined)?.message ?? fallback);
}

function toNullableText(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function toNullableNumber(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const numeric = Number(trimmed);
  return Number.isFinite(numeric) ? numeric : null;
}

function normalizeComparableText(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function sanitizeUnitSize(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : 1;
}

export function useInventoryBoard() {
  const queryClient = useQueryClient();
  const currentUserQuery = useCurrentUserQuery();
  const inventoryQuery = useInventoryQuery();
  const [activeTab, setActiveTab] = useState<InventoryTab>("overview");
  const [selectedItemId, setSelectedItemIdState] = useState<number | null>(null);
  const [itemForm, setItemForm] = useState<InventoryFormState>(EMPTY_FORM);
  const [movementForm, setMovementForm] = useState<MovementFormState>(EMPTY_MOVEMENT_FORM);
  const [batchForm, setBatchForm] = useState<InventoryBatchFormState>(EMPTY_BATCH_FORM);
  const [isEditingItem, setIsEditingItem] = useState(false);
  const [inventorySearch, setInventorySearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [alertDays, setAlertDays] = useState(30);
  const [createState, setCreateState] = useState<MutationState>(idleMutationState());
  const [movementState, setMovementState] = useState<MutationState>(idleMutationState());
  const [movementNotice, setMovementNotice] = useState<string | null>(null);

  const items = useMemo(
    () => asArray(inventoryQuery.data).map(normalizeItem),
    [inventoryQuery.data]
  );

  const resolvedSelectedItemId = useMemo(() => {
    if (!items.length) return null;
    if (selectedItemId !== null && items.some((item) => item.id === selectedItemId)) {
      return selectedItemId;
    }
    return items[0].id;
  }, [items, selectedItemId]);

  const alertsQuery = useInventoryAlertsQuery(alertDays);
  const reportsQuery = useInventoryReportsQuery(alertDays);
  const detailQuery = useInventoryDetailQuery(
    resolvedSelectedItemId ?? "none",
    resolvedSelectedItemId !== null
  );
  const movementQuery = useInventoryMovementsQuery(
    resolvedSelectedItemId ?? "none",
    resolvedSelectedItemId !== null
  );
  const batchesQuery = useInventoryBatchesQuery(
    resolvedSelectedItemId ?? "none",
    resolvedSelectedItemId !== null
  );

  const movements = useMemo(
    () => asArray(movementQuery.data).map(normalizeMovement),
    [movementQuery.data]
  );
  const batches = useMemo(
    () => asArray(batchesQuery.data).map(normalizeBatch),
    [batchesQuery.data]
  );

  const selectedItem = useMemo(
    () => items.find((item) => item.id === resolvedSelectedItemId) ?? null,
    [items, resolvedSelectedItemId]
  );
  const movementUnitType = useMemo(() => {
    if (movementForm.type === "in") return "purchase";
    if (movementForm.type === "out") return "dispense";
    return "base";
  }, [movementForm.type]);
  const movementUnitLabel = useMemo(() => {
    if (!selectedItem) return "unit";
    if (movementUnitType === "purchase") return selectedItem.purchaseUnit || selectedItem.unit;
    if (movementUnitType === "dispense") return selectedItem.dispenseUnit || selectedItem.unit;
    return selectedItem.unit;
  }, [movementUnitType, selectedItem]);
  const movementUnitSize = useMemo(() => {
    if (!selectedItem) return 1;
    if (movementUnitType === "purchase") return sanitizeUnitSize(selectedItem.purchaseUnitSize);
    if (movementUnitType === "dispense") return sanitizeUnitSize(selectedItem.dispenseUnitSize);
    return 1;
  }, [movementUnitType, selectedItem]);

  const canWriteInventory =
    !!currentUserQuery.data && hasPermission(currentUserQuery.data, "inventory.write");
  const writeDisabledReason =
    currentUserQuery.isPending || currentUserQuery.isFetching
      ? "Checking inventory write access."
      : currentUserQuery.data && !canWriteInventory
        ? "Inventory write permission is required before changing stock."
        : null;
  const canPostMovement = canWriteInventory && resolvedSelectedItemId !== null;
  const movementActionDisabledReason =
    !canWriteInventory
      ? writeDisabledReason
      : resolvedSelectedItemId === null
        ? "Select or create an inventory item before posting stock movements."
        : null;

  const filteredItems = useMemo(() => {
    const search = inventorySearch.trim().toLowerCase();
    return items.filter((item) => {
      const matchesSearch =
        !search ||
        item.name.toLowerCase().includes(search) ||
        item.sku.toLowerCase().includes(search) ||
        item.brandName.toLowerCase().includes(search) ||
        item.supplierName.toLowerCase().includes(search);
      const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" ? item.isActive : !item.isActive);
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [items, inventorySearch, categoryFilter, statusFilter]);

  const loadState: LoadState = useMemo(() => {
    if ((inventoryQuery.isPending || inventoryQuery.isFetching) && !items.length) {
      return loadingLoadState();
    }
    if (inventoryQuery.isError) {
      return errorLoadState(formatApiError(inventoryQuery.error, "Unable to load inventory."));
    }
    return items.length ? readyLoadState() : emptyLoadState();
  }, [inventoryQuery.error, inventoryQuery.isError, inventoryQuery.isFetching, inventoryQuery.isPending, items.length]);

  const movementLoadState: LoadState = useMemo(() => {
    if (!resolvedSelectedItemId) return idleLoadState();
    if ((movementQuery.isPending || movementQuery.isFetching) && !movements.length) {
      return loadingLoadState();
    }
    if (movementQuery.isError) {
      return errorLoadState(
        formatApiError(movementQuery.error, "Movement history could not be loaded for the selected item.")
      );
    }
    return readyLoadState(movementNotice);
  }, [
    movementNotice,
    movementQuery.error,
    movementQuery.isError,
    movementQuery.isFetching,
    movementQuery.isPending,
    movements.length,
    resolvedSelectedItemId,
  ]);

  const alertsLoadState: LoadState = useMemo(() => {
    const hasPayload = !!alertsQuery.data;
    if ((alertsQuery.isPending || alertsQuery.isFetching) && !hasPayload) {
      return loadingLoadState();
    }
    if (alertsQuery.isError) {
      return errorLoadState(
        formatApiError(alertsQuery.error, "Inventory alerts could not be loaded.")
      );
    }
    return readyLoadState();
  }, [alertsQuery.data, alertsQuery.error, alertsQuery.isError, alertsQuery.isFetching, alertsQuery.isPending]);

  const alertsWarningMessage = useMemo(() => {
    if (!alertsQuery.isError) return null;
    return formatApiError(
      alertsQuery.error,
      "Inventory alerts are temporarily unavailable. Showing stock data without alert recommendations."
    );
  }, [alertsQuery.error, alertsQuery.isError]);

  const alertsPayload = alertsQuery.data;
  const lowStockItems = useMemo(() => {
    const fromAlerts = getRecordArrayAtPaths(alertsPayload, [
      ["lowStockItems"],
      ["lowStock"],
      ["alerts", "lowStockItems"],
    ]).map(normalizeItem);
    return fromAlerts.length ? fromAlerts : items.filter((item) => item.lowStock);
  }, [alertsPayload, items]);

  const stockoutRiskItems = useMemo(() => {
    const fromAlerts = getRecordArrayAtPaths(alertsPayload, [
      ["stockoutRiskItems"],
      ["stockoutRisk"],
      ["alerts", "stockoutRiskItems"],
    ]).map(normalizeItem);
    return fromAlerts.length ? fromAlerts : items.filter((item) => item.stockoutRisk);
  }, [alertsPayload, items]);

  const topMovingItems = useMemo(() => {
    return getRecordArrayAtPaths(alertsPayload, [
      ["topMovingItems"],
      ["fastMovingItems"],
      ["alerts", "topMovingItems"],
    ]).map(normalizeItem);
  }, [alertsPayload]);

  const recommendedReorders = useMemo(() => {
    const rows = getRecordArrayAtPaths(alertsPayload, [
      ["recommendedReorders"],
      ["recommendedReorderList"],
      ["alerts", "recommendedReorders"],
    ]);
    return rows.map((row) => ({
      itemName: toString(row.name ?? row.itemName, "Unnamed item"),
      currentStock: toNumber(row.currentStock ?? row.stock) ?? 0,
      reorderLevel: toNumber(row.reorderLevel ?? row.reorder_level) ?? 0,
      averageDailyUsage: toNumber(row.averageDailyUsage ?? row.avgDailyUsage ?? row.average_daily_usage) ?? 0,
      projectedDaysRemaining: toNumber(row.projectedDaysRemaining ?? row.projected_days_remaining) ?? 0,
      recommendedReorderQty: toNumber(row.recommendedReorderQty ?? row.recommended_reorder_qty ?? row.recommendedQty) ?? 0,
      suggestedPurchasePacks: toString(
        row.suggestedPurchasePacks ?? row.suggested_purchase_packs,
        ""
      ),
      suggestedDispensePacks: toString(
        row.suggestedDispensePacks ?? row.suggested_dispense_packs,
        ""
      ),
    }));
  }, [alertsPayload]);

  const alertSummary = useMemo(() => {
    const summary = asRecord(getNested(alertsPayload, "summary")) ?? asRecord(alertsPayload);
    const lowStockCount =
      toNumber(summary?.lowStockCount ?? summary?.low_stock_count) ?? lowStockItems.length;
    const stockoutRiskCount =
      toNumber(summary?.stockoutRiskCount ?? summary?.stockout_risk_count) ?? stockoutRiskItems.length;
    const fastMovingCount =
      toNumber(summary?.fastMovingItemCount ?? summary?.fast_moving_item_count) ?? topMovingItems.length;
    const recommendedReorderCount =
      toNumber(summary?.recommendedReorderCount ?? summary?.recommended_reorder_count) ??
      recommendedReorders.length;
    return { lowStockCount, stockoutRiskCount, fastMovingCount, recommendedReorderCount };
  }, [alertsPayload, lowStockItems.length, recommendedReorders.length, stockoutRiskItems.length, topMovingItems.length]);

  const inventorySummary = useMemo(() => {
    const activeCount = items.filter((item) => item.isActive).length;
    return {
      totalItems: items.length,
      activeCount,
      inactiveCount: items.length - activeCount,
      totalUnits: items.reduce((sum, item) => sum + item.stockSummary.currentStock, 0),
      lowStockCount: lowStockItems.length,
      stockoutRiskCount: stockoutRiskItems.length,
    };
  }, [items, lowStockItems.length, stockoutRiskItems.length]);

  const detailPayload = detailQuery.data;
  const detailSummary = useMemo(() => {
    const summary = asRecord(
      getNested(detailPayload, "item", "stockSummary") ??
        getNested(detailPayload, "stockSummary")
    );
    const movementSummary = asRecord(getNested(detailPayload, "movementSummary"));
    const batchSummary = asRecord(getNested(detailPayload, "batchSummary"));
    return {
      currentStock:
        toNumber(summary?.currentStock ?? summary?.current_stock) ??
        selectedItem?.stockSummary.currentStock ??
        0,
      minimumStock:
        toNumber(summary?.minimumStock ?? summary?.minimum_stock) ??
        selectedItem?.stockSummary.minimumStock ??
        0,
      shortBy:
        toNumber(summary?.shortageToMinimum ?? summary?.short_by ?? summary?.shortBy) ??
        selectedItem?.stockSummary.shortBy ??
        0,
      purchasePackEquivalent: toString(
        summary?.purchasePackEquivalent ?? summary?.purchase_pack_equivalent,
        selectedItem?.stockSummary.purchasePackEquivalent ?? ""
      ),
      dispensePackEquivalent: toString(
        summary?.dispensePackEquivalent ?? summary?.dispense_pack_equivalent,
        selectedItem?.stockSummary.dispensePackEquivalent ?? ""
      ),
      totalMovementCount: toNumber(movementSummary?.totalMovementCount ?? movementSummary?.count) ?? movements.length,
      totalBatchCount: toNumber(batchSummary?.totalBatchCount ?? batchSummary?.count) ?? batches.length,
    };
  }, [batches.length, detailPayload, movements.length, selectedItem]);

  const detailRecentMovements = useMemo(() => {
    const rows = getRecordArrayAtPaths(detailPayload, [["recentMovements"]]);
    return rows.length ? rows.map(normalizeMovement) : movements.slice(0, 8);
  }, [detailPayload, movements]);

  const reportsPayload = reportsQuery.data;
  const reportSections = useMemo(() => {
    const supplierSummary = getRecordArrayAtPaths(reportsPayload, [["supplierSummary"]]);
    const fastMoving = getRecordArrayAtPaths(reportsPayload, [["fastMoving"]]);
    const slowMoving = getRecordArrayAtPaths(reportsPayload, [["slowMoving"]]);
    const deadStock = getRecordArrayAtPaths(reportsPayload, [["deadStock"]]);
    const expiringBatches = getRecordArrayAtPaths(reportsPayload, [["expiringBatches"]]);
    return { supplierSummary, fastMoving, slowMoving, deadStock, expiringBatches };
  }, [reportsPayload]);

  const duplicateItem = useMemo(() => {
    const name = normalizeComparableText(itemForm.name);
    const genericName = normalizeComparableText(itemForm.genericName);
    const strength = normalizeComparableText(itemForm.strength);
    const dosageForm = normalizeComparableText(itemForm.dosageForm);
    const brandName = normalizeComparableText(itemForm.brandName);
    const sku = normalizeComparableText(itemForm.sku);

    if (!name && !genericName && !sku) {
      return null;
    }

    return (
      items.find((item) => {
        if (isEditingItem && resolvedSelectedItemId !== null && item.id === resolvedSelectedItemId) {
          return false;
        }

        const itemName = normalizeComparableText(item.name);
        const itemGenericName = normalizeComparableText(item.genericName);
        const itemStrength = normalizeComparableText(item.strength);
        const itemDosageForm = normalizeComparableText(item.dosageForm);
        const itemBrandName = normalizeComparableText(item.brandName === "N/A" ? "" : item.brandName);
        const itemSku = normalizeComparableText(item.sku === "N/A" ? "" : item.sku);

        if (sku && itemSku && sku === itemSku) {
          return true;
        }

        const samePrimaryName =
          (name && name === itemName) ||
          (genericName && genericName === itemGenericName) ||
          (name && itemGenericName && name === itemGenericName) ||
          (genericName && itemName && genericName === itemName);

        if (!samePrimaryName) {
          return false;
        }

        const strengthMatches =
          !strength || !itemStrength || strength === itemStrength;
        const dosageMatches =
          !dosageForm || !itemDosageForm || dosageForm === itemDosageForm;
        const brandMatches =
          !brandName || !itemBrandName || brandName === itemBrandName;

        return strengthMatches && dosageMatches && brandMatches;
      }) ?? null
    );
  }, [
    isEditingItem,
    itemForm.brandName,
    itemForm.dosageForm,
    itemForm.genericName,
    itemForm.name,
    itemForm.sku,
    itemForm.strength,
    items,
    resolvedSelectedItemId,
  ]);

  const resetCreateState = () => {
    setCreateState((current) => (current.status === "idle" ? current : idleMutationState()));
  };

  const resetMovementState = () => {
    setMovementState((current) => (current.status === "idle" ? current : idleMutationState()));
  };

  const setSelectedItemId = (value: number | null) => {
    resetMovementState();
    setMovementNotice(null);
    setSelectedItemIdState(value);
  };

  const updateItemForm = <K extends keyof InventoryFormState>(field: K, value: InventoryFormState[K]) => {
    resetCreateState();
    setItemForm((current) => ({ ...current, [field]: value }));
  };

  const updateMovementForm = <K extends keyof MovementFormState>(
    field: K,
    value: MovementFormState[K]
  ) => {
    resetMovementState();
    setMovementForm((current) => ({ ...current, [field]: value }));
  };

  const setNewItemName = (value: string) => updateItemForm("name", value);
  const setNewItemQty = (value: string) => updateItemForm("stock", value);

  const startCreateItem = () => {
    setIsEditingItem(false);
    setItemForm(EMPTY_FORM);
    resetCreateState();
    setActiveTab("inventory");
  };

  const startEditItem = (item?: InventoryItemView | null) => {
    const target = item ?? selectedItem;
    if (!target) return;
    setSelectedItemIdState(target.id);
    setItemForm(toFormState(target));
    setIsEditingItem(true);
    resetCreateState();
    setActiveTab("inventory");
  };

  const invalidateInventoryQueries = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.list }),
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.alerts(alertDays) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.reports(alertDays) }),
      ...(resolvedSelectedItemId !== null
        ? [
            queryClient.invalidateQueries({ queryKey: queryKeys.inventory.detail(resolvedSelectedItemId) }),
            queryClient.invalidateQueries({ queryKey: queryKeys.inventory.movements(resolvedSelectedItemId) }),
            queryClient.invalidateQueries({ queryKey: queryKeys.inventory.batches(resolvedSelectedItemId) }),
          ]
        : []),
    ]);
  };

  const refreshInventoryQueries = async () => {
    await invalidateInventoryQueries();
    await Promise.all([
      inventoryQuery.refetch(),
      alertsQuery.refetch(),
      reportsQuery.refetch(),
      ...(resolvedSelectedItemId !== null
        ? [detailQuery.refetch(), movementQuery.refetch(), batchesQuery.refetch()]
        : []),
    ]);
  };

  const buildItemPayload = (options?: { includeStock?: boolean }): InventoryCreatePayload => {
    const payload: InventoryCreatePayload = {
      sku: toNullableText(itemForm.sku),
      name: itemForm.name.trim(),
      genericName: toNullableText(itemForm.genericName),
      category: itemForm.category,
      subcategory: toNullableText(itemForm.subcategory),
      description: toNullableText(itemForm.description),
      dosageForm: toNullableText(itemForm.dosageForm),
      strength: toNullableText(itemForm.strength),
      unit: itemForm.unit.trim() || "unit",
      route: toNullableText(itemForm.route),
      prescriptionType: itemForm.prescriptionType === "" ? null : itemForm.prescriptionType,
      dispenseUnit: toNullableText(itemForm.dispenseUnit),
      dispenseUnitSize: toNullableNumber(itemForm.dispenseUnitSize),
      purchaseUnit: toNullableText(itemForm.purchaseUnit),
      purchaseUnitSize: toNullableNumber(itemForm.purchaseUnitSize),
      brandName: toNullableText(itemForm.brandName),
      supplierName: toNullableText(itemForm.supplierName),
      leadTimeDays: toNullableNumber(itemForm.leadTimeDays),
      reorderLevel: Number(itemForm.reorderLevel) || 0,
      minStockLevel: toNullableNumber(itemForm.minStockLevel),
      maxStockLevel: toNullableNumber(itemForm.maxStockLevel),
      expiryDate: toNullableText(itemForm.expiryDate),
      batchNo: toNullableText(itemForm.batchNo),
      storageLocation: toNullableText(itemForm.storageLocation),
      directDispenseAllowed: itemForm.directDispenseAllowed,
      isAntibiotic: itemForm.isAntibiotic,
      isControlled: itemForm.isControlled,
      isPediatricSafe: itemForm.isPediatricSafe,
      requiresPrescription: itemForm.requiresPrescription,
      clinicUseOnly: itemForm.clinicUseOnly,
      notes: toNullableText(itemForm.notes),
      isActive: itemForm.isActive,
    };
    if (options?.includeStock) {
      payload.stock = Number(itemForm.stock) || 0;
    }
    return payload;
  };

  const handleSaveItem = async () => {
    if (!canWriteInventory) {
      setCreateState(
        errorMutationState(
          writeDisabledReason ?? "Inventory write permission is required before creating items."
        )
      );
      return;
    }

      if (!itemForm.name.trim()) {
        setCreateState(errorMutationState("Item name is required before saving inventory."));
        return;
      }

      if (!isEditingItem && duplicateItem) {
        setCreateState(
          errorMutationState(
            "A matching inventory item already exists. Edit the existing item instead of creating a duplicate."
          )
        );
        return;
      }

      try {
      setCreateState(pendingMutationState());
      const payload = buildItemPayload({ includeStock: !isEditingItem });
      if (isEditingItem && resolvedSelectedItemId !== null) {
        await updateInventoryItem(resolvedSelectedItemId, payload);
      } else {
        await createInventoryItem(payload);
      }
      await refreshInventoryQueries();
      setCreateState(
        successMutationState(isEditingItem ? "Inventory item updated." : "Inventory item created.")
      );
      if (!isEditingItem) {
        setItemForm(EMPTY_FORM);
      }
    } catch (error) {
      setCreateState(
        errorMutationState(
          formatApiError(error, isEditingItem ? "Failed to update inventory item." : "Failed to create inventory item.")
        )
      );
    }
  };

  const handleCreateItem = async () => {
    await handleSaveItem();
  };

  const handleSubmitMovement = async () => {
    if (!canWriteInventory) {
      setMovementState(
        errorMutationState(
          writeDisabledReason ?? "Inventory write permission is required before posting movements."
        )
      );
      return false;
    }

    if (!resolvedSelectedItemId) {
      setMovementState(errorMutationState("Select an inventory item before posting stock movements."));
      return false;
    }

    const enteredQuantity = Number(movementForm.quantity) || 0;
    if (enteredQuantity <= 0) {
      setMovementState(errorMutationState("Movement quantity must be greater than zero."));
      return false;
    }

    try {
      setMovementNotice(null);
      setMovementState(pendingMutationState());
      if (movementForm.type === "adjustment") {
        const payload: InventoryAdjustStockPayload = {
          actualStock: enteredQuantity,
          note: movementForm.note.trim() || undefined,
        };
        await adjustInventoryStock(resolvedSelectedItemId, payload);
      } else {
        await createInventoryMovement(resolvedSelectedItemId, {
          movementType: movementForm.type,
          movementUnit: movementUnitLabel,
          quantity: enteredQuantity,
          reason: movementForm.reason,
          note: movementForm.note.trim() || undefined,
          referenceType: movementForm.referenceType.trim() || undefined,
          referenceId: toNullableNumber(movementForm.referenceId),
        });
      }

      await invalidateInventoryQueries();
      await Promise.allSettled([movementQuery.refetch(), inventoryQuery.refetch(), alertsQuery.refetch()]);
      setMovementForm(EMPTY_MOVEMENT_FORM);
      setMovementState(successMutationState("Stock movement posted."));
      return true;
    } catch (error) {
      setMovementState(errorMutationState(formatApiError(error, "Failed to post movement.")));
      return false;
    }
  };

  const updateBatchForm = <K extends keyof InventoryBatchFormState>(
    field: K,
    value: InventoryBatchFormState[K]
  ) => {
    setBatchForm((current) => ({ ...current, [field]: value }));
    setCreateState(idleMutationState());
  };

  const handleCreateBatch = async () => {
    if (!canWriteInventory) {
      setCreateState(
        errorMutationState(
          writeDisabledReason ?? "Inventory write permission is required before adding batches."
        )
      );
      return;
    }

    if (!resolvedSelectedItemId) {
      setCreateState(errorMutationState("Select an inventory item before adding a batch."));
      return;
    }

    if (!batchForm.batchNo.trim()) {
      setCreateState(errorMutationState("Batch number is required."));
      return;
    }

    const quantity = Number(batchForm.quantity) || 0;
    if (quantity <= 0) {
      setCreateState(errorMutationState("Batch quantity must be greater than zero."));
      return;
    }

    try {
      setCreateState(pendingMutationState());
      const payload: InventoryBatchCreatePayload = {
        batchNo: batchForm.batchNo.trim(),
        quantity,
        expiryDate: toNullableText(batchForm.expiryDate),
        supplierName: toNullableText(batchForm.supplierName),
        storageLocation: toNullableText(batchForm.storageLocation),
        note: toNullableText(batchForm.note),
      };
      await createInventoryBatch(resolvedSelectedItemId, payload);
      await refreshInventoryQueries();
      setBatchForm(EMPTY_BATCH_FORM);
      setCreateState(successMutationState("Inventory batch created."));
    } catch (error) {
      setCreateState(errorMutationState(formatApiError(error, "Failed to create inventory batch.")));
    }
  };

  const handleQuickMovement = async (type: "in" | "out") => {
    if (!canWriteInventory) {
      setMovementState(
        errorMutationState(
          writeDisabledReason ?? "Inventory write permission is required before posting movements."
        )
      );
      return;
    }

    if (!resolvedSelectedItemId) {
      setMovementState(errorMutationState("Select an inventory item before posting stock movements."));
      return;
    }

    setMovementForm({
      ...EMPTY_MOVEMENT_FORM,
      type,
      quantity: "1",
      reason: type === "in" ? "purchase" : "dispense",
      note: `Quick ${type} from frontend`,
    });
      try {
        setMovementState(pendingMutationState());
        await createInventoryMovement(resolvedSelectedItemId, {
          movementType: type,
          movementUnit: type === "in" ? selectedItem?.purchaseUnit || selectedItem?.unit : selectedItem?.dispenseUnit || selectedItem?.unit,
          quantity: 1,
          reason: type === "in" ? "purchase" : "dispense",
          note: `Quick ${type} from frontend`,
        });
      await invalidateInventoryQueries();
      await Promise.allSettled([movementQuery.refetch(), inventoryQuery.refetch(), alertsQuery.refetch()]);
      setMovementState(successMutationState(`Stock ${type === "in" ? "added" : "removed"} successfully.`));
    } catch (error) {
      setMovementState(errorMutationState(formatApiError(error, "Failed to post movement.")));
    }
  };

  const createFeedback = getMutationFeedback(createState, {
    pendingMessage: isEditingItem ? "Updating inventory item..." : "Creating inventory item...",
    errorMessage: isEditingItem ? "Failed to update inventory item." : "Failed to create inventory item.",
  });

  const movementFeedback = getMutationFeedback(movementState, {
    pendingMessage: "Posting stock movement...",
    errorMessage: "Failed to post movement.",
  });

  return {
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
    selectedItemId: resolvedSelectedItemId,
    setSelectedItemId,
    selectedItem,
    movements: resolvedSelectedItemId ? movements : [],
    movementLoadState,
    alertsLoadState,
    alertsWarningMessage,
    canWriteInventory,
    writeDisabledReason,
    canPostMovement,
    movementActionDisabledReason,
    inventorySearch,
    setInventorySearch,
    categoryFilter,
    setCategoryFilter,
    statusFilter,
    setStatusFilter,
    alertDays,
    setAlertDays,
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
    newItemName: itemForm.name,
    setNewItemName,
    newItemQty: itemForm.stock,
    setNewItemQty,
    loadState,
    createState,
    createFeedback,
    movementState,
    movementFeedback,
    detailSummary,
    detailRecentMovements,
    batches,
    reportSections,
    refresh: () => {
      setMovementNotice(null);
      void refreshInventoryQueries();
    },
    handleCreateItem,
    handleSaveItem,
    handleSubmitMovement,
    handleQuickMovement,
    handleCreateBatch,
  };
}
