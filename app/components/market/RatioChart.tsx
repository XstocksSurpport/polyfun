"use client";

import type { Trade } from "@/lib/types";
import { weiToEth } from "@/lib/market-utils";

interface RatioChartProps {
  trades: Trade[];
}

export function RatioChart({ trades }: RatioChartProps) {
  if (trades.length === 0) return null;

  const sorted = [...trades].sort((a, b) => a.timestamp - b.timestamp);
  let yesVol = 0;
  let noVol = 0;
  const points = sorted.map((t) => {
    if (t.side === "yes") yesVol += weiToEth(t.amountWei);
    else noVol += weiToEth(t.amountWei);
    const total = yesVol + noVol;
    return total > 0 ? (yesVol / total) * 100 : 0;
  });

  const width = 100;
  const height = 48;
  const path = points
    .map((p, i) => {
      const x = (i / Math.max(points.length - 1, 1)) * width;
      const y = height - (p / 100) * height;
      return `${i === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");

  return (
    <div className="rounded-xl border border-neutral-100 p-4">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-24 w-full" preserveAspectRatio="none">
        <line
          x1="0"
          y1={height - (90 / 100) * height}
          x2={width}
          y2={height - (90 / 100) * height}
          stroke="#e5e5e5"
          strokeWidth="0.5"
          strokeDasharray="2 2"
        />
        <path d={path} fill="none" stroke="#059669" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </div>
  );
}
