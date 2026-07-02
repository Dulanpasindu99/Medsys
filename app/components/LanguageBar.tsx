"use client";

import { useLanguage } from "@/app/lib/i18n";
import { LANGUAGES } from "@/app/lib/translations";

// Rounded segmented control for English / Sinhala / Tamil. Reused inline (My Profile) and
// inside the floating landing bar below.
export function LanguageBar({ className = "" }: { className?: string }) {
  const { lang, setLang } = useLanguage();
  return (
    <div
      className={`inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white/95 p-1 shadow-sm ${className}`}
      role="group"
      aria-label="Language"
    >
      {LANGUAGES.map((option) => {
        const active = option.code === lang;
        return (
          <button
            key={option.code}
            type="button"
            onClick={() => setLang(option.code)}
            aria-pressed={active}
            className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${
              active ? "bg-sky-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            {option.native}
          </button>
        );
      })}
    </div>
  );
}

// Fixed to the bottom of the viewport (for the landing page), lifted above the mobile browser
// chrome via the safe-area inset so it's never hidden behind the URL/nav bar.
export function FloatingLanguageBar() {
  return (
    <div
      className="pointer-events-none fixed inset-x-0 z-30 flex justify-center px-4"
      style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 0.9rem)" }}
    >
      <LanguageBar className="pointer-events-auto backdrop-blur" />
    </div>
  );
}
