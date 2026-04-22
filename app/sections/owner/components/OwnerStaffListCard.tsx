import { useMemo, useState } from "react";
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
  const [activeUserId, setActiveUserId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);
  const activeUser = useMemo(
    () => staffUsers.find((entry) => entry.id === activeUserId) ?? null,
    [activeUserId, staffUsers]
  );
  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return staffUsers;
    return staffUsers.filter((user) => {
      const name = user.name.toLowerCase();
      const username = user.username.toLowerCase();
      const role = user.role.toLowerCase();
      return name.includes(term) || username.includes(term) || role.includes(term);
    });
  }, [search, staffUsers]);
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / rowsPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const pagedUsers = useMemo(() => {
    const start = (safePage - 1) * rowsPerPage;
    return filteredUsers.slice(start, start + rowsPerPage);
  }, [filteredUsers, rowsPerPage, safePage]);

  return (
    <div className="ios-surface flex h-full min-h-0 flex-col p-7 shadow-[0_22px_52px_rgba(15,23,42,0.12)]">
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

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <input
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setCurrentPage(1);
          }}
          placeholder="Search by name, email, or role"
          className={`h-11 min-w-[220px] flex-1 rounded-2xl border border-slate-100 bg-white/70 px-4 text-sm font-semibold text-slate-800 outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100 ${INSET}`}
        />
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Rows
          </span>
          <select
            value={rowsPerPage}
            onChange={(event) => {
              setRowsPerPage(Number(event.target.value));
              setCurrentPage(1);
            }}
            className={`h-11 rounded-2xl border border-slate-100 bg-white/70 px-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100 ${INSET}`}
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={15}>15</option>
          </select>
        </div>
      </div>

      <div className="mt-4 min-h-0 flex-1 overflow-y-auto pr-1">
      <div className="grid gap-3">
        {!filteredUsers.length ? (
          <div className={`rounded-2xl border border-slate-100 bg-white/70 px-5 py-6 text-sm font-semibold text-slate-500 ring-1 ring-slate-100 ${INSET}`}>
            {search.trim()
              ? "No staff users matched your search."
              : "No staff users are available yet. Refresh the live feed or create a staff account."}
          </div>
        ) : pagedUsers.map((user) => {
          const enabledPermissionCount = Object.values(user.permissions).filter(Boolean).length;

          return (
            <div
              key={user.id}
              className={`rounded-2xl border border-slate-100 bg-white/70 px-4 py-3 text-sm ring-1 ring-slate-100 ${INSET}`}
            >
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <OwnerBadge label={user.role} />
                    <p className="text-sm font-bold text-slate-900">{user.name}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveUserId(user.id)}
                    className="rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-800"
                  >
                    View details
                  </button>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-600 ring-1 ring-slate-200">
                    {user.username}
                  </span>
                  <span className="rounded-full bg-sky-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-sky-700 ring-1 ring-sky-100">
                    {enabledPermissionCount} permissions
                  </span>
                  {user.role === "Doctor" ? (
                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-700 ring-1 ring-emerald-100">
                      {`${getEditableExtraPermissions(user).length} overrides`}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      </div>

      <div className="mt-4 flex min-h-[56px] items-center justify-between gap-3 border-t border-slate-100 pt-3 text-sm font-semibold text-slate-600">
        <p>
          Showing{" "}
          {filteredUsers.length
            ? `${(safePage - 1) * rowsPerPage + 1}-${Math.min(
                safePage * rowsPerPage,
                filteredUsers.length
              )}`
            : "0"}{" "}
          of {filteredUsers.length}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
            disabled={safePage <= 1}
            className="app-button app-button--secondary app-button--pill min-w-[84px] px-3 py-1.5 text-xs disabled:opacity-50"
          >
            Prev
          </button>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
            {safePage} / {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
            disabled={safePage >= totalPages}
            className="app-button app-button--secondary app-button--pill min-w-[84px] px-3 py-1.5 text-xs disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>

      {activeUser ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-900/35 p-4 backdrop-blur-[1px]">
          <div className="ios-surface flex max-h-[90dvh] w-full max-w-4xl min-h-0 flex-col p-6 shadow-[0_24px_56px_rgba(15,23,42,0.3)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Staff details</p>
                <h3 className="mt-1 text-lg font-bold text-slate-900">{activeUser.name}</h3>
              </div>
              <div className="flex items-center gap-2">
                <OwnerBadge label={activeUser.role} />
                <button
                  type="button"
                  onClick={() => setActiveUserId(null)}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="mt-4 min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
              <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 ring-1 ring-slate-100">
                <p className="text-sm font-semibold text-slate-900">{activeUser.username}</p>
                <p className="mt-1 text-xs text-slate-600">
                  Full permission and override controls are shown below for this account.
                </p>
              </div>

              <div className="grid gap-2 md:grid-cols-2">
                {(Object.keys(permissionLabels) as PermissionKey[]).map((key) => (
                  <div key={key} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-700 ring-1 ring-slate-100">
                    <span>{permissionLabels[key]}</span>
                    <span
                      className={`rounded-full px-2.5 py-1 ${
                        activeUser.permissions[key]
                          ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100"
                          : "bg-slate-100 text-slate-500 ring-1 ring-slate-200"
                      }`}
                    >
                      {activeUser.permissions[key] ? "Included" : "Not included"}
                    </span>
                  </div>
                ))}
              </div>

              {activeUser.role === "Doctor" ? (
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 px-4 py-4 ring-1 ring-emerald-100">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                        Doctor support overrides
                      </p>
                      <p className="mt-1 text-sm text-emerald-900/80">
                        Grant only the assistant-support actions this doctor should cover.
                      </p>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-700 ring-1 ring-emerald-200">
                      {`${getEditableExtraPermissions(activeUser).length} selected`}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    {DOCTOR_SUPPORT_PERMISSION_OPTIONS.map((permission) => {
                      const editableExtraPermissions = getEditableExtraPermissions(activeUser);
                      const enabled = editableExtraPermissions.includes(permission);
                      const canEditOverrides =
                        canManageStaff &&
                        activeUser.role === "Doctor" &&
                        activeUser.backendUserId !== null;

                      return (
                        <button
                          key={permission}
                          type="button"
                          disabled={!canEditOverrides}
                          onClick={() => onToggleExtraPermission(activeUser.id, permission)}
                          className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition ${
                            enabled
                              ? "border-emerald-200 bg-white text-emerald-900 ring-1 ring-emerald-100"
                              : "border-emerald-100 bg-emerald-50/60 text-emerald-900/80 ring-1 ring-emerald-100"
                          } ${!canEditOverrides ? "cursor-not-allowed opacity-70" : "hover:-translate-y-0.5"}`}
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
                        : activeUser.backendUserId === null
                          ? "This entry is visible from activity feeds only. Refresh backend users before editing."
                          : "Changes save directly to the backend permission-override model."}
                    </div>
                    <button
                      type="button"
                      onClick={() => onSaveUser(activeUser)}
                      disabled={!canManageStaff || activeUser.backendUserId === null || isUpdatingUser(activeUser.id)}
                      className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(5,150,105,0.24)] transition hover:-translate-y-0.5 hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {isUpdatingUser(activeUser.id) ? "Saving..." : "Save overrides"}
                    </button>
                  </div>

                  {getUserFeedback(activeUser.id) ? (
                    <p
                      className={`mt-3 text-sm font-semibold ${
                        getUserFeedback(activeUser.id)?.tone === "error"
                          ? "text-rose-600"
                          : getUserFeedback(activeUser.id)?.tone === "success"
                            ? "text-emerald-700"
                            : "text-slate-600"
                      }`}
                    >
                      {getUserFeedback(activeUser.id)?.message}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
