import Link from "next/link";

const COPY = {
  backend_unreachable: {
    title: "Backend Connection Failed",
    description:
      "The application server could not reach the backend service. The main workspace was not loaded to avoid rendering stale or incomplete healthcare data.",
  },
  backend_unhealthy: {
    title: "Backend Service Unavailable",
    description:
      "The backend responded in an unhealthy state. The main workspace was blocked to avoid partial data and inconsistent actions.",
  },
} as const;

export default async function SystemUnavailablePage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const params = await searchParams;
  const reason =
    params.reason === "backend_unhealthy"
      ? "backend_unhealthy"
      : "backend_unreachable";
  const copy = COPY[reason];

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F4F4F9] px-4 py-10 text-slate-900">
      <section className="w-full max-w-2xl rounded-[30px] border border-white/70 bg-white/90 p-8 shadow-[0_26px_60px_rgba(15,23,42,0.14)] ring-1 ring-slate-100/80">
        <div className="space-y-4">
          <span className="inline-flex rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-rose-700 ring-1 ring-rose-100">
            System unavailable
          </span>
          <h1 className="text-3xl font-bold tracking-tight">{copy.title}</h1>
          <p className="text-sm leading-7 text-slate-600">
            {copy.description}
          </p>
          <p className="text-sm leading-7 text-slate-600">
            If this persists, check backend health, proxy configuration, and
            upstream credentials before allowing users back into the main UI.
          </p>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/"
            className="rounded-2xl bg-[var(--ioc-blue)] px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(10,132,255,0.4)] transition hover:bg-[#0070f0]"
          >
            Retry
          </Link>
          <Link
            href="/login"
            className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Go to login
          </Link>
        </div>
      </section>
    </main>
  );
}
