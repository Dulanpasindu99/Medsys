'use client';

import React, { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { logoutUser, setActiveRole, type ApiClientError, type LoginResponse } from '../lib/api-client';
import { getDefaultRouteForSubject, getNavigationItemsForSubject, type AppPermission, type NavigationItemId } from '../lib/authorization';
import type { AppRole } from '../lib/roles';
import { useCurrentUserQuery } from '../lib/query-hooks';
import { queryKeys } from '../lib/query-keys';
import { notifyError } from '../lib/notifications';

export type IconRenderer = (props: React.SVGProps<SVGSVGElement>) => React.JSX.Element;

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

export const DictionaryIcon: IconRenderer = (props) => (
  <svg {...iconProps} {...props}>
    <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H19a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H6.5A1.5 1.5 0 0 0 5 20.5V5.5z" />
    <path d="M5 17.5A1.5 1.5 0 0 1 6.5 16H20" />
    <path d="M9 8h7M9 11h5" />
  </svg>
);

export const PatientsIcon: IconRenderer = (props) => (
  <svg {...iconProps} {...props}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="8.5" cy="7" r="4" />
    <polyline points="17 11 19 13 23 9" />
  </svg>
);

export const TasksIcon: IconRenderer = (props) => (
  <svg {...iconProps} {...props}>
    <path d="M9 6h11" />
    <path d="M9 12h11" />
    <path d="M9 18h11" />
    <path d="M4 6.5l1.2 1.2L7.5 5.4" />
    <circle cx="5.5" cy="12" r="1.2" />
    <path d="M4 18.5l1.2 1.2L7.5 17.4" />
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

type NavigationItem = {
  id: NavigationItemId;
  label: string;
  icon: IconRenderer;
  href: string;
};

const ICONS_BY_NAV_ID: Record<NavigationItemId, IconRenderer> = {
  doctor: DoctorIcon,
  dictionary: DictionaryIcon,
  patient: PatientsIcon,
  tasks: TasksIcon,
  analytics: StatsIcon,
  inventory: InventoryIcon,
  ai: ChatIcon,
  assistant: AssistantIcon,
  owner: OwnerIcon,
};

const NAV_TOOLTIP = 'shadow-[0_12px_24px_rgba(10,132,255,0.18)]';
const NAV_ROSE_TOOLTIP = 'shadow-[0_12px_24px_rgba(244,63,94,0.25)]';
const subscribe = () => () => {};

function useIsHydrated() {
  return useSyncExternalStore(subscribe, () => true, () => false);
}

export default function NavigationPanel({
  className = '',
  sessionRole,
  sessionPermissions,
  userName,
}: {
  className?: string;
  sessionRole: AppRole;
  sessionPermissions?: readonly AppPermission[];
  userName: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const shouldFetchCurrentUser = pathname !== '/login';
  const currentUserQuery = useCurrentUserQuery(shouldFetchCurrentUser);
  const navListRef = useRef<HTMLUListElement>(null);
  const indicatorRef = useRef<HTMLSpanElement>(null);
  const mounted = useIsHydrated();
  const currentUser = currentUserQuery.data;
  const effectiveRole = currentUser?.active_role ?? currentUser?.role ?? sessionRole;
  const effectivePermissions = currentUser?.permissions ?? sessionPermissions;
  const availableRoles = currentUser?.roles?.length ? currentUser.roles : [effectiveRole];
  const navigationItems: NavigationItem[] = getNavigationItemsForSubject({
    role: effectiveRole,
    permissions: effectivePermissions,
  }).map((item) => ({
    id: item.id,
    label: item.label,
    href: item.href,
    icon: ICONS_BY_NAV_ID[item.id],
  }));
  const displayName = (currentUser?.name ?? userName).trim() || 'Medlink User';

  // Determine active ID based on pathname
  const activeId = navigationItems.find(item => {
    if (item.href === '/') return pathname === '/';
    return pathname.startsWith(item.href);
  })?.id || navigationItems[0]?.id || 'doctor';

  const handleLogout = async () => {
    if (typeof window !== 'undefined' && !window.confirm('Log out of Medlink?')) {
      return;
    }
    await logoutUser();
    queryClient.clear();
    router.replace('/login');
  };

  const handleRoleSwitch = async (nextRole: AppRole) => {
    if (nextRole === effectiveRole) return;

    try {
      const updatedUser = await setActiveRole(nextRole);
      queryClient.setQueryData(queryKeys.auth.currentUser, updatedUser as LoginResponse);
      await currentUserQuery.refetch();
      router.push(getDefaultRouteForSubject({
        role: updatedUser.active_role ?? updatedUser.role,
        permissions: updatedUser.permissions,
      }));
      router.refresh();
    } catch (error) {
      const apiError = error as ApiClientError | undefined;
      notifyError(
        apiError?.userMessage ?? apiError?.message ?? "Unable to switch the active role right now.",
        apiError?.requestId
      );
      await currentUserQuery.refetch();
    }
  };

  const [indicatorOffset, setIndicatorOffset] = useState(0);
  const [navHidden, setNavHidden] = useState(false);

  // Auto-hide the mobile bottom bar on scroll-down, reveal it on scroll-up.
  useEffect(() => {
    if (!mounted) return;
    const scroller = document.querySelector('main');
    const target: HTMLElement | Window = scroller ?? window;
    const readY = () => (scroller ? scroller.scrollTop : window.scrollY);
    let lastY = readY();
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        const y = readY();
        if (y > lastY + 6 && y > 48) {
          setNavHidden(true);
        } else if (y < lastY - 6) {
          setNavHidden(false);
        }
        lastY = y;
        ticking = false;
      });
    };
    target.addEventListener('scroll', onScroll, { passive: true });
    return () => target.removeEventListener('scroll', onScroll);
  }, [mounted, pathname]);

  useLayoutEffect(() => {
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

  const userInitials = displayName
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const ActiveIcon = navigationItems.find(item => item.id === activeId)?.icon || DoctorIcon;
  const userBadgeTooltip = currentUser?.email
    ? `${displayName} (${currentUser.email})`
    : displayName;

  const content = (
    <>
    {/* Desktop / tablet: vertical left rail */}
    <aside
      className={`nav-rail fixed z-50 hidden items-center justify-between gap-6 rounded-[32px] md:flex md:left-4 md:top-4 md:bottom-4 md:w-24 md:flex-col md:px-5 md:py-6 lg:left-6 lg:top-6 lg:bottom-6 lg:w-28 ${className}`}
    >
      <div className="flex flex-col items-center gap-3 text-center text-slate-700">
        <div
          className="group relative flex items-center justify-center rounded-full bg-slate-700 p-1.5 shadow-[0_22px_36px_rgba(15,23,42,0.22)]"
          title={userBadgeTooltip}
        >
          <div className="relative flex size-14 items-center justify-center rounded-full bg-white/95 text-sm font-semibold uppercase text-slate-900 ring-2 ring-slate-700/60 shadow-[0_14px_28px_rgba(15,23,42,0.18)]">
            {userInitials}
            <div className="absolute -bottom-1 -right-1 flex size-6 items-center justify-center rounded-full bg-white text-sky-600 ring-2 ring-sky-100 shadow-[0_10px_18px_rgba(10,132,255,0.25)]">
              <ActiveIcon className="size-[14px]" />
            </div>
          </div>
          <span
            className={`pointer-events-none absolute left-full ml-3 hidden origin-left scale-90 rounded-full bg-slate-700 px-3 py-1 text-xs font-medium text-white opacity-0 ${NAV_TOOLTIP} transition group-hover:scale-100 group-hover:opacity-100 md:inline-block`}
          >
            {displayName}
          </span>
        </div>
        {availableRoles.length > 1 ? (
          <div className="flex flex-col items-center gap-2 rounded-[22px] bg-white/95 px-3 py-3 shadow-[0_14px_30px_rgba(15,23,42,0.12)]">
            {availableRoles.map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => handleRoleSwitch(role)}
                disabled={currentUserQuery.isFetching}
                className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] transition ${
                  role === effectiveRole
                    ? 'bg-slate-800 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {role}
              </button>
            ))}
          </div>
        ) : null}
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
          onClick={handleLogout}
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

    {/* Mobile: horizontal bottom tab bar (auto-hides on scroll-down) */}
    <div
      className={`fixed inset-x-3 bottom-3 z-50 flex flex-col items-center gap-2 transition-all duration-300 ease-out md:hidden ${
        navHidden ? 'pointer-events-none translate-y-[170%] opacity-0' : 'translate-y-0 opacity-100'
      }`}
    >
      {availableRoles.length > 1 ? (
        <div className="flex items-center gap-1 rounded-full bg-white/95 px-2 py-1 shadow-[0_10px_24px_rgba(15,23,42,0.14)] ring-1 ring-slate-200">
          {availableRoles.map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => handleRoleSwitch(role)}
              disabled={currentUserQuery.isFetching}
              className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] transition ${
                role === effectiveRole ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {role}
            </button>
          ))}
        </div>
      ) : null}
      <nav
        aria-label="Primary navigation"
        className="flex w-full items-center gap-1 rounded-full border border-slate-200 bg-white/95 px-2.5 py-2 shadow-[0_18px_38px_rgba(15,23,42,0.18)] ring-1 ring-white/70 backdrop-blur-xl"
        style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
      >
        <div className="flex flex-1 items-center gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {navigationItems.map((item) => {
            const active = item.id === activeId;
            return (
              <Link
                key={item.id}
                href={item.href}
                aria-label={item.label}
                aria-current={active ? 'page' : undefined}
                className={`flex h-11 min-w-[2.75rem] flex-1 items-center justify-center rounded-2xl transition ${
                  active
                    ? 'bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-[0_10px_20px_rgba(37,99,235,0.30)]'
                    : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                <item.icon className="size-5" />
              </Link>
            );
          })}
        </div>
        <span className="mx-0.5 h-7 w-px shrink-0 bg-slate-200" aria-hidden="true" />
        <button
          type="button"
          onClick={handleLogout}
          aria-label="Logout"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-rose-100 bg-white text-rose-500"
        >
          <LogoutIcon className="size-[18px]" />
        </button>
      </nav>
    </div>
    </>
  );

  if (pathname === '/login' || !mounted || navigationItems.length === 0) return null;
  return createPortal(content, document.body);
}
