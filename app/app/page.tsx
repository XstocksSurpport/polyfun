"use client";

import { useState } from "react";
import { useMarkets } from "@/hooks/useMarkets";
import { MarketCard } from "@/components/market/MarketCard";
import { LinkButton } from "@/components/ui/Button";
import { EmptyBlock, LoadingBlock, ErrorBlock } from "@/components/ui/State";
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
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <section className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-1 text-xs font-medium uppercase tracking-widest text-neutral-400">
            Markets
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-neutral-900">
            Live predictions
          </h1>
        </div>
        <LinkButton href="/launch" size="md">
          Launch
        </LinkButton>
      </section>

      <div className="mb-6 flex gap-1 overflow-x-auto border-b border-neutral-100 pb-px">
        {filters.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={`shrink-0 cursor-pointer px-4 py-2 text-sm transition-colors ${
              filter === f.id
                ? "border-b-2 border-neutral-900 text-neutral-900 -mb-px"
                : "text-neutral-400 hover:text-neutral-600"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading && <LoadingBlock />}
      {error && <ErrorBlock code={error.message} />}
      {!isLoading && data?.error && !data.configured && <ErrorBlock code={data.error} />}
      {!isLoading && data?.configured && markets.length === 0 && <EmptyBlock />}

      {!isLoading && markets.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {markets.map((market) => (
            <MarketCard key={market.address} market={market} />
          ))}
        </div>
      )}
    </div>
  );
}
