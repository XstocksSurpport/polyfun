"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Address } from "viem";
import { readLivePoolState, type LivePoolState } from "@/lib/client/market-read";

const FAST_POLL_MS = 3_000;
const SLOW_POLL_MS = 15_000;
const SLOW_AFTER_FAILURES = 3;

/** Poll on-chain yesValue/noValue directly — bypasses API cache. */
export function useLivePool(marketAddress: string | undefined, enabled = true) {
  const [pool, setPool] = useState<LivePoolState | null>(null);
  const [stale, setStale] = useState(false);
  const failuresRef = useRef(0);

  const refetch = useCallback(async () => {
    if (!marketAddress) return null;
    try {
      const next = await readLivePoolState(marketAddress as Address);
      failuresRef.current = 0;
      setStale(false);
      setPool(next);
      return next;
    } catch {
      failuresRef.current += 1;
      setStale(true);
      return null;
    }
  }, [marketAddress]);

  useEffect(() => {
    if (!enabled || !marketAddress) {
      setPool(null);
      setStale(false);
      failuresRef.current = 0;
      return;
    }

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const tick = async () => {
      await refetch();
      if (cancelled) return;
      const delay =
        failuresRef.current >= SLOW_AFTER_FAILURES ? SLOW_POLL_MS : FAST_POLL_MS;
      timer = setTimeout(tick, delay);
    };

    void tick();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [marketAddress, enabled, refetch]);

  return { pool, stale, refetch };
}
