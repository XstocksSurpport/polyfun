"use client";

import { useQuery } from "@tanstack/react-query";
import type { Market } from "@/lib/types";

function parseMarket(raw: Record<string, unknown>): Market {
  return {
    ...(raw as Omit<Market, "yesValueWei" | "noValueWei">),
    yesValueWei: BigInt(raw.yesValueWei as string),
    noValueWei: BigInt(raw.noValueWei as string),
  };
}

export function useMarkets() {
  return useQuery({
    queryKey: ["markets"],
    queryFn: async () => {
      const res = await fetch("/api/markets");
      const data = await res.json();
      if (!res.ok && res.status !== 503) throw new Error(data.error ?? "LOAD_FAILED");
      return {
        markets: (data.markets ?? []).map(parseMarket) as Market[],
        error: data.error as string | undefined,
        configured: res.status !== 503,
      };
    },
    refetchInterval: (query) => (query.state.data?.configured ? 30_000 : false),
    refetchOnWindowFocus: true,
  });
}

export function useMarket(address: string, options?: { live?: boolean }) {
  const live = options?.live ?? false;
  return useQuery({
    queryKey: ["market", address],
    queryFn: async () => {
      const res = await fetch(`/api/markets?address=${address}`, { cache: "no-store" });
      const data = await res.json();
      if (res.status === 404) return { market: null, error: "NOT_FOUND" };
      if (!res.ok) return { market: null, error: data.error ?? "LOAD_FAILED" };
      return { market: parseMarket(data.market), error: undefined };
    },
    enabled: Boolean(address),
    placeholderData: (prev) => prev,
    refetchInterval: (query) => {
      const market = query.state.data?.market;
      if (!market || market.status !== "active") return live ? 15_000 : 30_000;
      return live ? 12_000 : 30_000;
    },
    refetchOnWindowFocus: true,
  });
}

export function useMarketTrades(address: string, options?: { live?: boolean }) {
  const live = options?.live ?? true;
  return useQuery({
    queryKey: ["trades", address],
    queryFn: async () => {
      const res = await fetch(`/api/markets/${address}/trades`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) return { trades: [], error: data.error as string | undefined };
      return {
        trades: (data.trades ?? []).map((t: Record<string, unknown>) => ({
          ...t,
          amountWei: BigInt(t.amountWei as string),
          shares: BigInt(t.shares as string),
          blockNumber: BigInt(t.blockNumber as string),
        })),
        error: undefined,
      };
    },
    enabled: Boolean(address),
    refetchInterval: live ? 5_000 : 30_000,
    refetchOnWindowFocus: live,
  });
}
