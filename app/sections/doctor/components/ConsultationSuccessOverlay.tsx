export function ConsultationSuccessOverlay() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/10"
      role="status"
      aria-live="polite"
    >
      <div className="consultation-success-pop flex flex-col items-center gap-3 rounded-3xl bg-white/97 px-12 py-9 shadow-[0_30px_70px_rgba(16,185,129,0.28)] ring-1 ring-emerald-100">
        <span className="relative flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500 shadow-[0_14px_32px_rgba(16,185,129,0.45)]">
          <svg viewBox="0 0 52 52" className="h-12 w-12" aria-hidden="true">
            <path
              className="consultation-success-check"
              fill="none"
              stroke="white"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M14 27 l8 8 l16 -18"
            />
          </svg>
        </span>
        <p className="text-base font-bold text-emerald-700">Consultation saved</p>
      </div>
      <style>{`
        .consultation-success-pop {
          animation: consultationSuccessPop 300ms cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes consultationSuccessPop {
          0% { transform: scale(0.82); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        .consultation-success-check {
          stroke-dasharray: 48;
          stroke-dashoffset: 48;
          animation: consultationSuccessDraw 520ms ease-out 130ms forwards;
        }
        @keyframes consultationSuccessDraw {
          to { stroke-dashoffset: 0; }
        }
      `}</style>
    </div>
  );
}
