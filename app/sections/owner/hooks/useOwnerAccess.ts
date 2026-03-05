import { useMemo, useState } from "react";
import type { PermissionKey, Role, StaffUser } from "../types";

export const defaultPermissions = (role: Role): Record<PermissionKey, boolean> =>
  role === "Doctor"
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

export const permissionLabels: Record<PermissionKey, string> = {
  staffLogin: "Staff login page",
  doctorScreen: "Doctor screen",
  assistantScreen: "Assistant screen",
  ownerTools: "Owner + user management",
  sharedDashboards: "Shared dashboards & analytics",
};

export function useOwnerAccess() {
  const [role, setRole] = useState<Role>("Doctor");
  const [name, setName] = useState("Dr. Charuka Gamage");
  const [username, setUsername] = useState("dr.charuka");
  const [password, setPassword] = useState("medsys-123");
  const [permissions, setPermissions] = useState<Record<PermissionKey, boolean>>(defaultPermissions("Doctor"));

  const [staffUsers, setStaffUsers] = useState<StaffUser[]>([
    {
      id: "u1",
      role: "Doctor",
      name: "Dr. Charuka Gamage",
      username: "dr.charuka",
      permissions: { staffLogin: true, doctorScreen: true, assistantScreen: true, sharedDashboards: true, ownerTools: false },
    },
    {
      id: "u2",
      role: "Assistant",
      name: "Ayoma (Assistant)",
      username: "assistant1",
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
        label: "Doctor = owner",
        set: () =>
          setPermissions({
            staffLogin: true,
            doctorScreen: true,
            assistantScreen: true,
            sharedDashboards: true,
            ownerTools: true,
          }),
      },
      {
        label: "Doctor + assistant",
        set: () =>
          setPermissions({
            staffLogin: true,
            doctorScreen: true,
            assistantScreen: false,
            sharedDashboards: true,
            ownerTools: false,
          }),
      },
      {
        label: "Assistant only",
        set: () =>
          setPermissions({
            staffLogin: true,
            doctorScreen: false,
            assistantScreen: true,
            sharedDashboards: true,
            ownerTools: false,
          }),
      },
    ],
    []
  );

  return {
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
    staffUsers,
    setStaffUsers,
    presets,
    togglePermission,
    handleCreate,
  };
}
