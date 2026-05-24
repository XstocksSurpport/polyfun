import "server-only";

import type { Address } from "viem";
import { CHAIN_ID } from "../config";
import { EXTERNAL_OPTION, calcTargetMcapUsd } from "../external-option";
import { loadMarket } from "./markets";

export interface ExternalOptionState {
  market: Address;
  token: Address;
  externalPool: Address;
  windowDays: number;
  targetMultiplierBps: number;
  roundEndsAt: number | null;
  currentMcapUsd: number | null;
  targetMcapUsd: number | null;
  rewardPoolUsd: number | null;
  upPoolWei: string;
  downPoolWei: string;
  configured: boolean;
}

const chainSlug = CHAIN_ID === 8453 ? "base" : "basesepolia";

async function fetchPairMcapUsd(pool: Address): Promise<number | null> {
  try {
    const res = await fetch(`https://api.dexscreener.com/latest/dex/pairs/${chainSlug}/${pool}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      pairs?: Array<{ fdv?: number; marketCap?: number }>;
    };
    const pair = data.pairs?.[0];
    if (!pair) return null;
    return pair.marketCap ?? pair.fdv ?? null;
  } catch {
    return null;
  }
}

export async function loadExternalOptionState(marketAddress: Address): Promise<ExternalOptionState | null> {
  const market = await loadMarket(marketAddress);
  if (!market || market.status !== "migrated" || !market.externalPool) return null;

  const currentMcapUsd = await fetchPairMcapUsd(market.externalPool);
  const targetMcapUsd = currentMcapUsd ? calcTargetMcapUsd(currentMcapUsd) : null;

  const migratedAt = market.createdAt ?? 0;
  const roundEndsAt =
    migratedAt > 0
      ? migratedAt + EXTERNAL_OPTION.windowDays * 86400
      : null;

  return {
    market: market.address,
    token: market.token,
    externalPool: market.externalPool,
    windowDays: EXTERNAL_OPTION.windowDays,
    targetMultiplierBps: EXTERNAL_OPTION.targetMultiplierBps,
    roundEndsAt,
    currentMcapUsd,
    targetMcapUsd,
    rewardPoolUsd: null,
    upPoolWei: "0",
    downPoolWei: "0",
    configured: false,
  };
}
