"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { Market } from "@/lib/types";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { CopyAddressButton } from "@/components/ui/CopyAddressButton";
import { SocialIconLinks } from "./SocialIconLinks";
import { Countdown } from "./Countdown";
import { formatMarketProposition } from "@/lib/market-utils";
import { isPlatformMarket, resolveMarketSocialLinks } from "@/lib/platform";
import { useMarketTrades } from "@/hooks/useMarkets";
import { MarketLineChart } from "./MarketLineChart";
import { YesNoTrade } from "./YesNoTrade";
import { PlatformVerifiedBadge } from "@/components/ui/PlatformVerifiedBadge";

interface MarketTradeModalProps {
  market: Market;
  side: "yes" | "no";
  onClose: () => void;
}

export function MarketTradeModal({ market, side, onClose }: MarketTradeModalProps) {
  const [mounted, setMounted] = useState(false);
  const { data: tradesData } = useMarketTrades(market.address, {
    live: market.status === "active",
  });
  const trades = tradesData?.trades ?? [];

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const handleBackdrop = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose]
  );

  if (!mounted) return null;

  const title = formatMarketProposition(market.symbol);
  const isPlatform = isPlatformMarket(market.address);
  const social = resolveMarketSocialLinks(market);

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center bg-black/25 p-0 backdrop-blur-[2px] sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="trade-modal-title"
      onClick={handleBackdrop}
    >
      <div
        className="animate-sheet-up flex w-[92%] max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-[0_24px_60px_rgba(0,0,0,0.08)] sm:w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 justify-center pt-2 sm:hidden" aria-hidden>
          <span className="h-1 w-10 rounded-full bg-zinc-200" />
        </div>

        <div className="flex items-start justify-between gap-2 px-4 pb-2 pt-1.5 sm:px-4 sm:pt-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-sm font-medium tracking-tight text-zinc-900">${market.symbol}</span>
              {isPlatform ? <PlatformVerifiedBadge compact /> : null}
              <CopyAddressButton address={market.token} />
              <SocialIconLinks
                twitter={social.twitter}
                telegram={social.telegram}
                website={social.website}
              />
              <StatusBadge status={market.status} />
              {market.status === "active" ? (
                <Countdown
                  expiryTs={market.expiryTs}
                  compact
                  label="left"
                  timeClassName="text-xs font-semibold tabular-nums text-zinc-600"
                  labelClassName="text-[10px] text-zinc-400"
                />
              ) : null}
            </div>
            <h2
              id="trade-modal-title"
              className="mt-1 text-sm font-medium leading-relaxed tracking-tight text-zinc-900"
            >
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="space-y-2.5 px-4 pb-4 sm:pb-4">
          <MarketLineChart
            trades={trades}
            fallbackRatioBps={market.yesRatioBps}
            live={market.status === "active"}
            compact
            className="border-zinc-100 shadow-none"
          />

          <YesNoTrade market={market} initialSide={side} compact />
        </div>
      </div>
    </div>,
    document.body
  );
}
