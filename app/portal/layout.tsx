"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { PatientPortalNav } from "@/app/components/PatientPortalNav";
import { usePortalAccount } from "./usePortalAccount";

// Public = no session required. No-profile = session required but onboarding not yet done.
const PUBLIC_PREFIXES = ["/portal/login"];
const NO_PROFILE_PREFIXES = ["/portal/onboarding"];
const NAV_HIDDEN_PREFIXES = ["/portal/login", "/portal/onboarding"];

function PortalSplash() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-gradient-to-b from-white via-slate-50 to-sky-50/40">
      <div className="flex flex-col items-center gap-3">
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-slate-200 border-t-sky-500" />
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">Loading…</p>
      </div>
    </div>
  );
}

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const isPublic = PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  const requireProfile = !isPublic && !NO_PROFILE_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  // Only probe /me on guarded routes — the login screen must never trigger an auth call.
  const account = usePortalAccount({ enabled: !isPublic });
  const authed = !!account.data && !account.isError;

  // Centralised guard: bounce to login when unauthenticated, to onboarding when the profile
  // isn't finished, and away from onboarding once it is. Done here (not per page) so no page
  // content renders before auth is known — that was the "flash of the last screen" bug.
  useEffect(() => {
    if (isPublic) return;
    if (account.isError) {
      router.replace("/portal/login");
    } else if (account.data) {
      if (requireProfile && !account.data.profileCompleted) {
        router.replace("/portal/onboarding");
      } else if (!requireProfile && account.data.profileCompleted && pathname.startsWith("/portal/onboarding")) {
        router.replace("/portal");
      }
    }
  }, [isPublic, requireProfile, account.isError, account.data, pathname, router]);

  const showNav = !NAV_HIDDEN_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastScrollY = useRef(0);
  // Nav visibility is tracked with the route it belongs to, so switching tabs reveals the bar
  // via a render-phase reset (no setState-in-effect).
  const [nav, setNav] = useState({ hidden: false, path: pathname });
  if (nav.path !== pathname) {
    setNav({ hidden: false, path: pathname });
  }
  const navHidden = nav.hidden;

  // Scroll the container back to the top on route change (DOM/ref side effects only).
  useEffect(() => {
    lastScrollY.current = 0;
    scrollRef.current?.scrollTo({ top: 0 });
  }, [pathname]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const y = el.scrollTop;
    const previous = lastScrollY.current;
    if (Math.abs(y - previous) < 6) return;
    setNav((current) => ({ ...current, hidden: y > previous && y > 24 }));
    lastScrollY.current = y;
  };

  // Guarded routes render a neutral splash until the session is confirmed — never the page.
  const ready = isPublic || (authed && (requireProfile ? account.data!.profileCompleted : true));

  return (
    <div className="relative h-dvh bg-gradient-to-b from-white via-slate-50 to-sky-50/40 text-slate-900">
      <div
        ref={scrollRef}
        onScroll={showNav ? handleScroll : undefined}
        className="h-full overflow-y-auto overscroll-contain"
      >
        <div className={showNav ? "mx-auto w-full max-w-2xl px-4 pb-28 pt-5 sm:px-6" : ""}>
          {ready ? children : <PortalSplash />}
        </div>
      </div>
      {showNav && ready ? <PatientPortalNav hidden={navHidden} /> : null}
    </div>
  );
}
