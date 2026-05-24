import "server-only";

import { createPublicClient, http, type Address } from "viem";
import { base, baseSepolia } from "viem/chains";
import { CHAIN_ID, contracts, serverRpcUrl } from "../config";
import { marketAbi } from "../abis";
import { getContractEventsChunked } from "./log-range";
import type { Trade } from "../types";

type TradeLog = {
  transactionHash: `0x${string}`;
  logIndex: number;
  blockNumber: bigint;
  args: {
    amountIn: bigint;
    sharesOut: bigint;
    buyer: Address;
  };
};

export async function listMarketTrades(
  marketAddress: Address,
  createdAt?: number
): Promise<Trade[]> {
  const client = createPublicClient({
    chain: CHAIN_ID === 8453 ? base : baseSepolia,
    transport: http(serverRpcUrl, {
      batch: { wait: 20 },
    }),
  });

  const latest = await client.getBlockNumber();
  let fromBlock = contracts.launcherDeployBlock ?? 0n;

  if (createdAt && createdAt > 0) {
    const ageSec = Math.max(0, Math.floor(Date.now() / 1000) - createdAt);
    const blockSpan = BigInt(Math.ceil(ageSec / 2) + 5000);
    const estimated = latest > blockSpan ? latest - blockSpan : fromBlock;
    if (estimated > fromBlock) fromBlock = estimated;
  }

  const [yesLogs, noLogs] = await Promise.all([
    getContractEventsChunked({
      client,
      address: marketAddress,
      abi: marketAbi,
      eventName: "YesPurchased",
      fromBlock,
    }),
    getContractEventsChunked({
      client,
      address: marketAddress,
      abi: marketAbi,
      eventName: "NoPurchased",
      fromBlock,
    }),
  ]).then(([yes, no]) => [
    yes as TradeLog[],
    no as TradeLog[],
  ]);

  const blockNumbers = [...new Set([...yesLogs, ...noLogs].map((l) => l.blockNumber))];
  const timestamps = new Map<bigint, number>();

  await Promise.all(
    blockNumbers.map(async (blockNumber) => {
      const block = await client.getBlock({ blockNumber });
      timestamps.set(blockNumber, Number(block.timestamp));
    })
  );

  const trades: Trade[] = [
    ...yesLogs.map((log) => ({
      id: `${log.transactionHash}-${log.logIndex}`,
      txHash: log.transactionHash,
      side: "yes" as const,
      amountWei: log.args.amountIn!,
      shares: log.args.sharesOut!,
      buyer: log.args.buyer!,
      blockNumber: log.blockNumber,
      timestamp: timestamps.get(log.blockNumber) ?? 0,
    })),
    ...noLogs.map((log) => ({
      id: `${log.transactionHash}-${log.logIndex}`,
      txHash: log.transactionHash,
      side: "no" as const,
      amountWei: log.args.amountIn!,
      shares: log.args.sharesOut!,
      buyer: log.args.buyer!,
      blockNumber: log.blockNumber,
      timestamp: timestamps.get(log.blockNumber) ?? 0,
    })),
  ];

  return trades.sort((a, b) => Number(b.blockNumber - a.blockNumber));
}
