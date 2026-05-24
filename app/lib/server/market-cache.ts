import "server-only";

import type { Market } from "@/lib/types";

const LIST_TTL_MS = 30_000;
const MARKET_TTL_MS = 15_000;

let listCache: { markets: Market[]; at: number } | null = null;
let listInflight: Promise<Market[]> | null = null;

const marketCache = new Map<string, { market: Market; at: number }>();
const marketInflight = new Map<string, Promise<Market | null>>();

export function getCachedMarket(address: string): Market | null {
  const hit = marketCache.get(address.toLowerCase());
  if (!hit || Date.now() - hit.at > MARKET_TTL_MS) return null;
  return hit.market;
}

export function setCachedMarket(market: Market) {
  marketCache.set(market.address.toLowerCase(), { market, at: Date.now() });
}

export async function getCachedList(fetcher: () => Promise<Market[]>): Promise<Market[]> {
  const now = Date.now();
  if (listCache && now - listCache.at < LIST_TTL_MS) {
    return listCache.markets;
  }

  if (!listInflight) {
    listInflight = fetcher()
      .then((markets) => {
        listCache = { markets, at: Date.now() };
        for (const market of markets) setCachedMarket(market);
        listInflight = null;
        return markets;
      })
      .catch((err) => {
        listInflight = null;
        throw err;
      });
  }

  return listInflight;
}

export function invalidateMarketCaches() {
  listCache = null;
  listInflight = null;
  marketCache.clear();
  marketInflight.clear();
}

export async function getCachedMarketLoad(
  address: string,
  fetcher: () => Promise<Market | null>
): Promise<Market | null> {
  const cached = getCachedMarket(address);
  if (cached) return cached;

  const key = address.toLowerCase();
  const inflight = marketInflight.get(key);
  if (inflight) return inflight;

  const promise = fetcher()
    .then((market) => {
      if (market) setCachedMarket(market);
      marketInflight.delete(key);
      return market;
    })
    .catch((err) => {
      marketInflight.delete(key);
      throw err;
    });

  marketInflight.set(key, promise);
  return promise;
}
