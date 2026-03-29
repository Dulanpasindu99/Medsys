import React from 'react';

type SurfaceCardTone = 'default' | 'subtle';

type SurfaceCardProps = React.HTMLAttributes<HTMLDivElement> & {
    children: React.ReactNode;
    tone?: SurfaceCardTone;
};

const toneClasses: Record<SurfaceCardTone, string> = {
    default: 'ios-surface shadow-[0_18px_42px_rgba(15,23,42,0.08)]',
    subtle: 'rounded-3xl border border-white/35 bg-white/92 backdrop-blur shadow-[0_16px_36px_rgba(28,63,99,0.06)]',
};

export function SurfaceCard({ children, className = '', tone = 'default', ...props }: SurfaceCardProps) {
    return (
        <div className={`${toneClasses[tone]} ${className}`} {...props}>
            {children}
        </div>
    );
}
