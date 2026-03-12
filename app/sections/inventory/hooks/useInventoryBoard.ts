import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  createInventoryItem,
  createInventoryMovement,
  type ApiClientError,
} from "../../../lib/api-client";
import {
  emptyLoadState,
  errorMutationState,
  errorLoadState,
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
  useInventoryMovementsQuery,
  useInventoryQuery,
} from "../../../lib/query-hooks";
import { queryKeys } from "../../../lib/query-keys";

type AnyRecord = Record<string, unknown>;

function asRecord(value: unknown): AnyRecord | null {
  return value && typeof value === "object" ? (value as AnyRecord) : null;
}

function asArray(value: unknown): AnyRecord[] {
  if (Array.isArray(value)) {
    return value.map((entry) => asRecord(entry)).filter((entry): entry is AnyRecord => !!entry);
  }
  const record = asRecord(value);
  if (!record) return [];
  const candidates = [record.data, record.items, record.rows];
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate.map((entry) => asRecord(entry)).filter((entry): entry is AnyRecord => !!entry);
    }
  }
  return [];
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() && !Number.isNaN(Number(value))) return Number(value);
  return null;
}

export function toString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

export function useInventoryBoard() {
  const queryClient = useQueryClient();
  const inventoryQuery = useInventoryQuery();
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [newItemName, setNewItemName] = useState("");
  const [newItemQty, setNewItemQty] = useState("0");
  const [createState, setCreateState] = useState<MutationState>(idleMutationState());
  const [movementState, setMovementState] = useState<MutationState>(idleMutationState());
  const [movementNotice, setMovementNotice] = useState<string | null>(null);

  const items = useMemo(() => asArray(inventoryQuery.data), [inventoryQuery.data]);

  const resolvedSelectedItemId = useMemo(() => {
    if (!items.length) {
      return null;
    }

    if (selectedItemId !== null) {
      const stillExists = items.some(
        (row) => toNumber(row.id ?? row.inventoryId ?? row.inventory_id) === selectedItemId
      );
      if (stillExists) {
        return selectedItemId;
      }
    }

    return toNumber(items[0].id ?? items[0].inventoryId ?? items[0].inventory_id);
  }, [items, selectedItemId]);

  const movementQuery = useInventoryMovementsQuery(
    resolvedSelectedItemId ?? "none",
    resolvedSelectedItemId !== null
  );
  const movements = useMemo(() => asArray(movementQuery.data), [movementQuery.data]);

  const selectedItem = useMemo(
    () =>
      items.find(
        (row) => toNumber(row.id ?? row.inventoryId ?? row.inventory_id) === resolvedSelectedItemId
      ) ??
      null,
    [items, resolvedSelectedItemId]
  );

  const loadState: LoadState = useMemo(() => {
    if ((inventoryQuery.isPending || inventoryQuery.isFetching) && !items.length) {
      return loadingLoadState();
    }

    if (inventoryQuery.isError) {
      return errorLoadState(
        ((inventoryQuery.error as unknown as ApiClientError | undefined)?.message ??
          "Unable to load inventory.")
      );
    }

    return items.length ? readyLoadState() : emptyLoadState();
  }, [inventoryQuery.error, inventoryQuery.isError, inventoryQuery.isFetching, inventoryQuery.isPending, items.length]);

  const movementLoadState: LoadState = useMemo(() => {
    if (!resolvedSelectedItemId) {
      return idleLoadState();
    }

    if ((movementQuery.isPending || movementQuery.isFetching) && !movements.length) {
      return loadingLoadState();
    }

    if (movementQuery.isError) {
      return errorLoadState(
        ((movementQuery.error as unknown as ApiClientError | undefined)?.message ??
          "Movement history could not be loaded for the selected item."
        )
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

  const invalidateInventoryQueries = () => {
    return Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.list }),
      ...(resolvedSelectedItemId !== null
        ? [
            queryClient.invalidateQueries({
              queryKey: queryKeys.inventory.movements(resolvedSelectedItemId),
            }),
          ]
        : []),
    ]);
  };

  const refreshInventoryQueries = async () => {
    await invalidateInventoryQueries();
    await Promise.all([
      inventoryQuery.refetch(),
      ...(resolvedSelectedItemId !== null ? [movementQuery.refetch()] : []),
    ]);
  };

  const handleCreateItem = async () => {
    if (!newItemName.trim()) {
      setCreateState(errorMutationState("Item name is required before creating inventory."));
      return;
    }

    try {
      setCreateState(pendingMutationState());
      await createInventoryItem({
        name: newItemName.trim(),
        category: "medicine",
        quantity: Number(newItemQty) || 0,
        unit: "units",
      });
      setNewItemName("");
      setNewItemQty("0");
      await refreshInventoryQueries();
      setCreateState(successMutationState("Inventory item created."));
    } catch (error) {
      setCreateState(
        errorMutationState(
          ((error as unknown as ApiClientError | undefined)?.message ??
            "Failed to create inventory item.")
        )
      );
    }
  };

  const handleQuickMovement = async (type: "in" | "out") => {
    if (!resolvedSelectedItemId) {
      setMovementState(errorMutationState("Select an inventory item before posting stock movements."));
      return;
    }

    try {
      setMovementNotice(null);
      setMovementState(pendingMutationState());
      await createInventoryMovement(resolvedSelectedItemId, {
        type,
        quantity: 1,
        note: `Quick ${type} from frontend`,
      });

      await invalidateInventoryQueries();
      const [movementResult, inventoryResult] = await Promise.allSettled([
        movementQuery.refetch(),
        inventoryQuery.refetch(),
      ]);

      if (movementResult.status === "rejected") {
        setMovementNotice(null);
      } else if (inventoryResult.status === "rejected") {
        setMovementNotice("Movement posted, but item totals could not be refreshed.");
      } else {
        setMovementNotice(null);
      }

      setMovementState(
        successMutationState(`Stock ${type === "in" ? "added" : "removed"} successfully.`)
      );
    } catch (error) {
      setMovementState(
        errorMutationState(
          ((error as unknown as ApiClientError | undefined)?.message ??
            "Failed to post movement.")
        )
      );
    }
  };

  return {
    items,
    selectedItemId: resolvedSelectedItemId,
    setSelectedItemId,
    selectedItem,
    movements: resolvedSelectedItemId ? movements : [],
    movementLoadState,
    newItemName,
    setNewItemName,
    newItemQty,
    setNewItemQty,
    loadState,
    createState,
    movementState,
    refresh: () => {
      setMovementNotice(null);
      void refreshInventoryQueries();
    },
    handleCreateItem,
    handleQuickMovement,
  };
}
