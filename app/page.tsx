import Image from "next/image";
import Link from "next/link";
import { redirectAuthenticated } from "./lib/page-auth";

export default async function LandingPage() {
  await redirectAuthenticated();

  return (
    <main className="relative isolate min-h-dvh overflow-hidden bg-slate-50 text-slate-900">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[8%] top-[10%] h-72 w-72 rounded-full bg-cyan-200/40 blur-3xl animate-float-slow" />
        <div className="absolute right-[10%] bottom-[8%] h-64 w-64 rounded-full bg-sky-200/35 blur-3xl animate-float-medium" />
      </div>

      <div className="relative mx-auto flex min-h-dvh w-full max-w-5xl flex-col items-center justify-center px-4 py-6 sm:px-6 sm:py-10">
        <Image
          src="/assets/medlink-logo-optimized.png"
          alt="Medlink logo"
          width={360}
          height={80}
          className="h-10 w-auto object-contain sm:h-14"
          priority
        />
        <h1 className="mt-4 text-center text-[clamp(1.5rem,4vw,2.4rem)] font-black leading-tight tracking-tight text-slate-900 sm:mt-6">
          Welcome to MedLink
        </h1>
        <p className="mt-2 max-w-xl text-center text-sm leading-relaxed text-slate-600 sm:text-base">
          Choose how you would like to continue.
        </p>

        <div className="mt-6 grid w-full max-w-3xl grid-cols-1 gap-3 sm:mt-9 sm:grid-cols-2 sm:gap-6">
          {/* General public / patient */}
          <Link
            href="/portal"
            className="group flex flex-col items-center gap-3 rounded-[28px] border border-white/80 bg-white/90 p-5 text-center sm:gap-4 shadow-[0_18px_44px_rgba(15,23,42,0.10)] ring-1 ring-slate-100 transition hover:-translate-y-1 hover:shadow-[0_26px_60px_rgba(2,132,199,0.20)] sm:p-9"
          >
            <span className="grid h-12 w-12 place-items-center rounded-2xl sm:h-16 sm:w-16 bg-sky-50 text-sky-600 ring-1 ring-sky-100 transition group-hover:bg-sky-600 group-hover:text-white">
              <svg viewBox="0 0 24 24" className="h-6 w-6 sm:h-8 sm:w-8" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="12" cy="8" r="3.5" />
                <path d="M5 19c0-3.3 3.1-6 7-6s7 2.7 7 6" strokeLinecap="round" />
              </svg>
            </span>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Login as General Public</h2>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
                Patients: view your records, prescriptions and share reports with your doctors.
              </p>
            </div>
            <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-sky-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition group-hover:bg-sky-700">
              Continue
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </Link>

          {/* Staff / doctor */}
          <Link
            href="/login"
            className="group flex flex-col items-center gap-3 rounded-[28px] border border-white/80 bg-white/90 p-5 text-center sm:gap-4 shadow-[0_18px_44px_rgba(15,23,42,0.10)] ring-1 ring-slate-100 transition hover:-translate-y-1 hover:shadow-[0_26px_60px_rgba(15,23,42,0.18)] sm:p-9"
          >
            <span className="grid h-12 w-12 place-items-center rounded-2xl sm:h-16 sm:w-16 bg-slate-100 text-slate-700 ring-1 ring-slate-200 transition group-hover:bg-slate-900 group-hover:text-white">
              <svg viewBox="0 0 24 24" className="h-6 w-6 sm:h-8 sm:w-8" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M12 3l7 3v5c0 4.4-3 7.6-7 9-4-1.4-7-4.6-7-9V6l7-3z" strokeLinejoin="round" />
                <path d="M9.5 12l1.8 1.8L15 10" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Login as a Doctor</h2>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
                Owners, doctors and assistants sign in to the clinic workspace.
              </p>
            </div>
            <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow-sm transition group-hover:bg-slate-800">
              Continue
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </Link>
        </div>

        <div className="mt-6 flex items-center gap-2 sm:mt-10">
          <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400">Built by</span>
          <Image
            src="/assets/aldtan-logo-optimized.png"
            alt="ALDTAN company logo"
            width={220}
            height={48}
            className="h-6 w-auto object-contain opacity-80"
          />
        </div>
      </div>
    </main>
  );
}
