import type { MarketStatus } from "./types";

/** On-chain enum: Active=0, Migrated=1, SettledNo=2 */
export function mapMarketStatus(code: number): MarketStatus {
  switch (code) {
    case 0:
      return "active";
    case 1:
      return "migrated";
    case 2:
      return "failed";
    default:
      return "failed";
  }
}

export function isMarketExpired(expiryTs: number, nowSec = Date.now() / 1000): boolean {
  return nowSec >= expiryTs;
}

export function canTradeMarket(market: { status: MarketStatus; expiryTs: number }): boolean {
  return market.status === "active" && !isMarketExpired(market.expiryTs);
}

export function calcYesRatioBps(yesValue: bigint, noValue: bigint): number {
  const total = yesValue + noValue;
  if (total === 0n) return 0;
  return Number((yesValue * 10000n) / total);
}

export function weiToEth(wei: bigint): number {
  return Number(wei) / 1e18;
}

/** Parse ETH amount without float drift (max 18 decimals). */
export function ethToWei(eth: number): bigint {
  if (!Number.isFinite(eth) || eth <= 0) return 0n;
  const raw = eth.toFixed(18);
  const [whole, frac = ""] = raw.split(".");
  const weiFrac = (frac + "0".repeat(18)).slice(0, 18);
  const combined = `${whole}${weiFrac}`.replace(/^0+(?=\d)/, "");
  return combined ? BigInt(combined) : 0n;
}

/** Canonical market question — only `$SYMBOL` varies. */
export function formatMarketProposition(symbol: string): string {
  const normalized = symbol.replace(/^\$/, "").trim().toUpperCase();
  return `Will $${normalized} migrate to Uniswap (YES ≥ 90% + 4 ETH) before expiry?`;
}
