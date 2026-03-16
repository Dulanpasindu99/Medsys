import type { AppPermission } from "@/app/lib/authorization";

export type Role = "Doctor" | "Assistant";

export type DoctorSupportPermission = Extract<
  AppPermission,
  | "patient.write"
  | "appointment.create"
  | "inventory.write"
  | "prescription.dispense"
  | "family.write"
>;

export type PermissionKey =
  | "staffLogin"
  | "doctorScreen"
  | "assistantScreen"
  | "ownerTools"
  | "sharedDashboards";

export type StaffUser = {
  id: string;
  backendUserId: number | null;
  role: Role;
  name: string;
  username: string;
  permissions: Record<PermissionKey, boolean>;
  effectivePermissions: AppPermission[];
  extraPermissions: DoctorSupportPermission[];
};
