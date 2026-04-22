import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createQueryWrapper } from "../../../lib/test-query-client";
import { queryKeys } from "../../../lib/query-keys";
import { useOwnerAccess, defaultPermissions } from "../hooks/useOwnerAccess";
import {
  createUser,
  getCurrentUser,
  listAppointments,
  listAuditLogs,
  listUsers,
  updateUserExtraPermissions,
} from "../../../lib/api-client";

vi.mock("../../../lib/api-client", () => ({
  createUser: vi.fn(),
  getCurrentUser: vi.fn(),
  listAuditLogs: vi.fn(),
  listAppointments: vi.fn(),
  listUsers: vi.fn(),
  updateUserExtraPermissions: vi.fn(),
}));

const mockedCreateUser = vi.mocked(createUser);
const mockedGetCurrentUser = vi.mocked(getCurrentUser);
const mockedListAuditLogs = vi.mocked(listAuditLogs);
const mockedListAppointments = vi.mocked(listAppointments);
const mockedListUsers = vi.mocked(listUsers);
const mockedUpdateUserExtraPermissions = vi.mocked(updateUserExtraPermissions);

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
    mockedUpdateUserExtraPermissions.mockResolvedValue({
      id: 8,
      name: "Dr. House",
      email: "house@medsys.local",
      role: "doctor",
      extraPermissions: ["appointment.create", "prescription.dispense"],
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
      result.current.setRole("Assistant");
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
      result.current.toggleCreateExtraPermission("appointment.create");
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
      doctorWorkflowMode: "self_service",
      extraPermissions: ["appointment.create"],
    });
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.users.list(),
    });
    expect(result.current.createState.status).toBe("success");
    expect(result.current.createFeedback).toEqual({
      tone: "success",
      message: "Staff user created.",
    });
  });

  it("clears stale create feedback when the staff form changes", async () => {
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

    expect(result.current.createState.status).toBe("success");

    act(() => {
      result.current.setName("Dr. Cristina Yang");
    });

    expect(result.current.createState.status).toBe("idle");
    expect(result.current.createFeedback).toBeNull();
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

  it("keeps stable unique staff ids when backend users use numeric ids", async () => {
    mockedListUsers.mockResolvedValue([
      {
        id: 8,
        name: "Dr. House",
        email: "house@medsys.local",
        role: "doctor",
      },
      {
        id: 11,
        name: "Assistant Joy",
        email: "joy@medsys.local",
        role: "assistant",
      },
    ]);

    const { result } = renderHook(() => useOwnerAccess(), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => {
      expect(result.current.staffUsers).toHaveLength(2);
    });

    expect(result.current.staffUsers.map((user) => user.id)).toEqual([
      "user-8",
      "user-11",
    ]);
  });

  it("updates doctor support overrides through the backend-backed user detail route", async () => {
    mockedListUsers.mockResolvedValue([
      {
        id: 8,
        name: "Dr. House",
        email: "house@medsys.local",
        role: "doctor",
        permissions: ["patient.write", "appointment.create"],
        extraPermissions: ["appointment.create"],
      },
    ]);

    const { result } = renderHook(() => useOwnerAccess(), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => {
      expect(result.current.staffUsers).toHaveLength(1);
    });

    act(() => {
      result.current.toggleUserExtraPermission("user-8", "prescription.dispense");
    });

    await act(async () => {
      await result.current.saveUserExtraPermissions(result.current.staffUsers[0]!);
    });

    expect(mockedUpdateUserExtraPermissions).toHaveBeenCalledWith(8, {
      extraPermissions: ["appointment.create", "prescription.dispense"],
    });
    expect(result.current.getUserUpdateFeedback("user-8")).toEqual({
      tone: "success",
      message: "Doctor support permissions updated.",
    });
  });

  it("blocks staff creation for non-owner roles before the backend returns 403", async () => {
    mockedGetCurrentUser.mockResolvedValue({
      id: 5,
      role: "doctor",
      email: "doctor@example.com",
      name: "Doctor",
    });

    const { result } = renderHook(() => useOwnerAccess(), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loadState.status).toBe("error");
    });

    act(() => {
      result.current.setName("Dr. Meredith Grey");
      result.current.setUsername("meredith.grey@medsys.local");
      result.current.setPassword("secret-123");
    });

    await act(async () => {
      await result.current.handleCreate();
    });

    expect(result.current.canManageStaff).toBe(false);
    expect(mockedCreateUser).not.toHaveBeenCalled();
    expect(result.current.createState.error).toMatch(/staff-management permission is required|owner access is required|only owner accounts can create staff users/i);
  });
});
