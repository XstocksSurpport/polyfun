import type { Trade } from "@/lib/types";
import { weiToEth } from "@/lib/market-utils";

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

function ratioAt(yesVol: number, noVol: number, fallbackRatioBps: number): number {
  const total = yesVol + noVol;
  return total > 0 ? (yesVol / total) * 100 : fallbackRatioBps / 100;
}

/** Build OHLC candles from on-chain YES/NO trades (YES share %). */
export function tradesToCandles(
  trades: Trade[],
  timeframe: ChartTimeframe,
  fallbackRatioBps: number
): Candle[] {
  const now = Math.floor(Date.now() / 1000);
  const windowSec = WINDOWS[timeframe];
  const bucketCount = BUCKET_COUNTS[timeframe];
  const bucketSec = windowSec / bucketCount;
  const start = now - windowSec;

  const sorted = [...trades].sort((a, b) => a.timestamp - b.timestamp);

  let yesVol = 0;
  let noVol = 0;
  for (const t of sorted) {
    if (t.timestamp >= start) break;
    if (t.side === "yes") yesVol += weiToEth(t.amountWei);
    else noVol += weiToEth(t.amountWei);
  }

  let cursor = start;
  const candles: Candle[] = [];

  for (let i = 0; i < bucketCount; i++) {
    const bucketEnd = cursor + bucketSec;
    const open = ratioAt(yesVol, noVol, fallbackRatioBps);
    let high = open;
    let low = open;
    let close = open;
    let volume = 0;

    for (const t of sorted) {
      if (t.timestamp < cursor || t.timestamp >= bucketEnd) continue;
      const amt = weiToEth(t.amountWei);
      if (t.side === "yes") yesVol += amt;
      else noVol += amt;
      volume += amt;
      close = ratioAt(yesVol, noVol, fallbackRatioBps);
      high = Math.max(high, close);
      low = Math.min(low, close);
    }

    candles.push({ t: cursor, o: open, h: high, l: low, c: close, volume });
    cursor = bucketEnd;
  }

  return candles;
}

/** Single flat candle when the market has no trades yet. */
export function flatCandle(ratioBps: number, timeframe: ChartTimeframe): Candle[] {
  const now = Math.floor(Date.now() / 1000);
  const v = ratioBps / 100;
  const candles = tradesToCandles([], timeframe, ratioBps);
  if (candles.length === 0) {
    return [{ t: now - WINDOWS[timeframe], o: v, h: v, l: v, c: v, volume: 0 }];
  }
  return candles.map((c, i) =>
    i === candles.length - 1 ? { ...c, o: v, h: v, l: v, c: v } : c
  );
}
