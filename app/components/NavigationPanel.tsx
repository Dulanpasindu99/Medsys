'use client';

import Link from 'next/link';
import React from 'react';
import { createPortal } from 'react-dom';

export type IconRenderer = (props: React.SVGProps<SVGSVGElement>) => JSX.Element;

const iconProps = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const;

export const DoctorIcon: IconRenderer = (props) => (
  <svg {...iconProps} {...props}>
    <circle cx={12} cy={7} r={3.5} />
    <path d="M6 20c.6-3.2 3.1-5.5 6-5.5s5.4 2.3 6 5.5" />
    <path d="M9 14h6" />
  </svg>
);

export const AssistantIcon: IconRenderer = (props) => (
  <svg {...iconProps} {...props}>
    <path d="M4 10.5l2.2-4.5h11.6l2.2 4.5" />
    <path d="M6.5 10.5v4.8a5.5 5.5 0 0011 0v-4.8" />
    <path d="M12 9v2.3M10.7 10.2h2.6" />
  </svg>
);

export const PatientsIcon: IconRenderer = (props) => (
  <svg {...iconProps} {...props}>
    <path d="M6 7h12a2 2 0 012 2v8a2 2 0 01-2 2H6a2 2 0 01-2-2V9a2 2 0 012-2z" />
    <path d="M9 4h6l1 3H8l1-3z" />
    <path d="M9 13h6M9 17h4" />
  </svg>
);

export const StatsIcon: IconRenderer = (props) => (
  <svg {...iconProps} {...props}>
    <path d="M5 20h14" />
    <path d="M8 16V9" />
    <path d="M12 16V6" />
    <path d="M16 16v-4" />
  </svg>
);

export const InventoryIcon: IconRenderer = (props) => (
  <svg {...iconProps} {...props}>
    <path d="M3 7l9-4 9 4-9 4-9-4z" />
    <path d="M3 7v10l9 4 9-4V7" />
    <path d="M12 11v10" />
  </svg>
);

export const ChatIcon: IconRenderer = (props) => (
  <svg {...iconProps} {...props}>
    <path d="M6 6h12a3 3 0 013 3v5a3 3 0 01-3 3h-2.5L12 20.5 10.5 17H6a3 3 0 01-3-3V9a3 3 0 013-3z" />
    <path d="M9 11h6M9 14h4" />
  </svg>
);

export const LogoutIcon: IconRenderer = (props) => (
  <svg {...iconProps} {...props}>
    <path d="M15 7l5 5-5 5" />
    <path d="M10 12h10" />
    <path d="M4 5v14" />
  </svg>
);

export type NavigationItemId = 'doctor' | 'assistant' | 'patient' | 'stats' | 'inventory' | 'ai' | 'owner';

type NavigationItem = {
  id: NavigationItemId;
  label: string;
  icon: IconRenderer;
  href: string;
};

const navigationItems: NavigationItem[] = [
  { id: 'doctor', label: 'Doctor Screen', icon: DoctorIcon, href: '/' },
  { id: 'assistant', label: 'Assistant Screen', icon: AssistantIcon, href: '/assistant' },
  { id: 'patient', label: 'Patiant Management', icon: PatientsIcon, href: '/patients' },
  { id: 'stats', label: 'Analytics', icon: StatsIcon, href: '/analytics' },
  { id: 'owner', label: 'Owner Tools', icon: InventoryIcon, href: '/owner' },
  { id: 'inventory', label: 'Inventry Management', icon: InventoryIcon, href: '/inventory' },
  { id: 'ai', label: 'Ai Chat', icon: ChatIcon, href: '/ai' },
];

const NAV_TOOLTIP = 'shadow-[0_12px_24px_rgba(10,132,255,0.18)]';
const NAV_ROSE_TOOLTIP = 'shadow-[0_12px_24px_rgba(244,63,94,0.25)]';

export function NavigationPanel({
  activeId,
  accentIcon: AccentIcon,
  className = '',
}: {
  activeId: NavigationItemId;
  accentIcon: IconRenderer;
  className?: string;
}) {
  if (typeof document === 'undefined') return null;

  const content = (
    <aside
      className={`fixed inset-x-4 bottom-4 z-30 flex items-center gap-4 rounded-[28px] border border-white/60 bg-white/70 px-4 py-3 shadow-[0_18px_36px_rgba(15,23,42,0.14)] backdrop-blur-xl transition-all md:inset-auto md:right-4 md:top-4 md:bottom-4 md:w-24 md:flex-col md:px-4 md:py-5 lg:right-6 lg:top-6 lg:bottom-6 lg:w-28 ${className}`}
    >
      <div className="flex items-center gap-4 md:flex-col md:gap-6">
        <div className="flex size-14 items-center justify-center rounded-full bg-slate-900 text-white shadow-[0_22px_36px_rgba(15,23,42,0.28)]">
          <AccentIcon className="size-7" />
        </div>
        <div className="hidden h-10 w-px rounded-full bg-slate-200 md:block" />
        <div className="flex flex-1 items-center justify-center rounded-2xl border border-white/70 bg-white/75 px-4 py-3 text-slate-600 shadow-[0_20px_38px_rgba(15,23,42,0.12)] backdrop-blur-xl md:px-3 md:py-4">
          <ul className="flex items-center gap-3 md:flex-col md:gap-4">
            {navigationItems.map((item) => (
              <li key={item.id} className="flex justify-center">
                <Link
                  href={item.href}
                  className={`ios-nav-button group relative flex items-center justify-center rounded-full transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-slate-500 ${
                    item.id === activeId
                      ? 'size-14 bg-slate-900 text-white shadow-[0_18px_32px_rgba(15,23,42,0.28)]'
                      : 'size-12 bg-white/90 text-slate-500 ring-1 ring-sky-100 hover:ring-sky-200'
                  }`}
                  aria-label={item.label}
                  aria-current={item.id === activeId ? 'page' : undefined}
                >
                  <item.icon className="size-5" />
                  <span
                    className={`pointer-events-none absolute right-full mr-3 hidden origin-right scale-90 rounded-full bg-slate-900 px-3 py-1 text-xs font-medium uppercase tracking-wide text-white opacity-0 ${NAV_TOOLTIP} transition group-hover:scale-100 group-hover:opacity-100 md:inline-block`}
                  >
                    {item.label}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="hidden h-10 w-px rounded-full bg-slate-200 md:block" />
      </div>

      <Link
        href="/logout"
        className="ios-nav-button group relative flex size-12 items-center justify-center rounded-full border border-rose-100 bg-white/90 text-rose-500 shadow-[0_12px_24px_rgba(244,63,94,0.25)] transition hover:-translate-y-0.5 hover:border-rose-200 md:size-14"
        aria-label="Logout"
      >
        <LogoutIcon className="size-5" />
        <span
          className={`pointer-events-none absolute right-full mr-3 hidden origin-right scale-90 rounded-full bg-rose-600 px-3 py-1 text-xs font-medium uppercase tracking-wide text-white opacity-0 ${NAV_ROSE_TOOLTIP} transition group-hover:scale-100 group-hover:opacity-100 md:inline-block`}
        >
          Logout
        </span>
      </Link>
    </aside>
  );

  return (
    createPortal(content, document.body)
  );
}
