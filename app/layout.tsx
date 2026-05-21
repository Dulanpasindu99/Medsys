// app/layout.tsx
import type { Metadata } from "next";
import { AppQueryProvider } from "./components/AppQueryProvider";
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      {/* Ignore extension-injected attributes on hydration (e.g., Grammarly) */}
      <body suppressHydrationWarning className="antialiased ios-shell">
        <AppQueryProvider>{children}</AppQueryProvider>
      </body>
    </html>
  );
}
