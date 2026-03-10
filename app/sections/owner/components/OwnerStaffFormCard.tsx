import type { PermissionKey, Role } from "../types";
import { defaultPermissions, permissionLabels } from "../hooks/useOwnerAccess";
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
  setPermissions: (permissions: Record<PermissionKey, boolean>) => void;
  togglePermission: (key: PermissionKey) => void;
  presets: { label: string; set: () => void }[];
  onCreate: () => void;
  isSubmitting?: boolean;
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
  setPermissions,
  togglePermission,
  presets,
  onCreate,
  isSubmitting = false,
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
              setPermissions(defaultPermissions(nextRole));
            }}
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
            className={`rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition hover:border-sky-200 focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100 ${INSET}`}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-semibold text-slate-700">
          <span className="text-xs uppercase tracking-[0.18em] text-slate-500">Username</span>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className={`rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition hover:border-sky-200 focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100 ${INSET}`}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-semibold text-slate-700">
          <span className="text-xs uppercase tracking-[0.18em] text-slate-500">Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition hover:border-sky-200 focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100 ${INSET}`}
          />
        </label>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-2">
        {Object.entries(permissionLabels).map(([key, label]) => {
          const permissionKey = key as PermissionKey;
          return (
            <label
              key={permissionKey}
              className={`flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50/60 px-4 py-3 text-sm font-semibold text-slate-800 ring-1 ring-slate-100 ${INSET}`}
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
          onClick={onCreate}
          disabled={isSubmitting}
          className="rounded-full bg-[var(--ioc-blue)] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-[0_14px_30px_rgba(10,132,255,0.35)] transition hover:-translate-y-0.5 hover:bg-[#0070f0] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? "Creating user..." : "Create user"}
        </button>
      </div>
    </div>
  );
}
