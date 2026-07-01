"use client";

import { useRouter } from "next/navigation";
import { useInventoryAlertsQuery } from "../../../lib/query-hooks";

// Blinking red indicator shown on the doctor page when drugs are near/at expiry. Clicking
// it opens the inventory Expiry Date Checking tab. Driven by live data, so it clears itself
// once the affected drugs are refilled with a new expiry date.
export function ExpiryIndicator() {
  const router = useRouter();
  // 90-day window covers the inventory "within 3 months" bucket.
  const alerts = useInventoryAlertsQuery(90);
  const summary = alerts.data?.summary;
  const count = summary ? (summary.nearExpiryCount ?? 0) + (summary.expiredCount ?? 0) : 0;

  if (count <= 0) return null;

  return (
    <button
      type="button"
      onClick={() => router.push("/inventory?tab=expiry")}
      title="Some drugs are near expiry — check here"
      aria-label={`${count} drug${count === 1 ? "" : "s"} near expiry. Open expiry date checking.`}
      className="group relative inline-flex h-9 shrink-0 items-center gap-2 rounded-[999px] border border-rose-200 bg-rose-50 px-3 text-[10px] font-extrabold uppercase tracking-[0.16em] text-rose-700 shadow-[0_8px_20px_rgba(244,63,94,0.18)] transition hover:bg-rose-100 xl:h-10 xl:px-3.5"
    >
      <span className="relative flex h-2.5 w-2.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-500 opacity-75" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-rose-600" />
      </span>
      <span className="hidden sm:inline">{count} near expiry</span>
      {/* Hover tooltip */}
      <span className="pointer-events-none absolute left-1/2 top-full z-[130] mt-2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1 text-[10px] font-semibold normal-case tracking-normal text-white shadow-lg group-hover:block">
        Some drugs are near expiry — check here
      </span>
    </button>
  );
}
