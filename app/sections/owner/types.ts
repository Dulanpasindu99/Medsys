export type Role = "Doctor" | "Assistant";

export type PermissionKey =
  | "staffLogin"
  | "doctorScreen"
  | "assistantScreen"
  | "ownerTools"
  | "sharedDashboards";

export type StaffUser = {
  id: string;
  role: Role;
  name: string;
  username: string;
  permissions: Record<PermissionKey, boolean>;
};
