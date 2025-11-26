// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import { PageTransition } from "./components/PageTransition";

export const metadata: Metadata = {
  title: "MedLink UI",
  description: "Doctor dashboard",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      {/* Ignore extension-injected attributes on hydration (e.g., Grammarly) */}
      <body suppressHydrationWarning className="antialiased ios-shell">
        <div className="relative z-10 min-h-screen px-4 py-4 sm:px-6 sm:py-6 md:px-8 md:py-8">
          <div className="min-h-[calc(100vh-2rem)] rounded-[32px] border border-white/70 bg-white/80 shadow-[0_26px_60px_rgba(15,23,42,0.14)] ring-1 ring-slate-100/70 backdrop-blur-2xl">
            <div className="relative z-10">
              <PageTransition>{children}</PageTransition>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
