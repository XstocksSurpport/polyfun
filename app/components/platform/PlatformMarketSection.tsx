"use client";

import { useState } from "react";
import Link from "next/link";
import { contracts, EXPLORER_URL } from "@/lib/config";
import { useMarket, useMarketTrades } from "@/hooks/useMarkets";
import { formatMarketProposition, canTradeMarket } from "@/lib/market-utils";
import { formatEth } from "@/lib/utils";
import { PlatformVerifiedBadge } from "@/components/ui/PlatformVerifiedBadge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { CopyAddressButton } from "@/components/ui/CopyAddressButton";
import { Countdown } from "@/components/market/Countdown";
import { MarketLineChart } from "@/components/market/MarketLineChart";
import { YesNoTrade } from "@/components/market/YesNoTrade";
import { MarketTradeModal } from "@/components/market/MarketTradeModal";
import { buttonClassName } from "@/components/ui/Button";

export function PlatformMarketSection() {
  const address = contracts.platformMarket;
  const { data, isLoading, error } = useMarket(address ?? "");
  const marketStatus = data?.market?.status;
  const { data: tradesData } = useMarketTrades(address ?? "", {
    live: marketStatus === "active",
  });
  const [modalSide, setModalSide] = useState<"yes" | "no" | null>(null);

  if (!address) {
    return (
      <section className="w-full max-w-3xl px-4 pb-16 pt-10">
        <div className="mb-4 flex flex-wrap items-center justify-center gap-2">
          <PlatformVerifiedBadge />
          <span className="font-display rounded-full border border-zinc-200/80 bg-zinc-50 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            Platform Token
          </span>
        </div>
        <div className="rounded-2xl border border-zinc-200/80 bg-white/95 p-6 text-center shadow-sm">
          <h2 className="text-xl font-black tracking-tight text-zinc-950">$poly · Polyfun</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-zinc-500">
            Official platform prediction market. Deploy with{" "}
            <code className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-xs">
              npm run bootstrap:platform
            </code>{" "}
            once the deploy wallet is funded on Base.
          </p>
        </div>
      </section>
    );
  }

  const market = data?.market;

  if (isLoading) {
    return (
      <section className="w-full max-w-3xl px-4 pb-16 pt-10">
        <div className="rounded-2xl border border-zinc-200/80 bg-white/90 p-8 text-center shadow-sm backdrop-blur-sm">
          <p className="text-sm text-zinc-500 animate-pulse-soft">Loading platform market…</p>
        </div>
      </section>
    );
  }

  if (error || !market) {
    return (
      <section className="w-full max-w-3xl px-4 pb-16 pt-10">
        <div className="rounded-2xl border border-zinc-200/80 bg-white/90 p-6 text-center shadow-sm backdrop-blur-sm">
          <PlatformVerifiedBadge className="mb-3" />
          <h2 className="text-title text-lg">$poly · Polyfun</h2>
          <p className="mt-2 text-sm text-zinc-500">
            Platform market is being deployed. Run{" "}
            <code className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-xs">npm run bootstrap:platform</code>{" "}
            when the deploy wallet is funded.
          </p>
          <a
            href={`${EXPLORER_URL}/address/${address}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-block text-xs font-medium text-zinc-600 underline hover:text-zinc-900"
          >
            View address on Basescan
          </a>
        </div>
      </section>
    );
  }

  const title = formatMarketProposition(market.symbol);
  const totalPool = market.yesValueWei + market.noValueWei;
  const canTrade = canTradeMarket(market);
  const trades = tradesData?.trades ?? [];

  return (
    <>
      <section className="w-full max-w-3xl px-4 pb-16 pt-10">
        <div className="mb-4 flex flex-wrap items-center justify-center gap-2">
          <PlatformVerifiedBadge />
          <span className="font-display rounded-full border border-zinc-200/80 bg-zinc-50 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            Platform Token
          </span>
        </div>

        <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white/95 shadow-[0_8px_30px_rgba(0,0,0,0.04)] backdrop-blur-sm">
          <div className="border-b border-zinc-100 px-5 py-4 sm:px-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-black tracking-tight text-zinc-950 sm:text-2xl">
                    ${market.symbol}
                  </h2>
                  <CopyAddressButton address={market.token} />
                  <StatusBadge status={market.status} />
                  {market.status === "active" ? (
                    <Countdown expiryTs={market.expiryTs} compact label="left" />
                  ) : null}
                </div>
                <p className="mt-1.5 text-sm leading-relaxed text-zinc-600">{title}</p>
                <p className="mt-2 text-meta">
                  Vol <span className="tabular-nums font-medium text-zinc-700">{formatEth(totalPool, 2)}</span>
                  <span aria-hidden className="mx-1.5">·</span>
                  YES{" "}
                  <span className="tabular-nums font-medium text-zinc-700">
                    {(market.yesRatioBps / 100).toFixed(1)}%
                  </span>
                </p>
              </div>

              {canTrade ? (
                <div className="hidden shrink-0 gap-1.5 sm:flex">
                  <button
                    type="button"
                    onClick={() => setModalSide("yes")}
                    className={buttonClassName("primary", "sm", "min-w-[4rem]")}
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalSide("no")}
                    className={buttonClassName(
                      "secondary",
                      "sm",
                      "min-w-[4rem] border-zinc-200 bg-white text-zinc-950 hover:bg-zinc-50"
                    )}
                  >
                    No
                  </button>
                </div>
              ) : null}
            </div>
          </div>

          <div className="space-y-4 px-4 py-4 sm:px-6 sm:py-5">
            <MarketLineChart
              trades={trades}
              fallbackRatioBps={market.yesRatioBps}
              live={market.status === "active"}
            />

            <div className="rounded-xl border border-zinc-100 bg-zinc-50/50 p-3 sm:p-4">
              <p className="text-eyebrow mb-3 tracking-wider text-zinc-400">
                Trade
              </p>
              <YesNoTrade market={market} initialSide="yes" compact />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 bg-zinc-50/40 px-5 py-3 sm:px-6">
            <Link
              href={`/markets?market=${market.address}&side=yes`}
              className="text-xs font-medium text-zinc-600 transition-colors hover:text-zinc-950"
            >
              Open in Markets →
            </Link>
            <a
              href={`${EXPLORER_URL}/address/${market.address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-medium text-zinc-500 underline hover:text-zinc-800"
            >
              Market contract
            </a>
          </div>
        </div>
      </section>

      {modalSide ? (
        <MarketTradeModal market={market} side={modalSide} onClose={() => setModalSide(null)} />
      ) : null}
    </>
  );
}
