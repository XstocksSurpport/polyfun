"use client";

import { useQuery } from "@tanstack/react-query";
import type { Market } from "@/lib/types";
import { calcYesEthProgressBps } from "@/lib/protocol";

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
    refetchInterval: (query) => (query.state.data?.configured ? 60_000 : false),
  });
}

export function useMarket(address: string) {
  return useQuery({
    queryKey: ["market", address],
    queryFn: async () => {
      const res = await fetch(`/api/markets?address=${address}`);
      const data = await res.json();
      if (res.status === 404) return { market: null, error: "NOT_FOUND" };
      if (!res.ok) return { market: null, error: data.error ?? "LOAD_FAILED" };
      return { market: parseMarket(data.market), error: undefined };
    },
    enabled: Boolean(address),
    refetchInterval: (query) => {
      const market = query.state.data?.market;
      if (!market || market.status !== "active") return 30_000;
      const ethProgress = calcYesEthProgressBps(market.yesValueWei);
      if (ethProgress >= 8500 || market.yesRatioBps >= 8500) return 5_000;
      return 30_000;
    },
  });
}

export function useMarketTrades(address: string) {
  return useQuery({
    queryKey: ["trades", address],
    queryFn: async () => {
      const res = await fetch(`/api/markets/${address}/trades`);
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
    refetchInterval: 30_000,
  });
}
