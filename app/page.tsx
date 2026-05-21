import Image from "next/image";
import Link from "next/link";
import { redirectAuthenticated } from "./lib/page-auth";

const CROSS_LOADER_POINTS = [
  { left: "8%", top: "16%", size: 20, delay: "0s", duration: "2.4s" },
  { left: "24%", top: "34%", size: 30, delay: "0.2s", duration: "2.8s" },
  { left: "42%", top: "18%", size: 24, delay: "0.35s", duration: "2.5s" },
  { left: "56%", top: "44%", size: 34, delay: "0.5s", duration: "3s" },
  { left: "70%", top: "24%", size: 18, delay: "0.65s", duration: "2.3s" },
  { left: "86%", top: "40%", size: 26, delay: "0.8s", duration: "2.7s" },
  { left: "14%", top: "64%", size: 28, delay: "0.95s", duration: "2.6s" },
  { left: "34%", top: "78%", size: 20, delay: "1.1s", duration: "2.4s" },
  { left: "54%", top: "68%", size: 24, delay: "1.25s", duration: "2.8s" },
  { left: "76%", top: "76%", size: 30, delay: "1.4s", duration: "2.9s" },
] as const;

const MEDICAL_PILL_POINTS = [
  { left: "16%", top: "30%", width: 44, tilt: "-18deg", delay: "0.1s", duration: "4.6s" },
  { left: "31%", top: "58%", width: 50, tilt: "22deg", delay: "0.5s", duration: "5s" },
  { left: "66%", top: "28%", width: 46, tilt: "-12deg", delay: "0.8s", duration: "4.8s" },
  { left: "80%", top: "62%", width: 52, tilt: "16deg", delay: "1.1s", duration: "5.2s" },
] as const;

const VITAL_ORB_POINTS = [
  { left: "10%", top: "72%", size: 10, delay: "0s", duration: "3.6s" },
  { left: "25%", top: "22%", size: 8, delay: "0.4s", duration: "3.2s" },
  { left: "45%", top: "74%", size: 12, delay: "0.65s", duration: "3.8s" },
  { left: "62%", top: "18%", size: 9, delay: "0.95s", duration: "3.3s" },
  { left: "88%", top: "52%", size: 11, delay: "1.25s", duration: "3.5s" },
] as const;

