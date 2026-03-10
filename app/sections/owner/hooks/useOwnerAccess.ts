'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  getCurrentUser,
  listAppointments,
  listAuditLogs,
  type ApiClientError,
} from '../../../lib/api-client';
import {
  emptyLoadState,
  errorMutationState,
  errorLoadState,
  idleMutationState,
  loadingLoadState,
  pendingMutationState,
  readyLoadState,
  successMutationState,
  type LoadState,
  type MutationState,
} from '../../../lib/async-state';
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
    const id = toString(actorId ?? `${role.toLowerCase()}-${username}-${index}`);
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

function mergeStaff(primary: StaffUser[], secondary: StaffUser[]) {
  const merged = new Map<string, StaffUser>();
  [...primary, ...secondary].forEach((user) => {
    merged.set(`${user.role}:${user.username.toLowerCase()}`, user);
  });
  return Array.from(merged.values());
}

export function useOwnerAccess() {
  const [role, setRole] = useState<Role>('Doctor');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [permissions, setPermissions] = useState<Record<PermissionKey, boolean>>(
    defaultPermissions('Doctor')
  );
  const [staffUsers, setStaffUsers] = useState<StaffUser[]>([]);
  const [loadState, setLoadState] = useState<LoadState>(loadingLoadState());
  const [createState, setCreateState] = useState<MutationState>(idleMutationState());

  const presets = useMemo(
    () => [
      { label: 'Doctor defaults', set: () => setPermissions(defaultPermissions('Doctor')) },
      { label: 'Assistant defaults', set: () => setPermissions(defaultPermissions('Assistant')) },
      {
        label: 'All access',
        set: () =>
          setPermissions({
            staffLogin: true,
            doctorScreen: true,
            assistantScreen: true,
            ownerTools: true,
            sharedDashboards: true,
          }),
      },
    ],
    []
  );

  const refresh = async () => {
    setLoadState(loadingLoadState());
    try {
      const [currentUserResult, auditResult, appointmentsResult] = await Promise.allSettled([
        getCurrentUser(),
        listAuditLogs({ limit: 200 }),
        listAppointments(),
      ]);

      if (currentUserResult.status === "rejected") {
        setStaffUsers([]);
        setLoadState(errorLoadState("Unable to verify owner access for staff management."));
        return;
      }

      const currentUser = currentUserResult.value;

      if (currentUser?.role && currentUser.role !== 'owner') {
        setStaffUsers([]);
        setLoadState(errorLoadState('Owner role is required to manage staff.'));
        return;
      }

      if (auditResult.status === "rejected" && appointmentsResult.status === "rejected") {
        setStaffUsers([]);
        setLoadState(errorLoadState("Unable to sync staff data."));
        return;
      }

      const liveFromAudit =
        auditResult.status === "fulfilled" ? normalizeAuditStaff(auditResult.value) : [];
      const liveFromAppointments =
        appointmentsResult.status === "fulfilled"
          ? normalizeStaffFromAppointments(appointmentsResult.value)
          : [];
      const liveStaff = mergeStaff(liveFromAudit, liveFromAppointments);
      const localUsers = staffUsers.filter((user) => user.id.startsWith('local-'));
      const nextUsers = mergeStaff(localUsers, liveStaff);
      const partialNotice =
        auditResult.status === "rejected" || appointmentsResult.status === "rejected"
          ? "Some staff activity feeds failed and partial access data is being shown."
          : null;

      setStaffUsers(nextUsers);
      setLoadState(nextUsers.length ? readyLoadState(partialNotice) : emptyLoadState(partialNotice));
    } catch (error) {
      const message = (error as ApiClientError)?.message ?? 'Unable to sync staff data.';
      setStaffUsers([]);
      setLoadState(errorLoadState(message));
    }
  };

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void refresh();
    }, 0);
    return () => {
      window.clearTimeout(timeoutId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const togglePermission = (key: PermissionKey) => {
    setPermissions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleCreate = () => {
    if (!name.trim() || !username.trim() || !password.trim()) {
      setCreateState(
        errorMutationState('Name, username, and password are required.')
      );
      return;
    }

    setCreateState(pendingMutationState());
    const nextUser: StaffUser = {
      id: `local-${Date.now()}`,
      role,
      name: name.trim(),
      username: username.trim(),
      permissions: { ...permissions },
    };

    setStaffUsers((prev) => mergeStaff([nextUser], prev));
    setName('');
    setUsername('');
    setPassword('');
    setPermissions(defaultPermissions(role));
    setCreateState(successMutationState('Local staff draft created.'));
    setLoadState(readyLoadState(loadState.notice));
  };

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
    setPermissions,
    staffUsers,
    setStaffUsers,
    presets,
    togglePermission,
    handleCreate,
    loadState,
    createState,
    syncError: loadState.error ?? createState.error,
    isSyncing: loadState.status === 'loading',
    refresh,
  };
}
