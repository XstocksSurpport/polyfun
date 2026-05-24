"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useWallet } from "@/providers/WalletProvider";
import { useMarkets } from "@/hooks/useMarkets";
import { truncateAddress, formatEth } from "@/lib/utils";
import { formatMarketProposition } from "@/lib/market-utils";
import { contracts } from "@/lib/config";
import { Badge } from "@/components/ui/Badge";
import { PpppBadge } from "@/components/ui/PpppBadge";
import { SetupBlock } from "@/components/ui/State";
import { ClaimActions } from "@/components/portfolio/ClaimActions";
import { ConnectButton } from "@/components/layout/ConnectButton";
import type { MarketStatus } from "@/lib/types";

interface SharePosition {
  marketAddress: string;
  symbol: string;
  token: string;
  yesShares: bigint;
  noShares: bigint;
  yesClaimed: boolean;
  noClaimed: boolean;
  status: MarketStatus;
  expiryTs: number;
}

export default function PortfolioPage() {
  const { address } = useWallet();
  const { data: marketsData, isLoading } = useMarkets();
  const [positions, setPositions] = useState<SharePosition[]>([]);
  const [polyfunBalance, setPolyfunBalance] = useState<bigint>(0n);
  const [loadingShares, setLoadingShares] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const loadPositions = useCallback(async () => {
    if (!address || !marketsData?.markets?.length) {
      setPositions([]);
      setLoadingShares(false);
      return;
    }

    setLoadingShares(true);
    const results = await Promise.all(
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
          token: data.token ?? market.token,
          yesShares: BigInt(data.yesShares),
          noShares: BigInt(data.noShares),
          yesClaimed: Boolean(data.yesClaimed),
          noClaimed: Boolean(data.noClaimed),
          status: (data.status ?? market.status) as MarketStatus,
          expiryTs: data.expiryTs ?? market.expiryTs,
        };
      })
    );
    setPositions(results.filter(Boolean) as SharePosition[]);
    setLoadingShares(false);
  }, [address, marketsData?.markets]);

  useEffect(() => {
    if (!address) {
      setPositions([]);
      setPolyfunBalance(0n);
      return;
    }

    void loadPositions();

    const probeMarket = contracts.platformMarket ?? marketsData?.markets?.[0]?.address;
    if (probeMarket) {
      fetch(`/api/portfolio/shares?market=${probeMarket}&account=${address}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (d?.polyfunBalance) setPolyfunBalance(BigInt(d.polyfunBalance));
        })
        .catch(() => {});
    }
  }, [address, marketsData?.markets, loadPositions, refreshKey]);

  const handleClaimSuccess = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  const createdMarkets =
    address && marketsData?.markets
      ? marketsData.markets.filter((m) => m.creator.toLowerCase() === address.toLowerCase())
      : [];

  const sharesReady = Boolean(address) && !isLoading && !loadingShares;

  return (
    <div className="page-container pb-24">
      <div className="mx-auto w-full max-w-lg">
        <header className="mb-10">
          <h1 className="text-4xl font-bold tracking-tighter text-zinc-950 sm:text-5xl">Portfolio</h1>
          <p className="mt-3 text-sm text-zinc-500">
            {address ? truncateAddress(address) : "Wallet not connected"}
          </p>
        </header>

        {!address ? (
          <div className="card-surface py-12 text-center">
            <p className="text-sm text-zinc-500">Connect your wallet to view positions and claim rewards.</p>
            <div className="mt-4 flex justify-center">
              <ConnectButton />
            </div>
          </div>
        ) : (
          <>
            <div className="mb-6 card-surface p-5">
              <p className="text-meta">POLYFUN balance</p>
              <p className="mt-1 text-3xl font-semibold tabular-nums text-zinc-950">
                {(Number(polyfunBalance) / 1e18).toLocaleString()}
              </p>
            </div>

            {marketsData && !marketsData.configured && <SetupBlock />}

            {createdMarkets.length > 0 ? (
              <>
                <h2 className="mb-3 text-sm font-semibold text-zinc-950">Created markets</h2>
                <div className="mb-8 overflow-hidden rounded-md border border-zinc-200">
                  <ul className="divide-y divide-zinc-100">
                    {createdMarkets.map((market) => (
                      <li key={market.address}>
                        <Link
                          href={`/markets?market=${market.address}&side=yes`}
                          className="flex items-center justify-between px-4 py-3.5 transition-colors hover:bg-zinc-50"
                        >
                          <div>
                            <span className="text-sm font-semibold text-zinc-950">${market.symbol}</span>
                            <p className="mt-0.5 line-clamp-1 text-xs text-zinc-500">
                              {formatMarketProposition(market.symbol)}
                            </p>
                          </div>
                          <Badge variant="outline">{market.status}</Badge>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            ) : null}

            <h2 className="mb-3 text-sm font-semibold text-zinc-950">Your holdings</h2>
            <p className="mb-3 text-xs text-zinc-400">
              YES/NO positions from trading. Creating a market does not auto-buy shares.
            </p>
            <div className="overflow-hidden rounded-md border border-zinc-200">
              {!sharesReady ? (
                <p className="px-4 py-12 text-center text-sm text-zinc-500 animate-pulse-soft">
                  Loading positions…
                </p>
              ) : positions.length === 0 ? (
                <p className="px-4 py-12 text-center text-sm text-zinc-500">No positions yet</p>
              ) : (
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b border-zinc-100 text-[11px] font-medium uppercase tracking-wider text-zinc-500">
                      <th className="px-4 py-3">Asset</th>
                      <th className="px-4 py-3">Side</th>
                      <th className="px-4 py-3 text-right">Shares</th>
                      <th className="px-4 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {positions.map((pos) => (
                      <tr key={pos.marketAddress} className="hover:bg-zinc-50">
                        <td className="px-4 py-3.5">
                          <Link href={`/markets?market=${pos.marketAddress}&side=yes`}>
                            <span className="text-sm font-semibold text-zinc-950">${pos.symbol}</span>
                            <PpppBadge address={pos.token} className="mt-0.5" />
                          </Link>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex gap-1">
                            {pos.yesShares > 0n && <Badge variant="yes">Yes</Badge>}
                            {pos.noShares > 0n && <Badge variant="no">No</Badge>}
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-right text-sm tabular-nums text-zinc-600">
                          {pos.yesShares > 0n && <div>{formatEth(pos.yesShares, 4)}</div>}
                          {pos.noShares > 0n && <div>{formatEth(pos.noShares, 4)}</div>}
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <ClaimActions
                            marketAddress={pos.marketAddress}
                            status={pos.status}
                            expiryTs={pos.expiryTs}
                            yesShares={pos.yesShares}
                            noShares={pos.noShares}
                            yesClaimed={pos.yesClaimed}
                            noClaimed={pos.noClaimed}
                            onSuccess={handleClaimSuccess}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
