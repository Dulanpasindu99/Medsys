'use client';

import React from 'react';
import { IconRenderer, NavigationItemId, NavigationPanel } from './NavigationPanel';

type NavigationPageShellProps = {
  children: React.ReactNode;
  activeId: NavigationItemId;
  accentIcon: IconRenderer;
};

export function NavigationPageShell({ children, activeId, accentIcon }: NavigationPageShellProps) {
  return (
    <div className="relative">
      <div className="lg:pr-40">{children}</div>
      <NavigationPanel activeId={activeId} accentIcon={accentIcon} />
    </div>
  );
}
