// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import { PageTransition } from "./components/PageTransition";

export const metadata: Metadata = {
  title: "MedLink UI",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      {/* Ignore extension-injected attributes on hydration (e.g., Grammarly) */}
      <body suppressHydrationWarning className="antialiased ios-shell">
        <div className="page-frame">
          <div className="page-board">
            <div className="page-surface">
              <PageTransition>{children}</PageTransition>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
