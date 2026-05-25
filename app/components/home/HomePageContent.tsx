"use client";

import Link from "next/link";
import { LinkButton } from "@/components/ui/Button";
import { SITE_SLOGAN } from "@/lib/config";
import { PlatformMarketSection } from "@/components/platform/PlatformMarketSection";

export function HomePageContent() {
  return (
    <>
      <section className="flex flex-1 flex-col items-center justify-center px-4 pb-6 pt-4 text-center">
        <Link
          href="/markets"
          className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-zinc-200/60 bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-600 shadow-inner transition-colors hover:text-zinc-900"
        >
          Live on Base <span aria-hidden>→</span>
        </Link>

        <h1 className="max-w-4xl text-4xl font-black tracking-tighter text-zinc-950 sm:text-5xl md:text-6xl">
          {SITE_SLOGAN}
        </h1>

        <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-zinc-500 sm:max-w-xl sm:text-base">
          A beautiful platform to launch meme tokens with YES/NO prediction markets. Open source
          protocol on Base.
        </p>

        <div className="mt-6 flex flex-col items-center gap-2">
          <LinkButton
            href="/markets"
            className="w-44 justify-center rounded-xl bg-zinc-950 px-6 py-2.5 text-sm font-semibold text-white shadow-[0_4px_12px_rgba(0,0,0,0.1)] transition-all hover:bg-zinc-800"
          >
            View Markets
          </LinkButton>
          <LinkButton
            href="/launch"
            className="w-44 justify-center rounded-xl bg-zinc-950 px-6 py-2.5 text-sm font-semibold text-white shadow-[0_4px_12px_rgba(0,0,0,0.1)] transition-all hover:bg-zinc-800"
          >
            New Project
          </LinkButton>
        </div>
      </section>

      <PlatformMarketSection />
    </>
  );
}
