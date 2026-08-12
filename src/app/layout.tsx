import type { Metadata, Viewport } from "next";
import { Space_Mono } from "next/font/google";

import Footer from "@/components/Footer";
import TopNav from "@/components/TopNav";
import {
  CHAIN,
  COLLECTION_NAME,
  LOGO,
  MINT_VENUE,
  SITE_URL,
  TOTAL_SUPPLY,
} from "@/lib/constants";
import { ProgressProvider } from "@/state/progress";
import "./globals.css";

/** Mono is the structural device: counters, addresses, ranks, points. */
const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-space-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${COLLECTION_NAME}, ${TOTAL_SUPPLY} squibs`,
    template: `%s · ${COLLECTION_NAME}`,
  },
  description: `${TOTAL_SUPPLY} squibs, and every one of them is up to something. Allowlist is open. Minting on ${MINT_VENUE}, on ${CHAIN}.`,
  icons: {
    icon: LOGO.badge,
    apple: LOGO.badge,
  },
  openGraph: {
    title: COLLECTION_NAME,
    description: `${TOTAL_SUPPLY} squibs, and every one of them is up to something.`,
    type: "website",
    images: [{ url: LOGO.badge, width: 1200, height: 1200 }],
  },
  twitter: {
    card: "summary_large_image",
    title: COLLECTION_NAME,
    description: `${TOTAL_SUPPLY} squibs, and every one of them is up to something.`,
    images: [LOGO.badge],
  },
};

export const viewport: Viewport = {
  themeColor: "#F4EFE6",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={spaceMono.variable}>
      <head>
        {/* Bespoke Slab is the display face — vintage press weight with enough
            bulk to carry the brutalist headlines. Satoshi stays for body copy.
            Both fall back to a slab/system stack in globals.css. */}
        <link rel="preconnect" href="https://api.fontshare.com" />
        <link rel="preconnect" href="https://cdn.fontshare.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://api.fontshare.com/v2/css?f%5B%5D=bespoke-slab@500,600,700&f%5B%5D=satoshi@400,500,700&display=swap"
        />
      </head>
      <body className="flex min-h-dvh flex-col bg-cream text-ink antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:border-2 focus:border-hairline focus:bg-squib focus:px-4 focus:py-2 focus:font-display focus:uppercase focus:text-ink"
        >
          Skip to content
        </a>
        <ProgressProvider>
          <TopNav />
          <main id="main" className="flex-1">
            {children}
          </main>
          <Footer />
        </ProgressProvider>
      </body>
    </html>
  );
}
