import React from 'react';
import NavigationPanel, { IconRenderer, NavigationItemId } from './NavigationPanel';

type NavigationPageShellProps = {
  children: React.ReactNode;
  activeId: NavigationItemId;
  accentIcon?: IconRenderer; // Optional now, or we can just ignore it
};

export function NavigationPageShell({ children, activeId }: NavigationPageShellProps) {
  return (
    <div className="relative">
      <div className="lg:pl-40">{children}</div>
      <NavigationPanel activeId={activeId} />
    </div>
  );
}
