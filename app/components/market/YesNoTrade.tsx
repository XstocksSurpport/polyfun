"use client";

import { useState, useEffect, useCallback } from "react";
import type { Market } from "@/lib/types";
import { formatEth } from "@/lib/utils";
import { ethToWei } from "@/lib/market-utils";
import { EXPLORER_URL } from "@/lib/config";
import { MIGRATION, calcYesEthProgressBps } from "@/lib/protocol";
import { marketAbi } from "@/lib/abis";
import { getContract } from "@/lib/ethers/contract";
import { useWallet } from "@/providers/WalletProvider";
import { Button } from "@/components/ui/Button";

const QUICK_AMOUNTS = [0.001, 0.01, 0.05];

interface YesNoTradeProps {
  market: Market;
}

export function YesNoTrade({ market }: YesNoTradeProps) {
  const { signer, address } = useWallet();
  const [amount, setAmount] = useState(0.01);
  const [side, setSide] = useState<"yes" | "no">("yes");
  const [pending, setPending] = useState(false);
  const [txError, setTxError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [quote, setQuote] = useState<[bigint, bigint, boolean] | null>(null);
  const willTrigger = quote?.[2] === true;

  const amountWei = ethToWei(amount);
  const ethProgressBps = calcYesEthProgressBps(market.yesValueWei);
  const atMigrationGate =
    ethProgressBps >= MIGRATION.thresholdBps && market.yesRatioBps >= MIGRATION.thresholdBps;
  const inMigrationZone = ethProgressBps >= 8500 || market.yesRatioBps >= 8500;

  const loadQuote = useCallback(async () => {
    if (!signer || amountWei === 0n || market.status !== "active") {
      setQuote(null);
      return;
    }
    try {
      const contract = getContract(market.address, marketAbi, signer);
      const fn = side === "yes" ? "quoteBuyYes" : "quoteBuyNo";
      const result = await contract[fn](amountWei);
      setQuote([result[0], result[1], result[2]]);
    } catch {
      setQuote(null);
    }
  }, [signer, market.address, market.status, amountWei, side]);

  useEffect(() => {
    loadQuote();
  }, [loadQuote]);

  const handleTrade = async () => {
    if (!signer || !address) return;
    setPending(true);
    setTxError(null);
    setTxHash(null);
    try {
      const contract = getContract(market.address, marketAbi, signer);
      const minShares = quote?.[0] ?? 0n;
      const fn = side === "yes" ? "buyYes" : "buyNo";
      const tx = await contract[fn](minShares, { value: amountWei });
      const receipt = await tx.wait();
      setTxHash(receipt?.hash ?? tx.hash);
    } catch (e) {
      setTxError(e instanceof Error ? e.message : "TX_FAILED");
    } finally {
      setPending(false);
    }
  };

  if (market.status === "migrated") {
    return (
      <div className="space-y-4 py-4 text-center">
        <p className="text-sm font-medium text-zinc-700">Trading on Uniswap V3</p>
        {market.externalPool ? (
          <a
            href={`https://app.uniswap.org/explore/pools/base/${market.externalPool}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800"
          >
            Trade on Uniswap
          </a>
        ) : null}
      </div>
    );
  }

  if (market.status !== "active") {
    return <div className="py-8 text-center text-sm text-neutral-400">{market.status}</div>;
  }

  if (!address) {
    return (
      <div className="rounded-xl border border-neutral-100 bg-neutral-50/80 py-8 text-center">
        <p className="text-sm text-neutral-500">Connect wallet to trade</p>
      </div>
    );
  }

  const tradeDisabled =
    pending || amountWei === 0n || (atMigrationGate && side === "no" && !willTrigger);

  return (
    <div className="space-y-4">
      {inMigrationZone && (
        <p className="rounded-lg border border-amber-100 bg-amber-50/80 px-3 py-2 text-xs text-amber-800">
          {atMigrationGate
            ? "Migration threshold reached — next YES buy launches Uniswap pool."
            : "Near migration — pool may graduate to Uniswap soon."}
        </p>
      )}

      <div className="grid grid-cols-2 gap-3">
        {(["yes", "no"] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSide(s)}
            disabled={pending}
            className={`rounded-xl border p-4 text-left text-sm font-medium transition-all cursor-pointer disabled:opacity-50 ${
              side === s
                ? s === "yes"
                  ? "border-yes bg-yes-muted text-yes"
                  : "border-no bg-no-muted text-no"
                : "border-neutral-100 text-neutral-600"
            }`}
          >
            {s.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        {QUICK_AMOUNTS.map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setAmount(v)}
            disabled={pending}
            className={`flex-1 cursor-pointer rounded-lg border py-2 text-sm tabular-nums disabled:opacity-50 ${
              amount === v
                ? "border-neutral-900 bg-neutral-900 text-white"
                : "border-neutral-100 text-neutral-600"
            }`}
          >
            {v}
          </button>
        ))}
      </div>

      <input
        type="number"
        step="0.001"
        min="0"
        value={amount}
        disabled={pending}
        onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
        className="w-full rounded-lg border border-neutral-100 px-3 py-2.5 text-sm tabular-nums outline-none focus:border-neutral-300 disabled:opacity-50"
      />

      {txError && <p className="text-xs text-no">{txError}</p>}
      {txHash && (
        <a
          className="block text-xs text-yes underline"
          href={`${EXPLORER_URL}/tx/${txHash}`}
          target="_blank"
          rel="noreferrer"
        >
          {txHash.slice(0, 10)}...
        </a>
      )}

      <Button
        variant={side === "yes" ? "yes" : "no"}
        size="lg"
        className="w-full"
        disabled={tradeDisabled}
        onClick={handleTrade}
      >
        {pending
          ? "Migrating to Uniswap..."
          : willTrigger && side === "yes"
            ? `MIGRATE · ${formatEth(amount)}`
            : atMigrationGate && side === "no"
              ? "Pool migrating — NO closed"
              : `${side.toUpperCase()} · ${formatEth(amount)}`}
      </Button>
    </div>
  );
}
