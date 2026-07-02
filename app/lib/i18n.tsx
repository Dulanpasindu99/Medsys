"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { type Lang, translate } from "./translations";

type Ctx = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
};

const LanguageContext = createContext<Ctx | null>(null);

export function LanguageProvider({ initialLang, children }: { initialLang: Lang; children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang);
  const router = useRouter();

  const setLang = useCallback(
    (next: Lang) => {
      setLangState(next);
      try {
        localStorage.setItem("medlink_lang", next);
        // Persist a cookie too so the server render (landing page) matches on next load — no flash.
        document.cookie = `medlink_lang=${next}; path=/; max-age=31536000; samesite=lax`;
        document.documentElement.lang = next;
      } catch {
        /* storage blocked — language still applies for this session */
      }
      // Soft-refresh so server-rendered strings (e.g. the landing cards) re-translate with the
      // new cookie immediately, without a full reload or losing client state.
      router.refresh();
    },
    [router]
  );

  const t = useCallback((key: string, vars?: Record<string, string | number>) => translate(lang, key, vars), [lang]);

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): Ctx {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within a LanguageProvider");
  return ctx;
}

export function useT() {
  return useLanguage().t;
}
