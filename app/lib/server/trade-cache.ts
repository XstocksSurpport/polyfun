import "server-only";

import type { Trade } from "@/lib/types";

const TRADES_TTL_MS = 5_000;

const cache = new Map<string, { trades: Trade[]; at: number }>();
const inflight = new Map<string, Promise<Trade[]>>();

export function invalidateAllTrades() {
  cache.clear();
  inflight.clear();
}

export function invalidateTradesForAddress(address: string) {
  const key = address.toLowerCase();
  cache.delete(key);
  inflight.delete(key);
}

export async function getCachedTrades(
  address: string,
  fetcher: () => Promise<Trade[]>
): Promise<Trade[]> {
  const key = address.toLowerCase();
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TRADES_TTL_MS) {
    return hit.trades;
  }

  const pending = inflight.get(key);
  if (pending) return pending;

  const promise = fetcher()
    .then((trades) => {
      cache.set(key, { trades, at: Date.now() });
      inflight.delete(key);
      return trades;
    })
    .catch((err) => {
      inflight.delete(key);
      throw err;
    });

  inflight.set(key, promise);
  return promise;
}
