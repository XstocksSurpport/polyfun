"use client";

import { useParams } from "next/navigation";
import { useMarket, useMarketTrades } from "@/hooks/useMarkets";
import { formatEth } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { PpppBadge } from "@/components/ui/PpppBadge";
import { MigrationProgress } from "@/components/market/MigrationProgress";
import { Countdown } from "@/components/market/Countdown";
import { YesNoTrade } from "@/components/market/YesNoTrade";
import { RatioChart } from "@/components/market/RatioChart";
import { TradeTabs } from "@/components/market/TradeTabs";
import { ExternalPoolLink } from "@/components/market/ExternalPoolLink";
import { LaunchGuardBadge } from "@/components/market/LaunchGuardBadge";
import { ExternalOptionPanel } from "@/components/market/ExternalOptionPanel";
import { LoadingBlock, ErrorBlock } from "@/components/ui/State";

export function MarketPageClient() {
  const params = useParams();
  const address = params.address as string;
  const { data, isLoading, error } = useMarket(address);
  const { data: tradesData, isLoading: tradesLoading } = useMarketTrades(address);

  if (isLoading) return <LoadingBlock />;
  if (error) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8">
        <ErrorBlock code={error.message} />
      </div>
    );
  }
  if (!data?.market) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8">
        <ErrorBlock code={data?.error ?? "NOT_FOUND"} />
      </div>
    );
  }

  const market = data.market;
  const isMigrated = market.status === "migrated";
  const totalPool = market.yesValueWei + market.noValueWei;
  const yesOdds =
    market.yesValueWei > 0n ? Number(totalPool) / Number(market.yesValueWei) : 1;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold text-neutral-900">${market.symbol}</h1>
            {market.isOfficial && <Badge variant="outline">OK</Badge>}
            <LaunchGuardBadge market={market} />
            {isMigrated && <Badge variant="default">DEX</Badge>}
          </div>
          <PpppBadge address={market.token} showFull className="mt-2" />
          {market.externalPool && (
            <ExternalPoolLink market={market} className="mt-2 block" />
          )}
          {market.proposition ? (
            <p className="mt-4 text-sm text-neutral-600">{market.proposition}</p>
          ) : null}
        </div>
        {market.status === "active" && <Countdown expiryTs={market.expiryTs} />}
      </div>

      <div className="grid gap-8 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-3">
          {!isMigrated ? (
            <section className="rounded-xl border border-neutral-100 p-6">
              <MigrationProgress
                yesRatioBps={market.yesRatioBps}
                yesValueWei={market.yesValueWei}
                thresholdBps={market.thresholdBps}
              />
              <div className="mt-6 grid grid-cols-2 gap-4 border-t border-neutral-50 pt-6">
                <Stat label="NO" value={formatEth(market.noValueWei, 4)} />
                <Stat label="Odds" value={`${yesOdds.toFixed(2)}x`} />
                <Stat label="YES" value={formatEth(market.yesValueWei, 4)} />
                <Stat label="Pool" value={formatEth(totalPool, 4)} />
              </div>
            </section>
          ) : (
            <section className="rounded-xl border border-neutral-100 p-6">
              <dl className="grid grid-cols-2 gap-4 text-sm">
                <Stat label="Pool" value={formatEth(totalPool, 4)} />
                <Stat label="Status" value="migrated" />
              </dl>
            </section>
          )}

          {!isMigrated && <RatioChart trades={tradesData?.trades ?? []} />}
          <TradeTabs
            proposition={market.proposition}
            creator={market.creator}
            trades={tradesData?.trades ?? []}
            tradesLoading={tradesLoading}
            tradesError={tradesData?.error}
          />
        </div>

        <div className="lg:col-span-2">
          <div className="sticky top-20 rounded-xl border border-neutral-100 p-6">
            {isMigrated ? (
              <ExternalOptionPanel market={market} />
            ) : (
              <YesNoTrade market={market} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-neutral-400">{label}</p>
      <p className="mt-0.5 text-sm font-medium tabular-nums text-neutral-900">{value}</p>
    </div>
  );
}
