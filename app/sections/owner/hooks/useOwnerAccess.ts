'use client';

import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from 'react';
import {
  createUser,
  type ApiClientError,
  updateUserExtraPermissions,
} from '../../../lib/api-client';
import {
  emptyLoadState,
  errorMutationState,
  getMutationFeedback,
  errorLoadState,
  idleMutationState,
  loadingLoadState,
  pendingMutationState,
  readyLoadState,
  successMutationState,
  type LoadState,
  type MutationState,
} from '../../../lib/async-state';
import {
  useAppointmentsQuery,
  useAuditLogsQuery,
  useCurrentUserQuery,
  useUsersQuery,
} from '../../../lib/query-hooks';
import { queryKeys } from "../../../lib/query-keys";
import {
  getRolePermissions,
  hasAnyPermission,
  hasPermission,
  type AppPermission,
} from "../../../lib/authorization";
import { notifyError, notifySuccess, notifyWarning } from "../../../lib/notifications";
import { createStaffFormSchema, mapZodFieldErrors } from "../../../lib/validation/forms";
import type {
  DoctorSupportPermission,
  DoctorWorkflowModeOption,
  PermissionKey,
  Role,
  StaffUser,
} from '../types';

type AnyRecord = Record<string, unknown>;

function asRecord(value: unknown): AnyRecord | null {
  return value && typeof value === 'object' ? (value as AnyRecord) : null;
}

function asArray(value: unknown): AnyRecord[] {
  if (Array.isArray(value)) {
    return value
      .map((entry) => asRecord(entry))
      .filter((entry): entry is AnyRecord => !!entry);
  }
  const record = asRecord(value);
  if (!record) return [];
  const candidates = [record.data, record.items, record.rows];
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate
        .map((entry) => asRecord(entry))
        .filter((entry): entry is AnyRecord => !!entry);
    }
  }
  return [];
}

function toString(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback;
}

function toIdentifier(value: unknown, fallback: string) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }

  if (typeof value === 'string' && value.trim()) {
    return value.trim();
  }

  return fallback;
}

function toNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() && !Number.isNaN(Number(value))) {
    return Number(value);
  }
  return null;
}

function toRole(value: unknown): Role | null {
  const role = toString(value).toLowerCase();
  if (role === 'doctor') return 'Doctor';
  if (role === 'assistant') return 'Assistant';
  return null;
}

export const permissionLabels: Record<PermissionKey, string> = {
  staffLogin: 'Staff login',
  doctorScreen: 'Doctor screen',
  assistantScreen: 'Assistant screen',
  ownerTools: 'Owner tools',
  sharedDashboards: 'Shared dashboards',
};

export const doctorSupportPermissionLabels: Record<DoctorSupportPermission, string> = {
  "patient.write": "Patient intake",
  "appointment.create": "Appointment scheduling",
  "inventory.write": "Inventory write",
  "prescription.dispense": "Prescription dispense",
  "family.write": "Family records",
};

export const DOCTOR_SUPPORT_PERMISSION_OPTIONS = Object.keys(
  doctorSupportPermissionLabels
) as DoctorSupportPermission[];

const doctorPreset: Record<PermissionKey, boolean> = {
  staffLogin: true,
  doctorScreen: true,
  assistantScreen: false,
  ownerTools: false,
  sharedDashboards: true,
};

const assistantPreset: Record<PermissionKey, boolean> = {
  staffLogin: true,
  doctorScreen: false,
  assistantScreen: true,
  ownerTools: false,
  sharedDashboards: true,
};

export function defaultPermissions(role: Role): Record<PermissionKey, boolean> {
  return { ...(role === 'Doctor' ? doctorPreset : assistantPreset) };
}

function toPermissionList(value: unknown): AppPermission[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return Array.from(
    new Set(
      value
        .filter((entry): entry is string => typeof entry === "string")
        .map((entry) => entry.trim() as AppPermission)
        .filter(Boolean)
    )
  );
}

function toDoctorSupportPermissions(value: unknown): DoctorSupportPermission[] {
  return toPermissionList(value).filter((permission): permission is DoctorSupportPermission =>
    DOCTOR_SUPPORT_PERMISSION_OPTIONS.includes(permission as DoctorSupportPermission)
  );
}

