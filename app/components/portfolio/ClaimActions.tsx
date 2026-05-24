"use client";

import { useCallback, useState } from "react";
import { marketAbi } from "@/lib/abis";
import { getContract } from "@/lib/ethers/contract";
import { useWallet } from "@/providers/WalletProvider";
import { withTimeout } from "@/lib/async";
import { buttonClassName } from "@/components/ui/Button";
import { EXPLORER_URL } from "@/lib/config";
import { isMarketExpired } from "@/lib/market-utils";
import type { MarketStatus } from "@/lib/types";

type ClaimFn = "settleNo" | "claimYesTokens" | "claimNoPayout";

interface ClaimActionsProps {
  marketAddress: string;
  status: MarketStatus;
  expiryTs: number;
  yesShares: bigint;
  noShares: bigint;
  yesClaimed: boolean;
  noClaimed: boolean;
  onSuccess?: () => void;
}

function formatTxError(error: unknown): string {
  const msg = error instanceof Error ? error.message : "TX_FAILED";
  if (msg.includes("rejected") || msg.includes("denied")) return "Transaction rejected in wallet";
  if (msg.includes("NotMigrated")) return "Market has not migrated yet";
  if (msg.includes("NotSettled")) return "Run Settle first";
  if (msg.includes("Claimed")) return "Already claimed";
  if (msg.includes("NotExpired")) return "Market has not expired yet";
  return msg.length > 120 ? `${msg.slice(0, 120)}…` : msg;
}

export function ClaimActions({
  marketAddress,
  status,
  expiryTs,
  yesShares,
  noShares,
  yesClaimed,
  noClaimed,
  onSuccess,
}: ClaimActionsProps) {
  const { getSigner } = useWallet();
  const [pending, setPending] = useState<ClaimFn | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const expired = isMarketExpired(expiryTs);

  const canSettle = status === "active" && expired && noShares > 0n;
  const canClaimYes = status === "migrated" && yesShares > 0n && !yesClaimed;
  const canClaimNo = status === "failed" && noShares > 0n && !noClaimed;

  const yesDone = status === "migrated" && yesShares > 0n && yesClaimed;
  const noDone = status === "failed" && noShares > 0n && noClaimed;

  const run = useCallback(
    async (fn: ClaimFn) => {
      setPending(fn);
      setError(null);
      setTxHash(null);
      try {
        const signer = await withTimeout(getSigner(), 15_000, "Wallet connection timed out");
        const contract = getContract(marketAddress, marketAbi, signer);
        const tx = await withTimeout(contract[fn](), 120_000, "Confirm the transaction in your wallet");
        const receipt = await withTimeout(tx.wait(), 180_000, "Waiting for confirmation timed out");
        setTxHash((receipt as { hash?: string } | null)?.hash ?? tx.hash);
        onSuccess?.();
      } catch (e) {
        setError(formatTxError(e));
      } finally {
        setPending(null);
      }
    },
    [getSigner, marketAddress, onSuccess]
  );

  if (!canSettle && !canClaimYes && !canClaimNo && !yesDone && !noDone) {
    return null;
  }

  return (
    <div className="flex flex-col items-end gap-1">
      {canSettle && (
        <button
          type="button"
          disabled={!!pending}
          onClick={() => run("settleNo")}
          className={buttonClassName("secondary", "sm")}
        >
          {pending === "settleNo" ? "…" : "Settle"}
        </button>
      )}
      {canClaimYes && (
        <button
          type="button"
          disabled={!!pending}
          onClick={() => run("claimYesTokens")}
          className={buttonClassName("primary", "sm")}
        >
          {pending === "claimYesTokens" ? "…" : "Claim tokens"}
        </button>
      )}
      {canClaimNo && (
        <button
          type="button"
          disabled={!!pending}
          onClick={() => run("claimNoPayout")}
          className={buttonClassName("primary", "sm")}
        >
          {pending === "claimNoPayout" ? "…" : "Claim ETH"}
        </button>
      )}
      {yesDone && <span className="text-xs text-zinc-400">Claimed</span>}
      {noDone && <span className="text-xs text-zinc-400">Claimed</span>}
      {error && <p className="max-w-[10rem] text-right text-[10px] text-red-600">{error}</p>}
      {txHash && (
        <a
          href={`${EXPLORER_URL}/tx/${txHash}`}
          target="_blank"
          rel="noreferrer"
          className="text-[10px] text-zinc-500 underline"
        >
          View tx
        </a>
      )}
    </div>
  );
}
