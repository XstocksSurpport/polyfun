import type { MarketStatus } from "./types";

export function mapMarketStatus(code: number): MarketStatus {
  switch (code) {
    case 0:
      return "active";
    case 1:
      return "settling";
    case 2:
      return "migrated";
    case 3:
      return "failed";
    case 4:
      return "cancelled";
    default:
      return "failed";
  }
}

export function calcYesRatioBps(yesValue: bigint, noValue: bigint): number {
  const total = yesValue + noValue;
  if (total === 0n) return 0;
  return Number((yesValue * 10000n) / total);
}

export function weiToEth(wei: bigint): number {
  return Number(wei) / 1e18;
}

export function ethToWei(eth: number): bigint {
  return BigInt(Math.round(eth * 1e18));
}
