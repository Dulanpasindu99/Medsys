import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createQueryWrapper } from "../../../lib/test-query-client";
import { queryKeys } from "../../../lib/query-keys";
import { useOwnerAccess, defaultPermissions } from "../hooks/useOwnerAccess";
import { createUser, getCurrentUser, listAppointments, listAuditLogs, listUsers } from "../../../lib/api-client";

vi.mock("../../../lib/api-client", () => ({
  createUser: vi.fn(),
  getCurrentUser: vi.fn(),
  listAuditLogs: vi.fn(),
  listAppointments: vi.fn(),
  listUsers: vi.fn(),
}));

const mockedCreateUser = vi.mocked(createUser);
const mockedGetCurrentUser = vi.mocked(getCurrentUser);
const mockedListAuditLogs = vi.mocked(listAuditLogs);
const mockedListAppointments = vi.mocked(listAppointments);
const mockedListUsers = vi.mocked(listUsers);

describe("useOwnerAccess", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedGetCurrentUser.mockResolvedValue({
      id: 1,
      role: "owner",
      email: "owner@example.com",
      name: "Owner",
    });
    mockedCreateUser.mockResolvedValue({
      id: 7,
      name: "Dr. Meredith Grey",
      email: "meredith.grey@medsys.local",
      role: "doctor",
    });
    mockedListAuditLogs.mockResolvedValue([]);
    mockedListAppointments.mockResolvedValue([]);
    mockedListUsers.mockResolvedValue([]);
  });

  it("updates permission selections from role presets", async () => {
    const { result } = renderHook(() => useOwnerAccess(), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loadState.status).not.toBe("loading");
    });

    act(() => {
      result.current.presets[1]?.set();
    });

    expect(result.current.permissions).toEqual(defaultPermissions("Assistant"));
  });

  it("creates a staff user through the backend-backed users API", async () => {
    const invalidateQueriesSpy = vi
      .spyOn(QueryClient.prototype, "invalidateQueries")
      .mockResolvedValue(undefined);
    const { result } = renderHook(() => useOwnerAccess(), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loadState.status).not.toBe("loading");
    });

    act(() => {
      result.current.setName("Dr. Meredith Grey");
      result.current.setUsername("meredith.grey@medsys.local");
      result.current.setPassword("secret-123");
    });

    await act(async () => {
      await result.current.handleCreate();
    });

    expect(mockedCreateUser).toHaveBeenCalledWith({
      name: "Dr. Meredith Grey",
      email: "meredith.grey@medsys.local",
      password: "secret-123",
      role: "doctor",
    });
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.users.list(),
    });
    expect(result.current.createState.status).toBe("success");
  });

  it("marks partial live staff syncs with an explicit notice", async () => {
    mockedListUsers.mockResolvedValue([
      {
        id: 8,
        name: "Dr. House",
        email: "house@medsys.local",
        role: "doctor",
      },
    ]);
    mockedListAuditLogs.mockRejectedValue(new Error("audit down"));
    mockedListAppointments.mockResolvedValue([
      {
        doctorId: 8,
        doctorName: "Dr. House",
      },
    ]);

    const { result } = renderHook(() => useOwnerAccess(), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loadState.status).toBe("ready");
    });

    expect(result.current.staffUsers[0]?.name).toBe("Dr. House");
    expect(result.current.loadState.notice).toMatch(/partial access data/i);
  });
});
