"use client";

import { usePathname } from "next/navigation";
import { PatientPortalNav } from "@/app/components/PatientPortalNav";

const NAV_HIDDEN_PREFIXES = ["/portal/login", "/portal/onboarding"];

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showNav = !NAV_HIDDEN_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  return (
    <div className="min-h-dvh bg-gradient-to-b from-white via-slate-50 to-sky-50/40 text-slate-900">
      <div className={showNav ? "mx-auto w-full max-w-2xl px-4 pb-28 pt-5 sm:px-6" : ""}>{children}</div>
      {showNav ? <PatientPortalNav /> : null}
    </div>
  );
}
