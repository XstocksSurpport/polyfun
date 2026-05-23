import { createPublicClient, http, type Address } from "viem";
import { base, baseSepolia } from "viem/chains";
import { CHAIN_ID, contracts, rpcUrl } from "../config";
import { registryAbi, marketAbi, erc20Abi, launcherAbi } from "../abis";
import { calcYesRatioBps, mapMarketStatus } from "../market-utils";
import { mapMigrationAdapter } from "../dex";
import type { Market, TokenMetadata } from "../types";

const chain = CHAIN_ID === 8453 ? base : baseSepolia;

export function getPublicClient() {
  return createPublicClient({
    chain,
    transport: http(rpcUrl),
  });
}

export async function fetchMetadataFromHash(hash: string): Promise<TokenMetadata | null> {
  if (!hash || hash === "0x" + "0".repeat(64)) return null;

  const gateway = process.env.IPFS_GATEWAY ?? "https://ipfs.io/ipfs";
  const cid = hash.startsWith("0x") ? hash.slice(2) : hash;

  try {
    const res = await fetch(`${gateway}/${cid}`, { next: { revalidate: 300 } });
    if (!res.ok) return null;
    return (await res.json()) as TokenMetadata;
  } catch {
    return null;
  }
}

export async function loadMarket(marketAddress: Address): Promise<Market | null> {
  if (!contracts.registry || !contracts.launcher) return null;

  const client = getPublicClient();

  const [isOfficial, record] = await Promise.all([
    client.readContract({
      address: contracts.registry,
      abi: registryAbi,
      functionName: "isOfficialMarket",
      args: [marketAddress],
    }),
    client.readContract({
      address: contracts.registry,
      abi: registryAbi,
      functionName: "markets",
      args: [marketAddress],
    }),
  ]);

  if (!isOfficial) return null;

  const [, token, creator, metadataHash, createdAt, official] = record;

  const [yesValue, noValue, thresholdBps, expiry, statusCode, externalPool, migrationAdapterCode] =
    await client.multicall({
      contracts: [
        { address: marketAddress, abi: marketAbi, functionName: "yesValue" },
        { address: marketAddress, abi: marketAbi, functionName: "noValue" },
        { address: marketAddress, abi: marketAbi, functionName: "thresholdBps" },
        { address: marketAddress, abi: marketAbi, functionName: "expiry" },
        { address: marketAddress, abi: marketAbi, functionName: "status" },
        { address: marketAddress, abi: marketAbi, functionName: "externalPool" },
        { address: marketAddress, abi: marketAbi, functionName: "migrationAdapter" },
      ],
      allowFailure: true,
    });

  const yesValueWei = (yesValue.result as bigint) ?? 0n;
  const noValueWei = (noValue.result as bigint) ?? 0n;

  let name = "Unknown";
  let symbol = "???";
  let proposition = "";
  let imageUrl: string | undefined;

  const metadata = await fetchMetadataFromHash(metadataHash as string);
  if (metadata) {
    name = metadata.name;
    symbol = metadata.symbol;
    proposition = metadata.proposition ?? metadata.description ?? "";
    imageUrl = metadata.image;
  } else {
    try {
      const [tokenName, tokenSymbol] = await client.multicall({
        contracts: [
          { address: token as Address, abi: erc20Abi, functionName: "name" },
          { address: token as Address, abi: erc20Abi, functionName: "symbol" },
        ],
      });
      name = (tokenName.result as string) ?? name;
      symbol = (tokenSymbol.result as string) ?? symbol;
    } catch {
      // Token may not expose metadata yet
    }
  }

  const pool =
    externalPool.result &&
    (externalPool.result as Address) !== "0x0000000000000000000000000000000000000000"
      ? (externalPool.result as Address)
      : undefined;

  let launchBlock: number | undefined;
  if (pool) {
    try {
      const lb = await client.readContract({
        address: token as Address,
        abi: erc20Abi,
        functionName: "launchBlock",
      });
      if (lb > 0n) launchBlock = Number(lb);
    } catch {
      // Token may not expose launchBlock yet
    }
  }

  const migrationAdapter =
    migrationAdapterCode.status === "success" && migrationAdapterCode.result !== undefined
      ? mapMigrationAdapter(Number(migrationAdapterCode.result))
      : pool
        ? "uniswap_v3"
        : undefined;

  return {
    address: marketAddress,
    token: token as Address,
    symbol,
    name,
    proposition,
    creator: creator as Address,
    yesRatioBps: calcYesRatioBps(yesValueWei, noValueWei),
    thresholdBps: Number(thresholdBps.result),
    yesValueWei,
    noValueWei,
    expiryTs: Number(expiry.result),
    status: mapMarketStatus(Number(statusCode.result)),
    isOfficial: official,
    metadataHash: metadataHash as `0x${string}`,
    imageUrl,
    externalPool: pool,
    migrationAdapter,
    launchBlock,
    createdAt: Number(createdAt),
  };
}

export async function listMarkets(): Promise<Market[]> {
  if (!contracts.launcher || !contracts.registry) return [];

  const client = getPublicClient();

  const logs = await client.getContractEvents({
    address: contracts.launcher,
    abi: launcherAbi,
    eventName: "LaunchCreated",
    fromBlock: contracts.launcherDeployBlock,
    toBlock: "latest",
  });

  const unique = [...new Map(logs.map((log) => [log.args.market!, log])).values()];
  const markets = await Promise.all(
    unique.map((log) => loadMarket(log.args.market! as Address))
  );

  return markets
    .filter((m): m is Market => m !== null)
    .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
}
