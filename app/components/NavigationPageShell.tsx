import React from 'react';
import NavigationPanel, { IconRenderer } from './NavigationPanel';
import type { AppRole } from '../lib/roles';

type NavigationPageShellProps = {
  children: React.ReactNode;
  accentIcon?: IconRenderer; // Optional now, or we can just ignore it
  sessionRole: AppRole;
  userName: string;
};

export function NavigationPageShell({
  children,
  sessionRole,
  userName,
}: NavigationPageShellProps) {
  return (
    <div className="relative">
      <div className="lg:pl-40">{children}</div>
      <NavigationPanel sessionRole={sessionRole} userName={userName} />
    </div>
  );
}
