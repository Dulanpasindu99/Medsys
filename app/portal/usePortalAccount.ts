"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { portalMe } from "@/app/lib/portal-api";

export function usePortalAccount() {
  return useQuery({ queryKey: ["portal", "me"], queryFn: portalMe, retry: false, staleTime: 30_000 });
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
