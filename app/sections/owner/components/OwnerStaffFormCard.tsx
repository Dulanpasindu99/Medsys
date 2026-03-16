import type { PermissionKey, Role } from "../types";
import { permissionLabels } from "../hooks/useOwnerAccess";
import { OwnerBadge } from "./OwnerBadge";

const INSET = "shadow-[inset_0_1px_0_rgba(255,255,255,0.45)]";

type OwnerStaffFormCardProps = {
  role: Role;
  setRole: (role: Role) => void;
  name: string;
  setName: (name: string) => void;
  username: string;
  setUsername: (username: string) => void;
  password: string;
  setPassword: (password: string) => void;
  permissions: Record<PermissionKey, boolean>;
  onCreate: () => void;
  isSubmitting?: boolean;
  canManageStaff?: boolean;
  manageStaffDisabledReason?: string | null;
};

export function OwnerStaffFormCard({
  role,
  setRole,
  name,
  setName,
  username,
  setUsername,
  password,
  setPassword,
  permissions,
  onCreate,
  isSubmitting = false,
  canManageStaff = true,
  manageStaffDisabledReason = null,
}: OwnerStaffFormCardProps) {
  return (
    <div className="ios-surface p-7 shadow-[0_22px_52px_rgba(15,23,42,0.12)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Create staff</p>
          <h2 className="mt-1 text-xl font-bold text-slate-900">Add doctor or assistant credentials</h2>
        </div>
        <OwnerBadge label={role} />
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm font-semibold text-slate-700">
          <span className="text-xs uppercase tracking-[0.18em] text-slate-500">Role</span>
          <select
            value={role}
            onChange={(e) => {
              const nextRole = e.target.value as Role;
              setRole(nextRole);
            }}
            disabled={!canManageStaff}
            className={`rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition hover:border-sky-200 focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100 ${INSET}`}
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
            disabled={!canManageStaff}
            className={`rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition hover:border-sky-200 focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100 ${INSET}`}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-semibold text-slate-700">
          <span className="text-xs uppercase tracking-[0.18em] text-slate-500">Email</span>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={!canManageStaff}
            className={`rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition hover:border-sky-200 focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100 ${INSET}`}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-semibold text-slate-700">
          <span className="text-xs uppercase tracking-[0.18em] text-slate-500">Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={!canManageStaff}
            className={`rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition hover:border-sky-200 focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100 ${INSET}`}
          />
        </label>
      </div>

      <div className="mt-6 rounded-2xl border border-sky-100 bg-sky-50/80 px-4 py-3 text-sm text-sky-900 ring-1 ring-sky-100">
        New staff accounts inherit backend role-based access. Custom per-user permission editing is not available in the live API yet, so this section is a preview of what the selected role receives.
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-2">
        {Object.entries(permissionLabels).map(([key, label]) => {
          const permissionKey = key as PermissionKey;
          const enabled = permissions[permissionKey];
          return (
            <div
              key={permissionKey}
              className={`flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50/60 px-4 py-3 text-sm font-semibold text-slate-800 ring-1 ring-slate-100 ${INSET}`}
            >
              <span>{label}</span>
              <span
                className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${
                  enabled
                    ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100"
                    : "bg-slate-100 text-slate-500 ring-1 ring-slate-200"
                }`}
              >
                {enabled ? "Included" : "Not included"}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex items-center justify-between gap-3">
        <button
          onClick={onCreate}
          disabled={isSubmitting || !canManageStaff}
          className="rounded-full bg-[var(--ioc-blue)] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-[0_14px_30px_rgba(10,132,255,0.35)] transition hover:-translate-y-0.5 hover:bg-[#0070f0] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? "Creating user..." : "Create user"}
        </button>
      </div>
      {!canManageStaff && manageStaffDisabledReason ? (
        <p className="mt-3 text-sm font-semibold text-amber-700">{manageStaffDisabledReason}</p>
      ) : null}
    </div>
  );
}
