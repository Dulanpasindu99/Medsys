// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import { PageTransition } from "./components/PageTransition";
import NavigationPanel from "./components/NavigationPanel";

export const metadata: Metadata = {
  title: "Medsys UI",
  description: "Doctor dashboard",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      {/* Ignore extension-injected attributes on hydration (e.g., Grammarly) */}
      <body suppressHydrationWarning className="antialiased ios-shell">
        <div className="flex h-screen w-screen overflow-hidden bg-[#F4F4F9]">
          <NavigationPanel />
          <main className="flex-1 overflow-y-auto pl-[96px] lg:pl-[130px]">
            <div className="page-width">
              <PageTransition>{children}</PageTransition>
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
