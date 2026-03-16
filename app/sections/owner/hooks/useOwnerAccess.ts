'use client';

import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from 'react';
import {
  createUser,
  type ApiClientError,
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
import type { PermissionKey, Role, StaffUser } from '../types';

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
      unique.set(key, {
        id: `live-${role.toLowerCase()}-${id}`,
        role,
        name,
        username,
        permissions: defaultPermissions(role),
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
    unique.set(key, {
      id: `live-${role.toLowerCase()}-${rawId}`,
      role,
      name,
      username,
      permissions: defaultPermissions(role),
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

      return {
        id: `user-${id}`,
        role,
        name,
        username: email || name,
        permissions: defaultPermissions(role),
      } satisfies StaffUser;
    })
    .filter((user): user is StaffUser => !!user);
}

function mergeStaff(primary: StaffUser[], secondary: StaffUser[]) {
  const merged = new Map<string, StaffUser>();
  [...primary, ...secondary].forEach((user) => {
    merged.set(`${user.role}:${user.username.toLowerCase()}`, user);
  });
  return Array.from(merged.values());
}

export function useOwnerAccess() {
  const queryClient = useQueryClient();
  const currentUserQuery = useCurrentUserQuery();
  const usersQuery = useUsersQuery();
  const auditLogsQuery = useAuditLogsQuery({ limit: 200 });
  const appointmentsQuery = useAppointmentsQuery();
  const [role, setRoleState] = useState<Role>('Doctor');
  const [name, setNameState] = useState('');
  const [username, setUsernameState] = useState('');
  const [password, setPasswordState] = useState('');
  const [createState, setCreateState] = useState<MutationState>(idleMutationState());
  const permissions = useMemo(() => defaultPermissions(role), [role]);
  const canManageStaff = currentUserQuery.data?.role === 'owner';
  const manageStaffDisabledReason =
    currentUserQuery.isPending || currentUserQuery.isFetching
      ? 'Checking owner access before managing staff.'
      : currentUserQuery.data?.role && currentUserQuery.data.role !== 'owner'
        ? 'Only owner accounts can create staff users.'
        : null;

  const clearCreateState = () => {
    setCreateState((current) => (current.status === 'idle' ? current : idleMutationState()));
  };

  const setRole = (value: Role) => {
    clearCreateState();
    setRoleState(value);
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
    if (currentUser?.role && currentUser.role !== 'owner') {
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
      usersQuery.isError || auditLogsQuery.isError || appointmentsQuery.isError
        ? "Some staff feeds failed and partial access data is being shown."
        : null;
    return staffUsers.length ? readyLoadState(partialNotice) : emptyLoadState(partialNotice);
  }, [
    appointmentsQuery.error,
    appointmentsQuery.isError,
    appointmentsQuery.isPending,
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
      queryClient.invalidateQueries({ queryKey: queryKeys.audit.logs() }),
      queryClient.invalidateQueries({ queryKey: queryKeys.appointments.list() }),
      usersQuery.refetch(),
      auditLogsQuery.refetch(),
      appointmentsQuery.refetch(),
    ]);
  };

  const handleCreate = async () => {
    if (!canManageStaff) {
      setCreateState(
        errorMutationState(
          manageStaffDisabledReason ?? 'Owner access is required before creating staff users.'
        )
      );
      return;
    }

    if (!name.trim() || !username.trim() || !password.trim()) {
      setCreateState(
        errorMutationState('Name, username, and password are required.')
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
      });
      setName('');
      setUsername('');
      setPassword('');
      await refreshStaffQueries();
      setCreateState(successMutationState('Staff user created.'));
    } catch (error) {
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
    permissions,
    staffUsers,
    canManageStaff,
    manageStaffDisabledReason,
    handleCreate,
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
