import React from 'react';
import { SurfaceCard } from '../../../components/ui/SurfaceCard';

export function AssistantPanelShell({
    children,
    className = "",
}: {
    children: React.ReactNode;
    className?: string;
}) {
    return <SurfaceCard tone="subtle" className={`p-5 ${className}`}>{children}</SurfaceCard>;
}