function summarizePermissions(
  role: Role,
  permissions: readonly AppPermission[]
): Record<PermissionKey, boolean> {
  const subject = {
    role: role === "Doctor" ? "doctor" : "assistant",
    permissions,
  } as const;

  return {
    staffLogin: true,
    doctorScreen: hasPermission(subject, "doctor.workspace.view"),
    assistantScreen:
      hasPermission(subject, "assistant.workspace.view") ||
      hasAnyPermission(subject, DOCTOR_SUPPORT_PERMISSION_OPTIONS),
    ownerTools: hasPermission(subject, "owner.workspace.view"),
    sharedDashboards:
      hasPermission(subject, "analytics.view") || hasPermission(subject, "analytics.read"),
  };
}

function normalizeAuditStaff(rawAuditLogs: unknown): StaffUser[] {
  const unique = new Map<string, StaffUser>();

  asArray(rawAuditLogs).forEach((row, index) => {
    const actor = asRecord(row.actor) ?? null;
    const role = toRole(
      row.actorRole ??
        row.role ??
        row.userRole ??
        row.user_role ??
        actor?.role
    );
    if (!role) return;

    const actorId = toNumber(
      row.actorId ?? row.actor_id ?? row.userId ?? row.user_id ?? actor?.id
    );
    const name = toString(
      row.actorName ??
        row.userName ??
        row.username ??
        actor?.name ??
        actor?.fullName,
      `${role} ${actorId ?? index + 1}`
    );
    const email = toString(row.actorEmail ?? row.userEmail ?? actor?.email);
    const username = email || toString(row.username ?? actor?.username, name);
    const id = toIdentifier(actorId, `${role.toLowerCase()}-${username}-${index}`);
    const key = `${role}:${id}`;

    if (!unique.has(key)) {
      const effectivePermissions =
        role === "Doctor" ? [...getRolePermissions("doctor")] : [...getRolePermissions("assistant")];
      unique.set(key, {
        id: `live-${role.toLowerCase()}-${id}`,
        backendUserId: actorId,
        role,
        name,
        username,
        permissions: summarizePermissions(role, effectivePermissions),
        effectivePermissions,
        extraPermissions: [],
      });
    }
  });

  return Array.from(unique.values());
}

function normalizeStaffFromAppointments(rawAppointments: unknown): StaffUser[] {
  const unique = new Map<string, StaffUser>();
  const upsert = (
    role: Role,
    id: number | null,
    nameValue: unknown,
    usernameValue: unknown,
    fallbackIndex: number
  ) => {
    const name = toString(nameValue, `${role} ${id ?? fallbackIndex + 1}`);
    const username = toString(usernameValue, name);
    const rawId = id !== null ? String(id) : `${role.toLowerCase()}-${username}-${fallbackIndex}`;
    const key = `${role}:${rawId}`;
    if (unique.has(key)) return;
    const effectivePermissions =
      role === "Doctor" ? [...getRolePermissions("doctor")] : [...getRolePermissions("assistant")];
    unique.set(key, {
      id: `live-${role.toLowerCase()}-${rawId}`,
      backendUserId: id,
      role,
      name,
      username,
      permissions: summarizePermissions(role, effectivePermissions),
      effectivePermissions,
      extraPermissions: [],
    });
  };

  asArray(rawAppointments).forEach((row, index) => {
    const doctor = asRecord(row.doctor) ?? null;
    const assistant = asRecord(row.assistant) ?? null;

    const doctorId = toNumber(row.doctorId ?? row.doctor_id ?? doctor?.id);
    const assistantId = toNumber(
      row.assistantId ?? row.assistant_id ?? assistant?.id
    );

    upsert(
      'Doctor',
      doctorId,
      row.doctorName ?? row.doctor_name ?? doctor?.name,
      doctor?.email ?? doctor?.username,
      index
    );
    upsert(
      'Assistant',
      assistantId,
      row.assistantName ?? row.assistant_name ?? assistant?.name,
      assistant?.email ?? assistant?.username,
      index
    );
  });

  return Array.from(unique.values());
}