export default async function LandingPage() {
  await redirectAuthenticated();

  return (
    <main className="relative isolate h-dvh overflow-hidden bg-slate-50 text-slate-900">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[8%] top-[8%] h-72 w-72 rounded-full bg-cyan-200/40 blur-3xl animate-float-slow" />
        <div className="absolute right-[10%] top-[10%] h-64 w-64 rounded-full bg-sky-200/35 blur-3xl animate-float-medium" />
      </div>

      <div className="relative mx-auto flex h-full w-full max-w-7xl items-center px-3 py-3 sm:px-5 sm:py-5">
        <section className="ios-surface flex h-full w-full min-h-0 flex-col overflow-hidden rounded-[34px] border border-white/75 bg-white/85 p-4 shadow-[0_30px_70px_rgba(15,23,42,0.14)] sm:p-6 lg:p-8">
          <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[1.02fr_0.98fr]">
            <div className="flex min-h-0 flex-col justify-between rounded-[26px] border border-white/80 bg-gradient-to-br from-white via-cyan-50/55 to-sky-50/55 p-4 shadow-[0_14px_32px_rgba(15,23,42,0.08)] sm:p-5">
              <div className="flex min-h-0 flex-1 flex-col gap-4">
                <div className="flex h-14 items-center justify-start">
                  <Image
                    src="/assets/medlink-logo-optimized.png"
                    alt="Medlink logo"
                    width={360}
                    height={80}
                    className="h-11 w-auto object-contain sm:h-12"
                    priority
                  />
                </div>

                <h1 className="text-[clamp(1.6rem,3.4vw,3rem)] leading-[1.08] font-black tracking-tight text-slate-900">
                  MedLink. Unified workflow for clinical care and walk-in practice.
                </h1>
                <p className="max-w-2xl text-[clamp(0.84rem,1.5vw,1.02rem)] leading-relaxed text-slate-600">
                  A focused first-screen experience for owners, doctors, and assistants to manage consultations, walk-ins, schedules, tasks, and live clinic operations from one secure platform.
                </p>

                <div className="relative mt-2 min-h-[210px] flex-1 overflow-hidden rounded-2xl border border-cyan-100/80 bg-gradient-to-br from-cyan-50/75 via-white to-sky-50/75 ring-1 ring-white/80">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(165,243,252,0.45),transparent_42%),radial-gradient(circle_at_80%_75%,rgba(125,211,252,0.35),transparent_45%)]" />
                  {MEDICAL_PILL_POINTS.map((pill, index) => (
                    <span
                      key={`${pill.left}-${pill.top}-${index}`}
                      className="medical-pill-shell"
                      style={{
                        left: pill.left,
                        top: pill.top,
                        transform: `translate(-50%, -50%) rotate(${pill.tilt})`,
                      }}
                      aria-hidden="true"
                    >
                      <span
                        className="medical-pill"
                        style={{
                          width: `${pill.width}px`,
                          animationDelay: pill.delay,
                          animationDuration: pill.duration,
                        }}
                      />
                    </span>
                  ))}
                  {VITAL_ORB_POINTS.map((orb, index) => (
                    <span
                      key={`${orb.left}-${orb.top}-${index}`}
                      className="medical-vital-orb"
                      style={{
                        left: orb.left,
                        top: orb.top,
                        width: `${orb.size}px`,
                        height: `${orb.size}px`,
                        animationDelay: orb.delay,
                        animationDuration: orb.duration,
                      }}
                      aria-hidden="true"
                    />
                  ))}
                  {CROSS_LOADER_POINTS.map((point, index) => (
                    <span
                      key={`${point.left}-${point.top}-${index}`}
                      className="cross-loader-icon"
                      style={{
                        left: point.left,
                        top: point.top,
                        width: `${point.size}px`,
                        height: `${point.size}px`,
                        animationDelay: point.delay,
                        animationDuration: point.duration,
                      }}
                      aria-hidden="true"
                    />
                  ))}
                  <div className="pointer-events-none absolute inset-0 grid place-items-center px-4">
                    <div className="medlink-identity text-center" aria-hidden="true">
                      <h2 className="medlink-identity__name" data-text="MedLink">
                        <span>Med</span>
                        <span>Link</span>
                      </h2>
                    </div>
                  </div>
                  <div className="medical-ecg" aria-hidden="true">
                    <svg viewBox="0 0 320 64" className="medical-ecg__svg" preserveAspectRatio="none">
                      <path
                        className="medical-ecg__line"
                        d="M0 35 L44 35 L56 35 L70 13 L84 53 L98 35 L132 35 L148 23 L163 35 L206 35 L223 18 L238 50 L252 35 L320 35"
                      />
                    </svg>
                    <span className="medical-ecg__beam" />
                  </div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2.5">
                <Link
                  href="/login"
                  className="app-button app-button--primary app-button--pill px-6 animate-shimmer-sweep"
                >
                  Enter Platform
                </Link>
                <span className="rounded-full bg-white/85 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-600 ring-1 ring-slate-100">
                  Owner / Doctor / Assistant
                </span>
              </div>
            </div>

            <div className="relative min-h-0 overflow-hidden rounded-[26px] border border-white/80 shadow-[0_14px_32px_rgba(15,23,42,0.12)]">
              <Image
                src="/assets/home-hero-medical.jpg"
                alt="Clinical consultation scene"
                fill
                className="h-full w-full object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-slate-900/25 via-transparent to-cyan-900/10" />
            </div>
          </div>

          <div className="mt-4 flex shrink-0 items-center justify-center rounded-2xl border border-white/80 bg-white/80 px-4 py-2 ring-1 ring-slate-100 shadow-[0_10px_24px_rgba(15,23,42,0.08)]">
            <span className="mr-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-500">
              Built by
            </span>
            <Image
              src="/assets/aldtan-logo-optimized.png"
              alt="ALDTAN company logo"
              width={220}
              height={48}
              className="h-7 w-auto object-contain"
            />
          </div>
        </section>
      </div>
    </main>
  );
}
