import React from 'react';
import { SurfaceCard } from '../../../components/ui/SurfaceCard';

export function AssistantPanelShell({ children }: { children: React.ReactNode }) {
    return <SurfaceCard tone="subtle" className="p-5">{children}</SurfaceCard>;
}
