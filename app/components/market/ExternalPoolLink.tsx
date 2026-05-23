import { dexscreenerPoolUrl, migrationAdapterLabel } from "@/lib/dex";
import type { Market } from "@/lib/types";

interface ExternalPoolLinkProps {
  market: Market;
  className?: string;
}

export function ExternalPoolLink({ market, className }: ExternalPoolLinkProps) {
  if (!market.externalPool) return null;

  const dex = market.migrationAdapter
    ? migrationAdapterLabel(market.migrationAdapter)
    : "Pool";

  return (
    <a
      href={dexscreenerPoolUrl(market.externalPool)}
      target="_blank"
      rel="noreferrer"
      className={`font-mono text-xs text-yes underline ${className ?? ""}`}
    >
      {dex} · {market.externalPool.slice(0, 6)}...{market.externalPool.slice(-4)}
    </a>
  );
}
