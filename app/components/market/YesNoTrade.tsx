"use client";

import { useState, useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { Market } from "@/lib/types";
import { formatEth, cn } from "@/lib/utils";
import { ethToWei, canTradeMarket } from "@/lib/market-utils";
import { EXPLORER_URL } from "@/lib/config";
import { MIGRATION, calcYesEthProgressBps, FEES } from "@/lib/protocol";
import { marketAbi } from "@/lib/abis";
import { getContract } from "@/lib/ethers/contract";
import { readLivePoolState, readTradeQuote, type TradeQuote } from "@/lib/client/market-read";
import { formatTradeError, minSharesWithSlippage } from "@/lib/trade-errors";
import { useWallet } from "@/providers/WalletProvider";
import { withTimeout } from "@/lib/async";
import { buttonClassName } from "@/components/ui/Button";
import { ConnectButton } from "@/components/layout/ConnectButton";
import { ClaimActions } from "@/components/portfolio/ClaimActions";

const GAS_RESERVE_ETH = 0.0005;
const BALANCE_PRESETS = [
  { label: "25%", ratio: 0.25 },
  { label: "50%", ratio: 0.5 },
  { label: "75%", ratio: 0.75 },
  { label: "max", ratio: 1 },
] as const;

interface YesNoTradeProps {
  market: Market;
  initialSide?: "yes" | "no";
  compact?: boolean;
}

export function YesNoTrade({ market, initialSide = "yes", compact = false }: YesNoTradeProps) {
  const { address, signer, getSigner } = useWallet();
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState(0.1);
  const [ethBalanceWei, setEthBalanceWei] = useState<bigint | null>(null);
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [side, setSide] = useState<"yes" | "no">(initialSide);
  const [pending, setPending] = useState(false);
  const [txError, setTxError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [quote, setQuote] = useState<TradeQuote | null>(null);
  const [livePool, setLivePool] = useState<{ yesValueWei: bigint; noValueWei: bigint; yesRatioBps: number } | null>(
    null
  );
  const [position, setPosition] = useState<{
    yesShares: bigint;
    noShares: bigint;
    yesClaimed: boolean;
    noClaimed: boolean;
  } | null>(null);
  const [claimRefresh, setClaimRefresh] = useState(0);
  const willTrigger = quote?.willTrigger === true;
  const tradeable = canTradeMarket(market);

  const yesValueWei = livePool?.yesValueWei ?? market.yesValueWei;
  const noValueWei = livePool?.noValueWei ?? market.noValueWei;
  const yesRatioBps = livePool?.yesRatioBps ?? market.yesRatioBps;

  useEffect(() => {
    setSide(initialSide);
  }, [initialSide, market.address]);

  useEffect(() => {
    if (!address) {
      setEthBalanceWei(null);
      return;
    }

    let cancelled = false;
    const provider = signer?.provider;

    const loadBalance = async () => {
      try {
        const activeProvider = provider ?? (await getSigner()).provider;
        if (!activeProvider) return;
        const balance = await activeProvider.getBalance(address);
        if (!cancelled) setEthBalanceWei(balance);
      } catch {
        if (!cancelled) setEthBalanceWei(null);
      }
    };

    void loadBalance();

    return () => {
      cancelled = true;
    };
  }, [address, signer, getSigner]);

  useEffect(() => {
    if (!address || tradeable) {
      setPosition(null);
      return;
    }

    let cancelled = false;
    fetch(`/api/portfolio/shares?market=${market.address}&account=${address}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        setPosition({
          yesShares: BigInt(data.yesShares),
          noShares: BigInt(data.noShares),
          yesClaimed: Boolean(data.yesClaimed),
          noClaimed: Boolean(data.noClaimed),
        });
      })
      .catch(() => {
        if (!cancelled) setPosition(null);
      });

    return () => {
      cancelled = true;
    };
  }, [address, market.address, tradeable, claimRefresh]);

  const ethBalance = ethBalanceWei !== null ? Number(ethBalanceWei) / 1e18 : null;

  const applyBalancePreset = (ratio: number, label: string) => {
    if (ethBalance === null || ethBalance <= 0) return;
    const value =
      ratio >= 1 ? Math.max(0, ethBalance - GAS_RESERVE_ETH) : ethBalance * ratio;
    setAmount(parseFloat(value.toFixed(6)));
    setActivePreset(label);
  };

  const amountWei = ethToWei(amount);
  const ethProgressBps = calcYesEthProgressBps(yesValueWei);
  const atMigrationGate = ethProgressBps >= MIGRATION.thresholdBps && yesRatioBps >= MIGRATION.thresholdBps;
  const inMigrationZone = ethProgressBps >= 8500 || yesRatioBps >= 8500;
  const totalPool = yesValueWei + noValueWei;
  const yesOdds = yesValueWei > 0n ? Number(totalPool) / Number(yesValueWei) : 1;

  const refreshLivePool = useCallback(async () => {
    if (!tradeable) return;
    try {
      const pool = await readLivePoolState(market.address as `0x${string}`);
      setLivePool(pool);
    } catch {
      /* keep last snapshot */
    }
  }, [market.address, tradeable]);

  useEffect(() => {
    void refreshLivePool();
    if (!tradeable) return;
    const id = window.setInterval(() => void refreshLivePool(), 4_000);
    return () => window.clearInterval(id);
  }, [refreshLivePool, tradeable]);

  const loadQuote = useCallback(async () => {
    if (amountWei === 0n || !tradeable) {
      setQuote(null);
      return;
    }
    const q = await readTradeQuote(market.address as `0x${string}`, side, amountWei);
    setQuote(q);
  }, [market.address, tradeable, amountWei, side]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadQuote();
    }, 300);
    return () => window.clearTimeout(timer);
  }, [loadQuote]);

  const handleTrade = async (tradeSide: "yes" | "no") => {
    if (!address) return;

    setPending(true);
    setTxError(null);
    setTxHash(null);
    setSide(tradeSide);

    try {
      const signer = await withTimeout(getSigner(), 15_000, "Wallet connection timed out");
      const contract = getContract(market.address, marketAbi, signer);

      const q = await readTradeQuote(market.address as `0x${string}`, tradeSide, amountWei);
      if (!q || q.sharesOut === 0n) {
        throw new Error("Invalid quote — check amount");
      }
      const minShares = minSharesWithSlippage(q.sharesOut);

      if (tradeSide === "yes" && q.willTrigger) {
        setPending(false);
        if (!window.confirm("This trade triggers Uniswap migration. Continue?")) return;
        setPending(true);
      }

      const fn = tradeSide === "yes" ? "buyYes" : "buyNo";
      await contract[fn].staticCall(minShares, { value: amountWei });
      const tx = await withTimeout(
        contract[fn](minShares, { value: amountWei }),
        120_000,
        "Confirm the transaction in your wallet"
      );
      const receipt = await withTimeout(tx.wait(), 180_000, "Waiting for confirmation timed out");
      setTxHash((receipt as { hash?: string } | null)?.hash ?? tx.hash);
      void fetch(`/api/markets?address=${market.address}&fresh=1`, { cache: "no-store" });
      void refreshLivePool();
      void loadQuote();
      void queryClient.invalidateQueries({ queryKey: ["trades", market.address] });
      void queryClient.invalidateQueries({ queryKey: ["market", market.address] });
      void queryClient.invalidateQueries({ queryKey: ["markets"] });
    } catch (e) {
      setTxError(formatTradeError(e));
    } finally {
      setPending(false);
    }
  };

  const claimPanel =
    address && position ? (
      <div className="flex justify-center pt-1">
        <ClaimActions
          marketAddress={market.address}
          status={market.status}
          expiryTs={market.expiryTs}
          yesShares={position.yesShares}
          noShares={position.noShares}
          yesClaimed={position.yesClaimed}
          noClaimed={position.noClaimed}
          onSuccess={() => setClaimRefresh((k) => k + 1)}
        />
      </div>
    ) : !address ? (
      <ConnectButton />
    ) : null;

  if (market.status === "migrated") {
    return (
      <div className="space-y-3 py-2 text-center">
        <p className="text-sm font-medium text-zinc-950">Migrated to Uniswap V3</p>
        {market.externalPool ? (
          <a
            href={`https://app.uniswap.org/explore/pools/base/${market.externalPool}`}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonClassName("primary", "md")}
          >
            Trade on Uniswap
          </a>
        ) : null}
        {claimPanel}
      </div>
    );
  }

  if (market.status === "failed") {
    return (
      <div className="space-y-3 py-4 text-center">
        <p className="text-sm font-medium text-zinc-950">Market settled · NO won</p>
        <p className="text-xs text-zinc-500">NO holders can claim ETH from the pool.</p>
        {claimPanel}
      </div>
    );
  }

  if (!tradeable) {
    return (
      <div className="space-y-3 py-4 text-center">
        <p className="text-sm font-medium text-zinc-950">Market expired</p>
        <p className="text-xs text-zinc-500">Trading closed. Settle and claim from Portfolio or below.</p>
        {claimPanel}
      </div>
    );
  }

  if (!address) {
    return (
      <div className={cn("rounded-xl border border-zinc-100 bg-zinc-50/80 text-center", compact ? "py-5" : "py-10")}>
        <p className={cn("text-zinc-500", compact ? "mb-2 text-xs" : "mb-3 text-sm")}>Connect wallet to trade</p>
        <ConnectButton />
      </div>
    );
  }

  const noBlocked = atMigrationGate && !willTrigger;
  const amountLabel = formatEth(amount);

  return (
    <div className={cn(compact ? "space-y-2" : "space-y-5")}>
      {inMigrationZone && (
        <p className="rounded-lg border border-amber-200/80 bg-amber-50/80 px-2.5 py-1.5 text-[10px] text-amber-800">
          {atMigrationGate ? "Migration threshold reached" : "Near migration zone"}
        </p>
      )}

      {!compact && (
        <div className="grid grid-cols-2 gap-3 text-center">
          <div className="rounded-xl border border-zinc-100 bg-zinc-50/80 px-3 py-3">
            <p className="text-meta">Yes odds</p>
            <p className="mt-1 text-stat text-yes tabular-nums">{yesOdds.toFixed(2)}x</p>
          </div>
          <div className="rounded-xl border border-zinc-100 bg-zinc-50/80 px-3 py-3">
            <p className="text-meta">No pool</p>
            <p className="mt-1 text-stat tabular-nums">{formatEth(noValueWei, 3)}</p>
          </div>
        </div>
      )}

      <div className="space-y-1.5">
        <div
          className={cn(
            "flex items-center gap-2 rounded-lg border bg-zinc-50/80 px-3 transition-all",
            compact ? "py-2" : "rounded-xl px-4 py-3",
            "border-zinc-200 focus-within:border-zinc-950 focus-within:ring-1 focus-within:ring-zinc-950"
          )}
        >
          <span className="text-xs font-medium text-zinc-400">ETH</span>
          <input
            type="number"
            step="0.001"
            min="0"
            value={amount}
            disabled={pending}
            onChange={(e) => {
              setAmount(parseFloat(e.target.value) || 0);
              setActivePreset(null);
            }}
            className={cn(
              "min-w-0 flex-1 bg-transparent font-medium tabular-nums text-zinc-900 outline-none disabled:opacity-50",
              compact ? "text-sm" : "text-base"
            )}
          />
        </div>

        <div className="flex items-center justify-between gap-3">
          <p className="shrink-0 text-[10px] tabular-nums text-zinc-400">
            {ethBalance !== null ? (
              <>Balance · {ethBalance.toFixed(4)} ETH</>
            ) : (
              <>Balance · —</>
            )}
          </p>
          <div className="flex gap-1">
            {BALANCE_PRESETS.map(({ label, ratio }) => (
              <button
                key={label}
                type="button"
                onClick={() => applyBalancePreset(ratio, label)}
                disabled={pending || ethBalance === null || ethBalance <= 0}
                className={cn(
                  "rounded-md border px-2 py-0.5 text-[10px] font-medium tabular-nums transition-all disabled:opacity-40",
                  activePreset === label
                    ? "border-zinc-300 bg-zinc-100 text-zinc-900"
                    : "border-zinc-200/60 bg-zinc-50 text-zinc-500 hover:border-zinc-300 hover:text-zinc-800"
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {quote && (
        <div className="space-y-0.5 text-[10px] leading-relaxed text-zinc-500">
          <p>
            Net pool · {formatEth(quote.netEthWei, 4)} ETH (fee {FEES.tradingBps / 100}% ·{" "}
            {formatEth(quote.feeWei, 5)} ETH)
          </p>
          <p>
            {side === "yes" ? "Yes" : "No"} shares ≈ {formatEth(quote.sharesOut, 4)} · YES{" "}
            {(yesRatioBps / 100).toFixed(1)}% → {(quote.newYesRatioBps / 100).toFixed(1)}%
            {willTrigger && side === "yes" ? " · triggers migration" : ""}
          </p>
        </div>
      )}

      {txError && <p className="text-xs text-red-600">{txError}</p>}
      {txHash && (
        <a
          className="block text-xs font-medium text-zinc-950 underline"
          href={`${EXPLORER_URL}/tx/${txHash}`}
          target="_blank"
          rel="noreferrer"
        >
          View tx {txHash.slice(0, 10)}…
        </a>
      )}

      <div className="grid grid-cols-2 gap-1.5">
        <button
          type="button"
          disabled={pending || amountWei === 0n}
          onClick={() => handleTrade("yes")}
          className={cn(
            "flex w-full items-center justify-center rounded-lg bg-zinc-950 text-sm font-semibold text-white shadow-sm transition-all hover:bg-zinc-900 disabled:opacity-40",
            compact ? "py-2.5" : "flex-col rounded-xl py-3"
          )}
        >
          {compact ? (
            <span>
              {pending && side === "yes" ? "…" : "Buy YES"} · {amountLabel}
            </span>
          ) : (
            <>
              <span>{pending && side === "yes" ? "…" : "Buy YES"}</span>
              <span className="mt-0.5 text-[11px] font-normal text-zinc-300">{amountLabel}</span>
            </>
          )}
        </button>
        <button
          type="button"
          disabled={pending || amountWei === 0n || noBlocked}
          onClick={() => handleTrade("no")}
          className={cn(
            "flex w-full items-center justify-center rounded-lg border border-zinc-200 bg-white text-sm font-semibold text-zinc-800 shadow-sm transition-all hover:bg-zinc-50 disabled:opacity-40",
            compact ? "py-2.5" : "flex-col rounded-xl py-3"
          )}
        >
          {compact ? (
            <span>
              {noBlocked ? "No closed" : pending && side === "no" ? "…" : "Buy NO"} · {amountLabel}
            </span>
          ) : (
            <>
              <span>{noBlocked ? "No closed" : pending && side === "no" ? "…" : "Buy NO"}</span>
              <span className="mt-0.5 text-[11px] font-normal text-zinc-400">{amountLabel}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
