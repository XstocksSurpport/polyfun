import Link from "next/link";
import type { Market } from "@/lib/types";
import { formatEth, formatPercent } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { PpppBadge } from "@/components/ui/PpppBadge";
import { ExternalPoolLink } from "@/components/market/ExternalPoolLink";
import { MigrationProgress } from "./MigrationProgress";
import { Countdown } from "./Countdown";

interface MarketCardProps {
  market: Market;
}

const statusLabel: Record<
  Market["status"],
  { text: string; variant: "default" | "yes" | "no" | "outline" }
> = {
  active: { text: "Live", variant: "yes" },
  settling: { text: "Settle", variant: "outline" },
  migrated: { text: "Migrated", variant: "default" },
  failed: { text: "Failed", variant: "no" },
  cancelled: { text: "Off", variant: "no" },
};

export function MarketCard({ market }: MarketCardProps) {
  const status = statusLabel[market.status];
  const totalPool = market.yesValueWei + market.noValueWei;

  return (
    <Link
      href={`/market/${market.address}`}
      className="glass-panel block p-5 transition-all duration-300 hover:shadow-[0_20px_56px_rgba(0,0,0,0.08)]"
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          {market.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={market.imageUrl} alt="" className="h-10 w-10 shrink-0 rounded-lg bg-neutral-50" />
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-neutral-900">${market.symbol}</span>
              <Badge variant={status.variant}>{status.text}</Badge>
            </div>
            <p className="truncate text-sm text-neutral-500">{market.name}</p>
          </div>
        </div>
        {market.status === "active" && <Countdown expiryTs={market.expiryTs} compact />}
      </div>

      {market.status === "active" || market.status === "settling" ? (
        <MigrationProgress
          yesRatioBps={market.yesRatioBps}
          yesValueWei={market.yesValueWei}
          thresholdBps={market.thresholdBps}
          size="sm"
          showLabels={false}
        />
      ) : (
        <div className="h-1.5 rounded-full bg-neutral-100">
          <div
            className={`h-full rounded-full ${market.status === "migrated" ? "bg-yes" : "bg-neutral-300"}`}
            style={{ width: `${market.yesRatioBps / 100}%` }}
          />
        </div>
      )}

      <div className="mt-4 flex items-center justify-between text-xs text-neutral-400">
        <span>YES {formatPercent(market.yesRatioBps)}</span>
        <span>{formatEth(totalPool, 3)}</span>
      </div>

      <div className="mt-3 border-t border-neutral-50 pt-3 space-y-2">
        <PpppBadge address={market.token} />
        {market.status === "migrated" && market.externalPool && (
          <ExternalPoolLink market={market} />
        )}
      </div>
    </Link>
  );
}
