"use client";

import Link from "next/link";
import { useWallet } from "@/providers/WalletProvider";
import { useMarkets } from "@/hooks/useMarkets";
import { truncateAddress } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { PpppBadge } from "@/components/ui/PpppBadge";
import { LoadingBlock, EmptyBlock, ErrorBlock } from "@/components/ui/State";
import { useEffect, useState } from "react";

interface SharePosition {
  marketAddress: string;
  symbol: string;
  token: string;
  yesShares: bigint;
  noShares: bigint;
}

export default function PortfolioPage() {
  const { address } = useWallet();
  const { data: marketsData, isLoading } = useMarkets();
  const [positions, setPositions] = useState<SharePosition[]>([]);
  const [polyfunBalance, setPolyfunBalance] = useState<bigint>(0n);
  const [loadingShares, setLoadingShares] = useState(false);

  useEffect(() => {
    if (!address || !marketsData?.markets?.length) {
      setPositions([]);
      return;
    }

    let cancelled = false;
    setLoadingShares(true);

    Promise.all(
      marketsData.markets.map(async (market) => {
        const res = await fetch(
          `/api/portfolio/shares?market=${market.address}&account=${address}`
        );
        if (!res.ok) return null;
        const data = await res.json();
        if (data.yesShares === "0" && data.noShares === "0") return null;
        return {
          marketAddress: market.address,
          symbol: market.symbol,
          token: market.token,
          yesShares: BigInt(data.yesShares),
          noShares: BigInt(data.noShares),
        };
      })
    ).then((results) => {
      if (cancelled) return;
      setPositions(results.filter(Boolean) as SharePosition[]);
      setLoadingShares(false);
    });

    fetch(`/api/portfolio/shares?market=${marketsData.markets[0].address}&account=${address}`)
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled && d.polyfunBalance) setPolyfunBalance(BigInt(d.polyfunBalance));
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [address, marketsData?.markets]);

  if (!address) return <EmptyBlock />;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-semibold text-neutral-900">Portfolio</h1>
      <p className="mt-1 font-mono text-xs text-neutral-400">{truncateAddress(address)}</p>

      <div className="mt-8 rounded-xl border border-neutral-100 p-6">
        <p className="text-xs text-neutral-400">POLYFUN</p>
        <p className="mt-1 text-2xl font-semibold tabular-nums text-neutral-900">
          {(Number(polyfunBalance) / 1e18).toLocaleString()}
        </p>
      </div>

      {(isLoading || loadingShares) && <LoadingBlock />}
      {marketsData?.error && !marketsData.configured && (
        <ErrorBlock code={marketsData.error} />
      )}

      <div className="mt-6 divide-y divide-neutral-100 rounded-xl border border-neutral-100">
        {positions.map((pos) => (
          <Link
            key={pos.marketAddress}
            href={`/market/${pos.marketAddress}`}
            className="flex items-center justify-between p-4 hover:bg-neutral-50/50"
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium">${pos.symbol}</span>
                {pos.yesShares > 0n && <Badge variant="yes">YES</Badge>}
                {pos.noShares > 0n && <Badge variant="no">NO</Badge>}
              </div>
              <PpppBadge address={pos.token} className="mt-1" />
            </div>
            <div className="text-right text-sm tabular-nums text-neutral-600">
              {pos.yesShares > 0n && <p>{pos.yesShares.toString()}</p>}
              {pos.noShares > 0n && <p>{pos.noShares.toString()}</p>}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