function normalizeUsers(rawUsers: unknown): StaffUser[] {
  return asArray(rawUsers)
    .map((row, index) => {
      const role = toRole(row.role);
      if (!role) return null;

      const id = toIdentifier(row.id ?? row.userId, `${role.toLowerCase()}-${index}`);
      const email = toString(row.email ?? row.username);
      const name = toString(row.name ?? row.fullName, `${role} ${index + 1}`);
      const extraPermissions = toDoctorSupportPermissions(
        row.extraPermissions ?? row.extra_permissions
      );
      const effectivePermissions = toPermissionList(row.permissions);
      const resolvedPermissions =
        effectivePermissions.length > 0
          ? effectivePermissions
          : role === "Doctor"
            ? [...getRolePermissions("doctor")]
            : [...getRolePermissions("assistant")];

      return {
        id: `user-${id}`,
        backendUserId: toNumber(row.id ?? row.userId),
        role,
        name,
        username: email || name,
        permissions: summarizePermissions(role, resolvedPermissions),
        effectivePermissions: resolvedPermissions,
        extraPermissions,
      } as StaffUser;
    })
    .filter((user): user is StaffUser => !!user);
}

function mergeStaff(primary: StaffUser[], secondary: StaffUser[]) {
  const merged = new Map<string, StaffUser>();
  [...primary, ...secondary].forEach((user) => {
    const key = `${user.role}:${user.username.toLowerCase()}`;
    if (!merged.has(key)) {
      merged.set(key, user);
    }
  });
  return Array.from(merged.values());
}

