'use client';

import Link from 'next/link';
import React, { useMemo, useState } from 'react';

type Role = 'Doctor' | 'Assistant';

type PermissionKey =
  | 'staffLogin'
  | 'doctorScreen'
  | 'assistantScreen'
  | 'ownerTools'
  | 'sharedDashboards';

type StaffUser = {
  id: string;
  role: Role;
  name: string;
  username: string;
  permissions: Record<PermissionKey, boolean>;
};

const SHADOWS = {
  card: 'shadow-[0_22px_52px_rgba(15,23,42,0.12)]',
  inset: 'shadow-[inset_0_1px_0_rgba(255,255,255,0.45)]',
} as const;

const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`ios-surface ${SHADOWS.card} ${className}`}>{children}</div>
);

const Badge = ({ label, tone = 'sky' }: { label: string; tone?: 'sky' | 'emerald' | 'amber' }) => {
  const tones = {
    sky: 'bg-sky-50 text-sky-700 ring-sky-100',
    emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
    amber: 'bg-amber-50 text-amber-700 ring-amber-100',
  } as const;
  return (
    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ring-1 ${tones[tone]}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
};

const defaultPermissions = (role: Role): Record<PermissionKey, boolean> =>
  role === 'Doctor'
    ? {
        staffLogin: true,
        doctorScreen: true,
        assistantScreen: true,
        sharedDashboards: true,
        ownerTools: false,
      }
    : {
        staffLogin: true,
        doctorScreen: false,
        assistantScreen: true,
        sharedDashboards: true,
        ownerTools: false,
      };

export default function OwnerTools() {
  const [role, setRole] = useState<Role>('Doctor');
  const [name, setName] = useState('Dr. Charuka Gamage');
  const [username, setUsername] = useState('dr.charuka');
  const [password, setPassword] = useState('medlink-123');
  const [permissions, setPermissions] = useState<Record<PermissionKey, boolean>>(defaultPermissions('Doctor'));

  const [staffUsers, setStaffUsers] = useState<StaffUser[]>([
    {
      id: 'u1',
      role: 'Doctor',
      name: 'Dr. Charuka Gamage',
      username: 'dr.charuka',
      permissions: { staffLogin: true, doctorScreen: true, assistantScreen: true, sharedDashboards: true, ownerTools: false },
    },
    {
      id: 'u2',
      role: 'Assistant',
      name: 'Ayoma (Assistant)',
      username: 'assistant1',
      permissions: { staffLogin: true, doctorScreen: false, assistantScreen: true, sharedDashboards: true, ownerTools: false },
    },
  ]);

  const togglePermission = (key: PermissionKey) => {
    setPermissions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleCreate = () => {
    const id = crypto.randomUUID();
    setStaffUsers((prev) => [...prev, { id, role, name, username, permissions }]);
  };

  const presets = useMemo(
    () => [
      {
        label: 'Doctor = owner',
        set: () =>
          setPermissions({ staffLogin: true, doctorScreen: true, assistantScreen: true, sharedDashboards: true, ownerTools: true }),
      },
      {
        label: 'Doctor + assistant',
        set: () => setPermissions({ staffLogin: true, doctorScreen: true, assistantScreen: false, sharedDashboards: true, ownerTools: false }),
      },
      {
        label: 'Assistant only',
        set: () => setPermissions({ staffLogin: true, doctorScreen: false, assistantScreen: true, sharedDashboards: true, ownerTools: false }),
      },
    ],
    []
  );

  const permissionLabels: Record<PermissionKey, string> = {
    staffLogin: 'Staff login page',
    doctorScreen: 'Doctor screen',
    assistantScreen: 'Assistant screen',
    ownerTools: 'Owner + user management',
    sharedDashboards: 'Shared dashboards & analytics',
  };

  return (
    <main className="relative isolate flex min-h-screen items-center justify-center px-4 py-6 text-slate-900">
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-white/60 via-sky-50/70 to-indigo-50" />
      <div className="absolute inset-0 -z-10 opacity-70" style={{ background: 'radial-gradient(circle at 30% 20%, rgba(10,132,255,0.12), transparent 35%), radial-gradient(circle at 75% 18%, rgba(137, 207, 240, 0.12), transparent 32%), radial-gradient(circle at 60% 70%, rgba(64, 224, 208, 0.1), transparent 40%)' }} />
      <div className="aspect-[16/9] w-full max-w-6xl overflow-hidden rounded-[30px] border border-white/70 bg-white/80 shadow-[0_26px_60px_rgba(15,23,42,0.14)] ring-1 ring-slate-100/80 backdrop-blur-2xl">
        <div className="flex h-full flex-col gap-6 overflow-auto px-6 py-7 lg:px-10">
          <header className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Badge label="Owner tools" />
              <Badge label="Staff" tone="emerald" />
              <Badge label="Access" tone="amber" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">Manage staff access</h1>
            <div className="flex flex-wrap gap-3 text-sm text-slate-600">
              <Link href="/login" className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 font-semibold text-slate-800 ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-md">
                ↩ Back to login
              </Link>
              <span className="inline-flex items-center gap-2 rounded-full bg-sky-50 px-3 py-2 font-semibold text-sky-800 ring-1 ring-sky-100">
                🔐 Owner only
              </span>
            </div>
          </header>

          <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <Card className="p-7">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Create staff</p>
                <h2 className="mt-1 text-xl font-bold text-slate-900">Add doctor or assistant credentials</h2>
              </div>
              <Badge label={role} />
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <label className="flex flex-col gap-1 text-sm font-semibold text-slate-700">
                <span className="text-xs uppercase tracking-[0.18em] text-slate-500">Role</span>
                <select
                  value={role}
                  onChange={(e) => {
                    const nextRole = e.target.value as Role;
                    setRole(nextRole);
                    setPermissions(defaultPermissions(nextRole));
                  }}
                  className={`rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition hover:border-sky-200 focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100 ${SHADOWS.inset}`}
                >
                  <option value="Doctor">Doctor</option>
                  <option value="Assistant">Assistant</option>
                </select>
              </label>
              <label className="flex flex-col gap-1 text-sm font-semibold text-slate-700">
                <span className="text-xs uppercase tracking-[0.18em] text-slate-500">Full name</span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition hover:border-sky-200 focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100 ${SHADOWS.inset}`}
                />
              </label>
              <label className="flex flex-col gap-1 text-sm font-semibold text-slate-700">
                <span className="text-xs uppercase tracking-[0.18em] text-slate-500">Username</span>
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className={`rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition hover:border-sky-200 focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100 ${SHADOWS.inset}`}
                />
              </label>
              <label className="flex flex-col gap-1 text-sm font-semibold text-slate-700">
                <span className="text-xs uppercase tracking-[0.18em] text-slate-500">Password</span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition hover:border-sky-200 focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100 ${SHADOWS.inset}`}
                />
              </label>
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-2">
              {Object.entries(permissionLabels).map(([key, label]) => {
                const permissionKey = key as PermissionKey;
                return (
                  <label
                    key={permissionKey}
                    className={`flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50/60 px-4 py-3 text-sm font-semibold text-slate-800 ring-1 ring-slate-100 ${SHADOWS.inset}`}
                  >
                    <span>{label}</span>
                    <input
                      type="checkbox"
                      checked={permissions[permissionKey]}
                      onChange={() => togglePermission(permissionKey)}
                      className="h-5 w-5 rounded-md border-slate-300 text-sky-600 focus:ring-sky-500"
                    />
                  </label>
                );
              })}
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              {presets.map((preset) => (
                <button
                  key={preset.label}
                  onClick={preset.set}
                  className="rounded-full bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-800 ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <div className="mt-6 flex items-center justify-between gap-3">
              <button
                onClick={handleCreate}
                className="rounded-full bg-sky-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-500/25 transition hover:-translate-y-0.5 hover:bg-sky-700"
              >
                Create user
              </button>
            </div>
          </Card>

          <Card className="p-7">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Staff list</p>
                <h2 className="mt-1 text-xl font-bold text-slate-900">Manage existing accounts</h2>
              </div>
              <Badge label={`${staffUsers.length} users`} tone="emerald" />
            </div>

            <div className="mt-6 grid gap-4">
              {staffUsers.map((user) => (
                <div
                  key={user.id}
                  className={`rounded-2xl border border-slate-100 bg-white/70 px-5 py-4 text-sm ring-1 ring-slate-100 ${SHADOWS.inset}`}
                >
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge label={user.role} />
                      <p className="text-base font-bold text-slate-900">{user.name}</p>
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-600 ring-1 ring-slate-200">
                        {user.username}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(user.permissions)
                        .filter(([, enabled]) => enabled)
                        .map(([key]) => (
                          <span
                            key={key}
                            className="rounded-full bg-sky-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-sky-700 ring-1 ring-sky-100"
                          >
                            {permissionLabels[key as PermissionKey]}
                          </span>
                        ))}
                    </div>
                  </div>

                  <div className="mt-3 grid gap-2 md:grid-cols-3">
                    {(Object.keys(permissionLabels) as PermissionKey[]).map((key) => (
                      <label key={key} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-700 ring-1 ring-slate-100">
                        <span>{permissionLabels[key]}</span>
                        <input
                          type="checkbox"
                          checked={user.permissions[key]}
                          onChange={() =>
                            setStaffUsers((prev) =>
                              prev.map((entry) =>
                                entry.id === user.id ? { ...entry, permissions: { ...entry.permissions, [key]: !entry.permissions[key] } } : entry
                              )
                            )
                          }
                          className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                        />
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
        </div>
      </div>
    </main>
  );
}
