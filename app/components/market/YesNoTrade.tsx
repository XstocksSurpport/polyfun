"use client";

import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { Market } from "@/lib/types";
import { formatEth, formatEthVol, formatMigrationPercent, cn } from "@/lib/utils";
import { ethToWei, canTradeMarket } from "@/lib/market-utils";
import { EXPLORER_URL, CHAIN_ID } from "@/lib/config";
import { MIGRATION, calcMigrationProgressBps } from "@/lib/protocol";
import { marketAbi } from "@/lib/abis";
import { getContract } from "@/lib/ethers/contract";
import { formatTradeError } from "@/lib/trade-errors";
import { prepareTrade } from "@/lib/trade-submit";
import { useWallet } from "@/providers/WalletProvider";
import { withTimeout } from "@/lib/async";
import { buttonClassName } from "@/components/ui/Button";
import { ConnectButton } from "@/components/layout/ConnectButton";
import { ClaimActions } from "@/components/portfolio/ClaimActions";

/** Base L2 typical tx gas — keep reserve small so micro trades stay clickable. */
const GAS_RESERVE_ETH = 0.00003;
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
  yesValueWei?: bigint;
  noValueWei?: bigint;
  onTradeSuccess?: () => void;
}

export function YesNoTrade({
  market,
  initialSide = "yes",
  compact = false,
  yesValueWei: yesValueProp,
  noValueWei: noValueProp,
  onTradeSuccess,
}: YesNoTradeProps) {
  const { address, chainId, signer, getSigner } = useWallet();
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState(0.01);
  const [ethBalanceWei, setEthBalanceWei] = useState<bigint | null>(null);
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [side, setSide] = useState<"yes" | "no">(initialSide);
  const [pending, setPending] = useState(false);
  const [txError, setTxError] = useState<string | null>(null);
  const [quoteWarning, setQuoteWarning] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [position, setPosition] = useState<{
    yesShares: bigint;
    noShares: bigint;
    yesClaimed: boolean;
    noClaimed: boolean;
  } | null>(null);
  const [claimRefresh, setClaimRefresh] = useState(0);
  const tradeable = canTradeMarket(market);

  const yesValueWei = yesValueProp ?? market.yesValueWei;
  const noValueWei = noValueProp ?? market.noValueWei;
  const yesRatioBps =
    yesValueWei + noValueWei > 0n
      ? Number((yesValueWei * 10000n) / (yesValueWei + noValueWei))
      : 0;

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
  const migrationBps = calcMigrationProgressBps(yesValueWei, noValueWei, yesRatioBps);
  const atMigrationGate = migrationBps >= MIGRATION.thresholdBps;
  const totalPool = yesValueWei + noValueWei;
  const yesOdds = yesValueWei > 0n ? Number(totalPool) / Number(yesValueWei) : 1;

  const wrongNetwork = chainId !== null && chainId !== CHAIN_ID;
  const gasReserveWei = BigInt(Math.round(GAS_RESERVE_ETH * 1e18));
  const cannotAffordTrade =
    ethBalanceWei !== null && amountWei > 0n && ethBalanceWei < amountWei;
  const tightOnGas =
    ethBalanceWei !== null &&
    amountWei > 0n &&
    !cannotAffordTrade &&
    ethBalanceWei < amountWei + gasReserveWei;
  const tradeBlocked = wrongNetwork || cannotAffordTrade || amountWei === 0n;

  const handleTrade = async (tradeSide: "yes" | "no") => {
    if (!address) return;
    if (amountWei <= 0n) {
      setTxError("Enter an amount greater than 0");
      return;
    }
    if (wrongNetwork) {
      setTxError("Switch your wallet to Base network");
      return;
    }
    if (cannotAffordTrade) {
      setTxError("Insufficient ETH for this trade amount");
      return;
    }
    if (ethBalanceWei !== null && ethBalanceWei < amountWei + gasReserveWei) {
      setTxError("Low balance — leave a little ETH for gas or reduce amount");
      return;
    }

    setPending(true);
    setTxError(null);
    setQuoteWarning(null);
    setTxHash(null);
    setSide(tradeSide);

    try {
      const [signer, prepared] = await Promise.all([
        withTimeout(getSigner(), 15_000, "Wallet connection timed out"),
        prepareTrade(market.address as `0x${string}`, tradeSide, amountWei),
      ]);
      const { minShares, willTrigger, quoted } = prepared;
      if (!quoted) {
        setQuoteWarning("Using estimated quote — retry if the trade fails");
      }
      const contract = getContract(market.address, marketAbi, signer);

      if (tradeSide === "yes" && willTrigger) {
        if (!window.confirm("This trade triggers Uniswap migration. Continue?")) return;
      }

      const fn = tradeSide === "yes" ? "buyYes" : "buyNo";
      const tx = await withTimeout(
        contract[fn](minShares, { value: amountWei }),
        120_000,
        "Confirm the transaction in your wallet"
      );
      const receipt = await withTimeout(tx.wait(), 180_000, "Waiting for confirmation timed out");
      setTxHash((receipt as { hash?: string } | null)?.hash ?? tx.hash);
      onTradeSuccess?.();
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

  const noBlocked = atMigrationGate;
  const amountLabel = formatEth(amount);

  return (
    <div className={cn(compact ? "space-y-2" : "space-y-5")}>
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

      {quoteWarning ? <p className="text-xs text-amber-700">{quoteWarning}</p> : null}
      {txError && <p className="text-xs text-red-600">{txError}</p>}
      {wrongNetwork ? (
        <p className="text-xs text-amber-700">Switch wallet to Base to trade.</p>
      ) : null}
      {tightOnGas ? (
        <p className="text-xs text-amber-700">Balance is tight — reduce amount if the tx fails.</p>
      ) : null}
      {cannotAffordTrade ? (
        <p className="text-xs text-red-600">Insufficient ETH for this trade amount.</p>
      ) : null}
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
          disabled={pending || tradeBlocked}
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
          disabled={pending || tradeBlocked || noBlocked}
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
