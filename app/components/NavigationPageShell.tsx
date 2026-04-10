import React from 'react';
import NavigationPanel, { IconRenderer } from './NavigationPanel';
import type { AppRole } from '../lib/roles';
import type { AppPermission } from '../lib/authorization';

type NavigationPageShellProps = {
  children: React.ReactNode;
  accentIcon?: IconRenderer; // Optional now, or we can just ignore it
  sessionRole: AppRole;
  sessionPermissions?: readonly AppPermission[];
  userName: string;
};

export function NavigationPageShell({
  children,
  sessionRole,
  sessionPermissions,
  userName,
}: NavigationPageShellProps) {
  return (
    <div className="relative">
      <div className="lg:pl-40">{children}</div>
      <NavigationPanel
        sessionRole={sessionRole}
        sessionPermissions={sessionPermissions}
        userName={userName}
      />
    </div>
  );
}
