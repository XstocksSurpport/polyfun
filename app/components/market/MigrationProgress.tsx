"use client";

import { cn, formatEth, formatPercent } from "@/lib/utils";
import { MIGRATION, calcYesEthProgressBps } from "@/lib/protocol";

interface MigrationProgressProps {
  yesRatioBps: number;
  yesValueWei: bigint;
  thresholdBps?: number;
  size?: "sm" | "lg";
  showLabels?: boolean;
}

export function MigrationProgress({
  yesRatioBps,
  yesValueWei,
  thresholdBps = MIGRATION.thresholdBps,
  size = "lg",
  showLabels = true,
}: MigrationProgressProps) {
  const ratioPercent = yesRatioBps / 100;
  const thresholdPercent = thresholdBps / 100;
  const ethProgressBps = calcYesEthProgressBps(yesValueWei);
  const ethPercent = ethProgressBps / 100;
  const inSqueezeZone = ratioPercent >= 85 && ratioPercent < thresholdPercent;

  return (
    <div className="w-full space-y-3">
      <div>
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
            style={{ width: `${Math.min(ratioPercent, 100)}%` }}
          />
          <div
            className="absolute inset-y-0 w-0.5 bg-neutral-900/30"
            style={{ left: `${thresholdPercent}%` }}
          />
        </div>
      </div>

      {showLabels && (
        <div>
          <div className="mb-1.5 flex items-end justify-between text-xs text-neutral-400">
            <span>YES ETH</span>
            <span className="tabular-nums">
              {formatEth(yesValueWei, 3)} / {formatEth(MIGRATION.yesTargetWei, 0)}
            </span>
          </div>
          <div
            className={cn(
              "relative w-full overflow-hidden rounded-full bg-neutral-100",
              size === "lg" ? "h-2" : "h-1"
            )}
          >
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-neutral-800 transition-all duration-500"
              style={{ width: `${Math.min(ethPercent, 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
