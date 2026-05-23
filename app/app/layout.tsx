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
    template: "%s ? Polyfun",
  },
  description: "Prediction launchpad on Base ? launch meme tokens with YES/NO markets.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        className={`${jakarta.variable} min-h-screen font-sans antialiased tracking-tight text-zinc-900`}
      >
        <div className="ambient-grid relative flex min-h-screen flex-col">
          <div
            aria-hidden
            className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
          >
            <div className="animate-float-soft absolute -left-24 top-0 h-[28rem] w-[28rem] rounded-full bg-gradient-to-br from-violet-200/40 to-fuchsia-100/20 blur-3xl" />
            <div className="absolute -right-16 top-32 h-80 w-80 rounded-full bg-gradient-to-bl from-cyan-200/35 to-sky-100/15 blur-3xl" />
            <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-gradient-to-t from-zinc-200/30 to-transparent blur-3xl" />
          </div>

          <AppProviders>
            <Chrome />
            <main className="relative flex-1">{children}</main>
            <Footer />
          </AppProviders>
        </div>
      </body>
    </html>
  );
}
