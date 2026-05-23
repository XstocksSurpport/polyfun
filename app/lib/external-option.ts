export const EXTERNAL_OPTION = {
  windowDays: 7,
  targetMultiplierBps: 20000,
  winnerFeeShareBps: 5000,
  externalSwapFeeBps: 30,
} as const;

export function calcTargetMcapUsd(currentMcapUsd: number): number {
  return (currentMcapUsd * EXTERNAL_OPTION.targetMultiplierBps) / 10000;
}

export function formatUsd(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toFixed(0)}`;
}
