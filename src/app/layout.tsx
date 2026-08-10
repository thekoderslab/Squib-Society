import type { Metadata, Viewport } from "next";
import { Space_Mono } from "next/font/google";

import { CHAIN, COLLECTION_NAME, MINT_VENUE, TOTAL_SUPPLY } from "@/lib/constants";
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
  title: `${COLLECTION_NAME} — ${TOTAL_SUPPLY} tiny old gods took up hobbies`,
  description: `A collection of ${TOTAL_SUPPLY} designer-toy squibs. Allowlist open now. Minting on ${MINT_VENUE}, on ${CHAIN}.`,
  openGraph: {
    title: `${COLLECTION_NAME}`,
    description: `${TOTAL_SUPPLY} tiny old gods took up hobbies. Join the allowlist.`,
    type: "website",
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
        {/* Display + body faces. Fontshare is the source for Clash Display and
            Satoshi; both fall back to a rounded system stack in globals.css. */}
        <link rel="preconnect" href="https://api.fontshare.com" />
        <link rel="preconnect" href="https://cdn.fontshare.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://api.fontshare.com/v2/css?f%5B%5D=clash-display@600,700,500&f%5B%5D=satoshi@400,500,700&display=swap"
        />
      </head>
      <body className="min-h-dvh bg-cream text-ink antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-squib focus:px-4 focus:py-2 focus:text-white"
        >
          Skip to content
        </a>
        <ProgressProvider>{children}</ProgressProvider>
      </body>
    </html>
  );
}
