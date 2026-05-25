import { FEES } from "@/lib/protocol";
import { readTradeQuote } from "@/lib/client/market-read";
import type { Address } from "viem";

export type PreparedTrade = {
  minShares: bigint;
  willTrigger: boolean;
  /** True when live on-chain quote succeeded (preferred). */
  quoted: boolean;
};

/** Net ETH after 1% fee, with 2% slippage on shares — fallback when RPC quote fails. */
export function estimateMinShares(grossEthWei: bigint): bigint {
  const net = (grossEthWei * BigInt(10_000 - FEES.tradingBps)) / 10_000n;
  return (net * 9800n) / 10_000n;
}

export async function prepareTrade(
  marketAddress: Address,
  side: "yes" | "no",
  grossEthWei: bigint
): Promise<PreparedTrade> {
  if (grossEthWei <= 0n) {
    return { minShares: 0n, willTrigger: false, quoted: false };
  }

  const fallback: PreparedTrade = {
    minShares: estimateMinShares(grossEthWei),
    willTrigger: false,
    quoted: false,
  };

  const q = await readTradeQuote(marketAddress, side, grossEthWei);
  if (!q || q.sharesOut === 0n) return fallback;

  return {
    minShares: (q.sharesOut * 9800n) / 10_000n,
    willTrigger: q.willTrigger,
    quoted: true,
  };
}
