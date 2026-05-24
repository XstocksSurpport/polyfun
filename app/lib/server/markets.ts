import "server-only";

import { createPublicClient, http, type Address } from "viem";
import { base, baseSepolia } from "viem/chains";
import { CHAIN_ID, contracts, serverRpcUrl } from "../config";
import { isPlatformMarket } from "../platform";
import { registryAbi, marketAbi, erc20Abi, launcherAbi } from "../abis";
import { calcYesRatioBps, mapMarketStatus, formatMarketProposition } from "../market-utils";
import { mapMigrationAdapter } from "../dex";
import { getMetadataByHash } from "./metadata-index";
import { getContractEventsChunked } from "./log-range";
import { getCachedList, getCachedMarketLoad, invalidateMarketCaches } from "./market-cache";
import { invalidateAllTrades } from "./trade-cache";
import type { Market, TokenMetadata } from "../types";

const chain = CHAIN_ID === 8453 ? base : baseSepolia;

const ADDRESS_CACHE_TTL_MS = 60_000;
let knownMarketAddresses: Address[] = [];
let scannedThroughBlock: bigint | null = null;
let addressCacheAt = 0;

export function invalidateMarketDiscovery() {
  knownMarketAddresses = [];
  scannedThroughBlock = null;
  addressCacheAt = 0;
}

export function invalidateAllMarketData() {
  invalidateMarketDiscovery();
  invalidateMarketCaches();
  invalidateAllTrades();
}

export function getPublicClient() {
  return createPublicClient({
    chain,
    transport: http(serverRpcUrl, {
      batch: { wait: 20 },
    }),
  });
}

export async function fetchMetadataFromHash(hash: string): Promise<TokenMetadata | null> {
  if (!hash || hash === "0x" + "0".repeat(64)) return null;

  const indexed = getMetadataByHash(hash);
  if (indexed) {
    if (indexed.name && indexed.symbol) {
      return {
        name: indexed.name,
        symbol: indexed.symbol,
        description: indexed.description,
        proposition: indexed.proposition,
        image: indexed.image,
        twitter: indexed.twitter,
        telegram: indexed.telegram,
        website: indexed.website,
      };
    }

    if (indexed.uri) {
      try {
        const res = await fetch(indexed.uri, { next: { revalidate: 300 } });
        if (res.ok) return (await res.json()) as TokenMetadata;
      } catch {
        // fall through to inline fields
      }
    }

    return {
      name: indexed.name,
      symbol: indexed.symbol,
      description: indexed.description,
      proposition: indexed.proposition,
      image: indexed.image,
      twitter: indexed.twitter,
      telegram: indexed.telegram,
      website: indexed.website,
    };
  }

  const gateway = process.env.IPFS_GATEWAY ?? process.env.PINATA_GATEWAY ?? "https://ipfs.io/ipfs";
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

  const [isOfficial, record] = await client.multicall({
    contracts: [
      {
        address: contracts.registry,
        abi: registryAbi,
        functionName: "isOfficialMarket",
        args: [marketAddress],
      },
      {
        address: contracts.registry,
        abi: registryAbi,
        functionName: "markets",
        args: [marketAddress],
      },
    ],
    allowFailure: false,
  });

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
  let twitter: string | undefined;
  let telegram: string | undefined;
  let website: string | undefined;

  const metadata = await fetchMetadataFromHash(metadataHash as string);
  if (metadata) {
    name = metadata.name;
    symbol = metadata.symbol;
    imageUrl = metadata.image;
    twitter = metadata.twitter;
    telegram = metadata.telegram;
    website = metadata.website;
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

  proposition = formatMarketProposition(symbol);

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
    twitter,
    telegram,
    website,
    externalPool: pool,
    migrationAdapter,
    launchBlock,
    createdAt: Number(createdAt),
  };
}

async function discoverMarketAddresses(client: ReturnType<typeof getPublicClient>): Promise<Address[]> {
  const now = Date.now();
  const latest = await client.getBlockNumber();

  if (
    scannedThroughBlock !== null &&
    now - addressCacheAt < ADDRESS_CACHE_TTL_MS &&
    scannedThroughBlock >= latest
  ) {
    return knownMarketAddresses;
  }

  const fromBlock =
    scannedThroughBlock !== null ? scannedThroughBlock + 1n : contracts.launcherDeployBlock;

  if (fromBlock <= latest) {
    const logs = (await getContractEventsChunked({
      client,
      address: contracts.launcher!,
      abi: launcherAbi,
      eventName: "LaunchCreated",
      fromBlock,
      toBlock: latest,
    })) as Array<{ args: { market: Address } }>;

    const discovered = logs.map((log) => log.args.market);
    const seeds = [contracts.platformMarket].filter(Boolean) as Address[];
    knownMarketAddresses = [...new Set([...seeds, ...knownMarketAddresses, ...discovered])];
    scannedThroughBlock = latest;
  }

  addressCacheAt = now;
  return knownMarketAddresses;
}

async function fetchMarkets(): Promise<Market[]> {
  if (!contracts.launcher || !contracts.registry) return [];

  const client = getPublicClient();
  const addresses = await discoverMarketAddresses(client);
  const markets = await Promise.all(addresses.map((address) => loadMarket(address)));

  return markets
    .filter((m): m is Market => m !== null)
    .sort((a, b) => {
      const aPlatform = isPlatformMarket(a.address);
      const bPlatform = isPlatformMarket(b.address);
      if (aPlatform && !bPlatform) return -1;
      if (!aPlatform && bPlatform) return 1;
      return (b.createdAt ?? 0) - (a.createdAt ?? 0);
    });
}

export async function listMarkets(): Promise<Market[]> {
  return getCachedList(fetchMarkets);
}

export async function loadMarketCached(marketAddress: Address): Promise<Market | null> {
  return getCachedMarketLoad(marketAddress, () => loadMarket(marketAddress));
}
