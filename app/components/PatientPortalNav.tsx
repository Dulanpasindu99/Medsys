"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
};

const ITEMS: NavItem[] = [
  {
    href: "/portal",
    label: "Home",
    icon: (
      <path d="M4 11l8-7 8 7M6 10v9h12v-9" strokeLinecap="round" strokeLinejoin="round" />
    )
  },
  {
    href: "/portal/history",
    label: "My History",
    icon: (
      <>
        <circle cx="12" cy="12" r="8.5" />
        <path d="M12 7.5V12l3 2" strokeLinecap="round" strokeLinejoin="round" />
      </>
    )
  },
  {
    href: "/portal/reports",
    label: "My Reports",
    icon: (
      <>
        <path d="M7 3.5h7l4 4V20a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1z" strokeLinejoin="round" />
        <path d="M13.5 3.5V8H18" strokeLinejoin="round" />
        <path d="M12 11.5v5M9.5 14h5" strokeLinecap="round" />
      </>
    )
  },
  {
    href: "/portal/profile",
    label: "My Profile",
    icon: (
      <>
        <circle cx="12" cy="8" r="3.5" />
        <path d="M5 19c0-3.3 3.1-6 7-6s7 2.7 7 6" strokeLinecap="round" />
      </>
    )
  }
];

export function PatientPortalNav() {
  const pathname = usePathname();

  return (
    <nav className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <div className="pointer-events-auto flex w-full max-w-md items-center justify-between gap-1 rounded-full border border-white/70 bg-white/90 p-1.5 shadow-[0_18px_44px_rgba(15,23,42,0.18)] ring-1 ring-slate-100 backdrop-blur-xl">
        {ITEMS.map((item) => {
          const active = item.href === "/portal" ? pathname === "/portal" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-1 flex-col items-center gap-0.5 rounded-full px-1 py-2 text-[10px] font-semibold transition ${
                active ? "bg-sky-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                {item.icon}
              </svg>
              <span className="leading-none">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
