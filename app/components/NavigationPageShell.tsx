import React from 'react';
import NavigationPanel, { IconRenderer } from './NavigationPanel';

type NavigationPageShellProps = {
  children: React.ReactNode;
  accentIcon?: IconRenderer; // Optional now, or we can just ignore it
};

export function NavigationPageShell({ children }: NavigationPageShellProps) {
  return (
    <div className="relative">
      <div className="lg:pl-40">{children}</div>
      <NavigationPanel />
    </div>
  );
}
