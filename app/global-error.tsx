"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="antialiased ios-shell">
        <main className="flex min-h-screen items-center justify-center bg-[#F4F4F9] px-4 py-10 text-slate-900">
          <section className="w-full max-w-2xl rounded-[30px] border border-white/70 bg-white/90 p-8 shadow-[0_26px_60px_rgba(15,23,42,0.14)] ring-1 ring-slate-100/80">
            <div className="space-y-4">
              <span className="inline-flex rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-rose-700 ring-1 ring-rose-100">
                Critical error
              </span>
              <h1 className="text-3xl font-bold tracking-tight">
                The application failed to start
              </h1>
              <p className="text-sm leading-7 text-slate-600">
                A root-level failure prevented the application from loading.
                The main shell was not rendered.
              </p>
              <p className="text-xs text-slate-400">
                {error.digest ? `Reference: ${error.digest}` : "No digest available"}
              </p>
            </div>

            <div className="mt-8">
              <button
                type="button"
                onClick={() => reset()}
                className="rounded-2xl bg-[var(--ioc-blue)] px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(10,132,255,0.4)] transition hover:bg-[#0070f0]"
              >
                Try again
              </button>
            </div>
          </section>
        </main>
      </body>
    </html>
  );
}
