// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import { Geist, Geist_Mono } from "next/font/google";

const geistSans = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });

export const metadata: Metadata = {
  title: "MedLink UI",
  description: "Doctor dashboard",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      {/* Ignore extension-injected attributes on hydration (e.g., Grammarly) */}
      <body suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}