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
        <div className="relative z-10 min-h-screen">
          <div className="page-width">
            <PageTransition>{children}</PageTransition>
          </div>
        </div>
      </body>
    </html>
  );
}
