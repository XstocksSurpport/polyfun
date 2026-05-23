import { createPublicClient, http, type Address } from "viem";
import { base, baseSepolia } from "viem/chains";
import { CHAIN_ID, rpcUrl } from "../config";
import { marketAbi } from "../abis";
import type { Trade } from "../types";

export async function listMarketTrades(marketAddress: Address): Promise<Trade[]> {
  const client = createPublicClient({
    chain: CHAIN_ID === 8453 ? base : baseSepolia,
    transport: http(rpcUrl),
  });

  const [yesLogs, noLogs] = await Promise.all([
    client.getContractEvents({
      address: marketAddress,
      abi: marketAbi,
      eventName: "YesPurchased",
      fromBlock: "earliest",
      toBlock: "latest",
    }),
    client.getContractEvents({
      address: marketAddress,
      abi: marketAbi,
      eventName: "NoPurchased",
      fromBlock: "earliest",
      toBlock: "latest",
    }),
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
