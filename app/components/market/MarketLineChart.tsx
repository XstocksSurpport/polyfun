"use client";

import { useMemo, useState } from "react";
import type { Trade } from "@/lib/types";
import { cn, formatMigrationPercent } from "@/lib/utils";
import { calcYesRatioBps } from "@/lib/market-utils";
import { calcMigrationProgressBps, MIGRATION } from "@/lib/protocol";
import {
  flatCandle,
  tradesToCandles,
  type Candle,
  type ChartTimeframe,
} from "@/lib/chart/candles";

interface MarketLineChartProps {
  trades?: Trade[];
  yesValueWei?: bigint;
  noValueWei?: bigint;
  className?: string;
  compact?: boolean;
}

function renderCandles(
  candles: Candle[],
  width: number,
  height: number,
  padX: number,
  padY: number
) {
  const chartW = width - padX * 2;
  const chartH = height - padY * 2;

  const highs = candles.map((c) => c.h);
  const lows = candles.map((c) => c.l);
  const minV = Math.min(...lows);
  const maxV = Math.max(...highs);
  const padding = Math.max(1.5, (maxV - minV) * 0.1);
  const minP = Math.max(0, minV - padding);
  const maxP = Math.min(100, maxV + padding);
  const range = maxP - minP || 1;

  const yFor = (v: number) => padY + chartH * (1 - (v - minP) / range);
  const slotW = chartW / candles.length;
  const bodyW = Math.max(2, slotW * 0.55);

  const elements = candles.map((c, i) => {
    const cx = padX + slotW * i + slotW / 2;
    const up = c.c >= c.o;
    const color = up ? "#16a34a" : "#dc2626";
    const top = yFor(Math.max(c.o, c.c));
    const bottom = yFor(Math.min(c.o, c.c));
    const bodyH = Math.max(1.5, bottom - top);
    const wickTop = yFor(c.h);
    const wickBottom = yFor(c.l);

    return (
      <g key={c.t}>
        <line
          x1={cx}
          y1={wickTop}
          x2={cx}
          y2={wickBottom}
          stroke={color}
          strokeWidth={1}
          opacity={0.85}
        />
        <rect
          x={cx - bodyW / 2}
          y={top}
          width={bodyW}
          height={bodyH}
          fill={color}
          rx={0.5}
          className={i === candles.length - 1 ? "animate-pulse-soft" : undefined}
        />
      </g>
    );
  });

  const last = candles[candles.length - 1];
  const prev = candles[candles.length - 2];
  const delta = last && prev ? last.c - prev.c : 0;

  return { elements, last, delta, minP, maxP, yFor, padX, chartW, chartH, padY };
}

export function MarketLineChart({
  trades = [],
  yesValueWei = 0n,
  noValueWei = 0n,
  className,
  compact = false,
}: MarketLineChartProps) {
  const [timeframe, setTimeframe] = useState<ChartTimeframe>("24h");

  const migrationBps = calcMigrationProgressBps(
    yesValueWei,
    noValueWei,
    calcYesRatioBps(yesValueWei, noValueWei)
  );

  const candles = useMemo(() => {
    if (trades.length === 0) {
      return flatCandle(yesValueWei, noValueWei, timeframe);
    }
    const built = tradesToCandles(trades, timeframe, yesValueWei, noValueWei);
    return built.length > 0 ? built : flatCandle(yesValueWei, noValueWei, timeframe);
  }, [trades, timeframe, yesValueWei, noValueWei]);

  const width = 320;
  const height = compact ? 88 : 132;
  const padX = 6;
  const padY = compact ? 8 : 12;

  const { elements, last, delta, minP, maxP, yFor, padX: px, chartW, chartH, padY: py } =
    renderCandles(candles, width, height, padX, padY);

  const thresholdY = yFor(MIGRATION.thresholdBps / 100);

  return (
    <div className={cn("rounded-xl border border-zinc-100 bg-white", compact ? "p-2" : "p-3", className)}>
      <div className={cn("flex items-center justify-between gap-2", compact ? "mb-1" : "mb-2")}>
        <div className="flex min-w-0 items-baseline gap-2">
          {!compact && (
            <p className="text-eyebrow tracking-wider text-zinc-400">Migration</p>
          )}
          <p className={cn("font-semibold tabular-nums text-zinc-950", compact ? "text-sm" : "text-base")}>
            {formatMigrationPercent(last ? Math.round(last.c * 100) : migrationBps)}
          </p>
          <p className={cn("tabular-nums text-zinc-400", compact ? "text-[10px]" : "text-[11px]")}>
            {delta === 0
              ? "+0.00%"
              : `${delta > 0 ? "+" : "-"}${formatMigrationPercent(Math.round(Math.abs(delta) * 100))}`}
          </p>
        </div>
        <div className="flex shrink-0 gap-0.5 rounded-md border border-zinc-200/60 bg-zinc-50 p-0.5">
          {(["1h", "4h", "24h"] as const).map((tf) => (
            <button
              key={tf}
              type="button"
              onClick={() => setTimeframe(tf)}
              className={cn(
                "rounded px-1.5 py-0.5 text-[9px] font-medium transition-all",
                timeframe === tf
                  ? "bg-zinc-950 text-white shadow-sm"
                  : "text-zinc-500 hover:text-zinc-900"
              )}
            >
              {tf.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className={cn("w-full", compact ? "h-[5.5rem]" : "h-[8.25rem]")}
        aria-label="Migration progress candlestick chart"
      >
        {[0.25, 0.5, 0.75].map((f) => {
          const y = py + chartH * f;
          return (
            <line key={f} x1={px} y1={y} x2={width - px} y2={y} stroke="#f4f4f5" strokeWidth={1} />
          );
        })}

        {thresholdY >= py && thresholdY <= py + chartH ? (
          <line
            x1={px}
            y1={thresholdY}
            x2={width - px}
            y2={thresholdY}
            stroke="#bbf7d0"
            strokeWidth={1}
            strokeDasharray="4 4"
          />
        ) : null}

        {elements}

        {!compact ? (
          <>
            <text x={px} y={py - 2} fill="#a1a1aa" fontSize={8} fontFamily="system-ui">
              {maxP.toFixed(0)}%
            </text>
            <text x={px} y={py + chartH + 10} fill="#a1a1aa" fontSize={8} fontFamily="system-ui">
              {minP.toFixed(0)}%
            </text>
          </>
        ) : null}
      </svg>
    </div>
  );
}
