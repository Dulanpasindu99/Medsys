import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createQueryWrapper } from "../../../lib/test-query-client";
import { queryKeys } from "../../../lib/query-keys";
import { useInventoryBoard } from "../hooks/useInventoryBoard";

vi.mock("../../../lib/api-client", () => ({
  createInventoryItem: vi.fn(),
  createInventoryMovement: vi.fn(),
}));

vi.mock("../../../lib/query-hooks", () => ({
  useCurrentUserQuery: vi.fn(),
  useInventoryQuery: vi.fn(),
  useInventoryMovementsQuery: vi.fn(),
}));

import { createInventoryItem, createInventoryMovement } from "../../../lib/api-client";
import { useCurrentUserQuery, useInventoryMovementsQuery, useInventoryQuery } from "../../../lib/query-hooks";

const mockedCreateInventoryItem = vi.mocked(createInventoryItem);
const mockedCreateInventoryMovement = vi.mocked(createInventoryMovement);
const mockedUseCurrentUserQuery = vi.mocked(useCurrentUserQuery);
const mockedUseInventoryQuery = vi.mocked(useInventoryQuery);
const mockedUseInventoryMovementsQuery = vi.mocked(useInventoryMovementsQuery);

function buildQueryState(overrides: Record<string, unknown> = {}) {
  return {
    data: [],
    error: null,
    isError: false,
    isFetching: false,
    isPending: false,
    status: "success",
    refetch: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe("useInventoryBoard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedUseInventoryQuery.mockReturnValue(
      buildQueryState({
        data: [{ id: 2, name: "Paracetamol", quantity: 10, category: "medicine" }],
      }) as never
    );
    mockedUseCurrentUserQuery.mockReturnValue(
      buildQueryState({
        data: { id: 42, role: "assistant" },
      }) as never
    );
    mockedUseInventoryMovementsQuery.mockReturnValue(
      buildQueryState({
        data: [{ movementType: "in", quantity: 1 }],
      }) as never
    );
    mockedCreateInventoryItem.mockResolvedValue({ id: 9 });
    mockedCreateInventoryMovement.mockResolvedValue({ id: 4 });
  });

  it("hydrates inventory items and selected movement history from shared queries", async () => {
    const { result } = renderHook(() => useInventoryBoard(), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loadState.status).toBe("ready");
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.selectedItemId).toBe(2);
    expect(mockedUseInventoryMovementsQuery).toHaveBeenLastCalledWith(2, true);
    expect(result.current.movements).toEqual([{ movementType: "in", quantity: 1 }]);
  });

  it("creates items and movements, then refetches the shared queries", async () => {
    const invalidateQueriesSpy = vi
      .spyOn(QueryClient.prototype, "invalidateQueries")
      .mockResolvedValue(undefined);
    const inventoryQuery = buildQueryState({
      data: [{ id: 2, name: "Paracetamol", quantity: 10, category: "medicine" }],
    });
    const movementQuery = buildQueryState({
      data: [{ movementType: "in", quantity: 1 }],
    });
    mockedUseInventoryQuery.mockReturnValue(inventoryQuery as never);
    mockedUseInventoryMovementsQuery.mockReturnValue(movementQuery as never);

    const { result } = renderHook(() => useInventoryBoard(), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => {
      expect(result.current.selectedItemId).toBe(2);
    });

    act(() => {
      result.current.setNewItemName("Ibuprofen");
      result.current.setNewItemQty("25");
    });

    await act(async () => {
      await result.current.handleCreateItem();
    });

    expect(mockedCreateInventoryItem).toHaveBeenCalledWith({
      name: "Ibuprofen",
      category: "medicine",
      quantity: 25,
      unit: "units",
    });
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.inventory.list,
    });
    expect(inventoryQuery.refetch).toHaveBeenCalled();

    await act(async () => {
      await result.current.handleQuickMovement("out");
    });

    expect(mockedCreateInventoryMovement).toHaveBeenCalledWith(2, {
      type: "out",
      quantity: 1,
      note: "Quick out from frontend",
    });
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.inventory.movements(2),
    });
    expect(movementQuery.refetch).toHaveBeenCalled();
    expect(inventoryQuery.refetch).toHaveBeenCalledTimes(2);
    expect(result.current.movementState.status).toBe("success");
    expect(result.current.movementFeedback).toEqual({
      tone: "success",
      message: "Stock removed successfully.",
    });
  });

  it("blocks inventory writes for read-only roles", async () => {
    mockedUseCurrentUserQuery.mockReturnValue(
      buildQueryState({
        data: { id: 77, role: "doctor" },
      }) as never
    );

    const { result } = renderHook(() => useInventoryBoard(), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loadState.status).toBe("ready");
    });

    await act(async () => {
      await result.current.handleCreateItem();
    });

    expect(result.current.canWriteInventory).toBe(false);
    expect(mockedCreateInventoryItem).not.toHaveBeenCalled();
    expect(result.current.createState.error).toMatch(/inventory write permission/i);
  });

  it("clears settled mutation feedback when inputs or selection change", async () => {
    const { result } = renderHook(() => useInventoryBoard(), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => {
      expect(result.current.selectedItemId).toBe(2);
    });

    act(() => {
      result.current.setNewItemName("Ibuprofen");
      result.current.setNewItemQty("25");
    });

    await act(async () => {
      await result.current.handleCreateItem();
    });

    expect(result.current.createState.status).toBe("success");

    act(() => {
      result.current.setNewItemName("Aspirin");
    });

    expect(result.current.createState.status).toBe("idle");
    expect(result.current.createFeedback).toBeNull();

    await act(async () => {
      await result.current.handleQuickMovement("in");
    });

    expect(result.current.movementState.status).toBe("success");

    act(() => {
      result.current.setSelectedItemId(2);
    });

    expect(result.current.movementState.status).toBe("idle");
    expect(result.current.movementFeedback).toBeNull();
  });

  it("disables stock movement actions when no inventory item is selected", async () => {
    mockedUseInventoryQuery.mockReturnValue(buildQueryState({ data: [] }) as never);
    mockedUseInventoryMovementsQuery.mockReturnValue(buildQueryState({ data: [] }) as never);

    const { result } = renderHook(() => useInventoryBoard(), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loadState.status).toBe("empty");
    });

    expect(result.current.canPostMovement).toBe(false);
    expect(result.current.movementActionDisabledReason).toMatch(/select or create an inventory item/i);
  });
});
