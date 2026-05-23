"use client";

import { useState } from "react";
import { useMarkets } from "@/hooks/useMarkets";
import { MarketCard } from "@/components/market/MarketCard";
import { EmptyBlock, LoadingBlock, ErrorBlock, SetupBlock } from "@/components/ui/State";
import { cn } from "@/lib/utils";
import type { MarketStatus } from "@/lib/types";

type Filter = "all" | MarketStatus;

export default function HomePage() {
  const [filter, setFilter] = useState<Filter>("all");
  const { data, isLoading, error } = useMarkets();

  const markets = (data?.markets ?? []).filter((m) => {
    if (filter === "all") return true;
    if (filter === "active") return m.status === "active" || m.status === "settling";
    return m.status === filter;
  });

  const filters: { id: Filter; label: string }[] = [
    { id: "all", label: "All" },
    { id: "active", label: "Live" },
    { id: "migrated", label: "Migrated" },
    { id: "failed", label: "Failed" },
  ];

  return (
    <div className="mx-auto max-w-4xl px-6 pb-32 pt-20 sm:px-8 sm:pt-24">
      <header className="mb-16 flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-3">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-400">
            Markets
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 sm:text-[2rem] sm:leading-tight">
            Live predictions
          </h1>
        </div>
        <a
          href="/launch"
          className="glass-button inline-flex w-fit items-center rounded-xl px-5 py-2.5 text-sm font-medium text-zinc-800 transition-all hover:bg-white/70"
        >
          Launch Token
        </a>
      </header>

      <div className="glass-segment mb-20 inline-flex w-fit gap-1 p-1.5">
        {filters.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={cn(
              "rounded-xl px-5 py-2 text-xs transition-all duration-200",
              filter === f.id
                ? "bg-white/90 font-semibold text-zinc-950 shadow-[0_2px_8px_rgba(0,0,0,0.06)] backdrop-blur-sm"
                : "font-medium text-zinc-500 hover:text-zinc-900"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <section className="mt-4 space-y-8">
        {isLoading && <LoadingBlock />}
        {error && <ErrorBlock code={error.message} />}
        {!isLoading && !error && !data?.configured && <SetupBlock />}
        {!isLoading && data?.configured && markets.length === 0 && <EmptyBlock />}

        {!isLoading && markets.length > 0 && (
          <div className="grid gap-6 sm:grid-cols-2">
            {markets.map((market) => (
              <MarketCard key={market.address} market={market} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
