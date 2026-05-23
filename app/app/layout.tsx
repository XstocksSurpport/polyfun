import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Chrome } from "@/components/layout/Chrome";
import { Footer } from "@/components/layout/Footer";
import { AppProviders } from "@/providers/AppProviders";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Polyfun",
    template: "%s · Polyfun",
  },
  description: "Prediction launchpad on Base — launch meme tokens with YES/NO markets.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${jakarta.variable} min-h-screen flex flex-col font-sans`}>
        <AppProviders>
          <Chrome />
          <main className="flex-1">{children}</main>
          <Footer />
        </AppProviders>
      </body>
    </html>
  );
}
