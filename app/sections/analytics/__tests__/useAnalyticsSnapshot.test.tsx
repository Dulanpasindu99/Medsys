import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  getAnalyticsOverview,
  listAppointments,
  listEncounters,
  listInventory,
  listPatients,
} from "../../../lib/api-client";
import { createQueryWrapper } from "../../../lib/test-query-client";
import { useAnalyticsSnapshot } from "../hooks/useAnalyticsSnapshot";

vi.mock("../../../lib/api-client", () => ({
  getAnalyticsOverview: vi.fn(),
  listAppointments: vi.fn(),
  listEncounters: vi.fn(),
  listInventory: vi.fn(),
  listPatients: vi.fn(),
}));

const mockedGetAnalyticsOverview = vi.mocked(getAnalyticsOverview);
const mockedListAppointments = vi.mocked(listAppointments);
const mockedListEncounters = vi.mocked(listEncounters);
const mockedListInventory = vi.mocked(listInventory);
const mockedListPatients = vi.mocked(listPatients);

describe("useAnalyticsSnapshot", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedGetAnalyticsOverview.mockResolvedValue({});
    mockedListPatients.mockResolvedValue([]);
    mockedListAppointments.mockResolvedValue([]);
    mockedListEncounters.mockResolvedValue([]);
    mockedListInventory.mockResolvedValue([]);
  });

  it("loads analytics feeds through the shared query layer", async () => {
    mockedGetAnalyticsOverview.mockResolvedValue({
      totalPatients: 12,
      totalMale: 7,
      totalFemale: 5,
      totalEncounters: 9,
    });
    mockedListPatients.mockResolvedValue([
      { id: 1, name: "Jane Doe", gender: "female" },
      { id: 2, name: "John Doe", gender: "male" },
    ]);
    mockedListAppointments.mockResolvedValue([
      { id: 1, status: "waiting" },
      { id: 2, status: "completed" },
    ]);
    mockedListEncounters.mockResolvedValue([{ id: 1 }, { id: 2 }]);
    mockedListInventory.mockResolvedValue([{ id: 9, stock: "25" }]);

    const { result } = renderHook(() => useAnalyticsSnapshot(), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loadState.status).toBe("ready");
    });

    expect(result.current.patientTotal).toBe(12);
    expect(result.current.maleTotal).toBe(7);
    expect(result.current.femaleTotal).toBe(5);
    expect(result.current.encounterCount).toBe(9);
    expect(result.current.appointmentStatusSummary).toEqual({
      waiting: 1,
      in_consultation: 0,
      completed: 1,
      cancelled: 0,
    });
    expect(result.current.inventoryStock).toEqual({
      totalItems: 1,
      totalUnits: 25,
    });
  });

  it("shows partial-data notice when some feeds fail", async () => {
    mockedGetAnalyticsOverview.mockRejectedValue(new Error("overview failed"));
    mockedListPatients.mockResolvedValue([{ id: 1, name: "Jane Doe" }]);

    const { result } = renderHook(() => useAnalyticsSnapshot(), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loadState.status).toBe("ready");
    });

    expect(result.current.loadState.notice).toBe(
      "Some analytics feeds failed and partial data is being shown."
    );
  });
});
