import type { MutationFeedback } from "@/app/lib/async-state";
import type { DoctorSupportPermission, PermissionKey, StaffUser } from "../types";
import {
  doctorSupportPermissionLabels,
  DOCTOR_SUPPORT_PERMISSION_OPTIONS,
  permissionLabels,
} from "../hooks/useOwnerAccess";
import { OwnerBadge } from "./OwnerBadge";

const INSET = "shadow-[inset_0_1px_0_rgba(255,255,255,0.45)]";

type OwnerStaffListCardProps = {
  staffUsers: StaffUser[];
  canManageStaff?: boolean;
  getEditableExtraPermissions: (user: StaffUser) => DoctorSupportPermission[];
  onToggleExtraPermission: (userId: string, permission: DoctorSupportPermission) => void;
  onSaveUser: (user: StaffUser) => void;
  getUserFeedback: (userId: string) => MutationFeedback | null;
  isUpdatingUser: (userId: string) => boolean;
};

export function OwnerStaffListCard({
  staffUsers,
  canManageStaff = true,
  getEditableExtraPermissions,
  onToggleExtraPermission,
  onSaveUser,
  getUserFeedback,
  isUpdatingUser,
}: OwnerStaffListCardProps) {
  return (
    <div className="ios-surface p-7 shadow-[0_22px_52px_rgba(15,23,42,0.12)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Staff list</p>
          <h2 className="mt-1 text-xl font-bold text-slate-900">Manage existing accounts</h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Live staff entries reflect backend users plus recent audit and appointment activity. Doctor accounts can now carry explicit assistant-support overrides without changing their primary role.
          </p>
        </div>
        <OwnerBadge label={`${staffUsers.length} users`} tone="emerald" />
      </div>

      <div className="mt-6 grid gap-4">
        {!staffUsers.length ? (
          <div className={`rounded-2xl border border-slate-100 bg-white/70 px-5 py-6 text-sm font-semibold text-slate-500 ring-1 ring-slate-100 ${INSET}`}>
            No staff users are available yet. Refresh the live feed or create a staff account.
          </div>
        ) : staffUsers.map((user) => {
          const editableExtraPermissions = getEditableExtraPermissions(user);
          const userFeedback = getUserFeedback(user.id);
          const canEditOverrides = canManageStaff && user.role === "Doctor" && user.backendUserId !== null;

          return (
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
                  <div key={key} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-700 ring-1 ring-slate-100">
                    <span>{permissionLabels[key]}</span>
                    <span
                      className={`rounded-full px-2.5 py-1 ${
                        user.permissions[key]
                          ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100"
                          : "bg-slate-100 text-slate-500 ring-1 ring-slate-200"
                      }`}
                    >
                      {user.permissions[key] ? "Included" : "Not included"}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50/70 px-4 py-4 ring-1 ring-emerald-100">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                      Doctor support overrides
                    </p>
                    <p className="mt-1 text-sm text-emerald-900/80">
                      {user.role === "Doctor"
                        ? "Grant only the assistant-support actions this doctor should cover."
                        : "Custom support overrides are available only for doctor accounts."}
                    </p>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-700 ring-1 ring-emerald-200">
                    {user.role === "Doctor"
                      ? `${editableExtraPermissions.length} selected`
                      : "Not applicable"}
                  </span>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {DOCTOR_SUPPORT_PERMISSION_OPTIONS.map((permission) => {
                    const enabled = editableExtraPermissions.includes(permission);
                    const disabled = !canEditOverrides;

                    return (
                      <button
                        key={permission}
                        type="button"
                        disabled={disabled}
                        onClick={() => onToggleExtraPermission(user.id, permission)}
                        className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition ${
                          enabled
                            ? "border-emerald-200 bg-white text-emerald-900 ring-1 ring-emerald-100"
                            : "border-emerald-100 bg-emerald-50/60 text-emerald-900/80 ring-1 ring-emerald-100"
                        } ${disabled ? "cursor-not-allowed opacity-70" : "hover:-translate-y-0.5"}`}
                      >
                        <span>{doctorSupportPermissionLabels[permission]}</span>
                        <span
                          className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${
                            enabled ? "bg-emerald-100 text-emerald-800" : "bg-white text-emerald-700"
                          }`}
                        >
                          {enabled ? "Included" : "Optional"}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="text-sm text-emerald-900/80">
                    {!canManageStaff
                      ? "Owner access is required before editing support overrides."
                      : user.role !== "Doctor"
                        ? "Assistant accounts keep their standard role access."
                        : user.backendUserId === null
                          ? "This entry is visible from activity feeds only. Refresh the backend users feed before editing."
                          : "Changes save directly to the backend permission-override model."}
                  </div>
                  <button
                    type="button"
                    onClick={() => onSaveUser(user)}
                    disabled={!canEditOverrides || isUpdatingUser(user.id)}
                    className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(5,150,105,0.24)] transition hover:-translate-y-0.5 hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {isUpdatingUser(user.id) ? "Saving..." : "Save overrides"}
                  </button>
                </div>

                {userFeedback ? (
                  <p
                    className={`mt-3 text-sm font-semibold ${
                      userFeedback.tone === "error"
                        ? "text-rose-600"
                        : userFeedback.tone === "success"
                          ? "text-emerald-700"
                          : "text-slate-600"
                    }`}
                  >
                    {userFeedback.message}
                  </p>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
