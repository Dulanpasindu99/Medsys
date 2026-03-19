"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F4F4F9] px-4 py-10 text-slate-900">
      <section className="w-full max-w-2xl rounded-[30px] border border-white/70 bg-white/90 p-8 shadow-[0_26px_60px_rgba(15,23,42,0.14)] ring-1 ring-slate-100/80">
        <div className="space-y-4">
          <span className="inline-flex rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-amber-700 ring-1 ring-amber-100">
            Application error
          </span>
          <h1 className="text-3xl font-bold tracking-tight">
            The workspace could not be loaded
          </h1>
          <p className="text-sm leading-7 text-slate-600">
            A rendering or data-loading failure occurred before the main UI
            became safe to use. The shell was not shown to avoid exposing a
            broken clinical workflow.
          </p>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="app-button app-button--primary"
          >
            Try again
          </button>
          <Link
            href="/login"
            className="app-button app-button--secondary"
          >
            Go to login
          </Link>
        </div>
      </section>
    </main>
  );
}
