import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useOwnerAccess, defaultPermissions } from "../hooks/useOwnerAccess";
import { getCurrentUser, listAppointments, listAuditLogs } from "../../../lib/api-client";

vi.mock("../../../lib/api-client", () => ({
  getCurrentUser: vi.fn(),
  listAuditLogs: vi.fn(),
  listAppointments: vi.fn(),
}));

const mockedGetCurrentUser = vi.mocked(getCurrentUser);
const mockedListAuditLogs = vi.mocked(listAuditLogs);
const mockedListAppointments = vi.mocked(listAppointments);

describe("useOwnerAccess", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedGetCurrentUser.mockResolvedValue({
      id: 1,
      role: "owner",
      email: "owner@example.com",
      name: "Owner",
    });
    mockedListAuditLogs.mockResolvedValue([]);
    mockedListAppointments.mockResolvedValue([]);
  });

  it("updates permission selections from role presets", async () => {
    const { result } = renderHook(() => useOwnerAccess());

    await waitFor(() => {
      expect(result.current.loadState.status).not.toBe("loading");
    });

    act(() => {
      result.current.presets[1]?.set();
    });

    expect(result.current.permissions).toEqual(defaultPermissions("Assistant"));
  });

  it("appends a new local staff record on create", async () => {
    const { result } = renderHook(() => useOwnerAccess());

    await waitFor(() => {
      expect(result.current.loadState.status).not.toBe("loading");
    });

    act(() => {
      result.current.setName("Dr. Meredith Grey");
      result.current.setUsername("meredith.grey");
      result.current.setPassword("secret-123");
    });

    act(() => {
      result.current.handleCreate();
    });

    expect(result.current.staffUsers).toHaveLength(1);
    expect(result.current.staffUsers[0]?.name).toBe("Dr. Meredith Grey");
    expect(result.current.createState.status).toBe("success");
  });

  it("marks partial live staff syncs with an explicit notice", async () => {
    mockedListAuditLogs.mockRejectedValue(new Error("audit down"));
    mockedListAppointments.mockResolvedValue([
      {
        doctorId: 8,
        doctorName: "Dr. House",
      },
    ]);

    const { result } = renderHook(() => useOwnerAccess());

    await waitFor(() => {
      expect(result.current.loadState.status).toBe("ready");
    });

    expect(result.current.staffUsers[0]?.name).toBe("Dr. House");
    expect(result.current.loadState.notice).toMatch(/partial access data/i);
  });
});