export function useOwnerAccess() {
  const queryClient = useQueryClient();
  const currentUserQuery = useCurrentUserQuery();
  const usersQuery = useUsersQuery();
  const canReadAuditLogs =
    !!currentUserQuery.data &&
    hasAnyPermission(currentUserQuery.data, ["owner.workspace.view", "ai.workspace.view"]);
  const auditLogsQuery = useAuditLogsQuery({ limit: 200 }, canReadAuditLogs);
  const appointmentsQuery = useAppointmentsQuery();
  const [role, setRoleState] = useState<Role>('Doctor');
  const [name, setNameState] = useState('');
  const [username, setUsernameState] = useState('');
  const [password, setPasswordState] = useState('');
  const [doctorWorkflowMode, setDoctorWorkflowModeState] =
    useState<DoctorWorkflowModeOption>("self_service");
  const [extraPermissions, setExtraPermissionsState] = useState<DoctorSupportPermission[]>([]);
  const [createFieldErrors, setCreateFieldErrors] = useState<{
    name?: string;
    username?: string;
    password?: string;
    doctorWorkflowMode?: string;
  }>({});
  const [createState, setCreateState] = useState<MutationState>(idleMutationState());
  const [updateStates, setUpdateStates] = useState<Record<string, MutationState>>({});
  const [editedExtraPermissions, setEditedExtraPermissions] = useState<
    Record<string, DoctorSupportPermission[]>
  >({});
  const permissions = useMemo(
    () =>
      summarizePermissions(
        role,
        role === "Doctor"
          ? [...getRolePermissions("doctor"), ...extraPermissions]
          : [...getRolePermissions("assistant")]
      ),
    [extraPermissions, role]
  );
  const canManageStaff =
    !!currentUserQuery.data &&
    hasPermission(currentUserQuery.data, 'owner.workspace.view') &&
    hasPermission(currentUserQuery.data, 'user.write');
  const manageStaffDisabledReason =
    currentUserQuery.isPending || currentUserQuery.isFetching
      ? 'Checking owner access before managing staff.'
      : currentUserQuery.data && !canManageStaff
        ? 'Staff-management permission is required before creating staff users.'
        : null;

  const clearCreateState = () => {
    setCreateState((current) => (current.status === 'idle' ? current : idleMutationState()));
    setCreateFieldErrors({});
  };

  const setRole = (value: Role) => {
    clearCreateState();
    setRoleState(value);
    if (value === "Assistant") {
      setDoctorWorkflowModeState("self_service");
    }
    setExtraPermissionsState(value === "Doctor" ? [] : []);
  };

  const setDoctorWorkflowMode = (value: DoctorWorkflowModeOption) => {
    clearCreateState();
    setDoctorWorkflowModeState(value);
  };

  const setName = (value: string) => {
    clearCreateState();
    setNameState(value);
  };

  const setUsername = (value: string) => {
    clearCreateState();
    setUsernameState(value);
  };

  const setPassword = (value: string) => {
    clearCreateState();
    setPasswordState(value);
  };

  const toggleCreateExtraPermission = (permission: DoctorSupportPermission) => {
    clearCreateState();
    setExtraPermissionsState((current) =>
      current.includes(permission)
        ? current.filter((entry) => entry !== permission)
        : [...current, permission]
    );
  };

  const resetCreateForm = () => {
    clearCreateState();
    setRoleState("Doctor");
    setDoctorWorkflowModeState("self_service");
    setNameState("");
    setUsernameState("");
    setPasswordState("");
    setExtraPermissionsState([]);
  };

  const liveUsers = useMemo(() => normalizeUsers(usersQuery.data ?? []), [usersQuery.data]);
  const liveFromAudit = useMemo(
    () => normalizeAuditStaff(auditLogsQuery.data ?? []),
    [auditLogsQuery.data]
  );
  const liveFromAppointments = useMemo(
    () => normalizeStaffFromAppointments(appointmentsQuery.data ?? []),
    [appointmentsQuery.data]
  );
  const staffUsers = useMemo(
    () => mergeStaff(liveUsers, mergeStaff(liveFromAudit, liveFromAppointments)),
    [liveFromAppointments, liveFromAudit, liveUsers]
  );

  const getEditableExtraPermissions = (user: StaffUser) =>
    editedExtraPermissions[user.id] ?? user.extraPermissions;

  const loadState: LoadState = useMemo(() => {
    if (
      currentUserQuery.isPending &&
      usersQuery.isPending &&
      auditLogsQuery.isPending &&
      appointmentsQuery.isPending
    ) {
      return loadingLoadState();
    }

    if (currentUserQuery.isError) {
      return errorLoadState("Unable to verify owner access for staff management.");
    }

    const currentUser = currentUserQuery.data;
    if (currentUser && !hasPermission(currentUser, 'owner.workspace.view')) {
      return errorLoadState('Owner role is required to manage staff.');
    }

    if (usersQuery.isError && auditLogsQuery.isError && appointmentsQuery.isError) {
      return errorLoadState(
        ((usersQuery.error as unknown as ApiClientError | undefined)?.message ??
          (auditLogsQuery.error as unknown as ApiClientError | undefined)?.message ??
          (appointmentsQuery.error as unknown as ApiClientError | undefined)?.message ??
          'Unable to sync staff data.')
      );
    }

    const partialNotice =
      usersQuery.isError || (canReadAuditLogs && auditLogsQuery.isError) || appointmentsQuery.isError
        ? "Some staff feeds failed and partial access data is being shown."
        : null;
    return staffUsers.length ? readyLoadState(partialNotice) : emptyLoadState(partialNotice);
  }, [
    appointmentsQuery.error,
    appointmentsQuery.isError,
    appointmentsQuery.isPending,
    canReadAuditLogs,
    auditLogsQuery.error,
    auditLogsQuery.isError,
    auditLogsQuery.isPending,
    currentUserQuery.data,
    currentUserQuery.isError,
    currentUserQuery.isPending,
    staffUsers.length,
    usersQuery.error,
    usersQuery.isError,
    usersQuery.isPending,
  ]);

  const refreshStaffQueries = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.users.list() }),
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.currentUser }),
      queryClient.invalidateQueries({ queryKey: queryKeys.audit.logs() }),
      queryClient.invalidateQueries({ queryKey: queryKeys.appointments.list() }),
      usersQuery.refetch(),
      currentUserQuery.refetch(),
      auditLogsQuery.refetch(),
      appointmentsQuery.refetch(),
    ]);
  };

  const toggleUserExtraPermission = (userId: string, permission: DoctorSupportPermission) => {
    setEditedExtraPermissions((current) => {
      const existingUser = staffUsers.find((entry) => entry.id === userId);
      const base = current[userId] ?? existingUser?.extraPermissions ?? [];
      const next = base.includes(permission)
        ? base.filter((entry) => entry !== permission)
        : [...base, permission];
      return {
        ...current,
        [userId]: next,
      };
    });
  };

  const saveUserExtraPermissions = async (user: StaffUser) => {
    if (!canManageStaff) {
      notifyWarning(
        manageStaffDisabledReason ?? "Owner access is required before updating staff permissions."
      );
      setUpdateStates((current) => ({
        ...current,
        [user.id]: errorMutationState(
          manageStaffDisabledReason ?? "Owner access is required before updating staff permissions."
        ),
      }));
      return;
    }

    if (user.role !== "Doctor" || user.backendUserId === null) {
      notifyWarning("Only synced doctor accounts can receive extra permissions.");
      setUpdateStates((current) => ({
        ...current,
        [user.id]: errorMutationState("Only synced doctor accounts can receive extra permissions."),
      }));
      return;
    }

    const nextExtraPermissions = getEditableExtraPermissions(user);

    try {
      setUpdateStates((current) => ({
        ...current,
        [user.id]: pendingMutationState(),
      }));
      await updateUserExtraPermissions(user.backendUserId, {
        extraPermissions: nextExtraPermissions,
      });
      await refreshStaffQueries();
      setEditedExtraPermissions((current) => ({
        ...current,
        [user.id]: nextExtraPermissions,
      }));
      setUpdateStates((current) => ({
        ...current,
        [user.id]: successMutationState("Doctor support permissions updated."),
      }));
      notifySuccess("Doctor support permissions updated.");
    } catch (error) {
      notifyError(
        ((error as ApiClientError | undefined)?.message ??
          "Unable to update doctor support permissions.")
      );
      setUpdateStates((current) => ({
        ...current,
        [user.id]: errorMutationState(
          ((error as ApiClientError | undefined)?.message ??
            "Unable to update doctor support permissions.")
        ),
      }));
    }
  };

  const handleCreate = async () => {
    if (!canManageStaff) {
      notifyWarning(
        manageStaffDisabledReason ?? 'Owner access is required before creating staff users.'
      );
      setCreateState(
        errorMutationState(
          manageStaffDisabledReason ?? 'Owner access is required before creating staff users.'
        )
      );
      return;
    }

    const parsed = createStaffFormSchema.safeParse({
      role,
      doctorWorkflowMode: role === "Doctor" ? doctorWorkflowMode : undefined,
      name,
      username,
      password,
    });

    if (!parsed.success) {
      const mappedErrors = mapZodFieldErrors(parsed.error);
      const nextErrors = {
        name: mappedErrors.name,
        username: mappedErrors.username,
        password: mappedErrors.password,
        doctorWorkflowMode: mappedErrors.doctorWorkflowMode,
      };
      setCreateFieldErrors(nextErrors);
      notifyError("Please fix the highlighted form errors.");
      setCreateState(
        errorMutationState('Please fix the highlighted form errors.')
      );
      return;
    }

    try {
      setCreateState(pendingMutationState());
      await createUser({
        name: name.trim(),
        email: username.trim(),
        password: password.trim(),
        role: role === 'Doctor' ? 'doctor' : 'assistant',
        ...(role === "Doctor" ? { doctorWorkflowMode } : {}),
        ...(role === "Doctor" && extraPermissions.length
          ? { extraPermissions }
          : {}),
      });
      resetCreateForm();
      await refreshStaffQueries();
      setCreateState(successMutationState('Staff user created.'));
      notifySuccess("Staff user created successfully.");
    } catch (error) {
      notifyError(
        ((error as unknown as ApiClientError | undefined)?.message ??
          'Unable to create staff user.')
      );
      setCreateState(
        errorMutationState(
          ((error as unknown as ApiClientError | undefined)?.message ??
            'Unable to create staff user.')
        )
      );
    }
  };

  const createFeedback = getMutationFeedback(createState, {
    pendingMessage: 'Creating staff user...',
    errorMessage: 'Unable to create staff user.',
  });

  return {
    role,
    setRole,
    name,
    setName,
    username,
    setUsername,
    password,
    setPassword,
    doctorWorkflowMode,
    setDoctorWorkflowMode,
    resetCreateForm,
    createFieldErrors,
    permissions,
    extraPermissions,
    toggleCreateExtraPermission,
    staffUsers,
    canManageStaff,
    manageStaffDisabledReason,
    handleCreate,
    getEditableExtraPermissions,
    toggleUserExtraPermission,
    saveUserExtraPermissions,
    getUserUpdateFeedback: (userId: string) =>
      getMutationFeedback(updateStates[userId] ?? idleMutationState(), {
        pendingMessage: "Saving doctor support permissions...",
        errorMessage: "Unable to update doctor support permissions.",
      }),
    isUpdatingUser: (userId: string) => (updateStates[userId]?.status ?? "idle") === "pending",
    loadState,
    createState,
    createFeedback,
    syncError: loadState.error ?? createState.error,
    isSyncing:
      currentUserQuery.isFetching ||
      usersQuery.isFetching ||
      auditLogsQuery.isFetching ||
      appointmentsQuery.isFetching,
    refresh: () => {
      void Promise.all([
        currentUserQuery.refetch(),
        refreshStaffQueries(),
      ]);
    },
  };
}
