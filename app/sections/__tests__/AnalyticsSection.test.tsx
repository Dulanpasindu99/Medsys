import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import AnalyticsSection from "../AnalyticsSection";
import { readyLoadState } from "../../lib/async-state";

vi.mock("../analytics/hooks/useAnalyticsDashboard", () => ({
  useAnalyticsDashboard: vi.fn(),
}));

import { useAnalyticsDashboard } from "../analytics/hooks/useAnalyticsDashboard";

const mockedUseAnalyticsDashboard = vi.mocked(useAnalyticsDashboard);

function buildDashboardState(overrides: Record<string, unknown> = {}) {
  return {
    currentUser: { role: "doctor" },
    data: {
      roleContext: {
        resolvedRole: "doctor",
        actorRole: "doctor",
        activeRole: "doctor",
        roles: ["doctor"],
        doctorId: 12,
        assistantId: null,
        workflowProfile: { mode: "self_service" },
      },
      generatedAt: "2026-04-03T12:00:00.000Z",
      range: {
        preset: "7d",
        dateFrom: "2026-03-27",
        dateTo: "2026-04-03",
      },
      summary: {
        queue: { waitingNow: 5, completedToday: 14 },
      },
      charts: {
        topDiagnoses: [
          { label: "URTI", count: 10 },
          { label: "Hypertension", count: 6 },
        ],
      },
      insights: [{ id: "i1", message: "Peak load between 10:00 and 11:00." }],
      tables: {
        recentEncounters: [{ id: 1, patient: "Jane Doe", diagnosis: "URTI" }],
      },
      alerts: [{ id: "a1", message: "2 patients waiting over 25 minutes." }],
    },
    loadState: readyLoadState(),
    range: "7d",
    setRange: vi.fn(),
    customDateFrom: "2026-03-27",
    setCustomDateFrom: vi.fn(),
    customDateTo: "2026-04-03",
    setCustomDateTo: vi.fn(),
    ownerView: "organization",
    setOwnerView: vi.fn(),
    selectedDoctorId: "",
    setSelectedDoctorId: vi.fn(),
    selectedAssistantId: "",
    setSelectedAssistantId: vi.fn(),
    doctorOptions: [],
    assistantOptions: [],
    reload: vi.fn(),
    isRefreshing: false,
    ...overrides,
  };
}

describe("AnalyticsSection", () => {
  it("renders doctor analytics blocks from dashboard data", () => {
    mockedUseAnalyticsDashboard.mockReturnValue(buildDashboardState() as never);

    render(<AnalyticsSection />);

    expect(screen.getByText("Realtime Analytics")).toBeInTheDocument();
    expect(screen.getByText("Queue")).toBeInTheDocument();
    expect(screen.getByText("Top Diagnoses")).toBeInTheDocument();
    expect(screen.getByText(/peak load between 10:00 and 11:00/i)).toBeInTheDocument();
  });

  it("shows owner drill-down selector", () => {
    mockedUseAnalyticsDashboard.mockReturnValue(
      buildDashboardState({
        currentUser: { role: "owner" },
        data: {
          ...buildDashboardState().data,
          roleContext: {
            resolvedRole: "owner",
            actorRole: "owner",
            activeRole: "owner",
            roles: ["owner"],
            doctorId: null,
            assistantId: null,
            workflowProfile: { mode: "standard" },
          },
        },
      }) as never
    );

    render(<AnalyticsSection />);

    expect(screen.getByDisplayValue("Organization")).toBeInTheDocument();
  });
});
