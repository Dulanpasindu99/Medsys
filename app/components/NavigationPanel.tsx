'use client';

import React, { useLayoutEffect, useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

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
    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="8.5" cy="7" r="4" />
    <polyline points="17 11 19 13 23 9" />
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

export const HelpIcon: IconRenderer = (props) => (
  <svg {...iconProps} {...props}>
    <circle cx={12} cy={12} r={9} />
    <path d="M9.75 10.25a2.25 2.25 0 114.5 0c0 1.5-2.25 1.5-2.25 3" />
    <circle cx={12} cy={16.5} r={0.8} />
  </svg>
);

export const OwnerIcon: IconRenderer = (props) => (
  <svg {...iconProps} {...props}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

export type NavigationItemId = 'doctor' | 'assistant' | 'patient' | 'analytics' | 'inventory' | 'ai' | 'owner';

type NavigationItem = {
  id: NavigationItemId;
  label: string;
  icon: IconRenderer;
  href: string;
};

export const navigationItems: NavigationItem[] = [
  { id: 'doctor', label: 'Doctor Page', icon: DoctorIcon, href: '/' },
  { id: 'patient', label: 'Patient Management', icon: PatientsIcon, href: '/patient' },
  { id: 'analytics', label: 'Insights control room,Disease Intelligence', icon: StatsIcon, href: '/analytics' },
  { id: 'inventory', label: 'Inventory Management', icon: InventoryIcon, href: '/inventory' },
  { id: 'ai', label: 'Analytics Ai Tools', icon: ChatIcon, href: '/ai' },
  { id: 'assistant', label: 'Assistant Panel', icon: AssistantIcon, href: '/assistant' },
  { id: 'owner', label: 'Manage Staff Access', icon: OwnerIcon, href: '/owner' },
];

const NAV_TOOLTIP = 'shadow-[0_12px_24px_rgba(10,132,255,0.18)]';
const NAV_ROSE_TOOLTIP = 'shadow-[0_12px_24px_rgba(244,63,94,0.25)]';

export default function NavigationPanel({
  className = '',
}: {
  className?: string;
}) {
  const [isMounted, setIsMounted] = useState(false);
  const pathname = usePathname();
  const doctorName = 'Dr. Charuka Gamage';
  const navListRef = useRef<HTMLUListElement>(null);
  const indicatorRef = useRef<HTMLSpanElement>(null);

  // Determine active ID based on pathname
  const activeId = navigationItems.find(item => {
    if (item.href === '/') return pathname === '/';
    return pathname.startsWith(item.href);
  })?.id || 'doctor';

  const [indicatorOffset, setIndicatorOffset] = useState(0);

  // Only render portal on client-side to avoid hydration mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const updateIndicator = () => {
    const list = navListRef.current;
    if (!list) return;

    const activeLink = list.querySelector<HTMLElement>(
      `[data-nav-id="${activeId}"]`
    );
    if (!activeLink) return;

    const listRect = list.getBoundingClientRect();
    const linkRect = activeLink.getBoundingClientRect();
    const indicatorHeight = indicatorRef.current?.getBoundingClientRect().height ?? 48;

    // Calculate center-to-center offset
    const centeredOffset =
      linkRect.top - listRect.top + (linkRect.height - indicatorHeight) / 2;

    setIndicatorOffset(centeredOffset);
  };

  useLayoutEffect(() => {
    // Initial calculation
    updateIndicator();

    // Re-calculate on window resize
    window.addEventListener('resize', updateIndicator);

    // Re-calculate on list resize (robust against layout shifts)
    const observer = new ResizeObserver(() => {
      updateIndicator();
    });

    if (navListRef.current) {
      observer.observe(navListRef.current);
    }

    // Small delay to catch end of transitions/animations
    const timeoutId = setTimeout(updateIndicator, 150);

    return () => {
      window.removeEventListener('resize', updateIndicator);
      observer.disconnect();
      clearTimeout(timeoutId);
    };
  }, [activeId]);

  const doctorInitials = doctorName
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const ActiveIcon = navigationItems.find(item => item.id === activeId)?.icon || DoctorIcon;

  const content = (
    <aside
      className={`nav-rail fixed inset-x-4 bottom-4 z-50 flex items-center justify-between gap-6 rounded-[32px] px-5 py-4 transition-all md:inset-auto md:left-4 md:top-4 md:bottom-4 md:w-24 md:flex-col md:items-center md:justify-between md:px-5 md:py-6 lg:left-6 lg:top-6 lg:bottom-6 lg:w-28 ${className}`}
    >
      <div className="flex flex-col items-center gap-3 text-center text-slate-700">
        <div className="relative flex items-center justify-center rounded-full bg-slate-700 p-1.5 shadow-[0_22px_36px_rgba(15,23,42,0.22)]">
          <div className="relative flex size-14 items-center justify-center rounded-full bg-white/95 text-sm font-semibold uppercase text-slate-900 ring-2 ring-slate-700/60 shadow-[0_14px_28px_rgba(15,23,42,0.18)]">
            {doctorInitials}
            <div className="absolute -bottom-1 -right-1 flex size-6 items-center justify-center rounded-full bg-white text-sky-600 ring-2 ring-sky-100 shadow-[0_10px_18px_rgba(10,132,255,0.25)]">
              <ActiveIcon className="size-[14px]" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-1 items-center">
        <ul
          ref={navListRef}
          className="nav-rail__list flex flex-col items-center gap-4 rounded-full bg-white/90 px-3 py-5 text-slate-600 ring-1 ring-slate-200 shadow-[0_14px_32px_rgba(15,23,42,0.12)]"
          style={
            {
              '--nav-indicator-offset': `${indicatorOffset}px`,
            } as React.CSSProperties
          }
        >
          <span ref={indicatorRef} className="nav-rail__indicator" aria-hidden="true" />
          {navigationItems.map((item) => (
            <li key={item.id} className="flex justify-center">
              <Link
                href={item.href}
                className={`ios-nav-button group relative flex size-12 items-center justify-center rounded-full transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-slate-500 ${item.id === activeId
                  ? 'ios-nav-button--active text-white'
                  : 'text-slate-500 ring-1 ring-sky-100 hover:text-slate-700 hover:ring-sky-200'
                  }`}
                aria-label={item.label}
                data-nav-id={item.id}
                aria-current={item.id === activeId ? 'page' : undefined}
              >
                <item.icon className="ios-nav-button__icon size-5" />
                <span
                  className={`pointer-events-none absolute left-full ml-3 hidden origin-left scale-90 rounded-full bg-slate-700 px-3 py-1 text-xs font-medium uppercase tracking-wide text-white opacity-0 ${NAV_TOOLTIP} transition group-hover:scale-100 group-hover:opacity-100 md:inline-block`}
                >
                  {item.label}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-col items-center gap-3 rounded-[26px] bg-white/95 px-3 py-4 shadow-[0_14px_30px_rgba(15,23,42,0.12)]">
        <button
          className="ios-nav-button group relative flex size-12 items-center justify-center rounded-full border border-sky-100 bg-white/90 text-sky-600 shadow-[0_12px_24px_rgba(10,132,255,0.18)] transition hover:-translate-y-0.5 hover:border-sky-200"
          aria-label="Help"
        >
          <HelpIcon className="size-5" />
          <span
            className={`pointer-events-none absolute left-full ml-3 hidden origin-left scale-90 rounded-full bg-slate-700 px-3 py-1 text-xs font-medium uppercase tracking-wide text-white opacity-0 ${NAV_TOOLTIP} transition group-hover:scale-100 group-hover:opacity-100 md:inline-block`}
          >
            Help
          </span>
        </button>

        <button
          className="ios-nav-button group relative flex size-12 items-center justify-center rounded-full border border-rose-100 bg-white/90 text-rose-500 shadow-[0_12px_24px_rgba(244,63,94,0.25)] transition hover:-translate-y-0.5 hover:border-rose-200"
          aria-label="Logout"
        >
          <LogoutIcon className="size-5" />
          <span
            className={`pointer-events-none absolute left-full ml-3 hidden origin-left scale-90 rounded-full bg-rose-600 px-3 py-1 text-xs font-medium uppercase tracking-wide text-white opacity-0 ${NAV_ROSE_TOOLTIP} transition group-hover:scale-100 group-hover:opacity-100 md:inline-block`}
          >
            Logout
          </span>
        </button>
      </div>
    </aside>
  );

  if (!isMounted) return null;
  return createPortal(content, document.body);
}
