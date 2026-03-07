import { useEffect, useMemo, useState } from "react";
import {
  createInventoryItem,
  createInventoryMovement,
  listInventory,
  listInventoryMovements,
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
  const [items, setItems] = useState<AnyRecord[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [movementItemId, setMovementItemId] = useState<number | null>(null);
  const [movements, setMovements] = useState<AnyRecord[]>([]);
  const [movementLoadState, setMovementLoadState] = useState<LoadState>(idleLoadState());
  const [newItemName, setNewItemName] = useState("");
  const [newItemQty, setNewItemQty] = useState("0");
  const [loadState, setLoadState] = useState<LoadState>(loadingLoadState());
  const [createState, setCreateState] = useState<MutationState>(idleMutationState());
  const [movementState, setMovementState] = useState<MutationState>(idleMutationState());
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    const timeoutId = window.setTimeout(() => {
      void (async () => {
        setLoadState(loadingLoadState());
        try {
          const response = await listInventory();
          if (!active) return;

          const rows = asArray(response);
          setItems(rows);

          if (!rows.length) {
            setSelectedItemId(null);
            setLoadState(emptyLoadState());
            return;
          }

          setSelectedItemId((current) => {
            if (current !== null) {
              const stillExists = rows.some(
                (row) => toNumber(row.id ?? row.inventoryId ?? row.inventory_id) === current
              );
              if (stillExists) return current;
            }
            return toNumber(rows[0].id ?? rows[0].inventoryId ?? rows[0].inventory_id);
          });
          setLoadState(readyLoadState());
        } catch (error) {
          if (!active) return;
          setItems([]);
          setSelectedItemId(null);
          setLoadState(
            errorLoadState((error as ApiClientError)?.message ?? "Unable to load inventory.")
          );
        }
      })();
    }, 0);

    return () => {
      active = false;
      window.clearTimeout(timeoutId);
    };
  }, [reloadKey]);

  useEffect(() => {
    if (!selectedItemId) return;

    let active = true;
    void (async () => {
      setMovementLoadState(loadingLoadState());
      try {
        const response = await listInventoryMovements(selectedItemId);
        if (!active) return;
        setMovements(asArray(response));
        setMovementItemId(selectedItemId);
        setMovementLoadState(readyLoadState());
      } catch (error) {
        if (!active) return;
        setMovements([]);
        setMovementItemId(selectedItemId);
        setMovementLoadState(
          errorLoadState(
            (error as ApiClientError)?.message ??
              "Movement history could not be loaded for the selected item."
          )
        );
      }
    })();

    return () => {
      active = false;
    };
  }, [selectedItemId]);

  const selectedItem = useMemo(
    () => items.find((row) => toNumber(row.id ?? row.inventoryId ?? row.inventory_id) === selectedItemId) ?? null,
    [items, selectedItemId]
  );

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
      setReloadKey((prev) => prev + 1);
      setCreateState(successMutationState("Inventory item created."));
    } catch (error) {
      setCreateState(
        errorMutationState(
          (error as ApiClientError)?.message ?? "Failed to create inventory item."
        )
      );
    }
  };

  const handleQuickMovement = async (type: "in" | "out") => {
    if (!selectedItemId) {
      setMovementState(errorMutationState("Select an inventory item before posting stock movements."));
      return;
    }

    try {
      setMovementState(pendingMutationState());
      await createInventoryMovement(selectedItemId, {
        type,
        quantity: 1,
        note: `Quick ${type} from frontend`,
      });

      const [movementResult, inventoryResult] = await Promise.allSettled([
        listInventoryMovements(selectedItemId),
        listInventory(),
      ]);

      if (movementResult.status === "fulfilled") {
        setMovements(asArray(movementResult.value));
        setMovementItemId(selectedItemId);
        setMovementLoadState(
          readyLoadState(
            inventoryResult.status === "rejected"
              ? "Movement posted, but item totals could not be refreshed."
              : null
          )
        );
      } else {
        setMovements([]);
        setMovementItemId(selectedItemId);
        setMovementLoadState(
          errorLoadState(
            (movementResult.reason as ApiClientError | undefined)?.message ??
              "Movement posted, but movement history could not be refreshed."
          )
        );
      }

      if (inventoryResult.status === "fulfilled") {
        const rows = asArray(inventoryResult.value);
        setItems(rows);
      }

      setMovementState(
        successMutationState(`Stock ${type === "in" ? "added" : "removed"} successfully.`)
      );
    } catch (error) {
      setMovementState(
        errorMutationState((error as ApiClientError)?.message ?? "Failed to post movement.")
      );
    }
  };

  return {
    items,
    selectedItemId,
    setSelectedItemId,
    selectedItem,
    movements: movementItemId === selectedItemId ? movements : [],
    movementLoadState: selectedItemId ? movementLoadState : idleLoadState(),
    newItemName,
    setNewItemName,
    newItemQty,
    setNewItemQty,
    loadState,
    createState,
    movementState,
    refresh: () => setReloadKey((prev) => prev + 1),
    handleCreateItem,
    handleQuickMovement,
  };
}
