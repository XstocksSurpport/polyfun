"use client";

import { useCallback, useEffect, useState } from "react";
import type { Market } from "@/lib/types";
import { formatEth, cn } from "@/lib/utils";
import { formatMarketProposition, canTradeMarket } from "@/lib/market-utils";
import { isPlatformMarket } from "@/lib/platform";
import { buttonClassName } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { PlatformVerifiedBadge } from "@/components/ui/PlatformVerifiedBadge";
import { Countdown } from "./Countdown";
import { MarketTradeModal } from "./MarketTradeModal";

export type PendingTrade = {
  address: string;
  side: "yes" | "no";
};

interface MarketTableProps {
  markets: Market[];
  /** Full market list for deep-link modal lookup (may differ from filtered `markets`). */
  tradeLookupMarkets?: Market[];
  pendingTrade?: PendingTrade | null;
  onPendingTradeOpened?: () => void;
}

export function MarketTable({
  markets,
  tradeLookupMarkets,
  pendingTrade,
  onPendingTradeOpened,
}: MarketTableProps) {
  const [active, setActive] = useState<{ market: Market; side: "yes" | "no" } | null>(null);

  const openTrade = useCallback((market: Market, side: "yes" | "no") => {
    setActive({ market, side });
  }, []);

  const closeTrade = useCallback(() => setActive(null), []);

  const lookupMarkets = tradeLookupMarkets ?? markets;

  useEffect(() => {
    if (!pendingTrade || lookupMarkets.length === 0) return;
    const market = lookupMarkets.find(
      (m) => m.address.toLowerCase() === pendingTrade.address.toLowerCase()
    );
    if (market) {
      setActive({ market, side: pendingTrade.side });
      onPendingTradeOpened?.();
    }
  }, [pendingTrade, lookupMarkets, onPendingTradeOpened]);

  return (
    <>
      {markets.length > 0 ? (
        <ul className="flex flex-col gap-3">
          {markets.map((market) => (
            <MarketRow key={market.address} market={market} onOpenTrade={openTrade} />
          ))}
        </ul>
      ) : null}

      {active ? (
        <MarketTradeModal market={active.market} side={active.side} onClose={closeTrade} />
      ) : null}
    </>
  );
}

function MarketRow({
  market,
  onOpenTrade,
}: {
  market: Market;
  onOpenTrade: (market: Market, side: "yes" | "no") => void;
}) {
  const totalPool = market.yesValueWei + market.noValueWei;
  const title = formatMarketProposition(market.symbol);
  const canTrade = canTradeMarket(market);
  const isPlatform = isPlatformMarket(market.address);

  return (
    <li
      className={cn(
        "flex items-center gap-3 rounded-xl border px-4 py-4 shadow-sm backdrop-blur-sm transition-colors sm:gap-4 sm:px-5 sm:py-5",
        isPlatform
          ? "border-emerald-200/80 bg-emerald-50/30 hover:border-emerald-300/80 hover:bg-emerald-50/50"
          : "border-zinc-200/80 bg-white/90 hover:border-zinc-300/80 hover:bg-zinc-50/50"
      )}
    >
      <button
        type="button"
        onClick={() => canTrade && onOpenTrade(market, "yes")}
        disabled={!canTrade}
        className="flex min-w-0 flex-1 items-center gap-3 text-left sm:gap-4 disabled:cursor-default"
      >
        <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-zinc-100 bg-zinc-50">
          {market.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={market.imageUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="text-xs font-semibold text-zinc-500">{market.symbol.slice(0, 2)}</span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="text-title truncate">{title}</p>
            {isPlatform ? <PlatformVerifiedBadge compact /> : null}
          </div>
          <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-meta">
            <span>${market.symbol}</span>
            <span aria-hidden>·</span>
            <span>
              Vol <span className="tabular-nums">{formatEth(totalPool, 2)}</span>
            </span>
            {market.status === "active" ? (
              <>
                <span aria-hidden>·</span>
                <span>
                  <Countdown expiryTs={market.expiryTs} compact label="left" />
                </span>
              </>
            ) : null}
          </p>
        </div>
      </button>

      <div className="flex shrink-0 items-center gap-2">
        <StatusBadge status={market.status} />
        {canTrade ? (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onOpenTrade(market, "yes")}
              className={buttonClassName("primary", "sm", "h-8 min-w-[3.25rem] px-3 text-xs font-medium")}
            >
              Yes
            </button>
            <button
              type="button"
              onClick={() => onOpenTrade(market, "no")}
              className={buttonClassName(
                "secondary",
                "sm",
                "h-8 min-w-[3.25rem] border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-950 hover:bg-zinc-50"
              )}
            >
              No
            </button>
          </div>
        ) : null}
      </div>
    </li>
  );
}
