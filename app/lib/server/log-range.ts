import "server-only";

import type { Abi, Address } from "viem";

/** Base public RPC caps eth_getLogs to 10,000 blocks — stay under that. */
const MAX_BLOCK_RANGE = 9999n;

type LogClient = {
  getBlockNumber(): Promise<bigint>;
  getContractEvents(args: {
    address: Address;
    abi: Abi;
    eventName: string;
    fromBlock: bigint;
    toBlock: bigint;
  }): Promise<readonly unknown[]>;
};

export async function getContractEventsChunked<
  TLog extends { args?: Record<string, unknown> },
>({
  client,
  address,
  abi,
  eventName,
  fromBlock,
  toBlock = "latest",
}: {
  client: LogClient;
  address: Address;
  abi: Abi;
  eventName: string;
  fromBlock: bigint;
  toBlock?: bigint | "latest";
}): Promise<TLog[]> {
  const latest = toBlock === "latest" ? await client.getBlockNumber() : toBlock;

  if (fromBlock > latest) return [];

  const ranges: Array<{ from: bigint; to: bigint }> = [];
  let start = fromBlock;
  while (start <= latest) {
    const end = start + MAX_BLOCK_RANGE > latest ? latest : start + MAX_BLOCK_RANGE;
    ranges.push({ from: start, to: end });
    start = end + 1n;
  }

  const chunks = await Promise.all(
    ranges.map(({ from, to }) =>
      client.getContractEvents({
        address,
        abi,
        eventName,
        fromBlock: from,
        toBlock: to,
      })
    )
  );

  return chunks.flat() as TLog[];
}
