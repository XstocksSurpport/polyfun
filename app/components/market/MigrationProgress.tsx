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

  return (
    <div className="w-full space-y-4">
      <div>
        {showLabels && (
          <div className="mb-2 flex items-end justify-between">
            <span className="text-2xl font-semibold tabular-nums text-yes sm:text-3xl">
              YES {formatPercent(yesRatioBps)}
            </span>
            <span className="text-sm tabular-nums text-zinc-500">{thresholdPercent}% target</span>
          </div>
        )}
        <div className={cn("relative w-full overflow-hidden rounded-full bg-white/[0.06]", size === "lg" ? "h-2.5" : "h-1.5")}>
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-[#b8ff3c]"
            style={{ width: `${Math.min(ratioPercent, 100)}%` }}
          />
          <div
            className="absolute inset-y-0 w-0.5 bg-white/30"
            style={{ left: `${thresholdPercent}%` }}
          />
        </div>
      </div>

      {showLabels && (
        <div>
          <div className="mb-1.5 flex items-end justify-between text-xs text-zinc-500">
            <span>YES ETH</span>
            <span className="tabular-nums text-zinc-300">
              {formatEth(yesValueWei, 3)} / {formatEth(MIGRATION.yesTargetWei, 0)}
            </span>
          </div>
          <div
            className={cn(
              "relative w-full overflow-hidden rounded-full bg-white/[0.06]",
              size === "lg" ? "h-2" : "h-1"
            )}
          >
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-zinc-400"
              style={{ width: `${Math.min(ethPercent, 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
