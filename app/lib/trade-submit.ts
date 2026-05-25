import { FEES } from "@/lib/protocol";
import { readTradeQuote } from "@/lib/client/market-read";
import type { Address } from "viem";

/** Net ETH after 1% fee, with 2% slippage on shares — no RPC needed. */
export function estimateMinShares(grossEthWei: bigint): bigint {
  const net = (grossEthWei * BigInt(10_000 - FEES.tradingBps)) / 10_000n;
  return (net * 9800n) / 10_000n;
}

export async function prepareTrade(
  marketAddress: Address,
  side: "yes" | "no",
  grossEthWei: bigint
) {
  const minShares = estimateMinShares(grossEthWei);
  let willTrigger = false;

  if (side === "yes") {
    const q = await readTradeQuote(marketAddress, side, grossEthWei);
    if (q) {
      willTrigger = q.willTrigger;
      return { minShares: (q.sharesOut * 9800n) / 10_000n, willTrigger };
    }
  }

  return { minShares, willTrigger };
}
