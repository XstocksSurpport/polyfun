import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AppShell } from "@/components/layout/AppShell";
import { AppProviders } from "@/providers/AppProviders";
import { SITE_SLOGAN } from "@/lib/config";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Polyfun",
    template: "%s · Polyfun",
  },
  description: `${SITE_SLOGAN} on Base — launch meme tokens with YES/NO markets.`,
  openGraph: {
    description: SITE_SLOGAN,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} min-h-dvh font-sans antialiased`}>
        <AppProviders>
          <AppShell>{children}</AppShell>
        </AppProviders>
      </body>
    </html>
  );
}
