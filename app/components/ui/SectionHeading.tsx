import React from 'react';

type SectionHeadingProps = {
    title: string;
    subtitle?: string;
    compact?: boolean;
};

export function SectionHeading({ title, subtitle, compact = false }: SectionHeadingProps) {
    return (
        <div className="flex items-end justify-between gap-3">
            <h2 className={`${compact ? 'text-base' : 'text-lg'} font-bold tracking-tight text-slate-900`}>
                <span className="mr-2 inline-block h-2 w-2 rounded-full bg-[var(--ioc-blue)] shadow-[0_0_0_4px_rgba(10,132,255,0.18)]" />
                {title}
            </h2>
            {subtitle ? (
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{subtitle}</span>
            ) : null}
        </div>
    );
}
