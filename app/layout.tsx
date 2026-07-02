// app/layout.tsx
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { AppQueryProvider } from "./components/AppQueryProvider";
import { LanguageProvider } from "./lib/i18n";
import { isLang, type Lang } from "./lib/translations";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Medlink",
    template: "%s | Medlink",
  },
  applicationName: "Medlink",
  description: "Medlink clinical workspace",
  icons: {
    icon: "/assets/medlink-cross.png",
    apple: "/assets/medlink-cross.png",
    shortcut: "/assets/medlink-cross.png",
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Read the saved language server-side so the first paint (incl. the landing page) renders in
  // the chosen language and the client provider hydrates to the same value (no flash).
  const raw = (await cookies()).get("medlink_lang")?.value;
  const lang: Lang = isLang(raw) ? raw : "en";

  return (
    <html lang={lang}>
      {/* Ignore extension-injected attributes on hydration (e.g., Grammarly) */}
      <body suppressHydrationWarning className="antialiased ios-shell">
        <LanguageProvider initialLang={lang}>
          <AppQueryProvider>{children}</AppQueryProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
