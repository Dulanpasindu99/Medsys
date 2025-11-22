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
      <body suppressHydrationWarning className="antialiased bg-[#eaf3ff]">
        <div className="min-h-screen px-4 py-4 sm:px-6 sm:py-6 md:px-8 md:py-8">
          <div className="min-h-[calc(100vh-2rem)] rounded-[30px] border border-white/70 bg-white/95 shadow-[0_18px_42px_rgba(28,63,99,0.09)] ring-1 ring-slate-100/60 backdrop-blur-xl">
            <PageTransition>{children}</PageTransition>
          </div>
        </div>
      </body>
    </html>
  );
}
