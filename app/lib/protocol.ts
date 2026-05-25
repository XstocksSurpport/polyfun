export const MARKET_DURATION_HOURS = 48;

export const FEE_RECEIVER = "0xFDC18444eca2FEfd44fA7516Ff994aAfC17C4fD5" as const;

export const TOKEN_SUPPLY = {
  total: 1_000_000_000n * 10n ** 18n,
  internal: 800_000_000n * 10n ** 18n,
  externalLp: 200_000_000n * 10n ** 18n,
  internalBps: 8000,
  externalLpBps: 2000,
} as const;

export const MIGRATION = {
  thresholdBps: 9000,
  yesTargetWei: 4n * 10n ** 18n,
  totalPoolAtTriggerWei: 4440000000000000000n,
} as const;

export const FEES = {
  deployWei: 5n * 10n ** 14n,
  tradingBps: 100,
  migrationWei: 10n ** 17n,
  migrationBpsAlt: 250,
  settlementBps: 200,
} as const;

export function calcYesEthProgressBps(yesValueWei: bigint): number {
  if (MIGRATION.yesTargetWei === 0n) return 0;
  const bps = (yesValueWei * 10000n) / MIGRATION.yesTargetWei;
  return Number(bps > 10000n ? 10000n : bps);
}

/** Migration needs BOTH ≥90% YES ratio AND ≥4 ETH YES pool — progress is the lower of the two. */
export function calcMigrationProgressBps(yesValueWei: bigint, noValueWei: bigint, yesRatioBps: number): number {
  const ethBps = calcYesEthProgressBps(yesValueWei);
  return Math.min(ethBps, yesRatioBps);
}

export function formatSupplyMillions(wei: bigint): string {
  return `${Number(wei / 10n ** 18n / 1_000_000n)}M`;
}
