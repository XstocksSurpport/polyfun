import type { Address } from "viem";
import { marketAbi } from "@/lib/abis";
import { calcYesRatioBps } from "@/lib/market-utils";
import { FEES } from "@/lib/protocol";
import { getPublicClient } from "@/lib/client/public-client";

export type LivePoolState = {
  yesValueWei: bigint;
  noValueWei: bigint;
  yesRatioBps: number;
};

export type TradeQuote = {
  sharesOut: bigint;
  newYesRatioBps: number;
  willTrigger: boolean;
  netEthWei: bigint;
  feeWei: bigint;
};

export async function readLivePoolState(marketAddress: Address): Promise<LivePoolState> {
  const client = getPublicClient();
  const [yesValueWei, noValueWei] = await client.multicall({
    contracts: [
      { address: marketAddress, abi: marketAbi, functionName: "yesValue" },
      { address: marketAddress, abi: marketAbi, functionName: "noValue" },
    ],
  });

  if (yesValueWei.status !== "success" || noValueWei.status !== "success") {
    throw new Error("Pool read failed");
  }

  const yes = yesValueWei.result;
  const no = noValueWei.result;

  return {
    yesValueWei: yes,
    noValueWei: no,
    yesRatioBps: calcYesRatioBps(yes, no),
  };
}

export async function readTradeQuote(
  marketAddress: Address,
  side: "yes" | "no",
  grossEthWei: bigint
): Promise<TradeQuote | null> {
  if (grossEthWei <= 0n) return null;

  const client = getPublicClient();
  const fn = side === "yes" ? "quoteBuyYes" : "quoteBuyNo";
  const feeWei = (grossEthWei * BigInt(FEES.tradingBps)) / 10_000n;
  const netEthWei = grossEthWei - feeWei;

  try {
    const [sharesOut, newYesRatioBps, willTrigger] = await client.readContract({
      address: marketAddress,
      abi: marketAbi,
      functionName: fn,
      args: [grossEthWei],
    });

    return {
      sharesOut,
      newYesRatioBps: Number(newYesRatioBps),
      willTrigger,
      netEthWei,
      feeWei,
    };
  } catch {
    return null;
  }
}
