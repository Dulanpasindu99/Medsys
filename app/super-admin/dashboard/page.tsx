'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  FiActivity,
  FiBriefcase,
  FiCheckCircle,
  FiChevronRight,
  FiEdit2,
  FiFolder,
  FiPlus,
  FiSlash,
  FiUserPlus,
  FiUsers,
  FiX,
} from 'react-icons/fi';

type Counts = { owners: number; doctors: number; assistants: number };
type AdminOrg = {
  id: string;
  slug: string;
  name: string;
  is_active: boolean;
  operating_mode: 'standard' | 'step_up';
  created_at: string;
  counts: Counts;
};
type AdminUser = {
  id: number;
  name: string;
  email: string;
  role: 'owner' | 'doctor' | 'assistant';
  is_active: boolean;
  doctor_workflow_mode: string | null;
  created_at: string;
};

async function adminGet<T>(path: string): Promise<T> {
  const res = await fetch(`/api/admin/${path}`, { cache: 'no-store' });
  if (res.status === 401) {
    throw new Error('UNAUTHORIZED');
  }
  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as { error?: string; message?: string } | null;
    throw new Error(data?.message ?? data?.error ?? 'Request failed.');
  }
  return res.json() as Promise<T>;
}

async function adminSend<T>(path: string, method: string, body: unknown): Promise<T> {
  const res = await fetch(`/api/admin/${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => null)) as Record<string, unknown> | null;
  if (!res.ok) {
    throw new Error((data?.message as string) ?? (data?.error as string) ?? 'Request failed.');
  }
  return data as T;
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-[0_30px_70px_rgba(2,6,23,0.4)]">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}

const inputCls =
  'h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-sm font-semibold text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-2 focus:ring-sky-100';
const labelCls = 'block space-y-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500';

const ROLE_META: Record<AdminUser['role'], { label: string; icon: React.ReactNode; tone: string }> = {
  owner: { label: 'Owners', icon: <FiBriefcase className="h-4 w-4" />, tone: 'text-amber-700 bg-amber-50 ring-amber-100' },
  doctor: { label: 'Doctors', icon: <FiActivity className="h-4 w-4" />, tone: 'text-sky-700 bg-sky-50 ring-sky-100' },
  assistant: { label: 'Assistants', icon: <FiUsers className="h-4 w-4" />, tone: 'text-violet-700 bg-violet-50 ring-violet-100' },
};

export default function SuperAdminDashboardPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [showNewOrg, setShowNewOrg] = useState(false);
  const [newUserRole, setNewUserRole] = useState<AdminUser['role'] | null>(null);
  const [editUser, setEditUser] = useState<AdminUser | null>(null);
  const [banner, setBanner] = useState<{ tone: 'ok' | 'err'; text: string } | null>(null);

  const me = useQuery({
    queryKey: ['admin', 'me'],
    queryFn: () => adminGet<{ admin: { username: string; display_name: string } }>('me'),
    retry: false,
  });

  const orgsQuery = useQuery({
    queryKey: ['admin', 'organizations'],
    queryFn: () => adminGet<{ organizations: AdminOrg[] }>('organizations'),
    retry: false,
    enabled: me.isSuccess,
  });

  useEffect(() => {
    if (me.isError || orgsQuery.isError) {
      const msg = (me.error as Error | undefined)?.message ?? (orgsQuery.error as Error | undefined)?.message;
      if (msg === 'UNAUTHORIZED') {
        router.replace('/super-admin');
      }
    }
  }, [me.isError, orgsQuery.isError, me.error, orgsQuery.error, router]);

  const orgs = orgsQuery.data?.organizations ?? [];
  useEffect(() => {
    if (!selectedOrgId && orgs.length) {
      setSelectedOrgId(orgs[0].id);
    }
  }, [orgs, selectedOrgId]);

  const selectedOrg = useMemo(() => orgs.find((o) => o.id === selectedOrgId) ?? null, [orgs, selectedOrgId]);

  const usersQuery = useQuery({
    queryKey: ['admin', 'org-users', selectedOrgId],
    queryFn: () => adminGet<{ users: AdminUser[] }>(`organizations/${selectedOrgId}/users`),
    enabled: Boolean(selectedOrgId),
    retry: false,
  });

  const flash = (tone: 'ok' | 'err', text: string) => {
    setBanner({ tone, text });
    setTimeout(() => setBanner(null), 3500);
  };
  const refreshOrgs = () => queryClient.invalidateQueries({ queryKey: ['admin', 'organizations'] });
  const refreshUsers = () => queryClient.invalidateQueries({ queryKey: ['admin', 'org-users', selectedOrgId] });

  const createOrg = useMutation({
    mutationFn: (body: Record<string, unknown>) => adminSend('organizations', 'POST', body),
    onSuccess: () => {
      refreshOrgs();
      setShowNewOrg(false);
      flash('ok', 'Medical center created.');
    },
    onError: (e: Error) => flash('err', e.message),
  });
  const updateOrg = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) =>
      adminSend(`organizations/${id}`, 'PATCH', body),
    onSuccess: () => {
      refreshOrgs();
      flash('ok', 'Medical center updated.');
    },
    onError: (e: Error) => flash('err', e.message),
  });
  const createUser = useMutation({
    mutationFn: (body: Record<string, unknown>) => adminSend(`organizations/${selectedOrgId}/users`, 'POST', body),
    onSuccess: () => {
      refreshUsers();
      refreshOrgs();
      setNewUserRole(null);
      flash('ok', 'Staff member created.');
    },
    onError: (e: Error) => flash('err', e.message),
  });
  const updateUser = useMutation({
    mutationFn: ({ id, body }: { id: number; body: Record<string, unknown> }) =>
      adminSend(`users/${id}`, 'PATCH', body),
    onSuccess: () => {
      refreshUsers();
      setEditUser(null);
      flash('ok', 'Staff member updated.');
    },
    onError: (e: Error) => flash('err', e.message),
  });

  const logout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.replace('/super-admin');
  };

  const users = usersQuery.data?.users ?? [];
  const grouped = (role: AdminUser['role']) => users.filter((u) => u.role === role);

  return (
    <main className="flex min-h-dvh flex-col bg-slate-100">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3.5 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-blue-700 text-white">
            <FiFolder className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-bold text-slate-900">Medlink Super Admin</p>
            <p className="text-[11px] text-slate-500">Manage all medical centers and their staff</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-xs font-semibold text-slate-500 sm:inline">
            {me.data?.admin.display_name ?? '…'}
          </span>
          <button
            type="button"
            onClick={logout}
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-slate-600 transition hover:bg-slate-50"
          >
            Log out
          </button>
        </div>
      </header>

      {banner ? (
        <div
          className={`mx-6 mt-3 rounded-xl px-4 py-2.5 text-sm font-semibold ${
            banner.tone === 'ok'
              ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border border-rose-200 bg-rose-50 text-rose-700'
          }`}
        >
          {banner.text}
        </div>
      ) : null}

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 p-4 lg:grid-cols-[320px_minmax(0,1fr)] lg:p-6">
        {/* Left: Medical Centers (Finder folders) */}
        <aside className="flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Medical Centers</p>
            <button
              type="button"
              onClick={() => setShowNewOrg(true)}
              className="inline-flex items-center gap-1 rounded-full bg-slate-900 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.1em] text-white transition hover:bg-slate-800"
            >
              <FiPlus className="h-3.5 w-3.5" /> New
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-2">
            {orgsQuery.isPending ? (
              <p className="px-3 py-4 text-sm text-slate-400">Loading…</p>
            ) : orgs.length === 0 ? (
              <p className="px-3 py-4 text-sm text-slate-400">No medical centers yet. Create one to begin.</p>
            ) : (
              orgs.map((org) => {
                const active = org.id === selectedOrgId;
                const totalStaff = org.counts.owners + org.counts.doctors + org.counts.assistants;
                return (
                  <button
                    key={org.id}
                    type="button"
                    onClick={() => setSelectedOrgId(org.id)}
                    className={`mb-1 flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition ${
                      active ? 'bg-sky-50 ring-1 ring-sky-200' : 'hover:bg-slate-50'
                    }`}
                  >
                    <FiFolder className={`h-5 w-5 shrink-0 ${active ? 'text-sky-600' : 'text-slate-400'}`} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="truncate text-sm font-semibold text-slate-900">{org.name}</span>
                        {!org.is_active ? (
                          <span className="rounded-full bg-rose-100 px-1.5 py-0.5 text-[9px] font-bold uppercase text-rose-600">
                            Off
                          </span>
                        ) : null}
                      </span>
                      <span className="block truncate text-[11px] text-slate-500">
                        {totalStaff} staff · {org.operating_mode === 'step_up' ? 'Step Up' : 'Standard'}
                      </span>
                    </span>
                    <FiChevronRight className={`h-4 w-4 shrink-0 ${active ? 'text-sky-500' : 'text-slate-300'}`} />
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* Right: selected center detail */}
        <section className="flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          {!selectedOrg ? (
            <div className="flex flex-1 items-center justify-center text-sm text-slate-400">
              Select a medical center to manage its staff.
            </div>
          ) : (
            <div className="min-h-0 flex-1 overflow-y-auto p-5 lg:p-6">
              <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{selectedOrg.name}</h2>
                  <p className="mt-0.5 text-sm text-slate-500">/{selectedOrg.slug}</p>
                  <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-semibold">
                    <span className={`rounded-full px-2.5 py-1 ring-1 ${selectedOrg.is_active ? 'bg-emerald-50 text-emerald-700 ring-emerald-100' : 'bg-rose-50 text-rose-700 ring-rose-100'}`}>
                      {selectedOrg.is_active ? 'Active' : 'Disabled'}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600 ring-1 ring-slate-200">
                      {selectedOrg.operating_mode === 'step_up' ? 'Step Up mode' : 'Standard mode'}
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      updateOrg.mutate({
                        id: selectedOrg.id,
                        body: { operatingMode: selectedOrg.operating_mode === 'step_up' ? 'standard' : 'step_up' },
                      })
                    }
                    className="rounded-full border border-slate-200 bg-white px-3 py-2 text-[11px] font-bold uppercase tracking-[0.1em] text-slate-600 transition hover:bg-slate-50"
                  >
                    {selectedOrg.operating_mode === 'step_up' ? 'Switch to Standard' : 'Switch to Step Up'}
                  </button>
                  <button
                    type="button"
                    onClick={() => updateOrg.mutate({ id: selectedOrg.id, body: { isActive: !selectedOrg.is_active } })}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-[11px] font-bold uppercase tracking-[0.1em] transition ${
                      selectedOrg.is_active
                        ? 'border border-rose-200 bg-white text-rose-600 hover:bg-rose-50'
                        : 'border border-emerald-200 bg-white text-emerald-600 hover:bg-emerald-50'
                    }`}
                  >
                    {selectedOrg.is_active ? <FiSlash className="h-3.5 w-3.5" /> : <FiCheckCircle className="h-3.5 w-3.5" />}
                    {selectedOrg.is_active ? 'Disable center' : 'Enable center'}
                  </button>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setNewUserRole('doctor')}
                  className="inline-flex items-center gap-1.5 rounded-full bg-sky-600 px-3.5 py-2 text-[11px] font-bold uppercase tracking-[0.1em] text-white transition hover:bg-sky-700"
                >
                  <FiUserPlus className="h-3.5 w-3.5" /> Add Doctor
                </button>
                <button
                  type="button"
                  onClick={() => setNewUserRole('assistant')}
                  className="inline-flex items-center gap-1.5 rounded-full bg-violet-600 px-3.5 py-2 text-[11px] font-bold uppercase tracking-[0.1em] text-white transition hover:bg-violet-700"
                >
                  <FiUserPlus className="h-3.5 w-3.5" /> Add Assistant
                </button>
                <button
                  type="button"
                  onClick={() => setNewUserRole('owner')}
                  className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-white px-3.5 py-2 text-[11px] font-bold uppercase tracking-[0.1em] text-amber-700 transition hover:bg-amber-50"
                >
                  <FiUserPlus className="h-3.5 w-3.5" /> Add Owner
                </button>
              </div>

              {(['owner', 'doctor', 'assistant'] as const).map((role) => (
                <div key={role} className="mt-5">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] ring-1 ${ROLE_META[role].tone}`}>
                      {ROLE_META[role].icon} {ROLE_META[role].label}
                    </span>
                    <span className="text-xs font-semibold text-slate-400">{grouped(role).length}</span>
                  </div>
                  <div className="mt-2 space-y-2">
                    {usersQuery.isPending ? (
                      <p className="text-sm text-slate-400">Loading…</p>
                    ) : grouped(role).length === 0 ? (
                      <p className="rounded-xl bg-slate-50 px-3 py-2.5 text-xs text-slate-400 ring-1 ring-slate-100">
                        No {ROLE_META[role].label.toLowerCase()} yet.
                      </p>
                    ) : (
                      grouped(role).map((u) => (
                        <div
                          key={u.id}
                          className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-white px-4 py-3 ring-1 ring-slate-100"
                        >
                          <div className="min-w-0">
                            <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                              <span className="truncate">{u.name}</span>
                              {!u.is_active ? (
                                <span className="rounded-full bg-rose-100 px-1.5 py-0.5 text-[9px] font-bold uppercase text-rose-600">
                                  Disabled
                                </span>
                              ) : null}
                            </p>
                            <p className="truncate text-xs text-slate-500">{u.email}</p>
                          </div>
                          <div className="flex shrink-0 gap-1.5">
                            <button
                              type="button"
                              onClick={() => setEditUser(u)}
                              className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-600 transition hover:bg-slate-50"
                            >
                              <FiEdit2 className="h-3 w-3" /> Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => updateUser.mutate({ id: u.id, body: { isActive: !u.is_active } })}
                              className={`rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.1em] transition ${
                                u.is_active
                                  ? 'border border-rose-200 bg-white text-rose-600 hover:bg-rose-50'
                                  : 'border border-emerald-200 bg-white text-emerald-600 hover:bg-emerald-50'
                              }`}
                            >
                              {u.is_active ? 'Disable' : 'Enable'}
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {showNewOrg ? (
        <NewOrgModal onClose={() => setShowNewOrg(false)} onSubmit={(b) => createOrg.mutate(b)} pending={createOrg.isPending} />
      ) : null}
      {newUserRole && selectedOrg ? (
        <NewUserModal
          role={newUserRole}
          orgName={selectedOrg.name}
          onClose={() => setNewUserRole(null)}
          onSubmit={(b) => createUser.mutate(b)}
          pending={createUser.isPending}
        />
      ) : null}
      {editUser ? (
        <EditUserModal
          user={editUser}
          onClose={() => setEditUser(null)}
          onSubmit={(b) => updateUser.mutate({ id: editUser.id, body: b })}
          pending={updateUser.isPending}
        />
      ) : null}
    </main>
  );
}

function NewOrgModal({
  onClose,
  onSubmit,
  pending,
}: {
  onClose: () => void;
  onSubmit: (body: Record<string, unknown>) => void;
  pending: boolean;
}) {
  const [f, setF] = useState({
    organizationName: '',
    organizationSlug: '',
    ownerName: '',
    ownerEmail: '',
    ownerPassword: '',
    operatingMode: 'standard',
  });
  const set = (k: string, v: string) => setF((p) => ({ ...p, [k]: v }));
  return (
    <Modal title="New Medical Center" onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit(f);
        }}
        className="space-y-3"
      >
        <label className={labelCls}>
          <span>Center name</span>
          <input className={inputCls} value={f.organizationName} onChange={(e) => set('organizationName', e.target.value)} required />
        </label>
        <label className={labelCls}>
          <span>Slug (lowercase, no spaces)</span>
          <input className={inputCls} value={f.organizationSlug} onChange={(e) => set('organizationSlug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))} required />
        </label>
        <div className="h-px bg-slate-100" />
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">First owner account</p>
        <label className={labelCls}>
          <span>Owner full name</span>
          <input className={inputCls} value={f.ownerName} onChange={(e) => set('ownerName', e.target.value)} required />
        </label>
        <label className={labelCls}>
          <span>Owner email</span>
          <input type="email" className={inputCls} value={f.ownerEmail} onChange={(e) => set('ownerEmail', e.target.value)} required />
        </label>
        <label className={labelCls}>
          <span>Owner password (min 8)</span>
          <input className={inputCls} value={f.ownerPassword} onChange={(e) => set('ownerPassword', e.target.value)} required minLength={8} />
        </label>
        <label className={labelCls}>
          <span>Operating mode</span>
          <select className={inputCls} value={f.operatingMode} onChange={(e) => set('operatingMode', e.target.value)}>
            <option value="standard">Standard</option>
            <option value="step_up">Step Up</option>
          </select>
        </label>
        <button type="submit" disabled={pending} className="mt-1 h-11 w-full rounded-xl bg-sky-600 text-sm font-bold uppercase tracking-[0.12em] text-white transition hover:bg-sky-700 disabled:opacity-70">
          {pending ? 'Creating…' : 'Create medical center'}
        </button>
      </form>
    </Modal>
  );
}

function NewUserModal({
  role,
  orgName,
  onClose,
  onSubmit,
  pending,
}: {
  role: 'owner' | 'doctor' | 'assistant';
  orgName: string;
  onClose: () => void;
  onSubmit: (body: Record<string, unknown>) => void;
  pending: boolean;
}) {
  const [f, setF] = useState({ name: '', email: '', password: '', doctorWorkflowMode: 'self_service' });
  const set = (k: string, v: string) => setF((p) => ({ ...p, [k]: v }));
  const roleLabel = role.charAt(0).toUpperCase() + role.slice(1);
  return (
    <Modal title={`Add ${roleLabel} — ${orgName}`} onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit({
            name: f.name,
            email: f.email,
            password: f.password,
            role,
            ...(role === 'doctor' ? { doctorWorkflowMode: f.doctorWorkflowMode } : {}),
          });
        }}
        className="space-y-3"
      >
        <label className={labelCls}>
          <span>Full name</span>
          <input className={inputCls} value={f.name} onChange={(e) => set('name', e.target.value)} required />
        </label>
        <label className={labelCls}>
          <span>Login email</span>
          <input type="email" className={inputCls} value={f.email} onChange={(e) => set('email', e.target.value)} required />
        </label>
        <label className={labelCls}>
          <span>Password (min 8)</span>
          <input className={inputCls} value={f.password} onChange={(e) => set('password', e.target.value)} required minLength={8} />
        </label>
        {role === 'doctor' ? (
          <label className={labelCls}>
            <span>Workflow mode</span>
            <select className={inputCls} value={f.doctorWorkflowMode} onChange={(e) => set('doctorWorkflowMode', e.target.value)}>
              <option value="self_service">Walk-in (self service)</option>
              <option value="clinic_supported">Appointment (clinic supported)</option>
            </select>
          </label>
        ) : null}
        <button type="submit" disabled={pending} className="mt-1 h-11 w-full rounded-xl bg-slate-900 text-sm font-bold uppercase tracking-[0.12em] text-white transition hover:bg-slate-800 disabled:opacity-70">
          {pending ? 'Creating…' : `Create ${roleLabel.toLowerCase()}`}
        </button>
      </form>
    </Modal>
  );
}

function EditUserModal({
  user,
  onClose,
  onSubmit,
  pending,
}: {
  user: AdminUser;
  onClose: () => void;
  onSubmit: (body: Record<string, unknown>) => void;
  pending: boolean;
}) {
  const [email, setEmail] = useState(user.email);
  const [password, setPassword] = useState('');
  return (
    <Modal title={`Edit ${user.name}`} onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const body: Record<string, unknown> = {};
          if (email.trim() && email.trim() !== user.email) body.email = email.trim();
          if (password.trim()) body.password = password.trim();
          if (Object.keys(body).length === 0) {
            onClose();
            return;
          }
          onSubmit(body);
        }}
        className="space-y-3"
      >
        <label className={labelCls}>
          <span>Login email</span>
          <input type="email" className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className={labelCls}>
          <span>New password (leave blank to keep)</span>
          <input className={inputCls} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
        </label>
        <button type="submit" disabled={pending} className="mt-1 h-11 w-full rounded-xl bg-sky-600 text-sm font-bold uppercase tracking-[0.12em] text-white transition hover:bg-sky-700 disabled:opacity-70">
          {pending ? 'Saving…' : 'Save changes'}
        </button>
      </form>
    </Modal>
  );
}
