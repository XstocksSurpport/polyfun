"use client";

import { cn, formatPercent } from "@/lib/utils";

interface ProgressBarProps {
  yesRatioBps: number;
  thresholdBps?: number;
  size?: "sm" | "lg";
  showLabels?: boolean;
}

export function ProgressBar({
  yesRatioBps,
  thresholdBps = 9000,
  size = "lg",
  showLabels = true,
}: ProgressBarProps) {
  const percent = yesRatioBps / 100;
  const thresholdPercent = thresholdBps / 100;
  const inSqueezeZone = percent >= 85 && percent < thresholdPercent;

  return (
    <div className="w-full">
      {showLabels && (
        <div className="mb-2 flex items-end justify-between">
          <span className="text-2xl font-semibold tabular-nums text-yes sm:text-3xl">
            YES {formatPercent(yesRatioBps)}
          </span>
          <span className="text-sm tabular-nums text-neutral-400">{thresholdPercent}%</span>
        </div>
      )}
      <div
        className={cn(
          "relative w-full overflow-hidden rounded-full bg-neutral-100",
          size === "lg" ? "h-3" : "h-1.5"
        )}
      >
        <div
          className={cn(
            "absolute inset-y-0 left-0 rounded-full bg-yes transition-all duration-500",
            inSqueezeZone && "animate-pulse-soft"
          )}
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
        <div
          className="absolute inset-y-0 w-0.5 bg-neutral-900/30"
          style={{ left: `${thresholdPercent}%` }}
        />
      </div>
    </div>
  );
}
