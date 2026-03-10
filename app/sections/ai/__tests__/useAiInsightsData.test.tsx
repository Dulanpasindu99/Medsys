import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  getAnalyticsOverview,
  listAppointments,
  listAuditLogs,
  listPatients,
} from "../../../lib/api-client";
import { createQueryWrapper } from "../../../lib/test-query-client";
import { useAiInsightsData } from "../hooks/useAiInsightsData";

vi.mock("../../../lib/api-client", () => ({
  getAnalyticsOverview: vi.fn(),
  listAppointments: vi.fn(),
  listAuditLogs: vi.fn(),
  listPatients: vi.fn(),
}));

const mockedGetAnalyticsOverview = vi.mocked(getAnalyticsOverview);
const mockedListAppointments = vi.mocked(listAppointments);
const mockedListAuditLogs = vi.mocked(listAuditLogs);
const mockedListPatients = vi.mocked(listPatients);

describe("useAiInsightsData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedGetAnalyticsOverview.mockResolvedValue({});
    mockedListPatients.mockResolvedValue([]);
    mockedListAppointments.mockResolvedValue([]);
    mockedListAuditLogs.mockResolvedValue([]);
  });

  it("builds AI insights from shared query-backed feeds", async () => {
    mockedGetAnalyticsOverview.mockResolvedValue({ totalPatients: 18 });
    mockedListPatients.mockResolvedValue([{ id: 1 }, { id: 2 }]);
    mockedListAppointments.mockResolvedValue([
      { id: 1, status: "waiting" },
      { id: 2, status: "completed" },
    ]);
    mockedListAuditLogs.mockResolvedValue([
      { action: "create", entityType: "appointment" },
    ]);

    const { result } = renderHook(() => useAiInsightsData(), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loadState.status).toBe("ready");
    });

    expect(result.current.patientTotal).toBe(18);
    expect(result.current.appointmentTotal).toBe(2);
    expect(result.current.auditEventCount).toBe(1);
    expect(result.current.insights).toEqual(
      expect.arrayContaining([
        "Current patient base is 18.",
        "Latest audited action: create on appointment.",
      ])
    );
  });

  it("surfaces an error when every AI feed fails", async () => {
    mockedGetAnalyticsOverview.mockRejectedValue(new Error("overview failed"));
    mockedListPatients.mockRejectedValue(new Error("patients failed"));
    mockedListAppointments.mockRejectedValue(new Error("appointments failed"));
    mockedListAuditLogs.mockRejectedValue(new Error("audit failed"));

    const { result } = renderHook(() => useAiInsightsData(), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loadState.status).toBe("error");
    });

    expect(result.current.loadState.error).toBe("overview failed");
  });
});
