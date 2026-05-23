"use client";

import type { Trade } from "@/lib/types";
import { formatEth, truncateAddress } from "@/lib/utils";
import { EmptyBlock } from "@/components/ui/State";

interface TradeTabsProps {
  proposition: string;
  creator: string;
  trades: Trade[];
  tradesLoading?: boolean;
  tradesError?: string;
}

export function TradeTabs({
  proposition,
  creator,
  trades,
  tradesLoading,
  tradesError,
}: TradeTabsProps) {
  return (
    <div className="rounded-xl border border-neutral-100 p-4">
      {tradesLoading && <p className="text-xs text-neutral-300">...</p>}
      {tradesError && <p className="text-xs text-no">{tradesError}</p>}
      {!tradesLoading && !tradesError && trades.length === 0 && <EmptyBlock />}
      {trades.length > 0 && (
        <ul className="divide-y divide-neutral-50">
          {trades.slice(0, 20).map((trade) => (
            <li key={trade.id} className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <span
                  className={`text-xs font-medium uppercase ${
                    trade.side === "yes" ? "text-yes" : "text-no"
                  }`}
                >
                  {trade.side}
                </span>
                <span className="text-sm tabular-nums text-neutral-600">
                  {formatEth(trade.amountWei, 4)}
                </span>
              </div>
              <span className="text-xs text-neutral-400">{truncateAddress(trade.buyer)}</span>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-4 border-t border-neutral-50 pt-4 text-sm text-neutral-600">
        {proposition || "—"}
      </div>
      <p className="mt-2 font-mono text-xs text-neutral-400">{creator}</p>
    </div>
  );
}
