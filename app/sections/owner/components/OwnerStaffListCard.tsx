import type { Dispatch, SetStateAction } from "react";
import type { PermissionKey, StaffUser } from "../types";
import { permissionLabels } from "../hooks/useOwnerAccess";
import { OwnerBadge } from "./OwnerBadge";

const INSET = "shadow-[inset_0_1px_0_rgba(255,255,255,0.45)]";

type OwnerStaffListCardProps = {
  staffUsers: StaffUser[];
  setStaffUsers: Dispatch<SetStateAction<StaffUser[]>>;
};

export function OwnerStaffListCard({ staffUsers, setStaffUsers }: OwnerStaffListCardProps) {
  return (
    <div className="ios-surface p-7 shadow-[0_22px_52px_rgba(15,23,42,0.12)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Staff list</p>
          <h2 className="mt-1 text-xl font-bold text-slate-900">Manage existing accounts</h2>
        </div>
        <OwnerBadge label={`${staffUsers.length} users`} tone="emerald" />
      </div>

      <div className="mt-6 grid gap-4">
        {!staffUsers.length ? (
          <div className={`rounded-2xl border border-slate-100 bg-white/70 px-5 py-6 text-sm font-semibold text-slate-500 ring-1 ring-slate-100 ${INSET}`}>
            No staff users are available yet. Refresh the live feed or create a staff account.
          </div>
        ) : staffUsers.map((user) => (
          <div
            key={user.id}
            className={`rounded-2xl border border-slate-100 bg-white/70 px-5 py-4 text-sm ring-1 ring-slate-100 ${INSET}`}
          >
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <OwnerBadge label={user.role} />
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
    </div>
  );
}
