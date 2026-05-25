"use client";

import { useCallback, useEffect, useState } from "react";
import type { Address } from "viem";
import { readLivePoolState, type LivePoolState } from "@/lib/client/market-read";

/** Poll on-chain yesValue/noValue directly — bypasses API cache. */
export function useLivePool(marketAddress: string | undefined, enabled = true) {
  const [pool, setPool] = useState<LivePoolState | null>(null);

  const refetch = useCallback(async () => {
    if (!marketAddress) return null;
    try {
      const next = await readLivePoolState(marketAddress as Address);
      setPool(next);
      return next;
    } catch {
      return null;
    }
  }, [marketAddress]);

  useEffect(() => {
    if (!enabled || !marketAddress) {
      setPool(null);
      return;
    }
    void refetch();
    const id = window.setInterval(() => void refetch(), 3_000);
    return () => window.clearInterval(id);
  }, [marketAddress, enabled, refetch]);

  return { pool, refetch };
}
