"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { portalMe } from "@/app/lib/portal-api";

export function usePortalAccount(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["portal", "me"],
    queryFn: portalMe,
    retry: false,
    staleTime: 30_000,
    enabled: options?.enabled ?? true,
    // Re-check often enough to notice the 15-minute server-side session cap, and whenever the
    // user returns to the tab — so an expired session bounces to login promptly.
    refetchInterval: 60_000,
    refetchOnWindowFocus: true
  });
}

// Gate a dashboard page: bounce to login if unauthenticated, to onboarding if the
// profile isn't finished yet.
export function usePortalGuard(options?: { requireProfile?: boolean }) {
  const router = useRouter();
  const query = usePortalAccount();
  const requireProfile = options?.requireProfile ?? true;

  useEffect(() => {
    if (query.isError) {
      router.replace("/portal/login");
      return;
    }
    if (query.data && requireProfile && !query.data.profileCompleted) {
      router.replace("/portal/onboarding");
    }
  }, [query.isError, query.data, requireProfile, router]);

  return query;
}
