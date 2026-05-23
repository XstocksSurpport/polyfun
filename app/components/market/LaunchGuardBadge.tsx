"use client";

import { useEffect, useState } from "react";
import { JsonRpcProvider } from "ethers";
import type { Market } from "@/lib/types";
import { CHAIN_ID, rpcUrl } from "@/lib/config";
import { isLaunchGuardActive, launchProtection } from "@/lib/dex";
import { Badge } from "@/components/ui/Badge";

export function LaunchGuardBadge({ market }: { market: Market }) {
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (market.status !== "migrated" || !market.launchBlock) {
      setActive(false);
      return;
    }

    let cancelled = false;
    const provider = new JsonRpcProvider(rpcUrl, CHAIN_ID);
    provider.getBlockNumber().then((block) => {
      if (!cancelled) {
        setActive(isLaunchGuardActive(market.launchBlock, block));
      }
    });

    return () => {
      cancelled = true;
    };
  }, [market.status, market.launchBlock]);

  if (!active) return null;

  return <Badge variant="outline">GUARD · {launchProtection.guardBlocks}b</Badge>;
}
