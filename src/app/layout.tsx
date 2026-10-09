import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { siteUrl } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: "Tabis Pork Palace — Premium Pork. Fresh From Source to Table.",
    template: "%s | Tabis Pork Palace",
  },
  description:
    "Buy fresh pork in Nigeria: premium cuts, family packs, whole pigs and wholesale pork supply. Carefully sourced, professionally handled and delivered fresh by Tabis Pork Palace.",
  keywords: ["buy pork in Nigeria", "fresh pork", "whole pig for sale", "pork wholesale", "bulk pork supplier", "pork delivery Lagos"],
  openGraph: {
    title: "Tabis Pork Palace — Premium Pork. Fresh From Source to Table.",
    description: "Premium pork cuts, whole pigs and wholesale supply delivered fresh across Nigeria.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#123D27",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap"
        />
      </head>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
