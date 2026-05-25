import type { Trade } from "@/lib/types";
import { calcYesRatioBps } from "@/lib/market-utils";
import { calcMigrationProgressBps } from "@/lib/protocol";

export type ChartTimeframe = "1h" | "4h" | "24h";

export type Candle = {
  t: number;
  o: number;
  h: number;
  l: number;
  c: number;
  volume: number;
};

const WINDOWS: Record<ChartTimeframe, number> = {
  "1h": 3600,
  "4h": 4 * 3600,
  "24h": 24 * 3600,
};

const BUCKET_COUNTS: Record<ChartTimeframe, number> = {
  "1h": 24,
  "4h": 32,
  "24h": 48,
};

function migrationPercent(yesValueWei: bigint, noValueWei: bigint): number {
  const ratioBps = calcYesRatioBps(yesValueWei, noValueWei);
  return calcMigrationProgressBps(yesValueWei, noValueWei, ratioBps) / 100;
}

/** Derive pool state before the first trade in `sorted` given current on-chain totals. */
function baselineFromTrades(sorted: Trade[], currentYesWei: bigint, currentNoWei: bigint) {
  let yes = currentYesWei;
  let no = currentNoWei;
  for (const t of sorted) {
    if (t.side === "yes") yes -= t.shares;
    else no -= t.shares;
  }
  return { yes: yes > 0n ? yes : 0n, no: no > 0n ? no : 0n };
}

/** Build OHLC candles — migration progress = min(YES ratio, YES ETH toward 4 ETH). */
export function tradesToCandles(
  trades: Trade[],
  timeframe: ChartTimeframe,
  currentYesWei: bigint,
  currentNoWei: bigint
): Candle[] {
  const now = Math.floor(Date.now() / 1000);
  const windowSec = WINDOWS[timeframe];
  const bucketCount = BUCKET_COUNTS[timeframe];
  const bucketSec = windowSec / bucketCount;
  const start = now - windowSec;

  const sorted = [...trades].sort((a, b) => a.timestamp - b.timestamp);
  const baseline = baselineFromTrades(sorted, currentYesWei, currentNoWei);

  let yesValueWei = baseline.yes;
  let noValueWei = baseline.no;

  for (const t of sorted) {
    if (t.timestamp >= start) break;
    if (t.side === "yes") yesValueWei += t.shares;
    else noValueWei += t.shares;
  }

  let cursor = start;
  const candles: Candle[] = [];

  for (let i = 0; i < bucketCount; i++) {
    const bucketEnd = cursor + bucketSec;
    const open = migrationPercent(yesValueWei, noValueWei);
    let high = open;
    let low = open;
    let close = open;
    let volume = 0;

    for (const t of sorted) {
      if (t.timestamp < cursor || t.timestamp >= bucketEnd) continue;
      if (t.side === "yes") yesValueWei += t.shares;
      else noValueWei += t.shares;
      volume += Number(t.shares) / 1e18;
      close = migrationPercent(yesValueWei, noValueWei);
      high = Math.max(high, close);
      low = Math.min(low, close);
    }

    candles.push({ t: cursor, o: open, h: high, l: low, c: close, volume });
    cursor = bucketEnd;
  }

  return candles;
}

export function flatCandle(
  yesValueWei: bigint,
  noValueWei: bigint,
  timeframe: ChartTimeframe
): Candle[] {
  const v = migrationPercent(yesValueWei, noValueWei);
  const now = Math.floor(Date.now() / 1000);
  const bucketCount = BUCKET_COUNTS[timeframe];
  const bucketSec = WINDOWS[timeframe] / bucketCount;
  const start = now - WINDOWS[timeframe];

  return Array.from({ length: bucketCount }, (_, i) => ({
    t: start + i * bucketSec,
    o: v,
    h: v,
    l: v,
    c: v,
    volume: 0,
  }));
}
