"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { PatientPortalNav } from "@/app/components/PatientPortalNav";

const NAV_HIDDEN_PREFIXES = ["/portal/login", "/portal/onboarding"];

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showNav = !NAV_HIDDEN_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastScrollY = useRef(0);
  const [navHidden, setNavHidden] = useState(false);

  // Reset scroll + reveal the nav whenever we switch tabs.
  useEffect(() => {
    lastScrollY.current = 0;
    scrollRef.current?.scrollTo({ top: 0 });
    setNavHidden(false);
  }, [pathname]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const y = el.scrollTop;
    const previous = lastScrollY.current;
    // Ignore jitter and the rubber-band zone near the very top.
    if (Math.abs(y - previous) < 6) return;
    // Scrolling down (past a small threshold) hides the bar; scrolling up reveals it.
    setNavHidden(y > previous && y > 24);
    lastScrollY.current = y;
  };

  return (
    <div className="relative h-dvh bg-gradient-to-b from-white via-slate-50 to-sky-50/40 text-slate-900">
      <div
        ref={scrollRef}
        onScroll={showNav ? handleScroll : undefined}
        className="h-full overflow-y-auto overscroll-contain"
      >
        <div className={showNav ? "mx-auto w-full max-w-2xl px-4 pb-28 pt-5 sm:px-6" : ""}>{children}</div>
      </div>
      {showNav ? <PatientPortalNav hidden={navHidden} /> : null}
    </div>
  );
}
