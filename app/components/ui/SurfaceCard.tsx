import React from 'react';

type SurfaceCardTone = 'default' | 'subtle';

type SurfaceCardProps = React.HTMLAttributes<HTMLDivElement> & {
    children: React.ReactNode;
    tone?: SurfaceCardTone;
};

const toneClasses: Record<SurfaceCardTone, string> = {
    default: 'ios-surface shadow-[0_20px_48px_rgba(15,23,42,0.12)]',
    subtle: 'rounded-3xl border border-slate-100 bg-white/90 backdrop-blur shadow-[0_18px_42px_rgba(28,63,99,0.08)]',
};

export function SurfaceCard({ children, className = '', tone = 'default', ...props }: SurfaceCardProps) {
    return (
        <div className={`${toneClasses[tone]} ${className}`} {...props}>
            {children}
        </div>
    );
}
