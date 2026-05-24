"use client";

import { contracts, EXPLORER_URL } from "@/lib/config";
import { PpppBadge } from "@/components/ui/PpppBadge";
import Link from "next/link";

export function PlatformTokenCard({ compact = false }: { compact?: boolean }) {
  if (!contracts.polyfun) {
    return null;
  }

  return (
    <section className={compact ? "rounded-2xl border border-zinc-200/80 bg-white p-4" : "rounded-xl border border-neutral-200 bg-white p-5"}>
      <p className="text-eyebrow text-zinc-400">Platform Token</p>
      <h2 className="mt-1 text-base font-bold text-zinc-900">$POLY</h2>
      <PpppBadge address={contracts.polyfun} showFull className="mt-3 block text-xs" />
      <a
        href={`${EXPLORER_URL}/token/${contracts.polyfun}`}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-block text-xs font-medium text-zinc-600 underline hover:text-zinc-900"
      >
        Basescan
      </a>
    </section>
  );
}

export function GenesisMarketBanner() {
  const market = contracts.platformMarket;
  if (!market) return null;

  return (
    <Link
      href={`/markets?market=${market}&side=yes`}
      className="flex items-center justify-between gap-4 rounded-2xl border border-zinc-200 bg-white p-5 transition hover:border-zinc-300 hover:shadow-sm"
    >
      <div>
        <p className="text-eyebrow text-neutral-900">Live</p>
        <h2 className="mt-1 text-lg font-bold text-zinc-900">$poly · Polyfun</h2>
      </div>
      <span className="shrink-0 text-sm font-semibold text-zinc-900">Trade →</span>
    </Link>
  );
}
