"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMarkets } from "@/hooks/useMarkets";
import { MarketTable, type PendingTrade } from "@/components/market/MarketTable";
import { MarketsEmptyState } from "@/components/markets/MarketsEmptyState";
import { ErrorBlock, SetupBlock } from "@/components/ui/State";
import { cn } from "@/lib/utils";
import type { MarketStatus } from "@/lib/types";

type Filter = "all" | MarketStatus;

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "active", label: "Live" },
  { id: "migrated", label: "Migrated" },
  { id: "failed", label: "Failed" },
];

export function MarketsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [filter, setFilter] = useState<Filter>("all");
  const { data, isLoading, error } = useMarkets();

  const pendingTrade = useMemo((): PendingTrade | null => {
    const address = searchParams.get("market");
    if (!address) return null;
    return {
      address,
      side: searchParams.get("side") === "no" ? "no" : "yes",
    };
  }, [searchParams]);

  const clearPendingTrade = useCallback(() => {
    router.replace("/markets", { scroll: false });
  }, [router]);

  const allMarkets = data?.markets ?? [];
  const markets = allMarkets.filter((m) => {
    if (filter === "all") return true;
    if (filter === "active") return m.status === "active";
    return m.status === filter;
  });

  const hasMarkets = markets.length > 0;

  return (
    <div className="page-container pb-12">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tighter text-zinc-950 sm:text-5xl">Markets</h1>
          <p className="mt-3 text-sm text-zinc-500">Browse live YES/NO prediction pools</p>
        </div>
        <div className="flex flex-wrap gap-1 rounded-xl border border-zinc-200/60 bg-white/80 p-1">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
                filter === f.id
                  ? "bg-zinc-950 text-white shadow-sm"
                  : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading && (
        <p className="py-16 text-center text-sm text-zinc-500 animate-pulse-soft">Loading markets…</p>
      )}

      {error && <ErrorBlock code={error.message} />}

      {!isLoading && !error && !data?.configured && <SetupBlock />}

      {!isLoading && !error && data?.configured && !hasMarkets && !pendingTrade && (
        <MarketsEmptyState />
      )}

      {!isLoading && !error && data?.configured && (hasMarkets || pendingTrade) ? (
        <MarketTable
          markets={markets}
          tradeLookupMarkets={allMarkets}
          pendingTrade={pendingTrade}
          onPendingTradeOpened={clearPendingTrade}
        />
      ) : null}
    </div>
  );
}
