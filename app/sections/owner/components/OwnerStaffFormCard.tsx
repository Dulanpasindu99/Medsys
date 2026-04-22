import FormControl from "@mui/material/FormControl";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import type {
  DoctorSupportPermission,
  DoctorWorkflowModeOption,
  PermissionKey,
  Role,
} from "../types";
import {
  doctorSupportPermissionLabels,
  DOCTOR_SUPPORT_PERMISSION_OPTIONS,
  permissionLabels,
} from "../hooks/useOwnerAccess";
import { OwnerBadge } from "./OwnerBadge";
import { appMuiSelectSx } from "../../../components/ui/muiFieldStyles";

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
  doctorWorkflowMode: DoctorWorkflowModeOption;
  setDoctorWorkflowMode: (mode: DoctorWorkflowModeOption) => void;
  onReset: () => void;
  fieldErrors?: {
    name?: string;
    username?: string;
    password?: string;
    doctorWorkflowMode?: string;
  };
  permissions: Record<PermissionKey, boolean>;
  extraPermissions: DoctorSupportPermission[];
  onToggleExtraPermission: (permission: DoctorSupportPermission) => void;
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
  doctorWorkflowMode,
  setDoctorWorkflowMode,
  onReset,
  fieldErrors,
  permissions,
  extraPermissions,
  onToggleExtraPermission,
  onCreate,
  isSubmitting = false,
  canManageStaff = true,
  manageStaffDisabledReason = null,
}: OwnerStaffFormCardProps) {
  return (
    <div className="ios-surface flex h-full min-h-0 flex-col p-7 shadow-[0_22px_52px_rgba(15,23,42,0.12)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Create staff</p>
          <h2 className="mt-1 text-xl font-bold text-slate-900">Add doctor or assistant credentials</h2>
        </div>
        <OwnerBadge label={role} />
      </div>

      <div className="mt-6 min-h-0 flex-1 overflow-y-auto pr-1">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <label className="flex flex-col gap-1 text-sm font-semibold text-slate-700">
          <span className="text-xs uppercase tracking-[0.18em] text-slate-500">Role (required)</span>
          <FormControl fullWidth>
            <Select
              value={role}
              onChange={(e) => {
                const nextRole = e.target.value as Role;
                setRole(nextRole);
              }}
              disabled={!canManageStaff}
              sx={{
                ...appMuiSelectSx,
                backgroundColor: "rgba(248,250,252,0.7)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.45)",
              }}
            >
              <MenuItem value="Doctor">Doctor</MenuItem>
              <MenuItem value="Assistant">Assistant</MenuItem>
            </Select>
          </FormControl>
        </label>
        <label className="flex flex-col gap-1 text-sm font-semibold text-slate-700">
          <span className="text-xs uppercase tracking-[0.18em] text-slate-500">Full name (required)</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={!canManageStaff}
            className={`rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition hover:border-sky-200 focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100 ${INSET}`}
          />
          {fieldErrors?.name ? (
            <span className="text-[11px] font-semibold text-rose-600">{fieldErrors.name}</span>
          ) : null}
        </label>
        <label className="flex flex-col gap-1 text-sm font-semibold text-slate-700">
          <span className="text-xs uppercase tracking-[0.18em] text-slate-500">Email (required)</span>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={!canManageStaff}
            className={`rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition hover:border-sky-200 focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100 ${INSET}`}
          />
          {fieldErrors?.username ? (
            <span className="text-[11px] font-semibold text-rose-600">{fieldErrors.username}</span>
          ) : null}
        </label>
        <label className="flex flex-col gap-1 text-sm font-semibold text-slate-700">
          <span className="text-xs uppercase tracking-[0.18em] text-slate-500">Password (required)</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={!canManageStaff}
            className={`rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition hover:border-sky-200 focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100 ${INSET}`}
          />
          {fieldErrors?.password ? (
            <span className="text-[11px] font-semibold text-rose-600">{fieldErrors.password}</span>
          ) : null}
        </label>
        {role === "Doctor" ? (
          <label className="flex flex-col gap-1 text-sm font-semibold text-slate-700">
            <span className="text-xs uppercase tracking-[0.18em] text-slate-500">
              Doctor workflow mode (required)
            </span>
            <FormControl fullWidth>
              <Select
                value={doctorWorkflowMode}
                onChange={(event) => {
                  setDoctorWorkflowMode(event.target.value as DoctorWorkflowModeOption);
                }}
                disabled={!canManageStaff}
                sx={{
                  ...appMuiSelectSx,
                  backgroundColor: "rgba(248,250,252,0.7)",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.45)",
                }}
              >
                <MenuItem value="self_service">Walk-in (self service)</MenuItem>
                <MenuItem value="clinic_supported">Appointment (clinic supported)</MenuItem>
              </Select>
            </FormControl>
            {fieldErrors?.doctorWorkflowMode ? (
              <span className="text-[11px] font-semibold text-rose-600">
                {fieldErrors.doctorWorkflowMode}
              </span>
            ) : null}
          </label>
        ) : null}
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

      {role === "Doctor" ? (
        <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50/80 px-3 py-3 text-sm text-emerald-950 ring-1 ring-emerald-100">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                Doctor support overrides
              </p>
              <p className="mt-1 text-xs text-emerald-900/80">
                Optional permissions for doctor-support coverage.
              </p>
            </div>
            <span className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-700 ring-1 ring-emerald-200">
              {`${extraPermissions.length} selected`}
            </span>
          </div>

          <div className="mt-3 grid gap-2 xl:grid-cols-3">
            {DOCTOR_SUPPORT_PERMISSION_OPTIONS.map((permission) => {
              const enabled = extraPermissions.includes(permission);
              const disabled = !canManageStaff;

              return (
                <button
                  key={permission}
                  type="button"
                  disabled={disabled}
                  onClick={() => onToggleExtraPermission(permission)}
                  className={`flex items-center justify-between gap-2 rounded-2xl border px-3 py-2.5 text-left text-xs font-semibold transition ${
                    enabled
                      ? "border-emerald-200 bg-white text-emerald-900 ring-1 ring-emerald-100"
                      : "border-emerald-100 bg-emerald-50/60 text-emerald-900/80 ring-1 ring-emerald-100"
                  } ${disabled ? "cursor-not-allowed opacity-70" : "hover:-translate-y-0.5"}`}
                >
                  <span>{doctorSupportPermissionLabels[permission]}</span>
                  <span
                    className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${
                      enabled
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-white text-emerald-700"
                    }`}
                  >
                    {enabled ? "Included" : "Optional"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
      </div>

      <div className="mt-auto flex min-h-[56px] items-center justify-end gap-3 border-t border-slate-100 pt-3">
        <button
          type="button"
          onClick={onReset}
          disabled={isSubmitting}
          className="app-button app-button--secondary app-button--pill min-w-[148px]"
        >
          Reset data
        </button>
        <button
          type="button"
          onClick={onCreate}
          disabled={isSubmitting || !canManageStaff}
          className="app-button app-button--primary app-button--pill min-w-[148px]"
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
